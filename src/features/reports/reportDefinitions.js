/**
 * Report catalogue. Every report is computed from the live record collections
 * (the same data the module pages edit) — nothing is pre-aggregated or invented.
 * Each report documents its formula so figures can be audited.
 */
import { differenceInCalendarDays, parseISO, isValid } from 'date-fns';
import { formatCurrency } from '../../utils/format';

const sum = (arr, fn) => arr.reduce((s, x) => s + (Number(fn(x)) || 0), 0);
const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(1)}%` : '—');
const groupCount = (arr, key) => arr.reduce((m, x) => m.set(x[key] ?? '—', [...(m.get(x[key] ?? '—') || []), x]), new Map());
const today = () => new Date();
const isOverdue = (t) => {
  const d = parseISO(String(t.dueDate || '').slice(0, 10));
  return isValid(d) && t.status !== 'Completed' && differenceInCalendarDays(d, today()) < 0;
};

export const REPORT_MODULES = ['CRM', 'Sales', 'Projects', 'LMS'];

export const REPORTS = [
  // ------------------------------------------------------------------ CRM
  {
    id: 'crm-activities',
    module: 'CRM',
    title: 'Activities by type',
    description: 'Calls, emails, meetings and tasks with completion status.',
    formula: 'Count of activity records grouped by type; completion rate = Completed ÷ total.',
    entities: ['activities'],
    dateField: { entity: 'activities', field: 'dateTime' },
    build: ({ activities }) => {
      const rows = [...groupCount(activities, 'type')].map(([type, list]) => ({
        id: type, type, total: list.length,
        completed: list.filter(a => a.status === 'Completed').length,
        scheduled: list.filter(a => a.status === 'Scheduled').length,
        overdue: list.filter(a => a.status === 'Overdue').length,
      }));
      return {
        columns: [
          { key: 'type', label: 'Type' }, { key: 'total', label: 'Total' }, { key: 'completed', label: 'Completed' },
          { key: 'scheduled', label: 'Scheduled' }, { key: 'overdue', label: 'Overdue' },
          { key: 'rate', label: 'Completion Rate', accessor: r => pct(r.completed, r.total) },
        ],
        rows,
        chart: { xKey: 'type', bars: [{ key: 'completed', label: 'Completed', color: '#187f65' }, { key: 'scheduled', label: 'Scheduled', color: '#3e7ead' }, { key: 'overdue', label: 'Overdue', color: '#d0504c' }], stacked: true },
        summary: [
          { label: 'Activities', value: activities.length },
          { label: 'Completion rate', value: pct(activities.filter(a => a.status === 'Completed').length, activities.length) },
        ],
      };
    },
  },
  {
    id: 'crm-communications',
    module: 'CRM',
    title: 'Communications by owner',
    description: 'Call and email volume per team member, split by direction.',
    formula: 'Count of Calls & Emails records grouped by owner.',
    entities: ['communications'],
    dateField: { entity: 'communications', field: 'dateTime' },
    build: ({ communications }) => {
      const rows = [...groupCount(communications, 'owner')].map(([owner, list]) => ({
        id: owner, owner, calls: list.filter(c => c.type === 'Call').length, emails: list.filter(c => c.type === 'Email').length,
        inbound: list.filter(c => c.direction === 'Inbound').length, outbound: list.filter(c => c.direction === 'Outbound').length,
      }));
      return {
        columns: [{ key: 'owner', label: 'Owner' }, { key: 'calls', label: 'Calls' }, { key: 'emails', label: 'Emails' }, { key: 'inbound', label: 'Inbound' }, { key: 'outbound', label: 'Outbound' }],
        rows,
        chart: { xKey: 'owner', bars: [{ key: 'calls', label: 'Calls', color: '#187f65' }, { key: 'emails', label: 'Emails', color: '#3e7ead' }], stacked: true },
        summary: [{ label: 'Communications', value: communications.length }],
      };
    },
  },
  {
    id: 'crm-companies',
    module: 'CRM',
    title: 'Accounts by relationship',
    description: 'Company directory split by relationship type and portfolio value.',
    formula: 'Companies grouped by relationship; value = Σ total spend (PKR).',
    entities: ['companies'],
    build: ({ companies }) => {
      const rows = [...groupCount(companies, 'relationship')].map(([relationship, list]) => ({
        id: relationship, relationship, companies: list.length, activeDeals: sum(list, c => c.activeDeals), value: sum(list, c => c.totalSpent),
      }));
      return {
        columns: [{ key: 'relationship', label: 'Relationship' }, { key: 'companies', label: 'Companies' }, { key: 'activeDeals', label: 'Active Deals' }, { key: 'value', label: 'Total Value', accessor: r => formatCurrency(r.value) }],
        rows,
        chart: { xKey: 'relationship', bars: [{ key: 'companies', label: 'Companies', color: '#187f65' }] },
        summary: [{ label: 'Companies', value: companies.length }, { label: 'Portfolio value', value: formatCurrency(sum(companies, c => c.totalSpent)) }],
      };
    },
  },
  // ---------------------------------------------------------------- Sales
  {
    id: 'sales-funnel',
    module: 'Sales',
    title: 'Lead funnel',
    description: 'Leads by status with conversion and value.',
    formula: 'Win rate = Won ÷ (Won + Lost). Lead conversion = Won ÷ all leads. Value = Σ expected deal value.',
    entities: ['leads'],
    dateField: { entity: 'leads', field: 'lastContact' },
    build: ({ leads }) => {
      const order = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];
      const rows = order.map(status => {
        const list = leads.filter(l => l.status === status);
        return { id: status, status, leads: list.length, value: sum(list, l => l.dealValue), share: pct(list.length, leads.length) };
      });
      const won = leads.filter(l => l.status === 'Won').length;
      const lost = leads.filter(l => l.status === 'Lost').length;
      return {
        columns: [{ key: 'status', label: 'Status' }, { key: 'leads', label: 'Leads' }, { key: 'share', label: 'Share' }, { key: 'value', label: 'Expected Value', accessor: r => formatCurrency(r.value) }],
        rows,
        chart: { xKey: 'status', bars: [{ key: 'leads', label: 'Leads', color: '#187f65' }] },
        summary: [
          { label: 'Leads', value: leads.length },
          { label: 'Qualified or later', value: leads.filter(l => ['Qualified', 'Proposal', 'Won'].includes(l.status)).length },
          { label: 'Win rate', value: pct(won, won + lost) },
          { label: 'Lead conversion', value: pct(won, leads.length) },
        ],
      };
    },
  },
  {
    id: 'sales-sources',
    module: 'Sales',
    title: 'Performance by lead source',
    description: 'Which acquisition channels produce qualified and won leads.',
    formula: 'Conversion = Won ÷ leads from that source. Qualified = Qualified + Proposal + Won.',
    entities: ['leads'],
    dateField: { entity: 'leads', field: 'lastContact' },
    build: ({ leads }) => {
      const rows = [...groupCount(leads, 'source')].map(([source, list]) => {
        const won = list.filter(l => l.status === 'Won').length;
        return { id: source, source, leads: list.length, qualified: list.filter(l => ['Qualified', 'Proposal', 'Won'].includes(l.status)).length, won, conversion: pct(won, list.length), value: sum(list, l => l.dealValue) };
      }).sort((a, b) => b.leads - a.leads);
      return {
        columns: [{ key: 'source', label: 'Source' }, { key: 'leads', label: 'Leads' }, { key: 'qualified', label: 'Qualified+' }, { key: 'won', label: 'Won' }, { key: 'conversion', label: 'Conversion' }, { key: 'value', label: 'Pipeline Value', accessor: r => formatCurrency(r.value) }],
        rows,
        chart: { xKey: 'source', bars: [{ key: 'leads', label: 'Leads', color: '#b0e4d0' }, { key: 'qualified', label: 'Qualified+', color: '#48b594' }, { key: 'won', label: 'Won', color: '#146553' }] },
        summary: [{ label: 'Sources', value: rows.length }],
      };
    },
  },
  {
    id: 'sales-pipeline',
    module: 'Sales',
    title: 'Pipeline by stage',
    description: 'Deal count, value and probability-weighted value per stage.',
    formula: 'Weighted value = Σ (deal value × probability ÷ 100). Open pipeline excludes Closed Won / Closed Lost.',
    entities: ['deals'],
    dateField: { entity: 'deals', field: 'expectedClose' },
    build: ({ deals }) => {
      const order = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
      const rows = order.map(stage => {
        const list = deals.filter(d => d.stage === stage);
        return { id: stage, stage, deals: list.length, value: sum(list, d => d.value), weighted: Math.round(sum(list, d => (d.value || 0) * (d.probability || 0) / 100)) };
      });
      const open = deals.filter(d => !String(d.stage).startsWith('Closed'));
      const won = deals.filter(d => d.stage === 'Closed Won');
      return {
        columns: [{ key: 'stage', label: 'Stage' }, { key: 'deals', label: 'Deals' }, { key: 'value', label: 'Value', accessor: r => formatCurrency(r.value) }, { key: 'weighted', label: 'Weighted Value', accessor: r => formatCurrency(r.weighted) }],
        rows,
        chart: { xKey: 'stage', bars: [{ key: 'value', label: 'Value', color: '#b0e4d0' }, { key: 'weighted', label: 'Weighted', color: '#187f65' }], currency: true },
        summary: [
          { label: 'Open pipeline', value: formatCurrency(sum(open, d => d.value)) },
          { label: 'Weighted pipeline', value: formatCurrency(Math.round(sum(open, d => (d.value || 0) * (d.probability || 0) / 100))) },
          { label: 'Won revenue', value: formatCurrency(sum(won, d => d.value)) },
          { label: 'Avg won deal', value: won.length ? formatCurrency(Math.round(sum(won, d => d.value) / won.length)) : '—' },
        ],
      };
    },
  },
  {
    id: 'sales-owners',
    module: 'Sales',
    title: 'Performance by owner',
    description: 'Open and won deals per sales owner, with win rate.',
    formula: 'Win rate = Closed Won ÷ (Closed Won + Closed Lost) for that owner.',
    entities: ['deals'],
    dateField: { entity: 'deals', field: 'expectedClose' },
    build: ({ deals }) => {
      const rows = [...groupCount(deals, 'owner')].map(([owner, list]) => {
        const won = list.filter(d => d.stage === 'Closed Won');
        const lost = list.filter(d => d.stage === 'Closed Lost');
        const open = list.filter(d => !String(d.stage).startsWith('Closed'));
        return { id: owner, owner, open: open.length, openValue: sum(open, d => d.value), won: won.length, wonValue: sum(won, d => d.value), winRate: pct(won.length, won.length + lost.length) };
      }).sort((a, b) => b.wonValue - a.wonValue);
      return {
        columns: [{ key: 'owner', label: 'Owner' }, { key: 'open', label: 'Open Deals' }, { key: 'openValue', label: 'Open Value', accessor: r => formatCurrency(r.openValue) }, { key: 'won', label: 'Won' }, { key: 'wonValue', label: 'Won Value', accessor: r => formatCurrency(r.wonValue) }, { key: 'winRate', label: 'Win Rate' }],
        rows,
        chart: { xKey: 'owner', bars: [{ key: 'openValue', label: 'Open value', color: '#b0e4d0' }, { key: 'wonValue', label: 'Won value', color: '#187f65' }], currency: true },
        summary: [{ label: 'Owners', value: rows.length }],
      };
    },
  },
  {
    id: 'sales-quotations',
    module: 'Sales',
    title: 'Quotation acceptance',
    description: 'Quotation outcomes and value by status.',
    formula: 'Acceptance rate = Accepted ÷ (Accepted + Declined). Drafts and open quotes are excluded from the rate.',
    entities: ['quotations'],
    dateField: { entity: 'quotations', field: 'issueDate' },
    build: ({ quotations }) => {
      const rows = [...groupCount(quotations, 'status')].map(([status, list]) => ({ id: status, status, quotations: list.length, value: sum(list, q => q.total) }));
      const acc = quotations.filter(q => q.status === 'Accepted').length;
      const dec = quotations.filter(q => q.status === 'Declined').length;
      return {
        columns: [{ key: 'status', label: 'Status' }, { key: 'quotations', label: 'Quotations' }, { key: 'value', label: 'Total Value', accessor: r => formatCurrency(r.value) }],
        rows,
        chart: { xKey: 'status', bars: [{ key: 'quotations', label: 'Quotations', color: '#187f65' }] },
        summary: [{ label: 'Quotations', value: quotations.length }, { label: 'Acceptance rate', value: pct(acc, acc + dec) }],
      };
    },
  },
  // ------------------------------------------------------------- Projects
  {
    id: 'projects-tasks',
    module: 'Projects',
    title: 'Task status by assignee',
    description: 'Workload, completion and overdue tasks per person.',
    formula: 'Overdue = not Completed and due date before today. Open = not Completed.',
    entities: ['tasks'],
    dateField: { entity: 'tasks', field: 'dueDate' },
    build: ({ tasks }) => {
      const rows = [...groupCount(tasks, 'assignedTo')].map(([assignee, list]) => ({
        id: assignee, assignee, total: list.length, completed: list.filter(t => t.status === 'Completed').length,
        open: list.filter(t => t.status !== 'Completed').length, overdue: list.filter(isOverdue).length,
        estimated: sum(list, t => t.estimatedHours), logged: sum(list, t => t.loggedHours),
      }));
      return {
        columns: [{ key: 'assignee', label: 'Assignee' }, { key: 'total', label: 'Tasks' }, { key: 'open', label: 'Open' }, { key: 'completed', label: 'Completed' }, { key: 'overdue', label: 'Overdue' }, { key: 'estimated', label: 'Est. Hours' }, { key: 'logged', label: 'Logged Hours' }],
        rows,
        chart: { xKey: 'assignee', bars: [{ key: 'completed', label: 'Completed', color: '#187f65' }, { key: 'open', label: 'Open', color: '#3e7ead' }, { key: 'overdue', label: 'Overdue', color: '#d0504c' }] },
        summary: [
          { label: 'Tasks', value: tasks.length },
          { label: 'Overdue', value: tasks.filter(isOverdue).length },
          { label: 'Estimated vs logged', value: `${sum(tasks, t => t.estimatedHours)}h / ${sum(tasks, t => t.loggedHours)}h` },
        ],
      };
    },
  },
  {
    id: 'projects-time',
    module: 'Projects',
    title: 'Time logged by project',
    description: 'Hours from timesheets per project and approval status.',
    formula: 'Σ timesheet hours grouped by project and status.',
    entities: ['timesheets'],
    dateField: { entity: 'timesheets', field: 'date' },
    build: ({ timesheets }) => {
      const rows = [...groupCount(timesheets, 'project')].map(([project, list]) => ({
        id: project, project, entries: list.length, hours: sum(list, t => t.hours),
        approved: sum(list.filter(t => t.status === 'Approved'), t => t.hours),
        pending: sum(list.filter(t => t.status === 'Pending'), t => t.hours),
        rejected: sum(list.filter(t => t.status === 'Rejected'), t => t.hours),
      })).sort((a, b) => b.hours - a.hours);
      return {
        columns: [{ key: 'project', label: 'Project' }, { key: 'entries', label: 'Entries' }, { key: 'hours', label: 'Total Hours' }, { key: 'approved', label: 'Approved' }, { key: 'pending', label: 'Pending' }, { key: 'rejected', label: 'Rejected' }],
        rows,
        chart: { xKey: 'project', bars: [{ key: 'approved', label: 'Approved', color: '#187f65' }, { key: 'pending', label: 'Pending', color: '#dda92c' }, { key: 'rejected', label: 'Rejected', color: '#d0504c' }], stacked: true },
        summary: [{ label: 'Hours logged', value: `${sum(timesheets, t => t.hours)}h` }],
      };
    },
  },
  {
    id: 'projects-budget',
    module: 'Projects',
    title: 'Budget utilisation',
    description: 'Budget versus spend and progress per project.',
    formula: 'Utilisation = spent ÷ budget. Progress comes from each project record.',
    entities: ['projects'],
    dateField: { entity: 'projects', field: 'dueDate' },
    build: ({ projects }) => {
      const rows = projects.map(p => ({ id: p.id, project: p.name, status: p.status, budget: p.budget || 0, spent: p.spent || 0, utilisation: pct(p.spent || 0, p.budget || 0), progress: `${p.progress ?? 0}%` }));
      return {
        columns: [{ key: 'project', label: 'Project' }, { key: 'status', label: 'Status' }, { key: 'budget', label: 'Budget', accessor: r => `$${r.budget.toLocaleString()}` }, { key: 'spent', label: 'Spent', accessor: r => `$${r.spent.toLocaleString()}` }, { key: 'utilisation', label: 'Utilisation' }, { key: 'progress', label: 'Progress' }],
        rows,
        chart: { xKey: 'project', bars: [{ key: 'budget', label: 'Budget', color: '#b0e4d0' }, { key: 'spent', label: 'Spent', color: '#187f65' }] },
        summary: [{ label: 'Projects', value: projects.length }, { label: 'Overall utilisation', value: pct(sum(projects, p => p.spent), sum(projects, p => p.budget)) }],
      };
    },
  },
  // ------------------------------------------------------------------ LMS
  {
    id: 'lms-courses',
    module: 'LMS',
    title: 'Course performance',
    description: 'Enrolment, activity, completion and scores per course.',
    formula: 'Values come from each course record. Active share = active ÷ enrolled learners.',
    entities: ['courses'],
    dateField: { entity: 'courses', field: 'startDate' },
    build: ({ courses }) => {
      const rows = courses.map(c => ({ id: c.id, course: c.name, category: c.category, enrolled: c.enrolledLearners || 0, active: c.activeLearners || 0, completion: c.completionRate || 0, avgScore: c.avgScore || 0 }));
      const enrolled = sum(courses, c => c.enrolledLearners);
      const weightedCompletion = enrolled ? sum(courses, c => (c.completionRate || 0) * (c.enrolledLearners || 0)) / enrolled : 0;
      return {
        columns: [{ key: 'course', label: 'Course' }, { key: 'category', label: 'Category' }, { key: 'enrolled', label: 'Enrolled' }, { key: 'active', label: 'Active' }, { key: 'activeShare', label: 'Active Share', accessor: r => pct(r.active, r.enrolled) }, { key: 'completion', label: 'Completion', accessor: r => `${r.completion}%` }, { key: 'avgScore', label: 'Avg Score' }],
        rows,
        chart: { xKey: 'course', bars: [{ key: 'enrolled', label: 'Enrolled', color: '#b0e4d0' }, { key: 'active', label: 'Active', color: '#187f65' }] },
        summary: [{ label: 'Courses', value: courses.length }, { label: 'Enrolments', value: enrolled }, { label: 'Completion (enrolment-weighted)', value: `${weightedCompletion.toFixed(1)}%` }],
      };
    },
  },
  {
    id: 'lms-learners',
    module: 'LMS',
    title: 'Learner progress',
    description: 'Courses completed, hours and assessment results per learner.',
    formula: 'Completion = completed ÷ enrolled courses for each learner.',
    entities: ['learners'],
    build: ({ learners }) => {
      const rows = learners.map(l => ({ id: l.id, learner: l.name, department: l.department, enrolled: l.enrolledCount || 0, completed: l.completedCount || 0, hours: l.hoursLearned || 0, avgQuiz: l.avgQuizScore || 0 }));
      return {
        columns: [{ key: 'learner', label: 'Learner' }, { key: 'department', label: 'Department' }, { key: 'enrolled', label: 'Enrolled' }, { key: 'completed', label: 'Completed' }, { key: 'completion', label: 'Completion', accessor: r => pct(r.completed, r.enrolled) }, { key: 'hours', label: 'Hours' }, { key: 'avgQuiz', label: 'Avg Quiz Score' }],
        rows,
        chart: { xKey: 'learner', bars: [{ key: 'enrolled', label: 'Enrolled', color: '#b0e4d0' }, { key: 'completed', label: 'Completed', color: '#187f65' }] },
        summary: [{ label: 'Learners', value: learners.length }, { label: 'Hours learned', value: `${sum(learners, l => l.hoursLearned)}h` }],
      };
    },
  },
];
