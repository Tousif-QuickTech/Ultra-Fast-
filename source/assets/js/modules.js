/* Phase 2 pages: Products & Stock (+ Full Product Details Page), New/Edit Invoice, Customers & Dues. Registered on window.PAGES; F = shared helpers from app.js */
(()=>{
const P=window.PAGES={},ACT={},IN={};let F;
const $=(s,r=document)=>r.querySelector(s),sum=a=>a.reduce((x,y)=>x+y,0);
function boot(f){
  if(!F){
    F=f;
    const ph=['01711-284501','01819-662340','01912-557781','01678-300912','01555-421098'],lim=[3000000,2500000,1500000,1200000,2000000];
    F.D.products.forEach((p,i)=>{if(!p.sku)p.sku='PK-'+(101+i)});
    F.D.customers.forEach((c,i)=>{if(!c.phone&&ph[i])c.phone=ph[i];if(!c.limit&&lim[i])c.limit=lim[i]});
  }
  if(window.FIN) window.FIN.boot(f);
}
function modal(title,body,fn,okl){$('#mt').textContent=title;$('#mb').innerHTML=body;$('#mf').innerHTML=`<button class="btn-o" data-bs-dismiss="modal">${F.t('cancel')}</button>`+(fn?`<button class="btn-a" id="mok">${okl||F.t('save')}</button>`:'');
 const m=bootstrap.Modal.getOrCreateInstance('#modal');if(fn)$('#mok').onclick=()=>{if(fn()!==false)m.hide()};m.show()}
const bd=(c,l)=>`<span class="st ${c}">${F.t(l)}</span>`;
const field=(id,lb,inner)=>`<div class="mb-3"><label class="form-label fw-semibold" for="${id}">${lb}</label>${inner}<div class="invalid-feedback" id="${id}-e"></div></div>`;
const bad=(id,m)=>{$('#'+id).classList.add('is-invalid');$('#'+id+'-e').textContent=m;return true};
const opts=(a,sel)=>a.map(([v,l])=>`<option value="${v}" ${v==sel?'selected':''}>${l}</option>`).join('');
/* ================= Products & Stock ================= */
const PS={q:'',cat:'',k:'name',d:1,pg:1,tab:'all',detailIdx:null,histType:'all',histQ:''};
let prodChartInst=null;

function ptable(){
  const{t,L,kg,tk,A,D,n}=F;
  let l=D.products.map((p,i)=>({p,i})).filter(({p})=>(!PS.cat||p.cat===PS.cat)&&(PS.tab==='all'||p.kg<p.min)&&((p.n.bn+p.n.en+(p.sku||'')+(p.desc||'')).toLowerCase().includes(PS.q.toLowerCase())));
  const v=({p})=>PS.k==='name'?L(p.n):p[PS.k];
  l.sort((a,b)=>(v(a)>v(b)?1:v(a)<v(b)?-1:0)*PS.d);
  const sz=8,pgs=Math.max(1,Math.ceil(l.length/sz));
  PS.pg=Math.min(PS.pg,pgs);
  const rows=l.slice((PS.pg-1)*sz,PS.pg*sz);
  const th=(k,lb,c='')=>`<th class="thsort ${c}" data-act="sort" data-k="${k}">${t(lb)}${PS.k===k?(PS.d>0?' ↑':' ↓'):''}</th>`;
  const statusPill=p=>p.status==='inactive'?`<span class="badge bg-secondary-subtle text-secondary border">${t('prod_inactive')}</span>`:bd(p.kg<p.min?'due':'paid',p.kg<=0?'out_of_stock':p.kg<p.min?'lowst':'ok');

  const mobileCards=`
    <div class="d-md-none p-2">
      ${rows.length?rows.map(({p,i})=>`
        <div class="mob-tx-card mb-2 p-3">
          <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
            <div class="d-flex align-items-center gap-2 flex-grow-1 min-w-0" data-act="pview" data-i="${i}" style="cursor:pointer">
              ${p.img?`<img src="${p.img}" alt="" style="width:42px;height:42px;border-radius:10px;object-fit:cover;border:1px solid var(--border);flex-shrink:0">`:`<div class="d-grid place-items-center rounded-3 border" style="width:42px;height:42px;background:var(--surface-2);color:var(--primary);flex-shrink:0"><i class="bi bi-box-seam fs-5"></i></div>`}
              <div class="min-w-0">
                <b class="d-block text-truncate text-primary" style="font-size:15px">${L(p.n)}</b>
                <small class="text-secondary"><code>${p.sku}</code> · ${t('cat_'+p.cat)}</small>
              </div>
            </div>
            <div>${statusPill(p)}</div>
          </div>
          <div class="p-2 rounded border bg-surface-2 d-flex justify-content-between align-items-center text-center mb-2">
            <div class="flex-fill">
              <span class="d-block small text-secondary">${t('stock')}</span>
              <b class="${p.kg<p.min?'dn':'text-primary'}">${kg(p.kg)}</b>
            </div>
            ${A()?`<div class="vr mx-1"></div><div class="flex-fill"><span class="d-block small text-secondary">${t('cost_price')}</span><b>${tk(p.cost)}</b></div>`:''}
            <div class="vr mx-1"></div>
            <div class="flex-fill">
              <span class="d-block small text-secondary">${t('sell_price')}</span>
              <b class="up">${tk(p.price)}</b>
            </div>
          </div>
          <div class="d-flex gap-1 pt-1 border-top">
            <button class="btn btn-sm btn-outline-primary flex-fill py-2" data-act="pview" data-i="${i}"><i class="bi bi-eye me-1"></i>${t('product_summary')}</button>
            <button class="btn btn-sm btn-outline-secondary flex-fill py-2" data-act="adj" data-i="${i}"><i class="bi bi-sliders me-1"></i>${t('adjust')}</button>
            <button class="icon-btn ib" data-act="pedit" data-i="${i}" aria-label="${t('edit')}"><i class="bi bi-pencil"></i></button>
            <button class="icon-btn ib" data-act="pdel" data-i="${i}" aria-label="${t('delete')}"><i class="bi bi-trash3"></i></button>
          </div>
        </div>`).join(''):`<div class="text-center text-secondary py-4">${t('empty')}</div>`}
    </div>`;

  const desktopTable=`
    <div class="d-none d-md-block tw">
      <table class="tbl">
        <thead>
          <tr>
            ${th('sku','sku')}
            ${th('name','product')}
            ${th('kg','stock','r')}
            <th style="width:140px">${t('min')}</th>
            ${A()?th('cost','avgcost','r'):''}
            <th class="r">${t('sell_price')}</th>
            <th>${t('status')}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${rows.length?rows.map(({p,i})=>`
            <tr>
              <td class="text-secondary"><a href="javascript:void(0)" class="fw-bold text-decoration-none" data-act="pview" data-i="${i}">${p.sku}</a></td>
              <td>
                <a href="javascript:void(0)" class="d-flex align-items-center gap-2 text-decoration-none text-body" data-act="pview" data-i="${i}" title="${t('product_summary')}">
                  ${p.img?`<img src="${p.img}" alt="" style="width:34px;height:34px;border-radius:8px;object-fit:cover;border:1px solid var(--border);flex-shrink:0">`:`<span class="d-inline-grid place-items-center rounded-2 border" style="width:34px;height:34px;background:var(--surface-2);color:var(--primary);flex-shrink:0"><i class="bi bi-box-seam"></i></span>`}
                  <div>
                    <b class="text-primary">${L(p.n)}</b>
                    <br><small class="text-secondary">${t('cat_'+p.cat)}${p.status==='inactive'?' · '+t('prod_inactive'):''}</small>
                  </div>
                </a>
              </td>
              <td class="r fw-semibold ${p.kg<p.min?'dn':''}">${kg(p.kg)}</td>
              <td><div class="bar"><i style="width:${Math.min(100,p.min?(p.kg/p.min*50):100)}%;background:${p.kg<p.min?'var(--danger)':'var(--ok)'}"></i></div><small class="text-secondary">${kg(p.min)}</small></td>
              ${A()?`<td class="r">${tk(p.cost)}</td>`:''}
              <td class="r fw-semibold up">${tk(p.price)}</td>
              <td>${statusPill(p)}</td>
              <td class="r text-nowrap">
                <button class="btn btn-sm btn-outline-primary py-1 px-2" data-act="pview" data-i="${i}" title="${t('product_summary')}"><i class="bi bi-eye me-1"></i>${t('product_summary')}</button>
                <button class="btn-o py-1 ms-1" data-act="adj" data-i="${i}"><i class="bi bi-sliders"></i>${t('adjust')}</button>
                <button class="icon-btn ib" data-act="pedit" data-i="${i}" aria-label="${t('edit')}"><i class="bi bi-pencil"></i></button>
                <button class="icon-btn ib" data-act="pdel" data-i="${i}" aria-label="${t('delete')}"><i class="bi bi-trash3"></i></button>
              </td>
            </tr>`).join(''):`<tr><td colspan="8" class="text-center text-secondary py-5"><i class="bi bi-inbox fs-3 d-block"></i>${t('empty')}</td></tr>`}
        </tbody>
      </table>
    </div>`;

  return mobileCards + desktopTable + `<div class="d-flex justify-content-between align-items-center p-3 border-top flex-wrap gap-2"><small class="text-secondary">${n(l.length)} ${t('items')}</small><div class="seg">${[...Array(pgs)].map((_,i)=>`<button data-act="pg" data-p="${i+1}" class="${PS.pg===i+1?'on':''}">${n(i+1)}</button>`).join('')}</div></div>`;
}

function productDetailPage(idx) {
  const { t, L, kg, tk, D, A, short, n, panel } = F;
  const info = window.FIN ? window.FIN.getProductHistory(idx, F) : null;
  if (!info || !info.product) {
    PS.detailIdx = null;
    prod();
    return;
  }
  const p = info.product;
  const isLow = p.kg < p.min;
  const isOut = p.kg <= 0;
  const statusBadge = p.status === 'inactive'
    ? `<span class="badge bg-secondary">${t('prod_inactive')}</span>`
    : isOut ? `<span class="badge bg-danger">${t('out_of_stock')}</span>`
    : isLow ? `<span class="badge bg-warning text-dark">${t('low_stock_warn')}</span>`
    : `<span class="badge bg-success">${t('in_stock')}</span>`;

  // Filter complete chronological history
  const histQ = (PS.histQ || '').toLowerCase().trim();
  const filteredHist = info.events.filter(ev => {
    if (PS.histType !== 'all' && ev.type !== PS.histType) return false;
    if (histQ) {
      const txt = `${ev.ref || ''} ${ev.challan || ''} ${ev.party || ''} ${ev.remarks || ''} ${ev.dateStr || ''}`.toLowerCase();
      if (!txt.includes(histQ)) return false;
    }
    return true;
  });

  const suppliersSet = [...new Set(info.purchaseRecords.map(r => r.supplier))];

  const histDesktopRows = filteredHist.map(ev => {
    const pos = ev.qtyChange >= 0;
    const typeBadge = ev.type === 'purchase'
      ? `<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-box-arrow-in-down me-1"></i>${t('purchases')} (+)</span>`
      : ev.type === 'sale'
      ? `<span class="badge bg-danger-subtle text-danger border border-danger-subtle"><i class="bi bi-receipt me-1"></i>${t('sales')} (−)</span>`
      : ev.type === 'opening'
      ? `<span class="badge bg-primary-subtle text-primary border border-primary-subtle"><i class="bi bi-database me-1"></i>${t('tx_opening')}</span>`
      : `<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle"><i class="bi bi-sliders me-1"></i>${t('adjust')}</span>`;

    const refHtml = ev.type === 'sale' && ev.invIdx !== undefined && ev.invIdx >= 0
      ? `<a href="javascript:void(0)" class="fw-bold text-decoration-none" data-act="idetail" data-i="${ev.invIdx}">${ev.ref}</a>`
      : ev.purchRef
      ? `<a href="javascript:void(0)" class="fw-bold text-decoration-none" data-act="pudetail" data-ref="${ev.purchRef}">${ev.ref}</a>`
      : `<code>${ev.ref}</code>`;

    return `
      <tr>
        <td class="text-nowrap small text-secondary">${ev.dateStr}</td>
        <td>${typeBadge}</td>
        <td>${refHtml} ${ev.challan ? `<span class="badge bg-light text-dark border ms-1">${ev.challan}</span>` : ''}</td>
        <td class="r fw-bold ${pos ? 'up' : 'dn'}">${pos ? '+' : ''}${kg(ev.qtyChange)}</td>
        <td class="r text-secondary">${kg(ev.prevStock)}</td>
        <td class="r fw-bold text-primary">${kg(ev.updatedStock)}</td>
        <td><b class="small">${ev.party}</b><br><small class="text-secondary">${ev.remarks || ''}</small></td>
      </tr>`;
  }).join('');

  const histMobileCards = filteredHist.map(ev => {
    const pos = ev.qtyChange >= 0;
    const refHtml = ev.type === 'sale' && ev.invIdx !== undefined && ev.invIdx >= 0
      ? `<a href="javascript:void(0)" class="fw-bold text-decoration-none" data-act="idetail" data-i="${ev.invIdx}">${ev.ref}</a>`
      : ev.purchRef
      ? `<a href="javascript:void(0)" class="fw-bold text-decoration-none" data-act="pudetail" data-ref="${ev.purchRef}">${ev.ref}</a>`
      : `<code>${ev.ref}</code>`;
    return `
      <div class="mob-tx-card mb-2 p-3">
        <div class="d-flex justify-content-between align-items-start gap-2 mb-1">
          <div>${refHtml} <small class="text-secondary ms-1">${ev.dateStr}</small></div>
          <b class="${pos ? 'up' : 'dn'} fs-6">${pos ? '+' : ''}${kg(ev.qtyChange)}</b>
        </div>
        <div class="small fw-semibold mb-1">${ev.party}</div>
        <div class="small text-secondary mb-2">${ev.remarks || ev.type}</div>
        <div class="d-flex justify-content-between small pt-2 border-top text-secondary">
          <span>${t('prev_stock')}: <b>${kg(ev.prevStock)}</b></span>
          <span>${t('curr_stock')}: <b class="text-primary">${kg(ev.updatedStock)}</b></span>
        </div>
      </div>`;
  }).join('');

  $('#view').innerHTML = `
    <div class="enter">
      <!-- Top Navigation Bar -->
      <div class="page-h flex-column flex-sm-row gap-2 align-items-start align-items-sm-center justify-content-between">
        <div class="d-flex align-items-center gap-3 flex-wrap">
          <button class="btn-o" data-act="pback"><i class="bi bi-arrow-left me-1"></i>${t('back_to_products')}</button>
          <div>
            <h2 class="mb-0">${L(p.n)}</h2>
            <p class="mb-0">${p.sku} · ${t('cat_' + p.cat)}</p>
          </div>
        </div>
        <div class="d-flex gap-2 flex-wrap w-100 w-sm-auto">
          <button class="btn-o flex-fill flex-sm-grow-0" data-act="adj" data-i="${idx}"><i class="bi bi-sliders me-1"></i>${t('adjust')}</button>
          <button class="btn-a flex-fill flex-sm-grow-0" data-act="pedit" data-i="${idx}"><i class="bi bi-pencil me-1"></i>${t('edit')}</button>
        </div>
      </div>

      <!-- A. Basic Product Information Banner -->
      <div class="card border shadow-sm mb-3">
        <div class="card-body p-3">
          <div class="row g-3 align-items-center">
            <div class="col-12 col-md-7">
              <div class="d-flex align-items-start gap-3">
                ${p.img
                  ? `<img src="${p.img}" alt="${L(p.n)}" style="width:76px;height:76px;border-radius:14px;object-fit:cover;border:1px solid var(--border);flex-shrink:0">`
                  : `<div class="d-grid place-items-center rounded-4 border" style="width:76px;height:76px;background:var(--surface-2);color:var(--primary);flex-shrink:0"><i class="bi bi-box-seam fs-1"></i></div>`}
                <div>
                  <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
                    <span class="badge bg-secondary-subtle text-secondary border"><code>${p.sku}</code></span>
                    <span class="badge bg-info-subtle text-info-emphasis border">${t('cat_' + p.cat)}</span>
                    ${statusBadge}
                  </div>
                  <h4 class="fw-bold mb-1">${L(p.n)}</h4>
                  <p class="text-secondary small mb-0">${p.desc || '—'}</p>
                </div>
              </div>
            </div>
            <div class="col-12 col-md-5">
              <div class="row g-2 text-center">
                ${A() ? `
                  <div class="col-4">
                    <div class="p-2 rounded border bg-surface-2">
                      <small class="text-secondary d-block">${t('cost_price')}</small>
                      <b class="fs-6">${tk(p.cost)}</b>
                    </div>
                  </div>` : ''}
                <div class="${A() ? 'col-4' : 'col-6'}">
                  <div class="p-2 rounded border bg-surface-2">
                    <small class="text-secondary d-block">${t('sell_price')}</small>
                    <b class="fs-6 up">${tk(p.price)}</b>
                  </div>
                </div>
                <div class="${A() ? 'col-4' : 'col-6'}">
                  <div class="p-2 rounded border bg-surface-2">
                    <small class="text-secondary d-block">${t('curr_stock')}</small>
                    <b class="fs-6 ${isLow ? 'dn' : 'text-primary'}">${kg(p.kg)}</b>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- B. Stock Overview & C. Sales Summary & D. Purchase Summary -->
      <div class="row g-3 mb-3">
        <!-- B. Stock Overview -->
        <div class="col-12 col-lg-4">
          <div class="card h-100 border shadow-sm">
            <div class="card-header py-2 fw-bold"><i class="bi bi-boxes me-2 text-primary"></i>B. ${t('stock_summary')}</div>
            <div class="card-body p-3">
              <div class="lrow"><span class="l">${t('curr_stock')}</span><span class="ld"></span><span class="v text-primary fs-5">${kg(info.currentStock)}</span></div>
              <div class="lrow"><span class="l">${t('open_bal')}</span><span class="ld"></span><span class="v">${kg(info.openingStock)}</span></div>
              <div class="lrow"><span class="l">${t('tot_purch_qty')}</span><span class="ld"></span><span class="v up">+${kg(info.totalPurchQty)}</span></div>
              <div class="lrow"><span class="l">${t('tot_sold_qty')}</span><span class="ld"></span><span class="v dn">−${kg(info.invoiceSoldQty)}</span></div>
              <div class="lrow"><span class="l">${t('stock_adj_net')}</span><span class="ld"></span><span class="v">${kg(info.adjustmentsNet)}</span></div>
              ${A() ? `
                <div class="lrow"><span class="l">${t('cost_val')}</span><span class="ld"></span><span class="v">${short(info.stockValueCost)}</span></div>
                <div class="lrow"><span class="l">${t('retail_val')}</span><span class="ld"></span><span class="v up">${short(info.stockValueRetail)}</span></div>
              ` : ''}
              <div class="mt-2">
                <div class="d-flex justify-content-between small text-secondary mb-1">
                  <span>${t('min')}: ${kg(p.min)}</span>
                  <span>${statusBadge}</span>
                </div>
                <div class="bar"><i style="width:${Math.min(100, p.min ? (p.kg / p.min * 50) : 100)}%;background:${isLow ? 'var(--danger)' : 'var(--ok)'}"></i></div>
              </div>
            </div>
          </div>
        </div>

        <!-- C. Sales Summary + Chart -->
        <div class="col-12 col-lg-4">
          <div class="card h-100 border shadow-sm">
            <div class="card-header py-2 fw-bold"><i class="bi bi-receipt me-2 text-primary"></i>C. ${t('sales_summary')}</div>
            <div class="card-body p-3">
              <div class="lrow"><span class="l">${t('tot_sold_qty')}</span><span class="ld"></span><span class="v">${kg(info.totalSoldQty)}</span></div>
              <div class="lrow"><span class="l">${t('tot_sales_val')}</span><span class="ld"></span><span class="v up">${short(info.totalSalesValue)}</span></div>
              <div class="lrow"><span class="l">${t('invoices_count')}</span><span class="ld"></span><span class="v">${n(info.invoiceCount)}</span></div>
              <div style="height:130px" class="mt-2 mb-2"><canvas id="prod-perf-chart"></canvas></div>
              <div class="small fw-semibold text-secondary mb-1">${t('recent_sales')}</div>
              ${info.recentInvoices.length ? info.recentInvoices.slice(0, 3).map(({ invIdx, v }) => `
                <div class="d-flex justify-content-between align-items-center py-1 border-top small">
                  <a href="javascript:void(0)" class="fw-bold text-decoration-none" data-act="idetail" data-i="${invIdx}">${v[0]}</a>
                  <span class="text-secondary text-truncate mx-2" style="max-width:110px">${D.customers[v[1]] ? L(D.customers[v[1]]) : ''}</span>
                  <b class="up">${tk(v[2])}</b>
                </div>`).join('') : `<div class="small text-secondary">${t('empty')}</div>`}
            </div>
          </div>
        </div>

        <!-- D. Purchase Summary -->
        <div class="col-12 col-lg-4">
          <div class="card h-100 border shadow-sm">
            <div class="card-header py-2 fw-bold"><i class="bi bi-truck me-2 text-primary"></i>D. ${t('purch_summary')}</div>
            <div class="card-body p-3">
              <div class="lrow"><span class="l">${t('purch_qty_tot')}</span><span class="ld"></span><span class="v">${kg(info.totalPurchQty)}</span></div>
              ${A() ? `<div class="lrow"><span class="l">${t('purch_val_tot')}</span><span class="ld"></span><span class="v text-primary">${short(info.totalPurchValue)}</span></div>` : ''}
              <div class="lrow"><span class="l">${t('supplier')}</span><span class="ld"></span><span class="v text-truncate" style="max-width:160px">${suppliersSet.join(', ') || '—'}</span></div>
              <div class="small fw-semibold text-secondary mt-3 mb-1">${t('purch_history')}</div>
              ${info.purchaseRecords.length ? info.purchaseRecords.slice(0, 5).map(pr => `
                <div class="d-flex justify-content-between align-items-center py-1 border-top small">
                  <a href="javascript:void(0)" class="fw-bold text-decoration-none" data-act="pudetail" data-ref="${pr.ref}">${pr.ref}</a>
                  <span class="text-secondary text-truncate mx-2" style="max-width:110px">${pr.supplier}</span>
                  <b>+${kg(pr.qty)}</b>
                </div>`).join('') : `<div class="small text-secondary">${t('empty')}</div>`}
            </div>
          </div>
        </div>
      </div>

      <!-- E. Complete Chronological Product History -->
      <section class="panel">
        <div class="panel-h flex-wrap gap-2">
          <h3><i class="bi bi-clock-history me-2 text-primary"></i>E. ${t('product_history')}</h3>
          <div class="d-flex gap-2 flex-wrap align-items-center">
            <select class="form-select form-select-sm w-auto" data-in="phisttype">
              ${opts([['all', t('all')], ['purchase', t('purchases')], ['sale', t('sales')], ['adjustment', t('adjust')], ['opening', t('tx_opening')]], PS.histType)}
            </select>
            <input type="text" class="form-control form-control-sm" style="width:180px" data-in="phistq" value="${PS.histQ}" placeholder="${t('search')}...">
            <span class="badge bg-primary-subtle text-primary border">${n(filteredHist.length)} ${t('items')}</span>
          </div>
        </div>
        <div class="d-md-none p-2">${histMobileCards || `<div class="text-center text-secondary py-4">${t('empty')}</div>`}</div>
        <div class="d-none d-md-block tw">
          <table class="tbl mb-0">
            <thead>
              <tr>
                <th>${t('date')}</th>
                <th>${t('type')}</th>
                <th>${t('ac_ref')}</th>
                <th class="r">${t('qty_kg')}</th>
                <th class="r">${t('prev_stock')}</th>
                <th class="r">${t('curr_stock')}</th>
                <th>${t('note')}</th>
              </tr>
            </thead>
            <tbody>${histDesktopRows || `<tr><td colspan="7" class="text-center text-secondary py-4">${t('empty')}</td></tr>`}</tbody>
          </table>
        </div>
      </section>
    </div>`;

  // Render Sales Performance Chart over time
  setTimeout(() => {
    const cv = document.getElementById('prod-perf-chart');
    if (!cv || typeof Chart === 'undefined') return;
    if (prodChartInst) { try { prodChartInst.destroy(); } catch (_) {} }
    const invPoints = [...info.recentInvoices].reverse();
    const labels = invPoints.length ? invPoints.map(({ v }) => v.dateStr || v[0]) : [t('month')];
    const dataKg = invPoints.length
      ? invPoints.map(({ v }) => sum((v[6] || []).filter(l => l.p === idx).map(l => l.q)))
      : [p.sold || 0];
    prodChartInst = new Chart(cv.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: t('sold_kg'),
          data: dataKg,
          borderColor: '#1B8CA3',
          backgroundColor: 'rgba(27, 140, 163, 0.14)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: true, grid: { display: false } }, y: { beginAtZero: true } }
      }
    });
  }, 60);
}

