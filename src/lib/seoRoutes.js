/**
 * Page titles and descriptions for search engines, social previews and AI
 * answer engines. Plain data (no browser APIs) so the build can also use it to
 * generate sitemap.xml (see vite.config.js).
 */
export const SITE_NAME = 'Meridian Quality Management Professionals';
export const SITE_SHORT = 'Meridian';
export const SITE_DESCRIPTION =
  'Meridian is a quality-management operations workspace for ISO consultants and auditors: CRM, sales pipeline, project delivery, website analytics, reports and calendar in one web app.';

export const ROUTE_META = {
  '/login': { title: 'Sign in', description: 'Sign in to Meridian, the quality-management workspace for ISO consultants and auditors.' },
  '/register': { title: 'Create your account', description: 'Create a Meridian workspace to manage clients, ISO projects and sales in one place.' },
  '/dashboard': { title: 'Dashboard', description: 'Live KPIs for projects, leads, revenue, pipeline, overdue tasks, customers and quotation acceptance, calculated from your records.' },
  '/traffic-overview': { title: 'Traffic Overview', description: 'Website sessions, users, bounce rate, session length, landing pages and referrers, with period comparison and export.' },
  '/crm': { title: 'CRM Overview', description: 'Deals workspace with pipeline value, win rate, deal board, revenue analytics and recent deals.' },
  '/crm/customer-segments': { title: 'Customer Segments', description: 'Group accounts into cohorts by contract size, industry and activity, with client counts and average value.' },
  '/crm/companies': { title: 'Companies', description: 'Account directory with contacts, spend, related leads, deals, quotations, projects and a timeline of interactions.' },
  '/crm/contacts': { title: 'Contacts', description: 'People directory linked to companies, leads, deals and the history of activities, calls and emails.' },
  '/crm/activities': { title: 'Activities', description: 'Meetings, calls, emails and follow-up tasks with priority, owner and one-click completion.' },
  '/crm/calls-emails': { title: 'Calls & Emails', description: 'Communication log of inbound and outbound calls and emails with each account.' },
  '/projects': { title: 'Projects', description: 'Client engagements with task progress, budget, project lead, milestones and filters by status, priority and lead.' },
  '/projects/tasks': { title: 'Tasks', description: 'Deliverables with priority, progress, logged hours, due dates, subtasks, comments and bulk actions.' },
  '/projects/team': { title: 'Team', description: 'Consultants and auditors with roles, departments, workload, projects and active tasks.' },
  '/projects/timesheets': { title: 'Timesheets', description: 'Hours logged against projects and tasks with approvals and a weekly summary per person.' },
  '/sales-analytics': { title: 'Website Analytics', description: 'Revenue intelligence: closed-won revenue, quota attainment, win rate, funnel, forecast and renewals.' },
  '/sales-analytics/leads': { title: 'Leads', description: 'Enquiries with rule-based scoring, duplicate detection and one-click conversion to deals.' },
  '/sales-analytics/deals': { title: 'Deals', description: 'Opportunities by stage and probability with weighted forecast and won/lost reasons.' },
  '/sales-analytics/quotations': { title: 'Quotations', description: 'Quotation workflow from draft to accepted or declined, with history, expiry and print/PDF.' },
  '/sales-analytics/pipeline': { title: 'Pipeline', description: 'Drag-and-drop pipeline board from lead to closed won with stage conversion.' },
  '/calendar': { title: 'Calendar', description: 'Task deadlines, activities, deal closes, quotation expiry and project milestones in one calendar.' },
  '/crm/bulk-email': { title: 'Bulk Email', description: 'Client groups, filtered mailing lists and bulk email campaigns.' },
  '/crm/call-center': { title: 'Call Center', description: 'Dial any number or contact, run calls with live controls and keep a call log.' },
  '/sales-analytics/lead-capture': { title: 'Social Lead Capture', description: 'Leads captured from Facebook Lead Ads and LinkedIn Lead Gen Forms, ready to add to the CRM.' },
  '/sales-analytics/purchase-orders': { title: 'Purchase Orders', description: 'Purchase orders from draft to approval, sending and receipt, with line items and print.' },
  '/team/attendance': { title: 'Check-in / Out', description: 'Team attendance with live check-in, check-out, breaks and weekly history.' },
  '/team/daily-tasks': { title: 'Daily Tasks', description: 'Daily tasks assigned to members and departments, with progress and full history.' },
  '/team/follow-ups': { title: 'Team Follow-ups', description: 'Client follow-ups owned by the team, grouped by due date with outcomes.' },
  '/team/leaves': { title: 'Leaves', description: 'Leave requests, approvals, balances and who is out.' },
  '/team/reminders': { title: 'Reminders', description: 'In-app reminders with snooze, repeat and pop-up alerts.' },
  '/team/daily-reports': { title: 'Daily Reports', description: 'End-of-day reports from every member, with Excel import and export.' },
  '/chat': { title: 'Chat', description: 'Direct and group conversations with clients and the consulting team.' },
  '/reports': { title: 'Reports', description: 'Eleven ready-made reports across CRM, sales and projects, with formulas, date filters and export.' },
  '/audit-log': { title: 'Audit Log', description: 'Automatic record of every change made in the workspace, with filters and export.' },
  '/settings': { title: 'Settings', description: 'Profile, display preferences, notifications, storage usage and integration status.' },
};

/** Routes worth listing in the sitemap (public entry points first). */
export const SITEMAP_ROUTES = Object.keys(ROUTE_META);
