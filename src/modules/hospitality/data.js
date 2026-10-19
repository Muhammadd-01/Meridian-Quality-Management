/**
 * Seed data for the hospitality module group (hotel, restaurant POS, food
 * delivery, school and SEO). Every seeded record is demo data and carries
 * `isDemo: true` so pages can label it. Dates are generated relative to the
 * day the browser first loads them, so timelines and boards always have
 * something current to show. Values are deterministic (seeded PRNG).
 */
const demo = (records) => records.map(r => ({ ...r, isDemo: true }));

// ── helpers ──────────────────────────────────────────────────────────────
function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = prng(20261019);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (min, max) => Math.round(min + rand() * (max - min));

const pad = (n) => String(n).padStart(2, '0');
export const isoDay = (offset = 0, base = new Date()) => {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const minutesAgo = (m) => new Date(Date.now() - m * 60000).toISOString();

const FIRST = ['Ali', 'Ahmed', 'Fatima', 'Ayesha', 'Hassan', 'Zara', 'Usman', 'Hira', 'Bilal', 'Maryam', 'Hamza', 'Sana', 'Saad', 'Iqra', 'Taimur', 'Mahnoor', 'Daniyal', 'Areeba', 'Rayyan', 'Noor', 'Zain', 'Eman', 'Abdullah', 'Laiba', 'Haris', 'Anaya', 'Shayan', 'Alishba', 'Arham', 'Minahil', 'Fahad', 'Rida', 'Moiz', 'Hafsa', 'Ibrahim', 'Khadija', 'Musa', 'Amna', 'Yahya', 'Zoya', 'Umer', 'Mehwish', 'Talha', 'Kinza', 'Rohail', 'Javeria', 'Faraz', 'Sidra'];
const LAST = ['Khan', 'Ahmed', 'Malik', 'Siddiqui', 'Qureshi', 'Hussain', 'Butt', 'Chaudhry', 'Sheikh', 'Raza', 'Iqbal', 'Abbasi', 'Mirza', 'Javed', 'Baig', 'Rana', 'Shah', 'Awan', 'Haider', 'Farooq'];
const GIRLS = new Set(['Fatima', 'Ayesha', 'Zara', 'Hira', 'Maryam', 'Sana', 'Iqra', 'Mahnoor', 'Areeba', 'Noor', 'Eman', 'Laiba', 'Anaya', 'Alishba', 'Minahil', 'Rida', 'Hafsa', 'Khadija', 'Amna', 'Zoya', 'Mehwish', 'Kinza', 'Javeria', 'Sidra']);

// ═════════════════════════════ HOTEL ═════════════════════════════════════
export const ROOM_STATUSES = ['Available', 'Occupied', 'Reserved', 'Cleaning', 'Maintenance'];
export const ROOM_CLEANLINESS = ['Clean', 'Dirty', 'Inspected'];
export const ROOM_TYPES = ['Standard Twin', 'Deluxe King', 'Family Suite', 'Executive Suite', 'Presidential Suite'];
export const ROOM_TYPE_INFO = {
  'Standard Twin': { rate: 18500, capacity: 2, size: 26, bed: '2 Single' },
  'Deluxe King': { rate: 26000, capacity: 2, size: 32, bed: 'King' },
  'Family Suite': { rate: 38000, capacity: 4, size: 48, bed: 'King + 2 Single' },
  'Executive Suite': { rate: 48000, capacity: 3, size: 56, bed: 'King' },
  'Presidential Suite': { rate: 125000, capacity: 4, size: 110, bed: 'Super King' },
};
const FLOOR_LAYOUT = {
  1: ['Standard Twin', 'Standard Twin', 'Standard Twin', 'Deluxe King', 'Deluxe King', 'Standard Twin'],
  2: ['Standard Twin', 'Deluxe King', 'Deluxe King', 'Deluxe King', 'Family Suite', 'Standard Twin'],
  3: ['Deluxe King', 'Deluxe King', 'Family Suite', 'Family Suite', 'Deluxe King', 'Deluxe King'],
  4: ['Deluxe King', 'Executive Suite', 'Executive Suite', 'Family Suite', 'Deluxe King', 'Executive Suite'],
  5: ['Executive Suite', 'Executive Suite', 'Presidential Suite', 'Executive Suite', 'Executive Suite', 'Presidential Suite'],
};
// Deterministic status pattern per room so the seed tells a coherent story.
const ROOM_STATUS_PLAN = {
  101: 'Occupied', 102: 'Available', 103: 'Cleaning', 104: 'Occupied', 105: 'Available', 106: 'Maintenance',
  201: 'Occupied', 202: 'Occupied', 203: 'Reserved', 204: 'Available', 205: 'Occupied', 206: 'Cleaning',
  301: 'Occupied', 302: 'Available', 303: 'Occupied', 304: 'Reserved', 305: 'Occupied', 306: 'Available',
  401: 'Occupied', 402: 'Occupied', 403: 'Available', 404: 'Occupied', 405: 'Cleaning', 406: 'Reserved',
  501: 'Occupied', 502: 'Available', 503: 'Occupied', 504: 'Reserved', 505: 'Available', 506: 'Available',
};
const VIEWS = ['City view', 'Garden view', 'Pool view', 'Mall Road view'];

export const initialHotelRooms = demo(Object.entries(FLOOR_LAYOUT).flatMap(([floor, types]) =>
  types.map((type, i) => {
    const number = `${floor}0${i + 1}`;
    const info = ROOM_TYPE_INFO[type];
    const status = ROOM_STATUS_PLAN[number];
    return {
      id: `room-${number}`,
      number,
      floor: Number(floor),
      type,
      bed: info.bed,
      capacity: info.capacity,
      size: info.size,
      rate: info.rate,
      status,
      cleanliness: status === 'Cleaning' ? 'Dirty' : status === 'Occupied' ? 'Clean' : 'Inspected',
      view: VIEWS[(Number(floor) + i) % VIEWS.length],
      amenities: type.includes('Suite') ? ['Wi-Fi', 'Mini bar', 'Lounge access', 'Bathtub'] : ['Wi-Fi', 'Smart TV', 'Tea & coffee'],
      notes: status === 'Maintenance' ? 'AC compressor replacement — engineering ticket ENG-114' : '',
    };
  })));

export const GUEST_TIERS = ['Regular', 'Silver', 'Gold', 'Platinum'];
export const initialHotelGuests = demo([
  { id: 'guest-01', name: 'Ayesha Siddiqui', email: 'ayesha.siddiqui@gmail.com', phone: '+92 300 4521890', city: 'Karachi', country: 'Pakistan', tier: 'Platinum', stays: 14, totalSpend: 1860000, preferences: ['High floor', 'Feather-free pillows'], lastStay: isoDay(-2), notes: 'Anniversary in December' },
  { id: 'guest-02', name: 'Bilal Chaudhry', email: 'bilal.ch@outlook.com', phone: '+92 321 7788120', city: 'Islamabad', country: 'Pakistan', tier: 'Gold', stays: 8, totalSpend: 742000, preferences: ['Late checkout', 'Newspaper: Dawn'], lastStay: isoDay(-1) },
  { id: 'guest-03', name: 'Sarah Whitfield', email: 'sarah.whitfield@unhcr.org', phone: '+44 7700 900412', city: 'London', country: 'United Kingdom', tier: 'Silver', stays: 3, totalSpend: 395000, preferences: ['Quiet room', 'Vegetarian breakfast'], lastStay: isoDay(-3) },
  { id: 'guest-04', name: 'Hamza Qureshi', email: 'hamza.q@engro.pk', phone: '+92 333 2201456', city: 'Lahore', country: 'Pakistan', tier: 'Gold', stays: 11, totalSpend: 1120000, preferences: ['Corporate rate', 'Airport pickup'], lastStay: isoDay(-4) },
  { id: 'guest-05', name: 'Mei Lin Chen', email: 'meilin.chen@cpec-consult.cn', phone: '+86 138 0013 8822', city: 'Shanghai', country: 'China', tier: 'Platinum', stays: 19, totalSpend: 2480000, preferences: ['Suite', 'Green tea in room'], lastStay: isoDay(-5) },
  { id: 'guest-06', name: 'Fatima Raza', email: 'fatima.raza@yahoo.com', phone: '+92 345 6612093', city: 'Multan', country: 'Pakistan', tier: 'Regular', stays: 1, totalSpend: 52000, preferences: ['Twin beds'], lastStay: isoDay(-1) },
  { id: 'guest-07', name: 'Omar Farooq', email: 'omar.farooq@gmail.com', phone: '+92 302 9917450', city: 'Rawalpindi', country: 'Pakistan', tier: 'Silver', stays: 4, totalSpend: 288000, preferences: ['Gym access'], lastStay: isoDay(0) },
  { id: 'guest-08', name: 'James Kowalski', email: 'j.kowalski@siemens.com', phone: '+49 151 2345 6789', city: 'Munich', country: 'Germany', tier: 'Gold', stays: 6, totalSpend: 915000, preferences: ['Executive lounge', 'Invoice to company'], lastStay: isoDay(-2) },
  { id: 'guest-09', name: 'Zainab Hussain', email: 'zainab.h@aku.edu', phone: '+92 312 4410922', city: 'Karachi', country: 'Pakistan', tier: 'Silver', stays: 5, totalSpend: 336000, preferences: ['Non-smoking', 'Extra towels'], lastStay: isoDay(-6) },
  { id: 'guest-10', name: 'Ahmed Al Mansoori', email: 'ahmed.mansoori@adnoc.ae', phone: '+971 50 123 4567', city: 'Abu Dhabi', country: 'UAE', tier: 'Platinum', stays: 9, totalSpend: 2150000, preferences: ['Presidential Suite', 'Halal minibar'], lastStay: isoDay(-1) },
  { id: 'guest-11', name: 'Usman Tariq', email: 'usman.tariq@textilecorp.pk', phone: '+92 300 1234567', city: 'Faisalabad', country: 'Pakistan', tier: 'Regular', stays: 2, totalSpend: 74000, preferences: ['Early breakfast'], lastStay: isoDay(-12) },
  { id: 'guest-12', name: 'Priya Nair', email: 'priya.nair@wfp.org', phone: '+94 77 301 2299', city: 'Colombo', country: 'Sri Lanka', tier: 'Silver', stays: 3, totalSpend: 214000, preferences: ['Garden view'], lastStay: isoDay(-20) },
  { id: 'guest-13', name: 'Mariam Qureshi', email: 'mariam.q@cascaderetail.com', phone: '+1 312 555 0142', city: 'Chicago', country: 'United States', tier: 'Gold', stays: 7, totalSpend: 806000, preferences: ['Pool view', 'Late checkout'], lastStay: isoDay(-9) },
  { id: 'guest-14', name: 'Kamran Shah', email: 'kamran@orbitlogistics.pk', phone: '+92 21 3456 1122', city: 'Karachi', country: 'Pakistan', tier: 'Regular', stays: 1, totalSpend: 37000, preferences: [], lastStay: isoDay(-30) },
  { id: 'guest-15', name: 'Elena Petrova', email: 'elena.petrova@icrc.org', phone: '+7 916 555 2211', city: 'Geneva', country: 'Switzerland', tier: 'Silver', stays: 2, totalSpend: 168000, preferences: ['Quiet room'], lastStay: isoDay(-44) },
  { id: 'guest-16', name: 'Daniyal Mirza', email: 'daniyal.mirza@hbl.com', phone: '+92 331 5098812', city: 'Lahore', country: 'Pakistan', tier: 'Gold', stays: 10, totalSpend: 988000, preferences: ['Corporate rate', 'King bed'], lastStay: isoDay(-3) },
]);

export const RESERVATION_STATUSES = ['Pending', 'Confirmed', 'Checked In', 'Checked Out', 'Cancelled'];
export const RESERVATION_SOURCES = ['Direct', 'Website', 'Booking.com', 'Corporate', 'Walk-in', 'Travel agent'];

const reservationPlan = [
  // [room, guestIndex, checkInOffset, nights, status, source]
  ['101', 5, -1, 2, 'Checked In', 'Walk-in'],
  ['104', 6, 0, 3, 'Checked In', 'Website'],
  ['201', 1, -2, 3, 'Checked In', 'Corporate'],
  ['202', 8, -3, 5, 'Checked In', 'Booking.com'],
  ['205', 11, -1, 4, 'Checked In', 'Travel agent'],
  ['301', 2, -2, 4, 'Checked In', 'Booking.com'],
  ['303', 12, -1, 3, 'Checked In', 'Direct'],
  ['305', 15, -3, 4, 'Checked In', 'Corporate'],
  ['401', 3, -2, 5, 'Checked In', 'Corporate'],
  ['402', 7, -1, 2, 'Checked In', 'Corporate'],
  ['404', 13, 0, 2, 'Checked In', 'Website'],
  ['501', 0, -2, 4, 'Checked In', 'Direct'],
  ['503', 9, -1, 3, 'Checked In', 'Direct'],
  ['203', 10, 0, 2, 'Confirmed', 'Website'],
  ['304', 14, 0, 3, 'Confirmed', 'Booking.com'],
  ['406', 4, 0, 4, 'Confirmed', 'Corporate'],
  ['504', 9, 0, 2, 'Pending', 'Travel agent'],
  ['102', 13, 2, 3, 'Confirmed', 'Website'],
  ['302', 3, 3, 2, 'Confirmed', 'Corporate'],
  ['502', 0, 4, 3, 'Pending', 'Direct'],
  ['204', 6, 5, 2, 'Confirmed', 'Booking.com'],
  ['103', 1, -3, 3, 'Checked Out', 'Corporate'],
  ['206', 11, -4, 4, 'Checked Out', 'Website'],
  ['405', 7, -2, 2, 'Checked Out', 'Corporate'],
  ['306', 14, 1, 2, 'Cancelled', 'Booking.com'],
];
export const initialHotelReservations = demo(reservationPlan.map(([room, gi, offset, nights, status, source], i) => {
  const r = initialHotelRooms.find(x => x.number === room);
  const g = initialHotelGuests[gi];
  return {
    id: `res-${pad(i + 1)}`,
    code: `RSV-${4100 + i}`,
    guestName: g.name,
    guestId: g.id,
    roomNumber: room,
    roomType: r.type,
    checkIn: isoDay(offset),
    checkOut: isoDay(offset + nights),
    nights,
    adults: Math.min(r.capacity, 1 + (i % 3)),
    status,
    source,
    rate: r.rate,
    amount: r.rate * nights,
    paid: status === 'Checked Out' ? r.rate * nights : status === 'Checked In' ? Math.round(r.rate * nights * 0.5) : 0,
    notes: gi === 0 ? 'Platinum guest — welcome amenity' : '',
  };
}));

export const HK_STATUSES = ['To Do', 'In Progress', 'Inspection', 'Done'];
export const HK_TASKS = ['Turnover clean', 'Stay-over service', 'Deep clean', 'Turndown', 'Inspection', 'Maintenance'];
export const HK_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
export const HK_STAFF = ['Shazia Bibi', 'Rukhsana Akhtar', 'Imran Masih', 'Nasreen Kausar', 'Javed Iqbal', 'Parveen Gill'];
export const initialHotelHousekeeping = demo([
  { id: 'hk-01', roomNumber: '103', task: 'Turnover clean', assignee: 'Shazia Bibi', priority: 'High', status: 'In Progress', due: isoDay(0), notes: 'Next arrival 2 PM' },
  { id: 'hk-02', roomNumber: '206', task: 'Turnover clean', assignee: 'Rukhsana Akhtar', priority: 'Medium', status: 'To Do', due: isoDay(0) },
  { id: 'hk-03', roomNumber: '405', task: 'Turnover clean', assignee: 'Imran Masih', priority: 'Urgent', status: 'To Do', due: isoDay(0), notes: 'VIP arriving — inspect after clean' },
  { id: 'hk-04', roomNumber: '106', task: 'Maintenance', assignee: 'Javed Iqbal', priority: 'High', status: 'In Progress', due: isoDay(1), notes: 'AC compressor replacement' },
  { id: 'hk-05', roomNumber: '203', task: 'Inspection', assignee: 'Nasreen Kausar', priority: 'High', status: 'Inspection', due: isoDay(0), notes: 'Arrival today' },
  { id: 'hk-06', roomNumber: '304', task: 'Inspection', assignee: 'Nasreen Kausar', priority: 'Medium', status: 'Inspection', due: isoDay(0) },
  { id: 'hk-07', roomNumber: '501', task: 'Stay-over service', assignee: 'Parveen Gill', priority: 'Medium', status: 'Done', due: isoDay(0) },
  { id: 'hk-08', roomNumber: '503', task: 'Turndown', assignee: 'Parveen Gill', priority: 'Low', status: 'To Do', due: isoDay(0), notes: 'Evening turndown 7 PM' },
  { id: 'hk-09', roomNumber: '201', task: 'Stay-over service', assignee: 'Shazia Bibi', priority: 'Low', status: 'Done', due: isoDay(0) },
  { id: 'hk-10', roomNumber: '305', task: 'Stay-over service', assignee: 'Rukhsana Akhtar', priority: 'Low', status: 'In Progress', due: isoDay(0) },
  { id: 'hk-11', roomNumber: '406', task: 'Deep clean', assignee: 'Imran Masih', priority: 'Medium', status: 'Done', due: isoDay(-1) },
  { id: 'hk-12', roomNumber: '504', task: 'Inspection', assignee: 'Nasreen Kausar', priority: 'Medium', status: 'To Do', due: isoDay(0) },
]);

// ═══════════════════════════ RESTAURANT POS ══════════════════════════════
export const POS_TAX_RATE = 0.16;
export const MENU_CATEGORIES = ['Starters', 'BBQ & Tandoor', 'Karahi & Handi', 'Rice', 'Breads', 'Desserts', 'Beverages'];
export const MENU_STATIONS = ['Grill', 'Tandoor', 'Kitchen', 'Cold', 'Bar'];
const menu = [
  ['Chicken Corn Soup', 'Starters', 450, 'Kitchen', 8, false, 'Classic Pakistani-Chinese soup with egg ribbons'],
  ['Dahi Baray', 'Starters', 380, 'Cold', 4, true, 'Lentil dumplings in spiced yoghurt and tamarind'],
  ['Chapli Kebab (2 pcs)', 'Starters', 950, 'Grill', 12, false, 'Peshawari minced beef patties, pomegranate seeds'],
  ['Chicken Tikka', 'BBQ & Tandoor', 1250, 'Grill', 18, false, 'Quarter leg piece marinated overnight'],
  ['Seekh Kebab (4 pcs)', 'BBQ & Tandoor', 1100, 'Grill', 15, false, 'Beef seekh with green chilli and coriander'],
  ['Malai Boti', 'BBQ & Tandoor', 1450, 'Grill', 16, false, 'Creamy boneless chicken, cardamom'],
  ['Fish Tikka', 'BBQ & Tandoor', 1600, 'Tandoor', 18, false, 'Sole fish in ajwain marinade'],
  ['Paneer Tikka', 'BBQ & Tandoor', 1150, 'Tandoor', 14, true, 'Cottage cheese, peppers and onion'],
  ['Chicken Karahi (half)', 'Karahi & Handi', 1850, 'Kitchen', 20, false, 'Tomato, ginger and green chilli'],
  ['Mutton Karahi (half)', 'Karahi & Handi', 3200, 'Kitchen', 25, false, 'Charsi-style, fresh mutton'],
  ['Chicken Handi', 'Karahi & Handi', 1750, 'Kitchen', 22, false, 'Boneless, cream and butter'],
  ['Daal Makhni', 'Karahi & Handi', 750, 'Kitchen', 12, true, 'Slow-cooked black lentils'],
  ['Palak Paneer', 'Karahi & Handi', 950, 'Kitchen', 14, true, 'Spinach with cottage cheese'],
  ['Chicken Biryani', 'Rice', 650, 'Kitchen', 6, false, 'Sindhi-style with aloo and plum'],
  ['Mutton Pulao', 'Rice', 950, 'Kitchen', 6, false, 'Yakhni pulao with raita'],
  ['Plain Rice', 'Rice', 350, 'Kitchen', 4, true, 'Steamed basmati'],
  ['Garlic Naan', 'Breads', 150, 'Tandoor', 5, true, ''],
  ['Roghni Naan', 'Breads', 120, 'Tandoor', 5, true, ''],
  ['Tandoori Roti', 'Breads', 60, 'Tandoor', 3, true, ''],
  ['Kheer', 'Desserts', 350, 'Cold', 2, true, 'Rice pudding with pistachio'],
  ['Gulab Jamun (2 pcs)', 'Desserts', 300, 'Cold', 2, true, ''],
  ['Gajar Halwa', 'Desserts', 450, 'Kitchen', 4, true, 'Seasonal — winter special'],
  ['Mint Margarita', 'Beverages', 450, 'Bar', 3, true, ''],
  ['Sweet Lassi', 'Beverages', 350, 'Bar', 3, true, ''],
  ['Doodh Patti Chai', 'Beverages', 180, 'Bar', 4, true, ''],
  ['Fresh Lime Soda', 'Beverages', 300, 'Bar', 2, true, ''],
  ['Mineral Water (1.5L)', 'Beverages', 150, 'Bar', 1, true, ''],
];
export const initialPosMenuItems = demo(menu.map(([name, category, price, station, prepTime, veg, description], i) => ({
  id: `menu-${pad(i + 1)}`,
  name, category, price, station, prepTime,
  diet: veg ? 'Vegetarian' : 'Non-veg',
  availability: name === 'Fish Tikka' || name === 'Gajar Halwa' ? 'Sold Out' : 'Available',
  description,
  popular: ['Chicken Tikka', 'Chicken Karahi (half)', 'Chicken Biryani', 'Garlic Naan', 'Mint Margarita', 'Seekh Kebab (4 pcs)'].includes(name),
})));

export const TABLE_AREAS = ['Main Hall', 'Family Hall', 'Rooftop'];
export const TABLE_STATUSES = ['Free', 'Occupied', 'Reserved', 'Cleaning'];
export const POS_SERVERS = ['Asif Mehmood', 'Sobia Naz', 'Kashif Ali', 'Uzma Perveen'];
const tablePlan = [
  ['T1', 'Main Hall', 4, 'Occupied', 'Asif Mehmood', 3, 38], ['T2', 'Main Hall', 2, 'Free'], ['T3', 'Main Hall', 4, 'Reserved', null, 0, 0, '20:00', 'Raza family (5)'],
  ['T4', 'Main Hall', 2, 'Occupied', 'Sobia Naz', 2, 12], ['T5', 'Main Hall', 6, 'Free'], ['T6', 'Main Hall', 4, 'Occupied', 'Asif Mehmood', 4, 54],
  ['T7', 'Main Hall', 2, 'Cleaning'], ['T8', 'Main Hall', 8, 'Occupied', 'Kashif Ali', 7, 22],
  ['F1', 'Family Hall', 6, 'Occupied', 'Uzma Perveen', 6, 41], ['F2', 'Family Hall', 6, 'Free'], ['F3', 'Family Hall', 8, 'Reserved', null, 0, 0, '20:30', 'Malik birthday (8)'], ['F4', 'Family Hall', 4, 'Occupied', 'Uzma Perveen', 3, 9],
  ['R1', 'Rooftop', 2, 'Free'], ['R2', 'Rooftop', 4, 'Occupied', 'Kashif Ali', 2, 27], ['R3', 'Rooftop', 4, 'Free'], ['R4', 'Rooftop', 6, 'Reserved', null, 0, 0, '21:00', 'Corporate — HBL (6)'],
];
export const initialPosTables = demo(tablePlan.map(([label, area, seats, status, server, guests, seatedMin, reservedAt, reservedFor]) => ({
  id: `table-${label.toLowerCase()}`,
  label, area, seats, status,
  server: server || '',
  guests: guests || 0,
  seatedAt: status === 'Occupied' ? minutesAgo(seatedMin) : '',
  reservedAt: reservedAt || '',
  reservedFor: reservedFor || '',
})));

export const POS_ORDER_STATUSES = ['New', 'Preparing', 'Ready', 'Served', 'Paid', 'Cancelled'];
export const POS_ORDER_TYPES = ['Dine-in', 'Takeaway', 'Delivery'];
const menuById = Object.fromEntries(initialPosMenuItems.map(m => [m.id, m]));
export const orderTotals = (items = []) => {
  const subtotal = items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 0), 0);
  const tax = Math.round(subtotal * POS_TAX_RATE);
  return { subtotal, tax, total: subtotal + tax };
};
const orderPlan = [
  // [table, type, status, minutesAgo, server, [[menuIndex, qty]...], note]
  ['T1', 'Dine-in', 'Served', 36, 'Asif Mehmood', [[4, 2], [9, 1], [17, 4], [23, 3]]],
  ['T4', 'Dine-in', 'Preparing', 10, 'Sobia Naz', [[6, 1], [17, 2], [24, 2]]],
  ['T6', 'Dine-in', 'Ready', 25, 'Asif Mehmood', [[10, 1], [5, 1], [18, 4], [26, 2]]],
  ['T8', 'Dine-in', 'Preparing', 18, 'Kashif Ali', [[3, 2], [4, 3], [14, 3], [17, 6], [23, 4]], 'Two kids meals — less spicy'],
  ['F1', 'Dine-in', 'Served', 39, 'Uzma Perveen', [[9, 2], [12, 1], [17, 6], [21, 3]]],
  ['F4', 'Dine-in', 'New', 3, 'Uzma Perveen', [[1, 1], [11, 1], [19, 3], [25, 3]]],
  ['R2', 'Dine-in', 'New', 1, 'Kashif Ali', [[4, 1], [8, 1], [17, 2], [23, 2]]],
  ['', 'Takeaway', 'Preparing', 7, 'Sobia Naz', [[14, 3], [16, 3]], 'Customer waiting at counter'],
  ['', 'Delivery', 'Ready', 15, 'Kashif Ali', [[3, 1], [14, 2], [17, 2]], 'Rider: Foodpanda-style partner'],
  ['', 'Takeaway', 'New', 2, 'Asif Mehmood', [[2, 2], [22, 2]]],
  ['T2', 'Dine-in', 'Paid', 140, 'Sobia Naz', [[5, 1], [17, 2], [26, 1]]],
  ['T5', 'Dine-in', 'Paid', 190, 'Asif Mehmood', [[9, 1], [10, 1], [17, 6], [20, 4], [24, 6]]],
  ['', 'Delivery', 'Paid', 230, 'Kashif Ali', [[13, 4], [15, 2]]],
  ['T7', 'Dine-in', 'Paid', 70, 'Uzma Perveen', [[0, 2], [6, 1], [18, 2]]],
  ['', 'Takeaway', 'Cancelled', 95, 'Sobia Naz', [[3, 1]], 'Customer cancelled — no-show'],
];
export const initialPosOrders = demo(orderPlan.map(([table, type, status, ago, server, lines, note], i) => {
  const items = lines.map(([mi, qty]) => {
    const m = initialPosMenuItems[mi];
    return { itemId: m.id, name: m.name, price: m.price, qty, station: m.station, done: status === 'Ready' || status === 'Served' || status === 'Paid' };
  });
  const totals = orderTotals(items);
  const created = minutesAgo(ago);
  return {
    id: `pos-${pad(i + 1)}`,
    code: `#${1041 + i}`,
    table,
    type,
    status,
    server,
    items,
    itemsSummary: items.map(it => `${it.qty}× ${it.name}`).join(', '),
    ...totals,
    payment: status === 'Paid' ? (i % 2 ? 'Card' : 'Cash') : '',
    notes: note || '',
    createdAt: created,
    firedAt: status === 'New' ? '' : created,
    readyAt: ['Ready', 'Served', 'Paid'].includes(status) ? minutesAgo(Math.max(0, ago - 14)) : '',
  };
}));
export { menuById };

