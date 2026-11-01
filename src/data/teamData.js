/**
 * Demo data for the Team module (attendance, leaves, daily tasks, follow-ups,
 * reminders, daily reports). Everything is dated relative to today so the
 * screens always look current. Frontend only — stored in localStorage.
 */
import { addDays, addMinutes, format, isSunday, subDays } from 'date-fns';
import { initialTeamMembers } from './projectManagementData';

const today = new Date();
const day = (offset) => format(addDays(today, offset), 'yyyy-MM-dd');
const names = initialTeamMembers.map(m => m.name);
const deptOf = (name) => initialTeamMembers.find(m => m.name === name)?.department || 'Quality Operations';

export const DEPARTMENTS = [...new Set(initialTeamMembers.map(m => m.department))];

// Fixed tones per department (dot + tinted chip), legible in both themes.
export const DEPARTMENT_COLORS = ['#145D68', '#F78D00', '#1E8C55', '#1C7D86', '#A45B0B', '#CDB64C', '#B83A2C', '#627579'];
export const deptColor = (dept) => DEPARTMENT_COLORS[Math.max(0, DEPARTMENTS.indexOf(dept)) % DEPARTMENT_COLORS.length];

// ── Attendance ──────────────────────────────────────────────────────────
// Weekday history for every member, plus today's partial roster.
const pad = (n) => String(n).padStart(2, '0');
const timeAt = (h, m) => `${pad(h)}:${pad(m)}`;

function buildAttendance() {
  const rows = [];
  for (let back = 13; back >= 1; back--) {
    const d = subDays(today, back);
    if (isSunday(d)) continue;
    names.forEach((name, i) => {
      const seed = (back * 7 + i * 3) % 11;
      if (seed === 10) return; // absent / on leave
      const inH = seed < 2 ? 9 : 8;
      const inM = seed < 2 ? 20 + seed * 7 : 40 + (seed * 2) % 20;
      rows.push({
        id: `att-${format(d, 'MMdd')}-${i}`,
        member: name,
        date: format(d, 'yyyy-MM-dd'),
        checkIn: timeAt(inH, inM),
        checkOut: timeAt(17 + (seed % 3 === 0 ? 1 : 0), (seed * 9) % 60),
        mode: seed % 5 === 0 ? 'Remote' : seed % 7 === 0 ? 'Client site' : 'Office',
      });
    });
  }
  // Today's roster is always shown so the demo never looks empty.
  {
    const todayPlan = [[8, 52, 'Office'], [9, 24, 'Office'], [8, 47, 'Remote'], null, [9, 3, 'Client site'], [8, 58, 'Office'], [9, 41, 'Office'], null];
    names.forEach((name, i) => {
      const p = todayPlan[i % todayPlan.length];
      if (!p) return;
      rows.push({ id: `att-today-${i}`, member: name, date: day(0), checkIn: timeAt(p[0], p[1]), checkOut: '', mode: p[2] });
    });
  }
  return rows;
}
export const initialAttendance = buildAttendance();

// ── Leaves ──────────────────────────────────────────────────────────────
export const LEAVE_TYPES = {
  Annual: { total: 14, color: '#145D68' },
  Sick: { total: 8, color: '#B83A2C' },
  Casual: { total: 6, color: '#F78D00' },
  'Work from home': { total: 12, color: '#1C7D86' },
};

const leave = (id, member, type, from, to, status, reason, extra = {}) => ({
  id: `lv-${id}`, member, department: deptOf(member), type, from: day(from), to: day(to), halfDay: false, status, reason,
  appliedOn: day(Math.min(from, 0) - 3), ...extra,
});

export const initialLeaveRequests = [
  leave('01', names[3], 'Annual', 0, 2, 'Approved', 'Family wedding in Lahore'),
  leave('02', names[7], 'Sick', 0, 0, 'Approved', 'Flu — doctor advised rest'),
  leave('03', names[1], 'Annual', 6, 10, 'Pending', 'Umrah trip'),
  leave('04', names[5], 'Casual', 3, 3, 'Pending', 'Personal errand', { halfDay: true }),
  leave('05', names[2], 'Work from home', 1, 1, 'Pending', 'Internet installation at home'),
  leave('06', names[6], 'Annual', -12, -10, 'Approved', 'Vacation'),
  leave('07', names[4], 'Sick', -6, -5, 'Approved', 'Dental surgery'),
  leave('08', names[0], 'Casual', -20, -20, 'Rejected', 'Overlaps with ISO audit week'),
  leave('09', 'Admin User', 'Annual', -30, -28, 'Approved', 'Eid holidays extension'),
  leave('10', 'Admin User', 'Sick', -9, -9, 'Approved', 'Migraine'),
];