function prod(){
  if (PS.detailIdx !== null && PS.detailIdx !== undefined) {
    productDetailPage(PS.detailIdx);
    return;
  }
  const{t,D,A,kg,short,n}=F,low=D.products.filter(p=>p.kg<p.min).length,s=(l,v,c='')=>`<div><small class="text-secondary d-block">${t(l)}</small><b class="fs-5 ${c}">${v}</b></div>`;
  $('#view').innerHTML=`<div class="enter"><div class="page-h flex-column flex-sm-row gap-2 align-items-start align-items-sm-center justify-content-between"><div><h2>${t('nav_products')}</h2><p>${t('p_sub')}</p></div><div class="d-flex gap-4 flex-wrap align-items-center"><button class="btn-a" data-act="padd"><i class="bi bi-plus-lg"></i>${t('add_product')}</button>${s('total_stock',kg(sum(D.products.map(p=>p.kg))))}${A()?s('stock_value',short(sum(D.products.map(p=>p.kg*p.cost)))):''}${s('low_stock',n(low),'dn')}</div></div>
<section class="panel"><div class="panel-h flex-wrap gap-2"><div class="seg">${[['all','all'],['low','low_stock']].map(([k,l])=>`<button data-act="tab" data-k="${k}" class="${PS.tab===k?'on':''}">${t(l)}</button>`).join('')}</div>
<div class="d-flex gap-2 flex-wrap"><label class="search" style="width:240px"><i class="bi bi-search"></i><input data-in="pq" value="${PS.q}" placeholder="${t('search_p')}"></label><select class="form-select w-auto" data-in="pcat"><option value="">${t('allcat')}</option>${opts(['paper','board','film','raw'].map(c=>[c,t('cat_'+c)]),PS.cat)}</select></div></div><div id="pwrap">${ptable()}</div></section>${A()?'':`<div class="lock mt-3"><i class="bi bi-lock"></i>${t('hidden')}</div>`}</div>`;
}
P.products=f=>{boot(f);prod()};
ACT.sort=x=>{PS.d=PS.k===x.dataset.k?-PS.d:1;PS.k=x.dataset.k;$('#pwrap').innerHTML=ptable()};
ACT.pg=x=>{PS.pg=+x.dataset.p;$('#pwrap').innerHTML=ptable()};ACT.tab=x=>{PS.tab=x.dataset.k;PS.pg=1;prod()};
IN.pq=x=>{PS.q=x.value;PS.pg=1;$('#pwrap').innerHTML=ptable()};IN.pcat=x=>{PS.cat=x.value;PS.pg=1;$('#pwrap').innerHTML=ptable()};
IN.phisttype=x=>{PS.histType=x.value;if(PS.detailIdx!==null)productDetailPage(PS.detailIdx)};
IN.phistq=x=>{PS.histQ=x.value;if(PS.detailIdx!==null)productDetailPage(PS.detailIdx)};

