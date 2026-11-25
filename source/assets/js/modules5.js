/* Phase 6 & Enhanced Sales/Invoice Module:
   - Customer-Wise Invoice List & Responsive Mobile Cards
   - Invoice Details Modal with Line Items, Settings-controlled VAT, Discount & Due
   - Transaction-based Payment History, Partial Payments & Reversal Workflow
   - A4 Print Preview Only (Thermal Removed) & Payment Receipts
   - Role-governed Invoice Edit/Delete with Atomic Stock & Ledger Sync
   - Add Product / Customer / Supplier forms
*/
(()=>{
const U=window.UI,{modal,field,bad,opts,sum,$,ACT,IN}=U,P=window.PAGES,B=window.BRAND;
let F,SV='list',seeded=false;const orig=P.sales;

// Invoice list filter state
const IVS = {
  cust: 'all',
  status: 'all',
  q: '',
  range: 'all',
  df: '',
  dt: ''
};
U.IVS = IVS;

function nowStr(d = new Date()) {
  const f = F || (window.UI && window.UI.F && window.UI.F());
  const loc = f && f.S.lang === 'bn' ? 'bn-BD' : 'en-IN';
  return d.toLocaleDateString(loc, { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
         d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });
}

function I(f){
  F=f;U.boot(f);U.init2(f);U.init3(f);if(U.init13)U.init13(f);
  const D=f.D;
  if(seeded){
    if(window.FIN) window.FIN.boot(f);
    return;
  }
  seeded=true;

  if(!D.invoiceSeq) D.invoiceSeq = 1200;
  if(!D.paySeq) D.paySeq = 1000;

  const vatOn = window.FIN ? window.FIN.isVatOn() : false;
  const vatPct = vatOn ? (window.FIN ? window.FIN.getVatPct() : 5) : 0;

  // Ensure every invoice is enriched with line items, timestamps, and an immutable payment history ledger
  D.invoices.forEach((v,i)=>{
    if (!v[6] || !v[6].length) {
      const p=(v[1]*2+i)%D.products.length,pr=D.products[p].price;
      const q=Math.max(50,Math.round(v[2]/(vatOn?(1+vatPct/100):1)/pr/10)*10);
      const sub=Math.round(q*pr);
      const vatAmt=vatOn?Math.round(sub*vatPct/100):0;
      const a=sub+vatAmt;
      v[6]=[{p,q,pr}];
      v[2]=a; // grand total
      const targetPaid = v[4]==='paid'?a:v[4]==='due'?0:Math.min(v[3],Math.max(0,a-1000));
      v[3]=targetPaid; // paid
      v[5]=Math.round(q*(pr-D.products[p].cost));
      v.subtotal = sub;
      v.discount = v.discount || 0;
      v.discPct = v.discPct || 0;
      v.carry = v.carry || 0;
      v.vatPct = vatPct;
      v.vat = vatAmt;
    }

    const dObj = new Date(2026, 9, 28 - i, 11, 30 - i * 15);
    if (!v.createdTs) v.createdTs = dObj.getTime();
    if (!v.dateStr) v.dateStr = new Date(v.createdTs).toLocaleDateString(F.S.lang==='bn'?'bn-BD':'en-IN',{day:'numeric',month:'short',year:'numeric'});
    const demoChallans = ['CH-399', 'CH-400', 'CH-404', 'CH-406', 'CH-395', 'CH-391'];
    v.challan = v.challan || demoChallans[i % demoChallans.length] || ('CH-' + (390 + i));

    // Seed immutable payment transactions
    if (!v.payments) {
      v.payments = [];
      if (v[3] > 0) {
        const payId = 'PAY-2026-' + (++D.paySeq);
        v.payments.push({
          id: payId,
          invNo: v[0],
          c: v[1],
          dt: v.createdTs,
          dtStr: nowStr(new Date(v.createdTs)),
          amt: v[3],
          m: v[7] || (i % 2 === 0 ? 'm_bank' : 'm_cash'),
          ref: 'TXN-' + (84100 + i),
          u: 'আসির আহমেদ তৌসিফ',
          note: 'Initial invoice settlement',
          status: 'posted',
          revRef: null,
          revReason: null,
          revBy: null,
          revAt: null
        });
      }
    }
  });

  if (window.FIN) window.FIN.boot(f);
}

const loc=()=>((F && F.S) || (window.UI?.F?.()?.S))?.lang==='bn'?'bn-BD':'en-IN';
const lines=(v)=>v[6]||(v[6]=(()=>{
  const D=(F && F.D) || (window.UI?.F?.()?.D),p=v[1]%D.products.length,pr=D.products[p].price;
  return[{p,q:Math.max(50,Math.round(v[2]/pr/10)*10),pr}];
})());
const dt=(i, v)=>v?.dateStr || new Date(2026,9,28-i).toLocaleDateString(loc(),{day:'numeric',month:'short',year:'numeric'});

const INV_CSS=`.inv2{width:794px;box-sizing:border-box;background:#FAF7F2;color:#1e293b;font:13px/1.5 'Plus Jakarta Sans','Hind Siliguri','Segoe UI',-apple-system,sans-serif;padding:36px 42px 32px;position:relative;border-top:6px solid #1B3A6B;box-shadow:0 12px 36px rgba(50,38,22,0.09),0 2px 6px rgba(0,0,0,0.04);border-radius:4px}.inv2 *{box-sizing:border-box}
.i2-head{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;padding-bottom:18px;border-bottom:2px solid #E6DFD5}
.i2-co{display:flex;gap:14px;align-items:flex-start;max-width:440px}
.i2-logo{width:56px;height:56px;border-radius:10px;object-fit:contain;background:#FFFFFF;border:1px solid #E6DFD5;padding:4px}
.i2-logo-placeholder{width:56px;height:56px;border-radius:10px;background:linear-gradient(135deg,#1B3A6B 0%,#0E9F9A 100%);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:22px;box-shadow:0 4px 10px rgba(27,58,107,0.2)}
.i2-co b{display:block;font-size:19px;font-weight:800;color:#1B3A6B;line-height:1.25}
.i2-co span{display:block;color:#0E9F9A;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.05em;margin-top:2px;margin-bottom:3px}
.i2-co small{display:block;color:#6B6255;font-size:11px;line-height:1.4}
.i2-meta{text-align:right;min-width:240px}
.i2-title-wrap{display:flex;flex-direction:column;align-items:flex-end;margin-bottom:6px}
.i2-title{font-size:22px;font-weight:800;letter-spacing:.05em;color:#1B3A6B;text-transform:uppercase;line-height:1.1}
.i2-title-bn{font-size:11.5px;color:#7A7062;font-weight:600;margin-top:2px}
.i2-status-pill{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin-top:4px}
.i2-status-paid{background:#dcfce7;color:#15803d;border:1px solid #bbf7d0}
.i2-status-partial{background:#fef3c7;color:#b45309;border:1px solid #fde68a}
.i2-status-due{background:#fee2e2;color:#b91c1c;border:1px solid #fecaca}
.i2-meta table{margin-left:auto;margin-top:6px;border-collapse:collapse}
.i2-meta td{padding:2px 0 2px 14px;font-size:12px}
.i2-meta td:first-child{color:#7A7062;font-weight:500}
.i2-meta td:last-child{font-weight:700;color:#0f172a;text-align:right}
.i2-bill-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:18px 0}
.i2-card{background:#FFFFFF;border:1px solid #E8E2D8;border-radius:8px;padding:12px 14px;box-shadow:0 1px 3px rgba(50,40,25,0.03)}
.i2-card-head{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7A7062;margin-bottom:6px;display:flex;align-items:center;gap:6px;border-bottom:1px solid #EFEAE2;padding-bottom:4px}
.i2-cust-name{font-size:15px;font-weight:700;color:#0f172a}
.i2-cust-meta{color:#554C41;font-size:11.5px;margin-top:2px}
.i2-standing-row{display:flex;justify-content:space-between;font-size:11.5px;padding:2px 0}
.i2-standing-row span{color:#7A7062}
.i2-standing-row b{font-weight:600;color:#0f172a}
.i2-t{width:100%;border-collapse:collapse;margin-top:8px;border:1px solid #DFD7CC}
.i2-t th{background:#1B3A6B;color:#fff;text-align:left;padding:9px 12px;font-size:11.5px;font-weight:700;letter-spacing:.03em;border:1px solid #1B3A6B}
.i2-t td{padding:9px 12px;border:1px solid #E8E2D8;vertical-align:middle;font-size:12px}
.i2-t tbody tr:nth-child(even){background:#F4EFEB}
.i2-t .r{text-align:right}
.i2-sku-tag{display:inline-block;background:#EAE3D8;color:#554C41;font-size:10px;font-weight:600;padding:1px 6px;border-radius:4px;margin-left:6px}
.i2-sum-wrap{display:flex;justify-content:space-between;gap:24px;margin-top:16px}
.i2-sum-left{flex:1;display:flex;flex-direction:column;gap:12px}
.i2-pastdue-advisory{background:#FFF9ED;border:1px solid #FDE4AA;border-left:4px solid #F59E0B;border-radius:6px;padding:10px 12px;font-size:11.5px;color:#92400e}
.i2-pastdue-advisory b{color:#78350f}
.i2-pay-info{background:#FDFBF7;border:1px solid #DFD7CC;border-radius:6px;padding:10px 12px;font-size:11px;color:#554C41}
.i2-pay-info b{color:#0f172a}
.i2-terms{font-size:11px;color:#7A7062;line-height:1.45}
.i2-terms b{color:#0f172a;display:block;margin-bottom:2px}
.i2-tot-table{width:320px;border-collapse:collapse;background:#FDFBF7;border:1px solid #DFD7CC;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(50,40,25,0.05)}
.i2-tot-table td{padding:6px 14px;font-size:12px;border-bottom:1px solid #F0E9DF}
.i2-tot-table td:last-child{text-align:right;font-weight:600;color:#0f172a}
.i2-tot-table .row-current-bill td{background:#F5EFE6;font-weight:700;color:#0f172a;border-top:1px solid #DFD7CC}
.i2-tot-table .row-past-due td{background:#FFF1F2;color:#be123c;font-weight:700}
.i2-tot-table .row-total-payable td{background:#F3ECE2;border-top:2px solid #0E9F9A;border-bottom:2px solid #0E9F9A;padding:8px 14px;font-size:14px;font-weight:800;color:#0f766e}
.i2-tot-table .row-paid td{color:#15803d;font-weight:700}
.i2-tot-table .row-closing-due td{background:#F8F3EC;border-top:2px solid #1B3A6B;padding:9px 14px;font-size:15px;font-weight:800;color:#1B3A6B}
.i2-signatures{display:grid;grid-template-columns:1fr 1fr 1fr;align-items:flex-end;margin-top:48px;gap:20px;padding:0 10px}
.i2-sig-box{text-align:center}
.i2-sig-line{border-top:1px solid #A89E90;padding-top:6px;font-size:11px;font-weight:600;color:#554C41}
.i2-seal-box{text-align:center;padding:4px}
.i2-seal-stamp{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;width:86px;height:86px;border-radius:50%;border:2px dashed #0E9F9A;color:#0E9F9A;font-size:9px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;transform:rotate(-5deg);background:rgba(14,159,154,0.04)}
.i2-seal-stamp i{font-size:20px;margin-bottom:2px}
.i2-foot{margin-top:24px;padding-top:10px;border-top:1px solid #E6DFD5;color:#7A7062;font-size:10.5px;text-align:center;display:flex;justify-content:space-between;align-items:center}
@page{size:A4 portrait;margin:10mm 12mm}
@media print{
  body{margin:0!important;background:#fff!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
  .inv2{width:100%!important;max-width:100%!important;min-height:auto!important;background:#FAF7F2!important;box-shadow:none!important;border-radius:0!important;padding:18px 22px!important;border-top:6px solid #1B3A6B!important;page-break-inside:avoid!important;page-break-after:auto!important}
  .i2-t tbody tr:nth-child(even){background:#F4EFEB!important}
  .i2-tot-table,.i2-signatures{page-break-inside:avoid!important}
}`;

const existingInvCss = document.getElementById('inv-css');
if (existingInvCss) {
  existingInvCss.textContent = INV_CSS;
} else {
  document.head.insertAdjacentHTML('beforeend','<style id="inv-css">'+INV_CSS+'</style>');
}

function paper(i,mode){
  const f = F || (window.UI && window.UI.F && window.UI.F());
  const{t,L,D,tk,kg,n}=f,S=(U&&U.ST)||(window.UI&&window.UI.ST)||{co:{},inv:{}},co=S.co||{},iv=S.inv||{},isDraft=i==='draft';
  let v,c,ls,sub,disc,carry,vat,currentBill,prevDue,totalPayable,paid,closingDue,status,challanNo,invNo,dateStr,method;

  if (isDraft) {
    const IV = window.UI?.IV || (typeof F !== 'undefined' && F.IV);
    const T = (window.UI?.tot ? window.UI.tot() : (typeof tot === 'function' ? tot() : { sub: 0, da: 0, v: 0, g: 0, prevDue: 0, totalPayable: 0, paid: 0, due: 0, closingDue: 0 }));
    c = D.customers[IV.c];
    ls = IV.lines.map(l => ({
      p: l.p,
      q: l.q,
      pr: l.pr ?? D.products[l.p].price
    }));
    sub = T.sub;
    disc = T.da;
    carry = IV.carry || 0;
    vat = T.v;
    currentBill = T.g;
    prevDue = T.prevDue;
    totalPayable = T.totalPayable;
    paid = T.paid;
    closingDue = T.closingDue;
    status = closingDue <= 0 ? 'paid' : (paid > 0 ? 'partial' : 'due');
    challanNo = IV.challan || ('CH-' + (IV.no - 780));
    invNo = 'INV-2026-' + IV.no;
    dateStr = new Date().toLocaleDateString(loc(), { day: 'numeric', month: 'short', year: 'numeric' });
    method = IV.method;
  } else {
    v = D.invoices[i];
    c = D.customers[v[1]];
    ls = lines(v);
    sub = v.subtotal !== undefined ? v.subtotal : sum(ls.map(l => l.q * l.pr));
    disc = v.discount !== undefined ? v.discount : 0;
    carry = v.carry !== undefined ? v.carry : 0;
    vat = v.vat !== undefined ? v.vat : 0;
    currentBill = v[2];
    prevDue = v.prevDue !== undefined ? v.prevDue : 0;
    totalPayable = v.totalPayable !== undefined ? v.totalPayable : (currentBill + prevDue);
    paid = v[3];
    closingDue = v.closingDue !== undefined ? v.closingDue : Math.max(0, totalPayable - paid);
    status = closingDue <= 0 ? 'paid' : (paid > 0 ? 'partial' : 'due');
    challanNo = v.challan || '—';
    invNo = v[0];
    dateStr = dt(i, v);
    method = v[7];
  }

  const vatEnabled = window.FIN ? window.FIN.isVatOn() : false;
  const hasVat = vatEnabled && vat > 0;
  const vatPctShow = isDraft ? (window.UI?.IV?.vat ?? 0) : (v?.vatPct || 5);
  const statusClass = status === 'paid' ? 'i2-status-paid' : status === 'partial' ? 'i2-status-partial' : 'i2-status-due';
  const statusLabel = status === 'paid' ? (t('paid') || 'PAID') : status === 'partial' ? (t('partial') || 'PARTIAL') : (t('due') || 'DUE');
  const bObj = (typeof B !== 'undefined' ? B : (window.B || {}));

  return `
    <div class="inv2">
      <!-- Corporate Header -->
      <div class="i2-head">
        <div class="i2-co">
          ${iv.logo && bObj.logo ? `<img class="i2-logo" src="${bObj.logo}" alt="Logo">` : `<div class="i2-logo-placeholder">UF</div>`}
          <div>
            <b>${co.name || 'Ultra Fast Packaging & Plastics'}</b>
            <span>${bObj.tag || 'Industrial Packaging Solutions'}</span>
            <small><i class="bi bi-geo-alt me-1"></i>${co.addr || 'Plot #14, Road #03, Tejgaon I/A, Dhaka-1208'}</small>
            <small><i class="bi bi-telephone me-1"></i>${co.ph || '+880 1711-000000'} · <i class="bi bi-envelope me-1"></i>${co.em || 'sales@ultrafast.com.bd'}</small>
          </div>
        </div>
        <div class="i2-meta">
          <div class="i2-title-wrap">
            <div class="i2-title">${t('inv_no') || 'INVOICE'}</div>
            <div class="i2-title-bn">চালান ও বিল</div>
            <span class="i2-status-pill ${statusClass}">${statusLabel}</span>
          </div>
          <table>
            <tr><td>${t('inv_no') || 'Invoice No'}:</td><td><b>${invNo}</b></td></tr>
            <tr><td>${t('challan_no') || 'Challan No'}:</td><td><b class="text-primary"><i class="bi bi-truck me-1"></i>${challanNo}</b></td></tr>
            <tr><td>${t('date') || 'Date'}:</td><td>${dateStr}</td></tr>
            <tr><td>${t('method') || 'Payment'}:</td><td>${t(method) || method || 'Credit'}</td></tr>
          </table>
        </div>
      </div>

      <!-- Bill To & Account Standing Grid -->
      <div class="i2-bill-grid">
        <div class="i2-card">
          <div class="i2-card-head"><i class="bi bi-person-badge"></i>${t('billed_to') || 'Billed To'} / ক্রেতার বিবরণ</div>
          <div class="i2-cust-name">${L(c)}</div>
          <div class="i2-cust-meta"><i class="bi bi-telephone me-1"></i>${c.phone || '—'}</div>
          <div class="i2-cust-meta"><i class="bi bi-geo-alt me-1"></i>${c.address || c.addr || 'Dhaka, Bangladesh'}</div>
          <div class="i2-cust-meta mt-1"><span class="badge bg-secondary-subtle text-secondary border">Credit Limit: ${tk(c.limit || 0)}</span></div>
        </div>
        <div class="i2-card">
          <div class="i2-card-head"><i class="bi bi-wallet2"></i>${t('account_statement') || 'Account Standing'} / হিসাব বিবরণী</div>
          <div class="i2-standing-row"><span>Opening Balance (পূর্বের বকেয়া):</span> <b class="${prevDue > 0 ? 'text-danger' : ''}">${tk(prevDue)}</b></div>
          <div class="i2-standing-row"><span>Current Bill (চলতি চালান):</span> <b>${tk(currentBill)}</b></div>
          <div class="i2-standing-row"><span>Total Payable (সর্বমোট প্রদেয়):</span> <b class="text-primary">${tk(totalPayable)}</b></div>
          <div class="i2-standing-row" style="border-top:1px dashed #cbd5e1;padding-top:4px;margin-top:2px">
            <span>Closing Due (বর্তমান মোট বকেয়া):</span> <b class="${closingDue > 0 ? 'text-danger' : 'text-success'}">${tk(closingDue)}</b>
          </div>
        </div>
      </div>

      <!-- Line Items Table -->
      <table class="i2-t">
        <thead>
          <tr>
            <th style="width:40px" class="text-center">#</th>
            <th>${t('item') || 'Item Description'}</th>
            <th class="r" style="width:110px">${t('qty_kg') || 'Qty (KG)'}</th>
            <th class="r" style="width:110px">${t('rate') || 'Rate (৳)'}</th>
            <th class="r" style="width:130px">${t('amount') || 'Amount (৳)'}</th>
          </tr>
        </thead>
        <tbody>
          ${ls.map((l, k) => `
            <tr>
              <td class="text-center text-muted fw-bold">${n(k + 1)}</td>
              <td>
                <b>${L(D.products[l.p].n)}</b>
                <span class="i2-sku-tag">${D.products[l.p].sku || 'SKU'}</span>
              </td>
              <td class="r">${kg(l.q)}</td>
              <td class="r">${tk(l.pr)}</td>
              <td class="r fw-bold">${tk(l.q * l.pr)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Financial Breakdown & Past Due Calculation -->
      <div class="i2-sum-wrap">
        <div class="i2-sum-left">
          ${prevDue > 0 ? `
            <div class="i2-pastdue-advisory">
              <div class="fw-bold mb-1"><i class="bi bi-clock-history me-1"></i>${t('past_due') || 'Previous Due'} Included</div>
              <div>${t('prev_balance_note') || 'Previous outstanding balance of ' + tk(prevDue) + ' has been carried forward into this invoice.'}</div>
            </div>
          ` : ''}

          <div class="i2-pay-info">
            <div class="fw-bold text-dark mb-1"><i class="bi bi-bank me-1"></i>Payment Channels</div>
            <div>Bank: <b>Dutch-Bangla Bank Ltd</b> · A/C: 115-120-009284</div>
            <div>bKash Merchant: <b>01712-349811</b> (Counter 1)</div>
          </div>

          <div class="i2-terms">
            <b>${t('terms') || 'Terms & Conditions'}:</b>
            ${iv.terms || '1. Goods once sold are not returnable without prior inspection. 2. Please settle remaining dues within stipulated credit terms.'}
          </div>
        </div>

        <div>
          <table class="i2-tot-table">
            <tr>
              <td>${t('subtotal') || 'Subtotal'}</td>
              <td>${tk(sub)}</td>
            </tr>
            ${disc > 0 ? `
              <tr>
                <td>${t('discount') || 'Discount'}</td>
                <td class="text-danger">− ${tk(disc)}</td>
              </tr>
            ` : ''}
            ${hasVat ? `<tr><td>${t('vat') || 'VAT'} (${vatPctShow}%)</td><td>+ ${tk(vat)}</td></tr>` : ''}
            ${carry > 0 ? `
              <tr>
                <td>${t('carry') || 'Carrying Cost'}</td>
                <td>+ ${tk(carry)}</td>
              </tr>
            ` : ''}
            <tr class="row-current-bill">
              <td>${t('current_bill') || 'Current Invoice Total'}</td>
              <td>${tk(currentBill)}</td>
            </tr>
            ${prevDue > 0 ? `
            <tr class="row-past-due">
              <td>${t('past_due') || 'Previous Due / Balance'}</td>
              <td>+ ${tk(prevDue)}</td>
            </tr>
            <tr class="row-total-payable">
              <td>${t('total_payable') || 'Total Amount Payable'}</td>
              <td>${tk(totalPayable)}</td>
            </tr>` : ''}
            <tr class="row-paid">
              <td>${t('paid') || 'Amount Paid Today'}</td>
              <td>− ${tk(paid)}</td>
            </tr>
            <tr class="row-closing-due">
              <td>${t('net_closing_due') || 'Net Closing Due'}</td>
              <td>${tk(closingDue)}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Signatures & Verification Seal -->
      <div class="i2-signatures">
        <div class="i2-sig-box">
          <div class="i2-sig-line">${t('sign_cust') || 'Customer Received'}</div>
        </div>
        <div class="i2-seal-box">
          <div class="i2-seal-stamp">
            <i class="bi bi-patch-check-fill"></i>
            <span>ULTRA FAST</span>
            <small style="font-size:7px">VERIFIED SEAL</small>
          </div>
        </div>
        <div class="i2-sig-box">
          <div class="i2-sig-line">${t('sign_auth') || 'Authorized Signature'}</div>
        </div>
      </div>

      <!-- Footer Bar -->
      <div class="i2-foot">
        <div>${iv.foot || 'Ultra Fast Plastics & Packaging ERP · Computer Generated Invoice'}</div>
        <div>Page 1 of 1</div>
      </div>
    </div>
  `;
}
U.paper=paper;

U.printDoc=(html,title)=>{
  const f=document.createElement('iframe');
  f.setAttribute('aria-hidden','true');
  f.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.append(f);
  const d=f.contentWindow.document;
  d.open();
  d.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title||''}</title><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet"><style>body{margin:0}${INV_CSS}</style></head><body>${html}</body></html>`);
  d.close();
  setTimeout(()=>{
    try{ f.contentWindow.focus(); f.contentWindow.print(); } catch(e){}
    setTimeout(()=>f.remove(),3000);
  },600);
};

const fit=()=>{
  const i=$('.inv-fit');
  if(i&&!i.querySelector('.th')){
    const w=$('#mb').clientWidth-2;
    i.style.zoom=Math.min(1,w/794);
  }
};

U.showDoc=(title,html,printHtml,small)=>{
  const f = F || (window.UI && window.UI.F && window.UI.F());
  const t = f && f.t ? f.t : (k => k);
  if ($('#mt')) $('#mt').textContent=title;
  if ($('#mb')) $('#mb').innerHTML=`<div class="inv-wrap"><div class="inv-fit">${html}</div></div>`;
  if ($('#mf')) $('#mf').innerHTML=`<button class="btn-o" data-bs-dismiss="modal">${t('cancel')}</button>${printHtml?`<button class="btn-a" id="dprint"><i class="bi bi-printer"></i>${t('print')}</button>`:''}`;
  const el=$('#modal');
  if (el) {
    const d=$('.modal-dialog',el);
    if (d) d.classList.add(small?'modal-sm':'modal-lg');
    el.addEventListener('hidden.bs.modal',()=>d&&d.classList.remove('modal-lg','modal-sm'),{once:true});
    if(printHtml&&$('#dprint'))$('#dprint').onclick=()=>U.printDoc(printHtml,title);
    el.addEventListener('shown.bs.modal',fit,{once:true});
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      bootstrap.Modal.getOrCreateInstance(el).show();
    }
  }
  setTimeout(fit,350);
};

function show(title,html){
  $('#mt').textContent=title;
  $('#mb').innerHTML=html;
  $('#mf').innerHTML=`<button class="btn-o" data-bs-dismiss="modal">${F.t('cancel')}</button>`;
  bootstrap.Modal.getOrCreateInstance('#modal').show();
}

// 1-Click Open Customer Invoices method
U.openCustomerInvoices = (custIdx) => {
  SV = 'list';
  IVS.cust = String(custIdx);
  IVS.status = 'all';
  IVS.q = '';
  if (typeof cur === 'function' && cur() === 'sales') {
    list();
  } else {
    location.hash = '#/sales';
    setTimeout(list, 50);
  }
};

/* =========================================================
   1. CUSTOMER-WISE INVOICE LIST & FILTER ENGINE (Req 1)
   ========================================================= */
function filterInvoices() {
  const D = F.D;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yestStart = todayStart - 86400000;
  const weekStart = todayStart - 7 * 86400000;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const lastMonthEnd = monthStart - 1;

  return D.invoices.map((v, i) => ({ v, i })).filter(({ v, i }) => {
    // 1. Customer filter
    if (IVS.cust !== 'all' && v[1] !== +IVS.cust) return false;

    // 2. Status filter (paid, partial, due/unpaid)
    if (IVS.status !== 'all') {
      if (IVS.status === 'due' && v[4] !== 'due') return false;
      if (IVS.status === 'partial' && v[4] !== 'partial') return false;
      if (IVS.status === 'paid' && v[4] !== 'paid') return false;
    }

    // 3. Search query (invoice number, customer name, or challan number)
    if (IVS.q) {
      const q = IVS.q.toLowerCase().trim();
      const cust = D.customers[v[1]];
      const custStr = cust ? (cust.bn + ' ' + cust.en + ' ' + (cust.phone || '')).toLowerCase() : '';
      const invStr = (v[0] || '').toLowerCase();
      const challanStr = (v.challan || '').toLowerCase();
      if (!custStr.includes(q) && !invStr.includes(q) && !challanStr.includes(q)) return false;
    }

    // 4. Date filtering
    const ts = v.createdTs || (new Date(2026, 9, 28 - i).getTime());
    if (IVS.range === 'today') {
      if (ts < todayStart) return false;
    } else if (IVS.range === 'yesterday') {
      if (ts < yestStart || ts >= todayStart) return false;
    } else if (IVS.range === 'last7d') {
      if (ts < weekStart) return false;
    } else if (IVS.range === 'this_month') {
      if (ts < monthStart) return false;
    } else if (IVS.range === 'last_month') {
      if (ts < lastMonthStart || ts > lastMonthEnd) return false;
    } else if (IVS.range === 'custom') {
      if (IVS.df) {
        const fromTs = new Date(IVS.df).setHours(0,0,0,0);
        if (ts < fromTs) return false;
      }
      if (IVS.dt) {
        const toTs = new Date(IVS.dt).setHours(23,59,59,999);
        if (ts > toTs) return false;
      }
    }
    return true;
  });
}

function list(){
  const { t, L, D, tk, short, n, panel } = F;
  const filtered = filterInvoices();

  const totAmt = sum(filtered.map(x => x.v[2]));
  const totPaid = sum(filtered.map(x => x.v[3]));
  const totDue = sum(filtered.map(x => x.v[2] - x.v[3]));

  // Customer dropdown options
  const custOptions = [['all', t('all_customers')], ...D.customers.map((c, idx) => [idx, L(c)])];

  // Specific Customer Header Banner (if filtered to one customer)
  let custBanner = '';
  if (IVS.cust !== 'all') {
    const c = D.customers[+IVS.cust];
    if (c) {
      const custTotalInvoiced = sum(D.invoices.filter(v => v[1] === +IVS.cust).map(v => v[2]));
      const custTotalPaid = sum(D.invoices.filter(v => v[1] === +IVS.cust).map(v => v[3]));
      const custInvs = D.invoices.filter(v => v[1] === +IVS.cust).length;
      custBanner = `
        <div class="card mb-3 border border-primary-subtle shadow-sm" style="background:var(--surface-2)">
          <div class="card-body p-3">
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <span class="badge bg-primary me-2"><i class="bi bi-person-fill"></i> ${t('customer')}</span>
                <b class="fs-5 text-primary">${L(c)}</b>
                <span class="text-secondary ms-2"><i class="bi bi-telephone"></i> ${c.phone || '—'}</span>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-secondary" data-act="ivscustclear"><i class="bi bi-x-circle me-1"></i>${t('all_customers')}</button>
                <button class="btn btn-sm btn-primary" data-act="inewfor" data-i="${IVS.cust}"><i class="bi bi-plus-lg me-1"></i>${t('new_invoice')}</button>
              </div>
            </div>
            <div class="row g-2 mt-2 pt-2 border-top">
              <div class="col-sm-3 col-6"><small class="text-secondary d-block">${t('total_invoices')}</small><b class="fs-6">${n(custInvs)}</b></div>
              <div class="col-sm-3 col-6"><small class="text-secondary d-block">${t('total_amount')}</small><b class="fs-6">${tk(custTotalInvoiced)}</b></div>
              <div class="col-sm-3 col-6"><small class="text-secondary d-block">${t('total_paid')}</small><b class="fs-6 up">${tk(custTotalPaid)}</b></div>
              <div class="col-sm-3 col-6"><small class="text-secondary d-block">${t('due_amt')}</small><b class="fs-6 dn">${tk(c.due)}</b></div>
            </div>
          </div>
        </div>`;
    }
  }

  // Filter toolbar
  const filterToolbar = `
    <div class="card mb-3 border shadow-sm">
      <div class="card-body p-3">
        <div class="row g-2 align-items-center">
          <div class="col-md-3 col-sm-6">
            <label class="form-label small fw-semibold text-secondary mb-1">${t('customer')}</label>
            <select class="form-select form-select-sm" data-in="ivscust">
              ${opts(custOptions, IVS.cust)}
            </select>
          </div>
          <div class="col-md-2 col-sm-6">
            <label class="form-label small fw-semibold text-secondary mb-1">${t('status')}</label>
            <select class="form-select form-select-sm" data-in="ivsstatus">
              ${opts([
                ['all', t('all')],
                ['paid', t('inv_status_paid')],
                ['partial', t('inv_status_partial')],
                ['due', t('inv_status_due')]
              ], IVS.status)}
            </select>
          </div>
          <div class="col-md-3 col-sm-6">
            <label class="form-label small fw-semibold text-secondary mb-1">${t('date')}</label>
            <select class="form-select form-select-sm" data-in="ivsrange">
              ${opts([
                ['all', t('all')],
                ['today', t('today')],
                ['yesterday', t('yesterday')],
                ['last7d', t('last7d')],
                ['this_month', t('this_month')],
                ['last_month', t('last_month')],
                ['custom', t('custom_range')]
              ], IVS.range)}
            </select>
          </div>
          <div class="col-md-4 col-sm-6">
            <label class="form-label small fw-semibold text-secondary mb-1">${t('search')}</label>
            <div class="input-group input-group-sm">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control" data-in="ivsq" value="${IVS.q}" placeholder="${t('search_inv_ph')}" aria-label="Search invoices">
              ${(IVS.cust!=='all'||IVS.status!=='all'||IVS.range!=='all'||IVS.q||IVS.df||IVS.dt)?`<button class="btn btn-outline-secondary" data-act="ivsreset" title="${t('reset_filter')}"><i class="bi bi-arrow-counterclockwise"></i></button>`:''}
            </div>
          </div>
          ${IVS.range === 'custom' ? `
            <div class="col-12 pt-2 border-top mt-2">
              <div class="d-flex flex-wrap align-items-center gap-2">
                <span class="small fw-semibold text-secondary">${t('custom_range')}:</span>
                <input type="date" class="form-control form-control-sm w-auto" data-in="ivsdf" value="${IVS.df}">
                <span class="small text-secondary">—</span>
                <input type="date" class="form-control form-control-sm w-auto" data-in="ivsdt" value="${IVS.dt}">
              </div>
            </div>` : ''}
        </div>
      </div>
    </div>`;

  // Summary strip
  const summaryStrip = `
    <div class="strip mb-3">
      <div><span>${t('invoices')}</span><b class="text-primary">${n(filtered.length)}</b></div>
      <div><span>${t('total_amount')}</span><b>${short(totAmt)}</b></div>
      <div><span>${t('paid')}</span><b class="up">${short(totPaid)}</b></div>
      <div><span>${t('due_amt')}</span><b class="dn">${short(totDue)}</b></div>
    </div>`;

  // Status badge helper
  const statusBadge = (s) => {
    if (s === 'paid') return `<span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">${t('inv_status_paid')}</span>`;
    if (s === 'partial') return `<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1">${t('inv_status_partial')}</span>`;
    return `<span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">${t('inv_status_due')}</span>`;
  };

  const canED = window.FIN ? window.FIN.canEditDel(F) : F.A();

  // Mobile cards + Desktop Table rows
  const mobileCards = `
    <div class="d-md-none p-2">
      ${filtered.length ? filtered.map(({ v, i }) => {
        const cust = D.customers[v[1]];
        const due = Math.max(0, v[2] - v[3]);
        return `
          <div class="mob-tx-card mb-2 p-3">
            <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
              <div>
                <a href="javascript:void(0)" class="fw-bold text-primary text-decoration-none fs-6" data-act="idetail" data-i="${i}">${v[0]}</a>
                <div class="small text-secondary"><i class="bi bi-truck me-1"></i>${v.challan || '—'} · ${dt(i, v)}</div>
              </div>
              <div>${statusBadge(v[4])}</div>
            </div>
            <div class="fw-semibold mb-2">
              <a href="javascript:void(0)" class="text-decoration-none text-body" data-act="ivscustset" data-i="${v[1]}">${cust ? L(cust) : '—'}</a>
              ${cust?.phone ? `<small class="text-secondary d-block"><i class="bi bi-telephone me-1"></i>${cust.phone}</small>` : ''}
            </div>
            <div class="d-flex justify-content-between text-center p-2 rounded border mb-2" style="background:var(--surface-2)">
              <div class="flex-fill"><small class="text-secondary d-block">${t('amount')}</small><b>${tk(v[2])}</b></div>
              <div class="vr mx-1"></div>
              <div class="flex-fill"><small class="text-secondary d-block">${t('paid')}</small><b class="up">${tk(v[3])}</b></div>
              <div class="vr mx-1"></div>
              <div class="flex-fill"><small class="text-secondary d-block">${t('due_amt')}</small><b class="${due > 0 ? 'dn' : 'up'}">${tk(due)}</b></div>
            </div>
            <div class="d-flex flex-wrap gap-1 pt-2 border-top">
              <button class="btn btn-sm btn-outline-primary flex-fill" data-act="idetail" data-i="${i}"><i class="bi bi-eye me-1"></i>${t('inv_detail')}</button>
              ${due > 0 ? `<button class="btn btn-sm btn-success flex-fill" data-act="payadd" data-i="${i}"><i class="bi bi-cash-coin me-1"></i>${t('pay_now')}</button>` : ''}
              <button class="btn btn-sm btn-outline-secondary" data-act="ipr" data-m="a4" data-i="${i}" title="${t('print_a4')}"><i class="bi bi-file-earmark-text"></i></button>
              <button class="btn btn-sm btn-outline-success" data-act="ipr" data-m="wa" data-i="${i}" title="${t('wa_share')}"><i class="bi bi-whatsapp"></i></button>
              ${canED ? `
                <button class="btn btn-sm btn-outline-secondary" data-act="iedit" data-i="${i}" title="${t('edit_invoice')}"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" data-act="idel" data-i="${i}" title="${t('delete_invoice')}"><i class="bi bi-trash3"></i></button>
              ` : ''}
            </div>
          </div>`;
      }).join('') : `<div class="text-center text-secondary py-4">${t('empty')}</div>`}
    </div>`;

  const tableRows = filtered.map(({ v, i }) => {
    const cust = D.customers[v[1]];
    const due = Math.max(0, v[2] - v[3]);
    const paymentsCount = (v.payments && v.payments.filter(p=>p.status==='posted').length) || (v[3]>0?1:0);
    return `
      <tr>
        <td>
          <div class="d-flex align-items-center gap-1 flex-wrap">
            <a href="javascript:void(0)" class="fw-bold text-decoration-none" data-act="idetail" data-i="${i}" title="${t('inv_detail')}">
              <i class="bi bi-receipt me-1 text-primary"></i>${v[0]}
            </a>
            <span class="badge bg-secondary-subtle text-body border"><i class="bi bi-truck me-1"></i>${v.challan || '—'}</span>
          </div>
          <small class="text-secondary">${dt(i, v)}</small>
        </td>
        <td>
          <a href="javascript:void(0)" class="text-decoration-none text-body" data-act="ivscustset" data-i="${v[1]}" title="${t('view_invoices')}">
            <b>${cust ? L(cust) : '—'}</b>
          </a>
          <br><small class="text-secondary">${cust?.phone || ''}</small>
        </td>
        <td class="r fw-semibold">${tk(v[2])}</td>
        <td class="r up">${tk(v[3])} <br><small class="text-secondary">(${n(paymentsCount)} ${t('payments')})</small></td>
        <td class="r ${due > 0 ? 'dn fw-bold' : ''}">${tk(due)}</td>
        <td>${statusBadge(v[4])}</td>
        <td class="r text-nowrap">
          <button class="btn btn-sm btn-outline-primary py-1 px-2" data-act="idetail" data-i="${i}" title="${t('inv_detail')}">
            <i class="bi bi-eye"></i>
          </button>
          ${canED ? `
          <button class="btn btn-sm btn-outline-secondary py-1 px-2 ms-1" data-act="iedit" data-i="${i}" title="${t('edit_invoice')}">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger py-1 px-2 ms-1" data-act="idel" data-i="${i}" title="${t('delete_invoice')}">
            <i class="bi bi-trash3"></i>
          </button>` : ''}
          ${due > 0 ? `
            <button class="btn btn-sm btn-success py-1 px-2 ms-1" data-act="payadd" data-i="${i}" title="${t('add_payment')}">
              <i class="bi bi-cash-coin me-1"></i>${t('pay_now')}
            </button>` : ''}
          <div class="btn-group btn-group-sm ms-1">
            <button class="btn btn-outline-secondary py-1" data-act="ipr" data-m="a4" data-i="${i}" title="${t('print_a4')}"><i class="bi bi-file-earmark-text me-1"></i>A4</button>
            <button class="btn btn-outline-success py-1" data-act="ipr" data-m="wa" data-i="${i}" title="${t('wa_share')}"><i class="bi bi-whatsapp"></i></button>
          </div>
        </td>
      </tr>`;
  }).join('');

  $('#view').innerHTML = `
    <div class="enter">
      <div class="page-h d-flex justify-content-between align-items-center flex-wrap gap-2 gap-sm-3">
        <div class="d-flex align-items-center gap-2 gap-sm-3 flex-wrap">
          <button class="btn-a" data-act="inew"><i class="bi bi-plus-lg me-1"></i>${t('new_invoice')}</button>
          <div>
            <h2 class="mb-0">${t('nav_sales')}</h2>
            <small class="text-secondary">${t('inv_list')}</small>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button class="btn-o" data-act="rprint" title="${t('print')}"><i class="bi bi-printer me-1"></i>${t('print')}</button>
        </div>
      </div>
      ${custBanner}
      ${filterToolbar}
      ${summaryStrip}
      ${panel('', mobileCards + `
        <div class="d-none d-md-block tw">
          <table class="tbl" id="inv-table">
            <thead>
              <tr>
                <th>${t('inv_no')} / ${t('date')}</th>
                <th>${t('customer')}</th>
                <th class="r">${t('amount')}</th>
                <th class="r">${t('paid')}</th>
                <th class="r">${t('due_amt')}</th>
                <th>${t('status')}</th>
                <th class="r">${t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows.length ? tableRows : `<tr><td colspan="7" class="text-center text-secondary py-4">${t('empty')}</td></tr>`}
            </tbody>
          </table>
        </div>`)}
    </div>`;
}

P.sales = f => {
  I(f);
  if(window.WANT_NEW){
    if(U.resetIV) U.resetIV(window.WANT_NEW_CUST);
    SV='new';
    window.WANT_NEW=false;
    window.WANT_NEW_CUST=undefined;
  }
  if(SV==='new'){
    orig(f);
    const b=$('#view .page-h button');
    b&&(b.outerHTML=`<button class="btn-o" data-act="ilist"><i class="bi bi-arrow-left"></i>${f.t('inv_list')}</button>`);
  } else {
    list();
  }
};

addEventListener('hashchange',()=>{SV='list'});
ACT.inew=()=>{if(U.resetIV)U.resetIV();SV='new';P.sales(F)};
ACT.ilist=()=>{SV='list';P.sales(F)};
U.salesList=()=>{SV='list';if(F)list()};
ACT.doprint=()=>window.print();

ACT.inewfor = (x) => {
  const ci = +x.dataset.i;
  if(U.resetIV) U.resetIV(ci);
  SV = 'new';
  window.WANT_NEW_CUST = ci;
  P.sales(F);
};

/* Filter event handlers */
IN.ivscust = x => { IVS.cust = x.value; list(); };
IN.ivsstatus = x => { IVS.status = x.value; list(); };
IN.ivsq = x => { IVS.q = x.value; list(); };
IN.ivsrange = x => { IVS.range = x.value; list(); };
IN.ivsdf = x => { IVS.df = x.value; list(); };
IN.ivsdt = x => { IVS.dt = x.value; list(); };
ACT.ivscustset = x => { IVS.cust = String(x.dataset.i); list(); };
ACT.ivscustclear = () => { IVS.cust = 'all'; list(); };
ACT.ivsreset = () => {
  IVS.cust = 'all';
  IVS.status = 'all';
  IVS.q = '';
  IVS.range = 'all';
  IVS.df = '';
  IVS.dt = '';
  list();
};

/* =========================================================
   2. INVOICE DETAIL MODAL & PAYMENT HISTORY (Req 1 & Req 2)
   ========================================================= */
ACT.idetail = (x) => {
  const { t, L, D, tk, kg, n } = F;
  const idx = +x.dataset.i;
  const v = D.invoices[idx];
  if (!v) return;
  const c = D.customers[v[1]];
  const ls = lines(v);
  const sub = v.subtotal !== undefined ? v.subtotal : sum(ls.map(l => l.q * l.pr));
  const disc = v.discount || 0;
  const carry = v.carry || 0;
  const vatAmt = v.vat || 0;
  const vatOn = window.FIN ? window.FIN.isVatOn() : false;
  const hasVat = vatOn && vatAmt > 0;
  const due = Math.max(0, v[2] - v[3]);
  const canED = window.FIN ? window.FIN.canEditDel(F) : F.A();
  const payments = v.payments || [];

  const paymentRows = payments.map(p => {
    const isReversed = p.status === 'reversed';
    const isReversalEntry = p.status === 'reversal';
    return `
      <tr class="${isReversed ? 'table-danger opacity-75' : isReversalEntry ? 'table-warning' : ''}">
        <td>
          <b>${p.id}</b>
          ${isReversed ? `<span class="badge bg-danger ms-1">${t('reversed')}</span>` : ''}
          ${isReversalEntry ? `<span class="badge bg-warning text-dark ms-1">${t('counter_entry')}</span>` : ''}
        </td>
        <td>${p.dtStr || dt(0)}</td>
        <td class="r fw-bold ${p.amt < 0 ? 'dn' : 'up'}">${p.amt < 0 ? '−' : ''}${tk(Math.abs(p.amt))}</td>
        <td><span class="badge bg-secondary-subtle text-secondary border">${t(p.m)}</span></td>
        <td><code>${p.ref || '—'}</code></td>
        <td><small>${p.u || '—'}</small></td>
        <td>
          <small>${p.note || '—'}</small>
          ${p.revReason ? `<br><small class="dn"><b>${t('rev_reason')}:</b> ${p.revReason} (${p.revBy || ''})</small>` : ''}
        </td>
        <td class="r text-nowrap">
          ${(!isReversed && !isReversalEntry) ? `
            <button class="btn btn-sm btn-outline-secondary py-0 px-1" data-act="payrec" data-pid="${p.id}" data-i="${idx}" title="${t('print_receipt')}">
              <i class="bi bi-printer"></i>
            </button>
            ${canED ? `<button class="btn btn-sm btn-outline-danger py-0 px-1 ms-1" data-act="payrev" data-pid="${p.id}" data-i="${idx}" title="${t('pay_reverse')}">
              <i class="bi bi-arrow-counterclockwise"></i>
            </button>` : ''}` : ''}
        </td>
      </tr>`;
  }).join('');

  const modalHtml = `
    <div class="invoice-detail-view">
      <!-- Invoice Header Info -->
      <div class="p-3 mb-3 rounded border" style="background:var(--surface-2)">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
          <div>
            <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
              <h4 class="mb-0 text-primary fw-bold"><i class="bi bi-receipt me-2"></i>${v[0]}</h4>
              <span class="badge bg-primary-subtle text-primary border"><i class="bi bi-truck me-1"></i>${t('challan_no')}: <b>${v.challan || '—'}</b></span>
              ${canED ? `<button class="btn btn-sm btn-outline-primary py-0 px-2" data-act="iedit" data-i="${idx}" title="${t('edit')}"><i class="bi bi-pencil me-1"></i>${t('edit')}</button>` : ''}
            </div>
            <span class="text-secondary"><i class="bi bi-calendar3 me-1"></i>${dt(idx, v)}</span>
          </div>
          <div class="text-end">
            <div class="mb-1">
              ${v[4] === 'paid' ? `<span class="badge bg-success fs-6">${t('inv_status_paid')}</span>` :
                v[4] === 'partial' ? `<span class="badge bg-warning text-dark fs-6">${t('inv_status_partial')}</span>` :
                `<span class="badge bg-danger fs-6">${t('inv_status_due')}</span>`}
            </div>
            <small class="text-secondary">${t('method')}: <b>${v[7] ? t(v[7]) : '—'}</b></small>
          </div>
        </div>
        <hr class="my-2">
        <div class="row g-2">
          <div class="col-sm-6">
            <small class="text-secondary d-block">${t('billed_to')}</small>
            <b class="fs-6">${c ? L(c) : '—'}</b>
            <span class="d-block text-secondary small"><i class="bi bi-telephone"></i> ${c?.phone || '—'}</span>
          </div>
          <div class="col-sm-6 text-sm-end">
            <small class="text-secondary d-block">${t('cust_running_due')}</small>
            <b class="fs-6 dn">${tk(c?.due || 0)}</b>
          </div>
        </div>
      </div>

      <!-- Line items table -->
      <h6 class="fw-bold mb-2"><i class="bi bi-box-seam me-2"></i>${t('products')}</h6>
      <div class="tw border rounded mb-3">
        <table class="tbl mb-0">
          <thead>
            <tr>
              <th>#</th>
              <th>${t('item')}</th>
              <th class="r">${t('qty_kg')}</th>
              <th class="r">${t('rate')}</th>
              <th class="r">${t('amount')}</th>
            </tr>
          </thead>
          <tbody>
            ${ls.map((l, k) => `
              <tr>
                <td>${n(k + 1)}</td>
                <td><b>${L(D.products[l.p].n)}</b></td>
                <td class="r">${kg(l.q)}</td>
                <td class="r">${tk(l.pr)}</td>
                <td class="r fw-semibold">${tk(l.q * l.pr)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <!-- Totals Summary Card -->
      <div class="row g-3 mb-4">
        <div class="col-md-6 offset-md-6">
          <div class="card border shadow-sm">
            <div class="card-body p-3">
              <div class="d-flex justify-content-between mb-1">
                <span>${t('subtotal')}</span><b>${tk(sub)}</b>
              </div>
              ${disc > 0 ? `
                <div class="d-flex justify-content-between mb-1 dn">
                  <span>${t('discount')}</span><b>− ${tk(disc)}</b>
                </div>` : ''}
              ${hasVat ? `
                <div class="d-flex justify-content-between mb-1">
                  <span>${t('vat') || 'VAT'} (${v.vatPct || 5}%)</span><b>+ ${tk(vatAmt)}</b>
                </div>` : ''}
              ${carry > 0 ? `
                <div class="d-flex justify-content-between mb-1">
                  <span>${t('carry') || 'Carrying'}</span><b>+ ${tk(carry)}</b>
                </div>` : ''}
              <div class="d-flex justify-content-between mb-1 pt-1 border-top fw-bold text-primary fs-6">
                <span>${t('grand')}</span><span>${tk(v[2])}</span>
              </div>
              <div class="d-flex justify-content-between mb-1 up">
                <span>${t('paid')}</span><b>${tk(v[3])}</b>
              </div>
              <div class="d-flex justify-content-between pt-1 border-top dn fw-bold">
                <span>${t('due_amt')}</span><span>${tk(due)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment History Ledger Section (Requirement 2) -->
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h6 class="fw-bold mb-0"><i class="bi bi-credit-card-2-front me-2"></i>${t('pay_history')}</h6>
        ${due > 0 ? `
          <button class="btn btn-sm btn-success" data-act="payadd" data-i="${idx}">
            <i class="bi bi-plus-lg me-1"></i>${t('add_payment')}
          </button>` : ''}
      </div>
      <div class="tw border rounded mb-2">
        <table class="tbl mb-0">
          <thead>
            <tr>
              <th>${t('pay_id')}</th>
              <th>${t('pay_dt')}</th>
              <th class="r">${t('amount')}</th>
              <th>${t('pay_method')}</th>
              <th>${t('pay_ref')}</th>
              <th>${t('pay_received_by')}</th>
              <th>${t('pay_remarks')}</th>
              <th class="r">${t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${paymentRows.length ? paymentRows : `<tr><td colspan="8" class="text-center text-secondary py-3">${t('empty')}</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>`;

  $('#mt').innerHTML = `<i class="bi bi-receipt text-primary me-2"></i>${t('inv_detail')} – ${v[0]}`;
  $('#mb').innerHTML = modalHtml;
  $('#mf').innerHTML = `
    <div class="d-flex gap-2 me-auto flex-wrap">
      <button class="btn btn-outline-secondary" data-act="ipr" data-m="a4" data-i="${idx}"><i class="bi bi-file-earmark-text me-1"></i>${t('print_a4')}</button>
      <button class="btn btn-outline-success" data-act="ipr" data-m="wa" data-i="${idx}"><i class="bi bi-whatsapp me-1"></i>${t('wa_share')}</button>
    </div>
    ${canED ? `<button class="btn btn-outline-primary" data-act="iedit" data-i="${idx}"><i class="bi bi-pencil me-1"></i>${t('edit_invoice')}</button>
    <button class="btn btn-outline-danger" data-act="idel" data-i="${idx}"><i class="bi bi-trash3 me-1"></i>${t('delete_invoice')}</button>` : ''}
    <button class="btn btn-secondary" data-bs-dismiss="modal">${t('close')}</button>`;

  const el = $('#modal');
  const d = $('.modal-dialog', el);
  d.classList.add('modal-xl');
  el.addEventListener('hidden.bs.modal', () => d.classList.remove('modal-xl'), { once: true });
  bootstrap.Modal.getOrCreateInstance(el).show();
};

ACT.iedit = (x) => {
  if (window.FIN && !window.FIN.canEditDel(F)) {
    F.toast(F.t('no_edit_del_perm') || F.t('admin_only'), 'shield-exclamation');
    return;
  }
  const { D } = F;
  const idx = +x.dataset.i;
  const v = D.invoices[idx];
  if (!v) return;

  try {
    const m = bootstrap.Modal.getInstance(document.querySelector('#modal'));
    if (m) m.hide();
  } catch (_) {}

  if (window.UI && window.UI.IV) {
    const iv = window.UI.IV;
    iv.editingIdx = idx;
    iv.no = parseInt(v[0].replace(/\D/g, '')) || 1185;
    iv.challan = v.challan || '';
    iv.c = v[1];
    iv.lines = JSON.parse(JSON.stringify(v[6] || [{ p: 0, q: 500, pr: null }]));
    const sub = v.subtotal || sum(iv.lines.map(l => l.q * (l.pr || D.products[l.p].price)));
    iv.disc = v.discPct !== undefined ? v.discPct : (v.discount && sub ? Math.round((v.discount / sub) * 1000) / 10 : 0);
    iv.carry = v.carry || 0;
    iv.vat = v.vatPct !== undefined ? v.vatPct : (window.FIN ? window.FIN.getVatPct() : 5);
    iv.mode = v[4] === 'paid' ? 'cash' : (v[4] === 'due' ? 'credit' : 'part');
    iv.paid = v[3];
    iv.extraPrevColl = 0;
    iv.method = v[7] || 'm_cash';
  }

  SV = 'new';
  P.sales(F);
};

ACT.idel = (x) => {
  if (window.FIN && !window.FIN.canEditDel(F)) {
    F.toast(F.t('no_edit_del_perm') || F.t('admin_only'), 'shield-exclamation');
    return;
  }
  const { t, L, D, toast, tk } = F;
  const idx = +x.dataset.i;
  const v = D.invoices[idx];
  if (!v) return;
  const c = D.customers[v[1]];
  const due = Math.max(0, v[2] - v[3]);

  modal(
    t('del_inv_confirm_title'),
    `<div class="p-2">
      <div class="alert alert-warning d-flex align-items-center gap-2 mb-3">
        <i class="bi bi-exclamation-triangle-fill fs-3 text-warning"></i>
        <div>${t('del_inv_confirm_msg')}</div>
      </div>
      <div class="card p-3 border mb-3" style="background:var(--surface-2)">
        <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
          <b class="fs-6 text-primary">${v[0]}</b>
          <span class="badge bg-secondary-subtle text-secondary border"><i class="bi bi-truck me-1"></i>${v.challan || '—'}</span>
        </div>
        <div class="small text-secondary mb-1">${t('customer')}: <b>${c ? L(c) : '—'}</b></div>
        <div class="d-flex justify-content-between small">
          <span>${t('amount')}: <b>${tk(v[2])}</b></span>
          <span>${t('paid')}: <b class="up">${tk(v[3])}</b></span>
          <span>${t('due_amt')}: <b class="dn">${tk(due)}</b></span>
        </div>
      </div>
      <div>
        <label class="form-label small fw-semibold">${t('del_reason') || t('reason') || 'Deletion Reason (Audit Log)'}</label>
        <input type="text" id="del_inv_reason" class="form-control" placeholder="Optional reason for audit trail...">
      </div>
    </div>`,
    () => {
      const reason = ($('#del_inv_reason')?.value || '').trim();
      const delUser = F.S.user ? L(F.S.user.n) : 'Admin';
      const runner = () => {
        const invRef = D.invoices[idx];
        const custIdx = invRef[1];
        const cust = D.customers[custIdx];
        // 1. Restore product stock & log stock movements
        (invRef[6] || []).forEach(l => {
          if (window.FIN) {
            window.FIN.recordStockMove(F, {
              p: l.p, qty: l.q, isIn: true, kind: 'sale_rev',
              ty: t('inv_deleted_stock') || 'Invoice Deleted (Stock Restored)',
              ref: invRef[0], challan: invRef.challan || '',
              party: cust ? L(cust) : 'Customer', partyType: 'customer',
              remarks: `Restored stock on deletion of ${invRef[0]}${reason ? ' (' + reason + ')' : ''}`
            });
          } else if (D.products[l.p]) {
            D.products[l.p].kg += l.q;
            D.products[l.p].sold = Math.max(0, (D.products[l.p].sold || 0) - l.q);
          }
        });

        // 2. Reverse posted payments on Cash/Bank & preserve counter-entries in archive
        let reversedPaid = 0;
        if (invRef.payments && invRef.payments.length) {
          invRef.payments.forEach(p => {
            if (p.status === 'posted' && p.amt > 0) {
              reversedPaid += p.amt;
              if (window.FIN) window.FIN.postCashBank(D, p.m || 'm_cash', -p.amt);
              if (D.cashBank) {
                D.cashBank.cash = Math.max(0, D.cashBank.cash);
                D.cashBank.bank = Math.max(0, D.cashBank.bank);
              }
              p.status = 'reversed';
              p.revReason = 'Invoice deleted' + (reason ? ': ' + reason : '');
              p.revBy = delUser;
              p.revAt = Date.now();
            }
          });
        } else if (invRef[3] > 0) {
          reversedPaid = invRef[3];
          if (window.FIN) window.FIN.postCashBank(D, invRef[7] || 'm_cash', -invRef[3]);
          if (D.cashBank) {
            D.cashBank.cash = Math.max(0, D.cashBank.cash);
            D.cashBank.bank = Math.max(0, D.cashBank.bank);
          }
        }

        // Remove unlinked dueCollections targeting only this deleted invoice
        if (D.dueCollections) {
          D.dueCollections = D.dueCollections.filter(dc => dc.invNo !== invRef[0]);
        }

        // 3. Adjust daily metrics & customer volume
        if (D.daily && D.daily.sales && D.daily.sales.length) {
          const sIdx = D.daily.sales.length - 1;
          D.daily.sales[sIdx] = Math.max(0, D.daily.sales[sIdx] - invRef[2]);
        }
        if (D.daily && D.daily.coll && D.daily.coll.length && reversedPaid > 0) {
          const cIdx = D.daily.coll.length - 1;
          D.daily.coll[cIdx] = Math.max(0, D.daily.coll[cIdx] - reversedPaid);
        }
        if (cust) {
          cust.v = Math.max(0, (cust.v || 0) - invRef[2]);
        }

        // 4. Archive deleted invoice & remove from active list
        if (!D.deletedInvoices) D.deletedInvoices = [];
        D.deletedInvoices.unshift({
          invNo: invRef[0],
          challan: invRef.challan || '',
          custIdx,
          custName: cust ? L(cust) : '—',
          total: invRef[2],
          paidReversed: reversedPaid,
          deletedAt: Date.now(),
          deletedBy: delUser,
          reason,
          snapshot: window.FIN ? window.FIN.deepClone(invRef) : invRef
        });

        D.invoices.splice(idx, 1);

        // 5. Reconcile Customer Due cleanly
        if (window.FIN) {
          window.FIN.reconcileCustomer(custIdx, F);
        } else if (cust) {
          cust.due = Math.max(0, cust.due - due);
        }

        // 6. Immutable Audit Log
        if (typeof LOG !== 'undefined') {
          LOG.add({
            uid: F.S.user?.id,
            u: F.S.user?.n?.bn,
            r: F.S.role,
            m: 'sales',
            t: 'delete',
            recordType: 'invoice',
            recordId: invRef[0],
            reason,
            changes: { total: invRef[2], paidReversed: reversedPaid },
            msg: `ইনভয়েস মুছে ফেলা হয়েছে: ${invRef[0]} (চালান: ${invRef.challan || '—'})${reason ? ' · কারণ: ' + reason : ''}`
          });
        }
      };

      const res = window.FIN ? window.FIN.tx(F, runner) : (runner(), true);
      if (res === false) return false;

      toast(t('inv_deleted_ok'), 'trash3');
      list();
    },
    t('del_inv_btn')
  );
};

/* =========================================================
   3. MULTIPLE PARTIAL PAYMENTS & OVERPAY PREVENTION (Req 2)
   ========================================================= */
ACT.payadd = (x) => {
  const { t, L, D, tk, toast } = F;
  const idx = +x.dataset.i;
  const v = D.invoices[idx];
  if (!v) return;
  const c = D.customers[v[1]];
  const due = v[2] - v[3];
  if (due <= 0) {
    toast(t('overpay_err'), 'exclamation-triangle');
    return;
  }

  const modalContent = `
    <div class="mb-3 p-3 rounded border" style="background:var(--surface-2)">
      <div class="d-flex justify-content-between mb-1">
        <span>${t('inv_no')}:</span><b>${v[0]}</b>
      </div>
      <div class="d-flex justify-content-between mb-1">
        <span>${t('customer')}:</span><b>${L(c)}</b>
      </div>
      <div class="d-flex justify-content-between mb-1">
        <span>${t('grand')}:</span><b>${tk(v[2])}</b>
      </div>
      <div class="d-flex justify-content-between mb-1 up">
        <span>${t('paid')}:</span><b>${tk(v[3])}</b>
      </div>
      <div class="d-flex justify-content-between pt-1 border-top dn fw-bold">
        <span>${t('due_amt')}:</span><b>${tk(due)}</b>
      </div>
    </div>
    ${field('pay_amt', t('amount') + ' (৳)', `<input id="pay_amt" type="number" min="1" max="${due}" value="${due}" class="form-control fw-bold">`)}
    ${field('pay_m', t('pay_method'), `<select id="pay_m" class="form-select">${opts(F.methods().map(k => [k, t(k)]))}</select>`)}
    ${field('pay_ref', t('pay_ref'), `<input id="pay_ref" class="form-control" placeholder="TXN-XXXX / Cheque #">`)}
    ${field('pay_notes', t('pay_remarks'), `<input id="pay_notes" class="form-control" placeholder="${t('pay_remarks')}">`)}
  `;

  modal(t('add_payment') + ' – ' + v[0], modalContent, () => {
    const amtInput = $('#pay_amt');
    const amt = +amtInput.value;
    amtInput.classList.remove('is-invalid');

    if (!(amt > 0)) {
      return !bad('pay_amt', t('pos_pay_err'));
    }
    if (amt > due) {
      return !bad('pay_amt', t('overpay_err'));
    }

    const method = $('#pay_m').value;
    const ref = $('#pay_ref').value.trim() || ('TXN-' + Math.floor(10000 + Math.random() * 90000));
    const note = $('#pay_notes').value.trim() || t('pay_history');
    const now = new Date();

    if (!D.paySeq) D.paySeq = 1000;
    const payId = 'PAY-2026-' + (++D.paySeq);

    if (!v.payments) v.payments = [];

    // 1. Run atomic payment recording & ledger reconciliation
    const runner = () => {
      const paymentRecord = {
        id: payId,
        invNo: v[0],
        c: v[1],
        dt: now.getTime(),
        dtStr: nowStr(now),
        amt: amt,
        m: method,
        ref: ref,
        u: F.S.user ? (F.S.user.n[F.S.lang] || F.S.user.n.bn) : 'User',
        note: note,
        status: 'posted',
        revRef: null,
        revReason: null,
        revBy: null,
        revAt: null
      };
      v.payments.push(paymentRecord);

      const activePaid = sum(v.payments.filter(p => p.status === 'posted').map(p => p.amt));
      v[3] = activePaid;
      const remDue = Math.max(0, v[2] - activePaid);
      v[4] = remDue <= 0 ? 'paid' : (activePaid > 0 ? 'partial' : 'due');

      const prevCustDue = c.due;
      if (window.FIN) window.FIN.postCashBank(D, method, amt);
      else if (method === 'm_cash') D.cashBank.cash += amt;
      else D.cashBank.bank += amt;

      D.daily.coll[D.daily.coll.length - 1] += amt;

      if (!D.dueCollections) D.dueCollections = [];
      D.dueCollections.unshift({
        id: 'COLL-' + Date.now().toString(36).toUpperCase(),
        linkedPayId: payId,
        custId: v[1],
        custName: L(c),
        invNo: v[0],
        prevDue: prevCustDue,
        amt: amt,
        remDue: Math.max(0, prevCustDue - amt),
        dt: now.getTime(),
        dtStr: nowStr(now),
        m: method,
        ref: ref,
        by: paymentRecord.u,
        remarks: note
      });

      if (window.FIN) {
        window.FIN.reconcileCustomer(v[1], F);
      } else {
        c.due = Math.max(0, c.due - amt);
        if (c.due <= 0) c.days = 0;
      }

      if (typeof LOG !== 'undefined') {
        LOG.add({
          uid: F.S.user?.id,
          u: F.S.user?.n?.bn,
          r: F.S.role,
          m: 'sales',
          t: 'save',
          recordType: 'payment',
          recordId: payId,
          changes: { before: v[2] - (activePaid - amt), after: remDue },
          msg: `ইনভয়েস ${v[0]}-এ পেমেন্ট গ্রহণ: ${tk(amt)} (${t(method)})`
        });
      }
    };

    const res = window.FIN ? window.FIN.tx(F, runner) : (runner(), true);
    if (res === false) return false;

    toast(t('coll_done'), 'check-circle');
    if ($('#inv-table')) list();
    else F.route(false);
  }, t('save'));
};

/* =========================================================
   4. CONTROLLED REVERSAL / ADJUSTMENT WORKFLOW (Req 2)
   ========================================================= */
ACT.payrev = (x) => {
  const { t, L, D, tk, toast } = F;
  const pid = x.dataset.pid;
  const idx = +x.dataset.i;
  const v = D.invoices[idx];
  if (!v || !v.payments) return;
  const pay = v.payments.find(p => p.id === pid);
  if (!pay || pay.status === 'reversed') return;

  const revHtml = `
    <div class="alert alert-warning mb-3">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      ${t('rev_confirm')}
    </div>
    <div class="mb-3 p-3 rounded border" style="background:var(--surface-2)">
      <div class="d-flex justify-content-between mb-1">
        <span>${t('pay_id')}:</span><b>${pay.id}</b>
      </div>
      <div class="d-flex justify-content-between mb-1">
        <span>${t('amount')}:</span><b class="dn">${tk(pay.amt)}</b>
      </div>
      <div class="d-flex justify-content-between mb-1">
        <span>${t('pay_method')}:</span><b>${t(pay.m)}</b>
      </div>
      <div class="d-flex justify-content-between">
        <span>${t('pay_dt')}:</span><small>${pay.dtStr}</small>
      </div>
    </div>
    <div class="mb-3">
      <label class="form-label fw-bold text-danger">${t('rev_reason')} *</label>
      <input type="text" id="rev_reason_input" class="form-control" placeholder="${t('rev_reason_req')}">
      <div class="invalid-feedback">${t('rev_reason_req')}</div>
    </div>
  `;

  modal(t('pay_reverse') + ' – ' + pay.id, revHtml, () => {
    const reasonInput = $('#rev_reason_input');
    const reason = reasonInput.value.trim();
    reasonInput.classList.remove('is-invalid');

    if (!reason) {
      reasonInput.classList.add('is-invalid');
      return false;
    }

    const runner = () => {
      const now = new Date();
      const revUser = F.S.user ? (F.S.user.n[F.S.lang] || F.S.user.n.bn) : 'Admin';
      const revId = 'REV-2026-' + (++D.paySeq);

      pay.status = 'reversed';
      pay.revRef = revId;
      pay.revReason = reason;
      pay.revBy = revUser;
      pay.revAt = now.getTime();

      const counterEntry = {
        id: revId,
        invNo: v[0],
        c: v[1],
        dt: now.getTime(),
        dtStr: nowStr(now),
        amt: -pay.amt,
        m: pay.m,
        ref: 'Counter-entry for ' + pay.id,
        u: revUser,
        note: 'Reversal: ' + reason,
        status: 'reversal',
        revRef: pay.id,
        revReason: reason,
        revBy: revUser,
        revAt: now.getTime()
      };
      v.payments.push(counterEntry);

      const activePaid = sum(v.payments.filter(p => p.status === 'posted').map(p => p.amt));
      v[3] = activePaid;
      const remDue = Math.max(0, v[2] - activePaid);
      v[4] = remDue <= 0 ? 'paid' : (activePaid > 0 ? 'partial' : 'due');

      if (window.FIN) {
        window.FIN.postCashBank(D, pay.m || 'm_cash', -pay.amt);
        if (D.cashBank) {
          D.cashBank.cash = Math.max(0, D.cashBank.cash);
          D.cashBank.bank = Math.max(0, D.cashBank.bank);
        }
        window.FIN.reconcileCustomer(v[1], F);
      } else {
        const c = D.customers[v[1]];
        if (c) c.due += pay.amt;
        const cb = D.cashBank;
        if (pay.m === 'm_cash') cb.cash = Math.max(0, cb.cash - pay.amt);
        else cb.bank = Math.max(0, cb.bank - pay.amt);
      }

      if (typeof LOG !== 'undefined') {
        LOG.add({
          uid: F.S.user?.id,
          u: F.S.user?.n?.bn,
          r: F.S.role,
          m: 'sales',
          t: 'delete',
          recordType: 'payment_reversal',
          recordId: revId,
          reason: reason,
          changes: { before: activePaid + pay.amt, after: activePaid },
          msg: `পেমেন্ট রিভার্সাল (${pay.id}): -${tk(pay.amt)} | কারণ: ${reason}`
        });
      }
    };

    const res = window.FIN ? window.FIN.tx(F, runner) : (runner(), true);
    if (res === false) return false;

    toast(t('rev_success'), 'check-circle');
    if ($('#inv-table')) list();
    else F.route(false);
  }, t('rev_confirm'));
};

/* =========================================================
   5. PAYMENT RECEIPT PRINT (Req 2)
   ========================================================= */
ACT.payrec = (x) => {
  const { t, L, D, tk } = F;
  const pid = x.dataset.pid;
  const idx = +x.dataset.i;
  const v = D.invoices[idx];
  if (!v || !v.payments) return;
  const pay = v.payments.find(p => p.id === pid);
  if (!pay) return;
  const c = D.customers[v[1]];
  const S = U.ST;
  const co = S.co;

  const receiptHtml = `
    <div class="inv2" style="width:680px;padding:36px">
      <div class="i2-head pb-3">
        <div class="i2-co">
          <div>
            <b>${co.name}</b>
            <span>${B.tag}</span>
            <small>${co.addr} · ${co.ph}</small>
          </div>
        </div>
        <div class="i2-meta">
          <div class="i2-title" style="color:#0a7a50">${t('pay_receipt')}</div>
          <table>
            <tr><td>${t('pay_id')}</td><td><b>${pay.id}</b></td></tr>
            <tr><td>${t('date')}</td><td>${pay.dtStr}</td></tr>
            <tr><td>${t('inv_no')}</td><td>${v[0]}</td></tr>
          </table>
        </div>
      </div>
      <div class="i2-bill my-3">
        <div>
          <small>${t('customer')}</small>
          <b>${c ? L(c) : '—'}</b>
          <span>${c?.phone || ''}</span>
        </div>
        <div>
          <small>${t('pay_method')}</small>
          <b>${t(pay.m)}</b>
          <span>${t('pay_ref')}: ${pay.ref || '—'}</span>
        </div>
      </div>
      <table class="i2-t my-3">
        <thead>
          <tr>
            <th>${t('description')}</th>
            <th class="r">${t('amount')}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <b>${t('add_payment')} (${v[0]})</b>
              <br><small class="text-secondary">${pay.note || ''}</small>
            </td>
            <td class="r fs-5 fw-bold up">${tk(pay.amt)}</td>
          </tr>
        </tbody>
      </table>
      <div class="d-flex justify-content-between p-3 rounded" style="background:#f4f6f8">
        <div><span>${t('inv_no')}: ${v[0]}</span><br><small class="text-secondary">${t('grand')}: ${tk(v[2])}</small></div>
        <div class="text-end"><span>${t('due_amt')}: <b>${tk(v[2] - v[3])}</b></span><br><small class="text-secondary">${t('status')}: ${t(v[4])}</small></div>
      </div>
      <div class="i2-sign mt-5">
        <div>${t('sign_cust')}</div>
        <div>${pay.u || co.name}<br><small>${t('sign_auth')}</small></div>
      </div>
      <div class="i2-foot mt-4">${co.name} – ${t('pay_receipt')}</div>
    </div>`;

  U.showDoc(`${t('pay_receipt')} – ${pay.id}`, receiptHtml, receiptHtml);
};

/* ---- WhatsApp Assistant and A4 Doc Print (A4 Only, Thermal Removed) ---- */
ACT.ipr=x=>{
  const{t,D}=F,i=+x.dataset.i,v=D.invoices[i],m=x.dataset.m;
  if(!v)return;
  if(m==='wa'){
    if(U.openWaShareModal){ U.openWaShareModal(i); return; }
  }
  U.showDoc(v[0]+' – '+t('print_a4'),paper(i),paper(i),false);
};

/* ---- Add forms ---- */
const num=(id,lb,v='')=>field(id,lb,`<input id="${id}" type="number" min="0" class="form-control" value="${v}">`),txt=(id,lb)=>field(id,lb,`<input id="${id}" class="form-control">`);
const clr=ids=>ids.forEach(i=>$('#'+i)&&$('#'+i).classList.remove('is-invalid'));

ACT.padd=()=>{
  const{t,D,toast}=F;
  let imgData='';
  const imgBlock=`<div class="mb-2"><label class="form-label">${t('prod_img')||'Product Image'}</label><div class="d-flex align-items-center gap-3 flex-wrap"><div id="pimg_prev" class="border rounded d-flex align-items-center justify-content-center" style="width:56px;height:56px;overflow:hidden;background:var(--surface-2)"><i class="bi bi-box-seam text-secondary fs-4"></i></div><label class="btn btn-sm btn-outline-primary mb-0" style="cursor:pointer"><i class="bi bi-upload me-1"></i>${t('upload_img')||t('upload')||'Upload'}<input id="pimg" type="file" accept="image/*" hidden></label></div></div>`;
  modal(t('add_product'),txt('pn',t('pname'))+`<div class="row"><div class="col-6">${field('pc',t('category'),`<select id="pc" class="form-select">${opts(['paper','board','film','raw'].map(k=>[k,t('cat_'+k)]))}</select>`)}</div><div class="col-6">${field('pstat',t('prod_status')||t('status'),`<select id="pstat" class="form-select">${opts([['active',t('status_active')||'Active'],['inactive',t('status_inactive')||'Inactive']],'active')}</select>`)}</div></div>`+`<div class="row"><div class="col-6">${num('pk',t('open_stock'),0)}</div><div class="col-6">${num('pm',t('min_stock'),0)}</div><div class="col-6">${num('pco',t('cost_price'))}</div><div class="col-6">${num('ppr',t('sell_price'))}</div></div>`+field('pdesc',t('prod_desc')||'Description',`<textarea id="pdesc" class="form-control" rows="2"></textarea>`)+imgBlock,()=>{
    clr(['pn','pco','ppr']);let e=0;const n=$('#pn').value.trim();
    if(!n)e=bad('pn',t('req'));if(!(+$('#pco').value>0))e=bad('pco',t('pos_qty'));if(!(+$('#ppr').value>0))e=bad('ppr',t('pos_qty'));if(e)return false;
    const openKg = +$('#pk').value||0;
    const newProd = {n:{bn:n,en:n},cat:$('#pc').value,kg:0,purchased:openKg,min:+$('#pm').value||0,cost:+$('#pco').value,price:+$('#ppr').value,sold:0,sku:'PK-'+(101+D.products.length),desc:$('#pdesc').value.trim(),status:$('#pstat').value||'active',img:imgData,adjHistory:[]};
    D.products.push(newProd);
    const newIdx = D.products.length - 1;
    if(openKg > 0){
      if(window.FIN) window.FIN.recordStockMove(F, {p:newIdx,qty:openKg,isIn:true,kind:'adjustment',ty:'Opening Stock',ref:newProd.sku,remarks:'Opening stock on product creation'});
      else newProd.kg = openKg;
    }
    if(typeof LOG!=='undefined') LOG.add({uid:F.S.user?.id,u:F.S.user?.n?.bn,r:F.S.role,m:'products',t:'save',recordType:'product',recordId:newProd.sku,msg:`নতুন পণ্য যোগ: ${n}`});
    toast(t('added_ok'),'check-circle');F.route(false);
  });
  $('#pimg')?.addEventListener('change',ev=>{const fl=ev.target.files?.[0];if(!fl)return;const r=new FileReader();r.onload=()=>{imgData=r.result||'';$('#pimg_prev').innerHTML=imgData?`<img src="${imgData}" style="width:100%;height:100%;object-fit:cover">`:`<i class="bi bi-box-seam text-secondary fs-4"></i>`};r.readAsDataURL(fl)});
};

ACT.cadd=()=>{
  const{t,D,toast}=F;
  modal(t('add_customer'),txt('cn',t('cust_name'))+txt('cph',t('phone'))+txt('caddr',t('address')||'Address')+num('cl',t('limit_amt'))+num('cd',t('open_due'),0),()=>{
    clr(['cn','cph','cl']);let e=0;const n=$('#cn').value.trim();
    if(!n)e=bad('cn',t('req'));if(!/^[0-9+\- ]{10,16}$/.test($('#cph').value.trim()))e=bad('cph',t('bad_phone'));if(!(+$('#cl').value>0))e=bad('cl',t('pos_qty'));if(e)return false;
    const d=+$('#cd').value||0;
    const code='CUST-'+(101+D.customers.length);
    const newCust = {code,bn:n,en:n,v:0,due:d,openingDue:d,days:d?1:0,phone:$('#cph').value.trim(),address:$('#caddr').value.trim(),limit:+$('#cl').value,status:'active'};
    D.customers.push(newCust);
    if(typeof LOG!=='undefined') LOG.add({uid:F.S.user?.id,u:F.S.user?.n?.bn,r:F.S.role,m:'customers',t:'save',recordType:'customer',recordId:code,msg:`নতুন কাস্টমার যোগ: ${n}`});
    toast(t('added_ok'),'check-circle');F.route(false);
  });
};

ACT.sadd=()=>{
  const{t,D,toast}=F;
  modal(t('add_supplier'),txt('sn',t('supplier'))+txt('sph',t('phone'))+txt('saddr',t('address')||'Address')+`<div class="row"><div class="col-6">${field('sty',t('type'),`<select id="sty" class="form-select">${opts([['local',t('local')],['overseas',t('overseas')]])}</select>`)}</div><div class="col-6">${field('scu',t('currency'),`<select id="scu" class="form-select">${opts(['BDT','USD','RMB'].map(c=>[c,c]))}</select>`)}</div></div>`+num('sp',t('open_due'),0),()=>{
    clr(['sn']);const n=$('#sn').value.trim();if(!n)return !bad('sn',t('req'));const p=+$('#sp').value||0;
    const code='SUP-'+(101+D.suppliers.length);
    const newSup = {code,bn:n,en:n,type:$('#sty').value,cur:$('#scu').value,payable:p,openingPayable:p,phone:$('#sph').value.trim()||'—',address:$('#saddr').value.trim(),status:'active',tx:[]};
    D.suppliers.push(newSup);D.cashBank.payable+=p;
    if(typeof LOG!=='undefined') LOG.add({uid:F.S.user?.id,u:F.S.user?.n?.bn,r:F.S.role,m:'suppliers',t:'save',recordType:'supplier',recordId:code,msg:`নতুন সাপ্লায়ার যোগ: ${n}`});
    toast(t('added_ok'),'check-circle');F.route(false);
  });
};

})();
