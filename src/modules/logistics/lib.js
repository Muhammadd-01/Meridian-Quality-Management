/**
 * Shared constants and pure helpers for the logistics, real estate and travel
 * pages. No React and no registry imports, so data.js can use it too.
 */
import { addDays, differenceInCalendarDays, format, parseISO, isValid } from 'date-fns';

// ── Dates ──
export const isoDay = (date) => format(date, 'yyyy-MM-dd');
export const today = () => isoDay(new Date());
/** Local yyyy-MM-dd for "today + n days". */
export const dayOffset = (n) => isoDay(addDays(new Date(), n));
export const parseDay = (v) => {
  if (!v) return null;
  const d = parseISO(String(v).slice(0, 10));
  return isValid(d) ? d : null;
};
/** Calendar days from a to b (b - a); null when either is missing. */
export const daysBetween = (a, b) => {
  const da = parseDay(a);
  const db = parseDay(b);
  return da && db ? differenceInCalendarDays(db, da) : null;
};
export const daysFromToday = (v) => daysBetween(today(), v);
export const monthKey = (v) => String(v || '').slice(0, 7);
/** Last n months as { key: 'yyyy-MM', label: 'Mon' }, oldest first. */
export function lastMonths(n = 6) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return { key: format(d, 'yyyy-MM'), label: format(d, 'MMM') };
  });
}
/** Last n days as { key: 'yyyy-MM-dd', label: 'dd MMM' }, oldest first. */
export function lastDays(n = 14) {
  return Array.from({ length: n }, (_, i) => {
    const d = addDays(new Date(), i - (n - 1));
    return { key: isoDay(d), label: format(d, 'dd MMM') };
  });
}

