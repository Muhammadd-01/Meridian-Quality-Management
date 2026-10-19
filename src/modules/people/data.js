/**
 * Seed data for the people module group (hospital, HRM, AI analytics,
 * users & access, helpdesk). Every seeded record carries `isDemo: true`.
 * Dates are relative to the day the browser first loads the seed, so
 * "today" views (ER queue, appointment book, attendance) have content.
 */
import { dayOffset, minutesAgo, hoursAgo, monthKey, today } from './lib/util';
import { computePayslip, DEPARTMENTS } from './lib/hr';
import { billTotal } from './lib/hospital';

const demo = (records) => records.map(r => ({ ...r, isDemo: true }));

// Deterministic pseudo-random numbers so the seed is stable between reloads.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, list) => list[Math.floor(r() * list.length)];

// ─────────────────────────────── Hospital ───────────────────────────────

export const initialDoctors = demo([
  { id: 'doc-01', name: 'Dr. Ayesha Rehman', specialty: 'Cardiology', email: 'ayesha.rehman@meridianhospital.pk', phone: '+92 300 4412870', room: 'Room 204', availability: 'Available', shift: 'Morning', startTime: '09:00', endTime: '17:00', fee: 4000, experience: 16, rating: 4.9 },
  { id: 'doc-02', name: 'Dr. Imran Qureshi', specialty: 'Neurology', email: 'imran.qureshi@meridianhospital.pk', phone: '+92 321 5523018', room: 'Room 118', availability: 'Available', shift: 'Morning', startTime: '09:00', endTime: '15:00', fee: 4500, experience: 19, rating: 4.8 },
  { id: 'doc-03', name: 'Dr. Farhan Siddiqui', specialty: 'Orthopedics', email: 'farhan.siddiqui@meridianhospital.pk', phone: '+92 333 7710245', room: 'Room 221', availability: 'In Surgery', shift: 'Morning', startTime: '10:00', endTime: '16:00', fee: 3500, experience: 12, rating: 4.6 },
  { id: 'doc-04', name: 'Dr. Sana Javed', specialty: 'Pediatrics', email: 'sana.javed@meridianhospital.pk', phone: '+92 345 2209981', room: 'Room 302', availability: 'Available', shift: 'Morning', startTime: '09:00', endTime: '17:00', fee: 3000, experience: 10, rating: 4.9 },
  { id: 'doc-05', name: 'Dr. Kashif Mehmood', specialty: 'General Medicine', email: 'kashif.mehmood@meridianhospital.pk', phone: '+92 300 8834120', room: 'Room 110', availability: 'On Call', shift: 'Evening', startTime: '14:00', endTime: '22:00', fee: 2500, experience: 14, rating: 4.5 },
  { id: 'doc-06', name: 'Dr. Nadia Hussain', specialty: 'Obstetrics & Gynecology', email: 'nadia.hussain@meridianhospital.pk', phone: '+92 312 6671093', room: 'Room 310', availability: 'Available', shift: 'Morning', startTime: '09:00', endTime: '14:00', fee: 4000, experience: 17, rating: 4.8 },
  { id: 'doc-07', name: 'Dr. Usman Ghani', specialty: 'Emergency Medicine', email: 'usman.ghani@meridianhospital.pk', phone: '+92 301 9902341', room: 'ER Bay 1', availability: 'Available', shift: 'Night', startTime: '20:00', endTime: '23:30', fee: 2000, experience: 9, rating: 4.7 },
  { id: 'doc-08', name: 'Dr. Hira Batool', specialty: 'Radiology', email: 'hira.batool@meridianhospital.pk', phone: '+92 322 4418762', room: 'Radiology 2', availability: 'On Leave', shift: 'Morning', startTime: '09:00', endTime: '17:00', fee: 3000, experience: 11, rating: 4.6 },
  { id: 'doc-09', name: 'Dr. Ali Raza', specialty: 'Cardiology', email: 'ali.raza@meridianhospital.pk', phone: '+92 336 1127745', room: 'Room 206', availability: 'Off Duty', shift: 'Evening', startTime: '15:00', endTime: '21:00', fee: 3500, experience: 8, rating: 4.4 },
  { id: 'doc-10', name: 'Dr. Mehwish Anwar', specialty: 'Dermatology', email: 'mehwish.anwar@meridianhospital.pk', phone: '+92 315 8890034', room: 'Room 125', availability: 'Available', shift: 'Morning', startTime: '10:00', endTime: '16:00', fee: 3000, experience: 7, rating: 4.7 },
  { id: 'doc-11', name: 'Dr. Tariq Jamil', specialty: 'General Surgery', email: 'tariq.jamil@meridianhospital.pk', phone: '+92 300 2216658', room: 'OT 3', availability: 'In Surgery', shift: 'Morning', startTime: '08:00', endTime: '14:00', fee: 5000, experience: 22, rating: 4.9 },
  { id: 'doc-12', name: 'Dr. Rabia Khalid', specialty: 'ENT', email: 'rabia.khalid@meridianhospital.pk', phone: '+92 344 5507712', room: 'Room 132', availability: 'Available', shift: 'Morning', startTime: '09:00', endTime: '15:00', fee: 2500, experience: 6, rating: 4.5 },
]);

const INSURERS = ['Jubilee Life Health', 'State Life Sehat', 'EFU Health', 'Adamjee Health', 'Sehat Sahulat Card', 'Self-pay'];