// ═══════════════════════════ FOOD DELIVERY ═══════════════════════════════
export const DELIVERY_STAGES = ['Placed', 'Preparing', 'Picked Up', 'On the Way', 'Delivered', 'Cancelled'];
export const DELIVERY_PAYMENTS = ['Cash on delivery', 'Card', 'Wallet'];
export const ZONE_STATUSES = ['Active', 'Surge', 'Paused'];
export const RIDER_STATUSES = ['Online', 'On Delivery', 'Offline'];
export const RIDER_VEHICLES = ['Motorbike', 'Scooter', 'Bicycle'];
export const RESTAURANT_STATUSES = ['Active', 'Paused', 'Onboarding'];

export const initialDeliveryZones = demo([
  { id: 'zone-01', name: 'DHA Phase 6', city: 'Karachi', fee: 149, eta: 28, minOrder: 800, radiusKm: 4.5, status: 'Active', mapX: 30, mapY: 70, color: 'primary' },
  { id: 'zone-02', name: 'Clifton', city: 'Karachi', fee: 129, eta: 25, minOrder: 700, radiusKm: 3.8, status: 'Surge', mapX: 18, mapY: 52, color: 'warning' },
  { id: 'zone-03', name: 'Gulshan-e-Iqbal', city: 'Karachi', fee: 99, eta: 32, minOrder: 600, radiusKm: 6.0, status: 'Active', mapX: 62, mapY: 34, color: 'info' },
  { id: 'zone-04', name: 'PECHS & Tariq Road', city: 'Karachi', fee: 99, eta: 26, minOrder: 600, radiusKm: 3.2, status: 'Active', mapX: 44, mapY: 40, color: 'success' },
  { id: 'zone-05', name: 'North Nazimabad', city: 'Karachi', fee: 119, eta: 35, minOrder: 600, radiusKm: 5.0, status: 'Paused', mapX: 50, mapY: 14, color: 'gray' },
  { id: 'zone-06', name: 'Gulberg', city: 'Lahore', fee: 109, eta: 24, minOrder: 700, radiusKm: 4.0, status: 'Active', mapX: 72, mapY: 66, color: 'accent' },
  { id: 'zone-07', name: 'Johar Town', city: 'Lahore', fee: 99, eta: 30, minOrder: 600, radiusKm: 5.5, status: 'Active', mapX: 84, mapY: 82, color: 'danger' },
  { id: 'zone-08', name: 'DHA Phase 5', city: 'Lahore', fee: 149, eta: 27, minOrder: 900, radiusKm: 4.2, status: 'Surge', mapX: 88, mapY: 48, color: 'primary' },
]);

