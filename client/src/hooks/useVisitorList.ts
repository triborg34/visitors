import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, buildQuery } from '../lib/api';
import type { PageMeta, VisitListItem } from '../types';

export interface VisitorFilterState {
  search: string;
  exhibitionId: string;
  employeeId: string;
  priority: string;
  requestType: string;
  followUpStatus: string;
  platform: string;
  marketingConsent: string;
  from: string;
  to: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

const INITIAL: VisitorFilterState = {
  search: '',
  exhibitionId: '',
  employeeId: '',
  priority: '',
  requestType: '',
  followUpStatus: '',
  platform: '',
  marketingConsent: '',
  from: '',
  to: '',
  page: 1,
  pageSize: 20,
  sortBy: 'createdAt',
  sortDir: 'desc',
};

export function useVisitorList(scope?: 'mine') {
  const [filters, setFilters] = useState<VisitorFilterState>(INITIAL);

  const setFilter = useCallback(<K extends keyof VisitorFilterState>(key: K, value: VisitorFilterState[K]) => {
    setFilters((current) => ({ ...current, [key]: value, page: key === 'page' ? (value as number) : 1 }));
  }, []);

  const reset = useCallback(() => setFilters(INITIAL), []);

  const queryString = useMemo(
    () =>
      buildQuery({
        search: filters.search,
        exhibitionId: filters.exhibitionId,
        employeeId: filters.employeeId,
        priority: filters.priority,
        requestType: filters.requestType,
        followUpStatus: filters.followUpStatus,
        platform: filters.platform,
        marketingConsent: filters.marketingConsent,
        from: filters.from,
        to: filters.to,
        page: filters.page,
        pageSize: filters.pageSize,
        sortBy: filters.sortBy,
        sortDir: filters.sortDir,
      }),
    [filters],
  );

  const query = useQuery({
    queryKey: ['visitors', scope ?? 'all', queryString],
    queryFn: async () => {
      const response = await api.get<VisitListItem[]>('/api/visitors' + queryString);
      return { items: response.data, meta: response.meta };
    },
    placeholderData: (previous) => previous,
  });

  const toggleSort = useCallback((key: string) => {
    setFilters((current) => ({
      ...current,
      sortBy: key,
      sortDir: current.sortBy === key && current.sortDir === 'desc' ? 'asc' : 'desc',
      page: 1,
    }));
  }, []);

  return {
    filters,
    setFilter,
    reset,
    toggleSort,
    items: query.data?.items ?? [],
    meta: (query.data?.meta ?? { page: 1, pageSize: 20, total: 0, totalPages: 0 }) as PageMeta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