export const initialPatients = demo([
  // Emergency queue
  { id: 'pat-01', mrn: 'MRN-2431', name: 'Khalid Mahmood', age: 54, gender: 'Male', phone: '+92 300 5521784', city: 'Lahore', bloodGroup: 'B+', department: 'Cardiology', doctor: 'Dr. Usman Ghani', status: 'Emergency', triage: 'P1 Critical', condition: 'Critical', complaint: 'Chest pain, suspected STEMI', arrivedAt: minutesAgo(4), admissionDate: today(), ward: '', bed: '', insurance: 'State Life Sehat' },
  { id: 'pat-02', mrn: 'MRN-2432', name: 'Areeba Shahid', age: 8, gender: 'Female', phone: '+92 321 4479012', city: 'Lahore', bloodGroup: 'O+', department: 'Pediatrics', doctor: 'Dr. Sana Javed', status: 'Emergency', triage: 'P1 Critical', condition: 'Unstable', complaint: 'Severe allergic reaction', arrivedAt: minutesAgo(11), admissionDate: today(), ward: '', bed: '', insurance: 'Jubilee Life Health' },
  { id: 'pat-03', mrn: 'MRN-2433', name: 'Waqas Akram', age: 32, gender: 'Male', phone: '+92 333 1104528', city: 'Sheikhupura', bloodGroup: 'A+', department: 'Orthopedics', doctor: 'Dr. Farhan Siddiqui', status: 'Emergency', triage: 'P2 Urgent', condition: 'Guarded', complaint: 'Compound fracture, left tibia (road accident)', arrivedAt: minutesAgo(23), admissionDate: today(), ward: '', bed: '', insurance: 'Self-pay' },
  { id: 'pat-04', mrn: 'MRN-2434', name: 'Shabana Begum', age: 67, gender: 'Female', phone: '+92 301 7765430', city: 'Kasur', bloodGroup: 'O-', department: 'General Medicine', doctor: 'Dr. Kashif Mehmood', status: 'Emergency', triage: 'P2 Urgent', condition: 'Guarded', complaint: 'Acute abdominal pain', arrivedAt: minutesAgo(38), admissionDate: today(), ward: '', bed: '', insurance: 'Sehat Sahulat Card' },
  { id: 'pat-05', mrn: 'MRN-2435', name: 'Hamid Raza', age: 41, gender: 'Male', phone: '+92 345 6612097', city: 'Lahore', bloodGroup: 'AB+', department: 'General Medicine', doctor: 'Dr. Kashif Mehmood', status: 'Emergency', triage: 'P3 Standard', condition: 'Stable', complaint: 'High fever, dehydration (suspected dengue)', arrivedAt: minutesAgo(52), admissionDate: today(), ward: '', bed: '', insurance: 'EFU Health' },
  // Admitted
  { id: 'pat-06', mrn: 'MRN-2398', name: 'Nasreen Akhtar', age: 61, gender: 'Female', phone: '+92 300 8812234', city: 'Lahore', bloodGroup: 'A-', department: 'Cardiology', doctor: 'Dr. Ayesha Rehman', status: 'Admitted', triage: '', condition: 'Guarded', complaint: 'Unstable angina', arrivedAt: '', admissionDate: dayOffset(-3), ward: 'CARD', bed: '301-A', insurance: 'Jubilee Life Health' },
  { id: 'pat-07', mrn: 'MRN-2402', name: 'Muhammad Aslam', age: 72, gender: 'Male', phone: '+92 302 4410098', city: 'Gujranwala', bloodGroup: 'B+', department: 'Cardiology', doctor: 'Dr. Ayesha Rehman', status: 'Admitted', triage: '', condition: 'Stable', complaint: 'Post-angioplasty monitoring', arrivedAt: '', admissionDate: dayOffset(-2), ward: 'CARD', bed: '301-B', insurance: 'State Life Sehat' },
  { id: 'pat-08', mrn: 'MRN-2405', name: 'Fatima Zahra', age: 45, gender: 'Female', phone: '+92 311 2209876', city: 'Lahore', bloodGroup: 'O+', department: 'Cardiology', doctor: 'Dr. Ali Raza', status: 'Admitted', triage: '', condition: 'Stable', complaint: 'Arrhythmia under observation', arrivedAt: '', admissionDate: dayOffset(-1), ward: 'CARD', bed: '303', insurance: 'Adamjee Health' },
  { id: 'pat-09', mrn: 'MRN-2388', name: 'Javed Iqbal', age: 66, gender: 'Male', phone: '+92 300 9934512', city: 'Faisalabad', bloodGroup: 'A+', department: 'General Surgery', doctor: 'Dr. Tariq Jamil', status: 'Admitted', triage: '', condition: 'Critical', complaint: 'Post-op bowel resection', arrivedAt: '', admissionDate: dayOffset(-5), ward: 'ICU', bed: 'ICU-02', insurance: 'EFU Health' },
  { id: 'pat-10', mrn: 'MRN-2391', name: 'Rukhsana Parveen', age: 58, gender: 'Female', phone: '+92 333 5571209', city: 'Lahore', bloodGroup: 'B-', department: 'Neurology', doctor: 'Dr. Imran Qureshi', status: 'Admitted', triage: '', condition: 'Unstable', complaint: 'Ischaemic stroke', arrivedAt: '', admissionDate: dayOffset(-4), ward: 'ICU', bed: 'ICU-04', insurance: 'Sehat Sahulat Card' },
  { id: 'pat-11', mrn: 'MRN-2409', name: 'Bilal Ahmed', age: 29, gender: 'Male', phone: '+92 321 8823401', city: 'Lahore', bloodGroup: 'O+', department: 'General Medicine', doctor: 'Dr. Kashif Mehmood', status: 'Admitted', triage: '', condition: 'Stable', complaint: 'Dengue fever, platelet monitoring', arrivedAt: '', admissionDate: dayOffset(-2), ward: 'GEN', bed: 'G-03', insurance: 'Self-pay' },
  { id: 'pat-12', mrn: 'MRN-2411', name: 'Zubair Hassan', age: 6, gender: 'Male', phone: '+92 300 3345128', city: 'Lahore', bloodGroup: 'A+', department: 'Pediatrics', doctor: 'Dr. Sana Javed', status: 'Admitted', triage: '', condition: 'Stable', complaint: 'Pneumonia', arrivedAt: '', admissionDate: dayOffset(-3), ward: 'PED', bed: 'P-02', insurance: 'Jubilee Life Health' },
  { id: 'pat-13', mrn: 'MRN-2414', name: 'Mehreen Tariq', age: 28, gender: 'Female', phone: '+92 345 1198832', city: 'Lahore', bloodGroup: 'AB-', department: 'Obstetrics & Gynecology', doctor: 'Dr. Nadia Hussain', status: 'Admitted', triage: '', condition: 'Stable', complaint: 'C-section recovery', arrivedAt: '', admissionDate: dayOffset(-1), ward: 'MAT', bed: 'M-01', insurance: 'Adamjee Health' },
  { id: 'pat-14', mrn: 'MRN-2416', name: 'Saba Noreen', age: 31, gender: 'Female', phone: '+92 312 4456120', city: 'Okara', bloodGroup: 'O+', department: 'Obstetrics & Gynecology', doctor: 'Dr. Nadia Hussain', status: 'Admitted', triage: '', condition: 'Stable', complaint: 'Labour, monitored', arrivedAt: '', admissionDate: today(), ward: 'MAT', bed: 'M-03', insurance: 'Sehat Sahulat Card' },
  // Observation
  { id: 'pat-15', mrn: 'MRN-2420', name: 'Tahir Abbas', age: 50, gender: 'Male', phone: '+92 300 6672103', city: 'Lahore', bloodGroup: 'B+', department: 'General Medicine', doctor: 'Dr. Kashif Mehmood', status: 'Observation', triage: '', condition: 'Guarded', complaint: 'Uncontrolled diabetes, DKA risk', arrivedAt: '', admissionDate: today(), ward: 'GEN', bed: 'G-05', insurance: 'State Life Sehat' },
  // Outpatient
  { id: 'pat-16', mrn: 'MRN-2378', name: 'Ahmed Nawaz', age: 47, gender: 'Male', phone: '+92 333 8845561', city: 'Lahore', bloodGroup: 'A+', department: 'Cardiology', doctor: 'Dr. Ayesha Rehman', status: 'Outpatient', triage: '', condition: 'Stable', complaint: 'Hypertension follow-up', arrivedAt: '', admissionDate: '', ward: '', bed: '', insurance: 'EFU Health' },
  { id: 'pat-17', mrn: 'MRN-2380', name: 'Iqra Saleem', age: 24, gender: 'Female', phone: '+92 321 7783420', city: 'Lahore', bloodGroup: 'O+', department: 'Dermatology', doctor: 'Dr. Mehwish Anwar', status: 'Outpatient', triage: '', condition: 'Stable', complaint: 'Eczema review', arrivedAt: '', admissionDate: '', ward: '', bed: '', insurance: 'Self-pay' },
  { id: 'pat-18', mrn: 'MRN-2383', name: 'Shahzad Khan', age: 39, gender: 'Male', phone: '+92 300 1278834', city: 'Islamabad', bloodGroup: 'B+', department: 'ENT', doctor: 'Dr. Rabia Khalid', status: 'Outpatient', triage: '', condition: 'Stable', complaint: 'Chronic sinusitis', arrivedAt: '', admissionDate: '', ward: '', bed: '', insurance: 'Jubilee Life Health' },
  { id: 'pat-19', mrn: 'MRN-2385', name: 'Amna Riaz', age: 35, gender: 'Female', phone: '+92 345 9901276', city: 'Lahore', bloodGroup: 'A-', department: 'Neurology', doctor: 'Dr. Imran Qureshi', status: 'Outpatient', triage: '', condition: 'Stable', complaint: 'Migraine management', arrivedAt: '', admissionDate: '', ward: '', bed: '', insurance: 'Adamjee Health' },
  // Discharged
  { id: 'pat-20', mrn: 'MRN-2360', name: 'Ghulam Rasool', age: 70, gender: 'Male', phone: '+92 301 4456780', city: 'Sargodha', bloodGroup: 'O+', department: 'Cardiology', doctor: 'Dr. Ayesha Rehman', status: 'Discharged', triage: '', condition: 'Stable', complaint: 'Heart failure, stabilised', arrivedAt: '', admissionDate: dayOffset(-9), dischargeDate: dayOffset(-2), ward: '', bed: '', insurance: 'Sehat Sahulat Card' },
  { id: 'pat-21', mrn: 'MRN-2364', name: 'Sadia Kanwal', age: 26, gender: 'Female', phone: '+92 312 3301187', city: 'Lahore', bloodGroup: 'B+', department: 'Obstetrics & Gynecology', doctor: 'Dr. Nadia Hussain', status: 'Discharged', triage: '', condition: 'Stable', complaint: 'Normal delivery', arrivedAt: '', admissionDate: dayOffset(-4), dischargeDate: dayOffset(-1), ward: '', bed: '', insurance: 'Jubilee Life Health' },
  { id: 'pat-22', mrn: 'MRN-2367', name: 'Asif Mehmood', age: 44, gender: 'Male', phone: '+92 333 2287765', city: 'Lahore', bloodGroup: 'A+', department: 'Orthopedics', doctor: 'Dr. Farhan Siddiqui', status: 'Discharged', triage: '', condition: 'Stable', complaint: 'Knee arthroscopy', arrivedAt: '', admissionDate: dayOffset(-6), dischargeDate: dayOffset(-3), ward: '', bed: '', insurance: 'EFU Health' },
]);

// Beds: rooms per ward; occupants are linked to the admitted patients above.
const BED_LAYOUT = {
  CARD: ['301-A', '301-B', '302-A', '302-B', '303', '304-A', '304-B', '305-A', '305-B', '306'],
  ICU: ['ICU-01', 'ICU-02', 'ICU-03', 'ICU-04', 'ICU-05', 'ICU-06', 'ICU-07', 'ICU-08'],
  GEN: ['G-01', 'G-02', 'G-03', 'G-04', 'G-05', 'G-06', 'G-07', 'G-08'],
  PED: ['P-01', 'P-02', 'P-03', 'P-04', 'P-05', 'P-06'],
  MAT: ['M-01', 'M-02', 'M-03', 'M-04', 'M-05', 'M-06'],
};
const BED_STATE = {
  '302-B': ['Cleaning', 'Housekeeping Team B · ETA 15 min'], '305-B': ['Cleaning', 'Housekeeping Team A · ETA 8 min'],
  '304-A': ['Maintenance', 'Bed motor fault · ticket #482'], '305-A': ['Occupied', ''], '306': ['Occupied', ''],
  'ICU-01': ['Occupied', ''], 'ICU-03': ['Occupied', ''], 'ICU-05': ['Occupied', ''], 'ICU-06': ['Occupied', ''], 'ICU-07': ['Reserved', 'Held for MRN-2431 (ER)'],
  'G-01': ['Occupied', ''], 'G-02': ['Occupied', ''], 'G-06': ['Cleaning', 'Housekeeping Team A'], 'G-07': ['Occupied', ''],
  'P-04': ['Occupied', ''], 'M-02': ['Occupied', ''], 'M-06': ['Maintenance', 'Oxygen outlet check'],
};
// Occupants without a full patient record in the seed (long-stay beds).
const LONG_STAY = {
  '305-A': 'Nasir Hussain', '306': 'Kiran Shafiq', 'ICU-01': 'Rashid Latif', 'ICU-03': 'Bushra Naz', 'ICU-05': 'Sajid Ali',
  'ICU-06': 'Naveed Akhtar', 'G-01': 'Imtiaz Ahmed', 'G-02': 'Sughra Bibi', 'G-07': 'Parveen Akhtar', 'P-04': 'Hassan Ali', 'M-02': 'Uzma Khan',
};
const ROOM_TYPE = { CARD: 'Semi-private', ICU: 'ICU', GEN: 'General', PED: 'Pediatric', MAT: 'Maternity' };

export const initialBeds = demo(Object.entries(BED_LAYOUT).flatMap(([ward, codes]) => codes.map((code) => {
  const patient = initialPatients.find(p => p.bed === code && p.ward === ward && p.status !== 'Discharged');
  const [state, note] = BED_STATE[code] || [patient ? 'Occupied' : 'Available', ''];
  const occupant = patient?.name || (state === 'Occupied' ? LONG_STAY[code] : '');
  return {
    id: `bed-${code.toLowerCase()}`,
    code,
    ward,
    room: code.includes('-') && ward === 'CARD' ? `Room ${code.split('-')[0]}` : ward === 'CARD' ? `Room ${code}` : `Bay ${code.split('-')[0]}`,
    type: ROOM_TYPE[ward],
    status: patient ? 'Occupied' : state,
    patientId: patient?.id || '',
    patientName: occupant || '',
    since: patient?.admissionDate || (occupant ? dayOffset(-2) : ''),
    note,
    dailyRate: ward === 'ICU' ? 45000 : ward === 'CARD' ? 18000 : 9000,
  };
})));

