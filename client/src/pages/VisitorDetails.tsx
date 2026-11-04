import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  MessageSquareText,
  Phone,
  Send,
  User,
} from 'lucide-react';
import { api, ApiRequestError } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { Card, CardHeader, Badge, EmptyState, ErrorState, Spinner } from '../components/ui/Display';
import { Button } from '../components/ui/Button';
import { Field, SelectInput, TextArea } from '../components/ui/Field';
import { JalaliDatePicker } from '../components/JalaliDatePicker';
import {
  FOLLOW_UP_LABELS,
  FOLLOW_UP_TONES,
  GENDER_LABELS,
  MESSAGE_STATUS_LABELS,
  MESSAGE_STATUS_TONES,
  PLATFORM_LABELS,
  PRIORITY_LABELS,
  PRIORITY_TONES,
  REQUEST_TYPE_LABELS,
  formatJalaliDate,
  formatJalaliDateTime,
  toPersianDigits,
} from '../lib/format';
import type { FollowUp, MessageLog, MessageTemplate, Visitor } from '../types';

export default function VisitorDetails() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState('CONTACTED');
  const [note, setNote] = useState('');
  const [nextFollowUpAt, setNextFollowUpAt] = useState('');
  const [templateKey, setTemplateKey] = useState('THANK_YOU');
  const [platform, setPlatform] = useState('BALE');

  const { data: visitor, isLoading, error } = useQuery({
    queryKey: ['visitor', id],
    queryFn: async () => (await api.get<Visitor>('/api/visitors/' + id)).data,
    enabled: Boolean(id),
  });

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => (await api.get<MessageTemplate[]>('/api/templates')).data,
  });

  const latestVisit = visitor?.visits?.[0];

  const followUpMutation = useMutation({
    mutationFn: async () => {
      if (!latestVisit) throw new Error('مراجعه‌ای یافت نشد.');
      await api.post('/api/visitors/visits/' + latestVisit.id + '/followups', {
        status,
        note: note.trim() ? note.trim() : undefined,
        nextFollowUpAt: nextFollowUpAt ? nextFollowUpAt : undefined,
      });
    },
    onSuccess: () => {
      toast.success('پیگیری ثبت شد');
      setNote('');
      setNextFollowUpAt('');
      queryClient.invalidateQueries({ queryKey: ['visitor', id] });
    },
    onError: (err) =>
      toast.error('ثبت پیگیری ناموفق بود', err instanceof ApiRequestError ? err.message : 'خطای نامشخص'),
  });

  const prepareMutation = useMutation({
    mutationFn: async () => {
      if (!latestVisit) throw new Error('مراجعه‌ای یافت نشد.');
      const response = await api.post<{ log: MessageLog; deepLink: string | null; sendError: string | null }>(
        '/api/visitors/visits/' + latestVisit.id + '/messages/prepare',
        { templateKey, platform },
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['visitor', id] });
      if (platform === 'BALE') {
        if (data.sendError) toast.error('ارسال پیام بله ناموفق بود', data.sendError);
        else toast.success('پیام بله از طریق سفیر ارسال شد');
        return;
      }
      if (data.deepLink) {
        window.open(data.deepLink, '_blank', 'noopener');
        toast.info('پیام آماده و پیام‌رسان باز شد', 'پس از ارسال، گزینه «تأیید ارسال» را بزنید.');
      } else {
        toast.info('پیام آماده شد', 'برای این پلتفرم لینک مستقیمی وجود ندارد؛ متن را کپی کنید.');
      }
    },
    onError: (err) =>
      toast.error('آماده‌سازی پیام ناموفق بود', err instanceof ApiRequestError ? err.message : 'خطای نامشخص'),
  });

  const markSent = async (logId: string) => {
    try {
      await api.post('/api/visitors/visits/' + latestVisit!.id + '/messages/' + logId + '/confirm');
      toast.success('ارسال پیام تأیید شد');
      queryClient.invalidateQueries({ queryKey: ['visitor', id] });
    } catch (err) {
      toast.error('تأیید ارسال ناموفق بود', err instanceof ApiRequestError ? err.message : 'خطای نامشخص');
    }
  };

  if (isLoading) return <Spinner label="در حال بارگذاری…" />;
  if (error) return <ErrorState message="بازدیدکننده یافت نشد یا دسترسی ندارید." />;
  if (!visitor) return null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{visitor.fullName}</h1>
        <p className="mt-0.5 text-sm text-slate-500">تاریخچهٔ کامل مراجعات این بازدیدکننده</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="اطلاعات پایه" icon={<User className="size-5" />} />
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">شماره موبایل</dt>
              <dd className="ltr-numbers font-semibold text-slate-800">
                {toPersianDigits(visitor.mobile)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">شرکت</dt>
              <dd className="font-semibold text-slate-800">{visitor.company ?? '—'}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">جنسیت</dt>
              <dd className="font-semibold text-slate-800">{GENDER_LABELS[visitor.gender]}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">اولین ثبت</dt>
              <dd className="font-semibold text-slate-800">{formatJalaliDate(visitor.createdAt)}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">تعداد مراجعات</dt>
              <dd className="font-semibold text-slate-800">{toPersianDigits(visitor.visits?.length ?? 0)}</dd>
            </div>
          </dl>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="پیگیری و ارتباط" icon={<ClipboardList className="size-5" />} />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Field label="وضعیت پیگیری">
                <SelectInput value={status} onChange={(event) => setStatus(event.target.value)}>
                  {Object.entries(FOLLOW_UP_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="پیگیری بعدی">
                <JalaliDatePicker value={nextFollowUpAt || undefined} onChange={setNextFollowUpAt} />
              </Field>
              <Field label="یادداشت پیگیری">
                <TextArea
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="خلاصه تماس یا توافقات…"
                />
              </Field>
              <Button
                fullWidth
                loading={followUpMutation.isPending}
                onClick={() => followUpMutation.mutate()}
              >
                ثبت پیگیری
              </Button>
            </div>

            <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">آماده‌سازی پیام</p>
              <Field label="قالب پیام">
                <SelectInput value={templateKey} onChange={(event) => setTemplateKey(event.target.value)}>
                  {(templates ?? []).map((template) => (
                    <option key={template.key} value={template.key}>
                      {template.title}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="پلتفرم">
                <SelectInput value={platform} onChange={(event) => setPlatform(event.target.value)}>
                  {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Button
                fullWidth
                variant="secondary"
                icon={<Send className="size-4" />}
                loading={prepareMutation.isPending}
                disabled={!latestVisit}
                onClick={() => {
                  if (platform === 'BALE' && !window.confirm(`پیام از طریق سفیر به شمارهٔ ${visitor.mobile} ارسال شود؟`)) return;
                  prepareMutation.mutate();
                }}
              >
                {platform === 'BALE' ? 'ارسال مستقیم با سفیر' : 'آماده‌سازی و باز کردن پیام‌رسان'}
              </Button>
              <p className="text-xs leading-6 text-slate-500">
                {platform === 'BALE'
                  ? 'با تأیید شما، پیام از طریق سرویس سفیر به شمارهٔ ثبت‌شده ارسال می‌شود.'
                  : <>
                سامانه پیام را ارسال نمی‌کند؛ فقط متن را آماده و پیام‌رسان را باز می‌کند. ارسال را خودتان
                تأیید کنید.
                  </>}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-0">
        <div className="border-b border-slate-100 p-5">
          <CardHeader title="تاریخچه مراجعات" icon={<Building2 className="size-5" />} />
        </div>
        <div className="divide-y divide-slate-100">
          {(visitor.visits ?? []).map((visit) => (
            <div key={visit.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800">{visit.exhibition.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    ثبت‌کننده: {visit.employee.fullName} — {formatJalaliDateTime(visit.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={PRIORITY_TONES[visit.priority]}>{PRIORITY_LABELS[visit.priority]}</Badge>
                  <Badge tone={FOLLOW_UP_TONES[visit.followUpStatus]}>
                    {FOLLOW_UP_LABELS[visit.followUpStatus]}
                  </Badge>
                  <Badge>{REQUEST_TYPE_LABELS[visit.requestType]}</Badge>
                </div>
              </div>

              {visit.notes ? <p className="mt-3 text-sm leading-7 text-slate-600">{visit.notes}</p> : null}

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="mb-2 text-sm font-semibold text-slate-700">سوابق پیگیری</p>
                  {visit.followUps?.length ? (
                    <ul className="space-y-2">
                      {visit.followUps.map((item) => (
                        <li key={item.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <Badge tone={FOLLOW_UP_TONES[item.status]}>{FOLLOW_UP_LABELS[item.status]}</Badge>
                            <span className="text-xs text-slate-500">{formatJalaliDate(item.createdAt)}</span>
                          </div>
                          {item.note ? <p className="mt-1.5 leading-6 text-slate-600">{item.note}</p> : null}
                          {item.nextFollowUpAt ? (
                            <p className="mt-1 text-xs text-brand-700">
                              پیگیری بعدی: {formatJalaliDate(item.nextFollowUpAt)}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">پیگیری‌ای ثبت نشده است.</p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <MessageSquareText className="size-4" />
                    تاریخچه پیام‌ها
                  </p>
                  {visit.messageLogs?.length ? (
                    <ul className="space-y-2">
                      {visit.messageLogs.map((log) => (
                        <li key={log.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Badge tone={MESSAGE_STATUS_TONES[log.status]}>
                              {MESSAGE_STATUS_LABELS[log.status]}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {PLATFORM_LABELS[log.platform]} — {formatJalaliDate(log.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1.5 line-clamp-3 whitespace-pre-line text-xs leading-6 text-slate-600">
                            {log.body}
                          </p>
                          {log.status !== 'CONFIRMED_SENT' && log.status !== 'API_SENT' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="mt-2"
                              icon={<CheckCircle2 className="size-4" />}
                              onClick={() => markSent(log.id)}
                            >
                              تأیید ارسال
                            </Button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">پیامی آماده نشده است.</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!visitor.visits?.length ? (
            <div className="p-5">
              <EmptyState title="مراجعه‌ای ثبت نشده است" />
            </div>
          ) : null}
        </div>
      </Card>

      <p className="flex items-center gap-2 text-xs text-slate-500">
        <Phone className="size-3.5" />
        اطلاعات تماس بازدیدکننده فقط برای کارمند ثبت‌کننده و مدیران قابل مشاهده است.
      </p>
    </div>
  );
}
