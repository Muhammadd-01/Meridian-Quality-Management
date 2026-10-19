/**
 * Seed data for the commerce module group. Every seeded record is demo data
 * and carries `isDemo: true` so pages can label it.
 *
 * Records are linked by id: orders → customers + products, payments and
 * invoices → orders, reviews → products, carts → customers + products.
 */
const demo = (records) => records.map(r => ({ ...r, isDemo: true }));

export const customerSegments = ['Enterprise', 'Mid-Market', 'SMB', 'Individual'];
export const customerStatuses = ['Active', 'Prospect', 'Inactive'];

export const productStatuses = ['Active', 'Draft', 'Archived'];
export const productTypes = ['Physical', 'Digital'];
export const categoryVisibility = ['Visible', 'Hidden'];
export const ORDER_STATUSES = ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];
export const paymentMethods = ['Card', 'Bank Transfer', 'JazzCash', 'Easypaisa', 'Cash on Delivery', 'PayPal'];
export const salesChannels = ['Website', 'Mobile App', 'Marketplace', 'Sales Rep'];
export const reviewStatuses = ['Pending', 'Approved', 'Hidden'];
export const invoiceStatuses = ['Draft', 'Sent', 'Partially Paid', 'Paid', 'Void'];
export const paymentStatuses = ['Received', 'Pending', 'Failed', 'Refunded'];
export const couponTypes = ['Percent', 'Fixed'];
export const couponStatuses = ['Active', 'Paused', 'Expired'];
export const cartStages = ['Cart', 'Checkout – Details', 'Checkout – Payment'];
export const cartStatuses = ['Abandoned', 'Recovered', 'Expired'];

export const initialCustomers = demo([
  { id: 'cust-001', name: 'Hina Siddiqui', company: 'Premier Foods Pakistan', email: 'hina@premierfoods.pk', phone: '+92 42 3578 9012', city: 'Lahore', segment: 'Enterprise', status: 'Active', orders: 14, lifetimeValue: 4850000, lastOrder: '2026-10-12', tags: ['ISO 22000', 'Key account'] },
  { id: 'cust-002', name: 'Bilal Ahmed', company: 'Apex Precision Engineering', email: 'bilal@precision.pk', phone: '+92 41 8765 4321', city: 'Faisalabad', segment: 'Mid-Market', status: 'Active', orders: 8, lifetimeValue: 1920000, lastOrder: '2026-09-28', tags: ['ISO 17025'] },
  { id: 'cust-003', name: 'Sara Malik', company: 'PharmaCare Solutions', email: 'sara@pharmacare.pk', phone: '+92 51 2234 5678', city: 'Islamabad', segment: 'Enterprise', status: 'Active', orders: 21, lifetimeValue: 7310000, lastOrder: '2026-10-15', tags: ['GMP', 'Key account'] },
  { id: 'cust-004', name: 'Usman Tariq', company: 'Textile Corp Pakistan', email: 'usman@textilecorp.pk', phone: '+92 300 1234567', city: 'Karachi', segment: 'Mid-Market', status: 'Active', orders: 6, lifetimeValue: 1340000, lastOrder: '2026-08-30', tags: ['ISO 9001'] },
  { id: 'cust-005', name: 'Ayesha Noor', company: 'BrightPath Learning', email: 'ayesha@brightpath.com', phone: '+1 303 555 0133', city: 'Denver', segment: 'SMB', status: 'Active', orders: 4, lifetimeValue: 640000, lastOrder: '2026-10-02', tags: ['Training'] },
  { id: 'cust-006', name: 'Kamran Shah', company: 'Orbit Logistics', email: 'kamran@orbitlogistics.pk', phone: '+92 21 3456 1122', city: 'Karachi', segment: 'Mid-Market', status: 'Prospect', orders: 0, lifetimeValue: 0, lastOrder: '', tags: ['Fleet QA'] },
  { id: 'cust-007', name: 'Mariam Qureshi', company: 'Cascade Retail Group', email: 'mariam@cascaderetail.com', phone: '+1 312 555 0142', city: 'Chicago', segment: 'Enterprise', status: 'Active', orders: 17, lifetimeValue: 5260000, lastOrder: '2026-10-09', tags: ['ISO 9001', 'Renewal'] },
  { id: 'cust-008', name: 'Faisal Raza', company: 'Northwind Engineering', email: 'faisal@northwindcorp.com', phone: '+1 206 555 0181', city: 'Seattle', segment: 'Enterprise', status: 'Active', orders: 11, lifetimeValue: 3980000, lastOrder: '2026-09-18', tags: ['ISO 14001'] },
  { id: 'cust-009', name: 'Zainab Ali', company: 'Meridian Labs & Diagnostics', email: 'zainab@meridianlabs.pk', phone: '+92 21 3456 7890', city: 'Karachi', segment: 'SMB', status: 'Active', orders: 5, lifetimeValue: 910000, lastOrder: '2026-07-21', tags: ['Calibration'] },
  { id: 'cust-010', name: 'Hamza Iqbal', company: 'AutoParts Manufacturing', email: 'hamza@autoparts.pk', phone: '+92 321 9876543', city: 'Lahore', segment: 'Mid-Market', status: 'Inactive', orders: 2, lifetimeValue: 380000, lastOrder: '2025-12-04', tags: [] },
  { id: 'cust-011', name: 'Nadia Hussain', company: 'Solace Health', email: 'nadia@solacehealth.com', phone: '+1 617 555 0190', city: 'Boston', segment: 'Mid-Market', status: 'Prospect', orders: 0, lifetimeValue: 0, lastOrder: '', tags: ['ISO 13485'] },
  { id: 'cust-012', name: 'Omar Farooq', company: 'Independent consultant', email: 'omar.farooq@gmail.com', phone: '+92 333 5556789', city: 'Rawalpindi', segment: 'Individual', status: 'Active', orders: 3, lifetimeValue: 145000, lastOrder: '2026-10-05', tags: ['Course buyer'] },
]);

