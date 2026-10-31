import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquareText, Save } from 'lucide-react';
import { api, ApiRequestError } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import { Badge, Card, CardHeader, ErrorState, Spinner } from '../../components/ui/Display';
import { Button } from '../../components/ui/Button';
import { Field, TextArea, TextInput } from '../../components/ui/Field';
import type { MessageTemplate } from '../../types';

const PLACEHOLDERS = [
  { key: '{name}', label: 'نام بازدیدکننده' },
  { key: '{company}', label: 'نام شرکت بازدیدکننده' },
  { key: '{mobile}', label: 'شماره موبایل' },
  { key: '{exhibition}', label: 'نام نمایشگاه' },
  { key: '{employee}', label: 'نام کارمند' },
  { key: '{catalog_url}', label: 'نشانی کاتالوگ' },
];

export default function Templates() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, { title: string; body: string }>>({});

  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => (await api.get<MessageTemplate[]>('/api/templates')).data,
  });

  useEffect(() => {
    if (!templates) return;
    const next: Record<string, { title: string; body: string }> = {};
    for (const template of templates) {
      next[template.key] = { title: template.title, body: template.body };
    }
    setDrafts(next);
  }, [templates]);

  const saveMutation = useMutation({
    mutationFn: async (template: MessageTemplate) => {
      const draft = drafts[template.key];
      await api.post('/api/templates', {
        key: template.key,
        title: draft?.title ?? template.title,
        body: draft?.body ?? template.body,
        isActive: template.isActive,
      });
    },
    onSuccess: () => {
      toast.success('قالب پیام ذخیره شد');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (err) =>
      toast.error('ذخیره ناموفق بود', err instanceof ApiRequestError ? err.message : 'خطای نامشخص'),
  });

  const toggleMutation = useMutation({
    mutationFn: async (template: MessageTemplate) => {
      await api.patch('/api/templates/' + template.id, { isActive: !template.isActive });
    },
    onSuccess: () => {
      toast.success('وضعیت قالب به‌روزرسانی شد');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (err) =>
      toast.error('تغییر وضعیت ناموفق بود', err instanceof ApiRequestError ? err.message : 'خطای نامشخص'),
  });

  if (isLoading) return <Spinner label="در حال بارگذاری قالب‌ها…" />;
  if (error) return <ErrorState message="دریافت قالب‌ها ناموفق بود." />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">قالب‌های پیام</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          متن پیام‌ها برای هر پلتفرم آماده می‌شود؛ ارسال پیام همچنان بر عهده کارمند است.
        </p>
      </div>

      <Card>
        <CardHeader
          title="متغیرهای در دسترس"
          description="این متغیرها هنگام آماده‌سازی پیام جایگزین می‌شوند."
          icon={<MessageSquareText className="size-5" />}
        />
        <div className="flex flex-wrap gap-2">
          {PLACEHOLDERS.map((placeholder) => (
            <button
              key={placeholder.key}
              type="button"
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
              title={placeholder.label}
              onClick={() => undefined}
            >
              <span className="ltr-numbers">{placeholder.key}</span>
              <span className="ms-2 text-slate-500">{placeholder.label}</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {(templates ?? []).map((template) => {
          const draft = drafts[template.key] ?? { title: template.title, body: template.body };
          const isDefault = template.id.startsWith('default-');
          return (
            <Card key={template.key}>
              <CardHeader
                title={template.title}
                description={'کلید: ' + template.key}
                action={
                  <Badge
                    tone={
                      template.isActive
                        ? 'bg-emerald-100 text-emerald-700 ring-emerald-200'
                        : 'bg-slate-100 text-slate-600 ring-slate-200'
                    }
                  >
                    {template.isActive ? 'فعال' : 'غیرفعال'}
                  </Badge>
                }
              />
              <div className="space-y-3">
                <Field label="عنوان">
                  <TextInput
                    value={draft.title}
                    onChange={(event) =>
                      setDrafts({ ...drafts, [template.key]: { ...draft, title: event.target.value } })
                    }
                  />
                </Field>
                <Field label="متن پیام">
                  <TextArea
                    rows={9}
                    className="leading-7"
                    value={draft.body}
                    onChange={(event) =>
                      setDrafts({ ...drafts, [template.key]: { ...draft, body: event.target.value } })
                    }
                  />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<Save className="size-4" />}
                    loading={saveMutation.isPending}
                    onClick={() => saveMutation.mutate(template)}
                  >
                    ذخیره قالب
                  </Button>
                  {isDefault ? (
                    <span className="self-center text-xs text-slate-500">
                      این قالب هنوز ذخیره نشده؛ با ذخیره، نسخه سفارشی ایجاد می‌شود.
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={toggleMutation.isPending}
                      onClick={() => toggleMutation.mutate(template)}
                    >
                      {template.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}