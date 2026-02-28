'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from 'recharts';

export interface RevenueDataPoint {
  month: string;
  year: number;
  revenue: number;
  invoiceCount: number;
  label: string;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  onPeriodChange: (period: string) => void;
  activePeriod: string;
}

function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `£${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  }
  return `£${value}`;
}

function formatFullCurrency(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 mb-1">{label}</p>
        <p className="text-sm text-[#FF3300]">
          Revenue: {formatFullCurrency(payload[0]?.value || 0)}
        </p>
        {payload[1] && (
          <p className="text-sm text-gray-500">
            Invoices: {payload[1]?.value || 0}
          </p>
        )}
      </div>
    );
  }
  return null;
};

const CHART_PERIODS = [
  { key: '6m', label: '6 Months' },
  { key: '12m', label: '12 Months' },
  { key: 'ytd', label: 'Year to Date' },
];

export function RevenueChart({ data, onPeriodChange, activePeriod }: RevenueChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {CHART_PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => onPeriodChange(p.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activePeriod === p.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
          No revenue data available for this period
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
              />
              <YAxis
                yAxisId="revenue"
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <YAxis yAxisId="count" orientation="right" hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                yAxisId="revenue"
                dataKey="revenue"
                fill="#FF3300"
                radius={[4, 4, 0, 0]}
                barSize={32}
                opacity={0.85}
              />
              <Line
                yAxisId="count"
                type="monotone"
                dataKey="invoiceCount"
                stroke="#9CA3AF"
                strokeWidth={2}
                dot={{ fill: '#9CA3AF', r: 3 }}
                activeDot={{ fill: '#6B7280', r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
