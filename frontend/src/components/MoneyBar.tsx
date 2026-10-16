import React from 'react';
import { formatMoney } from '../lib/formatters';

interface MoneyBarProps {
  amount: number;
  maxAmount: number;
  color?: string;
}

export const MoneyBar: React.FC<MoneyBarProps> = ({
  amount,
  maxAmount,
  color = 'bg-brand-600 dark:bg-brand-500',
}) => {
  if (amount === 0) {
    return (
      <div className="flex flex-col min-w-[140px]">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 italic">
          Not measurable
        </span>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-1 overflow-hidden">
          <div className="w-0 h-full" />
        </div>
      </div>
    );
  }

  const pct = maxAmount > 0 ? Math.min(100, Math.max(4, (amount / maxAmount) * 100)) : 0;

  return (
    <div className="flex flex-col min-w-[140px]">
      <span className="text-sm font-semibold font-mono text-slate-900 dark:text-slate-100">
        {formatMoney(amount)}
      </span>
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-1 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