export const initialAppointments = (() => {
  const r = rng(42);
  const names = ['Ahmed Nawaz', 'Iqra Saleem', 'Shahzad Khan', 'Amna Riaz', 'Rizwan Haider', 'Maryam Aftab', 'Tanveer Ahmad', 'Sobia Rasheed', 'Danish Malik', 'Hafsa Imran', 'Kamran Yousaf', 'Nimra Asghar', 'Faisal Shehzad', 'Lubna Saeed', 'Owais Qadir', 'Fiza Batool'];
  const types = ['Consultation', 'Follow-up', 'Follow-up', 'New Patient', 'Procedure', 'Lab Review'];
  const docs = initialDoctors.filter(d => !['On Leave'].includes(d.availability));
  const slots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'];
  const taken = new Set();
  const list = [];
  const days = [-3, -2, -1, 0, 0, 0, 1, 1, 2, 3];
  let n = 1;
  days.forEach((offset) => {
    for (let i = 0; i < 4; i += 1) {
      const doc = pick(r, docs);
      const inHours = slots.filter(s => s >= doc.startTime && s < doc.endTime);
      const time = pick(r, inHours.length ? inHours : slots);
      const date = dayOffset(offset);
      const key = `${doc.name}|${date}|${time}`;
      if (taken.has(key)) continue;
      taken.add(key);
      let status = 'Scheduled';
      if (offset < 0) status = r() < 0.82 ? 'Completed' : r() < 0.5 ? 'No Show' : 'Cancelled';
      else if (offset === 0) status = time < '11:00' ? 'Completed' : time < '12:30' ? (r() < 0.5 ? 'In Progress' : 'Checked In') : 'Scheduled';
      list.push({
        id: `apt-${String(n).padStart(3, '0')}`,
        number: `APT-${String(3100 + n)}`,
        patient: pick(r, names),
        phone: `+92 3${Math.floor(r() * 50 + 10)} ${Math.floor(1000000 + r() * 8999999)}`,
        doctor: doc.name,
        department: doc.specialty,
        date,
        time,
        duration: 30,
        type: pick(r, types),
        room: doc.room,
        fee: doc.fee,
        status,
        notes: '',
      });
      n += 1;
    }
  });
  return demo(list);
})();

export const initialMedicines = demo([
  { id: 'med-01', name: 'Epinephrine 1mg/mL', generic: 'Adrenaline', category: 'Emergency', form: 'Injection', batch: 'EP-2611', stock: 8, reorderLevel: 30, unitPrice: 420, expiryDate: dayOffset(210), supplier: 'Searle Pakistan', location: 'ER crash cart' },
  { id: 'med-02', name: 'Insulin Glargine 100IU', generic: 'Insulin glargine', category: 'Endocrine', form: 'Injection', batch: 'IG-5590', stock: 14, reorderLevel: 40, unitPrice: 3150, expiryDate: dayOffset(120), supplier: 'Sanofi Pakistan', location: 'Cold store 1' },
  { id: 'med-03', name: 'Amoxicillin 500mg', generic: 'Amoxicillin', category: 'Antibiotic', form: 'Capsule', batch: 'AM-7712', stock: 62, reorderLevel: 200, unitPrice: 18, expiryDate: dayOffset(300), supplier: 'GSK Pakistan', location: 'Shelf A2' },
  { id: 'med-04', name: 'Paracetamol 500mg', generic: 'Acetaminophen', category: 'Analgesic', form: 'Tablet', batch: 'PN-1029', stock: 4200, reorderLevel: 1000, unitPrice: 3, expiryDate: dayOffset(540), supplier: 'GSK Pakistan', location: 'Shelf A1' },
  { id: 'med-05', name: 'Ceftriaxone 1g', generic: 'Ceftriaxone', category: 'Antibiotic', form: 'Injection', batch: 'CF-3381', stock: 180, reorderLevel: 120, unitPrice: 310, expiryDate: dayOffset(45), supplier: 'Getz Pharma', location: 'Shelf B1' },
  { id: 'med-06', name: 'Omeprazole 20mg', generic: 'Omeprazole', category: 'Gastro', form: 'Capsule', batch: 'OM-2248', stock: 950, reorderLevel: 300, unitPrice: 12, expiryDate: dayOffset(400), supplier: 'Getz Pharma', location: 'Shelf A3' },
  { id: 'med-07', name: 'Atorvastatin 20mg', generic: 'Atorvastatin', category: 'Cardiac', form: 'Tablet', batch: 'AT-6610', stock: 640, reorderLevel: 250, unitPrice: 22, expiryDate: dayOffset(70), supplier: 'Pfizer Pakistan', location: 'Shelf C1' },
  { id: 'med-08', name: 'Clopidogrel 75mg', generic: 'Clopidogrel', category: 'Cardiac', form: 'Tablet', batch: 'CL-4471', stock: 310, reorderLevel: 150, unitPrice: 35, expiryDate: dayOffset(260), supplier: 'Sami Pharmaceuticals', location: 'Shelf C1' },
  { id: 'med-09', name: 'Normal Saline 0.9% 1L', generic: 'Sodium chloride', category: 'IV Fluid', form: 'Infusion', batch: 'NS-9001', stock: 420, reorderLevel: 300, unitPrice: 160, expiryDate: dayOffset(600), supplier: 'Otsuka Pakistan', location: 'IV store' },
  { id: 'med-10', name: 'Ringer Lactate 1L', generic: 'Compound sodium lactate', category: 'IV Fluid', form: 'Infusion', batch: 'RL-2234', stock: 0, reorderLevel: 150, unitPrice: 175, expiryDate: dayOffset(500), supplier: 'Otsuka Pakistan', location: 'IV store' },
  { id: 'med-11', name: 'Salbutamol Inhaler 100mcg', generic: 'Salbutamol', category: 'Respiratory', form: 'Inhaler', batch: 'SB-1180', stock: 95, reorderLevel: 60, unitPrice: 480, expiryDate: dayOffset(-6), supplier: 'GSK Pakistan', location: 'Shelf D2' },
  { id: 'med-12', name: 'Metformin 500mg', generic: 'Metformin', category: 'Endocrine', form: 'Tablet', batch: 'MF-5503', stock: 1800, reorderLevel: 600, unitPrice: 6, expiryDate: dayOffset(380), supplier: 'Searle Pakistan', location: 'Shelf C3' },
  { id: 'med-13', name: 'Diclofenac 75mg/3mL', generic: 'Diclofenac sodium', category: 'Analgesic', form: 'Injection', batch: 'DC-8812', stock: 240, reorderLevel: 100, unitPrice: 55, expiryDate: dayOffset(28), supplier: 'Novartis Pakistan', location: 'Shelf B2' },
  { id: 'med-14', name: 'Heparin 5000IU/mL', generic: 'Heparin sodium', category: 'Cardiac', form: 'Injection', batch: 'HP-3307', stock: 38, reorderLevel: 50, unitPrice: 890, expiryDate: dayOffset(150), supplier: 'Martin Dow', location: 'Cold store 2' },
  { id: 'med-15', name: 'ORS Sachet', generic: 'Oral rehydration salts', category: 'Gastro', form: 'Powder', batch: 'OR-4040', stock: 2600, reorderLevel: 800, unitPrice: 25, expiryDate: dayOffset(700), supplier: 'Hilton Pharma', location: 'Shelf A4' },
  { id: 'med-16', name: 'Ondansetron 4mg', generic: 'Ondansetron', category: 'Gastro', form: 'Injection', batch: 'ON-1290', stock: 130, reorderLevel: 80, unitPrice: 140, expiryDate: dayOffset(230), supplier: 'Getz Pharma', location: 'Shelf B3' },
]);

export const initialAmbulances = demo([
  { id: 'amb-01', unit: 'AMB-01', vehicle: 'Toyota HiAce · LEB-1287', type: 'ALS', driver: 'Muhammad Shafiq', paramedic: 'Asad Ullah', phone: '+92 300 1122001', base: 'Main campus', status: 'On Scene', lastService: dayOffset(-40) },
  { id: 'amb-02', unit: 'AMB-02', vehicle: 'Toyota HiAce · LEB-4410', type: 'BLS', driver: 'Zafar Iqbal', paramedic: 'Sana Gul', phone: '+92 300 1122002', base: 'Main campus', status: 'Transporting', lastService: dayOffset(-25) },
  { id: 'amb-03', unit: 'AMB-03', vehicle: 'Suzuki APV · LEC-7781', type: 'BLS', driver: 'Nadeem Abbas', paramedic: 'Faraz Ahmed', phone: '+92 300 1122003', base: 'Johar Town post', status: 'Available', lastService: dayOffset(-12) },
  { id: 'amb-04', unit: 'AMB-04', vehicle: 'Mercedes Sprinter · LEA-0094', type: 'ALS', driver: 'Irfan Haider', paramedic: 'Kiran Javed', phone: '+92 300 1122004', base: 'Main campus', status: 'Dispatched', lastService: dayOffset(-60) },
  { id: 'amb-05', unit: 'AMB-05', vehicle: 'Toyota HiAce · LED-5512', type: 'Neonatal', driver: 'Ghulam Abbas', paramedic: 'Rida Fatima', phone: '+92 300 1122005', base: 'Main campus', status: 'Available', lastService: dayOffset(-8) },
  { id: 'amb-06', unit: 'AMB-06', vehicle: 'Suzuki APV · LEB-3309', type: 'BLS', driver: 'Saleem Akhtar', paramedic: 'Umar Farooq', phone: '+92 300 1122006', base: 'DHA post', status: 'Maintenance', lastService: dayOffset(-1) },
  { id: 'amb-07', unit: 'AMB-07', vehicle: 'Mercedes Sprinter · LEC-6620', type: 'ALS', driver: 'Waseem Akram', paramedic: 'Hina Shah', phone: '+92 300 1122007', base: 'DHA post', status: 'Returning', lastService: dayOffset(-33) },
]);

