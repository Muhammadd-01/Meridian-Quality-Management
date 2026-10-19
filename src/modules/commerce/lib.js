/**
 * Shared calculations for the commerce pages, dashboards, reports and insights.
 * Everything here is computed from records — no hard-coded figures.
 */
import { formatCurrency, formatNumber } from '../../utils/format';

/** Order statuses that count as recognised revenue (payment captured, not reversed). */
export const REVENUE_STATUSES = ['Paid', 'Shipped', 'Delivered'];
export const isRevenue = (o) => REVENUE_STATUSES.includes(o.status);

/** Allowed next steps in the order workflow. */
export const ORDER_FLOW = {
  Pending: ['Paid', 'Cancelled'],
  Paid: ['Shipped', 'Cancelled', 'Refunded'],
  Shipped: ['Delivered', 'Refunded'],
  Delivered: ['Refunded'],
  Cancelled: [],
  Refunded: [],
};
export const ORDER_TONES = { Pending: 'warning', Paid: 'info', Shipped: 'primary', Delivered: 'success', Cancelled: 'danger', Refunded: 'gray' };

export const todayISO = () => new Date().toISOString().slice(0, 10);
export const dayOf = (v) => String(v || '').slice(0, 10);
export const monthOf = (v) => String(v || '').slice(0, 7);
export const daysBetween = (a, b) => Math.round((new Date(`${dayOf(b)}T00:00:00Z`) - new Date(`${dayOf(a)}T00:00:00Z`)) / 86400000);
export const addDaysISO = (iso, n) => { const d = new Date(`${dayOf(iso)}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

/** Last `n` months as [{ key: '2026-10', label: 'Oct' }], ending with the current month. */
export function lastMonths(n = 6, end = new Date()) {
  const out = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - i, 1));
    out.push({ key: d.toISOString().slice(0, 7), label: d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }) });
  }
  return out;
}

/** Sum (or count) per month for the last `n` months. */
export function monthlySeries(records, dateField, valueFn = () => 1, n = 6) {
  const months = lastMonths(n);
  const totals = Object.fromEntries(months.map(m => [m.key, 0]));
  records.forEach(r => {
    const k = monthOf(r[dateField]);
    if (k in totals) totals[k] += Number(valueFn(r)) || 0;
  });
  return months.map(m => ({ month: m.label, key: m.key, value: totals[m.key] }));
}

/** % change between the last two values of a series (null if no base). */
export function changeOf(values) {
  if (values.length < 2) return null;
  const prev = values[values.length - 2];
  const cur = values[values.length - 1];
  if (!prev) return null;
  return ((cur - prev) / prev) * 100;
}
export const changeProps = (values) => {
  const c = changeOf(values);
  if (c === null) return {};
  return { change: `${Math.abs(c).toFixed(1)}%`, changeType: c > 0.05 ? 'increase' : c < -0.05 ? 'decrease' : 'neutral' };
};

export const money = (v) => formatCurrency(Math.round(Number(v) || 0));
export const moneyShort = (v) => `PKR ${formatNumber(Math.round(Number(v) || 0))}`;
export const pct = (n, d, digits = 1) => (d ? `${((n / d) * 100).toFixed(digits)}%` : '—');

/** Stock state of a product. Digital products with reorderLevel 0 never run low. */
export function stockState(p) {
  const stock = Number(p.stock) || 0;
  if (stock <= 0) return { label: 'Out of stock', tone: 'danger' };
  if (stock <= (Number(p.reorderLevel) || 0)) return { label: 'Low stock', tone: 'warning' };
  return { label: 'In stock', tone: 'success' };
}

/** Effective invoice state: past-due Sent / Partially Paid invoices are Overdue. */
export function invoiceState(inv, today = todayISO()) {
  const balance = Math.max(0, (Number(inv.amount) || 0) - (Number(inv.amountPaid) || 0));
  if (inv.status === 'Void' || inv.status === 'Draft') return { label: inv.status, tone: 'gray', balance: inv.status === 'Void' ? 0 : balance, overdueDays: 0 };
  if (balance <= 0) return { label: 'Paid', tone: 'success', balance: 0, overdueDays: 0 };
  const overdueDays = inv.dueDate ? daysBetween(inv.dueDate, today) : 0;
  if (overdueDays > 0) return { label: 'Overdue', tone: 'danger', balance, overdueDays };
  return { label: Number(inv.amountPaid) > 0 ? 'Partially Paid' : 'Sent', tone: Number(inv.amountPaid) > 0 ? 'info' : 'warning', balance, overdueDays: 0 };
}

/** Per-product sales and review stats from orders + reviews. */
export function productStats(products, orders, reviews = []) {
  const stats = Object.fromEntries(products.map(p => [p.id, { units: 0, revenue: 0, profit: 0, orders: 0, ratingSum: 0, ratingCount: 0 }]));
  orders.filter(isRevenue).forEach(o => (o.items || []).forEach(i => {
    const s = stats[i.productId];
    if (!s) return;
    const share = o.subtotal ? (o.subtotal - (o.discount || 0)) / o.subtotal : 1; // spread order discount over lines
    const lineRevenue = (Number(i.qty) || 0) * (Number(i.price) || 0) * share;
    s.units += Number(i.qty) || 0;
    s.revenue += lineRevenue;
    s.profit += lineRevenue - (Number(i.qty) || 0) * (Number(i.cost) || 0);
    s.orders += 1;
  }));
  reviews.filter(r => r.status === 'Approved').forEach(r => {
    const s = stats[r.productId];
    if (!s) return;
    s.ratingSum += Number(r.rating) || 0;
    s.ratingCount += 1;
  });
  Object.values(stats).forEach(s => { s.rating = s.ratingCount ? s.ratingSum / s.ratingCount : null; });
  return stats;
}

/** Cost of goods for an order (line cost snapshot). */
export const orderCost = (o) => (o.items || []).reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.cost) || 0), 0);

/** Category → revenue map, keyed by top-level category when `topLevel` is set. */
export function categoryRevenue(products, orders, categories = [], topLevel = false) {
  const byId = Object.fromEntries(products.map(p => [p.id, p]));
  const parentOf = Object.fromEntries(categories.map(c => [c.name, c.parent]));
  const out = {};
  orders.filter(isRevenue).forEach(o => (o.items || []).forEach(i => {
    let cat = byId[i.productId]?.category || 'Uncategorised';
    if (topLevel && parentOf[cat]) cat = parentOf[cat];
    const share = o.subtotal ? (o.subtotal - (o.discount || 0)) / o.subtotal : 1;
    out[cat] = (out[cat] || 0) + (Number(i.qty) || 0) * (Number(i.price) || 0) * share;
  }));
  return out;
}

export const groupCount = (records, key) => records.reduce((m, r) => { const k = r[key] ?? '—'; m[k] = (m[k] || 0) + 1; return m; }, {});