export const initialDeliveryRestaurants = demo([
  { id: 'rest-01', name: 'Karachi Biryani House', cuisine: 'Biryani & Rice', city: 'Karachi', zone: 'Gulshan-e-Iqbal', rating: 4.6, commission: 22, avgPrep: 14, status: 'Active', ordersToday: 186, contact: '+92 21 3480 1122' },
  { id: 'rest-02', name: 'Burns Road Nihari Co.', cuisine: 'Desi', city: 'Karachi', zone: 'PECHS & Tariq Road', rating: 4.8, commission: 20, avgPrep: 12, status: 'Active', ordersToday: 142, contact: '+92 21 3221 4455' },
  { id: 'rest-03', name: 'Sea Breeze Grill', cuisine: 'Seafood & BBQ', city: 'Karachi', zone: 'Clifton', rating: 4.4, commission: 25, avgPrep: 22, status: 'Active', ordersToday: 97, contact: '+92 21 3587 9900' },
  { id: 'rest-04', name: 'Slice & Stone Pizza', cuisine: 'Pizza', city: 'Karachi', zone: 'DHA Phase 6', rating: 4.3, commission: 24, avgPrep: 18, status: 'Active', ordersToday: 211, contact: '+92 21 3530 6677' },
  { id: 'rest-05', name: 'Chai Khana Express', cuisine: 'Cafe & Breakfast', city: 'Karachi', zone: 'North Nazimabad', rating: 4.1, commission: 18, avgPrep: 9, status: 'Paused', ordersToday: 0, contact: '+92 21 3661 2030' },
  { id: 'rest-06', name: 'Lahori Tikka Corner', cuisine: 'BBQ', city: 'Lahore', zone: 'Gulberg', rating: 4.7, commission: 21, avgPrep: 20, status: 'Active', ordersToday: 164, contact: '+92 42 3571 8800' },
  { id: 'rest-07', name: 'Gawalmandi Halwa Puri', cuisine: 'Breakfast', city: 'Lahore', zone: 'Johar Town', rating: 4.5, commission: 19, avgPrep: 11, status: 'Active', ordersToday: 88, contact: '+92 42 3520 4411' },
  { id: 'rest-08', name: 'Wok This Way', cuisine: 'Chinese', city: 'Lahore', zone: 'DHA Phase 5', rating: 4.2, commission: 23, avgPrep: 16, status: 'Active', ordersToday: 119, contact: '+92 42 3569 1290' },
  { id: 'rest-09', name: 'Green Bowl Salads', cuisine: 'Healthy', city: 'Lahore', zone: 'Gulberg', rating: 4.0, commission: 20, avgPrep: 10, status: 'Onboarding', ordersToday: 0, contact: '+92 42 3578 3344' },
  { id: 'rest-10', name: 'Shawarma Junction', cuisine: 'Fast Food', city: 'Karachi', zone: 'Clifton', rating: 4.3, commission: 22, avgPrep: 8, status: 'Active', ordersToday: 233, contact: '+92 21 3583 7711' },
]);

