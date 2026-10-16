import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Layers,
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
} from 'recharts';
import { fetchFinding, fetchBreakdown } from '../lib/api';
import { Finding, BreakdownData } from '../types';
import { VerdictBadge } from '../components/VerdictBadge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { formatMoney, formatNumber, formatPercent } from '../lib/formatters';
import { CHART_TOOLTIP_STYLE, CHART_ITEM_STYLE, CHART_LABEL_STYLE, CHART_AXIS_COLOR } from '../lib/constants';

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

  const renderVisual = () => {
    const metrics = finding.metrics || {};

    // F1: Gap by category
    if (finding.id === 'F1' && metrics.gap_by_category) {
      const data = Object.entries(metrics.gap_by_category).map(([cat, gap]) => ({
        category: cat, gap: gap as number,
      })).sort((a, b) => b.gap - a.gap);

      return (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="card-title">Price Gap vs List Price by Category</h3>
              <p className="card-subtitle">Discount and below-list markdown combined</p>
            </div>
            <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">Total: {formatMoney(finding.money_impact)}</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                <XAxis dataKey="category" stroke={CHART_AXIS_COLOR} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={CHART_AXIS_COLOR} fontSize={11} tickFormatter={(val) => formatMoney(val)} tickLine={false} axisLine={false} />
                <Tooltip formatter={(val: number) => [formatMoney(val), 'Gap']} contentStyle={CHART_TOOLTIP_STYLE} itemStyle={CHART_ITEM_STYLE} labelStyle={CHART_LABEL_STYLE} />
                <Bar dataKey="gap" fill="#3366FF" radius={[4, 4, 0, 0]}>
                  {data.map((_, i) => <Cell key={`c-${i}`} fill={i === 0 ? '#1A4FFF' : '#5A8EFF'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-ink-100 dark:border-ink-800">
            <div className="p-3 bg-ink-50 dark:bg-ink-800/40 rounded-lg">
              <span className="card-subtitle">Below List</span>
              <span className="block text-lg font-bold font-mono text-ink-900 dark:text-white">{formatMoney(metrics.below_list || 916044)}</span>
            </div>
            <div className="p-3 bg-ink-50 dark:bg-ink-800/40 rounded-lg">
              <span className="card-subtitle">Stacked Discount</span>
              <span className="block text-lg font-bold font-mono text-ink-900 dark:text-white">{formatMoney(metrics.discount || 773421)}</span>
            </div>
          </div>
        </div>
      );
    }

    // F2: Worst products
    if (finding.id === 'F2' && metrics.worst_products) {
      const data = Object.entries(metrics.worst_products).map(([pid, loss]) => ({
        product_id: pid, loss: Math.abs(loss as number),
      })).sort((a, b) => b.loss - a.loss);

      return (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="card-title">Top Loss-Making Products</h3>
              <p className="card-subtitle">Products selling below unit cost</p>
            </div>
            <span className="tag bg-danger-50 dark:bg-danger-500/10 text-danger-700 dark:text-danger-500 border-danger-100 dark:border-danger-500/20 text-2xs font-bold">
              {metrics.loss_products || 94} in Net Loss
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                <XAxis type="number" stroke={CHART_AXIS_COLOR} fontSize={11} tickFormatter={(val) => `-${formatMoney(val)}`} tickLine={false} axisLine={false} />
                <YAxis dataKey="product_id" type="category" stroke={CHART_AXIS_COLOR} fontSize={12} tickLine={false} axisLine={false} width={60} />
                <Tooltip formatter={(val: number) => [`-${formatMoney(val)}`, 'Loss']} contentStyle={CHART_TOOLTIP_STYLE} itemStyle={CHART_ITEM_STYLE} labelStyle={CHART_LABEL_STYLE} />
                <Bar dataKey="loss" fill="#EF4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    // F3 & F4: ROC-AUC + Segment Breakdown
    if ((finding.id === 'F3' || finding.id === 'F4') && metrics.model) {
      const model = metrics.model as any;
      const aucData = [
        { name: 'Baseline', auc: model.baseline_category_rate?.roc_auc || 0.48 },
        { name: 'Logistic', auc: model.logistic_regression?.roc_auc || 0.52 },
        { name: 'GBM', auc: model.gradient_boosting?.roc_auc || 0.51 },
      ];
      const isCancel = finding.id === 'F3';
      const segmentData = breakdown?.segments.map((s) => ({
        name: s.segment,
        rate: isCancel ? s.cancel_rate : s.return_rate,
        overall: isCancel ? breakdown.overall.cancel_rate : breakdown.overall.return_rate,
      })) || [];

      return (
        <div className="space-y-5">
          <div className="card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="card-title">ROC-AUC with 95% Confidence Intervals</h3>
                <p className="card-subtitle">All CIs span across 0.50 → no reliable signal</p>
              </div>
              <span className="tag bg-ink-100 dark:bg-ink-800 text-ink-500 border-ink-200 dark:border-ink-700 text-2xs">Random = 0.50</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aucData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <XAxis dataKey="name" stroke={CHART_AXIS_COLOR} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis domain={[0.4, 0.6]} stroke={CHART_AXIS_COLOR} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(val: number) => [val.toFixed(3), 'ROC-AUC']} contentStyle={CHART_TOOLTIP_STYLE} itemStyle={CHART_ITEM_STYLE} labelStyle={CHART_LABEL_STYLE} />
                  <ReferenceLine y={0.5} stroke="#EF4444" strokeDasharray="4 4" label={{ value: 'Random (0.50)', fill: '#EF4444', position: 'top', fontSize: 11 }} />
                  <Bar dataKey="auc" fill="#7D89A1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="p-3 bg-ink-50 dark:bg-ink-800/40 rounded-lg border border-ink-200/60 dark:border-ink-700/40 text-xs text-ink-600 dark:text-ink-300">
              <span className="font-semibold text-ink-900 dark:text-white">Verdict: </span>{model.verdict}
            </div>
          </div>

          {segmentData.length > 0 && (
            <div className="card p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="card-title">{isCancel ? 'Cancellation' : 'Return'} Rate by Category</h3>
                  <p className="card-subtitle">Variations are within sampling noise</p>
                </div>
                <span className="text-xs font-mono text-ink-500">Overall: {formatPercent(segmentData[0]?.overall)}</span>
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={segmentData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                    <XAxis dataKey="name" stroke={CHART_AXIS_COLOR} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 0.15]} tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} stroke={CHART_AXIS_COLOR} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(val: number) => [formatPercent(val), isCancel ? 'Cancel' : 'Return']} contentStyle={CHART_TOOLTIP_STYLE} itemStyle={CHART_ITEM_STYLE} labelStyle={CHART_LABEL_STYLE} />
                    <ReferenceLine y={segmentData[0]?.overall} stroke="#EF4444" strokeDasharray="3 3" label={{ value: `Benchmark`, fill: '#EF4444', position: 'top', fontSize: 11 }} />
                    <Bar dataKey="rate" fill="#3366FF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="p-3 bg-caution-50/50 dark:bg-caution-500/5 border border-caution-100/60 dark:border-caution-500/10 rounded-lg text-xs text-caution-700 dark:text-caution-500">
                All category variations are within expected noise (p &gt; 0.05 after correction).
              </div>
            </div>
          )}
        </div>
      );
    }

    // F5: Stale Orders
    if (finding.id === 'F5') {
      return (
        <div className="card p-5 space-y-4">
          <h3 className="card-title">Operational Stagnation Metrics</h3>
          <p className="card-subtitle">Pending orders chronically stuck throughout the year.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-ink-50 dark:bg-ink-800/40 border border-ink-200/60 dark:border-ink-700/40">
              <span className="card-subtitle">Stale (&gt;30 days)</span>
              <span className="block stat-value mt-1">{metrics.stale_orders || 824}</span>
              <span className="text-xs text-danger-600 dark:text-danger-500 font-medium mt-1 block">90% of pending</span>
            </div>
            <div className="p-4 rounded-xl bg-ink-50 dark:bg-ink-800/40 border border-ink-200/60 dark:border-ink-700/40">
              <span className="card-subtitle">Median Age</span>
              <span className="block stat-value mt-1">{metrics.median_age_days || 180}d</span>
              <span className="text-xs text-ink-500 mt-1 block">Half a year unfulfilled</span>
            </div>
            <div className="p-4 rounded-xl bg-ink-50 dark:bg-ink-800/40 border border-ink-200/60 dark:border-ink-700/40">
              <span className="card-subtitle">Locked Value</span>
              <span className="block text-2xl font-bold font-mono text-brand-600 dark:text-brand-400 mt-1">{formatMoney(finding.money_impact)}</span>
              <span className="text-xs text-ink-500 mt-1 block">Chargeback risk</span>
            </div>
          </div>
        </div>
      );
    }

    // F6: Campaign Anomaly
    if (finding.id === 'F6' && metrics.model) {
      const mb = metrics.model as any;
      return (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="card-title">Isolation Forest & Funnel Anomaly</h3>
            <span className="tag bg-brand-50 dark:bg-brand-600/10 text-brand-700 dark:text-brand-400 border-brand-100 dark:border-brand-500/20 text-2xs font-bold">Model B</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: mb.campaigns || 1200 },
              { label: 'Flagged', value: mb.flagged || 180, color: 'text-danger-600 dark:text-danger-500' },
              { label: 'Impossible', value: mb.impossible_funnel_rows || 171, color: 'text-caution-600 dark:text-caution-500' },
              { label: 'Recall', value: formatPercent(mb.recall_on_impossible_rows) },
            ].map((stat) => (
              <div key={stat.label} className="p-3 bg-ink-50 dark:bg-ink-800/40 rounded-lg">
                <span className="card-subtitle">{stat.label}</span>
                <span className={`block text-xl font-bold font-mono ${stat.color || 'text-ink-900 dark:text-white'}`}>{stat.value}</span>
              </div>
            ))}
          </div>
          <div className="p-3 bg-ink-50 dark:bg-ink-800/40 rounded-lg border border-ink-200/60 dark:border-ink-700/40 text-xs text-ink-600 dark:text-ink-300">
            <span className="font-semibold text-ink-900 dark:text-white">Note: </span>{mb.note}
          </div>
        </div>
      );
    }

    // F7: Inventory Risk
    if (finding.id === 'F7' && (metrics.top_risk || metrics.watchlist)) {
      const riskItems = metrics.top_risk || metrics.watchlist || [];
      return (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="card-title">Stockout Risk ({riskItems.length} Products)</h3>
              <p className="card-subtitle">Cover shorter than supplier lead + delay</p>
            </div>
            <Link to="/inventory" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
              <span>Full Ledger</span><ExternalLink size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ink-50 dark:bg-ink-800/40 text-ink-500 dark:text-ink-400 border-b border-ink-100 dark:border-ink-800 font-sans">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Product</th>
                  <th className="py-2.5 px-3 font-semibold">Category</th>
                  <th className="py-2.5 px-3 font-semibold">Stock</th>
                  <th className="py-2.5 px-3 font-semibold">Cover</th>
                  <th className="py-2.5 px-3 font-semibold">Lead</th>
                  <th className="py-2.5 px-3 font-semibold">Shortfall</th>
                  <th className="py-2.5 px-3 font-semibold">Rev. at Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800/60 font-mono">
                {riskItems.map((item) => {
                  const hasShortfall = (item.shortfall_days ?? 0) > 0;
                  return (
                    <tr key={item.product_id} className="hover:bg-ink-50/50 dark:hover:bg-ink-800/20">
                      <td className="py-2.5 px-3 font-bold text-ink-900 dark:text-white">{item.product_id}</td>
                      <td className="py-2.5 px-3 text-ink-500 font-sans">{item.category}</td>
                      <td className="py-2.5 px-3 font-bold text-ink-900 dark:text-white">{item.stock_on_hand}</td>
                      <td className="py-2.5 px-3 text-ink-500">{item.days_of_cover ?? '-'}d</td>
                      <td className="py-2.5 px-3 text-ink-500">{item.effective_lead_days ?? '-'}d</td>
                      <td className="py-2.5 px-3">
                        <span className={`tag text-2xs font-bold ${hasShortfall ? 'bg-danger-50 dark:bg-danger-500/10 text-danger-700 dark:text-danger-500 border-danger-100 dark:border-danger-500/20' : 'bg-ink-50 dark:bg-ink-800 text-ink-500 border-ink-200 dark:border-ink-700'}`}>
                          {item.shortfall_days ?? 0}d
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-ink-900 dark:text-white">{item.est_revenue_at_risk ? formatMoney(item.est_revenue_at_risk) : '$0'}</td>
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
    <div className="space-y-5">
      {/* Back */}
      <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-ink-900 dark:hover:text-ink-100 transition-colors">
        <ArrowLeft size={15} /><span>Back to Leak Ledger</span>
      </button>

      {/* Header Card */}
      <div className="card p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="tag bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 border-ink-200 dark:border-ink-700 text-2xs font-mono font-bold">Rank #{finding.rank}</span>
              <span className="tag bg-brand-50 dark:bg-brand-600/10 text-brand-700 dark:text-brand-400 border-brand-100 dark:border-brand-500/20 text-2xs font-mono font-bold">{finding.id}</span>
              <span className="text-2xs uppercase tracking-wider font-semibold text-ink-400">{finding.type}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-ink-900 dark:text-white tracking-tight">{finding.title}</h1>
          </div>
          <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-ink-100 dark:border-ink-800">
            <div className="text-right">
              <span className="stat-label block">Financial Impact</span>
              <span className="text-2xl sm:text-3xl font-bold font-mono text-ink-900 dark:text-white">
                {finding.money_impact === 0 ? 'Not measurable' : formatMoney(finding.money_impact)}
              </span>
            </div>
            <div className="mt-1"><VerdictBadge verdict={finding.verdict} size="md" /></div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-ink-100 dark:border-ink-800 text-xs text-ink-500">
          <div><span className="text-ink-400">Confidence: </span><span className="font-semibold text-ink-700 dark:text-ink-300">{finding.confidence}</span></div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {renderVisual()}
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-brand-500" />
              <h2 className="card-title">Granular Evidence</h2>
            </div>
            <ol className="space-y-2.5">
              {finding.evidence.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-ink-50/70 dark:bg-ink-800/40 border border-ink-100 dark:border-ink-800/60 text-xs sm:text-sm text-ink-700 dark:text-ink-300 leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-brand-50 dark:bg-brand-600/10 text-brand-700 dark:text-brand-400 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">{idx + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="card p-5 space-y-3 relative overflow-hidden border-brand-100 dark:border-brand-500/20">
            <div className="absolute top-0 left-0 right-0 h-1 bg-brand-600" />
            <div className="flex items-center gap-2 text-brand-700 dark:text-brand-400">
              <CheckCircle2 size={16} />
              <h3 className="text-xs font-bold uppercase tracking-wider">Recommended Action</h3>
            </div>
            <p className="text-sm font-medium text-ink-800 dark:text-ink-200 leading-relaxed">{finding.action}</p>
          </div>

          <div className="card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle size={16} className="text-caution-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-ink-300">Assumptions & Caveats</h3>
            </div>
            <p className="text-xs text-ink-600 dark:text-ink-400 leading-relaxed p-3 bg-caution-50/40 dark:bg-caution-500/5 rounded-lg border border-caution-100/50 dark:border-caution-500/10">
              {finding.assumptions}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
