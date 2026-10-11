import * as THREE from 'three';
import './style.css';

type MissionKind = 'Rondaan'|'Siasatan'|'Bantuan awam'|'Laporan polis'|'Tangkapan'|'Trafik';
type Mission = {id:number; title:string; kind:MissionKind; detail:string; reward:number; duration:number; color:number; x:number; z:number; done:boolean};
type SaveData = {xp:number; rank:number; cash:number; publicRep:number; orgRep:number; completed:number[]; salary:number; bestScore:number};
const ranks = ['Konstabel Percubaan','Konstabel','Lans Koperal','Koperal','Sarjan','Sarjan Mejar','Sub-Inspektor','Inspektor Percubaan','Inspektor','Asisten Superintenden Polis','Deputi Superintenden Polis','Superintenden Polis','Asisten Komisioner Polis','Senior Asisten Komisioner Polis','Deputi Komisioner Polis','Komisioner Polis','Deputi Inspektor Jeneral Polis','Inspektor Jeneral Polis'];
const thresholds = [0,350,850,1500,2150,2900,3700,4550,5450,6950,8600,10450,11350,12350,13450,14600,16100,17950];
const missionDefs: Omit<Mission,'done'>[] = [
 {id:1,title:'Rondaan Taman Harmoni',kind:'Rondaan',detail:'Periksa kawasan rondaan dan bantu penduduk yang memerlukan.',reward:60,duration:6,color:0x36c2b4,x:-12,z:-7},
 {id:2,title:'Siasatan Kedai Runcit',kind:'Siasatan',detail:'Temu bual saksi dan periksa petunjuk di sekitar kedai.',reward:120,duration:12,color:0xf6bd60,x:11,z:-10},
 {id:3,title:'Bantuan Awam',kind:'Bantuan awam',detail:'Bantu orang awam di dataran dan pastikan kawasan selamat.',reward:80,duration:8,color:0x80b9ff,x:0,z:-15},
 {id:4,title:'Lengkapkan Laporan',kind:'Laporan polis',detail:'Semak butiran insiden dan serahkan laporan yang tepat.',reward:45,duration:5,color:0xa78bfa,x:-5,z:8},
 {id:5,title:'Kes Tangkapan',kind:'Tangkapan',detail:'Kenal pasti suspek dan selesaikan insiden dengan selamat.',reward:100,duration:10,color:0xff7f7f,x:15,z:7},
 {id:6,title:'Kawal Persimpangan',kind:'Trafik',detail:'Urus aliran trafik dan pastikan lintasan pejalan kaki selamat.',reward:65,duration:7,color:0xf59e0b,x:-15,z:13}
];
const defaultSave:SaveData={xp:0,rank:0,cash:250,publicRep:50,orgRep:50,completed:[],salary:0,bestScore:0};
let save:SaveData = loadSave();
function loadSave():SaveData { try { const raw=localStorage.getItem('pmt-save-v1'); if(raw) return {...defaultSave,...JSON.parse(raw)} as SaveData; } catch {} return {...defaultSave}; }
function persist(){ localStorage.setItem('pmt-save-v1',JSON.stringify(save)); }
const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`
<div id="mainMenu" class="main-menu">
  <div class="main-menu-content">
    <div class="main-menu-crest">P</div>
    <p class="main-menu-eyebrow">SIMULASI KERJAYA</p>
    <h1>POLIS MALAYSIA<br><span>TYCOON</span></h1>
    <p class="main-menu-tagline">BERKHIDMAT DEMI MASYARAKAT</p>
    <div class="main-menu-buttons">
      <button id="continueCareer" class="main-menu-btn primary">SAMBUNG SIMPANAN</button>
      <button id="newCareer" class="main-menu-btn">MULA KERJAYA BAHARU</button>
      <button id="menuSettings" class="main-menu-btn">TETAPAN</button>
      <button id="menuCredits" class="main-menu-btn">KREDIT</button>
    </div>
  </div>
</div> 
<div class="game-shell">
 <header class="topbar"><div class="brand"><div class="crest">P</div><div><div class="eyebrow">SIMULASI KERJAYA</div><h1>POLIS MALAYSIA <span>TYCOON</span></h1></div></div><div class="top-actions"><span class="save-state"><i></i> SIMPANAN SETEMPAT</span><button id="resetBtn" class="icon-btn" title="Mulakan semula">↻</button></div></header>
 <main class="layout"><section class="world-panel"><div id="scene" class="scene"><div class="scene-vignette"></div><div class="world-tag"><span class="live-dot"></span> BANDAR SENTOSA <span class="tag-divider">/</span> SYIF PAGI</div><div class="scene-hint"><kbd>W A S D</kbd> GERAK <span>·</span> <kbd>E</kbd> INTERAKSI</div><div id="missionToast" class="mission-toast hidden"></div><div class="touch-controls"><button data-move="up">▲</button><div><button data-move="left">◀</button><button data-move="down">▼</button><button data-move="right">▶</button></div></div><div class="interact-mobile"><button id="interactMobile">INTERAKSI</button></div><div class="menu-mobile"><button id="menuMobile" aria-label="Buka menu permainan">☰ MENU</button></div></div>
 <div class="world-footer"><div><span class="footer-icon">⌖</span><div><b id="nearbyTitle">Balai Polis Sentosa</b><small id="nearbyText">Bergerak ke penanda tugasan untuk memulakan misi.</small></div></div><button id="mapBtn" class="secondary-btn">TUGASAN <span>↗</span></button></div></section>
 <aside class="sidebar"><section class="profile-card"><div class="profile-head"><div class="avatar">👮</div><div class="profile-info"><span class="eyebrow">PEGAWAI BERTUGAS</span><h2 id="rankName">Konstabel Percubaan</h2><span class="badge">KONST/P · GRED PERMULAAN</span></div></div><div class="xp-line"><div><span>KEMAJUAN KERJAYA</span><b id="xpLabel">0 / 350 XP</b></div><div class="progress"><i id="xpProgress"></i></div></div><div class="stats-grid"><div><small>BAKI WANG</small><strong id="cashLabel">RM 250</strong></div><div><small>GAJI BULANAN</small><strong id="salaryLabel">RM 1,800</strong></div></div></section>
 <section class="mission-card"><div class="section-head"><div><span class="eyebrow">PUSAT TUGASAN</span><h2>Tugasan aktif</h2></div><span id="missionCount" class="count-pill">0/6</span></div><div id="missionList" class="mission-list"></div><button id="allMissionsBtn" class="full-btn">LIHAT SEMUA TUGASAN <span>→</span></button></section>
 <section class="reputation-card"><div class="section-head"><div><span class="eyebrow">REKOD PERKHIDMATAN</span><h2>Reputasi</h2></div><span class="reputation-mark">✦</span></div><div class="rep-row"><span>Kepercayaan awam</span><b id="publicRepLabel">50/100</b></div><div class="rep-bar"><i id="publicRepBar"></i></div><div class="rep-row"><span>Disiplin organisasi</span><b id="orgRepLabel">50/100</b></div><div class="rep-bar blue"><i id="orgRepBar"></i></div></section></aside></main>
 <footer class="bottom-bar"><div><span class="status-led"></span><span id="statusText">Syif bermula. Pilih tugasan pertama anda.</span></div><span class="build-label">PROTOTAIP 0.1 <b>·</b> WEB 3D</span></footer>
</div>
<div id="modalBackdrop" class="modal-backdrop hidden"><section class="modal"><button id="closeModal" class="modal-close">×</button><span class="eyebrow">PUSAT OPERASI</span><h2 id="modalTitle">Tugasan tersedia</h2><p id="modalDesc">Pilih tugasan untuk melihat butiran.</p><div id="modalContent"></div></section></div>`;

