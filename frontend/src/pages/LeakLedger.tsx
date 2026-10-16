import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart as RechartsPie,
  Pie
} from 'recharts';
import { fetchOverview, fetchFindings } from '../lib/api';
import { OverviewData, Finding } from '../types';
import { MetricCard } from '../components/MetricCard';
import { VerdictBadge } from '../components/VerdictBadge';
import { MoneyBar } from '../components/MoneyBar';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { formatMoney, formatNumber, formatPercent } from '../lib/formatters';
import { STATUS_COLORS, CHART_TOOLTIP_STYLE, CHART_ITEM_STYLE, CHART_LABEL_STYLE, CHART_AXIS_COLOR } from '../lib/constants';

export const LeakLedger: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ovData, fData] = await Promise.all([fetchOverview(), fetchFindings()]);
      setOverview(ovData);
      setFindings(fData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load Leak Ledger data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoadingSkeleton rows={6} />;
  if (error || !overview) return <ErrorDisplay message={error || 'No overview data found'} onRetry={loadData} />;

  const maxImpact = Math.max(...findings.map((f) => f.money_impact), 1);
  const realCount = overview.findings_summary?.verdict_counts['REAL'] || 0;
  const noiseCount = overview.findings_summary?.verdict_counts['NOISE'] || 0;

  const chartFindings = findings.map((f) => ({
    id: f.id,
    name: `${f.id}: ${f.title.length > 28 ? f.title.substring(0, 26) + '…' : f.title}`,
    money: f.money_impact,
    verdict: f.verdict,
  }));

  const donutData = overview.status_breakdown.map((s) => ({
    name: s.status,
    value: s.revenue,
    count: s.count,
    color: STATUS_COLORS[s.status] || '#576580',
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-ink-900 dark:text-white tracking-tight">
          Leak Ledger
        </h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400 max-w-2xl">
          Ranked financial leaks with mathematical proof, noise detection, and corrective actions.
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Order Value"
          value={formatMoney(overview.total_order_value)}
          subtext={`${formatNumber(overview.total_orders)} transactions recorded`}
          icon={DollarSign}
        />
        <MetricCard
          label="Non-Completed Value"
          value={formatMoney(overview.non_completed_value)}
          subtext={`${formatNumber(overview.non_completed_orders)} cancelled, returned or pending`}
          icon={AlertTriangle}
          trend="negative"
        />
        <MetricCard
          label="Total Measured Leak"
          value={formatMoney(overview.findings_summary.total_measured_leak)}
          subtext="Across all verified findings"
          icon={TrendingUp}
          trend="warning"
        />
        <MetricCard
          label="Honesty Tally"
          value={`${realCount} Real / ${noiseCount} Noise`}
          subtext={`${overview.findings_summary.total_findings} findings evaluated`}
          badge={
            <div className="flex items-center gap-1.5">
              <span className="tag bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-500 border-success-100 dark:border-success-500/20 text-2xs">
                {realCount} Real
              </span>
              <span className="tag bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-400 border-ink-200 dark:border-ink-700 text-2xs">
                {noiseCount} Noise
              </span>
            </div>
          }
        />
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Impact Bar Chart */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-brand-500" />
              <h2 className="card-title">Financial Impact by Finding</h2>
            </div>
            <span className="text-2xs text-ink-400 font-mono">
              Ranked by $ exposure
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartFindings} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                <XAxis
                  type="number"
                  tickFormatter={(val) => formatMoney(val)}
                  stroke={CHART_AXIS_COLOR}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="id"
                  stroke={CHART_AXIS_COLOR}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  formatter={(val: number) => [val === 0 ? 'Not measurable' : formatMoney(val), 'Impact']}
                  labelFormatter={(id) => {
                    const found = chartFindings.find((item) => item.id === id);
                    return found ? found.name : String(id);
                  }}
                  contentStyle={CHART_TOOLTIP_STYLE}
                  itemStyle={CHART_ITEM_STYLE}
                  labelStyle={CHART_LABEL_STYLE}
                />
                <Bar dataKey="money" radius={[0, 6, 6, 0]}>
                  {chartFindings.map((entry, index) => {
                    const isNoise = entry.verdict.includes('NOISE');
                    const isReal = entry.verdict.includes('REAL');
                    const fill = isReal ? '#3366FF' : isNoise ? '#7D89A1' : '#F59E0B';
                    return <Cell key={`cell-${index}`} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Donut */}
        <div className="card p-5 flex flex-col justify-between">
          <div>
            <h2 className="card-title mb-1">Order Value by Status</h2>
            <p className="card-subtitle mb-3">Transaction revenue distribution</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={68}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [formatMoney(value), 'Revenue']}
                  contentStyle={CHART_TOOLTIP_STYLE}
                  itemStyle={CHART_ITEM_STYLE}
                  labelStyle={CHART_LABEL_STYLE}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-ink-100 dark:border-ink-800">
            {donutData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <div className="text-xs truncate">
                  <span className="font-medium text-ink-700 dark:text-ink-300">{d.name}</span>
                  <span className="block font-mono text-2xs text-ink-400">
                    {formatMoney(d.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ranked Findings */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-ink-100 dark:border-ink-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="card-title">Ranked Findings</h2>
            <p className="card-subtitle mt-0.5">
              Click any finding for evidence, mathematical proofs, and recommended actions.
            </p>
          </div>
          <span className="text-2xs text-ink-400 font-medium">
            Sorted by rank & impact
          </span>
        </div>

        <div className="divide-y divide-ink-100 dark:divide-ink-800/60">
          {findings.map((f) => {
            return (
              <div
                key={f.id}
                onClick={() => navigate(`/findings/${f.id.toLowerCase()}`)}
                className="px-5 py-4 hover:bg-ink-50/80 dark:hover:bg-ink-800/30 transition-colors cursor-pointer group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Left: Rank, ID, Title */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-400 flex items-center justify-center font-mono text-2xs font-bold shrink-0 mt-0.5">
                      {f.rank}
                    </span>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-2xs font-bold text-brand-600 dark:text-brand-400">
                          {f.id}
                        </span>
                        <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                          {f.title}
                        </h3>
                      </div>
                      <p className="text-xs text-ink-500 dark:text-ink-400 line-clamp-1">
                        <span className="font-semibold text-ink-600 dark:text-ink-300">Action: </span>
                        {f.action}
                      </p>
                    </div>
                  </div>

                  {/* Right */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-5 shrink-0 self-end lg:self-center">
                    <MoneyBar amount={f.money_impact} maxAmount={maxImpact} />
                    <div className="min-w-[140px]">
                      <VerdictBadge verdict={f.verdict} size="sm" />
                    </div>
                    <span className="hidden md:inline-block tag bg-ink-50 dark:bg-ink-800 text-ink-600 dark:text-ink-400 border-ink-200 dark:border-ink-700 text-2xs whitespace-nowrap">
                      {f.confidence}
                    </span>
                    <div className="text-ink-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
