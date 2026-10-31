import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ExternalLink,
  MessageCircle,
  Plug,
  Save,
  Trash2,
} from 'lucide-react';
import { api, ApiRequestError } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import { Badge, Card, CardHeader, ErrorState, Spinner } from '../../components/ui/Display';
import { Button } from '../../components/ui/Button';
import { Field, TextInput, TextArea } from '../../components/ui/Field';
import type { MessagingConnection } from '../../types';

const STATUS_LABELS: Record<string, string> = {
  UNTESTED: 'آزمایش نشده',
  CONNECTED: 'متصل',
  FAILED: 'ناموفق',
  DISABLED: 'غیرفعال',
};

const STATUS_TONES: Record<string, string> = {
  UNTESTED: 'bg-slate-100 text-slate-600 ring-slate-200',
  CONNECTED: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  FAILED: 'bg-rose-100 text-rose-700 ring-rose-200',
  DISABLED: 'bg-amber-100 text-amber-700 ring-amber-200',
};

interface PlatformHints {
  tokenLabel: string;
  tokenPlaceholder: string;
  botIdLabel: string;
  botIdPlaceholder: string;
  noteText: string;
}

const HINTS: Record<string, PlatformHints> = {
  WHATSAPP: {
    tokenLabel: 'توکن دسترسی دائمی (Access Token)',
    tokenPlaceholder: 'EAAG...',
    botIdLabel: 'شناسه شماره تلفن (Phone Number ID)',
    botIdPlaceholder: '106540352242922',
    noteText:
      'از Meta Developer Dashboard → WhatsApp → API Setup دریافت می‌شود. برای توکن دائمی از Business Settings → System Users استفاده کنید.',
  },
  TELEGRAM: {
    tokenLabel: 'توکن ربات',
    tokenPlaceholder: '123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
    botIdLabel: '',
    botIdPlaceholder: '',
    noteText: 'از @BotFather در تلگرام با دستور /newbot دریافت می‌شود.',
  },
  BALE: {
    tokenLabel: 'توکن ربات (Bot API)',
    tokenPlaceholder: 'توکن دریافتی از @Bot_Father',
    botIdLabel: 'شناسه ربات برای سفیر (Bot ID)',
    botIdPlaceholder: '123456789',
    noteText:
      'برای Bot API از @Bot_Father در بله توکن بگیرید. برای سرویس سفیر (ارسال به شماره) باید در business.ble.ir ثبت‌نام کنید.',
  },
  EITAA: {
    tokenLabel: 'توکن ایتایار',
    tokenPlaceholder: 'توکن دریافتی از eitaayar.ir',
    botIdLabel: '',
    botIdPlaceholder: '',
    noteText:
      'برای دریافت توکن باید در eitaayar.ir ثبت‌نام کنید. کاربر باید ابتدا با ربات گفتگو را شروع کند.',
  },
};

