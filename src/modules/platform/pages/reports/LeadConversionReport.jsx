import React from 'react';
import { Target } from 'lucide-react';
import ReportView from '../../../../components/module/ReportView';
import { formatCurrency } from '../../../../utils/format';

const STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];
const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(1)}%` : '—');

const report = {
  id: 'lead-conversion',
  module: 'CRM & Sales Pipeline',
  title: 'Lead Conversion',
  description: 'How leads from each source move through the funnel to won or lost.',
  formula: 'Leads grouped by source. Win rate = Won ÷ (Won + Lost); open leads are excluded from the win rate. Pipeline = Σ deal value of leads not yet Won or Lost.',
  entities: ['leads'],
  dateField: { entity: 'leads', field: 'lastContact' },
  build: ({ leads }) => {
    const sources = [...new Set(leads.map(l => l.source || 'Other'))];
    const rows = sources.map(source => {
      const list = leads.filter(l => (l.source || 'Other') === source);
      const count = (s) => list.filter(l => l.status === s).length;
      const won = count('Won');
      const lost = count('Lost');
      return {
        id: source,
        source,
        total: list.length,
        qualified: list.filter(l => ['Qualified', 'Proposal', 'Won'].includes(l.status)).length,
        won,
        lost,
        open: list.length - won - lost,
        pipeline: list.filter(l => !['Won', 'Lost'].includes(l.status)).reduce((s, l) => s + (Number(l.dealValue) || 0), 0),
      };
    }).sort((a, b) => b.total - a.total);

    const won = leads.filter(l => l.status === 'Won').length;
    const lost = leads.filter(l => l.status === 'Lost').length;
    return {
      columns: [
        { key: 'source', label: 'Source' },
        { key: 'total', label: 'Leads' },
        { key: 'qualified', label: 'Qualified+' },
        { key: 'won', label: 'Won' },
        { key: 'lost', label: 'Lost' },
        { key: 'open', label: 'Open' },
        { key: 'winRate', label: 'Win Rate', accessor: r => pct(r.won, r.won + r.lost) },
        { key: 'pipeline', label: 'Open Pipeline', accessor: r => formatCurrency(r.pipeline) },
      ],
      rows,
      chart: {
        xKey: 'source',
        stacked: true,
        bars: [
          { key: 'won', label: 'Won', color: '#1e9e6b' },
          { key: 'open', label: 'Open', color: '#5b7fe0' },
          { key: 'lost', label: 'Lost', color: '#d0504c' },
        ],
      },
      summary: [
        { label: 'Leads', value: leads.length },
        { label: 'Qualified or better', value: leads.filter(l => ['Qualified', 'Proposal', 'Won'].includes(l.status)).length },
        { label: 'Win rate', value: pct(won, won + lost) },
        { label: 'Stages tracked', value: STAGES.length },
      ],
    };
  },
};

export default function LeadConversionReport() {
  return <ReportView report={report} icon={Target} />;
}
