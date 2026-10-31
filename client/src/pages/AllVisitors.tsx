import { useQuery } from '@tanstack/react-query';
import { Download, FileText, Users } from 'lucide-react';
import { api, buildQuery, downloadFile } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useVisitorList } from '../hooks/useVisitorList';
import { VisitorFilterBar } from '../components/visitors/VisitorFilterBar';
import { VisitorTable } from '../components/visitors/VisitorTable';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';
import { Card, ErrorState, Spinner } from '../components/ui/Display';
import type { Exhibition, User } from '../types';
import type { SortKey } from '../components/visitors/VisitorTable';

export default function AllVisitors() {
  const list = useVisitorList();
  const toast = useToast();

  const { data: exhibitions } = useQuery({
    queryKey: ['exhibitions', 'all'],
    queryFn: async () => (await api.get<Exhibition[]>('/api/exhibitions')).data,
  });

  const { data: employees } = useQuery({
    queryKey: ['employees', 'options'],
    queryFn: async () => (await api.get<User[]>('/api/reports/employees')).data,
  });

  const buildFilterQuery = () =>
    buildQuery({
      search: list.filters.search,
      exhibitionId: list.filters.exhibitionId,
      employeeId: list.filters.employeeId,
      priority: list.filters.priority,
      requestType: list.filters.requestType,
      followUpStatus: list.filters.followUpStatus,
      platform: list.filters.platform,
      marketingConsent: list.filters.marketingConsent,
      from: list.filters.from,
      to: list.filters.to,
    });

  const handleExportXlsx = async () => {
    try {
      toast.info('در حال ساخت فایل اکسل…');
      await downloadFile('/api/export/visitors.xlsx' + buildFilterQuery(), 'visitors.xlsx');
      toast.success('فایل اکسل آماده شد', 'دانلود به‌صورت خودکار آغاز شد.');
    } catch (error) {
      toast.error('دریافت فایل اکسل ناموفق بود', (error as Error).message);
    }
  };

  const handleExportPdf = async () => {
    try {
      toast.info('در حال ساخت فایل PDF…');
      await downloadFile('/api/export/visitors.pdf' + buildFilterQuery(), 'visitors.pdf');
      toast.success('فایل PDF آماده شد', 'دانلود به‌صورت خودکار آغاز شد.');
    } catch (error) {
      toast.error('دریافت فایل PDF ناموفق بود', (error as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">همه بازدیدکنندگان</h1>
          <p className="mt-0.5 text-sm text-slate-500">جست‌وجو، فیلتر و خروجی اکسل/PDF با فیلترهای فعال.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={<FileText className="size-4" />} onClick={handleExportPdf}>
            خروجی PDF
          </Button>
          <Button variant="primary" icon={<Download className="size-4" />} onClick={handleExportXlsx}>
            خروجی اکسل
          </Button>
        </div>
      </div>

      <VisitorFilterBar
        filters={list.filters}
        onChange={(key, value) => list.setFilter(key, value)}
        onReset={list.reset}
        exhibitions={exhibitions ?? []}
        employees={employees ?? []}
        showEmployee
      />

      <Card className="overflow-hidden p-0">
        {list.error ? (
          <ErrorState message="دریافت اطلاعات با خطا مواجه شد." onRetry={() => list.refetch()} />
        ) : list.isLoading ? (
          <Spinner label="در حال بارگذاری بازدیدکنندگان…" />
        ) : (
          <>
            <VisitorTable
              items={list.items}
              onSort={list.toggleSort}
              sortKey={list.filters.sortBy as SortKey}
              sortDir={list.filters.sortDir}
              showEmployee
              emptyAction={
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <Users className="size-4" />
                  فیلترها را تغییر دهید.
                </p>
              }
            />
            <Pagination
              page={list.meta.page}
              totalPages={list.meta.totalPages}
              total={list.meta.total}
              onChange={(page) => list.setFilter('page', page)}
            />
          </>
        )}
      </Card>
    </div>
  );
}
