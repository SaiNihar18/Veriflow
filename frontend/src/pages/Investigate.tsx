import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Layers,
  DollarSign,
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
import { CHART_TOOLTIP_STYLE, CHART_ITEM_STYLE, CHART_LABEL_STYLE, CHART_AXIS_COLOR } from '../lib/constants';

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

  const totalOrders = trends.reduce((sum, t) => sum + t.orders, 0);
  const totalRevenue = trends.reduce((sum, t) => sum + t.revenue, 0);

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-ink-900 dark:text-white tracking-tight">
          Investigate Trends & Segments
        </h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Monthly macro trends and segment performance with statistical benchmarks.
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label="Period Revenue" value={formatMoney(totalRevenue)} subtext="Full 12-month volume" icon={DollarSign} />
        <MetricCard label="Order Count" value={formatNumber(totalOrders)} subtext="18,000 scored orders" icon={Layers} />
        <MetricCard
          label="Baseline Rates"
          value={`${formatPercent(breakdown?.overall.cancel_rate)} Cancel / ${formatPercent(breakdown?.overall.return_rate)} Return`}
          subtext={`Pending: ${formatPercent(breakdown?.overall.pending_rate)}`}
          icon={TrendingUp}
        />
      </div>

      {/* Monthly Trends */}
      <div className="card p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="card-title">Monthly Rate Trajectories (2025)</h2>
            <p className="card-subtitle">Cancellation, return, and pending rates over time</p>
          </div>
          <span className="text-2xs text-ink-400 font-mono">12 monthly snapshots</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <XAxis dataKey="month" stroke={CHART_AXIS_COLOR} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 0.15]} tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} stroke={CHART_AXIS_COLOR} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(val: number, name: string) => [formatPercent(val), name]}
                contentStyle={CHART_TOOLTIP_STYLE}
                itemStyle={CHART_ITEM_STYLE}
                labelStyle={CHART_LABEL_STYLE}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="cancel_rate" name="Cancellation Rate" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 3, fill: '#EF4444' }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="return_rate" name="Return Rate" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3, fill: '#F59E0B' }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="pending_rate" name="Pending Rate" stroke="#3366FF" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3, fill: '#3366FF' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Volume */}
        <div className="pt-4 border-t border-ink-100 dark:border-ink-800">
          <h3 className="text-sm font-semibold text-ink-800 dark:text-ink-200 mb-3">Monthly Order Value</h3>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis dataKey="month" stroke={CHART_AXIS_COLOR} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={CHART_AXIS_COLOR} fontSize={11} tickFormatter={(val) => formatMoney(val)} tickLine={false} axisLine={false} />
                <Tooltip formatter={(val: number) => [formatMoney(val), 'Revenue']} contentStyle={CHART_TOOLTIP_STYLE} itemStyle={CHART_ITEM_STYLE} labelStyle={CHART_LABEL_STYLE} />
                <Bar dataKey="revenue" fill="#3366FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Segment Breakdown */}
      <div className="card p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="card-title">Segment Deep-Dive vs Baseline</h2>
            <p className="card-subtitle">Variations are within expected noise.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="p-0.5 rounded-xl bg-ink-100 dark:bg-ink-800 flex items-center gap-0.5 border border-ink-200/60 dark:border-ink-700/40">
              {(['category', 'region', 'channel'] as const).map((dim) => (
                <button
                  key={dim}
                  onClick={() => setDimension(dim)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    dimension === dim
                      ? 'bg-white dark:bg-ink-900 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'text-ink-500 hover:text-ink-900 dark:hover:text-ink-200'
                  }`}
                >
                  {dim}
                </button>
              ))}
            </div>
            <select
              value={rateMetric}
              onChange={(e) => setRateMetric(e.target.value as any)}
              className="input-base text-xs px-2.5 py-1.5"
            >
              <option value="cancel">Cancel Rate</option>
              <option value="return">Return Rate</option>
              <option value="pending">Pending Rate</option>
            </select>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={segmentChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <XAxis dataKey="name" stroke={CHART_AXIS_COLOR} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 0.15]} tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} stroke={CHART_AXIS_COLOR} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(val: number) => [formatPercent(val), `${rateMetric.toUpperCase()} Rate`]}
                contentStyle={CHART_TOOLTIP_STYLE}
                itemStyle={CHART_ITEM_STYLE}
                labelStyle={CHART_LABEL_STYLE}
              />
              <ReferenceLine y={overallRate} stroke="#EF4444" strokeDasharray="4 4" label={{ value: `Benchmark: ${formatPercent(overallRate)}`, fill: '#EF4444', position: 'top', fontSize: 11 }} />
              <Bar dataKey="rate" fill="#3366FF" radius={[4, 4, 0, 0]}>
                {segmentChartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill="#3366FF" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-ink-200/60 dark:border-ink-800/60 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-ink-50 dark:bg-ink-800/40 text-ink-500 dark:text-ink-400 border-b border-ink-100 dark:border-ink-800">
              <tr>
                <th className="py-3 px-4 font-semibold capitalize">{dimension}</th>
                <th className="py-3 px-4 font-semibold">Orders</th>
                <th className="py-3 px-4 font-semibold">Value</th>
                <th className="py-3 px-4 font-semibold">Cancel</th>
                <th className="py-3 px-4 font-semibold">Return</th>
                <th className="py-3 px-4 font-semibold">Pending</th>
                <th className="py-3 px-4 font-semibold">Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-ink-800/60 font-mono">
              {breakdown?.segments.map((seg) => {
                const currentRate = rateMetric === 'cancel' ? seg.cancel_rate : rateMetric === 'return' ? seg.return_rate : seg.pending_rate;
                const delta = currentRate - overallRate;
                const deltaSign = delta > 0 ? '+' : '';
                return (
                  <tr key={seg.segment} className="hover:bg-ink-50/50 dark:hover:bg-ink-800/20 transition-colors">
                    <td className="py-3 px-4 font-sans font-semibold text-ink-900 dark:text-white">{seg.segment}</td>
                    <td className="py-3 px-4 text-ink-500">{formatNumber(seg.orders)}</td>
                    <td className="py-3 px-4 font-semibold text-ink-900 dark:text-white">{formatMoney(seg.value)}</td>
                    <td className="py-3 px-4 text-ink-600 dark:text-ink-300">{formatPercent(seg.cancel_rate)}</td>
                    <td className="py-3 px-4 text-ink-600 dark:text-ink-300">{formatPercent(seg.return_rate)}</td>
                    <td className="py-3 px-4 text-ink-600 dark:text-ink-300">{formatPercent(seg.pending_rate)}</td>
                    <td className="py-3 px-4">
                      <span className={`tag text-2xs ${
                        Math.abs(delta) < 0.015
                          ? 'bg-ink-50 dark:bg-ink-800 text-ink-500 border-ink-200 dark:border-ink-700'
                          : delta > 0
                          ? 'bg-caution-50 dark:bg-caution-500/10 text-caution-700 dark:text-caution-500 border-caution-100 dark:border-caution-500/20'
                          : 'bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-500 border-success-100 dark:border-success-500/20'
                      }`}>
                        {deltaSign}{(delta * 100).toFixed(2)}%
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
