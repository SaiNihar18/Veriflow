import React, { useEffect, useState } from 'react';
import {
  Calculator,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Layers,
  ShieldAlert
} from 'lucide-react';
import { fetchOptions, scoreOrder } from '../lib/api';
import { OptionsData, ProductOption, OrderScorePayload, OrderScoreResult } from '../types';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { formatMoney, formatPercent } from '../lib/formatters';

export const CheckOrder: React.FC = () => {
  const [optionsData, setOptionsData] = useState<OptionsData | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [productId, setProductId] = useState<string>('PR0001');
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
  const [productSearch, setProductSearch] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(105.77);
  const [discountPct, setDiscountPct] = useState<number>(0.05);
  const [orderDateTime, setOrderDateTime] = useState<string>('2025-05-15T14:30');
  const [tenureDays, setTenureDays] = useState<number>(180);
  const [channel, setChannel] = useState<string>('Web');
  const [paymentMethod, setPaymentMethod] = useState<string>('Card');
  const [region, setRegion] = useState<string>('Central');
  const [customerSegment, setCustomerSegment] = useState<string>('Loyal');
  const [preferredChannel, setPreferredChannel] = useState<string>('Web');

  // Result state
  const [scoreResult, setScoreResult] = useState<OrderScoreResult | null>(null);

  // Initial load
  useEffect(() => {
    fetchOptions()
      .then((data) => {
        setOptionsData(data);
        if (data.products.length > 0) {
          const initial = data.products[0];
          setProductId(initial.product_id);
          setSelectedProduct(initial);
          setUnitPrice(initial.list_price);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingOptions(false));
  }, []);

  // Update selected product when productId changes
  useEffect(() => {
    if (!optionsData) return;
    const prod = optionsData.products.find((p) => p.product_id === productId);
    if (prod) {
      setSelectedProduct(prod);
      // default unit price to list price if not customized
      setUnitPrice(prod.list_price);
    }
  }, [productId, optionsData]);

  // Client-side live what-if margin computation
  const currentUnitCost = selectedProduct?.unit_cost || 0;
  const liveEffectivePrice = unitPrice * (1 - discountPct);
  const liveMargin = Math.round((liveEffectivePrice - currentUnitCost) * 100) / 100;
  const liveBelowCost = liveEffectivePrice < currentUnitCost;

  // Derive hour and day of week from orderDateTime
  const getDerivedDateTime = () => {
    const d = new Date(orderDateTime);
    const hour = isNaN(d.getHours()) ? 12 : d.getHours();
    // JS getDay(): 0=Sun, 1=Mon .. 6=Sat. Requirement: dow (0=Mon..6=Sun)
    const jsDay = isNaN(d.getDay()) ? 3 : d.getDay();
    const dow = jsDay === 0 ? 6 : jsDay - 1;
    return { hour, dow };
  };

  const handleScore = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setScoring(true);
      setError(null);
      const { hour, dow } = getDerivedDateTime();

      const payload: OrderScorePayload = {
        product_id: productId,
        quantity,
        unit_price: unitPrice,
        discount_pct: discountPct,
        hour,
        dow,
        tenure_days: tenureDays,
        channel,
        payment_method: paymentMethod,
        region,
        customer_segment: customerSegment,
        preferred_channel: preferredChannel,
      };

      const res = await scoreOrder(payload);
      setScoreResult(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to score order');
    } finally {
      setScoring(false);
    }
  };

  // Demo order shortcut: loads PR0192 (or product that sells below cost)
  const handleLoadDemoOrder = () => {
    if (!optionsData) return;
    // Look for PR0192 (from worst_products) or a product with cost > list price
    const belowCostProd =
      optionsData.products.find((p) => p.product_id === 'PR0192') ||
      optionsData.products.find((p) => p.unit_cost > p.list_price) ||
      optionsData.products[0];

    setProductId(belowCostProd.product_id);
    setSelectedProduct(belowCostProd);
    setUnitPrice(belowCostProd.list_price);
    setDiscountPct(0.20); // 20% discount ensures negative margin
    setQuantity(2);
    setOrderDateTime('2025-11-20T19:45');
    setTenureDays(45);
    setChannel('Store');
    setPaymentMethod('Cash');
    setRegion('North');
    setCustomerSegment('At-risk');
    setPreferredChannel('Store');
  };

  if (loadingOptions) return <LoadingSkeleton rows={4} />;
  if (error && !optionsData) return <ErrorDisplay message={error} onRetry={() => window.location.reload()} />;

  const filteredProducts = optionsData?.products.filter((p) =>
    productSearch === ''
      ? true
      : p.product_id.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(productSearch.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Check an Order
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Simulate an incoming order to check negative margin risks and review predictive failure signals.
          </p>
        </div>

        {/* Load demo button */}
        <button
          onClick={handleLoadDemoOrder}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold shadow-sm transition-all self-start sm:self-auto"
        >
          <Sparkles size={15} />
          <span>Load Demo Order (Below Cost)</span>
        </button>
      </div>

      {/* Live What-If Strip */}
      <div
        className={`p-4 rounded-xl border transition-all ${
          liveBelowCost
            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
            : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {liveBelowCost ? (
              <AlertTriangle className="text-rose-600 dark:text-rose-400 shrink-0" size={20} />
            ) : (
              <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 shrink-0" size={20} />
            )}
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 block">
                Live Client-Side What-If Simulator
              </span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                Effective Price: {formatMoney(liveEffectivePrice)} &middot; Unit Cost: {formatMoney(currentUnitCost)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                Unit Margin
              </span>
              <span
                className={`text-2xl font-bold font-mono ${
                  liveBelowCost ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {liveMargin < 0 ? `-${formatMoney(Math.abs(liveMargin))}` : formatMoney(liveMargin)}
              </span>
            </div>

            {liveBelowCost && (
              <span className="px-2.5 py-1 rounded-md bg-rose-600 text-white text-[11px] font-bold uppercase tracking-wider">
                Below Cost!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Form (Left) & Risk Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Order Form (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Calculator size={18} className="text-brand-600 dark:text-brand-400" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Order Attributes & Pricing Configuration
            </h2>
          </div>

          <form onSubmit={handleScore} className="space-y-4">
            {/* Product Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Product Selection ({optionsData?.products.length} products available)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Filter by ID/Category..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="sm:col-span-2 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {filteredProducts.map((p) => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.product_id} - {p.category} (List: {p.list_price}, Cost: {p.unit_cost})
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 grid grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Category</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedProduct.category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">List Price</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{formatMoney(selectedProduct.list_price)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Unit Cost</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{formatMoney(selectedProduct.unit_cost)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Lead Time</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{selectedProduct.supplier_lead_days}d</span>
                  </div>
                </div>
              )}
            </div>

            {/* Price & Quantity Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Unit Selling Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Discount Slider (0 to 25%) */}
            <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Discount Percentage (0 to 25%)
                </span>
                <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
                  {(discountPct * 100).toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.25"
                step="0.005"
                value={discountPct}
                onChange={(e) => setDiscountPct(parseFloat(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0% (No discount)</span>
                <span>12.5%</span>
                <span>25% (Max allowed)</span>
              </div>
            </div>

            {/* Order Date Time & Customer Tenure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Order Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={orderDateTime}
                  onChange={(e) => setOrderDateTime(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Customer Tenure (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  value={tenureDays}
                  onChange={(e) => setTenureDays(parseInt(e.target.value, 10) || 0)}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Categorical Dropdowns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Channel
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {optionsData?.options.channel.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {optionsData?.options.payment_method.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Region
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {optionsData?.options.region.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Customer Segment
                </label>
                <select
                  value={customerSegment}
                  onChange={(e) => setCustomerSegment(e.target.value)}
                  className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {optionsData?.options.customer_segment.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Preferred Channel
                </label>
                <select
                  value={preferredChannel}
                  onChange={(e) => setPreferredChannel(e.target.value)}
                  className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {optionsData?.options.preferred_channel.map((pc) => (
                    <option key={pc} value={pc}>{pc}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={scoring}
              className="w-full mt-4 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-semibold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              {scoring ? (
                <span>Running Prediction Model...</span>
              ) : (
                <>
                  <span>Evaluate Order Margin & Risk</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Prediction Results Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {scoreResult ? (
            <div className="space-y-5">
              {/* Margin Result Card */}
              <div
                className={`p-6 rounded-xl border shadow-sm ${
                  scoreResult.below_cost
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                    Net Profit Margin
                  </span>
                  {scoreResult.below_cost ? (
                    <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[11px] font-bold uppercase tracking-wider">
                      Below Cost
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
                      Profitable
                    </span>
                  )}
                </div>

                <div
                  className={`mt-2 text-4xl font-bold font-mono tracking-tight ${
                    scoreResult.margin < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {scoreResult.margin < 0 ? `-${formatMoney(Math.abs(scoreResult.margin))}` : formatMoney(scoreResult.margin)}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 flex justify-between">
                  <span>Unit Cost: {formatMoney(scoreResult.unit_cost)}</span>
                  <span>List Price: {formatMoney(scoreResult.list_price)}</span>
                </div>
              </div>

              {/* Amber Low-Confidence Model Warning Banner */}
              {scoreResult.warning && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-200 font-bold text-xs uppercase tracking-wider">
                      <AlertTriangle size={15} />
                      <span>Model Trust Advisory</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 text-[10px] font-bold">
                      Low Confidence
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed font-medium">
                    {scoreResult.warning}
                  </p>
                </div>
              )}

              {/* Cancellation Risk Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                      Cancel Probability
                    </h3>
                    <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                      {formatPercent(scoreResult.cancel.prob)}
                    </div>
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Reliable: {scoreResult.cancel.reliable ? 'Yes' : 'No (Noise)'}
                  </span>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Top Contributing Signals:
                  </span>
                  <ul className="space-y-1">
                    {scoreResult.cancel.reasons.map((r, i) => (
                      <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Return Risk Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                      Return Probability
                    </h3>
                    <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                      {formatPercent(scoreResult.return.prob)}
                    </div>
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Reliable: {scoreResult.return.reliable ? 'Yes' : 'No (Noise)'}
                  </span>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Top Contributing Signals:
                  </span>
                  <ul className="space-y-1">
                    {scoreResult.return.reasons.map((r, i) => (
                      <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-3 bg-white/50 dark:bg-slate-900/50">
              <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <Calculator size={24} />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Ready to Score Order
              </h3>
              <p className="text-xs text-slate-500 max-w-xs">
                Adjust the pricing parameters on the left or click "Load Demo Order" to evaluate margin and model risks.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
