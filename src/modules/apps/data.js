/**
 * Demo seed data for the 'apps' module group (Chat, AI Chat, Calls, Email,
 * File Manager, Kanban, Notes, To Do, Workflow & Approvals).
 *
 * Every record carries `isDemo: true`. Dates are relative to the first load so
 * the demo workspace always looks current. Must not import src/data/entities.js.
 */

const DAY = 86400000;
const now = Date.now();
const at = (days = 0, hours = 0, minutes = 0) => new Date(now - days * DAY - hours * 3600000 - minutes * 60000).toISOString();
const dateOnly = (offsetDays = 0) => {
  const d = new Date(now + offsetDays * DAY);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** People the demo workspace talks to. */
export const PEOPLE = [
  { name: 'Sarah Ahmed', role: 'Lead Quality Auditor', email: 'sarah.ahmed@meridian.com', phone: '+92 300 1234501' },
  { name: 'Ali Khan', role: 'Calibration Engineer', email: 'ali.khan@meridian.com', phone: '+92 321 4455602' },
  { name: 'Aisha Rahman', role: 'Project Manager', email: 'aisha.rahman@meridian.com', phone: '+92 333 7788103' },
  { name: 'Marcus Lee', role: 'Supplier Quality Lead', email: 'marcus.lee@meridian.com', phone: '+1 312 555 0181' },
  { name: 'Sofia Reyes', role: 'Document Controller', email: 'sofia.reyes@meridian.com', phone: '+34 612 448 920' },
  { name: 'Bilal Hussain', role: 'Finance Manager', email: 'bilal.hussain@meridian.com', phone: '+92 345 2200417' },
  { name: 'Fatima Malik', role: 'HR Business Partner', email: 'fatima.malik@meridian.com', phone: '+92 302 9911208' },
  { name: 'Usman Tariq', role: 'Field Auditor', email: 'usman.tariq@meridian.com', phone: '+92 311 6677309' },
  { name: 'Hina Shah', role: 'Training Coordinator', email: 'hina.shah@meridian.com', phone: '+92 300 5566710' },
  { name: 'Daniel Brooks', role: 'Client Success, Cascade Retail', email: 'daniel.brooks@cascaderetail.com', phone: '+1 312 555 0142' },
  { name: 'Emily Hayes', role: 'Operations Director, Vantage', email: 'emily.hayes@vantage.co.uk', phone: '+44 20 7946 0321' },
  { name: 'Omar Farooq', role: 'Plant Manager, Textile Corp', email: 'omar.farooq@textilecorp.pk', phone: '+92 42 3577 1200' },
];

/* ------------------------------------------------------------------ Chat */

export const initialChatConversations = [
  { id: 'conv-001', type: 'direct', name: 'Sarah Ahmed', role: 'Lead Quality Auditor', online: true, unread: 0, pinned: true, muted: false, archived: false, createdAt: at(40), isDemo: true },
  { id: 'conv-002', type: 'direct', name: 'Ali Khan', role: 'Calibration Engineer', online: true, unread: 2, pinned: false, muted: false, archived: false, createdAt: at(30), isDemo: true },
  { id: 'conv-003', type: 'group', name: 'ISO 9001 Audit Team', members: ['Sarah Ahmed', 'Usman Tariq', 'Sofia Reyes', 'Ali Khan'], online: false, unread: 4, pinned: true, muted: false, archived: false, createdAt: at(25), isDemo: true },
  { id: 'conv-004', type: 'direct', name: 'Marcus Lee', role: 'Supplier Quality Lead', online: false, unread: 0, pinned: false, muted: false, archived: false, createdAt: at(22), isDemo: true },
  { id: 'conv-005', type: 'group', name: 'Finance Approvals', members: ['Bilal Hussain', 'Aisha Rahman'], online: false, unread: 0, pinned: false, muted: true, archived: false, createdAt: at(18), isDemo: true },
  { id: 'conv-006', type: 'direct', name: 'Fatima Malik', role: 'HR Business Partner', online: false, unread: 1, pinned: false, muted: false, archived: false, createdAt: at(12), isDemo: true },
  { id: 'conv-007', type: 'direct', name: 'Hina Shah', role: 'Training Coordinator', online: true, unread: 0, pinned: false, muted: false, archived: false, createdAt: at(9), isDemo: true },
];

const msg = (id, conversationId, sender, text, when, extra = {}) => ({ id, conversationId, sender, text, createdAt: when, attachments: [], isDemo: true, ...extra });

export const initialChatMessages = [
  msg('cm-001', 'conv-001', 'Sarah Ahmed', 'Morning! Did the calibration certificates for Line 3 come back from the lab?', at(1, 3)),
  msg('cm-002', 'conv-001', 'me', 'Yes, all six arrived yesterday. Two pressure gauges are out of tolerance, so I raised an NCR.', at(1, 2, 40)),
  msg('cm-003', 'conv-001', 'Sarah Ahmed', 'Good catch. Please attach the NCR to the audit pack before Thursday.', at(1, 2, 30)),
  msg('cm-004', 'conv-001', 'me', 'Will do. Sharing the summary sheet now.', at(0, 4, 10), { attachments: [{ name: 'Line3-calibration-summary.xlsx', size: 48200, type: 'application/vnd.ms-excel' }] }),
  msg('cm-005', 'conv-001', 'Sarah Ahmed', 'Thanks, looks complete 👍', at(0, 3, 55)),
  msg('cm-006', 'conv-002', 'Ali Khan', 'The torque wrench traceability chain is missing the 2025 certificate.', at(0, 2, 15)),
  msg('cm-007', 'conv-002', 'Ali Khan', 'Can you check with the supplier? I need it before the surveillance audit.', at(0, 2, 12)),
  msg('cm-008', 'conv-003', 'Usman Tariq', 'Opening meeting at Textile Corp is confirmed for Monday 9:30.', at(0, 6)),
  msg('cm-009', 'conv-003', 'Sofia Reyes', 'I have uploaded the revised document control procedure (rev. 7).', at(0, 5, 20)),
  msg('cm-010', 'conv-003', 'Sarah Ahmed', 'Great. Usman, please cover clauses 8.4 and 8.5 on day one.', at(0, 5)),
  msg('cm-011', 'conv-003', 'Ali Khan', 'I will bring the portable calibration kit.', at(0, 1, 5)),
  msg('cm-012', 'conv-004', 'me', 'Marcus, the Q3 supplier scorecards are ready for your review.', at(2, 5)),
  msg('cm-013', 'conv-004', 'Marcus Lee', 'Thanks — I will go through them tomorrow and flag anything below 80%.', at(2, 4)),
  msg('cm-014', 'conv-005', 'Bilal Hussain', 'Travel advance for the Lahore audit (PKR 85,000) is approved.', at(3, 2)),
  msg('cm-015', 'conv-005', 'Aisha Rahman', 'Noted, I will update the project budget.', at(3, 1)),
  msg('cm-016', 'conv-006', 'Fatima Malik', 'Reminder: annual appraisal forms are due by Friday.', at(0, 8)),
  msg('cm-017', 'conv-007', 'me', 'Can we move the internal auditor training to next Wednesday?', at(4, 3)),
  msg('cm-018', 'conv-007', 'Hina Shah', 'Sure, I have rescheduled it and sent the new invite.', at(4, 2)),
];

/* --------------------------------------------------------------- AI Chat */

export const initialAiThreads = [
  {
    id: 'ai-001', title: 'Overdue tasks this week', pinned: true, createdAt: at(2, 4), updatedAt: at(2, 4), isDemo: true,
    messages: [
      { id: 'aim-001', role: 'user', text: 'Show overdue tasks', at: at(2, 4) },
      { id: 'aim-002', role: 'assistant', text: 'This saved thread was created with demo data. Ask again to get a fresh answer from your current task records.', at: at(2, 4) },
    ],
  },
  {
    id: 'ai-002', title: 'Pipeline summary', pinned: false, createdAt: at(5, 1), updatedAt: at(5, 1), isDemo: true,
    messages: [
      { id: 'aim-003', role: 'user', text: 'Summarise the deal pipeline', at: at(5, 1) },
      { id: 'aim-004', role: 'assistant', text: 'This saved thread was created with demo data. Ask again to get a fresh answer from your current deal records.', at: at(5, 1) },
    ],
  },
];

/* ----------------------------------------------------------------- Calls */

export const initialCallLog = [
  { id: 'call-001', contact: 'Sarah Ahmed', phone: '+92 300 1234501', kind: 'voice', direction: 'outgoing', startedAt: at(0, 2), durationSec: 312, notes: 'Agreed audit pack deadline.', isDemo: true },
  { id: 'call-002', contact: 'Daniel Brooks', phone: '+1 312 555 0142', kind: 'video', direction: 'incoming', startedAt: at(0, 5), durationSec: 1840, notes: 'ISO renewal kick-off with Cascade Retail.', isDemo: true },
  { id: 'call-003', contact: 'Ali Khan', phone: '+92 321 4455602', kind: 'voice', direction: 'missed', startedAt: at(0, 7), durationSec: 0, notes: '', isDemo: true },
  { id: 'call-004', contact: 'Emily Hayes', phone: '+44 20 7946 0321', kind: 'video', direction: 'outgoing', startedAt: at(1, 3), durationSec: 2410, notes: 'QMS expansion scope review.', isDemo: true },
  { id: 'call-005', contact: 'Bilal Hussain', phone: '+92 345 2200417', kind: 'voice', direction: 'incoming', startedAt: at(1, 6), durationSec: 145, notes: '', isDemo: true },
  { id: 'call-006', contact: 'Omar Farooq', phone: '+92 42 3577 1200', kind: 'voice', direction: 'outgoing', startedAt: at(2, 2), durationSec: 655, notes: 'Confirmed plant access for auditors.', isDemo: true },
  { id: 'call-007', contact: 'Marcus Lee', phone: '+1 312 555 0181', kind: 'video', direction: 'missed', startedAt: at(3, 1), durationSec: 0, notes: '', isDemo: true },
  { id: 'call-008', contact: 'Hina Shah', phone: '+92 300 5566710', kind: 'video', direction: 'incoming', startedAt: at(4, 4), durationSec: 960, notes: 'Training calendar for Q4.', isDemo: true },
];

/* ----------------------------------------------------------------- Email */

export const EMAIL_FOLDERS = ['inbox', 'sent', 'drafts', 'trash'];
export const EMAIL_LABELS = ['Clients', 'Audits', 'Finance', 'Internal', 'Personal'];

const mail = (id, folder, from, fromEmail, to, subject, body, sentAt, extra = {}) => ({
  id, folder, from, fromEmail, to, cc: '', subject, body, sentAt, labels: [], read: true, starred: false, isDemo: true, ...extra,
});

export const initialEmails = [
  mail('em-001', 'inbox', 'Daniel Brooks', 'daniel.brooks@cascaderetail.com', 'admin@meridianquality.com', 'ISO 9001 renewal — site list for the multi-site audit',
    'Hi team,\n\nPlease find below the five distribution hubs that should be included in the re-certification audit:\n\n• Chicago Central\n• Chicago North\n• Dallas DC1\n• Dallas DC2\n• Fort Worth Returns Centre\n\nCould you confirm the auditor days per site by Friday?\n\nRegards,\nDaniel', at(0, 1), { read: false, starred: true, labels: ['Clients', 'Audits'] }),
  mail('em-002', 'inbox', 'Bilal Hussain', 'bilal.hussain@meridian.com', 'admin@meridianquality.com', 'October expense claims — approval needed',
    'Hi,\n\nThere are three expense claims waiting in Workflow & Approvals totalling PKR 142,500. Please review them before the payroll cut-off on the 25th.\n\nThanks,\nBilal', at(0, 3), { read: false, labels: ['Finance'] }),
  mail('em-003', 'inbox', 'Emily Hayes', 'emily.hayes@vantage.co.uk', 'admin@meridianquality.com', 'QMS expansion — revised scope attached',
    'Hello,\n\nFollowing our call, I have updated the scope to include the Manchester warehouse. Happy to discuss the commercial impact next week.\n\nBest,\nEmily', at(0, 9), { labels: ['Clients'] }),
  mail('em-004', 'inbox', 'Sofia Reyes', 'sofia.reyes@meridian.com', 'admin@meridianquality.com', 'Document control procedure rev. 7 published',
    'Hi all,\n\nRevision 7 of the document control procedure is now live. Key change: all controlled documents must carry a review date no later than 24 months after approval.\n\nSofia', at(1, 2), { labels: ['Internal'] }),
  mail('em-005', 'inbox', 'Omar Farooq', 'omar.farooq@textilecorp.pk', 'admin@meridianquality.com', 'Plant access for Monday audit',
    'Assalam o Alaikum,\n\nGate passes for four auditors are ready. Please bring CNIC copies. Safety induction starts at 9:00 sharp.\n\nRegards,\nOmar Farooq\nPlant Manager', at(1, 7), { read: false, labels: ['Audits'] }),
  mail('em-006', 'inbox', 'Fatima Malik', 'fatima.malik@meridian.com', 'admin@meridianquality.com', 'Annual appraisal forms due Friday',
    'Reminder that appraisal forms for your direct reports are due this Friday. The template is in the HR shared folder.\n\nFatima', at(2, 3), { labels: ['Internal'] }),
  mail('em-007', 'inbox', 'Hina Shah', 'hina.shah@meridian.com', 'admin@meridianquality.com', 'Internal auditor training moved to Wednesday',
    'The ISO 19011 internal auditor training has moved to Wednesday 10:00 in Conference Room B.', at(4, 1), { starred: true, labels: ['Internal'] }),
  mail('em-008', 'sent', 'Admin User', 'admin@meridianquality.com', 'marcus.lee@meridian.com', 'Q3 supplier scorecards ready',
    'Hi Marcus,\n\nThe Q3 supplier scorecards are ready in the File Manager under "Supplier Quality". Please flag anything below 80%.\n\nThanks', at(2, 5), { labels: ['Audits'] }),
  mail('em-009', 'sent', 'Admin User', 'admin@meridianquality.com', 'daniel.brooks@cascaderetail.com', 'Re: Renewal timeline',
    'Hi Daniel,\n\nWe can start the stage 2 audit on 3 November. I will send the audit plan this week.\n\nBest regards', at(5, 2), { labels: ['Clients'] }),
  mail('em-010', 'drafts', 'Admin User', 'admin@meridianquality.com', 'emily.hayes@vantage.co.uk', 'Re: QMS expansion — revised scope',
    'Hi Emily,\n\nThanks for the revised scope. Adding Manchester increases the audit by', at(0, 8)),
  mail('em-011', 'trash', 'Newsletter', 'news@qualitydigest.example', 'admin@meridianquality.com', 'This week in quality management',
    'Top stories: risk-based thinking in practice, and five supplier audit mistakes to avoid.', at(6, 2)),
];

/* ---------------------------------------------------------- File Manager */

export const initialFileFolders = [
  { id: 'fld-audits', name: 'Audit Reports', color: 'primary', createdAt: at(60), isDemo: true },
  { id: 'fld-supplier', name: 'Supplier Quality', color: 'info', createdAt: at(50), isDemo: true },
  { id: 'fld-procedures', name: 'Procedures', color: 'accent', createdAt: at(45), isDemo: true },
  { id: 'fld-training', name: 'Training', color: 'success', createdAt: at(30), isDemo: true },
];

const file = (id, name, folderId, type, size, days, extra = {}) => ({
  id, name, folderId, type, size, starred: false, createdAt: at(days), updatedAt: at(days), owner: 'Admin User', isDemo: true, ...extra,
});

export const initialFiles = [
  file('file-001', 'Textile-Corp-stage1-report.pdf', 'fld-audits', 'application/pdf', 1840000, 1, { starred: true }),
  file('file-002', 'Cascade-Retail-audit-plan.docx', 'fld-audits', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 264000, 2),
  file('file-003', 'Q3-supplier-scorecards.xlsx', 'fld-supplier', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 98000, 3, { starred: true }),
  file('file-004', 'Approved-supplier-list.csv', 'fld-supplier', 'text/csv', 22000, 9),
  file('file-005', 'Document-control-rev7.pdf', 'fld-procedures', 'application/pdf', 512000, 1),
  file('file-006', 'Calibration-procedure.docx', 'fld-procedures', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 174000, 14),
  file('file-007', 'ISO19011-training-deck.pptx', 'fld-training', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 3200000, 6),
  file('file-008', 'Line3-gauge-photo.jpg', null, 'image/jpeg', 640000, 0),
  file('file-009', 'Meeting-notes-oct.txt', null, 'text/plain', 6000, 4),
];

/* ---------------------------------------------------------------- Kanban */

export const KANBAN_LABELS = ['Audit', 'Client', 'Supplier', 'Docs', 'Training', 'Urgent'];

export const initialKanbanBoards = [
  {
    id: 'board-001', name: 'Textile Corp Certification', description: 'ISO 9001 stage 1 & 2 audit for Textile Corp Pakistan.', createdAt: at(20), isDemo: true,
    columns: [
      { id: 'col-backlog', title: 'Backlog', tone: 'gray' },
      { id: 'col-todo', title: 'To Do', tone: 'info' },
      { id: 'col-progress', title: 'In Progress', tone: 'warning' },
      { id: 'col-review', title: 'Review', tone: 'accent' },
      { id: 'col-done', title: 'Done', tone: 'success' },
    ],
  },
  {
    id: 'board-002', name: 'Internal QMS Improvements', description: 'Continuous improvement backlog for our own management system.', createdAt: at(15), isDemo: true,
    columns: [
      { id: 'col-ideas', title: 'Ideas', tone: 'gray' },
      { id: 'col-doing', title: 'Doing', tone: 'warning' },
      { id: 'col-shipped', title: 'Shipped', tone: 'success' },
    ],
  },
];

const card = (id, boardId, columnId, order, title, extra = {}) => ({
  id, boardId, columnId, order, title, description: '', labels: [], assignees: [], dueDate: '', priority: 'Medium', checklist: [], createdAt: at(10), isDemo: true, ...extra,
});

export const initialKanbanCards = [
  card('kc-001', 'board-001', 'col-backlog', 0, 'Collect previous NCR closure evidence', { labels: ['Audit'], assignees: ['Usman Tariq'], dueDate: dateOnly(12), priority: 'Low' }),
  card('kc-002', 'board-001', 'col-backlog', 1, 'Confirm auditor travel and lodging', { labels: ['Client'], assignees: ['Aisha Rahman'], dueDate: dateOnly(6) }),
  card('kc-003', 'board-001', 'col-todo', 0, 'Stage 1 document review', {
    description: 'Review quality manual, procedures and records against ISO 9001:2015.', labels: ['Docs', 'Audit'], assignees: ['Sofia Reyes', 'Sarah Ahmed'], dueDate: dateOnly(3), priority: 'High',
    checklist: [{ id: 'ck-1', text: 'Quality manual', done: true }, { id: 'ck-2', text: 'Control of documented information', done: false }, { id: 'ck-3', text: 'Internal audit records', done: false }],
  }),
  card('kc-004', 'board-001', 'col-todo', 1, 'Prepare opening meeting agenda', { labels: ['Audit'], assignees: ['Sarah Ahmed'], dueDate: dateOnly(5) }),
  card('kc-005', 'board-001', 'col-progress', 0, 'Calibration traceability check — Line 3', {
    labels: ['Urgent', 'Audit'], assignees: ['Ali Khan'], dueDate: dateOnly(-1), priority: 'High',
    checklist: [{ id: 'ck-4', text: 'Pressure gauges', done: true }, { id: 'ck-5', text: 'Temperature probes', done: true }, { id: 'ck-6', text: 'Torque wrenches', done: false }],
  }),
  card('kc-006', 'board-001', 'col-progress', 1, 'Supplier evaluation sampling', { labels: ['Supplier'], assignees: ['Marcus Lee'], dueDate: dateOnly(8) }),
  card('kc-007', 'board-001', 'col-review', 0, 'Draft stage 1 report', { labels: ['Docs'], assignees: ['Sarah Ahmed'], dueDate: dateOnly(2), priority: 'High' }),
  card('kc-008', 'board-001', 'col-done', 0, 'Contract review and audit days', { labels: ['Client'], assignees: ['Aisha Rahman'], dueDate: dateOnly(-7), priority: 'Low' }),
  card('kc-009', 'board-002', 'col-ideas', 0, 'Digitise training attendance sheets', { labels: ['Training'], assignees: ['Hina Shah'] }),
  card('kc-010', 'board-002', 'col-doing', 0, 'Automate supplier scorecard reminders', { labels: ['Supplier'], assignees: ['Marcus Lee'], dueDate: dateOnly(10) }),
  card('kc-011', 'board-002', 'col-shipped', 0, 'New NCR form with root-cause section', { labels: ['Docs'], assignees: ['Sofia Reyes'], dueDate: dateOnly(-3) }),
];

/* ----------------------------------------------------------------- Notes */

export const NOTE_COLORS = ['default', 'green', 'blue', 'amber', 'rose', 'violet'];

export const initialNotes = [
  { id: 'note-001', title: 'Textile Corp audit — key risks', body: 'Dyeing unit has no calibration records for pH meters.\nWaste-water log incomplete for August.\nCheck competence records for new QC inspectors.', color: 'amber', pinned: true, archived: false, tags: ['audit', 'client'], createdAt: at(2), updatedAt: at(0, 3), isDemo: true },
  { id: 'note-002', title: 'Ideas for Q4 newsletter', body: 'Case study: Cascade Retail multi-site certification.\nTips on risk-based thinking.\nIntroduce the new supplier portal.', color: 'blue', pinned: false, archived: false, tags: ['marketing'], createdAt: at(6), updatedAt: at(4), isDemo: true },
  { id: 'note-003', title: 'Calibration intervals', body: 'Pressure gauges: 12 months\nTorque wrenches: 6 months\nTemperature probes: 12 months\nBalances: 6 months (daily check)', color: 'green', pinned: true, archived: false, tags: ['reference'], createdAt: at(20), updatedAt: at(10), isDemo: true },
  { id: 'note-004', title: 'Call with Emily (Vantage)', body: 'Wants Manchester added to scope. Budget approval expected next month. Send revised quotation by Friday.', color: 'rose', pinned: false, archived: false, tags: ['client', 'sales'], createdAt: at(1), updatedAt: at(1), isDemo: true },
  { id: 'note-005', title: 'Books to read', body: 'Juran’s Quality Handbook\nOut of the Crisis — W. Edwards Deming', color: 'violet', pinned: false, archived: false, tags: ['personal'], createdAt: at(15), updatedAt: at(15), isDemo: true },
  { id: 'note-006', title: 'Old: 2025 audit calendar', body: 'Superseded by the 2026 plan in the shared drive.', color: 'default', pinned: false, archived: true, tags: ['audit'], createdAt: at(90), updatedAt: at(60), isDemo: true },
];

/* ------------------------------------------------------------------ To Do */

export const TODO_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export const initialTodoLists = [
  { id: 'list-work', name: 'Work', color: 'primary', isDemo: true },
  { id: 'list-audits', name: 'Audits', color: 'info', isDemo: true },
  { id: 'list-personal', name: 'Personal', color: 'accent', isDemo: true },
];

const todo = (id, listId, title, dueOffset, priority, extra = {}) => ({
  id, listId, title, notes: '', dueDate: dueOffset == null ? '' : dateOnly(dueOffset), priority, completed: false, completedAt: null, createdAt: at(5), isDemo: true, ...extra,
});

export const initialTodos = [
  todo('todo-001', 'list-work', 'Approve October expense claims', 0, 'High'),
  todo('todo-002', 'list-work', 'Send revised quotation to Vantage', 1, 'High'),
  todo('todo-003', 'list-audits', 'Finalise Textile Corp audit plan', 0, 'Urgent', { notes: 'Include day-one clause allocation.' }),
  todo('todo-004', 'list-audits', 'Book calibration lab for Line 3 gauges', 3, 'Medium'),
  todo('todo-005', 'list-work', 'Review Q3 supplier scorecards', -1, 'Medium'),
  todo('todo-006', 'list-personal', 'Renew professional membership (CQI)', 10, 'Low'),
  todo('todo-007', 'list-work', 'Update document control register', 5, 'Low'),
  todo('todo-008', 'list-audits', 'Close NCR-2026-041', -3, 'High', { completed: true, completedAt: at(2) }),
  todo('todo-009', 'list-personal', 'Book flights to Karachi', 7, 'Medium'),
  todo('todo-010', 'list-work', 'Prepare monthly quality KPI pack', -5, 'Medium', { completed: true, completedAt: at(4) }),
];

/* ---------------------------------------------------- Workflow & Approvals */

export const initialWorkflows = [
  {
    id: 'wf-expense', name: 'Expense Claim', module: 'Finance', description: 'Employee expense claims up to PKR 500,000.', active: true, isDemo: true,
    steps: [{ id: 's1', name: 'Line Manager', approver: 'Aisha Rahman' }, { id: 's2', name: 'Finance', approver: 'Bilal Hussain' }],
  },
  {
    id: 'wf-purchase', name: 'Purchase Order', module: 'Procurement', description: 'Purchase orders for equipment and services.', active: true, isDemo: true,
    steps: [{ id: 's1', name: 'Line Manager', approver: 'Aisha Rahman' }, { id: 's2', name: 'Finance', approver: 'Bilal Hussain' }, { id: 's3', name: 'Director', approver: 'Sarah Ahmed' }],
  },
  {
    id: 'wf-leave', name: 'Leave Request', module: 'HR', description: 'Annual, sick and casual leave.', active: true, isDemo: true,
    steps: [{ id: 's1', name: 'Line Manager', approver: 'Aisha Rahman' }, { id: 's2', name: 'HR', approver: 'Fatima Malik' }],
  },
  {
    id: 'wf-doc', name: 'Document Release', module: 'Quality', description: 'Release of new or revised controlled documents.', active: true, isDemo: true,
    steps: [{ id: 's1', name: 'Peer Reviewer', approver: 'Ali Khan' }, { id: 's2', name: 'Quality Director', approver: 'Sarah Ahmed' }],
  },
];

const hist = (id, action, by, step, comment, when) => ({ id, action, by, step, comment, at: when });

export const initialApprovalRequests = [
  {
    id: 'apr-001', number: 'APR-2026-0141', workflowId: 'wf-expense', title: 'Travel to Lahore — Textile Corp audit', requester: 'Usman Tariq', department: 'Audit', amount: 85000,
    description: 'Return flights, two nights hotel and local transport for the stage 1 audit.', status: 'Pending', currentStep: 1, createdAt: at(3), isDemo: true,
    history: [hist('h1', 'submitted', 'Usman Tariq', 0, 'Receipts attached.', at(3)), hist('h2', 'approved', 'Aisha Rahman', 0, 'Within travel policy.', at(2))],
  },
  {
    id: 'apr-002', number: 'APR-2026-0142', workflowId: 'wf-purchase', title: 'Portable calibration kit', requester: 'Ali Khan', department: 'Calibration', amount: 420000,
    description: 'Fluke 754 documenting process calibrator for on-site calibrations.', status: 'Pending', currentStep: 0, createdAt: at(1), isDemo: true,
    history: [hist('h3', 'submitted', 'Ali Khan', 0, 'Quote from two vendors attached; recommending the cheaper one.', at(1))],
  },
  {
    id: 'apr-003', number: 'APR-2026-0138', workflowId: 'wf-leave', title: 'Annual leave 3–7 November', requester: 'Hina Shah', department: 'Training', amount: 0,
    description: 'Five days annual leave. Training sessions covered by Sofia.', status: 'Approved', currentStep: 2, createdAt: at(8), isDemo: true,
    history: [hist('h4', 'submitted', 'Hina Shah', 0, '', at(8)), hist('h5', 'approved', 'Aisha Rahman', 0, 'Enjoy!', at(7)), hist('h6', 'approved', 'Fatima Malik', 1, 'Balance updated.', at(6))],
  },
  {
    id: 'apr-004', number: 'APR-2026-0135', workflowId: 'wf-expense', title: 'Client dinner — Cascade Retail', requester: 'Marcus Lee', department: 'Supplier Quality', amount: 57500,
    description: 'Dinner with Cascade Retail QA team after the closing meeting.', status: 'Rejected', currentStep: 1, createdAt: at(12), isDemo: true,
    history: [hist('h7', 'submitted', 'Marcus Lee', 0, '', at(12)), hist('h8', 'approved', 'Aisha Rahman', 0, '', at(11)), hist('h9', 'rejected', 'Bilal Hussain', 1, 'Exceeds client entertainment limit of PKR 40,000. Please resubmit with the split bill.', at(10))],
  },
  {
    id: 'apr-005', number: 'APR-2026-0143', workflowId: 'wf-doc', title: 'Calibration procedure rev. 4', requester: 'Sofia Reyes', department: 'Quality', amount: 0,
    description: 'Adds torque wrench intervals and the new out-of-tolerance impact assessment.', status: 'Pending', currentStep: 1, createdAt: at(2), isDemo: true,
    history: [hist('h10', 'submitted', 'Sofia Reyes', 0, '', at(2)), hist('h11', 'approved', 'Ali Khan', 0, 'Peer review complete, minor wording fixes made.', at(1, 4))],
  },
];
