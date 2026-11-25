(()=>{
const D=MOCK,H=document.documentElement,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const S={lang:localStorage.getItem('fms-lang')||'bn',theme:H.dataset.theme,role:'admin',range:'30d',unread:true};
const t=k=>I18N[S.lang][k]||k,L=o=>o[S.lang],loc=()=>S.lang==='bn'?'bn-BD':'en-IN',lg=(a)=>S.lang==='bn'?a[0]:a[1];
const n=(v,d=0)=>Number(v).toLocaleString(loc(),{maximumFractionDigits:d}),tk=v=>'৳'+n(v);
const short=v=>v<0?'−'+short(-v):v>=1e7?'৳'+n(v/1e7,2)+' '+t('cr'):v>=1e5?'৳'+n(v/1e5,2)+' '+t('lac'):tk(v);
const kg=v=>n(v)+' '+t('kg'),sum=a=>a.reduce((x,y)=>x+y,0),css=v=>getComputedStyle(H).getPropertyValue(v).trim(),RL=()=>D.roles.find(r=>r.id===S.role)||D.roles[0],A=()=>!!RL().seeCost,can=m=>RL().access[m]!==false,RN=id=>{const r=D.roles.find(x=>x.id===id);return r?L(r.n):id};
const cur=()=>{const m=location.hash.match(/#\/([\w\-]+)/);if(m&&(m[1]==='dashboard'||PAGES[m[1]]))return m[1];const p=location.pathname.replace(/^\/+|\/+$/g,'');return(p&&(p==='dashboard'||PAGES[p]))?p:'dashboard'};
const GROUPS=[['g_main',[['dashboard','speedometer2']]],['g_stock',[['products','boxes'],['purchase','cart-check'],['import','globe-americas'],['suppliers','building']]],['g_sales',[['sales','receipt'],['customers','people'],['dues','wallet-fill'],['bill-ledger','journal-bookmark']]],['g_fin',[['accounts','journal-text'],['income','graph-up-arrow'],['expenses','cash-stack'],['loans','bank']]],['g_people',[['hrm','person-badge']]],['g_sys',[['purchase-reports','file-earmark-spreadsheet'],['reports','bar-chart-line'],['data','arrow-down-up'],['logs','clock-history'],['settings','gear']]]],OPEN={};
const moveInd=()=>{const a=document.querySelector('#nav .nav-i.on'),i=document.querySelector('#nav .nav-ind');if(!a||!i)return;i.style.opacity=1;i.style.height=a.offsetHeight+'px';i.style.transform='translateY('+a.offsetTop+'px)'};
const NAV=[['dashboard','speedometer2'],['products','boxes'],['purchase','cart-check'],['import','globe-americas',1],['suppliers','building',1],['sales','receipt'],['customers','people'],['dues','wallet-fill'],['bill-ledger','journal-bookmark'],['accounts','journal-text',1],['income','graph-up-arrow',1],['expenses','cash-stack',1],['loans','bank',1],['hrm','person-badge'],['purchase-reports','file-earmark-spreadsheet',1],['reports','bar-chart-line'],['data','arrow-down-up',1],['settings','gear',1]];
const LT={'check-circle':'save','check2-circle':'save','person-check':'save','clipboard-check':'save','paperclip':'save','trash3':'delete','download':'export','file-earmark-pdf':'export','file-earmark-arrow-down':'export'};
function logToast(m,ic){const ty=LT[ic];if(!ty||!S.user||typeof LOG==='undefined')return;LOG.add({uid:S.user.id,u:S.user.n.bn,r:S.role,m:cur(),t:ty,msg:m})}
function toast(msg,ic='info-circle'){logToast(msg,ic);const e=document.createElement('div');e.className='toast align-items-center border-0';e.innerHTML=`<div class="d-flex"><div class="toast-body"><i class="bi bi-${ic} me-2"></i>${msg}</div><button class="btn-close me-2 m-auto" data-bs-dismiss="toast"></button></div>`;$('#toasts').append(e);const x=new bootstrap.Toast(e,{delay:2800});x.show();e.addEventListener('hidden.bs.toast',()=>e.remove())}
/* ---- Data derivations ---- */
const kpi=()=>({today:D.daily.sales.at(-1),month:sum(D.daily.sales),coll:D.daily.coll.at(-1),purch:sum(D.daily.purch),due:sum(D.customers.map(c=>c.due))});
function series(){const r=S.range;if(r==='12m')return{l:D.months.map(m=>new Date(m).toLocaleDateString(loc(),{month:'short'})),...{s:D.monthly.sales,p:D.monthly.purch,c:D.monthly.coll}};const k=r==='7d'?-7:-30;
return{l:D.days.slice(k).map(d=>new Date(d).toLocaleDateString(loc(),{day:'numeric',month:'short'})),s:D.daily.sales.slice(k),p:D.daily.purch.slice(k),c:D.daily.coll.slice(k)}}
/* ---- Fragments ---- */
const panel=(h,b,x='')=>`<section class="panel"><div class="panel-h"><h3>${h}</h3>${x}</div>${b}</section>`;
const lrow=(l,v,c='')=>`<div class="lrow"><span class="l">${l}</span><span class="ld"></span><span class="v ${c}">${v}</span></div>`;
const st=s=>`<span class="st ${s}">${t(s)}</span>`;
const col=['var(--accent)','var(--navy-chart)','var(--warn)','#8B7CF6'];
function strip(){const k=kpi(),c=A()?[['today_sales',k.today,6.4],['month_sales',k.month,11.2],['today_coll',k.coll,-3.1],['month_purch',k.purch,8.7]]:[['today_sales',k.today,6.4],['month_sales',k.month,11.2],['today_coll',k.coll,-3.1],['total_due',k.due,0]];
return `<div class="strip">${c.map(x=>`<div><span>${t(x[0])}</span><b data-cu="${x[1]}">${short(x[1])}</b>${x[2]?`<em class="${x[2]>0?'up':'dn'}"><i class="bi bi-caret-${x[2]>0?'up':'down'}-fill"></i> ${n(Math.abs(x[2]),1)}%</em>`:''}</div>`).join('')}</div>`}
function money(){const c=D.cashBank,r=kpi().due,rows=[['cash',c.cash,'var(--accent)'],['bank',c.bank,'var(--navy-chart)'],['receivable',r,'var(--ok)'],['payable',c.payable,'var(--danger)']],mx=Math.max(...rows.map(x=>x[1]));
return `<div class="panel-b">${rows.map(x=>`<div class="mb-2">${lrow(t(x[0]),short(x[1]))}<div class="bar"><i style="width:${x[1]/mx*100}%;background:${x[2]}"></i></div></div>`).join('')}${lrow(t('net_pos'),short(c.cash+c.bank+r-c.payable),'up').replace('lrow','lrow tot')}</div>`}
function ageing(){const b=D.ageing,tot=sum(b),cs=['var(--ok)','var(--accent)','var(--warn)','var(--danger)'];
return `<div class="panel-b"><div class="d-flex justify-content-between"><span class="text-secondary">${t('total_due')}</span><b class="fs-5">${short(tot)}</b></div><div class="stack">${b.map((v,i)=>`<i style="width:${v/tot*100}%;background:${cs[i]}"></i>`).join('')}</div>
${b.map((v,i)=>lrow(`<span style="width:9px;height:9px;border-radius:2px;background:${cs[i]}"></span>${t('b'+(i+1))}`,short(v))).join('')}
<div class="fw-bold mt-3 mb-1">${t('overdue_top')}</div>${[...D.customers].sort((a,b)=>b.days-a.days).slice(0,3).map(c=>`<div class="item"><div class="t"><span>${L(c)}</span><b class="dn">${short(c.due)}</b></div><small>${n(c.days)} ${t('days')}</small></div>`).join('')}</div>`}
function profit(){const k=kpi(),cg=Math.round(k.month*D.cogsRate),gp=k.month-cg,np=gp-D.expenses;
return `<div class="panel-b">${lrow(t('revenue'),short(k.month))}${lrow('− '+t('cogs'),short(cg),'dn')}${lrow('− '+t('expenses'),short(D.expenses),'dn')}${lrow(t('net_profit'),short(np),'up').replace('lrow','lrow tot')}
<div class="d-flex justify-content-between mt-2"><small class="text-secondary">${t('margin')}</small><b class="up">${n(np/k.month*100,1)}%</b></div><div class="bar mt-1"><i style="width:${np/k.month*100*3}%;background:var(--ok)"></i></div></div>`}
function stock(){const tk_=sum(D.products.map(p=>p.kg)),val=sum(D.products.map(p=>p.kg*p.cost));
return `<div class="panel-b pb-0"><div class="d-flex justify-content-between align-items-end"><div><small class="text-secondary">${t('total_stock')}</small><div class="fs-4 fw-bold">${kg(tk_)}</div></div>${A()?`<div class="text-end"><small class="text-secondary">${t('stock_value')}</small><div class="fs-5 fw-bold">${short(val)}</div></div>`:''}</div></div><div class="chartbox sm"><canvas id="c-stock"></canvas></div>`}
function low(){const l=D.products.filter(p=>p.kg<p.min).sort((a,b)=>a.kg/a.min-b.kg/b.min);
return `<div class="panel-b">${l.map(p=>{const r=p.kg/p.min,c=r<.5?'var(--danger)':'var(--warn)';return `<div class="item"><div class="t"><span>${L(p.n)}</span><b style="color:${c}">${kg(p.kg)}</b></div><div class="bar my-1"><i style="width:${r*100}%;background:${c}"></i></div><small>${t('min')}: ${kg(p.min)}</small></div>`}).join('')}</div>`}
function top(){const l=[...D.products].sort((a,b)=>b.sold-a.sold).slice(0,5),mx=l[0].sold;
return `<div class="panel-b">${l.map(p=>`<div class="item"><div class="t"><span>${L(p.n)}</span><b>${kg(p.sold)}</b></div><div class="bar mt-1"><i style="width:${p.sold/mx*100}%;background:var(--accent)"></i></div></div>`).join('')}</div>`}
function invoices(){return `<div class="tw"><table class="tbl"><thead><tr><th>${t('inv_no')}</th><th>${t('customer')}</th><th class="r">${t('amount')}</th>${A()?`<th class="r">${t('profit')}</th>`:''}<th>${t('status')}</th></tr></thead><tbody>${D.invoices.map(i=>`<tr><td class="fw-semibold">${i[0]}</td><td>${L(D.customers[i[1]])}</td><td class="r">${tk(i[2])}</td>${A()?`<td class="r up">${tk(i[5])}</td>`:''}<td>${st(i[4])}</td></tr>`).join('')}</tbody></table></div>`}
function colls(){return `<div class="panel-b">${D.coll.map(c=>`<div class="item"><div class="t"><span>${L(D.customers[c[0]])}</span><b class="up">${tk(c[1])}</b></div><small>${t(c[2])} · ${lg([c[3],c[4]])}</small></div>`).join('')}</div>`}
function acts(){return `<div class="panel-b"><div class="tl">${D.act.filter(a=>A()||!a[1]).map(a=>`<div><i class="bi ${a[0]}"></i>${lg([a[2],a[3]])}<br><small>${lg([a[4],a[5]])}</small></div>`).join('')}</div></div>`}
function topc(){return `<div class="panel-b">${D.customers.map(c=>`<div class="item"><div class="t"><span>${L(c)}</span><b>${short(c.v)}</b></div></div>`).join('')}</div>`}
function quick(){return `<div class="panel-b"><div class="qa">${[['qa_inv','receipt-cutoff','sales'],['qa_coll','cash-coin','customers'],['qa_att','person-check',''],['qa_stock','boxes','products']].map(q=>`<button ${q[2]?'data-go="'+q[2]+'"'+(q[2]==='sales'?' data-new="1"':''):'data-soon'}><i class="bi bi-${q[1]}"></i>${t(q[0])}</button>`).join('')}</div><div class="lock mt-3"><i class="bi bi-lock"></i>${t('hidden')}</div></div>`}
/* ---- Dashboard ---- */
function dashboard(){const u=S.user,ad=A();
const seg=`<div class="seg" role="group">${['7d','30d','12m'].map(r=>`<button data-range="${r}" class="${S.range===r?'on':''}">${t('r'+r.replace('d','').replace('m',''))}</button>`).join('')}</div>`;
$('#view').innerHTML=`<div class="enter"><div class="page-h"><div><h2>${t('welcome')}, ${L(u.n)}</h2><p>${t(ad?'overview_a':'overview_m')}</p></div><div class="d-flex gap-2 flex-wrap">${seg}<button class="btn-o" data-demo><i class="bi bi-download"></i>${t('export')}</button><button class="btn-a" data-go="sales" data-new="1"><i class="bi bi-plus-lg"></i>${t('new_invoice')}</button></div></div>
<div class="row g-3"><div class="col-xl-8">${panel(t(ad?'c_sp':'c_sc'),strip()+'<div class="chartbox"><canvas id="c-main"></canvas></div>','<span class="tag">'+t('demo_data')+'</span>')}</div>
<div class="col-xl-4">${panel(t(ad?'money_pos':'dues'),ad?money():ageing())}</div>
${ad?`<div class="col-lg-4">${panel(t('profit_sum'),profit())}</div>`:`<div class="col-lg-4">${panel(t('recent_coll'),colls())}</div>`}
<div class="col-lg-4">${panel(t('stock_ov'),stock())}</div><div class="col-lg-4">${panel(t('low_stock'),low(),'<span class="st due">'+D.products.filter(p=>p.kg<p.min).length+'</span>')}</div>
<div class="col-lg-4">${panel(t('top_products'),top())}</div><div class="col-lg-8">${panel(t('recent_inv'),invoices())}</div>
<div class="col-lg-6">${panel(t('activity'),acts())}</div><div class="col-lg-6">${ad?panel(t('top_cust'),topc()):panel(t('quick'),quick())}</div></div></div>`;charts()}
/* ---- Charts (theme/lang aware) ---- */
const CH={};const PEND=new Map(),IO=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){IO.unobserve(en.target);const f=PEND.get(en.target);f&&f()}}),{rootMargin:'160px'});
function mk(id,c){CH[id]?.destroy();const e=$('#'+id);if(!e)return;PEND.set(e,()=>{CH[id]=new Chart(e,c)});IO.observe(e)}
function charts(noAnim=false){Chart.defaults.font.family=getComputedStyle(document.body).fontFamily;Chart.defaults.color=css('--muted');Chart.defaults.animation.duration=noAnim?0:850;Chart.defaults.animation.easing='easeOutQuart';const a=css('--accent'),nv=css('--navy-chart'),gr=css('--border'),s=series();
const bar=(l,d,c)=>({type:'bar',label:l,data:d,backgroundColor:c,borderRadius:4,barPercentage:.62,order:2}),line=(l,d,c)=>({type:'line',label:l,data:d,borderColor:c,backgroundColor:cx=>{const ch=cx.chart,ca=ch.chartArea;if(!ca)return c+'22';const g=ch.ctx.createLinearGradient(0,ca.top,0,ca.bottom);g.addColorStop(0,c+'66');g.addColorStop(1,c+'00');return g},fill:true,tension:.35,pointRadius:0,pointHoverRadius:5,borderWidth:2.5,order:1});
mk('c-main',{data:{labels:s.l,datasets:A()?[bar(t('purchases'),s.p,nv),line(t('sales'),s.s,a)]:[bar(t('sales'),s.s,nv),line(t('collections'),s.c,a)]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'bottom',labels:{usePointStyle:true,boxWidth:8}},tooltip:{backgroundColor:css('--navy'),callbacks:{label:c=>' '+c.dataset.label+': '+short(c.parsed.y)}}},scales:{x:{grid:{display:false},ticks:{maxTicksLimit:8}},y:{grid:{color:gr},border:{display:false},ticks:{callback:v=>short(v),maxTicksLimit:5}}}}});
const cats={};D.products.forEach(p=>cats[p.cat]=(cats[p.cat]||0)+p.kg);
mk('c-stock',{type:'doughnut',data:{labels:Object.keys(cats).map(k=>t('cat_'+k)),datasets:[{data:Object.values(cats),backgroundColor:[a,nv,css('--warn'),'#8B7CF6'],borderColor:css('--surface'),borderWidth:3}]},options:{responsive:true,maintainAspectRatio:false,cutout:'66%',plugins:{legend:{position:'right',labels:{usePointStyle:true,boxWidth:8}},tooltip:{callbacks:{label:c=>' '+c.label+': '+kg(c.parsed)}}}}})}
/* ---- Shell ---- */
function shell(){H.lang=S.lang;document.title=t('brand');
$$('[data-i18n]').forEach(e=>e.textContent=t(e.dataset.i18n));$$('[data-i18n-ph]').forEach(e=>e.placeholder=t(e.dataset.i18nPh));
$('#nav').innerHTML='<i class="nav-ind"></i>'+GROUPS.map(([g,items])=>{const it=items.filter(x=>can(x[0]));return it.length?`<div class="ng ${OPEN[g]===false?'':'open'}"><button class="ng-h" data-gt="${g}" aria-label="${t(g)}"><span>${t(g)}</span><i class="bi bi-chevron-down"></i></button><div class="ng-b"><div>${it.map(x=>`<a class="nav-i ${x[0]===cur()?'on':''}" data-nav="${x[0]}" title="${t('nav_'+x[0])}"><i class="bi bi-${x[1]}"></i><span>${t('nav_'+x[0])}</span></a>`).join('')}</div></div></div>`:''}).join('');requestAnimationFrame(moveInd);
$('.side-foot').innerHTML=`<span class="sf-av">${L(S.user.n).trim()[0]}</span><span class="sf-n brand-t"><b>${L(S.user.n)}</b><small>${RN(S.role)}</small></span><button class="sf-out" data-signout aria-label="${t('signout')}" title="${t('signout')}"><i class="bi bi-box-arrow-right"></i></button>`;
const BNAV_ICONS = {
  dashboard: '<svg class="bn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="8" rx="2.5"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2.5"/><rect x="3" y="15" width="7" height="6" rx="2"/></svg>',
  sales: '<svg class="bn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><circle cx="10" cy="9" r="1" fill="currentColor"/></svg>',
  customers: '<svg class="bn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  products: '<svg class="bn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
  more: '<svg class="bn-svg bn-svg-grid" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="5" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="12" cy="19" r="2"/><circle cx="19" cy="19" r="2"/></svg>'
};
$('#bnav').innerHTML=[['dashboard','bn_dash'],['sales','bn_sales'],['customers','bn_cust'],['products','bn_stock']].filter(x=>can(x[0])).map(x=>`<a class="bn-i ${x[0]===cur()?'on':''}" data-nav="${x[0]}">${BNAV_ICONS[x[0]]}<span>${t(x[1])}</span></a>`).join('')+`<button type="button" class="bn-i ${!['dashboard','sales','customers','products'].includes(cur())?'on':''}" id="bmore">${BNAV_ICONS.more}<span>${t('bn_more')}</span></button>`;
const u=S.user;$('#ptitle').innerHTML=`${t('nav_'+cur())}<span class="rolechip">${RN(S.role)}</span>`;$('#uname').textContent=L(u.n);$('#urole').textContent=RN(S.role);$('#av').textContent=L(u.n).trim()[S.lang==='bn'&&L(u.n).startsWith('মো')?3:0];
const ll=$('#langl');if(ll)ll.textContent=t('lang_btn');const themeBtn=$('#theme');if(themeBtn&&!themeBtn.querySelector('.lumen-icon')){themeBtn.innerHTML='<div class="lumen-icon"><span class="sun"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg></span><span class="moon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></span></div>'}
$('#crumbp').textContent=t('nav_'+cur());
$('#nlist').innerHTML=`<div class="hd">${t('notif')}<a data-read>${t('markread')}</a></div>`+(S.unread?D.notifs.map(x=>`<div class="di"><i class="bi ${x[0]} text-${x[1]==='ok'?'success':x[1]==='warn'?'warning':'danger'}"></i><div>${lg([x[2],x[3]])}<small>${lg([x[4],x[5]])}</small></div></div>`).join(''):`<div class="di text-secondary">${t('nonotif')}</div>`);$('#ndot').style.display=S.unread?'':'none';
$('#umenu').innerHTML=(S.user.r==='admin'?`<div class="hd">${t('preview_as')}</div>`+D.roles.map(r=>`<div class="di" data-role="${r.id}"><i class="bi bi-${S.role===r.id?'check-circle-fill text-success':'circle'}"></i><div>${L(r.n)}</div></div>`).join('')+`<div class="di text-secondary"><small>${t('preview_note')}</small></div><hr class="my-1">`:'')+`<div class="di" data-signout><i class="bi bi-box-arrow-right"></i><div>${t('signout')}</div></div>`}
const F={S,t,L,lg,n,tk,short,kg,A,D,toast,panel,st,lrow,can,RN,sum:a=>a.reduce((x,y)=>x+y,0),methods:()=>RL().cashOnly?['m_cash']:['m_cash','m_adminrecv','m_bank','m_bkash','m_cheque']};
let RT=0,FT;const SKEL='<div class="sk-wrap"><div class="sk" style="width:260px;height:30px"></div><div class="sk" style="width:380px;max-width:90%;height:14px;margin:10px 0 22px"></div><div class="row g-3"><div class="col-xl-8"><div class="sk" style="height:380px"></div></div><div class="col-xl-4"><div class="sk" style="height:380px"></div></div><div class="col-lg-4"><div class="sk" style="height:220px"></div></div><div class="col-lg-4"><div class="sk" style="height:220px"></div></div><div class="col-lg-4"><div class="sk" style="height:220px"></div></div></div></div>';
const RM=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function countUp(el){const v=+el.dataset.cu;if(!v||RM())return;const t0=performance.now(),f=now=>{const p=Math.min(1,(now-t0)/700);el.textContent=short(v*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(f)};requestAnimationFrame(f)}
const render=(c,fresh)=>{if(!can(c)){$('#view').innerHTML=`<div class="lock enter"><i class="bi bi-lock"></i>${t('no_access')}</div>`;return}c==='dashboard'?dashboard():PAGES[c](F);if(fresh){const v=$('#view');$$('#view .row>*').forEach((e,i)=>e.style.setProperty('--i',Math.min(i,10)));$$('#view tbody tr').forEach((e,i)=>e.style.setProperty('--r',Math.min(i,14)));v.classList.add('fresh');clearTimeout(FT);FT=setTimeout(()=>v.classList.remove('fresh'),900)}$$('[data-cu]').forEach(countUp);cardify()};
const route=(skel)=>{const c=cur(),id=++RT;const pb=$('#pbar');if(pb){pb.classList.remove('run');void pb.offsetWidth;pb.classList.add('run')}$$('[data-nav]').forEach(e=>e.classList.toggle('on',e.dataset.nav===c));const bm=$('#bmore');if(bm)bm.classList.toggle('on',!['dashboard','sales','customers','products'].includes(c));moveInd();const cp=$('#crumbp');if(cp)cp.textContent=t('nav_'+c);const pt=$('#ptitle');if(pt){if(pt.firstChild)pt.firstChild.textContent=t('nav_'+c);else pt.innerHTML=t('nav_'+c)+'<span class="rolechip">'+RN(S.role)+'</span>'}if(skel!==false&&!RM()){$('#view').classList.remove('fresh');$('#view').innerHTML=SKEL;scrollTo(0,0);setTimeout(()=>id===RT&&render(c,true),240)}else render(c,false)};
const all=(s)=>{shell();route(s)};F.route=route;F.all=all;window.FMSAPP=F;addEventListener('hashchange',()=>route());
document.addEventListener('click',e=>{const g=s=>e.target.closest(s);let x;
if(x=g('[data-range]')){S.range=x.dataset.range;dashboard()}
else if(x=g('[data-gt]')){const e=x.closest('.ng');e.classList.toggle('open');OPEN[x.dataset.gt]=e.classList.contains('open');setTimeout(moveInd,330)}
else if(x=g('[data-go]')){window.WANT_NEW=x.hasAttribute('data-new');if(x.dataset.rep)window.WANT_REP=x.dataset.rep;const nh='#/'+x.dataset.go;if(location.hash===nh)route();else location.hash=nh}
else if(x=g('[data-nav]')){if(x.dataset.nav==='dashboard'||PAGES[x.dataset.nav]){location.hash='#/'+x.dataset.nav;$('#app').classList.remove('open')}else toast(t('soon'),'hourglass-split')}
else if(g('[data-soon]'))toast(t('soon'),'hourglass-split');
else if(g('[data-demo]'))toast(t('demo_only'),'file-earmark-arrow-down');
else if(g('[data-signout]')){LOG.add({uid:S.user.id,u:S.user.n.bn,r:S.role,m:'login',t:'auth',msg:t('log_out')});AUTH.logout();location.hash='';location.reload()}
else if(x=g('[data-role]')){S.role=x.dataset.role;all(false)}
else if(g('[data-read]')){S.unread=false;shell()}
else if(g('#lang')){S.lang=S.lang==='bn'?'en':'bn';localStorage.setItem('fms-lang',S.lang);all(false)}
else if(g('#theme')){
const btn=g('#theme');
const rect=btn.getBoundingClientRect();
const cx=Math.round(rect.left+rect.width/2);
const cy=Math.round(rect.top+rect.height/2);
const newTheme=S.theme==='dark'?'light':'dark';
btn.classList.add('lumen-active');
setTimeout(()=>btn.classList.remove('lumen-active'),500);

const applyTheme=()=>{
  S.theme=newTheme;
  H.dataset.theme=H.dataset.bsTheme=S.theme;
  localStorage.setItem('fms-theme',S.theme);
  charts(true);
};

if(document.startViewTransition&&!RM()){
  const right=window.innerWidth-cx;
  const bottom=window.innerHeight-cy;
  const rad=Math.ceil(Math.hypot(Math.max(cx,right),Math.max(cy,bottom))*1.05);

  H.classList.add('theme-transitioning');
  const tr=document.startViewTransition(()=>{
    applyTheme();
  });

  tr.ready.then(()=>{
    const anim=document.documentElement.animate({
      clipPath:[
        `circle(0px at ${cx}px ${cy}px)`,
        `circle(${rad}px at ${cx}px ${cy}px)`
      ]
    },{
      duration:440,
      easing:'cubic-bezier(0.16, 1, 0.3, 1)',
      pseudoElement:'::view-transition-new(root)'
    });
    anim.finished.finally(()=>{
      H.classList.remove('theme-transitioning');
    });
  }).catch(()=>{
    H.classList.remove('theme-transitioning');
  });

  tr.finished.finally(()=>{
    H.classList.remove('theme-transitioning');
  });
}else{
  let ov=document.getElementById('themeRippleOverlay');
  if(!ov){
    ov=document.createElement('div');
    ov.id='themeRippleOverlay';
    ov.className='theme-ripple-overlay';
    document.body.appendChild(ov);
  }
  const right=window.innerWidth-cx,bottom=window.innerHeight-cy;
  const rad=Math.ceil(Math.hypot(Math.max(cx,right),Math.max(cy,bottom))*1.05);
  ov.style.setProperty('--cx',cx+'px');
  ov.style.setProperty('--cy',cy+'px');
  ov.style.setProperty('--radius',rad+'px');
  ov.style.backgroundColor=newTheme==='dark'?'#0A111E':'#F3F5F9';
  ov.classList.remove('active');
  void ov.offsetWidth;
  ov.classList.add('active');
  setTimeout(()=>{
    applyTheme();
    setTimeout(()=>{ov.classList.remove('active')},160);
  },220);
}
}
else if(g('#bmore'))$('#app').classList.add('open');else if(g('#burger'))$('#app').classList.add('open');else if(g('#scrim'))$('#app').classList.remove('open');
else if(g('#collapse')){$('#app').classList.toggle('collapsed');setTimeout(moveInd,330)}});
let AT;const a11y=()=>{$$('button,a[data-nav]').forEach(b=>{if(!b.textContent.trim()&&!b.getAttribute('aria-label'))b.setAttribute('aria-label',b.title||b.dataset.act||'button')});$$('input,select,textarea').forEach(i=>{if(i.type==='hidden'||i.getAttribute('aria-label')||(i.labels&&i.labels.length))return;const l=i.closest('div')&&i.closest('div').querySelector('label,small');const txt=(l&&l.textContent.trim())||i.placeholder||i.dataset.in;if(txt)i.setAttribute('aria-label',txt)})};
const cardify=()=>$$('table.tbl:not(.stmt-t)').forEach(t=>{const h=[...t.querySelectorAll('thead th')].map(x=>x.textContent.trim());t.classList.add('rc');t.querySelectorAll('tbody tr').forEach(r=>[...r.children].forEach((c,i)=>{if(c.getAttribute('data-label')!==(h[i]||''))c.setAttribute('data-label',h[i]||'')}))});
new MutationObserver(()=>{clearTimeout(AT);AT=setTimeout(()=>{a11y();cardify()},60)}).observe(document.body,{childList:true,subtree:true});
window.FMS_START=()=>{const p=location.pathname.replace(/^\/+|\/+$/g,'');if(!location.hash&&p&&PAGES[p]){location.hash='#/'+p}S.lang=localStorage.getItem('fms-lang')||'bn';S.theme=H.dataset.theme;S.user=AUTH.current();S.role=S.user.r;all()};
AUTH.boot(window.FMS_START);
})();