const sceneHost=document.querySelector<HTMLDivElement>('#scene')!;
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true}); renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)); renderer.setSize(sceneHost.clientWidth,sceneHost.clientHeight); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.setClearColor(0x9bc8d0,1); sceneHost.prepend(renderer.domElement);
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x9bc8d0); scene.fog=new THREE.Fog(0x9bc8d0,45,100);
const camera=new THREE.PerspectiveCamera(38,sceneHost.clientWidth/sceneHost.clientHeight,.1,150); camera.position.set(24,28,34);
scene.add(new THREE.HemisphereLight(0xe6f8ff,0x65765c,2.1)); const sun=new THREE.DirectionalLight(0xfff2d4,3.1); sun.position.set(-15,28,18); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); scene.add(sun);
const mat=(color:number,roughness=1)=>new THREE.MeshStandardMaterial({color,roughness});
const grass=mat(0x7cba8b), road=mat(0x424d5b), sidewalk=mat(0xc5c6b8), white=mat(0xf5f5e9), navy=mat(0x17334b), blue=mat(0x2f78a5), glass=mat(0x82c8d6), yellow=mat(0xf2c45d), treeMat=mat(0x3e9164), trunk=mat(0x76543b), buildingMats=[mat(0xe5a77b),mat(0xf1d6a6),mat(0xb5d5d0),mat(0xc1b5de),mat(0xf1a8a0)];
function box(w:number,h:number,d:number,material:THREE.Material,x:number,y:number,z:number, parent:THREE.Object3D=scene){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y+h/2,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function cylinder(r:number,h:number,material:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=scene){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,8),material);m.position.set(x,y+h/2,z);m.castShadow=true;parent.add(m);return m;}
box(100,.3,100,grass,0,-.2,0);
// road network and markings
box(100,.12,10,road,0,.0,0); box(10,.12,100,road,0,.01,0); box(100,.1,2,sidewalk,0,.05,6.1); box(100,.1,2,sidewalk,0,.05,-6.1); box(2,.1,100,sidewalk,6.1,.05,0); box(2,.1,100,sidewalk,-6.1,.05,0);
for(let x=-45;x<50;x+=7) box(3,.035,.14,yellow,x,.09,0);
for(let z=-45;z<50;z+=7) box(.14,.035,3,white,0,.1,z);
// blocks, low-rise shops and houses
for(let x=-38;x<=38;x+=12){for(let z of [-22,22]){if(Math.abs(x)<9)continue;const idx=Math.abs(Math.floor(x/12)+Math.floor(z/22))%buildingMats.length;const w=7+(Math.abs(x)%3),d=7,h=4+(Math.abs(x+z)%3);box(w,h,d,buildingMats[idx],x,.1,z);box(w+.2,.45,d+.2,navy,x,h+.1,z);box(1.5,1.6,.12,glass,x,.8,z+(z>0?-d/2-.07:d/2+.07));box(1.4,1.1,.12,glass,x-2,.8,z+(z>0?-d/2-.07:d/2+.07));}}
// police station at rear corner
box(13,5,8,white,-18,.1,-20); box(13.4,.65,8.4,navy,-18,5.1,-20); box(5,.45,.25,blue,-18,4.2,-24.13); box(3,.8,.18,white,-18,3.5,-24.28); box(1.6,1.7,.2,glass,-18,.9,-24.2); box(1.6,1.7,.2,glass,-14,.9,-24.2); box(1.6,1.7,.2,glass,-22,.9,-24.2);
// trees
for(const [x,z] of [[-28,-10],[-31,8],[-23,14],[27,-12],[32,10],[20,25],[-28,28],[29,29],[-8,28],[9,-29]] as number[][]){cylinder(.22,1.3,trunk,x,.1,z);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.25,0),treeMat);crown.position.set(x,2,z);crown.castShadow=true;scene.add(crown);}
// parked car
function makeCar(x:number,z:number,color=0xf4f6f7){const g=new THREE.Group();box(2.5,.65,4,mat(color),0,.55,0,g);box(1.75,.7,1.8,glass,0,1.15,-.1,g);for(const wx of [-1.18,1.18])for(const wz of [-1.25,1.25])cylinder(.38,.22,mat(0x1c2731),wx,.35,wz,g).rotation.z=Math.PI/2;box(.4,.15,.15,mat(0xdfe9ec),-.7,.7,2,g);box(.4,.15,.15,mat(0xdfe9ec),.7,.7,2,g);g.position.set(x,0,z);scene.add(g);return g;}
const policeCar=makeCar(-9,2,0xf6f8f7); box(.55,.2,.25,mat(0x2579d4),-9,1.45,2,policeCar); box(.55,.2,.25,mat(0xd94646),-9,1.45,2.3,policeCar);
makeCar(12,2,0xe5b66c); makeCar(17,-3,0xdfe7e8);
// player character, simple stylized uniform
const player=new THREE.Group(); cylinder(.38,.95,navy,0,.1,0,player); cylinder(.28,.34,mat(0xd7a47b),0,1.05,0,player); cylinder(.38,.18,navy,0,1.38,0,player); box(.7,.13,.12,yellow,0,1.15,-.02,player); cylinder(.48,.16,mat(0x142c3f),0,1.48,0,player); player.position.set(-18,0,-13); scene.add(player);
// NPCs
const npcs:THREE.Group[]=[]; for(const [x,z,c] of [[-4,-10,0x4f8790],[5,12,0xc37d56],[23,13,0x5d77a0],[-25,3,0x9270a3],[8,-25,0x4d8a69]] as number[][]){const n=new THREE.Group();cylinder(.27,.8,mat(c),0,.1,0,n);cylinder(.23,.28,mat(0xd6a27b),0,.92,0,n);n.position.set(x,0,z);scene.add(n);npcs.push(n);}
// mission markers
const missions:Mission[]=missionDefs.map(m=>({...m,done:save.completed.includes(m.id)})); const markers=new Map<number,THREE.Group>();
for(const m of missions){const g=new THREE.Group();const ring=new THREE.Mesh(new THREE.CylinderGeometry(.8,.8,.07,24),new THREE.MeshStandardMaterial({color:m.color,emissive:m.color,emissiveIntensity:.4,transparent:true,opacity:.9}));ring.position.y=.08;g.add(ring);const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.42),new THREE.MeshStandardMaterial({color:m.color,emissive:m.color,emissiveIntensity:.3}));gem.position.y=1.15;g.add(gem);const stem=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.8,6),white);stem.position.y=.65;g.add(stem);g.position.set(m.x,0,m.z);if(m.done)g.visible=false;scene.add(g);markers.set(m.id,g);}
// Decorative lamps
for(const [x,z] of [[-9,-10],[9,-10],[-9,10],[9,10]] as number[][]){cylinder(.07,3,mat(0x4e5963),x,.1,z);const lamp=new THREE.Mesh(new THREE.SphereGeometry(.22,8,8),mat(0xffe3a0));lamp.position.set(x,3.15,z);scene.add(lamp);}
const keys=new Set<string>();let moveTouch={x:0,z:0};let activeMission:Mission|undefined;let modalOpen=false;let lastTime=0;let walkCycle=0;
function clamp(v:number,a:number,b:number){return Math.max(a,Math.min(b,v));}
function nearestMission(){let best:Mission|undefined,dist=Infinity;for(const m of missions){if(m.done)continue;const d=Math.hypot(player.position.x-m.x,player.position.z-m.z);if(d<dist){dist=d;best=m;}}return best?{mission:best,distance:dist}:undefined;}
function animate(t:number){requestAnimationFrame(animate);const dt=Math.min((t-lastTime)/1000||0,.05);lastTime=t;let dx=0,dz=0;if(keys.has('w')||keys.has('arrowup'))dz-=1;if(keys.has('s')||keys.has('arrowdown'))dz+=1;if(keys.has('a')||keys.has('arrowleft'))dx-=1;if(keys.has('d')||keys.has('arrowright'))dx+=1;dx+=moveTouch.x;dz+=moveTouch.z;const mag=Math.hypot(dx,dz);if(mag>0){dx/=mag;dz/=mag;const speed=5.5;player.position.x=clamp(player.position.x+dx*speed*dt,-43,43);player.position.z=clamp(player.position.z+dz*speed*dt,-43,43);player.rotation.y=Math.atan2(dx,dz);walkCycle+=dt*10;player.position.y=Math.abs(Math.sin(walkCycle))*.045;}else player.position.y=0;
 for(const [id,g] of markers){const m=missions.find(q=>q.id===id)!;if(!m.done){g.children[1].position.y=1.12+Math.sin(t/330+id)*.15;g.rotation.y=t/2400;}}
 const target=new THREE.Vector3(player.position.x,0,player.position.z);const cameraGoal=new THREE.Vector3(player.position.x+22,player.position.y+24,player.position.z+27);camera.position.lerp(cameraGoal,1-Math.pow(.001,dt));camera.lookAt(target);const near=nearestMission();if(near&&near.distance<3.2){sceneHost.classList.add('in-range');document.querySelector('#nearbyTitle')!.textContent=near.mission.title;document.querySelector('#nearbyText')!.textContent='Tekan E atau INTERAKSI untuk menerima tugasan.';activeMission=near.mission;}else{sceneHost.classList.remove('in-range');document.querySelector('#nearbyTitle')!.textContent='Balai Polis Sentosa';document.querySelector('#nearbyText')!.textContent=near?`${near.mission.title} · ${near.distance.toFixed(0)}m dari lokasi anda`:'Semua tugasan telah selesai. Syabas!';activeMission=undefined;}
 renderer.render(scene,camera);}
