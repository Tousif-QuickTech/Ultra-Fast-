/* Phase 7: edit/delete (products, customers, suppliers), add employee, shipment documents */
(()=>{
const U=window.UI,{modal,field,bad,opts,$,ACT,IN}=U,F=()=>U.F();
const num=(id,lb,v='')=>field(id,lb,`<input id="${id}" type="number" min="0" class="form-control" value="${v}">`),txt=(id,lb,v='')=>field(id,lb,`<input id="${id}" class="form-control" value="${v}">`);
const clr=a=>a.forEach(i=>$('#'+i)&&$('#'+i).classList.remove('is-invalid'));
const del=(f,name,fn)=>{modal(f.t('del_title'),`<p class="mb-0">${f.t('confirm_del')}<br><b>${name}</b></p>`,()=>{fn();f.toast(f.t('del_ok'),'trash3');f.route(false)},f.t('delete'));$('#mok').classList.add('btn-del')};
const blocked=f=>f.toast(f.t('del_blocked'),'shield-exclamation');
const done=f=>{f.toast(f.t('upd_ok'),'check-circle');f.route(false)};
/* Products */
const readImgData = (file, cb) => {
  if (!file) return cb('');
  const r = new FileReader();
  r.onload = () => cb(r.result || '');
  r.readAsDataURL(file);
};
ACT.pedit=x=>{const f=F(),{t,L,D,S}=f,i=+x.dataset.i,p=D.products[i];if(!p)return;
 let imgData=p.img||'';
 const descVal=typeof p.desc==='object'?(p.desc[S.lang]||p.desc.en||p.desc.bn||''):(p.desc||'');
 const statVal=p.status==='inactive'?'inactive':'active';
 const imgBlock=`<div class="mb-2"><label class="form-label">${t('prod_img')||'Product Image'}</label><div class="d-flex align-items-center gap-3 flex-wrap"><div id="pimg_prev" class="border rounded d-flex align-items-center justify-content-center" style="width:64px;height:64px;overflow:hidden;background:var(--surface-2)">${imgData?`<img src="${imgData}" style="width:100%;height:100%;object-fit:cover">`:`<i class="bi bi-box-seam text-secondary fs-4"></i>`}</div><div class="d-flex gap-2 align-items-center flex-wrap"><label class="btn btn-sm btn-outline-primary mb-0" style="cursor:pointer"><i class="bi bi-upload me-1"></i>${t('upload_img')||t('upload')||'Upload'}<input id="pimg" type="file" accept="image/*" hidden></label><button type="button" id="pimg_rm" class="btn btn-sm btn-outline-danger ${imgData?'':'d-none'}"><i class="bi bi-x-lg me-1"></i>${t('remove_img')||'Remove'}</button></div></div></div>`;
 modal(t('edit')+' – '+L(p.n),txt('pn',t('pname'),L(p.n))+`<div class="row"><div class="col-6">${field('pc',t('category'),`<select id="pc" class="form-select">${opts(['paper','board','film','raw'].map(k=>[k,t('cat_'+k)]),p.cat)}</select>`)}</div><div class="col-6">${field('pstat',t('prod_status')||t('status'),`<select id="pstat" class="form-select">${opts([['active',t('status_active')||'Active'],['inactive',t('status_inactive')||'Inactive']],statVal)}</select>`)}</div></div>`+`<div class="row"><div class="col-4">${num('pm',t('min_stock'),p.min)}</div><div class="col-4">${num('pco',t('cost_price'),p.cost)}</div><div class="col-4">${num('ppr',t('sell_price'),p.price)}</div></div>`+field('pdesc',t('prod_desc')||'Description',`<textarea id="pdesc" class="form-control" rows="2">${descVal}</textarea>`)+imgBlock,()=>{
 clr(['pn','pco','ppr']);let e=0;const n=$('#pn').value.trim();if(!n)e=bad('pn',t('req'));if(!(+$('#pco').value>0))e=bad('pco',t('pos_qty'));if(!(+$('#ppr').value>0))e=bad('ppr',t('pos_qty'));if(e)return false;
 p.n[S.lang]=n;p.cat=$('#pc').value;p.status=$('#pstat').value;p.min=+$('#pm').value||0;p.cost=+$('#pco').value;p.price=+$('#ppr').value;p.desc=$('#pdesc').value.trim();p.img=imgData;
 if(typeof LOG!=='undefined')LOG.add({uid:S.user?.id,u:S.user?.n?.bn,r:S.role,m:'products',t:'edit',recordType:'product',recordId:p.sku||('PRD-'+i),msg:`পণ্য সম্পাদনা: ${n}`});
 if($('#view [data-act="pback"]')&&U.openProductDetail){f.toast(t('upd_ok'),'check-circle');U.openProductDetail(i)}else done(f)},t('save'));
 $('#pimg')?.addEventListener('change',ev=>readImgData(ev.target.files?.[0],d=>{imgData=d;$('#pimg_prev').innerHTML=d?`<img src="${d}" style="width:100%;height:100%;object-fit:cover">`:`<i class="bi bi-box-seam text-secondary fs-4"></i>`;$('#pimg_rm')?.classList.toggle('d-none',!d)}));
 $('#pimg_rm')?.addEventListener('click',()=>{imgData='';$('#pimg_prev').innerHTML=`<i class="bi bi-box-seam text-secondary fs-4"></i>`;$('#pimg_rm').classList.add('d-none')})};
ACT.pdel=x=>{const f=F(),{D,L}=f,i=+x.dataset.i;if(D.products.length<2||(D.invoices||[]).some(v=>v[6]&&v[6].some(l=>l.p>=i))||(D.shipments||[]).some(s=>s[2]>=i)||(D.purchases||[]).some(p=>p.prodIdx>=i))return blocked(f);del(f,L(D.products[i].n),()=>D.products.splice(i,1))};
/* Customers */
ACT.cedit=x=>{const f=F(),{t,L,D,S}=f,i=+x.dataset.i,c=D.customers[i];if(!c)return;
 modal(t('edit')+' – '+L(c),txt('cn',t('cust_name'),L(c))+txt('cph',t('phone'),c.phone||'')+txt('caddr',t('address')||'Address',c.address||c.addr||'')+num('cl',t('limit_amt'),c.limit),()=>{
 clr(['cn','cph','cl']);let e=0;if(!$('#cn').value.trim())e=bad('cn',t('req'));if(!/^[0-9+\- ]{10,16}$/.test($('#cph').value.trim()))e=bad('cph',t('bad_phone'));if(!(+$('#cl').value>0))e=bad('cl',t('pos_qty'));if(e)return false;
 c[S.lang]=$('#cn').value.trim();c.phone=$('#cph').value.trim();c.address=$('#caddr').value.trim();c.limit=+$('#cl').value;
 if(typeof LOG!=='undefined')LOG.add({uid:S.user?.id,u:S.user?.n?.bn,r:S.role,m:'customers',t:'edit',recordType:'customer',recordId:c.code||('CUST-'+(i+1)),msg:`কাস্টমার তথ্য হালনাগাদ: ${L(c)}`});
 if($('#view [data-cdetail-idx="'+i+'"]')&&U.openCustomerStatement){f.toast(t('upd_ok'),'check-circle');U.openCustomerStatement(i)}else done(f)},t('save'))};
ACT.cdel=x=>{const f=F(),{D,L}=f,i=+x.dataset.i,c=D.customers[i];if(c.due>0||D.invoices.some(v=>v[1]>=i))return blocked(f);del(f,L(c),()=>D.customers.splice(i,1))};
/* Suppliers */
ACT.sedit=x=>{const f=F(),{t,L,D,S}=f,i=+x.dataset.i,s=D.suppliers[i];if(!s)return;
 modal(t('edit')+' – '+L(s),txt('sn',t('supplier'),L(s))+txt('sph',t('phone'),s.phone)+txt('saddr',t('address')||'Address',s.address||s.addr||'')+`<div class="row"><div class="col-6">${field('sty',t('type'),`<select id="sty" class="form-select">${opts([['local',t('local')],['overseas',t('overseas')]],s.type)}</select>`)}</div><div class="col-6">${field('scu',t('currency'),`<select id="scu" class="form-select">${opts(['BDT','USD','RMB'].map(c=>[c,c]),s.cur)}</select>`)}</div></div>`,()=>{
 clr(['sn']);if(!$('#sn').value.trim())return !bad('sn',t('req'));s[S.lang]=$('#sn').value.trim();s.phone=$('#sph').value.trim()||'—';s.address=$('#saddr').value.trim();s.type=$('#sty').value;s.cur=$('#scu').value;
 if(typeof LOG!=='undefined')LOG.add({uid:S.user?.id,u:S.user?.n?.bn,r:S.role,m:'suppliers',t:'edit',recordType:'supplier',recordId:s.code||('SUP-'+(i+1)),msg:`সাপ্লায়ার তথ্য হালনাগাদ: ${L(s)}`});
 if($('#view [data-sdetail-idx="'+i+'"]')&&U.openSupplierStatement){f.toast(t('upd_ok'),'check-circle');U.openSupplierStatement(i)}else done(f)},t('save'))};
ACT.sdel=x=>{const f=F(),{D,L}=f,i=+x.dataset.i,s=D.suppliers[i];if(s.payable>0||(D.shipments||[]).some(h=>h[1]>=i)||(D.purchases||[]).some(p=>p.supIdx>=i))return blocked(f);del(f,L(s),()=>D.suppliers.splice(i,1))};
/* Employees */
ACT.hadd=()=>{const f=F(),{t,D}=f;modal(t('add_emp'),txt('hn',t('emp_name'))+txt('hd',t('desig_in'))+field('hp',t('dept'),`<select id="hp" class="form-select">${opts(['wh','ac','sl','tr','of'].map(k=>[k,t('d_'+k)]))}</select>`)+txt('hph',t('phone'))+num('hb',t('basic')+' (৳)'),()=>{
 clr(['hn','hd','hph','hb']);let e=0;if(!$('#hn').value.trim())e=bad('hn',t('req'));if(!$('#hd').value.trim())e=bad('hd',t('req'));if(!/^[0-9+\- ]{10,16}$/.test($('#hph').value.trim()))e=bad('hph',t('bad_phone'));if(!(+$('#hb').value>0))e=bad('hb',t('pos_qty'));if(e)return false;
 const n=$('#hn').value.trim(),d=$('#hd').value.trim();D.emp.push({n:{bn:n,en:n},dep:$('#hp').value,ph:$('#hph').value.trim(),basic:+$('#hb').value,ot:0,bonus:0,ded:0,adv:0});D.empDes.push([d,d]);D.att.push('present');f.toast(t('added_ok'),'check-circle');f.route(false)})};
ACT.hdel=x=>{const f=F(),{D,L}=f,i=+x.dataset.i;del(f,L(D.emp[i].n),()=>{D.emp.splice(i,1);D.empDes.splice(i,1);D.att.splice(i,1)})};
/* Shipment documents */
const DK=['lc','inv','pl','boe'],sz=b=>b>1048576?(b/1048576).toFixed(1)+' MB':Math.max(1,Math.round(b/1024))+' KB';
function docs(i){const f=F(),{t,D}=f,s=D.shipments[i];s.docs=s.docs||{};
 return `<small class="text-secondary d-block mb-2">${s[0]}</small>`+DK.map(k=>{const d=s.docs[k];return `<div class="d-flex align-items-center gap-2 py-2 border-bottom flex-wrap"><div style="flex:1;min-width:150px"><b>${t('doc_'+k)}</b><br><small class="${d?'up':'text-secondary'}">${d?`<i class="bi bi-paperclip"></i> ${d.name} · ${sz(d.size)}`:t('not_attached')}</small></div><label class="btn-o py-1 mb-0" style="cursor:pointer"><i class="bi bi-upload"></i>${t('upload')}<input type="file" hidden data-in="sdoc" data-k="${k}" data-i="${i}"></label></div>`}).join('')+`<div class="lock mt-3"><i class="bi bi-info-circle"></i>${t('doc_note')}</div>`}
ACT.sdocs=x=>{const f=F(),i=+x.dataset.i;modal(f.t('docs'),docs(i))};
IN.sdoc=x=>{const fl=x.files[0];if(!fl)return;const f=F(),s=f.D.shipments[+x.dataset.i];s.docs[x.dataset.k]={name:fl.name,size:fl.size};$('#mb').innerHTML=docs(+x.dataset.i);f.toast(f.t('attached'),'paperclip')};
})();
