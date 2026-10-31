import { Filter, RotateCcw, Search } from 'lucide-react';
import { SelectInput } from '../ui/Field';
import { Button } from '../ui/Button';
import { JalaliDatePicker } from '../JalaliDatePicker';
import {
  FOLLOW_UP_LABELS,
  PLATFORM_LABELS,
  PRIORITY_LABELS,
  REQUEST_TYPE_LABELS,
} from '../../lib/format';
import type { Exhibition, User } from '../../types';
import type { VisitorFilterState } from '../../hooks/useVisitorList';

interface VisitorFilterBarProps {
  filters: VisitorFilterState;
  onChange: (key: keyof VisitorFilterState, value: string) => void;
  onReset: () => void;
  exhibitions: Exhibition[];
  employees?: User[];
  showEmployee?: boolean;
}

export function VisitorFilterBar({
  filters,
  onChange,
  onReset,
  exhibitions,
  employees,
  showEmployee = false,
}: VisitorFilterBarProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Filter className="size-4" />
          فیلترها
        </p>
        <Button variant="ghost" size="sm" icon={<RotateCcw className="size-4" />} onClick={onReset}>
          پاک کردن
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={filters.search}
            onChange={(event) => onChange('search', event.target.value)}
            placeholder="نام، موبایل یا شرکت…"
            className="field-input ps-9 py-2.5 text-sm"
          />
        </div>

        <SelectInput
          value={filters.exhibitionId}
          onChange={(event) => onChange('exhibitionId', event.target.value)}
          className="py-2.5 text-sm"
        >
          <option value="">همه نمایشگاه‌ها</option>
          {exhibitions.map((exhibition) => (
            <option key={exhibition.id} value={exhibition.id}>
              {exhibition.name}
            </option>
          ))}
        </SelectInput>

        {showEmployee ? (
          <SelectInput
            value={filters.employeeId}
            onChange={(event) => onChange('employeeId', event.target.value)}
            className="py-2.5 text-sm"
          >
            <option value="">همه کارمندان</option>
            {(employees ?? []).map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.fullName}
              </option>
            ))}
          </SelectInput>
        ) : null}

        <SelectInput
          value={filters.requestType}
          onChange={(event) => onChange('requestType', event.target.value)}
          className="py-2.5 text-sm"
        >
          <option value="">همه انواع درخواست</option>
          {Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectInput>

        <SelectInput
          value={filters.priority}
          onChange={(event) => onChange('priority', event.target.value)}
          className="py-2.5 text-sm"
        >
          <option value="">همه اولویت‌ها</option>
          {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectInput>

        <SelectInput
          value={filters.followUpStatus}
          onChange={(event) => onChange('followUpStatus', event.target.value)}
          className="py-2.5 text-sm"
        >
          <option value="">همه وضعیت‌های پیگیری</option>
          {Object.entries(FOLLOW_UP_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectInput>

        <SelectInput
          value={filters.platform}
          onChange={(event) => onChange('platform', event.target.value)}
          className="py-2.5 text-sm"
        >
          <option value="">همه پلتفرم‌ها</option>
          {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectInput>

        <SelectInput
          value={filters.marketingConsent}
          onChange={(event) => onChange('marketingConsent', event.target.value)}
          className="py-2.5 text-sm"
        >
          <option value="">همه وضعیت‌های رضایت</option>
          <option value="true">دارای رضایت بازاریابی</option>
          <option value="false">بدون رضایت بازاریابی</option>
        </SelectInput>

        <div>
          <JalaliDatePicker
            value={filters.from || undefined}
            onChange={(iso) => onChange('from', iso)}
            placeholder="از تاریخ"
          />
        </div>

        <div>
          <JalaliDatePicker
            value={filters.to || undefined}
            onChange={(iso) => onChange('to', iso)}
            placeholder="تا تاریخ"
          />
        </div>
      </div>
    </div>
  );
}