requestAnimationFrame(animate);
function resize(){const w=sceneHost.clientWidth,h=sceneHost.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}
new ResizeObserver(resize).observe(sceneHost);
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();keys.add(k);if(k==='e')interact();});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
function interact(){if(activeMission&&!modalOpen)openMission(activeMission);else if(!activeMission)toast('Dekati penanda tugasan untuk berinteraksi.');}
function toast(msg:string){const el=document.querySelector<HTMLDivElement>('#missionToast')!;el.textContent=msg;el.classList.remove('hidden');window.setTimeout(()=>el.classList.add('hidden'),2600);}
function showModal(title:string,desc:string,content:string){document.querySelector('#modalTitle')!.textContent=title;document.querySelector('#modalDesc')!.textContent=desc;document.querySelector('#modalContent')!.innerHTML=content;document.querySelector('#modalBackdrop')!.classList.remove('hidden');modalOpen=true;}
function closeModal(){document.querySelector('#modalBackdrop')!.classList.add('hidden');modalOpen=false;}
function openMission(m:Mission){showModal(m.title,m.detail,`<div class="mission-detail"><div class="detail-icon" style="--accent:#${m.color.toString(16)}">✦</div><div><span class="eyebrow">${m.kind.toUpperCase()}</span><p>Anggaran masa <b>${m.duration} minit</b> · Ganjaran asas <b>${m.reward} XP</b></p></div></div><div class="briefing"><b>Objektif</b><ul><li>Selesaikan tugasan dengan selamat.</li><li>Patuhi prosedur dan jaga keselamatan orang awam.</li><li>Lengkapkan laporan akhir.</li></ul></div><button id="startMission" class="primary-btn">MULAKAN TUGASAN <span>→</span></button>`);document.querySelector('#startMission')!.addEventListener('click',()=>completeMission(m));}
function completeMission(m:Mission){const repeat=missions.filter(q=>q.id===m.id&&q.done).length;const score=82+Math.floor(Math.random()*17);const perf=score>=90?1.2:score>=75?1.1:score>=60?1:score>=40?.7:.4;const repeatMult=repeat===0?1:repeat===1?.75:repeat===2?.55:.4;const earned=Math.round(m.reward*perf*repeatMult);save.xp+=earned;save.cash+=Math.round(earned*.7);save.publicRep=clamp(save.publicRep+(score>=80?1:score<60?-2:0),0,100);save.orgRep=clamp(save.orgRep+(score>=85?1:score<55?-1:0),0,100);save.bestScore=Math.max(save.bestScore,score);m.done=true;save.completed.push(m.id);const marker=markers.get(m.id);if(marker)marker.visible=false;const next=thresholds.findIndex((v,i)=>i>save.rank&&save.xp>=v);if(next>save.rank){save.rank=next;toast(`Kenaikan pangkat: ${ranks[save.rank]}!`);}persist();renderUI();showModal('Tugasan selesai',`${m.title} telah diselesaikan.`, `<div class="result-score"><span>SKOR PRESTASI</span><strong>${score}<small>/100</small></strong><em>${score>=90?'CEMERLANG':score>=75?'BAIK':'MEMADAI'}</em></div><div class="result-grid"><div><small>XP DITERIMA</small><b>+${earned} XP</b></div><div><small>GANJARAN</small><b>+RM ${Math.round(earned*.7)}</b></div></div><p class="result-note">Reputasi dikemas kini mengikut prestasi. XP yang telah diperoleh tidak akan ditarik balik.</p><button id="continueBtn" class="primary-btn">KEMBALI BERTUGAS <span>→</span></button>`);document.querySelector('#continueBtn')!.addEventListener('click',closeModal);document.querySelector('#statusText')!.textContent=`${m.kind} selesai · Skor ${score}/100 · +${earned} XP`;}
function renderUI(){const rank=Math.min(save.rank,ranks.length-1);document.querySelector('#rankName')!.textContent=ranks[rank];document.querySelector('#xpLabel')!.textContent=`${save.xp.toLocaleString()} / ${(thresholds[rank+1]??thresholds[rank]).toLocaleString()} XP`;const lower=thresholds[rank]??0,upper=thresholds[rank+1]??thresholds[rank];document.querySelector<HTMLElement>('#xpProgress')!.style.width=`${clamp((save.xp-lower)/Math.max(1,upper-lower)*100,0,100)}%`;document.querySelector('#cashLabel')!.textContent=`RM ${save.cash.toLocaleString()}`;document.querySelector('#salaryLabel')!.textContent=`RM ${(1800+rank*180).toLocaleString()}`;document.querySelector('#publicRepLabel')!.textContent=`${save.publicRep}/100`;document.querySelector<HTMLElement>('#publicRepBar')!.style.width=`${save.publicRep}%`;document.querySelector('#orgRepLabel')!.textContent=`${save.orgRep}/100`;document.querySelector<HTMLElement>('#orgRepBar')!.style.width=`${save.orgRep}%`;document.querySelector('#missionCount')!.textContent=`${missions.filter(m=>m.done).length}/6`;const list=document.querySelector<HTMLDivElement>('#missionList')!;list.innerHTML=missions.slice(0,4).map(m=>`<button class="mission-item ${m.done?'done':''}" data-id="${m.id}"><span class="mission-symbol" style="--accent:#${m.color.toString(16)}">${m.done?'✓':'✦'}</span><span class="mission-copy"><b>${m.title}</b><small>${m.kind} · ${m.duration} min</small></span><span class="mission-xp">${m.done?'SELESAI':`+${m.reward}`}<small>${m.done?'':'XP'}</small></span></button>`).join('');list.querySelectorAll<HTMLButtonElement>('[data-id]').forEach(btn=>btn.addEventListener('click',()=>{const m=missions.find(q=>q.id===Number(btn.dataset.id));if(m&&!m.done)openMission(m);else toast('Tugasan ini telah selesai dalam syif ini.');}));}
function showAllMissions() {
  showModal(
    'Senarai tugasan',
    'Pilih tugasan yang belum selesai.',
    `<div class="all-missions">${missions.map(m => `
      <button class="all-mission-row" data-all-id="${m.id}" ${m.done ? 'disabled' : ''}>
        <span class="mission-symbol">${m.done ? '✓' : '✦'}</span>
        <span><b>${m.title}</b><small>${m.kind} · ${m.duration} minit</small></span>
        <strong>${m.done ? 'SELESAI' : `+${m.reward} XP`}</strong>
      </button>
    `).join('')}</div>`
  );

  document.querySelectorAll<HTMLButtonElement>('[data-all-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const m = missions.find(q => q.id === Number(btn.dataset.allId));
      if (!m || m.done) return;

      closeModal();
      const dist = Math.hypot(
        player.position.x - m.x,
        player.position.z - m.z
      );

      if (dist < 3.2) {
        openMission(m);
      } else {
        toast(`Bergerak ke penanda ${m.title} di dunia 3D.`);
      }
    });
  });
}

