/**
 * Print-friendly quotation (browser print dialog → "Save as PDF").
 * Uses only the quotation record and the company header already shown in the
 * app. It is labelled as a quotation, not a tax invoice.
 */
const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const money = (n) => `PKR ${Math.round(Number(n) || 0).toLocaleString('en-US')}`;

export function quotationAmounts(q) {
  const subtotal = Number(q.subtotal) || 0;
  const discount = (subtotal * (Number(q.discountPercent) || 0)) / 100;
  const taxable = subtotal - discount;
  const tax = (taxable * (Number(q.taxPercent) || 0)) / 100;
  return { subtotal, discount, taxable, tax, total: Number(q.total) || taxable + tax };
}

export function printQuotation(q) {
  const win = window.open('', '_blank');
  if (!win) return false;
  const a = quotationAmounts(q);
  win.document.write(`<!DOCTYPE html><html><head><title>${esc(q.quoteNumber)}</title>
  <style>
    body{font-family:Inter,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1e211f;padding:32px;max-width:820px;margin:auto}
    .head{display:flex;justify-content:space-between;border-bottom:2px solid #187f65;padding-bottom:12px;margin-bottom:20px}
    h1{font-size:20px;margin:0;color:#187f65} .muted{color:#5a625c;font-size:12px;margin:2px 0}
    table{width:100%;border-collapse:collapse;font-size:12px;margin-top:16px}
    th{background:#f7f8f7;text-align:left;padding:8px;border-bottom:1px solid #e4e7e5;color:#5a625c}
    td{padding:8px;border-bottom:1px solid #eff1f0} .r{text-align:right}
    .totals{margin-left:auto;width:280px;font-size:12px;margin-top:12px}
    .totals div{display:flex;justify-content:space-between;padding:3px 0}
    .grand{font-weight:700;font-size:14px;border-top:1px solid #e4e7e5;padding-top:6px!important}
    .terms{margin-top:24px;font-size:11px;color:#5a625c;background:#f7f8f7;padding:10px;border-radius:6px}
    .note{margin-top:16px;font-size:10px;color:#757f79}
  </style></head><body>
  <div class="head">
    <div><h1>Meridian Quality Management</h1><p class="muted">ISO 9001 / Six Sigma / GMP Advisory Services</p></div>
    <div style="text-align:right"><strong style="font-size:16px">QUOTATION</strong><p class="muted">${esc(q.quoteNumber)}</p><p class="muted">Status: ${esc(q.status)}</p></div>
  </div>
  <div style="display:flex;justify-content:space-between;font-size:12px">
    <div><p class="muted">Prepared for</p><strong>${esc(q.customer)}</strong><p class="muted">${esc(q.relatedDeal)}</p></div>
    <div style="text-align:right"><p class="muted">Issue date: <strong>${esc(q.issueDate)}</strong></p><p class="muted">Valid until: <strong>${esc(q.expiryDate)}</strong></p><p class="muted">Prepared by: <strong>${esc(q.preparedBy)}</strong></p></div>
  </div>
  <table><thead><tr><th>Description</th><th class="r">Qty</th><th class="r">Unit price</th><th class="r">Total</th></tr></thead><tbody>
  ${(q.lineItems || []).map(i => `<tr><td>${esc(i.description)}</td><td class="r">${esc(i.quantity)}</td><td class="r">${money(i.unitPrice)}</td><td class="r">${money(i.total)}</td></tr>`).join('')}
  </tbody></table>
  <div class="totals">
    <div><span>Subtotal</span><span>${money(a.subtotal)}</span></div>
    ${a.discount ? `<div><span>Discount (${esc(q.discountPercent)}%)</span><span>- ${money(a.discount)}</span></div>` : ''}
    <div><span>Tax (${esc(q.taxPercent)}%)</span><span>${money(a.tax)}</span></div>
    <div class="grand"><span>Total</span><span>${money(a.total)}</span></div>
  </div>
  ${q.notes ? `<div class="terms"><strong>Terms &amp; notes</strong><br/>${esc(q.notes)}</div>` : ''}
  <p class="note">This document is a quotation for proposed services and is not a tax invoice.</p>
  <script>window.onload=function(){window.print();}</script>
  </body></html>`);
  win.document.close();
  return true;
}
