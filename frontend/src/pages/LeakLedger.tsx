import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp,
  PieChart as PieIcon,
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
import { STATUS_COLORS } from '../lib/constants';

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

  // Max money impact for relative scaling
  const maxImpact = Math.max(...findings.map((f) => f.money_impact), 1);

  // Verdict counts
  const realCount = overview.findings_summary?.verdict_counts['REAL'] || 0;
  const noiseCount = overview.findings_summary?.verdict_counts['NOISE'] || 0;

  // Chart data for money impact
  const chartFindings = findings.map((f) => ({
    id: f.id,
    name: `${f.id}: ${f.title.length > 28 ? f.title.substring(0, 26) + '...' : f.title}`,
    money: f.money_impact,
    verdict: f.verdict,
  }));

  // Status donut data
  const donutData = overview.status_breakdown.map((s) => ({
    name: s.status,
    value: s.revenue,
    count: s.count,
    color: STATUS_COLORS[s.status] || '#64748B',
  }));

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Leak Ledger
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Ranked financial leaks with mathematical proof, noise detection, and immediate corrective steps.
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
          label="Money in Non-Completed"
          value={formatMoney(overview.non_completed_value)}
          subtext={`${formatNumber(overview.non_completed_orders)} cancelled, returned or pending`}
          icon={AlertTriangle}
          trend="negative"
        />

        <MetricCard
          label="Total Measured Leak"
          value={formatMoney(overview.findings_summary.total_measured_leak)}
          subtext="Excluding unmeasurable inventory links"
          icon={TrendingUp}
          trend="warning"
        />

        <MetricCard
          label="Honesty Verdict Tally"
          value={`${realCount} Real / ${noiseCount} Noise`}
          subtext={`${overview.findings_summary.total_findings} total findings evaluated`}
          badge={
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                {realCount} Real
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {noiseCount} Noise
              </span>
            </div>
          }
        />
      </div>

      {/* Visual Analytics Row: Impact Bar Chart + Status Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Money Impact Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-brand-600 dark:text-brand-400" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Financial Impact by Finding
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              F7 = $8,026 stockout revenue at risk
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartFindings} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                <XAxis
                  type="number"
                  tickFormatter={(val) => formatMoney(val)}
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="id"
                  stroke="#94A3B8"
                  fontSize={12}
                  tickLine={false}
                  width={30}
                />
                <Tooltip
                  formatter={(val: number) => [val === 0 ? 'Not measurable' : formatMoney(val), 'Impact']}
                  labelFormatter={(id) => {
                    const found = chartFindings.find((item) => item.id === id);
                    return found ? found.name : String(id);
                  }}
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
                <Bar dataKey="money" radius={[0, 4, 4, 0]}>
                  {chartFindings.map((entry, index) => {
                    const isNoise = entry.verdict.includes('NOISE');
                    const isReal = entry.verdict.includes('REAL');
                    const fill = isReal ? '#4F46E5' : isNoise ? '#94A3B8' : '#F59E0B';
                    return <Cell key={`cell-${index}`} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Small Status Donut */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PieIcon size={18} className="text-brand-600 dark:text-brand-400" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Order Value by Status
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Total transaction revenue split
            </p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [formatMoney(value), 'Revenue']}
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
              </RechartsPie>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            {donutData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <div className="text-xs truncate">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{d.name}</span>
                  <span className="block font-mono text-[10px] text-slate-400">
                    {formatMoney(d.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero: Ranked Findings List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Ranked Actionable Findings
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any finding to inspect granular evidence, mathematical proofs, and recommended actions.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Sorted by rank & impact
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {findings.map((f) => {
            return (
              <div
                key={f.id}
                onClick={() => navigate(`/findings/${f.id.toLowerCase()}`)}
                className="p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all cursor-pointer group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Rank, ID, Title, Action */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                      #{f.rank}
                    </span>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                          {f.id}
                        </span>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                          {f.title}
                        </h3>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Action: </span>
                        {f.action}
                      </p>
                    </div>
                  </div>

                  {/* Right: Money Bar, Verdict Badge, Confidence Tag, Arrow */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6 shrink-0 self-end lg:self-center">
                    {/* Horizontal Money Bar */}
                    <MoneyBar amount={f.money_impact} maxAmount={maxImpact} />

                    {/* Verdict Badge */}
                    <div className="min-w-[150px]">
                      <VerdictBadge verdict={f.verdict} size="sm" />
                    </div>

                    {/* Confidence tag */}
                    <span className="hidden md:inline-block px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {f.confidence}
                    </span>

                    {/* Navigate chevron */}
                    <div className="text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all">
                      <ArrowRight size={18} />
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