function showOfficerProfile() {
  const rank = Math.min(save.rank, ranks.length - 1);
  const nextXP = thresholds[rank + 1] ?? thresholds[rank];
  const currentXP = thresholds[rank] ?? 0;
  const progress = clamp(
    ((save.xp - currentXP) / Math.max(1, nextXP - currentXP)) * 100,
    0,
    100
  );

  showModal(
    'Profil Pegawai',
    'Rekod kerjaya dan prestasi perkhidmatan anda.',
    `<div class="officer-profile">
      <div class="officer-badge">👮</div>
      <h3>${ranks[rank]}</h3>
      <p>PEGAWAI POLIS MALAYSIA</p>

      <div class="officer-xp">
        <div><span>KEMAJUAN PANGKAT</span><b>${Math.round(progress)}%</b></div>
        <div class="progress"><i style="width:${progress}%"></i></div>
        <small>${save.xp.toLocaleString()} / ${nextXP.toLocaleString()} XP</small>
      </div>

      <div class="officer-stats">
        <div><small>BAKI WANG</small><b>RM ${save.cash.toLocaleString()}</b></div>
        <div><small>TUGASAN SELESAI</small><b>${save.completed.length}</b></div>
        <div><small>SKOR TERBAIK</small><b>${save.bestScore}/100</b></div>
        <div><small>KEPERCAYAAN AWAM</small><b>${save.publicRep}/100</b></div>
        <div><small>DISIPLIN ORGANISASI</small><b>${save.orgRep}/100</b></div>
        <div><small>GAJI BULANAN</small><b>RM ${(1800 + rank * 180).toLocaleString()}</b></div>
      </div>

      <button id="profileBack" class="primary-btn">KEMBALI KE MENU</button>
    </div>`
  );

  document.querySelector('#profileBack')!
    .addEventListener('click', showGameMenu);
}

