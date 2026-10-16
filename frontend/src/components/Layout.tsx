import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { fetchOverview } from '../lib/api';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [datePeriod, setDatePeriod] = useState<string>('2025-01-01 to 2025-12-31');

  // Dark mode state
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('veriflow_theme') || localStorage.getItem('leaklens_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('veriflow_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('veriflow_theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    fetchOverview()
      .then((data) => {
        if (data.date_range?.period_label) {
          setDatePeriod(data.date_range.period_label);
        }
      })
      .catch(() => {
        // Fallback default date
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-150">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Topbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          datePeriod={datePeriod}
          isDark={isDark}
          onToggleDark={() => setIsDark((prev) => !prev)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