// ── Daily tasks ─────────────────────────────────────────────────────────
const at = (offsetDays, h, m) => {
  const d = addDays(today, offsetDays);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};
const statusFor = (p) => (p >= 100 ? 'Done' : p > 0 ? 'In Progress' : 'To Do');

const task = (id, title, assignee, date, progress, priority, dueTime, extra = {}) => {
  const department = extra.department || deptOf(assignee);
  const history = [{ at: at(date, 8, 30), by: 'Admin User', action: 'created', detail: `Assigned to ${assignee || department}` }];
  if (progress > 0) history.push({ at: at(date, 11, 15), by: assignee, action: 'progress', detail: `Progress set to ${Math.min(progress, 60)}%` });
  if (progress > 60) history.push({ at: at(date, 15, 40), by: assignee, action: progress >= 100 ? 'completed' : 'progress', detail: progress >= 100 ? 'Marked as done' : `Progress set to ${progress}%` });
  return {
    id: `dt-${id}`, title, description: extra.description || '', department, assignee, date: day(date), dueTime,
    priority, progress, status: statusFor(progress), repeatDaily: !!extra.repeatDaily, history,
  };
};

export const initialDailyTasks = [
  task('01', 'Review CAPA log for Indus Textiles', names[0], 0, 70, 'High', '12:00'),
  task('02', 'Prepare ISO 45001 audit checklist', names[1], 0, 40, 'High', '15:00'),
  task('03', 'Update document control register', names[2], 0, 100, 'Medium', '11:00', { repeatDaily: true }),
  task('04', 'Configure QMS dashboard for Medisure', names[3], 0, 20, 'Medium', '17:00'),
  task('05', 'Calibrate pressure gauges — lab bay 2', names[4], 0, 0, 'High', '14:00'),
  task('06', 'Run SPC analysis on Sapphire Steel data', names[5], 0, 55, 'Medium', '16:30'),
  task('07', 'Close out NCR-2219 corrective action', names[6], 0, 100, 'Low', '10:00'),
  task('08', 'Environmental aspects register review', names[7], 0, 0, 'Low', '17:30'),
  task('09', 'Morning toolbox talk — safety briefing', '', 0, 100, 'Medium', '09:30', { department: DEPARTMENTS[1], repeatDaily: true }),
  task('10', 'Draft supplier audit report — Crescent', names[1], 0, 85, 'High', '13:00'),
  task('11', 'Follow up on overdue calibration certificates', names[4], -1, 100, 'Medium', '12:00'),
  task('12', 'Kaizen workshop slide deck', names[5], -1, 100, 'Low', '16:00'),
  task('13', 'Root cause analysis — packaging defects', names[6], -1, 60, 'High', '15:00'),
  task('14', 'Internal audit schedule for Q4', names[0], -1, 100, 'Medium', '11:30'),
  task('15', 'Migrate SOPs to digital QMS', names[3], 1, 0, 'Medium', '17:00'),
  task('16', 'Training needs analysis — Lucky Cement', names[2], 1, 0, 'High', '14:00'),
];

// ── Follow-ups ──────────────────────────────────────────────────────────
const fu = (id, title, contact, company, channel, owner, offsetDays, h, m, priority, extra = {}) => ({
  id: `fu-${id}`, title, contact, company, channel, owner, due: at(offsetDays, h, m), priority,
  status: extra.status || 'Open', outcome: extra.outcome || '', notes: extra.notes || '',
});

