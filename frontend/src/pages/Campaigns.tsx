import React, { useEffect, useState } from 'react';
import {
  Target,
  DollarSign,
  AlertTriangle,
  ShieldAlert,
  Info,
  Search
} from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { fetchCampaigns } from '../lib/api';
import { CampaignsData } from '../types';
import { MetricCard } from '../components/MetricCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { formatMoney, formatNumber, formatPercent } from '../lib/formatters';
import { CHART_AXIS_COLOR } from '../lib/constants';

export const Campaigns: React.FC = () => {
  const [data, setData] = useState<CampaignsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState<string>('');
  const [channelFilter, setChannelFilter] = useState<string>('all');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchCampaigns();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load campaigns data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoadingSkeleton rows={5} />;
  if (error || !data) return <ErrorDisplay message={error || 'No campaign data found'} onRetry={loadData} />;

  const filteredCampaigns = data.flagged_campaigns.filter((c) => {
    const matchesSearch =
      filterText === '' ||
      c.campaign_id.toLowerCase().includes(filterText.toLowerCase()) ||
      c.why_flagged.toLowerCase().includes(filterText.toLowerCase());
    const matchesChannel = channelFilter === 'all' || c.channel === channelFilter;
    return matchesSearch && matchesChannel;
  });

  const normalPoints = data.scatter_points.filter((p) => !p.flagged);
  const flaggedPoints = data.scatter_points.filter((p) => p.flagged);
  const channels = Array.from(new Set(data.flagged_campaigns.map((c) => c.channel)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-ink-900 dark:text-white tracking-tight">
          Campaign Anomaly Radar
        </h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Detection of impossible conversion funnels and spending anomalies (Finding F6).
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Campaigns" value={formatNumber(data.summary.total_campaigns)} subtext={`Total Spend: ${formatMoney(data.summary.total_spend)}`} icon={Target} />
        <MetricCard label="Flagged Anomaly Spend" value={formatMoney(data.summary.excess_spend_flagged)} subtext="Spend above median cost per conversion" icon={DollarSign} trend="warning" />
        <MetricCard label="Flagged by Isolation Forest" value={`${data.summary.flagged_count} / ${data.summary.total_campaigns}`} subtext="15% of all marketing campaigns flagged" icon={AlertTriangle} trend="negative" />
        <MetricCard label="Impossible Funnels" value={`${data.summary.impossible_funnel_count} rows`} subtext="Clicks > Impressions or Conv > Clicks" icon={ShieldAlert} trend="negative" />
      </div>

      {/* Model B Card */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
          <Info size={16} />
          <h2 className="text-xs font-bold uppercase tracking-wider">
            Model B — Isolation Forest Assessment
          </h2>
        </div>
        <p className="text-sm text-ink-600 dark:text-ink-300 leading-relaxed">
          Recall of <span className="font-semibold text-ink-900 dark:text-white">{formatPercent(data.model_b_info.recall_on_impossible_rows)}</span> and precision of <span className="font-semibold text-ink-900 dark:text-white">{formatPercent(data.model_b_info.precision_on_impossible_rows)}</span> on catching impossible-funnel rows.
        </p>
        <div className="p-3 bg-caution-50 dark:bg-caution-500/10 border border-caution-100 dark:border-caution-500/20 rounded-lg text-xs text-caution-700 dark:text-caution-500">
          <span className="font-semibold">Honesty Guardrail: </span>
          {data.model_b_info.note}
        </div>
      </div>

      {/* Scatter Chart */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="card-title">Spend vs. Conversions</h2>
            <p className="card-subtitle">Excessive spend produces no higher conversion outcomes.</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-ink-500">
              <span className="w-2 h-2 rounded-full bg-ink-400" /> Normal
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-danger-600 dark:text-danger-500">
              <span className="w-2 h-2 rounded-full bg-danger-500" /> Flagged
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
              <XAxis type="number" dataKey="spend" name="Spend" tickFormatter={(val) => formatMoney(val)} stroke={CHART_AXIS_COLOR} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis type="number" dataKey="conversions" name="Conversions" stroke={CHART_AXIS_COLOR} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ payload }) => {
                  if (!payload || !payload.length) return null;
                  const pt = payload[0].payload;
                  return (
                    <div className="p-3 bg-ink-950 rounded-xl text-xs space-y-1.5 shadow-xl border border-ink-800">
                      <div className="font-bold text-sm text-white">{pt.campaign_id} ({pt.channel})</div>
                      <div className="text-ink-200">Spend: <span className="font-mono font-semibold text-white">{formatMoney(pt.spend)}</span></div>
                      <div className="text-ink-200">Conversions: <span className="font-mono font-semibold text-white">{formatNumber(pt.conversions)}</span></div>
                      <div className="text-ink-200">Cost / Conv: <span className="font-mono font-semibold text-white">{formatMoney(pt.cost_per_conv)}</span></div>
                      {pt.flagged && <div className="text-danger-500 font-semibold pt-1 border-t border-ink-800">Flagged Anomaly</div>}
                      {pt.invalid_funnel && <div className="text-caution-500 font-semibold">Impossible Funnel</div>}
                    </div>
                  );
                }}
              />
              <Scatter name="Normal" data={normalPoints} fill="#7D89A1" fillOpacity={0.5} />
              <Scatter name="Flagged" data={flaggedPoints} fill="#EF4444" fillOpacity={0.8} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Flagged Table */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-ink-100 dark:border-ink-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="card-title">Flagged Campaigns ({filteredCampaigns.length})</h2>
            <p className="card-subtitle">Audit campaigns with extreme cost per conversion or broken funnels.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2.5 text-ink-400" />
              <input type="text" placeholder="Search…" value={filterText} onChange={(e) => setFilterText(e.target.value)} className="input-base pl-8 pr-3 py-1.5 text-xs w-44" />
            </div>
            <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className="input-base text-xs px-2.5 py-1.5">
              <option value="all">All Channels</option>
              {channels.map((ch) => <option key={ch} value={ch}>{ch}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-ink-50 dark:bg-ink-800/40 text-ink-500 dark:text-ink-400 border-b border-ink-100 dark:border-ink-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Campaign ID</th>
                <th className="py-3 px-4 font-semibold">Channel</th>
                <th className="py-3 px-4 font-semibold">Spend</th>
                <th className="py-3 px-4 font-semibold">Clicks / Conv</th>
                <th className="py-3 px-4 font-semibold">Cost / Conv</th>
                <th className="py-3 px-4 font-semibold">Excess Spend</th>
                <th className="py-3 px-4 font-semibold">Reason</th>
                <th className="py-3 px-4 font-semibold">Funnel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-ink-800/60 font-mono">
              {filteredCampaigns.map((c) => (
                <tr key={c.campaign_id} className="hover:bg-ink-50/50 dark:hover:bg-ink-800/20 transition-colors">
                  <td className="py-3 px-4 font-bold text-ink-900 dark:text-white">{c.campaign_id}</td>
                  <td className="py-3 px-4 font-sans text-ink-600 dark:text-ink-300">{c.channel}</td>
                  <td className="py-3 px-4 font-semibold text-ink-900 dark:text-white">{formatMoney(c.spend)}</td>
                  <td className="py-3 px-4 text-ink-500">{formatNumber(c.clicks)} / {formatNumber(c.conversions)}</td>
                  <td className="py-3 px-4 text-danger-600 font-semibold">{formatMoney(c.cost_per_conv)}</td>
                  <td className="py-3 px-4 font-bold text-ink-900 dark:text-white">{formatMoney(c.excess_spend)}</td>
                  <td className="py-3 px-4 font-sans text-xs text-ink-500 dark:text-ink-400">{c.why_flagged}</td>
                  <td className="py-3 px-4">
                    {c.invalid_funnel ? (
                      <span className="tag bg-danger-50 dark:bg-danger-500/10 text-danger-700 dark:text-danger-500 border-danger-100 dark:border-danger-500/20 text-2xs font-bold">Impossible</span>
                    ) : (
                      <span className="tag bg-ink-50 dark:bg-ink-800 text-ink-500 border-ink-200 dark:border-ink-700 text-2xs">Valid</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
