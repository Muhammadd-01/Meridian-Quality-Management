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
  LayoutGrid,
  PanelsTopLeft,
} from 'lucide-react';

import { DASHBOARDS, APPLICATIONS, LAYOUTS, MODULE_SECTIONS } from '../modules/catalog';

// MAIN area: expandable Dashboards, Applications and Layouts groups (as in the reference).
export const mainDashboardItems = DASHBOARDS;
export const mainGroups = [
  { id: 'dashboards', label: 'Dashboards', icon: LayoutDashboard, children: DASHBOARDS },
  { id: 'apps', label: 'Applications', icon: LayoutGrid, children: APPLICATIONS },
  { id: 'layouts', label: 'Layouts', icon: PanelsTopLeft, children: LAYOUTS },
];

// Sections that existed before the module catalogue (pages in src/features).
const CORE_SECTIONS = [
  {
    id: 'crm',
    title: 'CRM',
    items: [
      { path: '/crm/customer-segments', label: 'Customer Segments', icon: PieChart },
      { path: '/crm/companies', label: 'Companies', icon: Building2 },
      { path: '/crm/contacts', label: 'Contacts', icon: Contact },
      { path: '/crm/activities', label: 'Activities', icon: Activity },
      { path: '/crm/calls-emails', label: 'Calls & Emails', icon: PhoneCall },
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
    id: 'lms',
    title: 'LMS Analytics',
    items: [
      { path: '/lms-analytics/course-catalog', label: 'Course Catalog', icon: BookOpen },
      { path: '/lms-analytics/learner-profile', label: 'Learner Profile', icon: Users },
      { path: '/lms-analytics/quiz-builder', label: 'Quiz Builder', icon: HelpCircle },
      { path: '/lms-analytics/activity-feed', label: 'Activity Feed', icon: Sparkles },
    ],
  },
  {
    id: 'sales',
    title: 'Sales Analytics',
    items: [
      { path: '/sales-analytics/leads', label: 'Leads', icon: Target },
      { path: '/sales-analytics/deals', label: 'Deals', icon: DollarSign },
      { path: '/sales-analytics/quotations', label: 'Quotations', icon: FileSpreadsheet },
      { path: '/sales-analytics/pipeline', label: 'Pipeline', icon: GitBranch, badge: 'NEW' },
    ],
  },
  {
    id: 'workspace',
    title: 'Workspace',
    items: [
      { path: '/calendar', label: 'Calendar', icon: CalendarDays },
      { path: '/reports', label: 'Reports', icon: FileBarChart },
      { path: '/audit-log', label: 'Audit Log', icon: History },
      { path: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];
const HOMES = { crm: '/crm', projects: '/projects', lms: '/lms-analytics', sales: '/sales-analytics' };
CORE_SECTIONS.forEach(s => { s.home = HOMES[s.id]; });
// Calendar lives under Applications and Reports under the Reports section now.
const workspace = CORE_SECTIONS.find(s => s.id === 'workspace');
workspace.items = workspace.items.filter(i => i.path !== '/reports' && i.path !== '/calendar');

const core = (id) => CORE_SECTIONS.find(s => s.id === id);
const mod = (id) => MODULE_SECTIONS.find(s => s.id === id);

/** Sidebar sections in reference order. Items may be groups: { label, icon, children }. */
export const moduleSections = [
  mod('ecommerce'), mod('bi'), core('sales'), mod('logistics'), mod('real-estate'), core('crm'), core('projects'),
  mod('finance'), mod('accounting'), mod('banking'), mod('crypto'), mod('hospital'), mod('school'), core('lms'),
  mod('hotel'), mod('restaurant'), mod('food-delivery'), mod('travel'), mod('seo'), mod('hrm'), mod('ai'),
  mod('management'), mod('reports'), core('workspace'), mod('ui'), mod('pages'), mod('support'),
];

const flatten = (items) => items.flatMap(i => (i.children ? flatten(i.children) : [i]));

/** Flat list of every navigable page: { path, label, icon, group } */
export const allPages = [
  ...mainGroups.flatMap(g => g.children.map(i => ({ ...i, group: g.label }))),
  ...moduleSections.flatMap(s => flatten(s.items).map(i => ({ ...i, group: s.title }))),
].filter((p, idx, arr) => arr.findIndex(q => q.path === p.path) === idx);

export const pageTitles = {
  ...Object.fromEntries(allPages.map(p => [p.path, p.label])),
  '/crm': 'CRM Overview',
  '/projects': 'Project Management',
};

/** Section a page belongs to (module sections first, then the MAIN groups). */
export function sectionFor(path) {
  const s = moduleSections.find(sec => flatten(sec.items).some(i => i.path === path));
  if (s) return { id: s.id, title: s.title, home: s.home };
  const g = mainGroups.find(gr => gr.children.some(i => i.path === path));
  return g ? { id: g.id, title: g.label, home: g.id === 'dashboards' ? '/dashboard' : undefined } : { id: 'main', title: 'Main', home: '/dashboard' };
}

export function pageGroup(path) {
  return sectionFor(path).title;
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
  { id: 'new-course', label: 'Create course', path: '/lms-analytics/course-catalog?action=new', icon: BookOpen, modules: ['lms'] },
  { id: 'new-quiz', label: 'Create quiz', path: '/lms-analytics/quiz-builder?action=new', icon: HelpCircle, modules: ['lms'] },
  { id: 'new-event', label: 'Schedule event', path: '/calendar?action=new', icon: CalendarDays, modules: ['workspace'] },
  { id: 'reports', label: 'Export a report', path: '/reports', icon: FileBarChart, modules: ['workspace'] },
];

/** Module id for a path, used to put context-relevant quick actions first. */
export function moduleForPath(path) {
  if (path.startsWith('/crm')) return 'crm';
  if (path.startsWith('/projects')) return 'projects';
  if (path.startsWith('/lms')) return 'lms';
  if (path.startsWith('/sales')) return 'sales';
  return 'workspace';
}
