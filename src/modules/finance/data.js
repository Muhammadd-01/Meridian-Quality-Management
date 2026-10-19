/**
 * Demo seed data for the finance group (finance, accounting, banking, crypto).
 * Every record carries `isDemo: true`. Dates are generated relative to today so
 * the dashboards always show a current month. Local money is PKR; crypto and
 * international wires are USD. Crypto prices are illustrative demo market data.
 *
 * Must not import src/data/entities.js (circular import).
 */

// ── Date helpers ────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0');
export const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const TODAY = new Date();
TODAY.setHours(12, 0, 0, 0);
export const daysAgo = (n) => { const d = new Date(TODAY); d.setDate(d.getDate() - n); return isoDate(d); };
export const daysAhead = (n) => daysAgo(-n);
/** Day `day` of the month `offset` months back (clamped to the month length and to today). */
const monthDay = (offset, day) => {
  const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - offset, 1, 12);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return d > TODAY ? null : isoDate(d);
};
const monthKey = (offset) => {
  const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - offset, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};
const monthRange = (offset) => {
  const start = new Date(TODAY.getFullYear(), TODAY.getMonth() - offset, 1, 12);
  const end = new Date(TODAY.getFullYear(), TODAY.getMonth() - offset + 1, 0, 12);
  return { from: isoDate(start), to: isoDate(end), label: start.toLocaleString('en-US', { month: 'short', year: 'numeric' }) };
};