const riderNames = ['Waqas Ahmed', 'Naveed Khan', 'Sajid Ali', 'Irfan Baloch', 'Adnan Shah', 'Zeeshan Haider', 'Faisal Mehmood', 'Asad Iqbal', 'Rizwan Butt', 'Shoaib Akhtar', 'Tariq Jamil', 'Kamran Abbasi'];
const riderStatus = ['On Delivery', 'On Delivery', 'Online', 'On Delivery', 'Offline', 'On Delivery', 'Online', 'On Delivery', 'On Delivery', 'Online', 'Offline', 'On Delivery'];
export const initialDeliveryRiders = demo(riderNames.map((name, i) => ({
  id: `rider-${pad(i + 1)}`,
  name,
  phone: `+92 3${between(0, 4)}${between(0, 9)} ${between(1000000, 9999999)}`,
  vehicle: i === 9 ? 'Bicycle' : i % 4 === 3 ? 'Scooter' : 'Motorbike',
  zone: initialDeliveryZones[i % initialDeliveryZones.length].name,
  status: riderStatus[i],
  rating: Number((4.2 + rand() * 0.7).toFixed(1)),
  deliveriesToday: riderStatus[i] === 'Offline' ? 0 : between(6, 19),
  totalDeliveries: between(320, 4200),
  earningsToday: riderStatus[i] === 'Offline' ? 0 : between(1800, 5200),
  joined: isoDay(-between(60, 900)),
})));

