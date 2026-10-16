import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
  Database,
  Info,
  Calendar,
  XCircle
} from 'lucide-react';
import { fetchModelTrust } from '../lib/api';
import { ModelTrustData, ModelAEvaluation } from '../types';
import { MetricCard } from '../components/MetricCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { formatPercent, formatNumber } from '../lib/formatters';

export const ModelTrust: React.FC = () => {
  const [data, setData] = useState<ModelTrustData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchModelTrust();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load model trust metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoadingSkeleton rows={5} />;
  if (error || !data) return <ErrorDisplay message={error || 'No model metrics found'} onRetry={loadData} />;

  const renderModelTable = (name: string, outcome: ModelAEvaluation) => {
    const rows = [
      {
        name: 'Baseline (Category Rate)',
        metrics: outcome.baseline_category_rate,
      },
      {
        name: 'Logistic Regression',
        metrics: outcome.logistic_regression,
      },
      {
        name: 'Gradient Boosting',
        metrics: outcome.gradient_boosting,
      },
    ];

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white capitalize">
              {name} Prediction Models ({formatNumber(outcome.test_rows)} test transactions)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Positive Test Rate: {formatPercent(outcome.test_positive_rate)}
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              outcome.reliable_signal
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {outcome.reliable_signal ? 'Reliable Signal' : 'No Reliable Signal'}
          </span>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-slate-800/60 font-sans text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Model Architecture</th>
                <th className="py-2.5 px-3 font-semibold">Test ROC-AUC</th>
                <th className="py-2.5 px-3 font-semibold">AUC 95% Confidence Interval</th>
                <th className="py-2.5 px-3 font-semibold">PR-AUC</th>
                <th className="py-2.5 px-3 font-semibold">Top 10% Lift</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row) => (
                <tr key={row.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                    {row.name}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                    {row.metrics.roc_auc.toFixed(3)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                    [{row.metrics.auc_95ci[0].toFixed(3)}, {row.metrics.auc_95ci[1].toFixed(3)}]
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                    {row.metrics.pr_auc.toFixed(3)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                    {row.metrics.lift_top10pct.toFixed(2)}x
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-slate-900 dark:text-white">Verdict: </span>
          {outcome.verdict}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Model & Data Trust
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Complete statistical disclosure, confidence intervals, train/test split verification, and governance caveats.
        </p>
      </div>

      {/* Prominent Benchmark Data Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl p-5 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <AlertTriangle size={18} />
          <h2 className="text-sm font-bold uppercase tracking-wider">
            Benchmark Environment & Data Governance Disclaimer
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-300 leading-relaxed font-medium">
          The records analyzed here are drawn from standard competition benchmark datasets. Veriflow rigorously tests all features for statistical significance; where data lacks genuine driver signals, the system highlights them as <strong>NOISE</strong> rather than inventing spurious correlations.
        </p>
      </div>

      {/* Time-Based Split Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
          <Calendar size={18} />
          <h2 className="text-sm font-bold uppercase tracking-wider">
            Time-Based Train / Test Evaluation Split
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 font-mono">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <span className="text-[10px] uppercase font-sans text-slate-400 font-semibold block">Split Architecture</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">{data.split.type}</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <span className="text-[10px] uppercase font-sans text-slate-400 font-semibold block">Training Period (9 Months)</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{data.split.train}</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <span className="text-[10px] uppercase font-sans text-slate-400 font-semibold block">Out-of-Time Test Period (Q4)</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{data.split.test}</span>
          </div>
        </div>
      </div>

      {/* Model A Comparison Tables (Cancel & Return) */}
      <div className="space-y-6">
        {renderModelTable('Order Cancellation Model', data.model_a_order_outcome.cancel)}
        {renderModelTable('Order Return Model', data.model_a_order_outcome.return)}
      </div>

      {/* Significance Testing Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
          <ShieldCheck size={18} />
          <h2 className="text-sm font-bold uppercase tracking-wider">
            Multiple Testing & Significance Correction
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <span className="text-xs font-sans text-slate-400 block">Total Hypotheses Tested</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {data.significance_tests.n_tests} Tests
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <span className="text-xs font-sans text-slate-400 block">p &lt; 0.05 Before Correction</span>
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {data.significance_tests.sig_before_correction} of {data.significance_tests.n_tests}
            </span>
            <span className="text-[11px] font-sans text-slate-400 block mt-0.5">Spurious false positive</span>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <span className="text-xs font-sans text-slate-400 block">Significant After Benjamini-Hochberg</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {data.significance_tests.sig_after_correction} of {data.significance_tests.n_tests}
            </span>
            <span className="text-[11px] font-sans text-slate-400 block mt-0.5">Zero drivers survive correction</span>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          <strong>Methodology: </strong>{data.significance_tests.method}. Multiple testing correction prevents false alarms by adjusting false discovery rates across subgroup permutations.
        </p>
      </div>

      {/* Two Column Grid: Data Caveats & Disclosures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Caveats */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Database size={18} className="text-amber-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Known Data Caveats ({data.data_caveats.length})
            </h2>
          </div>

          <ul className="space-y-2.5">
            {data.data_caveats.map((caveat, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                <span>{caveat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Disclosure Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Lock size={18} className="text-brand-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              System Disclosure
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <span className="text-slate-400 font-semibold block mb-1">Open-Source Python Libraries:</span>
              <div className="flex flex-wrap gap-1.5 font-mono">
                {data.disclosure.libraries.map((lib) => (
                  <span key={lib} className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200">
                    {lib}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-semibold">Pretrained Models</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white capitalize">{data.disclosure.pretrained_models}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-semibold">External APIs</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white capitalize">{data.disclosure.external_apis}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-semibold">External Data</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white capitalize">{data.disclosure.external_data}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
