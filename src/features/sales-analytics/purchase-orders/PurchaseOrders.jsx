import React, { useMemo, useState } from 'react';
import { addDays, differenceInCalendarDays, format, parseISO, subDays } from 'date-fns';
import {
  Plus, ShoppingCart, Hourglass, Wallet, PackageCheck, Search, Eye, Printer, MoreHorizontal, Pencil, Copy, Ban, Trash2,
  Send, CheckCircle2, FileText, Truck, Check, X,
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import DataTransferActions from '../../../components/data-transfer/DataTransferActions';
import useCollection from '../../../hooks/useCollection';
import useQuickAction from '../../../hooks/useQuickAction';
import { useSettings } from '../../../lib/settings';
import { PO_STATUSES, poTotals } from '../../../data/operationsData';
import { printPurchaseOrder } from '../../../utils/purchaseOrderPrint';
import { generateId } from '../../../utils/format';
import { Pill, MiniStat, usePopover } from '../../team/teamUi';

const money = (n) => `PKR ${Math.round(n).toLocaleString('en-PK')}`;
const compact = (n) => (n >= 1e6 ? `PKR ${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `PKR ${Math.round(n / 1e3)}K` : money(n));
const STATUS_TONE = { Draft: 'neutral', 'Pending Approval': 'warning', Approved: 'info', Sent: 'primary', Received: 'success', Cancelled: 'danger' };
const FLOW = ['Draft', 'Pending Approval', 'Approved', 'Sent', 'Received'];
const NEXT = {
  Draft: { to: 'Pending Approval', label: 'Submit', icon: Send },
  'Pending Approval': { to: 'Approved', label: 'Approve', icon: CheckCircle2 },
  Approved: { to: 'Sent', label: 'Send to supplier', icon: Send },
  Sent: { to: 'Received', label: 'Mark received', icon: PackageCheck },
};
const STEP_ICONS = [FileText, Hourglass, CheckCircle2, Truck, PackageCheck];

const newLine = () => ({ id: generateId(), description: '', qty: 1, unitPrice: 0, taxRate: 17 });

export default function PurchaseOrders() {
  const addToast = useToast();
  const [{ profile }] = useSettings();
  const [orders, setOrders] = useCollection('purchaseOrders');
  const [companies] = useCollection('companies');
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState('');
  const [menu, setMenu, menuRef] = usePopover();

  const nextNumber = () => {
    const max = orders.reduce((m, o) => Math.max(m, Number(String(o.poNumber).match(/(\d+)$/)?.[1] || 0)), 0);
    return `PO-${new Date().getFullYear()}-${String(max + 1).padStart(4, '0')}`;
  };

  const openNew = () => {
    setEditor({
      poNumber: nextNumber(), supplier: '', supplierContact: '', orderDate: format(new Date(), 'yyyy-MM-dd'),
      expectedDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'), status: 'Draft', items: [newLine()], shipping: 0, notes: '',
      terms: 'Payment within 30 days of delivery. Goods must include calibration certificates where applicable.', requestedBy: profile.name,
    });
    setError('');
  };
  useQuickAction('new', openNew);

  const suppliers = useMemo(() => [...new Set([
    ...companies.filter(c => c.relationship === 'Supplier').map(c => c.name),
    ...orders.map(o => o.supplier),
  ])].sort(), [companies, orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders
      .filter(o => status === 'all' || o.status === status)
      .filter(o => !q || `${o.poNumber} ${o.supplier} ${o.supplierContact} ${o.items.map(i => i.description).join(' ')}`.toLowerCase().includes(q))
      .sort((a, b) => b.poNumber.localeCompare(a.poNumber));
  }, [orders, status, query]);

  const open = orders.filter(o => !['Received', 'Cancelled'].includes(o.status));
  const since = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const recentValue = orders.filter(o => o.orderDate >= since && o.status !== 'Cancelled').reduce((s, o) => s + poTotals(o).total, 0);

  const setStatusOf = (o, to, msg) => {
    setOrders(prev => prev.map(x => (x.id === o.id ? { ...x, status: to, [`${to.replace(/\s/g, '').toLowerCase()}On`]: format(new Date(), 'yyyy-MM-dd') } : x)));
    setMenu(null);
    addToast(msg || `${o.poNumber} → ${to}.`, to === 'Cancelled' ? 'info' : 'success');
  };

  const duplicate = (o) => {
    const copy = { ...o, id: `po-${generateId()}`, poNumber: nextNumber(), status: 'Draft', orderDate: format(new Date(), 'yyyy-MM-dd'), items: o.items.map(i => ({ ...i, id: generateId() })) };
    setOrders(prev => [copy, ...prev]);
    setMenu(null);
    addToast(`Duplicated as ${copy.poNumber}.`, 'success');
  };

  const setLine = (id, key, value) => setEditor(e => ({ ...e, items: e.items.map(i => (i.id === id ? { ...i, [key]: value } : i)) }));

  const save = (submit) => {
    const items = editor.items.filter(i => i.description.trim());
    if (!editor.supplier.trim()) { setError('Choose or type a supplier.'); return; }
    if (!items.length) { setError('Add at least one line item with a description.'); return; }
    if (items.some(i => Number(i.qty) <= 0)) { setError('Quantities must be greater than zero.'); return; }
    const record = {
      ...editor, supplier: editor.supplier.trim(), items: items.map(i => ({ ...i, qty: Number(i.qty), unitPrice: Number(i.unitPrice) || 0, taxRate: Number(i.taxRate) || 0 })),
      shipping: Number(editor.shipping) || 0, status: submit ? 'Pending Approval' : editor.status,
    };
    if (record.id) {
      setOrders(prev => prev.map(o => (o.id === record.id ? record : o)));
    } else {
      setOrders(prev => [{ ...record, id: `po-${generateId()}` }, ...prev]);
    }
    setEditor(null);
    addToast(submit ? `${record.poNumber} submitted for approval.` : `${record.poNumber} saved.`, 'success');
  };

  const viewing = orders.find(o => o.id === viewId);
  const totals = editor ? poTotals({ ...editor, items: editor.items }) : null;

  const deliveryHint = (o) => {
    if (['Received', 'Cancelled', 'Draft'].includes(o.status)) return null;
    const d = differenceInCalendarDays(parseISO(o.expectedDate), new Date());
    if (d < 0) return <span className="text-danger font-semibold">{Math.abs(d)}d late</span>;
    if (d === 0) return <span className="text-accent-700 font-semibold">due today</span>;
    return <span className="text-gray-500">in {d}d</span>;
  };

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        subtitle="Raise purchase orders, route them for approval, send them to suppliers and track deliveries."
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <DataTransferActions entityType="purchaseOrders" records={orders} filtered={filtered} exportOnly />
            <button type="button" className="btn-primary" onClick={openNew}><Plus size={16} /> New Purchase Order</button>
          </div>
        )}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MiniStat icon={ShoppingCart} label="Open orders" value={open.length} hint={compact(open.reduce((s, o) => s + poTotals(o).total, 0))} tone="teal" />
        <MiniStat icon={Hourglass} label="Awaiting approval" value={orders.filter(o => o.status === 'Pending Approval').length} tone="orange" />
        <MiniStat icon={Wallet} label="Ordered · 30 days" value={compact(recentValue)} hint="Excludes cancelled" tone="primrose" />
        <MiniStat icon={PackageCheck} label="Received" value={orders.filter(o => o.status === 'Received').length} tone="green" />
      </div>

      {/* Status pipeline */}
      <div className="card p-2 mb-5 flex gap-1 overflow-x-auto">
        {['all', ...PO_STATUSES].map(s => {
          const count = s === 'all' ? orders.length : orders.filter(o => o.status === s).length;
          const active = status === s;
          return (
            <button key={s} type="button" onClick={() => setStatus(s)} className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${active ? 'bg-teal-800 text-primrose shadow-glow-teal' : 'text-gray-600 hover:bg-gray-50'}`}>
              {s === 'all' ? 'All orders' : s}
              <span className={`min-w-[20px] h-5 px-1.5 grid place-items-center rounded-full text-[10.5px] font-bold ${active ? 'bg-primrose text-primary-ink' : 'bg-gray-100 text-gray-600'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <section className="card overflow-hidden">
        <div className="p-4 border-b border-[color:var(--border-subtle)]">
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="search" className="form-input !pl-9" placeholder="Search PO number, supplier or item…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search purchase orders" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[860px]">
            <thead className="bg-gray-50 text-left text-xs text-gray-600">
              <tr>
                <th className="px-5 py-3 font-bold">PO number</th>
                <th className="px-3 py-3 font-bold">Supplier</th>
                <th className="px-3 py-3 font-bold">Ordered</th>
                <th className="px-3 py-3 font-bold">Delivery</th>
                <th className="px-3 py-3 font-bold text-right">Total</th>
                <th className="px-3 py-3 font-bold">Status</th>
                <th className="px-5 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={7} className="py-14 text-center text-gray-500">No purchase orders match.</td></tr>}
              {filtered.map(o => {
                const t = poTotals(o);
                const next = NEXT[o.status];
                return (
                  <tr key={o.id} className="border-t border-[color:var(--border-subtle)] hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <button type="button" onClick={() => setViewId(o.id)} className="font-bold text-brand hover:underline">{o.poNumber}</button>
                      <p className="text-[11px] text-gray-500">{o.items.length} item{o.items.length === 1 ? '' : 's'}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="font-semibold text-gray-900">{o.supplier}</p>
                      <p className="text-[11px] text-gray-500">{o.supplierContact}</p>
                    </td>
                    <td className="px-3 py-3.5 text-gray-700 whitespace-nowrap">{format(parseISO(o.orderDate), 'd MMM yyyy')}</td>
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <p className="text-gray-700">{format(parseISO(o.expectedDate), 'd MMM')}</p>
                      <p className="text-[11px]">{deliveryHint(o)}</p>
                    </td>
                    <td className="px-3 py-3.5 text-right font-bold text-gray-900 whitespace-nowrap tabular-nums">{money(t.total)}</td>
                    <td className="px-3 py-3.5"><Pill tone={STATUS_TONE[o.status]} dot>{o.status}</Pill></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {next && (
                          <button type="button" onClick={() => setStatusOf(o, next.to)} className={`${next.to === 'Approved' ? 'btn-primary' : 'btn-outline'} btn-xs !py-1.5 !px-2.5 whitespace-nowrap`}>
                            <next.icon size={13} /> {next.label}
                          </button>
                        )}
                        <button type="button" onClick={() => setViewId(o.id)} className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100" aria-label={`View ${o.poNumber}`}><Eye size={16} /></button>
                        <div className="relative" ref={menu === o.id ? menuRef : undefined}>
                          <button type="button" onClick={() => setMenu(menu === o.id ? null : o.id)} className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100" aria-label={`More for ${o.poNumber}`} aria-expanded={menu === o.id}><MoreHorizontal size={16} /></button>
                          {menu === o.id && (
                            <div className="menu-panel absolute right-0 top-8 z-30 w-48 p-1.5" role="menu">
                              {['Draft', 'Pending Approval'].includes(o.status) && <button type="button" role="menuitem" className="menu-item" onClick={() => { setEditor({ ...o, items: o.items.map(i => ({ ...i })) }); setError(''); setMenu(null); }}><Pencil size={14} /> Edit</button>}
                              {o.status === 'Pending Approval' && <button type="button" role="menuitem" className="menu-item" onClick={() => setStatusOf(o, 'Draft', `${o.poNumber} returned to draft.`)}><X size={14} /> Reject to draft</button>}
                              <button type="button" role="menuitem" className="menu-item" onClick={() => { setMenu(null); if (!printPurchaseOrder(o)) addToast('Allow pop-ups to print the purchase order.', 'error'); }}><Printer size={14} /> Print / PDF</button>
                              <button type="button" role="menuitem" className="menu-item" onClick={() => duplicate(o)}><Copy size={14} /> Duplicate</button>
                              {!['Received', 'Cancelled'].includes(o.status) && <button type="button" role="menuitem" className="menu-item" onClick={() => setStatusOf(o, 'Cancelled')}><Ban size={14} /> Cancel order</button>}
                              <button type="button" role="menuitem" className="menu-item !text-danger hover:!bg-danger-50" onClick={() => { setDeleteTarget(o); setMenu(null); }}><Trash2 size={14} /> Delete</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Editor */}
      <Modal
        isOpen={!!editor}
        onClose={() => setEditor(null)}
        title={editor?.id ? `Edit ${editor.poNumber}` : 'New Purchase Order'}
        size="xl"
        footer={(
          <>
            <button type="button" className="btn-secondary" onClick={() => setEditor(null)}>Cancel</button>
            <button type="button" className="btn-outline" onClick={() => save(false)}>Save {editor?.status === 'Draft' ? 'draft' : ''}</button>
            {editor?.status === 'Draft' && <button type="button" className="btn-primary" onClick={() => save(true)}><Send size={15} /> Submit for approval</button>}
          </>
        )}
      >
        {editor && (
          <div className="space-y-5">
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label htmlFor="po-number" className="form-label">PO number</label>
                <input id="po-number" className="form-input font-semibold" value={editor.poNumber} onChange={e => setEditor(x => ({ ...x, poNumber: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="po-supplier" className="form-label">Supplier *</label>
                <input id="po-supplier" list="po-suppliers" className="form-input" value={editor.supplier} onChange={e => setEditor(x => ({ ...x, supplier: e.target.value }))} placeholder="Start typing a supplier" />
                <datalist id="po-suppliers">{suppliers.map(s => <option key={s} value={s} />)}</datalist>
              </div>
              <div>
                <label htmlFor="po-contact" className="form-label">Contact</label>
                <input id="po-contact" className="form-input" value={editor.supplierContact} onChange={e => setEditor(x => ({ ...x, supplierContact: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="po-date" className="form-label">Order date</label>
                <input id="po-date" type="date" className="form-input" value={editor.orderDate} onChange={e => setEditor(x => ({ ...x, orderDate: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="po-expected" className="form-label">Expected delivery</label>
                <input id="po-expected" type="date" className="form-input" min={editor.orderDate} value={editor.expectedDate} onChange={e => setEditor(x => ({ ...x, expectedDate: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="po-by" className="form-label">Requested by</label>
                <input id="po-by" className="form-input" value={editor.requestedBy} onChange={e => setEditor(x => ({ ...x, requestedBy: e.target.value }))} />
              </div>
            </div>

            <div className="rounded-xl border border-[color:var(--border-subtle)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] min-w-[640px]">
                  <thead className="bg-gray-50 text-left text-xs text-gray-600">
                    <tr>
                      <th className="px-3 py-2.5 font-bold">Item description</th>
                      <th className="px-2 py-2.5 font-bold w-20">Qty</th>
                      <th className="px-2 py-2.5 font-bold w-36">Unit price</th>
                      <th className="px-2 py-2.5 font-bold w-20">Tax %</th>
                      <th className="px-3 py-2.5 font-bold w-32 text-right">Amount</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {editor.items.map(i => (
                      <tr key={i.id} className="border-t border-[color:var(--border-subtle)]">
                        <td className="px-3 py-2"><input className="form-input !py-2" value={i.description} onChange={e => setLine(i.id, 'description', e.target.value)} placeholder="e.g. Pressure calibrator" aria-label="Item description" /></td>
                        <td className="px-2 py-2"><input type="number" min="1" className="form-input !py-2" value={i.qty} onChange={e => setLine(i.id, 'qty', e.target.value)} aria-label="Quantity" /></td>
                        <td className="px-2 py-2"><input type="number" min="0" className="form-input !py-2" value={i.unitPrice} onChange={e => setLine(i.id, 'unitPrice', e.target.value)} aria-label="Unit price" /></td>
                        <td className="px-2 py-2"><input type="number" min="0" className="form-input !py-2" value={i.taxRate} onChange={e => setLine(i.id, 'taxRate', e.target.value)} aria-label="Tax rate" /></td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-900 tabular-nums">{money((Number(i.qty) || 0) * (Number(i.unitPrice) || 0))}</td>
                        <td className="px-1 py-2">
                          <button type="button" onClick={() => setEditor(x => ({ ...x, items: x.items.length > 1 ? x.items.filter(l => l.id !== i.id) : x.items }))} className="p-1.5 rounded-md text-gray-400 hover:text-danger hover:bg-danger-50" aria-label="Remove line"><X size={15} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={() => setEditor(x => ({ ...x, items: [...x.items, newLine()] }))} className="w-full py-2.5 text-[13px] font-semibold text-brand hover:bg-primary-50 border-t border-dashed border-[color:var(--border-default)]"><Plus size={14} className="inline -mt-0.5" /> Add line item</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-5">
              <div className="space-y-3">
                <div>
                  <label htmlFor="po-notes" className="form-label">Notes</label>
                  <textarea id="po-notes" rows={2} className="form-input" value={editor.notes} onChange={e => setEditor(x => ({ ...x, notes: e.target.value }))} />
                </div>
                <div>
                  <label htmlFor="po-terms" className="form-label">Terms</label>
                  <textarea id="po-terms" rows={2} className="form-input" value={editor.terms} onChange={e => setEditor(x => ({ ...x, terms: e.target.value }))} />
                </div>
              </div>
              <div className="rounded-xl p-4 text-white self-start" style={{ background: 'var(--gradient-cta)' }}>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-white/80"><span>Subtotal</span><span className="tabular-nums">{money(totals.subtotal)}</span></div>
                  <div className="flex justify-between text-white/80"><span>Sales tax</span><span className="tabular-nums">{money(totals.tax)}</span></div>
                  <div className="flex justify-between items-center text-white/80">
                    <label htmlFor="po-ship">Shipping</label>
                    <input id="po-ship" type="number" min="0" value={editor.shipping} onChange={e => setEditor(x => ({ ...x, shipping: e.target.value }))} className="w-28 text-right rounded-md bg-white/10 px-2 py-1 outline-none focus:bg-white/20 tabular-nums" />
                  </div>
                  <div className="flex justify-between pt-3 mt-1 border-t border-white/20 text-lg font-extrabold"><span>Total</span><span className="text-primrose tabular-nums">{money(totals.total)}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Viewer */}
      <Modal
        isOpen={!!viewing}
        onClose={() => setViewId(null)}
        title={viewing?.poNumber || ''}
        size="xl"
        footer={viewing && (
          <>
            <button type="button" className="btn-secondary mr-auto" onClick={() => { if (!printPurchaseOrder(viewing)) addToast('Allow pop-ups to print the purchase order.', 'error'); }}><Printer size={15} /> Print / PDF</button>
            <button type="button" className="btn-outline" onClick={() => setViewId(null)}>Close</button>
            {NEXT[viewing.status] && (() => { const n = NEXT[viewing.status]; return <button type="button" className="btn-primary" onClick={() => setStatusOf(viewing, n.to)}><n.icon size={15} /> {n.label}</button>; })()}
          </>
        )}
      >
        {viewing && (() => {
          const t = poTotals(viewing);
          const stepIndex = FLOW.indexOf(viewing.status);
          return (
            <div className="space-y-6">
              {/* Progress stepper */}
              {viewing.status === 'Cancelled' ? (
                <div className="rounded-xl bg-danger-50 text-danger-600 px-4 py-3 text-sm font-semibold flex items-center gap-2"><Ban size={16} /> This order was cancelled.</div>
              ) : (
                <ol className="flex items-center">
                  {FLOW.map((s, i) => {
                    const Icon = STEP_ICONS[i];
                    const done = i <= stepIndex;
                    return (
                      <li key={s} className={`flex items-center ${i < FLOW.length - 1 ? 'flex-1' : ''}`}>
                        <span className="flex flex-col items-center gap-1.5 text-center">
                          <span className={`w-10 h-10 rounded-full grid place-items-center transition-colors ${i === stepIndex ? 'bg-primrose text-primary-ink shadow-glow-primary' : done ? 'bg-teal-800 text-primrose' : 'bg-gray-100 text-gray-400'}`}>
                            {done && i < stepIndex ? <Check size={17} /> : <Icon size={17} />}
                          </span>
                          <span className={`text-[10.5px] font-semibold w-20 ${done ? 'text-gray-900' : 'text-gray-400'}`}>{s}</span>
                        </span>
                        {i < FLOW.length - 1 && <span className={`flex-1 h-1 rounded-full mx-1 -mt-6 ${i < stepIndex ? 'bg-teal-800' : 'bg-gray-100'}`} />}
                      </li>
                    );
                  })}
                </ol>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                {[['Supplier', `${viewing.supplier}`, viewing.supplierContact], ['Order date', format(parseISO(viewing.orderDate), 'd MMM yyyy'), `Expected ${format(parseISO(viewing.expectedDate), 'd MMM yyyy')}`], ['Requested by', viewing.requestedBy, `${viewing.items.length} line items`]].map(([k, v, s]) => (
                  <div key={k} className="rounded-xl bg-gray-50 p-3.5">
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500">{k}</p>
                    <p className="font-semibold text-gray-900 mt-1">{v}</p>
                    <p className="text-xs text-gray-500">{s}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-[color:var(--border-subtle)] overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead className="bg-teal-800 text-primrose text-left text-xs">
                    <tr><th className="px-4 py-2.5">Description</th><th className="px-3 py-2.5 text-right">Qty</th><th className="px-3 py-2.5 text-right">Unit price</th><th className="px-4 py-2.5 text-right">Amount</th></tr>
                  </thead>
                  <tbody>
                    {viewing.items.map(i => (
                      <tr key={i.id} className="border-t border-[color:var(--border-subtle)]">
                        <td className="px-4 py-2.5 text-gray-900">{i.description}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{i.qty}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{money(i.unitPrice)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{money(i.qty * i.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="bg-gray-50 px-4 py-3 text-sm flex flex-col items-end gap-1">
                  <span className="text-gray-600">Subtotal <b className="tabular-nums text-gray-900 ml-3">{money(t.subtotal)}</b></span>
                  <span className="text-gray-600">Sales tax <b className="tabular-nums text-gray-900 ml-3">{money(t.tax)}</b></span>
                  <span className="text-gray-600">Shipping <b className="tabular-nums text-gray-900 ml-3">{money(t.shipping)}</b></span>
                  <span className="text-lg font-extrabold text-gray-900 mt-1">Total <span className="tabular-nums text-brand ml-3">{money(t.total)}</span></span>
                </div>
              </div>
              {viewing.notes && <p className="text-sm text-gray-700"><b>Notes:</b> {viewing.notes}</p>}
            </div>
          );
        })()}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { setOrders(prev => prev.filter(o => o.id !== deleteTarget.id)); addToast(`${deleteTarget.poNumber} deleted.`, 'success'); setDeleteTarget(null); }}
        title="Delete purchase order"
        message={`Delete ${deleteTarget?.poNumber}? This cannot be undone.`}
      />
    </div>
  );
}