const deliveryPlan = [
  // [customer, restaurantIdx, zoneIdx, riderIdx|null, stage, minutesAgo, amount, payment, address]
  ['Hira Malik', 0, 2, 0, 'On the Way', 24, 1840, 'Cash on delivery', 'Block 13-D, Gulshan-e-Iqbal'],
  ['Saad Sheikh', 3, 0, 1, 'Picked Up', 19, 2650, 'Card', 'Khayaban-e-Ittehad, DHA Phase 6'],
  ['Mahnoor Abbasi', 1, 3, null, 'Preparing', 9, 1320, 'Wallet', 'Block 2, PECHS'],
  ['Taimur Rana', 9, 1, 3, 'On the Way', 31, 980, 'Cash on delivery', 'Boat Basin, Clifton'],
  ['Eman Javed', 5, 5, 5, 'On the Way', 22, 3210, 'Card', 'MM Alam Road, Gulberg III'],
  ['Arham Baig', 7, 7, null, 'Placed', 2, 2140, 'Card', 'Phase 5 Block L, DHA Lahore'],
  ['Rida Farooq', 6, 6, 7, 'Picked Up', 14, 890, 'Cash on delivery', 'Block R1, Johar Town'],
  ['Zain Mirza', 2, 1, null, 'Preparing', 12, 4520, 'Card', 'Zamzama Boulevard, Clifton'],
  ['Laiba Haider', 3, 0, 8, 'On the Way', 27, 1960, 'Wallet', 'Bukhari Commercial, DHA Phase 6'],
  ['Moiz Qureshi', 0, 2, null, 'Placed', 1, 1150, 'Cash on delivery', 'Block 7, Gulshan-e-Iqbal'],
  ['Kinza Awan', 9, 1, 11, 'Picked Up', 16, 1420, 'Card', 'Schon Circle, Clifton'],
  ['Shayan Raza', 5, 5, null, 'Preparing', 6, 2780, 'Card', 'Liberty Market, Gulberg'],
  ['Amna Butt', 1, 3, 0, 'Delivered', 85, 1640, 'Cash on delivery', 'Shahrah-e-Faisal, PECHS'],
  ['Haris Iqbal', 4, 4, null, 'Cancelled', 120, 760, 'Card', 'Block H, North Nazimabad'],
  ['Javeria Khan', 7, 7, 5, 'Delivered', 64, 2350, 'Wallet', 'Phase 5 Block C, DHA Lahore'],
  ['Talha Hussain', 3, 0, 1, 'Delivered', 110, 3080, 'Card', 'Phase 6 Muslim Commercial'],
  ['Sidra Siddiqui', 6, 6, 7, 'Delivered', 140, 640, 'Cash on delivery', 'Block J2, Johar Town'],
  ['Umer Chaudhry', 0, 2, 3, 'Delivered', 170, 2210, 'Card', 'Block 10-A, Gulshan-e-Iqbal'],
];
export const initialDeliveryOrders = demo(deliveryPlan.map(([customer, ri, zi, rdi, stage, ago, amount, payment, address], i) => {
  const zone = initialDeliveryZones[zi];
  const done = stage === 'Delivered';
  return {
    id: `dlv-${pad(i + 1)}`,
    code: `FD-${77200 + i}`,
    customer,
    phone: `+92 3${between(0, 4)}${between(0, 9)} ${between(1000000, 9999999)}`,
    restaurant: initialDeliveryRestaurants[ri].name,
    zone: zone.name,
    rider: rdi === null ? '' : initialDeliveryRiders[rdi].name,
    stage,
    amount,
    fee: zone.fee,
    payment,
    address,
    placedAt: minutesAgo(ago),
    eta: zone.eta,
    deliveredMins: done ? zone.eta + between(-6, 9) : null,
    rating: done ? between(3, 5) : null,
  };
}));

