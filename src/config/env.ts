import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_VERSION: z.string().default('v1'),
  FRONTEND_ORIGIN: z.string().default('http://localhost:3000'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_STORAGE_BUCKET: z.string().default('resumes'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_DAYS: z.coerce.number().int().positive().default(30),
  AI_SERVICE_URL: z.string().url().default('http://localhost:8000').transform(url => url.replace(/\/$/, '')),
  AI_SERVICE_API_KEY: z.string().min(1).default('local-dev-ai-service-key'),
  DIAGNOSTICS_API_KEY: z.string().min(16).optional()
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
