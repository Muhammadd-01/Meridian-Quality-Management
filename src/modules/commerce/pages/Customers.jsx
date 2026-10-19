import React from 'react';
import { Users, UserCheck, Wallet, ShoppingBag, Mail, Phone, MapPin } from 'lucide-react';
import ModuleListPage from '../../../components/module/ModuleListPage';
import StatusBadge from '../../../components/ui/StatusBadge';
import { formatCurrency, formatDate } from '../../../utils/format';

const initials = (name = '') => name.split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();

export default function Customers() {
  return (
    <ModuleListPage
      entityType="customers"
      title="Customers"
      subtitle="Customer explorer with lifetime value, order history and segments."
      kpis={(records) => {
        const active = records.filter(r => r.status === 'Active');
        const ltv = records.reduce((s, r) => s + (Number(r.lifetimeValue) || 0), 0);
        const orders = records.reduce((s, r) => s + (Number(r.orders) || 0), 0);
        return [
          { title: 'Total Customers', value: records.length, icon: Users, tone: 'primary', subtitle: `${records.filter(r => r.status === 'Prospect').length} prospects` },
          { title: 'Active', value: active.length, icon: UserCheck, tone: 'success', subtitle: 'Bought in the last year' },
          { title: 'Lifetime Value', value: formatCurrency(ltv), icon: Wallet, tone: 'accent', subtitle: 'Σ lifetime value' },
          { title: 'Avg Order Count', value: records.length ? (orders / records.length).toFixed(1) : '0', icon: ShoppingBag, tone: 'info', subtitle: `${orders} orders in total` },
        ];
      }}
      columns={[
        {
          key: 'name', label: 'Customer', sortable: true,
          render: (r) => (
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-primary-50 text-primary-700 grid place-items-center text-xs font-bold shrink-0">{initials(r.name)}</span>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 flex items-center gap-1.5">{r.name}{r.isDemo && <span className="badge-warning text-2xs">Demo</span>}</p>
                <p className="text-2xs text-gray-500 truncate">{r.company || '—'}</p>
              </div>
            </div>
          ),
        },
        { key: 'email', label: 'Contact', render: (r) => (<div><p className="text-xs text-gray-800">{r.email}</p><p className="text-2xs text-gray-500">{r.phone}</p></div>) },
        { key: 'segment', label: 'Segment', sortable: true, render: (r) => <span className="badge-secondary">{r.segment}</span> },
        { key: 'status', label: 'Status', sortable: true, render: (r) => <StatusBadge status={r.status} /> },
        { key: 'orders', label: 'Orders', sortable: true, align: 'right', render: (r) => Number(r.orders || 0).toLocaleString() },
        { key: 'lifetimeValue', label: 'Lifetime Value', sortable: true, align: 'right', render: (r) => <span className="font-semibold text-gray-900">{formatCurrency(r.lifetimeValue || 0)}</span> },
        { key: 'lastOrder', label: 'Last Order', sortable: true, render: (r) => (r.lastOrder ? formatDate(r.lastOrder) : '—') },
      ]}
      filters={[{ key: 'segment', label: 'All segments' }, { key: 'status', label: 'All statuses' }, { key: 'city', label: 'All cities' }]}
      tabs={[
        { id: 'all', label: 'All' },
        { id: 'active', label: 'Active', filter: (r) => r.status === 'Active' },
        { id: 'prospect', label: 'Prospects', filter: (r) => r.status === 'Prospect' },
        { id: 'top', label: 'Top value', filter: (r) => Number(r.lifetimeValue) >= 3000000 },
      ]}
      defaultSort={{ key: 'lifetimeValue', dir: 'desc' }}
      renderCard={(r) => (
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-11 h-11 rounded-lg bg-gradient-to-br from-primary-400 to-primary-700 text-white grid place-items-center text-sm font-bold shrink-0">{initials(r.name)}</span>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 truncate">{r.name}</p>
                <p className="text-xs text-gray-500 truncate">{r.company}</p>
              </div>
            </div>
            <StatusBadge status={r.status} />
          </div>
          <div className="mt-3 space-y-1.5 text-xs text-gray-600">
            <p className="flex items-center gap-2 truncate"><Mail size={13} className="text-gray-400" aria-hidden="true" />{r.email}</p>
            <p className="flex items-center gap-2"><Phone size={13} className="text-gray-400" aria-hidden="true" />{r.phone || '—'}</p>
            <p className="flex items-center gap-2"><MapPin size={13} className="text-gray-400" aria-hidden="true" />{r.city || '—'}</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-gray-50 border border-gray-100 p-2.5">
            <div><p className="text-2xs uppercase tracking-wide text-gray-400">Orders</p><p className="text-sm font-bold text-gray-900">{r.orders || 0}</p></div>
            <div><p className="text-2xs uppercase tracking-wide text-gray-400">Lifetime value</p><p className="text-sm font-bold text-primary truncate">{formatCurrency(r.lifetimeValue || 0)}</p></div>
          </div>
        </div>
      )}
    />
  );
}
