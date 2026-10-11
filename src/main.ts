
import './style.css';

type Mission = {
  id: string;
  title: string;
  description: string;
  x: number;
  y: number;
  reward: number;
};

type GameSave = {
  x: number;
  y: number;
  cash: number;
  xp: number;
  completed: string[];
  patrols: number;
};

const SAVE_KEY = 'mpv-save-v3';
const WORLD_W = 1800;
const WORLD_H = 1100;

const DEFAULT_SAVE: GameSave = {
  x: 600,
  y: 440,
  cash: 500,
  xp: 0,
  completed: [],
  patrols: 0,
};

const missions: Mission[] = [
  {
    id: 'station',
    title: 'Lapor diri di balai polis',
    description: 'Pergi ke penanda di balai polis.',
    x: 1110,
    y: 210,
    reward: 100,
  },
  {
    id: 'public',
    title: 'Bantu orang awam',
    description: 'Periksa kawasan kedai.',
    x: 300,
    y: 300,
    reward: 150,
  },
  {
    id: 'vehicle',
    title: 'Periksa kenderaan polis',
    description: 'Pergi ke kawasan parkir.',
    x: 1450,
    y: 390,
    reward: 200,
  },
  {
    id: 'patrol',
    title: 'Selesaikan rondaan',
    description: 'Pergi ke penanda di jalan utama.',
    x: 850,
    y: 700,
    reward: 250,
  },
];

const SPRITES = {
  tree: [0, 0],
  palm: [64, 0],
  house: [128, 0],
  shop: [192, 0],
  station: [256, 0],
  policecar: [320, 0],
  car: [0, 64],
  officer: [64, 64],
  civilian: [128, 64],
  bike: [192, 64],
  lamp: [256, 64],
  bush: [320, 64],
} as const;

type SpriteName = keyof typeof SPRITES;

let game: GameSave = loadSave();
let started = false;
let patrolActive = false;
let toastTime = 0;
let previousTime = 0;

const keys = new Set<string>();
const touchDirections = new Set<string>();

function loadSave(): GameSave {
  try {
    const raw = localStorage.getItem(SAVE_KEY);

    if (raw) {
      const data = JSON.parse(raw) as Partial<GameSave>;

      return {
        ...DEFAULT_SAVE,
        ...data,
        completed: Array.isArray(data.completed)
          ? data.completed.filter((id): id is string =>
              typeof id === 'string' &&
              missions.some((m) => m.id === id),
            )
          : [],
      };
    }
  } catch {
    // Gunakan simpanan lalai jika data tidak sah.
  }

  return { ...DEFAULT_SAVE, completed: [] };
}

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Elemen #app tidak dijumpai dalam index.html.');
}

