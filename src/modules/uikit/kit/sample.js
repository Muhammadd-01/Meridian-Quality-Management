/** Illustrative people and records for gallery examples (not stored anywhere). */
export const PEOPLE = [
  { name: 'Ayesha Khan', role: 'Quality Lead', dept: 'Quality', city: 'Lahore', email: 'ayesha.khan@meridian.pk' },
  { name: 'Bilal Ahmed', role: 'Lead Auditor', dept: 'Audit', city: 'Karachi', email: 'bilal.ahmed@meridian.pk' },
  { name: 'Sana Malik', role: 'Trainer', dept: 'Training', city: 'Islamabad', email: 'sana.malik@meridian.pk' },
  { name: 'Usman Tariq', role: 'Sales Manager', dept: 'Sales', city: 'Faisalabad', email: 'usman.tariq@meridian.pk' },
  { name: 'Hira Siddiqui', role: 'Consultant', dept: 'Consulting', city: 'Rawalpindi', email: 'hira.siddiqui@meridian.pk' },
  { name: 'Daniel Moore', role: 'Account Director', dept: 'Sales', city: 'Dubai', email: 'daniel.moore@meridian.pk' },
  { name: 'Fatima Zahra', role: 'HR Partner', dept: 'People', city: 'Multan', email: 'fatima.zahra@meridian.pk' },
  { name: 'Omar Farooq', role: 'Engineer', dept: 'Platform', city: 'Peshawar', email: 'omar.farooq@meridian.pk' },
  { name: 'Priya Nair', role: 'Analyst', dept: 'Finance', city: 'London', email: 'priya.nair@meridian.pk' },
  { name: 'Zain Abbas', role: 'Field Auditor', dept: 'Audit', city: 'Quetta', email: 'zain.abbas@meridian.pk' },
  { name: 'Mehwish Raza', role: 'Designer', dept: 'Marketing', city: 'Lahore', email: 'mehwish.raza@meridian.pk' },
  { name: 'Hamza Qureshi', role: 'Support Agent', dept: 'Support', city: 'Hyderabad', email: 'hamza.qureshi@meridian.pk' },
];

export const initials = (name) => name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

/** Avatar tint classes (theme-aware 50 surfaces with toned text). */
export const AVATAR_TINTS = [
  'bg-primary-100 text-primary-700 [[data-theme=dark]_&]:text-primary-300',
  'bg-info-100 text-info-700 [[data-theme=dark]_&]:text-info-300',
  'bg-accent-100 text-accent-700 [[data-theme=dark]_&]:text-accent-300',
  'bg-danger-100 text-danger-700 [[data-theme=dark]_&]:text-danger-300',
  'bg-success-100 text-success-700 [[data-theme=dark]_&]:text-success-300',
  'bg-warning-100 text-warning-700 [[data-theme=dark]_&]:text-warning-300',
];

export const formatPKR = (n) => `PKR ${Math.round(n).toLocaleString('en-PK')}`;