function showGameMenu() {
  showModal(
    'Menu utama',
    'Pusat kawalan pegawai bertugas.',
    `<div class="menu-profile">
      <div><small>PANGKAT</small><b>${ranks[Math.min(save.rank, ranks.length - 1)]}</b></div>
      <div><small>XP TERKUMPUL</small><b>${save.xp.toLocaleString()} XP</b></div>
      <div><small>BAKI WANG</small><b>RM ${save.cash.toLocaleString()}</b></div>
      <div><small>TUGASAN SELESAI</small><b>${missions.filter(m => m.done).length}/6</b></div>
    </div>
    <button id="menuProfile" class="primary-btn">PROFIL PEGAWAI →</button>
    <button id="menuTasks" class="secondary-btn">SENARAI TUGASAN →</button>
    <button id="menuResume" class="secondary-btn">SAMBUNG PERMAINAN</button>`
  );

  document.querySelector('#menuProfile')!
    .addEventListener('click', showOfficerProfile);

  document.querySelector('#menuTasks')!
    .addEventListener('click', showAllMissions);

  document.querySelector('#menuResume')!
    .addEventListener('click', closeModal);
}
document.querySelector('#menuMobile')!
  .addEventListener('click', showGameMenu);
document.querySelector('#interactMobile')!.addEventListener('click',interact);document.querySelector('#allMissionsBtn')!.addEventListener('click',showAllMissions);document.querySelector('#mapBtn')!.addEventListener('click',showAllMissions);document.querySelector('#closeModal')!.addEventListener('click',closeModal);document.querySelector('#modalBackdrop')!.addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal();});document.querySelector('#resetBtn')!.addEventListener('click',()=>{showModal('Mulakan semula kerjaya?','Kemajuan simpanan setempat akan dipadamkan.',`<p>Tindakan ini tidak boleh dibatalkan.</p><button id="confirmReset" class="danger-btn">PADAM KEMAJUAN</button>`);document.querySelector('#confirmReset')!.addEventListener('click',()=>{localStorage.removeItem('pmt-save-v1');location.reload();});});
document.querySelectorAll<HTMLButtonElement>('[data-move]').forEach(btn => {
  const dir = btn.dataset.move!;

  const set = (on: boolean) => {
    moveTouch.x = 0;
    moveTouch.z = 0;

    if (on) {
      if (dir === 'up') moveTouch.z = -1;
      if (dir === 'down') moveTouch.z = 1;
      if (dir === 'left') moveTouch.x = -1;
      if (dir === 'right') moveTouch.x = 1;
    }
  };

  btn.addEventListener('contextmenu', e => e.preventDefault());
  btn.addEventListener('selectstart', e => e.preventDefault());
  btn.addEventListener('touchstart', e => e.preventDefault(), {
    passive: false
  });

  btn.addEventListener('pointerdown', e => {
    e.preventDefault();
    set(true);
  });

  for (const ev of [
    'pointerup',
    'pointercancel',
    'pointerleave',
    'lostpointercapture'
  ]) {
    btn.addEventListener(ev, () => set(false));
  }
});

