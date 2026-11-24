/* Phase 3 pages: Purchase (local purchases), Import (shipments + landed cost), Suppliers */
(()=>{
const {modal,field,bad,opts,bd,sum,$,ACT,IN,boot}=window.UI,P=window.PAGES;let F;
function init(f){F=f;boot(f);const D=f.D;if(D.suppliers&&D.purchases)return;
 const S=(bn,en,type,cur,payable,phone)=>{const p1=Math.round(payable*.8/1000)*1000,p2=Math.round(payable*.6/1000)*1000;return{bn,en,type,cur,payable,phone,tx:[['p',p1,['২৮ সেপ্টেম্বর','28 Sep']],['p',p2,['১২ অক্টোবর','12 Oct']],['m',p1+p2-payable,['২০ অক্টোবর','20 Oct']]]}};
 if(!D.suppliers) D.suppliers=[S('সানশাইন পেপার ইন্ডাস্ট্রিজ (চীন)','Sunshine Paper Industries (China)','overseas','RMB',3200000,'+86 571 8800 1234'),S('পেট্রোকেম ট্রেডিং (সিঙ্গাপুর)','Petrochem Trading (Singapore)','overseas','USD',4100000,'+65 6100 2200'),S('ঢাকা পেপার মার্ট','Dhaka Paper Mart','local','BDT',1340000,'01711-902345')];
 if(!D.shipments) D.shipments=[['SH-0457',1,3,12000,'arrived',['২৭ অক্টোবর','27 Oct'],95,45000,1185000,0,1185000],['SH-0456',0,0,25000,'transit',['০৮ নভেম্বর','08 Nov'],85,60000,2185000,1000000,1185000],['SH-0455',1,6,18000,'ordered',['২৪ নভেম্বর','24 Nov'],105,50000,1940000,0,1940000],['SH-0454',2,7,10000,'received',['১৫ অক্টোবর','15 Oct'],88,35000,915000,915000,0]];
 if(!D.purchases) D.purchases=[
   { no: 'PO-2026-88', supIdx: 2, prodIdx: 0, kg: 5000, rate: 82, charges: 12000, total: 422000, paid: 422000, due: 0, status: 'received', d: ['১৫ নভেম্বর','15 Nov'], m: 'm_bank', by: 'আসির আহমেদ তৌসিফ' },
   { no: 'PO-2026-87', supIdx: 2, prodIdx: 2, kg: 8000, rate: 94, charges: 20000, total: 772000, paid: 500000, due: 272000, status: 'arrived', d: ['০২ নভেম্বর','02 Nov'], m: 'm_bank', by: 'আসির আহমেদ তৌসিফ' },
   { no: 'PO-2026-86', supIdx: 2, prodIdx: 7, kg: 10000, rate: 90, charges: 25000, total: 925000, paid: 925000, due: 0, status: 'received', d: ['১৫ অক্টোবর','15 Oct'], m: 'm_cash', by: 'আসির আহমেদ তৌসিফ' }
 ];
}
const stc={ordered:'info',transit:'info',arrived:'partial',received:'paid'},RATE={USD:122,RMB:17,BDT:1};
const CS={p:3,q:12000,cur:'USD',fp:1.15,rate:122,fr:150000,duty:10,port:36000,clr:52000,tr:30000,ot:12000};
function calc(){const g=CS.q*CS.fp*CS.rate,d=(g+CS.fr)*CS.duty/100,add=[['freight',CS.fr],['duty_amt',d],['port',CS.port],['clearing',CS.clr],['transport',CS.tr],['other',CS.ot]],tot=g+sum(add.map(a=>a[1]));return{g,add,tot,pk:CS.q?tot/CS.q:0}}

/* ---------- 1. Local / General Purchase Module ---------- */
function purchase(){
  const {t,L,A,D,panel,tk,kg,short,n}=F;
  if(!F.can('purchase')){$('#view').innerHTML=`<div class="lock"><i class="bi bi-lock"></i>${t('admin_only')}</div>`;return}

  // Calculate totals from purchases & local shipments
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
      ${list.length ? list.map(p => {
        const sup = D.suppliers[p.supIdx] || { bn: 'স্থানীয় সরবরাহকারী', en: 'Local Supplier' };
        const prod = D.products[p.prodIdx] || { n: { bn: 'পণ্য', en: 'Product' } };
        return `
          <div class="mob-tx-card mb-2 p-3">
            <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
              <div>
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle fw-bold">${p.no}</span>
                <small class="text-secondary ms-1"><i class="bi bi-calendar3 me-1"></i>${p.d ? (F.S.lang==='bn'?p.d[0]:p.d[1]) : '—'}</small>
              </div>
              <div>${bd(p.status==='received'||p.due<=0?'paid':'due', p.status==='received'?'st_received':'st_arrived')}</div>
            </div>
            <div class="mb-2">
              <div class="fw-bold text-truncate" style="font-size:15px"><i class="bi bi-building me-1 text-secondary"></i>${L(sup)}</div>
              <div class="text-secondary small mt-1"><i class="bi bi-box-seam me-1"></i>${L(prod.n)} • <span class="fw-semibold text-body">${kg(p.kg)}</span> @ ${tk(p.rate)}</div>
            </div>
            <div class="p-2 rounded border bg-surface-2 d-flex justify-content-between align-items-center text-center">
              <div class="flex-fill">
                <span class="d-block small text-secondary">${t('total')}</span>
                <b class="text-primary fs-6">${tk(p.total)}</b>
              </div>
              <div class="vr mx-1"></div>
              <div class="flex-fill">
                <span class="d-block small text-secondary">${t('paid')}</span>
                <b class="up fs-6">${tk(p.paid)}</b>
              </div>
              <div class="vr mx-1"></div>
              <div class="flex-fill">
                <span class="d-block small text-secondary">${t('due')}</span>
                <b class="${p.due > 0 ? 'dn' : 'up'} fs-6">${tk(p.due)}</b>
              </div>
            </div>
            <div class="mt-2 pt-2 border-top d-flex justify-content-between align-items-center small text-secondary">
              <span><i class="bi bi-wallet2 me-1"></i>${t(p.m || 'm_bank')}</span>
              <span><i class="bi bi-person-check me-1"></i>${p.by || 'Admin'}</span>
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
          </tr>
        </thead>
        <tbody>
          ${list.length ? list.map(p => {
            const sup = D.suppliers[p.supIdx] || { bn: 'স্থানীয় সরবরাহকারী', en: 'Local Supplier' };
            const prod = D.products[p.prodIdx] || { n: { bn: 'পণ্য', en: 'Product' } };
            return `
              <tr>
                <td><b>${p.no}</b><br><small class="text-secondary">${p.d ? (F.S.lang==='bn'?p.d[0]:p.d[1]) : '—'}</small></td>
                <td><b>${L(sup)}</b></td>
                <td>${L(prod.n)}</td>
                <td class="r fw-semibold">${kg(p.kg)}</td>
                <td class="r">${tk(p.rate)}</td>
                <td class="r text-secondary">${tk(p.charges||0)}</td>
                <td class="r fw-bold text-primary">${tk(p.total)}</td>
                <td class="r up">${tk(p.paid)}</td>
                <td class="r ${p.due > 0 ? 'dn' : 'up'}">${tk(p.due)}</td>
                <td>${bd(p.status==='received'||p.due<=0?'paid':'due', p.status==='received'?'st_received':'st_arrived')}</td>
              </tr>`;
          }).join('') : `<tr><td colspan="10" class="text-center text-secondary py-4">${t('empty')}</td></tr>`}
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
          <button class="btn-o flex-fill flex-sm-grow-0" data-go="reports" data-rep="purchrep"><i class="bi bi-file-earmark-bar-graph"></i> ${t('pu_view_rep') || 'রিপোর্ট'}</button>
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
  const{t,D,toast}=F,s=D.shipments[+x.dataset.i],p=D.products[s[2]];
  p.kg+=s[3];s[4]='received';
  D.act.unshift(['bi-box-arrow-in-down',false,`${p.n.bn} ${s[3].toLocaleString('bn-BD')} কেজি স্টকে গ্রহণ (${s[0]})`,`${p.n.en} ${s[3].toLocaleString('en-IN')} KG received (${s[0]})`,'এইমাত্র','Just now']);
  D.act.length=Math.min(D.act.length,5);
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
ACT.spay=x=>{const{t,L,lg,D,tk,toast,lrow}=F,s=D.suppliers[+x.dataset.i];
 modal(t('pay_title')+' – '+L(s),lrow(t('due_amt'),tk(s.payable),'dn')+field('pa',t('pay_amt'),`<input id="pa" type="number" min="0" class="form-control" value="${s.payable}">`)+field('pm',t('method'),`<select id="pm" class="form-select">${opts(['m_bank','m_cash','m_cheque','m_bkash'].map(k=>[k,t(k)]))}</select>`),()=>{
  const a=+$('#pa').value,m=$('#pm').value,cb=D.cashBank;$('#pa').classList.remove('is-invalid');
  if(!(a>0))return !bad('pa',t('pos_qty'));if(a>s.payable)return !bad('pa',t('max_due'));if(m==='m_cash'&&a>cb.cash)return !bad('pa',t('insuf'));
  s.payable-=a;cb.payable-=a;m==='m_cash'?cb.cash-=a:cb.bank-=a;s.tx.push(['m',a,['আজ','Today']]);toast(t('pay_done'),'check-circle');suppliers()},t('pay'))};
ACT.sstmt=x=>{const{t,L,lg,D,tk}=F,s=D.suppliers[+x.dataset.i];let b=0;
 modal(t('statement')+' – '+L(s),`<div class="tw"><table class="tbl"><thead><tr><th>${t('date')}</th><th>${t('type')}</th><th class="r">${t('amount')}</th><th class="r">${t('balance')}</th></tr></thead><tbody>${s.tx.map(r=>{b+=r[0]==='p'?r[1]:-r[1];return `<tr><td>${lg(r[2])}</td><td>${t('tx_'+r[0])}</td><td class="r ${r[0]!=='p'?'up':''}">${r[0]!=='p'?'−':''}${tk(r[1])}</td><td class="r fw-semibold">${tk(b)}</td></tr>`}).join('')}</tbody></table></div>`)};
window.UI.init2=init;
})();
