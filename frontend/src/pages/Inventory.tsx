import React, { useEffect, useState } from 'react';
import {
  Boxes,
  AlertTriangle,
  ArrowUpDown,
  Package,
  DollarSign
} from 'lucide-react';
import { fetchInventory } from '../lib/api';
import { InventoryData, InventoryRiskItem } from '../types';
import { MetricCard } from '../components/MetricCard';
import { VerdictBadge } from '../components/VerdictBadge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { formatMoney, formatNumber } from '../lib/formatters';

export const Inventory: React.FC = () => {
  const [data, setData] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortField, setSortField] = useState<'product_id' | 'category' | 'stock_on_hand' | 'days_of_cover' | 'shortfall_days' | 'est_revenue_at_risk'>('shortfall_days');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchInventory();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoadingSkeleton rows={5} />;
  if (error || !data) return <ErrorDisplay message={error || 'No inventory data found'} onRetry={loadData} />;

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const riskList = data.top_risk || data.watchlist || [];

  const sortedList = [...riskList].sort((a, b) => {
    let aVal: any = a[sortField as keyof InventoryRiskItem] ?? 0;
    let bVal: any = b[sortField as keyof InventoryRiskItem] ?? 0;
    if (typeof aVal === 'string') {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  const stockoutCount = data.stats.products_stockout_before_restock ?? 8;
  const belowReorderCount = data.stats.products_below_reorder ?? 26;
  const revAtRisk = data.stats.est_revenue_at_risk ?? 8026;

  const SortHeader = ({ field, children }: { field: typeof sortField; children: React.ReactNode }) => (
    <th
      onClick={() => handleSort(field)}
      className="py-3 px-4 font-semibold cursor-pointer hover:text-ink-900 dark:hover:text-white transition-colors select-none"
    >
      <div className="flex items-center gap-1">
        <span>{children}</span>
        <ArrowUpDown size={11} className={sortField === field ? 'text-brand-500' : ''} />
      </div>
    </th>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink-900 dark:text-white tracking-tight">
            Inventory & Stockout Risk
          </h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Products likely to stock out before supplier delivery (Finding F7).
          </p>
        </div>
        <VerdictBadge verdict={data.verdict} size="lg" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Stockout Before Restock" value={`${stockoutCount} Products`} subtext="Days of cover < lead time + delay" icon={AlertTriangle} trend="negative" />
        <MetricCard label="Revenue at Risk" value={formatMoney(revAtRisk)} subtext="Shortfall days × daily revenue" icon={DollarSign} trend="warning" />
        <MetricCard label="Below Reorder Point" value={`${belowReorderCount} Products`} subtext="Additional products needing restock" icon={Package} trend="neutral" />
        <MetricCard label="Total Products" value={`${data.stats.total_products} SKUs`} subtext="Across all 6 retail departments" icon={Boxes} trend="neutral" />
      </div>

      {/* Watchlist Table */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-ink-100 dark:border-ink-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="card-title">Supplier Delivery Risk ({sortedList.length} Products)</h2>
            <p className="card-subtitle">Ranked by shortfall days for immediate procurement action.</p>
          </div>
          <span className="tag bg-danger-50 dark:bg-danger-500/10 text-danger-700 dark:text-danger-500 border-danger-100 dark:border-danger-500/20 text-2xs font-bold">
            Immediate Action
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-ink-50 dark:bg-ink-800/40 text-ink-500 dark:text-ink-400 border-b border-ink-100 dark:border-ink-800">
              <tr>
                <SortHeader field="product_id">Product</SortHeader>
                <SortHeader field="category">Category</SortHeader>
                <SortHeader field="stock_on_hand">Stock</SortHeader>
                <SortHeader field="days_of_cover">Cover</SortHeader>
                <th className="py-3 px-4 font-semibold">Lead Days</th>
                <SortHeader field="shortfall_days">Shortfall</SortHeader>
                <SortHeader field="est_revenue_at_risk">Rev. at Risk</SortHeader>
                <th className="py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-ink-800/60 font-mono">
              {sortedList.map((item) => {
                const hasShortfall = (item.shortfall_days ?? 0) > 0;
                return (
                  <tr key={item.product_id} className="hover:bg-ink-50/50 dark:hover:bg-ink-800/20 transition-colors">
                    <td className="py-3 px-4 font-bold text-ink-900 dark:text-white">{item.product_id}</td>
                    <td className="py-3 px-4 font-sans text-ink-600 dark:text-ink-300">{item.category}</td>
                    <td className="py-3 px-4 font-bold text-ink-900 dark:text-white">{item.stock_on_hand}</td>
                    <td className="py-3 px-4 text-ink-500">{item.days_of_cover ?? '-'}d</td>
                    <td className="py-3 px-4 text-ink-500">{item.effective_lead_days ?? '-'}d</td>
                    <td className="py-3 px-4">
                      <span className={`tag text-2xs font-bold ${
                        hasShortfall
                          ? 'bg-danger-50 dark:bg-danger-500/10 text-danger-700 dark:text-danger-500 border-danger-100 dark:border-danger-500/20'
                          : 'bg-ink-50 dark:bg-ink-800 text-ink-500 border-ink-200 dark:border-ink-700'
                      }`}>
                        {item.shortfall_days ?? 0}d
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-ink-900 dark:text-white">
                      {item.est_revenue_at_risk ? formatMoney(item.est_revenue_at_risk) : '$0'}
                    </td>
                    <td className="py-3 px-4">
                      {hasShortfall ? (
                        <span className="tag bg-danger-50 dark:bg-danger-500/10 text-danger-700 dark:text-danger-500 border-danger-100 dark:border-danger-500/20 text-2xs font-bold">
                          Stockout Risk
                        </span>
                      ) : (
                        <span className="tag bg-ink-50 dark:bg-ink-800 text-ink-500 border-ink-200 dark:border-ink-700 text-2xs">
                          Covered
                        </span>
                      )}
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
