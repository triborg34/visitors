import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, Filter } from 'lucide-react';
import { api, buildQuery, downloadFile } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import { BarChartCard, PieChartCard, TrendChart } from '../../components/charts/Charts';
import { Card, ErrorState, Spinner, StatCard } from '../../components/ui/Display';
import { Button } from '../../components/ui/Button';
import { SelectInput } from '../../components/ui/Field';
import { JalaliDatePicker } from '../../components/JalaliDatePicker';
import {
  FOLLOW_UP_LABELS,
  PLATFORM_LABELS,
  PRIORITY_LABELS,
  REQUEST_TYPE_LABELS,
  formatNumber,
  formatJalaliDate,
} from '../../lib/format';
import type { Exhibition, Stats } from '../../types';

export default function Reports() {
  const toast = useToast();
  const [exhibitionId, setExhibitionId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [days, setDays] = useState('30');

  const { data: exhibitions } = useQuery({
    queryKey: ['exhibitions', 'all'],
    queryFn: async () => (await api.get<Exhibition[]>('/api/exhibitions')).data,
  });

  const filters = buildQuery({ exhibitionId, from, to });

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['stats', 'summary', filters],
    queryFn: async () => (await api.get<Stats>('/api/reports/summary' + filters)).data,
  });

  const { data: trend } = useQuery({
    queryKey: ['stats', 'trend', exhibitionId, days],
    queryFn: async () =>
      (
        await api.get<Array<{ date: string; count: number }>>(
          '/api/reports/trend?days=' + days + (exhibitionId ? '&exhibitionId=' + exhibitionId : ''),
        )
      ).data,
  });

  const handleExportXlsx = async () => {
    try {
      toast.info('در حال ساخت فایل اکسل…');
      await downloadFile('/api/export/visitors.xlsx' + filters, 'report.xlsx');
      toast.success('فایل اکسل آماده شد');
    } catch (err) {
      toast.error('دریافت فایل اکسل ناموفق بود', (err as Error).message);
    }
  };

  const handleExportPdf = async () => {
    try {
      toast.info('در حال ساخت فایل PDF…');
      await downloadFile('/api/export/visitors.pdf' + filters, 'report.pdf');
      toast.success('فایل PDF آماده شد');
    } catch (err) {
      toast.error('دریافت فایل PDF ناموفق بود', (err as Error).message);
    }
  };

  if (isLoading) return <Spinner label="در حال محاسبه گزارش‌ها…" />;
  if (error) return <ErrorState message="دریافت گزارش‌ها ناموفق بود." />;
  if (!stats) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">گزارش‌ها و آمار</h1>
          <p className="mt-0.5 text-sm text-slate-500">گزارش‌ها بر اساس نمایشگاه و بازه زمانی فیلتر می‌شوند.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={<FileText className="size-4" />} onClick={handleExportPdf}>
            خروجی PDF
          </Button>
          <Button variant="primary" icon={<Download className="size-4" />} onClick={handleExportXlsx}>
            خروجی اکسل گزارش
          </Button>
        </div>
      </div>

      <Card>
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Filter className="size-4" />
          فیلترهای گزارش
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SelectInput value={exhibitionId} onChange={(event) => setExhibitionId(event.target.value)}>
            <option value="">همه نمایشگاه‌ها</option>
            {(exhibitions ?? []).map((exhibition) => (
              <option key={exhibition.id} value={exhibition.id}>
                {exhibition.name}
              </option>
            ))}
          </SelectInput>
          <JalaliDatePicker value={from || undefined} onChange={setFrom} placeholder="از تاریخ" />
          <JalaliDatePicker value={to || undefined} onChange={setTo} placeholder="تا تاریخ" />
          <SelectInput value={days} onChange={(event) => setDays(event.target.value)}>
            <option value="7">روند ۷ روز اخیر</option>
            <option value="30">روند ۳۰ روز اخیر</option>
            <option value="90">روند ۹۰ روز اخیر</option>
            <option value="365">روند یک سال اخیر</option>
          </SelectInput>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="کل مراجعات" value={formatNumber(stats.totalVisits)} />
        <StatCard title="بازدیدکننده یکتا" value={formatNumber(stats.uniqueVisitors)} tone="violet" />
        <StatCard title="سرنخ داغ" value={formatNumber(stats.hotLeads)} tone="rose" />
        <StatCard
          title="نرخ رضایت بازاریابی"
          value={formatNumber(stats.consentRate) + '٪'}
          tone="emerald"
        />
      </div>

      <TrendChart data={trend ?? []} labelKey="date" />

      <div className="grid gap-4 lg:grid-cols-2">
        <BarChartCard
          title="مراجعات به تفکیک نمایشگاه"
          data={stats.byExhibition.map((item) => ({ name: item.name, count: item.count }))}
          nameKey="name"
        />
        <BarChartCard
          title="مراجعات به تفکیک کارمند"
          data={stats.byEmployee.map((item) => ({ name: item.name, count: item.count }))}
          nameKey="name"
        />
        <PieChartCard
          title="توزیع نوع درخواست"
          data={stats.byRequestType.map((item) => ({
            name: REQUEST_TYPE_LABELS[item.key] ?? item.key,
            count: item.count,
          }))}
          nameKey="name"
        />
        <PieChartCard
          title="توزیع وضعیت پیگیری"
          data={stats.byFollowUpStatus.map((item) => ({
            name: FOLLOW_UP_LABELS[item.key] ?? item.key,
            count: item.count,
          }))}
          nameKey="name"
        />
        <PieChartCard
          title="توزیع اولویت مشتری"
          data={stats.byPriority.map((item) => ({
            name: PRIORITY_LABELS[item.key] ?? item.key,
            count: item.count,
          }))}
          nameKey="name"
        />
        <PieChartCard
          title="پلتفرم پیام ترجیحی"
          data={stats.byPlatform.map((item) => ({
            name: PLATFORM_LABELS[item.key] ?? item.name,
            count: item.count,
          }))}
          nameKey="name"
        />
      </div>

      <Card>
        <p className="text-sm font-semibold text-slate-700">وضعیت پیام‌ها در بازه انتخابی</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {stats.messageStatus.length === 0 ? (
            <p className="text-sm text-slate-500">داده‌ای برای نمایش وجود ندارد.</p>
          ) : (
            stats.messageStatus.map((item) => (
              <div key={item.key} className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-lg font-bold text-slate-800">{formatNumber(item.count)}</p>
                <p className="mt-0.5 text-xs text-slate-500">{item.key}</p>
              </div>
            ))
          )}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          تاریخ گزارش: {formatJalaliDate(new Date())}
        </p>
      </Card>
    </div>
  );
}