renderUI();

// MAIN MENU: fungsi butang
document.body.classList.add('main-menu-active');
function masukPermainan() {
  document.body.classList.remove('main-menu-active');
}
document.querySelector('#continueCareer')!
  .addEventListener('click', () => {
    if (!localStorage.getItem('pmt-save-v1')) {
      alert('Tiada simpanan dijumpai. Pilih Mula Kerjaya Baharu.');
      return;
    }
    masukPermainan();
  });
document.querySelector('#newCareer')!
  .addEventListener('click', () => {
    const adaSimpanan = !!localStorage.getItem('pmt-save-v1');
    if (adaSimpanan &&
        !confirm('Mulakan kerjaya baharu? Simpanan lama akan dipadam.')) {
      return;
    }
    save = {
      ...defaultSave,
      completed: []
    };
    missions.forEach(m => {
      m.done = false;
      const marker = markers.get(m.id);
      if (marker) marker.visible = true;
    });
    persist();
    renderUI();
    masukPermainan();
  });
document.querySelector('#menuSettings')!
  .addEventListener('click', () => {
    showModal(
      'Tetapan',
      'Kawalan permainan',
      '<p>Komputer: WASD atau kekunci anak panah.</p>' +
      '<p>Telefon: gunakan butang arah pada skrin.</p>' +
      '<button id="settingsBack" class="primary-btn">KEMBALI</button>'
    );
    document.querySelector('#settingsBack')!
      .addEventListener('click', closeModal);
  });
