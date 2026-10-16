// Currency constant (empty by default per requirements, easily changed to '$' or '₹' if desired)
export const CURRENCY = "";

export const VERDICT_STYLES: Record<string, {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  iconType: 'check' | 'alert' | 'x' | 'help';
}> = {
  REAL: {
    label: "REAL",
    badgeBg: "bg-success-50 dark:bg-success-500/10",
    badgeText: "text-success-700 dark:text-success-500",
    badgeBorder: "border-success-100 dark:border-success-500/20",
    dotColor: "bg-success-500",
    iconType: "check",
  },
  NOISE: {
    label: "NOISE",
    badgeBg: "bg-ink-100 dark:bg-ink-800",
    badgeText: "text-ink-600 dark:text-ink-400",
    badgeBorder: "border-ink-200 dark:border-ink-700",
    dotColor: "bg-ink-400",
    iconType: "x",
  },
  "ASSUMPTION-DEPENDENT": {
    label: "ASSUMPTION-DEPENDENT",
    badgeBg: "bg-caution-50 dark:bg-caution-500/10",
    badgeText: "text-caution-700 dark:text-caution-500",
    badgeBorder: "border-caution-100 dark:border-caution-500/20",
    dotColor: "bg-caution-500",
    iconType: "alert",
  },
  "DATA CONFLICT": {
    label: "DATA CONFLICT",
    badgeBg: "bg-danger-50 dark:bg-danger-500/10",
    badgeText: "text-danger-700 dark:text-danger-500",
    badgeBorder: "border-danger-100 dark:border-danger-500/20",
    dotColor: "bg-danger-500",
    iconType: "alert",
  },
};

export const STATUS_COLORS: Record<string, string> = {
  Completed: "#22C55E",
  Cancelled: "#EF4444",
  Returned:  "#F59E0B",
  Pending:   "#3366FF",
};

/* Shared chart tooltip style for dark tooltips */
export const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#0E1629',
  borderColor: '#2A3550',
  borderRadius: '10px',
  boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.4)',
  padding: '10px 14px',
};

export const CHART_ITEM_STYLE = {
  color: '#F0F2F5',
  fontSize: '12px',
  fontWeight: 500,
};

export const CHART_LABEL_STYLE = {
  color: '#7D89A1',
  fontSize: '11px',
  fontWeight: 600,
  marginBottom: '4px',
};

export const CHART_AXIS_COLOR = '#7D89A1';
