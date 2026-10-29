import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Target, DollarSign, FileSpreadsheet, GanttChartSquare, Activity, PhoneCall, Mail } from 'lucide-react';
import useCollection from '../../../hooks/useCollection';
import StatusBadge from '../../../components/ui/StatusBadge';
import { formatCurrency } from '../../../utils/format';

const norm = (s) => String(s ?? '').trim().toLowerCase();

/**
 * Related records for a company, matched by company name across the shared
 * CRM, Sales and Projects collections (records store the company by name).
 */
export default function CompanyRelations({ company }) {
  const [leads] = useCollection('leads');
  const [deals] = useCollection('deals');
  const [quotations] = useCollection('quotations');
  const [projects] = useCollection('projects');
  const [activities] = useCollection('activities');
  const [communications] = useCollection('communications');

  const name = norm(company.name);
  const related = useMemo(() => ({
    leads: leads.filter(l => norm(l.company) === name),
    deals: deals.filter(d => norm(d.company) === name),
    quotations: quotations.filter(q => norm(q.customer) === name),
    projects: projects.filter(p => norm(p.company || p.client) === name),
    timeline: [
      ...activities.filter(a => norm(a.company) === name).map(a => ({ id: a.id, at: a.dateTime, icon: Activity, title: a.title, meta: `${a.type} · ${a.status} · ${a.assignedTo}`, to: `/crm/activities?q=${encodeURIComponent(a.title)}` })),
      ...communications.filter(c => norm(c.company) === name).map(c => ({ id: c.id, at: c.dateTime, icon: c.type === 'Email' ? Mail : PhoneCall, title: c.subject, meta: `${c.type} · ${c.direction} · ${c.owner}`, to: `/crm/calls-emails?q=${encodeURIComponent(c.subject)}` })),
    ].sort((a, b) => String(b.at).localeCompare(String(a.at))),
  }), [leads, deals, quotations, projects, activities, communications, name]);

  const groups = [
    { key: 'leads', label: 'Leads', icon: Target, items: related.leads, render: l => ({ title: l.contactName, meta: formatCurrency(l.dealValue), status: l.status, to: `/sales-analytics/leads?q=${encodeURIComponent(l.contactName)}` }) },
    { key: 'deals', label: 'Deals', icon: DollarSign, items: related.deals, render: d => ({ title: d.name, meta: formatCurrency(d.value), status: d.stage, to: `/sales-analytics/deals?q=${encodeURIComponent(d.name)}` }) },
    { key: 'quotations', label: 'Quotations', icon: FileSpreadsheet, items: related.quotations, render: q => ({ title: q.quoteNumber, meta: formatCurrency(q.total), status: q.status, to: `/sales-analytics/quotations?q=${encodeURIComponent(q.quoteNumber)}` }) },
    { key: 'projects', label: 'Projects', icon: GanttChartSquare, items: related.projects, render: p => ({ title: p.name, meta: `${p.progress ?? 0}% complete`, status: p.status, to: `/projects?q=${encodeURIComponent(p.name)}` }) },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {groups.map(g => {
          const Icon = g.icon;
          return (
            <div key={g.key} className="rounded-lg border border-gray-100 p-2.5 text-center">
              <Icon size={15} className="mx-auto text-brand mb-1" aria-hidden="true" />
              <p className="text-base font-bold text-gray-800">{g.items.length}</p>
              <p className="text-[11px] text-gray-500">{g.label}</p>
            </div>
          );
        })}
      </div>

      {groups.filter(g => g.items.length).map(g => (
        <div key={g.key}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">{g.label}</p>
          <ul className="space-y-1.5">
            {g.items.slice(0, 5).map(item => {
              const r = g.render(item);
              return (
                <li key={item.id}>
                  <Link to={r.to} className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border border-gray-100 hover:bg-gray-50 text-xs">
                    <span className="min-w-0">
                      <span className="block font-semibold text-gray-800 truncate">{r.title}</span>
                      <span className="block text-gray-500">{r.meta}</span>
                    </span>
                    <StatusBadge status={r.status} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Activity timeline</p>
        {related.timeline.length === 0 ? (
          <p className="text-xs text-gray-500">No activities or communications logged for this company yet.</p>
        ) : (
          <ol className="relative border-l border-gray-200 ml-2 space-y-3">
            {related.timeline.slice(0, 8).map(t => {
              const Icon = t.icon;
              return (
                <li key={t.id} className="ml-4">
                  <span className="absolute -left-[9px] grid place-items-center w-[18px] h-[18px] rounded-full bg-white border border-gray-200" aria-hidden="true">
                    <Icon size={10} className="text-brand" />
                  </span>
                  <Link to={t.to} className="text-xs font-semibold text-gray-800 hover:text-brand">{t.title}</Link>
                  <p className="text-[11px] text-gray-500">{t.at} · {t.meta}</p>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
