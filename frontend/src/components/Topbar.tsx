import React from 'react';
import { Menu, Moon, Sun, Calendar } from 'lucide-react';

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
    <header className="sticky top-0 z-30 h-14 bg-white/90 dark:bg-ink-900/90 backdrop-blur-lg border-b border-ink-200/60 dark:border-ink-800/60 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu size={18} />
        </button>

        {/* Mobile Brand */}
        <div className="flex lg:hidden items-center gap-2">
          <img
            src="/veriflow-logo.jpeg"
            alt="Veriflow"
            className="w-7 h-7 rounded-lg object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="font-bold text-sm text-ink-900 dark:text-white">Veriflow</span>
        </div>

        {/* Desktop Tagline */}
        <div className="hidden lg:block">
          <span className="text-xs font-medium text-ink-400 dark:text-ink-500">
            See where your money leaks, and why.
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Data Period */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-50 dark:bg-ink-800/60 border border-ink-200/60 dark:border-ink-700/40 text-2xs text-ink-500 dark:text-ink-400">
          <Calendar size={12} className="text-ink-400" />
          <span className="font-mono font-medium">{datePeriod}</span>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDark}
          className="p-2 rounded-lg border border-ink-200/60 dark:border-ink-700/40 text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={15} className="text-caution-500" /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
};
