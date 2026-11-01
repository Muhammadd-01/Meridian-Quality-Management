/**
 * Navigation map shared by the sidebar, topbar titles, breadcrumbs and the
 * command palette, so every surface lists the same, valid routes.
 */
import {
  LayoutDashboard,
  GanttChartSquare,
  Users,
  BookOpenCheck,
  TrendingUp,
  CheckSquare,
  Clock,
  UserCheck,
  PieChart,
  Building2,
  Contact,
  PhoneCall,
  Activity,
  BookOpen,
  HelpCircle,
  Sparkles,
  Target,
  DollarSign,
  FileSpreadsheet,
  GitBranch,
  BarChart3,
  CalendarDays,
  FileBarChart,
  History,
  Settings,
  MessagesSquare,
  Mail,
  Phone,
  Magnet,
  ShoppingCart,
  Fingerprint,
  Plane,
  ListChecks,
  Handshake,
  BellRing,
  ClipboardList,
} from 'lucide-react';

// Section 1: Main Dashboards (Simple direct links, NO dropdown!)
export const mainDashboardItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: 'Main' },
  { path: '/traffic-overview', label: 'Traffic Overview', icon: BarChart3 },
  { path: '/crm', label: 'CRM', icon: Users },
  { path: '/projects', label: 'Project Management', icon: GanttChartSquare },
  { path: '/sales-analytics', label: 'Website Analytics', icon: TrendingUp },
];