export const initialDispatchCalls = demo([
  { id: 'call-01', number: 'EMS-7841', caller: 'Rehan Malik', phone: '+92 321 4402291', location: 'Ferozepur Road, near Kalma Chowk', incident: 'Road traffic accident, 2 injured', priority: 'P1 Critical', unit: 'AMB-01', status: 'On Scene', receivedAt: minutesAgo(26), eta: 0, destination: 'Emergency · Main campus', notes: '' },
  { id: 'call-02', number: 'EMS-7839', caller: 'Saira Bano', phone: '+92 300 7782210', location: 'Model Town, Block C', incident: 'Elderly fall, hip injury', priority: 'P2 Urgent', unit: 'AMB-02', status: 'Transporting', receivedAt: minutesAgo(48), eta: 7, destination: 'Emergency · Main campus', notes: 'Patient conscious' },
  { id: 'call-03', number: 'EMS-7843', caller: 'Adeel Khan', phone: '+92 333 9910045', location: 'Gulberg III, MM Alam Road', incident: 'Cardiac arrest suspected', priority: 'P1 Critical', unit: 'AMB-04', status: 'Dispatched', receivedAt: minutesAgo(6), eta: 4, destination: 'Cardiology · Main campus', notes: 'CPR in progress by bystander' },
  { id: 'call-04', number: 'EMS-7844', caller: 'Nazia Perveen', phone: '+92 345 2213378', location: 'Township, Sector B2', incident: 'Child with high fever and seizure', priority: 'P2 Urgent', unit: '', status: 'Pending', receivedAt: minutesAgo(2), eta: null, destination: '', notes: '' },
  { id: 'call-05', number: 'EMS-7845', caller: 'Riverside Clinic', phone: '+92 42 3577 1200', location: 'Riverside Clinic, Shahdara', incident: 'Inter-facility transfer, dialysis patient', priority: 'P3 Standard', unit: '', status: 'Pending', receivedAt: minutesAgo(15), eta: null, destination: 'Nephrology · Main campus', notes: 'Scheduled transfer' },
  { id: 'call-06', number: 'EMS-7836', caller: 'Bilal Sharif', phone: '+92 312 6604471', location: 'Johar Town, Phase 2', incident: 'Breathing difficulty (asthma)', priority: 'P2 Urgent', unit: 'AMB-07', status: 'Completed', receivedAt: hoursAgo(2), eta: null, destination: 'Emergency · Main campus', notes: 'Handed over to ER', completedAt: hoursAgo(1) },
  { id: 'call-07', number: 'EMS-7832', caller: 'Mariam Ijaz', phone: '+92 300 5590012', location: 'Bahria Town, Sector D', incident: 'Labour pains, first pregnancy', priority: 'P2 Urgent', unit: 'AMB-05', status: 'Completed', receivedAt: hoursAgo(5), eta: null, destination: 'Maternity · Main campus', notes: '', completedAt: hoursAgo(4) },
]);

export const initialHospitalBills = demo([
  { id: 'bill-01', billNo: 'INV-H-5021', patient: 'Ghulam Rasool', mrn: 'MRN-2360', date: dayOffset(-2), dueDate: dayOffset(12), consultation: 12000, roomCharges: 126000, pharmacy: 38500, lab: 22400, procedures: 0, discount: 0, insurer: 'Sehat Sahulat Card', claimStatus: 'Approved', approvedAmount: 180000, paid: 18900, paymentMethod: 'Cash' },
  { id: 'bill-02', billNo: 'INV-H-5022', patient: 'Sadia Kanwal', mrn: 'MRN-2364', date: dayOffset(-1), dueDate: dayOffset(13), consultation: 8000, roomCharges: 27000, pharmacy: 9600, lab: 6200, procedures: 65000, discount: 5000, insurer: 'Jubilee Life Health', claimStatus: 'Under Review', approvedAmount: 0, paid: 20000, paymentMethod: 'Card' },
  { id: 'bill-03', billNo: 'INV-H-5023', patient: 'Asif Mehmood', mrn: 'MRN-2367', date: dayOffset(-3), dueDate: dayOffset(11), consultation: 7000, roomCharges: 27000, pharmacy: 14200, lab: 8800, procedures: 185000, discount: 0, insurer: 'EFU Health', claimStatus: 'Partially Approved', approvedAmount: 150000, paid: 0, paymentMethod: '' },
  { id: 'bill-04', billNo: 'INV-H-5024', patient: 'Nasreen Akhtar', mrn: 'MRN-2398', date: today(), dueDate: dayOffset(14), consultation: 12000, roomCharges: 54000, pharmacy: 21800, lab: 31500, procedures: 0, discount: 0, insurer: 'Jubilee Life Health', claimStatus: 'Submitted', approvedAmount: 0, paid: 0, paymentMethod: '' },
  { id: 'bill-05', billNo: 'INV-H-5025', patient: 'Javed Iqbal', mrn: 'MRN-2388', date: today(), dueDate: dayOffset(14), consultation: 25000, roomCharges: 225000, pharmacy: 96000, lab: 48000, procedures: 420000, discount: 0, insurer: 'EFU Health', claimStatus: 'Submitted', approvedAmount: 0, paid: 100000, paymentMethod: 'Bank Transfer' },
  { id: 'bill-06', billNo: 'INV-H-5017', patient: 'Ahmed Nawaz', mrn: 'MRN-2378', date: dayOffset(-12), dueDate: dayOffset(-2), consultation: 4000, roomCharges: 0, pharmacy: 3600, lab: 9800, procedures: 0, discount: 0, insurer: 'Self-pay', claimStatus: 'Not Claimed', approvedAmount: 0, paid: 0, paymentMethod: '' },
  { id: 'bill-07', billNo: 'INV-H-5018', patient: 'Iqra Saleem', mrn: 'MRN-2380', date: dayOffset(-10), dueDate: dayOffset(4), consultation: 3000, roomCharges: 0, pharmacy: 4200, lab: 0, procedures: 0, discount: 500, insurer: 'Self-pay', claimStatus: 'Not Claimed', approvedAmount: 0, paid: 6700, paymentMethod: 'Cash' },
  { id: 'bill-08', billNo: 'INV-H-5019', patient: 'Shahzad Khan', mrn: 'MRN-2383', date: dayOffset(-8), dueDate: dayOffset(6), consultation: 2500, roomCharges: 0, pharmacy: 2800, lab: 4500, procedures: 18000, discount: 0, insurer: 'Jubilee Life Health', claimStatus: 'Rejected', approvedAmount: 0, paid: 0, paymentMethod: '' },
  { id: 'bill-09', billNo: 'INV-H-5020', patient: 'Amna Riaz', mrn: 'MRN-2385', date: dayOffset(-6), dueDate: dayOffset(8), consultation: 4500, roomCharges: 0, pharmacy: 6100, lab: 12000, procedures: 0, discount: 0, insurer: 'Adamjee Health', claimStatus: 'Approved', approvedAmount: 18000, paid: 4600, paymentMethod: 'Card' },
  { id: 'bill-10', billNo: 'INV-H-5026', patient: 'Bilal Ahmed', mrn: 'MRN-2409', date: today(), dueDate: dayOffset(14), consultation: 5000, roomCharges: 18000, pharmacy: 11400, lab: 14600, procedures: 0, discount: 0, insurer: 'Self-pay', claimStatus: 'Not Claimed', approvedAmount: 0, paid: 15000, paymentMethod: 'Cash' },
].map(b => ({ ...b, total: billTotal(b) })));

// ─────────────────────────────── HRM ───────────────────────────────