/** Small deterministic PRNG so demo data is stable between reloads. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const round = (n, step = 500) => Math.round(n / step) * step;

// ── Finance: accounts, transactions, budgets, expense claims ────────────────
export const financeAccountTypes = ['Bank', 'Cash', 'Mobile Wallet', 'Credit Card', 'Investment'];
export const financeAccountStatuses = ['Active', 'Dormant', 'Closed'];

export const initialFinAccounts = [
  { id: 'fa-operating', name: 'Operating Account', type: 'Bank', institution: 'HBL — Gulberg Branch', number: 'PK36 HABB 0012 4471 0098 2290', currency: 'PKR', openingBalance: 4500000, status: 'Active', isDemo: true },
  { id: 'fa-payroll', name: 'Payroll Account', type: 'Bank', institution: 'Meezan Bank — Clifton', number: 'PK12 MEZN 0001 0203 5541 7715', currency: 'PKR', openingBalance: 2200000, status: 'Active', isDemo: true },
  { id: 'fa-reserve', name: 'Savings Reserve', type: 'Investment', institution: 'UBL — Blue Area', number: 'PK70 UNIL 0109 0003 1128 0043', currency: 'PKR', openingBalance: 7500000, status: 'Active', isDemo: true },
  { id: 'fa-petty', name: 'Petty Cash — Head Office', type: 'Cash', institution: 'Lahore office safe', number: 'CASH-01', currency: 'PKR', openingBalance: 85000, status: 'Active', isDemo: true },
  { id: 'fa-wallet', name: 'JazzCash Business', type: 'Mobile Wallet', institution: 'JazzCash', number: '0300-1234567', currency: 'PKR', openingBalance: 120000, status: 'Active', isDemo: true },
  { id: 'fa-card', name: 'Corporate Card', type: 'Credit Card', institution: 'MCB — Visa Corporate', number: '•••• 5561', currency: 'PKR', openingBalance: 0, status: 'Active', isDemo: true },
];

export const incomeCategories = ['Certification Fees', 'Consulting Revenue', 'Training Revenue', 'Audit Fees', 'Interest Income'];
export const expenseCategories = ['Salaries', 'Rent', 'Utilities', 'Travel', 'Software & SaaS', 'Marketing', 'Office Supplies', 'Professional Fees', 'Taxes & Duties', 'Meals & Entertainment'];
export const transactionCategories = [...incomeCategories, ...expenseCategories];
export const transactionTypes = ['Income', 'Expense'];
export const transactionStatuses = ['Cleared', 'Pending'];
export const paymentMethods = ['Bank Transfer', 'RAAST', 'Cheque', 'Cash', 'Card', 'Mobile Wallet'];

const CLIENTS = ['Engro Fertilizers', 'Lucky Cement', 'Packages Ltd', 'Nestlé Pakistan', 'Interloop Ltd', 'Systems Ltd', 'K-Electric', 'Fauji Foods', 'Gul Ahmed Textiles', 'Hilal Foods', 'Atlas Honda', 'Shan Foods'];

function buildTransactions() {
  const rnd = mulberry32(2026);
  const out = [];
  let n = 1;
  const push = (offset, day, type, category, description, amount, account, method, extra = {}) => {
    const date = monthDay(offset, day);
    if (!date) return;
    out.push({
      id: `ft-${String(n).padStart(3, '0')}`, date, type, category, description, amount: round(amount, 100), account, method,
      status: offset === 0 && day > TODAY.getDate() - 3 ? 'Pending' : 'Cleared', reference: `TXN-${String(4800 + n)}`, isDemo: true, ...extra,
    });
    n += 1;
  };
  for (let m = 5; m >= 0; m -= 1) {
    const client = (i) => CLIENTS[(m * 3 + i) % CLIENTS.length];
    push(m, 1, 'Expense', 'Salaries', 'Monthly payroll — 24 staff', 1850000 + rnd() * 90000, 'Payroll Account', 'Bank Transfer');
    push(m, 2, 'Expense', 'Rent', 'Office rent — Gulberg III', 420000, 'Operating Account', 'Cheque');
    push(m, 4, 'Income', 'Certification Fees', `ISO 9001 certification — ${client(0)}`, 650000 + rnd() * 400000, 'Operating Account', 'Bank Transfer');
    push(m, 6, 'Expense', 'Utilities', 'LESCO electricity + SNGPL gas', 68000 + rnd() * 30000, 'Operating Account', 'Bank Transfer');
    push(m, 8, 'Income', 'Consulting Revenue', `QMS consulting retainer — ${client(1)}`, 480000 + rnd() * 250000, 'Operating Account', 'RAAST');
    push(m, 10, 'Expense', 'Software & SaaS', 'Microsoft 365, Zoho & Atlassian', 96000 + rnd() * 20000, 'Corporate Card', 'Card');
    push(m, 12, 'Income', 'Training Revenue', `Internal auditor course — ${client(2)}`, 260000 + rnd() * 180000, 'Operating Account', 'Bank Transfer');
    push(m, 13, 'Expense', 'Travel', `Site audit travel — ${['Karachi', 'Islamabad', 'Faisalabad', 'Sialkot', 'Multan', 'Peshawar'][m]}`, 85000 + rnd() * 70000, 'Corporate Card', 'Card');
    push(m, 15, 'Expense', 'Marketing', 'LinkedIn campaign & brochure printing', 70000 + rnd() * 60000, 'Corporate Card', 'Card');
    push(m, 17, 'Income', 'Audit Fees', `Surveillance audit — ${client(3)}`, 340000 + rnd() * 220000, 'Operating Account', 'Cheque');
    push(m, 19, 'Expense', 'Office Supplies', 'Stationery & printer toner', 18000 + rnd() * 15000, 'Petty Cash — Head Office', 'Cash');
    push(m, 21, 'Expense', 'Professional Fees', 'Tax advisor — monthly retainer', 75000, 'Operating Account', 'Bank Transfer');
    push(m, 23, 'Expense', 'Meals & Entertainment', 'Client lunch & team dinner', 22000 + rnd() * 25000, 'JazzCash Business', 'Mobile Wallet');
    push(m, 25, 'Income', 'Certification Fees', `ISO 14001 certification — ${client(4)}`, 520000 + rnd() * 380000, 'Operating Account', 'Bank Transfer');
    push(m, 27, 'Expense', 'Taxes & Duties', 'Sales tax on services (PRA)', 150000 + rnd() * 80000, 'Operating Account', 'Bank Transfer');
    push(m, 28, 'Income', 'Interest Income', 'Profit on savings reserve', 61000 + rnd() * 8000, 'Savings Reserve', 'Bank Transfer');
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}
export const initialFinTransactions = buildTransactions();

export const budgetPeriods = [monthKey(0), monthKey(1), monthKey(2)];
const BUDGET_PLAN = { Salaries: 1950000, Rent: 420000, Utilities: 90000, Travel: 120000, 'Software & SaaS': 110000, Marketing: 100000, 'Office Supplies': 25000, 'Professional Fees': 80000, 'Meals & Entertainment': 35000 };
const BUDGET_OWNERS = { Salaries: 'Hira Aslam', Rent: 'Kamran Shah', Utilities: 'Kamran Shah', Travel: 'Bilal Ahmed', 'Software & SaaS': 'Usman Tariq', Marketing: 'Sana Javed', 'Office Supplies': 'Kamran Shah', 'Professional Fees': 'Hira Aslam', 'Meals & Entertainment': 'Bilal Ahmed' };
export const initialFinBudgets = [0, 1].flatMap(offset => Object.entries(BUDGET_PLAN).map(([category, planned]) => ({
  id: `fb-${monthKey(offset)}-${category.replace(/\W+/g, '').toLowerCase()}`,
  category, period: monthKey(offset), planned, owner: BUDGET_OWNERS[category], alertAt: 90, notes: '', isDemo: true,
})));

export const expenseClaimStatuses = ['Submitted', 'Approved', 'Rejected', 'Reimbursed'];
export const departments = ['Certification', 'Consulting', 'Training', 'Finance', 'Operations', 'Sales'];
export const initialFinExpenses = [
  { id: 'fe-001', title: 'Flight LHE–KHI for Engro audit', employee: 'Bilal Ahmed', department: 'Certification', category: 'Travel', amount: 38500, inputTax: 0, date: daysAgo(2), receipt: 'PIA e-ticket 2148', status: 'Submitted', notes: 'Stage 2 audit, 2 days', isDemo: true },
  { id: 'fe-002', title: 'Hotel — Mövenpick Karachi (2 nights)', employee: 'Bilal Ahmed', department: 'Certification', category: 'Travel', amount: 64800, inputTax: 8938, date: daysAgo(2), receipt: 'Folio 77120', status: 'Submitted', notes: '', isDemo: true },
  { id: 'fe-003', title: 'Client workshop refreshments', employee: 'Ayesha Siddiqui', department: 'Training', category: 'Meals & Entertainment', amount: 18250, inputTax: 2517, date: daysAgo(4), receipt: 'Gourmet Bakers #5521', status: 'Approved', notes: '', isDemo: true },
  { id: 'fe-004', title: 'Careem rides — Islamabad site visits', employee: 'Hamza Qureshi', department: 'Consulting', category: 'Travel', amount: 7420, inputTax: 0, date: daysAgo(6), receipt: 'Careem statement', status: 'Reimbursed', notes: '', isDemo: true },
  { id: 'fe-005', title: 'ISO 45001 standard purchase', employee: 'Fatima Malik', department: 'Consulting', category: 'Professional Fees', amount: 29800, inputTax: 4110, date: daysAgo(8), receipt: 'ISO store order 99812', status: 'Approved', notes: 'For client gap analysis', isDemo: true },
  { id: 'fe-006', title: 'Printer toner & A4 paper', employee: 'Kamran Shah', department: 'Operations', category: 'Office Supplies', amount: 12600, inputTax: 1738, date: daysAgo(9), receipt: 'Hafeez Centre invoice 312', status: 'Reimbursed', notes: '', isDemo: true },
  { id: 'fe-007', title: 'Team dinner after audit close-out', employee: 'Usman Tariq', department: 'Certification', category: 'Meals & Entertainment', amount: 41500, inputTax: 5724, date: daysAgo(11), receipt: 'Monal #2290', status: 'Rejected', notes: '', decisionNote: 'Exceeds per-head entertainment limit (PKR 3,000).', isDemo: true },
  { id: 'fe-008', title: 'Fuel — Faisalabad round trip', employee: 'Omar Farooq', department: 'Sales', category: 'Travel', amount: 15900, inputTax: 0, date: daysAgo(13), receipt: 'PSO receipts ×3', status: 'Approved', notes: '', isDemo: true },
  { id: 'fe-009', title: 'Canva Pro annual seat', employee: 'Sana Javed', department: 'Sales', category: 'Software & SaaS', amount: 22400, inputTax: 3090, date: daysAgo(16), receipt: 'Canva invoice INV-88231', status: 'Reimbursed', notes: '', isDemo: true },
  { id: 'fe-010', title: 'Courier — certificates to Sialkot', employee: 'Zainab Raza', department: 'Operations', category: 'Office Supplies', amount: 3850, inputTax: 0, date: daysAgo(1), receipt: 'TCS CN 77120934', status: 'Submitted', notes: '', isDemo: true },
  { id: 'fe-011', title: 'Train — Green Line to Rawalpindi', employee: 'Hamza Qureshi', department: 'Consulting', category: 'Travel', amount: 9200, inputTax: 0, date: daysAgo(36), receipt: 'Pak Rail e-ticket', status: 'Reimbursed', notes: '', isDemo: true },
  { id: 'fe-012', title: 'Lead auditor exam fee (IRCA)', employee: 'Fatima Malik', department: 'Certification', category: 'Professional Fees', amount: 58000, inputTax: 0, date: daysAgo(40), receipt: 'CQI receipt 5501', status: 'Reimbursed', notes: '', isDemo: true },
];

// ── Accounting: chart of accounts, journal, invoices, tax, bank lines ───────
export const CHART_OF_ACCOUNTS = [
  { code: '1010', name: 'Cash at Bank — Operating', type: 'Asset' },
  { code: '1020', name: 'Petty Cash', type: 'Asset' },
  { code: '1200', name: 'Accounts Receivable', type: 'Asset' },
  { code: '1300', name: 'Input Sales Tax', type: 'Asset' },
  { code: '1500', name: 'Office Equipment', type: 'Asset' },
  { code: '2010', name: 'Accounts Payable', type: 'Liability' },
  { code: '2100', name: 'Sales Tax Payable', type: 'Liability' },
  { code: '2200', name: 'Withholding Tax Payable', type: 'Liability' },
  { code: '2300', name: 'Accrued Salaries', type: 'Liability' },
  { code: '3000', name: "Owner's Equity", type: 'Equity' },
  { code: '4010', name: 'Certification Revenue', type: 'Revenue' },
  { code: '4020', name: 'Consulting Revenue', type: 'Revenue' },
  { code: '4030', name: 'Training Revenue', type: 'Revenue' },
  { code: '5010', name: 'Salaries Expense', type: 'Expense' },
  { code: '5020', name: 'Rent Expense', type: 'Expense' },
  { code: '5030', name: 'Utilities Expense', type: 'Expense' },
  { code: '5040', name: 'Travel Expense', type: 'Expense' },
  { code: '5050', name: 'Software Subscriptions', type: 'Expense' },
  { code: '5060', name: 'Professional Fees', type: 'Expense' },
  { code: '5070', name: 'Depreciation', type: 'Expense' },
  { code: '5080', name: 'Bank Charges', type: 'Expense' },
];
export const journalStatuses = ['Draft', 'Posted', 'Reversed'];
export const journalSources = ['Manual', 'Invoice', 'Payment', 'Payroll', 'Recurring', 'Adjustment'];

const L = (account, debit, credit, memo = '') => ({ account, debit, credit, memo });
export const initialJournalEntries = [
  { id: 'je-1001', number: 'JE-1001', date: daysAgo(34), memo: 'Monthly payroll', source: 'Payroll', status: 'Posted', preparedBy: 'Hira Aslam', lines: [L('5010', 1880000, 0), L('2200', 0, 94000, 'Salary WHT'), L('1010', 0, 1786000)], isDemo: true },
  { id: 'je-1002', number: 'JE-1002', date: daysAgo(33), memo: 'Office rent — Gulberg III', source: 'Recurring', status: 'Posted', preparedBy: 'Hira Aslam', lines: [L('5020', 420000, 0), L('1010', 0, 420000)], isDemo: true },
  { id: 'je-1003', number: 'JE-1003', date: daysAgo(30), memo: 'Invoice INV-2026-118 — Engro Fertilizers', source: 'Invoice', status: 'Posted', preparedBy: 'Hira Aslam', lines: [L('1200', 986000, 0), L('4010', 0, 850000), L('2100', 0, 136000)], isDemo: true },
  { id: 'je-1004', number: 'JE-1004', date: daysAgo(24), memo: 'Receipt from Engro Fertilizers', source: 'Payment', status: 'Posted', preparedBy: 'Kamran Shah', lines: [L('1010', 986000, 0), L('1200', 0, 986000)], isDemo: true },
  { id: 'je-1005', number: 'JE-1005', date: daysAgo(20), memo: 'Microsoft 365 & Zoho subscriptions', source: 'Payment', status: 'Posted', preparedBy: 'Kamran Shah', lines: [L('5050', 98000, 0), L('1300', 15680, 0), L('1010', 0, 113680)], isDemo: true },
  { id: 'je-1006', number: 'JE-1006', date: daysAgo(15), memo: 'Invoice INV-2026-121 — Lucky Cement', source: 'Invoice', status: 'Posted', preparedBy: 'Hira Aslam', lines: [L('1200', 696000, 0), L('4020', 0, 600000), L('2100', 0, 96000)], isDemo: true },
  { id: 'je-1007', number: 'JE-1007', date: daysAgo(12), memo: 'LESCO electricity bill', source: 'Payment', status: 'Posted', preparedBy: 'Kamran Shah', lines: [L('5030', 74200, 0), L('1010', 0, 74200)], isDemo: true },
  { id: 'je-1008', number: 'JE-1008', date: daysAgo(9), memo: 'Receipt from Lucky Cement (part)', source: 'Payment', status: 'Posted', preparedBy: 'Kamran Shah', lines: [L('1010', 400000, 0), L('1200', 0, 400000)], isDemo: true },
  { id: 'je-1009', number: 'JE-1009', date: daysAgo(4), memo: 'Monthly payroll', source: 'Payroll', status: 'Posted', preparedBy: 'Hira Aslam', lines: [L('5010', 1910000, 0), L('2200', 0, 95500, 'Salary WHT'), L('1010', 0, 1814500)], isDemo: true },
  { id: 'je-1010', number: 'JE-1010', date: daysAgo(3), memo: 'Office rent — Gulberg III', source: 'Recurring', status: 'Posted', preparedBy: 'Hira Aslam', lines: [L('5020', 420000, 0), L('1010', 0, 420000)], isDemo: true },
  { id: 'je-1011', number: 'JE-1011', date: daysAgo(2), memo: 'Monthly depreciation — laptops & furniture', source: 'Adjustment', status: 'Draft', preparedBy: 'Hira Aslam', lines: [L('5070', 46500, 0), L('1500', 0, 46500)], isDemo: true },
  { id: 'je-1012', number: 'JE-1012', date: daysAgo(1), memo: 'Accrue tax advisor fee', source: 'Manual', status: 'Draft', preparedBy: 'Kamran Shah', lines: [L('5060', 75000, 0), L('2010', 0, 75000)], isDemo: true },
];

export const invoiceStatuses = ['Draft', 'Sent', 'Paid', 'Void'];
const I = (description, qty, rate) => ({ description, qty, rate });
export const initialAcctInvoices = [
  { id: 'ai-118', number: 'INV-2026-118', customer: 'Engro Fertilizers', email: 'accounts@engro.example.pk', issueDate: daysAgo(30), dueDate: daysAgo(15), taxRate: 16, status: 'Paid', paidDate: daysAgo(24), items: [I('ISO 9001:2015 Stage 2 certification audit', 1, 650000), I('Auditor man-days (Daharki plant)', 4, 50000)], notes: 'Thank you for your business.', isDemo: true },
  { id: 'ai-121', number: 'INV-2026-121', customer: 'Lucky Cement', email: 'ap@lucky.example.pk', issueDate: daysAgo(15), dueDate: daysAhead(15), taxRate: 16, status: 'Sent', items: [I('QMS consulting retainer — phase 2', 1, 450000), I('Document control workshop', 1, 150000)], notes: 'Part payment of PKR 400,000 received.', isDemo: true },
  { id: 'ai-122', number: 'INV-2026-122', customer: 'Packages Ltd', email: 'finance@packages.example.pk', issueDate: daysAgo(44), dueDate: daysAgo(14), taxRate: 16, status: 'Sent', items: [I('ISO 14001 surveillance audit', 1, 380000)], notes: '', isDemo: true },
  { id: 'ai-123', number: 'INV-2026-123', customer: 'Nestlé Pakistan', email: 'payables@nestle.example.pk', issueDate: daysAgo(70), dueDate: daysAgo(40), taxRate: 16, status: 'Sent', items: [I('FSSC 22000 gap analysis', 1, 520000), I('HACCP refresher training (20 pax)', 20, 9500)], notes: '', isDemo: true },
  { id: 'ai-124', number: 'INV-2026-124', customer: 'Interloop Ltd', email: 'ap@interloop.example.pk', issueDate: daysAgo(10), dueDate: daysAhead(20), taxRate: 16, status: 'Sent', items: [I('ISO 45001 implementation support', 1, 720000)], notes: '', isDemo: true },
  { id: 'ai-125', number: 'INV-2026-125', customer: 'Systems Ltd', email: 'vendor@systems.example.pk', issueDate: daysAgo(6), dueDate: daysAhead(24), taxRate: 16, status: 'Paid', paidDate: daysAgo(1), items: [I('ISO 27001 internal auditor course (12 pax)', 12, 32000)], notes: '', isDemo: true },
  { id: 'ai-126', number: 'INV-2026-126', customer: 'Gul Ahmed Textiles', email: 'accounts@gulahmed.example.pk', issueDate: daysAgo(3), dueDate: daysAhead(27), taxRate: 16, status: 'Draft', items: [I('Social compliance (SA8000) pre-audit', 1, 410000), I('Travel & lodging (Karachi)', 1, 55000)], notes: '', isDemo: true },
  { id: 'ai-119', number: 'INV-2026-119', customer: 'Fauji Foods', email: 'finance@faujifoods.example.pk', issueDate: daysAgo(52), dueDate: daysAgo(22), taxRate: 16, status: 'Paid', paidDate: daysAgo(25), items: [I('ISO 22000 certification audit', 1, 560000)], notes: '', isDemo: true },
  { id: 'ai-120', number: 'INV-2026-120', customer: 'Hilal Foods', email: 'ap@hilal.example.pk', issueDate: daysAgo(100), dueDate: daysAgo(70), taxRate: 16, status: 'Sent', items: [I('Halal assurance system audit', 1, 290000)], notes: 'Second reminder sent.', isDemo: true },
  { id: 'ai-117', number: 'INV-2026-117', customer: 'Atlas Honda', email: 'ap@atlashonda.example.pk', issueDate: daysAgo(58), dueDate: daysAgo(28), taxRate: 16, status: 'Void', items: [I('IATF 16949 readiness review', 1, 480000)], notes: 'Replaced by revised quote.', isDemo: true },
];

export const taxTypes = ['Sales Tax on Services', 'Advance Income Tax'];
export const taxFilingStatuses = ['Open', 'Filed', 'Paid'];
export const initialTaxPeriods = [3, 2, 1, 0].map(offset => {
  const r = monthRange(offset);
  const due = new Date(r.to); due.setDate(due.getDate() + 18);
  return {
    id: `tp-st-${monthKey(offset)}`, name: `Sales tax return — ${r.label}`, taxType: 'Sales Tax on Services', authority: 'Punjab Revenue Authority',
    from: r.from, to: r.to, dueDate: isoDate(due), rate: 16, adjustment: 0,
    status: offset >= 2 ? 'Paid' : offset === 1 ? 'Filed' : 'Open', filedOn: offset >= 1 ? isoDate(new Date(new Date(r.to).getTime() + 12 * 86400000)) : '',
    reference: offset >= 1 ? `PRA-${monthKey(offset).replace('-', '')}-77${offset}` : '', isDemo: true,
  };
}).concat([{
  id: 'tp-ait-q', name: 'Advance income tax — current quarter', taxType: 'Advance Income Tax', authority: 'Federal Board of Revenue',
  from: monthRange(2).from, to: monthRange(0).to, dueDate: daysAhead(25), rate: 3, adjustment: 0, status: 'Open', filedOn: '', reference: '', isDemo: true,
}]);

export const bankLineStatuses = ['Unmatched', 'Matched', 'Excluded'];
export const initialBankLines = [
  { id: 'bl-01', date: daysAgo(33), description: 'IBFT OUT SALARY BATCH 0729', amount: -1786000, bankAccount: 'HBL Operating ••2290', matchedEntryId: 'je-1001', status: 'Matched', isDemo: true },
  { id: 'bl-02', date: daysAgo(33), description: 'CHQ 004512 RENT GULBERG', amount: -420000, bankAccount: 'HBL Operating ••2290', matchedEntryId: 'je-1002', status: 'Matched', isDemo: true },
  { id: 'bl-03', date: daysAgo(23), description: 'RAAST IN ENGRO FERTILIZERS LTD', amount: 986000, bankAccount: 'HBL Operating ••2290', matchedEntryId: '', status: 'Unmatched', isDemo: true },
  { id: 'bl-04', date: daysAgo(20), description: 'POS MICROSOFT*365 / ZOHO CORP', amount: -113680, bankAccount: 'HBL Operating ••2290', matchedEntryId: '', status: 'Unmatched', isDemo: true },
  { id: 'bl-05', date: daysAgo(12), description: 'LESCO BILL PAY 2311 0098', amount: -74200, bankAccount: 'HBL Operating ••2290', matchedEntryId: '', status: 'Unmatched', isDemo: true },
  { id: 'bl-06', date: daysAgo(9), description: 'IBFT IN LUCKY CEMENT LTD', amount: 400000, bankAccount: 'HBL Operating ••2290', matchedEntryId: '', status: 'Unmatched', isDemo: true },
  { id: 'bl-07', date: daysAgo(8), description: 'BANK CHARGES — SMS ALERTS & FED', amount: -1450, bankAccount: 'HBL Operating ••2290', matchedEntryId: '', status: 'Unmatched', isDemo: true },
  { id: 'bl-08', date: daysAgo(4), description: 'IBFT OUT SALARY BATCH 0829', amount: -1814500, bankAccount: 'HBL Operating ••2290', matchedEntryId: '', status: 'Unmatched', isDemo: true },
  { id: 'bl-09', date: daysAgo(3), description: 'CHQ 004538 RENT GULBERG', amount: -420000, bankAccount: 'HBL Operating ••2290', matchedEntryId: '', status: 'Unmatched', isDemo: true },
  { id: 'bl-10', date: daysAgo(2), description: 'CASH DEPOSIT — UNKNOWN REF', amount: 25000, bankAccount: 'HBL Operating ••2290', matchedEntryId: '', status: 'Unmatched', isDemo: true },
];

// ── Banking: accounts, statement lines, cards, beneficiaries, transfers, loans, wires
export const bankAccountTypes = ['Current', 'Savings', 'Business', 'Term Deposit'];
export const bankAccountStatuses = ['Active', 'Dormant', 'Frozen', 'Closed'];
export const initialBankAccounts = [
  { id: 'ba-current', name: 'Everyday Current', bank: 'HBL', type: 'Current', iban: 'PK36HABB0012447100982290', last4: '2290', holder: 'Ahmed Raza Khan', balance: 486216, profitRate: 0, openedOn: '2019-03-14', status: 'Active', primary: true, isDemo: true },
  { id: 'ba-savings', name: 'Profit Savings', bank: 'Meezan Bank', type: 'Savings', iban: 'PK12MEZN0001020355417715', last4: '7715', holder: 'Ahmed Raza Khan', balance: 2964025, profitRate: 10.5, openedOn: '2020-08-02', status: 'Active', primary: false, isDemo: true },
  { id: 'ba-business', name: 'Business Operating', bank: 'UBL', type: 'Business', iban: 'PK70UNIL0109000311280043', last4: '0043', holder: 'Raza Quality Services', balance: 1830412, profitRate: 0, openedOn: '2021-11-20', status: 'Active', primary: false, isDemo: true },
  { id: 'ba-tdr', name: '1-Year Term Deposit', bank: 'Bank Alfalah', type: 'Term Deposit', iban: 'PK02ALFH0055001005575561', last4: '5561', holder: 'Ahmed Raza Khan', balance: 1500000, profitRate: 12.25, openedOn: daysAgo(140), status: 'Active', primary: false, isDemo: true },
];

export const bankTxnCategories = ['Salary', 'Groceries', 'Dining', 'Fuel', 'Utilities', 'Shopping', 'Travel', 'Transfer', 'Profit', 'Bills', 'Fees', 'Business Income', 'Subscriptions'];
function buildBankTxns() {
  const rnd = mulberry32(77);
  const out = [];
  let n = 1;
  const add = (accountId, d, description, amount, category, cardId = '', channel = 'Card') => {
    if (d < 0) return;
    out.push({ id: `bt-${String(n).padStart(3, '0')}`, accountId, date: daysAgo(d), description, amount: Math.round(amount), category, cardId, channel, isDemo: true });
    n += 1;
  };
  const shops = [
    ['Imtiaz Super Market', 'Groceries', 6000, 14000], ['Al-Fatah Store', 'Groceries', 4000, 11000], ['PSO Fuel — Model Town', 'Fuel', 5000, 9000],
    ['Shell Select — DHA', 'Fuel', 4500, 8500], ['Daraz.pk', 'Shopping', 2500, 18000], ['foodpanda', 'Dining', 1200, 4200], ['Careem', 'Travel', 600, 2400],
    ['Café Aylanto', 'Dining', 6500, 14000], ['Khaadi — Emporium', 'Shopping', 7000, 22000], ['Netflix.com', 'Subscriptions', 1100, 1100], ['Spotify Premium', 'Subscriptions', 479, 479],
  ];
  for (let d = 88; d >= 0; d -= 1) {
    const dom = new Date(TODAY.getTime() - d * 86400000).getDate();
    if (dom === 1) add('ba-current', d, 'Salary — Meridian QMP (Pvt) Ltd', 465000, 'Salary', '', 'IBFT');
    if (dom === 5) add('ba-current', d, 'K-Electric bill payment', -(14000 + rnd() * 9000), 'Utilities', '', 'Bill Pay');
    if (dom === 6) add('ba-current', d, 'SNGPL gas bill', -(3200 + rnd() * 2500), 'Utilities', '', 'Bill Pay');
    if (dom === 7) add('ba-current', d, 'PTCL Flash Fiber', -5999, 'Bills', '', 'Bill Pay');
    if (dom === 28) add('ba-savings', d, 'Monthly profit credit', 24500 + rnd() * 1500, 'Profit', '', 'System');
    if (dom === 10) add('ba-business', d, 'Client receipt — Hilal Foods', 180000 + rnd() * 90000, 'Business Income', '', 'RAAST');
    if (dom === 20) add('ba-business', d, 'Client receipt — Shan Foods', 120000 + rnd() * 80000, 'Business Income', '', 'IBFT');
    if (dom === 15) add('ba-business', d, 'Contractor payment — field auditors', -(95000 + rnd() * 40000), 'Transfer', '', 'IBFT');
    if (dom === 30) add('ba-business', d, 'Account maintenance & FED', -575, 'Fees', '', 'System');
    if (rnd() < 0.55) {
      const [name, cat, lo, hi] = shops[Math.floor(rnd() * shops.length)];
      const card = rnd() < 0.6 ? 'bc-visa' : 'bc-master';
      add(card === 'bc-visa' ? 'ba-current' : 'ba-current', d, name, -(lo + rnd() * (hi - lo)), cat, card, 'Card');
    }
    if (rnd() < 0.12) add('ba-business', d, ['Daraz Seller Centre', 'Hafeez Centre IT', 'Gourmet Bakers'][Math.floor(rnd() * 3)], -(4000 + rnd() * 16000), 'Shopping', 'bc-business', 'Card');
  }
  return out.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}
export const initialBankTxns = buildBankTxns();

export const cardNetworks = ['Visa', 'Mastercard', 'UnionPay', 'PayPak'];
export const cardTypes = ['Debit', 'Credit', 'Prepaid'];
export const cardStatuses = ['Active', 'Frozen', 'Blocked', 'Expired'];
export const initialBankCards = [
  { id: 'bc-visa', label: 'Visa Platinum Debit', network: 'Visa', type: 'Debit', last4: '4721', holder: 'Ahmed Raza Khan', accountId: 'ba-current', limit: 250000, expiry: '09/29', status: 'Active', onlinePayments: true, international: false, contactless: true, design: 'spruce', isDemo: true },
  { id: 'bc-master', label: 'Mastercard Titanium Credit', network: 'Mastercard', type: 'Credit', last4: '9034', holder: 'Ahmed Raza Khan', accountId: 'ba-current', limit: 400000, expiry: '03/28', status: 'Active', onlinePayments: true, international: true, contactless: true, design: 'midnight', isDemo: true },
  { id: 'bc-business', label: 'Business Debit', network: 'Visa', type: 'Debit', last4: '0043', holder: 'Raza Quality Services', accountId: 'ba-business', limit: 150000, expiry: '11/27', status: 'Active', onlinePayments: true, international: false, contactless: false, design: 'gold', isDemo: true },
  { id: 'bc-paypak', label: 'PayPak Classic', network: 'PayPak', type: 'Debit', last4: '6618', holder: 'Ahmed Raza Khan', accountId: 'ba-savings', limit: 50000, expiry: '06/27', status: 'Frozen', onlinePayments: false, international: false, contactless: false, design: 'slate', isDemo: true },
];

export const pkBanks = ['HBL', 'Meezan Bank', 'UBL', 'MCB', 'Bank Alfalah', 'Allied Bank', 'Bank Al Habib', 'JS Bank', 'Faysal Bank', 'Standard Chartered', 'Easypaisa', 'JazzCash'];
export const initialBeneficiaries = [
  { id: 'bf-ali', name: 'Ali Hassan', bank: 'Meezan Bank', account: 'PK45MEZN0002210100445566', nickname: 'Ali (brother)', isDemo: true },
  { id: 'bf-sara', name: 'Sara Khan', bank: 'Bank Alfalah', account: 'PK88ALFH0051002004123399', nickname: 'Sara — rent', isDemo: true },
  { id: 'bf-shahid', name: 'Shahid Mehmood Traders', bank: 'UBL', account: 'PK19UNIL0109000277100812', nickname: 'Office supplies', isDemo: true },
  { id: 'bf-hina', name: 'Hina Butt', bank: 'JS Bank', account: 'PK03JSBL9550000001882211', nickname: 'Hina', isDemo: true },
  { id: 'bf-noor', name: 'Noor Fatima', bank: 'Easypaisa', account: '03451234567', nickname: 'Noor — tuition', isDemo: true },
];

export const transferChannels = ['Internal', 'RAAST', 'IBFT'];
export const transferStatuses = ['Completed', 'Scheduled', 'Cancelled', 'Failed'];
export const initialBankTransfers = [
  { id: 'tr-001', date: daysAgo(2), fromId: 'ba-current', toKind: 'beneficiary', toId: 'bf-sara', toName: 'Sara Khan', amount: 85000, fee: 0, channel: 'RAAST', reference: 'House rent', status: 'Completed', isDemo: true },
  { id: 'tr-002', date: daysAgo(5), fromId: 'ba-current', toKind: 'account', toId: 'ba-savings', toName: 'Profit Savings', amount: 100000, fee: 0, channel: 'Internal', reference: 'Monthly saving', status: 'Completed', isDemo: true },
  { id: 'tr-003', date: daysAgo(9), fromId: 'ba-business', toKind: 'beneficiary', toId: 'bf-shahid', toName: 'Shahid Mehmood Traders', amount: 42500, fee: 0, channel: 'IBFT', reference: 'INV 3381 stationery', status: 'Completed', isDemo: true },
  { id: 'tr-004', date: daysAgo(14), fromId: 'ba-current', toKind: 'beneficiary', toId: 'bf-ali', toName: 'Ali Hassan', amount: 30000, fee: 0, channel: 'RAAST', reference: 'Eid gift', status: 'Completed', isDemo: true },
  { id: 'tr-005', date: daysAgo(20), fromId: 'ba-current', toKind: 'beneficiary', toId: 'bf-noor', toName: 'Noor Fatima', amount: 18000, fee: 0, channel: 'IBFT', reference: 'Tuition fee', status: 'Failed', isDemo: true },
  { id: 'tr-006', date: daysAhead(6), fromId: 'ba-current', toKind: 'beneficiary', toId: 'bf-sara', toName: 'Sara Khan', amount: 85000, fee: 0, channel: 'RAAST', reference: 'House rent', status: 'Scheduled', isDemo: true },
];

export const loanProducts = ['Home Finance', 'Auto Finance', 'Personal Loan', 'SME Running Finance', 'Education Loan'];
export const loanStatuses = ['Active', 'Overdue', 'Closed', 'Pending Approval'];
export const initialLoans = [
  { id: 'ln-001', reference: 'HF-2023-0412', borrower: 'Ahmed Raza Khan', product: 'Home Finance', principal: 12000000, annualRate: 14.5, termMonths: 240, startDate: '2023-06-01', paymentsMade: 0, status: 'Active', lender: 'Meezan Bank', isDemo: true },
  { id: 'ln-002', reference: 'AF-2025-1180', borrower: 'Ahmed Raza Khan', product: 'Auto Finance', principal: 3200000, annualRate: 16, termMonths: 60, startDate: '2025-02-10', paymentsMade: 0, status: 'Active', lender: 'Bank Alfalah', isDemo: true },
  { id: 'ln-003', reference: 'SME-2025-0077', borrower: 'Raza Quality Services', product: 'SME Running Finance', principal: 8000000, annualRate: 17.5, termMonths: 36, startDate: '2025-09-01', paymentsMade: 0, status: 'Active', lender: 'UBL', isDemo: true },
  { id: 'ln-004', reference: 'PL-2024-5531', borrower: 'Sana Javed', product: 'Personal Loan', principal: 750000, annualRate: 22, termMonths: 24, startDate: '2024-08-15', paymentsMade: 0, status: 'Overdue', lender: 'HBL', isDemo: true },
  { id: 'ln-005', reference: 'ED-2022-0098', borrower: 'Hamza Qureshi', product: 'Education Loan', principal: 1200000, annualRate: 12, termMonths: 48, startDate: '2022-01-05', paymentsMade: 0, status: 'Active', lender: 'Allied Bank', isDemo: true },
];
// Payments made = whole months elapsed since start (capped at term), computed once for the seed.
initialLoans.forEach(l => {
  const s = new Date(l.startDate);
  const months = (TODAY.getFullYear() - s.getFullYear()) * 12 + (TODAY.getMonth() - s.getMonth());
  l.paymentsMade = Math.max(0, Math.min(l.termMonths, months - (l.status === 'Overdue' ? 2 : 0)));
  if (l.paymentsMade >= l.termMonths) l.status = 'Closed';
});

/** Indicative FX rates per 1 USD (demo values, not live quotes). */
export const FX_RATES = { EUR: 0.92, GBP: 0.79, AED: 3.6725, SAR: 3.75, CNY: 7.12, TRY: 34.2, CAD: 1.37, AUD: 1.52, MYR: 4.7, PKR: 278.4 };
export const wireStatuses = ['Draft', 'Submitted', 'In Transit', 'Completed', 'Returned'];
export const wireCharges = ['OUR', 'SHA', 'BEN'];
export const wirePurposes = ['Supplier payment', 'Accreditation fee', 'Software licence', 'Training fee', 'Family support', 'Education fee'];
export const initialWires = [
  { id: 'wr-001', reference: 'WIR-26-0311', date: daysAgo(3), beneficiary: 'UKAS Ltd', country: 'United Kingdom', bank: 'Barclays Bank PLC', swift: 'BARCGB22', iban: 'GB33BARC20000055779911', amountUsd: 4200, currency: 'GBP', fxRate: 0.79, fee: 35, charges: 'OUR', purpose: 'Accreditation fee', status: 'In Transit', isDemo: true },
  { id: 'wr-002', reference: 'WIR-26-0308', date: daysAgo(9), beneficiary: 'DQS GmbH', country: 'Germany', bank: 'Deutsche Bank AG', swift: 'DEUTDEFF', iban: 'DE89370400440532013000', amountUsd: 12800, currency: 'EUR', fxRate: 0.92, fee: 45, charges: 'SHA', purpose: 'Supplier payment', status: 'Completed', isDemo: true },
  { id: 'wr-003', reference: 'WIR-26-0301', date: daysAgo(18), beneficiary: 'Al Futtaim Training LLC', country: 'United Arab Emirates', bank: 'Emirates NBD', swift: 'EBILAEAD', iban: 'AE070331234567890123456', amountUsd: 2650, currency: 'AED', fxRate: 3.6725, fee: 25, charges: 'SHA', purpose: 'Training fee', status: 'Completed', isDemo: true },
  { id: 'wr-004', reference: 'WIR-26-0296', date: daysAgo(26), beneficiary: 'Atlassian Pty Ltd', country: 'Australia', bank: 'Commonwealth Bank', swift: 'CTBAAU2S', iban: '062000-12345678', amountUsd: 1880, currency: 'AUD', fxRate: 1.52, fee: 25, charges: 'OUR', purpose: 'Software licence', status: 'Returned', isDemo: true },
  { id: 'wr-005', reference: 'WIR-26-0315', date: daysAgo(0), beneficiary: 'Saudi Standards Org. (SASO)', country: 'Saudi Arabia', bank: 'Saudi National Bank', swift: 'NCBKSAJE', iban: 'SA0380000000608010167519', amountUsd: 6100, currency: 'SAR', fxRate: 3.75, fee: 30, charges: 'OUR', purpose: 'Accreditation fee', status: 'Draft', isDemo: true },
];

