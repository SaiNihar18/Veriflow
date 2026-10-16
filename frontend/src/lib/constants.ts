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
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/40",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    badgeBorder: "border-emerald-200 dark:border-emerald-800",
    dotColor: "bg-emerald-500",
    iconType: "check",
  },
  NOISE: {
    label: "NOISE",
    badgeBg: "bg-slate-100 dark:bg-slate-800",
    badgeText: "text-slate-600 dark:text-slate-300",
    badgeBorder: "border-slate-200 dark:border-slate-700",
    dotColor: "bg-slate-400",
    iconType: "x",
  },
  "ASSUMPTION-DEPENDENT": {
    label: "ASSUMPTION-DEPENDENT",
    badgeBg: "bg-amber-50 dark:bg-amber-950/40",
    badgeText: "text-amber-700 dark:text-amber-300",
    badgeBorder: "border-amber-200 dark:border-amber-800",
    dotColor: "bg-amber-500",
    iconType: "alert",
  },
  "DATA CONFLICT": {
    label: "DATA CONFLICT",
    badgeBg: "bg-rose-50 dark:bg-rose-950/40",
    badgeText: "text-rose-700 dark:text-rose-300",
    badgeBorder: "border-rose-200 dark:border-rose-800",
    dotColor: "bg-rose-500",
    iconType: "alert",
  },
};

export const STATUS_COLORS: Record<string, string> = {
  Completed: "#10B981", // Emerald 500
  Cancelled: "#EF4444", // Red 500
  Returned: "#F59E0B",  // Amber 500
  Pending: "#6366F1",   // Indigo 500
};
