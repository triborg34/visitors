import { z } from 'zod';
import { PLATFORMS, optionalPersianText, persianText } from './common.validator';

export const templateKeySchema = z.enum([
  'THANK_YOU',
  'COMPANY_INTRO',
  'PRODUCT_INTRO',
  'CATALOG',
  'FOLLOW_UP',
]);

export const createTemplateSchema = z.object({
  key: templateKeySchema,
  title: persianText(120).pipe(z.string().min(2, 'عنوان قالب را وارد کنید.')),
  body: persianText(4000).pipe(z.string().min(10, 'متن قالب بسیار کوتاه است.')),
  platform: z.enum(PLATFORMS).optional(),
  isActive: z.boolean().default(true),
});

export const updateTemplateSchema = z.object({
  title: persianText(120).optional(),
  body: persianText(4000).optional(),
  platform: z.enum(PLATFORMS).optional(),
  isActive: z.boolean().optional(),
});
