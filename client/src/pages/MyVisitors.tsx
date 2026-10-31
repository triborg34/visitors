import { useQuery } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useVisitorList } from '../hooks/useVisitorList';
import { VisitorFilterBar } from '../components/visitors/VisitorFilterBar';
import { VisitorTable } from '../components/visitors/VisitorTable';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';
import { Card, ErrorState, Spinner } from '../components/ui/Display';
import type { Exhibition } from '../types';
import type { SortKey } from '../components/visitors/VisitorTable';

export default function MyVisitors() {
  const list = useVisitorList('mine');
  const navigate = useNavigate();

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
    </div>
  );
}
