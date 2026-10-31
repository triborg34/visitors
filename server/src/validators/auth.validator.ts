import { z } from 'zod';
import { toEnglishDigits } from '../utils/persian';

export const loginSchema = z.object({
  username: z
    .string()
    .transform((v) => toEnglishDigits(v).trim().toLowerCase())
    .pipe(z.string().min(3, 'نام کاربری نامعتبر است.').max(64)),
  password: z.string().min(6, 'رمز عبور نامعتبر است.').max(128),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, 'رمز عبور فعلی نامعتبر است.'),
    newPassword: z
      .string()
      .min(8, 'رمز عبور جدید باید حداقل ۸ کاراکتر باشد.')
      .max(128)
      .regex(/[A-Za-z]/, 'رمز عبور باید حداقل یک حرف انگلیسی داشته باشد.')
      .regex(/[0-9]/, 'رمز عبور باید حداقل یک رقم داشته باشد.'),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'رمز عبور جدید باید با رمز عبور فعلی متفاوت باشد.',
    path: ['newPassword'],
  });