app.innerHTML = `
<div class="mpv">
  <header class="topbar">
    <div class="brand">
      <div class="crest">MP</div>
      <div>
        <small>SIMULASI PENGUATKUASAAN</small>
        <h1>MALAYSIAN POLICE <span>VIRTUAL</span></h1>
      </div>
    </div>

    <div class="stats">
      <span>WANG <b id="cash">RM500</b></span>
      <span>XP <b id="xp">0</b></span>
      <span>PANGKAT <b id="rank">Konstabel</b></span>
      <button id="fullscreen" title="Skrin penuh">⛶</button>
    </div>
  </header>

  <main class="layout">
    <section class="gamecard">
      <div class="worldbar">
        <span>● BANDAR MALAYSIA</span>
        <span id="status">SYIF BELUM BERMULA</span>
      </div>

      <div class="stage">
        <canvas id="world" aria-label="Bandar pixel art"></canvas>

        <div id="toast" role="status"></div>

        <div class="intro" id="intro">
          <div class="introcard">
            <small>UNIT RONDAAN</small>
            <h2>Selamat bertugas, anggota.</h2>
            <p>
              Jelajah bandar, bantu orang awam dan selesaikan
              tugasan untuk mendapatkan ganjaran.
            </p>
            <ul>
              <li>Gerak menggunakan WASD, anak panah atau butang sentuh.</li>
              <li>Dekati penanda kuning dan tekan INTERAKSI.</li>
              <li>Selesaikan tugasan untuk menaikkan pangkat.</li>
            </ul>
            <button class="primary" id="start">MULA BERTUGAS</button>
          </div>
        </div>

        <div class="controls">
          <div class="dpad">
            <button data-dir="up">▲</button>
            <div>
              <button data-dir="left">◀</button>
              <button data-dir="down">▼</button>
              <button data-dir="right">▶</button>
            </div>
          </div>

          <div class="actions">
            <button id="interact">INTERAKSI</button>
            <button id="patrol">MULA RONDA</button>
            <button id="save">SIMPAN</button>
          </div>
        </div>
      </div>

      <div class="foot">
        <span id="missionText">Mulakan syif untuk menerima tugasan.</span>
        <span id="position">X: 600 • Y: 440</span>
      </div>
    </section>

    <aside class="sidebar">
      <section class="panel">
        <small>PROFIL ANGGOTA</small>
        <h2 id="rankLabel">Konstabel</h2>
        <div class="xpinfo">
          <span>KEMAJUAN XP</span>
          <b id="xpLabel">0 XP</b>
        </div>
        <div class="bar"><i id="xpbar"></i></div>
        <div class="balance">
          <small>BAKI WANG</small>
          <b id="cashLarge">RM 500</b>
        </div>
      </section>

      <section class="panel">
        <div class="sectionhead">
          <small>SENARAI TUGASAN</small>
          <b id="missionCount">0/4</b>
        </div>
        <div id="missionList"></div>
      </section>

      <section class="panel">
        <small>AKSI PANTAS</small>
        <div class="quick">
          <button id="help">CARA BERMAIN</button>
          <button id="reset">RESET PERMAINAN</button>
        </div>
        <p class="hint">Simpanan disimpan pada pelayar peranti ini.</p>
      </section>
    </aside>
  </main>

  <footer>
    <span>MPV • PROTOTAIP WEB</span>
    <span>Pemain tunggal • Kawalan sentuh dan papan kekunci</span>
  </footer>

  <div class="modal hidden" id="modal">
    <div class="modalcard">
      <button class="close" id="closeModal">×</button>
      <h2 id="modalTitle">Maklumat</h2>
      <div id="modalBody"></div>
      <button class="primary" id="modalOk">TUTUP</button>
    </div>
  </div>
</div>
`;

const style = document.createElement('style');

