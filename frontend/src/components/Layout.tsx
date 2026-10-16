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
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950 flex transition-colors duration-150">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[260px]">
        <Topbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          datePeriod={datePeriod}
          isDark={isDark}
          onToggleDark={() => setIsDark((prev) => !prev)}
        />

        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7 max-w-[1360px] w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
