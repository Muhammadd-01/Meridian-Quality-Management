/**
 * Demo calendar events, dated relative to today so the current month always
 * has a populated schedule. `endDate` (optional) makes an event span days;
 * `type` picks its colour on the Calendar page.
 */
import { addDays, format } from 'date-fns';

const day = (offset) => format(addDays(new Date(), offset), 'yyyy-MM-dd');

const ev = (id, title, type, offset, time = '', extra = {}) => ({
  id: `evt-demo-${id}`,
  title,
  type,
  date: day(offset),
  time,
  relatedTo: '',
  notes: '',
  isDemo: true,
  ...extra,
});

export const initialCalendarEvents = [
  ev('01', 'Client kickoff — Sapphire Steel', 'Meeting', -10, '10:00'),
  ev('02', 'ISO 9001 internal audit', 'Audit', -8, '', { relatedTo: 'Indus Textiles' }),
  ev('03', 'Supplier audit week', 'Audit', -4, '09:00', { endDate: day(-2), notes: 'On-site supplier audits for Crescent Foods.' }),
  ev('04', 'Weekly QA stand-up', 'Meeting', -3, '09:30'),
  ev('05', 'Lunch with Crescent Foods', 'Meeting', 0, '12:30'),
  ev('06', 'Management review meeting', 'Meeting', 0, '15:00', { endTime: '16:30' }),
  ev('07', 'ISO 45001 awareness training', 'Training', 1, '10:00', { endTime: '13:00' }),
  ev('08', 'Weekly QA stand-up', 'Meeting', 4, '09:30'),
  ev('09', 'CAPA report due', 'Deadline', 5, '17:00'),
  ev('10', 'Six Sigma Green Belt bootcamp', 'Training', 8, '09:00', { endDate: day(11) }),
  ev('11', 'Certificate renewal reminder', 'Reminder', 14, ''),
  ev('12', 'GMP gap assessment — Medisure', 'Audit', 17, '09:00', { endDate: day(18) }),
];
