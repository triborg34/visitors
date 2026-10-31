import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Save } from 'lucide-react';
import { api, ApiRequestError } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import { Card, CardHeader, ErrorState, Spinner } from '../../components/ui/Display';
import { Button } from '../../components/ui/Button';
import { Field, SelectInput, TextArea, TextInput } from '../../components/ui/Field';
import { PLATFORM_LABELS } from '../../lib/format';
import type { CompanySettings } from '../../types';

interface FormState {
  companyName: string;
  description: string;
  website: string;
  phone: string;
  email: string;
  logoUrl: string;
  catalogUrl: string;
  defaultPlatform: string;
}

const EMPTY: FormState = {
  companyName: '',
  description: '',
  website: '',
  phone: '',
  email: '',
  logoUrl: '',
  catalogUrl: '',
  defaultPlatform: 'WHATSAPP',
};

export default function SettingsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get<CompanySettings>('/api/settings')).data,
  });

  useEffect(() => {
    if (!settings) return;
    setForm({
      companyName: settings.companyName ?? '',
      description: settings.description ?? '',
      website: settings.website ?? '',
      phone: settings.phone ?? '',
      email: settings.email ?? '',
      logoUrl: settings.logoUrl ?? '',
      catalogUrl: settings.catalogUrl ?? '',
      defaultPlatform: settings.defaultPlatform ?? 'WHATSAPP',
    });
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.put('/api/settings', {
        ...form,
        description: form.description || undefined,
        website: form.website || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        logoUrl: form.logoUrl || undefined,
        catalogUrl: form.catalogUrl || undefined,
      });
    },
    onSuccess: () => {
      toast.success('تنظیمات ذخیره شد');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err) =>
      toast.error('ذخیره ناموفق بود', err instanceof ApiRequestError ? err.message : 'خطای نامشخص'),
  });

  if (isLoading) return <Spinner label="در حال بارگذاری تنظیمات…" />;
  if (error) return <ErrorState message="دریافت تنظیمات ناموفق بود." />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">تنظیمات شرکت</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          این اطلاعات در متن پیام‌ها و لینک کاتالوگ استفاده می‌شود.
        </p>
      </div>

      <Card>
        <CardHeader title="اطلاعات شرکت" icon={<Building2 className="size-5" />} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="نام شرکت" required>
            <TextInput
              value={form.companyName}
              onChange={(event) => setForm({ ...form, companyName: event.target.value })}
            />
          </Field>
          <Field label="شماره تماس">
            <TextInput
              type="tel"
              dir="ltr"
              className="text-start"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </Field>
          <Field label="ایمیل">
            <TextInput
              type="email"
              dir="ltr"
              className="text-start"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </Field>
          <Field label="وب‌سایت">
            <TextInput
              dir="ltr"
              className="text-start"
              placeholder="https://amnafarinan.ir"
              value={form.website}
              onChange={(event) => setForm({ ...form, website: event.target.value })}
            />
          </Field>
          <Field label="نشانی لوگو">
            <TextInput
              dir="ltr"
              className="text-start"
              placeholder="https://amnafarinan.ir/logo.png"
              value={form.logoUrl}
              onChange={(event) => setForm({ ...form, logoUrl: event.target.value })}
            />
          </Field>
          <Field label="نشانی کاتالوگ (PDF)" hint="کاتالوگ بهتر است روی دامنه خود شرکت میزبانی شود.">
            <TextInput
              dir="ltr"
              className="text-start"
              placeholder="https://amnafarinan.ir/catalog.pdf"
              value={form.catalogUrl}
              onChange={(event) => setForm({ ...form, catalogUrl: event.target.value })}
            />
          </Field>
          <Field label="پلتفرم پیام پیش‌فرض">
            <SelectInput
              value={form.defaultPlatform}
              onChange={(event) => setForm({ ...form, defaultPlatform: event.target.value })}
            >
              {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="معرفی شرکت" className="sm:col-span-2">
            <TextArea
              rows={4}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </Field>
        </div>
        <div className="mt-4">
          <Button variant="primary" icon={<Save className="size-4" />} loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            ذخیره تنظیمات
          </Button>
        </div>
      </Card>
    </div>
  );
}