export const initialEmployees = demo([
  { id: 'emp-01', empId: 'EMP-1001', name: 'Sana Mirza', email: 'sana.mirza@meridianqm.pk', phone: '+92 300 4401122', department: 'People & HR', designation: 'Head of People', employmentType: 'Full-time', status: 'Active', joinDate: '2019-03-04', dob: '1987-10-24', location: 'Lahore', manager: '', basicSalary: 420000, allowances: 110000, bank: 'Meezan Bank', skills: ['Leadership', 'Employee Relations', 'Compensation'], annualBalance: 9, sickBalance: 6, casualBalance: 7 },
  { id: 'emp-02', empId: 'EMP-1002', name: 'Hassan Raza', email: 'hassan.raza@meridianqm.pk', phone: '+92 321 7765001', department: 'Engineering', designation: 'VP Engineering', employmentType: 'Full-time', status: 'Active', joinDate: '2018-07-16', dob: '1985-11-02', location: 'Lahore', manager: '', basicSalary: 650000, allowances: 180000, bank: 'HBL', skills: ['Leadership', 'React', 'Node.js', 'Architecture'], annualBalance: 6, sickBalance: 8, casualBalance: 5 },
  { id: 'emp-03', empId: 'EMP-1007', name: 'Ayesha Khan', email: 'ayesha.khan@meridianqm.pk', phone: '+92 333 2209981', department: 'Engineering', designation: 'Senior Frontend Engineer', employmentType: 'Full-time', status: 'Active', joinDate: '2021-02-01', dob: '1994-10-21', location: 'Lahore', manager: 'Hassan Raza', basicSalary: 380000, allowances: 70000, bank: 'Meezan Bank', skills: ['React', 'TypeScript', 'Figma'], annualBalance: 11, sickBalance: 7, casualBalance: 8 },
  { id: 'emp-04', empId: 'EMP-1011', name: 'Omar Farooq', email: 'omar.farooq@meridianqm.pk', phone: '+92 345 1102938', department: 'Engineering', designation: 'Backend Engineer', employmentType: 'Full-time', status: 'Active', joinDate: '2022-08-15', dob: '1996-04-12', location: 'Islamabad', manager: 'Hassan Raza', basicSalary: 290000, allowances: 55000, bank: 'UBL', skills: ['Node.js', 'SQL', 'Python'], annualBalance: 4, sickBalance: 5, casualBalance: 6 },
  { id: 'emp-05', empId: 'EMP-1014', name: 'Zainab Ali', email: 'zainab.ali@meridianqm.pk', phone: '+92 300 8823344', department: 'Quality Assurance', designation: 'Lead Auditor (ISO 9001)', employmentType: 'Full-time', status: 'Active', joinDate: '2020-01-06', dob: '1990-12-03', location: 'Karachi', manager: '', basicSalary: 360000, allowances: 80000, bank: 'Bank Alfalah', skills: ['ISO 9001', 'ISO 13485', 'Auditing'], annualBalance: 12, sickBalance: 8, casualBalance: 9 },
  { id: 'emp-06', empId: 'EMP-1018', name: 'Usman Tariq', email: 'usman.tariq@meridianqm.pk', phone: '+92 312 5546677', department: 'Quality Assurance', designation: 'QA Engineer', employmentType: 'Full-time', status: 'On Leave', joinDate: '2023-03-20', dob: '1997-06-30', location: 'Karachi', manager: 'Zainab Ali', basicSalary: 180000, allowances: 35000, bank: 'HBL', skills: ['ISO 17025', 'Calibration', 'SQL'], annualBalance: 2, sickBalance: 6, casualBalance: 7 },
  { id: 'emp-07', empId: 'EMP-1021', name: 'Bilal Chaudhry', email: 'bilal.chaudhry@meridianqm.pk', phone: '+92 301 3398812', department: 'Sales', designation: 'Sales Director', employmentType: 'Full-time', status: 'Active', joinDate: '2019-09-02', dob: '1986-10-29', location: 'Lahore', manager: '', basicSalary: 480000, allowances: 120000, bank: 'MCB', skills: ['Negotiation', 'Leadership', 'Salesforce'], annualBalance: 7, sickBalance: 8, casualBalance: 4 },
  { id: 'emp-08', empId: 'EMP-1025', name: 'Mahnoor Shah', email: 'mahnoor.shah@meridianqm.pk', phone: '+92 333 7712290', department: 'Sales', designation: 'Account Executive', employmentType: 'Full-time', status: 'Active', joinDate: '2024-01-08', dob: '1998-02-17', location: 'Karachi', manager: 'Bilal Chaudhry', basicSalary: 160000, allowances: 40000, bank: 'Meezan Bank', skills: ['Salesforce', 'Presentations'], annualBalance: 10, sickBalance: 8, casualBalance: 10 },
  { id: 'emp-09', empId: 'EMP-1029', name: 'Fahad Iqbal', email: 'fahad.iqbal@meridianqm.pk', phone: '+92 345 6670021', department: 'Operations', designation: 'Operations Manager', employmentType: 'Full-time', status: 'Active', joinDate: '2020-06-15', dob: '1989-08-08', location: 'Faisalabad', manager: '', basicSalary: 340000, allowances: 75000, bank: 'Allied Bank', skills: ['Logistics', 'Lean Six Sigma', 'Leadership'], annualBalance: 8, sickBalance: 3, casualBalance: 6 },
  { id: 'emp-10', empId: 'EMP-1033', name: 'Rabia Anwar', email: 'rabia.anwar@meridianqm.pk', phone: '+92 300 2234589', department: 'Operations', designation: 'Ops Coordinator', employmentType: 'Contract', status: 'Probation', joinDate: dayOffset(-40), dob: '1999-10-27', location: 'Lahore', manager: 'Fahad Iqbal', basicSalary: 110000, allowances: 20000, bank: 'HBL', skills: ['Excel', 'Scheduling'], annualBalance: 14, sickBalance: 8, casualBalance: 10 },
  { id: 'emp-11', empId: 'EMP-1036', name: 'Kamran Akmal', email: 'kamran.akmal@meridianqm.pk', phone: '+92 321 9087765', department: 'Finance', designation: 'Finance Manager', employmentType: 'Full-time', status: 'Active', joinDate: '2018-11-12', dob: '1984-03-19', location: 'Lahore', manager: '', basicSalary: 450000, allowances: 100000, bank: 'Standard Chartered', skills: ['IFRS', 'Excel', 'Payroll'], annualBalance: 5, sickBalance: 7, casualBalance: 3 },
  { id: 'emp-12', empId: 'EMP-1040', name: 'Hira Naveed', email: 'hira.naveed@meridianqm.pk', phone: '+92 312 4478890', department: 'Finance', designation: 'Payroll Analyst', employmentType: 'Full-time', status: 'Active', joinDate: '2022-04-04', dob: '1995-11-11', location: 'Lahore', manager: 'Kamran Akmal', basicSalary: 170000, allowances: 35000, bank: 'Meezan Bank', skills: ['Payroll', 'Excel', 'SQL'], annualBalance: 9, sickBalance: 8, casualBalance: 8 },
  { id: 'emp-13', empId: 'EMP-1044', name: 'Danish Malik', email: 'danish.malik@meridianqm.pk', phone: '+92 333 5501276', department: 'Customer Support', designation: 'Support Lead', employmentType: 'Full-time', status: 'Active', joinDate: '2021-05-17', dob: '1993-01-25', location: 'Lahore', manager: '', basicSalary: 210000, allowances: 45000, bank: 'UBL', skills: ['Zendesk', 'Leadership', 'SQL'], annualBalance: 3, sickBalance: 2, casualBalance: 4 },
  { id: 'emp-14', empId: 'EMP-1047', name: 'Maria Yousaf', email: 'maria.yousaf@meridianqm.pk', phone: '+92 300 6612380', department: 'Customer Support', designation: 'Support Agent', employmentType: 'Full-time', status: 'Active', joinDate: '2023-09-11', dob: '2000-07-14', location: 'Lahore', manager: 'Danish Malik', basicSalary: 95000, allowances: 20000, bank: 'HBL', skills: ['Zendesk', 'Communication'], annualBalance: 10, sickBalance: 6, casualBalance: 9 },
  { id: 'emp-15', empId: 'EMP-1049', name: 'Ali Hamza', email: 'ali.hamza@meridianqm.pk', phone: '+92 345 3398127', department: 'Customer Support', designation: 'Support Agent', employmentType: 'Full-time', status: 'Notice Period', joinDate: '2022-12-05', dob: '1997-10-30', location: 'Islamabad', manager: 'Danish Malik', basicSalary: 92000, allowances: 18000, bank: 'Meezan Bank', skills: ['Zendesk'], annualBalance: 1, sickBalance: 1, casualBalance: 2 },
  { id: 'emp-16', empId: 'EMP-1052', name: 'Noor Fatima', email: 'noor.fatima@meridianqm.pk', phone: '+92 312 7789012', department: 'Engineering', designation: 'QA Automation Engineer', employmentType: 'Full-time', status: 'Active', joinDate: dayOffset(-21), dob: '1998-05-05', location: 'Lahore', manager: 'Hassan Raza', basicSalary: 200000, allowances: 40000, bank: 'Bank Alfalah', skills: ['Cypress', 'Python', 'SQL'], annualBalance: 14, sickBalance: 8, casualBalance: 10 },
]);

const prevMonth = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return monthKey(d); })();
const twoMonthsAgo = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 2); return monthKey(d); })();

