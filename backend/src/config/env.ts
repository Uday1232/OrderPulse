import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5001').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:3001'),
  LOG_LEVEL: z.string().default('info'),
  JWT_SECRET: z.string().default('storepulse-super-secret-jwt-key-2026'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().default('https://orderpulse-frontend-three.vercel.app'),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().optional().default('465').transform((val) => (val ? parseInt(val, 10) : 465)),
  SMTP_USER: z.string().default('udaybadhe2004@gmail.com'),
  SMTP_PASS: z.string().default('oswthafqhklgrfsl'),
  SMTP_FROM: z.string().default('OrderPulse <udaybadhe2004@gmail.com>'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
