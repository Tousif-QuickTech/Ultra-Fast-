/* Phase 4 & Requirements 3-4:
   - Accounts & Ledger
   - Income & Expenses with Quick Date Filters (Today, Yesterday, 7d, Month, Last Month, Custom) (Req 4)
   - Income, Expense & Combined Summaries ($Net = Income - Expense$) (Req 4)
   - UTF-8 BOM CSV Exports with Required Columns (Req 3)
   - HRM Module
*/
(()=>{
const {modal,field,bad,opts,bd,sum,$,ACT,IN,boot}=window.UI,P=window.PAGES;let F;
const E=(bn,en,dep,ph,basic,ot,bonus,ded,adv)=>({n:{bn,en},dep,ph,basic,ot,bonus,ded,adv});

let expSeq = 100;

function init(f){
  F=f;boot(f);const D=f.D;if(D.exp)return;

  const X=(k,c,a,d,n,title,src,custRef,refNo,m,dayOffset=1)=>{
    const ts = new Date(2026, 9, dayOffset, 10, 0, 0).getTime();
    const dStr = new Date(ts).toLocaleDateString(F.S.lang==='bn'?'bn-BD':'en-IN',{day:'2-digit',month:'short',year:'numeric'});
    const id = (k==='income'?'INC-2026-':'EXP-2026-') + (++expSeq);
    return {
      id,
      k,
      c,
      a,
      d,
      n,
      title: title || n[1],
      src: src || title || n[1],
      custRef: custRef || '—',
      refNo: refNo || ('REF-' + (5400 + expSeq)),
      m: m || 'm_bank',
      ts,
      dtStr: dStr,
      by: 'আসির আহমেদ তৌসিফ'
    };
  };

  D.exp=[
    X('expense','rent',250000,['০১ অক্টো','01 Oct'],['গুদাম ভাড়া','Warehouse rent'],'Warehouse Rent','','Square Properties','REF-9901','m_bank', 1),
    X('expense','transport',310000,['০৫ অক্টো','05 Oct'],['পণ্য পরিবহন','Goods transport'],'Goods Transport','','Sundarban Courier','REF-9902','m_cash', 5),
    X('expense','utility',95000,['১০ অক্টো','10 Oct'],['বিদ্যুৎ ও ইন্টারনেট','Electricity & internet'],'Electricity & Internet','','DESCO / Link3','REF-9903','m_bank', 10),
    X('expense','salary',480000,['২৫ অক্টো','25 Oct'],['সেপ্টেম্বরের বেতন','September salary'],'September Staff Salary','','Staff Payroll','REF-9904','m_bank', 25),
    X('expense','other',50000,['২৬ অক্টো','26 Oct'],['অফিস সরঞ্জাম','Office supplies'],'Office Stationery & Supplies','','Dhaka Paper Mart','REF-9905','m_cash', 26),
    X('income','scrap',45000,['১৪ অক্টো','14 Oct'],['স্ক্র্যাপ পেপার বিক্রি','Scrap paper sale'],'Scrap Paper Sale','Factory Waste Scrap','Alif Plastic Recycling','REF-9906','m_cash', 14),
    X('income','other',30000,['২০ অক্টো','20 Oct'],['ভাড়া ফেরত','Deposit refund'],'Warehouse Security Deposit Refund','Deposit Return','Rahman Properties','REF-9907','m_bank', 20)
  ];

  D.emp=[
    E('মো. কামরুল হাসান','Md. Kamrul Hasan','wh','01711-110021',28000,3500,2000,0,0),
    E('সাবিনা ইয়াসমিন','Sabina Yasmin','ac','01819-220032',32000,0,2500,500,5000),
    E('রফিকুল ইসলাম','Rafiqul Islam','sl','01912-330043',24000,1800,3000,0,0),
    E('জাহিদ হাসান','Jahid Hasan','tr','01678-440054',18000,4200,1000,300,2000),
    E('নাসরিন আক্তার','Nasrin Akter','of','01555-550065',16000,0,1000,0,0),
    E('আব্দুল করিম','Abdul Karim','wh','01744-660076',14000,3000,500,0,1000)
  ];

  D.empDes=[
    ['গুদাম সুপারভাইজার','Warehouse Supervisor'],
    ['হিসাবরক্ষক','Accountant'],
    ['সেলস এক্সিকিউটিভ','Sales Executive'],
    ['ড্রাইভার','Driver'],
    ['অফিস সহকারী','Office Assistant'],
    ['লোডার','Loader']
  ];

  D.att=['present','present','late','present','absent','leave'];
}

const lock=()=>{$('#view').innerHTML=`<div class="lock"><i class="bi bi-lock"></i>${F.t('admin_only')}</div>`};
const tabs=(cur,list,act)=>`<div class="seg mb-3">${list.map(([k,l])=>`<button data-act="${act}" data-k="${k}" class="${cur===k?'on':''}">${F.t(l)}</button>`).join('')}</div>`;
const head=(h,s)=>`<div class="page-h"><div><h2>${F.t(h)}</h2><p>${F.t(s)}</p></div></div>`;

/* ---------- Accounts ---------- */
const AS={tab:'trial',c:0};
function accounts(){
  const{t,L,lg,D,A,tk,panel,lrow}=F;if(!F.can('accounts'))return lock();
  const sales=sum(D.daily.sales),cogs=Math.round(sales*D.cogsRate),dr=[['acc_cash',D.cashBank.cash],['acc_bank',D.cashBank.bank],['acc_recv',sum(D.customers.map(c=>c.due))],['acc_inv',Math.round(sum(D.products.map(p=>p.kg*p.cost)))],['acc_cogs',cogs],['acc_exp',D.expenses]],cr=[['acc_pay',D.cashBank.payable],['acc_sales',sales]];cr.push(['acc_cap',sum(dr.map(x=>x[1]))-sum(cr.map(x=>x[1]))]);
  let body='';
  if(AS.tab==='trial'){
    const td=sum(dr.map(x=>x[1])),tc=sum(cr.map(x=>x[1]));
    body=`<div class="tw"><table class="tbl"><thead><tr><th>${t('account')}</th><th class="r">${t('debit')}</th><th class="r">${t('credit')}</th></tr></thead><tbody>${dr.map(x=>`<tr><td>${t(x[0])}</td><td class="r">${tk(x[1])}</td><td></td></tr>`).join('')}${cr.map(x=>`<tr><td>${t(x[0])}</td><td></td><td class="r">${tk(x[1])}</td></tr>`).join('')}<tr class="fw-bold"><td>${t('tot')}</td><td class="r">${tk(td)}</td><td class="r">${tk(tc)}</td></tr></tbody></table></div>`;
  } else if(AS.tab==='pl'){
    const g=sales-cogs;
    body=`<div class="panel-b" style="max-width:560px">${lrow(t('revenue'),tk(sales))}${lrow('− '+t('cogs'),tk(cogs),'dn')}${lrow(t('gross'),tk(g))}${lrow('− '+t('expenses'),tk(D.expenses),'dn')}${lrow(t('net_profit'),tk(g-D.expenses),'up').replace('lrow','lrow tot')}</div>`;
  } else {
    const c=D.customers[AS.c],p1=Math.round(c.due*.8/1000)*1000,p2=Math.round(c.due*.6/1000)*1000;let b=0;const rows=c.due>0?[['lx_inv',p1,0,['২২ সেপ্টে','22 Sep']],['lx_inv',p2,0,['০৮ অক্টো','08 Oct']],['lx_pay',0,p1+p2-c.due,['২০ অক্টো','20 Oct']]]:[];
    body=`<div class="p-3"><select class="form-select w-auto" data-in="ledc">${opts(D.customers.map((x,i)=>[i,L(x)]),AS.c)}</select></div><div class="tw"><table class="tbl"><thead><tr><th>${t('date')}</th><th>${t('type')}</th><th class="r">${t('debit')}</th><th class="r">${t('credit')}</th><th class="r">${t('balance')}</th></tr></thead><tbody>${rows.length?rows.map(r=>{b+=r[1]-r[2];return `<tr><td>${lg(r[3])}</td><td>${t(r[0])}</td><td class="r">${r[1]?tk(r[1]):''}</td><td class="r up">${r[2]?tk(r[2]):''}</td><td class="r fw-semibold">${tk(b)}</td></tr>`;}).join(''):`<tr><td colspan="5" class="text-center text-secondary py-4">${t('no_tx')}</td></tr>`}</tbody></table></div>`;
  }
  $('#view').innerHTML=`<div class="enter">${head('nav_accounts','acc_sub')}${tabs(AS.tab,[['trial','tab_trial'],['pl','tab_pl'],['ledger','tab_ledger']],'atab')}${panel('',body,'')}<div class="lock mt-3"><i class="bi bi-info-circle"></i>${t('acc_note')}</div></div>`;
}
P.accounts=f=>{init(f);accounts()};ACT.atab=x=>{AS.tab=x.dataset.k;accounts()};IN.ledc=x=>{AS.c=+x.value;accounts()};

/* =========================================================
   SEPARATED MODULES:
   1. INCOME MODULE (P.income)
   2. EXPENSE MODULE (P.expenses)
   ========================================================= */

function matchTxnDate(item, range, df, dt) {
  const ts = item.ts || Date.now();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yestStart = todayStart - 86400000;
  const weekStart = todayStart - 7 * 86400000;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const lastMonthEnd = monthStart - 1;

  if (range === 'today') return ts >= todayStart;
  if (range === 'yesterday') return ts >= yestStart && ts < todayStart;
  if (range === 'last7d') return ts >= weekStart;
  if (range === 'this_month') return ts >= monthStart;
  if (range === 'last_month') return ts >= lastMonthStart && ts <= lastMonthEnd;
  if (range === 'custom') {
    if (df && ts < new Date(df).setHours(0,0,0,0)) return false;
    if (dt && ts > new Date(dt).setHours(23,59,59,999)) return false;
    return true;
  }
  return true;
}

/* ---------------------------------------------------------
   1. INCOME MODULE
   --------------------------------------------------------- */
const IS_STATE = {
  range: 'all',
  cat: 'all',
  m: 'all',
  df: '',
  dt: '',
  q: ''
};

function filterIncome() {
  const D = F.D;
  return D.exp.filter(e => {
    if (e.k !== 'income') return false;
    if (IS_STATE.cat !== 'all' && e.c !== IS_STATE.cat) return false;
    if (IS_STATE.m !== 'all' && e.m !== IS_STATE.m) return false;
    if (!matchTxnDate(e, IS_STATE.range, IS_STATE.df, IS_STATE.dt)) return false;
    if (IS_STATE.q) {
      const q = IS_STATE.q.toLowerCase().trim();
      const txt = `${e.id} ${e.title} ${e.src} ${e.custRef} ${e.refNo} ${e.n ? (e.n[0] + ' ' + e.n[1]) : ''}`.toLowerCase();
      if (!txt.includes(q)) return false;
    }
    return true;
  });
}

function incomePage() {
  const { t, L, lg, D, A, tk, short, n, panel } = F;
  if(!F.can('income')) return lock();

  const filtered = filterIncome();
  const totalInc = sum(filtered.map(e => e.a));
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const thisMonthInc = sum(filtered.filter(e => (e.ts || 0) >= monthStart).map(e => e.a));
  const cashInc = sum(filtered.filter(e => e.m === 'm_cash').map(e => e.a));
  const bankInc = sum(filtered.filter(e => e.m !== 'm_cash').map(e => e.a));

  const catTotals = {};
  filtered.forEach(e => { catTotals[e.c] = (catTotals[e.c] || 0) + e.a; });
  const allIncomeCats = [...new Set(D.exp.filter(e => e.k === 'income').map(e => e.c))];

  const dateRanges = [
    ['all', t('all')],
    ['today', t('today')],
    ['yesterday', t('yesterday')],
    ['last7d', t('last7d')],
    ['this_month', t('this_month')],
    ['last_month', t('last_month')],
    ['custom', t('custom_range')]
  ];

  const quickFilterButtons = `
    <div class="quick-filter-scroll d-flex gap-1 align-items-center mb-2 pb-1 overflow-x-auto text-nowrap">
      <span class="small fw-bold text-secondary me-1 flex-shrink-0"><i class="bi bi-funnel me-1"></i>${t('quick_filters')}:</span>
      ${dateRanges.map(([k, label]) => `
        <button class="btn btn-sm ${IS_STATE.range === k ? 'btn-primary' : 'btn-outline-secondary'} text-nowrap" data-act="incrange" data-k="${k}">
          ${label}
        </button>`).join('')}
    </div>`;

  const customDateInputs = IS_STATE.range === 'custom' ? `
    <div class="d-flex flex-wrap align-items-center gap-2 mb-2 p-2 rounded border bg-surface-2">
      <div class="d-flex align-items-center gap-1 flex-fill">
        <span class="small fw-semibold text-nowrap">${t('from_date')}:</span>
        <input type="date" class="form-control form-control-sm flex-fill" data-in="incdf" value="${IS_STATE.df}">
      </div>
      <div class="d-flex align-items-center gap-1 flex-fill">
        <span class="small fw-semibold text-nowrap">${t('to_date')}:</span>
        <input type="date" class="form-control form-control-sm flex-fill" data-in="incdt" value="${IS_STATE.dt}">
      </div>
      <button class="btn btn-sm btn-outline-secondary flex-shrink-0" data-act="increset"><i class="bi bi-x-circle me-1"></i>${t('reset_filter')}</button>
    </div>` : '';

  const filterToolbar = `
    <div class="card mb-3 border shadow-sm">
      <div class="card-body p-3">
        ${quickFilterButtons}
        ${customDateInputs}
        <div class="row g-2 align-items-center mt-1">
          <div class="col-6 col-md-4">
            <label class="form-label small fw-semibold text-secondary mb-1">${t('category')}</label>
            <select class="form-select form-select-sm" data-in="inccat">
              ${opts([['all', t('all')], ...allIncomeCats.map(k => [k, t('c_' + k) || k])], IS_STATE.cat)}
            </select>
          </div>
          <div class="col-6 col-md-4">
            <label class="form-label small fw-semibold text-secondary mb-1">${t('method')}</label>
            <select class="form-select form-select-sm" data-in="incm">
              ${opts([['all', t('all')], ...F.methods().map(m => [m, t(m)])], IS_STATE.m)}
            </select>
          </div>
          <div class="col-12 col-md-4">
            <label class="form-label small fw-semibold text-secondary mb-1">${t('search')}</label>
            <div class="input-group input-group-sm">
              <input type="text" class="form-control" data-in="incq" value="${IS_STATE.q}" placeholder="${t('search')}..." aria-label="Search income">
              ${(IS_STATE.range!=='all'||IS_STATE.cat!=='all'||IS_STATE.m!=='all'||IS_STATE.q||IS_STATE.df||IS_STATE.dt)?`<button class="btn btn-outline-secondary" data-act="increset"><i class="bi bi-arrow-counterclockwise"></i></button>`:''}
            </div>
          </div>
        </div>
      </div>
    </div>`;

  const summariesStrip = `
    <div class="strip strip-4 mb-3">
      <div><span>${t('nav_income') || t('income')}</span><b class="up">${tk(totalInc)}</b></div>
      <div><span>${t('this_month')}</span><b class="text-primary">${tk(thisMonthInc)}</b></div>
      <div><span>${t('m_cash')}</span><b>${tk(cashInc)}</b></div>
      <div><span>${t('m_bank')} / ${t('other')}</span><b>${tk(bankInc)}</b></div>
    </div>`;

  const breakdownPills = `
    <div class="d-flex flex-wrap gap-2 mb-3">
      ${Object.entries(catTotals).map(([k, amt]) => `
        <span class="badge bg-success-subtle text-success border border-success-subtle p-2">
          ${t('c_' + k) || k}: <b>${tk(amt)}</b>
        </span>`).join('')}
    </div>`;

  const exportActionBar = `
    <div class="d-flex gap-2 mb-3 flex-column flex-sm-row">
      <button class="btn btn-sm btn-outline-success flex-fill py-2" data-act="inccsv">
        <i class="bi bi-file-earmark-excel me-1"></i>${t('export_income_csv') || 'আয় CSV এক্সপোর্ট'}
      </button>
      <button class="btn btn-sm btn-success flex-fill py-2" data-act="inadd">
        <i class="bi bi-plus-lg me-1"></i>${t('add_income') || 'নতুন আয় যোগ'}
      </button>
    </div>`;

  const incCards = `
    <div class="d-md-none inc-mobile-list p-2">
      ${filtered.length ? filtered.map(e => `
        <div class="mob-tx-card mb-2 p-3">
          <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
            <div>
              <span class="badge bg-success-subtle text-success border border-success-subtle fw-bold">${e.id}</span>
              <small class="text-secondary ms-1"><i class="bi bi-calendar3 me-1"></i>${e.dtStr || (e.d ? lg(e.d) : '')}</small>
            </div>
            <b class="fs-6 up fw-bold text-nowrap">+${tk(e.a)}</b>
          </div>
          <div class="fw-bold mb-1" style="font-size:15px">${e.title || e.src || (e.n ? lg(e.n) : '')}</div>
          <div class="d-flex flex-wrap gap-1 align-items-center mb-2">
            <span class="badge bg-light text-dark border small">${t('c_' + e.c) || e.c}</span>
            <span class="badge bg-light text-secondary border small"><i class="bi bi-wallet2 me-1"></i>${t(e.m) || e.m}</span>
            ${e.custRef && e.custRef !== '—' ? `<span class="badge bg-light text-secondary border small"><i class="bi bi-person me-1"></i>${e.custRef}</span>` : ''}
          </div>
          ${(e.desc || (e.n && lg(e.n) !== e.title)) ? `<p class="small text-secondary mb-1">${e.n ? lg(e.n) : e.desc}</p>` : ''}
          <div class="d-flex justify-content-between align-items-center text-secondary small pt-1 border-top">
            <span><i class="bi bi-tag me-1"></i>${e.refNo || '—'}</span>
            <span><i class="bi bi-person-check me-1"></i>${e.by || 'Admin'}</span>
          </div>
        </div>
      `).join('') : `<div class="text-center text-secondary py-4">${t('empty')}</div>`}
      <div class="p-3 rounded-3 border bg-surface-2 mt-2 d-flex justify-content-between align-items-center">
        <span class="fw-bold">${t('tot')}:</span>
        <b class="fs-5 up">+${tk(totalInc)}</b>
      </div>
    </div>`;

  const tableRows = filtered.map(e => `
    <tr>
      <td>
        <b>${e.id}</b>
        <br><small class="text-secondary">${e.dtStr || (e.d ? lg(e.d) : '')}</small>
      </td>
      <td>
        <span class="badge bg-success-subtle text-success border border-success-subtle">${t('c_' + e.c) || e.c}</span>
        <br><small class="fw-semibold">${e.title || e.src || ''}</small>
      </td>
      <td>
        <small class="text-secondary">${e.custRef || e.refNo || '—'}</small>
        ${e.refNo && e.refNo !== e.custRef ? `<br><code>${e.refNo}</code>` : ''}
      </td>
      <td><span class="badge bg-light text-dark border">${t(e.m) || e.m}</span></td>
      <td><small>${e.n ? lg(e.n) : (e.desc || '—')}</small></td>
      <td><small class="text-secondary">${e.by || 'Admin'}</small></td>
      <td class="r fw-bold up">+${tk(e.a)}</td>
    </tr>`).join('');

  const incTable = `
    <div class="d-none d-md-block tw">
      <table class="tbl" id="inc-tbl">
        <thead>
          <tr>
            <th>${t('pay_id')} / ${t('date')}</th>
            <th>${t('category')} / ${t('title')}</th>
            <th>${t('customer')} / ${t('pay_ref')}</th>
            <th>${t('method')}</th>
            <th>${t('description')}</th>
            <th>${t('created_by')}</th>
            <th class="r">${t('amount')}</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows.length ? tableRows : `<tr><td colspan="7" class="text-center text-secondary py-4">${t('empty')}</td></tr>`}
          <tr class="fw-bold ft">
            <td colspan="6">${t('tot')}:</td>
            <td class="r up">+${tk(totalInc)}</td>
          </tr>
        </tbody>
      </table>
    </div>`;

  $('#view').innerHTML = `
    <div class="enter">
      <div class="page-h flex-column flex-sm-row gap-2 align-items-start align-items-sm-center justify-content-between">
        <div>
          <h2>${t('nav_income')}</h2>
          <p>${t('inc_sub')}</p>
        </div>
      </div>
      ${filterToolbar}
      ${summariesStrip}
      ${breakdownPills}
      ${exportActionBar}
      ${panel('', incCards + incTable)}
    </div>`;
}

P.income = f => { init(f); incomePage(); };

ACT.incrange = x => { IS_STATE.range = x.dataset.k; incomePage(); };
IN.inccat = x => { IS_STATE.cat = x.value; incomePage(); };
IN.incm = x => { IS_STATE.m = x.value; incomePage(); };
IN.incq = x => { IS_STATE.q = x.value; incomePage(); };
IN.incdf = x => { IS_STATE.df = x.value; incomePage(); };
IN.incdt = x => { IS_STATE.dt = x.value; incomePage(); };
ACT.increset = () => {
  IS_STATE.range = 'all';
  IS_STATE.cat = 'all';
  IS_STATE.m = 'all';
  IS_STATE.df = '';
  IS_STATE.dt = '';
  IS_STATE.q = '';
  incomePage();
};

/* ---------------------------------------------------------
   2. EXPENSE MODULE
   --------------------------------------------------------- */
const ES = {
  f: 'expense',
  range: 'all',
  cat: 'all',
  m: 'all',
  df: '',
  dt: '',
  q: ''
};

function filterExpenses() {
  const D = F.D;
  return D.exp.filter(e => {
    if (e.k !== 'expense') return false;
    if (ES.cat !== 'all' && e.c !== ES.cat) return false;
    if (ES.m !== 'all' && e.m !== ES.m) return false;
    if (!matchTxnDate(e, ES.range, ES.df, ES.dt)) return false;
    if (ES.q) {
      const q = ES.q.toLowerCase().trim();
      const txt = `${e.id} ${e.title} ${e.src} ${e.custRef} ${e.refNo} ${e.n ? (e.n[0] + ' ' + e.n[1]) : ''}`.toLowerCase();
      if (!txt.includes(q)) return false;
    }
    return true;
  });
}

function expenses(){
  const { t, L, lg, D, A, tk, short, n, panel } = F;
  if(!F.can('expenses')) return lock();

  const filtered = filterExpenses();
  const totalEx = sum(filtered.map(e => e.a));
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const thisMonthEx = sum(filtered.filter(e => (e.ts || 0) >= monthStart).map(e => e.a));
  const cashEx = sum(filtered.filter(e => e.m === 'm_cash').map(e => e.a));
  const bankEx = sum(filtered.filter(e => e.m !== 'm_cash').map(e => e.a));

  const catTotals = {};
  filtered.forEach(e => { catTotals[e.c] = (catTotals[e.c] || 0) + e.a; });
  const allExpCats = [...new Set(D.exp.filter(e => e.k === 'expense').map(e => e.c))];

  const dateRanges = [
    ['all', t('all')],
    ['today', t('today')],
    ['yesterday', t('yesterday')],
    ['last7d', t('last7d')],
    ['this_month', t('this_month')],
    ['last_month', t('last_month')],
    ['custom', t('custom_range')]
  ];

  const quickFilterButtons = `
    <div class="quick-filter-scroll d-flex gap-1 align-items-center mb-2 pb-1 overflow-x-auto text-nowrap">
      <span class="small fw-bold text-secondary me-1 flex-shrink-0"><i class="bi bi-funnel me-1"></i>${t('quick_filters')}:</span>
      ${dateRanges.map(([k, label]) => `
        <button class="btn btn-sm ${ES.range === k ? 'btn-primary' : 'btn-outline-secondary'} text-nowrap" data-act="esrange" data-k="${k}">
          ${label}
        </button>`).join('')}
    </div>`;

  const customDateInputs = ES.range === 'custom' ? `
    <div class="d-flex flex-wrap align-items-center gap-2 mb-2 p-2 rounded border bg-surface-2">
      <div class="d-flex align-items-center gap-1 flex-fill">
        <span class="small fw-semibold text-nowrap">${t('from_date')}:</span>
        <input type="date" class="form-control form-control-sm flex-fill" data-in="esdf" value="${ES.df}">
      </div>
      <div class="d-flex align-items-center gap-1 flex-fill">
        <span class="small fw-semibold text-nowrap">${t('to_date')}:</span>
        <input type="date" class="form-control form-control-sm flex-fill" data-in="esdt" value="${ES.dt}">
      </div>
      <button class="btn btn-sm btn-outline-secondary flex-shrink-0" data-act="esreset"><i class="bi bi-x-circle me-1"></i>${t('reset_filter')}</button>
    </div>` : '';

  const filterToolbar = `
    <div class="card mb-3 border shadow-sm">
      <div class="card-body p-3">
        ${quickFilterButtons}
        ${customDateInputs}
        <div class="row g-2 align-items-center mt-1">
          <div class="col-6 col-md-4">
            <label class="form-label small fw-semibold text-secondary mb-1">${t('category')}</label>
            <select class="form-select form-select-sm" data-in="escat">
              ${opts([['all', t('all')], ...allExpCats.map(k => [k, t('c_' + k) || k])], ES.cat)}
            </select>
          </div>
          <div class="col-6 col-md-4">
            <label class="form-label small fw-semibold text-secondary mb-1">${t('method')}</label>
            <select class="form-select form-select-sm" data-in="esm">
              ${opts([['all', t('all')], ...F.methods().map(m => [m, t(m)])], ES.m)}
            </select>
          </div>
          <div class="col-12 col-md-4">
            <label class="form-label small fw-semibold text-secondary mb-1">${t('search')}</label>
            <div class="input-group input-group-sm">
              <input type="text" class="form-control" data-in="esq" value="${ES.q}" placeholder="${t('search')}..." aria-label="Search expenses">
              ${(ES.range!=='all'||ES.cat!=='all'||ES.m!=='all'||ES.q||ES.df||ES.dt)?`<button class="btn btn-outline-secondary" data-act="esreset"><i class="bi bi-arrow-counterclockwise"></i></button>`:''}
            </div>
          </div>
        </div>
      </div>
    </div>`;

  const summariesStrip = `
    <div class="strip strip-4 mb-3">
      <div><span>${t('nav_expenses') || t('expenses')}</span><b class="dn">${tk(totalEx)}</b></div>
      <div><span>${t('this_month')}</span><b class="text-danger">${tk(thisMonthEx)}</b></div>
      <div><span>${t('m_cash')}</span><b>${tk(cashEx)}</b></div>
      <div><span>${t('m_bank')} / ${t('other')}</span><b>${tk(bankEx)}</b></div>
    </div>`;

  const breakdownPills = `
    <div class="d-flex flex-wrap gap-2 mb-3">
      ${Object.entries(catTotals).map(([k, amt]) => `
        <span class="badge bg-danger-subtle text-danger border border-danger-subtle p-2">
          ${t('c_' + k) || k}: <b>${tk(amt)}</b>
        </span>`).join('')}
    </div>`;

  const exportActionBar = `
    <div class="d-flex gap-2 mb-3 flex-column flex-sm-row">
      <button class="btn btn-sm btn-outline-danger flex-fill py-2" data-act="expcsv">
        <i class="bi bi-file-earmark-excel me-1"></i>${t('export_expense_csv') || 'ব্যয় CSV এক্সপোর্ট'}
      </button>
      <button class="btn btn-sm btn-danger flex-fill py-2" data-act="exadd">
        <i class="bi bi-plus-lg me-1"></i>${t('add_expense') || 'নতুন খরচ যোগ'}
      </button>
    </div>`;

  const expCards = `
    <div class="d-md-none exp-mobile-list p-2">
      ${filtered.length ? filtered.map(e => `
        <div class="mob-tx-card mb-2 p-3">
          <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
            <div>
              <span class="badge bg-danger-subtle text-danger border border-danger-subtle fw-bold">${e.id}</span>
              <small class="text-secondary ms-1"><i class="bi bi-calendar3 me-1"></i>${e.dtStr || (e.d ? lg(e.d) : '')}</small>
            </div>
            <b class="fs-6 dn fw-bold text-nowrap">−${tk(e.a)}</b>
          </div>
          <div class="fw-bold mb-1" style="font-size:15px">${e.title || e.src || (e.n ? lg(e.n) : '')}</div>
          <div class="d-flex flex-wrap gap-1 align-items-center mb-2">
            <span class="badge bg-light text-dark border small">${t('c_' + e.c) || e.c}</span>
            <span class="badge bg-light text-secondary border small"><i class="bi bi-wallet2 me-1"></i>${t(e.m) || e.m}</span>
            ${e.custRef && e.custRef !== '—' ? `<span class="badge bg-light text-secondary border small"><i class="bi bi-building me-1"></i>${e.custRef}</span>` : ''}
          </div>
          ${(e.desc || (e.n && lg(e.n) !== e.title)) ? `<p class="small text-secondary mb-1">${e.n ? lg(e.n) : e.desc}</p>` : ''}
          <div class="d-flex justify-content-between align-items-center text-secondary small pt-1 border-top">
            <span><i class="bi bi-tag me-1"></i>${e.refNo || '—'}</span>
            <span><i class="bi bi-person-check me-1"></i>${e.by || 'Admin'}</span>
          </div>
        </div>
      `).join('') : `<div class="text-center text-secondary py-4">${t('empty')}</div>`}
      <div class="p-3 rounded-3 border bg-surface-2 mt-2 d-flex justify-content-between align-items-center">
        <span class="fw-bold">${t('tot')}:</span>
        <b class="fs-5 dn">−${tk(totalEx)}</b>
      </div>
    </div>`;

  const tableRows = filtered.map(e => `
    <tr>
      <td>
        <b>${e.id}</b>
        <br><small class="text-secondary">${e.dtStr || (e.d ? lg(e.d) : '')}</small>
      </td>
      <td>
        <span class="badge bg-danger-subtle text-danger border border-danger-subtle">${t('c_' + e.c) || e.c}</span>
        <br><small class="fw-semibold">${e.title || e.src || ''}</small>
      </td>
      <td>
        <small class="text-secondary">${e.custRef || e.refNo || '—'}</small>
        ${e.refNo && e.refNo !== e.custRef ? `<br><code>${e.refNo}</code>` : ''}
      </td>
      <td><span class="badge bg-light text-dark border">${t(e.m) || e.m}</span></td>
      <td><small>${e.n ? lg(e.n) : (e.desc || '—')}</small></td>
      <td><small class="text-secondary">${e.by || 'Admin'}</small></td>
      <td class="r fw-bold dn">−${tk(e.a)}</td>
    </tr>`).join('');

  const expTable = `
    <div class="d-none d-md-block tw">
      <table class="tbl" id="exp-tbl">
        <thead>
          <tr>
            <th>${t('pay_id')} / ${t('date')}</th>
            <th>${t('category')} / ${t('title')}</th>
            <th>${t('supplier')} / ${t('pay_ref')}</th>
            <th>${t('method')}</th>
            <th>${t('description')}</th>
            <th>${t('created_by')}</th>
            <th class="r">${t('amount')}</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows.length ? tableRows : `<tr><td colspan="7" class="text-center text-secondary py-4">${t('empty')}</td></tr>`}
          <tr class="fw-bold ft">
            <td colspan="6">${t('tot')}:</td>
            <td class="r dn">−${tk(totalEx)}</td>
          </tr>
        </tbody>
      </table>
    </div>`;

  $('#view').innerHTML = `
    <div class="enter">
      <div class="page-h flex-column flex-sm-row gap-2 align-items-start align-items-sm-center justify-content-between">
        <div>
          <h2>${t('nav_expenses')}</h2>
          <p>${t('e_sub')}</p>
        </div>
      </div>
      ${filterToolbar}
      ${summariesStrip}
      ${breakdownPills}
      ${exportActionBar}
      ${panel('', expCards + expTable)}
    </div>`;
}

P.expenses = f => { init(f); expenses(); };

/* Expense Filter handlers */
ACT.esrange = x => { ES.range = x.dataset.k; expenses(); };
IN.escat = x => { ES.cat = x.value; expenses(); };
IN.esm = x => { ES.m = x.value; expenses(); };
IN.esq = x => { ES.q = x.value; expenses(); };
IN.esdf = x => { ES.df = x.value; expenses(); };
IN.esdt = x => { ES.dt = x.value; expenses(); };
ACT.esreset = () => {
  ES.range = 'all';
  ES.cat = 'all';
  ES.m = 'all';
  ES.df = '';
  ES.dt = '';
  ES.q = '';
  expenses();
};

/* =========================================================
   CSV EXPORT ENGINE WITH UTF-8 BOM
   ========================================================= */
function exportIncomeExpenseCsv(type) {
  let filename = 'transactions.csv';
  let headers = [];
  let dataRows = [];

  if (type === 'income') {
    filename = 'income-report.csv';
    const items = filterIncome();
    headers = ['Income ID', 'Income Date', 'Category', 'Source', 'Customer/Reference', 'Payment Method', 'Amount', 'Description', 'Created By'];
    dataRows = items.map(r => [
      r.id,
      r.dtStr || (r.d ? (F.S.lang === 'bn' ? r.d[0] : r.d[1]) : ''),
      F.t('c_' + r.c) || r.c,
      r.src || r.title || '',
      r.custRef || '',
      F.t(r.m) || r.m,
      r.a,
      (r.n ? (F.S.lang === 'bn' ? r.n[0] : r.n[1]) : r.desc) || '',
      r.by || ''
    ]);
  } else {
    filename = 'expense-report.csv';
    const items = filterExpenses();
    headers = ['Expense ID', 'Expense Date', 'Category', 'Expense Title', 'Payment Method', 'Amount', 'Reference Number', 'Description/Remarks', 'Created By'];
    dataRows = items.map(r => [
      r.id,
      r.dtStr || (r.d ? (F.S.lang === 'bn' ? r.d[0] : r.d[1]) : ''),
      F.t('c_' + r.c) || r.c,
      r.title || '',
      F.t(r.m) || r.m,
      r.a,
      r.refNo || '',
      (r.n ? (F.S.lang === 'bn' ? r.n[0] : r.n[1]) : r.desc) || '',
      r.by || ''
    ]);
  }

  const csvContent = '\ufeff' + [headers, ...dataRows].map(line =>
    line.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  if (typeof LOG !== 'undefined') {
    LOG.add({
      uid: F.S.user?.id,
      u: F.S.user?.n?.bn,
      r: F.S.role,
      m: type === 'income' ? 'income' : 'expenses',
      t: 'export',
      recordType: 'csv_export',
      recordId: filename,
      msg: `${type === 'income' ? 'আয়' : 'ব্যয়'} CSV এক্সপোর্ট – ${dataRows.length} রেকর্ড`
    });
  }

  F.toast(F.t('csv_done') || 'ডাউনলোড সম্পন্ন', 'download');
}

ACT.inccsv = () => exportIncomeExpenseCsv('income');
ACT.expcsv = () => exportIncomeExpenseCsv('expense');
ACT.escsv = x => exportIncomeExpenseCsv(x.dataset.type || 'expense');

/* Add Income Modal */
ACT.inadd = () => {
  const { t, D, toast } = F;
  const body = `
    <div class="row g-2 g-sm-3">
      <div class="col-12 col-sm-6">${field('inc_c', t('category'), `<select id="inc_c" class="form-select">${opts([['scrap', t('c_scrap') || 'স্ক্র্যাপ বিক্রি'], ['other', t('c_other') || 'অন্যান্য / ফেরত']])}</select>`)}</div>
      <div class="col-12 col-sm-6">${field('inc_m', t('method'), `<select id="inc_m" class="form-select">${opts(F.methods().map(m => [m, t(m)]))}</select>`)}</div>
      <div class="col-12 col-sm-6">${field('inc_a', t('amount') + ' (৳)', '<input id="inc_a" type="number" min="1" class="form-control" placeholder="0">')}</div>
      <div class="col-12 col-sm-6">${field('inc_ref', t('pay_ref'), '<input id="inc_ref" class="form-control" placeholder="REF-XXXX / কাস্টমার">')}</div>
      <div class="col-12">${field('inc_title', t('title'), '<input id="inc_title" class="form-control" placeholder="যেমন: স্ক্র্যাপ পেপার বিক্রি / Scrap Sale">')}</div>
      <div class="col-12">${field('inc_n', t('description'), '<input id="inc_n" class="form-control" placeholder="বিবরণ...">')}</div>
    </div>`;

  modal(t('add_income') || 'নতুন আয় যোগ', body,
    () => {
      const a = +$('#inc_a').value;
      $('#inc_a').classList.remove('is-invalid');
      if (!(a > 0)) return !bad('inc_a', t('pos_qty'));

      const c = $('#inc_c').value;
      const title = $('#inc_title').value.trim() || (t('c_' + c) || 'Factory Income');
      const ref = $('#inc_ref').value.trim() || ('REF-' + Math.floor(1000 + Math.random() * 9000));
      const m = $('#inc_m').value;
      const n = $('#inc_n').value.trim() || title;
      const now = new Date();
      const dStr = now.toLocaleDateString(F.S.lang === 'bn' ? 'bn-BD' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const id = 'INC-2026-' + (++expSeq);
      const user = F.S.user ? (F.S.user.n[F.S.lang] || F.S.user.n.bn) : 'Admin';

      const record = {
        id,
        k: 'income',
        c,
        a,
        title,
        src: title,
        custRef: ref,
        refNo: ref,
        m,
        ts: now.getTime(),
        dtStr: dStr,
        d: [dStr, dStr],
        n: [n, n],
        by: user
      };

      D.exp.unshift(record);

      const cb = D.cashBank;
      if (m === 'm_cash') cb.cash += a;
      else cb.bank += a;

      if (typeof LOG !== 'undefined') {
        LOG.add({
          uid: F.S.user?.id,
          u: F.S.user?.n?.bn,
          r: F.S.role,
          m: 'income',
          t: 'save',
          recordType: 'income',
          recordId: id,
          msg: `আয় রেকর্ড: ${title} – ৳${a.toLocaleString()}`
        });
      }

      toast(t('txn_done') || 'সংরক্ষিত হয়েছে', 'check-circle');
      incomePage();
    }
  );
};

/* Add Expense Modal */
ACT.exadd = () => {
  const { t, D, toast } = F;
  const body = `
    <div class="row g-2 g-sm-3">
      <div class="col-12 col-sm-6">${field('exp_c', t('category'), `<select id="exp_c" class="form-select">${opts(['rent', 'transport', 'utility', 'salary', 'other'].map(k => [k, t('c_' + k)]))}</select>`)}</div>
      <div class="col-12 col-sm-6">${field('exp_m', t('method'), `<select id="exp_m" class="form-select">${opts(F.methods().map(m => [m, t(m)]))}</select>`)}</div>
      <div class="col-12 col-sm-6">${field('exp_a', t('amount') + ' (৳)', '<input id="exp_a" type="number" min="1" class="form-control" placeholder="0">')}</div>
      <div class="col-12 col-sm-6">${field('exp_ref', t('pay_ref'), '<input id="exp_ref" class="form-control" placeholder="REF-XXXX / সরবরাহকারী">')}</div>
      <div class="col-12">${field('exp_title', t('title'), '<input id="exp_title" class="form-control" placeholder="যেমন: গুদাম ভাড়া / অফিস খরচ">')}</div>
      <div class="col-12">${field('exp_n', t('description'), '<input id="exp_n" class="form-control" placeholder="বিবরণ...">')}</div>
    </div>`;

  modal(t('add_expense') || 'নতুন খরচ যোগ', body,
    () => {
      const a = +$('#exp_a').value;
      $('#exp_a').classList.remove('is-invalid');
      if (!(a > 0)) return !bad('exp_a', t('pos_qty'));

      const c = $('#exp_c').value;
      const title = $('#exp_title').value.trim() || (t('c_' + c) || 'Expense');
      const ref = $('#exp_ref').value.trim() || ('REF-' + Math.floor(1000 + Math.random() * 9000));
      const m = $('#exp_m').value;
      const n = $('#exp_n').value.trim() || title;
      const now = new Date();
      const dStr = now.toLocaleDateString(F.S.lang === 'bn' ? 'bn-BD' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const id = 'EXP-2026-' + (++expSeq);
      const user = F.S.user ? (F.S.user.n[F.S.lang] || F.S.user.n.bn) : 'Admin';

      const record = {
        id,
        k: 'expense',
        c,
        a,
        title,
        src: title,
        custRef: ref,
        refNo: ref,
        m,
        ts: now.getTime(),
        dtStr: dStr,
        d: [dStr, dStr],
        n: [n, n],
        by: user
      };

      D.exp.unshift(record);

      D.expenses += a;
      const cb = D.cashBank;
      if (m === 'm_cash') cb.cash = Math.max(0, cb.cash - a);
      else cb.bank = Math.max(0, cb.bank - a);

      if (typeof LOG !== 'undefined') {
        LOG.add({
          uid: F.S.user?.id,
          u: F.S.user?.n?.bn,
          r: F.S.role,
          m: 'expenses',
          t: 'save',
          recordType: 'expense',
          recordId: id,
          msg: `ব্যয় রেকর্ড: ${title} – ৳${a.toLocaleString()}`
        });
      }

      toast(t('txn_done') || 'সংরক্ষিত হয়েছে', 'check-circle');
      expenses();
    }
  );
};

/* Compatibility alias */
ACT.eadd = () => {
  if (location.hash === '#/income') ACT.inadd();
  else ACT.exadd();
};

/* ---------- HRM ---------- */
const HS={tab:null},ST={present:'paid',late:'partial',absent:'due',leave:'info'},net=e=>e.basic+e.ot+e.bonus-e.ded-e.adv;
function hrm(){
  const{t,L,lg,D,A,tk,panel,n}=F,list=A()?[['emp','tab_emp'],['att','tab_att'],['sal','tab_sal']]:[['att','tab_att']];if(!list.some(x=>x[0]===HS.tab))HS.tab=list[0][0];let body='';
  if(HS.tab==='emp')body=`<div class="p-3 border-bottom text-end"><button class="btn-a" data-act="hadd"><i class="bi bi-plus-lg"></i>${t('add_emp')}</button></div><div class="tw"><table class="tbl"><thead><tr><th>${t('nav_hrm')}</th><th>${t('desig')}</th><th>${t('dept')}</th><th>${t('phone')}</th><th></th></tr></thead><tbody>${D.emp.map((e,i)=>`<tr><td><b>${L(e.n)}</b></td><td>${lg(D.empDes[i])}</td><td>${t('d_'+e.dep)}</td><td class="text-secondary">${e.ph}</td><td class="r text-nowrap"><button class="icon-btn ib" data-act="hedit" data-i="${i}" aria-label="${t('edit')}"><i class="bi bi-pencil"></i></button> <button class="icon-btn ib" data-act="hdel" data-i="${i}" aria-label="${t('delete')}"><i class="bi bi-trash3"></i></button></td></tr>`).join('')}</tbody></table></div>`;
  if(HS.tab==='att'){const c=k=>D.att.filter(x=>x===k).length;body=`<div class="strip">${Object.keys(ST).map(k=>`<div><span>${t(k)}</span><b>${n(c(k))}</b></div>`).join('')}</div><div class="px-3 pt-3 text-secondary"><small>${t('att_hint')}</small></div><div class="tw"><table class="tbl"><tbody>${D.emp.map((e,i)=>`<tr><td><b>${L(e.n)}</b><br><small class="text-secondary">${lg(D.empDes[i])}</small></td><td class="r"><button class="st ${ST[D.att[i]]}" style="border:0;cursor:pointer" data-act="attc" data-i="${i}">${t(D.att[i])}</button></td></tr>`).join('')}</tbody></table></div>`}
  if(HS.tab==='sal'){body=`<div class="tw"><table class="tbl"><thead><tr><th>${t('nav_hrm')}</th><th class="r">${t('basic')}</th><th class="r">${t('ot')}</th><th class="r">${t('bonus')}</th><th class="r">${t('deduct')}</th><th class="r">${t('advance')}</th><th class="r">${t('netpay')}</th><th></th></tr></thead><tbody>${D.emp.map((e,i)=>`<tr><td><b>${L(e.n)}</b></td><td class="r">${tk(e.basic)}</td><td class="r">${tk(e.ot)}</td><td class="r">${tk(e.bonus)}</td><td class="r dn">${tk(e.ded)}</td><td class="r dn">${tk(e.adv)}</td><td class="r fw-bold">${tk(net(e))}</td><td class="r"><button class="btn-o py-1" data-act="slip" data-i="${i}"><i class="bi bi-file-earmark-text"></i>${t('payslip')}</button></td></tr>`).join('')}<tr class="fw-bold"><td>${t('tot')} · ${t('month')}</td><td colspan="5"></td><td class="r">${tk(sum(D.emp.map(net)))}</td><td></td></tr></tbody></table></div>`}
  $('#view').innerHTML=`<div class="enter">${head('nav_hrm','h_sub')}${tabs(HS.tab,list,'htab')}${panel('',body)}${A()?'':`<div class="lock mt-3"><i class="bi bi-lock"></i>${t('hidden')}</div>`}</div>`;
}
P.hrm=f=>{init(f);hrm()};ACT.htab=x=>{HS.tab=x.dataset.k;hrm()};
ACT.attc=x=>{const o=Object.keys(ST),a=F.D.att,i=+x.dataset.i;a[i]=o[(o.indexOf(a[i])+1)%o.length];hrm()};
ACT.slip=x=>{const{t,L,lg,D,tk,lrow}=F,e=D.emp[+x.dataset.i];modal(t('payslip')+' – '+t('month'),`<div class="fw-bold">${L(e.n)}</div><small class="text-secondary">${lg(D.empDes[+x.dataset.i])} · ${t('d_'+e.dep)}</small><div class="mt-2">${lrow(t('basic'),tk(e.basic))}${lrow('+ '+t('ot'),tk(e.ot))}${lrow('+ '+t('bonus'),tk(e.bonus))}${lrow('− '+t('deduct'),tk(e.ded),'dn')}${lrow('− '+t('advance'),tk(e.adv),'dn')}${lrow(t('netpay'),tk(net(e)),'up').replace('lrow','lrow tot')}</div>`)};
window.UI.init3=init;
})();
