import { z } from 'zod';
import { PLATFORMS, optionalPersianText, persianText } from './common.validator';

const optionalUrl = z
  .string()
  .trim()
  .refine(
    (v) => v === '' || /^https?:\/\//i.test(v),
    'نشانی باید با http:// یا https:// آغاز شود.',
  )
  .optional()
  .or(z.literal('').transform(() => undefined));

export const updateSettingsSchema = z.object({
  companyName: persianText(150).optional(),
  description: optionalPersianText(2000),
  website: optionalUrl,
  phone: optionalPersianText(30),
  email: z
    .string()
    .trim()
    .email('ایمیل نامعتبر است.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  logoUrl: optionalUrl,
  catalogUrl: optionalUrl,
  defaultPlatform: z.enum(PLATFORMS).optional(),
});
