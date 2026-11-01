/**
 * Demo data for Purchase Orders, social lead capture (Facebook / LinkedIn)
 * and the Call Center. Frontend only — stored in localStorage.
 */
import { addDays, format, subMinutes } from 'date-fns';

const now = new Date();
const day = (offset) => format(addDays(now, offset), 'yyyy-MM-dd');

// ── Purchase orders ─────────────────────────────────────────────────────
export const PO_STATUSES = ['Draft', 'Pending Approval', 'Approved', 'Sent', 'Received', 'Cancelled'];

const line = (description, qty, unitPrice, taxRate = 17) => ({ id: `${description}-${qty}`.replace(/\W+/g, '-').toLowerCase(), description, qty, unitPrice, taxRate });

const po = (n, supplier, contact, orderOffset, deliveryOffset, status, items, extra = {}) => ({
  id: `po-${n}`,
  poNumber: `PO-2026-${n}`,
  supplier,
  supplierContact: contact,
  orderDate: day(orderOffset),
  expectedDate: day(deliveryOffset),
  status,
  items,
  shipping: extra.shipping ?? 0,
  notes: extra.notes || '',
  terms: extra.terms || 'Payment within 30 days of delivery. Goods must include calibration certificates where applicable.',
  requestedBy: extra.requestedBy || 'Sarah Ahmed',
});

export const initialPurchaseOrders = [
  po('0148', 'Fluke Instruments Pakistan', 'Rizwan Ahmed', -2, 12, 'Pending Approval', [
    line('Fluke 754 documenting process calibrator', 2, 485000),
    line('Pressure module 700G30', 4, 96000),
  ], { shipping: 8500, notes: 'Needed for Lucky Cement calibration contract.' }),
  po('0147', 'QualityDocs Software', 'Mehreen Shah', -4, 3, 'Approved', [
    line('QMS document control licence (annual, 25 users)', 1, 620000),
    line('Onboarding & data migration', 1, 150000),
  ]),
  po('0146', 'Office Hub Karachi', 'Faraz Ali', -6, -1, 'Received', [
    line('Audit field kits (tablet + case)', 6, 72000),
    line('Label printers', 2, 38500),
  ], { shipping: 4000 }),
  po('0145', 'SafetyFirst Supplies', 'Nadia Hussain', -8, 2, 'Sent', [
    line('PPE kits for site audits', 20, 6800),
    line('Gas detectors (4-gas)', 3, 112000),
  ], { shipping: 6500 }),
  po('0144', 'PrintPro Lahore', 'Bilal Chaudhry', -10, -5, 'Received', [
    line('Training manuals — ISO 45001 (printed)', 150, 950, 0),
    line('Certificates on premium stock', 300, 180, 0),
  ]),
  po('0143', 'TechLab Equipment', 'Dr. Asim Javed', -1, 20, 'Draft', [
    line('Digital torque analyser', 1, 1250000),
  ], { notes: 'Awaiting second quotation before submitting.' }),
  po('0142', 'Hotel Pearl Continental', 'Events Desk', -15, -12, 'Cancelled', [
    line('Conference hall — Six Sigma bootcamp (2 days)', 2, 185000),
  ], { notes: 'Moved bootcamp to client premises.' }),
];

export const poTotals = (order) => {
  const subtotal = order.items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0);
  const tax = order.items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0) * ((Number(i.taxRate) || 0) / 100), 0);
  const shipping = Number(order.shipping) || 0;
  return { subtotal, tax, shipping, total: subtotal + tax + shipping };
};

// ── Social lead capture ─────────────────────────────────────────────────
export const LEAD_PLATFORMS = {
  Facebook: { color: '#1877F2', forms: ['ISO 9001 Free Consultation', 'Six Sigma Training Enquiry'], page: 'Meridian Quality Management' },
  LinkedIn: { color: '#0A66C2', forms: ['Lead Auditor Course Sign-up', 'Corporate QMS Assessment'], page: 'Meridian QMP (Company Page)' },
};

const cl = (id, platform, form, name, company, title, minutesAgo, status = 'New') => ({
  id: `cl-${id}`,
  platform,
  form,
  name,
  company,
  jobTitle: title,
  email: `${name.split(' ')[0].toLowerCase()}@${company.split(' ')[0].toLowerCase()}.com`,
  phone: `+92 3${(Number(id) * 7) % 5}${Number(id) % 10} ${String(1000000 + Number(id) * 7919).slice(0, 7)}`,
  capturedAt: subMinutes(now, minutesAgo).toISOString(),
  status,
});

