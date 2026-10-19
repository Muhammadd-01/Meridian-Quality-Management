/**
 * HR rules used by payroll, leave and reviews. Pure functions, so pages,
 * reports and the seed data compute figures the same way.
 */

/**
 * Simplified Pakistani salaried-income tax slabs (annual taxable income, PKR).
 * Illustrative only — confirm current FBR slabs before using for real payroll.
 */
export const TAX_SLABS = [
  { upTo: 600000, base: 0, rate: 0, over: 0 },
  { upTo: 1200000, base: 0, rate: 0.01, over: 600000 },
  { upTo: 2200000, base: 6000, rate: 0.11, over: 1200000 },
  { upTo: 3200000, base: 116000, rate: 0.23, over: 2200000 },
  { upTo: 4100000, base: 346000, rate: 0.30, over: 3200000 },
  { upTo: Infinity, base: 616000, rate: 0.35, over: 4100000 },
];

export const PAYROLL_RULES = {
  providentFundRate: 0.0833, // employee share of basic salary
  eobi: 370, // employee EOBI contribution per month (1% of minimum wage)
  overtimeMultiplier: 2, // overtime paid at 2× hourly basic
  standardHours: 208, // 26 working days × 8 hours
};

export function annualIncomeTax(annualTaxable) {
  const slab = TAX_SLABS.find(s => annualTaxable <= s.upTo) || TAX_SLABS[TAX_SLABS.length - 1];
  return Math.max(0, Math.round(slab.base + (annualTaxable - slab.over) * slab.rate));
}

/** Monthly payslip from basic, allowances, overtime hours, bonus and other deductions. */
export function computePayslip({ basic = 0, allowances = 0, overtimeHours = 0, bonus = 0, otherDeductions = 0 }) {
  const b = Number(basic) || 0;
  const hourly = b / PAYROLL_RULES.standardHours;
  const overtimePay = Math.round(hourly * PAYROLL_RULES.overtimeMultiplier * (Number(overtimeHours) || 0));
  const gross = Math.round(b + (Number(allowances) || 0) + overtimePay + (Number(bonus) || 0));
  const tax = Math.round(annualIncomeTax(gross * 12) / 12);
  const providentFund = Math.round(b * PAYROLL_RULES.providentFundRate);
  const eobi = b > 0 ? PAYROLL_RULES.eobi : 0;
  const deductions = tax + providentFund + eobi + (Number(otherDeductions) || 0);
  return { overtimePay, gross, tax, providentFund, eobi, deductions, net: gross - deductions };
}

/** Annual entitlement (days) per leave type; Unpaid has no balance. */
export const LEAVE_ENTITLEMENT = { Annual: 14, Sick: 8, Casual: 10 };
export const LEAVE_TYPES = ['Annual', 'Sick', 'Casual', 'Unpaid', 'Maternity', 'Paternity'];
export const BALANCE_FIELD = { Annual: 'annualBalance', Sick: 'sickBalance', Casual: 'casualBalance' };

export const DEPARTMENTS = ['Engineering', 'Quality Assurance', 'Sales', 'Operations', 'Finance', 'People & HR', 'Customer Support'];

/** 9-box placement: performance from the rating, potential from the review. */
export const performanceBand = (rating) => (rating >= 4.2 ? 'High' : rating >= 3 ? 'Medium' : 'Low');
export const NINE_BOX = [
  ['High', 'Low', 'Trusted Pro'], ['High', 'Medium', 'High Performer'], ['High', 'High', 'Top Talent'],
  ['Medium', 'Low', 'Inconsistent'], ['Medium', 'Medium', 'Core Player'], ['Medium', 'High', 'Future Star'],
  ['Low', 'Low', 'Poor Fit'], ['Low', 'Medium', 'Underperformer'], ['Low', 'High', 'Risk'],
];

export const goalProgress = (goals = []) => (goals.length ? Math.round(goals.reduce((s, g) => s + (Number(g.progress) || 0), 0) / goals.length) : 0);