style.textContent = `
*{box-sizing:border-box}
html,body,#app{margin:0;min-height:100%;background:#0b151d;color:#edf4f5;font-family:Arial,system-ui,sans-serif}
body{min-width:320px}
button{font:inherit;font-weight:800;cursor:pointer;touch-action:manipulation}
button:active{transform:scale(.97)}
.mpv{max-width:1800px;margin:auto;padding:12px}
.topbar{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:5px 0 14px;border-bottom:1px solid #30454f}
.brand{display:flex;align-items:center;gap:12px}
.crest{display:grid;place-items:center;width:44px;height:48px;background:#173c52;border:2px solid #d9bb62;clip-path:polygon(8% 0,92% 0,100% 72%,50% 100%,0 72%);font-weight:900;color:#f3d77d}
.brand small,.panel>small,.sectionhead small{font-size:9px;letter-spacing:.14em;color:#92abb5}
.brand h1{font-size:17px;margin:5px 0 0}
.brand h1 span{color:#e4c771}
.stats{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.stats span{padding:8px;background:#152a35;border:1px solid #2c4551;border-radius:6px;font-size:8px;color:#9bb4bd}
.stats b{display:block;margin-top:4px;color:#f0d681;font:700 12px monospace}
.stats button{padding:8px;background:#1c3542;border:1px solid #405c68;color:white;border-radius:6px}
.layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:12px;padding-top:12px}
.gamecard,.panel{background:#132630;border:1px solid #2b4551;border-radius:9px;overflow:hidden}
.worldbar{display:flex;justify-content:space-between;gap:8px;padding:10px 12px;background:#0e1d26;border-bottom:1px solid #2b4551;font:700 9px monospace;color:#e4c771}
.worldbar span:last-child{color:#9bb5be}
.stage{position:relative}
#world{display:block;width:100%;height:min(70vh,760px);min-height:340px;background:#51784d;image-rendering:pixelated;touch-action:none}
.controls{position:absolute;bottom:12px;left:12px;right:12px;display:flex;justify-content:space-between;align-items:end;pointer-events:none}
.dpad,.actions{pointer-events:auto}
.dpad{display:flex;flex-direction:column;align-items:center;gap:4px}
.dpad>div{display:flex;gap:4px}
.dpad button{width:43px;height:38px;padding:0;background:#102832eF;border:1px solid #8ca0a5;color:white;font-size:16px}
.actions{display:flex;flex-direction:column;gap:6px}
.actions button{padding:10px 12px;background:#132b38eF;color:#fff;border:1px solid #80969c;border-radius:6px;font-size:9px}
.actions button:first-child,.primary{background:#e4c66e;color:#17252b;border-color:#f3db92}
.foot{display:flex;justify-content:space-between;gap:10px;padding:10px 12px;font-size:9px;color:#9bb2ba}
.sidebar{display:flex;flex-direction:column;gap:10px;min-width:0}
.panel{padding:13px}
.panel h2{font-size:17px;margin:10px 0;color:#e8d18a}
.xpinfo{display:flex;justify-content:space-between;margin:15px 0 6px;font-size:9px;color:#99b1ba}
.xpinfo b{color:#e9d287}
.bar{height:6px;background:#08151c;border-radius:5px;overflow:hidden}
.bar i{display:block;height:100%;width:0;background:#e4c66e}
.balance{margin-top:13px;padding:10px;background:#0d1e27;border-radius:6px}
.balance small{display:block;color:#99b1ba;font-size:8px}
.balance b{display:block;margin-top:5px;color:#f0d681;font:700 18px monospace}
.sectionhead{display:flex;justify-content:space-between;margin-bottom:10px}
.sectionhead b{color:#e9d287;font:700 11px monospace}
.mission{display:flex;gap:7px;align-items:center;margin-top:6px;padding:8px;background:#0d1e27;border:1px solid #2b4551;border-radius:6px}
.mission.done{opacity:.55}
.mission .mark{display:grid;place-items:center;width:25px;height:25px;flex:0 0 25px;background:#294652;border-radius:5px}
.mission .copy{flex:1;min-width:0}
.mission strong{display:block;font-size:9px;line-height:1.4}
.mission small{display:block;margin-top:4px;color:#9ab0b8;font-size:8px}
.mission em{color:#e9d287;font:700 9px monospace;font-style:normal}
.quick{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px}
.quick button{padding:10px 5px;background:#1a3541;border:1px solid #405965;color:white;font-size:9px}
.hint{font-size:9px;color:#91a9b2;line-height:1.5}
.intro{position:absolute;inset:0;z-index:3;display:grid;place-items:center;padding:16px;background:#07131bd9}
.introcard{width:min(420px,100%);padding:22px;background:#142a35;border:1px solid #627a83;border-radius:10px;box-shadow:0 16px 50px #0008}
.introcard>small{color:#e7cc78;font-size:9px;letter-spacing:.14em}
.introcard h2{font-size:22px;margin:12px 0}
.introcard p,.introcard li{color:#bfd0d4;font-size:12px;line-height:1.7}
.introcard ul{padding-left:18px}
.primary{width:100%;padding:12px;border-radius:6px}
#toast{display:none;position:absolute;top:12px;left:50%;transform:translateX(-50%);z-index:5;max-width:90%;padding:10px 14px;background:#e4c66e;color:#15252b;border-radius:6px;text-align:center;font-size:11px;font-weight:800}
.modal{position:fixed;inset:0;z-index:10;display:grid;place-items:center;padding:16px;background:#02090ddc}
.modal.hidden{display:none}
.modalcard{position:relative;width:min(480px,100%);max-height:85vh;overflow:auto;padding:23px;background:#152b36;border:1px solid #4e6974;border-radius:10px}
.modalcard h2{margin-top:0;font-size:20px}
.modalcard p,.modalcard li{font-size:12px;line-height:1.7;color:#c2d1d5}
.close{position:absolute;right:12px;top:9px;background:transparent;border:0;color:white;font-size:24px}
footer{display:flex;justify-content:space-between;gap:8px;padding:12px 2px;color:#718b95;font:8px monospace}
@media(max-width:900px){.layout{grid-template-columns:1fr}.sidebar{display:grid;grid-template-columns:1fr 1fr}.sidebar>.panel:first-child{grid-column:1/-1}#world{height:58vh;min-height:320px}}
@media(max-width:560px){.mpv{padding:7px}.brand{gap:8px}.brand h1{font-size:11px}.brand small{font-size:7px}.crest{width:34px;height:38px}.stats{gap:4px}.stats span{padding:6px;font-size:7px}.stats b{font-size:10px}.stats button{padding:6px}.sidebar{grid-template-columns:1fr}.sidebar>.panel:first-child{grid-column:auto}#world{height:53vh;min-height:290px}.dpad button{width:36px;height:33px}.actions button{padding:9px 8px;font-size:8px}.introcard{padding:17px}.introcard h2{font-size:19px}.foot{font-size:8px}footer{flex-direction:column;font-size:7px}}
@media(orientation:landscape) and (max-height:600px){#world{height:65vh;min-height:220px}.mpv{padding:5px}.topbar{padding-bottom:6px}.layout{padding-top:6px}}
`;

