import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

interface VerdictBadgeProps {
  verdict: string;
  size?: 'sm' | 'md' | 'lg';
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({ verdict, size = 'md' }) => {
  const upper = verdict.toUpperCase();
  let badgeTheme = {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    icon: XCircle,
    color: 'text-slate-500',
  };

  if (upper.includes('DATA CONFLICT')) {
    badgeTheme = {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
      icon: AlertTriangle,
      color: 'text-rose-500',
    };
  } else if (upper.includes('REAL')) {
    badgeTheme = {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: CheckCircle2,
      color: 'text-emerald-500',
    };
  } else if (upper.includes('NOISE')) {
    badgeTheme = {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-300 dark:border-slate-700',
      icon: XCircle,
      color: 'text-slate-400',
    };
  } else if (upper.includes('ASSUMPTION')) {
    badgeTheme = {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      icon: AlertTriangle,
      color: 'text-amber-500',
    };
  }

  const IconComponent = badgeTheme.icon;
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
  }[size];

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-colors ${badgeTheme.bg} ${badgeTheme.text} ${badgeTheme.border} ${sizeClasses}`}
      title={`Verdict: ${verdict}`}
    >
      <IconComponent size={iconSizes} className={badgeTheme.color} />
      <span>{verdict}</span>
    </span>
  );
};