export const initialFollowUps = [
  fu('01', 'Send revised ISO 9001 proposal', 'Hamza Qureshi', 'Indus Textiles', 'Email', names[0], -2, 11, 0, 'High'),
  fu('02', 'Confirm audit dates for stage 2', 'Ayesha Siddiqui', 'Medisure Pharma', 'Call', names[1], -1, 15, 30, 'High'),
  fu('03', 'Share training calendar', 'Fatima Raza', 'Crescent Foods', 'WhatsApp', names[2], 0, 10, 0, 'Medium'),
  fu('04', 'Discuss Six Sigma project scope', 'Omar Farooq', 'Sapphire Steel', 'Meeting', names[5], 0, 14, 0, 'High'),
  fu('05', 'Chase pending invoice INV-1042', 'Imran Sheikh', 'Northgate Logistics', 'Call', names[6], 0, 16, 30, 'Medium'),
  fu('06', 'Check satisfaction after GMP audit', 'Zainab Malik', 'Apex Auto Parts', 'Call', names[7], 1, 11, 0, 'Low'),
  fu('07', 'Send calibration certificates', 'Sana Javed', 'Lucky Cement', 'Email', names[4], 1, 15, 0, 'Medium'),
  fu('08', 'Demo digital QMS platform', 'Kashif Mehmood', 'Bolan Mining', 'Meeting', names[3], 3, 12, 0, 'High'),
  fu('09', 'Renewal reminder — annual contract', 'Rabia Anwar', 'Sialkot Surgical', 'Email', names[0], 5, 10, 0, 'Medium'),
  fu('10', 'Introduce HSE consultant', 'Tahir Abbasi', 'Gulf Chemicals', 'WhatsApp', names[7], -3, 12, 0, 'Low', { status: 'Done', outcome: 'Intro call booked for next week' }),
  fu('11', 'Collect feedback on internal audit', 'Saima Rehman', 'Lahore Garments', 'Call', names[1], -2, 9, 30, 'Medium', { status: 'Done', outcome: 'Positive — wants quarterly audits' }),
  fu('12', 'Send case study pack', 'Adnan Saeed', 'Pearl Hospitality', 'Email', names[2], -1, 17, 0, 'Low', { status: 'Done', outcome: 'Sent with pricing sheet' }),
];

// ── Reminders ───────────────────────────────────────────────────────────
const rem = (id, title, remindAt, extra = {}) => ({
  id: `rem-${id}`, title, remindAt, repeat: extra.repeat || 'none', note: extra.note || '', assignee: extra.assignee || 'Admin User',
  done: !!extra.done, notified: !!extra.notified, createdAt: today.toISOString(),
});

export const initialReminders = [
  rem('01', 'Call Hamza back about the CAPA tracker', addMinutes(today, 1).toISOString(), { note: 'He asked for an update before lunch.' }),
  rem('02', 'Approve pending leave requests', addMinutes(today, 45).toISOString()),
  rem('03', 'Submit daily report', at(0, 17, 30), { repeat: 'daily' }),
  rem('04', 'Weekly management review prep', at(2, 9, 0), { repeat: 'weekly' }),
  rem('05', 'Renew ISO 17025 accreditation documents', at(6, 10, 0), { note: 'Send to PNAC before the 15th.' }),
  rem('06', 'Send the newsletter campaign', at(-1, 11, 0), { done: true, notified: true }),
];

// ── Daily reports ───────────────────────────────────────────────────────
const MOODS = ['On track', 'On track', 'At risk', 'On track', 'Blocked', 'On track'];
const WORK = [
  ['Reviewed CAPA log and closed 3 actions', 'Prepared audit checklist draft'],
  ['Completed supplier audit at Crescent Foods', 'Drafted findings summary'],
  ['Updated document control register', 'Ran awareness session for 12 staff'],
  ['Configured QMS workflows', 'Fixed dashboard permissions'],
  ['Calibrated 14 instruments', 'Logged results in LIMS'],
  ['SPC analysis for 3 production lines', 'Shared control charts with client'],
];

function buildReports() {
  const rows = [];
  for (let back = 4; back >= 0; back--) {
    const d = subDays(today, back);
    if (back > 0 && isSunday(d)) continue;
    names.forEach((name, i) => {
      if (back === 0 && i % 3 === 2) return; // a few not submitted yet today
      const k = (back + i) % WORK.length;
      const mood = MOODS[(back * 2 + i) % MOODS.length];
      rows.push({
        id: `dr-${format(d, 'MMdd')}-${i}`,
        date: format(d, 'yyyy-MM-dd'),
        member: name,
        department: deptOf(name),
        tasksCompleted: WORK[k].join('; '),
        hours: 7 + ((back + i) % 3) * 0.5,
        status: mood,
        blockers: mood === 'Blocked' ? 'Waiting for client data export' : mood === 'At risk' ? 'Lab equipment booked by another team' : '',
        tomorrowPlan: 'Continue current assignments and client follow-ups',
      });
    });
  }
  return rows;
}
export const initialDailyReports = buildReports();
