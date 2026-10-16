import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="space-y-4 animate-pulse">
      {/* KPI skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800"
          />
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />

      {/* List skeleton */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        ))}
      </div>
    </div>
  );
};