// ── Categories ──────────────────────────────────────────────────────────────
export const initialCategories = demo([
  { id: 'cat-01', name: 'Documentation Toolkits', slug: 'documentation-toolkits', parent: '', visibility: 'Visible', sortOrder: 1, description: 'Ready-to-edit management system documentation.' },
  { id: 'cat-02', name: 'ISO Toolkits', slug: 'iso-toolkits', parent: 'Documentation Toolkits', visibility: 'Visible', sortOrder: 2, description: 'Manuals, procedures and forms for ISO 9001, 14001 and 45001.' },
  { id: 'cat-03', name: 'Food Safety Templates', slug: 'food-safety-templates', parent: 'Documentation Toolkits', visibility: 'Visible', sortOrder: 3, description: 'HACCP plans and ISO 22000 / FSSC templates.' },
  { id: 'cat-04', name: 'Training & Certification', slug: 'training-certification', parent: '', visibility: 'Visible', sortOrder: 4, description: 'Course vouchers for auditor and Lean Six Sigma programmes.' },
  { id: 'cat-05', name: 'Measuring Instruments', slug: 'measuring-instruments', parent: '', visibility: 'Visible', sortOrder: 5, description: 'Dimensional and lab measuring equipment.' },
  { id: 'cat-06', name: 'Calibration Equipment', slug: 'calibration-equipment', parent: 'Measuring Instruments', visibility: 'Visible', sortOrder: 6, description: 'Reference weights and calibrators with certificates.' },
  { id: 'cat-07', name: 'Books & Standards', slug: 'books-standards', parent: '', visibility: 'Visible', sortOrder: 7, description: 'Printed standards and quality handbooks.' },
  { id: 'cat-08', name: 'Safety & 5S Supplies', slug: 'safety-5s-supplies', parent: '', visibility: 'Visible', sortOrder: 8, description: 'Floor marking, labels and audit pads.' },
  { id: 'cat-09', name: 'Gift Cards', slug: 'gift-cards', parent: '', visibility: 'Hidden', sortOrder: 9, description: 'Planned for the Q1 2027 launch.' },
]);

