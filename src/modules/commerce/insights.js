/**
 * Rule-based insights computed from live records. Each rule looks at the
 * collections in `data` and returns zero or more findings; nothing is
 * generated or simulated. Used by the Insights page and the dashboards.
 *
 * Finding: { id, severity: 'critical'|'warning'|'info'|'positive', module, title, detail, metric, to, items }
 */
import {
  isRevenue, stockState, invoiceState, productStats, monthlySeries, changeOf, daysBetween, todayISO, money, addDaysISO, dayOf,
} from './lib';

export const SEVERITY = {
  critical: { label: 'Critical', tone: 'danger', rank: 0 },
  warning: { label: 'Warning', tone: 'warning', rank: 1 },
  info: { label: 'Info', tone: 'info', rank: 2 },
  positive: { label: 'Positive', tone: 'success', rank: 3 },
};

const DONE_WORDS = /^(completed?|done|closed|paid|delivered|cancell?ed|won|lost|resolved|archived|void|refunded|rejected|approved|returned|checked out|discharged|expired|recovered|closed won|closed lost)$/i;
const DUE_FIELDS = ['dueDate', 'due', 'deadline', 'endDate', 'expiryDate', 'validUntil'];
const names = (list, fn, max = 4) => {
  const shown = list.slice(0, max).map(fn);
  return list.length > max ? [...shown, `+${list.length - max} more`] : shown;
};

/**
 * @param data      { [entityType]: records[] } — must include the commerce collections
 * @param entities  the entity registry (for the cross-module overdue rule)
 */