document.head.appendChild(style);

const canvas = document.querySelector<HTMLCanvasElement>('#world')!;
const ctx = canvas.getContext('2d')!;

const $ = (id: string) => document.getElementById(id)!;

// Gunakan BASE_URL supaya atlas berfungsi di GitHub Pages subfolder.
const atlas = new Image();
atlas.src = '/Malaysian-Police-Virtual/mpv-pixel-atlas.svg';

let atlasReady = false;
atlas.onload = () => {
  atlasReady = true;
};
atlas.onerror = () => {
  atlasReady = false;
  notify('Atlas grafik gagal dimuat. Semak lokasi fail public.');
};

function notify(message: string) {
  const el = $('toast');
  el.textContent = message;
  el.style.display = 'block';
  toastTime = 3;
}

function persist() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    notify('Permainan berjaya disimpan.');
  } catch {
    notify('Simpanan pelayar tidak tersedia.');
  }
  updateHUD();
}

function updateHUD() {
  const ranks = [
    [0, 'Konstabel'],
    [100, 'Lans Koperal'],
    [300, 'Koperal'],
    [600, 'Sarjan'],
    [1000, 'Sarjan Mejar'],
    [1600, 'Inspektor'],
  ] as const;

  const rank = [...ranks].reverse().find((r) => game.xp >= r[0]) ?? ranks[0];
  const next = ranks.find((r) => r[0] > game.xp);

  $('cash').textContent = `RM${game.cash.toLocaleString('en-MY')}`;
  $('cashLarge').textContent = `RM ${game.cash.toLocaleString('en-MY')}`;
  $('xp').textContent = String(game.xp);
  $('rank').textContent = rank[1];
  $('rankLabel').textContent = rank[1];
  $('xpLabel').textContent = next ? `${game.xp}/${next[0]} XP` : 'PANGKAT MAKSIMUM';
  $('xpbar').style.width = next
    ? `${Math.min(100, (game.xp / next[0]) * 100)}%`
    : '100%';

  const completed = missions.filter((m) => game.completed.includes(m.id)).length;
  $('missionCount').textContent = `${completed}/${missions.length}`;

  const nextMission = missions.find((m) => !game.completed.includes(m.id));
  $('missionText').textContent = nextMission
    ? `Tugasan: ${nextMission.title}`
    : 'Semua tugasan selesai!';

  $('missionList').innerHTML = missions
    .map((m) => {
      const done = game.completed.includes(m.id);
      return `
        <div class="mission ${done ? 'done' : ''}">
          <span class="mark">${done ? '✓' : '!'}</span>
          <span class="copy">
            <strong>${m.title}</strong>
            <small>${done ? 'TUGASAN SELESAI' : m.description}</small>
          </span>
          <em>${done ? 'OK' : `RM${m.reward}`}</em>
        </div>`;
    })
    .join('');
}

function sprite(
  name: SpriteName,
  x: number,
  y: number,
  width = 64,
  height = 64,
) {
  const [sx, sy] = SPRITES[name];

  if (atlasReady) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(atlas, sx, sy, 64, 64, x, y, width, height);
    ctx.restore();
    return;
  }

  // Bentuk sementara jika atlas belum siap dimuat.
  ctx.fillStyle = name === 'officer' ? '#244d70' : '#426e48';
  ctx.fillRect(x, y, width, height);
}