// ── Products ────────────────────────────────────────────────────────────────
export const initialProducts = demo([
  { id: 'prd-01', name: 'ISO 9001:2015 QMS Documentation Toolkit', sku: 'MQ-DOC-9001', category: 'ISO Toolkits', productType: 'Digital', brand: 'Meridian', price: 45000, cost: 9000, stock: 500, reorderLevel: 0, status: 'Active', tags: ['ISO 9001', 'Bestseller'], description: 'Quality manual, 24 procedures and 60 forms in editable Word/Excel.' },
  { id: 'prd-02', name: 'ISO 14001:2015 EMS Documentation Toolkit', sku: 'MQ-DOC-14001', category: 'ISO Toolkits', productType: 'Digital', brand: 'Meridian', price: 42000, cost: 8500, stock: 500, reorderLevel: 0, status: 'Active', tags: ['ISO 14001'], description: 'Aspects register, legal register, procedures and forms.' },
  { id: 'prd-03', name: 'ISO 45001:2018 OH&S Toolkit', sku: 'MQ-DOC-45001', category: 'ISO Toolkits', productType: 'Digital', brand: 'Meridian', price: 42000, cost: 8500, stock: 500, reorderLevel: 0, status: 'Active', tags: ['ISO 45001'], description: 'Hazard identification, risk assessment and OH&S procedures.' },
  { id: 'prd-04', name: 'HACCP & ISO 22000 Template Pack', sku: 'MQ-DOC-22000', category: 'Food Safety Templates', productType: 'Digital', brand: 'Meridian', price: 38000, cost: 7000, stock: 500, reorderLevel: 0, status: 'Active', tags: ['ISO 22000', 'HACCP'], description: 'Hazard analysis worksheets, PRP checklists and CCP monitoring logs.' },
  { id: 'prd-05', name: 'ISO 9001 Internal Auditor Course Voucher', sku: 'MQ-TRN-IA9001', category: 'Training & Certification', productType: 'Digital', brand: 'Meridian Academy', price: 65000, cost: 22000, stock: 40, reorderLevel: 10, status: 'Active', tags: ['Training', 'ISO 9001'], description: '3-day course seat, online or Lahore/Karachi classrooms.' },
  { id: 'prd-06', name: 'ISO 9001 Lead Auditor Course Voucher', sku: 'MQ-TRN-LA9001', category: 'Training & Certification', productType: 'Digital', brand: 'Meridian Academy', price: 145000, cost: 52000, stock: 12, reorderLevel: 5, status: 'Active', tags: ['Training', 'CQI/IRCA'], description: '5-day CQI/IRCA certified lead auditor course seat.' },
  { id: 'prd-07', name: 'Lean Six Sigma Green Belt Voucher', sku: 'MQ-TRN-LSSGB', category: 'Training & Certification', productType: 'Digital', brand: 'Meridian Academy', price: 98000, cost: 35000, stock: 0, reorderLevel: 5, status: 'Active', tags: ['Training', 'Lean'], description: 'Green Belt programme seat with project coaching.' },
  { id: 'prd-08', name: 'Digital Vernier Caliper 150 mm', sku: 'MQ-INS-VC150', category: 'Measuring Instruments', productType: 'Physical', brand: 'Mitutoyo', price: 8500, cost: 4800, stock: 34, reorderLevel: 15, status: 'Active', tags: ['Dimensional'], description: '0.01 mm resolution, IP54, with calibration certificate.' },
  { id: 'prd-09', name: 'Outside Micrometer 0–25 mm', sku: 'MQ-INS-MIC25', category: 'Measuring Instruments', productType: 'Physical', brand: 'Mitutoyo', price: 12500, cost: 7200, stock: 6, reorderLevel: 10, status: 'Active', tags: ['Dimensional'], description: 'Ratchet stop, carbide-tipped faces, 0.001 mm graduation.' },
  { id: 'prd-10', name: 'Digital pH Meter (Lab Grade)', sku: 'MQ-INS-PH01', category: 'Measuring Instruments', productType: 'Physical', brand: 'Hanna', price: 27500, cost: 16500, stock: 18, reorderLevel: 8, status: 'Active', tags: ['Lab'], description: 'Bench meter with ATC probe and 3-point calibration.' },
  { id: 'prd-11', name: 'Calibration Weight Set M1 (1 mg–200 g)', sku: 'MQ-CAL-WM1', category: 'Calibration Equipment', productType: 'Physical', brand: 'Kern', price: 68000, cost: 41000, stock: 4, reorderLevel: 5, status: 'Active', tags: ['Calibration', 'ISO 17025'], description: 'OIML M1 stainless set in aluminium case, traceable certificate.' },
  { id: 'prd-12', name: 'Thermocouple Calibrator', sku: 'MQ-CAL-TC100', category: 'Calibration Equipment', productType: 'Physical', brand: 'Fluke', price: 115000, cost: 78000, stock: 3, reorderLevel: 2, status: 'Active', tags: ['Calibration'], description: 'Sources and measures 13 thermocouple types.' },
  { id: 'prd-13', name: 'ISO 9001:2015 Standard (Printed, EN)', sku: 'MQ-BK-9001', category: 'Books & Standards', productType: 'Physical', brand: 'ISO', price: 9800, cost: 6200, stock: 55, reorderLevel: 20, status: 'Active', tags: ['ISO 9001'], description: 'Official printed copy of ISO 9001:2015.' },
  { id: 'prd-14', name: 'The Lean Six Sigma Pocket Toolbook', sku: 'MQ-BK-LSSPT', category: 'Books & Standards', productType: 'Physical', brand: 'McGraw Hill', price: 6500, cost: 3900, stock: 22, reorderLevel: 10, status: 'Active', tags: ['Lean'], description: 'Quick reference guide to 70+ improvement tools.' },
  { id: 'prd-15', name: '5S Floor Marking Tape Kit', sku: 'MQ-SAF-5STAPE', category: 'Safety & 5S Supplies', productType: 'Physical', brand: 'Brady', price: 14500, cost: 8200, stock: 0, reorderLevel: 10, status: 'Active', tags: ['5S'], description: '6 colours × 33 m industrial floor tape with corner marks.' },
  { id: 'prd-16', name: 'Safety Audit Checklist Pad (Pack of 10)', sku: 'MQ-SAF-SACP', category: 'Safety & 5S Supplies', productType: 'Physical', brand: 'Meridian', price: 4200, cost: 1900, stock: 120, reorderLevel: 30, status: 'Active', tags: ['Safety'], description: 'Carbonless duplicate pads for workplace inspections.' },
  { id: 'prd-17', name: 'Quality KPI Dashboard Template (Excel)', sku: 'MQ-DOC-KPI', category: 'Documentation Toolkits', productType: 'Digital', brand: 'Meridian', price: 18000, cost: 2000, stock: 500, reorderLevel: 0, status: 'Draft', tags: ['KPI'], description: 'Cost of quality, NCR and supplier scorecards — launching November.' },
]);

