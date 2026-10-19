/**
 * Demo seed data for the logistics, real estate and travel collections.
 * Every record is flagged `isDemo: true`. Dates are relative to the day the
 * collections are first seeded, so the demo always looks current.
 * Must not import src/data/entities.js (circular import).
 */
import { dayOffset, PO_TAX_RATE } from './lib';

const at = (offset, time = '09:00') => `${dayOffset(offset)}T${time}:00`;
const created = (offset) => at(offset, '10:00');

// ── Inventory ──
// [sku, name, category, warehouse, quantity, reserved, reorderLevel, unitCost, supplier, bin, restockedDaysAgo]
const INVENTORY_ROWS = [
  ['SKU-10021', 'Super Kernel Basmati Rice 25kg', 'Food & Grocery', 'Karachi DC', 1240, 180, 300, 7800, 'Mehran Foods', 'A-01-03', 6],
  ['SKU-10021', 'Super Kernel Basmati Rice 25kg', 'Food & Grocery', 'Lahore DC', 420, 60, 250, 7800, 'Mehran Foods', 'B-02-01', 11],
  ['SKU-10088', 'Banaspati Ghee Tin 16L', 'Food & Grocery', 'Lahore DC', 96, 20, 120, 9200, 'Indus Agro Traders', 'B-01-07', 20],
  ['SKU-10140', 'Chaunsa Mango Crate 10kg (reefer)', 'Food & Grocery', 'Karachi DC', 320, 220, 150, 4200, 'Mehran Foods', 'COLD-1', 1],
  ['SKU-20114', 'Combed Cotton Yarn 30s (bag)', 'Textiles', 'Faisalabad Hub', 860, 140, 200, 41500, 'Ravi Textiles', 'F-03-02', 4],
  ['SKU-20131', 'Indigo Denim Fabric Roll 100m', 'Textiles', 'Faisalabad Hub', 0, 0, 40, 68000, 'Ravi Textiles', 'F-01-09', 48],
  ['SKU-20131', 'Indigo Denim Fabric Roll 100m', 'Textiles', 'Karachi DC', 58, 10, 40, 68000, 'Ravi Textiles', 'A-04-02', 15],
  ['SKU-30207', 'LED Panel Light 18W', 'Electrical', 'Lahore DC', 2150, 300, 500, 1150, 'Margalla Electricals', 'B-05-11', 9],
  ['SKU-30245', 'Copper Cable 7/29 (90m coil)', 'Electrical', 'Islamabad Hub', 74, 12, 80, 38500, 'Margalla Electricals', 'I-02-04', 30],
  ['SKU-30310', 'Solar Panel 550W Mono', 'Solar & Energy', 'Karachi DC', 640, 120, 150, 31000, 'Gulf Solar Trading LLC', 'A-07-01', 3],
  ['SKU-30310', 'Solar Panel 550W Mono', 'Solar & Energy', 'Dubai JAFZA', 1800, 400, 300, 31000, 'Gulf Solar Trading LLC', 'D-01-01', 10],
  ['SKU-30355', 'Lithium Battery 48V 100Ah', 'Solar & Energy', 'Islamabad Hub', 36, 8, 40, 265000, 'Shenzhen Brightway Electronics', 'I-05-02', 18],
  ['SKU-30402', 'Hybrid Inverter 6kW', 'Solar & Energy', 'Lahore DC', 112, 24, 40, 178000, 'Shenzhen Brightway Electronics', 'B-06-03', 1],
  ['SKU-40118', 'Portland Cement 50kg', 'Building Materials', 'Islamabad Hub', 3200, 600, 1000, 1420, 'Bolan Cement Works', 'YARD-2', 2],
  ['SKU-40150', 'Steel Rebar 12mm (ton)', 'Building Materials', 'Lahore DC', 18, 6, 25, 268000, 'Punjab Steel Re-rolling', 'YARD-1', 25],
  ['SKU-40177', 'Porcelain Floor Tile 60x60 (box)', 'Building Materials', 'Karachi DC', 940, 80, 200, 3450, 'Gujranwala Ceramics', 'A-08-04', 6],
  ['SKU-50033', 'Engine Oil 20W-50 4L', 'Automotive', 'Karachi DC', 0, 0, 150, 6400, 'Khyber Auto Parts', 'A-09-05', 40],
  ['SKU-50061', 'Tyre 195/65 R15', 'Automotive', 'Islamabad Hub', 210, 30, 80, 24500, 'Khyber Auto Parts', 'I-07-01', 11],
  ['SKU-60012', 'Nitrile Exam Gloves (box of 100)', 'Medical', 'Lahore DC', 3800, 500, 1000, 1350, 'Chenab Medical Supplies', 'B-08-02', 5],
  ['SKU-60045', 'Paracetamol 500mg (carton)', 'Medical', 'Karachi DC', 260, 40, 300, 8900, 'Chenab Medical Supplies', 'A-10-01', 16],
  ['SKU-60071', 'Stainless Surgical Scissors', 'Medical', 'Dubai JAFZA', 1450, 200, 300, 950, 'Sialkot Sports & Surgical Co.', 'D-03-04', 21],
  ['SKU-70008', 'Match Football (Size 5)', 'Sports Goods', 'Lahore DC', 2600, 900, 600, 2750, 'Sialkot Sports & Surgical Co.', 'B-09-01', 8],
  ['SKU-70008', 'Match Football (Size 5)', 'Sports Goods', 'Dubai JAFZA', 540, 120, 200, 2750, 'Sialkot Sports & Surgical Co.', 'D-04-02', 26],
  ['SKU-70052', 'Cricket Bat English Willow', 'Sports Goods', 'Karachi DC', 64, 10, 50, 18500, 'Sialkot Sports & Surgical Co.', 'A-11-03', 33],
];

export const initialInventory = INVENTORY_ROWS.map(([sku, name, category, warehouse, quantity, reserved, reorderLevel, unitCost, supplier, bin, ago], i) => ({
  id: `inv-demo-${i + 1}`, isDemo: true, sku, name, category, warehouse, quantity, reserved, reorderLevel, unitCost, supplier, bin,
  lastRestocked: dayOffset(-ago), createdAt: created(-90),
}));

