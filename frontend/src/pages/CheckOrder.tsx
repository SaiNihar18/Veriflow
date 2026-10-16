import React, { useEffect, useState } from 'react';
import {
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
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

  const [scoreResult, setScoreResult] = useState<OrderScoreResult | null>(null);

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

  useEffect(() => {
    if (!optionsData) return;
    const prod = optionsData.products.find((p) => p.product_id === productId);
    if (prod) {
      setSelectedProduct(prod);
      setUnitPrice(prod.list_price);
    }
  }, [productId, optionsData]);

  const currentUnitCost = selectedProduct?.unit_cost || 0;
  const liveEffectivePrice = unitPrice * (1 - discountPct);
  const liveMargin = Math.round((liveEffectivePrice - currentUnitCost) * 100) / 100;
  const liveBelowCost = liveEffectivePrice < currentUnitCost;

  const getDerivedDateTime = () => {
    const d = new Date(orderDateTime);
    const hour = isNaN(d.getHours()) ? 12 : d.getHours();
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
        product_id: productId, quantity, unit_price: unitPrice, discount_pct: discountPct,
        hour, dow, tenure_days: tenureDays, channel, payment_method: paymentMethod,
        region, customer_segment: customerSegment, preferred_channel: preferredChannel,
      };
      const res = await scoreOrder(payload);
      setScoreResult(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to score order');
    } finally {
      setScoring(false);
    }
  };

  const handleLoadDemoOrder = () => {
    if (!optionsData) return;
    const belowCostProd =
      optionsData.products.find((p) => p.product_id === 'PR0192') ||
      optionsData.products.find((p) => p.unit_cost > p.list_price) ||
      optionsData.products[0];
    setProductId(belowCostProd.product_id);
    setSelectedProduct(belowCostProd);
    setUnitPrice(belowCostProd.list_price);
    setDiscountPct(0.20);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink-900 dark:text-white tracking-tight">
            Check an Order
          </h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Simulate an order to check margin risks and predictive failure signals.
          </p>
        </div>
        <button
          onClick={handleLoadDemoOrder}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-caution-50 dark:bg-caution-500/10 hover:bg-caution-100 dark:hover:bg-caution-500/20 text-caution-700 dark:text-caution-500 border border-caution-100 dark:border-caution-500/20 text-xs font-semibold transition-all self-start sm:self-auto"
        >
          <Sparkles size={14} />
          <span>Load Demo (Below Cost)</span>
        </button>
      </div>

      {/* Live What-If Strip */}
      <div className={`p-4 rounded-2xl border transition-all ${
        liveBelowCost
          ? 'bg-danger-50 dark:bg-danger-500/5 border-danger-100 dark:border-danger-500/20'
          : 'bg-success-50 dark:bg-success-500/5 border-success-100 dark:border-success-500/20'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {liveBelowCost ? (
              <AlertTriangle className="text-danger-500 shrink-0" size={18} />
            ) : (
              <CheckCircle2 className="text-success-500 shrink-0" size={18} />
            )}
            <div>
              <span className="stat-label block">Live What-If Simulator</span>
              <span className="text-sm font-semibold text-ink-900 dark:text-white">
                Effective: {formatMoney(liveEffectivePrice)} · Cost: {formatMoney(currentUnitCost)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="stat-label block">Unit Margin</span>
              <span className={`text-2xl font-bold font-mono ${
                liveBelowCost ? 'text-danger-600 dark:text-danger-500' : 'text-success-600 dark:text-success-500'
              }`}>
                {liveMargin < 0 ? `-${formatMoney(Math.abs(liveMargin))}` : formatMoney(liveMargin)}
              </span>
            </div>
            {liveBelowCost && (
              <span className="tag bg-danger-600 text-white border-danger-600 text-2xs font-bold uppercase">Below Cost!</span>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Form + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form */}
        <div className="lg:col-span-7 card p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-ink-100 dark:border-ink-800">
            <Calculator size={16} className="text-brand-500" />
            <h2 className="card-title">Order Configuration</h2>
          </div>

          <form onSubmit={handleScore} className="space-y-4">
            {/* Product Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-700 dark:text-ink-300">
                Product ({optionsData?.products.length} available)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input type="text" placeholder="Filter…" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="input-base text-xs" />
                <select value={productId} onChange={(e) => setProductId(e.target.value)} className="sm:col-span-2 input-base text-xs font-mono">
                  {filteredProducts.map((p) => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.product_id} - {p.category} (List: {p.list_price}, Cost: {p.unit_cost})
                    </option>
                  ))}
                </select>
              </div>
              {selectedProduct && (
                <div className="p-2.5 rounded-lg bg-ink-50 dark:bg-ink-800/40 border border-ink-100 dark:border-ink-800/60 grid grid-cols-4 gap-2 text-center text-xs">
                  <div><span className="stat-label block">Category</span><span className="font-semibold text-ink-800 dark:text-ink-200">{selectedProduct.category}</span></div>
                  <div><span className="stat-label block">List</span><span className="font-mono font-semibold text-ink-800 dark:text-ink-200">{formatMoney(selectedProduct.list_price)}</span></div>
                  <div><span className="stat-label block">Cost</span><span className="font-mono font-semibold text-ink-800 dark:text-ink-200">{formatMoney(selectedProduct.unit_cost)}</span></div>
                  <div><span className="stat-label block">Lead</span><span className="font-mono font-semibold text-ink-800 dark:text-ink-200">{selectedProduct.supplier_lead_days}d</span></div>
                </div>
              )}
            </div>

            {/* Price & Qty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-ink-700 dark:text-ink-300">Unit Price</label>
                <input type="number" step="0.01" min="0.1" value={unitPrice} onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)} className="input-base mt-1 w-full font-mono" />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-700 dark:text-ink-300">Quantity</label>
                <input type="number" min="1" max="100" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)} className="input-base mt-1 w-full font-mono" />
              </div>
            </div>

            {/* Discount Slider */}
            <div className="space-y-1.5 p-3 rounded-xl bg-ink-50 dark:bg-ink-800/40 border border-ink-100 dark:border-ink-800/60">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ink-700 dark:text-ink-300">Discount (0–25%)</span>
                <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{(discountPct * 100).toFixed(1)}%</span>
              </div>
              <input type="range" min="0" max="0.25" step="0.005" value={discountPct} onChange={(e) => setDiscountPct(parseFloat(e.target.value))} className="w-full accent-brand-600 cursor-pointer" />
              <div className="flex justify-between text-2xs text-ink-400">
                <span>0%</span><span>12.5%</span><span>25%</span>
              </div>
            </div>

            {/* Date & Tenure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-ink-700 dark:text-ink-300">Order Date & Time</label>
                <input type="datetime-local" value={orderDateTime} onChange={(e) => setOrderDateTime(e.target.value)} className="input-base mt-1 w-full text-xs font-mono" />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-700 dark:text-ink-300">Customer Tenure (Days)</label>
                <input type="number" min="0" value={tenureDays} onChange={(e) => setTenureDays(parseInt(e.target.value, 10) || 0)} className="input-base mt-1 w-full font-mono" />
              </div>
            </div>

            {/* Categoricals */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Channel', value: channel, setter: setChannel, opts: optionsData?.options.channel },
                { label: 'Payment', value: paymentMethod, setter: setPaymentMethod, opts: optionsData?.options.payment_method },
                { label: 'Region', value: region, setter: setRegion, opts: optionsData?.options.region },
                { label: 'Segment', value: customerSegment, setter: setCustomerSegment, opts: optionsData?.options.customer_segment },
              ].map(({ label, value, setter, opts }) => (
                <div key={label}>
                  <label className="stat-label">{label}</label>
                  <select value={value} onChange={(e) => setter(e.target.value)} className="input-base mt-1 w-full text-xs">
                    {opts?.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div className="col-span-2">
                <label className="stat-label">Preferred Channel</label>
                <select value={preferredChannel} onChange={(e) => setPreferredChannel(e.target.value)} className="input-base mt-1 w-full text-xs">
                  {optionsData?.options.preferred_channel.map((pc) => <option key={pc} value={pc}>{pc}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" disabled={scoring} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
              {scoring ? <span>Running Model…</span> : <><span>Evaluate Order</span><ArrowRight size={15} /></>}
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-5 space-y-5">
          {scoreResult ? (
            <div className="space-y-4 animate-slide-up">
              {/* Margin */}
              <div className={`card p-6 ${scoreResult.below_cost ? 'border-danger-100 dark:border-danger-500/20 bg-danger-50/50 dark:bg-danger-500/5' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="stat-label">Net Profit Margin</span>
                  {scoreResult.below_cost ? (
                    <span className="tag bg-danger-600 text-white border-danger-600 text-2xs font-bold uppercase">Below Cost</span>
                  ) : (
                    <span className="tag bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-500 border-success-100 dark:border-success-500/20 text-2xs font-bold uppercase">Profitable</span>
                  )}
                </div>
                <div className={`mt-2 text-4xl font-bold font-mono tracking-tight ${scoreResult.margin < 0 ? 'text-danger-600 dark:text-danger-500' : 'text-ink-900 dark:text-white'}`}>
                  {scoreResult.margin < 0 ? `-${formatMoney(Math.abs(scoreResult.margin))}` : formatMoney(scoreResult.margin)}
                </div>
                <div className="mt-3 pt-3 border-t border-ink-100 dark:border-ink-800/60 text-xs text-ink-500 flex justify-between">
                  <span>Cost: {formatMoney(scoreResult.unit_cost)}</span>
                  <span>List: {formatMoney(scoreResult.list_price)}</span>
                </div>
              </div>

              {/* Warning */}
              {scoreResult.warning && (
                <div className="card p-4 border-caution-100 dark:border-caution-500/20 bg-caution-50/50 dark:bg-caution-500/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-caution-700 dark:text-caution-500 font-bold text-xs uppercase tracking-wider">
                      <AlertTriangle size={14} />
                      <span>Model Trust Advisory</span>
                    </div>
                    <span className="tag bg-caution-100 dark:bg-caution-500/20 text-caution-700 dark:text-caution-500 border-caution-100 dark:border-caution-500/20 text-2xs font-bold">Low Confidence</span>
                  </div>
                  <p className="text-xs text-caution-700 dark:text-caution-500 leading-relaxed">{scoreResult.warning}</p>
                </div>
              )}

              {/* Cancel Risk */}
              <div className="card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="stat-label">Cancel Probability</h3>
                    <div className="stat-value mt-1">{formatPercent(scoreResult.cancel.prob)}</div>
                  </div>
                  <span className="tag bg-ink-50 dark:bg-ink-800 text-ink-500 border-ink-200 dark:border-ink-700 text-2xs">
                    Reliable: {scoreResult.cancel.reliable ? 'Yes' : 'No (Noise)'}
                  </span>
                </div>
                <div className="pt-2">
                  <span className="stat-label block mb-1">Top Signals:</span>
                  <ul className="space-y-1">
                    {scoreResult.cancel.reasons.map((r, i) => (
                      <li key={i} className="text-xs text-ink-600 dark:text-ink-300 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-ink-400" /><span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Return Risk */}
              <div className="card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="stat-label">Return Probability</h3>
                    <div className="stat-value mt-1">{formatPercent(scoreResult.return.prob)}</div>
                  </div>
                  <span className="tag bg-ink-50 dark:bg-ink-800 text-ink-500 border-ink-200 dark:border-ink-700 text-2xs">
                    Reliable: {scoreResult.return.reliable ? 'Yes' : 'No (Noise)'}
                  </span>
                </div>
                <div className="pt-2">
                  <span className="stat-label block mb-1">Top Signals:</span>
                  <ul className="space-y-1">
                    {scoreResult.return.reasons.map((r, i) => (
                      <li key={i} className="text-xs text-ink-600 dark:text-ink-300 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-ink-400" /><span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full card p-8 flex flex-col items-center justify-center text-center space-y-3 border-dashed">
              <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-600/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <Calculator size={24} />
              </div>
              <h3 className="text-sm font-semibold text-ink-800 dark:text-ink-200">Ready to Score</h3>
              <p className="text-xs text-ink-500 max-w-xs">Adjust parameters or load a demo order.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