// ── Crypto: demo market universe and price history ──────────────────────────
/** Illustrative reference prices (USD). Not live market data. */
export const MARKET_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', price: 67842.15, vol: 0.028, volume24h: 32.4e9, supply: 19.76e6, sector: 'Layer 1' },
  { symbol: 'ETH', name: 'Ethereum', price: 3512.8, vol: 0.034, volume24h: 18.1e9, supply: 120.3e6, sector: 'Layer 1' },
  { symbol: 'SOL', name: 'Solana', price: 178.22, vol: 0.048, volume24h: 4.8e9, supply: 470e6, sector: 'Layer 1' },
  { symbol: 'BNB', name: 'BNB', price: 612.44, vol: 0.026, volume24h: 1.9e9, supply: 146e6, sector: 'Exchange' },
  { symbol: 'XRP', name: 'XRP', price: 0.6218, vol: 0.04, volume24h: 1.4e9, supply: 56.9e9, sector: 'Payments' },
  { symbol: 'ADA', name: 'Cardano', price: 0.4472, vol: 0.045, volume24h: 620e6, supply: 35.3e9, sector: 'Layer 1' },
  { symbol: 'AVAX', name: 'Avalanche', price: 38.06, vol: 0.05, volume24h: 310e6, supply: 392e6, sector: 'Layer 1' },
  { symbol: 'LINK', name: 'Chainlink', price: 17.42, vol: 0.046, volume24h: 540e6, supply: 608e6, sector: 'Oracle' },
  { symbol: 'DOT', name: 'Polkadot', price: 7.18, vol: 0.044, volume24h: 260e6, supply: 1.44e9, sector: 'Layer 0' },
  { symbol: 'ARB', name: 'Arbitrum', price: 0.812, vol: 0.055, volume24h: 410e6, supply: 3.2e9, sector: 'Layer 2' },
  { symbol: 'DOGE', name: 'Dogecoin', price: 0.1524, vol: 0.052, volume24h: 980e6, supply: 145e9, sector: 'Meme' },
  { symbol: 'USDT', name: 'Tether', price: 1.0, vol: 0.0006, volume24h: 48e9, supply: 118.4e9, sector: 'Stablecoin' },
];

