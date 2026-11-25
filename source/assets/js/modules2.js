/* Phase 3 pages: Purchase (local purchases + Details/Edit/Delete), Import (shipments + landed cost), Suppliers */
(()=>{
const {modal,field,bad,opts,bd,sum,$,ACT,IN,boot}=window.UI,P=window.PAGES;let F;
let PU_DETAIL=null;
function init(f){F=f;boot(f);const D=f.D;
 const S=(bn,en,type,cur,payable,phone)=>{const p1=Math.round(payable*.8/1000)*1000,p2=Math.round(payable*.6/1000)*1000;return{bn,en,type,cur,payable,phone,tx:[['p',p1,['২৮ সেপ্টেম্বর','28 Sep']],['p',p2,['১২ অক্টোবর','12 Oct']],['m',p1+p2-payable,['২০ অক্টোবর','20 Oct']]]}};
 if(!D.suppliers) D.suppliers=[S('সানশাইন পেপার ইন্ডাস্ট্রিজ (চীন)','Sunshine Paper Industries (China)','overseas','RMB',3200000,'+86 571 8800 1234'),S('পেট্রোকেম ট্রেডিং (সিঙ্গাপুর)','Petrochem Trading (Singapore)','overseas','USD',4100000,'+65 6100 2200'),S('ঢাকা পেপার মার্ট','Dhaka Paper Mart','local','BDT',1340000,'01711-902345')];
 if(!D.shipments) D.shipments=[['SH-0457',1,3,12000,'arrived',['২৭ অক্টোবর','27 Oct'],95,45000,1185000,0,1185000],['SH-0456',0,0,25000,'transit',['০৮ নভেম্বর','08 Nov'],85,60000,2185000,1000000,1185000],['SH-0455',1,6,18000,'ordered',['২৪ নভেম্বর','24 Nov'],105,50000,1940000,0,1940000],['SH-0454',2,7,10000,'received',['১৫ অক্টোবর','15 Oct'],88,35000,915000,915000,0]];
 if(!D.purchases) D.purchases=[
   { no: 'PO-2026-88', supIdx: 2, prodIdx: 0, kg: 5000, rate: 82, charges: 12000, total: 422000, paid: 422000, due: 0, status: 'received', d: ['১৫ নভেম্বর','15 Nov'], m: 'm_bank', by: 'আসির আহমেদ তৌসিফ' },
   { no: 'PO-2026-87', supIdx: 2, prodIdx: 2, kg: 8000, rate: 94, charges: 20000, total: 772000, paid: 500000, due: 272000, status: 'arrived', d: ['০২ নভেম্বর','02 Nov'], m: 'm_bank', by: 'আসির আহমেদ তৌসিফ' },
   { no: 'PO-2026-86', supIdx: 2, prodIdx: 7, kg: 10000, rate: 90, charges: 25000, total: 925000, paid: 925000, due: 0, status: 'received', d: ['১৫ অক্টোবর','15 Oct'], m: 'm_cash', by: 'আসির আহমেদ তৌসিফ' }
 ];
 if(window.FIN) window.FIN.boot(f);
}
const stc={ordered:'info',transit:'info',arrived:'partial',received:'paid'},RATE={USD:122,RMB:17,BDT:1};
const CS={p:3,q:12000,cur:'USD',fp:1.15,rate:122,fr:150000,duty:10,port:36000,clr:52000,tr:30000,ot:12000};
function calc(){const g=CS.q*CS.fp*CS.rate,d=(g+CS.fr)*CS.duty/100,add=[['freight',CS.fr],['duty_amt',d],['port',CS.port],['clearing',CS.clr],['transport',CS.tr],['other',CS.ot]],tot=g+sum(add.map(a=>a[1]));return{g,add,tot,pk:CS.q?tot/CS.q:0}}

function findPurchaseRecord(refOrUid){
  const D = F?.D;
  if(!D || !refOrUid) return null;
  const sKey = String(refOrUid);
  let idx = (D.purchases || []).findIndex((p, i) => ('PO_' + i) === sKey || p.no === sKey || p.id === sKey);
  if(idx >= 0) return { kind:'local', idx, raw:D.purchases[idx] };
  idx = (D.shipments || []).findIndex((s, i) => ('SH_' + i) === sKey || s[0] === sKey);
  if(idx >= 0) return { kind:'import', idx, raw:D.shipments[idx] };
  return null;
}

function purchaseDetailPage(refOrUid){
  const {t,L,D,tk,kg,short,n,panel}=F;
  if(!F.can('purchase')){$('#view').innerHTML=`<div class="lock"><i class="bi bi-lock"></i>${t('admin_only')}</div>`;return}
  const found = findPurchaseRecord(refOrUid);
  if(!found){ PU_DETAIL = null; purchase(); return; }
  const isLocal = found.kind === 'local';
  const raw = found.raw;
  const idx = found.idx;
  const ref = isLocal ? raw.no : raw[0];
  const supIdx = isLocal ? raw.supIdx : raw[1];
  const prodIdx = isLocal ? raw.prodIdx : raw[2];
  const qty = isLocal ? (raw.kg || 0) : (raw[3] || 0);
  const prod = D.products[prodIdx] || { n:{bn:'পণ্য',en:'Product'}, cost:0, sku:'—' };
  const sup = D.suppliers[supIdx] || { bn:'Supplier', en:'Supplier', phone:'—', cur:'BDT', address:'' };
  const rate = isLocal ? (raw.rate || 0) : (raw[7] || raw[6] || prod.cost || 0);
  const charges = isLocal ? (raw.charges || 0) : (raw[8] || 0);
  const total = isLocal ? (raw.total || 0) : (raw[9] !== undefined ? raw[9] : Math.round(qty * rate + charges));
  const paid = isLocal ? (raw.paid || 0) : (raw[10] !== undefined ? raw[10] : (raw[4] === 'received' ? total : 0));
  const due = Math.max(0, total - paid);
  const delivStatus = isLocal ? (raw.status || 'arrived') : (raw[4] || 'transit');
  const payStatus = due <= 0 ? 'paid' : (paid > 0 ? 'partial' : 'due');
  const dtStr = isLocal ? (raw.dtStr || (raw.d ? (F.S.lang==='bn'?raw.d[0]:raw.d[1]) : '—')) : (raw.dtStr || '—');
  const payments = raw.payments || [];
  const canED = window.FIN ? window.FIN.canEditDel(F) : F.A();

  const payRows = payments.length ? payments.map(py => `
    <tr>
      <td><b>${py.id}</b></td>
      <td>${py.dtStr || dtStr}</td>
      <td class="r fw-bold up">${tk(py.amt)}</td>
      <td><span class="badge bg-secondary-subtle text-body border">${t(py.m || 'm_bank')}</span></td>
      <td><code>${py.ref || '—'}</code></td>
      <td><small>${py.by || 'Admin'}</small></td>
      <td><small>${py.note || '—'}</small></td>
    </tr>`).join('') : `<tr><td colspan="7" class="text-center text-secondary py-3">${t('empty')}</td></tr>`;

  $('#view').innerHTML = `
    <div class="enter">
      <div class="page-h d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <button class="btn-o" data-act="puback"><i class="bi bi-arrow-left me-1"></i>${t('back_to_list') || t('back') || 'Back'}</button>
          <div>
            <h2 class="mb-0 d-flex align-items-center gap-2 flex-wrap">
              <span>${ref}</span>
              ${bd(isLocal ? 'paid' : 'info', isLocal ? 'local' : 'overseas')}
              ${bd(delivStatus === 'received' ? 'paid' : 'partial', 'st_' + delivStatus)}
            </h2>
            <p class="mb-0 text-secondary">${t('purch_detail') || 'Purchase Order & Settlement Details'} · ${dtStr}</p>
          </div>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          ${due > 0 ? `<button class="btn-a" data-act="pupay" data-kind="${found.kind}" data-i="${idx}"><i class="bi bi-cash-coin me-1"></i>${t('pay_now') || 'Pay'}</button>` : ''}
          ${delivStatus === 'arrived' ? `<button class="btn-o" data-act="purecv" data-kind="${found.kind}" data-i="${idx}"><i class="bi bi-box-arrow-in-down me-1"></i>${t('receive')}</button>` : ''}
          ${isLocal && canED ? `<button class="btn-o" data-act="puedit" data-i="${idx}"><i class="bi bi-pencil me-1"></i>${t('edit')}</button>` : ''}
          ${isLocal && canED ? `<button class="btn btn-outline-danger btn-sm px-3" data-act="pudel" data-i="${idx}"><i class="bi bi-trash3 me-1"></i>${t('delete')}</button>` : ''}
          <button class="btn-o" data-act="puprint" data-ref="${ref}"><i class="bi bi-printer me-1"></i>${t('print_a4') || t('print')}</button>
        </div>
      </div>

      <div class="strip strip-4 mb-3">
        <div><span>${t('pu_tot_amount') || t('total')}</span><b class="text-primary">${tk(total)}</b></div>
        <div><span>${t('pu_paid_amt') || t('paid')}</span><b class="up">${tk(paid)}</b></div>
        <div><span>${t('pu_due_amt') || t('due')}</span><b class="${due>0?'dn':'up'}">${tk(due)}</b></div>
        <div><span>${t('qty_kg')}</span><b>${kg(qty)}</b></div>
      </div>

      <div class="row g-3 mb-3">
        <div class="col-md-6">
          <div class="card border shadow-sm h-100" style="background:var(--surface)">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="fw-bold mb-0"><i class="bi bi-building me-2 text-primary"></i>${t('supplier')}</h6>
                <button class="btn btn-sm btn-outline-primary py-0 px-2" data-act="sstmtview" data-i="${supIdx}">${t('statement') || 'Ledger'}</button>
              </div>
              <div class="fs-5 fw-bold mb-1">${L(sup)}</div>
              <div class="small text-secondary mb-1"><i class="bi bi-upc me-1"></i>${sup.code || ('SUP-'+(101+supIdx))} · <i class="bi bi-telephone me-1"></i>${sup.phone || '—'}</div>
              <div class="small text-secondary mb-2"><i class="bi bi-geo-alt me-1"></i>${sup.address || '—'}</div>
              <div class="p-2 rounded border d-flex justify-content-between" style="background:var(--surface-2)">
                <span class="small text-secondary">${t('due_amt') || 'Current Supplier Payable'}</span>
                <b class="${sup.payable>0?'dn':'up'}">${tk(sup.payable || 0)}</b>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card border shadow-sm h-100" style="background:var(--surface)">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="fw-bold mb-0"><i class="bi bi-box-seam me-2 text-primary"></i>${t('product')}</h6>
                <button class="btn btn-sm btn-outline-primary py-0 px-2" data-act="pview" data-i="${prodIdx}">${t('prod_details') || 'Details'}</button>
              </div>
              <div class="fs-5 fw-bold mb-1">${L(prod.n)}</div>
              <div class="small text-secondary mb-2"><i class="bi bi-tag me-1"></i>${prod.sku || '—'} · ${t('stock')}: <b>${kg(prod.kg || 0)}</b></div>
              <div class="lrow"><span class="l">${t('qty_kg')}</span><span class="ld"></span><span class="v">${kg(qty)}</span></div>
              <div class="lrow"><span class="l">${t('pu_unit_cost') || t('rate')}</span><span class="ld"></span><span class="v">${tk(rate)}</span></div>
              <div class="lrow"><span class="l">${t('pu_charges') || t('other')}</span><span class="ld"></span><span class="v">${tk(charges)}</span></div>
              <div class="lrow"><span class="l">${t('status')}</span><span class="ld"></span><span class="v">${bd(payStatus, 'inv_status_' + payStatus)}</span></div>
            </div>
          </div>
        </div>
      </div>

      ${panel(t('pay_history') || 'Payment History', `
        <div class="tw">
          <table class="tbl mb-0">
            <thead>
              <tr>
                <th>${t('pay_id') || 'Payment ID'}</th>
                <th>${t('date')}</th>
                <th class="r">${t('amount')}</th>
                <th>${t('method')}</th>
                <th>${t('pay_ref') || 'Reference'}</th>
                <th>${t('pay_received_by') || 'By'}</th>
                <th>${t('notes') || 'Notes'}</th>
              </tr>
            </thead>
            <tbody>${payRows}</tbody>
          </table>
        </div>`)}
    </div>`;
}

window.UI.openPurchaseDetail = (uidOrRef, returnRoute) => {
  window.PU_RETURN_TO = returnRoute || null;
  PU_DETAIL = uidOrRef;
  if (location.hash === '#/purchase' && F) {
    purchaseDetailPage(PU_DETAIL);
  } else {
    location.hash = '#/purchase';
  }
};

/* ---------- 1. Local / General Purchase Module ---------- */
function purchase(){
  const {t,L,A,D,panel,tk,kg,short,n}=F;
  if(!F.can('purchase')){$('#view').innerHTML=`<div class="lock"><i class="bi bi-lock"></i>${t('admin_only')}</div>`;return}
  if(PU_DETAIL){ purchaseDetailPage(PU_DETAIL); return; }

  const canED = window.FIN ? window.FIN.canEditDel(F) : A();
  const list = D.purchases || [];
  let totKg=0, totAmt=0, totPaid=0, totDue=0;
  list.forEach(p => {
    totKg += (p.kg || 0);
    totAmt += (p.total || 0);
    totPaid += (p.paid || 0);
    totDue += (p.due || 0);
  });

  const puStrip = `
    <div class="strip strip-4 mb-3">
      <div><span>${t('pu_tot_amount') || t('purchases')}</span><b class="text-primary">${short(totAmt)}</b></div>
      <div><span>${t('pu_rep_qty') || t('qty_kg')}</span><b>${kg(totKg)}</b></div>
      <div><span>${t('pu_paid_amt') || t('paid')}</span><b class="up">${short(totPaid)}</b></div>
      <div><span>${t('pu_due_amt') || t('due')}</span><b class="${totDue>0?'dn':'up'}">${short(totDue)}</b></div>
    </div>`;

  const puCards = `
    <div class="d-md-none pu-mobile-list p-2">
      ${list.length ? list.map((p, idx) => {
        const sup = D.suppliers[p.supIdx] || { bn: 'স্থানীয় সরবরাহকারী', en: 'Local Supplier' };
        const prod = D.products[p.prodIdx] || { n: { bn: 'পণ্য', en: 'Product' } };
        return `
          <div class="mob-tx-card mb-2 p-3">
            <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
              <div>
                <a href="javascript:void(0)" class="badge bg-primary-subtle text-primary border border-primary-subtle fw-bold text-decoration-none" data-act="pudetail" data-uid="PO_${idx}">${p.no}</a>
                <small class="text-secondary ms-1"><i class="bi bi-calendar3 me-1"></i>${p.dtStr || (p.d ? (F.S.lang==='bn'?p.d[0]:p.d[1]) : '—')}</small>
              </div>
              <div>${bd(p.status==='received'||p.due<=0?'paid':'due', p.status==='received'?'st_received':'st_arrived')}</div>
            </div>
            <div class="mb-2">
              <div class="fw-bold text-truncate" style="font-size:15px"><i class="bi bi-building me-1 text-secondary"></i>${L(sup)}</div>
              <div class="text-secondary small mt-1"><i class="bi bi-box-seam me-1"></i>${L(prod.n)} • <span class="fw-semibold text-body">${kg(p.kg)}</span> @ ${tk(p.rate)}</div>
            </div>
            <div class="p-2 rounded border bg-surface-2 d-flex justify-content-between align-items-center text-center mb-2">
              <div class="flex-fill"><span class="d-block small text-secondary">${t('total')}</span><b class="text-primary fs-6">${tk(p.total)}</b></div>
              <div class="vr mx-1"></div>
              <div class="flex-fill"><span class="d-block small text-secondary">${t('paid')}</span><b class="up fs-6">${tk(p.paid)}</b></div>
              <div class="vr mx-1"></div>
              <div class="flex-fill"><span class="d-block small text-secondary">${t('due')}</span><b class="${p.due > 0 ? 'dn' : 'up'} fs-6">${tk(p.due)}</b></div>
            </div>
            <div class="d-flex gap-1 flex-wrap pt-2 border-top">
              <button class="btn btn-sm btn-outline-primary flex-fill" data-act="pudetail" data-uid="PO_${idx}"><i class="bi bi-eye me-1"></i>${t('details') || 'Details'}</button>
              ${p.due > 0 ? `<button class="btn btn-sm btn-success flex-fill" data-act="pupay" data-kind="local" data-i="${idx}"><i class="bi bi-cash-coin me-1"></i>${t('pay_now')}</button>` : ''}
              ${canED ? `<button class="btn btn-sm btn-outline-secondary" data-act="puedit" data-i="${idx}"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-outline-danger" data-act="pudel" data-i="${idx}"><i class="bi bi-trash3"></i></button>` : ''}
            </div>
          </div>`;
      }).join('') : `<div class="text-center text-secondary py-4">${t('empty')}</div>`}
    </div>`;

  const puTable = `
    <div class="d-none d-md-block tw">
      <table class="tbl">
        <thead>
          <tr>
            <th>${t('inv_no') || 'PO No'} / ${t('date')}</th>
            <th>${t('supplier')}</th>
            <th>${t('product')}</th>
            <th class="r">${t('qty_kg')}</th>
            <th class="r">${t('price')}</th>
            <th class="r">${t('charges') || t('other')}</th>
            <th class="r fw-bold">${t('total')}</th>
            <th class="r">${t('paid')}</th>
            <th class="r">${t('due')}</th>
            <th>${t('status')}</th>
            <th class="r">${t('actions')}</th>
          </tr>
        </thead>
        <tbody>
          ${list.length ? list.map((p, idx) => {
            const sup = D.suppliers[p.supIdx] || { bn: 'স্থানীয় সরবরাহকারী', en: 'Local Supplier' };
            const prod = D.products[p.prodIdx] || { n: { bn: 'পণ্য', en: 'Product' } };
            return `
              <tr>
                <td><a href="javascript:void(0)" class="fw-bold text-decoration-none text-primary" data-act="pudetail" data-uid="PO_${idx}">${p.no}</a><br><small class="text-secondary">${p.dtStr || (p.d ? (F.S.lang==='bn'?p.d[0]:p.d[1]) : '—')}</small></td>
                <td><b>${L(sup)}</b></td>
                <td>${L(prod.n)}</td>
                <td class="r fw-semibold">${kg(p.kg)}</td>
                <td class="r">${tk(p.rate)}</td>
                <td class="r text-secondary">${tk(p.charges||0)}</td>
                <td class="r fw-bold text-primary">${tk(p.total)}</td>
                <td class="r up">${tk(p.paid)}</td>
                <td class="r ${p.due > 0 ? 'dn fw-bold' : 'up'}">${tk(p.due)}</td>
                <td>${bd(p.status==='received'||p.due<=0?'paid':'due', p.status==='received'?'st_received':'st_arrived')}</td>
                <td class="r text-nowrap">
                  <button class="btn btn-sm btn-outline-primary py-1 px-2" data-act="pudetail" data-uid="PO_${idx}" title="${t('details') || 'Details'}"><i class="bi bi-eye"></i></button>
                  ${p.due > 0 ? `<button class="btn btn-sm btn-success py-1 px-2 ms-1" data-act="pupay" data-kind="local" data-i="${idx}" title="${t('pay_now')}"><i class="bi bi-cash-coin"></i></button>` : ''}
                  ${canED ? `
                    <button class="btn btn-sm btn-outline-secondary py-1 px-2 ms-1" data-act="puedit" data-i="${idx}" title="${t('edit')}"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger py-1 px-2 ms-1" data-act="pudel" data-i="${idx}" title="${t('delete')}"><i class="bi bi-trash3"></i></button>` : ''}
                </td>
              </tr>`;
          }).join('') : `<tr><td colspan="11" class="text-center text-secondary py-4">${t('empty')}</td></tr>`}
        </tbody>
      </table>
    </div>`;

  $('#view').innerHTML = `
    <div class="enter">
      <div class="page-h flex-column flex-sm-row gap-2 align-items-start align-items-sm-center justify-content-between">
        <div>
          <h2>${t('nav_purchase')}</h2>
          <p>${t('pu_sub')}</p>
        </div>
        <div class="d-flex gap-2 w-100 w-sm-auto pu-actions">
          <button class="btn-o flex-fill flex-sm-grow-0" data-go="purchase-reports"><i class="bi bi-file-earmark-bar-graph"></i> ${t('pu_view_rep') || 'ক্রয় রিপোর্ট'}</button>
          <button class="btn-a flex-fill flex-sm-grow-0" data-act="puadd"><i class="bi bi-plus-lg"></i> ${t('pu_add') || 'নতুন ক্রয়'}</button>
        </div>
      </div>
      ${puStrip}
      <div class="row g-3">
        <div class="col-12">
          ${panel(t('nav_purchase'), puCards + puTable, `<span class="badge bg-primary-subtle text-primary border">${list.length} ${t('items')}</span>`)}
        </div>
        ${A() && window.UI.retPanel ? `<div class="col-12">${window.UI.retPanel()}</div>` : ''}
      </div>
    </div>`;
}
P.purchase=f=>{init(f);purchase()};
addEventListener('hashchange',()=>{ if(!location.hash.startsWith('#/purchase')) PU_DETAIL=null; });

ACT.pudetail = x => {
  const uid = x.dataset.uid || x.dataset.ref;
  const curRoute = location.hash.replace(/^#\/?/, '') || 'purchase';
  if (curRoute !== 'purchase') {
    window.UI.openPurchaseDetail(uid, curRoute);
    return;
  }
  PU_DETAIL = uid;
  window.PU_RETURN_TO = null;
  purchase();
};
ACT.puback = () => {
  PU_DETAIL = null;
  if (window.PU_RETURN_TO) {
    const rt = window.PU_RETURN_TO;
    window.PU_RETURN_TO = null;
    location.hash = '#/' + rt;
  } else {
    purchase();
  }
};

ACT.pupay = x => {
  const { t, L, D, tk, toast, lrow } = F;
  const kind = x.dataset.kind || 'local';
  const idx = +x.dataset.i;
  const isLocal = kind === 'local';
  const raw = isLocal ? D.purchases[idx] : D.shipments[idx];
  if (!raw) return;
  const ref = isLocal ? raw.no : raw[0];
  const supIdx = isLocal ? raw.supIdx : raw[1];
  const sup = D.suppliers[supIdx];
  const total = isLocal ? raw.total : (raw[9] || 0);
  const paid = isLocal ? raw.paid : (raw[10] || 0);
  const due = Math.max(0, total - paid);
  if (due <= 0) { toast(t('overpay_err') || 'Already fully paid', 'info-circle'); return; }

  modal((t('pay_title') || 'Supplier Payment') + ' – ' + ref, `
    ${lrow(t('supplier'), L(sup))}
    ${lrow(t('due_amt'), tk(due), 'dn')}
    ${field('pup_amt', t('pay_amt'), `<input id="pup_amt" type="number" min="1" max="${due}" class="form-control" value="${due}">`)}
    ${field('pup_m', t('method'), `<select id="pup_m" class="form-select">${opts(['m_bank','m_cash','m_cheque','m_bkash'].map(k=>[k,t(k)]))}</select>`)}
    ${field('pup_ref', t('pay_ref') || 'Reference', '<input id="pup_ref" class="form-control" placeholder="TXN / Cheque No">')}
    ${field('pup_note', t('notes') || 'Notes', '<input id="pup_note" class="form-control">')}
  `, () => {
    const a = +$('#pup_amt').value, m = $('#pup_m').value;
    const pref = ($('#pup_ref')?.value || '').trim(), pnote = ($('#pup_note')?.value || '').trim();
    if (!(a > 0) || a > due) { bad('pup_amt', a > due ? (t('overpay_err') || 'Exceeds due') : t('pos_qty')); return false; }
    const runner = () => {
      const now = Date.now();
      const payId = 'SPAY-' + (++D.txSeq);
      const rec = {
        id: payId, purchNo: ref, s: supIdx, dt: now,
        dtStr: window.FIN ? window.FIN.fmtDtTime(now, F) : 'Today',
        amt: a, m, ref: pref || payId, by: F.S.user ? L(F.S.user.n) : 'Admin',
        note: pnote || 'Purchase settlement', status: 'posted'
      };
      if (isLocal) {
        raw.payments = raw.payments || [];
        raw.payments.push(rec);
        raw.paid = (raw.paid || 0) + a;
        raw.due = Math.max(0, raw.total - raw.paid);
      } else {
        raw.payments = raw.payments || [];
        raw.payments.push(rec);
        raw[10] = (raw[10] || 0) + a;
        raw[11] = Math.max(0, (raw[9] || 0) - raw[10]);
      }
      if (window.FIN) {
        window.FIN.postCashBank(D, m, -a);
        window.FIN.reconcileSupplier(supIdx, F);
      }
      if (typeof LOG !== 'undefined') LOG.add({ m: 'purchase', t: 'save', recordType: 'purchase_payment', recordId: payId, msg: `ক্রয় পরিশোধ (${ref}): ${tk(a)}` });
    };
    const ok = window.FIN ? window.FIN.tx(F, runner) : (runner(), true);
    if (ok === false) return false;
    toast(t('pay_done'), 'check-circle');
    purchase();
  }, t('pay'));
};

ACT.purecv = x => {
  const { t, L, D, toast } = F;
  const kind = x.dataset.kind || 'local';
  const idx = +x.dataset.i;
  if (kind === 'import') { ACT.recv(x); return; }
  const p = D.purchases[idx];
  if (!p || p.status === 'received') return;
  const runner = () => {
    p.status = 'received';
    const sup = D.suppliers[p.supIdx];
    if (window.FIN) {
      window.FIN.recordStockMove(F, {
        p: p.prodIdx, qty: p.kg, isIn: true, kind: 'purchase',
        ty: t('pur_in') || 'Purchase In', ref: p.no, purchRef: p.no,
        party: sup ? L(sup) : 'Supplier', partyType: 'supplier', remarks: 'Purchase goods received into warehouse'
      });
    } else if (D.products[p.prodIdx]) {
      D.products[p.prodIdx].kg += p.kg;
    }
    if (typeof LOG !== 'undefined') LOG.add({ m: 'purchase', t: 'edit', recordType: 'purchase', recordId: p.no, msg: `মালামাল গ্রহণ (${p.no}): ${p.kg} KG` });
  };
  const ok = window.FIN ? window.FIN.tx(F, runner) : (runner(), true);
  if (ok === false) return;
  toast(t('recv_done'), 'check-circle');
  purchase();
};

ACT.puedit = x => {
  if (window.FIN && !window.FIN.canEditDel(F)) { F.toast(F.t('no_edit_del_perm') || F.t('admin_only'), 'shield-exclamation'); return; }
  const { t, L, D, tk, toast } = F;
  const idx = +x.dataset.i;
  const origP = D.purchases[idx];
  if (!origP) return;
  const body = `
    <div class="row g-2">
      <div class="col-12 col-sm-6">${field('pe_sup', t('supplier'), `<select id="pe_sup" class="form-select">${opts(D.suppliers.map((s,i)=>[i,L(s)]), origP.supIdx)}</select>`)}</div>
      <div class="col-12 col-sm-6">${field('pe_prod', t('product'), `<select id="pe_prod" class="form-select">${opts(D.products.map((pr,i)=>[i,L(pr.n)]), origP.prodIdx)}</select>`)}</div>
      <div class="col-6">${field('pe_kg', t('qty_kg'), `<input id="pe_kg" type="number" min="1" class="form-control" value="${origP.kg}">`)}</div>
      <div class="col-6">${field('pe_rate', t('pu_unit_cost')+' (৳)', `<input id="pe_rate" type="number" min="1" class="form-control" value="${origP.rate}">`)}</div>
      <div class="col-6">${field('pe_chg', t('pu_charges')+' (৳)', `<input id="pe_chg" type="number" min="0" class="form-control" value="${origP.charges||0}">`)}</div>
      <div class="col-6">${field('pe_paid', t('pu_paid_amt')+' (৳)', `<input id="pe_paid" type="number" min="0" class="form-control" value="${origP.paid||0}">`)}</div>
      <div class="col-6">${field('pe_stat', t('status'), `<select id="pe_stat" class="form-select">${opts([['received',t('st_received')],['arrived',t('st_arrived')]], origP.status||'arrived')}</select>`)}</div>
      <div class="col-6">${field('pe_m', t('method'), `<select id="pe_m" class="form-select">${opts(['m_bank','m_cash','m_cheque','m_bkash'].map(k=>[k,t(k)]), origP.m||'m_bank')}</select>`)}</div>
    </div>`;
  modal(t('edit') + ' – ' + origP.no, body, () => {
    const newSup = +$('#pe_sup').value, newProd = +$('#pe_prod').value;
    const newKg = +$('#pe_kg').value, newRate = +$('#pe_rate').value, newChg = +$('#pe_chg').value || 0;
    const newPaid = +$('#pe_paid').value || 0, newStat = $('#pe_stat').value, newM = $('#pe_m').value;
    if (!(newKg > 0) || !(newRate > 0)) { toast(t('pos_qty'), 'exclamation-triangle'); return false; }
    const newTotal = Math.round(newKg * newRate + newChg);
    if (newPaid < 0 || newPaid > newTotal) { toast(t('overpay_err') || 'Paid exceeds total', 'exclamation-triangle'); return false; }
    const ok = window.FIN ? window.FIN.tx(F, () => {
      const p = D.purchases[idx];
      const oldSup = p.supIdx, oldProd = p.prodIdx, oldKg = p.kg, oldStat = p.status, oldPaid = p.paid || 0, oldTotal = p.total || 0, oldM = p.m || 'm_bank';
      // 1. Sync Stock Delta cleanly
      if (oldStat === 'received') {
        if (window.FIN) window.FIN.recordStockMove(F, { p: oldProd, qty: oldKg, isIn: false, kind: 'purchase_rev', ty: 'Purchase Edit Reversal', ref: p.no, purchRef: p.no, party: L(D.suppliers[oldSup]), partyType: 'supplier', remarks: 'Reverted prior received stock on edit' });
      }
      if (newStat === 'received') {
        if (window.FIN) window.FIN.recordStockMove(F, { p: newProd, qty: newKg, isIn: true, kind: 'purchase', ty: 'Purchase Updated', ref: p.no, purchRef: p.no, party: L(D.suppliers[newSup]), partyType: 'supplier', remarks: 'Updated purchase stock' });
      }
      // 2. Sync Cash/Bank Delta
      const paidDelta = newPaid - oldPaid;
      if (paidDelta !== 0 && window.FIN) window.FIN.postCashBank(D, paidDelta > 0 ? newM : oldM, -paidDelta);
      // 3. Daily purchase delta
      if (D.daily?.purch?.length) {
        const di = D.daily.purch.length - 1;
        D.daily.purch[di] = Math.max(0, D.daily.purch[di] + (newTotal - oldTotal));
      }
      p.supIdx = newSup; p.prodIdx = newProd; p.kg = newKg; p.rate = newRate; p.charges = newChg;
      p.total = newTotal; p.paid = newPaid; p.due = Math.max(0, newTotal - newPaid); p.status = newStat; p.m = newM;
      p.items = [{ p: newProd, q: newKg, rate: newRate }];
      if (paidDelta !== 0) {
        p.payments = p.payments || [];
        p.payments.push({ id: 'SPAY-' + (++D.txSeq), purchNo: p.no, s: newSup, dt: Date.now(), dtStr: window.FIN.fmtDtTime(Date.now(), F), amt: paidDelta, m: newM, ref: 'EDIT-ADJ', by: F.S.user ? L(F.S.user.n) : 'Admin', note: 'Purchase edit payment adjustment', status: 'posted' });
      }
      window.FIN.reconcileSupplier(oldSup, F);
      if (newSup !== oldSup) window.FIN.reconcileSupplier(newSup, F);
      if (typeof LOG !== 'undefined') LOG.add({ m: 'purchase', t: 'edit', recordType: 'purchase', recordId: p.no, msg: `ক্রয় সম্পাদনা (${p.no}): ${tk(oldTotal)} → ${tk(newTotal)}` });
    }) : true;
    if (ok === false) return false;
    toast(t('upd_ok'), 'check-circle');
    purchase();
  }, t('save'));
};

ACT.pudel = x => {
  if (window.FIN && !window.FIN.canEditDel(F)) { F.toast(F.t('no_edit_del_perm') || F.t('admin_only'), 'shield-exclamation'); return; }
  const { t, L, D, tk, toast } = F;
  const idx = +x.dataset.i;
  const p = D.purchases[idx];
  if (!p) return;
  modal(t('del_title'), `<p class="mb-2">${t('confirm_del')} <b>${p.no}</b> (${tk(p.total)})?</p><input id="pu_del_why" class="form-control" placeholder="Deletion reason (Audit Trail)">`, () => {
    const reason = ($('#pu_del_why')?.value || '').trim();
    const ok = window.FIN ? window.FIN.tx(F, () => {
      const target = D.purchases[idx];
      if (target.status === 'received') {
        window.FIN.recordStockMove(F, { p: target.prodIdx, qty: target.kg, isIn: false, kind: 'purchase_rev', ty: 'Purchase Deleted', ref: target.no, purchRef: target.no, party: L(D.suppliers[target.supIdx]), partyType: 'supplier', remarks: 'Stock reversed on purchase delete' + (reason ? ' (' + reason + ')' : '') });
      }
      if ((target.paid || 0) > 0) {
        window.FIN.postCashBank(D, target.m || 'm_bank', target.paid);
      }
      if (D.daily?.purch?.length) {
        const di = D.daily.purch.length - 1;
        D.daily.purch[di] = Math.max(0, D.daily.purch[di] - (target.total || 0));
      }
      D.deletedPurchases = D.deletedPurchases || [];
      D.deletedPurchases.unshift({ poNo: target.no, supIdx: target.supIdx, total: target.total, deletedAt: Date.now(), reason, snapshot: window.FIN.deepClone(target) });
      D.purchases.splice(idx, 1);
      window.FIN.reconcileSupplier(target.supIdx, F);
      if (typeof LOG !== 'undefined') LOG.add({ m: 'purchase', t: 'delete', recordType: 'purchase', recordId: target.no, reason, msg: `ক্রয় মুছে ফেলা হয়েছে: ${target.no}` });
    }) : true;
    if (ok === false) return false;
    PU_DETAIL = null;
    toast(t('del_ok'), 'trash3');
    purchase();
  }, t('delete'));
};

ACT.puprint = x => {
  const found = findPurchaseRecord(x.dataset.ref || PU_DETAIL);
  if (!found || !window.UI.printDoc) return;
  const { t, L, D, tk, kg } = F;
  const r = found.raw, isL = found.kind === 'local';
  const ref = isL ? r.no : r[0], sup = D.suppliers[isL ? r.supIdx : r[1]], prod = D.products[isL ? r.prodIdx : r[2]];
  const qty = isL ? r.kg : r[3], rate = isL ? r.rate : (r[7] || r[6] || prod.cost), chg = isL ? (r.charges || 0) : (r[8] || 0);
  const tot = isL ? r.total : r[9], paid = isL ? r.paid : r[10], due = Math.max(0, tot - paid);
  const html = `<div class="inv2"><h2>PURCHASE ORDER / ${ref}</h2><hr><p><b>${t('supplier')}:</b> ${L(sup)} (${sup?.phone||'—'})</p><p><b>${t('product')}:</b> ${L(prod.n)} · ${kg(qty)} @ ${tk(rate)}</p><p><b>${t('pu_charges')}:</b> ${tk(chg)}</p><h3>${t('total')}: ${tk(tot)} | ${t('paid')}: ${tk(paid)} | ${t('due')}: ${tk(due)}</h3></div>`;
  window.UI.printDoc(html, ref);
};

/* ---------- 2. Import & LC Module ---------- */
function ships(){
  const{t,L,lg,kg,A,D}=F;
  // Filter overseas/import shipments
  const shipList = D.shipments || [];

  const shipCards = `
    <div class="d-md-none ship-mobile-list p-2">
      ${shipList.length ? shipList.map((s,i)=>`
        <div class="mob-tx-card mb-2 p-3">
          <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
            <div>
              <span class="badge bg-info-subtle text-info-emphasis border border-info-subtle fw-bold">${s[0]}</span>
              ${A()?`<small class="text-secondary ms-1"><i class="bi bi-clock me-1"></i>${lg(s[5])}</small>`:''}
            </div>
            <div>${bd(stc[s[4]],'st_'+s[4])}</div>
          </div>
          <div class="mb-2">
            ${A()?`<div class="fw-bold text-truncate" style="font-size:15px"><i class="bi bi-globe me-1 text-primary"></i>${L(D.suppliers[s[1]])}</div>`:''}
            <div class="text-secondary small mt-1"><i class="bi bi-box-seam me-1"></i>${L(D.products[s[2]].n)} • <span class="fw-semibold text-body">${A()||s[4]==='received'?kg(s[3]):'—'}</span></div>
          </div>
          ${A()?`
            <div class="d-flex gap-2 mt-2 pt-2 border-top">
              <button class="btn btn-sm btn-outline-secondary flex-fill py-2" data-act="sdocs" data-i="${i}"><i class="bi bi-paperclip me-1"></i>${t('docs')}</button>
              ${s[4]==='arrived'?`<button class="btn btn-sm btn-primary flex-fill py-2" data-act="recv" data-i="${i}"><i class="bi bi-box-arrow-in-down me-1"></i>${t('receive')}</button>`:''}
              ${s[4]==='received'?`<button class="btn btn-sm btn-outline-secondary flex-fill py-2" data-act="pret" data-i="${i}"><i class="bi bi-arrow-return-left me-1"></i>${t('pret')}</button>`:''}
            </div>`:''}
        </div>`).join('') : `<div class="text-center text-secondary py-4">${t('empty')}</div>`}
    </div>`;

  const shipTable = `
    <div class="d-none d-md-block tw">
      <table class="tbl">
        <thead>
          <tr>
            <th>${t('ship')}</th>
            ${A()?`<th>${t('supplier')}</th>`:''}
            <th>${t('product')}</th>
            <th class="r">${t(A()?'qty_kg':'qty_recv')}</th>
            ${A()?`<th>${t('eta')}</th>`:''}
            <th>${t('status')}</th>
            ${A()?'<th></th>':''}
          </tr>
        </thead>
        <tbody>
          ${shipList.map((s,i)=>`<tr><td class="fw-semibold">${s[0]}</td>${A()?`<td>${L(D.suppliers[s[1]])}</td>`:''}<td>${L(D.products[s[2]].n)}</td><td class="r">${A()||s[4]==='received'?kg(s[3]):'—'}</td>${A()?`<td>${lg(s[5])}</td>`:''}<td>${bd(stc[s[4]],'st_'+s[4])}</td>${A()?`<td class="r text-nowrap"><button class="btn-o py-1" data-act="sdocs" data-i="${i}"><i class="bi bi-paperclip"></i>${t('docs')}</button> ${s[4]==='arrived'?`<button class="btn-a py-1" data-act="recv" data-i="${i}"><i class="bi bi-box-arrow-in-down"></i>${t('receive')}</button>`:''}${s[4]==='received'?`<button class="btn-o py-1" data-act="pret" data-i="${i}"><i class="bi bi-arrow-return-left"></i>${t('pret')}</button>`:''}</td>`:''}</tr>`).join('')}
        </tbody>
      </table>
    </div>`;

  return shipCards + shipTable;
}

function lcout(){const{t,n,tk,L,D,lrow}=F,c=calc(),cs=['var(--accent)','var(--navy-chart)','var(--warn)','#8B7CF6'],seg=[c.g,c.add[0][1],c.add[1][1],c.add[2][1]+c.add[3][1]+c.add[4][1]+c.add[5][1]],curProd=(D.products&&D.products[CS.p])||(D.products&&D.products[0])||{cost:85},avg=curProd.cost||85,dl=(c.pk-avg)/avg*100;
 const outEl=$('#lc-out');if(!outEl)return;
 outEl.innerHTML=lrow(t('goods_val'),tk(c.g))+c.add.map(a=>lrow('+ '+t(a[0]),tk(a[1]))).join('')+lrow(t('landed_total'),tk(c.tot)).replace('lrow','lrow tot')+`<div class="stack mt-3">${seg.map((v,i)=>`<i title="${tk(v)}" style="width:${v/c.tot*100}%;background:${cs[i]}"></i>`).join('')}</div><div class="d-flex justify-content-between align-items-end mt-3"><div><small class="text-secondary">${t('per_kg')}</small><div class="fs-3 fw-bold">৳${n(c.pk,2)}</div></div><div class="text-end"><small class="text-secondary d-block">${t('vs_avg')}</small><b class="${dl>0?'dn':'up'}">${dl>0?'+':''}${n(dl,1)}%</b></div></div>`}

function impPage(){
  const{t,L,A,D,panel,short,n}=F;
  if(!F.can('import')){$('#view').innerHTML=`<div class="lock"><i class="bi bi-lock"></i>${t('admin_only')}</div>`;return}

  const num=(k,lb,v,st='.01')=>`<div class="col-6 col-sm-6"><label class="form-label fw-semibold text-truncate d-block" title="${lb}">${lb}</label><input type="number" min="0" step="${st}" class="form-control" data-in="c_${k}" value="${v}"></div>`;

  const sList = D.shipments || [];
  const inTransit = sList.filter(s => s[4] === 'transit').length;
  const arrived = sList.filter(s => s[4] === 'arrived').length;
  const received = sList.filter(s => s[4] === 'received').length;

  const impStrip = `
    <div class="strip strip-4 mb-3">
      <div><span>${t('import') || 'আমদানি চালান'}</span><b>${n(sList.length)}</b></div>
      <div><span>${t('st_transit')}</span><b class="text-primary">${n(inTransit)}</b></div>
      <div><span>${t('st_arrived')}</span><b class="up">${n(arrived)}</b></div>
      <div><span>${t('st_received')}</span><b class="text-success">${n(received)}</b></div>
    </div>`;

  $('#view').innerHTML=`<div class="enter"><div class="page-h flex-column flex-sm-row gap-2 align-items-start align-items-sm-center justify-content-between"><div><h2>${t('nav_import')}</h2><p>${t('imp_sub')}</p></div><div class="d-flex gap-2 w-100 w-sm-auto"><button class="btn-a flex-fill flex-sm-grow-0" data-act="impadd"><i class="bi bi-plus-lg"></i> ${t('pu_add') || 'নতুন আমদানি'}</button></div></div>${impStrip}<div class="row g-3"><div class="col-12">${panel(t('ship'),ships(),A()?'':`<span class="tag">${t('recv_only')}</span>`)}</div>
${A()?`<div class="col-12 col-xl-5 order-1 order-xl-2"><div style="position:sticky;top:80px">${panel(t('landed_total'),'<div class="panel-b" id="lc-out"></div>')}</div></div><div class="col-12 col-xl-7 order-2 order-xl-1">${panel(t('lc_title'),`<div class="panel-b row g-2 g-sm-3"><div class="col-12 col-sm-6"><label class="form-label fw-semibold">${t('product')}</label><select class="form-select" data-in="c_p">${opts(D.products.map((p,i)=>[i,L(p.n)]),CS.p)}</select></div>${num('q',t('qty_kg'),CS.q,50)}<div class="col-6 col-sm-6"><label class="form-label fw-semibold">${t('currency')}</label><select class="form-select" data-in="c_cur">${opts(['USD','RMB','BDT'].map(c=>[c,c]),CS.cur)}</select></div>${num('fp',t('fprice'),CS.fp)}${num('rate',t('xrate'),CS.rate)}${num('fr',t('freight'),CS.fr,1)}${num('duty',t('duty'),CS.duty,.5)}${num('port',t('port'),CS.port,1)}${num('clr',t('clearing'),CS.clr,1)}${num('tr',t('transport'),CS.tr,1)}${num('ot',t('other'),CS.ot,1)}</div>`,`<span class="tag">${t('lc_note')}</span>`)}</div>`:''}</div></div>`;
  if(A()) lcout();
}
P.import=f=>{init(f);impPage()};

['q','fp','rate','fr','duty','port','clr','tr','ot'].forEach(k=>IN['c_'+k]=x=>{CS[k]=+x.value;lcout()});
IN.c_p=x=>{CS.p=+x.value;lcout()};
IN.c_cur=x=>{CS.cur=x.value;CS.rate=RATE[x.value];impPage()};

ACT.recv=x=>{
  const{t,L,D,toast}=F,s=D.shipments[+x.dataset.i],p=D.products[s[2]],sup=D.suppliers[s[1]];
  if(!s||s[4]==='received')return;
  const runner=()=>{
    s[4]='received';
    if(window.FIN){
      window.FIN.recordStockMove(F,{p:s[2],qty:s[3],isIn:true,kind:'purchase',ty:t('imp_recv')||'Import Received',ref:s[0],purchRef:s[0],party:sup?L(sup):'Supplier',partyType:'supplier',remarks:'Import shipment received'});
    }else if(p){p.kg+=s[3];}
    D.act.unshift(['bi-box-arrow-in-down',false,`${p.n.bn} ${s[3].toLocaleString('bn-BD')} কেজি স্টকে গ্রহণ (${s[0]})`,`${p.n.en} ${s[3].toLocaleString('en-IN')} KG received (${s[0]})`,'এইমাত্র','Just now']);
    D.act.length=Math.min(D.act.length,5);
  };
  if(window.FIN?window.FIN.tx(F,runner):(runner(),true)===false)return;
  toast(t('recv_done'),'check-circle');
  if(location.hash==='#/import') impPage();
  else purchase();
};

/* Action to add Import Shipment */
ACT.impadd=()=>{
  const{t,L,D}=F;
  const overseasSups = D.suppliers.map((s,i)=>({s,i})).filter(x=>x.s.type==='overseas');
  const sups = overseasSups.length ? overseasSups : D.suppliers.map((s,i)=>({s,i}));
  const body=`<div class="row g-2 g-sm-3">
    <div class="col-12 col-sm-6">${field('imp_sup',t('supplier'),`<select id="imp_sup" class="form-select">${opts(sups.map(x=>[x.i,L(x.s)]))}</select>`)}</div>
    <div class="col-12 col-sm-6">${field('imp_prod',t('product'),`<select id="imp_prod" class="form-select">${opts(D.products.map((p,i)=>[i,L(p.n)]))}</select>`)}</div>
    <div class="col-6 col-sm-6">${field('imp_kg',t('qty_kg'),'<input id="imp_kg" type="number" min="100" class="form-control" value="15000">')}</div>
    <div class="col-6 col-sm-6">${field('imp_cur',t('currency'),`<select id="imp_cur" class="form-select">${opts(['USD','RMB','BDT'].map(c=>[c,c]))}</select>`)}</div>
    <div class="col-6 col-sm-6">${field('imp_fp',t('fprice'),'<input id="imp_fp" type="number" step="0.01" class="form-control" value="1.10">')}</div>
    <div class="col-6 col-sm-6">${field('imp_eta',t('eta'),'<input id="imp_eta" class="form-control" value="১৫ দিন / 15 Days">')}</div>
  </div>`;
  modal(t('ship')+' – '+t('save'), body, ()=>{
    const supIdx = +$('#imp_sup').value;
    const prodIdx = +$('#imp_prod').value;
    const kg = +$('#imp_kg').value;
    const cur = $('#imp_cur').value;
    const fp = +$('#imp_fp').value || 1;
    const eta = $('#imp_eta').value.trim() || '১৫ দিন';
    if(!(kg>0)){F.toast(t('pos_qty'),'exclamation-triangle');return false}
    const rate = RATE[cur] || 122;
    const estGoods = Math.round(kg * fp * rate);
    const estTotal = estGoods + 300000;
    const shipId = 'SH-0' + (458 + D.shipments.length);
    D.shipments.unshift([shipId, supIdx, prodIdx, kg, 'transit', [eta, eta], fp, 300000, estTotal, 0, estTotal]);
    F.toast(t('saved'), 'check-circle');
    impPage();
  }, t('save'));
};

/* ---------- 3. Suppliers ---------- */
function suppliers(){const{t,L,D,A,tk,short,n,panel}=F;
 if(!F.can('suppliers')){$('#view').innerHTML=`<div class="lock"><i class="bi bi-lock"></i>${t('admin_only')}</div>`;return}
 const s=(l,v)=>`<div><span>${t(l)}</span><b>${v}</b></div>`,ov=D.suppliers.filter(x=>x.type==='overseas');

 const supCards = `
   <div class="d-md-none sup-mobile-list p-2">
     ${D.suppliers.map((x,i)=>`
       <div class="mob-tx-card mb-2 p-3">
         <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
           <div>
             <b class="fs-6 d-block">${L(x)}</b>
             <small class="text-secondary"><i class="bi bi-telephone me-1"></i>${x.phone}</small>
           </div>
           <div>${bd(x.type==='overseas'?'info':'paid',x.type)}</div>
         </div>
         <div class="p-2 rounded border bg-surface-2 d-flex justify-content-between align-items-center mb-2">
           <span class="small text-secondary">${t('due_amt')} (${x.cur}):</span>
           <b class="fs-6 ${x.payable>0?'dn':'up'}">${tk(x.payable)}</b>
         </div>
         <div class="d-flex gap-1 flex-wrap pt-2 border-top">
           <button class="btn btn-sm btn-primary flex-fill py-2" data-act="spay" data-i="${i}" ${x.payable<=0?'disabled':''}><i class="bi bi-wallet2 me-1"></i>${t('pay')}</button>
           <button class="btn btn-sm btn-outline-secondary flex-fill py-2" data-act="sstmt" data-i="${i}"><i class="bi bi-journal-text me-1"></i>${t('statement')}</button>
           <button class="icon-btn ib" data-act="sedit" data-i="${i}" aria-label="${t('edit')}"><i class="bi bi-pencil"></i></button>
           <button class="icon-btn ib" data-act="sdel" data-i="${i}" aria-label="${t('delete')}"><i class="bi bi-trash3"></i></button>
         </div>
       </div>`).join('')}
   </div>`;

 const supTable = `
   <div class="d-none d-md-block tw">
     <table class="tbl">
       <thead>
         <tr>
           <th>${t('supplier')}</th>
           <th>${t('type')}</th>
           <th>${t('currency')}</th>
           <th class="r">${t('due_amt')}</th>
           <th></th>
         </tr>
       </thead>
       <tbody>
         ${D.suppliers.map((x,i)=>`<tr><td><b>${L(x)}</b><br><small class="text-secondary">${x.phone}</small></td><td>${bd(x.type==='overseas'?'info':'paid',x.type)}</td><td>${x.cur}</td><td class="r fw-semibold">${tk(x.payable)}</td><td class="r text-nowrap"><button class="btn-a py-1" data-act="spay" data-i="${i}" ${x.payable<=0?'disabled':''}><i class="bi bi-wallet2"></i>${t('pay')}</button> <button class="btn-o py-1" data-act="sstmt" data-i="${i}"><i class="bi bi-journal-text"></i>${t('statement')}</button> <button class="icon-btn ib" data-act="sedit" data-i="${i}" aria-label="${t('edit')}"><i class="bi bi-pencil"></i></button> <button class="icon-btn ib" data-act="sdel" data-i="${i}" aria-label="${t('delete')}"><i class="bi bi-trash3"></i></button></td></tr>`).join('')}
       </tbody>
     </table>
   </div>`;

 $('#view').innerHTML=`<div class="enter"><div class="page-h flex-column flex-sm-row gap-2 align-items-start align-items-sm-center justify-content-between"><div><h2>${t('nav_suppliers')}</h2><p>${t('s_sub')}</p></div><button class="btn-a flex-sm-grow-0" data-act="sadd"><i class="bi bi-plus-lg"></i>${t('add_supplier')}</button></div>${panel('',`<div class="strip strip-4">${s('payable',short(sum(D.suppliers.map(x=>x.payable))))}${s('overseas',short(sum(ov.map(x=>x.payable))))}${s('local',short(sum(D.suppliers.filter(x=>x.type==='local').map(x=>x.payable))))}${s('nav_suppliers',n(D.suppliers.length))}</div>` + supCards + supTable)}</div>`}
P.suppliers=f=>{init(f);suppliers()};
ACT.spay=x=>{const{t,L,D,tk,toast,lrow}=F,supIdx=+x.dataset.i,s=D.suppliers[supIdx];if(!s)return;
 modal(t('pay_title')+' – '+L(s),lrow(t('due_amt'),tk(s.payable),'dn')+field('pa',t('pay_amt'),`<input id="pa" type="number" min="0" class="form-control" value="${s.payable}">`)+field('pm',t('method'),`<select id="pm" class="form-select">${opts(['m_bank','m_cash','m_cheque','m_bkash'].map(k=>[k,t(k)]))}</select>`)+field('pr',t('pay_ref')||'Reference','<input id="pr" class="form-control" placeholder="TXN / Cheque">'),()=>{
  const a=+$('#pa').value,m=$('#pm').value,cb=D.cashBank;$('#pa').classList.remove('is-invalid');
  if(!(a>0))return !bad('pa',t('pos_qty'));if(a>s.payable)return !bad('pa',t('max_due'));if(m==='m_cash'&&a>cb.cash)return !bad('pa',t('insuf'));
  if(window.FIN){
    const ok=window.FIN.addSupplierAdjustment(F,{supIdx,type:'payment',amt:a,method:m,ref:($('#pr')?.value||'').trim(),desc:'Supplier payable payment'});
    if(ok===false)return false;
  }else{
    s.payable-=a;cb.payable-=a;m==='m_cash'?cb.cash-=a:cb.bank-=a;s.tx.push(['m',a,['আজ','Today']]);
  }
  toast(t('pay_done'),'check-circle');suppliers()},t('pay'))};
ACT.sstmt=x=>{const supIdx=+x.dataset.i;if(window.UI.openSupplierStatement){window.UI.openSupplierStatement(supIdx,'suppliers');return}
 const{t,L,lg,D,tk}=F,s=D.suppliers[supIdx];let b=0;
 modal(t('statement')+' – '+L(s),`<div class="tw"><table class="tbl"><thead><tr><th>${t('date')}</th><th>${t('type')}</th><th class="r">${t('amount')}</th><th class="r">${t('balance')}</th></tr></thead><tbody>${s.tx.map(r=>{b+=r[0]==='p'?r[1]:-r[1];return `<tr><td>${lg(r[2])}</td><td>${t('tx_'+r[0])}</td><td class="r ${r[0]!=='p'?'up':''}">${r[0]!=='p'?'−':''}${tk(r[1])}</td><td class="r fw-semibold">${tk(b)}</td></tr>`}).join('')}</tbody></table></div>`)};
window.UI.init2=init;
})();