// ═══════════════════════════════ SCHOOL ══════════════════════════════════
export const SCHOOL_FEE_STATUSES = ['Paid', 'Partial', 'Overdue'];
export const STUDENT_STATUSES = ['Active', 'On Leave', 'Withdrawn'];
export const ATTENDANCE_MARKS = ['Present', 'Absent', 'Late', 'Leave'];
export const EXAM_STATUSES = ['Scheduled', 'In Progress', 'Results Entered', 'Published'];
export const EXAM_TYPES = ['Monthly Test', 'Mid-Term', 'Final Term', 'Mock Board'];

const classPlan = [
  ['Grade 6', 'A', 'Ms. Sadia Anwar', 'Room 104', 30, 6500, ['English', 'Urdu', 'Mathematics', 'Science', 'Islamiat', 'Social Studies']],
  ['Grade 6', 'B', 'Mr. Kashif Rehman', 'Room 105', 30, 6500, ['English', 'Urdu', 'Mathematics', 'Science', 'Islamiat', 'Social Studies']],
  ['Grade 7', 'A', 'Ms. Nida Zafar', 'Room 201', 32, 7000, ['English', 'Urdu', 'Mathematics', 'Science', 'Islamiat', 'Computer']],
  ['Grade 8', 'A', 'Mr. Waseem Akram', 'Room 202', 32, 7500, ['English', 'Urdu', 'Mathematics', 'Science', 'Islamiat', 'Computer']],
  ['Grade 9', 'A (Science)', 'Ms. Farah Naz', 'Lab Block 1', 35, 9000, ['English', 'Urdu', 'Mathematics', 'Physics', 'Chemistry', 'Biology']],
  ['Grade 9', 'B (Computer)', 'Mr. Adeel Hashmi', 'Lab Block 2', 35, 9000, ['English', 'Urdu', 'Mathematics', 'Physics', 'Chemistry', 'Computer Science']],
  ['Grade 10', 'A (Science)', 'Ms. Rabia Saleem', 'Room 301', 35, 9500, ['English', 'Urdu', 'Mathematics', 'Physics', 'Chemistry', 'Biology']],
  ['Grade 10', 'B (Computer)', 'Mr. Naeem Ullah', 'Room 302', 35, 9500, ['English', 'Urdu', 'Mathematics', 'Physics', 'Chemistry', 'Computer Science']],
];
export const initialSchoolClasses = demo(classPlan.map(([grade, section, teacher, room, capacity, fee, subjects], i) => ({
  id: `class-${pad(i + 1)}`,
  name: `${grade}-${section.split(' ')[0]}`,
  grade, section, teacher, room, capacity,
  monthlyFee: fee,
  subjects,
  timetable: i < 4 ? 'Mon–Fri · 7:45 AM – 1:30 PM' : 'Mon–Fri · 7:45 AM – 2:15 PM · Labs Tue/Thu',
})));

