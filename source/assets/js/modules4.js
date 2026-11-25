/* Phase 5 pages: Reports, Data Import/Export, Settings */
(()=>{
const U=window.UI,{modal,field,bad,opts,bd,sum,$,ACT,IN}=U,P=window.PAGES;let F;
const I=f=>{F=f;U.boot(f);U.init2(f);U.init3(f);if(U.init13)U.init13(f)};
const lock=()=>{$('#view').innerHTML=`<div class="lock"><i class="bi bi-lock"></i>${F.t('admin_only')}</div>`};
const tabs=(cur,list,act)=>`<div class="seg mb-3">${list.map(([k,l])=>`<button data-act="${act}" data-k="${k}" class="${cur===k?'on':''}">${F.t(l)}</button>`).join('')}</div>`;
const head=(h,s)=>`<div class="page-h"><div><h2>${F.t(h)}</h2><p>${F.t(s)}</p></div></div>`;
const csv=(name,rows)=>{const b=new Blob(['\ufeff'+rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),600)};
const DS=()=>{const D=F.D;return{products:[['sku','name','category','stock_kg','min_kg','cost_per_kg'],...D.products.map(p=>[p.sku,p.n.en,p.cat,p.kg,p.min,p.cost])],customers:[['name','phone','credit_limit','due'],...D.customers.map(c=>[c.en,c.phone,c.limit,c.due])],suppliers:[['name','type','currency','payable'],...D.suppliers.map(s=>[s.en,s.type,s.cur,s.payable])],balances:[['party','type','opening_balance'],...D.customers.map(c=>[c.en,'customer',c.due]),...D.suppliers.map(s=>[s.en,'supplier',s.payable])],invoices:[['invoice','customer','amount','paid'],...D.invoices.map(i=>[i[0],D.customers[i[1]].en,i[2],i[3]])]}};
/* ================= Reports ================= */
const RS={
  c:'dclose',
  r:'r30',
  d:29,
  range:'today',
  df:'',
  dt:'',
  appliedRange:'today',
  appliedDf:'',
  appliedDt:'',
  tab:'all',
  q:'',
  tblQ:'',
  saleView:'company',
  saleCompany:'all',
  saleInvNo:'',
  saleChallan:'',
  saleProd:'all',
  saleBrand:'all',
  saleStatus:'all',
  stockType:'all',
  stockProd:'all',
  stockSku:'',
  stockBrand:'all',
  stockRef:'',
  stockChallan:''
};
U.RS = RS;
const net=e=>window.UI.payNet?window.UI.payNet(e):e.basic+(e.ot||0)+(e.bonus||0)-(e.ded||0)-(e.adv||0);
const cats=()=>F.A()?['inv','sales','cust','sup','fin','hrm','dclose','dstock','dfin','exprep','supledger','custledger','stockledger','partyprices']:['inv','sales','cust','dstock','exprep','custledger','stockledger'];

function getActiveDateRange() {
  const f = F || (window.UI && window.UI.F && window.UI.F());
  if (!f) return { start: Date.now() - 86400000, end: Date.now(), label: 'Today', rangeName: 'Today' };
  const D = f.D;
  const baseTs = D.days && D.days.length ? D.days[D.days.length - 1] : Date.now();
  const now = new Date(baseTs);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = todayStart + 86400000 - 1;
  const range = RS.appliedRange || RS.range || 'today';

  let start = todayStart, end = todayEnd, label = '', rangeName = '';
  if (range === 'today') {
    start = todayStart;
    end = todayEnd;
    rangeName = f.t('today');
    label = rangeName + ' (' + new Date(start).toLocaleDateString(f.S.lang==='bn'?'bn-BD':'en-GB', {day:'numeric',month:'short',year:'numeric'}) + ')';
  } else if (range === 'yesterday' || range === 'yest') {
    start = todayStart - 86400000;
    end = todayStart - 1;
    rangeName = f.t('yesterday');
    label = rangeName + ' (' + new Date(start).toLocaleDateString(f.S.lang==='bn'?'bn-BD':'en-GB', {day:'numeric',month:'short',year:'numeric'}) + ')';
  } else if (range === 'this_week' || range === 'r7') {
    const day = now.getDay();
    const diff = (day + 6) % 7;
    start = todayStart - diff * 86400000;
    end = todayEnd;
    rangeName = f.t('this_week');
    label = rangeName + ' (' + new Date(start).toLocaleDateString(f.S.lang==='bn'?'bn-BD':'en-GB', {day:'numeric',month:'short'}) + ' — ' + new Date(end).toLocaleDateString(f.S.lang==='bn'?'bn-BD':'en-GB', {day:'numeric',month:'short',year:'numeric'}) + ')';
  } else if (range === 'this_month' || range === 'r30') {
    start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    end = todayEnd;
    rangeName = f.t('this_month');
    label = rangeName + ' (' + new Date(start).toLocaleDateString(f.S.lang==='bn'?'bn-BD':'en-GB', {day:'numeric',month:'short'}) + ' — ' + new Date(end).toLocaleDateString(f.S.lang==='bn'?'bn-BD':'en-GB', {day:'numeric',month:'short',year:'numeric'}) + ')';
  } else if (range === 'last_month' || range === 'prev_month') {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();
    rangeName = f.t('last_month');
    label = rangeName + ' (' + new Date(start).toLocaleDateString(f.S.lang==='bn'?'bn-BD':'en-GB', {day:'numeric',month:'short'}) + ' — ' + new Date(end).toLocaleDateString(f.S.lang==='bn'?'bn-BD':'en-GB', {day:'numeric',month:'short',year:'numeric'}) + ')';
  } else if (range === 'custom') {
    const df = RS.appliedDf || RS.df;
    const dt = RS.appliedDt || RS.dt;
    start = df ? new Date(df).setHours(0,0,0,0) : (todayStart - 30 * 86400000);
    end = dt ? new Date(dt).setHours(23,59,59,999) : todayEnd;
    rangeName = f.t('custom_range');
    label = rangeName + ' (' + (df || new Date(start).toLocaleDateString('en-GB')) + ' — ' + (dt || new Date(end).toLocaleDateString('en-GB')) + ')';
  } else {
    start = todayStart - 30 * 86400000;
    end = todayEnd;
    rangeName = f.t('all');
    label = f.t('all_time') || 'All Records';
  }
  return { start, end, range, label, rangeName };
}
U.getActiveDateRange = getActiveDateRange;

function getDayInfo(idx){
  const f=F,D=f.D,loc=f.S.lang==='bn'?'bn-BD':'en-IN';
  const len=D.days?D.days.length:30;
  idx=Math.max(0,Math.min(len-1,(idx!==undefined&&idx!==null&&!isNaN(idx))?+idx:len-1));
  const ts=D.days[idx];
  const dt=new Date(ts);
  const isToday=(idx===len-1);
  const isYesterday=(idx===len-2);
  const dateStr=dt.toLocaleDateString(loc,{day:'numeric',month:'short',year:'numeric'});
  const dayName=dt.toLocaleDateString(loc,{weekday:'short'});
  const isoStr=dt.toISOString().split('T')[0];
  const relativeStr=isToday?(f.S.lang==='bn'?'আজ':'Today'):
                    isYesterday?(f.S.lang==='bn'?'গতকাল':'Yesterday'):
                    `${len-1-idx} ${f.S.lang==='bn'?'দিন আগের':'days ago'}`;
  return{idx,ts,dt,isToday,isYesterday,dateStr,dayName,isoStr,relativeStr};
}

function getTimelineDays(){
  const f=F,D=f.D,loc=f.S.lang==='bn'?'bn-BD':'en-IN';
  const len=D.days?D.days.length:30;
  const list=[];
  const start=Math.max(0,len-7);
  for(let i=start;i<len;i++){
    const dt=new Date(D.days[i]);
    const sales=(D.daily&&D.daily.sales)?D.daily.sales[i]:0;
    list.push({
      i,
      dt,
      dayNum:dt.getDate(),
      dayName:dt.toLocaleDateString(loc,{weekday:'short'}),
      dateStr:dt.toLocaleDateString(loc,{day:'numeric',month:'short'}),
      salesStr:f.short(sales),
      isToday:(i===len-1)
    });
  }
  return list;
}

function table(){
  try{
    if(window.UI.customReportRenderer){
      const custom=window.UI.customReportRenderer(RS.c,RS.d);
      if(custom)return custom;
    }
    const{t,L,D,A,tk,kg,n}=F,f={r7:.24,r30:1,r12:11.4}[RS.r];let h,rows,foot;
    if(['dclose','dstock','dfin'].includes(RS.c))return U.daily(RS.c,RS.d);
    if(RS.c==='inv'){
      h=[t('product'),t('stock'),t('min'),...(A()?[t('stock_value')]:[])];
      rows=D.products.map(p=>[L(p.n),kg(p.kg),kg(p.min),...(A()?[tk(p.kg*p.cost)]:[])]);
      foot=[t('tot'),kg(sum(D.products.map(p=>p.kg))),'',...(A()?[tk(sum(D.products.map(p=>p.kg*p.cost)))]:[])];
    }
    if(RS.c==='sales'){
      const l=[...D.products].sort((a,b)=>b.sold-a.sold);
      h=[t('product'),t('sold_kg'),t('sales_val')];
      rows=l.map(p=>[L(p.n),kg(Math.round(p.sold*f)),tk(Math.round(p.sold*f*p.price))]);
      foot=[t('tot'),kg(Math.round(sum(l.map(p=>p.sold))*f)),tk(Math.round(sum(l.map(p=>p.sold*p.price))*f))];
    }
    if(RS.c==='cust'){
      h=[t('customer'),t('due_amt'),t('days')];
      rows=D.customers.map(c=>[L(c),tk(c.due),n(c.days)]);
      foot=[t('tot'),tk(sum(D.customers.map(c=>c.due))),''];
    }
    if(RS.c==='purch'){
      h=[t('ship'),t('supplier'),t('product'),t('qty_kg')];
      rows=D.shipments.map(s=>[s[0],L(D.suppliers[s[1]]),L(D.products[s[2]].n),kg(s[3])]);
      foot=[t('tot'),'','',kg(sum(D.shipments.map(s=>s[3])))]
    }
    if(RS.c==='sup'){
      h=[t('supplier'),t('currency'),t('due_amt')];
      rows=D.suppliers.map(s=>[L(s),s.cur,tk(s.payable)]);
      foot=[t('tot'),'',tk(sum(D.suppliers.map(s=>s.payable)))];
    }
    if(RS.c==='fin'){
      const s=sum(D.daily.sales),c=Math.round(s*D.cogsRate);
      h=[t('account'),t('amount')];
      rows=[[t('revenue'),tk(s)],[t('cogs'),tk(c)],[t('gross'),tk(s-c)],[t('expenses'),tk(D.expenses)]];
      foot=[t('net_profit'),tk(s-c-D.expenses)];
    }
    if(RS.c==='hrm'){
      h=[t('nav_hrm'),t('netpay')];
      rows=D.emp.map(e=>[L(e.n),tk(net(e))]);
      foot=[t('tot'),tk(sum(D.emp.map(net)))];
    }
    const r=(a,c='')=>`<tr class="${c}">${a.map((x,i)=>`<td class="${i?'r':''}">${x}</td>`).join('')}</tr>`;
    return `<div class="tw rep-table-wrap"><table class="tbl" id="rtbl"><thead><tr>${h.map((x,i)=>`<th class="${i?'r':''}">${x}</th>`).join('')}</tr></thead><tbody>${rows.map(a=>r(a)).join('')}${r(foot,'fw-bold ft')}</tbody></table></div>`;
  }catch(err){
    console.error('Report error:',err);
    return `<div class="p-4 text-center text-danger"><i class="bi bi-exclamation-triangle fs-2 d-block mb-2"></i><b>Report Unavailable:</b> ${err.message||'Error loading report'}</div>`;
  }
}

const RG=[
  ['rg_sales_cust',[
    ['sales','receipt','green','SALES'],
    ['cust','people','purple','CUSTOMER'],
    ['custledger','person-lines-fill','purple','LEDGER']
  ]],
  ['rg_stock_inv',[
    ['stockledger','layers','blue','LEDGER'],
    ['inv','boxes','blue','STOCK'],
    ['dstock','box-seam','blue','STOCK']
  ]],
  ['rg_fin_ledger',[
    ['dclose','calendar-check','gold','DAILY'],
    ['exprep','cash-stack','purple','EXPENSE'],
    ['fin','journal-text','green','FINANCE'],
    ['supledger','building-check','purple','LEDGER'],
    ['dfin','graph-up-arrow','green','FINANCE'],
    ['partyprices','tags','purple','PRICING'],
    ['hrm','person-badge','green','PAYROLL'],
    ['sup','building','purple','SUPPLIER']
  ]]
];

function kpis(){
  const{t,D,A,kg,n,short}=F,c=RS.c,idx=RS.d;let items=[];
  const dObj=(window.UI&&window.UI.dayD)?window.UI.dayD(idx):null;
  const balsObj=(window.UI&&window.UI.bals)?window.UI.bals():null;

  if(c==='dclose'||c==='closingrep'){
    const sales=dObj?dObj.s:((D.daily&&D.daily.sales)?D.daily.sales[idx]:0);
    const coll=dObj?dObj.c:((D.daily&&D.daily.coll)?D.daily.coll[idx]:0);
    const cash=balsObj?balsObj.cash[idx+1]:((D.cashBank&&D.cashBank.cash)||0);
    const bank=balsObj?balsObj.bank[idx+1]:((D.cashBank&&D.cashBank.bank)||0);
    items=[
      {l:'dc_total',v:short(sales),ic:'receipt',col:'blue'},
      {l:'dc_collected',v:short(coll),ic:'cash-stack',col:'green'},
      {l:'dc_cash',v:short(cash),ic:'cash-coin',col:'amber'},
      {l:'dc_bank',v:short(bank),ic:'bank',col:'purple'}
    ];
  }
  else if(c==='inv')items=[
    {l:'total_stock',v:kg(sum(D.products.map(p=>p.kg))),ic:'box-seam',col:'blue'},
    {l:'low_stock',v:n(D.products.filter(p=>p.kg<p.min).length),ic:'exclamation-triangle',col:'amber'},
    ...(A()?[{l:'stock_value',v:short(sum(D.products.map(p=>p.kg*p.cost))),ic:'cash-stack',col:'green'}]:[])
  ];
  else if(c==='sales'){
    const f={r7:.24,r30:1,r12:11.4}[RS.r];
    items=[
      {l:'sold_kg',v:kg(Math.round(sum(D.products.map(p=>p.sold))*f)),ic:'boxes',col:'blue'},
      {l:'sales_val',v:short(Math.round(sum(D.products.map(p=>p.sold*p.price))*f)),ic:'graph-up-arrow',col:'green'}
    ];
  }
  else if(c==='cust')items=[
    {l:'total_due',v:short(sum(D.customers.map(x=>x.due))),ic:'people',col:'amber'},
    {l:'o90',v:short(sum(D.customers.filter(x=>x.days>90).map(x=>x.due))),ic:'clock-history',col:'red'}
  ];
  else if(c==='purch')items=[
    {l:'qty_kg',v:kg(sum(D.shipments.map(x=>x[3]))),ic:'truck',col:'blue'}
  ];
  else if(c==='sup')items=[
    {l:'payable',v:short(sum(D.suppliers.map(x=>x.payable))),ic:'building',col:'amber'}
  ];
  else if(c==='fin'){
    const v=sum(D.daily.sales),g=Math.round(v*D.cogsRate);
    items=[
      {l:'revenue',v:short(v),ic:'cash-coin',col:'green'},
      {l:'expenses',v:short(D.expenses),ic:'wallet2',col:'red'},
      {l:'net_profit',v:short(v-g-D.expenses),ic:'pie-chart',col:v-g-D.expenses>=0?'green':'red'}
    ];
  }
  else if(c==='hrm')items=[
    {l:'nav_hrm',v:n(D.emp.length),ic:'people',col:'blue'},
    {l:'netpay',v:short(sum(D.emp.map(net))),ic:'cash-stack',col:'green'}
  ];

  if(!items.length)return '';
  return `<div class="rep-kpis-grid">${items.map(it=>`
    <div class="rep-kpi-card">
      <div class="rep-kpi-ic ${it.col}"><i class="bi bi-${it.ic}"></i></div>
      <div class="rep-kpi-content">
        <small>${t(it.l)}</small>
        <b>${it.v}</b>
      </div>
    </div>`).join('')}</div>`;
}

function reports(){
  const{t,panel,D,S,short,kg}=F;
  if(!cats().includes(RS.c))RS.c='dclose';

  // DIRECT ACTIVE REPORT PANEL VIEW
  const ok=cats();
  const daily=['dclose','dstock','dfin','closingrep'].includes(RS.c),list=!daily&&RS.c!=='fin',loc=S.lang==='bn'?'bn-BD':'en-IN';
  const currDay=getDayInfo(RS.d);

  // Find icon and group for current report
  let currIcon='bar-chart-line',currCatKey='rg_daily';
  for(const[g,its]of RG){
    const f=its.find(x=>x[0]===RS.c);
    if(f){currIcon=f[1];currCatKey=g;break;}
  }

  // Quick report navigation pills by category (Purchase Reports migrated to top-level module)
  const quickPills=[
    {k:'sales',ic:'receipt',lbl:t('rc_sales'),cat:'rg_sales_cust'},
    {k:'cust',ic:'people',lbl:t('rc_cust'),cat:'rg_sales_cust'},
    {k:'custledger',ic:'person-lines-fill',lbl:t('rc_custledger')||'Client Statement',cat:'rg_sales_cust'},
    {k:'stockledger',ic:'layers',lbl:t('rc_stockledger')||'Stock Movement',cat:'rg_stock_inv'},
    {k:'inv',ic:'boxes',lbl:t('rc_inv'),cat:'rg_stock_inv'},
    {k:'dstock',ic:'box-seam',lbl:t('rc_dstock')||'Daily Stock',cat:'rg_stock_inv'},
    {k:'dclose',ic:'calendar-check',lbl:t('rc_dclose'),cat:'rg_fin_ledger'},
    {k:'exprep',ic:'cash-stack',lbl:t('rc_exprep'),cat:'rg_fin_ledger'},
    {k:'fin',ic:'journal-text',lbl:t('rc_fin')||'Finance',cat:'rg_fin_ledger'},
    {k:'supledger',ic:'building-check',lbl:t('rc_supledger')||'Supplier Ledger',cat:'rg_fin_ledger'}
  ].filter(p=>ok.includes(p.k));

  const catFilter = RS.catFilter || '';
  const filteredPills = catFilter ? quickPills.filter(p=>p.cat===catFilter) : quickPills;

  // Report switcher options
  const switcherHtml=RG.map(([g,items])=>{
    if(catFilter && g!==catFilter) return '';
    const it=items.filter(x=>ok.includes(x[0]));
    if(!it.length)return '';
    return `<optgroup label="${t(g)}">${it.map(([k])=>`<option value="${k}" ${k===RS.c?'selected':''}>${t('rc_'+k)}</option>`).join('')}</optgroup>`;
  }).join('');

  // Consolidated Control Toolbar (Time Machine & Filters & Search)
  const activeDateInfo=getActiveDateRange();
  const toolbarHtml=`
    <div class="rep-toolbar flex-wrap gap-2">
      <div class="rep-tb-left flex-wrap gap-2">
        <div class="rep-stepper-compact">
          <button class="rep-step-btn-sm" data-act="rstepday" data-dir="-1" ${currDay.idx<=0?'disabled':''} title="${t('rep_prev_day')}">
            <i class="bi bi-chevron-left"></i>
          </button>
          <div class="rep-date-trigger" title="${t('rep_pick_date')}">
            <i class="bi bi-calendar3 text-primary"></i>
            <span>${currDay.dateStr}</span>
            <input type="date" data-in="rpickdate" value="${currDay.isoStr}">
          </div>
          <button class="rep-step-btn-sm" data-act="rstepday" data-dir="1" ${currDay.idx>=D.days.length-1?'disabled':''} title="${t('rep_next_day')}">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>

        ${!currDay.isToday?`
          <span class="rep-tag-historical"><i class="bi bi-clock-history"></i> ${currDay.relativeStr}</span>
          <button class="rep-live-btn" data-act="rtodayjump" title="${t('rep_jump_today')}">
            <i class="bi bi-arrow-clockwise"></i> Live Today
          </button>`:''}

        <div class="rep-range-pills flex-wrap">
          <button class="rep-range-pill ${RS.range==='today'?'on':''}" data-act="rrange" data-v="today">${t('today')}</button>
          <button class="rep-range-pill ${RS.range==='yesterday'||RS.range==='yest'?'on':''}" data-act="rrange" data-v="yesterday">${t('yesterday')}</button>
          <button class="rep-range-pill ${RS.range==='this_week'?'on':''}" data-act="rrange" data-v="this_week">${t('this_week')}</button>
          <button class="rep-range-pill ${RS.range==='this_month'?'on':''}" data-act="rrange" data-v="this_month">${t('this_month')}</button>
          <button class="rep-range-pill ${RS.range==='last_month'?'on':''}" data-act="rrange" data-v="last_month">${t('last_month')}</button>
          <button class="rep-range-pill ${RS.range==='custom'?'on':''}" data-act="rrange" data-v="custom">${t('custom_range')}</button>
        </div>

        <div class="d-flex align-items-center gap-1 ${RS.range==='custom'?'':'d-none'}" id="repCustomDateWrap">
          <input type="date" class="form-control form-control-sm w-auto" data-in="rdf" value="${RS.df||''}" title="${t('start_date')||'Start Date'}">
          <span class="text-secondary small">—</span>
          <input type="date" class="form-control form-control-sm w-auto" data-in="rdt" value="${RS.dt||''}" title="${t('end_date')||'End Date'}">
        </div>

        <div class="d-flex align-items-center gap-1">
          <button class="btn btn-sm btn-primary py-1 px-2" data-act="rapplydate" title="${t('apply_filter')}"><i class="bi bi-funnel me-1"></i>${t('apply_filter')}</button>
          <button class="btn btn-sm btn-outline-secondary py-1 px-2" data-act="rresetdate" title="${t('reset_filter')}"><i class="bi bi-arrow-counterclockwise me-1"></i>${t('reset_filter')}</button>
        </div>
      </div>

      <div class="rep-tb-right">
        ${list?`
          <div class="rep-tb-search">
            <i class="bi bi-search"></i>
            <input data-in="rq" value="${RS.tblQ||''}" placeholder="${t('search_r')}..." aria-label="${t('search_r')}">
          </div>`:
          ''}
      </div>
    </div>

    <!-- Active Reporting Period Indicator Banner -->
    <div class="rep-period-banner d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 p-2 px-3 rounded border">
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <i class="bi bi-calendar3-range text-primary fs-5"></i>
        <span class="small text-secondary fw-semibold">${t('rep_period')}:</span>
        <b class="text-body">${activeDateInfo.label}</b>
        <span class="badge bg-primary-subtle text-primary border">${activeDateInfo.rangeName}</span>
      </div>
      <div class="small text-secondary">
        <span class="badge bg-secondary-subtle text-secondary border px-2 py-1" id="repRowCount"></span>
      </div>
    </div>`;

  $('#view').innerHTML=`
  <div class="enter">
    <!-- View Top Header -->
    <div class="rep-view-header">
      <div class="rep-view-title-block">
        <div class="rep-title-icon"><i class="bi bi-${currIcon}"></i></div>
        <div class="rep-view-info">
          <h2>${t('rc_'+RS.c)}</h2>
          <p><span class="badge bg-secondary-subtle text-body border me-1">${t(currCatKey)}</span> ${t('rd_'+RS.c)}</p>
        </div>
      </div>
      <div class="rep-view-actions">
        <select class="form-select rep-switcher-select" data-in="repswitch" aria-label="Switch report">
          ${switcherHtml}
        </select>
        <button class="btn-o" data-act="rprint" title="${t('rep_print')}"><i class="bi bi-printer"></i> <span class="d-none d-sm-inline">${t('rep_print')}</span></button>
        <button class="btn-o" data-act="rexp" data-f="pdf"><i class="bi bi-file-earmark-pdf text-danger"></i> PDF</button>
        <button class="btn-a" data-act="rexp" data-f="xls"><i class="bi bi-file-earmark-excel"></i> Excel</button>
        <button class="btn-o" data-go="purchase-reports" title="${t('nav_purchase-reports') || 'Purchase Reports'}"><i class="bi bi-file-earmark-spreadsheet"></i> <span class="d-none d-xl-inline">${t('nav_purchase-reports') || 'Purchase Reports'}</span></button>
      </div>
    </div>

    <!-- Clean Categorized Navigation -->
    <div class="rep-cat-filter-tabs mb-2 d-flex align-items-center gap-1 flex-wrap">
      <button class="btn btn-sm ${!catFilter?'btn-primary':'btn-outline-secondary'}" data-act="rcatfilter" data-c="">
        <i class="bi bi-grid me-1"></i>${t('all')}
      </button>
      <button class="btn btn-sm ${catFilter==='rg_sales_cust'?'btn-primary':'btn-outline-secondary'}" data-act="rcatfilter" data-c="rg_sales_cust">
        <i class="bi bi-receipt me-1"></i>${t('rg_sales_cust')}
      </button>
      <button class="btn btn-sm ${catFilter==='rg_stock_inv'?'btn-primary':'btn-outline-secondary'}" data-act="rcatfilter" data-c="rg_stock_inv">
        <i class="bi bi-boxes me-1"></i>${t('rg_stock_inv')}
      </button>
      <button class="btn btn-sm ${catFilter==='rg_fin_ledger'?'btn-primary':'btn-outline-secondary'}" data-act="rcatfilter" data-c="rg_fin_ledger">
        <i class="bi bi-wallet2 me-1"></i>${t('rg_fin_ledger')}
      </button>
    </div>

    <!-- Report Pills for Active Category -->
    <div class="rep-nav-pills-wrap">
      <div class="rep-nav-pills">
        ${filteredPills.map(p=>`
          <button class="rep-nav-pill ${RS.c===p.k?'active':''}" data-act="rcat" data-k="${p.k}">
            <i class="bi bi-${p.ic}"></i>
            <span>${p.lbl}</span>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Consolidated Unified Control Toolbar -->
    ${toolbarHtml}

    <!-- KPI Summary Metric Cards -->
    ${kpis()}

    <!-- Main Report Content & Table -->
    <div id="rwrap">
      ${table()}
    </div>
  </div>`;

  if(RS.tblQ){
    const q=RS.tblQ.toLowerCase();
    const rows=document.querySelectorAll('#rwrap tbody tr:not(.ft)');
    let shown=0;
    rows.forEach(r=>{
      const show=r.textContent.toLowerCase().includes(q);
      r.style.display=show?'':'none';
      if(show)shown++;
    });
    const cnt=$('#repRowCount');
    if(cnt)cnt.textContent=`${shown} ${F.t('rep_showing_rows')}`;
  }
}

P.reports=f=>{
  I(f);
  if(window.WANT_REP){
    if(window.WANT_REP==='purchrep'||window.WANT_REP==='purch'){
      window.WANT_REP=null;
      location.hash='#/purchase-reports';
      return;
    }
    RS.c=window.WANT_REP;
    window.WANT_REP=null;
  }
  if(RS.c==='purchrep'||RS.c==='purch') RS.c='sales';
  RS.tblQ='';
  reports();
};

ACT.rback=()=>{
  ACT.rbrowse();
};

ACT.rcatfilter=(x)=>{
  const cat=x.dataset.c||'';
  RS.catFilter=cat;
  if(cat){
    const group=RG.find(g=>g[0]===cat);
    if(group&&group[1]&&group[1].length){
      const existsInGroup=group[1].some(item=>item[0]===RS.c);
      if(!existsInGroup){
        RS.c=group[1][0][0];
      }
    }
  }
  RS.tblQ='';
  reports();
};

ACT.rcat=x=>{
  RS.c=x.dataset.k;
  RS.tblQ='';
  reports();
  try{
    const m=bootstrap.Modal.getInstance(document.querySelector('#modal'));
    if(m)m.hide();
  }catch(_){}
};

IN.repswitch=x=>{
  RS.c=x.value;
  RS.tblQ='';
  reports();
};

ACT.rbrowse=()=>{
  const {t,modal}=F;
  const ok=cats();
  const modalHtml=`
    <div class="p-1">
      <div class="mb-3">
        <label class="search w-100">
          <i class="bi bi-search"></i>
          <input id="repModalSearch" placeholder="${t('search_r')}..." oninput="
            const q = this.value.toLowerCase().trim();
            document.querySelectorAll('.rep-m-card').forEach(el => {
              el.style.display = (!q || el.textContent.toLowerCase().includes(q)) ? '' : 'none';
            });
          ">
        </label>
      </div>
      <div class="row g-2" style="max-height: 60vh; overflow-y: auto;">
        ${RG.map(([g, items]) => {
          const it = items.filter(x => ok.includes(x[0]));
          if (!it.length) return '';
          return `
            <div class="col-12 mt-2">
              <small class="text-secondary fw-bold text-uppercase">${t(g)}</small>
            </div>
            ${it.map(([k, ic, col, tag]) => `
              <div class="col-sm-6 rep-m-card">
                <button class="btn w-100 text-start p-2 border rounded-3 d-flex align-items-center gap-2 ${RS.c === k ? 'btn-primary text-white' : 'btn-outline-secondary'}" data-act="rcat" data-k="${k}">
                  <i class="bi bi-${ic} fs-4"></i>
                  <div class="flex-grow-1 overflow-hidden">
                    <b class="d-block text-truncate">${t('rc_' + k)}</b>
                    <small class="d-block text-truncate ${RS.c === k ? 'text-white-50' : 'text-muted'}">${t('rd_' + k)}</small>
                  </div>
                </button>
              </div>
            `).join('')}
          `;
        }).join('')}
      </div>
    </div>
  `;
  modal(t('rep_all_tab'), modalHtml, null, null);
};

ACT.rprint=()=>{
  window.print();
};

ACT.reprefresh=()=>{
  reports();
  F.toast(F.t('rep_refresh')+'...', 'check-circle');
};

ACT.rstepday=x=>{
  const dir=+x.dataset.dir;
  const len=F.D.days.length;
  RS.d=Math.max(0,Math.min(len-1,RS.d+dir));
  RS.range=(RS.d===len-1?'today':(RS.d===len-2?'yest':'custom'));
  reports();
};

ACT.rjumpday=x=>{
  const len=F.D.days.length;
  RS.d=+x.dataset.i;
  RS.range=(RS.d===len-1?'today':(RS.d===len-2?'yest':'custom'));
  reports();
};

ACT.rtodayjump=()=>{
  const len=F.D.days.length;
  RS.d=len-1;
  RS.range='today';
  reports();
};

IN.rpickdate=x=>{
  const val=x.value;
  if(!val)return;
  const targetTs=new Date(val).getTime();
  const D=F.D;
  let closestIdx=0,minDiff=Infinity;
  D.days.forEach((ts,i)=>{
    const diff=Math.abs(ts-targetTs);
    if(diff<minDiff){minDiff=diff;closestIdx=i;}
  });
  RS.d=closestIdx;
  RS.range=(RS.d===D.days.length-1?'today':(RS.d===D.days.length-2?'yest':'custom'));
  reports();
};

ACT.rrange=x=>{
  RS.range=x.dataset.v;
  const len=F.D.days.length;
  if(RS.range==='today'){
    RS.d=len-1;
    RS.r='r30';
  }else if(RS.range==='yesterday'||RS.range==='yest'){
    RS.d=len-2;
    RS.r='r30';
  }else if(RS.range==='this_week'){
    RS.r='r7';
  }else if(RS.range==='this_month'){
    RS.r='r30';
  }else if(RS.range==='last_month'){
    RS.r='r30';
  }
  RS.appliedRange=RS.range;
  reports();
};

IN.rdf=x=>{ RS.df=x.value; };
IN.rdt=x=>{ RS.dt=x.value; };
ACT.rapplydate=()=>{
  RS.appliedRange=RS.range;
  RS.appliedDf=RS.df;
  RS.appliedDt=RS.dt;
  reports();
  F.toast(F.t('apply_filter')+' ('+(RS.range||'Custom')+')','check-circle');
};
ACT.rresetdate=()=>{
  RS.range='today';
  RS.appliedRange='today';
  RS.df='';
  RS.dt='';
  RS.appliedDf='';
  RS.appliedDt='';
  RS.tblQ='';
  reports();
  F.toast(F.t('reset_filter'),'arrow-counterclockwise');
};

IN.rr=x=>{
  RS.r=x.value;
  reports();
};

IN.rd=x=>{
  RS.d=+x.value;
  reports();
};

IN.repsearch=x=>{
  RS.q=x.value.trim().toLowerCase();
  filterHubCards();
};

ACT.repclear=()=>{
  RS.q='';
  const inp=$('#repSearchInput');
  if(inp)inp.value='';
  filterHubCards();
};

ACT.reptab=x=>{
  RS.tab=x.dataset.k;
  document.querySelectorAll('.rep-cat-pill').forEach(p=>p.classList.toggle('active',p.dataset.k===RS.tab));
  filterHubCards();
};

IN.rq=x=>{
  RS.tblQ=x.value.toLowerCase().trim();
  const rows=document.querySelectorAll('#rwrap tbody tr:not(.ft)');
  let shown=0;
  rows.forEach(r=>{
    const show=!RS.tblQ||r.textContent.toLowerCase().includes(RS.tblQ);
    r.style.display=show?'':'none';
    if(show)shown++;
  });
  const cnt=$('#repRowCount');
  if(cnt)cnt.textContent=RS.tblQ?`${shown} ${F.t('rep_showing_rows')}`:'';
};

ACT.rexp=x=>{
  const{t,toast}=F,old=x.innerHTML;
  x.disabled=true;
  x.innerHTML=`<span class="spinner-border spinner-border-sm"></span>${t('exporting')}`;
  setTimeout(()=>{
    x.disabled=false;
    x.innerHTML=old;
    if(x.dataset.f==='xls'){
      csv('report-'+RS.c+'-date-'+RS.d+'.csv',[...document.querySelectorAll('#rwrap tr,#rwrap .stmt h4')].map(e=>e.tagName==='H4'?[e.textContent]:[...e.children].map(c=>c.textContent)));
      toast(t('csv_done'),'download');
    }else{
      const title=t('rc_'+RS.c)+' – '+getActiveDateRange().label;
      const co=(ST.co||{});
      const content=`<div class="inv2"><h2>${title}</h2><div class="text-secondary small mb-2">${co.name||''} · ${co.addr||''}</div><hr>${$('#rwrap')?.innerHTML||''}</div>`;
      if(window.UI.showDoc){
        window.UI.showDoc(title,content,content,false);
      }else{
        window.print();
      }
    }
  },300);
};
/* ================= Import / Export ================= */
const IS={tab:'import',ds:'products',file:null,stage:'pick',pr:0},XS={ds:'products',fmt:'csv'};
const bad_rows=()=>({products:[['PK-201','Kraft Paper 90 GSM','paper','12000','4000'],['PK-202','Art Card 250 GSM','board','-500','2000'],['PK-203','PE Film 30 Micron','film','7800','3000']],customers:[['Karim Traders','01711-000111','500000','0'],['Noor Packaging','','800000','120000'],['City Poly','01819-222333','300000','0']]}[IS.ds]||[['Sample A','100','0'],['Sample B','-5','0'],['Sample C','250','0']]);
function rowsPrev(){const{t}=F,r=bad_rows();return r.map((x,i)=>{const e=x.includes('')?t('err_phone'):x.some(v=>String(v).startsWith('-'))?t('err_qty'):'';return{x,e}})}
function dataPage(){const{t,panel,A}=F;if(!F.can('data'))return lock();
 let body='';
 if(IS.tab==='import'){const sel=`<div class="d-flex flex-wrap gap-2 align-items-center mb-3"><select class="form-select w-auto" data-in="ids">${opts(['products','customers','suppliers','balances'].map(k=>[k,t('ds_'+k)]),IS.ds)}</select><button class="btn-o" data-act="tpl"><i class="bi bi-download"></i>${t('template')}</button></div>`;
  if(IS.stage==='pick')body=sel+`<div class="drop-z" id="dz" data-act="dz"><i class="bi bi-cloud-arrow-up fs-1" style="color:var(--gold)"></i><div class="fw-semibold mt-2">${t('drop')}</div><small class="text-secondary">${t('drop_hint')}</small><input type="file" id="ifile" hidden accept=".xlsx,.xls,.csv" data-in="ifile"></div>`;
  else{const rp=rowsPrev(),ok=rp.filter(r=>!r.e).length;
   if(IS.stage==='done')body=`<h6 class="fw-bold">${t('imp_done')}</h6><div class="strip" style="grid-template-columns:1fr 1fr;border:1px solid var(--border);border-radius:10px"><div><span>${t('imported')}</span><b class="up">${F.n(ok)}</b></div><div><span>${t('skipped')}</span><b class="dn">${F.n(rp.length-ok)}</b></div></div><div class="lock mt-3"><i class="bi bi-info-circle"></i>${t('imp_note')}</div><button class="btn-o mt-3" data-act="ireset"><i class="bi bi-arrow-repeat"></i>${t('again')}</button>`;
   else body=`<div class="d-flex justify-content-between flex-wrap gap-2 mb-2"><div><b>${t('prev_title')}</b> <span class="tag">${IS.file}</span></div><div><span class="st paid">${t('valid')}: ${F.n(ok)}</span> <span class="st due">${t('error')}: ${F.n(rp.length-ok)}</span></div></div><div class="tw"><table class="tbl"><tbody>${rp.map((r,i)=>`<tr style="${r.e?'background:color-mix(in srgb,var(--danger) 8%,transparent)':''}"><td class="text-secondary">${t('row')} ${F.n(i+2)}</td>${r.x.map(c=>`<td>${c||'—'}</td>`).join('')}<td>${r.e?`<span class="dn"><i class="bi bi-x-circle"></i> ${r.e}</span>`:`<span class="up"><i class="bi bi-check-circle"></i></span>`}</td></tr>`).join('')}</tbody></table></div>${IS.stage==='run'?`<div class="bar mt-3" style="height:10px"><i style="width:${IS.pr}%;background:var(--gold);transition:width .1s"></i></div><small class="text-secondary">${t('importing')} ${F.n(IS.pr)}%</small>`:`<div class="d-flex gap-2 mt-3"><button class="btn-a" data-act="irun"><i class="bi bi-check2-circle"></i>${t('start_import')}</button><button class="btn-o" data-act="ireset">${t('cancel')}</button></div><div class="lock mt-3"><i class="bi bi-info-circle"></i>${t('imp_note')}</div>`}`}}
 else body=`<div class="row g-3" style="max-width:640px"><div class="col-sm-6"><label class="form-label fw-semibold">${t('dataset')}</label><select class="form-select" data-in="xds">${opts(['products','customers','suppliers','balances','invoices'].map(k=>[k,t('ds_'+k)]),XS.ds)}</select></div><div class="col-sm-6"><label class="form-label fw-semibold">${t('format')}</label><select class="form-select" data-in="xfm">${opts([['csv','Excel / CSV'],['pdf','PDF']],XS.fmt)}</select></div><div class="col-12"><button class="btn-a" data-act="xgo"><i class="bi bi-box-arrow-up"></i>${t('do_export')}</button></div></div>`;
 $('#view').innerHTML=`<div class="enter">${head('nav_data','ie_sub')}${tabs(IS.tab,[['import','tab_import'],['export','tab_export']],'itab')}${panel('',`<div class="panel-b">${body}</div>`)}</div>`;
 const dz=$('#dz');if(dz){['dragover','dragenter'].forEach(e=>dz.addEventListener(e,v=>{v.preventDefault();dz.classList.add('over')}));['dragleave','drop'].forEach(e=>dz.addEventListener(e,()=>dz.classList.remove('over')));dz.addEventListener('drop',v=>{v.preventDefault();pick(v.dataTransfer.files[0])})}}
const pick=f=>{if(!f)return F.toast(F.t('pick_file'),'exclamation-triangle');IS.file=f.name;IS.stage='prev';dataPage()};
P.data=f=>{I(f);dataPage()};
ACT.itab=x=>{IS.tab=x.dataset.k;dataPage()};ACT.dz=x=>{$('#ifile').click()};ACT.ireset=()=>{IS.stage='pick';dataPage()};
IN.ifile=x=>pick(x.files[0]);IN.ids=x=>{IS.ds=x.value;dataPage()};IN.xds=x=>{XS.ds=x.value};IN.xfm=x=>{XS.fmt=x.value};
ACT.tpl=()=>{const d=DS()[IS.ds];csv(IS.ds+'-template.csv',[d[0],d[1]||[]]);F.toast(F.t('tpl_done'),'download')};
ACT.irun=()=>{IS.stage='run';IS.pr=0;dataPage();const h=setInterval(()=>{IS.pr+=8;if(IS.pr>=100){clearInterval(h);IS.stage='done';if(location.hash.includes('data'))dataPage()}else if($('.bar i'))$('.bar i').style.width=IS.pr+'%'},70)};
ACT.xgo=()=>{if(XS.fmt==='csv'){csv(XS.ds+'.csv',DS()[XS.ds]);F.toast(F.t('csv_done'),'download')}else F.toast(F.t('pdf_done'),'file-earmark-pdf')};
/* ================= Settings ================= */
const ST={tab:'st_company',co:{name:BRAND.name,addr:BRAND.addr,ph:BRAND.ph,em:BRAND.em},inv:{terms:'Goods once sold are not returnable without prior notice.',foot:'Thank you for your business – Ultra Fast, For Safe Sourcing.',vat:5,vatEnabled:localStorage.getItem('fms-vat-enabled')==='true',paper:'a4',logo:true},rate:{usd:122,rmb:17},users:[{n:{bn:'আসির আহমেদ তৌসিফ',en:'Asir Ahmed Tousif'},em:'ultrafast06@gmail.com',r:'admin',on:true},{n:{bn:'তানভীর হোসেন',en:'Tanvir Hossain'},em:'manager@ultrafast.demo',r:'manager',on:true}]};
function settings(){const{t,L,A,S,panel}=F;if(!F.can('settings'))return lock();const fi=(g,k,lb,ty='text',col='col-md-6')=>`<div class="${col}"><label class="form-label fw-semibold">${lb}</label><input type="${ty}" class="form-control" id="f_${g}_${k}" data-in="sf" data-g="${g}" data-k="${k}" value="${ST[g][k]}"><div class="invalid-feedback"></div></div>`;let b='';
 if(ST.tab==='st_company')b=`<div class="row g-3">${fi('co','name',t('co_name'))}${fi('co','em',t('email'),'text')}${fi('co','ph',t('phone'))}${fi('co','addr',t('address'),'text','col-12')}<div class="col-12"><label class="form-label fw-semibold">${t('logo')}</label><div class="d-flex align-items-center gap-3"><span class="mark" id="logoPrev" style="width:56px;height:56px;border-radius:12px;overflow:hidden"><img src="${BRAND.logo}" style="width:100%;height:100%" alt=""></span><input type="file" accept="image/*" class="form-control w-auto" data-in="logo"></div></div><div class="col-12"><button class="btn-a" data-act="ssave"><i class="bi bi-check2"></i>${t('save')}</button></div></div>`;
 if(ST.tab==='st_invoice')b=`<div class="row g-3">
<div class="col-12 p-3 rounded mb-2 border" style="background:var(--surface-2)">
  <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
    <div>
      <b class="d-block fs-6"><i class="bi bi-percent me-1 text-primary"></i>${t('vat_management')}</b>
      <small class="text-secondary">${t('vat_settings_note')}</small>
    </div>
    <div class="d-flex align-items-center gap-2">
      <span class="badge ${ST.inv.vatEnabled===true?'bg-success':'bg-secondary'}">${ST.inv.vatEnabled===true?t('vat_on'):t('vat_off')}</span>
      <div class="form-check form-switch mb-0">
        <input class="form-check-input fs-5" type="checkbox" id="vatEn" data-in="sf" data-g="inv" data-k="vatEnabled" ${ST.inv.vatEnabled===true?'checked':''}>
      </div>
    </div>
  </div>
</div>
${fi('inv','terms',t('terms'),'text','col-12')}${fi('inv','foot',t('footer'),'text','col-12')}${ST.inv.vatEnabled===true?fi('inv','vat',t('vat_pct'),'number','col-md-4'):''}<div class="${ST.inv.vatEnabled===true?'col-md-4':'col-md-6'}"><label class="form-label fw-semibold">${t('paper')}</label><select class="form-select" data-in="sf" data-g="inv" data-k="paper">${opts([['a4','A4 (Standard)']],ST.inv.paper)}</select></div><div class="${ST.inv.vatEnabled===true?'col-md-4':'col-md-6'} d-flex align-items-end"><div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="lg" data-in="sf" data-g="inv" data-k="logo" ${ST.inv.logo?'checked':''}><label class="form-check-label" for="lg">${t('show_logo')}</label></div></div><div class="col-12"><button class="btn-a" data-act="ssave"><i class="bi bi-check2"></i>${t('save')}</button></div></div>`;
 if(ST.tab==='st_pref')b=`<div class="row g-4"><div class="col-md-6"><label class="form-label fw-semibold d-block">${t('lang_pref')}</label><div class="seg"><button data-act="plang" data-v="bn" class="${S.lang==='bn'?'on':''}">বাংলা</button><button data-act="plang" data-v="en" class="${S.lang==='en'?'on':''}">English</button></div></div><div class="col-md-6"><label class="form-label fw-semibold d-block">${t('theme_pref')}</label><div class="seg"><button data-act="ptheme" data-v="light" class="${S.theme==='light'?'on':''}">${t('light')}</button><button data-act="ptheme" data-v="dark" class="${S.theme==='dark'?'on':''}">${t('dark')}</button></div></div>${fi('rate','usd',t('usd'),'number')}${fi('rate','rmb',t('rmb'),'number')}<div class="col-12 text-secondary">${t('unit_note')}</div></div>`;
 if(ST.tab==='st_users')b=U.usersHtml();if(ST.tab==='st_roles')b=U.rolesHtml();
 if(ST.tab==='st_account')b=`<div class="d-flex align-items-center gap-3 mb-3"><span class="av" style="width:52px;height:52px;font-size:20px">${L(S.user.n)[0]}</span><div><b class="fs-5">${L(S.user.n)}</b><br><span class="rolechip">${U.roleName(S.user.r)}</span></div></div><h6 class="fw-bold">${t('change_pw')}</h6><div style="max-width:380px">${['cp','np','cf'].map((k,i)=>field(k,t(['cur_pw','new_pw','conf_pw'][i]),`<input type="password" id="${k}" class="form-control">`)).join('')}<button class="btn-a" data-act="pwd"><i class="bi bi-shield-lock"></i>${t('change_pw')}</button></div>`;
 $('#view').innerHTML=`<div class="enter">${head('nav_settings','set_sub')}${tabs(ST.tab,['st_company','st_invoice','st_pref','st_users','st_roles','st_account'].map(k=>[k,k]),'stab')}${panel('',`<div class="panel-b">${b}</div>`)}</div>`}
P.settings=f=>{I(f);settings()};
ACT.stab=x=>{ST.tab=x.dataset.k;settings()};IN.sf=x=>{ST[x.dataset.g][x.dataset.k]=x.type==='checkbox'?x.checked:(x.type==='number'?+x.value:x.value)};
IN.logo=x=>{const f=x.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{$('#logoPrev').innerHTML=`<img src="${r.result}" style="width:100%;height:100%;object-fit:cover">`};r.readAsDataURL(f)};
ACT.ssave=()=>{const{t,toast}=F;if(ST.tab==='st_company'){let e=0;const n=$('#f_co_name'),m=$('#f_co_em');[n,m].forEach(i=>i.classList.remove('is-invalid'));if(!ST.co.name.trim()){n.classList.add('is-invalid');n.nextElementSibling.textContent=t('req');e=1}if(!/^\S+@\S+\.\S+$/.test(ST.co.em)){m.classList.add('is-invalid');m.nextElementSibling.textContent=t('invalid_email');e=1}if(e)return}if(ST.tab==='st_invoice'){localStorage.setItem('fms-vat-enabled',String(ST.inv.vatEnabled===true));localStorage.setItem('fms-vat-pct',String(ST.inv.vat||5))}toast(t('saved_set'),'check-circle');settings()};
ACT.plang=x=>{if(F.S.lang!==x.dataset.v){F.S.lang=x.dataset.v;localStorage.setItem('fms-lang',x.dataset.v);F.all(false)}};ACT.ptheme=x=>{if(F.S.theme!==x.dataset.v){$('#theme').click();settings()}};
IN.utog=x=>{ST.users[+x.dataset.i].on=x.checked};
ACT.uadd=()=>{const{t,toast}=F;modal(t('add_user'),field('un',t('uname'),'<input id="un" class="form-control">')+field('ue',t('email'),'<input id="ue" class="form-control">')+field('ur',t('urole'),`<select id="ur" class="form-select">${opts([['manager',t('role_manager')],['admin',t('role_admin')]])}</select>`),()=>{['un','ue'].forEach(i=>$('#'+i).classList.remove('is-invalid'));let e=0;const n=$('#un').value.trim(),m=$('#ue').value.trim();if(!n)e=bad('un',t('req'));if(!/^\S+@\S+\.\S+$/.test(m))e=bad('ue',t('invalid_email'));if(e)return false;ST.users.push({n:{bn:n,en:n},em:m,r:$('#ur').value,on:true});toast(t('user_added'),'person-check');settings()})};
ACT.pwd=()=>{const{t,toast}=F;['cp','np','cf'].forEach(i=>$('#'+i).classList.remove('is-invalid'));let e=0;if(!$('#cp').value)e=bad('cp',t('req'));if($('#np').value.length<8)e=bad('np',t('pw_short'));if($('#cf').value!==$('#np').value)e=bad('cf',t('pw_match'));if(e)return;toast(t('pw_done'),'shield-check');settings()};
window.UI.ST=ST;window.UI.roleName=id=>F.RN(id);window.UI.reports=reports;window.UI.RS=RS;
})();