// ── Coupons ─────────────────────────────────────────────────────────────────
export const initialCoupons = demo([
  { id: 'cpn-01', code: 'WELCOME10', description: 'First order discount', type: 'Percent', value: 10, minOrder: 0, startDate: '2026-01-01', endDate: '2026-12-31', usageLimit: 500, status: 'Active' },
  { id: 'cpn-02', code: 'B2B5', description: 'Corporate orders above PKR 100,000', type: 'Percent', value: 5, minOrder: 100000, startDate: '2026-01-01', endDate: '2026-12-31', usageLimit: 200, status: 'Active' },
  { id: 'cpn-03', code: 'MONSOON15', description: 'Monsoon sale', type: 'Percent', value: 15, minOrder: 20000, startDate: '2026-07-01', endDate: '2026-08-31', usageLimit: 100, status: 'Expired' },
  { id: 'cpn-04', code: 'QUALITY20', description: 'World Quality Month early bird', type: 'Percent', value: 20, minOrder: 15000, startDate: '2026-09-15', endDate: '2026-10-25', usageLimit: 50, status: 'Active' },
  { id: 'cpn-05', code: 'FLAT5000', description: 'PKR 5,000 off orders above PKR 50,000', type: 'Fixed', value: 5000, minOrder: 50000, startDate: '2026-10-01', endDate: '2026-12-31', usageLimit: 100, status: 'Active' },
  { id: 'cpn-06', code: 'EID2026', description: 'Eid ul-Fitr offer', type: 'Fixed', value: 2500, minOrder: 10000, startDate: '2026-03-15', endDate: '2026-04-05', usageLimit: 150, status: 'Expired' },
]);

// ── Order maths (shared with the Orders page) ───────────────────────────────
export const SHIPPING_FEE = 450;
export const FREE_SHIPPING_FROM = 25000;

/** Discount a coupon gives on a subtotal (0 if it doesn't apply). */
export function couponDiscount(coupon, subtotal) {
  if (!coupon || subtotal < (Number(coupon.minOrder) || 0)) return 0;
  const raw = coupon.type === 'Fixed' ? Number(coupon.value) || 0 : (subtotal * (Number(coupon.value) || 0)) / 100;
  return Math.min(subtotal, Math.round(raw));
}

/** Totals for a list of line items ({ qty, price, physical }). */
export function orderTotals(items, coupon) {
  const subtotal = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0), 0);
  const hasPhysical = items.some(i => i.productType === 'Physical');
  const shipping = hasPhysical && subtotal < FREE_SHIPPING_FROM ? SHIPPING_FEE : 0;
  const discount = couponDiscount(coupon, subtotal);
  return { subtotal, discount, shipping, total: Math.max(0, subtotal - discount + shipping), itemCount: items.reduce((s, i) => s + (Number(i.qty) || 0), 0) };
}

/** Payment status that goes with an order status. */
export const paymentStatusFor = (status) => ({ Pending: 'Unpaid', Paid: 'Paid', Shipped: 'Paid', Delivered: 'Paid', Cancelled: 'Void', Refunded: 'Refunded' }[status] || 'Unpaid');