export const initialCryptoHoldings = [
  { id: 'ch-btc', symbol: 'BTC', quantity: 0.842, avgCost: 41250, venue: 'Ledger Nano X', acquired: '2023-11-14', notes: 'Long-term reserve', isDemo: true },
  { id: 'ch-eth', symbol: 'ETH', quantity: 6.4, avgCost: 2180, venue: 'Binance', acquired: '2024-01-22', notes: '', isDemo: true },
  { id: 'ch-sol', symbol: 'SOL', quantity: 92, avgCost: 196.5, venue: 'Binance', acquired: '2025-03-04', notes: '', isDemo: true },
  { id: 'ch-bnb', symbol: 'BNB', quantity: 11.5, avgCost: 405, venue: 'Binance', acquired: '2024-06-18', notes: '', isDemo: true },
  { id: 'ch-link', symbol: 'LINK', quantity: 420, avgCost: 13.9, venue: 'Kraken', acquired: '2024-09-09', notes: '', isDemo: true },
  { id: 'ch-ada', symbol: 'ADA', quantity: 8200, avgCost: 0.58, venue: 'Kraken', acquired: '2024-04-02', notes: 'Under water — review', isDemo: true },
  { id: 'ch-usdt', symbol: 'USDT', quantity: 6500, avgCost: 1, venue: 'Binance', acquired: '2025-07-30', notes: 'Dry powder', isDemo: true },
];

