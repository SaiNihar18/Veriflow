import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Lock,
  Database,
  Calendar,
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
      { name: 'Baseline (Category Rate)', metrics: outcome.baseline_category_rate },
      { name: 'Logistic Regression', metrics: outcome.logistic_regression },
      { name: 'Gradient Boosting', metrics: outcome.gradient_boosting },
    ];

    return (
      <div className="card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="card-title capitalize">
              {name} ({formatNumber(outcome.test_rows)} test rows)
            </h3>
            <p className="card-subtitle">
              Positive Rate: {formatPercent(outcome.test_positive_rate)}
            </p>
          </div>
          <span className={`tag text-2xs font-bold ${
            outcome.reliable_signal
              ? 'bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-500 border-success-100 dark:border-success-500/20'
              : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-400 border-ink-200 dark:border-ink-700'
          }`}>
            {outcome.reliable_signal ? 'Reliable Signal' : 'No Reliable Signal'}
          </span>
        </div>

        <div className="overflow-x-auto border border-ink-200/60 dark:border-ink-800/60 rounded-xl">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-ink-50 dark:bg-ink-800/40 font-sans text-ink-500 dark:text-ink-400 border-b border-ink-100 dark:border-ink-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Architecture</th>
                <th className="py-2.5 px-3 font-semibold">ROC-AUC</th>
                <th className="py-2.5 px-3 font-semibold">95% CI</th>
                <th className="py-2.5 px-3 font-semibold">PR-AUC</th>
                <th className="py-2.5 px-3 font-semibold">Top 10% Lift</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-ink-800/60">
              {rows.map((row) => (
                <tr key={row.name} className="hover:bg-ink-50/50 dark:hover:bg-ink-800/20 transition-colors">
                  <td className="py-2.5 px-3 font-sans font-medium text-ink-800 dark:text-ink-200">{row.name}</td>
                  <td className="py-2.5 px-3 font-bold text-ink-900 dark:text-white">{row.metrics.roc_auc.toFixed(3)}</td>
                  <td className="py-2.5 px-3 text-ink-500">[{row.metrics.auc_95ci[0].toFixed(3)}, {row.metrics.auc_95ci[1].toFixed(3)}]</td>
                  <td className="py-2.5 px-3 text-ink-500">{row.metrics.pr_auc.toFixed(3)}</td>
                  <td className="py-2.5 px-3 text-ink-500">{row.metrics.lift_top10pct.toFixed(2)}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-ink-50 dark:bg-ink-800/40 rounded-lg border border-ink-200/60 dark:border-ink-700/40 text-xs text-ink-600 dark:text-ink-300">
          <span className="font-semibold text-ink-900 dark:text-white">Verdict: </span>
          {outcome.verdict}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-ink-900 dark:text-white tracking-tight">
          Model & Data Trust
        </h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Statistical disclosure, confidence intervals, and governance caveats.
        </p>
      </div>

      {/* Data Disclaimer */}
      <div className="card p-5 border-caution-100 dark:border-caution-500/20 bg-caution-50/50 dark:bg-caution-500/5 space-y-2">
        <div className="flex items-center gap-2 text-caution-700 dark:text-caution-500">
          <AlertTriangle size={16} />
          <h2 className="text-xs font-bold uppercase tracking-wider">
            Benchmark Data Disclaimer
          </h2>
        </div>
        <p className="text-sm text-caution-700 dark:text-caution-500 leading-relaxed">
          Records are from standard competition benchmark datasets. Where data lacks genuine driver signals, the system marks them as <strong>NOISE</strong>.
        </p>
      </div>

      {/* Split Card */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
          <Calendar size={16} />
          <h2 className="text-xs font-bold uppercase tracking-wider">Time-Based Train / Test Split</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
          <div className="p-3 bg-ink-50 dark:bg-ink-800/40 rounded-lg">
            <span className="stat-label block">Architecture</span>
            <span className="text-sm font-bold text-ink-900 dark:text-white capitalize">{data.split.type}</span>
          </div>
          <div className="p-3 bg-ink-50 dark:bg-ink-800/40 rounded-lg">
            <span className="stat-label block">Training (9 Months)</span>
            <span className="text-sm font-bold text-ink-900 dark:text-white">{data.split.train}</span>
          </div>
          <div className="p-3 bg-ink-50 dark:bg-ink-800/40 rounded-lg">
            <span className="stat-label block">Out-of-Time Test (Q4)</span>
            <span className="text-sm font-bold text-ink-900 dark:text-white">{data.split.test}</span>
          </div>
        </div>
      </div>

      {/* Model Tables */}
      <div className="space-y-5">
        {renderModelTable('Order Cancellation Model', data.model_a_order_outcome.cancel)}
        {renderModelTable('Order Return Model', data.model_a_order_outcome.return)}
      </div>

      {/* Significance Testing */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
          <ShieldCheck size={16} />
          <h2 className="text-xs font-bold uppercase tracking-wider">
            Multiple Testing Correction
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
          <div className="p-3.5 bg-ink-50 dark:bg-ink-800/40 rounded-lg">
            <span className="stat-label block">Hypotheses Tested</span>
            <span className="stat-value">{data.significance_tests.n_tests}</span>
          </div>
          <div className="p-3.5 bg-ink-50 dark:bg-ink-800/40 rounded-lg">
            <span className="stat-label block">p &lt; 0.05 Before</span>
            <span className="text-2xl font-bold text-caution-600 dark:text-caution-500">
              {data.significance_tests.sig_before_correction} / {data.significance_tests.n_tests}
            </span>
            <span className="text-2xs font-sans text-ink-400 block mt-0.5">Spurious false positive</span>
          </div>
          <div className="p-3.5 bg-ink-50 dark:bg-ink-800/40 rounded-lg">
            <span className="stat-label block">After BH Correction</span>
            <span className="stat-value">{data.significance_tests.sig_after_correction} / {data.significance_tests.n_tests}</span>
            <span className="text-2xs font-sans text-ink-400 block mt-0.5">Zero drivers survive</span>
          </div>
        </div>
        <p className="text-xs text-ink-500 leading-relaxed">
          <strong className="text-ink-700 dark:text-ink-300">Methodology: </strong>{data.significance_tests.method}
        </p>
      </div>

      {/* Two Column: Caveats + Disclosure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-caution-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-ink-300">
              Data Caveats ({data.data_caveats.length})
            </h2>
          </div>
          <ul className="space-y-2">
            {data.data_caveats.map((caveat, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-ink-600 dark:text-ink-300 leading-relaxed p-2.5 rounded-lg bg-ink-50 dark:bg-ink-800/40 border border-ink-100 dark:border-ink-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-caution-500 shrink-0 mt-1.5" />
                <span>{caveat}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-brand-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-ink-300">
              System Disclosure
            </h2>
          </div>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-ink-50 dark:bg-ink-800/40 rounded-lg">
              <span className="stat-label block mb-1.5">Libraries</span>
              <div className="flex flex-wrap gap-1.5 font-mono">
                {data.disclosure.libraries.map((lib) => (
                  <span key={lib} className="tag bg-white dark:bg-ink-700 text-ink-700 dark:text-ink-200 border-ink-200 dark:border-ink-600 text-2xs">
                    {lib}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-3 bg-ink-50 dark:bg-ink-800/40 rounded-lg">
                <span className="stat-label block">Pretrained</span>
                <span className="font-mono font-bold text-ink-900 dark:text-white text-sm capitalize">{data.disclosure.pretrained_models}</span>
              </div>
              <div className="p-3 bg-ink-50 dark:bg-ink-800/40 rounded-lg">
                <span className="stat-label block">External APIs</span>
                <span className="font-mono font-bold text-ink-900 dark:text-white text-sm capitalize">{data.disclosure.external_apis}</span>
              </div>
              <div className="p-3 bg-ink-50 dark:bg-ink-800/40 rounded-lg">
                <span className="stat-label block">External Data</span>
                <span className="font-mono font-bold text-ink-900 dark:text-white text-sm capitalize">{data.disclosure.external_data}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
