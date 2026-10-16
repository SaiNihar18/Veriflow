import { CURRENCY } from './constants';

/**
 * Format money amounts as plain numbers with thousands separators.
 * If CURRENCY is set, it prepends the currency symbol.
 */
export function formatMoney(
  amount: number | null | undefined,
  options?: { showZeroAsNotMeasurable?: boolean }
): string {
  if (amount === null || amount === undefined) return "-";
  
  if (amount === 0 && options?.showZeroAsNotMeasurable) {
    return "Not measurable";
  }

  // Format with thousands separator
  const rounded = Math.round(amount);
  const formatted = Math.abs(rounded).toLocaleString('en-US');
  const sign = rounded < 0 ? "-" : "";
  
  return CURRENCY ? `${sign}${CURRENCY}${formatted}` : `${sign}${formatted}`;
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return "-";
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return value.toLocaleString('en-US');
}

export function formatRate(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return (value * 100).toFixed(1) + "%";
}
