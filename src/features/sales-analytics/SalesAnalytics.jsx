import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  DollarSign, TrendingUp, ShoppingCart, Target,
  Award, BarChart3, Eye
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import ChartCard from '../../components/ui/ChartCard';
import SearchInput from '../../components/ui/SearchInput';
import FilterDropdown from '../../components/ui/FilterDropdown';
import StatusBadge from '../../components/ui/StatusBadge';
import DateRangeFilter from '../../components/ui/DateRangeFilter';
import DataTable from '../../components/tables/DataTable';
import ExportButton from '../../components/ui/ExportButton';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import useLocalStorage from '../../hooks/useLocalStorage';
import useSearch from '../../hooks/useSearch';
import usePagination from '../../hooks/usePagination';
import useSort from '../../hooks/useSort';
import { initialSales, salesReps, dealStatuses } from '../../data/sales';
import { revenueData } from '../../data/dashboard';
import { formatCurrency, formatDate, formatPercent } from '../../utils/format';
import { exportToCSV } from '../../utils/csv';

const COLORS = ['#40BFA6', '#7c5cfc', '#17a2b8', '#ffc107', '#dc3545', '#28a745'];

export default function SalesAnalytics() {
  const [sales] = useLocalStorage('meridian-sales', initialSales);
  const [statusFilter, setStatusFilter] = useState('All');
  const [repFilter, setRepFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewModal, setViewModal] = useState(null);
  const addToast = useToast();

  // KPI Calculations
  const closedDeals = sales.filter(s => s.status === 'Closed');
  const totalRevenue = closedDeals.reduce((s, d) => s + d.value, 0);
  const totalDeals = sales.length;
  const avgDealValue = totalDeals > 0 ? sales.reduce((s, d) => s + d.value, 0) / totalDeals : 0;
  const conversionRate = totalDeals > 0 ? (closedDeals.length / totalDeals * 100) : 0;
  const targetAchievement = 78.5;

  // Sales by rep
  const salesByRep = useMemo(() =>
    salesReps.map(rep => ({
      name: rep.split(' ')[0],
      revenue: sales.filter(s => s.representative === rep && s.status === 'Closed').reduce((sum, s) => sum + s.value, 0),
      deals: sales.filter(s => s.representative === rep).length,
    }))
  , [sales]);

  // Sales by product/service
  const salesByProduct = useMemo(() => {
    const products = {};
    sales.forEach(s => { products[s.product] = (products[s.product] || 0) + s.value; });
    return Object.entries(products)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({
        name: name.length > 25 ? name.substring(0, 25) + '...' : name,
        value,
        fill: COLORS[i % COLORS.length]
      }));
  }, [sales]);

  // Deal status distribution
  const dealStatusDist = useMemo(() => {
    const colors = { Pending: '#ffc107', 'In Progress': '#17a2b8', Closed: '#28a745', Cancelled: '#dc3545' };
    return dealStatuses.map(status => ({
      name: status,
      value: sales.filter(s => s.status === status).length,
      fill: colors[status] || '#6c757d',
    }));
  }, [sales]);

  // Conversion funnel data
  const funnelData = [
    { name: 'Total Leads', value: 15, fill: '#40BFA6' },
    { name: 'Qualified', value: 10, fill: '#7c5cfc' },
    { name: 'Proposals', value: 7, fill: '#17a2b8' },
    { name: 'Negotiation', value: 5, fill: '#ffc107' },
    { name: 'Closed Won', value: closedDeals.length, fill: '#28a745' },
  ];

  // Filter
  const filteredSales = useMemo(() => {
    let data = sales;
    if (statusFilter !== 'All') data = data.filter(s => s.status === statusFilter);
    if (repFilter !== 'All') data = data.filter(s => s.representative === repFilter);
    if (startDate) data = data.filter(s => s.date >= startDate);
    if (endDate) data = data.filter(s => s.date <= endDate);
    return data;
  }, [sales, statusFilter, repFilter, startDate, endDate]);

  const { query, setQuery, filtered } = useSearch(filteredSales, ['customer', 'product', 'representative', 'id']);
  const { sorted, sortKey, sortDir, toggleSort } = useSort(filtered, 'date');
  const pagination = usePagination(sorted, 8);

  const handleExport = () => {
    exportToCSV(sorted, 'sales-records', [
      { key: 'id', label: 'Deal ID' },
      { key: 'customer', label: 'Customer' },
      { key: 'product', label: 'Product/Service' },
      { key: 'representative', label: 'Representative' },
      { key: 'value', label: 'Value (PKR)' },
      { key: 'date', label: 'Date' },
      { key: 'status', label: 'Status' },
    ]);
    addToast('CSV exported successfully', 'info');
  };

  const columns = [
    {
      key: 'id',
      label: 'Deal ID',
      sortable: true,
      render: (row) => <span className="text-sm font-mono text-gray-500">{row.id}</span>,
    },
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-gray-800">{row.customer}</p>
          <p className="text-xs text-gray-400">{row.product}</p>
        </div>
      ),
    },
    {
      key: 'representative',
      label: 'Representative',
      sortable: true,
      render: (row) => <span className="text-sm text-gray-600">{row.representative}</span>,
    },
    {
      key: 'value',
      label: 'Value',
      sortable: true,
      render: (row) => <span className="text-sm font-semibold text-gray-800">{formatCurrency(row.value)}</span>,
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (row) => <span className="text-sm text-gray-500">{formatDate(row.date)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Sales Analytics"
        subtitle="Revenue tracking, deal management, and sales performance"
        breadcrumbs={[{ label: 'Sales Analytics' }]}
        actions={
          <DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} iconColor="bg-success/10 text-success" change="+18.5%" changeType="increase" subtitle="vs last month" />
        <StatCard title="Sales Growth" value="+18.5%" icon={TrendingUp} iconColor="bg-primary/10 text-primary" />
        <StatCard title="Total Deals" value={totalDeals} icon={ShoppingCart} iconColor="bg-info/10 text-info" />
        <StatCard title="Avg Deal Value" value={formatCurrency(avgDealValue)} icon={BarChart3} iconColor="bg-accent/10 text-accent" />
        <StatCard title="Conversion Rate" value={formatPercent(conversionRate)} icon={Target} iconColor="bg-warning/10 text-warning" />
        <StatCard title="Target Achievement" value={`${targetAchievement}%`} icon={Award} iconColor="bg-primary/10 text-primary" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <ChartCard title="Revenue Over Time" subtitle="Monthly revenue trend" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorSalesRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#40BFA6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#40BFA6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area type="monotone" dataKey="revenue" stroke="#40BFA6" strokeWidth={2} fill="url(#colorSalesRev)" name="Revenue" />
              <Area type="monotone" dataKey="target" stroke="#7c5cfc" strokeWidth={2} fill="none" strokeDasharray="5 5" name="Target" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Deal Status" subtitle="Distribution by status">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={dealStatusDist} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                {dealStatusDist.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Sales by Representative" subtitle="Revenue and deal count">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={salesByRep}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="revenue" fill="#40BFA6" radius={[6, 6, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sales by Service" subtitle="Revenue by product/service">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={salesByProduct} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" width={150} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              <Bar dataKey="value" name="Revenue" radius={[0, 6, 6, 0]}>
                {salesByProduct.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Conversion Funnel & Target */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Conversion Funnel" subtitle="Lead to closed deal conversion">
          <div className="space-y-3 py-2">
            {funnelData.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-28 text-right">{item.name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-7 overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center justify-end pr-2 text-white text-xs font-medium transition-all duration-500"
                    style={{ width: `${(item.value / funnelData[0].value) * 100}%`, backgroundColor: item.fill }}
                  >
                    {item.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Target vs Actual" subtitle="Monthly performance comparison">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="target" fill="#e5e7eb" radius={[6, 6, 0, 0]} name="Target" />
              <Bar dataKey="revenue" fill="#40BFA6" radius={[6, 6, 0, 0]} name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Sales Table */}
      <div className="card card-body">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <SearchInput value={query} onChange={setQuery} placeholder="Search deals..." className="flex-1" />
          <FilterDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: 'All', label: 'All Statuses' }, ...dealStatuses.map(s => ({ value: s, label: s }))]}
          />
          <FilterDropdown
            value={repFilter}
            onChange={setRepFilter}
            options={[{ value: 'All', label: 'All Reps' }, ...salesReps.map(r => ({ value: r, label: r }))]}
          />
          <ExportButton onClick={handleExport} />
        </div>
        <DataTable
          columns={columns}
          data={pagination.paginatedData}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={toggleSort}
          pagination={pagination}
          emptyTitle="No sales records found"
          emptyDescription="Try adjusting your search or filters."
          actions={(row) => (
            <button onClick={() => setViewModal(row)} className="p-1.5 rounded-lg text-gray-400 hover:text-info hover:bg-info/10" title="View">
              <Eye size={15} />
            </button>
          )}
        />
      </div>

      {/* View Modal */}
      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="Deal Details" size="md">
        {viewModal && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{viewModal.customer}</h3>
                <p className="text-sm text-gray-500">{viewModal.product}</p>
              </div>
              <StatusBadge status={viewModal.status} />
            </div>
            <hr className="border-gray-100" />
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-400">Deal ID</p><p className="text-sm font-mono text-gray-700">{viewModal.id}</p></div>
              <div><p className="text-xs text-gray-400">Representative</p><p className="text-sm font-medium text-gray-700">{viewModal.representative}</p></div>
              <div><p className="text-xs text-gray-400">Value</p><p className="text-sm font-semibold text-gray-800">{formatCurrency(viewModal.value)}</p></div>
              <div><p className="text-xs text-gray-400">Date</p><p className="text-sm font-medium text-gray-700">{formatDate(viewModal.date)}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
