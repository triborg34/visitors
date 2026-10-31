import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

const candidates = [
  process.env.DOTENV_CONFIG_PATH,
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
  '/etc/amnafarinan/amnafarinan.env',
].filter(Boolean) as string[];

for (const file of candidates) {
  if (fs.existsSync(file)) {
    dotenv.config({ path: file });
  }
}

const boolish = z
  .union([z.boolean(), z.string()])
  .transform((value) =>
    typeof value === 'boolean' ? value : ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase()),
  );

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  JWT_SECRET: z.string().min(16).default('dev-only-insecure-secret-change-me-please'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  COOKIE_NAME: z.string().default('amn_token'),
  CSRF_COOKIE_NAME: z.string().default('amn_csrf'),
  COOKIE_SECURE: boolish.default(false),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  TRUST_PROXY: boolish.default(false),
  LOGIN_MAX_ATTEMPTS: z.coerce.number().int().positive().default(10),
  LOGIN_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),
  API_RATE_LIMIT: z.coerce.number().int().positive().default(600),
  API_RATE_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),
  ADMIN_USERNAME: z.string().default('admin'),
  ADMIN_PASSWORD: z.string().default('Admin@12345'),
  ADMIN_FULL_NAME: z.string().default('مدیر سیستم'),
  COMPANY_NAME: z.string().default('امن‌آفرینان'),
  CATALOG_URL: z.string().default('https://amnafarinan.ir/catalog.pdf'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ تنظیمات محیطی نامعتبر است:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

if (env.NODE_ENV === 'production' && env.JWT_SECRET.startsWith('dev-only')) {
  // eslint-disable-next-line no-console
  console.error('❌ در محیط production باید JWT_SECRET تنظیم شود.');
  process.exit(1);
}

export const config = {
  env: env.NODE_ENV,
  isProd: env.NODE_ENV === 'production',
  port: env.PORT,
  host: env.HOST,
  databaseUrl: env.DATABASE_URL,
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  cookieName: env.COOKIE_NAME,
  csrfCookieName: env.CSRF_COOKIE_NAME,
  cookieSecure: env.COOKIE_SECURE,
  cookieSameSite: env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none',
  trustProxy: env.TRUST_PROXY,
  loginMaxAttempts: env.LOGIN_MAX_ATTEMPTS,
  loginWindowMinutes: env.LOGIN_WINDOW_MINUTES,
  apiRateLimit: env.API_RATE_LIMIT,
  apiRateWindowMinutes: env.API_RATE_WINDOW_MINUTES,
  adminUsername: env.ADMIN_USERNAME,
  adminPassword: env.ADMIN_PASSWORD,
  adminFullName: env.ADMIN_FULL_NAME,
  companyName: env.COMPANY_NAME,
  catalogUrl: env.CATALOG_URL,
} as const;

export type AppConfig = typeof config;
