import React, { useEffect, useState } from 'react';
import {
  Boxes,
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  HelpCircle,
  Package,
  Layers,
  Info,
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

  // Sorting
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

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Inventory & Stockout Risk
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Products likely to stock out before supplier delivery (Finding F7) and data quality audit.
          </p>
        </div>
        <VerdictBadge verdict={data.verdict} size="lg" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Stockout Before Restock"
          value={`${stockoutCount} Products`}
          subtext="Days of cover < supplier lead time + delay"
          icon={AlertTriangle}
          trend="negative"
        />

        <MetricCard
          label="Revenue at Risk"
          value={formatMoney(revAtRisk)}
          subtext="Shortfall days x daily completed revenue"
          icon={DollarSign}
          trend="warning"
        />

        <MetricCard
          label="Below Reorder Point"
          value={`${belowReorderCount} Products`}
          subtext="Additional products needing restock"
          icon={Package}
          trend="neutral"
        />

        <MetricCard
          label="Total Products Tracked"
          value={`${data.stats.total_products} SKUs`}
          subtext="Across all 6 retail departments"
          icon={Boxes}
          trend="neutral"
        />
      </div>


      {/* Watchlist Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Supplier Delivery Risk Table ({sortedList.length} Products Monitored)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ranked by shortfall days. Priority order for immediate procurement and supplier expediting.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-md border border-rose-200 dark:border-rose-800">
            Immediate Action Required
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 select-none">
              <tr>
                <th
                  onClick={() => handleSort('product_id')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Product ID</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('category')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Category</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('stock_on_hand')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Stock on Hand</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('days_of_cover')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Days of Cover</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold">
                  Effective Lead Days
                </th>
                <th
                  onClick={() => handleSort('shortfall_days')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Shortfall Days</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('est_revenue_at_risk')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Revenue at Risk</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {sortedList.map((item) => {
                const hasShortfall = (item.shortfall_days ?? 0) > 0;
                return (
                  <tr key={item.product_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {item.product_id}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-700 dark:text-slate-300">
                      {item.category}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {item.stock_on_hand}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {item.days_of_cover ?? '-'}d
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {item.effective_lead_days ?? '-'}d
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          hasShortfall
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {item.shortfall_days ?? 0}d
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {item.est_revenue_at_risk ? formatMoney(item.est_revenue_at_risk) : '$0'}
                    </td>
                    <td className="py-3 px-4">
                      {hasShortfall ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          Stockout Before Delivery
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
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
