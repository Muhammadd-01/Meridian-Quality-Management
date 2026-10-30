/**
 * Demo data for Bulk Email Management (frontend only — no email service is
 * connected). Clients can belong to several groups; group order is the order
 * shown in the Client Groups list.
 */

export const GROUP_COLORS = ['#093F50', '#1E8C55', '#F78D00', '#A45B0B', '#CDB64C', '#1C7D86', '#B83A2C', '#627579'];

export const initialEmailGroups = [
  { id: 'grp-vip', name: 'VIP Clients', color: '#093F50' },
  { id: 'grp-active', name: 'Active Customers', color: '#1E8C55' },
  { id: 'grp-prospects', name: 'Prospects', color: '#F78D00' },
  { id: 'grp-inactive', name: 'Inactive', color: '#A45B0B' },
  { id: 'grp-newsletter', name: 'Newsletter Subscribers', color: '#CDB64C' },
  { id: 'grp-partners', name: 'Partners', color: '#1C7D86' },
];

const PEOPLE = [
  ['Ahmed', 'Raza', 'Indus Textiles'], ['Sana', 'Javed', 'Lucky Cement'], ['Hamza', 'Qureshi', 'Sapphire Steel'],
  ['Ayesha', 'Siddiqui', 'Medisure Pharma'], ['Bilal', 'Chaudhry', 'Crescent Foods'], ['Fatima', 'Noor', 'Apex Auto Parts'],
  ['Omar', 'Farooq', 'Northgate Logistics'], ['Zainab', 'Malik', 'Pak Polymers'], ['Usman', 'Tariq', 'Karachi Packaging'],
  ['Hira', 'Aslam', 'Green Valley Dairy'], ['Imran', 'Sheikh', 'Atlas Engineering'], ['Mariam', 'Iqbal', 'Nova Diagnostics'],
  ['Kashif', 'Mehmood', 'Bolan Mining'], ['Nadia', 'Hussain', 'Punjab Agro'], ['Faisal', 'Butt', 'Orient Electronics'],
  ['Rabia', 'Anwar', 'Sialkot Surgical'], ['Tahir', 'Abbasi', 'Gulf Chemicals'], ['Saima', 'Rehman', 'Lahore Garments'],
  ['Adnan', 'Saeed', 'Pearl Hospitality'], ['Mehwish', 'Khalid', 'Delta Plastics'], ['Junaid', 'Akhtar', 'Shan Foods'],
  ['Amna', 'Nihal', 'Habib Healthcare'], ['Waqas', 'Ali', 'Frontier Ceramics'], ['Sadia', 'Pervez', 'Metro Retail'],
  ['Danish', 'Kamal', 'Unity Pharmaceuticals'], ['Iqra', 'Shahid', 'Coastal Fisheries'], ['Asad', 'Mirza', 'Prime Batteries'],
  ['Komal', 'Yousaf', 'BlueLine Aviation'], ['Naveed', 'Hassan', 'Kohinoor Mills'], ['Laiba', 'Zafar', 'Zenith Labs'],
  ['Shoaib', 'Riaz', 'Pak Rail Freight'], ['Huma', 'Saleem', 'Al-Noor Hospitals'], ['Rizwan', 'Nawaz', 'Cityline Construction'],
  ['Sobia', 'Arif', 'Mehran Sugar'], ['Talha', 'Usmani', 'Indus Water Works'], ['Areeba', 'Fazal', 'Hilal Confectionery'],
  ['Zeeshan', 'Haider', 'Fauji Fertilizers'], ['Maham', 'Jamil', 'Nestlé Pakistan'], ['Arslan', 'Shah', 'Engro Polymer'],
  ['Kiran', 'Bashir', 'Getz Pharma'], ['Fahad', 'Lodhi', 'Millat Tractors'], ['Anum', 'Waheed', 'Attock Refinery'],
  ['Saad', 'Ghani', 'Dawlance Appliances'], ['Noor', 'Fatima', 'Interloop'], ['Yasir', 'Jamal', 'K-Electric'],
  ['Mahnoor', 'Asif', 'Searle Pakistan'], ['Ali', 'Haris', 'Packages Limited'], ['Rimsha', 'Tanveer', 'Hub Power'],
];

// Deterministic group/status mix so the demo looks the same everywhere.
const GROUP_PATTERN = [
  ['grp-vip', 'grp-newsletter'], ['grp-active'], ['grp-prospects'], ['grp-vip'], ['grp-newsletter'],
  ['grp-active', 'grp-newsletter'], ['grp-partners'], ['grp-prospects', 'grp-newsletter'], ['grp-inactive'], ['grp-active'],
  ['grp-vip', 'grp-partners'], ['grp-active'],
];

const slug = (s) => s.toLowerCase().replace(/[^a-z]+/g, '');

export const initialEmailClients = PEOPLE.map(([first, last, company], i) => {
  const groups = GROUP_PATTERN[i % GROUP_PATTERN.length];
  const status = groups.includes('grp-inactive') ? 'Inactive' : i % 13 === 6 ? 'Unsubscribed' : 'Active';
  return {
    id: `bec-${String(i + 1).padStart(3, '0')}`,
    name: `${first} ${last}`,
    email: `${slug(first)}.${slug(last)}@${slug(company.split(" ")[0])}.com`,
    company,
    groups: [...groups],
    status,
    lastEmailed: i % 4 === 0 ? null : `2026-10-${String(28 - (i % 20)).padStart(2, '0')}`,
  };
});

export const EMAIL_TEMPLATES = [
  { id: 'blank', name: 'Blank email', subject: '', body: '' },
  {
    id: 'audit-reminder',
    name: 'Audit reminder',
    subject: 'Reminder: your upcoming surveillance audit',
    body: 'Dear {{first_name}},\n\nThis is a friendly reminder that your surveillance audit is coming up. Please have your corrective action records and management review minutes ready.\n\nKind regards,\nMeridian Quality Management Professionals',
  },
  {
    id: 'newsletter',
    name: 'Monthly quality newsletter',
    subject: 'Quality Insights — November edition',
    body: 'Hi {{first_name}},\n\nThis month: ISO 9001:2026 revision updates, a Lean Six Sigma case study from {{company}}\'s sector, and our upcoming training calendar.\n\nRead the full newsletter on our website.\n\nThe Meridian team',
  },
  {
    id: 'training-invite',
    name: 'Training invitation',
    subject: 'You are invited: ISO 45001 awareness training',
    body: 'Dear {{first_name}},\n\nWe would like to invite the {{company}} team to our ISO 45001 awareness training next month. Seats are limited — reply to reserve your place.\n\nBest regards,\nMeridian Training Team',
  },
];
