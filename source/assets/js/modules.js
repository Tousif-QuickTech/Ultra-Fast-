/* Phase 2 pages: Products & Stock, New Invoice, Customers & Dues. Registered on window.PAGES; F = shared helpers from app.js */
(()=>{
const P=window.PAGES={},ACT={},IN={};let F;
const $=(s,r=document)=>r.querySelector(s),sum=a=>a.reduce((x,y)=>x+y,0);
function boot(f){if(F)return;F=f;const ph=['01711-284501','01819-662340','01912-557781','01678-300912','01555-421098'],lim=[3000000,2500000,1500000,1200000,2000000];
 F.D.products.forEach((p,i)=>p.sku='PK-'+(101+i));F.D.customers.forEach((c,i)=>{c.phone=ph[i];c.limit=lim[i]})}
function modal(title,body,fn,okl){$('#mt').textContent=title;$('#mb').innerHTML=body;$('#mf').innerHTML=`<button class="btn-o" data-bs-dismiss="modal">${F.t('cancel')}</button>`+(fn?`<button class="btn-a" id="mok">${okl||F.t('save')}</button>`:'');
 const m=bootstrap.Modal.getOrCreateInstance('#modal');if(fn)$('#mok').onclick=()=>{if(fn()!==false)m.hide()};m.show()}
const bd=(c,l)=>`<span class="st ${c}">${F.t(l)}</span>`;
const field=(id,lb,inner)=>`<div class="mb-3"><label class="form-label fw-semibold" for="${id}">${lb}</label>${inner}<div class="invalid-feedback" id="${id}-e"></div></div>`;
const bad=(id,m)=>{$('#'+id).classList.add('is-invalid');$('#'+id+'-e').textContent=m;return true};
const opts=(a,sel)=>a.map(([v,l])=>`<option value="${v}" ${v==sel?'selected':''}>${l}</option>`).join('');
/* ================= Products & Stock ================= */
const PS={q:'',cat:'',k:'name',d:1,pg:1,tab:'all'};
function ptable(){const{t,L,kg,tk,A,D,n}=F;
 let l=D.products.map((p,i)=>({p,i})).filter(({p})=>(!PS.cat||p.cat===PS.cat)&&(PS.tab==='all'||p.kg<p.min)&&(p.n.bn+p.n.en+p.sku).toLowerCase().includes(PS.q.toLowerCase()));
 const v=({p})=>PS.k==='name'?L(p.n):p[PS.k];l.sort((a,b)=>(v(a)>v(b)?1:v(a)<v(b)?-1:0)*PS.d);
 const sz=5,pgs=Math.max(1,Math.ceil(l.length/sz));PS.pg=Math.min(PS.pg,pgs);const rows=l.slice((PS.pg-1)*sz,PS.pg*sz);
 const th=(k,lb,c='')=>`<th class="thsort ${c}" data-act="sort" data-k="${k}">${t(lb)}${PS.k===k?(PS.d>0?' ↑':' ↓'):''}</th>`;
 return `<div class="tw"><table class="tbl"><thead><tr>${th('sku','sku')}${th('name','product')}${th('kg','stock','r')}<th style="width:150px">${t('min')}</th>${A()?th('cost','avgcost','r'):''}<th>${t('status')}</th><th></th></tr></thead><tbody>${rows.length?rows.map(({p,i})=>`<tr><td class="text-secondary"><a href="javascript:void(0)" class="fw-bold text-decoration-none" data-act="pview" data-i="${i}" title="${t('product_summary')}">${p.sku}</a></td><td><a href="javascript:void(0)" class="text-decoration-none text-body" data-act="pview" data-i="${i}" title="${t('product_summary')}"><b>${L(p.n)}</b></a><br><small class="text-secondary">${t('cat_'+p.cat)}</small></td><td class="r fw-semibold">${kg(p.kg)}</td><td><div class="bar"><i style="width:${Math.min(100,p.kg/p.min*50)}%;background:${p.kg<p.min?'var(--danger)':'var(--ok)'}"></i></div><small class="text-secondary">${kg(p.min)}</small></td>${A()?`<td class="r">${tk(p.cost)}</td>`:''}<td>${bd(p.kg<p.min?'due':'paid',p.kg<p.min?'lowst':'ok')}</td><td class="r text-nowrap"><button class="btn btn-sm btn-outline-primary py-1 px-2" data-act="pview" data-i="${i}" title="${t('product_summary')}"><i class="bi bi-eye"></i></button> <button class="btn-o py-1" data-act="adj" data-i="${i}"><i class="bi bi-sliders"></i>${t('adjust')}</button> <button class="icon-btn ib" data-act="pedit" data-i="${i}" aria-label="${t('edit')}"><i class="bi bi-pencil"></i></button> <button class="icon-btn ib" data-act="pdel" data-i="${i}" aria-label="${t('delete')}"><i class="bi bi-trash3"></i></button></td></tr>`).join(''):`<tr><td colspan="7" class="text-center text-secondary py-5"><i class="bi bi-inbox fs-3 d-block"></i>${t('empty')}</td></tr>`}</tbody></table></div><div class="d-flex justify-content-between align-items-center p-3 border-top"><small class="text-secondary">${n(l.length)} ${t('items')}</small><div class="seg">${[...Array(pgs)].map((_,i)=>`<button data-act="pg" data-p="${i+1}" class="${PS.pg===i+1?'on':''}">${n(i+1)}</button>`).join('')}</div></div>`}
function prod(){const{t,D,A,kg,short,n}=F,low=D.products.filter(p=>p.kg<p.min).length,s=(l,v,c='')=>`<div><small class="text-secondary d-block">${t(l)}</small><b class="fs-5 ${c}">${v}</b></div>`;
 $('#view').innerHTML=`<div class="enter"><div class="page-h"><div><h2>${t('nav_products')}</h2><p>${t('p_sub')}</p></div><div class="d-flex gap-4 flex-wrap align-items-center"><button class="btn-a" data-act="padd"><i class="bi bi-plus-lg"></i>${t('add_product')}</button>${s('total_stock',kg(sum(D.products.map(p=>p.kg))))}${A()?s('stock_value',short(sum(D.products.map(p=>p.kg*p.cost)))):''}${s('low_stock',n(low),'dn')}</div></div>
<section class="panel"><div class="panel-h flex-wrap gap-2"><div class="seg">${[['all','all'],['low','low_stock']].map(([k,l])=>`<button data-act="tab" data-k="${k}" class="${PS.tab===k?'on':''}">${t(l)}</button>`).join('')}</div>
<div class="d-flex gap-2 flex-wrap"><label class="search" style="width:240px"><i class="bi bi-search"></i><input data-in="pq" value="${PS.q}" placeholder="${t('search_p')}"></label><select class="form-select w-auto" data-in="pcat"><option value="">${t('allcat')}</option>${opts(['paper','board','film','raw'].map(c=>[c,t('cat_'+c)]),PS.cat)}</select></div></div><div id="pwrap">${ptable()}</div></section>${A()?'':`<div class="lock mt-3"><i class="bi bi-lock"></i>${t('hidden')}</div>`}</div>`}
P.products=f=>{boot(f);prod()};
ACT.sort=x=>{PS.d=PS.k===x.dataset.k?-PS.d:1;PS.k=x.dataset.k;$('#pwrap').innerHTML=ptable()};
ACT.pg=x=>{PS.pg=+x.dataset.p;$('#pwrap').innerHTML=ptable()};ACT.tab=x=>{PS.tab=x.dataset.k;PS.pg=1;prod()};
IN.pq=x=>{PS.q=x.value;PS.pg=1;$('#pwrap').innerHTML=ptable()};IN.pcat=x=>{PS.cat=x.value;PS.pg=1;$('#pwrap').innerHTML=ptable()};
ACT.adj=x=>{const{t,L,kg,D,toast}=F,p=D.products[+x.dataset.i];
 modal(t('adjust')+' – '+L(p.n),`<div class="lrow"><span class="l">${t('stock')}</span><span class="ld"></span><span class="v">${kg(p.kg)}</span></div>`+field('at',t('adj_type'),`<select id="at" class="form-select">${opts([['damage',t('adj_damage')],['short',t('adj_short')],['waste',t('adj_waste')],['add',t('adj_add')]])}</select>`)+field('aq',t('qty_kg'),'<input id="aq" type="number" min="0" class="form-control">')+field('ar',t('reason'),'<input id="ar" class="form-control">'),()=>{
  const q=+$('#aq').value,add=$('#at').value==='add';['aq','ar'].forEach(i=>$('#'+i).classList.remove('is-invalid'));let e=0;
  if(!(q>0))e=bad('aq',t('pos_qty'));else if(!add&&q>p.kg)e=bad('aq',t('exceed'));if(!$('#ar').value.trim())e=bad('ar',t('req'));if(e)return false;
  p.kg+=add?q:-q;toast(t('adj_done'),'check-circle');prod()})};

/* ================= Product Details – Complete Summary (Req 5) ================= */
ACT.pview = (x) => {
  const { t, L, kg, tk, D, short, n } = F;
  const idx = +x.dataset.i;
  const p = D.products[idx];
  if (!p) return;

  const statusBadge = p.kg <= 0
    ? '<span class="badge bg-danger">স্টক শেষ / Out of Stock</span>'
    : (p.kg < p.min ? '<span class="badge bg-warning text-dark">স্বল্প স্টক / Low Stock</span>' : '<span class="badge bg-success">স্টকে পর্যাপ্ত / In Stock</span>');

  const prodInvs = (D.invoices || []).filter(v => v[6] && v[6].some(l => l.p === idx));
  let totalSoldFromInvs = 0, totalSalesValFromInvs = 0;
  prodInvs.forEach(v => {
    (v[6] || []).filter(l => l.p === idx).forEach(l => {
      totalSoldFromInvs += l.q;
      totalSalesValFromInvs += (l.q * l.pr);
    });
  });
  const totalSoldKg = Math.max(p.sold || 0, totalSoldFromInvs);
  const totalSalesVal = totalSalesValFromInvs || (totalSoldKg * p.price);

  const prodShips = (D.shipments || []).filter(s => s[2] === idx);
  const totalPurchKg = sum(prodShips.map(s => s[3]));
  const totalPurchVal = sum(prodShips.map(s => Math.round(s[3] * (s[6] || p.cost))));
  const suppliersNames = prodShips.map(s => L(D.suppliers[s[1]])).filter((v, i, a) => a.indexOf(v) === i).join(', ') || '—';

  const historyEvents = [];
  const estimatedOpening = Math.max(0, p.kg + totalSoldFromInvs - totalPurchKg);
  historyEvents.push({
    ts: Date.now() - 35 * 86400000,
    dateStr: new Date(Date.now() - 35 * 86400000).toLocaleDateString(F.S.lang==='bn'?'bn-BD':'en-IN',{day:'2-digit',month:'short',year:'numeric'}),
    type: 'opening',
    ref: 'OPEN-001',
    qtyChange: estimatedOpening,
    party: 'Ultra Fast Central Warehouse',
    remarks: 'Opening Balance Setup'
  });

  prodShips.forEach((s, sIdx) => {
    const sDate = new Date(2026, 9, 20 + sIdx * 3, 10, 30);
    historyEvents.push({
      ts: sDate.getTime(),
      dateStr: sDate.toLocaleDateString(F.S.lang==='bn'?'bn-BD':'en-IN',{day:'2-digit',month:'short',year:'numeric'}),
      type: 'purchase',
      ref: s[0],
      qtyChange: s[3],
      party: D.suppliers[s[1]] ? L(D.suppliers[s[1]]) : 'Supplier',
      remarks: `Purchase Shipment (${s[4] || 'arrived'}) @ ${tk(s[6] || p.cost)}/KG`
    });
  });

  prodInvs.forEach((v) => {
    const l = (v[6] || []).find(x => x.p === idx);
    if (!l) return;
    const invIdx = D.invoices.indexOf(v);
    historyEvents.push({
      ts: v.createdTs || (Date.now() - 5 * 86400000),
      dateStr: v.dateStr || new Date().toLocaleDateString(F.S.lang==='bn'?'bn-BD':'en-IN',{day:'2-digit',month:'short',year:'numeric'}),
      type: 'sale',
      ref: v[0],
      challan: v.challan || '',
      invIdx: invIdx,
      qtyChange: -l.q,
      party: D.customers[v[1]] ? L(D.customers[v[1]]) : 'Customer',
      remarks: `Sales Invoice (${v.challan ? 'Challan: ' + v.challan : 'Standard'}) @ ${tk(l.pr)}/KG`
    });
  });

  if (p.adjHistory) {
    p.adjHistory.forEach(a => historyEvents.push(a));
  }

  historyEvents.sort((a, b) => a.ts - b.ts);
  let running = 0;
  historyEvents.forEach(ev => {
    ev.prevStock = running;
    running += ev.qtyChange;
    ev.updatedStock = running;
  });

  const displayEvents = [...historyEvents].reverse();

  const historyRowsHtml = displayEvents.map(ev => {
    const isPositive = ev.qtyChange > 0;
    const typeBadge = ev.type === 'purchase'
      ? '<span class="badge bg-success-subtle text-success border"><i class="bi bi-box-arrow-in-down me-1"></i>Stock In (Purchase)</span>'
      : ev.type === 'sale'
      ? '<span class="badge bg-danger-subtle text-danger border"><i class="bi bi-receipt me-1"></i>Stock Out (Sale)</span>'
      : ev.type === 'opening'
      ? '<span class="badge bg-primary-subtle text-primary border"><i class="bi bi-database me-1"></i>Opening Stock</span>'
      : '<span class="badge bg-warning-subtle text-warning border"><i class="bi bi-sliders me-1"></i>Adjustment</span>';

    const refHtml = ev.type === 'sale' && ev.invIdx !== undefined && ev.invIdx >= 0
      ? `<a href="javascript:void(0)" class="fw-bold text-decoration-none" data-act="idetail" data-i="${ev.invIdx}" title="View Invoice">${ev.ref}</a>`
      : `<code>${ev.ref}</code>`;

    return `
      <tr>
        <td class="small text-secondary">${ev.dateStr}</td>
        <td>${typeBadge}</td>
        <td>${refHtml} ${ev.challan ? `<span class="badge bg-light text-dark border ms-1">${ev.challan}</span>` : ''}</td>
        <td class="r fw-bold ${isPositive ? 'up' : 'dn'}">${isPositive ? '+' : ''}${kg(ev.qtyChange)}</td>
        <td class="r text-secondary">${kg(ev.prevStock)}</td>
        <td class="r fw-semibold text-dark">${kg(ev.updatedStock)}</td>
        <td class="small"><b>${ev.party}</b><br><span class="text-secondary">${ev.remarks}</span></td>
      </tr>`;
  }).join('');

  const modalHtml = `
    <div class="product-details-summary p-1">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 p-3 rounded mb-3 border" style="background:var(--surface-2)">
        <div class="d-flex align-items-center gap-3">
          <div style="width:52px;height:52px;border-radius:12px;background:rgba(44,197,190,0.15);display:flex;align-items:center;justify-content:center;font-size:24px;color:#2CC5BE">
            <i class="bi bi-box-seam"></i>
          </div>
          <div>
            <h4 class="mb-0 fw-bold">${L(p.n)}</h4>
            <div class="d-flex align-items-center gap-2 mt-1">
              <span class="badge bg-secondary-subtle text-secondary border"><code>${p.sku}</code></span>
              <span class="badge bg-info-subtle text-info border">${t('cat_' + p.cat)}</span>
              ${statusBadge}
            </div>
          </div>
        </div>
        <div class="text-end">
          <small class="text-secondary d-block">${t('stock_overview')}</small>
          <b class="fs-4 text-primary">${kg(p.kg)}</b>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-md-6 col-lg-3">
          <div class="card h-100 border shadow-sm">
            <div class="card-body p-3">
              <h6 class="fw-bold text-secondary mb-2"><i class="bi bi-tag me-1 text-primary"></i>A. Pricing & Margins</h6>
              <div class="lrow"><span class="text-secondary">${t('cost_price')}</span><b>${tk(p.cost)} / KG</b></div>
              <div class="lrow"><span class="text-secondary">${t('sell_price')}</span><b>${tk(p.price)} / KG</b></div>
              <div class="lrow"><span class="text-secondary">Gross Margin</span><b class="up">+${tk(p.price - p.cost)} (${((p.price - p.cost)/p.cost*100).toFixed(1)}%)</b></div>
              <div class="lrow"><span class="text-secondary">Min Threshold</span><span>${kg(p.min)}</span></div>
            </div>
          </div>
        </div>

        <div class="col-md-6 col-lg-3">
          <div class="card h-100 border shadow-sm">
            <div class="card-body p-3">
              <h6 class="fw-bold text-secondary mb-2"><i class="bi bi-boxes me-1 text-primary"></i>B. Stock Overview</h6>
              <div class="lrow"><span class="text-secondary">Available Stock</span><b class="fs-6 text-primary">${kg(p.kg)}</b></div>
              <div class="lrow"><span class="text-secondary">Valuation (Cost)</span><b>${short(p.kg * p.cost)}</b></div>
              <div class="lrow"><span class="text-secondary">Valuation (Retail)</span><b>${short(p.kg * p.price)}</b></div>
              <div class="bar mt-2"><i style="width:${Math.min(100, p.kg/p.min*50)}%;background:${p.kg<p.min?'var(--danger)':'var(--ok)'}"></i></div>
            </div>
          </div>
        </div>

        <div class="col-md-6 col-lg-3">
          <div class="card h-100 border shadow-sm">
            <div class="card-body p-3">
              <h6 class="fw-bold text-secondary mb-2"><i class="bi bi-receipt me-1 text-primary"></i>C. Sales Performance</h6>
              <div class="lrow"><span class="text-secondary">Total Sold Qty</span><b class="fs-6">${kg(totalSoldKg)}</b></div>
              <div class="lrow"><span class="text-secondary">Total Sales Value</span><b class="up">${short(totalSalesVal)}</b></div>
              <div class="lrow"><span class="text-secondary">Invoices Count</span><b>${n(prodInvs.length)}</b></div>
              <div class="lrow"><span class="text-secondary">Avg Selling Price</span><b>${tk(p.price)} / KG</b></div>
            </div>
          </div>
        </div>

        <div class="col-md-6 col-lg-3">
          <div class="card h-100 border shadow-sm">
            <div class="card-body p-3">
              <h6 class="fw-bold text-secondary mb-2"><i class="bi bi-truck me-1 text-primary"></i>D. Purchase Summary</h6>
              <div class="lrow"><span class="text-secondary">Total Purchased</span><b class="fs-6">${kg(totalPurchKg)}</b></div>
              <div class="lrow"><span class="text-secondary">Total Purchase Cost</span><b>${short(totalPurchVal)}</b></div>
              <div class="lrow"><span class="text-secondary">Shipments</span><b>${n(prodShips.length)} shipments</b></div>
              <div class="lrow"><span class="text-secondary">Key Supplier</span><small class="text-truncate" style="max-width:120px">${suppliersNames}</small></div>
            </div>
          </div>
        </div>
      </div>

      <div class="card border shadow-sm">
        <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h6 class="fw-bold mb-0 text-primary">
            <i class="bi bi-clock-history me-2"></i>E. Complete Chronological History (Stock In & Out)
          </h6>
          <span class="badge bg-secondary-subtle text-secondary border">${n(displayEvents.length)} History Records</span>
        </div>
        <div class="tw" style="max-height:360px;overflow-y:auto">
          <table class="tbl mb-0">
            <thead>
              <tr>
                <th>Date</th>
                <th>Activity Type</th>
                <th>Reference</th>
                <th class="r">Quantity Change</th>
                <th class="r">Previous Stock</th>
                <th class="r">Updated Balance</th>
                <th>Party & Details</th>
              </tr>
            </thead>
            <tbody>
              ${historyRowsHtml || `<tr><td colspan="7" class="text-center py-4 text-muted">No transaction history recorded yet</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  modal(t('product_summary') + ' – ' + L(p.n), modalHtml, null, null);
  const mEl = document.querySelector('#modal .modal-dialog');
  if (mEl) {
    mEl.classList.remove('modal-sm');
    mEl.classList.add('modal-xl');
  }
};

/* ================= New & Edit Sales Invoice Interface (Req 1, 3, 4) ================= */
const IV={method:'m_cash',c:0,lines:[{p:0,q:1000,pr:null}],disc:0,carry:0,vat:5,mode:'credit',paid:0,no:1185,challan:'CH-405',editingIdx:undefined};
const price=l=>l.pr??F.D.products[l.p].price;
function isVatOn(){return localStorage.getItem('fms-vat-enabled')==='true'&&(window.UI?.ST?.inv?.vatEnabled===true)}
function tot(){
  const{D}=F;
  const c=D.customers&&D.customers[IV.c];
  const prevDue=(c&&typeof c.due==='number')?c.due:0;
  const sub=sum(IV.lines.map(l=>l.q*price(l))),da=sub*(IV.disc||0)/100;
  const v=isVatOn()?(sub-da)*(IV.vat||0)/100:0;
  const g=sub-da+v+(IV.carry||0);
  const totalPayable=g+prevDue;
  const paid=IV.mode==='cash'?g:IV.mode==='credit'?0:Math.min(IV.paid||0,totalPayable);
  const closingDue=Math.max(0,totalPayable-paid);
  const due=Math.max(0,g-paid);
  return{sub,da,v,g,prevDue,totalPayable,paid,due,closingDue,pr:sum(IV.lines.map(l=>l.q*(price(l)-D.products[l.p].cost)))-da};
}
const lrows=()=>{
  const{t,L,D,kg}=F;
  return IV.lines.map((l,i)=>`
    <tr>
      <td style="min-width:240px">
        <select class="form-select form-select-sm" data-in="lp" data-i="${i}">${opts(D.products.map((x,j)=>[j,`${L(x.n)} (${x.sku})`]),l.p)}</select>
        <div class="small mt-1 text-secondary"><i class="bi bi-box me-1"></i>${t('stock')}: <b>${kg(D.products[l.p].kg)}</b></div>
      </td>
      <td>
        <div class="input-group input-group-sm" style="width:125px">
          <input type="number" min="1" step="10" class="form-control" id="lq${i}" data-in="lq" data-i="${i}" value="${l.q}">
          <span class="input-group-text">${t('kg')}</span>
        </div>
      </td>
      <td>
        <div class="input-group input-group-sm" style="width:115px">
          <span class="input-group-text">৳</span>
          <input type="number" min="0" class="form-control" data-in="lpr" data-i="${i}" value="${price(l)}">
        </div>
      </td>
      <td class="r fw-bold fs-6 text-dark" id="lt${i}"></td>
      <td class="text-center" style="width:40px">
        <button class="btn btn-sm btn-outline-danger p-1" style="width:28px;height:28px;line-height:1" aria-label="Remove" data-act="rm" data-i="${i}">
          <i class="bi bi-trash3"></i>
        </button>
      </td>
    </tr>
  `).join('');
};

function inv(){
  const{t,L,D,A,lrow}=F,isEdit=IV.editingIdx!==undefined,vatActive=isVatOn();
  const c=D.customers[IV.c];
  $('#view').innerHTML=`
    <div class="enter invoice-creation-page">
      <!-- Minimal Modern Header -->
      <div class="page-h d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
        <div class="d-flex align-items-center gap-3">
          <button class="btn-o" data-act="ilist"><i class="bi bi-arrow-left me-1"></i>${t('inv_list')}</button>
          <div>
            <h2 class="mb-0">${isEdit?t('edit_invoice'):t('new_invoice')}</h2>
            <small class="text-secondary">${t('i_sub')}</small>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-outline-primary" data-act="inv-prev">
            <i class="bi bi-eye me-1"></i>${t('preview_draft') || 'Preview Invoice'}
          </button>
          <span class="badge bg-primary-subtle text-primary border px-3 py-2 fs-6">INV-2026-${IV.no}</span>
          ${isEdit?'<span class="badge bg-warning-subtle text-warning border px-2 py-1">Editing Mode</span>':''}
        </div>
      </div>

      <div class="row g-3">
        <!-- Main Form Column (Left) -->
        <div class="col-xl-8 stk d-flex flex-column gap-3">

          <!-- 1. Client Selection & Dispatch Card -->
          <div class="card border shadow-sm">
            <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
              <span class="fw-bold text-primary"><i class="bi bi-person-badge me-2"></i>${t('billed_to')} & Dispatch</span>
              <small class="text-secondary">Step 1</small>
            </div>
            <div class="card-body p-3">
              <div class="row g-3">
                <div class="col-md-7">
                  <label class="form-label fw-semibold mb-1">${t('sel_cust')}</label>
                  <select class="form-select" data-in="cust">${opts(D.customers.map((x,i)=>[i,`${L(x)} · ${x.phone||''}`]),IV.c)}</select>
                </div>
                <div class="col-md-5">
                  <label class="form-label fw-semibold mb-1"><i class="bi bi-truck me-1 text-primary"></i>${t('challan_no')} <span class="text-danger">*</span></label>
                  <input class="form-control" data-in="challan" value="${IV.challan||''}" placeholder="e.g. CH-405">
                </div>
                <div class="col-12" id="cinfo"></div>
              </div>
            </div>
          </div>

          <!-- 2. Product Selection & Quantities Card -->
          <div class="card border shadow-sm">
            <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
              <span class="fw-bold text-primary"><i class="bi bi-boxes me-2"></i>${t('lines')}</span>
              <button class="btn btn-sm btn-outline-primary" data-act="add"><i class="bi bi-plus-lg me-1"></i>${t('add_line')}</button>
            </div>
            <div class="tw">
              <table class="tbl mb-0" id="inv-lines-table">
                <thead>
                  <tr>
                    <th>${t('product')}</th>
                    <th>${t('qty_kg')}</th>
                    <th>${t('price')} / KG</th>
                    <th class="r">${t('total')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${lrows()}
                </tbody>
              </table>
            </div>
            <div class="p-2 border-top bg-light text-end">
              <button class="btn btn-sm btn-outline-primary" data-act="add"><i class="bi bi-plus-lg me-1"></i>${t('add_line')}</button>
            </div>
          </div>

          <!-- 3. Additional Charges & Payment Settlement Card -->
          <div class="card border shadow-sm">
            <div class="card-header bg-white py-2">
              <span class="fw-bold text-primary"><i class="bi bi-credit-card me-2"></i>${t('charges')} & ${t('payment')}</span>
            </div>
            <div class="card-body p-3">
              <div class="row g-3">
                <div class="${vatActive?'col-sm-4':'col-sm-6'} col-6">
                  <label class="form-label fw-semibold mb-1">${t('discount')} (%)</label>
                  <input type="number" min="0" max="100" class="form-control" data-in="disc" value="${IV.disc||0}">
                </div>
                <div class="${vatActive?'col-sm-4':'col-sm-6'} col-6">
                  <label class="form-label fw-semibold mb-1">${t('carry')} (৳)</label>
                  <input type="number" min="0" class="form-control" data-in="carry" value="${IV.carry||0}">
                </div>
                ${vatActive ? `
                  <div class="col-sm-4 col-12">
                    <label class="form-label fw-semibold mb-1">${t('vat')} (%)</label>
                    <input type="number" min="0" class="form-control" data-in="vat" value="${IV.vat||5}">
                  </div>` : ''}
              </div>

              <hr class="my-3">

              <div class="row g-3 align-items-end">
                <div class="col-md-5">
                  <label class="form-label fw-semibold mb-1 d-block">${t('payment')} Mode</label>
                  <div class="seg w-100">
                    ${[['cash','pm_cash'],['credit','pm_credit'],['part','pm_part']].map(([k,l])=>`
                      <button data-act="mode" data-m="${k}" class="${IV.mode===k?'on':''} flex-fill">${t(l)}</button>
                    `).join('')}
                  </div>
                </div>
                <div class="col-md-4" id="mw" style="${IV.mode==='credit'?'display:none':''}">
                  <label class="form-label fw-semibold mb-1">${t('method')}</label>
                  <select class="form-select" data-in="imethod">${opts(F.methods().map(k=>[k,t(k)]),IV.method)}</select>
                </div>
                <div class="col-md-3" id="paidw" style="${IV.mode==='part'?'':'display:none'}">
                  <label class="form-label fw-semibold mb-1">${t('paid_now')} (৳)</label>
                  <input type="number" min="0" class="form-control" data-in="paid" value="${IV.paid||0}">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sticky Live Financial Summary Column (Right) -->
        <div class="col-xl-4">
          <div style="position:sticky;top:80px">
            <div class="card border shadow-sm invoice-summary-card">
              <div class="card-header py-3 d-flex justify-content-between align-items-center">
                <h6 class="fw-bold mb-0 text-primary"><i class="bi bi-file-earmark-text me-2"></i>Invoice Summary</h6>
                <span class="badge bg-light text-dark border">INV-2026-${IV.no}</span>
              </div>
              <div class="card-body p-3">
                <div id="pv-lines" class="mb-3 pb-2 border-bottom small"></div>

                <div class="summary-breakdown">
                  ${[['subtotal','s-sub'],['discount','s-disc'],...(vatActive?[['vat','s-vat']]:[]),['carry','s-carry']].map(([l,id])=>lrow(t(l),`<span id="${id}"></span>`)).join('')}
                  ${lrow(t('current_bill') || t('grand'), '<span id="s-grand" class="fw-bold text-dark"></span>').replace('lrow', 'lrow border-top pt-2')}
                  ${lrow(t('past_due') || 'Previous Due', '<span id="s-prevdue" class="fw-semibold text-danger"></span>')}
                  ${lrow(t('total_payable') || 'Total Payable', '<span id="s-totpayable" class="fs-5 fw-bold text-primary"></span>').replace('lrow', 'lrow tot border-top pt-2 pb-1')}
                  ${lrow(t('paid'), '<span id="s-paid" class="up fw-bold"></span>')}
                  ${lrow(t('net_closing_due') || t('due_after') || 'Closing Due', '<span id="s-due" class="dn fw-bold fs-6"></span>')}
                  ${A()?lrow(t('est_profit'),'<span id="s-pr" class="up"></span>'):''}
                </div>

                <div id="s-warn" class="mt-3"></div>

                <div class="d-grid gap-2 mt-4">
                  <button class="btn btn-outline-primary w-100 py-2" data-act="inv-prev">
                    <i class="bi bi-eye me-1"></i>${t('preview_draft') || 'Preview Invoice'}
                  </button>
                  <button class="btn-a w-100 justify-content-center py-2 fs-6" data-act="save">
                    <i class="bi bi-check2-circle me-1"></i>${isEdit?t('save'):t('save_inv')}
                  </button>
                  <button class="btn btn-outline-secondary w-100" data-act="ilist">
                    ${t('cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  upd();
}

function upd(){
  const{t,L,D,tk,kg,lrow}=F,T=tot(),c=D.customers[IV.c],set=(id,v)=>{const el=$('#'+id);if(el)el.textContent=v;};
  IV.lines.forEach((l,i)=>{
    set('lt'+i,tk(l.q*price(l)));
    const inp=$('#lq'+i);
    if(inp)inp.classList.toggle('is-invalid',l.q>D.products[l.p].kg||l.q<=0);
  });
  const pvEl=$('#pv-lines');
  if(pvEl)pvEl.innerHTML=IV.lines.map(l=>lrow(L(D.products[l.p].n),`${kg(l.q)} × ${tk(price(l))}`)).join('');
  set('s-sub',tk(T.sub));
  set('s-disc','− '+tk(T.da));
  if(isVatOn())set('s-vat',tk(T.v));
  set('s-carry',tk(IV.carry||0));
  set('s-grand',tk(T.g));
  set('s-prevdue',(T.prevDue>0?'+ ':'')+tk(T.prevDue));
  set('s-totpayable',tk(T.totalPayable));
  set('s-paid',tk(T.paid));
  set('s-due',tk(T.closingDue));
  if($('#s-pr'))set('s-pr',tk(T.pr));

  const after=T.closingDue,over=after>c.limit;
  const warnEl=$('#s-warn');
  if(warnEl)warnEl.innerHTML=over?`<div class="alert alert-danger p-2 small mb-0"><i class="bi bi-exclamation-triangle me-1"></i>${t('credit_warn')}</div>`:'';

  const cinfoEl=$('#cinfo');
  if(cinfoEl){
    cinfoEl.innerHTML=`
      <div class="p-2 rounded bg-light border small">
        <div class="d-flex justify-content-between mb-1 flex-wrap gap-2">
          <span>${t('phone')}: <b>${c.phone||'—'}</b></span>
          <span>${t('credit_limit') || t('limit')}: <b>${tk(c.limit)}</b></span>
          <span>${t('prev_due') || t('old_due')}: <b class="${c.due>0?'text-danger':''}">${tk(c.due)}</b></span>
        </div>
        ${c.due>0?`<div class="text-danger small mt-1"><i class="bi bi-info-circle me-1"></i>${t('prev_balance_note') || 'Customer past due of ' + tk(c.due) + ' is automatically added to this invoice.'}</div>`:''}
        <div class="bar mt-1"><i style="width:${Math.min(100,after/c.limit*100)}%;background:${over?'var(--danger)':'var(--accent)'}"></i></div>
      </div>
    `;
  }
}

P.sales=f=>{boot(f);inv()};
IN.imethod=x=>{IV.method=x.value};
IN.cust=x=>{IV.c=+x.value;upd()};
IN.lp=x=>{const l=IV.lines[+x.dataset.i];l.p=+x.value;l.pr=null;inv()};
IN.lq=x=>{IV.lines[+x.dataset.i].q=+x.value;upd()};
IN.lpr=x=>{IV.lines[+x.dataset.i].pr=+x.value;upd()};
IN.challan=x=>{IV.challan=x.value};
['disc','carry','vat','paid'].forEach(k=>IN[k]=x=>{IV[k]=+x.value;upd()});
ACT.add=()=>{IV.lines.push({p:0,q:500,pr:null});inv()};
ACT.rm=x=>{IV.lines.splice(+x.dataset.i,1);inv()};
ACT.mode=x=>{IV.mode=x.dataset.m;inv()};

ACT.save=()=>{
  const{t,L,lg,D,toast,tk,n}=F,T=tot();
  let err=!IV.lines.length?t('no_lines'):'';
  IV.lines.forEach(l=>{if(!(l.q>0))err=t('pos_qty');else if(l.q>D.products[l.p].kg)err=t('exceed')});
  if(err){toast(err,'exclamation-triangle');return}

  const isEdit = IV.editingIdx !== undefined;
  const c = D.customers[IV.c];
  const no = 'INV-2026-' + IV.no;
  const challanNo = (IV.challan && IV.challan.trim()) || ('CH-' + (IV.no - 780));
  const mth = F.methods().includes(IV.method)?IV.method:'m_cash';

  if (isEdit) {
    // EDIT INVOICE WORKFLOW (Req 4)
    const editIdx = IV.editingIdx;
    const v = D.invoices[editIdx];
    if (v) {
      // 1. Stock reconciliation: restore old lines, deduct new lines
      if (v[6]) v[6].forEach(l => { if (D.products[l.p]) D.products[l.p].kg += l.q; });
      IV.lines.forEach(l => { if (D.products[l.p]) D.products[l.p].kg -= l.q; });

      // 2. Customer balance reconciliation
      const oldDue = (v.closingDue !== undefined ? v.closingDue : (v[2] - v[3]));
      if (D.customers[v[1]]) D.customers[v[1]].due = Math.max(0, D.customers[v[1]].due - oldDue);
      c.due = T.closingDue;
      if (T.closingDue > 0 && !c.days) c.days = 1;
      else if (T.closingDue <= 0) c.days = 0;

      // 3. Update invoice record
      v[0] = no;
      v[1] = IV.c;
      v[2] = Math.round(T.g);
      v[3] = Math.round(T.paid);
      v[4] = T.closingDue <= 0 ? 'paid' : T.paid > 0 ? 'partial' : 'due';
      v[5] = Math.round(T.pr);
      v[6] = JSON.parse(JSON.stringify(IV.lines));
      v[7] = mth;
      v.challan = challanNo;
      v.subtotal = T.sub;
      v.discount = T.da;
      v.carry = IV.carry || 0;
      v.vat = T.v;
      v.prevDue = T.prevDue;
      v.currentBill = T.g;
      v.totalPayable = T.totalPayable;
      v.closingDue = T.closingDue;

      if (typeof LOG !== 'undefined') {
        LOG.add({ uid: F.S.user?.id, u: F.S.user?.n?.bn, r: F.S.role, m: 'sales', t: 'edit', recordType: 'invoice', recordId: no, msg: `Invoice ${no} updated successfully` });
      }
      toast(t('saved'), 'check-circle');
      IV.editingIdx = undefined;
      if (window.UI && window.UI.salesList) window.UI.salesList();
      else location.hash = '#/sales';
    }
  } else {
    // NEW INVOICE WORKFLOW (Req 1 & 3)
    const i = D.daily.sales.length - 1;
    if (T.paid > 0) post(mth, T.paid);
    IV.lines.forEach(l => D.products[l.p].kg -= l.q);
    c.due = T.closingDue;
    if (T.closingDue > 0 && !c.days) c.days = 1;
    else if (T.closingDue <= 0) c.days = 0;
    D.daily.sales[i] += T.g;
    D.daily.coll[i] += T.paid;

    const dObj = new Date();
    const invTuple = [no, IV.c, Math.round(T.g), Math.round(T.paid), T.closingDue <= 0 ? 'paid' : T.paid > 0 ? 'partial' : 'due', Math.round(T.pr), JSON.parse(JSON.stringify(IV.lines)), mth];
    invTuple.challan = challanNo;
    invTuple.createdTs = dObj.getTime();
    invTuple.dateStr = dObj.toLocaleDateString(F.S.lang==='bn'?'bn-BD':'en-IN',{day:'numeric',month:'short',year:'numeric'});
    invTuple.subtotal = T.sub;
    invTuple.discount = T.da;
    invTuple.carry = IV.carry || 0;
    invTuple.vat = T.v;
    invTuple.prevDue = T.prevDue;
    invTuple.currentBill = T.g;
    invTuple.totalPayable = T.totalPayable;
    invTuple.closingDue = T.closingDue;
    invTuple.payments = [];
    if (T.paid > 0) {
      invTuple.payments.push({
        id: 'PAY-2026-' + (++D.paySeq),
        invNo: no,
        c: IV.c,
        dt: dObj.getTime(),
        dtStr: dObj.toLocaleDateString(F.S.lang==='bn'?'bn-BD':'en-IN',{day:'2-digit',month:'short',year:'numeric'}) + ' ' + dObj.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}),
        amt: T.paid,
        m: mth,
        ref: 'TXN-' + Math.floor(10000 + Math.random()*90000),
        u: F.S.user?.n?.bn || 'System',
        note: 'Invoice payment',
        status: 'posted'
      });
    }

    D.invoices.unshift(invTuple);
    if (typeof LOG !== 'undefined') {
      LOG.add({ uid: F.S.user?.id, u: F.S.user?.n?.bn, r: F.S.role, m: 'sales', t: 'save', recordType: 'invoice', recordId: no, msg: `নতুন ইনভয়েস তৈরি: ${no} (চালান: ${challanNo})` });
    }

    IV.no++;
    IV.challan = 'CH-' + (IV.no - 780);
    IV.lines = [{ p: 0, q: 500, pr: null }];
    IV.disc = IV.carry = IV.paid = 0;
    IV.mode = 'credit';

    // Show User-Friendly Confirmation & Action Popup (Req 3)
    const confirmPopupHtml = `
      <div class="text-center p-2">
        <div class="mb-3">
          <div style="width:68px;height:68px;border-radius:50%;background:rgba(44,197,190,0.14);color:#2CC5BE;display:inline-flex;align-items:center;justify-content:center;font-size:36px">
            <i class="bi bi-check2-circle"></i>
          </div>
        </div>
        <h4 class="fw-bold mb-1">${t('invoice_created_success')}</h4>
        <p class="text-secondary small mb-3">${t('invoice_created_sub')}</p>

        <div class="card bg-light border p-3 mb-4 text-start">
          <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
            <div>
              <b class="fs-6 text-primary">${no}</b>
              <span class="badge bg-secondary-subtle text-secondary border ms-2"><i class="bi bi-truck me-1"></i>${challanNo}</span>
            </div>
            <span class="badge ${T.closingDue<=0?'bg-success':T.paid>0?'bg-warning text-dark':'bg-danger'}">${t(T.closingDue<=0?'paid':T.paid>0?'partial':'due')}</span>
          </div>
          <div class="row g-2 small">
            <div class="col-6">
              <span class="text-secondary d-block">${t('customer')}</span>
              <b>${L(c)}</b>
            </div>
            <div class="col-6 text-end">
              <span class="text-secondary d-block">${t('current_bill') || t('grand')}</span>
              <b class="fs-6 text-dark">${tk(T.g)}</b>
            </div>
            ${T.prevDue > 0 ? `
              <div class="col-6">
                <span class="text-secondary d-block">${t('past_due') || 'Past Due'}</span>
                <b class="text-danger">+ ${tk(T.prevDue)}</b>
              </div>
              <div class="col-6 text-end">
                <span class="text-secondary d-block">${t('total_payable') || 'Total Payable'}</span>
                <b class="text-primary fs-6">${tk(T.totalPayable)}</b>
              </div>
            ` : ''}
            <div class="col-6">
              <span class="text-secondary d-block">${t('paid')}</span>
              <b class="up">${tk(T.paid)}</b>
            </div>
            <div class="col-6 text-end">
              <span class="text-secondary d-block">${t('net_closing_due') || t('due_amt')}</span>
              <b class="dn">${tk(T.closingDue)}</b>
            </div>
          </div>
        </div>

        <div class="d-grid gap-2">
          <div class="row g-2">
            <div class="col-6">
              <button class="btn btn-outline-primary w-100 py-2" data-act="conf-prev" data-i="0">
                <i class="bi bi-eye me-1"></i>${t('preview_invoice')}
              </button>
            </div>
            <div class="col-6">
              <button class="btn btn-primary w-100 py-2" data-act="conf-print" data-i="0">
                <i class="bi bi-printer me-1"></i>${t('print_invoice')} (A4)
              </button>
            </div>
          </div>
          <button class="btn btn-success w-100 py-2" data-act="conf-wa" data-i="0">
            <i class="bi bi-whatsapp me-1"></i>${t('wa_share')}
          </button>
          <button class="btn btn-link text-secondary w-100 text-decoration-none mt-1" data-bs-dismiss="modal" data-act="ilist">
            ${t('close')}
          </button>
        </div>
      </div>
    `;
    modal(t('invoice_created_success'), confirmPopupHtml, null, null);
  }
};

/* Preview Draft Invoice Action */
ACT['inv-prev'] = () => {
  if (window.UI && window.UI.showDoc && window.UI.paper) {
    const title = (F.t('preview_draft') || 'Preview Invoice') + ' – ' + (IV.challan || 'Draft');
    const p = window.UI.paper('draft', 'a4');
    window.UI.showDoc(title, p, p, false);
  }
};

/* Confirmation Popup Handlers (Req 3) */
ACT['conf-prev'] = (x) => {
  const { D, t } = F;
  const idx = +x.dataset.i || 0;
  const v = D.invoices[idx];
  if (!v) return;
  try {
    const m = bootstrap.Modal.getInstance(document.querySelector('#modal'));
    if (m) m.hide();
  } catch (_) {}
  setTimeout(() => {
    if (window.UI && window.UI.showDoc && window.UI.paper) {
      window.UI.showDoc(v[0] + ' – ' + t('print_a4'), window.UI.paper(idx, 'a4'), window.UI.paper(idx, 'a4'), false);
    }
  }, 250);
};

ACT['conf-print'] = (x) => {
  const { D } = F;
  const idx = +x.dataset.i || 0;
  const v = D.invoices[idx];
  if (!v) return;
  try {
    const m = bootstrap.Modal.getInstance(document.querySelector('#modal'));
    if (m) m.hide();
  } catch (_) {}
  if (window.UI && window.UI.printDoc && window.UI.paper) {
    window.UI.printDoc(window.UI.paper(idx, 'a4'), v[0]);
  }
};

ACT['conf-wa'] = (x) => {
  const { D, L, lg, tk } = F;
  const idx = +x.dataset.i || 0;
  const v = D.invoices[idx];
  if (!v) return;
  const c = D.customers[v[1]];
  const msg = lg([
    `আসসালামু আলাইকুম, ${c.bn}। ইনভয়েস ${v[0]} (চালান: ${v.challan || '—'}): মোট ${tk(v[2])}, পরিশোধ ${tk(v[3])}, বকেয়া ${tk(v[2]-v[3])}। ধন্যবাদ – Ultra Fast।`,
    `Hello ${c.en}. Invoice ${v[0]} (Challan: ${v.challan || '—'}): total ${tk(v[2])}, paid ${tk(v[3])}, due ${tk(v[2]-v[3])}. Thank you – Ultra Fast.`
  ]);
  const phone = c && c.phone ? c.phone.replace(/\D/g, '') : '';
  const fullPhone = phone.startsWith('88') ? phone : ('88' + (phone.startsWith('0') ? phone : '0' + phone));
  window.open('https://wa.me/' + fullPhone + '?text=' + encodeURIComponent(msg), '_blank');
};
/* ================= Customers & Dues ================= */
function cust(){const{t,L,D,tk,short,n,panel}=F,tot=sum(D.customers.map(c=>c.due)),o90=sum(D.customers.filter(c=>c.days>90).map(c=>c.due)),near=D.customers.filter(c=>c.due>c.limit*.7).length;
 const s=(l,v)=>`<div><span>${t(l)}</span><b>${v}</b></div>`;
 $('#view').innerHTML=`<div class="enter"><div class="page-h"><div><h2>${t('nav_customers')}</h2><p>${t('c_sub')}</p></div><button class="btn-a" data-act="cadd"><i class="bi bi-plus-lg"></i>${t('add_customer')}</button></div>${panel('',`<div class="strip">${s('total_due',short(tot))}${s('o90',short(o90))}${s('today_coll',short(D.daily.coll.at(-1)))}${s('overlim',n(near)+' / '+n(D.customers.length))}</div><div class="tw"><table class="tbl"><thead><tr><th>${t('customer')}</th><th style="width:190px">${t('credit_used')}</th><th class="r">${t('due_amt')}</th><th class="r">${t('days')}</th><th>${t('status')}</th><th></th></tr></thead><tbody>${D.customers.map((c,i)=>({c,i})).sort((a,b)=>b.c.due-a.c.due).map(({c,i})=>{const u=c.due/c.limit;return `<tr><td><a href="javascript:void(0)" data-act="cinvs" data-i="${i}" class="fw-bold text-decoration-none" title="${t('view_invoices')}"><i class="bi bi-person me-1 text-primary"></i>${L(c)}</a><br><small class="text-secondary">${c.phone}</small></td><td><div class="bar"><i style="width:${Math.min(100,u*100)}%;background:${u>.8?'var(--danger)':u>.5?'var(--warn)':'var(--accent)'}"></i></div><small class="text-secondary">${n(u*100)}% · ${short(c.limit)}</small></td><td class="r fw-semibold">${tk(c.due)}</td><td class="r">${n(c.days)}</td><td>${c.due<=0?bd('paid','clear'):c.days>90?bd('due','overdue'):bd('partial','outstanding')}</td><td class="r text-nowrap"><button class="btn-o py-1" data-act="cinvs" data-i="${i}" title="${t('view_invoices')}"><i class="bi bi-receipt"></i>${t('view_invoices')}</button> <button class="btn-a py-1" data-act="collect" data-i="${i}" ${c.due<=0?'disabled':''}><i class="bi bi-cash-coin"></i>${t('collect')}</button> <button class="btn-o py-1" data-act="remind" data-i="${i}" ${c.due<=0?'disabled':''}><i class="bi bi-bell"></i>${t('remind')}</button> <button class="icon-btn ib" data-act="cedit" data-i="${i}" aria-label="${t('edit')}"><i class="bi bi-pencil"></i></button> <button class="icon-btn ib" data-act="cdel" data-i="${i}" aria-label="${t('delete')}"><i class="bi bi-trash3"></i></button></td></tr>`}).join('')}</tbody></table></div>`)}</div>`}
P.customers=f=>{boot(f);cust()};
ACT.cinvs=x=>{
  const idx = +x.dataset.i;
  if (window.UI && window.UI.openCustomerInvoices) {
    window.UI.openCustomerInvoices(idx);
  } else {
    location.hash = '#/sales';
    setTimeout(() => { if (window.UI && window.UI.openCustomerInvoices) window.UI.openCustomerInvoices(idx); }, 80);
  }
};
ACT.collect=x=>{const{t,L,D,tk,toast,lrow}=F,c=D.customers[+x.dataset.i];
 modal(t('collect')+' – '+L(c),lrow(t('due_amt'),tk(c.due),'dn')+field('ca',t('paid_amt'),`<input id="ca" type="number" min="0" class="form-control" value="${c.due}">`)+field('cm',t('method'),`<select id="cm" class="form-select">${opts(F.methods().map(k=>[k,t(k)]))}</select>`),()=>{
  const a=+$('#ca').value;$('#ca').classList.remove('is-invalid');if(!(a>0))return !bad('ca',t('pos_qty'));if(a>c.due)return !bad('ca',t('max_due'));
  if(!F.methods().includes($('#cm').value))return !bad('cm',t('cash_only_note'));post($('#cm').value,a);const prevDue=c.due;c.due-=a;if(c.due<=0)c.days=0;D.daily.coll[D.daily.coll.length-1]+=a;const d=new Date();const dStr=d.toLocaleDateString(F.S.lang==='bn'?'bn-BD':'en-IN',{day:'2-digit',month:'short',year:'numeric'});D.coll.unshift([+x.dataset.i,a,$('#cm').value,d.toLocaleTimeString('bn-BD',{hour:'2-digit',minute:'2-digit'}),d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})]);D.coll.length=Math.min(D.coll.length,10);
  if(!D.dueCollections) D.dueCollections=[];
  const collRec = {
    id: 'COLL-' + Date.now().toString(36).toUpperCase(),
    custId: +x.dataset.i,
    custName: L(c),
    invNo: 'GEN-RECV',
    prevDue: prevDue,
    amt: a,
    remDue: c.due,
    dt: Date.now(),
    dtStr: dStr,
    m: $('#cm').value,
    ref: 'COLL-' + Math.floor(1000 + Math.random()*9000),
    by: F.S.user ? (F.S.user.n[F.S.lang] || F.S.user.n.bn) : 'User',
    remarks: 'Customer due recovery'
  };
  D.dueCollections.unshift(collRec);
  if(typeof LOG!=='undefined') LOG.add({uid:F.S.user?.id,u:F.S.user?.n?.bn,r:F.S.role,m:'customers',t:'save',recordType:'due_collection',recordId:collRec.id,changes:{before:prevDue,after:c.due},msg:`${L(c)} থেকে বকেয়া আদায়: ${tk(a)} (${t($('#cm').value)})`});
  toast(t('coll_done'),'check-circle');cust()},t('collect'))};
ACT.remind=x=>{const{t,lg,D,tk,toast}=F,c=D.customers[+x.dataset.i],msg=lg([`প্রিয় ${c.bn}, আপনার ${tk(c.due)} বকেয়া ${c.days} দিন ধরে অপরিশোধিত। অনুগ্রহ করে দ্রুত পরিশোধ করুন। ধন্যবাদ।`,`Dear ${c.en}, your outstanding balance of ${tk(c.due)} has been due for ${c.days} days. Kindly arrange payment soon. Thank you.`]);
 modal(t('rem_title'),`<div class="wa">${msg}</div><small class="text-secondary d-block mt-2">${t('wa_note')}</small>`,()=>{navigator.clipboard?.writeText(msg).catch(()=>{});toast(t('copied'),'clipboard-check')},t('copy'))};
function post(m,a){const cb=F.D.cashBank;if(m==='m_cash')cb.cash+=a;else if(m==='m_adminrecv')cb.adminCash=(cb.adminCash===undefined?1900000:cb.adminCash)+a;else cb.bank+=a}
window.UI={psearch:q=>{PS.q=q;PS.pg=1;PS.tab='all';PS.cat=''},post,F:()=>F,modal,field,bad,opts,bd:(c,l)=>bd(c,l),sum,$,ACT,IN,boot:f=>boot(f),IV,tot};
/* ---- event delegation ---- */
document.addEventListener('click',e=>{const x=e.target.closest('[data-act]');if(x&&F&&ACT[x.dataset.act])ACT[x.dataset.act](x)});
document.addEventListener('input',e=>{const x=e.target.closest('[data-in]');if(x&&F&&IN[x.dataset.in])IN[x.dataset.in](x)});
})();
