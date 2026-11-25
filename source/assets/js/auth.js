/* Mock authentication + roles (frontend demo only). Real auth must be implemented in Laravel. */
const AUTH=(()=>{
const KEY='fms-auth-v1',MODS=['dashboard','products','purchase','import','suppliers','sales','customers','dues','bill-ledger','accounts','income','expenses','loans','hrm','purchase-reports','reports','data','logs','settings'],$=s=>document.querySelector(s);
const mk=v=>Object.fromEntries(MODS.map(m=>[m,v]));
const def=()=>({roles:[{id:'admin',n:{bn:'অ্যাডমিন',en:'Admin'},sys:true,seeCost:true,editDel:true,access:mk(true),cashOnly:false},{id:'manager',n:{bn:'ম্যানেজার',en:'Manager'},sys:true,seeCost:false,editDel:false,access:{...mk(true),suppliers:false,accounts:false,income:false,expenses:false,loans:false,'purchase-reports':false,data:false,logs:false,settings:false},cashOnly:true}],v:5,users:[{id:'u1',n:{bn:'আসির আহমেদ তৌসিফ',en:'Asir Ahmed Tousif'},em:'tousif@ultrafast.demo',r:'admin',pw:'123456',pin:'1234',on:true},{id:'u2',n:{bn:'তানভীর হোসেন',en:'Tanvir Hossain'},em:'manager@ultrafast.demo',r:'manager',pw:'123456',pin:'1234',on:true}]});
let data=null;try{data=JSON.parse(localStorage.getItem(KEY))}catch(e){}if(!data||!data.roles||!data.users)data=def();if(!data.v){data.roles.forEach(r=>{if(r.access.loans===undefined)r.access.loans=r.id==='admin';if(r.cashOnly===undefined)r.cashOnly=r.id==='manager'});data.v=2}if(data.v<3){data.roles.forEach(r=>{if(r.access.logs===undefined)r.access.logs=r.id==='admin'});data.v=3}
if(data.v<4){data.roles.forEach(r=>{if(r.access.import===undefined)r.access.import=(r.access.purchase!==false);if(r.access.income===undefined)r.access.income=(r.access.expenses!==false)});data.v=4}
if(data.v<5){data.roles.forEach(r=>{if(r.access.dues===undefined)r.access.dues=(r.access.customers!==false);if(r.access['purchase-reports']===undefined)r.access['purchase-reports']=(r.id==='admin');if(r.editDel===undefined)r.editDel=(r.id==='admin')});data.v=5;try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){}}
data.roles.forEach(r=>{if(r.access.import===undefined)r.access.import=(r.access.purchase!==false);if(r.access.income===undefined)r.access.income=(r.access.expenses!==false);if(r.access.dues===undefined)r.access.dues=(r.access.customers!==false);if(r.access['purchase-reports']===undefined)r.access['purchase-reports']=(r.id==='admin');if(r.editDel===undefined)r.editDel=(r.id==='admin')});
if(data.users){data.users.forEach(u=>{if(!u.pin)u.pin='1234'})}
MOCK.roles=data.roles;
const lang=()=>localStorage.getItem('fms-lang')||'bn',T=k=>(I18N[lang()]||I18N.bn)[k]||k,nm=r=>r.n[lang()]||r.n.bn,sid=()=>sessionStorage.getItem('fms-session')||localStorage.getItem('fms-session');
let sel={step:'pin',uid:'u1',email:'',show:false,rem:false},CB=null;
let currentPin='',isVerifying=false;
const ico=r=>r.id==='admin'?'shield-check':r.id==='manager'?'person-gear':'person-badge';

function updatePinBoxes(){
  const row=$('#glassCodeRow');
  const boxes=document.querySelectorAll('.glass-code-box');
  if(!boxes.length)return;
  boxes.forEach((box,i)=>{
    const charEl=box.querySelector('.glass-code-char');
    const curEl=box.querySelector('.glass-code-cursor');
    if(i<currentPin.length){
      box.classList.add('is-filled');
      box.classList.remove('is-focused');
      if(charEl){charEl.textContent=currentPin[i];charEl.className='glass-code-char pop'}
      if(curEl)curEl.remove();
    }else if(i===currentPin.length){
      box.classList.remove('is-filled');
      box.classList.add('is-focused');
      if(charEl)charEl.textContent='';
      if(!box.querySelector('.glass-code-cursor')){
        const c=document.createElement('span');
        c.className='glass-code-cursor';
        box.appendChild(c);
      }
    }else{
      box.classList.remove('is-filled','is-focused');
      if(charEl)charEl.textContent='';
      if(curEl)curEl.remove();
    }
  });
  if(currentPin.length===4&&!isVerifying){
    onPinComplete(currentPin);
  }
}

function onPinComplete(pin){
  isVerifying=true;
  const row=$('#glassCodeRow');
  const msg=$('#pinMsg');
  const t=T;
  const u=data.users.find(x=>x.id===sel.uid)||data.users[0];

  // 1. Trigger the folding animation: the 4 boxes slide into center & merge into square tile
  if(row){
    row.classList.add('is-folding');
    row.classList.add('is-folded');
  }
  if(msg){
    msg.textContent=(lang()==='bn'?'যাচাই করা হচ্ছে...':'Verifying access...');
    msg.className='glass-code-msg';
  }

  // 2. Complete the fold and verify PIN
  setTimeout(()=>{
    const isValid=(pin==='1234')||(u&&(pin===u.pin||pin===u.pw||pin===u.pw?.slice(0,4)));
    if(isValid){
      // SUCCESS: The tile glows emerald and checkmark animates
      if(row)row.classList.add('is-success');
      if(msg){
        msg.textContent=t('lg_pin_granted');
        msg.className='glass-code-msg is-success';
      }
      sel.rem=$('#lgRem')?$('#lgRem').checked:sel.rem;
      (sel.rem?localStorage:sessionStorage).setItem('fms-session',u.id);
      if(typeof LOG!=='undefined'){
        LOG.add({uid:u.id,u:u.n.bn,r:u.r,m:'login',t:'auth',msg:t('log_in')});
      }

      // Smooth workspace dissolve transition
      setTimeout(()=>{
        const l=$('#login');
        if(l){
          l.style.opacity='0';
          l.style.transform='scale(1.03)';
          l.style.filter='blur(6px)';
          l.style.transition='opacity .45s ease, transform .45s ease, filter .45s ease';
          setTimeout(()=>{
            l.innerHTML='';
            l.className='';
            l.removeAttribute('style');
            document.body.classList.remove('auth');
            if(CB)CB();
          },450);
        }
      },550);
    }else{
      // ERROR: Wrong PIN - tile shakes with crimson glow, then unfolds back into 4 boxes
      if(row)row.classList.add('is-error');
      if(msg){
        msg.textContent=t('lg_pin_wrong');
        msg.className='glass-code-msg is-error';
      }
      setTimeout(()=>{
        if(row)row.classList.remove('is-folding','is-folded','is-error');
        currentPin='';
        isVerifying=false;
        const hiddenInp=$('#hiddenPinInput');
        if(hiddenInp){
          hiddenInp.value='';
          hiddenInp.focus();
        }
        updatePinBoxes();
      },650);
    }
  },360);
}

function fillDemoPin(){
  if(isVerifying)return;
  currentPin='';
  const digits=['1','2','3','4'];
  digits.forEach((d,i)=>{
    setTimeout(()=>{
      if(isVerifying&&i>0)return;
      currentPin+=d;
      const hiddenInp=$('#hiddenPinInput');
      if(hiddenInp)hiddenInp.value=currentPin;
      updatePinBoxes();
    },(i+1)*75);
  });
}

function attachPinEvents(){
  const hiddenInp=$('#hiddenPinInput');
  const codeWrap=$('#glassCodeWrapper');
  const card=$('#lgCard');
  if(hiddenInp){
    setTimeout(()=>{ try{ hiddenInp.focus(); }catch(_){} }, 80);
    hiddenInp.addEventListener('input',()=>{
      if(isVerifying)return;
      currentPin=hiddenInp.value.replace(/\D/g,'').slice(0,4);
      updatePinBoxes();
    });
  }
  if(codeWrap){
    codeWrap.addEventListener('click',()=>{
      if(hiddenInp)hiddenInp.focus();
    });
  }
  if(card){
    card.addEventListener('click',(e)=>{
      if(!e.target.closest('button') && !e.target.closest('a') && !e.target.closest('input') && !e.target.closest('label')){
        if(hiddenInp)hiddenInp.focus();
      }
    });
  }
}

function render(){
  const t=T,lg=lang(),u=data.users.find(x=>x.id===sel.uid)||data.users[0],ro=u&&data.roles.find(r=>r.id===u.r);
  const L=$('#login');
  L.className='flow-login glass-pin-login';

  L.innerHTML=
    '<div class="flow-ambient">' +
      '<canvas id="flow3dCanvas" class="flow-3d-canvas"></canvas>' +
      '<span class="flow-orb flow-orb--a"></span>' +
      '<span class="flow-orb flow-orb--b"></span>' +
      '<span class="flow-orb flow-orb--c"></span>' +
    '</div>' +
    '<div class="flow-card-wrap">' +
      '<div class="flow-card glass-pin-card" id="lgCard">' +
        '<div class="flow-card-beam"></div>' +
        '<div class="flow-shine"></div>' +
        '<div class="glass-top-bar">' +
          '<span class="glass-badge-brand"><i class="bi bi-shield-lock-fill me-1"></i> FMS 2.0</span>' +
          '<button class="flow-lang-btn" data-lg type="button">'+(lg==='bn'?'English':'বাংলা')+'</button>' +
        '</div>' +
        '<div class="flow-logo"><img src="'+BRAND.logo+'" alt=""></div>' +
        '<h1 class="glass-pin-heading">'+t('lg_pin_title')+'</h1>' +
        '<p class="flow-sub">'+t('lg_pin_sub')+'</p>' +
        '<div class="glass-user-strip">' +
          '<div class="glass-user-avatar">'+(u.n[lg]||u.n.bn)[0]+'</div>' +
          '<div class="glass-user-details">' +
            '<b>'+(u.n[lg]||u.n.bn)+'</b>' +
            '<small>'+(ro?nm(ro):u.r)+' · '+u.em+'</small>' +
          '</div>' +
          '<button type="button" class="glass-user-toggle-btn" data-switch-user title="'+t('lg_switch_role')+'">' +
            '<i class="bi bi-arrow-repeat"></i>' +
          '</button>' +
        '</div>' +
        '<div class="glass-code-wrapper" id="glassCodeWrapper">' +
          '<input type="tel" id="hiddenPinInput" class="glass-hidden-input" maxlength="4" pattern="[0-9]*" inputmode="numeric" autocomplete="one-time-code" autofocus>' +
          '<div class="glass-code-row" id="glassCodeRow">' +
            '<div class="glass-code-box" data-idx="0"><span class="glass-code-char" id="pinChar0"></span><span class="glass-code-cursor"></span></div>' +
            '<div class="glass-code-box" data-idx="1"><span class="glass-code-char" id="pinChar1"></span></div>' +
            '<div class="glass-code-box" data-idx="2"><span class="glass-code-char" id="pinChar2"></span></div>' +
            '<div class="glass-code-box" data-idx="3"><span class="glass-code-char" id="pinChar3"></span></div>' +
            '<div class="glass-fused-tile" id="glassFusedTile">' +
              '<svg class="tile-check-svg" viewBox="0 0 52 52">' +
                '<circle class="tile-check-circle" cx="26" cy="26" r="23" fill="none"/>' +
                '<path class="tile-check-tick" fill="none" d="M15 27 l7.5 7.5 l15 -15"/>' +
              '</svg>' +
            '</div>' +
          '</div>' +
          '<div class="glass-code-msg" id="pinMsg">'+t('lg_enter_pin')+'</div>' +
        '</div>' +
        '<div class="glass-actions-row">' +
          '<button type="button" class="glass-demo-pill" id="btnFillDemo">' +
            '<i class="bi bi-key-fill"></i> '+t('lg_demo_pin_btn') +
          '</button>' +
          '<label class="glass-rem-check">' +
            '<input type="checkbox" id="lgRem" '+(sel.rem?'checked':'')+'> '+t('lg_remember') +
          '</label>' +
        '</div>' +
        '<div class="flow-foot">'+t('lg_help')+' <a data-reset role="button" tabindex="0">'+t('lg_reset')+'</a></div>' +
      '</div>' +
    '</div>';

  document.title=BRAND.name;
  currentPin='';
  isVerifying=false;
  attachPinEvents();
  updatePinBoxes();
  init3DScene();
}

function initFlowBlob(){
  const mbs=[...document.querySelectorAll('.flow-mb')];
  if(!mbs.length||matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const P=mbs.map((_,i)=>({r:5+i*3.2,sp:.5+i*.2,ph:i*1.35}));
  let raf;
  function loop(time){
    const sec=time/1000;
    P.forEach((o,i)=>{
      const a=Math.cos(sec*o.sp+o.ph)*o.r;
      const l=Math.sin(sec*o.sp*1.12+o.ph)*o.r*.82;
      mbs[i].setAttribute('transform','translate('+a.toFixed(2)+' '+l.toFixed(2)+')');
    });
    raf=requestAnimationFrame(loop);
  }
  raf=requestAnimationFrame(loop);
  /* Clean up when login removed */
  const obs=new MutationObserver(()=>{
    if(!document.querySelector('.flow-mb')){cancelAnimationFrame(raf);obs.disconnect()}
  });
  obs.observe(document.body,{childList:true,subtree:true});
}

function initFlowRipples(){
  const inputs=document.querySelectorAll('.flow-field input');
  inputs.forEach(inp=>{
    inp.addEventListener('input',()=>{
      if(matchMedia('(prefers-reduced-motion:reduce)').matches) return;
      const field=inp.closest('.flow-field');
      const ripples=field&&field.querySelector('.flow-ripples');
      if(!ripples) return;
      const sp=document.createElement('span');
      sp.className='flow-ripple';
      const off=Math.min(18+inp.value.length*8.2,field.clientWidth-18);
      sp.style.left=off+'px';
      ripples.appendChild(sp);
      setTimeout(()=>sp.remove(),720);
    });
  });
}

let sceneClean=null;

function init3DScene(){
  if(sceneClean){
    sceneClean();
    sceneClean=null;
  }
  const canvas=document.getElementById('flow3dCanvas');
  const login=document.getElementById('login');
  if(!canvas||!login||matchMedia('(prefers-reduced-motion:reduce)').matches) return;

  const ctx=canvas.getContext('2d');
  if(!ctx) return;

  let width=0,height=0,dpr=Math.min(window.devicePixelRatio||1,2);
  let boundX=1600,boundY=1200;

  let targetCamX=0,targetCamY=0,camX=0,camY=0;
  let cardRotX=0,cardRotY=0,targetCardRotX=0,targetCardRotY=0;
  let isHovered=false;

  // 3D Polyhedra meshes
  const octR=120;
  const octahedron={
    pos:{x:-500,y:-200,z:-60},
    rot:{x:0.2,y:0.5,z:0.1},
    speed:{x:0.007,y:0.012,z:0.005},
    verts:[
      {x:0,y:-octR,z:0},{x:0,y:octR,z:0},
      {x:-octR,y:0,z:0},{x:octR,y:0,z:0},
      {x:0,y:0,z:-octR},{x:0,y:0,z:octR}
    ],
    edges:[
      [0,2],[0,3],[0,4],[0,5],
      [1,2],[1,3],[1,4],[1,5],
      [2,4],[4,3],[3,5],[5,2]
    ],
    color:'rgba(140, 155, 255, 0.42)'
  };

  const icoR=125;
  const phi=(1+Math.sqrt(5))/2;
  const rawIco=[
    {x:-1,y:phi,z:0},{x:1,y:phi,z:0},{x:-1,y:-phi,z:0},{x:1,y:-phi,z:0},
    {x:0,y:-1,z:phi},{x:0,y:1,z:phi},{x:0,y:-1,z:-phi},{x:0,y:1,z:-phi},
    {x:phi,y:0,z:-1},{x:phi,y:0,z:1},{x:-phi,y:0,z:-1},{x:-phi,y:0,z:1}
  ];
  const icoVerts=rawIco.map(v=>{
    const l=Math.hypot(v.x,v.y,v.z);
    return {x:(v.x/l)*icoR,y:(v.y/l)*icoR,z:(v.z/l)*icoR};
  });
  const icoEdges=[];
  for(let i=0;i<icoVerts.length;i++){
    for(let j=i+1;j<icoVerts.length;j++){
      const d=Math.hypot(icoVerts[i].x-icoVerts[j].x,icoVerts[i].y-icoVerts[j].y,icoVerts[i].z-icoVerts[j].z);
      if(d<icoR*1.25) icoEdges.push([i,j]);
    }
  }
  const icosahedron={
    pos:{x:500,y:200,z:-80},
    rot:{x:0.3,y:0.2,z:0.4},
    speed:{x:0.005,y:0.008,z:0.006},
    verts:icoVerts,
    edges:icoEdges,
    color:'rgba(56, 189, 248, 0.38)'
  };

  const ringR=95;
  const ringVerts=[];
  const ringEdges=[];
  const ringSteps=24;
  for(let i=0;i<ringSteps;i++){
    const a=(i/ringSteps)*Math.PI*2;
    ringVerts.push({x:Math.cos(a)*ringR,y:Math.sin(a)*ringR,z:0});
    ringEdges.push([i,(i+1)%ringSteps]);
  }
  const gyroRing={
    pos:{x:460,y:-260,z:50},
    rot:{x:1.2,y:0.4,z:0.2},
    speed:{x:0.008,y:0.007,z:0.011},
    verts:ringVerts,
    edges:ringEdges,
    color:'rgba(168, 85, 247, 0.4)'
  };

  const gemR=90;
  const gemVerts=[
    {x:0,y:-gemR*1.15,z:0},{x:0,y:gemR*1.15,z:0},
    {x:-gemR,y:-gemR*0.2,z:-gemR*0.5},{x:gemR,y:-gemR*0.2,z:-gemR*0.5},{x:0,y:-gemR*0.2,z:gemR*1.05},
    {x:-gemR*0.85,y:gemR*0.2,z:-gemR*0.4},{x:gemR*0.85,y:gemR*0.2,z:-gemR*0.4},{x:0,y:gemR*0.2,z:gemR*0.95}
  ];
  const gemEdges=[
    [0,2],[0,3],[0,4],[1,5],[1,6],[1,7],
    [2,3],[3,4],[4,2],[5,6],[6,7],[7,5],
    [2,5],[3,6],[4,7]
  ];
  const crystalGem={
    pos:{x:-460,y:230,z:30},
    rot:{x:0.7,y:0.9,z:0.3},
    speed:{x:0.006,y:0.009,z:0.005},
    verts:gemVerts,
    edges:gemEdges,
    color:'rgba(44, 197, 190, 0.42)'
  };

  const meshes=[octahedron,icosahedron,gyroRing,crystalGem];
  const fov=520;

  function updateMeshPositions(){
    const isMobile=width<768;
    const spreadX=isMobile?Math.min(width*0.36,160):Math.max(400,width*0.33);
    const spreadY=isMobile?Math.min(height*0.25,160):Math.max(180,height*0.25);

    octahedron.pos.x=-spreadX;
    octahedron.pos.y=-spreadY*0.7;
    icosahedron.pos.x=spreadX;
    icosahedron.pos.y=spreadY*0.75;
    gyroRing.pos.x=spreadX*0.85;
    gyroRing.pos.y=-spreadY*0.9;
    crystalGem.pos.x=-spreadX*0.9;
    crystalGem.pos.y=spreadY*0.82;
  }

  function resize(){
    width=window.innerWidth;
    height=window.innerHeight;
    canvas.width=Math.floor(width*dpr);
    canvas.height=Math.floor(height*dpr);
    canvas.style.width=width+'px';
    canvas.style.height=height+'px';
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(dpr,dpr);

    // Compute dynamic bounds so 3D particles span the entire viewport edge-to-edge
    const minScale=fov/(fov+400+360);
    boundX=Math.max(1000,Math.floor((width*0.5)/minScale*1.15));
    boundY=Math.max(750,Math.floor((height*0.5)/minScale*1.15));

    updateMeshPositions();
  }
  resize();
  window.addEventListener('resize',resize,{passive:true});

  function handlePointer(clientX,clientY){
    const cx=width/2,cy=height/2;
    const nx=(clientX-cx)/cx;
    const ny=(clientY-cy)/cy;

    targetCamX=nx*0.35;
    targetCamY=ny*0.28;
    targetCardRotX=-ny*9.5;
    targetCardRotY=nx*11.5;
    isHovered=true;

    const currentCard=document.getElementById('lgCard');
    const shine=currentCard?currentCard.querySelector('.flow-shine'):null;
    if(currentCard){
      const rect=currentCard.getBoundingClientRect();
      const sx=clientX-rect.left;
      const sy=clientY-rect.top;
      if(shine){
        shine.style.setProperty('--shine-x',sx+'px');
        shine.style.setProperty('--shine-y',sy+'px');
        shine.style.opacity='1';
      }
      currentCard.style.setProperty('--mouse-x',`${(Math.max(0,Math.min(rect.width,sx))/rect.width*100).toFixed(1)}%`);
      currentCard.style.setProperty('--mouse-y',`${(Math.max(0,Math.min(rect.height,sy))/rect.height*100).toFixed(1)}%`);
    }
  }

  function onPointerMove(e){
    handlePointer(e.clientX,e.clientY);
  }

  function onTouchMove(e){
    if(e.touches&&e.touches[0]){
      handlePointer(e.touches[0].clientX,e.touches[0].clientY);
    }
  }

  function onPointerLeave(){
    targetCamX=0;targetCamY=0;targetCardRotX=0;targetCardRotY=0;isHovered=false;
    const currentCard=document.getElementById('lgCard');
    const shine=currentCard?currentCard.querySelector('.flow-shine'):null;
    if(shine) shine.style.opacity='0';
  }

  window.addEventListener('pointermove',onPointerMove,{passive:true});
  window.addEventListener('touchmove',onTouchMove,{passive:true});
  document.addEventListener('pointerleave',onPointerLeave);
  document.addEventListener('touchend',onPointerLeave);

  // High-density cosmic particles distributed across full 3D universe
  const P_COUNT=Math.min(130,Math.max(70,Math.floor((width*height)/15000)));
  const particles=[];
  const palette=['#8C9BFF','#4C5BD4','#38bdf8','#c084fc','#60a5fa','#a5b4fc','#e0e7ff'];
  for(let i=0;i<P_COUNT;i++){
    particles.push({
      x:(Math.random()-0.5)*boundX*2,
      y:(Math.random()-0.5)*boundY*2,
      z:(Math.random()-0.5)*800,
      vx:(Math.random()-0.5)*0.45,
      vy:(Math.random()-0.5)*0.45,
      vz:(Math.random()-0.5)*0.4,
      r:Math.random()*2.2+1.2,
      c:palette[Math.floor(Math.random()*palette.length)]
    });
  }

  let rafId;

  function loop(time){
    const t=time*0.001;

    camX+=(targetCamX-camX)*0.045;
    camY+=(targetCamY-camY)*0.045;

    const idleCardX=Math.sin(t*0.85)*3.5;
    const idleCardY=Math.cos(t*0.65)*4.2;
    const desiredRotX=isHovered?targetCardRotX:idleCardX;
    const desiredRotY=isHovered?targetCardRotY:idleCardY;

    cardRotX+=(desiredRotX-cardRotX)*0.075;
    cardRotY+=(desiredRotY-cardRotY)*0.075;

    const currentCard=document.getElementById('lgCard');
    if(currentCard){
      currentCard.style.transform=`perspective(1200px) rotateX(${cardRotX.toFixed(2)}deg) rotateY(${cardRotY.toFixed(2)}deg) translateZ(${isHovered?18:0}px)`;
    }

    const autoX=Math.sin(t*0.32)*0.08;
    const autoY=Math.cos(t*0.26)*0.06;
    const curCamX=camY+autoY;
    const curCamY=camX+autoX;

    const cosY=Math.cos(curCamY),sinY=Math.sin(curCamY);
    const cosX=Math.cos(curCamX),sinX=Math.sin(curCamX);

    ctx.clearRect(0,0,width,height);
    const cx=width/2,cy=height/2;

    meshes.forEach(m=>{
      m.rot.x+=m.speed.x;m.rot.y+=m.speed.y;m.rot.z+=m.speed.z;
      const mCosX=Math.cos(m.rot.x),mSinX=Math.sin(m.rot.x);
      const mCosY=Math.cos(m.rot.y),mSinY=Math.sin(m.rot.y);
      const mCosZ=Math.cos(m.rot.z),mSinZ=Math.sin(m.rot.z);

      const projectedM=m.verts.map(v=>{
        let x1=v.x*mCosY+v.z*mSinY;
        let z1=-v.x*mSinY+v.z*mCosY;
        let y1=v.y*mCosX-z1*mSinX;
        let z2=v.y*mSinX+z1*mCosX;
        let x2=x1*mCosZ-y1*mSinZ;
        let y2=x1*mSinZ+y1*mCosZ;

        let wx=x2+m.pos.x+Math.sin(t*0.6+m.pos.z)*18;
        let wy=y2+m.pos.y+Math.cos(t*0.5+m.pos.x)*18;
        let wz=z2+m.pos.z;

        let cx1=wx*cosY+wz*sinY;
        let cz1=-wx*sinY+wz*cosY;
        let cy1=wy*cosX-cz1*sinX;
        let cz2=wy*sinX+cz1*cosX;

        const dist=fov+cz2+380;
        if(dist<=20) return null;
        const scale=fov/dist;
        return {sx:cx+cx1*scale,sy:cy+cy1*scale,scale};
      });

      ctx.lineWidth=1.1;
      m.edges.forEach(([i,j])=>{
        const p1=projectedM[i],p2=projectedM[j];
        if(p1&&p2){
          ctx.strokeStyle=m.color;
          ctx.beginPath();
          ctx.moveTo(p1.sx,p1.sy);
          ctx.lineTo(p2.sx,p2.sy);
          ctx.stroke();
        }
      });

      projectedM.forEach(p=>{
        if(p){
          ctx.fillStyle='#ffffff';
          ctx.beginPath();
          ctx.arc(p.sx,p.sy,2*p.scale,0,Math.PI*2);
          ctx.fill();
        }
      });
    });

    const projectedP=[];
    for(let i=0;i<particles.length;i++){
      const p=particles[i];
      p.x+=p.vx;p.y+=p.vy;p.z+=p.vz;
      if(p.x<-boundX) p.x=boundX; else if(p.x>boundX) p.x=-boundX;
      if(p.y<-boundY) p.y=boundY; else if(p.y>boundY) p.y=-boundY;
      if(p.z<-400) p.z=400; else if(p.z>400) p.z=-400;

      let x1=p.x*cosY+p.z*sinY;
      let z1=-p.x*sinY+p.z*cosY;
      let y1=p.y*cosX-z1*sinX;
      let z2=p.y*sinX+z1*cosX;

      const dist=fov+z2+360;
      if(dist>30){
        const scale=fov/dist;
        projectedP.push({
          sx:cx+x1*scale,
          sy:cy+y1*scale,
          scale,
          r:p.r*scale,
          c:p.c,
          orig:p
        });
      }
    }

    const MAX_D=135;
    for(let i=0;i<projectedP.length;i++){
      const p1=projectedP[i];
      for(let j=i+1;j<projectedP.length;j++){
        const p2=projectedP[j];
        const dx=p1.orig.x-p2.orig.x;
        const dy=p1.orig.y-p2.orig.y;
        const dz=p1.orig.z-p2.orig.z;
        const d3=Math.sqrt(dx*dx+dy*dy+dz*dz);
        if(d3<MAX_D){
          const alpha=(1-d3/MAX_D)*0.28*Math.min(p1.scale,p2.scale);
          ctx.strokeStyle=`rgba(140, 155, 255, ${alpha.toFixed(3)})`;
          ctx.lineWidth=0.9;
          ctx.beginPath();
          ctx.moveTo(p1.sx,p1.sy);
          ctx.lineTo(p2.sx,p2.sy);
          ctx.stroke();
        }
      }
    }

    for(let i=0;i<projectedP.length;i++){
      const p=projectedP[i];
      const alpha=Math.min(0.9,Math.max(0.18,(p.scale-0.25)*1.5));
      ctx.fillStyle=p.c;
      ctx.globalAlpha=alpha;
      ctx.beginPath();
      ctx.arc(p.sx,p.sy,Math.max(0.8,p.r),0,Math.PI*2);
      ctx.fill();

      if(p.scale>0.85){
        ctx.fillStyle=p.c;
        ctx.globalAlpha=alpha*0.25;
        ctx.beginPath();
        ctx.arc(p.sx,p.sy,p.r*2.8,0,Math.PI*2);
        ctx.fill();
      }
    }
    ctx.globalAlpha=1.0;

    rafId=requestAnimationFrame(loop);
  }

  rafId=requestAnimationFrame(loop);

  sceneClean=()=>{
    if(rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize',resize);
    window.removeEventListener('pointermove',onPointerMove);
    window.removeEventListener('touchmove',onTouchMove);
    document.removeEventListener('pointerleave',onPointerLeave);
    document.removeEventListener('touchend',onPointerLeave);
    if(obs) obs.disconnect();
  };

  const obs=new MutationObserver(()=>{
    if(!document.getElementById('flow3dCanvas')){
      if(sceneClean) sceneClean();
      sceneClean=null;
    }
  });
  obs.observe(document.body,{childList:true,subtree:true});
}

document.addEventListener('click',e=>{
  const l=$('#login');
  if(!l||!l.contains(e.target)) return;
  const g=s=>e.target.closest(s);

  if(g('#btnFillDemo')){
    fillDemoPin();
    return;
  }

  if(g('[data-switch-user]')){
    const activeUsers=data.users.filter(u=>u.on);
    if(activeUsers.length>1){
      const idx=activeUsers.findIndex(u=>u.id===sel.uid);
      const nextU=activeUsers[(idx+1)%activeUsers.length];
      sel.uid=nextU.id;
      sel.email=nextU.em;
      currentPin='';
      render();
    }
    return;
  }

  if(g('[data-lg]')){
    localStorage.setItem('fms-lang',lang()==='bn'?'en':'bn');
    render();
    return;
  }

  if(g('[data-reset]')){
    localStorage.removeItem(KEY);
    localStorage.removeItem('fms-session');
    location.reload();
    return;
  }
});

document.addEventListener('keydown',e=>{
  const l=$('#login');
  if(!l||!l.querySelector('.glass-pin-card')||isVerifying) return;
  if(e.key>='0'&&e.key<='9'){
    if(e.target.id!=='hiddenPinInput'){
      if(currentPin.length<4){
        currentPin+=e.key;
        const inp=$('#hiddenPinInput');
        if(inp) inp.value=currentPin;
        updatePinBoxes();
      }
    }
  }else if(e.key==='Backspace'){
    if(e.target.id!=='hiddenPinInput'){
      currentPin=currentPin.slice(0,-1);
      const inp=$('#hiddenPinInput');
      if(inp) inp.value=currentPin;
      updatePinBoxes();
    }
  }else if(e.key==='Enter'){
    if(currentPin.length===4&&!isVerifying){
      onPinComplete(currentPin);
    }
  }
});
return{data,mods:MODS,save:()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){}},current:()=>data.users.find(u=>u.id===sid()),logout:()=>{sessionStorage.removeItem('fms-session');localStorage.removeItem('fms-session')},boot:cb=>{CB=cb;if(AUTH.current()){document.body.classList.remove('auth');cb()}else render()}}})();