// ── Suppliers ──
// [name, contact, city, country, category, rating, leadTimeDays, terms, status]
const SUPPLIER_ROWS = [
  ['Mehran Foods', 'Sajid Memon', 'Hyderabad', 'Pakistan', 'Food & Grocery', 4.6, 7, 'Net 30', 'Active'],
  ['Indus Agro Traders', 'Farhan Lakhani', 'Karachi', 'Pakistan', 'Food & Grocery', 3.8, 6, 'Net 15', 'On Hold'],
  ['Ravi Textiles', 'Nadia Chaudhry', 'Faisalabad', 'Pakistan', 'Textiles', 4.4, 12, 'Net 45', 'Active'],
  ['Margalla Electricals', 'Tahir Abbasi', 'Islamabad', 'Pakistan', 'Electrical', 4.2, 10, 'Net 30', 'Active'],
  ['Gulf Solar Trading LLC', 'Rashid Al Mansoori', 'Dubai', 'UAE', 'Solar & Energy', 4.7, 14, 'Advance', 'Active'],
  ['Shenzhen Brightway Electronics', 'Li Wei', 'Shenzhen', 'China', 'Solar & Energy', 4.0, 28, 'Advance', 'Active'],
  ['Bolan Cement Works', 'Zahid Kakar', 'Quetta', 'Pakistan', 'Building Materials', 4.1, 8, 'Net 15', 'Active'],
  ['Punjab Steel Re-rolling', 'Kamran Butt', 'Lahore', 'Pakistan', 'Building Materials', 3.6, 15, 'Net 30', 'Active'],
  ['Gujranwala Ceramics', 'Shazia Cheema', 'Gujranwala', 'Pakistan', 'Building Materials', 4.3, 10, 'Net 30', 'Active'],
  ['Khyber Auto Parts', 'Imtiaz Afridi', 'Peshawar', 'Pakistan', 'Automotive', 3.9, 9, 'Net 15', 'Active'],
  ['Chenab Medical Supplies', 'Dr. Rabia Anwar', 'Lahore', 'Pakistan', 'Medical', 4.8, 5, 'Net 30', 'Active'],
  ['Sialkot Sports & Surgical Co.', 'Waseem Ghumman', 'Sialkot', 'Pakistan', 'Sports Goods', 4.5, 14, 'Net 60', 'Active'],
];
const slug = (s) => s.toLowerCase().replace(/[^a-z]+/g, '').slice(0, 14);
export const initialSuppliers = SUPPLIER_ROWS.map(([name, contactPerson, city, country, category, rating, leadTimeDays, paymentTerms, status], i) => ({
  id: `sup-demo-${i + 1}`, isDemo: true, name, contactPerson, email: `orders@${slug(name)}.${country === 'Pakistan' ? 'pk' : 'com'}`,
  phone: country === 'Pakistan' ? `+92 3${(i * 7 + 10) % 50 + 10} ${4000000 + i * 137211}` : country === 'UAE' ? '+971 4 880 2214' : '+86 755 2671 4410',
  city, country, category, rating, leadTimeDays, paymentTerms, status, createdAt: created(-200 + i * 5),
}));

// ── Purchase orders ──
const itemName = (sku) => INVENTORY_ROWS.find(r => r[0] === sku)?.[1] || sku;
const unitCostOf = (sku) => INVENTORY_ROWS.find(r => r[0] === sku)?.[7] || 0;
const line = (sku, qty) => ({ id: `${sku}-${qty}`, sku, name: itemName(sku), qty, unitCost: unitCostOf(sku) });
// [poNumber, supplier, warehouse, orderedDaysAgo, expectedOffset, receivedOffset|null, status, items, createdBy]
const PO_ROWS = [
  ['PO-2026-101', 'Mehran Foods', 'Karachi DC', -40, -30, -29, 'Received', [line('SKU-10021', 800)], 'Hina Qureshi'],
  ['PO-2026-102', 'Ravi Textiles', 'Faisalabad Hub', -35, -21, -18, 'Received', [line('SKU-20114', 400), line('SKU-20131', 60)], 'Usman Tariq'],
  ['PO-2026-103', 'Gulf Solar Trading LLC', 'Dubai JAFZA', -28, -14, -15, 'Received', [line('SKU-30310', 1200)], 'Hina Qureshi'],
  ['PO-2026-104', 'Shenzhen Brightway Electronics', 'Lahore DC', -32, -3, -1, 'Received', [line('SKU-30402', 80), line('SKU-30355', 40)], 'Bilal Ahmed'],
  ['PO-2026-105', 'Margalla Electricals', 'Islamabad Hub', -14, 2, null, 'Approved', [line('SKU-30245', 60)], 'Ayesha Malik'],
  ['PO-2026-106', 'Khyber Auto Parts', 'Karachi DC', -10, 4, null, 'Approved', [line('SKU-50033', 400)], 'Hina Qureshi'],
  ['PO-2026-107', 'Chenab Medical Supplies', 'Karachi DC', -6, 6, null, 'Pending Approval', [line('SKU-60045', 500)], 'Bilal Ahmed'],
  ['PO-2026-108', 'Punjab Steel Re-rolling', 'Lahore DC', -5, 10, null, 'Pending Approval', [line('SKU-40150', 40)], 'Usman Tariq'],
  ['PO-2026-109', 'Ravi Textiles', 'Faisalabad Hub', -3, 18, null, 'Draft', [line('SKU-20131', 80)], 'Usman Tariq'],
  ['PO-2026-110', 'Bolan Cement Works', 'Islamabad Hub', -48, -40, -36, 'Received', [line('SKU-40118', 2500)], 'Ayesha Malik'],
  ['PO-2026-111', 'Indus Agro Traders', 'Lahore DC', -20, -12, null, 'Cancelled', [line('SKU-10088', 200)], 'Bilal Ahmed'],
  ['PO-2026-112', 'Sialkot Sports & Surgical Co.', 'Lahore DC', -60, -45, -47, 'Received', [line('SKU-70008', 1500), line('SKU-70052', 50)], 'Hina Qureshi'],
  ['PO-2026-113', 'Gujranwala Ceramics', 'Karachi DC', -18, -8, -6, 'Received', [line('SKU-40177', 600)], 'Ayesha Malik'],
  ['PO-2026-114', 'Mehran Foods', 'Karachi DC', -2, 3, null, 'Approved', [line('SKU-10140', 400)], 'Hina Qureshi'],
  ['PO-2026-115', 'Chenab Medical Supplies', 'Lahore DC', -75, -68, -69, 'Received', [line('SKU-60012', 3000)], 'Bilal Ahmed'],
  ['PO-2026-116', 'Margalla Electricals', 'Lahore DC', -95, -85, -82, 'Received', [line('SKU-30207', 2000)], 'Usman Tariq'],
];
export const initialPurchaseOrders = PO_ROWS.map(([poNumber, supplier, warehouse, ordered, expected, received, status, items, createdBy], i) => ({
  id: `po-demo-${i + 1}`, isDemo: true, poNumber, supplier, warehouse, orderDate: dayOffset(ordered), expectedDate: dayOffset(expected),
  receivedDate: received === null ? '' : dayOffset(received), status, items, taxPercent: PO_TAX_RATE, createdBy,
  notes: status === 'Cancelled' ? 'Supplier could not confirm price; re-tendered.' : '', createdAt: created(ordered),
}));

