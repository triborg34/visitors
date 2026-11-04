import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, RotateCcw, UserPlus } from 'lucide-react';
import { api, ApiRequestError } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Field, OptionGroup, SelectInput, TextArea, TextInput } from '../components/ui/Field';
import { Card, CardHeader } from '../components/ui/Display';
import { GENDER_LABELS, PLATFORM_LABELS, PRIORITY_LABELS, REQUEST_TYPE_LABELS, formatJalaliDate } from '../lib/format';
import { isValidIranianMobile, normalizeMobileInput } from '../lib/utils';
import type { DuplicateInfo, Exhibition, VisitListItem } from '../types';

const schema = z
  .object({
    fullName: z.string().trim().min(2, 'نام و نام خانوادگی را وارد کنید.').max(120),
    gender: z.enum(['MALE', 'FEMALE', 'UNKNOWN']),
    company: z.string().trim().max(150).optional(),
    mobile: z
      .string()
      .trim()
      .refine((value) => isValidIranianMobile(value), 'شماره موبایل معتبر نیست. مثال: 09121234567'),
    requestType: z.enum([
      'PRICE_INQUIRY',
      'CATALOG',
      'TECHNICAL_CONSULTATION',
      'PARTNERSHIP',
      'OTHER',
    ]),
    priority: z.enum(['HOT', 'WARM', 'NORMAL']),
    notes: z.string().trim().max(1000).optional(),
    sendThankYou: z.boolean(),
    preferredPlatform: z.enum(['BALE', 'EITAA', 'WHATSAPP', 'TELEGRAM', 'NONE']),
    marketingConsent: z.boolean(),
    exhibitionId: z.string().min(1, 'نمایشگاه را انتخاب کنید.'),
  })
  .refine((data) => !data.marketingConsent || data.preferredPlatform !== 'NONE', {
    message: 'برای ثبت رضایت بازاریابی باید پلتفرم پیام انتخاب شود.',
    path: ['preferredPlatform'],
  });

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: FormValues = {
  fullName: '',
  gender: 'UNKNOWN',
  company: '',
  mobile: '',
  requestType: 'PRICE_INQUIRY',
  priority: 'NORMAL',
  notes: '',
  sendThankYou: true,
  preferredPlatform: 'WHATSAPP',
  marketingConsent: false,
  exhibitionId: '',
};