function ConnectionCard({
  conn,
  onTest,
  onRemove,
  testPending,
}: {
  conn: MessagingConnection;
  onTest: () => void;
  onRemove: () => void;
  testPending: boolean;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const hints = HINTS[conn.platform] ?? HINTS.TELEGRAM;
  const [token, setToken] = useState('');
  const [botId, setBotId] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    setToken('');
    setBotId(conn.botId ?? '');
    setNote(conn.note ?? '');
  }, [conn.botId, conn.note]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/api/messaging/${conn.platform}`, {
        apiToken: token || undefined,
        botId: botId || undefined,
        note: note || undefined,
      });
    },
    onSuccess: () => {
      toast.success(`${conn.info.name}: تنظیمات ذخیره شد`);
      queryClient.invalidateQueries({ queryKey: ['messaging'] });
      setToken('');
    },
    onError: (err) =>
      toast.error('ذخیره ناموفق بود', err instanceof ApiRequestError ? err.message : 'خطای نامشخص'),
  });

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <MessageCircle className="size-4 text-slate-400" />
            {conn.info.name}
          </span>
        }
        description={'پلتفرم: ' + conn.platform}
        action={
          <div className="flex items-center gap-2">
            <Badge tone={STATUS_TONES[conn.status] ?? STATUS_TONES.UNTESTED}>
              {STATUS_LABELS[conn.status] ?? conn.status}
            </Badge>
            {conn.testedAt ? (
              <span className="text-xs text-slate-400">
                آخرین آزمایش: {new Date(conn.testedAt).toLocaleDateString('fa-IR')}
              </span>
            ) : null}
          </div>
        }
      />

      <div className="space-y-3">
        {hints.tokenLabel ? (
          <Field label={hints.tokenLabel} hint={conn.apiToken ? 'توکن ذخیره شده — برای تغییر مقدار جدید وارد کنید.' : undefined}>
            <TextInput
              type="password"
              dir="ltr"
              className="text-start"
              placeholder={hints.tokenPlaceholder}
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </Field>
        ) : null}

        {hints.botIdLabel ? (
          <Field label={hints.botIdLabel}>
            <TextInput
              dir="ltr"
              className="text-start"
              placeholder={hints.botIdPlaceholder}
              value={botId}
              onChange={(e) => setBotId(e.target.value)}
            />
          </Field>
        ) : null}

        <Field label="یادداشت">
          <TextArea
            rows={2}
            placeholder={hints.noteText}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="primary"
            icon={<Save className="size-4" />}
            loading={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            ذخیره
          </Button>
          <Button
            size="sm"
            variant="success"
            icon={<Plug className="size-4" />}
            loading={testPending}
            disabled={!conn.apiToken && !token}
            onClick={onTest}
          >
            آزمایش اتصال
          </Button>
          {conn.id ? (
            <Button size="sm" variant="ghost" icon={<Trash2 className="size-4" />} onClick={onRemove}>
              حذف
            </Button>
          ) : null}
          <a
            href={conn.info.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <ExternalLink className="size-4" />
            مستندات
          </a>
        </div>
      </div>
    </Card>
  );
}

export default function Connections() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: connections, isLoading, error } = useQuery({
    queryKey: ['messaging'],
    queryFn: async () => (await api.get<MessagingConnection[]>('/api/messaging')).data,
  });

  const testMutation = useMutation({
    mutationFn: async (platform: string) =>
      (await api.post<{ status: string; error: string | null }>(`/api/messaging/test`, { platform })).data,
    onSuccess: (result) => {
      if (result.status === 'CONNECTED') {
        toast.success('اتصال با موفقیت برقرار شد');
      } else {
        toast.error('اتصال ناموفق بود', result.error ?? 'خطای نامشخص');
      }
      queryClient.invalidateQueries({ queryKey: ['messaging'] });
    },
    onError: (err) =>
      toast.error('آزمایش ناموفق بود', err instanceof ApiRequestError ? err.message : 'خطای نامشخص'),
  });

  const removeMutation = useMutation({
    mutationFn: async (platform: string) => {
      await api.delete(`/api/messaging/${platform}`);
    },
    onSuccess: () => {
      toast.success('اتصال حذف شد');
      queryClient.invalidateQueries({ queryKey: ['messaging'] });
    },
    onError: (err) =>
      toast.error('حذف ناموفق بود', err instanceof ApiRequestError ? err.message : 'خطای نامشخص'),
  });

  if (isLoading) return <Spinner label="در حال بارگذاری اتصال‌ها…" />;
  if (error) return <ErrorState message="دریافت اتصال‌ها ناموفق بود." />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">اتصال پیام‌رسان‌ها</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          توکن و تنظیمات هر پیام‌رسان را وارد کنید و اتصال را آزمایش کنید.
          راهنمای گام‌به‌گام در{' '}
          <a href="/docs/CONNECTIONS.md" className="text-brand-700 underline hover:text-brand-800" target="_blank" rel="noopener noreferrer">
            docs/CONNECTIONS.md
          </a>{' '}
          موجود است.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {(connections ?? []).map((conn) => (
          <ConnectionCard
            key={conn.platform}
            conn={conn}
            testPending={testMutation.isPending && testMutation.variables === conn.platform}
            onTest={() => testMutation.mutate(conn.platform)}
            onRemove={() => removeMutation.mutate(conn.platform)}
          />
        ))}
      </div>
    </div>
  );
}