function label(text: string, x: number, y: number, size = 12) {
  ctx.font = `bold ${size}px monospace`;
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#172021';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = '#fff4d5';
  ctx.fillText(text, x, y);
}

function road(x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#343a3d';
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = '#d7c46e';
  ctx.lineWidth = 3;
  ctx.setLineDash([22, 20]);
  ctx.beginPath();

  if (w > h) {
    ctx.moveTo(x, y + h / 2);
    ctx.lineTo(x + w, y + h / 2);
  } else {
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w / 2, y + h);
  }

  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#c4b99d';

  if (w > h) {
    ctx.fillRect(x, y - 7, w, 7);
    ctx.fillRect(x, y + h, w, 7);
  } else {
    ctx.fillRect(x - 7, y, 7, h);
    ctx.fillRect(x + w, y, 7, h);
  }
}

function building(
  x: number,
  y: number,
  w: number,
  h: number,
  name: SpriteName,
  title: string,
) {
  ctx.fillStyle = '#1c2828';
  ctx.fillRect(x + 7, y + 8, w, h);

  sprite(name, x, y, w, h);

  if (title) label(title, x + w / 2, y + h + 17, 10);
}

function drawCar(x: number, y: number, police: boolean) {
  sprite(police ? 'policecar' : 'car', x - 32, y - 32, 64, 64);
}

function drawPerson(x: number, y: number, police: boolean) {
  sprite(police ? 'officer' : 'civilian', x - 24, y - 30, 48, 60);
}

function drawTree(x: number, y: number, palm = false) {
  sprite(palm ? 'palm' : 'tree', x - 32, y - 32, 64, 64);
}

function drawMap(time: number) {
  ctx.fillStyle = '#5c8054';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  // Corak rumput.
  for (let y = 0; y < WORLD_H; y += 48) {
    for (let x = 0; x < WORLD_W; x += 48) {
      if (((x / 48 + y / 48) % 3) === 0) {
        ctx.fillStyle = '#638858';
        ctx.fillRect(x, y, 46, 46);
      }
    }
  }

  // Jalan bandar.
  road(0, 390, WORLD_W, 170);
  road(500, 0, 150, WORLD_H);
  road(1150, 0, 145, WORLD_H);
  road(0, 780, WORLD_W, 125);

  // Garisan lintasan pejalan kaki.
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = '#e6c24e';
    ctx.fillRect(458 + i * 15, 355, 8, 31);
    ctx.fillRect(458 + i * 15, 565, 8, 31);
    ctx.fillRect(464 + i * 15, 745, 8, 28);
  }

  // Kedai dan bangunan bandar.
  building(20, 110, 145, 180, 'shop', 'KEDAI RUNCIT');
  building(175, 110, 145, 180, 'shop', 'RESTORAN');
  building(330, 110, 145, 180, 'shop', 'KLINIK');

  building(710, 50, 175, 145, 'house', 'RUMAH');
  building(900, 45, 200, 150, 'shop', 'KEDAI');
  building(1350, 65, 195, 180, 'station', 'BALAI POLIS');

  building(1350, 570, 175, 130, 'house', 'RUMAH');
  building(1545, 570, 180, 130, 'house', 'RUMAH');
  building(720, 595, 155, 120, 'shop', 'KEDAI');

  // Tempat letak kenderaan di balai polis.
  ctx.fillStyle = '#626965';
  ctx.fillRect(1320, 260, 425, 100);

  for (let x = 1340; x < 1715; x += 100) {
    ctx.strokeStyle = '#e1c04b';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, 270, 78, 76);
  }

  drawCar(1380, 308, true);
  drawCar(1480, 308, true);
  drawCar(1580, 308, true);

  // Pokok dan landskap.
  for (let i = 0; i < 48; i++) {
    const x = 30 + ((i * 173) % 1730);
    const y = 25 + ((i * 137) % 1020);

    if (
      (x > 490 && x < 660) ||
      (x > 1140 && x < 1310) ||
      (y > 385 && y < 570) ||
      (x > 1300 && y < 365)
    ) {
      continue;
    }

    drawTree(x, y, i % 5 === 0);
  }

  // Lampu jalan.
  for (const [x, y] of [
    [90, 365],
    [270, 365],
    [420, 365],
    [720, 365],
    [960, 365],
    [1080, 365],
    [1320, 365],
    [1740, 365],
  ]) {
    sprite('lamp', x - 16, y - 25, 32, 48);
  }

  // Kenderaan di jalan.
  drawCar(390, 475, false);
  drawCar(780, 475, true);
  drawCar(1010, 475, false);
  drawCar(1440, 830, false);

  // Orang awam dan anggota.
  drawPerson(390, 325, false);
  drawPerson(735, 285, true);
  drawPerson(1060, 280, true);
  drawPerson(1260, 420, true);

  // Penanda misi beranimasi.
  for (const m of missions) {
    if (game.completed.includes(m.id)) continue;

    const pulse = Math.sin(time / 180) * 5;

    ctx.fillStyle = '#eac94f';
    ctx.beginPath();
    ctx.arc(m.x, m.y - 16 + pulse, 16, 0, Math.PI * 2);
    ctx.fill();

    label('!', m.x, m.y - 10 + pulse, 17);
    label('TUGASAN', m.x, m.y - 40 + pulse, 9);
  }

  // Anggota pemain sentiasa di lapisan paling atas.
  drawPerson(game.x, game.y, true);

  // Petunjuk apabila dekat dengan tugasan.
  const near = nearestMission();

  if (near && near.distance < 115) {
    ctx.fillStyle = '#102832';
    ctx.fillRect(game.x - 82, game.y - 68, 164, 24);
    label('TEKAN INTERAKSI', game.x, game.y - 52, 10);
  }

  // Mini-peta.
  drawMinimap();
}