// ── Numbers ──
export const num = (v) => Number(v) || 0;
export const sumBy = (list, fn) => list.reduce((s, r) => s + num(typeof fn === 'function' ? fn(r) : r[fn]), 0);
export const pct = (n, d, digits = 0) => (d ? `${((n / d) * 100).toFixed(digits)}%` : '—');
export const pctNum = (n, d) => (d ? Math.round((n / d) * 100) : 0);
/** Compact PKR: PKR 1.2M, PKR 84.5K. */
export function pkrShort(v) {
  const n = num(v);
  const abs = Math.abs(n);
  if (abs >= 1e9) return `PKR ${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `PKR ${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `PKR ${(n / 1e3).toFixed(1)}K`;
  return `PKR ${n.toLocaleString()}`;
}
export function groupCount(list, key) {
  const out = {};
  list.forEach(r => { const k = (typeof key === 'function' ? key(r) : r[key]) || 'Other'; out[k] = (out[k] || 0) + 1; });
  return out;
}
export function groupSum(list, key, valueFn) {
  const out = {};
  list.forEach(r => { const k = (typeof key === 'function' ? key(r) : r[key]) || 'Other'; out[k] = (out[k] || 0) + num(valueFn(r)); });
  return out;
}
export const initials = (name = '') => String(name).split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '—';
export const nextNumber = (records, field, prefix, pad = 3) => {
  const max = records.reduce((m, r) => {
    const n = parseInt(String(r[field] || '').replace(/\D+/g, '').slice(-pad - 2), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `${prefix}${String(max + 1).padStart(pad, '0')}`;
};

// ── Logistics ──
export const WAREHOUSES = [
  { name: 'Karachi DC', city: 'Karachi', code: 'KHI', capacity: 5000 },
  { name: 'Lahore DC', city: 'Lahore', code: 'LHE', capacity: 10000 },
  { name: 'Islamabad Hub', city: 'Islamabad', code: 'ISB', capacity: 6000 },
  { name: 'Faisalabad Hub', city: 'Faisalabad', code: 'LYP', capacity: 2500 },
  { name: 'Dubai JAFZA', city: 'Dubai', code: 'DXB', capacity: 5000 },
];
export const WAREHOUSE_NAMES = WAREHOUSES.map(w => w.name);
export const INVENTORY_CATEGORIES = ['Food & Grocery', 'Textiles', 'Electrical', 'Solar & Energy', 'Building Materials', 'Automotive', 'Medical', 'Sports Goods'];
export const STOCK_STATUSES = ['In Stock', 'Low Stock', 'Out of Stock'];
export const available = (i) => Math.max(0, num(i.quantity) - num(i.reserved));
export function stockStatus(i) {
  if (num(i.quantity) <= 0) return 'Out of Stock';
  if (num(i.quantity) <= num(i.reorderLevel)) return 'Low Stock';
  return 'In Stock';
}
export const stockValue = (i) => num(i.quantity) * num(i.unitCost);

export const TRANSFER_STATUSES = ['Requested', 'In Transit', 'Completed', 'Cancelled'];
export const PO_STATUSES = ['Draft', 'Pending Approval', 'Approved', 'Received', 'Cancelled'];
export const PO_TAX_RATE = 18; // GST %
export const poSubtotal = (po) => sumBy(po.items || [], it => num(it.qty) * num(it.unitCost));
export const poTotal = (po) => Math.round(poSubtotal(po) * (1 + num(po.taxPercent ?? PO_TAX_RATE) / 100));
export const poUnits = (po) => sumBy(po.items || [], 'qty');
/** Received on or before the expected date. */
export const poOnTime = (po) => po.status === 'Received' && po.receivedDate && po.expectedDate && po.receivedDate <= po.expectedDate;

export const SUPPLIER_STATUSES = ['Active', 'On Hold', 'Inactive'];
export const PAYMENT_TERMS = ['Advance', 'Net 15', 'Net 30', 'Net 45', 'Net 60'];

export const VEHICLE_TYPES = ['Truck', 'Reefer Truck', 'Container Trailer', 'Van', 'Pickup'];
export const VEHICLE_STATUSES = ['On Route', 'Loading', 'Idle', 'Maintenance', 'Out of Service'];
export const FUEL_TYPES = ['Diesel', 'Petrol', 'CNG', 'Electric'];

export const SHIPMENT_FLOW = ['Booked', 'Picked Up', 'In Transit', 'Customs', 'Out for Delivery', 'Delivered'];
export const SHIPMENT_STATUSES = [...SHIPMENT_FLOW, 'Delayed', 'Exception', 'Returned', 'Cancelled'];
export const SHIPMENT_MODES = ['Ground', 'Air', 'Ocean'];
export const CARRIERS = ['Own Fleet', 'TCS', 'Leopards Courier', 'M&P Logistics', 'DHL Express', 'FedEx', 'Maersk Line', 'PIA Cargo'];
export const PRIORITIES = ['P1', 'P2', 'P3'];
export const shipmentOpen = (s) => !['Delivered', 'Cancelled', 'Returned'].includes(s.status);
export const shipmentLate = (s) => (s.status === 'Delivered'
  ? !!(s.deliveredAt && s.eta && s.deliveredAt.slice(0, 10) > s.eta)
  : shipmentOpen(s) && !!s.eta && s.eta < today());

// ── Real estate ──
export const PROPERTY_TYPES = ['Apartment', 'House', 'Villa', 'Townhouse', 'Commercial', 'Plot'];
export const OCCUPANCY = ['Owner Occupied', 'Rented', 'Vacant', 'Under Construction'];
export const LISTING_PURPOSES = ['Sale', 'Rent'];
export const LISTING_STATUSES = ['Active', 'Under Offer', 'Sold', 'Rented', 'Draft', 'Expired'];
export const AGENT_STATUSES = ['Active', 'On Leave', 'Inactive'];
export const AGENT_SPECIALIZATIONS = ['Residential', 'Commercial', 'Rentals', 'Luxury'];
export const LEAD_STAGES = ['Enquiry', 'Viewing', 'Offer', 'Negotiation', 'Closed', 'Lost'];
export const LEAD_SOURCES = ['Website', 'Property portal', 'Referral', 'Walk-in', 'Social media', 'Phone'];
export const listingClosed = (l) => l.status === 'Sold' || l.status === 'Rented';
/** Commission on a closed listing: sale = rate × price; rent = one month's rent. */
export const listingCommission = (l, rate) => (l.purpose === 'Rent' ? num(l.price) : Math.round(num(l.price) * num(rate) / 100));

// ── Travel ──
export const AIRPORTS = {
  KHI: 'Karachi', LHE: 'Lahore', ISB: 'Islamabad', PEW: 'Peshawar', MUX: 'Multan', SKT: 'Sialkot', UET: 'Quetta',
  DXB: 'Dubai', AUH: 'Abu Dhabi', DOH: 'Doha', JED: 'Jeddah', MED: 'Madinah', RUH: 'Riyadh', IST: 'Istanbul',
  LHR: 'London', MAN: 'Manchester', KUL: 'Kuala Lumpur', BKK: 'Bangkok', JFK: 'New York', YYZ: 'Toronto', GYD: 'Baku', MLE: 'Malé',
};
export const AIRLINES = ['PIA', 'Airblue', 'SereneAir', 'AirSial', 'Emirates', 'Qatar Airways', 'Etihad', 'Turkish Airlines', 'Saudia', 'flydubai'];
export const CABINS = ['Economy', 'Premium Economy', 'Business', 'First'];
export const BOOKING_STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
export const CAB_TYPES = ['Mini', 'Sedan', 'SUV', 'Van', 'Luxury'];
export const CRUISE_CABINS = ['Interior', 'Ocean View', 'Balcony', 'Suite'];
export const TRIP_TYPES = ['Religious', 'Adventure', 'Family', 'Honeymoon', 'Corporate', 'Leisure'];
export const TRIP_STATUSES = ['Planned', 'Confirmed', 'Ongoing', 'Completed', 'Cancelled'];
export const tripNights = (t) => Math.max(0, daysBetween(t.startDate, t.endDate) ?? 0);
export const tripTotal = (t) => num(t.pricePerPerson) * Math.max(1, num(t.travellers));
export const flightTotal = (f) => num(f.fare) * Math.max(1, num(f.passengers));
export const cruiseTotal = (c) => num(c.fare) * Math.max(1, num(c.guests));

// ── Status tones (used by StatusPill) ──
export const STATUS_TONES = {
  // stock / generic
  'In Stock': 'success', 'Low Stock': 'warning', 'Out of Stock': 'danger',
  Active: 'success', 'On Hold': 'warning', Inactive: 'gray', 'On Leave': 'warning',
  // workflow
  Draft: 'gray', 'Pending Approval': 'warning', Approved: 'info', Received: 'success',
  Requested: 'warning', 'In Transit': 'info', Completed: 'success', Cancelled: 'danger',
  // shipments
  Booked: 'gray', 'Picked Up': 'primary', Customs: 'accent', 'Out for Delivery': 'primary', Delivered: 'success',
  Delayed: 'warning', Exception: 'danger', Returned: 'danger',
  // fleet
  'On Route': 'info', Loading: 'primary', Idle: 'gray', Maintenance: 'warning', 'Out of Service': 'danger',
  // real estate
  'Under Offer': 'accent', Sold: 'success', Rented: 'info', Expired: 'danger',
  'Owner Occupied': 'primary', Vacant: 'warning', 'Under Construction': 'gray',
  Enquiry: 'gray', Viewing: 'info', Offer: 'accent', Negotiation: 'warning', Closed: 'success', Lost: 'danger',
  // travel
  Pending: 'warning', Confirmed: 'primary', Planned: 'gray', Ongoing: 'info',
  P1: 'danger', P2: 'warning', P3: 'gray',
};
