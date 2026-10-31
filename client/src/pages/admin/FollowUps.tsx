import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ClipboardList, Search } from 'lucide-react';
import { api, ApiRequestError, buildQuery } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import { Badge, Card, EmptyState, ErrorState, Spinner } from '../../components/ui/Display';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { SelectInput } from '../../components/ui/Field';
import { JalaliDatePicker } from '../../components/JalaliDatePicker';
import { FOLLOW_UP_LABELS, FOLLOW_UP_TONES, formatJalaliDate, toPersianDigits } from '../../lib/format';
import type { FollowUp, PageMeta, User } from '../../types';

export default function FollowUps() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [search, setSearch] = useState('');
  const [nextBefore, setNextBefore] = useState('');
  const [page, setPage] = useState(1);

  const queryString = buildQuery({
    status,
    employeeId,
    search,
    nextFollowUpBefore: nextBefore,
    page,
    pageSize: 20,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['followups', queryString],
    queryFn: async () => {
      const response = await api.get<FollowUp[]>('/api/visitors/followups' + queryString);
      return { items: response.data, meta: response.meta };
    },
  });

  const { data: employees } = useQuery({
    queryKey: ['employees', 'options'],
    queryFn: async () => (await api.get<User[]>('/api/reports/employees')).data,
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; status: string }) => {
      await api.patch('/api/visitors/followups/' + payload.id, { status: payload.status });
    },
    onSuccess: () => {
      toast.success('وضعیت پیگیری به‌روزرسانی شد');
      queryClient.invalidateQueries({ queryKey: ['followups'] });
    },
    onError: (err) =>
      toast.error('به‌روزرسانی ناموفق بود', err instanceof ApiRequestError ? err.message : 'خطای نامشخص'),
  });

  const meta: PageMeta = data?.meta ?? { page: 1, pageSize: 20, total: 0, totalPages: 0 };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">مدیریت پیگیری مشتریان</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          مشتریانی که پس از نمایشگاه نیاز به تماس دارند را از اینجا پیگیری کنید.
        </p>
      </div>

      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="نام، موبایل یا شرکت…"
              className="field-input ps-9 py-2.5 text-sm"
            />
          </div>
          <SelectInput
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="py-2.5 text-sm"
          >
            <option value="">همه وضعیت‌ها</option>
            {Object.entries(FOLLOW_UP_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectInput>
          <SelectInput
            value={employeeId}
            onChange={(event) => {
              setEmployeeId(event.target.value);
              setPage(1);
            }}
            className="py-2.5 text-sm"
          >
            <option value="">همه کارمندان</option>
            {(employees ?? []).map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.fullName}
              </option>
            ))}
          </SelectInput>
          <JalaliDatePicker
            value={nextBefore || undefined}
            onChange={(iso) => {
              setNextBefore(iso);
              setPage(1);
            }}
            placeholder="پیگیری تا تاریخ"
          />
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <Spinner />
        ) : error ? (
          <ErrorState message="دریافت پیگیری‌ها ناموفق بود." />
        ) : !data?.items.length ? (
          <div className="p-5">
            <EmptyState
              title="پیگیری‌ای یافت نشد"
              description="فیلترها را تغییر دهید یا از صفحه جزئیات بازدیدکننده پیگیری جدید ثبت کنید."
              icon={<ClipboardList className="size-8" />}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-right text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                    <th className="px-4 py-3 font-medium">بازدیدکننده</th>
                    <th className="px-4 py-3 font-medium">نمایشگاه</th>
                    <th className="px-4 py-3 font-medium">وضعیت</th>
                    <th className="px-4 py-3 font-medium">آخرین تماس</th>
                    <th className="px-4 py-3 font-medium">پیگیری بعدی</th>
                    <th className="px-4 py-3 font-medium">مسئول</th>
                    <th className="px-4 py-3 font-medium">یادداشت</th>
                    <th className="px-4 py-3 font-medium">تغییر وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((item) => (
                    <tr key={item.id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link
                          to={'/admin/visitors/' + item.visit?.visitor.id}
                          className="font-medium text-brand-700 hover:underline"
                        >
                          {item.visit?.visitor.fullName}
                        </Link>
                        <p className="ltr-numbers text-xs text-slate-500">
                          {toPersianDigits(item.visit?.visitor.mobile ?? '')}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.visit?.exhibition.name}</td>
                      <td className="px-4 py-3">
                        <Badge tone={FOLLOW_UP_TONES[item.status]}>{FOLLOW_UP_LABELS[item.status]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {item.lastContactAt ? formatJalaliDate(item.lastContactAt) : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {item.nextFollowUpAt ? formatJalaliDate(item.nextFollowUpAt) : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.assignedEmployee?.fullName ?? '—'}</td>
                      <td className="max-w-64 px-4 py-3 text-xs leading-6 text-slate-500">{item.note ?? '—'}</td>
                      <td className="px-4 py-3">
                        <SelectInput
                          value={item.status}
                          onChange={(event) =>
                            updateMutation.mutate({ id: item.id, status: event.target.value })
                          }
                          className="min-w-40 py-1.5 text-xs"
                        >
                          {Object.entries(FOLLOW_UP_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </SelectInput>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
          </>
        )}
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['followups'] })}>
          به‌روزرسانی فهرست
        </Button>
      </div>
    </div>
  );
}