export const initialPayroll = (() => {
  const r = rng(7);
  const rows = [];
  [twoMonthsAgo, prevMonth].forEach((period, pi) => {
    initialEmployees.filter(e => e.status !== 'Exited' && e.joinDate.slice(0, 7) <= period).forEach((e) => {
      const overtimeHours = ['Engineering', 'Operations', 'Customer Support'].includes(e.department) ? Math.round(r() * 12) : 0;
      const bonus = e.department === 'Sales' ? Math.round((e.basicSalary * (0.05 + r() * 0.1)) / 1000) * 1000 : 0;
      const slip = computePayslip({ basic: e.basicSalary, allowances: e.allowances, overtimeHours, bonus, otherDeductions: 0 });
      const [y, m] = period.split('-').map(Number);
      const payDate = `${period}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
      rows.push({
        id: `pay-${period}-${e.id}`,
        period,
        employeeId: e.id,
        empId: e.empId,
        employee: e.name,
        department: e.department,
        basic: e.basicSalary,
        allowances: e.allowances,
        overtimeHours,
        bonus,
        otherDeductions: 0,
        ...slip,
        status: pi === 0 ? 'Paid' : (e.status === 'Notice Period' ? 'On Hold' : 'Paid'),
        payDate,
        bank: e.bank,
      });
    });
  });
  return demo(rows);
})();

export const initialAttendance = (() => {
  const r = rng(99);
  const rows = [];
  for (let i = 20; i >= 0; i -= 1) {
    const date = dayOffset(-i);
    const dow = new Date(`${date}T00:00:00`).getDay();
    if (dow === 0) continue; // Sunday off
    initialEmployees.filter(e => e.joinDate <= date).forEach((e) => {
      const roll = r();
      let status = 'Present';
      if (e.status === 'On Leave' && i <= 3) status = 'On Leave';
      else if (roll < 0.05) status = 'Absent';
      else if (roll < 0.15) status = 'Late';
      else if (roll < 0.2) status = 'Remote';
      else if (roll < 0.23) status = 'Half Day';
      const inMin = status === 'Late' ? 9 * 60 + 20 + Math.floor(r() * 50) : 8 * 60 + 45 + Math.floor(r() * 20);
      const hours = status === 'Half Day' ? 4 : ['Absent', 'On Leave'].includes(status) ? 0 : 8 + Math.round(r() * 15) / 10;
      const outMin = inMin + Math.round(hours * 60);
      const t = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      // Today: only people who have checked in so far, no check-out yet.
      const isToday = i === 0;
      rows.push({
        id: `att-${date}-${e.id}`,
        date,
        employeeId: e.id,
        employee: e.name,
        department: e.department,
        status,
        checkIn: hours ? t(inMin) : '',
        checkOut: hours && !isToday ? t(outMin) : '',
        hours: isToday ? 0 : hours,
      });
    });
  }
  return demo(rows);
})();

export const initialLeaveRequests = demo([
  { id: 'lv-01', employeeId: 'emp-06', employee: 'Usman Tariq', department: 'Quality Assurance', type: 'Annual', from: dayOffset(-3), to: dayOffset(4), days: 7, reason: 'Family wedding in Hyderabad', status: 'Approved', appliedOn: dayOffset(-14), decidedBy: 'Zainab Ali', decidedOn: dayOffset(-12) },
  { id: 'lv-02', employeeId: 'emp-03', employee: 'Ayesha Khan', department: 'Engineering', type: 'Annual', from: dayOffset(8), to: dayOffset(12), days: 5, reason: 'Umrah', status: 'Pending', appliedOn: dayOffset(-2), decidedBy: '', decidedOn: '' },
  { id: 'lv-03', employeeId: 'emp-04', employee: 'Omar Farooq', department: 'Engineering', type: 'Sick', from: dayOffset(-1), to: dayOffset(-1), days: 1, reason: 'Fever', status: 'Approved', appliedOn: dayOffset(-1), decidedBy: 'Hassan Raza', decidedOn: dayOffset(-1) },
  { id: 'lv-04', employeeId: 'emp-08', employee: 'Mahnoor Shah', department: 'Sales', type: 'Casual', from: dayOffset(3), to: dayOffset(3), days: 1, reason: 'Personal errand', status: 'Pending', appliedOn: dayOffset(-1), decidedBy: '', decidedOn: '' },
  { id: 'lv-05', employeeId: 'emp-13', employee: 'Danish Malik', department: 'Customer Support', type: 'Annual', from: dayOffset(10), to: dayOffset(16), days: 6, reason: 'Northern areas trip', status: 'Pending', appliedOn: today(), decidedBy: '', decidedOn: '' },
  { id: 'lv-06', employeeId: 'emp-09', employee: 'Fahad Iqbal', department: 'Operations', type: 'Sick', from: dayOffset(-9), to: dayOffset(-6), days: 4, reason: 'Dengue recovery', status: 'Approved', appliedOn: dayOffset(-9), decidedBy: 'Sana Mirza', decidedOn: dayOffset(-9) },
  { id: 'lv-07', employeeId: 'emp-15', employee: 'Ali Hamza', department: 'Customer Support', type: 'Annual', from: dayOffset(5), to: dayOffset(9), days: 5, reason: 'Relocation', status: 'Rejected', appliedOn: dayOffset(-4), decidedBy: 'Danish Malik', decidedOn: dayOffset(-3), note: 'Insufficient balance during notice period' },
  { id: 'lv-08', employeeId: 'emp-11', employee: 'Kamran Akmal', department: 'Finance', type: 'Casual', from: dayOffset(1), to: dayOffset(2), days: 2, reason: 'Child school event', status: 'Pending', appliedOn: today(), decidedBy: '', decidedOn: '' },
  { id: 'lv-09', employeeId: 'emp-02', employee: 'Hassan Raza', department: 'Engineering', type: 'Annual', from: dayOffset(-30), to: dayOffset(-25), days: 5, reason: 'Vacation', status: 'Approved', appliedOn: dayOffset(-45), decidedBy: 'Sana Mirza', decidedOn: dayOffset(-44) },
  { id: 'lv-10', employeeId: 'emp-14', employee: 'Maria Yousaf', department: 'Customer Support', type: 'Unpaid', from: dayOffset(20), to: dayOffset(22), days: 3, reason: 'Exam preparation', status: 'Pending', appliedOn: today(), decidedBy: '', decidedOn: '' },
]);

const goals = (list) => list.map(([title, progress], i) => ({ id: `g${i + 1}`, title, progress }));
const quarter = (() => { const d = new Date(); return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`; })();

export const initialReviews = demo([
  { id: 'rev-01', employeeId: 'emp-03', employee: 'Ayesha Khan', department: 'Engineering', reviewer: 'Hassan Raza', cycle: quarter, type: 'Quarterly', dueDate: dayOffset(5), status: 'Manager Review', rating: 4.7, potential: 'High', goals: goals([['Ship design system v2', 90], ['Mentor two juniors', 75], ['Cut bundle size by 20%', 100]]) },
  { id: 'rev-02', employeeId: 'emp-04', employee: 'Omar Farooq', department: 'Engineering', reviewer: 'Hassan Raza', cycle: quarter, type: 'Quarterly', dueDate: dayOffset(5), status: 'Self Review', rating: 3.8, potential: 'Medium', goals: goals([['Migrate reports API', 60], ['On-call runbook', 40]]) },
  { id: 'rev-03', employeeId: 'emp-05', employee: 'Zainab Ali', department: 'Quality Assurance', reviewer: 'Sana Mirza', cycle: quarter, type: 'Quarterly', dueDate: dayOffset(-2), status: 'Completed', rating: 4.9, potential: 'High', goals: goals([['Close 12 client audits', 100], ['ISO 13485 lead auditor cert', 100], ['Reduce NCR backlog', 85]]) },
  { id: 'rev-04', employeeId: 'emp-06', employee: 'Usman Tariq', department: 'Quality Assurance', reviewer: 'Zainab Ali', cycle: quarter, type: 'Quarterly', dueDate: dayOffset(-4), status: 'Overdue', rating: 3.1, potential: 'Medium', goals: goals([['Calibration schedule on time', 70], ['Lab accreditation prep', 45]]) },
  { id: 'rev-05', employeeId: 'emp-08', employee: 'Mahnoor Shah', department: 'Sales', reviewer: 'Bilal Chaudhry', cycle: quarter, type: 'Quarterly', dueDate: dayOffset(7), status: 'Not Started', rating: 3.9, potential: 'High', goals: goals([['PKR 12M new business', 68], ['20 discovery calls/month', 90]]) },
  { id: 'rev-06', employeeId: 'emp-10', employee: 'Rabia Anwar', department: 'Operations', reviewer: 'Fahad Iqbal', cycle: 'Probation', type: 'Probation', dueDate: dayOffset(3), status: 'Manager Review', rating: 3.6, potential: 'Medium', goals: goals([['Learn dispatch system', 80], ['Vendor onboarding SOP', 50]]) },
  { id: 'rev-07', employeeId: 'emp-12', employee: 'Hira Naveed', department: 'Finance', reviewer: 'Kamran Akmal', cycle: quarter, type: 'Quarterly', dueDate: dayOffset(1), status: 'Completed', rating: 4.3, potential: 'Medium', goals: goals([['Zero payroll errors', 100], ['Automate tax reports', 70]]) },
  { id: 'rev-08', employeeId: 'emp-13', employee: 'Danish Malik', department: 'Customer Support', reviewer: 'Sana Mirza', cycle: quarter, type: 'Quarterly', dueDate: dayOffset(-1), status: 'Overdue', rating: 3.4, potential: 'High', goals: goals([['SLA compliance ≥ 90%', 72], ['Launch help centre', 55]]) },
  { id: 'rev-09', employeeId: 'emp-14', employee: 'Maria Yousaf', department: 'Customer Support', reviewer: 'Danish Malik', cycle: quarter, type: 'Quarterly', dueDate: dayOffset(9), status: 'Not Started', rating: 4.1, potential: 'Medium', goals: goals([['CSAT ≥ 4.5', 80], ['Knowledge base: 15 articles', 60]]) },
  { id: 'rev-10', employeeId: 'emp-15', employee: 'Ali Hamza', department: 'Customer Support', reviewer: 'Danish Malik', cycle: quarter, type: 'Quarterly', dueDate: dayOffset(2), status: 'Self Review', rating: 2.6, potential: 'Low', goals: goals([['First response < 4h', 45]]) },
  { id: 'rev-11', employeeId: 'emp-09', employee: 'Fahad Iqbal', department: 'Operations', reviewer: 'Sana Mirza', cycle: quarter, type: 'Quarterly', dueDate: dayOffset(-6), status: 'Completed', rating: 4.4, potential: 'Medium', goals: goals([['On-time delivery 95%', 96], ['Cut fleet idle time', 80]]) },
  { id: 'rev-12', employeeId: 'emp-11', employee: 'Kamran Akmal', department: 'Finance', reviewer: 'Sana Mirza', cycle: quarter, type: 'Quarterly', dueDate: dayOffset(4), status: 'Manager Review', rating: 4.0, potential: 'Low', goals: goals([['Close books by day 5', 90], ['Audit with no findings', 100]]) },
  { id: 'rev-13', employeeId: 'emp-07', employee: 'Bilal Chaudhry', department: 'Sales', reviewer: 'Sana Mirza', cycle: quarter, type: 'Quarterly', dueDate: dayOffset(6), status: 'Self Review', rating: 4.5, potential: 'High', goals: goals([['Team quota PKR 60M', 82], ['Hire two AEs', 50]]) },
]);

// ─────────────────────────────── Helpdesk ───────────────────────────────

export const HELPDESK_AGENTS = ['Danish Malik', 'Maria Yousaf', 'Ali Hamza', 'Noor Fatima', 'Omar Farooq'];

export const initialTickets = (() => {
  const r = rng(2026);
  const subjects = {
    'Login & Access': ['Cannot log in after password reset', 'Two-factor code not arriving', 'Account locked out', 'Need access to audit module'],
    Billing: ['Invoice amount mismatch', 'Refund not received', 'Request GST invoice copy', 'Double charged on card'],
    'Bug Report': ['Report export shows blank PDF', 'Calendar not syncing', 'Dashboard numbers not updating', 'Upload fails for large files'],
    'How-to': ['How to add a new auditor', 'How to schedule recurring audits', 'How to export CAPA list', 'Configure email reminders'],
    'Feature Request': ['Urdu language support', 'Bulk edit for tasks', 'Dark mode for mobile app', 'Custom fields on NCRs'],
  };
  const requesters = ['Premier Foods Pakistan', 'PharmaCare Solutions', 'Textile Corp Pakistan', 'Apex Precision Engineering', 'Meridian Labs & Diagnostics', 'Orbit Logistics', 'AutoParts Manufacturing', 'Solace Health'];
  const channels = ['Email', 'Web Portal', 'Phone', 'WhatsApp'];
  const prioWeights = [['Critical', 0.1], ['High', 0.25], ['Medium', 0.4], ['Low', 0.25]];
  const pickPrio = () => { let x = r(); for (const [p, w] of prioWeights) { if ((x -= w) <= 0) return p; } return 'Low'; };
  const agentSpeed = { 'Danish Malik': 0.6, 'Maria Yousaf': 0.8, 'Ali Hamza': 1.6, 'Noor Fatima': 1.0, 'Omar Farooq': 1.2 };
  const targets = { Critical: [1, 4], High: [4, 24], Medium: [8, 48], Low: [24, 72] };
  const list = [];
  for (let i = 0; i < 64; i += 1) {
    const category = pick(r, Object.keys(subjects));
    const priority = pickPrio();
    const agent = pick(r, HELPDESK_AGENTS);
    const ageHours = Math.floor(r() * 30 * 24) + 1;
    const created = new Date(Date.now() - ageHours * 3600000);
    const speed = agentSpeed[agent];
    const [resp, resol] = targets[priority];
    const respH = Math.max(0.1, resp * speed * (0.3 + r() * 1.1));
    const resolH = Math.max(respH + 0.5, resol * speed * (0.3 + r() * 1.2));
    const firstResponseAt = respH < ageHours ? new Date(created.getTime() + respH * 3600000).toISOString() : '';
    let status;
    let resolvedAt = '';
    if (resolH < ageHours) {
      status = r() < 0.6 ? 'Closed' : 'Resolved';
      resolvedAt = new Date(created.getTime() + resolH * 3600000).toISOString();
    } else status = firstResponseAt ? (r() < 0.5 ? 'In Progress' : 'Pending') : 'Open';
    list.push({
      id: `tkt-${String(i + 1).padStart(3, '0')}`,
      number: `TKT-${String(5200 + i)}`,
      subject: pick(r, subjects[category]),
      requester: pick(r, requesters),
      category,
      priority,
      status,
      agent,
      channel: pick(r, channels),
      createdAt: created.toISOString(),
      firstResponseAt,
      resolvedAt,
      satisfaction: resolvedAt ? Math.max(1, Math.min(5, Math.round(5.4 - speed * (1 + r())))) : null,
    });
  }
  return demo(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
})();

// ─────────────────────────────── AI analytics ───────────────────────────────

/** Rule sets that drive insights and predictions (no ML model is connected). */
export const initialRuleSets = demo([
  { id: 'rule-bed', key: 'bed-capacity', name: 'Ward capacity alert', area: 'Hospital', method: 'Threshold rule', description: 'Flags wards whose occupied + reserved beds exceed the threshold.', threshold: 85, unit: '% occupancy', version: 'v1.3', status: 'Active', owner: 'Dr. Usman Ghani', updatedAt: dayOffset(-12), history: [{ version: 'v1.2', threshold: 90, at: dayOffset(-60), note: 'Initial rollout' }, { version: 'v1.3', threshold: 85, at: dayOffset(-12), note: 'Lowered to give bed managers more lead time' }] },
  { id: 'rule-er', key: 'er-wait', name: 'ER wait-time alert', area: 'Hospital', method: 'Threshold rule', description: 'Flags P1 patients waiting longer than the threshold (P2 at 3×).', threshold: 10, unit: 'minutes', version: 'v1.0', status: 'Active', owner: 'Dr. Usman Ghani', updatedAt: dayOffset(-30), history: [{ version: 'v1.0', threshold: 10, at: dayOffset(-30), note: 'Initial rollout' }] },
  { id: 'rule-stock', key: 'pharmacy-stock', name: 'Pharmacy stock & expiry', area: 'Hospital', method: 'Threshold rule', description: 'Flags medicines at or below this % of reorder level, plus anything expiring within 90 days.', threshold: 100, unit: '% of reorder level', version: 'v2.0', status: 'Active', owner: 'Pharmacy', updatedAt: dayOffset(-20), history: [{ version: 'v2.0', threshold: 100, at: dayOffset(-20), note: 'Added expiry window' }] },
  { id: 'rule-attrition', key: 'attrition-risk', name: 'Attrition risk score', area: 'HR', method: 'Weighted score (rating, leave balance, lateness)', description: 'Scores each employee 0–100; flags scores at or above the threshold.', threshold: 55, unit: 'risk score', version: 'v1.1', status: 'Active', owner: 'Sana Mirza', updatedAt: dayOffset(-8), history: [{ version: 'v1.0', threshold: 65, at: dayOffset(-90), note: 'Initial rollout' }, { version: 'v1.1', threshold: 55, at: dayOffset(-8), note: 'Lowered after two unflagged resignations' }] },
  { id: 'rule-sla', key: 'sla-breach', name: 'Helpdesk SLA watch', area: 'Helpdesk', method: 'Threshold rule', description: 'Flags agents whose resolution-SLA compliance falls below the threshold.', threshold: 80, unit: '% compliance', version: 'v1.0', status: 'Active', owner: 'Danish Malik', updatedAt: dayOffset(-15), history: [{ version: 'v1.0', threshold: 80, at: dayOffset(-15), note: 'Initial rollout' }] },
  { id: 'rule-forecast', key: 'forecast', name: 'Volume forecast', area: 'All', method: 'Least-squares linear trend', description: 'Window (days) of history used for linear-trend forecasts.', threshold: 14, unit: 'days of history', version: 'v1.0', status: 'Active', owner: 'Analytics', updatedAt: dayOffset(-25), history: [{ version: 'v1.0', threshold: 14, at: dayOffset(-25), note: 'Initial rollout' }] },
  { id: 'rule-intent', key: 'chatbot-intent', name: 'Chatbot intent matcher', area: 'Chatbot', method: 'Keyword matching', description: 'Minimum share of matched keywords before the bot answers instead of handing off.', threshold: 40, unit: '% keyword match', version: 'v0.9', status: 'Staging', owner: 'Danish Malik', updatedAt: dayOffset(-3), history: [{ version: 'v0.9', threshold: 40, at: dayOffset(-3), note: 'Staging test with new intents' }] },
]);

const convo = (lines) => lines.map(([from, text], i) => ({ from, text, offset: i }));
export const initialConversations = demo([
  { id: 'cb-01', visitor: 'Rizwan Haider', channel: 'WhatsApp', intent: 'Book appointment', status: 'Resolved', satisfaction: 5, startedAt: hoursAgo(1), durationSec: 142, handoff: '', messages: convo([['user', 'I want to see a cardiologist tomorrow'], ['bot', 'Dr. Ayesha Rehman (Cardiology) has slots tomorrow at 10:00, 11:30 and 14:00. Which suits you?'], ['user', '11:30 please'], ['bot', 'Booked: tomorrow 11:30 with Dr. Ayesha Rehman, Room 204. Please arrive 15 minutes early.']]) },
  { id: 'cb-02', visitor: 'Maryam Aftab', channel: 'Web', intent: 'Lab results', status: 'Escalated', satisfaction: 3, startedAt: hoursAgo(2), durationSec: 260, handoff: 'Front desk', messages: convo([['user', 'Are my CBC results ready?'], ['bot', 'Lab results can only be shared after identity verification. Connecting you to the front desk.']]) },
  { id: 'cb-03', visitor: 'Hira Naveed', channel: 'App', intent: 'Leave balance', status: 'Resolved', satisfaction: 5, startedAt: hoursAgo(3), durationSec: 48, handoff: '', messages: convo([['user', 'how many annual leaves do I have'], ['bot', 'You have 9 annual, 8 sick and 8 casual days remaining this year.']]) },
  { id: 'cb-04', visitor: 'Premier Foods Pakistan', channel: 'Web', intent: 'Ticket status', status: 'Resolved', satisfaction: 4, startedAt: hoursAgo(5), durationSec: 95, handoff: '', messages: convo([['user', 'status of TKT-5203?'], ['bot', 'TKT-5203 is In Progress with Maria Yousaf. Last update 2 hours ago.']]) },
  { id: 'cb-05', visitor: 'Kamran Yousaf', channel: 'WhatsApp', intent: 'Billing query', status: 'Escalated', satisfaction: 2, startedAt: hoursAgo(7), durationSec: 410, handoff: 'Billing desk', messages: convo([['user', 'My insurance claim was rejected why'], ['bot', 'I can see claim status but not the insurer’s reason. Passing you to the billing desk.'], ['user', 'ok']]) },
  { id: 'cb-06', visitor: 'Nimra Asghar', channel: 'Web', intent: 'Visiting hours', status: 'Resolved', satisfaction: 5, startedAt: hoursAgo(9), durationSec: 31, handoff: '', messages: convo([['user', 'visiting hours for ICU?'], ['bot', 'ICU visiting hours are 11:00–12:00 and 17:00–18:00, one visitor per patient.']]) },
  { id: 'cb-07', visitor: 'Omar Farooq', channel: 'App', intent: 'Payslip', status: 'Resolved', satisfaction: 4, startedAt: hoursAgo(20), durationSec: 66, handoff: '', messages: convo([['user', 'send me last month payslip'], ['bot', 'Your payslip for last month is available under Payroll → Payslips. Net pay has been credited to UBL.']]) },
  { id: 'cb-08', visitor: 'Unknown visitor', channel: 'Web', intent: 'Unrecognised', status: 'Abandoned', satisfaction: null, startedAt: hoursAgo(22), durationSec: 18, handoff: '', messages: convo([['user', 'parking?'], ['bot', 'Sorry, I didn’t catch that. You can ask about appointments, visiting hours, bills or leave.']]) },
  { id: 'cb-09', visitor: 'Textile Corp Pakistan', channel: 'Email', intent: 'Password reset', status: 'Resolved', satisfaction: 5, startedAt: hoursAgo(26), durationSec: 72, handoff: '', messages: convo([['user', 'reset password for usman@textilecorp.pk'], ['bot', 'A reset link has been queued for that address. (Demo: no email is sent from this browser.)']]) },
  { id: 'cb-10', visitor: 'Fiza Batool', channel: 'WhatsApp', intent: 'Book appointment', status: 'Open', satisfaction: null, startedAt: minutesAgo(12), durationSec: 90, handoff: '', messages: convo([['user', 'need skin specialist this week'], ['bot', 'Dr. Mehwish Anwar (Dermatology) has openings on Wednesday and Thursday. Shall I book one?']]) },
  { id: 'cb-11', visitor: 'Solace Health', channel: 'Web', intent: 'Ticket status', status: 'Escalated', satisfaction: 2, startedAt: hoursAgo(30), durationSec: 305, handoff: 'Danish Malik', messages: convo([['user', 'our export bug is still not fixed, 3 days now'], ['bot', 'I’m sorry about the delay. Escalating to the support lead now.']]) },
  { id: 'cb-12', visitor: 'Danish Malik', channel: 'App', intent: 'Leave balance', status: 'Resolved', satisfaction: 4, startedAt: hoursAgo(44), durationSec: 40, handoff: '', messages: convo([['user', 'casual leave left?'], ['bot', 'You have 4 casual days remaining.']]) },
  { id: 'cb-13', visitor: 'Owais Qadir', channel: 'Web', intent: 'Billing query', status: 'Resolved', satisfaction: 4, startedAt: hoursAgo(50), durationSec: 120, handoff: '', messages: convo([['user', 'what is my outstanding bill'], ['bot', 'Your outstanding balance is PKR 18,900 on INV-H-5021, due in 12 days.']]) },
  { id: 'cb-14', visitor: 'Lubna Saeed', channel: 'WhatsApp', intent: 'Visiting hours', status: 'Resolved', satisfaction: 5, startedAt: hoursAgo(70), durationSec: 25, handoff: '', messages: convo([['user', 'maternity ward visiting time'], ['bot', 'Maternity visiting hours are 16:00–19:00 daily.']]) },
]);

export const initialPredictions = demo([
  { id: 'pr-01', target: 'Daily ER arrivals', area: 'Hospital', method: 'Least-squares linear trend', horizon: '7 days', runAt: dayOffset(-21), predicted: 31, actual: 29, unit: 'patients/day', status: 'Validated', note: '14-day window' },
  { id: 'pr-02', target: 'Daily ER arrivals', area: 'Hospital', method: 'Least-squares linear trend', horizon: '7 days', runAt: dayOffset(-14), predicted: 30, actual: 33, unit: 'patients/day', status: 'Validated', note: '14-day window' },
  { id: 'pr-03', target: 'Daily ER arrivals', area: 'Hospital', method: 'Least-squares linear trend', horizon: '7 days', runAt: dayOffset(-7), predicted: 32, actual: 31, unit: 'patients/day', status: 'Validated', note: '14-day window' },
  { id: 'pr-04', target: 'Ticket volume', area: 'Helpdesk', method: 'Least-squares linear trend', horizon: '7 days', runAt: dayOffset(-21), predicted: 15, actual: 16, unit: 'tickets/week', status: 'Validated', note: '' },
  { id: 'pr-05', target: 'Ticket volume', area: 'Helpdesk', method: 'Least-squares linear trend', horizon: '7 days', runAt: dayOffset(-14), predicted: 16, actual: 13, unit: 'tickets/week', status: 'Validated', note: '' },
  { id: 'pr-06', target: 'Ticket volume', area: 'Helpdesk', method: 'Least-squares linear trend', horizon: '7 days', runAt: dayOffset(-7), predicted: 14, actual: 15, unit: 'tickets/week', status: 'Validated', note: '' },
  { id: 'pr-07', target: 'Attendance rate', area: 'HR', method: '7-day moving average', horizon: '1 day', runAt: dayOffset(-10), predicted: 92, actual: 94, unit: '%', status: 'Validated', note: '' },
  { id: 'pr-08', target: 'Attendance rate', area: 'HR', method: '7-day moving average', horizon: '1 day', runAt: dayOffset(-5), predicted: 93, actual: 90, unit: '%', status: 'Validated', note: '' },
  { id: 'pr-09', target: 'Bed occupancy', area: 'Hospital', method: 'Least-squares linear trend', horizon: '7 days', runAt: dayOffset(-7), predicted: 74, actual: 71, unit: '%', status: 'Validated', note: '' },
]);

// ─────────────────────────────── Users & access ───────────────────────────────

export const ACCESS_MODULES = [
  { key: 'dashboard', label: 'Dashboards', group: 'General' },
  { key: 'patients', label: 'Patients', group: 'Hospital' },
  { key: 'appointments', label: 'Appointments', group: 'Hospital' },
  { key: 'wards', label: 'Wards & Beds', group: 'Hospital' },
  { key: 'pharmacy', label: 'Pharmacy', group: 'Hospital' },
  { key: 'billing', label: 'Hospital Billing', group: 'Hospital' },
  { key: 'employees', label: 'Employees', group: 'HRM' },
  { key: 'payroll', label: 'Payroll', group: 'HRM' },
  { key: 'leave', label: 'Leave', group: 'HRM' },
  { key: 'reviews', label: 'Performance', group: 'HRM' },
  { key: 'helpdesk', label: 'Helpdesk', group: 'Support' },
  { key: 'ai', label: 'AI Analytics', group: 'Analytics' },
  { key: 'reports', label: 'Reports', group: 'Analytics' },
  { key: 'users', label: 'Users & Roles', group: 'Administration' },
  { key: 'settings', label: 'Settings', group: 'Administration' },
];
export const ACCESS_ACTIONS = ['view', 'create', 'edit', 'delete', 'export'];

const all = () => Object.fromEntries(ACCESS_MODULES.map(m => [m.key, [...ACCESS_ACTIONS]]));
const grant = (spec) => Object.fromEntries(ACCESS_MODULES.map(m => [m.key, spec[m.key] || []]));
const VE = ['view', 'export'];
const VCE = ['view', 'create', 'edit'];

export const initialRoles = demo([
  { id: 'role-admin', name: 'Super Admin', description: 'Full access to every module, including users and settings.', type: 'System', tone: 'danger', permissions: all(), updatedAt: dayOffset(-90) },
  { id: 'role-hospital', name: 'Hospital Administrator', description: 'Runs hospital operations, beds, pharmacy and billing.', type: 'Custom', tone: 'primary', permissions: grant({ dashboard: VE, patients: [...ACCESS_ACTIONS], appointments: [...ACCESS_ACTIONS], wards: [...ACCESS_ACTIONS], pharmacy: [...ACCESS_ACTIONS], billing: [...VCE, 'export'], reports: VE, ai: ['view'] }), updatedAt: dayOffset(-6) },
  { id: 'role-doctor', name: 'Doctor', description: 'Clinical access to patients, appointments and wards.', type: 'Custom', tone: 'info', permissions: grant({ dashboard: ['view'], patients: VCE, appointments: VCE, wards: ['view', 'edit'], pharmacy: ['view'] }), updatedAt: dayOffset(-14) },
  { id: 'role-hr', name: 'HR Manager', description: 'Employees, payroll, leave approvals and reviews.', type: 'Custom', tone: 'accent', permissions: grant({ dashboard: VE, employees: [...ACCESS_ACTIONS], payroll: [...VCE, 'export'], leave: [...ACCESS_ACTIONS], reviews: [...ACCESS_ACTIONS], reports: VE, ai: ['view'] }), updatedAt: dayOffset(-4) },
  { id: 'role-support', name: 'Support Agent', description: 'Works helpdesk tickets and sees support reports.', type: 'Custom', tone: 'success', permissions: grant({ dashboard: ['view'], helpdesk: VCE, reports: ['view'] }), updatedAt: dayOffset(-3) },
  { id: 'role-viewer', name: 'Viewer (Read-only)', description: 'Can view dashboards and reports only.', type: 'System', tone: 'gray', permissions: grant({ dashboard: ['view'], reports: ['view'] }), updatedAt: dayOffset(-120) },
]);

export const initialAccessUsers = demo([
  { id: 'usr-01', name: 'Muhammad Affan', email: 'affan@meridianqm.pk', role: 'Super Admin', department: 'Administration', status: 'Active', mfa: 'Enabled', lastLogin: minutesAgo(3), createdAt: '2024-01-02' },
  { id: 'usr-02', name: 'Sana Mirza', email: 'sana.mirza@meridianqm.pk', role: 'HR Manager', department: 'People & HR', status: 'Active', mfa: 'Enabled', lastLogin: hoursAgo(2), createdAt: '2024-01-10' },
  { id: 'usr-03', name: 'Dr. Usman Ghani', email: 'usman.ghani@meridianhospital.pk', role: 'Hospital Administrator', department: 'Emergency', status: 'Active', mfa: 'Enabled', lastLogin: minutesAgo(40), createdAt: '2024-02-14' },
  { id: 'usr-04', name: 'Dr. Ayesha Rehman', email: 'ayesha.rehman@meridianhospital.pk', role: 'Doctor', department: 'Cardiology', status: 'Active', mfa: 'Enabled', lastLogin: hoursAgo(5), createdAt: '2024-02-20' },
  { id: 'usr-05', name: 'Dr. Sana Javed', email: 'sana.javed@meridianhospital.pk', role: 'Doctor', department: 'Pediatrics', status: 'Active', mfa: 'Disabled', lastLogin: hoursAgo(26), createdAt: '2024-03-01' },
  { id: 'usr-06', name: 'Dr. Imran Qureshi', email: 'imran.qureshi@meridianhospital.pk', role: 'Doctor', department: 'Neurology', status: 'Active', mfa: 'Enabled', lastLogin: hoursAgo(8), createdAt: '2024-03-01' },
  { id: 'usr-07', name: 'Kamran Akmal', email: 'kamran.akmal@meridianqm.pk', role: 'HR Manager', department: 'Finance', status: 'Active', mfa: 'Enabled', lastLogin: hoursAgo(30), createdAt: '2024-04-11' },
  { id: 'usr-08', name: 'Danish Malik', email: 'danish.malik@meridianqm.pk', role: 'Support Agent', department: 'Customer Support', status: 'Active', mfa: 'Enabled', lastLogin: minutesAgo(15), createdAt: '2024-05-06' },
  { id: 'usr-09', name: 'Maria Yousaf', email: 'maria.yousaf@meridianqm.pk', role: 'Support Agent', department: 'Customer Support', status: 'Active', mfa: 'Disabled', lastLogin: hoursAgo(1), createdAt: '2024-09-12' },
  { id: 'usr-10', name: 'Ali Hamza', email: 'ali.hamza@meridianqm.pk', role: 'Support Agent', department: 'Customer Support', status: 'Suspended', mfa: 'Disabled', lastLogin: hoursAgo(240), createdAt: '2024-12-06' },
  { id: 'usr-11', name: 'Noor Fatima', email: 'noor.fatima@meridianqm.pk', role: 'Viewer (Read-only)', department: 'Engineering', status: 'Invited', mfa: 'Disabled', lastLogin: '', createdAt: dayOffset(-2) },
  { id: 'usr-12', name: 'Zainab Ali', email: 'zainab.ali@meridianqm.pk', role: 'Viewer (Read-only)', department: 'Quality Assurance', status: 'Active', mfa: 'Enabled', lastLogin: hoursAgo(50), createdAt: '2024-06-18' },
  { id: 'usr-13', name: 'Pharmacy Desk', email: 'pharmacy@meridianhospital.pk', role: 'Hospital Administrator', department: 'Pharmacy', status: 'Active', mfa: 'Enabled', lastLogin: hoursAgo(4), createdAt: '2024-07-01' },
]);

export const initialPermissionLog = demo([
  { id: 'plog-01', role: 'HR Manager', module: 'Payroll', change: 'Granted export', by: 'Muhammad Affan', at: hoursAgo(20) },
  { id: 'plog-02', role: 'Support Agent', module: 'Helpdesk', change: 'Granted create, edit', by: 'Muhammad Affan', at: hoursAgo(72) },
  { id: 'plog-03', role: 'Doctor', module: 'Wards & Beds', change: 'Revoked delete', by: 'Dr. Usman Ghani', at: hoursAgo(130) },
]);

export { DEPARTMENTS };