// ── Orders ──────────────────────────────────────────────────────────────────
// [number, customer, date, status, payment method, channel, 'product:qty,…', coupon]
const ORDER_SPEC = [
  [10241, 'cust-003', '2026-05-04', 'Delivered', 'Bank Transfer', 'Website', 'prd-01:1,prd-13:3'],
  [10242, 'cust-001', '2026-05-09', 'Delivered', 'Bank Transfer', 'Sales Rep', 'prd-04:2,prd-10:1'],
  [10243, 'cust-007', '2026-05-15', 'Delivered', 'PayPal', 'Website', 'prd-05:3'],
  [10244, 'cust-012', '2026-05-21', 'Delivered', 'JazzCash', 'Mobile App', 'prd-14:1,prd-13:1', 'WELCOME10'],
  [10245, 'cust-002', '2026-05-28', 'Refunded', 'Card', 'Website', 'prd-09:2'],
  [10246, 'cust-008', '2026-06-03', 'Delivered', 'PayPal', 'Website', 'prd-02:1,prd-03:1'],
  [10247, 'cust-004', '2026-06-08', 'Delivered', 'Cash on Delivery', 'Marketplace', 'prd-08:4,prd-16:5'],
  [10248, 'cust-003', '2026-06-14', 'Delivered', 'Bank Transfer', 'Sales Rep', 'prd-06:2,prd-11:1', 'B2B5'],
  [10249, 'cust-005', '2026-06-19', 'Delivered', 'Card', 'Website', 'prd-05:1,prd-14:2'],
  [10250, 'cust-009', '2026-06-26', 'Cancelled', 'Cash on Delivery', 'Website', 'prd-12:1'],
  [10251, 'cust-001', '2026-07-02', 'Delivered', 'Bank Transfer', 'Sales Rep', 'prd-04:1,prd-05:4', 'B2B5'],
  [10252, 'cust-007', '2026-07-07', 'Delivered', 'Card', 'Website', 'prd-01:1,prd-13:2'],
  [10253, 'cust-012', '2026-07-12', 'Delivered', 'Easypaisa', 'Mobile App', 'prd-16:2'],
  [10254, 'cust-008', '2026-07-18', 'Delivered', 'PayPal', 'Website', 'prd-03:1,prd-07:2'],
  [10255, 'cust-002', '2026-07-24', 'Delivered', 'Card', 'Marketplace', 'prd-08:6,prd-09:2', 'MONSOON15'],
  [10256, 'cust-003', '2026-07-30', 'Delivered', 'Bank Transfer', 'Sales Rep', 'prd-10:2,prd-11:1'],
  [10257, 'cust-004', '2026-08-04', 'Delivered', 'Cash on Delivery', 'Marketplace', 'prd-15:3,prd-16:4'],
  [10258, 'cust-009', '2026-08-10', 'Delivered', 'JazzCash', 'Website', 'prd-12:1,prd-08:2'],
  [10259, 'cust-001', '2026-08-15', 'Refunded', 'Bank Transfer', 'Sales Rep', 'prd-06:1'],
  [10260, 'cust-007', '2026-08-21', 'Delivered', 'Card', 'Website', 'prd-02:1,prd-04:1', 'MONSOON15'],
  [10261, 'cust-005', '2026-08-27', 'Delivered', 'PayPal', 'Website', 'prd-06:1'],
  [10262, 'cust-008', '2026-09-02', 'Delivered', 'PayPal', 'Website', 'prd-05:2,prd-13:2'],
  [10263, 'cust-003', '2026-09-07', 'Delivered', 'Bank Transfer', 'Sales Rep', 'prd-01:2,prd-05:5', 'B2B5'],
  [10264, 'cust-012', '2026-09-12', 'Delivered', 'JazzCash', 'Mobile App', 'prd-14:2'],
  [10265, 'cust-002', '2026-09-17', 'Delivered', 'Card', 'Website', 'prd-10:1,prd-09:1'],
  [10266, 'cust-008', '2026-09-22', 'Cancelled', 'Card', 'Website', 'prd-07:1'],
  [10267, 'cust-007', '2026-09-28', 'Delivered', 'Card', 'Website', 'prd-03:2,prd-16:6', 'QUALITY20'],
  [10268, 'cust-001', '2026-10-02', 'Shipped', 'Bank Transfer', 'Sales Rep', 'prd-11:1,prd-12:1'],
  [10269, 'cust-005', '2026-10-04', 'Delivered', 'Card', 'Website', 'prd-05:1'],
  [10270, 'cust-012', '2026-10-05', 'Delivered', 'Easypaisa', 'Mobile App', 'prd-13:1,prd-16:1'],
  [10271, 'cust-003', '2026-10-08', 'Shipped', 'Bank Transfer', 'Sales Rep', 'prd-06:2'],
  [10272, 'cust-009', '2026-10-10', 'Shipped', 'JazzCash', 'Website', 'prd-08:3,prd-10:1', 'QUALITY20'],
  [10273, 'cust-007', '2026-10-12', 'Paid', 'PayPal', 'Website', 'prd-01:1,prd-02:1,prd-03:1', 'QUALITY20'],
  [10274, 'cust-004', '2026-10-14', 'Paid', 'Card', 'Marketplace', 'prd-09:2,prd-14:3'],
  [10275, 'cust-002', '2026-10-15', 'Pending', 'Bank Transfer', 'Sales Rep', 'prd-11:2'],
  [10276, 'cust-008', '2026-10-16', 'Paid', 'PayPal', 'Website', 'prd-04:1,prd-05:2'],
  [10277, 'cust-001', '2026-10-17', 'Pending', 'Cash on Delivery', 'Website', 'prd-16:10,prd-15:2'],
  [10278, 'cust-012', '2026-10-18', 'Pending', 'JazzCash', 'Mobile App', 'prd-14:1,prd-13:1'],
  [10279, 'cust-005', '2026-10-19', 'Pending', 'Card', 'Website', 'prd-05:1,prd-13:1'],
];

