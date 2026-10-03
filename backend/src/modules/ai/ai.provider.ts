import crypto from 'crypto';
import { ProjectRiskAnalysis, ProjectRiskAnalysisSchema } from './ai.schemas.js';
import { sanitizeAiContext } from './ai.context.js';
import { env } from '../../core/config/env.js';
import { AppError } from '../../core/http/errors.js';

export interface LLMProvider {
  readonly name: string;
  analyzeProject(prompt: string, context: Record<string, unknown>): Promise<ProjectRiskAnalysis>;
}

export class OpenRouterProvider implements LLMProvider {
  readonly name = 'OpenRouter (Nemotron)';
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = env.OPENROUTER_API_KEY || '';
    this.model = env.OPENROUTER_MODEL || 'nvidia/nemotron-4-340b-instruct';
  }

  async analyzeProject(prompt: string, context: Record<string, unknown>): Promise<ProjectRiskAnalysis> {
    const cleanContext = sanitizeAiContext(context);

    if (!this.apiKey) {
      throw new AppError('AI_ANALYSIS_UNAVAILABLE: OPENROUTER_API_KEY is not configured on this server', 503, 'AI_UNAVAILABLE');
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

    let attempts = 0;
    const maxAttempts = 2;
    let lastError: Error | null = null;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://nirikshak.gov.in',
            'X-Title': 'NIRIKSHAK Infrastructure Audit',
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2,
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenRouter HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const rawContent = data.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(rawContent);
        const validated = ProjectRiskAnalysisSchema.parse(parsed);

        const latency = Date.now() - startTime;
        console.info(`[AI_LOG] provider=OpenRouter model=${this.model} latency=${latency}ms tokens=${data.usage?.total_tokens ?? 0} status=SUCCESS promptHash=${promptHash}`);

        return validated;
      } catch (err: any) {
        lastError = err;
        console.warn(`[AI_LOG] Attempt ${attempts} failed: ${err.message}. promptHash=${promptHash}`);
      }
    }

    const latency = Date.now() - startTime;
    console.error(`[AI_LOG] provider=OpenRouter model=${this.model} latency=${latency}ms status=FAILED promptHash=${promptHash} error=${lastError?.message}`);
    throw new AppError(`AI_ANALYSIS_FAILED: Provider output failed schema validation: ${lastError?.message}`, 502, 'AI_ERROR');
  }
}

export function getLLMProvider(): LLMProvider {
  return new OpenRouterProvider();
}