// ── Stock transfers ──
// [transferNo, sku, qty, from, to, status, requestedDaysAgo, completedOffset|null, requestedBy]
const TRANSFER_ROWS = [
  ['TRF-0451', 'SKU-10021', 300, 'Karachi DC', 'Lahore DC', 'Completed', -14, -11, 'Bilal Ahmed'],
  ['TRF-0452', 'SKU-30310', 500, 'Dubai JAFZA', 'Karachi DC', 'Completed', -12, -5, 'Hina Qureshi'],
  ['TRF-0453', 'SKU-70008', 400, 'Lahore DC', 'Dubai JAFZA', 'In Transit', -4, null, 'Usman Tariq'],
  ['TRF-0454', 'SKU-60012', 600, 'Lahore DC', 'Islamabad Hub', 'Requested', -1, null, 'Ayesha Malik'],
  ['TRF-0455', 'SKU-20131', 20, 'Karachi DC', 'Faisalabad Hub', 'Requested', 0, null, 'Usman Tariq'],
  ['TRF-0456', 'SKU-40118', 800, 'Islamabad Hub', 'Lahore DC', 'In Transit', -2, null, 'Bilal Ahmed'],
  ['TRF-0457', 'SKU-30207', 250, 'Lahore DC', 'Karachi DC', 'Completed', -20, -17, 'Hina Qureshi'],
  ['TRF-0458', 'SKU-50061', 40, 'Islamabad Hub', 'Karachi DC', 'Cancelled', -9, null, 'Ayesha Malik'],
  ['TRF-0459', 'SKU-60071', 300, 'Dubai JAFZA', 'Karachi DC', 'Completed', -30, -22, 'Hina Qureshi'],
  ['TRF-0460', 'SKU-10021', 150, 'Karachi DC', 'Islamabad Hub', 'In Transit', -3, null, 'Bilal Ahmed'],
  ['TRF-0461', 'SKU-30402', 20, 'Lahore DC', 'Islamabad Hub', 'Completed', -45, -43, 'Ayesha Malik'],
  ['TRF-0462', 'SKU-70008', 300, 'Lahore DC', 'Karachi DC', 'Completed', -70, -66, 'Usman Tariq'],
];
export const initialStockTransfers = TRANSFER_ROWS.map(([transferNo, sku, quantity, fromWarehouse, toWarehouse, status, req, done, requestedBy], i) => ({
  id: `trf-demo-${i + 1}`, isDemo: true, transferNo, sku, itemName: itemName(sku), quantity, fromWarehouse, toWarehouse, status,
  requestDate: dayOffset(req), completedDate: done === null ? '' : dayOffset(done), requestedBy,
  notes: status === 'Cancelled' ? 'Customer order cancelled before dispatch.' : '', createdAt: created(req),
}));

// ── Fleet ──
// [registration, type, model, driver, base, status, capacityKg, odometerKm, fuel, lastServiceDaysAgo, nextServiceOffset, insuranceOffset]
const VEHICLE_ROWS = [
  ['KHI-TK-4471', 'Reefer Truck', 'Hino 500 FG (reefer body)', 'Imran Khattak', 'Karachi', 'On Route', 9000, 184200, 'Diesel', -48, 12, 140],
  ['LHR-TK-2209', 'Truck', 'Isuzu FVR 34', 'Shahid Mehmood', 'Lahore', 'On Route', 10000, 221400, 'Diesel', -70, -3, 60],
  ['KHI-TR-3390', 'Container Trailer', 'Volvo FH 460 + 40ft chassis', 'Naveed Akhtar', 'Karachi', 'Loading', 28000, 412800, 'Diesel', -30, 30, 210],
  ['ISB-VN-1187', 'Van', 'Toyota HiAce Commuter', 'Kashif Raza', 'Islamabad', 'On Route', 1200, 96300, 'Petrol', -20, 40, 25],
  ['FSD-TK-5502', 'Truck', 'Hino 300 Dutro', 'Asad Ullah', 'Faisalabad', 'Maintenance', 4500, 158900, 'Diesel', -2, 88, 180],
  ['LHR-PU-7718', 'Pickup', 'Toyota Hilux Revo', 'Faisal Iqbal', 'Lahore', 'Idle', 1000, 74200, 'Diesel', -35, 25, 300],
  ['KHI-TK-6630', 'Truck', 'Isuzu NPR 66', 'Waqas Ahmed', 'Karachi', 'On Route', 5000, 133600, 'Diesel', -55, 5, 95],
  ['ISB-VN-2045', 'Van', 'Changan Karvaan Plus', 'Zeeshan Ali', 'Islamabad', 'Idle', 800, 41800, 'CNG', -15, 75, 12],
  ['KHI-TR-9081', 'Container Trailer', 'Mercedes-Benz Actros 2645', 'Gul Khan', 'Karachi', 'On Route', 30000, 508300, 'Diesel', -62, 2, 150],
  ['FSD-RT-3317', 'Reefer Truck', 'Isuzu FVR (reefer body)', 'Rashid Mehmood', 'Faisalabad', 'Loading', 8000, 119700, 'Diesel', -40, 20, 220],
  ['LHR-PU-4402', 'Pickup', 'Suzuki Ravi', 'Adnan Saleem', 'Lahore', 'Out of Service', 600, 188000, 'Petrol', -120, -30, -5],
  ['DXB-TK-22871', 'Truck', 'Isuzu Giga (UAE plate)', 'Rajesh Nair', 'Dubai', 'On Route', 12000, 167400, 'Diesel', -25, 35, 260],
  ['MUX-VN-0912', 'Van', 'Suzuki Every (electric conversion)', 'Hamid Raza', 'Multan', 'Idle', 500, 22300, 'Electric', -10, 80, 330],
];
export const initialVehicles = VEHICLE_ROWS.map(([registration, type, model, driver, base, status, capacityKg, odometerKm, fuelType, last, next, ins], i) => ({
  id: `veh-demo-${i + 1}`, isDemo: true, registration, type, model, driver, base, status, capacityKg, odometerKm, fuelType,
  lastService: dayOffset(last), nextService: dayOffset(next), insuranceExpiry: dayOffset(ins), createdAt: created(-300 + i * 9),
}));

