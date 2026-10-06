import crypto from 'crypto';
import { ProjectRiskAnalysis, ProjectRiskAnalysisSchema } from '../validation/schemas.js';

export interface LLMProvider {
  readonly name: string;
  analyzeProject(prompt: string, context: Record<string, unknown>): Promise<ProjectRiskAnalysis>;
}

/**
 * Recursive context sanitizer (Rules 59, 60).
 * Strips secrets, tokens, PII (email, phone, aadhaar), competitor bids, and internal notes.
 */
export function sanitizeContext(data: any): any {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // Redact JWTs
    let scrubbed = data.replace(/\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g, '[REDACTED_TOKEN]');
    // Redact Emails
    scrubbed = scrubbed.replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, '[REDACTED_EMAIL]');
    // Redact 12-digit Aadhaar / 10-digit Phone numbers
    scrubbed = scrubbed.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[REDACTED_AADHAAR]');
    scrubbed = scrubbed.replace(/\b[6-9]\d{9}\b/g, '[REDACTED_PHONE]');
    return scrubbed;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeContext(item));
  }

  if (typeof data === 'object') {
    const prohibitedKeys = [
      'password',
      'token',
      'jwt',
      'secret',
      'service_role',
      'api_key',
      'aadhaar',
      'phone',
      'mobile',
      'email',
      'address',
      'bid_amount',
      'technical_proposal',
      'internal_notes',
      'reviewer_notes',
      'complainant_phone',
      'complainant_email',
      'citizen_phone',
      'citizen_email',
    ];

    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (prohibitedKeys.some((p) => lowerKey.includes(p))) {
        continue; // Omit prohibited property entirely
      }
      cleanObj[key] = sanitizeContext(value);
    }
    return cleanObj;
  }

  return data;
}

export class OpenRouterProvider implements LLMProvider {
  readonly name = 'Google Gemini 3.1 Pro';
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.model = process.env.GEMINI_MODEL || 'gemini-3.1-pro-preview';
  }

  async analyzeProject(prompt: string, context: Record<string, unknown>): Promise<ProjectRiskAnalysis> {
    const cleanContext = sanitizeContext(context);

    // Rule 62: Never return fabricated insight when API key or provider is unavailable
    if (!this.apiKey) {
      throw new Error('AI_ANALYSIS_UNAVAILABLE: GEMINI_API_KEY is not configured on this server');
    }

    const systemPrompt = `You are NIRIKSHAK AI, an infrastructure project analysis assistant.
Use only supplied evidence.
Distinguish:
- contractor-reported information
- government-verified information
- external observations
- AI inference.
Do not invent missing values.
If evidence is insufficient return UNKNOWN.
AI does not approve projects.
AI does not select contractors.
AI does not determine official progress.
AI does not declare legal violations.
Return structured JSON only matching the schema:
{
  "risk_score": number (0-100),
  "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "summary": string,
  "schedule": { "risk": string, "reasons": string[] },
  "finance": { "risk": string, "reasons": string[] },
  "environment": { "risk": string, "reasons": string[] },
  "evidence": string[],
  "recommended_actions": string[]
}
Respond with VALID JSON ONLY. No markdown fences, no conversational prose.`;

    const userPrompt = `${prompt}\n\nProject Context:\n${JSON.stringify(cleanContext, null, 2)}`;
    const promptHash = crypto.createHash('sha256').update(userPrompt).digest('hex').slice(0, 16);
    const startTime = Date.now();

    // Rule 63: Validate structured response using Zod. On invalid output retry once, then FAILED.
    let attempts = 0;
    const maxAttempts = 2;
    let lastError: Error | null = null;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
          }),
        });

        if (!response.ok) {
          throw new Error(`Gemini HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const parsed = JSON.parse(rawContent);
        const validated = ProjectRiskAnalysisSchema.parse(parsed);

        const latency = Date.now() - startTime;
        // Rule 64: Log only metadata, never raw sensitive prompts
        console.info(`[AI_LOG] provider=Google Gemini model=${this.model} latency=${latency}ms status=SUCCESS promptHash=${promptHash}`);

        return validated;
      } catch (err: any) {
        lastError = err;
        console.warn(`[AI_LOG] Attempt ${attempts} failed: ${err.message}. promptHash=${promptHash}`);
      }
    }

    const latency = Date.now() - startTime;
    console.error(`[AI_LOG] provider=Google Gemini model=${this.model} latency=${latency}ms status=FAILED promptHash=${promptHash} error=${lastError?.message}`);
    throw new Error(`AI_ANALYSIS_FAILED: Provider output failed schema validation: ${lastError?.message}`);
  }
}

export function getLLMProvider(): LLMProvider {
  return new OpenRouterProvider();
}
