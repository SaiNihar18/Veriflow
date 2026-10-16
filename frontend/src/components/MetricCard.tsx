import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  trend?: 'neutral' | 'positive' | 'negative' | 'warning';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  badge,
  trend = 'neutral',
  className = '',
}) => {
  const trendClasses = {
    neutral: 'text-slate-500 dark:text-slate-400',
    positive: 'text-emerald-600 dark:text-emerald-400',
    negative: 'text-rose-600 dark:text-rose-400',
    warning: 'text-amber-600 dark:text-amber-400',
  }[trend];

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        {badge ? (
          badge
        ) : Icon ? (
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Icon size={18} />
          </div>
        ) : null}
      </div>

      <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-slate-50 tracking-tight">
        {value}
      </div>

      {subtext && (
        <div className={`mt-2 text-xs font-medium ${trendClasses}`}>
          {subtext}
        </div>
      )}
    </div>
  );
};
