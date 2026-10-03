import { z } from 'zod';
import 'dotenv/config';

const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required by the backend'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required by the backend'),
  OPENROUTER_API_KEY: z.string().optional().default(''),
  OPENROUTER_MODEL: z.string().default('nvidia/nemotron-4-340b-instruct'),
  ALLOWED_ORIGINS: z.string().optional().default(''),
  AI_SERVICE_URL: z.string().url().default('http://127.0.0.1:8000'),
  AI_SERVICE_SHARED_SECRET: z.string().default('development-ai-secret-change-in-production'),
  AI_SERVICE_TIMEOUT_MS: z.coerce.number().default(20000),
});

function parseEnv(): z.infer<typeof ServerEnvSchema> {
  const result = ServerEnvSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => ` - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    console.error(`\x1b[31m[CONFIG ERROR] Invalid backend environment variables:\n${issues}\x1b[0m`);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Invalid environment configuration:\n${issues}`);
    }
  }
  return result.success ? result.data : (process.env as any);
}

export const env = parseEnv();
