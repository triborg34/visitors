import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, ApiRequestError } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useVisitorList } from '../hooks/useVisitorList';
import { VisitorFilterBar } from '../components/visitors/VisitorFilterBar';
import { VisitorTable } from '../components/visitors/VisitorTable';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';
import { Card, ErrorState, Spinner } from '../components/ui/Display';
import { ConfirmDialog } from '../components/ui/Modal';
import type { Exhibition, VisitListItem } from '../types';
import type { SortKey } from '../components/visitors/VisitorTable';

export default function MyVisitors() {
  const list = useVisitorList('mine');
  const navigate = useNavigate();
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">بازدیدکنندگان من</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            فقط مراجعه‌هایی که خودتان ثبت کرده‌اید نمایش داده می‌شود.
          </p>
        </div>
        <Button variant="primary" icon={<UserPlus className="size-4" />} onClick={() => navigate('/app/new')}>
          ثبت بازدیدکننده جدید
        </Button>
      </div>

      <VisitorFilterBar
        filters={list.filters}
        onChange={(key, value) => list.setFilter(key, value)}
        onReset={list.reset}
        exhibitions={exhibitions ?? []}
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
              showEmployee={false}
              onDelete={setDeleting}
              emptyAction={
                <Button
                  variant="primary"
                  size="sm"
                  icon={<UserPlus className="size-4" />}
                  onClick={() => navigate('/app/new')}
                >
                  ثبت بازدیدکننده
                </Button>
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
        title={'\u062d\u0630\u0641 \u0645\u0631\u0627\u062c\u0639\u0647'}
        message={<p>{'\u0645\u0631\u0627\u062c\u0639\u0647\u0654 \u00ab'}{deleting?.fullName}{'\u00bb \u062f\u0631 '}{deleting?.exhibition.name}{' \u062d\u0630\u0641 \u0645\u06cc\u200c\u0634\u0648\u062f. \u0633\u0627\u06cc\u0631 \u0645\u0631\u0627\u062c\u0639\u0647\u200c\u0647\u0627 \u0648 \u0633\u0648\u0627\u0628\u0642 \u0622\u0646 \u0628\u0627\u0632\u062f\u06cc\u062f\u06a9\u0646\u0646\u062f\u0647 \u0628\u0627\u0642\u06cc \u0645\u06cc\u200c\u0645\u0627\u0646\u062f.'}</p>}
        loading={deleteMutation.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
      />
    </div>
  );
}
