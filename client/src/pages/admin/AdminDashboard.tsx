import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Flame,
  MessageSquareText,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { api } from '../../lib/api';
import { BarChartCard, PieChartCard, TrendChart } from '../../components/charts/Charts';
import { Card, CardHeader, ErrorState, Spinner, StatCard } from '../../components/ui/Display';
import { Button } from '../../components/ui/Button';
import {
  FOLLOW_UP_LABELS,
  PLATFORM_LABELS,
  PRIORITY_LABELS,
  REQUEST_TYPE_LABELS,
  formatNumber,
  toPersianDigits,
} from '../../lib/format';
import type { Stats } from '../../types';

export default function AdminDashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['stats', 'summary'],
    queryFn: async () => (await api.get<Stats>('/api/reports/summary')).data,
  });

  const { data: trend } = useQuery({
    queryKey: ['stats', 'trend'],
    queryFn: async () => (await api.get<Array<{ date: string; count: number }>>('/api/reports/trend?days=30')).data,
  });

  if (isLoading) return <Spinner label="در حال بارگذاری آمار…" />;
  if (error) return <ErrorState message="دریافت آمار ناموفق بود." />;
  if (!stats) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">داشبورد مدیریتی</h1>
          <p className="mt-0.5 text-sm text-slate-500">نمای کلی بازدیدکنندگان، سرنخ‌ها و پیگیری‌ها</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Link to="/admin/reports">گزارش‌های تفصیلی</Link>
          </Button>
          <Button variant="primary">
            <Link to="/admin/visitors">همه بازدیدکنندگان</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="کل بازدیدکنندگان"
          value={formatNumber(stats.totalVisits)}
          icon={<Users className="size-6" />}
          hint={formatNumber(stats.uniqueVisitors) + ' بازدیدکننده یکتا'}
        />
        <StatCard
          title="ثبت‌شده امروز"
          value={formatNumber(stats.todayCount)}
          icon={<CalendarDays className="size-6" />}
          tone="emerald"
        />
        <StatCard
          title="سرنخ‌های داغ"
          value={formatNumber(stats.hotLeads)}
          icon={<Flame className="size-6" />}
          tone="rose"
        />
        <StatCard
          title="در انتظار پیگیری"
          value={formatNumber(stats.awaitingFollowUp)}
          icon={<UserCheck className="size-6" />}
          tone="amber"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="نرخ رضایت بازاریابی"
          value={formatNumber(stats.consentRate) + '٪'}
          icon={<MessageSquareText className="size-6" />}
          tone="violet"
          hint={formatNumber(stats.consentGranted) + ' رضایت ثبت‌شده'}
        />
        <StatCard
          title="نمایشگاه‌های فعال"
          value={formatNumber(stats.byExhibition.length)}
          icon={<TrendingUp className="size-6" />}
        />
        <StatCard
          title="کارمندان ثبت‌کننده"
          value={formatNumber(stats.byEmployee.length)}
          icon={<Users className="size-6" />}
          tone="violet"
        />
      </div>

      <TrendChart data={trend ?? []} />

      <div className="grid gap-4 lg:grid-cols-2">
        <BarChartCard
          title="بازدیدکنندگان به تفکیک نمایشگاه"
          data={stats.byExhibition.map((item) => ({ name: item.name, count: item.count }))}
          nameKey="name"
        />
        <BarChartCard
          title="بازدیدکنندگان به تفکیک کارمند"
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
        <CardHeader
          title="وضعیت پیام‌ها"
          description="فقط پیام‌هایی که کارمند ارسال آن‌ها را تأیید کرده «ارسال‌شده» محسوب می‌شوند."
        />
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {stats.messageStatus.length === 0 ? (
            <p className="text-sm text-slate-500">هنوز پیامی آماده نشده است.</p>
          ) : (
            stats.messageStatus.map((item) => (
              <div key={item.key} className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-lg font-bold text-slate-800">{toPersianDigits(item.count)}</p>
                <p className="mt-0.5 text-xs text-slate-500">{item.key}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
