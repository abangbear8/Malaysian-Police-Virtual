
type Mission = {
  name: string;
  x: number;
  y: number;
  reward: number;
  done: boolean;
};

const app = document.getElementById('app') ?? document.body;

document.documentElement.style.cssText =
  'margin:0;background:#101820;color:#fff;font-family:Arial,sans-serif';
document.body.style.cssText = 'margin:0;overflow:hidden';

app.innerHTML = `
<style>
*{box-sizing:border-box}
#game{height:100dvh;display:flex;flex-direction:column;background:#101820}
#top{padding:10px 14px;background:#172b3a;display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap}
#stats{display:flex;gap:12px;flex-wrap:wrap;font-size:13px}
#world{position:relative;flex:1;min-height:0;background:#57865c}
canvas{width:100%;height:100%;display:block;image-rendering:pixelated;touch-action:none}
#bottom{background:#172b3a;padding:10px;display:flex;justify-content:space-between;align-items:center;gap:8px}
button{background:#e6b84a;color:#17202a;border:0;border-radius:9px;padding:11px 14px;font-weight:bold;cursor:pointer}
button:active{transform:scale(.96)}
#controls{position:absolute;bottom:12px;left:12px;right:12px;display:flex;justify-content:space-between;align-items:end;pointer-events:none}
.pad{display:grid;grid-template-columns:46px 46px 46px;grid-template-rows:42px 42px 42px;gap:4px;pointer-events:auto}
.pad button,.action button{padding:0;background:#152b3bd9;color:white;border:1px solid #ffffff66;font-size:18px}
.pad .up{grid-column:2;grid-row:1}.pad .left{grid-column:1;grid-row:2}.pad .down{grid-column:2;grid-row:2}.pad .right{grid-column:3;grid-row:2}
.action{display:flex;flex-direction:column;gap:8px;pointer-events:auto}
.action button{padding:12px;font-size:12px}
#message{position:absolute;left:50%;top:12px;transform:translateX(-50%);background:#102432eF;padding:10px 14px;border-radius:8px;text-align:center;max-width:90%;font-size:13px;display:none}
#panel{position:absolute;inset:0;background:#08121ddd;display:flex;align-items:center;justify-content:center;padding:20px}
#card{max-width:430px;width:100%;background:#203746;border:1px solid #577181;border-radius:15px;padding:22px;text-align:center}
#card h2{margin-top:0;color:#f3ca68}
.small{font-size:12px;color:#b8cbd4;line-height:1.6}
@media(min-width:800px){#controls{left:22px;right:22px}.pad{transform:scale(1.1);transform-origin:bottom left}}
</style>
<div id="game">
  <div id="top">
    <strong>🚔 MALAYSIAN POLICE VIRTUAL</strong>
    <div id="stats">
      <span>💵 RM <b id="cash">500</b></span>
      <span>⭐ XP <b id="xp">0</b></span>
      <span>🎖️ <b id="rank">Konstabel</b></span>
    </div>
  </div>
  <div id="world">
    <canvas id="canvas"></canvas>
    <div id="message"></div>
    <div id="controls">
      <div class="pad">
        <button class="up" data-dir="up">▲</button>
        <button class="left" data-dir="left">◀</button>
        <button class="down" data-dir="down">▼</button>
        <button class="right" data-dir="right">▶</button>
      </div>
      <div class="action">
        <button id="interact">INTERAKSI</button>
        <button id="patrol">MULA RONDA</button>
      </div>
    </div>
    <div id="panel">
      <div id="card">
        <h2>MALAYSIAN POLICE VIRTUAL</h2>
        <p>Selamat datang, anggota polis.</p>
        <p class="small">Jalankan rondaan, lengkapkan tugasan dan kumpulkan ganjaran untuk meningkatkan pangkat.</p>
        <p class="small">Gerakkan anggota menggunakan butang arah atau kekunci WASD / anak panah. Dekati penanda tugasan untuk berinteraksi.</p>
        <button id="start">MULA BERTUGAS</button>
      </div>
    </div>
  </div>
  <div id="bottom">
    <div><b id="missionTitle">Tugasan:</b><br><span class="small" id="missionText">Mulakan syif untuk menerima tugasan.</span></div>
    <button id="save">SIMPAN</button>
  </div>
</div>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
const ctx = canvas.getContext('2d')!;
const $ = (id: string) => document.getElementById(id)!;

type SaveData = {
  x: number; y: number; cash: number; xp: number; completed: number;
};

const defaultSave: SaveData = {
  x: 500, y: 400, cash: 500, xp: 0, completed: 0
};

let save: SaveData = { ...defaultSave };
try {
  const stored = localStorage.getItem('mpv-save');
  if (stored) save = { ...defaultSave, ...JSON.parse(stored) };
} catch {}

let started = false;
let patrolActive = false;
let messageTimer = 0;
let lastTime = 0;
const keys = new Set<string>();
const pressed = new Set<string>();

const missions: Mission[] = [
  { name: 'Periksa balai polis', x: 220, y: 180, reward: 100, done: false },
  { name: 'Bantu orang awam', x: 760, y: 300, reward: 150, done: false },
  { name: 'Periksa kenderaan', x: 1100, y: 650, reward: 200, done: false },
  { name: 'Selesaikan rondaan', x: 1500, y: 250, reward: 250, done: false }
];

const buildings = [
  { x: 70, y: 65, w: 175, h: 90, color: '#d8c49a', label: 'KEDAI' },
  { x: 275, y: 65, w: 145, h: 100, color: '#a6b7bd', label: 'KLINIK' },
  { x: 60, y: 260, w: 170, h: 115, color: '#c8d0d4', label: 'BALAI POLIS' },
  { x: 300, y: 265, w: 150, h: 95, color: '#d6aa7e', label: 'KEDAI' },
  { x: 650, y: 80, w: 160, h: 100, color: '#c2c9b1', label: 'RUMAH' },
  { x: 900, y: 100, w: 190, h: 120, color: '#d6bca1', label: 'PASAR MINI' },
  { x: 650, y: 500, w: 170, h: 100, color: '#a8b9c8', label: 'PEJABAT' },
  { x: 1050, y: 480, w: 175, h: 105, color: '#d5c8a4', label: 'KEDAI' },
  { x: 1350, y: 80, w: 170, h: 105, color: '#c9c2b8', label: 'RUMAH' },
  { x: 1400, y: 480, w: 180, h: 110, color: '#aebfc2', label: 'KLINIK' }
];

const trees = Array.from({ length: 65 }, (_, i) => ({
  x: 30 + ((i * 197) % 1750),
  y: 25 + ((i * 131) % 850)
})).filter(t =>
  !buildings.some(b =>
    t.x > b.x - 20 && t.x < b.x + b.w + 20 &&
    t.y > b.y - 20 && t.y < b.y + b.h + 20
  )
);

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener('resize', resize);
resize();

function notify(text: string) {
  const el = $('message');
  el.textContent = text;
  el.style.display = 'block';
  messageTimer = 3;
}

function saveGame() {
  try {
    localStorage.setItem('mpv-save', JSON.stringify(save));
    notify('Permainan berjaya disimpan pada peranti ini.');
  } catch {
    notify('Simpanan tidak tersedia dalam pelayar ini.');
  }
  updateHUD();
}

function updateHUD() {
  $('cash').textContent = save.cash.toLocaleString('en-MY');
  $('xp').textContent = String(save.xp);
  const ranks = [
    [0, 'Konstabel'],
    [100, 'Lans Koperal'],
    [300, 'Koperal'],
    [600, 'Sarjan'],
    [1000, 'Sarjan Mejar'],
    [1600, 'Inspektor']
  ] as const;

  $('rank').textContent =
    [...ranks].reverse().find(r => save.xp >= r[0])?.[1] ?? 'Konstabel';

  const next = missions.find(m => !m.done);
  $('missionTitle').textContent = next ? 'Tugasan semasa:' : 'Semua tugasan selesai!';
  $('missionText').textContent = next
    ? `${next.name} — ganjaran RM${next.reward}`
    : 'Tahniah! Teruskan rondaan untuk bermain lagi.';
}

function nearestMission() {
  return missions
    .filter(m => !m.done)
    .map(m => ({ m, d: Math.hypot(m.x - save.x, m.y - save.y) }))
    .sort((a, b) => a.d - b.d)[0];
}

function interact() {
  if (!started) return;

  const nearby = nearestMission();
  if (nearby && nearby.d < 95) {
    nearby.m.done = true;
    save.cash += nearby.m.reward;
    save.xp += 100;
    save.completed++;
    notify(`Tugasan selesai! +RM${nearby.m.reward} dan +100 XP.`);
    updateHUD();
    return;
  }

  const station = buildings.find(b =>
    b.label === 'BALAI POLIS' &&
    Math.hypot((b.x + b.w / 2) - save.x, (b.y + b.h / 2) - save.y) < 150
  );

  if (station) {
    notify('Balai polis: pastikan semua tugasan rondaan diselesaikan.');
  } else {
    notify('Tiada tugasan berdekatan. Bergerak ke penanda kuning.');
  }
}

function startPatrol() {
  if (!started) return;
  patrolActive = !patrolActive;
  $('patrol').textContent = patrolActive ? 'TAMATKAN RONDA' : 'MULA RONDA';

  if (patrolActive) {
    save.xp += 10;
    notify('Rondaan bermula. Cari penanda tugasan kuning di bandar.');
  } else {
    notify('Rondaan ditamatkan.');
  }
  updateHUD();
}

$('start').addEventListener('click', () => {
  started = true;
  $('panel').style.display = 'none';
  notify('Syif bermula. Gunakan butang arah untuk bergerak.');
});

$('save').addEventListener('click', saveGame);
$('interact').addEventListener('click', interact);
$('patrol').addEventListener('click', startPatrol);

document.querySelectorAll<HTMLButtonElement>('[data-dir]').forEach(btn => {
  const dir = btn.dataset.dir!;
  const down = (e: Event) => {
    e.preventDefault();
    pressed.add(dir);
  };
  const up = (e: Event) => {
    e.preventDefault();
    pressed.delete(dir);
  };
  btn.addEventListener('pointerdown', down);
  btn.addEventListener('pointerup', up);
  btn.addEventListener('pointercancel', up);
  btn.addEventListener('pointerleave', up);
});

window.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
    e.preventDefault();
  }
  keys.add(key);
  if (key === 'e' || key === ' ') interact();
  if (key === 'p') startPatrol();
});

window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));

function drawBuilding(b: typeof buildings[number]) {
  ctx.fillStyle = '#00000030';
  ctx.fillRect(b.x + 7, b.y + 8, b.w, b.h);
  ctx.fillStyle = b.color;
  ctx.fillRect(b.x, b.y, b.w, b.h);

  ctx.fillStyle = '#667985';
  ctx.fillRect(b.x - 5, b.y - 9, b.w + 10, 15);

  for (let wx = b.x + 15; wx < b.x + b.w - 15; wx += 38) {
    ctx.fillStyle = '#83c7d5';
    ctx.fillRect(wx, b.y + 20, 19, 20);
  }

  ctx.fillStyle = '#684d3a';
  ctx.fillRect(b.x + b.w / 2 - 12, b.y + b.h - 35, 24, 35);

  ctx.fillStyle = '#263d4c';
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h + 16);
}

function drawPerson(x: number, y: number, police: boolean) {
  ctx.fillStyle = '#00000035';
  ctx.fillRect(x - 9, y + 12, 19, 6);

  ctx.fillStyle = '#e4b38b';
  ctx.fillRect(x - 6, y - 17, 12, 12);

  ctx.fillStyle = police ? '#234c75' : '#b85b43';
  ctx.fillRect(x - 9, y - 5, 18, 20);

  ctx.fillStyle = '#182735';
  ctx.fillRect(x - 8, y + 14, 6, 10);
  ctx.fillRect(x + 2, y + 14, 6, 10);

  if (police) {
    ctx.fillStyle = '#142b43';
    ctx.fillRect(x - 8, y - 20, 16, 5);
    ctx.fillStyle = '#e8c55d';
    ctx.fillRect(x - 2, y - 3, 4, 4);
  }
}

function drawCar(x: number, y: number, police: boolean) {
  ctx.fillStyle = '#00000030';
  ctx.fillRect(x - 26, y - 11, 56, 30);

  ctx.fillStyle = police ? '#e5e8ed' : '#bd654a';
  ctx.fillRect(x - 25, y - 15, 50, 29);

  ctx.fillStyle = '#284b60';
  ctx.fillRect(x - 15, y - 11, 30, 10);

  ctx.fillStyle = '#20252b';
  ctx.fillRect(x - 20, y + 10, 10, 8);
  ctx.fillRect(x + 10, y + 10, 10, 8);

  if (police) {
    ctx.fillStyle = '#d84545';
    ctx.fillRect(x - 8, y - 20, 8, 5);
    ctx.fillStyle = '#3f8bd2';
    ctx.fillRect(x, y - 20, 8, 5);
  }
}

function render(time: number) {
  const dt = Math.min((time - lastTime) / 1000 || 0, 0.05);
  lastTime = time;

  if (messageTimer > 0) {
    messageTimer -= dt;
    if (messageTimer <= 0) $('message').style.display = 'none';
  }

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const cameraX = Math.max(0, Math.min(1920 - w, save.x - w / 2));
  const cameraY = Math.max(0, Math.min(960 - h, save.y - h / 2));

  if (started) {
    let dx = 0, dy = 0;
    if (keys.has('w') || keys.has('arrowup') || pressed.has('up')) dy--;
    if (keys.has('s') || keys.has('arrowdown') || pressed.has('down')) dy++;
    if (keys.has('a') || keys.has('arrowleft') || pressed.has('left')) dx--;
    if (keys.has('d') || keys.has('arrowright') || pressed.has('right')) dx++;

    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      const speed = patrolActive ? 155 : 190;
      save.x = Math.max(20, Math.min(1900, save.x + dx / len * speed * dt));
      save.y = Math.max(20, Math.min(940, save.y + dy / len * speed * dt));
    }
  }

  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.scale(w / w, h / h);
  ctx.translate(-cameraX, -cameraY);

  ctx.fillStyle = '#679567';
  ctx.fillRect(0, 0, 1920, 960);

  // Jalan raya utama
  ctx.fillStyle = '#555e64';
  ctx.fillRect(0, 405, 1920, 125);
  ctx.fillRect(500, 0, 120, 960);

  ctx.strokeStyle = '#e8dba2';
  ctx.lineWidth = 3;
  ctx.setLineDash([24, 22]);
  ctx.beginPath();
  ctx.moveTo(0, 467);
  ctx.lineTo(1920, 467);
  ctx.moveTo(560, 0);
  ctx.lineTo(560, 960);
  ctx.stroke();
  ctx.setLineDash([]);

  // Rumput dan pokok
  for (const t of trees) {
    ctx.fillStyle = '#396747';
    ctx.fillRect(t.x - 13, t.y + 6, 27, 24);
    ctx.fillStyle = '#2d6540';
    ctx.fillRect(t.x - 12, t.y - 12, 24, 24);
    ctx.fillStyle = '#4d8550';
    ctx.fillRect(t.x - 7, t.y - 18, 14, 13);
  }

  for (const b of buildings) drawBuilding(b);

  drawCar(390, 460, false);
  drawCar(800, 460, true);
  drawCar(1250, 460, false);

  // Penanda tugasan
  for (const m of missions) {
    if (m.done) continue;
    const pulse = Math.sin(time / 180) * 4;

    ctx.fillStyle = '#00000030';
    ctx.beginPath();
    ctx.ellipse(m.x, m.y + 7, 25, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f3c94e';
    ctx.beginPath();
    ctx.arc(m.x, m.y - pulse, 19, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#26343c';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('!', m.x, m.y + 7 - pulse);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('TUGASAN', m.x, m.y - 30);
  }

  // Orang awam
  drawPerson(710, 315, false);
  drawPerson(960, 340, false);
  drawPerson(1180, 700, false);

  // Pemain
  drawPerson(save.x, save.y, true);

  // Petunjuk jarak tugasan
  const nearby = nearestMission();
  if (nearby && nearby.d < 115) {
    ctx.fillStyle = '#172b3a';
    ctx.fillRect(save.x - 92, save.y - 54, 184, 25);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TEKAN INTERAKSI', save.x, save.y - 37);
  }

  ctx.restore();
  requestAnimationFrame(render);
}

updateHUD();
requestAnimationFrame(render);