function drawMinimap() {
  const x = 18;
  const y = 18;
  const w = 154;
  const h = 100;

  ctx.fillStyle = '#18272b';
  ctx.fillRect(x - 5, y - 5, w + 10, h + 10);

  ctx.fillStyle = '#587e52';
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = '#343b3d';

  for (let i = 0; i < 6; i++) {
    ctx.fillRect(x, y + i * 18, w, 4);
    ctx.fillRect(x + i * 28, y, 4, h);
  }

  for (const m of missions) {
    if (game.completed.includes(m.id)) continue;

    ctx.fillStyle = '#f0cf4f';
    ctx.fillRect(
      x + (m.x / WORLD_W) * w,
      y + (m.y / WORLD_H) * h,
      5,
      5,
    );
  }

  ctx.fillStyle = '#fff';
  ctx.fillRect(
    x + (game.x / WORLD_W) * w - 2,
    y + (game.y / WORLD_H) * h - 2,
    6,
    6,
  );

  label('N', x + 12, y + 13, 10);
}

function nearestMission() {
  return missions
    .filter((m) => !game.completed.includes(m.id))
    .map((m) => ({
      mission: m,
      distance: Math.hypot(m.x - game.x, m.y - game.y),
    }))
    .sort((a, b) => a.distance - b.distance)[0];
}

function interact() {
  if (!started) {
    notify('Tekan MULA BERTUGAS dahulu.');
    return;
  }

  const near = nearestMission();

  if (near && near.distance < 95) {
    const m = near.mission;

    // Elakkan ganjaran berganda untuk tugasan yang sama.
    if (game.completed.includes(m.id)) return;

    game.completed.push(m.id);
    game.cash += m.reward;
    game.xp += 100;

    updateHUD();
    persist();

    notify(`Tugasan selesai! +RM${m.reward} dan +100 XP.`);
    return;
  }

  notify('Dekati penanda kuning untuk menyelesaikan tugasan.');
}

function togglePatrol() {
  if (!started) {
    notify('Mulakan syif dahulu.');
    return;
  }

  patrolActive = !patrolActive;
  $('patrol').textContent = patrolActive ? 'TAMATKAN RONDA' : 'MULA RONDA';

  if (patrolActive) {
    game.patrols += 1;
    game.xp += 10;
    notify('Rondaan bermula. Cari penanda tugasan.');
    persist();
  } else {
    notify('Rondaan ditamatkan.');
  }
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
}

window.addEventListener('resize', resize);
resize();

$('start').addEventListener('click', () => {
  started = true;
  $('intro').style.display = 'none';
  $('status').textContent = 'SYIF AKTIF';
  notify('Syif bermula. Semoga berjaya, anggota!');
});