ACT.adj=x=>{
  const{t,L,kg,D,toast}=F,idx=+x.dataset.i,p=D.products[idx];
  modal(t('adjust')+' – '+L(p.n),`<div class="lrow"><span class="l">${t('stock')}</span><span class="ld"></span><span class="v">${kg(p.kg)}</span></div>`+field('at',t('adj_type'),`<select id="at" class="form-select">${opts([['damage',t('adj_damage')],['short',t('adj_short')],['waste',t('adj_waste')],['add',t('adj_add')]])}</select>`)+field('aq',t('qty_kg'),'<input id="aq" type="number" min="0" class="form-control">')+field('ar',t('reason'),'<input id="ar" class="form-control">'),()=>{
    const q=+$('#aq').value,adjTy=$('#at').value,add=adjTy==='add',reason=$('#ar').value.trim();
    ['aq','ar'].forEach(i=>$('#'+i).classList.remove('is-invalid'));let e=0;
    if(!(q>0))e=bad('aq',t('pos_qty'));else if(!add&&q>p.kg)e=bad('aq',t('exceed'));if(!reason)e=bad('ar',t('req'));if(e)return false;
    const ok = window.FIN.tx(F, () => {
      window.FIN.recordStockMove(F, {
        p: idx,
        qty: q,
        isIn: add,
        kind: 'adjustment',
        adjType: adjTy,
        ty: t('adj_' + adjTy),
        ref: 'ADJ-' + Date.now().toString(36).toUpperCase().slice(-5),
        party: 'Warehouse Adjustment',
        remarks: `${t('adj_' + adjTy)}: ${reason}`
      });
      if(typeof LOG!=='undefined') LOG.add({m:'products',t:'adjust',recordType:'stock_adjustment',recordId:p.sku,msg:`${L(p.n)} স্টক সমন্বয় (${add?'+':'-'}${q} KG): ${reason}`});
      return true;
    });
    if(ok){toast(t('adj_done'),'check-circle');prod()}
  });
};