export function buildInsights(data, entities = {}) {
  const today = todayISO();
  const out = [];
  const products = data.storeProducts || [];
  const orders = data.storeOrders || [];
  const reviews = data.productReviews || [];
  const invoices = data.customerInvoices || [];
  const payments = data.customerPayments || [];
  const carts = data.abandonedCarts || [];
  const coupons = data.coupons || [];
  const customers = data.customers || [];

  // ── Inventory ──
  const active = products.filter(p => p.status === 'Active');
  const out_ = active.filter(p => stockState(p).label === 'Out of stock');
  if (out_.length) out.push({ id: 'stock-out', severity: 'critical', module: 'Ecommerce', title: `${out_.length} active product${out_.length > 1 ? 's are' : ' is'} out of stock`, detail: 'Customers can still see these products but cannot receive them. Restock or set them to Draft.', metric: out_.length, to: '/ecommerce/products', items: names(out_, p => p.name) });
  const low = active.filter(p => stockState(p).label === 'Low stock');
  if (low.length) out.push({ id: 'stock-low', severity: 'warning', module: 'Ecommerce', title: `${low.length} product${low.length > 1 ? 's' : ''} at or below reorder level`, detail: 'Stock is at or below the reorder level set on the product.', metric: low.length, to: '/ecommerce/products', items: names(low, p => `${p.name} (${p.stock} left, reorder at ${p.reorderLevel})`) });

  // ── Receivables ──
  const overdue = invoices.map(i => ({ i, s: invoiceState(i, today) })).filter(x => x.s.label === 'Overdue');
  if (overdue.length) {
    const total = overdue.reduce((s, x) => s + x.s.balance, 0);
    out.push({ id: 'inv-overdue', severity: 'critical', module: 'Management', title: `${overdue.length} overdue invoice${overdue.length > 1 ? 's' : ''} — ${money(total)} outstanding`, detail: 'Unpaid balance past the due date. Send a reminder or record the payment.', metric: total, to: '/management/invoices', items: names(overdue.sort((a, b) => b.s.overdueDays - a.s.overdueDays), x => `${x.i.number} · ${x.i.customerName} · ${x.s.overdueDays} days late`) });
  }
  const dueSoon = invoices.map(i => ({ i, s: invoiceState(i, today) })).filter(x => x.s.balance > 0 && ['Sent', 'Partially Paid'].includes(x.s.label) && x.i.dueDate && daysBetween(today, x.i.dueDate) <= 7);
  if (dueSoon.length) out.push({ id: 'inv-due-soon', severity: 'info', module: 'Management', title: `${dueSoon.length} invoice${dueSoon.length > 1 ? 's' : ''} due within 7 days`, detail: 'Worth a friendly reminder before they become overdue.', metric: dueSoon.length, to: '/management/invoices', items: names(dueSoon, x => `${x.i.number} · due ${x.i.dueDate}`) });
  const failed = payments.filter(p => p.status === 'Failed');
  if (failed.length) out.push({ id: 'pay-failed', severity: 'warning', module: 'Management', title: `${failed.length} failed payment${failed.length > 1 ? 's' : ''}`, detail: 'Follow up with the customer for an alternative payment method.', metric: failed.length, to: '/management/payments', items: names(failed, p => `${p.reference} · ${p.customerName} · ${money(p.amount)}`) });
  const pendingPay = payments.filter(p => p.status === 'Pending');
  if (pendingPay.length) out.push({ id: 'pay-pending', severity: 'info', module: 'Management', title: `${pendingPay.length} payment${pendingPay.length > 1 ? 's' : ''} awaiting confirmation`, detail: `${money(pendingPay.reduce((s, p) => s + (Number(p.amount) || 0), 0))} not yet confirmed by the bank or gateway.`, metric: pendingPay.length, to: '/management/payments' });

  // ── Orders ──
  const stalePending = orders.filter(o => o.status === 'Pending' && daysBetween(o.date, today) >= 2);
  if (stalePending.length) out.push({ id: 'ord-pending', severity: 'warning', module: 'Ecommerce', title: `${stalePending.length} order${stalePending.length > 1 ? 's' : ''} unpaid for 2+ days`, detail: 'Pending orders tie up stock. Chase payment or cancel.', metric: stalePending.length, to: '/ecommerce/orders', items: names(stalePending, o => `${o.number} · ${o.customerName}`) });
  const unshipped = orders.filter(o => o.status === 'Paid' && daysBetween(o.date, today) >= 3);
  if (unshipped.length) out.push({ id: 'ord-unshipped', severity: 'warning', module: 'Ecommerce', title: `${unshipped.length} paid order${unshipped.length > 1 ? 's' : ''} not shipped after 3 days`, detail: 'Fulfilment is behind the 3-day dispatch target.', metric: unshipped.length, to: '/ecommerce/orders', items: names(unshipped, o => `${o.number} · ${o.customerName}`) });
  const closed = orders.filter(o => o.status !== 'Pending');
  const refunded = orders.filter(o => o.status === 'Refunded');
  if (closed.length >= 5 && refunded.length / closed.length > 0.05) out.push({ id: 'ord-refunds', severity: 'warning', module: 'Ecommerce', title: `Refund rate is ${((refunded.length / closed.length) * 100).toFixed(1)}%`, detail: 'Above the 5% guide level. Check reviews and return reasons for the products involved.', metric: refunded.length, to: '/reports/order-summary', items: names(refunded, o => `${o.number} · ${(o.items || []).map(i => i.name).join(', ')}`) });

  const rev = monthlySeries(orders.filter(isRevenue), 'date', o => o.total, 3).map(m => m.value);
  const c = changeOf(rev.slice(0, 2)); // compare the last two complete months
  if (c !== null) {
    if (c >= 5) out.push({ id: 'rev-up', severity: 'positive', module: 'Ecommerce', title: `Revenue grew ${c.toFixed(1)}% last month`, detail: `${money(rev[1])} against ${money(rev[0])} the month before (paid, shipped and delivered orders).`, metric: c, to: '/reports/revenue' });
    else if (c <= -10) out.push({ id: 'rev-down', severity: 'warning', module: 'Ecommerce', title: `Revenue fell ${Math.abs(c).toFixed(1)}% last month`, detail: `${money(rev[1])} against ${money(rev[0])} the month before.`, metric: c, to: '/reports/revenue' });
  }

  // ── Products & reviews ──
  const stats = productStats(products, orders, reviews);
  const lowRated = products.filter(p => stats[p.id]?.rating !== null && stats[p.id]?.rating < 3);
  if (lowRated.length) out.push({ id: 'rev-low', severity: 'warning', module: 'Ecommerce', title: `${lowRated.length} product${lowRated.length > 1 ? 's' : ''} rated below 3★`, detail: 'Based on approved reviews. Consider a quality check with the supplier.', metric: lowRated.length, to: '/ecommerce/reviews', items: names(lowRated, p => `${p.name} (${stats[p.id].rating.toFixed(1)}★)`) });
  const pendingRev = reviews.filter(r => r.status === 'Pending');
  if (pendingRev.length) out.push({ id: 'rev-pending', severity: 'info', module: 'Ecommerce', title: `${pendingRev.length} review${pendingRev.length > 1 ? 's' : ''} waiting for moderation`, detail: 'Approve, hide or reply so they appear on the storefront.', metric: pendingRev.length, to: '/ecommerce/reviews' });
  const best = products.filter(p => stats[p.id]?.revenue > 0).sort((a, b) => stats[b.id].revenue - stats[a.id].revenue)[0];
  if (best) out.push({ id: 'top-product', severity: 'positive', module: 'Ecommerce', title: `${best.name} is the top earner`, detail: `${money(stats[best.id].revenue)} from ${stats[best.id].units} units across ${stats[best.id].orders} orders.`, metric: stats[best.id].revenue, to: '/reports/product-performance' });
  const unsold = active.filter(p => !stats[p.id]?.units);
  if (unsold.length) out.push({ id: 'unsold', severity: 'info', module: 'Ecommerce', title: `${unsold.length} active product${unsold.length > 1 ? 's have' : ' has'} never sold`, detail: 'No paid orders include these products yet.', metric: unsold.length, to: '/ecommerce/products', items: names(unsold, p => p.name) });

  // ── Marketing ──
  const openCarts = carts.filter(cart => cart.status === 'Abandoned');
  const noReminder = openCarts.filter(cart => cart.reminderSent !== 'Yes');
  if (noReminder.length) out.push({ id: 'carts', severity: 'info', module: 'Ecommerce', title: `${noReminder.length} abandoned cart${noReminder.length > 1 ? 's' : ''} without a reminder`, detail: `${money(noReminder.reduce((s, x) => s + (Number(x.value) || 0), 0))} in carts nobody has followed up.`, metric: noReminder.length, to: '/reports/cart-abandonment', items: names(noReminder, x => `${x.customerName} · ${money(x.value)}`) });
  const expiring = coupons.filter(cp => cp.status === 'Active' && cp.endDate && daysBetween(today, cp.endDate) >= 0 && daysBetween(today, cp.endDate) <= 10);
  if (expiring.length) out.push({ id: 'coupon-expiring', severity: 'info', module: 'Ecommerce', title: `${expiring.length} coupon${expiring.length > 1 ? 's' : ''} ending within 10 days`, detail: 'Extend or announce the last days of the offer.', metric: expiring.length, to: '/ecommerce/storefront', items: names(expiring, cp => `${cp.code} · ends ${cp.endDate}`) });
  const stale = coupons.filter(cp => cp.status === 'Active' && cp.endDate && cp.endDate < today);
  if (stale.length) out.push({ id: 'coupon-stale', severity: 'warning', module: 'Ecommerce', title: `${stale.length} coupon${stale.length > 1 ? 's' : ''} active past the end date`, detail: 'Mark them expired so they stop being accepted.', metric: stale.length, to: '/ecommerce/storefront', items: names(stale, cp => cp.code) });

  // ── Customers ──
  const lastOrderBy = {};
  orders.forEach(o => { if (!lastOrderBy[o.customerId] || o.date > lastOrderBy[o.customerId]) lastOrderBy[o.customerId] = o.date; });
  const lapsing = customers.filter(cu => cu.status === 'Active').filter(cu => {
    const last = [lastOrderBy[cu.id], cu.lastOrder].filter(Boolean).sort().pop();
    return last && daysBetween(last, today) > 90;
  });
  if (lapsing.length) out.push({ id: 'cust-lapsing', severity: 'info', module: 'Management', title: `${lapsing.length} active customer${lapsing.length > 1 ? 's' : ''} with no order in 90 days`, detail: 'Good candidates for a re-engagement offer.', metric: lapsing.length, to: '/management/customers', items: names(lapsing, cu => cu.name) });

  // ── Cross-module: anything past its due date that isn't finished ──
  Object.values(entities).forEach(e => {
    if (['customerInvoices', 'coupons'].includes(e.type)) return;
    const records = data[e.type];
    if (!Array.isArray(records) || !records.length || !e.statusField) return;
    const dueField = DUE_FIELDS.find(f => e.fields?.some(x => x.key === f && x.type === 'date'));
    if (!dueField) return;
    const late = records.filter(r => dayOf(r[dueField]) && dayOf(r[dueField]) < today && !DONE_WORDS.test(String(r[e.statusField] || '')));
    if (!late.length) return;
    out.push({
      id: `overdue-${e.type}`,
      severity: late.length >= 5 ? 'warning' : 'info',
      module: e.module || 'Other',
      title: `${late.length} ${e.label.toLowerCase()} past ${e.fields.find(x => x.key === dueField)?.label.toLowerCase() || 'due date'}`,
      detail: `Records whose ${dueField} has passed and whose ${e.statusField} is not a finished state.`,
      metric: late.length,
      to: e.path,
      items: names(late, r => `${e.title(r)} · ${dayOf(r[dueField])}`),
    });
  });

  return out.sort((a, b) => SEVERITY[a.severity].rank - SEVERITY[b.severity].rank);
}

/** Fingerprint used to remember dismissed insights until the underlying numbers change. */
export const insightSignature = (i) => `${i.id}:${i.metric}`;
export const nextWeek = () => addDaysISO(todayISO(), 7);
