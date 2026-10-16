import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  PieChart,
  TrendingDown,
  Calculator,
  Boxes,
  Megaphone,
  ShieldCheck,
  X,
  Droplets,
  AlertCircle
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { path: '/', label: 'Leak Ledger', icon: PieChart, exact: true },
  { path: '/investigate', label: 'Investigate', icon: TrendingDown },
  { path: '/check-order', label: 'Check an Order', icon: Calculator },
  { path: '/inventory', label: 'Inventory', icon: Boxes },
  { path: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { path: '/trust', label: 'Model & Data Trust', icon: ShieldCheck },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between`}
      >
        <div>
          {/* Logo & Brand Header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 flex items-center justify-center shadow-sm text-white">
                <Droplets size={20} className="stroke-[2.2]" />
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-1">
                  Veriflow
                </span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">
                  Retail Loss Intelligence
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Decision Suite
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 font-semibold shadow-sm border border-brand-100 dark:border-brand-900/40'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon size={18} className="shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom honesty footer badge */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 m-3 rounded-xl border">
          <div className="flex items-start gap-2">
            <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-slate-400 leading-tight">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Honesty First</span>
              <p className="mt-0.5 text-[11px]">
                Findings verified with significance testing and model confidence bounds.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