document.querySelector('#menuCredits')!
  .addEventListener('click', () => {
    showModal(
      'Kredit',
      'Polis Malaysia Tycoon',
      '<p>Prototaip simulasi kerjaya polis fiksyen.</p>' +
      '<button id="creditsBack" class="primary-btn">KEMBALI</button>'
    );
    document.querySelector('#creditsBack')!
      .addEventListener('click', closeModal);
  });

/* KESAN BUNYI UNTUK SEMUA BUTANG */
let buttonAudioContext: AudioContext | null = null;

function playButtonSound(): void {
  try {
    buttonAudioContext ??= new AudioContext();

    if (buttonAudioContext.state === 'suspended') {
      void buttonAudioContext.resume();
    }

    const oscillator = buttonAudioContext.createOscillator();
    const gain = buttonAudioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(
      650,
      buttonAudioContext.currentTime
    );
    oscillator.frequency.exponentialRampToValueAtTime(
      420,
      buttonAudioContext.currentTime + 0.07
    );

    gain.gain.setValueAtTime(
      0.12,
      buttonAudioContext.currentTime
    );
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      buttonAudioContext.currentTime + 0.08
    );

    oscillator.connect(gain);
    gain.connect(buttonAudioContext.destination);

    oscillator.start();
    oscillator.stop(buttonAudioContext.currentTime + 0.08);
  } catch (error) {
    console.warn('Bunyi butang tidak dapat dimainkan:', error);
  }
}

document.addEventListener(
  'click',
  (event: MouseEvent) => {
    const target = event.target;

    if (
      target instanceof Element &&
      target.closest('button')
    ) {
      playButtonSound();
    }
  },
  true
);
