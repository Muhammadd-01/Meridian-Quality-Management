/**
 * Shared calculations for the finance group: money formatting, invoice and
 * journal totals, loan amortisation, tax liability and the demo crypto market.
 */
import { MARKET_ASSETS, CHART_OF_ACCOUNTS, mulberry32, isoDate } from './data';

// ── Formatting ─────────────────────────────────────────────────────────────
export const pkr = (n) => `PKR ${Math.round(Number(n) || 0).toLocaleString('en-US')}`;
export const signedPkr = (n) => `${n < 0 ? '−' : '+'}${pkr(Math.abs(n))}`;
/** Compact PKR for KPI tiles: PKR 12.4M / PKR 860K. */
export const pkrShort = (n) => {
  const v = Number(n) || 0;
  const a = Math.abs(v);
  const s = a >= 1e9 ? `${(a / 1e9).toFixed(2)}B` : a >= 1e6 ? `${(a / 1e6).toFixed(2)}M` : a >= 1e3 ? `${(a / 1e3).toFixed(1)}K` : `${Math.round(a)}`;
  return `${v < 0 ? '−' : ''}PKR ${s}`;
};
export const usd = (n, digits) => {
  const v = Number(n) || 0;
  const d = digits ?? (Math.abs(v) >= 100 ? 2 : Math.abs(v) >= 1 ? 2 : Math.abs(v) >= 0.01 ? 4 : 7);
  return `${v < 0 ? '−' : ''}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
};
export const usdShort = (n) => {
  const v = Number(n) || 0;
  const a = Math.abs(v);
  const s = a >= 1e12 ? `${(a / 1e12).toFixed(2)}T` : a >= 1e9 ? `${(a / 1e9).toFixed(2)}B` : a >= 1e6 ? `${(a / 1e6).toFixed(2)}M` : a >= 1e3 ? `${(a / 1e3).toFixed(1)}K` : a.toFixed(2);
  return `${v < 0 ? '−' : ''}$${s}`;
};
export const pct = (n, digits = 1) => `${n > 0 ? '+' : ''}${(Number(n) || 0).toFixed(digits)}%`;
export const qty = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 8 });
export const today = () => isoDate(new Date());
export const monthOf = (date) => String(date || '').slice(0, 7);
export const monthLabel = (key) => {
  const [y, m] = String(key).split('-').map(Number);
  return y ? new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' }) : key;
};
/** Last `n` month keys ending with the current month, oldest first. */
export const recentMonths = (n = 6) => {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
};
export const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
export const sum = (rows, fn) => rows.reduce((s, r) => s + (Number(fn(r)) || 0), 0);

// ── Finance ────────────────────────────────────────────────────────────────
/** Signed amount of a finance transaction (income +, expense −). */
export const signedAmount = (t) => (t.type === 'Income' ? 1 : -1) * (Number(t.amount) || 0);
/** Current balance per finance account name = opening balance + signed transactions. */
export function accountBalances(accounts, transactions) {
  const map = Object.fromEntries(accounts.map(a => [a.name, Number(a.openingBalance) || 0]));
  transactions.forEach(t => { if (t.account in map) map[t.account] += signedAmount(t); });
  return map;
}
/** Running balance after each transaction within its account, keyed by transaction id. */
export function runningBalances(accounts, transactions) {
  const bal = Object.fromEntries(accounts.map(a => [a.name, Number(a.openingBalance) || 0]));
  const out = {};
  [...transactions].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)).forEach(t => {
    if (!(t.account in bal)) return;
    bal[t.account] += signedAmount(t);
    out[t.id] = bal[t.account];
  });
  return out;
}
export const budgetActual = (budget, transactions) =>
  sum(transactions.filter(t => t.type === 'Expense' && t.category === budget.category && monthOf(t.date) === budget.period), t => t.amount);

// ── Accounting ─────────────────────────────────────────────────────────────
export const accountName = (code) => CHART_OF_ACCOUNTS.find(a => a.code === code)?.name || code;
export const accountType = (code) => CHART_OF_ACCOUNTS.find(a => a.code === code)?.type || 'Other';
export const journalTotals = (entry) => {
  const debit = sum(entry.lines || [], l => l.debit);
  const credit = sum(entry.lines || [], l => l.credit);
  return { debit, credit, balanced: Math.abs(debit - credit) < 0.005 && debit > 0 };
};
/** Net movement of the operating bank account (1010) in a journal entry (+ = cash in). */
export const cashMovement = (entry) => sum((entry.lines || []).filter(l => l.account === '1010'), l => (Number(l.debit) || 0) - (Number(l.credit) || 0));
/** Trial balance from posted entries: { code: { debit, credit, balance } } (balance is debit − credit). */
export function trialBalance(entries) {
  const tb = {};
  entries.filter(e => e.status === 'Posted').forEach(e => (e.lines || []).forEach(l => {
    const row = tb[l.account] || (tb[l.account] = { debit: 0, credit: 0, balance: 0 });
    row.debit += Number(l.debit) || 0;
    row.credit += Number(l.credit) || 0;
    row.balance = row.debit - row.credit;
  }));
  return tb;
}
export function invoiceTotals(inv) {
  const subtotal = sum(inv.items || [], i => (Number(i.qty) || 0) * (Number(i.rate) || 0));
  const tax = Math.round(subtotal * (Number(inv.taxRate) || 0)) / 100;
  return { subtotal, tax, total: subtotal + tax };
}
/** Display status: a sent invoice past its due date is Overdue. */
export const invoiceStatus = (inv) => (inv.status === 'Sent' && inv.dueDate && inv.dueDate < today() ? 'Overdue' : inv.status);
const inRange = (date, from, to) => date && date >= from && date <= to;
/** Tax liability for a period, computed from invoices and expense claims. */
export function taxLiability(period, invoices, expenses) {
  const billed = invoices.filter(i => !['Draft', 'Void'].includes(i.status) && inRange(i.issueDate, period.from, period.to));
  const claims = expenses.filter(e => ['Approved', 'Reimbursed'].includes(e.status) && inRange(e.date, period.from, period.to));
  const revenue = sum(billed, i => invoiceTotals(i).subtotal);
  const outputTax = sum(billed, i => invoiceTotals(i).tax);
  const inputTax = sum(claims, e => e.inputTax);
  const costs = sum(claims, e => (Number(e.amount) || 0) - (Number(e.inputTax) || 0));
  const adjustment = Number(period.adjustment) || 0;
  if (period.taxType === 'Advance Income Tax') {
    const base = Math.max(0, revenue - costs);
    return { invoices: billed.length, claims: claims.length, revenue, costs, outputTax, inputTax, base, liability: Math.max(0, Math.round(base * (Number(period.rate) || 0) / 100) + adjustment) };
  }
  return { invoices: billed.length, claims: claims.length, revenue, costs, outputTax, inputTax, base: outputTax - inputTax, liability: Math.max(0, Math.round(outputTax - inputTax) + adjustment) };
}

// ── Banking ────────────────────────────────────────────────────────────────
/** Equal monthly instalment for principal P, annual rate r% and n months. */
export function emi(principal, annualRate, months) {
  const P = Number(principal) || 0;
  const n = Math.max(1, Number(months) || 1);
  const i = (Number(annualRate) || 0) / 1200;
  if (!i) return P / n;
  return (P * i * (1 + i) ** n) / ((1 + i) ** n - 1);
}
/** Full amortisation schedule: [{ no, date, payment, interest, principal, balance }]. */
export function amortisation(loan) {
  const n = Math.max(1, Number(loan.termMonths) || 1);
  const i = (Number(loan.annualRate) || 0) / 1200;
  const pay = emi(loan.principal, loan.annualRate, n);
  let balance = Number(loan.principal) || 0;
  const start = new Date(loan.startDate || Date.now());
  return Array.from({ length: n }, (_, k) => {
    const interest = balance * i;
    const principal = Math.min(balance, pay - interest);
    balance = Math.max(0, balance - principal);
    const d = new Date(start.getFullYear(), start.getMonth() + k + 1, Math.min(start.getDate(), 28));
    return { no: k + 1, date: isoDate(d), payment: pay, interest, principal, balance };
  });
}
export function loanSummary(loan) {
  const schedule = amortisation(loan);
  const made = Math.min(Number(loan.paymentsMade) || 0, schedule.length);
  const outstanding = made ? schedule[made - 1].balance : Number(loan.principal) || 0;
  const next = schedule[made];
  return {
    schedule, made, outstanding, next, instalment: schedule[0]?.payment || 0,
    totalInterest: sum(schedule, r => r.interest), interestPaid: sum(schedule.slice(0, made), r => r.interest),
    progress: schedule.length ? Math.round((made / schedule.length) * 100) : 0,
  };
}
/** Statement lines for one account with running balance, newest first (balance after each line). */
export function statement(account, txns) {
  const lines = txns.filter(t => t.accountId === account.id).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  let bal = Number(account.balance) || 0;
  return lines.map(t => { const row = { ...t, balance: bal }; bal -= Number(t.amount) || 0; return row; });
}
export const cardSpend = (card, txns, month = monthOf(today())) =>
  -sum(txns.filter(t => t.cardId === card.id && t.amount < 0 && monthOf(t.date) === month), t => t.amount);
/** Default wire fee: USD 20 + 0.2% (capped at USD 150); OUR adds USD 15 correspondent charges. */
export const wireFee = (amountUsd, charges = 'SHA') => Math.round((Math.min(150, 20 + (Number(amountUsd) || 0) * 0.002) + (charges === 'OUR' ? 15 : 0)) * 100) / 100;

// ── Crypto (demo market data) ──────────────────────────────────────────────
const historyCache = {};
/** Deterministic daily close series (oldest first) ending at the asset's reference price. */
export function priceHistory(symbol, days = 180) {
  const key = `${symbol}-${days}`;
  if (historyCache[key]) return historyCache[key];
  const asset = MARKET_ASSETS.find(a => a.symbol === symbol);
  if (!asset) return [];
  const rnd = mulberry32([...symbol].reduce((s, c) => s * 31 + c.charCodeAt(0), 7));
  const steps = [];
  let drift = 0;
  for (let d = 0; d < days; d += 1) {
    drift = drift * 0.9 + (rnd() - 0.48) * asset.vol * 0.4;
    steps.push(drift + (rnd() - 0.5) * asset.vol);
  }
  // Walk backwards from the reference price so the latest close equals it.
  const closes = new Array(days);
  let p = asset.price;
  for (let d = days - 1; d >= 0; d -= 1) { closes[d] = p; p /= Math.exp(steps[d]); }
  const now = new Date();
  const out = closes.map((close, d) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1 - d));
    return { date: isoDate(date), label: date.toLocaleString('en-US', { month: 'short', day: 'numeric' }), close };
  });
  historyCache[key] = out;
  return out;
}
export const changeOver = (symbol, days) => {
  const h = priceHistory(symbol, 180);
  const a = h[h.length - 1 - days]?.close;
  const b = h[h.length - 1]?.close;
  return a ? ((b - a) / a) * 100 : 0;
};
export const assetInfo = (symbol) => MARKET_ASSETS.find(a => a.symbol === symbol);
export const priceOf = (symbol) => assetInfo(symbol)?.price || 0;
/** Market snapshot for every demo asset. */
export const marketSnapshot = () => MARKET_ASSETS.map(a => ({
  ...a, change24h: changeOver(a.symbol, 1), change7d: changeOver(a.symbol, 7), change30d: changeOver(a.symbol, 30),
  marketCap: a.price * a.supply, spark: priceHistory(a.symbol, 180).slice(-30).map(p => p.close),
}));
/** Simple moving average over `window` closes (null until enough data). */
export const sma = (values, window) => values.map((_, i) => (i + 1 < window ? null : values.slice(i + 1 - window, i + 1).reduce((s, v) => s + v, 0) / window));
export function rsi(values, period = 14) {
  if (values.length <= period) return 50;
  let gains = 0; let losses = 0;
  for (let i = values.length - period; i < values.length; i += 1) {
    const d = values[i] - values[i - 1];
    if (d >= 0) gains += d; else losses -= d;
  }
  if (!losses) return 100;
  return 100 - 100 / (1 + gains / losses);
}
export const holdingValue = (h) => (Number(h.quantity) || 0) * priceOf(h.symbol);
export const holdingCost = (h) => (Number(h.quantity) || 0) * (Number(h.avgCost) || 0);
/** Wallet balance from confirmed vault transactions (withdrawals include network fees). */
export const walletBalance = (walletId, txns) => sum(
  txns.filter(t => t.walletId === walletId && t.status !== 'Failed' && (t.type === 'Deposit' ? t.status === 'Confirmed' : true)),
  t => (t.type === 'Deposit' ? Number(t.amount) : -(Number(t.amount) + (Number(t.fee) || 0))),
);