// ── Shipments ──
const INTL = (o, d) => [o, d].some(c => /Dubai|Jeddah|Rotterdam|Shanghai|Felixstowe|Hamburg|Doha|Manchester|Jebel Ali|Busan/.test(c));
const NOTES = {
  Booked: 'Shipment booked and label generated',
  'Picked Up': (o) => `Picked up from shipper in ${o}`,
  'In Transit': (o) => `Departed ${o} hub`,
  Customs: () => 'Arrived at customs; documents under review',
  'Out for Delivery': (o, d) => `Out for delivery in ${d}`,
  Delivered: () => 'Delivered and signed for by consignee',
  Delayed: () => 'Delay flagged — route congestion / weather',
  Exception: () => 'Exception — address unreachable, awaiting instructions',
  Cancelled: () => 'Cancelled by shipper before pickup',
  Returned: () => 'Consignee refused delivery; returned to origin',
};
/** Builds a milestone history that ends at `status`. */
export function buildMilestones(status, shipOffset, origin, destination) {
  const intl = INTL(origin, destination);
  const flow = ['Booked', 'Picked Up', 'In Transit', ...(intl ? ['Customs'] : []), 'Out for Delivery', 'Delivered'];
  let path;
  if (flow.includes(status)) path = flow.slice(0, flow.indexOf(status) + 1);
  else if (status === 'Cancelled') path = ['Booked', 'Cancelled'];
  else if (status === 'Returned') path = [...flow.slice(0, flow.indexOf('Out for Delivery') + 1), 'Returned'];
  else path = ['Booked', 'Picked Up', 'In Transit', status];
  const times = ['08:15', '11:40', '16:05', '09:30', '13:20', '17:45', '10:10'];
  return path.map((s, i) => {
    const offset = Math.min(0, shipOffset + Math.floor(i * (intl ? 1.6 : 0.7)));
    const location = i <= 1 ? origin : (s === 'Customs' || s === 'Out for Delivery' || s === 'Delivered' ? destination : `${origin} → ${destination}`);
    const note = typeof NOTES[s] === 'function' ? NOTES[s](origin, destination) : NOTES[s];
    return { id: `ms-${i}`, status: s, at: at(offset, times[i % times.length]), location, note };
  });
}
// [trackingNo, customer, carrier, mode, origin, destination, status, priority, vehicle, weightKg, cost, shipDaysAgo, etaOffset]
const SHIPMENT_ROWS = [
  ['MQS-88213', 'Nova Pharma (Pvt) Ltd', 'Own Fleet', 'Ground', 'Karachi', 'Lahore', 'Delayed', 'P1', 'KHI-TK-4471', 6200, 185000, -3, -1],
  ['MQS-88220', 'Cedarline Textiles', 'Own Fleet', 'Ground', 'Faisalabad', 'Karachi', 'In Transit', 'P2', 'FSD-RT-3317', 7400, 142000, -1, 1],
  ['MQS-88231', 'Pearl Solar Solutions', 'Maersk Line', 'Ocean', 'Shanghai', 'Port Qasim, Karachi', 'Customs', 'P3', 'KHI-TR-3390', 24000, 1650000, -24, 2],
  ['MQS-88244', 'Lumio Home Goods', 'TCS', 'Ground', 'Lahore', 'Islamabad', 'Delivered', 'P3', '', 340, 6800, -6, -4],
  ['MQS-88252', 'Sialkot Sporting Exports', 'DHL Express', 'Air', 'Sialkot', 'Manchester', 'Delivered', 'P2', '', 820, 486000, -9, -5],
  ['MQS-88260', 'Desert Rose Trading', 'PIA Cargo', 'Air', 'Karachi', 'Dubai', 'Out for Delivery', 'P1', '', 1450, 312000, -2, 0],
  ['MQS-88276', 'Zarqa Electronics', 'Leopards Courier', 'Ground', 'Karachi', 'Multan', 'Exception', 'P2', '', 95, 4200, -4, -2],
  ['MQS-88281', 'Alpha Builders', 'Own Fleet', 'Ground', 'Islamabad', 'Lahore', 'In Transit', 'P2', 'LHR-TK-2209', 9600, 98000, 0, 1],
  ['MQS-88295', 'Blue Crescent Exports', 'Maersk Line', 'Ocean', 'Karachi Port', 'Rotterdam', 'In Transit', 'P3', 'KHI-TR-9081', 26500, 2240000, -12, 9],
  ['MQS-88301', 'Kohsar Foods', 'M&P Logistics', 'Ground', 'Hyderabad', 'Peshawar', 'Delayed', 'P2', '', 2100, 38500, -5, -1],
  ['MQS-88309', 'Nova Pharma (Pvt) Ltd', 'FedEx', 'Air', 'Lahore', 'Doha', 'Picked Up', 'P1', '', 260, 158000, 0, 3],
  ['MQS-88314', 'Saffron Retail Co.', 'TCS', 'Ground', 'Lahore', 'Quetta', 'Delivered', 'P3', '', 410, 9600, -8, -4],
  ['MQS-88322', 'Northwind Traders', 'DHL Express', 'Air', 'Karachi', 'Hamburg', 'Booked', 'P2', '', 640, 402000, 1, 6],
  ['MQS-88330', 'Tariq Medical Stores', 'Own Fleet', 'Ground', 'Lahore', 'Multan', 'Delivered', 'P1', 'KHI-TK-6630', 3800, 54000, -7, -6],
  ['MQS-88337', 'Zarqa Electronics', 'Leopards Courier', 'Ground', 'Karachi', 'Hyderabad', 'Returned', 'P3', '', 60, 2600, -10, -8],
  ['MQS-88342', 'Saffron Retail Co.', 'M&P Logistics', 'Ground', 'Islamabad', 'Peshawar', 'Cancelled', 'P3', '', 150, 5400, -3, -1],
  ['MQS-88350', 'Pearl Solar Solutions', 'Own Fleet', 'Ground', 'Port Qasim, Karachi', 'Lahore', 'Delivered', 'P2', 'KHI-TR-9081', 21000, 265000, -15, -12],
  ['MQS-88356', 'Desert Rose Trading', 'Maersk Line', 'Ocean', 'Port Qasim, Karachi', 'Jebel Ali, Dubai', 'Delivered', 'P3', '', 18000, 940000, -20, -11],
  ['MQS-88361', 'Kohsar Foods', 'Own Fleet', 'Ground', 'Karachi', 'Hyderabad', 'Delivered', 'P2', 'KHI-TK-4471', 5200, 28000, -11, -10],
  ['MQS-88367', 'Lumio Home Goods', 'TCS', 'Ground', 'Karachi', 'Lahore', 'In Transit', 'P3', '', 290, 7400, -1, 1],
];
export const initialShipments = SHIPMENT_ROWS.map(([trackingNo, customer, carrier, mode, origin, destination, status, priority, vehicle, weightKg, cost, ship, eta], i) => {
  const milestones = buildMilestones(status, ship, origin, destination);
  const delivered = status === 'Delivered' ? milestones[milestones.length - 1].at : '';
  // A couple of deliveries landed a day after their ETA so on-time rates are realistic.
  const deliveredAt = delivered && (i % 4 === 0) ? at(eta + 1, '15:30') : delivered;
  return {
    id: `shp-demo-${i + 1}`, isDemo: true, trackingNo, customer, carrier, mode, origin, destination, status, priority, vehicle,
    weightKg, cost, shipDate: dayOffset(ship), eta: dayOffset(eta), deliveredAt, milestones, createdAt: created(ship - 1),
  };
});

// ── Real estate ──
// [name, email-local, phone, city, agency, commissionRate%, status, joinedDaysAgo, specialization]
const AGENT_ROWS = [
  ['Ayesha Siddiqui', 'ayesha.siddiqui', '+92 300 2214 871', 'Karachi', 'Meridian Realty', 2, 'Active', 900, 'Residential'],
  ['Hamza Sheikh', 'hamza.sheikh', '+92 321 4471 220', 'Lahore', 'Meridian Realty', 2.5, 'Active', 1200, 'Luxury'],
  ['Sana Farooq', 'sana.farooq', '+92 333 5120 994', 'Islamabad', 'Meridian Realty', 1.5, 'Active', 600, 'Rentals'],
  ['Omar Khalid', 'omar.khalid', '+92 345 2093 117', 'Karachi', 'Meridian Commercial', 2, 'Active', 1500, 'Commercial'],
  ['Maryam Iqbal', 'maryam.iqbal', '+92 301 4408 562', 'Lahore', 'Meridian Realty', 2, 'On Leave', 450, 'Residential'],
  ['Daniyal Rehman', 'daniyal.rehman', '+92 312 9054 318', 'Islamabad', 'Meridian Commercial', 2, 'Active', 800, 'Commercial'],
  ['Zoya Rahman', 'zoya.rahman', '+971 50 418 2276', 'Dubai', 'Meridian Gulf Properties', 2, 'Active', 300, 'Luxury'],
];
export const initialAgents = AGENT_ROWS.map(([name, mail, phone, city, agency, commissionRate, status, joined, specialization], i) => ({
  id: `agt-demo-${i + 1}`, isDemo: true, name, email: `${mail}@meridianrealty.pk`, phone, city, agency, commissionRate, status,
  joinedOn: dayOffset(-joined), specialization, createdAt: created(-joined),
}));