// Section 2: Module Headings and their pages (NO dropdowns below!)
export const moduleSections = [
  {
    id: 'crm',
    title: 'CRM',
    items: [
      { path: '/crm/customer-segments', label: 'Customer Segments', icon: PieChart },
      { path: '/crm/companies', label: 'Companies', icon: Building2 },
      { path: '/crm/contacts', label: 'Contacts', icon: Contact },
      { path: '/crm/activities', label: 'Activities', icon: Activity },
      { path: '/crm/calls-emails', label: 'Calls & Emails', icon: PhoneCall },
      { path: '/crm/bulk-email', label: 'Bulk Email', icon: Mail },
      { path: '/crm/call-center', label: 'Call Center', icon: Phone, badge: 'NEW' },
    ],
  },
  {
    id: 'projects',
    title: 'Project Management',
    items: [
      { path: '/projects', label: 'Projects', icon: GanttChartSquare },
      { path: '/projects/tasks', label: 'Tasks', icon: CheckSquare },
      { path: '/projects/team', label: 'Team', icon: UserCheck },
      { path: '/projects/timesheets', label: 'Timesheets', icon: Clock },
    ],
  },
  {
    id: 'sales',
    title: 'Website Analytics',
    items: [
      { path: '/sales-analytics/leads', label: 'Leads', icon: Target },
      { path: '/sales-analytics/deals', label: 'Deals', icon: DollarSign },
      { path: '/sales-analytics/quotations', label: 'Quotations', icon: FileSpreadsheet },
      { path: '/sales-analytics/pipeline', label: 'Pipeline', icon: GitBranch },
      { path: '/sales-analytics/lead-capture', label: 'Social Lead Capture', icon: Magnet, badge: 'NEW' },
      { path: '/sales-analytics/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
    ],
  },
  {
    id: 'team',
    title: 'Team',
    items: [
      { path: '/team/attendance', label: 'Check-in / Out', icon: Fingerprint },
      { path: '/team/daily-tasks', label: 'Daily Tasks', icon: ListChecks },
      { path: '/team/follow-ups', label: 'Team Follow-ups', icon: Handshake },
      { path: '/team/leaves', label: 'Leaves', icon: Plane },
      { path: '/team/reminders', label: 'Reminders', icon: BellRing },
      { path: '/team/daily-reports', label: 'Daily Reports', icon: ClipboardList },
    ],
  },
  {
    id: 'workspace',
    title: 'Workspace',
    items: [
      { path: '/calendar', label: 'Calendar', icon: CalendarDays },
      { path: '/chat', label: 'Chat', icon: MessagesSquare },
      { path: '/reports', label: 'Reports', icon: FileBarChart },
      { path: '/audit-log', label: 'Audit Log', icon: History },
      { path: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const sectionTitleFor = (path) => moduleSections.find(s => s.items.some(i => i.path === path))?.title;

/** Flat list of every navigable page: { path, label, icon, group } */
export const allPages = [
  ...mainDashboardItems.map(i => ({ ...i, group: 'Main' })),
  ...moduleSections.flatMap(s => s.items.map(i => ({ ...i, group: s.title }))),
].filter((p, idx, arr) => arr.findIndex(q => q.path === p.path) === idx);

export const pageTitles = {
  ...Object.fromEntries(allPages.map(p => [p.path, p.label])),
  '/crm': 'CRM Overview',
  '/projects': 'Project Management',
};

export function pageGroup(path) {
  return sectionTitleFor(path) || 'Main';
}

/**
 * Quick-create actions. Each opens the owning page's existing create form via
 * `?action=new` (see hooks/useQuickAction.js). `modules` controls where the
 * action is promoted in the Quick Create menu.
 */
export const quickActions = [
  { id: 'new-lead', label: 'Create lead', path: '/sales-analytics/leads?action=new', icon: Target, modules: ['crm', 'sales'] },
  { id: 'new-company', label: 'Add company', path: '/crm/companies?action=new', icon: Building2, modules: ['crm'] },
  { id: 'new-contact', label: 'Add contact', path: '/crm/contacts?action=new', icon: Contact, modules: ['crm'] },
  { id: 'new-activity', label: 'Log activity', path: '/crm/activities?action=new', icon: Activity, modules: ['crm'] },
  { id: 'new-deal', label: 'Create deal', path: '/sales-analytics/deals?action=new', icon: DollarSign, modules: ['sales', 'crm'] },
  { id: 'new-quote', label: 'Create quotation', path: '/sales-analytics/quotations?action=new', icon: FileSpreadsheet, modules: ['sales'] },
  { id: 'new-project', label: 'Create project', path: '/projects?action=new', icon: GanttChartSquare, modules: ['projects'] },
  { id: 'new-task', label: 'Create task', path: '/projects/tasks?action=new', icon: CheckSquare, modules: ['projects'] },
  { id: 'new-timesheet', label: 'Log time', path: '/projects/timesheets?action=new', icon: Clock, modules: ['projects'] },
  { id: 'new-daily-task', label: 'Assign daily task', path: '/team/daily-tasks?action=new', icon: ListChecks, modules: ['team'] },
  { id: 'new-follow-up', label: 'Add follow-up', path: '/team/follow-ups?action=new', icon: Handshake, modules: ['team', 'crm'] },
  { id: 'new-leave', label: 'Request leave', path: '/team/leaves?action=new', icon: Plane, modules: ['team'] },
  { id: 'new-reminder', label: 'Set reminder', path: '/team/reminders?action=new', icon: BellRing, modules: ['team', 'workspace'] },
  { id: 'new-report', label: 'Submit daily report', path: '/team/daily-reports?action=new', icon: ClipboardList, modules: ['team'] },
  { id: 'new-po', label: 'Create purchase order', path: '/sales-analytics/purchase-orders?action=new', icon: ShoppingCart, modules: ['sales'] },
  { id: 'new-event', label: 'Schedule event', path: '/calendar?action=new', icon: CalendarDays, modules: ['workspace'] },
  { id: 'reports', label: 'Export a report', path: '/reports', icon: FileBarChart, modules: ['workspace'] },
];

/** Module id for a path, used to put context-relevant quick actions first. */
export function moduleForPath(path) {
  if (path.startsWith('/crm')) return 'crm';
  if (path.startsWith('/projects')) return 'projects';
  if (path.startsWith('/sales')) return 'sales';
  if (path.startsWith('/team')) return 'team';
  return 'workspace';
}