const students = [];
initialSchoolClasses.forEach((c, ci) => {
  for (let k = 0; k < 7; k += 1) {
    const first = FIRST[(ci * 7 + k * 5) % FIRST.length];
    const last = LAST[(ci * 3 + k * 7) % LAST.length];
    const guardianFirst = ['Muhammad', 'Abdul', 'Syed', 'Khalid', 'Nadeem', 'Tahir', 'Rashid', 'Shahid'][(ci + k) % 8];
    const n = students.length + 1;
    const feeStatus = n % 9 === 0 ? 'Overdue' : n % 6 === 0 ? 'Partial' : 'Paid';
    students.push({
      id: `stu-${String(n).padStart(3, '0')}`,
      name: `${first} ${last}`,
      rollNo: `MGS-${26}${String(n).padStart(3, '0')}`,
      classId: c.id,
      className: c.name,
      gender: GIRLS.has(first) ? 'Female' : 'Male',
      guardian: `${guardianFirst} ${last}`,
      guardianPhone: `+92 3${between(0, 4)}${between(0, 9)} ${between(1000000, 9999999)}`,
      monthlyFee: c.monthlyFee,
      feeStatus,
      feeDue: feeStatus === 'Paid' ? 0 : feeStatus === 'Partial' ? Math.round(c.monthlyFee / 2) : c.monthlyFee * 2,
      admissionDate: isoDay(-between(200, 2200)),
      status: n === 17 ? 'On Leave' : 'Active',
      city: ['Lahore', 'Lahore', 'Lahore', 'Karachi', 'Islamabad'][n % 5],
    });
  }
});
export const initialSchoolStudents = demo(students);

// Last 6 school days (Mon–Fri) for every class.
const schoolDays = [];
for (let off = -1; schoolDays.length < 6; off -= 1) {
  const d = new Date(); d.setDate(d.getDate() + off);
  if (d.getDay() !== 0 && d.getDay() !== 6) schoolDays.push(isoDay(off));
}
export const attendanceCounts = (marks = {}) => {
  const c = { present: 0, absent: 0, late: 0, leave: 0 };
  Object.values(marks).forEach(m => {
    if (m === 'Present') c.present += 1; else if (m === 'Absent') c.absent += 1; else if (m === 'Late') c.late += 1; else if (m === 'Leave') c.leave += 1;
  });
  return c;
};
const attendance = [];
initialSchoolClasses.forEach((c) => {
  const roster = students.filter(s => s.classId === c.id);
  schoolDays.forEach((date) => {
    const marks = {};
    roster.forEach((s) => {
      const r = rand();
      marks[s.id] = s.status === 'On Leave' ? 'Leave' : r < 0.86 ? 'Present' : r < 0.93 ? 'Late' : 'Absent';
    });
    attendance.push({ id: `att-${c.id}-${date}`, classId: c.id, className: c.name, date, marks, ...attendanceCounts(marks), takenBy: c.teacher });
  });
});
export const initialSchoolAttendance = demo(attendance);

const examPlan = [
  // [classIdx, subject, type, dayOffset, total, status]
  [6, 'Mathematics', 'Mid-Term', -12, 100, 'Published'],
  [6, 'Physics', 'Mid-Term', -11, 75, 'Published'],
  [4, 'Chemistry', 'Mid-Term', -10, 75, 'Results Entered'],
  [3, 'English', 'Monthly Test', -6, 50, 'Published'],
  [0, 'Science', 'Monthly Test', -4, 50, 'Results Entered'],
  [7, 'Computer Science', 'Mock Board', 3, 75, 'Scheduled'],
  [2, 'Mathematics', 'Monthly Test', 5, 50, 'Scheduled'],
  [5, 'Urdu', 'Mid-Term', 8, 75, 'Scheduled'],
  [1, 'English', 'Monthly Test', 0, 50, 'In Progress'],
];
export const initialSchoolExams = demo(examPlan.map(([ci, subject, type, off, total, status], i) => {
  const c = initialSchoolClasses[ci];
  const results = {};
  if (status === 'Published' || status === 'Results Entered') {
    students.filter(s => s.classId === c.id).forEach((s) => {
      results[s.id] = Math.min(total, Math.round(total * (0.42 + rand() * 0.56)));
    });
  }
  return {
    id: `exam-${pad(i + 1)}`,
    title: `${type} — ${subject}`,
    classId: c.id,
    className: c.name,
    subject, type,
    date: isoDay(off),
    totalMarks: total,
    passMarks: Math.round(total * 0.4),
    invigilator: c.teacher,
    status,
    results,
  };
}));

// ═════════════════════════════════ SEO ═══════════════════════════════════
export const SEO_INTENTS = ['Informational', 'Commercial', 'Transactional', 'Navigational'];
export const SEO_ENGINES = ['Google', 'Bing'];
export const BACKLINK_STATUSES = ['Active', 'New', 'Lost', 'Toxic'];
export const BACKLINK_TYPES = ['Dofollow', 'Nofollow', 'UGC', 'Sponsored'];
export const AUDIT_SEVERITIES = ['Critical', 'Warning', 'Notice'];
export const AUDIT_CATEGORIES = ['Technical', 'Content', 'Performance', 'Links', 'Mobile', 'Structured data'];
export const AUDIT_STATUSES = ['Open', 'Fixed', 'Ignored'];
export const SEO_SITE = 'meridianqm.com.pk';

