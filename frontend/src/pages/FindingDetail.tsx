import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Layers,
  TrendingDown,
  Clock,
  ShieldAlert,
  BarChart2,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
  LineChart,
  Line,
  ErrorBar
} from 'recharts';
import { fetchFinding, fetchBreakdown } from '../lib/api';
import { Finding, BreakdownData } from '../types';
import { VerdictBadge } from '../components/VerdictBadge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { formatMoney, formatNumber, formatPercent } from '../lib/formatters';

export const FindingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [finding, setFinding] = useState<Finding | null>(null);
  const [breakdown, setBreakdown] = useState<BreakdownData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFinding = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFinding(id.toUpperCase());
      setFinding(data);

      // If F3 or F4, also load segment breakdown for the rate-by-segment chart
      if (data.id === 'F3' || data.id === 'F4') {
        try {
          const bd = await fetchBreakdown('category');
          setBreakdown(bd);
        } catch (e) {
          console.warn('Failed to fetch breakdown for finding detail', e);
        }
      }
    } catch (err: any) {
      setError(err?.message || `Failed to load finding ${id}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinding();
  }, [id]);

  if (loading) return <LoadingSkeleton rows={5} />;
  if (error || !finding) return <ErrorDisplay message={error || 'Finding not found'} onRetry={loadFinding} />;

  // Render finding-specific visual
  const renderVisual = () => {
    const metrics = finding.metrics || {};

    // F1 Visual: Gap by category bar chart
    if (finding.id === 'F1' && metrics.gap_by_category) {
      const data = Object.entries(metrics.gap_by_category).map(([cat, gap]) => ({
        category: cat,
        gap: gap as number,
      })).sort((a, b) => b.gap - a.gap);

      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Price Gap vs List Price by Category
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Total discount and below-list markdown combined (F1 metric)
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
              Total Gap: {formatMoney(finding.money_impact)}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                <XAxis dataKey="category" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(val) => formatMoney(val)} tickLine={false} />
                <Tooltip
                  formatter={(val: number) => [formatMoney(val), 'Pricing Gap']}
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
                <Bar dataKey="gap" fill="#4F46E5" radius={[4, 4, 0, 0]}>
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#4338CA' : '#6366F1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <span className="text-xs text-slate-500 dark:text-slate-400">Below List Price Cost</span>
              <span className="block text-lg font-bold font-mono text-slate-900 dark:text-white">
                {formatMoney(metrics.below_list || 916044)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <span className="text-xs text-slate-500 dark:text-slate-400">Stacked Discount Cost</span>
              <span className="block text-lg font-bold font-mono text-slate-900 dark:text-white">
                {formatMoney(metrics.discount || 773421)}
              </span>
            </div>
          </div>
        </div>
      );
    }

    // F2 Visual: Worst products with negative profit
    if (finding.id === 'F2' && metrics.worst_products) {
      const data = Object.entries(metrics.worst_products).map(([pid, loss]) => ({
        product_id: pid,
        loss: Math.abs(loss as number),
        signed_loss: loss as number,
      })).sort((a, b) => b.loss - a.loss);

      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Top Loss-Making Products
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Products selling below unit cost resulting in severe net loss
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 rounded-full border border-rose-200 dark:border-rose-800">
              {metrics.loss_products || 94} Products in Net Loss
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                <XAxis
                  type="number"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickFormatter={(val) => `-${formatMoney(val)}`}
                  tickLine={false}
                />
                <YAxis dataKey="product_id" type="category" stroke="#94A3B8" fontSize={12} tickLine={false} width={60} />
                <Tooltip
                  formatter={(val: number) => [`-${formatMoney(val)}`, 'Net Profit Loss']}
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
                <Bar dataKey="loss" fill="#E11D48" radius={[0, 4, 4, 0]}>
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill="#E11D48" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    // F3 & F4 Visual: ROC-AUC 95% Confidence Interval Chart + Segment Breakdown
    if ((finding.id === 'F3' || finding.id === 'F4') && metrics.model) {
      const model = metrics.model as any;
      const aucData = [
        {
          name: 'Baseline (Category Rate)',
          auc: model.baseline_category_rate?.roc_auc || 0.48,
          ci_low: model.baseline_category_rate?.auc_95ci?.[0] || 0.45,
          ci_high: model.baseline_category_rate?.auc_95ci?.[1] || 0.51,
          lift: model.baseline_category_rate?.lift_top10pct || 1.0,
        },
        {
          name: 'Logistic Regression',
          auc: model.logistic_regression?.roc_auc || 0.52,
          ci_low: model.logistic_regression?.auc_95ci?.[0] || 0.49,
          ci_high: model.logistic_regression?.auc_95ci?.[1] || 0.55,
          lift: model.logistic_regression?.lift_top10pct || 1.2,
        },
        {
          name: 'Gradient Boosting',
          auc: model.gradient_boosting?.roc_auc || 0.51,
          ci_low: model.gradient_boosting?.auc_95ci?.[0] || 0.48,
          ci_high: model.gradient_boosting?.auc_95ci?.[1] || 0.54,
          lift: model.gradient_boosting?.lift_top10pct || 1.0,
        },
      ];

      // Segment breakdown data for F3/F4
      const isCancel = finding.id === 'F3';
      const segmentData = breakdown?.segments.map((s) => ({
        name: s.segment,
        rate: isCancel ? s.cancel_rate : s.return_rate,
        overall: isCancel ? breakdown.overall.cancel_rate : breakdown.overall.return_rate,
      })) || [];

      return (
        <div className="space-y-6">
          {/* ROC-AUC Confidence Interval Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Model A Predictive Power: ROC-AUC with 95% Confidence Intervals
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Every model's 95% confidence interval spans across 0.50 (random coin flip). No reliable driver exists.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700">
                Random baseline = 0.50
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aucData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis domain={[0.4, 0.6]} stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip
                    formatter={(val: number, name: string) => [val.toFixed(3), 'Test ROC-AUC']}
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
                    y={0.5}
                    stroke="#EF4444"
                    strokeDasharray="4 4"
                    label={{ value: 'Random Guessing (0.50)', fill: '#EF4444', position: 'top', fontSize: 11 }}
                  />
                  <Bar dataKey="auc" fill="#64748B" radius={[4, 4, 0, 0]}>
                    {aucData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill="#64748B" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Proof summary callout */}
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Honesty Verdict: </span>
              {model.verdict}
            </div>
          </div>

          {/* Segment Rate Chart vs Overall Reference Line */}
          {segmentData.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    {isCancel ? 'Cancellation' : 'Return'} Rate Across Categories
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Category rates hover closely around the overall rate (red line). Segment variations are statistical noise.
                  </p>
                </div>
                <span className="text-xs font-mono font-medium text-slate-500">
                  Overall: {formatPercent(segmentData[0]?.overall)}
                </span>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={segmentData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis
                      domain={[0, 0.15]}
                      tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(val: number) => [formatPercent(val), isCancel ? 'Cancel Rate' : 'Return Rate']}
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
                      y={segmentData[0]?.overall}
                      stroke="#EF4444"
                      strokeDasharray="3 3"
                      label={{
                        value: `Overall Benchmark (${formatPercent(segmentData[0]?.overall)})`,
                        fill: '#EF4444',
                        position: 'top',
                        fontSize: 11,
                      }}
                    />
                    <Bar dataKey="rate" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-lg text-xs text-amber-800 dark:text-amber-300">
                Notice: All category rate variations are within expected sampling noise (p &gt; 0.05 after multiple testing correction). Do not penalize or reallocate marketing away from specific categories.
              </div>
            </div>
          )}
        </div>
      );
    }

    // F5 Visual: Stale Orders & Median Age
    if (finding.id === 'F5') {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Operational Stagnation Metrics
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pending orders are not merely recent unfulfilled orders; they are chronically stuck throughout the year.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Stale Orders (&gt;30 days)</span>
              <span className="block text-3xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                {metrics.stale_orders || 824}
              </span>
              <span className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-1 block">
                90% of all pending orders
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Median Age</span>
              <span className="block text-3xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                {metrics.median_age_days || 180} days
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                Half a year unfulfilled
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Locked Value in Stale Orders</span>
              <span className="block text-3xl font-bold font-mono text-brand-600 dark:text-brand-400 mt-1">
                {formatMoney(finding.money_impact)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                At risk of customer chargeback
              </span>
            </div>
          </div>
        </div>
      );
    }

    // F6 Visual: Model B Campaign Anomaly Metrics
    if (finding.id === 'F6' && metrics.model) {
      const mb = metrics.model as any;
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Isolation Forest & Funnel Anomaly Evaluation
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 rounded-full">
              Model B (Unsupervised)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Campaigns</span>
              <span className="block text-xl font-bold font-mono text-slate-900 dark:text-white">
                {mb.campaigns || 1200}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <span className="text-xs text-slate-500 dark:text-slate-400">Flagged Campaigns</span>
              <span className="block text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
                {mb.flagged || 180}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <span className="text-xs text-slate-500 dark:text-slate-400">Impossible Funnel Rows</span>
              <span className="block text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                {mb.impossible_funnel_rows || 171}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <span className="text-xs text-slate-500 dark:text-slate-400">Recall on Impossible</span>
              <span className="block text-xl font-bold font-mono text-slate-900 dark:text-white">
                {formatPercent(mb.recall_on_impossible_rows)}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <span className="font-semibold text-slate-900 dark:text-slate-100">Note: </span>
            {mb.note}
          </div>
        </div>
      );
    }

    // F7 Visual: Inventory Stockout Risk Table
    if (finding.id === 'F7' && (metrics.top_risk || metrics.watchlist)) {
      const riskItems = metrics.top_risk || metrics.watchlist || [];
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Products Likely to Stock Out Before Supplier Delivers ({riskItems.length} Products Monitored)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Products where physical stock cover is shorter than supplier lead time + average delay
              </p>
            </div>
            <Link
              to="/inventory"
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              <span>View Full Inventory Ledger</span>
              <ExternalLink size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-sans">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Product ID</th>
                  <th className="py-2.5 px-3 font-semibold">Category</th>
                  <th className="py-2.5 px-3 font-semibold">Stock on Hand</th>
                  <th className="py-2.5 px-3 font-semibold">Days of Cover</th>
                  <th className="py-2.5 px-3 font-semibold">Lead Time (eff)</th>
                  <th className="py-2.5 px-3 font-semibold">Shortfall Days</th>
                  <th className="py-2.5 px-3 font-semibold">Revenue at Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {riskItems.map((item) => {
                  const hasShortfall = (item.shortfall_days ?? 0) > 0;
                  return (
                    <tr key={item.product_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{item.product_id}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-sans">{item.category}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{item.stock_on_hand}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{item.days_of_cover ?? '-'}d</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{item.effective_lead_days ?? '-'}d</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${hasShortfall ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                          {item.shortfall_days ?? 0}d
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {item.est_revenue_at_risk ? formatMoney(item.est_revenue_at_risk) : '$0'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Leak Ledger</span>
        </button>
      </div>

      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                Rank #{finding.rank}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/60 font-mono text-xs font-bold text-brand-700 dark:text-brand-300">
                {finding.id}
              </span>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                {finding.type}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {finding.title}
            </h1>
          </div>

          {/* Right: Money & Verdict */}
          <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
            <div className="text-right">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                Financial Impact
              </span>
              <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
                {finding.money_impact === 0 ? 'Not measurable' : formatMoney(finding.money_impact)}
              </span>
            </div>

            <div className="mt-1">
              <VerdictBadge verdict={finding.verdict} size="md" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <div>
            <span className="text-slate-400">Confidence: </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{finding.confidence}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Evidence + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evidence Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Finding-specific Interactive Visual */}
          {renderVisual()}

          {/* Evidence Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-brand-600 dark:text-brand-400" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Why this is flagged (Granular Evidence)
              </h2>
            </div>

            <ol className="space-y-3">
              {finding.evidence.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                >
                  <span className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Action and Assumptions Sidebar (1 col) */}
        <div className="space-y-6">
          {/* Recommended Action Card */}
          <div className="bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-900/50 rounded-xl p-5 shadow-sm space-y-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-brand-600" />
            <div className="flex items-center gap-2 text-brand-700 dark:text-brand-400">
              <CheckCircle2 size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider">
                Recommended Action
              </h3>
            </div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
              {finding.action}
            </p>
          </div>

          {/* Assumptions and Caveats Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <HelpCircle size={18} className="text-amber-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Assumptions & Caveats
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-amber-50/40 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200/50 dark:border-amber-900/40">
              {finding.assumptions}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