const productById = Object.fromEntries(initialProducts.map(p => [p.id, p]));
const customerById = Object.fromEntries(initialCustomers.map(c => [c.id, c]));
const couponByCode = Object.fromEntries(initialCoupons.map(c => [c.code, c]));
const addDays = (iso, n) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const FLOW = ['Pending', 'Paid', 'Shipped', 'Delivered'];

function historyFor(status, date) {
  const at = (n) => `${addDays(date, n)}T10:00:00.000Z`;
  if (status === 'Cancelled') return [{ status: 'Pending', at: at(0) }, { status: 'Cancelled', at: at(1) }];
  if (status === 'Refunded') return [...FLOW.map((s, i) => ({ status: s, at: at(i * 2) })), { status: 'Refunded', at: at(9) }];
  return FLOW.slice(0, FLOW.indexOf(status) + 1).map((s, i) => ({ status: s, at: at(i * 2) }));
}

export const initialOrders = demo(ORDER_SPEC.map(([num, custId, date, status, method, channel, itemSpec, code]) => {
  const customer = customerById[custId];
  const items = itemSpec.split(',').map(part => {
    const [pid, qty] = part.split(':');
    const p = productById[pid];
    return { productId: p.id, name: p.name, sku: p.sku, productType: p.productType, qty: Number(qty), price: p.price, cost: p.cost };
  });
  const totals = orderTotals(items, code ? couponByCode[code] : null);
  return {
    id: `ord-${num}`,
    number: `ORD-${num}`,
    customerId: custId,
    customerName: customer.name,
    email: customer.email,
    city: customer.city,
    date,
    status,
    paymentStatus: paymentStatusFor(status),
    paymentMethod: method,
    channel,
    couponCode: code || '',
    items,
    ...totals,
    notes: '',
    history: historyFor(status, date),
  };
}));

// ── Payments (one per paid order, plus a pending transfer and a failed card) ─
const orderByNum = Object.fromEntries(initialOrders.map(o => [o.number, o]));
export const initialPayments = demo([
  ...initialOrders
    .filter(o => ['Paid', 'Shipped', 'Delivered', 'Refunded'].includes(o.status))
    .map((o, i) => ({
      id: `pay-${o.number.slice(4)}`,
      reference: `PAY-${String(52010 + i)}`,
      orderNumber: o.number,
      invoiceNumber: '',
      customerName: o.customerName,
      method: o.paymentMethod,
      amount: o.total,
      date: o.paymentMethod === 'Bank Transfer' ? addDays(o.date, 1) : o.date,
      status: o.status === 'Refunded' ? 'Refunded' : 'Received',
      note: o.status === 'Refunded' ? 'Refunded in full to the original payment method.' : '',
    })),
  { id: 'pay-10275', reference: 'PAY-52090', orderNumber: 'ORD-10275', invoiceNumber: 'INV-2026-0108', customerName: orderByNum['ORD-10275'].customerName, method: 'Bank Transfer', amount: orderByNum['ORD-10275'].total, date: '2026-10-16', status: 'Pending', note: 'Awaiting bank confirmation (Meezan Bank IBFT).' },
  { id: 'pay-10279', reference: 'PAY-52091', orderNumber: 'ORD-10279', invoiceNumber: '', customerName: orderByNum['ORD-10279'].customerName, method: 'Card', amount: orderByNum['ORD-10279'].total, date: '2026-10-19', status: 'Failed', note: 'Card declined by issuer (insufficient funds).' },
  { id: 'pay-inv-0105', reference: 'PAY-52092', orderNumber: '', invoiceNumber: 'INV-2026-0105', customerName: 'Hamza Iqbal', method: 'Bank Transfer', amount: 100000, date: '2026-09-20', status: 'Received', note: 'Part payment against supplier audit invoice.' },
]);

// ── Customer invoices (B2B orders and consultancy services) ─────────────────
const invoiceFromOrder = (num, invNo, extra = {}) => {
  const o = orderByNum[`ORD-${num}`];
  const paid = ['Paid', 'Shipped', 'Delivered'].includes(o.status);
  return {
    id: `inv-${invNo}`,
    number: `INV-2026-${invNo}`,
    customerId: o.customerId,
    customerName: o.customerName,
    orderNumber: o.number,
    description: o.items.map(i => `${i.name} × ${i.qty}`).join('; '),
    issueDate: o.date,
    dueDate: addDays(o.date, 30),
    amount: o.total,
    amountPaid: paid ? o.total : 0,
    status: o.status === 'Refunded' ? 'Void' : paid ? 'Paid' : 'Sent',
    ...extra,
  };
};

