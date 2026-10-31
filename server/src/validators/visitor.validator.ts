import { z } from 'zod';
import {
  FOLLOW_UP_STATUSES,
  GENDERS,
  PLATFORMS,
  PRIORITIES,
  REQUEST_TYPES,
  idField,
  mobileField,
  optionalDateField,
  optionalPersianText,
  persianText,
} from './common.validator';

export const createVisitSchema = z
  .object({
    fullName: persianText(120).pipe(z.string().min(2, 'نام را وارد کنید.')),
    gender: z.enum(GENDERS),
    company: optionalPersianText(150),
    mobile: mobileField,
    requestType: z.enum(REQUEST_TYPES),
    priority: z.enum(PRIORITIES).default('NORMAL'),
    notes: optionalPersianText(1000),
    sendThankYou: z.boolean().default(false),
    preferredPlatform: z.enum(PLATFORMS).nullable().optional(),
    marketingConsent: z.boolean().default(false),
    exhibitionId: idField,
    assignedEmployeeId: idField.optional(),
  })
  .refine(
    (data) =>
      !data.marketingConsent ||
      (Boolean(data.preferredPlatform) && data.preferredPlatform !== 'NONE'),
    {
      message: 'برای ثبت رضایت بازاریابی باید پلتفرم پیام انتخاب شود.',
      path: ['preferredPlatform'],
    },
  );

export const updateVisitSchema = z
  .object({
    followUpStatus: z.enum(FOLLOW_UP_STATUSES).optional(),
    priority: z.enum(PRIORITIES).optional(),
    requestType: z.enum(REQUEST_TYPES).optional(),
    notes: optionalPersianText(1000),
    assignedEmployeeId: idField.nullable().optional(),
    exhibitionId: idField.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'هیچ تغییری ارسال نشده است.');

export const createFollowUpSchema = z.object({
  status: z.enum(FOLLOW_UP_STATUSES),
  note: optionalPersianText(2000),
  lastContactAt: optionalDateField,
  nextFollowUpAt: optionalDateField,
  assignedEmployeeId: idField.optional(),
});

export const updateFollowUpSchema = createFollowUpSchema.partial();

export const messagePrepareSchema = z.object({
  templateKey: z
    .enum(['THANK_YOU', 'COMPANY_INTRO', 'PRODUCT_INTRO', 'CATALOG', 'FOLLOW_UP'])
    .default('THANK_YOU'),
  platform: z.enum(PLATFORMS).default('WHATSAPP'),
  body: optionalPersianText(4000),
});

export const duplicateCheckSchema = z.object({
  mobile: z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().min(1, 'شماره موبایل را وارد کنید.')),
});