/* ================= Dedicated Product Details Page ================= */
ACT.pview = (x) => {
  PS.detailIdx = +x.dataset.i;
  PS.histType = 'all';
  PS.histQ = '';
  if (location.hash.includes('products')) prod();
  else { location.hash = '#/products'; }
};
ACT.pback = () => {
  PS.detailIdx = null;
  prod();
};

/* ================= New & Edit Sales Invoice Interface (Req 1, 3, 4) ================= */
const IV={method:'m_cash',c:0,lines:[{p:0,q:1000,pr:null}],disc:0,carry:0,vat:5,mode:'credit',paid:0,no:1185,challan:'CH-405',editingIdx:undefined};
const price=l=>l.pr??(F.D.products[l.p]?F.D.products[l.p].price:0);
function isVatOn(){return window.FIN ? window.FIN.isVatOn() : false}
function resetIV(custIdx){
  const D = F?.D;
  const maxNo = D && D.invoices ? D.invoices.reduce((m,v)=>Math.max(m, parseInt(String(v[0]).replace(/\D/g,'').slice(-4))||1184), 1184) : 1184;
  if (IV.no <= maxNo) IV.no = maxNo + 1;
  IV.editingIdx = undefined;
  IV.c = (custIdx !== undefined && D?.customers?.[custIdx]) ? +custIdx : 0;
  IV.lines = [{p:0, q:500, pr:null}];
  IV.disc = 0;
  IV.carry = 0;
  IV.vat = window.FIN ? window.FIN.getVatPct() : 5;
  IV.mode = 'credit';
  IV.paid = 0;
  IV.method = F && !F.methods().includes(IV.method) ? 'm_cash' : (IV.method || 'm_cash');
  IV.challan = 'CH-' + (IV.no - 780);
}

function tot(){
  const{D}=F;
  const c=D.customers&&D.customers[IV.c];
  let prevDue=(c&&typeof c.due==='number')?c.due:0;
  if(IV.editingIdx!==undefined && D.invoices && D.invoices[IV.editingIdx]){
    const origV = D.invoices[IV.editingIdx];
    if(origV[1]===IV.c){
      const origUnpaid = Math.max(0, (+origV[2]||0) - (+origV[3]||0));
      prevDue = Math.max(0, Math.round((prevDue - origUnpaid)*100)/100);
    }
  }
  const sub=sum(IV.lines.map(l=>(+l.q||0)*price(l))),da=Math.round(sub*(IV.disc||0)/100);
  const vatPct = isVatOn() ? (+IV.vat || (window.FIN?window.FIN.getVatPct():5)) : 0;
  const v=isVatOn()?Math.round((sub-da)*vatPct/100):0;
  const g=Math.max(0, Math.round(sub-da+v+(+IV.carry||0)));
  const totalPayable=Math.round(g+prevDue);
  const rawPaid=IV.mode==='cash'?g:IV.mode==='credit'?0:Math.max(0, Math.min(+IV.paid||0,totalPayable));
  const billPaid = Math.min(rawPaid, g);
  const extraPrevColl = Math.max(0, rawPaid - billPaid);
  const closingDue=Math.max(0,totalPayable-rawPaid);
  const due=Math.max(0,g-billPaid);
  const pr=Math.round(sum(IV.lines.map(l=>(+l.q||0)*(price(l)-(D.products[l.p]?D.products[l.p].cost:0))))-da);
  return{sub,da,v,vatPct,g,prevDue,totalPayable,paid:rawPaid,billPaid,extraPrevColl,due,closingDue,pr};
}

const lrows=()=>{
  const{t,L,D,kg,tk}=F;
  return IV.lines.map((l,i)=>{
    const p = D.products[l.p] || D.products[0];
    const lineTot = (+l.q||0)*price(l);
    return `
    <tr>
      <td data-label="${t('product')}" style="min-width:220px">
        <select class="form-select form-select-sm" data-in="lp" data-i="${i}">${opts(D.products.map((x,j)=>[j,`${L(x.n)} (${x.sku})`]),l.p)}</select>
        <div class="small mt-1 text-secondary d-flex align-items-center justify-content-between">
          <span><i class="bi bi-box me-1"></i>${t('stock')}: <b class="${p.kg<p.min?'dn':''}">${kg(p.kg)}</b></span>
        </div>
      </td>
      <td data-label="${t('qty_kg')}">
        <div class="input-group input-group-sm" style="min-width:118px;max-width:140px">
          <input type="number" min="1" step="10" class="form-control" id="lq${i}" data-in="lq" data-i="${i}" value="${l.q}">
          <span class="input-group-text">${t('kg')}</span>
        </div>
      </td>
      <td data-label="${t('price')} / ${t('kg')}">
        <div class="input-group input-group-sm" style="min-width:110px;max-width:135px">
          <span class="input-group-text">৳</span>
          <input type="number" min="0" step="0.5" class="form-control" data-in="lpr" data-i="${i}" value="${price(l)}">
        </div>
      </td>
      <td data-label="${t('total')}" class="r fw-bold fs-6" id="lt${i}">${tk(lineTot)}</td>
      <td class="text-center" style="width:42px">
        <button class="btn btn-sm btn-outline-danger p-1" style="min-width:34px;min-height:34px;line-height:1" aria-label="Remove" data-act="rm" data-i="${i}" ${IV.lines.length<=1?'disabled':''}>
          <i class="bi bi-trash3"></i>
        </button>
      </td>
    </tr>`;
  }).join('');
};

