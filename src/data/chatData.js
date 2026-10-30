/**
 * Demo data for the Chat page (frontend only — no messaging backend yet).
 * Conversations are keyed by id; `kind` is 'direct' or 'group'.
 */

export const chatContacts = [
  { id: 'u-hamza', name: 'Hamza Qureshi', role: 'Quality Manager · Indus Textiles', status: 'online' },
  { id: 'u-ayesha', name: 'Ayesha Siddiqui', role: 'QA Director · Medisure Pharma', status: 'online' },
  { id: 'u-bilal', name: 'Bilal Khan', role: 'Lead Auditor · Meridian', status: 'away' },
  { id: 'u-fatima', name: 'Fatima Raza', role: 'Operations Head · Crescent Foods', status: 'online' },
  { id: 'u-usman', name: 'Usman Tariq', role: 'Six Sigma Black Belt · Meridian', status: 'offline' },
  { id: 'u-zainab', name: 'Zainab Malik', role: 'Compliance Officer · Apex Auto Parts', status: 'away' },
  { id: 'u-omar', name: 'Omar Farooq', role: 'Plant Manager · Sapphire Steel', status: 'offline' },
  { id: 'u-nadia', name: 'Nadia Hussain', role: 'Training Coordinator · Meridian', status: 'online' },
  { id: 'u-imran', name: 'Imran Sheikh', role: 'CEO · Northgate Logistics', status: 'offline' },
  { id: 'u-sana', name: 'Sana Javed', role: 'HSE Manager · Lucky Cement', status: 'online' },
];

const msg = (id, from, text, time) => ({ id, from, text, time });

export const initialConversations = [
  {
    id: 'c-hamza',
    kind: 'direct',
    contactId: 'u-hamza',
    unread: 0,
    messages: [
      msg('m1', 'me', 'Hi Hamza, how are you? Shall we confirm the date for the ISO 9001 surveillance audit?', '10:02'),
      msg('m2', 'u-hamza', 'Yes, everything is on track from our side.', '10:06'),
      msg('m3', 'me', 'Great — next meeting tomorrow at 10:00 AM to walk through the corrective action log.', '10:06'),
      msg('m4', 'u-hamza', "Perfect, that works. I'll have the CAPA records ready.", '10:07'),
    ],
  },
  {
    id: 'c-ayesha',
    kind: 'direct',
    contactId: 'u-ayesha',
    unread: 2,
    messages: [
      msg('m1', 'u-ayesha', 'Morning! We reviewed the GMP gap assessment report.', '09:41'),
      msg('m2', 'me', 'Thanks Ayesha. Any questions on the deviation-handling findings?', '09:44'),
      msg('m3', 'u-ayesha', 'Only on finding 4.2 — can we schedule a short call?', '09:52'),
      msg('m4', 'u-ayesha', "I've finished the review, see you soon.", '09:53'),
    ],
  },
  {
    id: 'c-bilal',
    kind: 'direct',
    contactId: 'u-bilal',
    unread: 0,
    messages: [
      msg('m1', 'u-bilal', 'Audit checklist for Crescent Foods is uploaded to the project.', 'Yesterday'),
      msg('m2', 'me', 'Thanks Bilal, I will review tonight.', 'Yesterday'),
      msg('m3', 'u-bilal', 'This new checklist template is excellent!', 'Yesterday'),
    ],
  },
  {
    id: 'c-fatima',
    kind: 'direct',
    contactId: 'u-fatima',
    unread: 1,
    messages: [
      msg('m1', 'me', 'Hi Fatima, sharing the HACCP training schedule for next week.', '08:15'),
      msg('m2', 'u-fatima', 'Nice to meet you yesterday — the team is excited for the training.', '08:30'),
    ],
  },
  {
    id: 'c-usman',
    kind: 'direct',
    contactId: 'u-usman',
    unread: 0,
    messages: [
      msg('m1', 'u-usman', 'DMAIC charter for Sapphire Steel is drafted.', 'Mon'),
      msg('m2', 'me', 'Looks good. Let us add the baseline sigma level.', 'Mon'),
      msg('m3', 'u-usman', "Hey! I'm available whenever you want to go through it.", 'Mon'),
    ],
  },
  {
    id: 'c-zainab',
    kind: 'direct',
    contactId: 'u-zainab',
    unread: 0,
    messages: [
      msg('m1', 'u-zainab', 'IATF 16949 documentation package received, thank you.', 'Sun'),
      msg('m2', 'me', 'You are welcome. The internal audit is pencilled in for the 12th.', 'Sun'),
    ],
  },
  {
    id: 'g-audit',
    kind: 'group',
    name: 'Audit Team',
    members: ['u-bilal', 'u-usman', 'u-nadia'],
    unread: 3,
    messages: [
      msg('m1', 'u-bilal', 'Reminder: Medisure Pharma stage 2 audit starts Monday.', '11:20'),
      msg('m2', 'u-nadia', 'Travel and accommodation are booked for everyone.', '11:24'),
      msg('m3', 'me', 'Thanks both. Please upload your sampling plans by Friday.', '11:30'),
      msg('m4', 'u-usman', 'Will do — mine is almost finished.', '11:32'),
    ],
  },
  {
    id: 'g-sixsigma',
    kind: 'group',
    name: 'Six Sigma Projects',
    members: ['u-usman', 'u-omar', 'u-hamza'],
    unread: 0,
    messages: [
      msg('m1', 'u-omar', 'Scrap rate dropped to 2.1% after the control plan went live.', 'Yesterday'),
      msg('m2', 'u-usman', 'That is a 38% reduction against baseline. Excellent work!', 'Yesterday'),
    ],
  },
  {
    id: 'g-training',
    kind: 'group',
    name: 'Training Coordinators',
    members: ['u-nadia', 'u-fatima', 'u-sana'],
    unread: 0,
    messages: [
      msg('m1', 'u-nadia', 'ISO 45001 awareness session slots are open for November.', 'Tue'),
      msg('m2', 'u-sana', 'Please reserve two batches for Lucky Cement.', 'Tue'),
    ],
  },
];

/** Canned replies used to simulate the other side answering in the demo. */
export const demoReplies = [
  'Sounds good, thank you!',
  "Noted — I'll update the team.",
  'Can you share the document when you get a chance?',
  'Perfect, see you then.',
  'Let me check and get back to you shortly.',
  'Great, that works for us.',
];
