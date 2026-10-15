import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

export function formatCurrency(amount, currency = 'PKR') {
  if (typeof amount !== 'number' || isNaN(amount)) return `${currency} 0`;
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatNumber(num) {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

export function formatPercent(value) {
  if (typeof value !== 'number' || isNaN(value)) return '0%';
  return value.toFixed(1) + '%';
}

export function formatDate(dateStr) {
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (!isValid(d)) return 'N/A';
    return format(d, 'MMM dd, yyyy');
  } catch {
    return 'N/A';
  }
}

export function formatDateShort(dateStr) {
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (!isValid(d)) return 'N/A';
    return format(d, 'dd MMM');
  } catch {
    return 'N/A';
  }
}

export function formatRelative(dateStr) {
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (!isValid(d)) return 'N/A';
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return 'N/A';
  }
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
