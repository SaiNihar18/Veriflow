import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  return (
    <div className="card p-8 text-center my-6 border-danger-100 dark:border-danger-500/20">
      <div className="w-12 h-12 rounded-full bg-danger-50 dark:bg-danger-500/10 text-danger-500 flex items-center justify-center mx-auto mb-4">
        <AlertCircle size={24} />
      </div>
      <h3 className="text-base font-semibold text-ink-900 dark:text-ink-100">
        Unable to Load Data
      </h3>
      <p className="mt-1.5 text-sm text-ink-500 max-w-md mx-auto">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-primary mt-5 inline-flex items-center gap-2 bg-danger-600 hover:bg-danger-700"
        >
          <RefreshCw size={14} />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};