export const initialInvoices = demo([
  invoiceFromOrder(10242, '0091'),
  invoiceFromOrder(10248, '0094'),
  invoiceFromOrder(10251, '0096'),
  invoiceFromOrder(10256, '0098'),
  invoiceFromOrder(10259, '0100'),
  invoiceFromOrder(10263, '0102'),
  { id: 'inv-0103', number: 'INV-2026-0103', customerId: 'cust-008', customerName: 'Faisal Raza', orderNumber: '', description: 'On-site ISO 14001 gap assessment (3 days)', issueDate: '2026-08-20', dueDate: '2026-09-19', amount: 380000, amountPaid: 0, status: 'Sent' },
  invoiceFromOrder(10268, '0104'),
  { id: 'inv-0105', number: 'INV-2026-0105', customerId: 'cust-010', customerName: 'Hamza Iqbal', orderNumber: '', description: 'Second-party supplier audit, 2 days incl. report', issueDate: '2026-09-01', dueDate: '2026-10-01', amount: 220000, amountPaid: 100000, status: 'Partially Paid' },
  invoiceFromOrder(10271, '0106'),
  { id: 'inv-0107', number: 'INV-2026-0107', customerId: 'cust-006', customerName: 'Kamran Shah', orderNumber: '', description: 'Fleet QA consultancy retainer — October', issueDate: '2026-10-05', dueDate: '2026-11-04', amount: 150000, amountPaid: 0, status: 'Sent' },
  invoiceFromOrder(10275, '0108'),
  { id: 'inv-0109', number: 'INV-2026-0109', customerId: 'cust-011', customerName: 'Nadia Hussain', orderNumber: '', description: 'ISO 13485 readiness workshop (2 days, remote)', issueDate: '2026-10-15', dueDate: '2026-11-14', amount: 275000, amountPaid: 0, status: 'Draft' },
]);

// ── Reviews ─────────────────────────────────────────────────────────────────
const review = (id, pid, customerName, rating, title, body, date, status, reply = '') => ({
  id, productId: pid, productName: productById[pid].name, customerName, rating, title, body, date, status, verified: 'Yes', reply, repliedAt: reply ? `${addDays(date, 1)}T09:30:00.000Z` : '',
});
export const initialReviews = demo([
  review('rev-01', 'prd-01', 'Sara Malik', 5, 'Saved us weeks of writing', 'Procedures were easy to adapt to our GMP site. Passed our stage 1 audit first time.', '2026-05-20', 'Approved', 'Thank you Sara — congratulations on the stage 1 result!'),
  review('rev-02', 'prd-13', 'Sara Malik', 4, 'Genuine printed copy', 'Arrived well packed. Delivery took 4 days to Islamabad.', '2026-05-22', 'Approved'),
  review('rev-03', 'prd-05', 'Mariam Qureshi', 5, 'Excellent trainer', 'Our three supervisors loved the case studies. Booking more seats next quarter.', '2026-06-02', 'Approved'),
  review('rev-04', 'prd-09', 'Bilal Ahmed', 2, 'Ratchet stuck on one unit', 'One of the two micrometers had a stiff ratchet. Returned for refund, support was quick.', '2026-06-08', 'Approved', 'Sorry about that, Bilal — we have raised it with the supplier and checked the remaining batch.'),
  review('rev-05', 'prd-08', 'Usman Tariq', 4, 'Good value caliper', 'Accurate against our gauge blocks. Battery cover feels a bit loose.', '2026-06-18', 'Approved'),
  review('rev-06', 'prd-11', 'Sara Malik', 5, 'Certificate included', 'Traceable certificate was in the case. Our ISO 17025 assessor was happy.', '2026-07-10', 'Approved'),
  review('rev-07', 'prd-16', 'Omar Farooq', 3, 'Does the job', 'Pads are fine but I would like a bilingual (Urdu/English) version.', '2026-07-20', 'Approved'),
  review('rev-08', 'prd-07', 'Faisal Raza', 5, 'Great project coaching', 'The coach helped us close a scrap-reduction project worth USD 40k.', '2026-08-05', 'Approved'),
  review('rev-09', 'prd-15', 'Usman Tariq', 1, 'Tape peeling after a week', 'Does not hold on our epoxy floor near the dyeing section.', '2026-08-19', 'Hidden'),
  review('rev-10', 'prd-12', 'Zainab Ali', 4, 'Solid calibrator', 'Works well, wish it came with a carry case.', '2026-08-25', 'Approved'),
  review('rev-11', 'prd-06', 'Ayesha Noor', 5, 'Passed the CQI exam', 'Well structured course, mock exams were very close to the real one.', '2026-09-15', 'Approved'),
  review('rev-12', 'prd-03', 'Mariam Qureshi', 4, 'Comprehensive', 'Risk assessment templates are thorough. Would like a few more examples for retail.', '2026-10-06', 'Pending'),
  review('rev-13', 'prd-14', 'Omar Farooq', 5, 'Always in my bag', 'Best pocket reference for kaizen events.', '2026-10-08', 'Pending'),
  review('rev-14', 'prd-10', 'Zainab Ali', 3, 'Probe needs frequent calibration', 'Drifts after a few days of heavy use. Otherwise fine.', '2026-10-16', 'Pending'),
]);

