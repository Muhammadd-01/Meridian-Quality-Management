import React from 'react';
import { Package, Boxes, AlertTriangle, Percent } from 'lucide-react';
import RecordPage from '../components/RecordPage';
import StatusBadge from '../../../components/ui/StatusBadge';
import useCollections from '../../../hooks/useCollections';
import { ProductThumb, StockBadge, Stars, DemoTag } from '../components/bits';
import { productStats, stockState, money } from '../lib';

export default function Products() {
  const { storeOrders, productReviews, storeCategories } = useCollections(['storeOrders', 'productReviews', 'storeCategories']);

  return (
    <RecordPage
      entityType="storeProducts"
      title="Products"
      subtitle="Product catalogue with SKU, price, stock, category and status. Units sold and ratings come from orders and approved reviews."
      formFields={undefined}
      kpis={(records) => {
        const value = records.reduce((s, p) => s + (Number(p.stock) || 0) * (Number(p.cost) || 0), 0);
        const alerts = records.filter(p => p.status === 'Active' && stockState(p).label !== 'In stock');
        const priced = records.filter(p => Number(p.price) > 0);
        const margin = priced.length ? priced.reduce((s, p) => s + (p.price - (p.cost || 0)) / p.price, 0) / priced.length : 0;
        return [
          { title: 'Products', value: records.length, icon: Package, tone: 'primary', subtitle: `${records.filter(p => p.status === 'Active').length} active` },
          { title: 'Inventory Value', value: money(value), icon: Boxes, tone: 'info', subtitle: 'Σ stock × unit cost' },
          { title: 'Stock Alerts', value: alerts.length, icon: AlertTriangle, tone: alerts.length ? 'danger' : 'success', subtitle: 'Low or out of stock (active)' },
          { title: 'Avg Gross Margin', value: `${(margin * 100).toFixed(1)}%`, icon: Percent, tone: 'accent', subtitle: '(price − cost) ÷ price' },
        ];
      }}
      columns={[
        {
          key: 'name', label: 'Product', sortable: true,
          render: (r) => (
            <div className="flex items-center gap-2.5 min-w-0">
              <ProductThumb category={r.category} />
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 flex items-center gap-1.5">{r.name}<DemoTag show={r.isDemo} /></p>
                <p className="text-2xs text-gray-500">{r.sku} · {r.category || 'Uncategorised'}</p>
              </div>
            </div>
          ),
        },
        { key: 'price', label: 'Price', sortable: true, align: 'right', render: (r) => <span className="font-semibold text-gray-900">{money(r.price)}</span> },
        { key: 'stock', label: 'Stock', sortable: true, align: 'right', render: (r) => <div className="flex flex-col items-end gap-1"><span className="tabular-nums">{Number(r.stock || 0).toLocaleString()}</span><StockBadge product={r} /></div> },
        {
          key: 'sold', label: 'Sold / Rating',
          render: (r) => {
            const s = productStats([r], storeOrders, productReviews)[r.id];
            return <div><p className="text-xs text-gray-800">{s.units} units · {money(s.revenue)}</p>{s.rating !== null ? <Stars value={s.rating} size={11} /> : <span className="text-2xs text-gray-400">No reviews</span>}</div>;
          },
        },
        { key: 'status', label: 'Status', sortable: true, render: (r) => <StatusBadge status={r.status} /> },
      ]}
      filters={[
        { key: 'category', label: 'All categories', options: storeCategories.map(c => c.name) },
        { key: 'status', label: 'All statuses' },
        { key: 'productType', label: 'All types' },
      ]}
      tabs={[
        { id: 'all', label: 'All' },
        { id: 'active', label: 'Active', filter: (r) => r.status === 'Active' },
        { id: 'low', label: 'Low stock', filter: (r) => stockState(r).label === 'Low stock' },
        { id: 'out', label: 'Out of stock', filter: (r) => stockState(r).label === 'Out of stock' },
        { id: 'draft', label: 'Drafts', filter: (r) => r.status === 'Draft' },
      ]}
      defaultSort={{ key: 'name', dir: 'asc' }}
      renderCard={(r) => (
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <ProductThumb category={r.category} size={44} />
            <StatusBadge status={r.status} />
          </div>
          <p className="mt-3 font-bold text-gray-900 leading-snug">{r.name}</p>
          <p className="text-2xs text-gray-500 mt-0.5">{r.sku} · {r.brand}</p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="font-display text-lg font-extrabold text-primary">{money(r.price)}</span>
            <StockBadge product={r} />
          </div>
        </div>
      )}
    />
  );
}
