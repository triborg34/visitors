import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatNumber, toPersianDigits } from '../../lib/format';

const PALETTE = ['#1f6bc0', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9', '#64748b', '#ec4899'];

function PersianTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-right shadow-lg">
      {label !== undefined ? (
        <p className="mb-1 text-xs font-semibold text-slate-700">{toPersianDigits(String(label))}</p>
      ) : null}
      {payload.map((entry, index) => (
        <p key={index} className="text-xs text-slate-600">
          {entry.name}: <span className="font-bold text-slate-800">{formatNumber(Number(entry.value ?? 0))}</span>
        </p>
      ))}
    </div>
  );
}

export function BarChartCard({
  title,
  data,
  nameKey,
  valueKey = 'count',
  height = 260,
}: {
  title: string;
  data: Array<Record<string, string | number>>;
  nameKey: string;
  valueKey?: string;
  height?: number;
}) {
  return (
    <div className="card p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">{title}</h3>
      <div style={{ height }} dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey={nameKey} tick={{ fontSize: 11, fill: '#64748b' }} interval={0} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
            <Tooltip content={<PersianTooltip />} cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey={valueKey} name={title} radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={PALETTE[index % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function PieChartCard({
  title,
  data,
  nameKey,
  height = 260,
}: {
  title: string;
  data: Array<Record<string, string | number>>;
  nameKey: string;
  height?: number;
}) {
  return (
    <div className="card p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">{title}</h3>
      <div style={{ height }} dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey={nameKey}
              innerRadius="45%"
              outerRadius="75%"
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={PALETTE[index % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip content={<PersianTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={48}
              formatter={(value: string) => <span className="text-xs text-slate-600">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TrendChart({
  data,
  labelKey = 'date',
  valueKey = 'count',
  height = 280,
}: {
  data: Array<Record<string, string | number>>;
  labelKey?: string;
  valueKey?: string;
  height?: number;
}) {
  return (
    <div className="card p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">روند ثبت بازدیدکنندگان</h3>
      <div style={{ height }} dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey={labelKey} tick={{ fontSize: 11, fill: '#64748b' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
            <Tooltip content={<PersianTooltip />} />
            <Line
              type="monotone"
              dataKey={valueKey}
              name="تعداد"
              stroke="#1f6bc0"
              strokeWidth={2.5}
              dot={{ r: 2.5 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
