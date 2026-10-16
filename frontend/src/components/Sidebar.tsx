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
  AlertCircle
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { path: '/', label: 'Leak Ledger', icon: PieChart, exact: true, description: 'Executive findings' },
  { path: '/investigate', label: 'Investigate', icon: TrendingDown, description: 'Trends & segments' },
  { path: '/check-order', label: 'Check Order', icon: Calculator, description: 'Margin simulator' },
  { path: '/inventory', label: 'Inventory', icon: Boxes, description: 'Stockout risk' },
  { path: '/campaigns', label: 'Campaigns', icon: Megaphone, description: 'Anomaly radar' },
  { path: '/trust', label: 'Model Trust', icon: ShieldCheck, description: 'Statistical disclosure' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink-950/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[260px] bg-ink-900 dark:bg-ink-950 border-r border-ink-800/60 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-ink-800/60">
          <div className="flex items-center gap-3">
            <img
              src="/veriflow-logo.jpeg"
              alt="Veriflow"
              className="w-8 h-8 rounded-lg object-cover ring-1 ring-ink-700/50"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div>
              <span className="font-bold text-[15px] text-white tracking-tight block leading-tight">
                Veriflow
              </span>
              <span className="text-2xs text-ink-400 font-medium">
                Loss Intelligence
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-ink-400 hover:bg-ink-800 transition-colors"
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="px-3 pb-2">
            <span className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-500">
              Analysis Suite
            </span>
          </div>
          <div className="space-y-0.5">
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
                    `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-brand-600/15 text-brand-400 font-semibold'
                        : 'text-ink-400 hover:text-ink-100 hover:bg-ink-800/60'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={`p-1.5 rounded-lg transition-colors ${
                        isActive ? 'bg-brand-600/20 text-brand-400' : 'text-ink-500 group-hover:text-ink-300'
                      }`}>
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate">{item.label}</span>
                        <span className={`text-2xs font-normal block truncate ${
                          isActive ? 'text-brand-400/60' : 'text-ink-600'
                        }`}>
                          {item.description}
                        </span>
                      </div>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3">
          <div className="px-3 py-3 rounded-xl bg-ink-800/40 border border-ink-700/40">
            <div className="flex items-start gap-2">
              <AlertCircle size={13} className="text-caution-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-2xs font-semibold text-ink-200 block">Honesty-First</span>
                <p className="text-2xs text-ink-500 leading-relaxed mt-0.5">
                  All findings verified with significance testing & model confidence bounds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