// [title, type, purpose, city, location, price, status, agent, beds, baths, sqft, views, enquiries, listedDaysAgo, closedDaysAgo|null]
const LISTING_ROWS = [
  ['Sea-facing 3 Bed Apartment, Clifton Block 2', 'Apartment', 'Sale', 'Karachi', 'Clifton Block 2', 68500000, 'Active', 'Ayesha Siddiqui', 3, 3, 2150, 1840, 22, 18, null],
  ['1 Kanal Modern Bungalow, DHA Phase 6', 'House', 'Sale', 'Lahore', 'DHA Phase 6', 145000000, 'Under Offer', 'Hamza Sheikh', 5, 6, 4500, 3120, 41, 34, null],
  ['Furnished 2 Bed Apartment, F-11 Markaz', 'Apartment', 'Rent', 'Islamabad', 'F-11 Markaz', 210000, 'Rented', 'Sana Farooq', 2, 2, 1350, 960, 17, 40, 12],
  ['Corporate Office Floor, Shahrah-e-Faisal', 'Commercial', 'Rent', 'Karachi', 'Shahrah-e-Faisal', 1350000, 'Active', 'Omar Khalid', 0, 4, 8200, 740, 9, 26, null],
  ['10 Marla House, Bahria Town Sector C', 'House', 'Sale', 'Lahore', 'Bahria Town Sector C', 38500000, 'Sold', 'Maryam Iqbal', 4, 4, 2250, 2210, 36, 95, 30],
  ['Retail Shop, Blue Area Jinnah Avenue', 'Commercial', 'Sale', 'Islamabad', 'Blue Area', 92000000, 'Active', 'Daniyal Rehman', 0, 1, 1100, 615, 8, 12, null],
  ['Marina View 2 Bed, Dubai Marina', 'Apartment', 'Sale', 'Dubai', 'Dubai Marina', 198000000, 'Active', 'Zoya Rahman', 2, 3, 1420, 2650, 29, 21, null],
  ['Luxury Villa with Pool, DHA Phase 8', 'Villa', 'Sale', 'Karachi', 'DHA Phase 8', 310000000, 'Sold', 'Ayesha Siddiqui', 6, 7, 7800, 4120, 54, 120, 18],
  ['Townhouse, Gulberg Greens', 'Townhouse', 'Rent', 'Islamabad', 'Gulberg Greens', 165000, 'Active', 'Sana Farooq', 3, 3, 1800, 420, 11, 7, null],
  ['Commercial Plot, Gulberg III Main Boulevard', 'Plot', 'Sale', 'Lahore', 'Gulberg III', 420000000, 'Under Offer', 'Hamza Sheikh', 0, 0, 9000, 1380, 15, 60, null],
  ['Studio Apartment, Bahria Heights', 'Apartment', 'Rent', 'Karachi', 'Bahria Town Karachi', 55000, 'Rented', 'Ayesha Siddiqui', 1, 1, 520, 880, 25, 33, 20],
  ['Warehouse Unit, SITE Industrial Area', 'Commercial', 'Rent', 'Karachi', 'SITE', 780000, 'Rented', 'Omar Khalid', 0, 2, 14000, 510, 6, 70, 41],
  ['Penthouse, Centaurus Residences', 'Apartment', 'Sale', 'Islamabad', 'F-8', 175000000, 'Draft', 'Daniyal Rehman', 4, 5, 3900, 0, 0, 2, null],
  ['5 Marla House, Johar Town', 'House', 'Sale', 'Lahore', 'Johar Town', 21500000, 'Expired', 'Maryam Iqbal', 3, 3, 1250, 1490, 12, 150, null],
  ['Palm Jumeirah Signature Villa', 'Villa', 'Sale', 'Dubai', 'Palm Jumeirah', 1250000000, 'Under Offer', 'Zoya Rahman', 5, 6, 7200, 5310, 47, 45, null],
  ['Office Suite, Emaar Business Bay', 'Commercial', 'Rent', 'Dubai', 'Business Bay', 2250000, 'Active', 'Zoya Rahman', 0, 2, 2400, 690, 7, 10, null],
  ['Family House, E-11/3', 'House', 'Sale', 'Islamabad', 'E-11', 74000000, 'Sold', 'Daniyal Rehman', 5, 5, 3200, 1730, 19, 80, 9],
  ['2 Bed Apartment, Askari 11', 'Apartment', 'Rent', 'Lahore', 'Askari 11', 120000, 'Active', 'Hamza Sheikh', 2, 2, 1250, 330, 5, 4, null],
];
export const initialListings = LISTING_ROWS.map(([title, type, purpose, city, location, price, status, agent, bedrooms, bathrooms, sizeSqft, views, enquiries, listed, closed], i) => ({
  id: `lst-demo-${i + 1}`, isDemo: true, title, type, purpose, city, location, price, status, agent, bedrooms, bathrooms, sizeSqft, views, enquiries,
  listedOn: dayOffset(-listed), closedOn: closed === null ? '' : dayOffset(-closed), createdAt: created(-listed),
}));

// [name, type, city, location, sqft, beds, value, occupancy, monthlyRent, owner, acquiredDaysAgo, yearBuilt]
const PROPERTY_ROWS = [
  ['Crescent Bay Tower 12-B', 'Apartment', 'Karachi', 'Crescent Bay, DHA Phase 8', 2400, 3, 82000000, 'Rented', 420000, 'Meridian Holdings', 820, 2023],
  ['DHA Phase 6 Bungalow 211', 'House', 'Lahore', 'DHA Phase 6', 4500, 5, 140000000, 'Owner Occupied', 0, 'Hamza Sheikh (agent-managed)', 1600, 2016],
  ['Gulberg Corporate Plaza', 'Commercial', 'Lahore', 'Gulberg III', 26000, 0, 650000000, 'Rented', 5200000, 'Meridian Holdings', 2100, 2012],
  ['F-7 Townhouse 14', 'Townhouse', 'Islamabad', 'F-7/2', 2100, 3, 96000000, 'Vacant', 0, 'Kamal Durrani', 400, 2009],
  ['Bahria Town Villa 214', 'Villa', 'Karachi', 'Bahria Town Precinct 2', 3600, 4, 54000000, 'Rented', 230000, 'Meridian Holdings', 950, 2021],
  ['Blue Area Office Floor 9', 'Commercial', 'Islamabad', 'Blue Area', 9800, 0, 310000000, 'Rented', 2600000, 'Meridian Holdings', 1300, 2015],
  ['Johar Town Commercial Plot', 'Plot', 'Lahore', 'Johar Town Block G', 4500, 0, 120000000, 'Vacant', 0, 'Meridian Land Bank', 700, 0],
  ['SITE Warehouse Unit 4', 'Commercial', 'Karachi', 'SITE Industrial Area', 14000, 0, 210000000, 'Rented', 780000, 'Meridian Logistics', 1100, 2005],
  ['Bahria Enclave Residence', 'House', 'Islamabad', 'Bahria Enclave Sector C', 3200, 4, 68000000, 'Under Construction', 0, 'Meridian Holdings', 180, 2026],
  ['Dubai Marina Apartment 3104', 'Apartment', 'Dubai', 'Dubai Marina', 1420, 2, 198000000, 'Rented', 1050000, 'Meridian Gulf Properties', 640, 2018],
  ['Canary Wharf Flat 18', 'Apartment', 'London', 'Canary Wharf', 820, 2, 265000000, 'Rented', 1150000, 'Meridian International', 1400, 2017],
  ['Model Town Family House', 'House', 'Lahore', 'Model Town', 3000, 4, 85000000, 'Owner Occupied', 0, 'Rehana Aziz', 3000, 1998],
  ['Clifton Seaview Studio', 'Apartment', 'Karachi', 'Clifton Block 2', 650, 1, 24000000, 'Vacant', 0, 'Meridian Holdings', 210, 2020],
];
export const initialProperties = PROPERTY_ROWS.map(([name, type, city, location, sizeSqft, bedrooms, value, occupancy, monthlyRent, owner, acquired, yearBuilt], i) => ({
  id: `prp-demo-${i + 1}`, isDemo: true, name, type, city, location, sizeSqft, bedrooms, value, occupancy, monthlyRent, owner,
  acquiredOn: dayOffset(-acquired), yearBuilt: yearBuilt || undefined, createdAt: created(-acquired),
}));

