import React from 'react';
import { Menu, Moon, Sun, Calendar, Droplets } from 'lucide-react';

interface TopbarProps {
  onToggleSidebar: () => void;
  datePeriod?: string;
  isDark: boolean;
  onToggleDark: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleSidebar,
  datePeriod = '2025-01-01 to 2025-12-31',
  isDark,
  onToggleDark,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu size={20} />
        </button>

        {/* Mobile Brand */}
        <div className="flex lg:hidden items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
            <Droplets size={16} />
          </div>
          <span className="font-bold text-slate-900 dark:text-white">Veriflow</span>
        </div>

        {/* Desktop Tagline */}
        <div className="hidden lg:block">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            See where your money leaks, and why.
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Data Period Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
          <Calendar size={13} className="text-slate-400" />
          <span className="font-mono text-[11px] font-medium">{datePeriod}</span>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDark}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle dark mode"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  );
};
