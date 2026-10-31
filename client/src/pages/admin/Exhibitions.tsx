import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, ApiRequestError } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import { Badge, Card, CardHeader, EmptyState, ErrorState, Spinner } from '../../components/ui/Display';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog, Modal } from '../../components/ui/Modal';
import { Field, SelectInput, TextArea, TextInput } from '../../components/ui/Field';
import { JalaliDatePicker } from '../../components/JalaliDatePicker';
import { EXHIBITION_STATUS_LABELS, EXHIBITION_TONES, formatJalaliDate, toPersianDigits } from '../../lib/format';
import type { Exhibition } from '../../types';

interface FormState {
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  status: string;
}

const EMPTY: FormState = {
  name: '',
  location: '',
  startDate: '',
  endDate: '',
  description: '',
  status: 'UPCOMING',
};

export default function Exhibitions() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Exhibition | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [deleting, setDeleting] = useState<Exhibition | null>(null);

  const { data: exhibitions, isLoading, error } = useQuery({
    queryKey: ['exhibitions', 'all'],
    queryFn: async () => (await api.get<Exhibition[]>('/api/exhibitions')).data,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        location: form.location || undefined,
        description: form.description || undefined,
      };
      if (editing) {
        await api.patch('/api/exhibitions/' + editing.id, payload);
      } else {
        await api.post('/api/exhibitions', payload);
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'نمایشگاه به‌روزرسانی شد' : 'نمایشگاه ساخته شد');
      setOpen(false);
      setEditing(null);
      setForm(EMPTY);
      queryClient.invalidateQueries({ queryKey: ['exhibitions'] });
    },
    onError: (err) =>
      toast.error('ذخیره ناموفق بود', err instanceof ApiRequestError ? err.message : 'خطای نامشخص'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (exhibition: Exhibition) => {
      await api.delete('/api/exhibitions/' + exhibition.id);
    },
    onSuccess: () => {
      toast.success('نمایشگاه حذف شد');
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ['exhibitions'] });
    },
    onError: (err) =>
      toast.error('حذف ناموفق بود', err instanceof ApiRequestError ? err.message : 'خطای نامشخص'),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };

  const openEdit = (exhibition: Exhibition) => {
    setEditing(exhibition);
    setForm({
      name: exhibition.name,
      location: exhibition.location ?? '',
      startDate: exhibition.startDate.slice(0, 10),
      endDate: exhibition.endDate.slice(0, 10),
      description: exhibition.description ?? '',
      status: exhibition.status,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">مدیریت نمایشگاه‌ها</h1>
          <p className="mt-0.5 text-sm text-slate-500">هر بازدیدکننده به یک نمایشگاه متصل است.</p>
        </div>
        <Button variant="primary" icon={<Plus className="size-4" />} onClick={openCreate}>
          نمایشگاه جدید
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message="دریافت نمایشگاه‌ها ناموفق بود." />
      ) : !exhibitions?.length ? (
        <EmptyState
          title="نمایشگاهی ثبت نشده است"
          description="برای شروع ثبت بازدیدکننده، اولین نمایشگاه را بسازید."
          icon={<Building2 className="size-8" />}
          action={
            <Button variant="primary" onClick={openCreate}>
              ساخت نمایشگاه
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {exhibitions.map((exhibition) => (
            <Card key={exhibition.id}>
              <CardHeader
                title={exhibition.name}
                description={exhibition.location ?? 'بدون مکان'}
                icon={<Building2 className="size-5" />}
                action={
                  <Badge tone={EXHIBITION_TONES[exhibition.status]}>
                    {EXHIBITION_STATUS_LABELS[exhibition.status]}
                  </Badge>
                }
              />
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">شروع</dt>
                  <dd className="font-medium text-slate-700">{formatJalaliDate(exhibition.startDate)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">پایان</dt>
                  <dd className="font-medium text-slate-700">{formatJalaliDate(exhibition.endDate)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">تعداد مراجعات</dt>
                  <dd className="font-medium text-slate-700">
                    {toPersianDigits(exhibition.visitCount ?? 0)}
                  </dd>
                </div>
              </dl>
              {exhibition.description ? (
                <p className="mt-3 text-sm leading-6 text-slate-500">{exhibition.description}</p>
              ) : null}
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Pencil className="size-4" />}
                  onClick={() => openEdit(exhibition)}
                >
                  ویرایش
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Trash2 className="size-4" />}
                  onClick={() => setDeleting(exhibition)}
                >
                  حذف
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'ویرایش نمایشگاه' : 'نمایشگاه جدید'}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              انصراف
            </Button>
            <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              ذخیره
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="نام نمایشگاه" required>
            <TextInput
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="مثال: نمایشگاه صنعت پتروشیمی تهران"
            />
          </Field>
          <Field label="مکان">
            <TextInput
              value={form.location}
              onChange={(event) => setForm({ ...form, location: event.target.value })}
              placeholder="مثال: مرکز نمایشگاه بین‌المللی تهران"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="تاریخ شروع" required>
              <JalaliDatePicker
                value={form.startDate || undefined}
                onChange={(iso) => setForm({ ...form, startDate: iso })}
              />
            </Field>
            <Field label="تاریخ پایان" required>
              <JalaliDatePicker
                value={form.endDate || undefined}
                onChange={(iso) => setForm({ ...form, endDate: iso })}
              />
            </Field>
          </div>
          <Field label="وضعیت">
            <SelectInput value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              {Object.entries(EXHIBITION_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="توضیحات">
            <TextArea
              rows={3}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="حذف نمایشگاه"
        message={
          <p>
            نمایشگاه «{deleting?.name}» حذف می‌شود. مراجعه‌های ثبت‌شده حذف نمی‌شوند و نمایشگاه به‌عنوان
            «برگزار شده» باقی می‌ماند.
          </p>
        }
        loading={deleteMutation.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
      />
    </div>
  );
}