export const initialCapturedLeads = [
  cl('01', 'Facebook', 'ISO 9001 Free Consultation', 'Usman Ghani', 'Karachi Bottlers', 'Plant Manager', 6),
  cl('02', 'LinkedIn', 'Corporate QMS Assessment', 'Mehreen Akhtar', 'Systems Pharma', 'QA Director', 24),
  cl('03', 'LinkedIn', 'Lead Auditor Course Sign-up', 'Asad Rafiq', 'Engro Fertilizers', 'HSE Lead', 52),
  cl('04', 'Facebook', 'Six Sigma Training Enquiry', 'Hina Pervaiz', 'Gul Ahmed Textiles', 'Process Engineer', 95),
  cl('05', 'Facebook', 'ISO 9001 Free Consultation', 'Kamran Yousuf', 'Prime Packaging', 'CEO', 160, 'Added to CRM'),
  cl('06', 'LinkedIn', 'Corporate QMS Assessment', 'Sobia Nadeem', 'Lucky Motors', 'Quality Head', 240, 'Added to CRM'),
  cl('07', 'Facebook', 'Six Sigma Training Enquiry', 'Zeeshan Ali', 'Shan Foods', 'Production Lead', 380),
  cl('08', 'LinkedIn', 'Lead Auditor Course Sign-up', 'Areeba Khan', 'Getz Pharma', 'Compliance Officer', 610, 'Discarded'),
  cl('09', 'Facebook', 'ISO 9001 Free Consultation', 'Naveed Iqbal', 'Pak Elektron', 'Operations Manager', 1300, 'Added to CRM'),
  cl('10', 'LinkedIn', 'Corporate QMS Assessment', 'Laiba Sohail', 'Interloop', 'Continuous Improvement Lead', 2100),
];

/** Pool used to simulate new leads arriving when "Sync now" is clicked. */
export const SIMULATED_LEADS = [
  ['Faisal Rana', 'Nishat Mills', 'GM Quality'], ['Amna Siddiq', 'Hilton Pharma', 'QA Manager'], ['Junaid Malik', 'Atlas Honda', 'Supplier Quality Engineer'],
  ['Sara Qadir', 'Unilever Pakistan', 'Regulatory Lead'], ['Taimoor Shah', 'K-Electric', 'HSE Manager'], ['Rabia Aziz', 'Dawood Hercules', 'Process Excellence Lead'],
  ['Hassan Mirza', 'Millat Tractors', 'Plant Head'], ['Noor Ul Ain', 'Searle', 'Training Coordinator'],
];

// ── Call center ─────────────────────────────────────────────────────────
const call = (id, name, number, direction, minutesAgo, seconds, disposition, notes = '') => ({
  id: `call-${id}`, name, number, direction, at: subMinutes(now, minutesAgo).toISOString(), seconds, disposition, notes, agent: 'Admin User',
});

export const initialCallLog = [
  call('01', 'Hamza Qureshi', '+92 300 4455123', 'Outgoing', 18, 312, 'Interested', 'Wants proposal by Friday'),
  call('02', '', '+92 333 7812094', 'Incoming', 47, 95, 'Follow-up needed', 'Asked about ISO 14001 pricing'),
  call('03', 'Ayesha Siddiqui', '+92 321 6620981', 'Missed', 80, 0, 'No answer'),
  call('04', 'Fatima Raza', '+92 345 1209876', 'Outgoing', 140, 488, 'Meeting booked', 'On-site visit Tuesday 11 AM'),
  call('05', 'Omar Farooq', '+92 301 9988776', 'Incoming', 230, 204, 'Interested'),
  call('06', '', '+92 42 35761234', 'Outgoing', 400, 61, 'Wrong number'),
  call('07', 'Imran Sheikh', '+92 300 5566778', 'Outgoing', 1500, 0, 'No answer'),
  call('08', 'Sana Javed', '+92 322 4433221', 'Incoming', 1700, 655, 'Meeting booked', 'Training slots confirmed'),
];

export const CALL_DISPOSITIONS = ['Interested', 'Meeting booked', 'Follow-up needed', 'Not interested', 'No answer', 'Wrong number'];

