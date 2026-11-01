import { poTotals } from '../data/operationsData';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => `PKR ${Math.round(n).toLocaleString('en-PK')}`;

/** Opens a print-ready purchase order (Save as PDF from the print dialog). */
export function printPurchaseOrder(po) {
  const win = window.open('', '_blank');
  if (!win) return false;
  const t = poTotals(po);
  win.document.write(`<!DOCTYPE html><html><head><title>${esc(po.poNumber)}</title>
  <style>
    body{font-family:Inter,-apple-system,"Segoe UI",Roboto,sans-serif;color:#102C32;padding:32px;max-width:820px;margin:auto}
    .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #093F50;padding-bottom:14px;margin-bottom:22px}
    h1{font-size:20px;margin:0;color:#093F50} .muted{color:#52676A;font-size:12px;margin:2px 0}
    .tag{display:inline-block;background:#F2E6A2;color:#093F50;font-weight:700;padding:4px 10px;border-radius:6px;font-size:12px}
    .grid{display:flex;gap:24px;font-size:12px;margin-bottom:8px} .grid div{flex:1;background:#F5F3EC;border-radius:8px;padding:10px 12px}
    .grid b{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#52676A;margin-bottom:4px}
    table{width:100%;border-collapse:collapse;font-size:12px;margin-top:16px}
    th{background:#093F50;color:#F2E6A2;text-align:left;padding:8px} td{padding:8px;border-bottom:1px solid #DFE7E3} .r{text-align:right}
    .totals{margin-left:auto;width:280px;font-size:12px;margin-top:14px} .totals div{display:flex;justify-content:space-between;padding:4px 0}
    .grand{font-weight:800;font-size:15px;border-top:2px solid #093F50;padding-top:8px!important;color:#093F50}
    .terms{margin-top:24px;font-size:11px;color:#52676A;background:#FBF8E8;padding:12px;border-radius:8px;border-left:3px solid #CDB64C}
    .sign{display:flex;gap:40px;margin-top:48px;font-size:11px;color:#52676A} .sign div{flex:1;border-top:1px solid #9FBAB9;padding-top:6px}
  </style></head><body>
  <div class="head">
    <div><h1>Meridian Quality Management</h1><p class="muted">ISO 9001 / Six Sigma / GMP Advisory Services</p><p class="muted">Karachi, Pakistan</p></div>
    <div style="text-align:right"><strong style="font-size:18px;color:#093F50">PURCHASE ORDER</strong><p class="muted">${esc(po.poNumber)}</p><span class="tag">${esc(po.status)}</span></div>
  </div>
  <div class="grid">
    <div><b>Supplier</b>${esc(po.supplier)}<br/>${esc(po.supplierContact)}</div>
    <div><b>Order date</b>${esc(po.orderDate)}<br/><b style="margin-top:8px">Expected delivery</b>${esc(po.expectedDate)}</div>
    <div><b>Requested by</b>${esc(po.requestedBy)}</div>
  </div>
  <table><thead><tr><th>#</th><th>Description</th><th class="r">Qty</th><th class="r">Unit price</th><th class="r">Tax</th><th class="r">Amount</th></tr></thead><tbody>
  ${po.items.map((i, n) => `<tr><td>${n + 1}</td><td>${esc(i.description)}</td><td class="r">${esc(i.qty)}</td><td class="r">${money(i.unitPrice)}</td><td class="r">${esc(i.taxRate)}%</td><td class="r">${money(i.qty * i.unitPrice)}</td></tr>`).join('')}
  </tbody></table>
  <div class="totals">
    <div><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
    <div><span>Sales tax</span><span>${money(t.tax)}</span></div>
    <div><span>Shipping</span><span>${money(t.shipping)}</span></div>
    <div class="grand"><span>Total</span><span>${money(t.total)}</span></div>
  </div>
  ${po.notes ? `<p style="font-size:12px;margin-top:18px"><b>Notes:</b> ${esc(po.notes)}</p>` : ''}
  <div class="terms"><b>Terms &amp; conditions</b><br/>${esc(po.terms)}</div>
  <div class="sign"><div>Prepared by</div><div>Approved by</div><div>Supplier acknowledgement</div></div>
  <script>window.onload=function(){window.print();}</script></body></html>`);
  win.document.close();
  return true;
}
