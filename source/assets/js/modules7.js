/* Phase 8: employee edit, purchase returns */
(()=>{
const U=window.UI,{modal,field,bad,opts,$,ACT}=U,F=()=>U.F();
const num=(id,lb,v='')=>field(id,lb,`<input id="${id}" type="number" min="0" class="form-control" value="${v}">`),txt=(id,lb,v='')=>field(id,lb,`<input id="${id}" class="form-control" value="${v}">`);
const clr=a=>a.forEach(i=>$('#'+i)&&$('#'+i).classList.remove('is-invalid'));
ACT.hedit=x=>{const f=F(),{t,L,lg,D,S}=f,i=+x.dataset.i,e=D.emp[i];
 modal(t('edit')+' – '+L(e.n),txt('hn',t('emp_name'),L(e.n))+txt('hd',t('desig_in'),lg(D.empDes[i]))+field('hp',t('dept'),`<select id="hp" class="form-select">${opts(['wh','ac','sl','tr','of'].map(k=>[k,t('d_'+k)]),e.dep)}</select>`)+txt('hph',t('phone'),e.ph)+num('hb',t('basic')+' (৳)',e.basic),()=>{
 clr(['hn','hd','hph','hb']);let b=0;if(!$('#hn').value.trim())b=bad('hn',t('req'));if(!$('#hd').value.trim())b=bad('hd',t('req'));if(!/^[0-9+\- ]{10,16}$/.test($('#hph').value.trim()))b=bad('hph',t('bad_phone'));if(!(+$('#hb').value>0))b=bad('hb',t('pos_qty'));if(b)return false;
 e.n[S.lang]=$('#hn').value.trim();D.empDes[i][S.lang==='bn'?0:1]=$('#hd').value.trim();e.dep=$('#hp').value;e.ph=$('#hph').value.trim();e.basic=+$('#hb').value;f.toast(t('upd_ok'),'check-circle');f.route(false)},t('save'))};
U.retPanel=()=>{const{t,L,D,tk,kg,panel}=F(),R=D.returns||[];
 return panel(t('pret_title'),R.length?`<div class="tw"><table class="tbl"><thead><tr><th>${t('ship')}</th><th>${t('product')}</th><th class="r">${t('qty_kg')}</th><th class="r">${t('amount')}</th><th>${t('reason')}</th></tr></thead><tbody>${R.map(r=>`<tr><td>${r.ref}</td><td>${L(D.products[r.p].n)}</td><td class="r">${kg(r.q)}</td><td class="r">${tk(r.amt)}</td><td>${r.why}</td></tr>`).join('')}</tbody></table></div>`:`<div class="panel-b text-secondary text-center py-4"><i class="bi bi-inbox fs-3 d-block"></i>${t('empty')}</div>`)};
ACT.pret=x=>{const f=F(),{t,L,D,tk,kg}=f,i=+x.dataset.i,s=D.shipments[i],p=D.products[s[2]],sp=D.suppliers[s[1]],mx=Math.min(s[3],p.kg);
 modal(t('pret')+' – '+s[0],`<div class="lrow"><span class="l">${t('stock')}</span><span class="ld"></span><span class="v">${kg(p.kg)}</span></div>`+num('rq',t('qty_kg')+' (≤ '+f.n(mx)+')')+txt('rw',t('reason')),()=>{
 clr(['rq','rw']);const q=+$('#rq').value;let e=0;if(!(q>0))e=bad('rq',t('pos_qty'));else if(q>mx)e=bad('rq',t('exceed'));if(!$('#rw').value.trim())e=bad('rw',t('req'));if(e)return false;
 const amt=Math.round(q*p.cost);p.kg-=q;sp.payable=Math.max(0,sp.payable-amt);D.cashBank.payable=Math.max(0,D.cashBank.payable-amt);sp.tx.push(['r',amt,['আজ','Today']]);
 (D.returns=D.returns||[]).unshift({ref:s[0],p:s[2],q,amt,why:$('#rw').value.trim()});f.toast(t('ret_done'),'check-circle');f.route(false)},t('pret'))};
})();
