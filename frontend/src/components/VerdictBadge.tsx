import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface VerdictBadgeProps {
  verdict: string;
  size?: 'sm' | 'md' | 'lg';
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({ verdict, size = 'md' }) => {
  const upper = verdict.toUpperCase();
  let theme = {
    bg: 'bg-ink-100 dark:bg-ink-800',
    text: 'text-ink-600 dark:text-ink-300',
    border: 'border-ink-200 dark:border-ink-700',
    icon: XCircle,
    iconColor: 'text-ink-400',
  };

  if (upper.includes('DATA CONFLICT')) {
    theme = {
      bg: 'bg-danger-50 dark:bg-danger-500/10',
      text: 'text-danger-700 dark:text-danger-500',
      border: 'border-danger-100 dark:border-danger-500/20',
      icon: AlertTriangle,
      iconColor: 'text-danger-500',
    };
  } else if (upper.includes('REAL')) {
    theme = {
      bg: 'bg-success-50 dark:bg-success-500/10',
      text: 'text-success-700 dark:text-success-500',
      border: 'border-success-100 dark:border-success-500/20',
      icon: CheckCircle2,
      iconColor: 'text-success-500',
    };
  } else if (upper.includes('NOISE')) {
    theme = {
      bg: 'bg-ink-100 dark:bg-ink-800',
      text: 'text-ink-600 dark:text-ink-400',
      border: 'border-ink-200 dark:border-ink-700',
      icon: XCircle,
      iconColor: 'text-ink-400',
    };
  } else if (upper.includes('ASSUMPTION')) {
    theme = {
      bg: 'bg-caution-50 dark:bg-caution-500/10',
      text: 'text-caution-700 dark:text-caution-500',
      border: 'border-caution-100 dark:border-caution-500/20',
      icon: AlertTriangle,
      iconColor: 'text-caution-500',
    };
  }

  const Icon = theme.icon;
  const sizeClasses = {
    sm: 'text-2xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
  }[size];

  const iconSize = { sm: 11, md: 13, lg: 15 }[size];

  return (
    <span
      className={`tag ${theme.bg} ${theme.text} ${theme.border} ${sizeClasses}`}
      title={`Verdict: ${verdict}`}
    >
      <Icon size={iconSize} className={theme.iconColor} />
      <span>{verdict}</span>
    </span>
  );
};
