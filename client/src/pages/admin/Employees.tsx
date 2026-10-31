import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Pencil, Plus, Trash2, UserCog } from 'lucide-react';
import { api, ApiRequestError } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import { Badge, Card, CardHeader, EmptyState, ErrorState, Spinner } from '../../components/ui/Display';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog, Modal } from '../../components/ui/Modal';
import { Field, SelectInput, TextInput } from '../../components/ui/Field';
import { formatJalaliDate, toPersianDigits } from '../../lib/format';
import type { Exhibition, User } from '../../types';

interface FormState {
  username: string;
  fullName: string;
  phone: string;
  email: string;
  password: string;
  role: string;
  activeExhibitionId: string;
}

const EMPTY: FormState = {
  username: '',
  fullName: '',
  phone: '',
  email: '',
  password: '',
  role: 'EMPLOYEE',
  activeExhibitionId: '',
};

export default function Employees() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [deleting, setDeleting] = useState<User | null>(null);

  const { data: employees, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get<User[]>('/api/users?pageSize=200')).data,
  });

  const { data: exhibitions } = useQuery({
    queryKey: ['exhibitions', 'all'],
    queryFn: async () => (await api.get<Exhibition[]>('/api/exhibitions')).data,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        await api.patch('/api/users/' + editing.id, {
          fullName: form.fullName,
          phone: form.phone || undefined,
          email: form.email || undefined,
          role: form.role,
          activeExhibitionId: form.activeExhibitionId || null,
        });
      } else {
        await api.post('/api/users', {
          username: form.username,
          fullName: form.fullName,
          phone: form.phone || undefined,
          email: form.email || undefined,
          password: form.password,
          role: form.role,
          activeExhibitionId: form.activeExhibitionId || undefined,
        });
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'اطلاعات کارمند به‌روزرسانی شد' : 'حساب کارمند ساخته شد');
      setOpen(false);
      setEditing(null);
      setForm(EMPTY);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) =>
      toast.error('ذخیره ناموفق بود', err instanceof ApiRequestError ? err.message : 'خطای نامشخص'),
  });

  const toggleActive = useMutation({
    mutationFn: async (user: User) => {
      await api.patch('/api/users/' + user.id, { isActive: !user.isActive });
    },
    onSuccess: () => {
      toast.success('وضعیت حساب به‌روزرسانی شد');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) =>
      toast.error('تغییر وضعیت ناموفق بود', err instanceof ApiRequestError ? err.message : 'خطای نامشخص'),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      if (!resetTarget) return;
      await api.post('/api/users/' + resetTarget.id + '/reset-password', {
        newPassword,
        mustChangePassword: true,
      });
    },
    onSuccess: () => {
      toast.success('رمز عبور بازنشانی شد', 'کارمند در اولین ورود باید رمز را تغییر دهد.');
      setResetTarget(null);
      setNewPassword('');
    },
    onError: (err) =>
      toast.error('بازنشانی ناموفق بود', err instanceof ApiRequestError ? err.message : 'خطای نامشخص'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (user: User) => {
      await api.delete('/api/users/' + user.id);
    },
    onSuccess: () => {
      toast.success('کارمند حذف شد');
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) =>
      toast.error('حذف ناموفق بود', err instanceof ApiRequestError ? err.message : 'خطای نامشخص'),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setForm({
      username: user.username,
      fullName: user.fullName,
      phone: user.phone ?? '',
      email: user.email ?? '',
      password: '',
      role: user.role,
      activeExhibitionId: user.activeExhibitionId ?? '',
    });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">مدیریت کارمندان</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            ساخت حساب، تغییر نقش، فعال/غیرفعال کردن و بازنشانی رمز.
          </p>
        </div>
        <Button variant="primary" icon={<Plus className="size-4" />} onClick={openCreate}>
          کارمند جدید
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message="دریافت کارمندان ناموفق بود." />
      ) : !employees?.length ? (
        <EmptyState title="کارمندی ثبت نشده است" icon={<UserCog className="size-8" />} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {employees.map((user) => (
            <Card key={user.id}>
              <CardHeader
                title={user.fullName}
                description={'@' + user.username}
                icon={<UserCog className="size-5" />}
                action={
                  <Badge
                    tone={
                      user.role === 'ADMIN'
                        ? 'bg-brand-100 text-brand-700 ring-brand-200'
                        : 'bg-slate-100 text-slate-600 ring-slate-200'
                    }
                  >
                    {user.role === 'ADMIN' ? 'مدیر' : 'کارمند'}
                  </Badge>
                }
              />
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">موبایل</dt>
                  <dd className="ltr-numbers font-medium text-slate-700">
                    {user.phone ? toPersianDigits(user.phone) : '—'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">نمایشگاه فعال</dt>
                  <dd className="font-medium text-slate-700">{user.activeExhibition?.name ?? '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">ثبت‌شده</dt>
                  <dd className="font-medium text-slate-700">
                    {toPersianDigits(user.registeredVisits ?? 0)} مراجعه
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">آخرین ورود</dt>
                  <dd className="font-medium text-slate-700">
                    {user.lastLoginAt ? formatJalaliDate(user.lastLoginAt) : 'بدون ورود'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">وضعیت</dt>
                  <dd>
                    <Badge
                      tone={
                        user.isActive
                          ? 'bg-emerald-100 text-emerald-700 ring-emerald-200'
                          : 'bg-rose-100 text-rose-700 ring-rose-200'
                      }
                    >
                      {user.isActive ? 'فعال' : 'غیرفعال'}
                    </Badge>
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Pencil className="size-4" />}
                  onClick={() => openEdit(user)}
                >
                  ویرایش
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<KeyRound className="size-4" />}
                  onClick={() => {
                    setResetTarget(user);
                    setNewPassword('');
                  }}
                >
                  رمز جدید
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  loading={toggleActive.isPending}
                  onClick={() => toggleActive.mutate(user)}
                >
                  {user.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Trash2 className="size-4" />}
                  onClick={() => setDeleting(user)}
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
        title={editing ? 'ویرایش کارمند' : 'کارمند جدید'}
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="نام کاربری" required>
            <TextInput
              dir="ltr"
              className="text-start"
              value={form.username}
              disabled={Boolean(editing)}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
            />
          </Field>
          <Field label="نام و نام خانوادگی" required>
            <TextInput
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
            />
          </Field>
          <Field label="شماره موبایل">
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
          {!editing ? (
            <Field label="رمز عبور اولیه" required hint="حداقل ۸ کاراکتر شامل حرف و عدد">
              <TextInput
                type="text"
                dir="ltr"
                className="text-start"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
              />
            </Field>
          ) : null}
          <Field label="نقش">
            <SelectInput value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              <option value="EMPLOYEE">کارمند غرفه</option>
              <option value="ADMIN">مدیر سیستم</option>
            </SelectInput>
          </Field>
          <Field label="نمایشگاه فعال">
            <SelectInput
              value={form.activeExhibitionId}
              onChange={(event) => setForm({ ...form, activeExhibitionId: event.target.value })}
            >
              <option value="">بدون انتخاب</option>
              {(exhibitions ?? []).map((exhibition) => (
                <option key={exhibition.id} value={exhibition.id}>
                  {exhibition.name}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
      </Modal>

      <Modal
        open={Boolean(resetTarget)}
        onClose={() => setResetTarget(null)}
        title="بازنشانی رمز عبور"
        description={resetTarget?.fullName}
        size="sm"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setResetTarget(null)}>
              انصراف
            </Button>
            <Button loading={resetPasswordMutation.isPending} onClick={() => resetPasswordMutation.mutate()}>
              بازنشانی
            </Button>
          </div>
        }
      >
        <Field label="رمز عبور جدید" required hint="حداقل ۸ کاراکتر شامل حرف و عدد">
          <TextInput
            type="text"
            dir="ltr"
            className="text-start"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </Field>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="حذف کارمند"
        message={<p>حساب «{deleting?.fullName}» حذف می‌شود. سوابق ثبت‌شده او باقی می‌ماند.</p>}
        loading={deleteMutation.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
      />
    </div>
  );
}