// ── Abandoned carts ─────────────────────────────────────────────────────────
const cart = (id, custId, createdAt, stage, status, reminderSent, itemSpec, recoveredOrder = '') => {
  const c = customerById[custId];
  const items = itemSpec.split(',').map(part => {
    const [pid, qty] = part.split(':');
    const p = productById[pid];
    return { productId: p.id, name: p.name, qty: Number(qty), price: p.price };
  });
  return {
    id, customerId: custId, customerName: c.name, email: c.email, createdAt, stage, status, reminderSent, recoveredOrder, items,
    itemCount: items.reduce((s, i) => s + i.qty, 0),
    value: items.reduce((s, i) => s + i.qty * i.price, 0),
  };
};
export const initialCarts = demo([
  cart('cart-01', 'cust-002', '2026-06-11', 'Checkout – Payment', 'Recovered', 'Yes', 'prd-08:6,prd-09:2', 'ORD-10255'),
  cart('cart-02', 'cust-010', '2026-06-20', 'Cart', 'Expired', 'No', 'prd-15:2'),
  cart('cart-03', 'cust-006', '2026-07-03', 'Checkout – Details', 'Expired', 'Yes', 'prd-05:4'),
  cart('cart-04', 'cust-011', '2026-07-26', 'Cart', 'Expired', 'No', 'prd-02:1'),
  cart('cart-05', 'cust-007', '2026-08-14', 'Checkout – Payment', 'Recovered', 'Yes', 'prd-02:1,prd-04:1', 'ORD-10260'),
  cart('cart-06', 'cust-012', '2026-08-29', 'Cart', 'Expired', 'No', 'prd-06:1'),
  cart('cart-07', 'cust-009', '2026-09-09', 'Checkout – Details', 'Recovered', 'Yes', 'prd-08:3,prd-10:1', 'ORD-10272'),
  cart('cart-08', 'cust-004', '2026-09-24', 'Checkout – Payment', 'Abandoned', 'Yes', 'prd-11:1'),
  cart('cart-09', 'cust-006', '2026-10-06', 'Checkout – Details', 'Abandoned', 'No', 'prd-01:1,prd-03:1'),
  cart('cart-10', 'cust-011', '2026-10-11', 'Checkout – Payment', 'Abandoned', 'No', 'prd-06:2,prd-05:2'),
  cart('cart-11', 'cust-010', '2026-10-14', 'Cart', 'Abandoned', 'No', 'prd-16:5,prd-08:2'),
  cart('cart-12', 'cust-005', '2026-10-18', 'Cart', 'Abandoned', 'No', 'prd-07:1'),
]);

// ── Saved BI KPIs ───────────────────────────────────────────────────────────
export const kpiAggregations = ['count', 'sum', 'avg', 'min', 'max', 'distinct'];
export const kpiFormats = ['number', 'currency', 'percent', 'decimal'];
export const initialKpis = demo([
  { id: 'kpi-01', name: 'Delivered revenue', entity: 'storeOrders', aggregation: 'sum', field: 'total', filterField: 'status', filterOp: 'equals', filterValue: 'Delivered', format: 'currency', target: 3000000, tone: 'primary', createdAt: '2026-10-01T09:00:00.000Z' },
  { id: 'kpi-02', name: 'Orders awaiting payment', entity: 'storeOrders', aggregation: 'count', field: '', filterField: 'status', filterOp: 'equals', filterValue: 'Pending', format: 'number', target: 0, tone: 'warning', createdAt: '2026-10-01T09:05:00.000Z' },
  { id: 'kpi-03', name: 'Average approved rating', entity: 'productReviews', aggregation: 'avg', field: 'rating', filterField: 'status', filterOp: 'equals', filterValue: 'Approved', format: 'decimal', target: 4.5, tone: 'accent', createdAt: '2026-10-02T11:20:00.000Z' },
  { id: 'kpi-04', name: 'Active customers', entity: 'customers', aggregation: 'count', field: '', filterField: 'status', filterOp: 'equals', filterValue: 'Active', format: 'number', target: 12, tone: 'success', createdAt: '2026-10-03T08:45:00.000Z' },
]);
