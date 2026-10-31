import { z } from 'zod';
import { EXHIBITION_STATUSES, optionalPersianText, persianText } from './common.validator';

const exhibitionBaseSchema = z.object({
  name: persianText(150).pipe(z.string().min(2, 'نام نمایشگاه را وارد کنید.')),
  location: optionalPersianText(200),
  startDate: z.coerce.date().refine((d) => !Number.isNaN(d.getTime()), 'تاریخ شروع نامعتبر است.'),
  endDate: z.coerce.date().refine((d) => !Number.isNaN(d.getTime()), 'تاریخ پایان نامعتبر است.'),
  description: optionalPersianText(2000),
  status: z.enum(EXHIBITION_STATUSES).default('UPCOMING'),
});

export const createExhibitionSchema = exhibitionBaseSchema
  .refine((data) => data.endDate >= data.startDate, {
    message: 'تاریخ پایان نباید قبل از تاریخ شروع باشد.',
    path: ['endDate'],
  });

export const updateExhibitionSchema = exhibitionBaseSchema.partial();
