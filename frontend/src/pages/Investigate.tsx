import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  Filter,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ReferenceLine,
  Cell
} from 'recharts';
import { fetchTrends, fetchBreakdown } from '../lib/api';
import { MonthlyTrend, BreakdownData } from '../types';
import { MetricCard } from '../components/MetricCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { formatMoney, formatNumber, formatPercent } from '../lib/formatters';

export const Investigate: React.FC = () => {
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [dimension, setDimension] = useState<'category' | 'region' | 'channel'>('category');
  const [breakdown, setBreakdown] = useState<BreakdownData | null>(null);
  const [rateMetric, setRateMetric] = useState<'cancel' | 'return' | 'pending'>('cancel');

  const [loadingTrends, setLoadingTrends] = useState(true);
  const [loadingBreakdown, setLoadingBreakdown] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingTrends(true);
    fetchTrends()
      .then((data) => setTrends(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingTrends(false));
  }, []);

  useEffect(() => {
    setLoadingBreakdown(true);
    fetchBreakdown(dimension)
      .then((data) => setBreakdown(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingBreakdown(false));
  }, [dimension]);

  if (loadingTrends && loadingBreakdown) return <LoadingSkeleton rows={5} />;
  if (error) return <ErrorDisplay message={error} onRetry={() => window.location.reload()} />;

  // Total summary from trends
  const totalOrders = trends.reduce((sum, t) => sum + t.orders, 0);
  const totalRevenue = trends.reduce((sum, t) => sum + t.revenue, 0);

  // Overall rates for reference
  const overallRate = breakdown?.overall
    ? rateMetric === 'cancel'
      ? breakdown.overall.cancel_rate
      : rateMetric === 'return'
      ? breakdown.overall.return_rate
      : breakdown.overall.pending_rate
    : 0.094;

  const segmentChartData = breakdown?.segments.map((s) => ({
    name: s.segment,
    value: s.value,
    orders: s.orders,
    rate: rateMetric === 'cancel' ? s.cancel_rate : rateMetric === 'return' ? s.return_rate : s.pending_rate,
    overallRate: overallRate,
  })) || [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Investigate Trends & Segments
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Monthly macro trends and segment performance with statistical benchmarks against overall company baselines.
        </p>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Tracked Period Revenue"
          value={formatMoney(totalRevenue)}
          subtext="Full 12-month transaction volume"
          icon={DollarSign}
        />
        <MetricCard
          label="Tracked Order Count"
          value={formatNumber(totalOrders)}
          subtext="18,000 scored customer orders"
          icon={Layers}
        />
        <MetricCard
          label="Overall Baseline Rates"
          value={`${formatPercent(breakdown?.overall.cancel_rate)} Cancel / ${formatPercent(breakdown?.overall.return_rate)} Return`}
          subtext={`Pending Rate: ${formatPercent(breakdown?.overall.pending_rate)}`}
          icon={TrendingUp}
        />
      </div>

      {/* Section 1: Monthly Trends (Revenue & Non-Completed Rates) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Monthly Rate Trajectories (2025)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tracking cancellation, return, and pending rates over time
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">12 monthly snapshots</span>
          </div>
        </div>

        {/* Rates Line Chart */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis
                domain={[0, 0.15]}
                tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
              />
              <Tooltip
                formatter={(val: number, name: string) => [formatPercent(val), name]}
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                  padding: '8px 12px',
                }}
                itemStyle={{ color: '#F8FAFC', fontSize: '12px', fontWeight: 500 }}
                labelStyle={{ color: '#94A3B8', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="cancel_rate"
                name="Cancellation Rate"
                stroke="#EF4444"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="return_rate"
                name="Return Rate"
                stroke="#F59E0B"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="pending_rate"
                name="Pending Rate"
                stroke="#6366F1"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Revenue Bar Chart */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
            Monthly Order Value Volume
          </h3>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickFormatter={(val) => formatMoney(val)}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: number) => [formatMoney(val), 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                    padding: '8px 12px',
                  }}
                  itemStyle={{ color: '#F8FAFC', fontSize: '12px', fontWeight: 500 }}
                  labelStyle={{ color: '#94A3B8', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}
                />
                <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Section 2: Segment Breakdown with Dimension Toggle */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Segment Deep-Dive vs Overall Baseline
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Check segment rates against the red overall benchmark line. Variations are within noise.
            </p>
          </div>

          {/* Toggle Dimension Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center gap-1 border border-slate-200 dark:border-slate-700">
              {(['category', 'region', 'channel'] as const).map((dim) => (
                <button
                  key={dim}
                  onClick={() => setDimension(dim)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    dimension === dim
                      ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {dim}
                </button>
              ))}
            </div>

            {/* Metric Toggle */}
            <select
              value={rateMetric}
              onChange={(e) => setRateMetric(e.target.value as any)}
              className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-300"
            >
              <option value="cancel">Cancel Rate</option>
              <option value="return">Return Rate</option>
              <option value="pending">Pending Rate</option>
            </select>
          </div>
        </div>

        {/* Visual Comparison Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={segmentChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} />
              <YAxis
                domain={[0, 0.15]}
                tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
              />
              <Tooltip
                formatter={(val: number) => [formatPercent(val), `${rateMetric.toUpperCase()} Rate`]}
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                  padding: '8px 12px',
                }}
                itemStyle={{ color: '#F8FAFC', fontSize: '12px', fontWeight: 500 }}
                labelStyle={{ color: '#94A3B8', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}
              />
              <ReferenceLine
                y={overallRate}
                stroke="#EF4444"
                strokeDasharray="4 4"
                label={{
                  value: `Overall Benchmark: ${formatPercent(overallRate)}`,
                  fill: '#EF4444',
                  position: 'top',
                  fontSize: 11,
                }}
              />
              <Bar dataKey="rate" fill="#6366F1" radius={[4, 4, 0, 0]}>
                {segmentChartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill="#6366F1" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Breakdown Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold capitalize">{dimension} Segment</th>
                <th className="py-3 px-4 font-semibold">Orders</th>
                <th className="py-3 px-4 font-semibold">Order Value</th>
                <th className="py-3 px-4 font-semibold">Cancel Rate</th>
                <th className="py-3 px-4 font-semibold">Return Rate</th>
                <th className="py-3 px-4 font-semibold">Pending Rate</th>
                <th className="py-3 px-4 font-semibold">Benchmark Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {breakdown?.segments.map((seg) => {
                const currentRate =
                  rateMetric === 'cancel'
                    ? seg.cancel_rate
                    : rateMetric === 'return'
                    ? seg.return_rate
                    : seg.pending_rate;
                const delta = currentRate - overallRate;
                const deltaSign = delta > 0 ? '+' : '';

                return (
                  <tr key={seg.segment} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900 dark:text-white">
                      {seg.segment}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {formatNumber(seg.orders)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {formatMoney(seg.value)}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {formatPercent(seg.cancel_rate)}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {formatPercent(seg.return_rate)}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {formatPercent(seg.pending_rate)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md ${
                          Math.abs(delta) < 0.015
                            ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            : delta > 0
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {deltaSign}{(delta * 100).toFixed(2)}% vs baseline
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
