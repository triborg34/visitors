import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarDays, Flame, UserCheck, UserPlus, Users } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, CardHeader, ErrorState, Spinner, StatCard } from '../../components/ui/Display';
import { Button } from '../../components/ui/Button';
import { formatNumber } from '../../lib/format';
import type { Stats } from '../../types';

export default function EmployeeDashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['stats', 'summary'],
    queryFn: async () => (await api.get<Stats>('/api/reports/summary')).data,
  });

  if (isLoading) return <Spinner label="در حال بارگذاری…" />;
  if (error) return <ErrorState message="دریافت آمار ناموفق بود." />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">داشبورد کارمند</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          کار اصلی شما ثبت سریع بازدیدکنندگان است؛ آمارها خلاصه وضعیت شما را نشان می‌دهند.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="ثبت‌شده امروز"
          value={formatNumber(stats?.todayCount ?? 0)}
          icon={<CalendarDays className="size-6" />}
          tone="emerald"
        />
        <StatCard title="کل مراجعات من" value={formatNumber(stats?.totalVisits ?? 0)} icon={<Users className="size-6" />} />
        <StatCard
          title="سرنخ‌های داغ"
          value={formatNumber(stats?.hotLeads ?? 0)}
          icon={<Flame className="size-6" />}
          tone="rose"
        />
        <StatCard
          title="در انتظار پیگیری"
          value={formatNumber(stats?.awaitingFollowUp ?? 0)}
          icon={<UserCheck className="size-6" />}
          tone="amber"
        />
      </div>

      <Card>
        <CardHeader title="شروع سریع" description="ثبت یک بازدیدکننده کمتر از یک دقیقه طول می‌کشد." />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" variant="primary" icon={<UserPlus className="size-5" />}>
            <Link to="/app/new">ثبت بازدیدکننده جدید</Link>
          </Button>
          <Button size="lg" variant="outline">
            <Link to="/app/visitors">جست‌وجو در بازدیدکنندگان من</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}