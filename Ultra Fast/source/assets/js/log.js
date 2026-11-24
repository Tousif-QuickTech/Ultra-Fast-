/* Activity log store (demo). Persisted in localStorage so it survives sign-out/reload; the real system writes this server-side. */
const LOG=(()=>{
  const K='fms-logs-v1';
  let items=[];
  try{items=JSON.parse(localStorage.getItem(K))||[]}catch(e){}
  const save=()=>{try{localStorage.setItem(K,JSON.stringify(items))}catch(e){}};
  let seq = items.length ? Math.max(...items.map(x=>x.seq||0), items.length) : 100;
  if(!items.length){
    const n=Date.now(),H=36e5,s=(h,u,r,m,t,msg,rt='',ri='',rs='')=>({
      id:'ACT-'+(++seq),
      seq,
      ts:n-h*H,
      u,
      r,
      m,
      t,
      recordType:rt,
      recordId:ri,
      reason:rs,
      msg
    });
    items=[
      s(.3,'আসির আহমেদ তৌসিফ','admin','login','auth','সাইন ইন করেছেন','auth','AUTH-01'),
      s(1.2,'আসির আহমেদ তৌসিফ','admin','sales','save','ইনভয়েস INV-2026-1184 তৈরি হয়েছে','invoice','INV-2026-1184'),
      s(2,'তানভীর হোসেন','manager','customers','save','আদায় নথিভুক্ত – ৳৩,৫০,০০০ (নগদ)','payment','PAY-2026-001'),
      s(5,'আসির আহমেদ তৌসিফ','admin','purchase','save','শিপমেন্ট SH-0457 স্টকে গ্রহণ','shipment','SH-0457'),
      s(26,'তানভীর হোসেন','manager','products','save','স্টক সমন্বয় – ক্রাফট পেপার','stock','PK-101'),
      s(28,'আসির আহমেদ তৌসিফ','admin','settings','save','ম্যানেজার ভূমিকার অনুমতি আপডেট','role','manager'),
      s(50,'আসির আহমেদ তৌসিফ','admin','expenses','save','ব্যয় যোগ – পরিবহন ৳৩,১০,০০০','expense','EXP-2026-002'),
      s(52,'তানভীর হোসেন','manager','login','auth','সাইন ইন করেছেন','auth','AUTH-02')
    ];
    save();
  }
  return {
    items,
    add(o){
      const entry = {
        id: o.id || ('ACT-' + (++seq)),
        seq,
        ts: o.ts || Date.now(),
        uid: o.uid || (window.FMSAPP && window.FMSAPP.S && window.FMSAPP.S.user && window.FMSAPP.S.user.id) || 'admin',
        u: o.u || (window.FMSAPP && window.FMSAPP.S && window.FMSAPP.S.user && window.FMSAPP.S.user.n && (window.FMSAPP.S.user.n.bn || window.FMSAPP.S.user.n.en)) || 'System',
        r: o.r || (window.FMSAPP && window.FMSAPP.S && window.FMSAPP.S.role) || 'admin',
        m: o.m || 'system',
        t: o.t || 'save',
        recordType: o.recordType || o.rt || '',
        recordId: o.recordId || o.ri || '',
        reason: o.reason || '',
        changes: o.changes || null,
        msg: o.msg || ''
      };
      items.unshift(entry);
      if(items.length > 500) items.length = 500;
      save();
      return entry;
    }
  };
})();