$('interact').addEventListener('click', interact);
$('patrol').addEventListener('click', togglePatrol);
$('save').addEventListener('click', persist);

$('fullscreen').addEventListener('click', async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch {
    notify('Skrin penuh tidak disokong oleh pelayar ini.');
  }
});

$('help').addEventListener('click', () => {
  $('modalTitle').textContent = 'Cara bermain';
  $('modalBody').innerHTML = `
    <ul>
      <li>Gunakan WASD, anak panah atau butang sentuh untuk bergerak.</li>
      <li>Dekati penanda kuning dan tekan INTERAKSI.</li>
      <li>Selesaikan tugasan untuk mendapatkan wang dan XP.</li>
      <li>MULA RONDA mengaktifkan rondaan.</li>
      <li>SIMPAN merekodkan kedudukan dan tugasan pada peranti.</li>
    </ul>`;
  $('modal').classList.remove('hidden');
});

$('closeModal').addEventListener('click', () => {
  $('modal').classList.add('hidden');
});
$('modalOk').addEventListener('click', () => {
  $('modal').classList.add('hidden');
});

$('reset').addEventListener('click', () => {
  $('modalTitle').textContent = 'Reset permainan?';
  $('modalBody').innerHTML = `
    <p>Wang, XP, kedudukan dan kemajuan tugasan akan dipadam.</p>
    <button class="primary" id="confirmReset">YA, RESET</button>`;
  $('modal').classList.remove('hidden');
});

$('modalBody').addEventListener('click', (event) => {
  const target = event.target as HTMLElement;

  if (target.id !== 'confirmReset') return;

  game = { ...DEFAULT_SAVE, completed: [] };
  started = false;
  patrolActive = false;

  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {}

  $('intro').style.display = 'grid';
  $('status').textContent = 'SYIF BELUM BERMULA';
  $('patrol').textContent = 'MULA RONDA';
  $('modal').classList.add('hidden');

  updateHUD();
  notify('Permainan telah direset.');
});

document.querySelectorAll<HTMLButtonElement>('[data-dir]').forEach((button) => {
  const dir = button.dataset.dir!;

  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    touchDirections.add(dir);
  });

  const release = () => touchDirections.delete(dir);

  button.addEventListener('pointerup', release);
  button.addEventListener('pointerleave', release);
  button.addEventListener('pointercancel', release);
});

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();

  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
    event.preventDefault();
  }

  keys.add(key);

  if (!event.repeat && (key === 'e' || key === ' ')) interact();
  if (!event.repeat && key === 'p') togglePatrol();
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.key.toLowerCase());
});

window.addEventListener('blur', () => {
  keys.clear();
  touchDirections.clear();
});

function frame(time: number) {
  const dt = Math.min((time - previousTime) / 1000 || 0, 0.05);
  previousTime = time;

  if (toastTime > 0) {
    toastTime -= dt;
    if (toastTime <= 0) $('toast').style.display = 'none';
  }

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const dpr = canvas.width / Math.max(1, width);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (started) {
    let dx = 0;
    let dy = 0;

    if (keys.has('w') || keys.has('arrowup') || touchDirections.has('up')) dy--;
    if (keys.has('s') || keys.has('arrowdown') || touchDirections.has('down')) dy++;
    if (keys.has('a') || keys.has('arrowleft') || touchDirections.has('left')) dx--;
    if (keys.has('d') || keys.has('arrowright') || touchDirections.has('right')) dx++;

    if (dx !== 0 || dy !== 0) {
      const length = Math.hypot(dx, dy);
      const speed = patrolActive ? 150 : 190;

      game.x = Math.max(24, Math.min(WORLD_W - 24, game.x + (dx / length) * speed * dt));
      game.y = Math.max(24, Math.min(WORLD_H - 24, game.y + (dy / length) * speed * dt));
    }
  }

  const cameraX = Math.max(0, Math.min(WORLD_W - width, game.x - width / 2));
  const cameraY = Math.max(0, Math.min(WORLD_H - height, game.y - height / 2));

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(-cameraX, -cameraY);
  drawMap(time);
  ctx.restore();

  $('position').textContent = `X: ${Math.round(game.x)} • Y: ${Math.round(game.y)}`;

  requestAnimationFrame(frame);
}

updateHUD();
requestAnimationFrame(frame);