export default function NewVisitor() {
  const { user } = useAuth();
  const toast = useToast();
  const [duplicate, setDuplicate] = useState<DuplicateInfo | null>(null);
  const [saved, setSaved] = useState<VisitListItem | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onTouched',
  });

  const mobileValue = watch('mobile');
  const exhibitionId = watch('exhibitionId');

  const { data: exhibitions } = useQuery({
    queryKey: ['exhibitions', 'active'],
    queryFn: async () => (await api.get<Exhibition[]>('/api/exhibitions/active')).data,
  });

  useEffect(() => {
    if (exhibitionId) return;
    const preferred = user?.activeExhibitionId ?? exhibitions?.[0]?.id ?? '';
    if (preferred) setValue('exhibitionId', preferred, { shouldValidate: false });
  }, [exhibitions, exhibitionId, setValue, user?.activeExhibitionId]);

  useEffect(() => {
    const normalized = normalizeMobileInput(mobileValue ?? '');
    if (normalized.length !== 11) {
      setDuplicate(null);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const response = await api.get<DuplicateInfo>(
          '/api/visitors/check-duplicate?mobile=' + encodeURIComponent(normalized),
        );
        if (!cancelled) setDuplicate(response.data);
      } catch {
        if (!cancelled) setDuplicate(null);
      }
    }, 450);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [mobileValue]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        ...values,
        company: values.company ? values.company : undefined,
        notes: values.notes ? values.notes : undefined,
        mobile: normalizeMobileInput(values.mobile),
      };
      const response = await api.post<{
        visit: VisitListItem;
        duplicate: DuplicateInfo;
        messageDelivery: { status: 'NOT_REQUESTED' | 'MANUAL' | 'SKIPPED' | 'SENT' | 'FAILED'; error: string | null };
      }>('/api/visitors', payload);
      return response;
    },
    onSuccess: (response) => {
      setSaved(response.data.visit);
      const delivery = response.data.messageDelivery;
      if (delivery.status === 'SENT') {
        toast.success('\u0628\u0627\u0632\u062f\u06cc\u062f\u06a9\u0646\u0646\u062f\u0647 \u062b\u0628\u062a \u0634\u062f', '\u067e\u06cc\u0627\u0645 \u062a\u0634\u06a9\u0631 \u0628\u0644\u0647 \u0627\u0632 \u0637\u0631\u06cc\u0642 \u0633\u0641\u06cc\u0631 \u0627\u0631\u0633\u0627\u0644 \u0634\u062f.');
      } else if (delivery.status === 'FAILED') {
        toast.error('\u0628\u0627\u0632\u062f\u06cc\u062f\u06a9\u0646\u0646\u062f\u0647 \u062b\u0628\u062a \u0634\u062f\u060c \u0627\u0645\u0627 \u067e\u06cc\u0627\u0645 \u0628\u0644\u0647 \u0627\u0631\u0633\u0627\u0644 \u0646\u0634\u062f', delivery.error ?? undefined);
      } else if (delivery.status === 'SKIPPED') {
        toast.success('\u0628\u0627\u0632\u062f\u06cc\u062f\u06a9\u0646\u0646\u062f\u0647 \u062b\u0628\u062a \u0634\u062f', delivery.error ?? undefined);
      } else {
        toast.success(
          response.data.duplicate.exists ? '\u0645\u0631\u0627\u062c\u0639\u0647 \u062c\u062f\u06cc\u062f \u062b\u0628\u062a \u0634\u062f' : '\u0628\u0627\u0632\u062f\u06cc\u062f\u06a9\u0646\u0646\u062f\u0647 \u062b\u0628\u062a \u0634\u062f',
          response.data.duplicate.exists
            ? '\u0627\u06cc\u0646 \u0634\u0645\u0627\u0631\u0647 \u0642\u0628\u0644\u0627\u064b \u062b\u0628\u062a \u0634\u062f\u0647 \u0628\u0648\u062f\u061b \u0645\u0631\u0627\u062c\u0639\u0647 \u062c\u062f\u06cc\u062f \u0628\u0647 \u062a\u0627\u0631\u06cc\u062e\u0686\u0647 \u0627\u0636\u0627\u0641\u0647 \u0634\u062f.'
            : '\u062b\u0628\u062a \u0628\u0627 \u0645\u0648\u0641\u0642\u06cc\u062a \u0627\u0646\u062c\u0627\u0645 \u0634\u062f.',
        );
      }
      reset({ ...DEFAULT_VALUES, exhibitionId });
      setDuplicate(null);
    },
    onError: (error) => {
      toast.error('ثبت ناموفق بود', error instanceof ApiRequestError ? error.message : 'خطای نامشخص رخ داد.');
    },
  });

  const submit = handleSubmit((values) => mutation.mutate(values));

  const resetForm = () => {
    reset({ ...DEFAULT_VALUES, exhibitionId });
    setDuplicate(null);
    setSaved(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">ثبت بازدیدکننده جدید</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            فرم را در کمتر از یک دقیقه تکمیل کنید. موارد ستاره‌دار الزامی هستند.
          </p>
        </div>
        <Button variant="outline" icon={<RotateCcw className="size-4" />} onClick={resetForm}>
          فرم جدید
        </Button>
      </div>

      {saved ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-800">
            <CheckCircle2 className="size-5" />
            {saved.fullName} با موفقیت ثبت شد.
          </p>
          <Button size="sm" icon={<UserPlus className="size-4" />} onClick={resetForm}>
            ثبت بازدیدکننده بعدی
          </Button>
        </div>
      ) : null}

      {duplicate?.exists ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <AlertTriangle className="size-5" />
            این شماره موبایل قبلاً ثبت شده است.
          </p>
          <div className="mt-2 grid gap-1 text-sm text-amber-900/90">
            <p>
              نام: <span className="font-semibold">{duplicate.fullName}</span>
              {duplicate.company ? ' — ' + duplicate.company : ''}
            </p>
            <p>
              تعداد مراجعات قبلی: <span className="font-semibold">{duplicate.totalVisits}</span>
            </p>
            {duplicate.lastVisit ? (
              <p>
                آخرین مراجعه: {duplicate.lastVisit.exhibitionName} در{' '}
                {formatJalaliDate(duplicate.lastVisit.createdAt)} (توسط{' '}
                {duplicate.lastVisit.employeeName})
              </p>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-amber-800">
            ثبت قبلی حذف یا تغییر داده نمی‌شود؛ مراجعه جدید به‌عنوان رکورد تازه ثبت خواهد شد.
          </p>
        </div>
      ) : null}

      <form onSubmit={submit} className="space-y-4">
        <Card>
          <CardHeader
            title="اطلاعات نمایشگاه"
            description="هر بازدیدکننده به یک نمایشگاه متصل است."
            icon={<UserPlus className="size-5" />}
          />
          <Field label="نمایشگاه فعال" htmlFor="exhibitionId" required error={errors.exhibitionId?.message}>
            <SelectInput id="exhibitionId" {...register('exhibitionId')}>
              <option value="">انتخاب نمایشگاه…</option>
              {(exhibitions ?? []).map((exhibition) => (
                <option key={exhibition.id} value={exhibition.id}>
                  {exhibition.name}
                </option>
              ))}
            </SelectInput>
          </Field>
        </Card>

        <Card>
          <CardHeader title="اطلاعات بازدیدکننده" description="موارد ستاره‌دار الزامی هستند." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="نام و نام خانوادگی" htmlFor="fullName" required error={errors.fullName?.message}>
              <TextInput
                id="fullName"
                autoComplete="name"
                placeholder="مثال: علی رضایی"
                {...register('fullName')}
              />
            </Field>

            <Field label="شماره موبایل" htmlFor="mobile" required error={errors.mobile?.message}>
              <TextInput
                id="mobile"
                type="tel"
                inputMode="tel"
                dir="ltr"
                className="text-start"
                placeholder="09121234567"
                {...register('mobile', {
                  setValueAs: (value: string) => normalizeMobileInput(value),
                })}
              />
            </Field>

            <Field label="شرکت / سازمان" htmlFor="company" error={errors.company?.message}>
              <TextInput id="company" placeholder="مثال: صنایع پتروشیمی پارس" {...register('company')} />
            </Field>

            <Field label="جنسیت">
              <OptionGroup
                name="gender"
                columns={3}
                value={watch('gender')}
                onChange={(value) => setValue('gender', value as FormValues['gender'], { shouldValidate: true })}
                options={(['MALE', 'FEMALE', 'UNKNOWN'] as const).map((value) => ({
                  value,
                  label: GENDER_LABELS[value],
                }))}
              />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="نیاز و اولویت" />
          <div className="space-y-4">
            <Field label="نوع درخواست" required error={errors.requestType?.message}>
              <OptionGroup
                name="requestType"
                columns={2}
                value={watch('requestType')}
                onChange={(value) => setValue('requestType', value as FormValues['requestType'])}
                options={Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </Field>

            <Field label="اولویت مشتری">
              <OptionGroup
                name="priority"
                columns={3}
                value={watch('priority')}
                onChange={(value) => setValue('priority', value as FormValues['priority'])}
                options={Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </Field>

            <Field label="یادداشت" htmlFor="notes" error={errors.notes?.message}>
              <TextArea id="notes" rows={3} placeholder="نیاز، درخواست یا نکتهٔ مهم…" {...register('notes')} />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="پیام تشکر و رضایت بازاریابی"
            description="آماده‌سازی پیام با ارسال خودکار اشتباه گرفته نمی‌شود."
          />
          <div className="space-y-4">
            <Field label="آیا پیام تشکر آماده شود؟">
              <OptionGroup
                name="sendThankYou"
                columns={2}
                value={watch('sendThankYou') ? 'YES' : 'NO'}
                onChange={(value) => setValue('sendThankYou', value === 'YES')}
                options={[
                  { value: 'YES', label: 'بله — پیام تشکر آماده شود' },
                  { value: 'NO', label: 'خیر — پیامی لازم نیست' },
                ]}
              />
            </Field>

            <Field label="پلتفرم پیام ترجیحی" error={errors.preferredPlatform?.message}>
              <OptionGroup
                name="preferredPlatform"
                columns={3}
                value={watch('preferredPlatform')}
                onChange={(value) =>
                  setValue('preferredPlatform', value as FormValues['preferredPlatform'], {
                    shouldValidate: true,
                  })
                }
                options={Object.entries(PLATFORM_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </Field>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-brand-300">
              <input
                type="checkbox"
                className="mt-0.5 size-5 shrink-0 rounded border-slate-300 text-brand-700 focus:ring-brand-300"
                {...register('marketingConsent')}
              />
              <span className="text-sm leading-7 text-slate-700">
                <span className="font-semibold text-slate-900">رضایت بازاریابی: </span>
                بازدیدکننده صریحاً با دریافت معرفی شرکت و مطالب بازاریابی از طریق پلتفرم انتخابی موافقت
                می‌کند. ثبت شماره تماس به‌تنهایی به معنای رضایت نیست.
              </span>
            </label>
            {watch('preferredPlatform') === 'BALE' && watch('sendThankYou') ? (
              <p className="text-xs leading-6 text-slate-500">
                {watch('marketingConsent')
                  ? '\u0628\u0627 \u062a\u0623\u06cc\u06cc\u062f \u0641\u0631\u0645\u060c \u067e\u06cc\u0627\u0645 \u062a\u0634\u06a9\u0631 \u0627\u0632 \u0637\u0631\u06cc\u0642 \u0633\u0641\u06cc\u0631 \u0627\u0631\u0633\u0627\u0644 \u0645\u06cc\u200c\u0634\u0648\u062f.'
                  : '\u0628\u0631\u0627\u06cc \u0627\u0631\u0633\u0627\u0644 \u067e\u06cc\u0627\u0645 \u0628\u0644\u0647\u060c \u062a\u0623\u06cc\u06cc\u062f \u0631\u0636\u0627\u06cc\u062a \u0628\u0627\u0632\u0627\u0631\u06cc\u0627\u0628\u06cc \u0631\u0627 \u0647\u0645 \u0641\u0639\u0627\u0644 \u06a9\u0646\u06cc\u062f.'}
              </p>
            ) : null}
            {errors.marketingConsent?.message ? (
              <p className="field-error">{errors.marketingConsent.message}</p>
            ) : null}
          </div>
        </Card>

        <div className="sticky bottom-0 flex gap-2 border-t border-slate-200 bg-slate-100/95 py-3 backdrop-blur">
          <Button type="submit" size="lg" loading={isSubmitting || mutation.isPending} className="flex-1">
            ثبت بازدیدکننده
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={resetForm}
            disabled={isSubmitting || mutation.isPending}
          >
            پاک کردن
          </Button>
        </div>
      </form>
    </div>
  );
}