// [name, phone, interest, type, city, budget, stage, agent, source, enquiryDaysAgo, nextFollowUpOffset]
const LEAD_ROWS = [
  ['Ali Raza', '+92 300 8812 004', 'Buy', 'House', 'Lahore', 150000000, 'Offer', 'Hamza Sheikh', 'Property portal', 20, 1],
  ['Sadia Khan', '+92 321 7710 245', 'Rent', 'Apartment', 'Islamabad', 220000, 'Viewing', 'Sana Farooq', 'Website', 6, 2],
  ['Bilal Hassan', '+92 333 4410 875', 'Buy', 'Apartment', 'Karachi', 70000000, 'Negotiation', 'Ayesha Siddiqui', 'Referral', 25, 0],
  ['Mehwish Tariq', '+92 345 9021 663', 'Buy', 'Villa', 'Karachi', 320000000, 'Closed', 'Ayesha Siddiqui', 'Walk-in', 130, null],
  ['Junaid Akram', '+92 312 6672 190', 'Rent', 'Commercial', 'Karachi', 1500000, 'Enquiry', '', 'Phone', 1, 1],
  ['Hira Saleem', '+92 301 5560 728', 'Buy', 'House', 'Islamabad', 75000000, 'Closed', 'Daniyal Rehman', 'Website', 90, null],
  ['Rizwan Qureshi', '+92 322 1189 330', 'Buy', 'Plot', 'Lahore', 400000000, 'Offer', 'Hamza Sheikh', 'Referral', 40, 3],
  ['Amna Yousaf', '+92 300 4471 902', 'Rent', 'Townhouse', 'Islamabad', 170000, 'Viewing', 'Sana Farooq', 'Social media', 4, 1],
  ['Faisal Mirza', '+92 333 2208 561', 'Buy', 'Commercial', 'Islamabad', 95000000, 'Enquiry', '', 'Property portal', 2, 2],
  ['Nida Shahid', '+92 345 6630 114', 'Buy', 'House', 'Lahore', 22000000, 'Lost', 'Maryam Iqbal', 'Website', 70, null],
  ['Khalid Al Suwaidi', '+971 55 210 3381', 'Buy', 'Villa', 'Dubai', 1300000000, 'Negotiation', 'Zoya Rahman', 'Referral', 30, 0],
  ['Sarah Thompson', '+44 7700 900 412', 'Buy', 'Apartment', 'Dubai', 200000000, 'Viewing', 'Zoya Rahman', 'Property portal', 9, 4],
  ['Usman Ghani', '+92 312 7713 449', 'Rent', 'Apartment', 'Lahore', 125000, 'Enquiry', 'Hamza Sheikh', 'Phone', 0, 1],
  ['Tooba Anwar', '+92 300 9918 236', 'Rent', 'Apartment', 'Karachi', 60000, 'Closed', 'Ayesha Siddiqui', 'Social media', 36, null],
  ['Shehzad Malik', '+92 321 3302 775', 'Rent', 'Commercial', 'Dubai', 2300000, 'Offer', 'Zoya Rahman', 'Website', 14, 2],
  ['Areeba Nadeem', '+92 333 8840 190', 'Buy', 'Apartment', 'Karachi', 25000000, 'Lost', 'Ayesha Siddiqui', 'Walk-in', 55, null],
  ['Kamran Akmal', '+92 345 1002 678', 'Buy', 'House', 'Islamabad', 80000000, 'Enquiry', '', 'Social media', 0, 1],
];
export const initialPropertyLeads = LEAD_ROWS.map(([name, phone, interest, propertyType, preferredCity, budget, stage, agent, source, enq, next], i) => ({
  id: `pld-demo-${i + 1}`, isDemo: true, name, email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@mail.com`, phone, interest, propertyType,
  preferredCity, budget, stage, agent, source, enquiryDate: dayOffset(-enq), nextFollowUp: next === null ? '' : dayOffset(next),
  notes: '', createdAt: created(-enq),
}));

// ── Travel ──
// [pnr, passenger, airline, flightNo, from, to, departOffset, depTime, arrTime, cabin, passengers, farePerPax, status, tripType]
const FLIGHT_ROWS = [
  ['K7Q2LM', 'Usman Tariq', 'Emirates', 'EK 601', 'KHI', 'DXB', 3, '04:15', '05:25', 'Economy', 1, 98000, 'Confirmed', 'Return'],
  ['PJ8D4X', 'Fatima Noor', 'PIA', 'PK 759', 'LHE', 'JED', 6, '03:30', '06:40', 'Economy', 2, 142000, 'Confirmed', 'Return'],
  ['TK3H91', 'Ahmed Saeed', 'Turkish Airlines', 'TK 711', 'ISB', 'IST', 12, '06:00', '10:30', 'Business', 1, 465000, 'Confirmed', 'Return'],
  ['AB72CC', 'Hina Qureshi', 'Airblue', 'PA 401', 'KHI', 'ISB', -2, '07:00', '08:55', 'Economy', 1, 32500, 'Completed', 'One way'],
  ['QR5Z10', 'Zainab Ali', 'Qatar Airways', 'QR 629', 'LHE', 'DOH', 1, '04:45', '06:25', 'Economy', 3, 118000, 'Pending', 'Return'],
  ['SR11KQ', 'Omer Farooq', 'SereneAir', 'ER 502', 'ISB', 'KHI', 0, '18:30', '20:25', 'Economy', 1, 29800, 'Confirmed', 'One way'],
  ['PK785L', 'Saad Mehmood', 'PIA', 'PK 785', 'ISB', 'LHR', 20, '11:30', '15:40', 'Economy', 4, 285000, 'Confirmed', 'Return'],
  ['EY27FA', 'Rabia Anwar', 'Etihad', 'EY 244', 'KHI', 'AUH', -6, '22:10', '00:20', 'Economy', 1, 89000, 'Completed', 'Return'],
  ['SV99RT', 'Bilal Ahmed', 'Saudia', 'SV 701', 'MUX', 'MED', 9, '02:40', '05:55', 'Economy', 2, 132000, 'Pending', 'Return'],
  ['FZ33MD', 'Areeba Khan', 'flydubai', 'FZ 336', 'PEW', 'DXB', -1, '15:20', '17:00', 'Economy', 1, 76000, 'Cancelled', 'One way'],
  ['EK61BZ', 'Hamza Sheikh', 'Emirates', 'EK 623', 'LHE', 'DXB', 15, '04:50', '06:55', 'First', 1, 640000, 'Confirmed', 'One way'],
  ['QR88NY', 'Sana Farooq', 'Qatar Airways', 'QR 615', 'ISB', 'JFK', 25, '04:05', '15:30', 'Business', 1, 1180000, 'Confirmed', 'Return'],
  ['AS54LH', 'Kamran Butt', 'AirSial', 'PF 141', 'SKT', 'KHI', -10, '10:00', '11:50', 'Economy', 1, 27500, 'Completed', 'One way'],
  ['TK90BK', 'Maryam Iqbal', 'Turkish Airlines', 'TK 715', 'LHE', 'GYD', 33, '05:40', '09:15', 'Premium Economy', 2, 214000, 'Pending', 'Return'],
  ['PK301K', 'Danish Qamar', 'PIA', 'PK 301', 'KHI', 'LHE', -18, '07:00', '08:45', 'Economy', 1, 28000, 'Completed', 'One way'],
  ['EK62KL', 'Noor Fatima', 'Emirates', 'EK 612', 'ISB', 'KUL', -25, '03:55', '15:40', 'Economy', 2, 175000, 'Completed', 'Return'],
];
export const initialFlights = FLIGHT_ROWS.map(([pnr, passenger, airline, flightNo, from, to, dep, departTime, arriveTime, cabin, passengers, fare, status, tripType], i) => ({
  id: `flt-demo-${i + 1}`, isDemo: true, pnr, passenger, airline, flightNo, from, to, departDate: dayOffset(dep), departTime, arriveTime,
  cabin, passengers, fare, status, tripType, bookedOn: dayOffset(Math.min(dep, 0) - 7 - (i % 9)), createdAt: created(Math.min(dep, 0) - 7 - (i % 9)),
}));

// [ref, passenger, phone, city, pickup, drop, dayOffset, time, vehicleType, driver, km, fare, status]
const CAB_ROWS = [
  ['CAB-3021', 'Usman Tariq', '+92 300 1100 220', 'Karachi', 'DHA Phase 5', 'Jinnah International Airport', 3, '01:30', 'Sedan', 'Akbar Ali', 22, 3200, 'Confirmed'],
  ['CAB-3022', 'Fatima Noor', '+92 321 5503 118', 'Lahore', 'Model Town', 'Allama Iqbal International Airport', 6, '00:45', 'SUV', 'Rehmat Khan', 18, 4100, 'Confirmed'],
  ['CAB-3023', 'Hina Qureshi', '+92 333 2219 004', 'Islamabad', 'Islamabad International Airport', 'Serena Hotel', -2, '09:30', 'Sedan', 'Sajid Hussain', 31, 3600, 'Completed'],
  ['CAB-3024', 'Omer Farooq', '+92 345 7781 560', 'Karachi', 'Jinnah International Airport', 'Clifton Block 4', 0, '20:50', 'Mini', '', 19, 1900, 'Pending'],
  ['CAB-3025', 'Zoya Rahman', '+971 50 418 2276', 'Dubai', 'DXB Terminal 3', 'Dubai Marina', 1, '07:15', 'Luxury', 'Rahul Menon', 34, 14500, 'Confirmed'],
  ['CAB-3026', 'Rabia Anwar', '+92 300 4471 120', 'Lahore', 'Gulberg III', 'Emporium Mall', -4, '17:00', 'Mini', 'Nadeem Abbas', 9, 850, 'Completed'],
  ['CAB-3027', 'Saad Mehmood', '+92 312 6603 271', 'Islamabad', 'F-10 Markaz', 'Islamabad International Airport', 20, '07:30', 'Van', 'Sajid Hussain', 28, 5200, 'Pending'],
  ['CAB-3028', 'Areeba Khan', '+92 301 2290 455', 'Peshawar', 'Hayatabad Phase 3', 'Bacha Khan International Airport', -1, '12:40', 'Sedan', 'Gul Zaman', 8, 1100, 'Cancelled'],
  ['CAB-3029', 'Ahmed Saeed', '+92 333 1029 774', 'Istanbul', 'IST Airport', 'Sultanahmet', 12, '11:00', 'SUV', 'Mehmet Yılmaz', 52, 16800, 'Confirmed'],
  ['CAB-3030', 'Kamran Butt', '+92 321 9940 113', 'Karachi', 'Jinnah International Airport', 'PECHS Block 6', -10, '12:20', 'Sedan', 'Akbar Ali', 15, 1700, 'Completed'],
  ['CAB-3031', 'Danish Qamar', '+92 300 5521 090', 'Lahore', 'Allama Iqbal International Airport', 'DHA Phase 4', -18, '09:10', 'Mini', 'Rehmat Khan', 14, 1250, 'Completed'],
];
export const initialCabs = CAB_ROWS.map(([ref, passenger, phone, city, pickup, drop, d, pickupTime, vehicleType, driver, distanceKm, fare, status], i) => ({
  id: `cab-demo-${i + 1}`, isDemo: true, ref, passenger, phone, city, pickup, drop, pickupDate: dayOffset(d), pickupTime, vehicleType, driver,
  distanceKm, fare, status, createdAt: created(Math.min(d, 0) - 2),
}));

// [ref, guest, line, ship, route, port, departOffset, nights, cabin, guests, farePerGuest, status]
const CRUISE_ROWS = [
  ['CRZ-701', 'Sheikh Family', 'MSC Cruises', 'MSC Euribia', 'Dubai · Abu Dhabi · Sir Bani Yas · Doha', 'Dubai (Port Rashid)', 28, 7, 'Balcony', 4, 265000, 'Confirmed'],
  ['CRZ-702', 'Ali & Mahnoor Raza', 'Royal Caribbean', 'Spectrum of the Seas', 'Singapore · Penang · Phuket', 'Singapore', 45, 5, 'Ocean View', 2, 312000, 'Pending'],
  ['CRZ-703', 'Hassan Javed', 'Celebrity Cruises', 'Celebrity Infinity', 'Istanbul · Mykonos · Santorini · Athens', 'Istanbul', 60, 7, 'Suite', 2, 780000, 'Confirmed'],
  ['CRZ-704', 'Nadia Chaudhry', 'Costa Cruises', 'Costa Smeralda', 'Barcelona · Marseille · Genoa · Rome', 'Barcelona', -14, 7, 'Interior', 1, 198000, 'Completed'],
  ['CRZ-705', 'Qureshi Family', 'MSC Cruises', 'MSC Virtuosa', 'Doha · Bahrain · Dubai', 'Doha', 10, 4, 'Balcony', 5, 176000, 'Confirmed'],
  ['CRZ-706', 'Tariq & Sara Aziz', 'Norwegian Cruise Line', 'Norwegian Escape', 'Miami · Cozumel · Roatan · Harvest Caye', 'Miami', 80, 7, 'Balcony', 2, 420000, 'Pending'],
  ['CRZ-707', 'Faraz Haider', 'Royal Caribbean', 'Anthem of the Seas', 'Southampton · Norwegian Fjords', 'Southampton', -40, 7, 'Ocean View', 2, 505000, 'Completed'],
  ['CRZ-708', 'Saima Javed', 'Costa Cruises', 'Costa Toscana', 'Dubai · Khasab · Muscat', 'Dubai (Port Rashid)', 5, 3, 'Interior', 2, 98000, 'Cancelled'],
];
export const initialCruises = CRUISE_ROWS.map(([ref, guest, cruiseLine, ship, route, departPort, dep, nights, cabinType, guests, fare, status], i) => ({
  id: `crz-demo-${i + 1}`, isDemo: true, ref, guest, cruiseLine, ship, route, departPort, departDate: dayOffset(dep), nights, cabinType, guests, fare, status,
  createdAt: created(Math.min(dep, 0) - 20 - i),
}));

// [code, name, destination, type, startOffset, nights, travellers, pricePerPerson, leadTraveller, status, includes]
const TRIP_ROWS = [
  ['TRP-210', 'Umrah Economy Package — 14 Days', 'Makkah & Madinah', 'Religious', 9, 14, 6, 385000, 'Bilal Ahmed', 'Confirmed', ['Return flights', 'Hotels near Haram', 'Visa', 'Ziyarat tour']],
  ['TRP-211', 'Hunza & Skardu Explorer', 'Gilgit-Baltistan', 'Adventure', 18, 7, 8, 145000, 'Faisal Iqbal', 'Confirmed', ['Jeep transfers', 'Guesthouses', 'Breakfast & dinner', 'Guide']],
  ['TRP-212', 'Turkey Highlights 8D', 'Istanbul · Cappadocia', 'Leisure', 12, 8, 2, 520000, 'Ahmed Saeed', 'Confirmed', ['Flights', '4★ hotels', 'Balloon ride', 'Bosphorus cruise']],
  ['TRP-213', 'Baku Family Getaway', 'Baku, Azerbaijan', 'Family', 33, 5, 4, 265000, 'Maryam Iqbal', 'Planned', ['Flights', 'Hotel', 'City tour', 'Gabala day trip']],
  ['TRP-214', 'Malaysia & Thailand Honeymoon', 'Kuala Lumpur · Phuket', 'Honeymoon', -25, 9, 2, 410000, 'Noor Fatima', 'Completed', ['Flights', 'Resort stays', 'Island hopping', 'Transfers']],
  ['TRP-215', 'Swat Valley Weekend', 'Swat · Kalam', 'Leisure', -2, 3, 5, 48000, 'Hina Qureshi', 'Ongoing', ['Coaster', 'Hotel', 'Meals']],
  ['TRP-216', 'Dubai Shopping Festival', 'Dubai, UAE', 'Leisure', 70, 5, 3, 235000, 'Zainab Ali', 'Planned', ['Flights', 'Hotel', 'Desert safari', 'Visa']],
  ['TRP-217', 'Leadership Offsite — Nathia Gali', 'Nathia Gali', 'Corporate', 15, 2, 24, 62000, 'Hamza Sheikh', 'Confirmed', ['Coach transfers', 'Resort', 'Conference room', 'Meals']],
  ['TRP-218', 'London & Scotland Summer', 'London · Edinburgh', 'Family', -60, 10, 4, 890000, 'Saad Mehmood', 'Completed', ['Flights', 'Hotels', 'Rail pass', 'Visa assistance']],
  ['TRP-219', 'Maldives Honeymoon Escape', 'Malé, Maldives', 'Honeymoon', 40, 5, 2, 760000, 'Omer Farooq', 'Planned', ['Flights', 'Water villa', 'Seaplane transfer', 'All meals']],
  ['TRP-220', 'Northern Areas Bike Tour', 'Karakoram Highway', 'Adventure', 5, 6, 10, 98000, 'Danish Qamar', 'Cancelled', ['Bikes', 'Support vehicle', 'Camping']],
];
export const initialTrips = TRIP_ROWS.map(([code, name, destination, type, start, nights, travellers, pricePerPerson, leadTraveller, status, includes], i) => ({
  id: `trp-demo-${i + 1}`, isDemo: true, code, name, destination, type, startDate: dayOffset(start), endDate: dayOffset(start + nights), travellers,
  pricePerPerson, leadTraveller, status, includes, createdAt: created(Math.min(start, 0) - 30 - i),
}));

const act = (time, text, i) => ({ id: `a${i}-${time}`, time, text });
const dayPlan = (title, location, items) => ({ id: `d-${title.slice(0, 6)}-${location.slice(0, 4)}`.replace(/\s+/g, ''), title, location, activities: items.map(([t, x], i) => act(t, x, i)) });
export const initialItineraries = [
  {
    id: 'iti-demo-1', isDemo: true, title: 'Turkey Highlights 8D', traveller: 'Ahmed Saeed', destination: 'Istanbul · Cappadocia', tripCode: 'TRP-212',
    startDate: dayOffset(12), status: 'Confirmed', createdAt: created(-20),
    days: [
      dayPlan('Arrival in Istanbul', 'Istanbul', [['10:30', 'Land at IST, private transfer to Sultanahmet hotel'], ['15:00', 'Check-in and rest'], ['19:30', 'Welcome dinner at Hamdi Restaurant']]),
      dayPlan('Old City walking tour', 'Istanbul', [['09:00', 'Hagia Sophia and Blue Mosque'], ['12:30', 'Lunch near Grand Bazaar'], ['14:00', 'Topkapı Palace'], ['18:00', 'Bosphorus sunset cruise']]),
      dayPlan('Flight to Cappadocia', 'Göreme', [['08:00', 'Domestic flight IST → NAV'], ['12:00', 'Cave hotel check-in'], ['16:00', 'Rose Valley sunset hike']]),
      dayPlan('Hot-air balloon day', 'Göreme', [['05:00', 'Hot-air balloon flight'], ['10:00', 'Göreme Open-Air Museum'], ['14:00', 'Pottery workshop in Avanos']]),
    ],
  },
  {
    id: 'iti-demo-2', isDemo: true, title: 'Hunza & Skardu Explorer', traveller: 'Faisal Iqbal', destination: 'Gilgit-Baltistan', tripCode: 'TRP-211',
    startDate: dayOffset(18), status: 'Confirmed', createdAt: created(-12),
    days: [
      dayPlan('Islamabad to Chilas', 'Chilas', [['06:00', 'Depart Islamabad via Babusar Top'], ['13:00', 'Lunch at Naran'], ['19:00', 'Overnight at Chilas']]),
      dayPlan('Into Hunza', 'Karimabad', [['08:00', 'Drive along KKH, Rakaposhi viewpoint'], ['15:00', 'Baltit Fort'], ['18:30', 'Eagle’s Nest sunset']]),
      dayPlan('Attabad & Passu', 'Passu', [['09:00', 'Attabad Lake boating'], ['12:00', 'Passu Cones and Hussaini bridge'], ['17:00', 'Return to Karimabad']]),
    ],
  },
  {
    id: 'iti-demo-3', isDemo: true, title: 'Umrah Economy Package', traveller: 'Bilal Ahmed', destination: 'Makkah & Madinah', tripCode: 'TRP-210',
    startDate: dayOffset(9), status: 'Confirmed', createdAt: created(-30),
    days: [
      dayPlan('Arrival in Jeddah', 'Makkah', [['06:40', 'Land at JED, group transfer to Makkah'], ['11:00', 'Hotel check-in'], ['14:00', 'Perform Umrah with group guide']]),
      dayPlan('Ziyarat in Makkah', 'Makkah', [['08:00', 'Ziyarat: Jabal al-Nour, Mina, Arafat'], ['13:00', 'Rest'], ['20:00', 'Prayers at Masjid al-Haram']]),
      dayPlan('Travel to Madinah', 'Madinah', [['09:00', 'Haramain train to Madinah'], ['13:00', 'Hotel check-in'], ['16:00', 'Visit Masjid an-Nabawi']]),
    ],
  },
];