function inv(){
  const{t,L,D,A,lrow}=F,isEdit=IV.editingIdx!==undefined&&IV.editingIdx!==null,vatActive=isVatOn();
  const c=D.customers[IV.c] || D.customers[0];
  $('#view').innerHTML=`
    <div class="enter invoice-creation-page">
      <!-- Clean Minimal Header -->
      <div class="page-h d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div class="d-flex align-items-center gap-2 gap-sm-3 flex-wrap">
          <button class="btn-o" data-act="ilist"><i class="bi bi-arrow-left me-1"></i>${t('inv_list')}</button>
          <div>
            <h2 class="mb-0">${isEdit?t('edit_invoice'):t('new_invoice')}</h2>
            <small class="text-secondary">${t('i_sub')}</small>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <button class="btn btn-sm btn-outline-primary" data-act="inv-prev">
            <i class="bi bi-eye me-1"></i>${t('preview_draft') || 'Preview Invoice'}
          </button>
          <span class="badge bg-primary-subtle text-primary border px-3 py-2 fs-6">INV-2026-${IV.no}</span>
          ${isEdit?`<span class="badge bg-warning text-dark px-2 py-1">${t('edit')}</span>`:''}
        </div>
      </div>

      <div class="row g-3">
        <!-- Main Form Column (Left) -->
        <div class="col-xl-8 d-flex flex-column gap-3">

          <!-- 1. Client Selection & Dispatch Card -->
          <div class="card border shadow-sm">
            <div class="card-header py-2 d-flex justify-content-between align-items-center" style="background:var(--surface-2)">
              <span class="fw-bold text-primary"><i class="bi bi-person-badge me-2"></i>${t('sel_cust')}</span>
              <button class="btn btn-sm btn-link text-decoration-none p-0" data-act="cadd"><i class="bi bi-plus-circle me-1"></i>${t('add_customer')}</button>
            </div>
            <div class="card-body p-3">
              <div class="row g-2 g-sm-3">
                <div class="col-12 col-md-7">
                  <label class="form-label fw-semibold mb-1">${t('customer')}</label>
                  <select class="form-select" data-in="cust">${opts(D.customers.map((x,i)=>[i,`${L(x)} (${x.code||'#'+(101+i)}) · ${x.phone||''}`]),IV.c)}</select>
                </div>
                <div class="col-12 col-md-5">
                  <label class="form-label fw-semibold mb-1"><i class="bi bi-truck me-1 text-primary"></i>${t('challan_no')}</label>
                  <input class="form-control" data-in="challan" value="${IV.challan||''}" placeholder="e.g. CH-405">
                </div>
                <div class="col-12" id="cinfo"></div>
              </div>
            </div>
          </div>

          <!-- 2. Product Selection & Quantities Card -->
          <div class="card border shadow-sm">
            <div class="card-header py-2 d-flex justify-content-between align-items-center" style="background:var(--surface-2)">
              <span class="fw-bold text-primary"><i class="bi bi-boxes me-2"></i>${t('lines')}</span>
              <button class="btn btn-sm btn-primary" data-act="add"><i class="bi bi-plus-lg me-1"></i>${t('add_line')}</button>
            </div>
            <div class="tw">
              <table class="tbl mb-0" id="inv-lines-table">
                <thead>
                  <tr>
                    <th>${t('product')}</th>
                    <th>${t('qty_kg')}</th>
                    <th>${t('price')} / ${t('kg')}</th>
                    <th class="r">${t('total')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${lrows()}
                </tbody>
              </table>
            </div>
            <div class="p-2 border-top text-end" style="background:var(--surface-2)">
              <button class="btn btn-sm btn-outline-primary" data-act="add"><i class="bi bi-plus-lg me-1"></i>${t('add_line')}</button>
            </div>
          </div>

          <!-- 3. Charges & Payment Settlement Card -->
          <div class="card border shadow-sm">
            <div class="card-header py-2" style="background:var(--surface-2)">
              <span class="fw-bold text-primary"><i class="bi bi-credit-card me-2"></i>${t('charges')} & ${t('payment')}</span>
            </div>
            <div class="card-body p-3">
              <div class="row g-2 g-sm-3">
                <div class="${vatActive?'col-6 col-sm-4':'col-6'}">
                  <label class="form-label fw-semibold mb-1">${t('discount')} (%)</label>
                  <input type="number" min="0" max="100" step="0.5" class="form-control" data-in="disc" value="${IV.disc||0}">
                </div>
                <div class="${vatActive?'col-6 col-sm-4':'col-6'}">
                  <label class="form-label fw-semibold mb-1">${t('carry')} (৳)</label>
                  <input type="number" min="0" class="form-control" data-in="carry" value="${IV.carry||0}">
                </div>
                ${vatActive ? `
                  <div class="col-12 col-sm-4">
                    <label class="form-label fw-semibold mb-1">${t('vat')} (%)</label>
                    <input type="number" min="0" step="0.5" class="form-control" data-in="vat" value="${IV.vat ?? (window.FIN?window.FIN.getVatPct():5)}">
                  </div>` : ''}
              </div>

              <hr class="my-3">

              <div class="row g-2 g-sm-3 align-items-end">
                <div class="col-12 col-md-5">
                  <label class="form-label fw-semibold mb-1 d-block">${t('payment')}</label>
                  <div class="seg w-100">
                    ${[['cash','pm_cash'],['credit','pm_credit'],['part','pm_part']].map(([k,l])=>`
                      <button data-act="mode" data-m="${k}" class="${IV.mode===k?'on':''} flex-fill">${t(l)}</button>
                    `).join('')}
                  </div>
                </div>
                <div class="col-12 col-md-4" id="mw" style="${IV.mode==='credit'?'display:none':''}">
                  <label class="form-label fw-semibold mb-1">${t('method')}</label>
                  <select class="form-select" data-in="imethod">${opts(F.methods().map(k=>[k,t(k)]),IV.method)}</select>
                </div>
                <div class="col-12 col-md-3" id="paidw" style="${IV.mode==='part'?'':'display:none'}">
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
              <div class="card-header py-3 d-flex justify-content-between align-items-center" style="background:var(--surface-2)">
                <h6 class="fw-bold mb-0 text-primary"><i class="bi bi-file-earmark-text me-2"></i>${t('inv_detail') || 'Invoice Summary'}</h6>
                <span class="badge bg-primary-subtle text-primary border">INV-2026-${IV.no}</span>
              </div>
              <div class="card-body p-3">
                <div id="pv-lines" class="mb-3 pb-2 border-bottom small"></div>

                <div class="summary-breakdown">
                  ${[['subtotal','s-sub'],['discount','s-disc'],...(vatActive?[['vat','s-vat']]:[]),['carry','s-carry']].map(([l,id])=>lrow(t(l),`<span id="${id}"></span>`)).join('')}
                  ${lrow(t('current_bill') || t('grand'), '<span id="s-grand" class="fw-bold"></span>').replace('lrow', 'lrow border-top pt-2')}
                  ${lrow(t('past_due') || 'Previous Due', '<span id="s-prevdue" class="fw-semibold text-danger"></span>')}
                  ${lrow(t('total_payable') || 'Total Payable', '<span id="s-totpayable" class="fs-5 fw-bold text-primary"></span>').replace('lrow', 'lrow tot border-top pt-2 pb-1')}
                  ${lrow(t('paid'), '<span id="s-paid" class="up fw-bold"></span>')}
                  ${lrow(t('net_closing_due') || t('due_after') || 'Closing Due', '<span id="s-due" class="dn fw-bold fs-6"></span>')}
                  ${A()?lrow(t('est_profit'),'<span id="s-pr" class="up"></span>'):''}
                </div>

                <div id="s-warn" class="mt-3"></div>

                <div class="d-grid gap-2 mt-4">
                  <button class="btn-a w-100 justify-content-center py-2 fs-6" data-act="save">
                    <i class="bi bi-check2-circle me-1"></i>${isEdit?t('save'):t('save_inv')}
                  </button>
                  <button class="btn btn-outline-primary w-100 py-2" data-act="inv-prev">
                    <i class="bi bi-eye me-1"></i>${t('preview_draft') || 'Preview Invoice'} (A4)
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
  const{t,L,D,tk,kg,lrow}=F,T=tot(),c=D.customers[IV.c]||D.customers[0],set=(id,v)=>{const el=$('#'+id);if(el)el.textContent=v;};
  IV.lines.forEach((l,i)=>{
    set('lt'+i,tk((+l.q||0)*price(l)));
    const inp=$('#lq'+i);
    if(inp){
      const p=D.products[l.p];
      let avail=p?p.kg:0;
      if(IV.editingIdx!==undefined && D.invoices[IV.editingIdx]){
        avail += sum((D.invoices[IV.editingIdx][6]||[]).filter(ol=>ol.p===l.p).map(ol=>ol.q));
      }
      inp.classList.toggle('is-invalid',(l.q>avail)||(+l.q<=0));
    }
  });
  const pvEl=$('#pv-lines');
  if(pvEl)pvEl.innerHTML=IV.lines.map(l=>lrow(L(D.products[l.p].n),`${kg(+l.q||0)} × ${tk(price(l))}`)).join('');
  set('s-sub',tk(T.sub));
  set('s-disc','− '+tk(T.da));
  if(isVatOn())set('s-vat',tk(T.v));
  set('s-carry',tk(+IV.carry||0));
  set('s-grand',tk(T.g));
  set('s-prevdue',(T.prevDue>0?'+ ':'')+tk(T.prevDue));
  set('s-totpayable',tk(T.totalPayable));
  set('s-paid',tk(T.paid));
  set('s-due',tk(T.closingDue));
  if($('#s-pr'))set('s-pr',tk(T.pr));

  const after=T.closingDue,over=c && c.limit && after>c.limit;
  const warnEl=$('#s-warn');
  if(warnEl)warnEl.innerHTML=over?`<div class="alert alert-danger p-2 small mb-0"><i class="bi bi-exclamation-triangle me-1"></i>${t('credit_warn')}</div>`:'';

  const cinfoEl=$('#cinfo');
  if(cinfoEl && c){
    cinfoEl.innerHTML=`
      <div class="p-2 rounded border small" style="background:var(--surface-2)">
        <div class="d-flex justify-content-between mb-1 flex-wrap gap-2">
          <span>${t('phone')}: <b>${c.phone||'—'}</b></span>
          <span>${t('credit_limit') || t('limit')}: <b>${tk(c.limit)}</b></span>
          <span>${t('prev_due') || t('old_due')}: <b class="${T.prevDue>0?'text-danger':''}">${tk(T.prevDue)}</b></span>
        </div>
        ${T.prevDue>0?`<div class="text-danger small mt-1"><i class="bi bi-info-circle me-1"></i>${t('prev_balance_note')}</div>`:''}
        <div class="bar mt-1"><i style="width:${Math.min(100,c.limit?(after/c.limit*100):0)}%;background:${over?'var(--danger)':'var(--accent)'}"></i></div>
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
ACT.rm=x=>{if(IV.lines.length>1){IV.lines.splice(+x.dataset.i,1);inv()}};
ACT.mode=x=>{IV.mode=x.dataset.m;inv()};

ACT.save=()=>{
  const{t,L,D,toast,tk}=F,T=tot();
  const isEdit = IV.editingIdx !== undefined && IV.editingIdx !== null;
  if(isEdit && window.FIN && !window.FIN.canEditDel(F)){
    toast(t('no_edit_del_perm'),'shield-exclamation');
    return;
  }
  let err=!IV.lines.length?t('no_lines'):'';
  const reqQtyByProd = {};
  IV.lines.forEach(l=>{
    if(!(+l.q>0)) err=t('pos_qty');
    reqQtyByProd[l.p] = (reqQtyByProd[l.p]||0) + (+l.q||0);
  });
  if(!err){
    Object.entries(reqQtyByProd).forEach(([pIdx, qNeed])=>{
      let avail = D.products[+pIdx]?.kg || 0;
      if(isEdit && D.invoices[IV.editingIdx]){
        avail += sum((D.invoices[IV.editingIdx][6]||[]).filter(ol=>ol.p===+pIdx).map(ol=>ol.q));
      }
      if(qNeed > avail) err = t('exceed');
    });
  }
  if(err){toast(err,'exclamation-triangle');return}

  const c = D.customers[IV.c];
  const no = 'INV-2026-' + IV.no;
  const challanNo = (IV.challan && IV.challan.trim()) || ('CH-' + (IV.no - 780));
  const mth = F.methods().includes(IV.method)?IV.method:'m_cash';

  if (isEdit) {
    const editIdx = IV.editingIdx;
    const v = D.invoices[editIdx];
    if (!v) return;

    const ok = window.FIN.tx(F, () => {
      const oldCustIdx = v[1];
      const oldG = +v[2] || 0;
      const oldPaid = +v[3] || 0;
      const oldMethod = v[7] || 'm_cash';
      const oldLines = v[6] ? JSON.parse(JSON.stringify(v[6])) : [];
      const oldSnap = { no: v[0], cust: oldCustIdx, total: oldG, paid: oldPaid, challan: v.challan };

      // 1. Restore old line items stock & log traceable movement
      oldLines.forEach(l => {
        window.FIN.recordStockMove(F, {
          p: l.p, qty: l.q, isIn: true, kind: 'sale_rev', ty: 'Invoice Edit Restore',
          ref: no, challan: v.challan || '', invIdx: editIdx,
          party: D.customers[oldCustIdx] ? L(D.customers[oldCustIdx]) : 'Customer',
          remarks: `Reversed prior line before updating ${no}`
        });
      });

      // 2. Deduct updated line items stock & log traceable movement
      const cleanLines = IV.lines.map(l => ({ p: l.p, q: +l.q, pr: price(l) }));
      cleanLines.forEach(l => {
        window.FIN.recordStockMove(F, {
          p: l.p, qty: l.q, isIn: false, kind: 'sale', ty: 'Stock Out',
          ref: no, challan: challanNo, invIdx: editIdx,
          party: L(c),
          remarks: `Updated invoice ${no} dispatch`
        });
      });

      // 3. Synchronize cash/bank delta & payment history safely (preserving audit history)
      if (!v.payments) v.payments = [];
      const newBillPaid = T.billPaid;
      const dPaid = newBillPaid - oldPaid;
      if (dPaid !== 0) {
        if (dPaid > 0) {
          post(mth, dPaid);
          v.payments.push({
            id: 'PAY-2026-' + (++D.paySeq),
            invNo: no, c: IV.c, dt: Date.now(), dtStr: window.FIN.fmtDtTime(Date.now(), F),
            amt: dPaid, m: mth, ref: 'EDIT-ADD-' + no,
            u: F.S.user ? L(F.S.user.n) : 'Admin', note: 'Additional payment on invoice edit', status: 'posted'
          });
        } else {
          const refundAmt = Math.abs(dPaid);
          window.FIN.postCashBank(D, oldMethod, -refundAmt);
          v.payments.push({
            id: 'REV-2026-' + (++D.paySeq),
            invNo: no, c: IV.c, dt: Date.now(), dtStr: window.FIN.fmtDtTime(Date.now(), F),
            amt: -refundAmt, m: oldMethod, ref: 'EDIT-ADJ-' + no,
            u: F.S.user ? L(F.S.user.n) : 'Admin', note: 'Payment reduced during invoice edit',
            status: 'reversal', revReason: 'Invoice Edit Adjustment'
          });
          // Adjust posted total logically
          let remToTrim = refundAmt;
          for (let k = v.payments.length - 1; k >= 0 && remToTrim > 0; k--) {
            if (v.payments[k].status === 'posted') {
              const take = Math.min(v.payments[k].amt, remToTrim);
              v.payments[k].amt -= take;
              remToTrim -= take;
              if (v.payments[k].amt <= 0) v.payments[k].status = 'reversed';
            }
          }
        }
      }

      if (T.extraPrevColl > 0) {
        post(mth, T.extraPrevColl);
        D.dueCollections.unshift({
          id: 'COLL-' + Date.now().toString(36).toUpperCase(),
          custId: IV.c, custName: L(c), invNo: 'GEN-RECV',
          prevDue: T.prevDue, amt: T.extraPrevColl, remDue: T.closingDue,
          dt: Date.now(), dtStr: window.FIN.fmtDtTime(Date.now(), F),
          m: mth, ref: 'COLL-INV-' + no, by: F.S.user ? L(F.S.user.n) : 'Admin',
          remarks: `Excess paid via ${no} applied to previous balance`
        });
      }

      // 4. Update daily metrics & customer sales volume
      const di = D.daily.sales.length - 1;
      D.daily.sales[di] = Math.max(0, D.daily.sales[di] + (T.g - oldG));
      D.daily.coll[di] = Math.max(0, D.daily.coll[di] + (T.paid - oldPaid));
      if (D.customers[oldCustIdx]) D.customers[oldCustIdx].v = Math.max(0, (D.customers[oldCustIdx].v||0) - oldG);
      c.v = (c.v||0) + T.g;

      // 5. Mutate invoice tuple fields
      v[0] = no;
      v[1] = IV.c;
      v[2] = Math.round(T.g);
      v[3] = Math.round(newBillPaid);
      v[4] = (T.g - newBillPaid) <= 0 ? 'paid' : newBillPaid > 0 ? 'partial' : 'due';
      v[5] = Math.round(T.pr);
      v[6] = cleanLines;
      v[7] = mth;
      v.challan = challanNo;
      v.subtotal = T.sub;
      v.discPct = +IV.disc || 0;
      v.discount = T.da;
      v.carry = +IV.carry || 0;
      v.vatPct = T.vatPct;
      v.vat = T.v;
      v.prevDue = T.prevDue;
      v.currentBill = T.g;
      v.totalPayable = T.totalPayable;
      v.closingDue = T.closingDue;

      // 6. Reconcile affected customers & memorize party rates
      window.FIN.reconcileCustomer(oldCustIdx, F);
      if (IV.c !== oldCustIdx) window.FIN.reconcileCustomer(IV.c, F);
      if (window.UI?.savePartyPrice) {
        cleanLines.forEach(l => window.UI.savePartyPrice(IV.c, l.p, l.pr, l.q, no));
      }
      if (typeof LOG !== 'undefined') {
        LOG.add({
          m: 'sales', t: 'edit', recordType: 'invoice', recordId: no,
          changes: { before: oldSnap, after: { no, cust: IV.c, total: T.g, paid: newBillPaid, challan: challanNo } },
          msg: `ইনভয়েস ${no} আপডেট হয়েছে (${tk(oldG)} → ${tk(T.g)})`
        });
      }
      return true;
    });

    if (ok) {
      toast(t('saved'), 'check-circle');
      resetIV();
      if (window.UI && window.UI.salesList) window.UI.salesList();
      else location.hash = '#/sales';
    }
    return;
  }

  // NEW INVOICE WORKFLOW
  const ok = window.FIN.tx(F, () => {
    const di = D.daily.sales.length - 1;
    const newBillPaid = T.billPaid;
    if (T.paid > 0) post(mth, T.paid);
    D.daily.sales[di] += T.g;
    D.daily.coll[di] += T.paid;
    c.v = (c.v||0) + T.g;

    const dObj = new Date();
    const cleanLines = IV.lines.map(l => ({ p: l.p, q: +l.q, pr: price(l) }));
    const invTuple = [no, IV.c, Math.round(T.g), Math.round(newBillPaid), (T.g - newBillPaid) <= 0 ? 'paid' : newBillPaid > 0 ? 'partial' : 'due', Math.round(T.pr), cleanLines, mth];
    invTuple.challan = challanNo;
    invTuple.createdTs = dObj.getTime();
    invTuple.dateStr = window.FIN.fmtDt(dObj.getTime(), F);
    invTuple.subtotal = T.sub;
    invTuple.discPct = +IV.disc || 0;
    invTuple.discount = T.da;
    invTuple.carry = +IV.carry || 0;
    invTuple.vatPct = T.vatPct;
    invTuple.vat = T.v;
    invTuple.prevDue = T.prevDue;
    invTuple.currentBill = T.g;
    invTuple.totalPayable = T.totalPayable;
    invTuple.closingDue = T.closingDue;
    invTuple.payments = [];

    if (newBillPaid > 0) {
      invTuple.payments.push({
        id: 'PAY-2026-' + (++D.paySeq),
        invNo: no, c: IV.c, dt: dObj.getTime(), dtStr: window.FIN.fmtDtTime(dObj.getTime(), F),
        amt: newBillPaid, m: mth, ref: 'TXN-' + Math.floor(10000 + Math.random()*90000),
        u: F.S.user ? L(F.S.user.n) : 'System', note: 'Invoice payment', status: 'posted'
      });
    }
    if (T.extraPrevColl > 0) {
      D.dueCollections.unshift({
        id: 'COLL-' + Date.now().toString(36).toUpperCase(),
        custId: IV.c, custName: L(c), invNo: 'GEN-RECV',
        prevDue: T.prevDue, amt: T.extraPrevColl, remDue: T.closingDue,
        dt: dObj.getTime(), dtStr: window.FIN.fmtDtTime(dObj.getTime(), F),
        m: mth, ref: 'COLL-' + no, by: F.S.user ? L(F.S.user.n) : 'System',
        remarks: `Previous balance settled with ${no}`
      });
    }

    D.invoices.unshift(invTuple);
    // Keep invIdx pointers in stockMovements in sync after unshift
    (D.stockMovements || []).forEach(mv => {
      if (mv.invIdx !== undefined && mv.invIdx >= 0) mv.invIdx++;
    });

    cleanLines.forEach(l => {
      window.FIN.recordStockMove(F, {
        p: l.p, qty: l.q, isIn: false, kind: 'sale', ty: 'Stock Out',
        ref: no, challan: challanNo, invIdx: 0,
        party: L(c), partyType: 'customer',
        remarks: `Sales Invoice ${no} (${challanNo})`
      });
    });

    window.FIN.reconcileCustomer(IV.c, F);
    if (window.UI?.savePartyPrice) {
      cleanLines.forEach(l => window.UI.savePartyPrice(IV.c, l.p, l.pr, l.q, no));
    }

    if (typeof LOG !== 'undefined') {
      LOG.add({ m: 'sales', t: 'save', recordType: 'invoice', recordId: no, msg: `নতুন ইনভয়েস তৈরি: ${no} (চালান: ${challanNo}) – ${tk(T.g)}` });
    }
    return true;
  });

  if (!ok) return;

  resetIV();

  // Confirmation Popup with 4 required actions (no auto print/send)
  const confirmPopupHtml = `
    <div class="text-center p-2">
      <div class="mb-3">
        <div style="width:68px;height:68px;border-radius:50%;background:rgba(44,197,190,0.14);color:#2CC5BE;display:inline-flex;align-items:center;justify-content:center;font-size:36px">
          <i class="bi bi-check2-circle"></i>
        </div>
      </div>
      <h4 class="fw-bold mb-1">${t('invoice_created_success')}</h4>
      <p class="text-secondary small mb-3">${t('invoice_created_sub')}</p>

      <div class="card border p-3 mb-4 text-start" style="background:var(--surface-2)">
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
            <b class="fs-6">${tk(T.g)}</b>
          </div>
          ${T.prevDue > 0 ? `
            <div class="col-6"><span class="text-secondary d-block">${t('past_due')}</span><b class="text-danger">+ ${tk(T.prevDue)}</b></div>
            <div class="col-6 text-end"><span class="text-secondary d-block">${t('total_payable')}</span><b class="text-primary fs-6">${tk(T.totalPayable)}</b></div>
          ` : ''}
          <div class="col-6"><span class="text-secondary d-block">${t('paid')}</span><b class="up">${tk(T.paid)}</b></div>
          <div class="col-6 text-end"><span class="text-secondary d-block">${t('net_closing_due') || t('due_amt')}</span><b class="dn">${tk(T.closingDue)}</b></div>
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
};

/* Preview Draft Invoice Action */
ACT['inv-prev'] = () => {
  if (window.UI && window.UI.showDoc && window.UI.paper) {
    const title = (F.t('preview_draft') || 'Preview Invoice') + ' – INV-2026-' + IV.no;
    const p = window.UI.paper('draft', 'a4');
    window.UI.showDoc(title, p, p, false);
  }
};

/* Confirmation Popup & User-Friendly WhatsApp Sharing Assistant */
ACT['conf-prev'] = (x) => {
  const { D, t } = F;
  const idx = +x.dataset.i || 0;
  const v = D.invoices[idx];
  if (!v) return;
  try { const m = bootstrap.Modal.getInstance(document.querySelector('#modal')); if (m) m.hide(); } catch (_) {}
  setTimeout(() => {
    if (window.UI && window.UI.showDoc && window.UI.paper) {
      window.UI.showDoc(v[0] + ' – ' + t('print_a4'), window.UI.paper(idx, 'a4'), window.UI.paper(idx, 'a4'), false);
    }
  }, 220);
};

ACT['conf-print'] = (x) => {
  const { D } = F;
  const idx = +x.dataset.i || 0;
  const v = D.invoices[idx];
  if (!v) return;
  try { const m = bootstrap.Modal.getInstance(document.querySelector('#modal')); if (m) m.hide(); } catch (_) {}
  if (window.UI && window.UI.printDoc && window.UI.paper) {
    window.UI.printDoc(window.UI.paper(idx, 'a4'), v[0]);
  }
};

function openWaShareModal(idx) {
  const { D, L, lg, tk, t, toast } = F;
  const v = D.invoices[idx];
  if (!v) return;
  const c = D.customers[v[1]] || { bn: 'কাস্টমার', en: 'Customer', phone: '' };
  const due = Math.max(0, (+v[2]||0) - (+v[3]||0));
  const msg = lg([
    `আসসালামু আলাইকুম, ${c.bn}। ইনভয়েস ${v[0]} (চালান: ${v.challan || '—'}): চলতি বিল ${tk(v[2])}, পরিশোধ ${tk(v[3])}, এই বিলের বকেয়া ${tk(due)}, মোট বকেয়া ${tk(c.due)}। ধন্যবাদ – ${(window.UI?.ST?.co?.name) || 'Ultra Fast'}।`,
    `Hello ${c.en}. Invoice ${v[0]} (Challan: ${v.challan || '—'}): Bill ${tk(v[2])}, Paid ${tk(v[3])}, Bill Due ${tk(due)}, Total Balance ${tk(c.due)}. Thank you – ${(window.UI?.ST?.co?.name) || 'Ultra Fast'}.`
  ]);
  const rawPh = (c.phone || '').replace(/[^\d+]/g, '');

  const html = `
    <div class="p-1">
      <div class="alert alert-info small d-flex align-items-start gap-2 mb-3">
        <i class="bi bi-info-circle-fill fs-5 text-info flex-shrink-0"></i>
        <div>${t('wa_pdf_hint')}</div>
      </div>
      ${field('wa_phone', t('wa_phone_lbl'), `<input id="wa_phone" class="form-control" value="${rawPh}" placeholder="017XXXXXXXX">`)}
      ${field('wa_msg', t('wa_msg_lbl'), `<textarea id="wa_msg" rows="4" class="form-control">${msg}</textarea>`)}
      <div class="d-grid gap-2 mt-3">
        <button type="button" class="btn btn-success py-2" id="waGoBtn">
          <i class="bi bi-whatsapp me-1"></i>${t('wa_open_btn')}
        </button>
        <div class="row g-2">
          <div class="col-6">
            <button type="button" class="btn btn-outline-secondary w-100" id="waCopyBtn">
              <i class="bi bi-clipboard me-1"></i>${t('copy')}
            </button>
          </div>
          <div class="col-6">
            <button type="button" class="btn btn-outline-primary w-100" id="waPdfBtn">
              <i class="bi bi-file-earmark-pdf me-1"></i>${t('wa_pdf_btn')}
            </button>
          </div>
        </div>
      </div>
    </div>`;

  try { const m = bootstrap.Modal.getInstance(document.querySelector('#modal')); if (m) m.hide(); } catch (_) {}
  setTimeout(() => {
    modal(t('wa_title') + ' – ' + v[0], html, null, null);
    const goBtn = $('#waGoBtn'), cpBtn = $('#waCopyBtn'), pdfBtn = $('#waPdfBtn');
    if (goBtn) {
      goBtn.onclick = () => {
        const phEl = $('#wa_phone');
        const digits = (phEl.value || '').replace(/\D/g, '');
        phEl.classList.remove('is-invalid');
        if (digits.length < 10) {
          bad('wa_phone', t('wa_no_phone'));
          return;
        }
        const fullPhone = digits.startsWith('88') ? digits : ('88' + (digits.startsWith('0') ? digits : '0' + digits));
        const text = $('#wa_msg').value || msg;
        const win = window.open('https://wa.me/' + fullPhone + '?text=' + encodeURIComponent(text), '_blank');
        if (win) toast(t('wa_opened_hint'), 'info-circle');
        else toast(t('wa_pdf_hint'), 'exclamation-triangle');
      };
    }
    if (cpBtn) {
      cpBtn.onclick = () => {
        navigator.clipboard?.writeText($('#wa_msg').value || msg).catch(() => {});
        toast(t('copied'), 'clipboard-check');
      };
    }
    if (pdfBtn) {
      pdfBtn.onclick = () => {
        if (window.UI && window.UI.printDoc && window.UI.paper) {
          window.UI.printDoc(window.UI.paper(idx, 'a4'), v[0]);
        }
      };
    }
  }, 220);
}

ACT['conf-wa'] = (x) => {
  openWaShareModal(+x.dataset.i || 0);
};

/* ================= Customers & Dues Directory ================= */
function cust(){const{t,L,D,tk,short,n,panel}=F,totDue=sum(D.customers.map(c=>c.due)),o90=sum(D.customers.filter(c=>c.days>90).map(c=>c.due)),near=D.customers.filter(c=>c.due>c.limit*.7).length;
 const s=(l,v)=>`<div><span>${t(l)}</span><b>${v}</b></div>`;
 const sorted = D.customers.map((c,i)=>({c,i})).sort((a,b)=>b.c.due-a.c.due);

 const custCards = `
   <div class="d-md-none p-2">
     ${sorted.map(({c,i})=>`
       <div class="mob-tx-card mb-2 p-3">
         <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
           <div>
             <a href="javascript:void(0)" data-act="cstmtview" data-i="${i}" class="fw-bold text-decoration-none fs-6">${L(c)}</a>
             <small class="d-block text-secondary">${c.code||'CUST-'+(101+i)} · ${c.phone||''}</small>
           </div>
           <div>${c.due<=0?bd('paid','clear'):c.days>90?bd('due','overdue'):bd('partial','outstanding')}</div>
         </div>
         <div class="p-2 rounded border bg-surface-2 d-flex justify-content-between align-items-center mb-2">
           <div><span class="small text-secondary d-block">${t('due_amt')}</span><b class="${c.due>0?'dn':'up'} fs-6">${tk(c.due)}</b></div>
           <div class="text-end"><span class="small text-secondary d-block">${t('limit')}</span><b>${short(c.limit)}</b></div>
         </div>
         <div class="d-flex gap-1 flex-wrap pt-2 border-top">
           <button class="btn btn-sm btn-outline-primary flex-fill py-2" data-act="cstmtview" data-i="${i}"><i class="bi bi-journal-text me-1"></i>${t('statement')}</button>
           <button class="btn btn-sm btn-primary flex-fill py-2" data-act="collect" data-i="${i}" ${c.due<=0?'disabled':''}><i class="bi bi-cash-coin me-1"></i>${t('collect')}</button>
           <button class="icon-btn ib" data-act="cedit" data-i="${i}" aria-label="${t('edit')}"><i class="bi bi-pencil"></i></button>
           <button class="icon-btn ib" data-act="cdel" data-i="${i}" aria-label="${t('delete')}"><i class="bi bi-trash3"></i></button>
         </div>
       </div>`).join('')}
   </div>`;

 $('#view').innerHTML=`<div class="enter"><div class="page-h flex-column flex-sm-row gap-2 align-items-start align-items-sm-center justify-content-between"><div><h2>${t('nav_customers')}</h2><p>${t('c_sub')}</p></div><div class="d-flex gap-2 flex-wrap"><button class="btn-o" data-go="dues"><i class="bi bi-wallet-fill me-1"></i>${t('nav_dues')}</button><button class="btn-a" data-act="cadd"><i class="bi bi-plus-lg"></i>${t('add_customer')}</button></div></div>${panel('',`<div class="strip strip-4">${s('total_due',short(totDue))}${s('o90',short(o90))}${s('today_coll',short(D.daily.coll.at(-1)))}${s('overlim',n(near)+' / '+n(D.customers.length))}</div>${custCards}<div class="d-none d-md-block tw"><table class="tbl"><thead><tr><th>${t('customer')}</th><th style="width:190px">${t('credit_used')}</th><th class="r">${t('due_amt')}</th><th class="r">${t('days')}</th><th>${t('status')}</th><th></th></tr></thead><tbody>${sorted.map(({c,i})=>{const u=c.due/(c.limit||1);return `<tr><td><a href="javascript:void(0)" data-act="cstmtview" data-i="${i}" class="fw-bold text-decoration-none" title="${t('statement')}"><i class="bi bi-person me-1 text-primary"></i>${L(c)}</a><br><small class="text-secondary">${c.code||'CUST-'+(101+i)} · ${c.phone||''}</small></td><td><div class="bar"><i style="width:${Math.min(100,u*100)}%;background:${u>.8?'var(--danger)':u>.5?'var(--warn)':'var(--accent)'}"></i></div><small class="text-secondary">${n(u*100)}% · ${short(c.limit)}</small></td><td class="r fw-semibold ${c.due>0?'dn':'up'}">${tk(c.due)}</td><td class="r">${n(c.days)}</td><td>${c.due<=0?bd('paid','clear'):c.days>90?bd('due','overdue'):bd('partial','outstanding')}</td><td class="r text-nowrap"><button class="btn-o py-1" data-act="cstmtview" data-i="${i}"><i class="bi bi-journal-text"></i>${t('statement')}</button> <button class="btn-o py-1" data-act="cinvs" data-i="${i}"><i class="bi bi-receipt"></i>${t('view_invoices')}</button> <button class="btn-a py-1" data-act="collect" data-i="${i}" ${c.due<=0?'disabled':''}><i class="bi bi-cash-coin"></i>${t('collect')}</button> <button class="btn-o py-1" data-act="remind" data-i="${i}" ${c.due<=0?'disabled':''}><i class="bi bi-bell"></i></button> <button class="icon-btn ib" data-act="cedit" data-i="${i}" aria-label="${t('edit')}"><i class="bi bi-pencil"></i></button> <button class="icon-btn ib" data-act="cdel" data-i="${i}" aria-label="${t('delete')}"><i class="bi bi-trash3"></i></button></td></tr>`}).join('')}</tbody></table></div>`)}</div>`}
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
ACT.cstmtview=x=>{
  const idx = +x.dataset.i;
  if (window.UI && window.UI.openCustomerStatement) {
    window.UI.openCustomerStatement(idx);
  } else {
    location.hash = '#/dues';
  }
};
ACT.collect=x=>{const{t,L,D,tk,toast,lrow}=F,cIdx=+x.dataset.i,c=D.customers[cIdx];
 modal(t('collect')+' – '+L(c),lrow(t('due_amt'),tk(c.due),'dn')+field('ca',t('paid_amt'),`<input id="ca" type="number" min="0" class="form-control" value="${c.due}">`)+field('cm',t('method'),`<select id="cm" class="form-select">${opts(F.methods().map(k=>[k,t(k)]))}</select>`)+field('cref',t('pay_ref'),`<input id="cref" class="form-control" placeholder="TXN-XXXX">`),()=>{
  const a=+$('#ca').value,m=$('#cm').value,refEl=$('#cref');$('#ca').classList.remove('is-invalid');
  if(!(a>0))return !bad('ca',t('pos_qty'));if(a>c.due)return !bad('ca',t('max_due'));
  if(!F.methods().includes(m))return !bad('cm',t('cash_only_note'));
  const ok = window.FIN.tx(F, () => {
    post(m,a);
    const prevDue=c.due;
    D.daily.coll[D.daily.coll.length-1]+=a;
    const d=new Date();const dStr=window.FIN.fmtDtTime(d.getTime(), F);
    D.coll.unshift([cIdx,a,m,d.toLocaleTimeString('bn-BD',{hour:'2-digit',minute:'2-digit'}),d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})]);
    D.coll.length=Math.min(D.coll.length,10);
    if(!D.dueCollections) D.dueCollections=[];
    const collRec = {
      id: 'COLL-' + Date.now().toString(36).toUpperCase(),
      custId: cIdx,
      custName: L(c),
      invNo: 'GEN-RECV',
      prevDue: prevDue,
      amt: a,
      remDue: Math.max(0, prevDue - a),
      dt: d.getTime(),
      dtStr: dStr,
      m: m,
      ref: (refEl && refEl.value.trim()) || ('COLL-' + Math.floor(1000 + Math.random()*9000)),
      by: F.S.user ? (F.S.user.n[F.S.lang] || F.S.user.n.bn) : 'User',
      remarks: 'Customer due recovery'
    };
    D.dueCollections.unshift(collRec);
    window.FIN.reconcileCustomer(cIdx, F);
    if(typeof LOG!=='undefined') LOG.add({m:'customers',t:'save',recordType:'due_collection',recordId:collRec.id,changes:{before:prevDue,after:c.due},msg:`${L(c)} থেকে বকেয়া আদায়: ${tk(a)} (${t(m)})`});
    return true;
  });
  if(ok){toast(t('coll_done'),'check-circle');F.route(false)}},t('collect'))};
ACT.remind=x=>{const{t,lg,D,tk,toast}=F,c=D.customers[+x.dataset.i],msg=lg([`প্রিয় ${c.bn}, আপনার ${tk(c.due)} বকেয়া ${c.days} দিন ধরে অপরিশোধিত। অনুগ্রহ করে দ্রুত পরিশোধ করুন। ধন্যবাদ।`,`Dear ${c.en}, your outstanding balance of ${tk(c.due)} has been due for ${c.days} days. Kindly arrange payment soon. Thank you.`]);
 modal(t('rem_title'),`<div class="wa">${msg}</div><small class="text-secondary d-block mt-2">${t('wa_note')}</small>`,()=>{navigator.clipboard?.writeText(msg).catch(()=>{});toast(t('copied'),'clipboard-check')},t('copy'))};
function post(m,a){const cb=F.D.cashBank;if(m==='m_cash')cb.cash+=a;else if(m==='m_adminrecv')cb.adminCash=(cb.adminCash===undefined?1900000:cb.adminCash)+a;else cb.bank+=a}
window.UI={psearch:q=>{PS.q=q;PS.pg=1;PS.tab='all';PS.cat='';PS.detailIdx=null},openProductDetail:i=>{PS.detailIdx=+i;if(location.hash.includes('products'))prod();else location.hash='#/products'},post,F:()=>F,modal,field,bad,opts,bd:(c,l)=>bd(c,l),sum,$,ACT,IN,boot:f=>boot(f),IV,tot,resetIV,openWaShareModal};
/* ---- event delegation ---- */
document.addEventListener('click',e=>{const x=e.target.closest('[data-act]');if(x&&F&&ACT[x.dataset.act])ACT[x.dataset.act](x)});
document.addEventListener('input',e=>{const x=e.target.closest('[data-in]');if(x&&F&&IN[x.dataset.in])IN[x.dataset.in](x)});
})();
