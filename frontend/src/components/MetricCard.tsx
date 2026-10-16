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
    neutral:  'text-ink-500 dark:text-ink-400',
    positive: 'text-success-600 dark:text-success-500',
    negative: 'text-danger-600 dark:text-danger-500',
    warning:  'text-caution-600 dark:text-caution-500',
  }[trend];

  const iconBg = {
    neutral:  'bg-ink-100 dark:bg-ink-800 text-ink-500',
    positive: 'bg-success-50 dark:bg-success-500/10 text-success-600 dark:text-success-500',
    negative: 'bg-danger-50 dark:bg-danger-500/10 text-danger-600 dark:text-danger-500',
    warning:  'bg-caution-50 dark:bg-caution-500/10 text-caution-600 dark:text-caution-500',
  }[trend];

  return (
    <div
      className={`card p-5 group animate-slide-up ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="stat-label leading-tight">
          {label}
        </span>
        {badge ? (
          badge
        ) : Icon ? (
          <div className={`p-2 rounded-lg ${iconBg} transition-colors`}>
            <Icon size={16} strokeWidth={2} />
          </div>
        ) : null}
      </div>

      <div className="stat-value">
        {value}
      </div>

      {subtext && (
        <div className={`mt-2 text-xs font-medium leading-snug ${trendClasses}`}>
          {subtext}
        </div>
      )}
    </div>
  );
};
