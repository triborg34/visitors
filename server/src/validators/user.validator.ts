import { z } from 'zod';
import { ROLES, optionalPersianText, persianText } from './common.validator';

export const createUserSchema = z.object({
  username: z
    .string()
    .transform((v) => v.trim().toLowerCase())
    .pipe(
      z
        .string()
        .min(3, 'نام کاربری باید حداقل ۳ کاراکتر باشد.')
        .max(64)
        .regex(/^[a-z0-9._-]+$/, 'نام کاربری فقط می‌تواند شامل حروف انگلیسی، عدد، نقطه، خط تیره و زیرخط باشد.'),
    ),
  fullName: persianText(120).pipe(z.string().min(2, 'نام کامل را وارد کنید.')),
  phone: optionalPersianText(20),
  email: z
    .string()
    .trim()
    .email('ایمیل نامعتبر است.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  password: z
    .string()
    .min(8, 'رمز عبور باید حداقل ۸ کاراکتر باشد.')
    .max(128)
    .regex(/[A-Za-z]/, 'رمز عبور باید حداقل یک حرف انگلیسی داشته باشد.')
    .regex(/[0-9]/, 'رمز عبور باید حداقل یک رقم داشته باشد.'),
  role: z.enum(ROLES).default('EMPLOYEE'),
  activeExhibitionId: z.string().optional(),
});

export const updateUserSchema = z.object({
  fullName: persianText(120).optional(),
  phone: optionalPersianText(20),
  email: z
    .string()
    .trim()
    .email('ایمیل نامعتبر است.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  role: z.enum(ROLES).optional(),
  isActive: z.boolean().optional(),
  activeExhibitionId: z.string().nullable().optional(),
  mustChangePassword: z.boolean().optional(),
});

export const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'رمز عبور باید حداقل ۸ کاراکتر باشد.')
    .max(128)
    .regex(/[A-Za-z]/, 'رمز عبور باید حداقل یک حرف انگلیسی داشته باشد.')
    .regex(/[0-9]/, 'رمز عبور باید حداقل یک رقم داشته باشد.'),
  mustChangePassword: z.boolean().default(true),
});