export const initialCryptoWatchlist = [
  { id: 'cw-btc', symbol: 'BTC', alertAbove: 70000, alertBelow: 60000, note: 'Watch ETF flows', addedAt: daysAgo(40), isDemo: true },
  { id: 'cw-eth', symbol: 'ETH', alertAbove: 3800, alertBelow: 3200, note: '', addedAt: daysAgo(40), isDemo: true },
  { id: 'cw-sol', symbol: 'SOL', alertAbove: 200, alertBelow: 150, note: 'High beta', addedAt: daysAgo(21), isDemo: true },
  { id: 'cw-avax', symbol: 'AVAX', alertAbove: 45, alertBelow: 30, note: '', addedAt: daysAgo(12), isDemo: true },
  { id: 'cw-arb', symbol: 'ARB', alertAbove: 1, alertBelow: 0.7, note: 'Token unlock next month', addedAt: daysAgo(5), isDemo: true },
];

export const walletCustody = ['Hardware', 'Hot wallet', 'Exchange', 'Multisig'];
export const walletNetworks = ['Bitcoin', 'Ethereum', 'Solana', 'BNB Chain', 'Arbitrum', 'Tron'];
export const walletStatuses = ['Active', 'Locked', 'Archived'];
export const initialCryptoWallets = [
  { id: 'cv-cold', name: 'Treasury cold storage', network: 'Bitcoin', asset: 'BTC', address: 'bc1q9h7garjv4kq3x0mnu5p2ylz8f0k5q8xw3tz7c4', custody: 'Hardware', status: 'Active', signers: '2 of 3', isDemo: true },
  { id: 'cv-eth', name: 'Ops multisig', network: 'Ethereum', asset: 'ETH', address: '0x5A3b9F6c21D84e0B7c3E9d1F2a6B8C4d0E7f19A2', custody: 'Multisig', status: 'Active', signers: '3 of 5', isDemo: true },
  { id: 'cv-sol', name: 'Solana hot wallet', network: 'Solana', asset: 'SOL', address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', custody: 'Hot wallet', status: 'Active', signers: '1 of 1', isDemo: true },
  { id: 'cv-usdt', name: 'Stablecoin settlement', network: 'Tron', asset: 'USDT', address: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE', custody: 'Exchange', status: 'Locked', signers: '1 of 1', isDemo: true },
];
export const vaultTxnTypes = ['Deposit', 'Withdrawal'];
export const vaultTxnStatuses = ['Confirmed', 'Pending', 'Failed'];
const hash = (seed) => { const r = mulberry32(seed); return `0x${Array.from({ length: 16 }, () => Math.floor(r() * 16).toString(16)).join('')}…${Array.from({ length: 4 }, () => Math.floor(r() * 16).toString(16)).join('')}`; };
export const initialVaultTxns = [
  { id: 'vt-01', walletId: 'cv-cold', type: 'Deposit', amount: 0.5, fee: 0.00012, date: daysAgo(120), counterparty: 'Binance withdrawal', txHash: hash(1), status: 'Confirmed', isDemo: true },
  { id: 'vt-02', walletId: 'cv-cold', type: 'Deposit', amount: 0.342, fee: 0.0001, date: daysAgo(64), counterparty: 'Kraken withdrawal', txHash: hash(2), status: 'Confirmed', isDemo: true },
  { id: 'vt-03', walletId: 'cv-eth', type: 'Deposit', amount: 8, fee: 0.0021, date: daysAgo(90), counterparty: 'Binance withdrawal', txHash: hash(3), status: 'Confirmed', isDemo: true },
  { id: 'vt-04', walletId: 'cv-eth', type: 'Withdrawal', amount: 1.6, fee: 0.0018, date: daysAgo(30), counterparty: '0x91fA…c2E0 (vendor)', txHash: hash(4), status: 'Confirmed', isDemo: true },
  { id: 'vt-05', walletId: 'cv-sol', type: 'Deposit', amount: 120, fee: 0.000005, date: daysAgo(45), counterparty: 'Binance withdrawal', txHash: hash(5), status: 'Confirmed', isDemo: true },
  { id: 'vt-06', walletId: 'cv-sol', type: 'Withdrawal', amount: 28, fee: 0.000005, date: daysAgo(7), counterparty: 'Phantom — staking', txHash: hash(6), status: 'Confirmed', isDemo: true },
  { id: 'vt-07', walletId: 'cv-usdt', type: 'Deposit', amount: 10000, fee: 1, date: daysAgo(20), counterparty: 'OTC desk settlement', txHash: hash(7), status: 'Confirmed', isDemo: true },
  { id: 'vt-08', walletId: 'cv-usdt', type: 'Withdrawal', amount: 3500, fee: 1, date: daysAgo(1), counterparty: 'TVb2…8RkQ (supplier)', txHash: hash(8), status: 'Pending', isDemo: true },
  { id: 'vt-09', walletId: 'cv-eth', type: 'Withdrawal', amount: 0.4, fee: 0.0015, date: daysAgo(3), counterparty: '0x77Ba…0d1F', txHash: hash(9), status: 'Failed', isDemo: true },
];
