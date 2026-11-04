import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Download, FileText, Users } from 'lucide-react';
import { api, ApiRequestError, buildQuery, downloadFile } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useVisitorList } from '../hooks/useVisitorList';
import { VisitorFilterBar } from '../components/visitors/VisitorFilterBar';
import { VisitorTable } from '../components/visitors/VisitorTable';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';
import { Card, ErrorState, Spinner } from '../components/ui/Display';
import { ConfirmDialog } from '../components/ui/Modal';
import type { Exhibition, User, VisitListItem } from '../types';
import type { SortKey } from '../components/visitors/VisitorTable';

export default function AllVisitors() {
  const list = useVisitorList();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<VisitListItem | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (visit: VisitListItem) => {
      await api.delete('/api/visitors/visits/' + visit.id);
    },
    onSuccess: () => {
      toast.success('Ù…Ø±Ø§Ø¬Ø¹Ù‡ Ø­Ø°Ù Ø´Ø¯');
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      queryClient.invalidateQueries({ queryKey: ['visitor'] });
    },
    onError: (err) =>
      toast.error('Ø­Ø°Ù Ù†Ø§Ù…ÙˆÙÙ‚ Ø¨ÙˆØ¯', err instanceof ApiRequestError ? err.message : 'Ø®Ø·Ø§ÛŒ Ù†Ø§Ù…Ø´Ø®Øµ'),
  });

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
              onDelete={setDeleting}
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

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Ø­Ø°Ù Ù…Ø±Ø§Ø¬Ø¹Ù‡"
        message={<p>Ù…Ø±Ø§Ø¬Ø¹Ù‡Ù” «{deleting?.fullName}» Ø¯Ø± {deleting?.exhibition.name} Ø­Ø°Ù Ù…ÛŒâ€ŒØ´ÙˆØ¯. Ø³Ø§ÛŒØ± Ù…Ø±Ø§Ø¬Ø¹Ù‡â€ŒÙ‡Ø§ Ùˆ Ø³ÙˆØ§Ø¨Ù‚ Ø¢Ù† Ø¨Ø§Ø²Ø¯ÛŒØ¯Ú©Ù†Ù†Ø¯Ù‡ Ø¨Ø§Ù‚ÛŒ Ù…ÛŒâ€ŒÙ…Ø§Ù†Ø¯.</p>}
        loading={deleteMutation.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
      />
    </div>
  );
}