const kwPlan = [
  ['iso 9001 certification pakistan', '/services/iso-9001', 3, 6, 4400, 58, 'Commercial'],
  ['iso 9001 consultant lahore', '/locations/lahore', 2, 4, 1300, 41, 'Transactional'],
  ['iso 14001 training', '/training/iso-14001', 7, 5, 1900, 46, 'Commercial'],
  ['quality management system', '/blog/what-is-a-qms', 12, 15, 22000, 72, 'Informational'],
  ['iso 45001 requirements', '/blog/iso-45001-requirements', 9, 8, 2900, 49, 'Informational'],
  ['internal audit checklist', '/resources/internal-audit-checklist', 5, 11, 6600, 52, 'Informational'],
  ['haccp certification karachi', '/services/haccp', 4, 3, 880, 33, 'Transactional'],
  ['iso 22000 food safety', '/services/iso-22000', 11, 9, 2400, 55, 'Commercial'],
  ['lead auditor course pakistan', '/training/lead-auditor', 1, 2, 1600, 38, 'Transactional'],
  ['capa process', '/blog/capa-process-guide', 18, 24, 5400, 61, 'Informational'],
  ['document control software', '/product/document-control', 27, 22, 3600, 68, 'Commercial'],
  ['iso 17025 accreditation', '/services/iso-17025', 6, 6, 1000, 44, 'Commercial'],
  ['meridian quality management', '/', 1, 1, 720, 8, 'Navigational'],
  ['root cause analysis template', '/resources/rca-template', 14, 19, 8100, 57, 'Informational'],
  ['gmp certification pakistan', '/services/gmp', 8, 7, 590, 36, 'Commercial'],
  ['iso 27001 consultant', '/services/iso-27001', 21, 16, 2900, 66, 'Commercial'],
  ['supplier audit form', '/resources/supplier-audit-form', 10, 13, 1300, 34, 'Informational'],
  ['iso certification cost in pakistan', '/pricing', 4, 9, 1900, 39, 'Transactional'],
  ['six sigma green belt lahore', '/training/six-sigma', 16, 12, 1000, 48, 'Transactional'],
  ['risk register example', '/blog/risk-register', 33, 41, 4400, 59, 'Informational'],
];
export const initialSeoKeywords = demo(kwPlan.map(([keyword, url, position, previous, volume, difficulty, intent], i) => {
  const history = [];
  let p = previous + between(2, 8);
  for (let w = 0; w < 7; w += 1) {
    history.push(Math.max(1, p));
    p += Math.round((previous - p) / 2 + (rand() - 0.5) * 3);
  }
  history.push(previous, position);
  return {
    id: `kw-${pad(i + 1)}`,
    keyword, url, position, previous, volume, difficulty, intent,
    engine: i % 6 === 5 ? 'Bing' : 'Google',
    cpc: between(40, 520),
    history: history.slice(-8),
    tags: [url.split('/')[1] || 'home'],
    updated: isoDay(0),
  };
}));

const blPlan = [
  ['dawn.com', 92, 'Dofollow', 'Active', 'ISO certification rising among SMEs', '/services/iso-9001', -140],
  ['tribune.com.pk', 90, 'Dofollow', 'Active', 'Meridian Quality Management', '/', -98],
  ['propakistani.pk', 74, 'Dofollow', 'New', 'quality management system', '/blog/what-is-a-qms', -4],
  ['brecorder.com', 81, 'Nofollow', 'Active', 'export compliance consultants', '/services/iso-22000', -210],
  ['iso.org', 93, 'Nofollow', 'Active', 'certification body list', '/', -365],
  ['lums.edu.pk', 78, 'Dofollow', 'Active', 'industry partner', '/training/lead-auditor', -60],
  ['qualitydigest.com', 71, 'Dofollow', 'New', 'CAPA guide', '/blog/capa-process-guide', -2],
  ['medium.com', 95, 'UGC', 'Active', 'internal audit checklist', '/resources/internal-audit-checklist', -45],
  ['reddit.com', 97, 'UGC', 'Lost', 'iso 9001 consultant', '/locations/lahore', -120],
  ['free-seo-dir-links.biz', 6, 'Dofollow', 'Toxic', 'best iso cheap', '/', -30],
  ['linkfarm-pk.xyz', 3, 'Dofollow', 'Toxic', 'click here', '/pricing', -22],
  ['smeda.org.pk', 69, 'Dofollow', 'Active', 'certification support', '/services/iso-9001', -300],
  ['techjuice.pk', 66, 'Dofollow', 'Lost', 'document control software', '/product/document-control', -180],
  ['asq.org', 84, 'Nofollow', 'Active', 'root cause analysis template', '/resources/rca-template', -75],
  ['linkedin.com', 98, 'Nofollow', 'Active', 'Meridian QM', '/', -400],
  ['pakobserver.net', 58, 'Sponsored', 'New', 'HACCP certification Karachi', '/services/haccp', -6],
];
export const initialSeoBacklinks = demo(blPlan.map(([domain, authority, type, status, anchor, target, off], i) => ({
  id: `bl-${pad(i + 1)}`,
  domain,
  sourceUrl: `https://${domain}/${['articles', 'news', 'blog', 'resources'][i % 4]}/${anchor.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
  targetUrl: target,
  anchor, authority, type, status,
  firstSeen: isoDay(off),
  lastChecked: isoDay(status === 'Lost' ? -8 : 0),
})));

const auditPlan = [
  ['Broken internal links (404)', 'Links', 'Critical', 'Open', 14, '/blog/*'],
  ['Pages blocked by robots.txt', 'Technical', 'Critical', 'Open', 3, '/training/*'],
  ['Largest Contentful Paint over 4s', 'Performance', 'Critical', 'Open', 6, '/services/iso-9001'],
  ['Missing canonical tag', 'Technical', 'Warning', 'Open', 22, '/resources/*'],
  ['Duplicate meta descriptions', 'Content', 'Warning', 'Open', 18, '/locations/*'],
  ['Images without alt text', 'Content', 'Warning', 'Fixed', 41, 'site-wide'],
  ['Cumulative Layout Shift 0.21', 'Performance', 'Warning', 'Open', 4, '/'],
  ['Title tags over 60 characters', 'Content', 'Notice', 'Open', 27, '/blog/*'],
  ['Redirect chains (3+ hops)', 'Technical', 'Warning', 'Fixed', 5, '/old-site/*'],
  ['Mixed content (HTTP assets)', 'Technical', 'Critical', 'Fixed', 2, '/pricing'],
  ['Tap targets too close', 'Mobile', 'Warning', 'Open', 9, '/training/*'],
  ['Viewport not set', 'Mobile', 'Critical', 'Fixed', 1, '/landing/expo-2026'],
  ['Missing FAQ schema', 'Structured data', 'Notice', 'Open', 12, '/services/*'],
  ['Orphan pages (no internal links)', 'Links', 'Notice', 'Open', 7, '/resources/*'],
  ['Low word count (< 300)', 'Content', 'Notice', 'Ignored', 11, '/locations/*'],
  ['Hreflang errors', 'Technical', 'Notice', 'Open', 4, '/ur/*'],
  ['Uncompressed JavaScript', 'Performance', 'Warning', 'Open', 8, 'site-wide'],
  ['Invalid Organization schema', 'Structured data', 'Warning', 'Fixed', 1, '/'],
];
export const initialSeoAuditIssues = demo(auditPlan.map(([title, category, severity, status, affected, pages], i) => ({
  id: `audit-${pad(i + 1)}`,
  title, category, severity, status,
  affectedPages: affected,
  pages,
  detected: isoDay(-between(1, 30)),
  fixedOn: status === 'Fixed' ? isoDay(-between(0, 6)) : '',
})));
