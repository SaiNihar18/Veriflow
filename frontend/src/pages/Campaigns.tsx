import React, { useEffect, useState } from 'react';
import {
  Megaphone,
  AlertTriangle,
  Target,
  DollarSign,
  TrendingDown,
  Info,
  ShieldAlert,
  Search
} from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  Legend
} from 'recharts';
import { fetchCampaigns } from '../lib/api';
import { CampaignsData, FlaggedCampaign } from '../types';
import { MetricCard } from '../components/MetricCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { formatMoney, formatNumber, formatPercent } from '../lib/formatters';

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

  // Filter flagged campaigns table
  const filteredCampaigns = data.flagged_campaigns.filter((c) => {
    const matchesSearch =
      filterText === '' ||
      c.campaign_id.toLowerCase().includes(filterText.toLowerCase()) ||
      c.why_flagged.toLowerCase().includes(filterText.toLowerCase());
    const matchesChannel = channelFilter === 'all' || c.channel === channelFilter;
    return matchesSearch && matchesChannel;
  });

  // Prepare scatter data for normal vs flagged
  const normalPoints = data.scatter_points.filter((p) => !p.flagged);
  const flaggedPoints = data.scatter_points.filter((p) => p.flagged);

  const channels = Array.from(new Set(data.flagged_campaigns.map((c) => c.channel)));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Campaign Anomaly Radar
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Detection of impossible conversion funnels and spending beyond median efficiency (Finding F6).
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Campaigns"
          value={formatNumber(data.summary.total_campaigns)}
          subtext={`Total Spend: ${formatMoney(data.summary.total_spend)}`}
          icon={Target}
        />

        <MetricCard
          label="Flagged Anomaly Spend"
          value={formatMoney(data.summary.excess_spend_flagged)}
          subtext="Spend above median cost per conversion"
          icon={DollarSign}
          trend="warning"
        />

        <MetricCard
          label="Flagged by Isolation Forest"
          value={`${data.summary.flagged_count} / ${data.summary.total_campaigns}`}
          subtext="15% of all marketing campaigns flagged"
          icon={AlertTriangle}
          trend="negative"
        />

        <MetricCard
          label="Impossible Funnels"
          value={`${data.summary.impossible_funnel_count} rows`}
          subtext="Clicks > Impressions or Conv > Clicks"
          icon={ShieldAlert}
          trend="negative"
        />
      </div>

      {/* Model B Explanation Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-brand-700 dark:text-brand-400">
          <Info size={18} />
          <h2 className="text-sm font-bold uppercase tracking-wider">
            Model B (Isolation Forest) Anomaly Detection Assessment
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Model B achieved a <span className="font-semibold text-slate-900 dark:text-white">recall of {formatPercent(data.model_b_info.recall_on_impossible_rows)}</span> and <span className="font-semibold text-slate-900 dark:text-white">precision of {formatPercent(data.model_b_info.precision_on_impossible_rows)}</span> on catching impossible-funnel rows. Extra spend shows zero correlation with conversions.
        </p>
        <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-lg text-xs text-amber-900 dark:text-amber-300">
          <span className="font-semibold">Honesty Guardrail: </span>
          {data.model_b_info.note}
        </div>
      </div>

      {/* Scatter Chart: Spend vs Conversions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Spend vs. Conversions Scatterplot
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Notice the lack of correlation: excessive spend produces no higher conversion outcomes.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              Normal Campaign
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-rose-600 dark:text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Flagged Anomaly
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
              <XAxis
                type="number"
                dataKey="spend"
                name="Spend"
                tickFormatter={(val) => formatMoney(val)}
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                type="number"
                dataKey="conversions"
                name="Conversions"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ payload }) => {
                  if (!payload || !payload.length) return null;
                  const pt = payload[0].payload;
                  return (
                    <div
                      className="p-3 bg-slate-900 rounded-lg text-xs space-y-1.5 shadow-xl border border-slate-700"
                      style={{ color: '#F8FAFC' }}
                    >
                      <div className="font-bold text-sm text-white">{pt.campaign_id} ({pt.channel})</div>
                      <div className="text-slate-200">Spend: <span className="font-mono font-semibold text-white">{formatMoney(pt.spend)}</span></div>
                      <div className="text-slate-200">Conversions: <span className="font-mono font-semibold text-white">{formatNumber(pt.conversions)}</span></div>
                      <div className="text-slate-200">Cost / Conv: <span className="font-mono font-semibold text-white">{formatMoney(pt.cost_per_conv)}</span></div>
                      {pt.flagged && <div className="text-rose-400 font-semibold pt-1 border-t border-slate-800">Flagged Anomaly</div>}
                      {pt.invalid_funnel && <div className="text-amber-400 font-semibold">Impossible Funnel</div>}
                    </div>
                  );
                }}
              />
              <Scatter name="Normal" data={normalPoints} fill="#94A3B8" fillOpacity={0.6} />
              <Scatter name="Flagged" data={flaggedPoints} fill="#E11D48" fillOpacity={0.8} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Flagged Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Flagged Campaigns ({filteredCampaigns.length} shown)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit flagged campaigns with extreme cost per conversion or broken funnels.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search reason or ID..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Channels</option>
              {channels.map((ch) => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Campaign ID</th>
                <th className="py-3 px-4 font-semibold">Channel</th>
                <th className="py-3 px-4 font-semibold">Spend</th>
                <th className="py-3 px-4 font-semibold">Clicks / Conv</th>
                <th className="py-3 px-4 font-semibold">Cost / Conv</th>
                <th className="py-3 px-4 font-semibold">Excess Spend</th>
                <th className="py-3 px-4 font-semibold">Reason Flagged</th>
                <th className="py-3 px-4 font-semibold">Funnel Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {filteredCampaigns.map((c) => (
                <tr key={c.campaign_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {c.campaign_id}
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-700 dark:text-slate-300">
                    {c.channel}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {formatMoney(c.spend)}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {formatNumber(c.clicks)} / {formatNumber(c.conversions)}
                  </td>
                  <td className="py-3 px-4 text-rose-600 font-semibold">
                    {formatMoney(c.cost_per_conv)}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {formatMoney(c.excess_spend)}
                  </td>
                  <td className="py-3 px-4 font-sans text-xs text-slate-600 dark:text-slate-300">
                    {c.why_flagged}
                  </td>
                  <td className="py-3 px-4">
                    {c.invalid_funnel ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        Impossible Funnel
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        Valid Funnel
                      </span>
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
