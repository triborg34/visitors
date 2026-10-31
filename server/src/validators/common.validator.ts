import { z } from 'zod';
import { toEnglishDigits } from '../utils/persian';

export const GENDERS = ['MALE', 'FEMALE', 'UNKNOWN'] as const;
export const REQUEST_TYPES = [
  'PRICE_INQUIRY',
  'CATALOG',
  'TECHNICAL_CONSULTATION',
  'PARTNERSHIP',
  'OTHER',
] as const;
export const PRIORITIES = ['HOT', 'WARM', 'NORMAL'] as const;
export const FOLLOW_UP_STATUSES = [
  'NEW',
  'CONTACTED',
  'NEGOTIATION',
  'FINALIZED',
  'REJECTED',
] as const;
export const PLATFORMS = ['BALE', 'EITAA', 'WHATSAPP', 'TELEGRAM', 'NONE'] as const;
export const EXHIBITION_STATUSES = ['UPCOMING', 'ACTIVE', 'COMPLETED'] as const;
export const ROLES = ['ADMIN', 'EMPLOYEE'] as const;

export const persianText = (max = 200) =>
  z
    .string()
    .transform((v) => toEnglishDigits(v).trim())
    .pipe(z.string().max(max));

export const optionalPersianText = (max = 200) =>
  z
    .string()
    .transform((v) => toEnglishDigits(v).trim())
    .pipe(z.string().max(max))
    .optional()
    .or(z.literal('').transform(() => undefined))
    .nullable()
    .transform((v) => (v === '' ? undefined : v));

export const mobileField = z
  .string()
  .transform((v) => toEnglishDigits(v).trim())
  .refine((v) => /^09\d{9}$/.test(v), 'شماره موبایل معتبر نیست. مثال: 09121234567');

export const idField = z.string().min(1, 'شناسه نامعتبر است.');

export const dateField = z
  .union([z.string(), z.date()])
  .transform((v) => (v instanceof Date ? v : new Date(v)))
  .refine((v) => !Number.isNaN(v.getTime()), 'تاریخ نامعتبر است.');

export const optionalDateField = z
  .union([z.string(), z.date()])
  .transform((v) => (v instanceof Date ? v : new Date(v)))
  .refine((v) => !Number.isNaN(v.getTime()), 'تاریخ نامعتبر است.')
  .optional();
