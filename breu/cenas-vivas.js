// Cenários vivos de Breu: desenhados em código, com vento, a luz da noite e som sintetizado.
// Um cenário por vez na tela (o mapa só mostra uma cena).
let ctx = null;
const W = 1500, H = 1000;
let olhosLigados = false;
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let R = rng(7);
const rr = (a, b) => a + R() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;

// ---------------- luz da noite (igual para todos os cenários) ----------------
const FASES = [
  { n: 'Tarde', h: 0.00, escuro: 0.00, tom: [255, 230, 190], tomA: 0.06, sombra: 26, sol: -0.9, noite: [10, 14, 30] },
  { n: 'Entardecer', h: 0.14, escuro: 0.10, tom: [255, 120, 50], tomA: 0.22, sombra: 70, sol: -0.35, noite: [40, 14, 20] },
  { n: 'Crepúsculo', h: 0.28, escuro: 0.52, tom: [150, 60, 110], tomA: 0.20, sombra: 95, sol: -0.15, noite: [30, 12, 40] },
  { n: 'Breu', h: 0.44, escuro: 0.80, tom: [40, 60, 120], tomA: 0.12, sombra: 0, sol: 0, noite: [6, 10, 26] },
  { n: 'Hora Morta', h: 0.62, escuro: 0.90, tom: [40, 90, 70], tomA: 0.10, sombra: 0, sol: 0, noite: [3, 8, 10] },
  { n: 'Antes da aurora', h: 0.80, escuro: 0.78, tom: [60, 70, 120], tomA: 0.12, sombra: 0, sol: 0, noite: [10, 12, 30] },
  { n: 'Aurora', h: 0.92, escuro: 0.22, tom: [255, 160, 140], tomA: 0.22, sombra: 80, sol: 2.9, noite: [60, 30, 40] },
];
function luzEm(h) {
  let i = FASES.length - 1;
  for (let k = 0; k < FASES.length - 1; k++) if (h >= FASES[k].h && h < FASES[k + 1].h) { i = k; break; }
  const A = FASES[i], B = FASES[Math.min(i + 1, FASES.length - 1)];
  const t = B === A ? 0 : Math.min(1, (h - A.h) / (B.h - A.h)), s = t * t * (3 - 2 * t);
  return { nome: A.n, i, escuro: lerp(A.escuro, B.escuro, s), tom: A.tom.map((v, j) => lerp(v, B.tom[j], s)), tomA: lerp(A.tomA, B.tomA, s), sombra: lerp(A.sombra, B.sombra, s), sol: lerp(A.sol, B.sol, s), noite: A.noite.map((v, j) => lerp(v, B.noite[j], s)) };
}
let vento = 0.45;
const rajada = t => vento * (0.6 + 0.4 * Math.sin(t * 0.37) * Math.sin(t * 0.11 + 1));
const tremor = (t, k) => 1 + 0.08 * Math.sin(t * 13 + k) + 0.05 * Math.sin(t * 29 + k * 2);

// ---------------- peças de desenho compartilhadas ----------------
function pintarChao(g, base) {
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 1600; i++) {
    const x = R() * W, y = R() * H, r = 6 + R() * 60;
    g.fillStyle = R() > .5 ? `rgba(120,82,44,${R() * .12})` : `rgba(214,182,128,${R() * .12})`;
    g.beginPath(); g.ellipse(x, y, r, r * (.5 + R() * .5), R() * 3, 0, 7); g.fill();
  }
  g.strokeStyle = 'rgba(70,45,22,.35)'; g.lineWidth = 1;
  for (let i = 0; i < 260; i++) { let x = R() * W, y = R() * H; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (R() - .5) * 26; y += (R() - .5) * 26; g.lineTo(x, y); } g.stroke(); }
}
function pintarEstrada(g, fn, len) {
  for (let pass = 0; pass < 3; pass++) {
    g.strokeStyle = ['rgba(120,62,36,.55)', 'rgba(156,88,52,.9)', 'rgba(176,108,64,.6)'][pass];
    g.lineWidth = [96, 78, 40][pass]; g.lineCap = 'round'; g.beginPath();
    for (let s = -40; s <= len + 40; s += 20) { const p = fn(s); s < -30 ? g.moveTo(p[0], p[1]) : g.lineTo(p[0], p[1]); }
    g.stroke();
  }
  g.strokeStyle = 'rgba(92,48,26,.5)'; g.lineWidth = 3;
  [-14, 14].forEach(off => { g.beginPath(); for (let s = -40; s <= len + 40; s += 20) { const p = fn(s), q = fn(s + 1), nx = -(q[1] - p[1]), ny = q[0] - p[0], m = Math.hypot(nx, ny) || 1; const x = p[0] + nx / m * off, y = p[1] + ny / m * off; s < -30 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); });
}
function pintarPedrinhas(g, n) {
  for (let i = 0; i < n; i++) { const x = R() * W, y = R() * H, r = 2 + R() * 4; g.fillStyle = 'rgba(90,80,70,.55)'; g.beginPath(); g.ellipse(x, y, r, r * .7, R() * 3, 0, 7); g.fill(); g.fillStyle = 'rgba(220,210,190,.25)'; g.beginPath(); g.ellipse(x - r * .3, y - r * .3, r * .4, r * .25, 0, 0, 7); g.fill(); }
}

function moita(m, t, L) {
  const v = rajada(t), s = Math.sin(t * 1.6 + m.f) * v * 3.5 + v * 2.5;
  if (L.sombra > 1) { ctx.fillStyle = 'rgba(40,22,10,.22)'; ctx.beginPath(); ctx.ellipse(m.x + Math.cos(L.sol) * m.r * .9, m.y + m.r * .5, m.r, m.r * .6, 0, 0, 7); ctx.fill(); }
  const base = m.tom > .5 ? [96, 104, 66] : [120, 112, 70];
  for (let k = 0; k < 5; k++) {
    const a = k * 1.3 + m.f, rx = m.x + Math.cos(a) * m.r * .45 + s * (k / 5), ry = m.y + Math.sin(a) * m.r * .35;
    ctx.fillStyle = `rgb(${base[0] - k * 6},${base[1] - k * 5},${base[2] - k * 4})`;
    ctx.beginPath(); ctx.arc(rx, ry, m.r * (.55 - k * .04), 0, 7); ctx.fill();
  }
  ctx.fillStyle = 'rgba(200,190,130,.18)'; ctx.beginPath(); ctx.arc(m.x - m.r * .2 + s, m.y - m.r * .25, m.r * .28, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(70,52,34,.8)'; ctx.lineWidth = 1;
  for (let k = 0; k < 4; k++) { const a = m.f + k * 1.7; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x + Math.cos(a) * m.r * 1.1 + s, m.y + Math.sin(a) * m.r * .9); ctx.stroke(); }
}
function cacto(c, L) {
  if (L.sombra > 1) { ctx.fillStyle = 'rgba(40,22,10,.25)'; ctx.beginPath(); ctx.ellipse(c.x + Math.cos(L.sol) * 22, c.y + 14, 10, 30, Math.PI / 2 + L.sol, 0, 7); ctx.fill(); }
  for (let b = 0; b < c.bracos; b++) {
    const a = c.f + b * (6.28 / c.bracos), bx = c.x + Math.cos(a) * c.r * 1.6, by = c.y + Math.sin(a) * c.r * 1.6;
    ctx.fillStyle = '#4f6b46'; ctx.beginPath(); ctx.arc(bx, by, c.r * .62, 0, 7); ctx.fill();
    ctx.strokeStyle = '#3b5236'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(bx, by, c.r * .62, 0, 7); ctx.stroke();
  }
  ctx.fillStyle = '#5c7a50'; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(30,50,30,.8)'; ctx.lineWidth = 1;
  for (let k = 0; k < 8; k++) { const a = k * .785; ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + Math.cos(a) * c.r, c.y + Math.sin(a) * c.r); ctx.stroke(); }
  ctx.fillStyle = 'rgba(230,220,160,.5)'; ctx.beginPath(); ctx.arc(c.x - 2, c.y - 2, 2, 0, 7); ctx.fill();
}
function capim(g, t) {
  const v = rajada(t), s = (Math.sin(t * 2.4 + g.f + g.x * .01) * .5 + .7) * v * 9;
  ctx.strokeStyle = g.cor > .5 ? 'rgba(170,150,86,.85)' : 'rgba(140,124,70,.85)'; ctx.lineWidth = 1.2;
  for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(g.x + k * 2, g.y); ctx.quadraticCurveTo(g.x + k * 3 + s * .4, g.y - g.h * .6, g.x + k * 4 + s, g.y - g.h); ctx.stroke(); }
}
function arvoreSeca(a, t, L) {
  const v = rajada(t);
  if (L.sombra > 1) {
    const ox = Math.cos(L.sol) * L.sombra * .7, oy = L.sombra * .35;
    ctx.strokeStyle = 'rgba(40,22,10,.22)'; ctx.lineCap = 'round';
    a.galhos.forEach(gh => { ctx.lineWidth = gh.w; ctx.beginPath(); ctx.moveTo(gh.px + ox, gh.py + oy); ctx.lineTo(gh.x + ox, gh.y + oy); ctx.stroke(); });
  }
  ctx.strokeStyle = '#4a3828'; ctx.lineCap = 'round';
  a.galhos.forEach((gh, k) => {
    const s = Math.sin(t * 1.3 + k) * v * 4;
    ctx.lineWidth = gh.w; ctx.beginPath(); ctx.moveTo(gh.px, gh.py); ctx.quadraticCurveTo((gh.px + gh.x) / 2 + s * .5, (gh.py + gh.y) / 2, gh.x + s, gh.y + s * .3); ctx.stroke();
  });
  ctx.fillStyle = '#3b2c20'; ctx.beginPath(); ctx.arc(a.x, a.y, 9, 0, 7); ctx.fill();
}

function sombraRet(x, y, ang, w, h, L) {
  if (L.sombra < 1) return;
  const dx = Math.cos(L.sol) * L.sombra, dy = Math.sin(L.sol) * L.sombra * .6 + L.sombra * .25;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  const cs = Math.cos(-ang), sn = Math.sin(-ang), ox = dx * cs - dy * sn, oy = dx * sn + dy * cs;
  w = w / 2 + 3; h = h / 2 + 3;
  ctx.fillStyle = 'rgba(40,22,10,.32)';
  ctx.beginPath(); ctx.moveTo(-w, -h); ctx.lineTo(w, -h); ctx.lineTo(w + ox, -h + oy); ctx.lineTo(w + ox, h + oy); ctx.lineTo(-w + ox, h + oy); ctx.lineTo(-w, h); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function fumacaD(fontes, lista, t, dt, L) {
  fontes.forEach(f => { if (R() < f.taxa * dt * 30) lista.push({ x: f.x, y: f.y, r: f.r0 || 4, a: f.a0 || .35, cresce: f.cresce || 9, sobe: f.sobe }); });
  const v = rajada(t);
  for (let k = lista.length - 1; k >= 0; k--) {
    const p = lista[k]; if (p.sobe) { p.x -= (4 + 30 * v) * dt; p.y += 8 * dt; } else { p.x += (40 + 140 * v) * dt; p.y -= (18 - 10 * v) * dt; } p.r += p.cresce * dt; p.a -= .09 * dt;
    if (p.a <= 0) { lista.splice(k, 1); continue; }
    ctx.fillStyle = `rgba(200,195,185,${p.a * (1 - L.escuro * .5)})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
  }
}

const poeira = Array.from({ length: 140 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: .4 + Math.random(), s: 1 + Math.random() * 2 }));
function poeiraD(t, dt, L) {
  const v = rajada(t);
  ctx.fillStyle = `rgba(230,205,160,${0.35 * (1 - L.escuro)})`;
  poeira.forEach(p => { p.x += (30 + 220 * v) * p.v * dt; p.y += Math.sin(t + p.x * .01) * 12 * dt; if (p.x > W + 10) { p.x = -10; p.y = Math.random() * H; } ctx.fillRect(p.x, p.y, p.s, p.s); });
}
const vaga = Array.from({ length: 26 }, () => ({ x: 100 + Math.random() * (W - 200), y: 100 + Math.random() * (H - 200), f: Math.random() * 6.28 }));
function vagaD(L, t) {
  if (L.i < 2 || L.i > 3) return;
  vaga.forEach(v => { const x = v.x + Math.sin(t * .4 + v.f) * 30, y = v.y + Math.cos(t * .33 + v.f) * 24, a = (Math.sin(t * 2 + v.f) + 1) / 2;
    ctx.fillStyle = `rgba(220,255,140,${a * .8})`; ctx.shadowColor = 'rgba(200,255,120,1)'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, 7); ctx.fill(); });
  ctx.shadowBlur = 0;
}
function nevoa(L, t) {
  if (L.i < 4 || L.i > 5) return;
  for (let k = 0; k < 9; k++) {
    const x = ((t * 18 * (1 + vento) + k * 260) % (W + 400)) - 200, y = 120 + k * 95 + Math.sin(t * .2 + k) * 20;
    const g = ctx.createRadialGradient(x, y, 10, x, y, 220); g.addColorStop(0, 'rgba(160,190,170,.10)'); g.addColorStop(1, 'rgba(160,190,170,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, 260, 90, 0, 0, 7); ctx.fill();
  }
}
// olhos de Assombro: cada cenário diz onde eles espreitam
function olhosD(L, t, pontos, grande) {
  if (!olhosLigados) return;
  if (L.i < 2 || L.i > 5) return;
  const forca = L.i === 2 ? .45 : L.i === 5 ? .4 : 1;
  pontos.forEach((o, k) => {
    if (L.i === 2 && k > 1) return;
    if (Math.sin(t * .7 + o.f) < -0.85) return;
    const x = o.x + Math.sin(t * .2 + o.f) * 18, y = o.y + Math.cos(t * .25 + k) * 10;
    ctx.fillStyle = `rgba(255,120,40,${.85 * forca})`; ctx.shadowColor = 'rgba(255,90,30,.9)'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(x - 4, y, 2.2, 0, 7); ctx.arc(x + 4, y, 2.2, 0, 7); ctx.fill();
  });
  ctx.shadowBlur = 0;
  if (L.i === 4 && grande) {
    const x = grande.x + Math.sin(t * .12) * grande.vai, y = grande.y + Math.cos(t * .1) * 20;
    const g = ctx.createRadialGradient(x, y, 10, x, y, 80); g.addColorStop(0, 'rgba(0,0,0,.75)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, 90, 60, .3, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,60,20,.9)'; ctx.shadowColor = 'rgba(255,60,20,1)'; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(x - 9, y - 4, 3, 0, 7); ctx.arc(x + 9, y - 4, 3, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  }
}

// escuridão com furos de luz
const escCv = document.createElement('canvas'); escCv.width = W; escCv.height = H; const ec = escCv.getContext('2d');
function escuridao(L, lista) {
  if (L.escuro < 0.02) return;
  ec.globalCompositeOperation = 'source-over'; ec.clearRect(0, 0, W, H);
  ec.fillStyle = `rgba(${L.noite.map(Math.round).join(',')},${L.escuro})`; ec.fillRect(0, 0, W, H);
  ec.globalCompositeOperation = 'destination-out';
  lista.forEach(l => { const g = ec.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r); g.addColorStop(0, `rgba(0,0,0,${l.forca})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ec.fillStyle = g; ec.beginPath(); ec.arc(l.x, l.y, l.r, 0, 7); ec.fill(); });
  ctx.drawImage(escCv, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  lista.forEach(l => { const g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r * .8); g.addColorStop(0, `rgba(${l.cor.join(',')},${.22 * L.escuro})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(l.x, l.y, l.r * .8, 0, 7); ctx.fill(); });
  ctx.globalCompositeOperation = 'source-over';
}

// vegetação espalhada, evitando o que o cenário mandar evitar
function espalhar(livre, nMoitas, nCactos, nCapins) {
  const moitas = [], cactos = [], capins = [];
  for (let n = 0; n < nMoitas * 14 && moitas.length < nMoitas; n++) { const x = rr(0, W), y = rr(0, H); if (livre(x, y, 'moita')) moitas.push({ x, y, r: rr(16, 42), f: R() * 6.28, tom: R() }); }
  for (let n = 0; n < nCactos * 30 && cactos.length < nCactos; n++) { const x = rr(0, W), y = rr(0, H); if (livre(x, y, 'cacto')) cactos.push({ x, y, r: rr(9, 14), bracos: 2 + Math.floor(R() * 3), f: R() * 6.28 }); }
  for (let n = 0; n < nCapins * 6 && capins.length < nCapins; n++) { const x = rr(0, W), y = rr(0, H); if (livre(x, y, 'capim')) capins.push({ x, y, h: rr(6, 15), f: R() * 6.28, cor: R() }); }
  return { moitas, cactos, capins };
}

// ================= CENÁRIO 2: A VILA DE LUTO =================
function cenaVila() {
  R = rng(7);
  const C = { x: 760, y: 500 }, RAIO = 395, GAP = { a: -0.42, b: -0.12 };
  const estradaY = x => C.y + 10 + Math.sin(x / 260) * 30 + (x - C.x) * 0.06;
  const estradaX = y => C.x + 60 + Math.sin(y / 200) * 24 - (y - C.y) * 0.08;
  const casas = [];
  [[C.x - 250, C.y - 170, 0.08], [C.x - 70, C.y - 245, -0.04], [C.x + 120, C.y - 220, 0.05], [C.x + 255, C.y - 70, -0.06], [C.x + 230, C.y + 140, 0.04], [C.x + 40, C.y + 250, -0.03], [C.x - 150, C.y + 225, 0.06], [C.x - 290, C.y + 150, -0.05], [C.x - 330, C.y - 20, 0.1]]
    .forEach(([x, y, ang], i) => { const velorio = i === 4; casas.push({ x, y, ang, w: velorio ? 120 : rr(78, 104), h: velorio ? 86 : rr(58, 76), telha: velorio || R() > 0.45, velorio, i }); });
  const fogueira = { x: C.x - 40, y: C.y + 60 }, poco = { x: C.x + 30, y: C.y - 30 };
  const naEstrada = (x, y) => Math.abs(y - estradaY(x)) < 46 || Math.abs(x - estradaX(y)) < 40;
  const veg = espalhar((x, y, tipo) => {
    if (naEstrada(x, y) || Math.hypot(x - C.x, y - C.y) < 150) return false;
    if (casas.some(c => Math.hypot(x - c.x, y - c.y) < (tipo === 'capim' ? 60 : 95))) return false;
    const dentro = Math.hypot(x - C.x, y - C.y) < RAIO - 20;
    if (tipo === 'cacto') return !dentro && Math.hypot(x - C.x, y - C.y) > RAIO + 20;
    if (tipo === 'moita' && dentro) return R() < .25;
    return true;
  }, 70, 14, 420);
  const traco = []; for (let a = 0; a < Math.PI * 2; a += 0.012) traco.push({ a, r: RAIO + Math.sin(a * 9) * 4 + (R() - .5) * 3 });
  const glifos = []; for (let k = 0; k < 14; k++) glifos.push({ a: (k / 14) * Math.PI * 2 + 0.11, tipo: k % 3 });
  const naFenda = a => { let x = a % (Math.PI * 2); if (x > Math.PI) x -= Math.PI * 2; return x > GAP.a && x < GAP.b; };
  const olhos = Array.from({ length: 5 }, (_, i) => { const a = GAP.a - 0.15 + i * 0.09, d = RAIO + 70 + i * 22; return { x: C.x + Math.cos(a) * d, y: C.y + Math.sin(a) * d * .92, f: R() * 6.28 }; });
  const ga = (GAP.a + GAP.b) / 2 - .05, grande = { x: C.x + Math.cos(ga) * (RAIO + 120), y: C.y + Math.sin(ga) * (RAIO + 120) * .92, vai: 50 };
  const fumaca = [];

  function fixo(g) {
    pintarChao(g, '#a7804f');
    pintarEstrada(g, s => [s, estradaY(s)], W);
    pintarEstrada(g, s => [estradaX(s), s], H);
    const gp = g.createRadialGradient(C.x, C.y, 40, C.x, C.y, 230); gp.addColorStop(0, 'rgba(206,170,116,.9)'); gp.addColorStop(1, 'rgba(206,170,116,0)');
    g.fillStyle = gp; g.beginPath(); g.arc(C.x, C.y, 230, 0, 7); g.fill();
    g.fillStyle = 'rgba(110,74,40,.25)';
    for (let i = 0; i < 160; i++) { const a = R() * 6.28, d = R() * 190; g.beginPath(); g.ellipse(C.x + Math.cos(a) * d, C.y + Math.sin(a) * d, 4, 2.4, R() * 3, 0, 7); g.fill(); }
    pintarPedrinhas(g, 140);
  }
  function circulo(L, t) {
    const noite = Math.min(1, L.escuro * 1.2);
    ctx.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass ? `rgba(245,240,226,${0.75 + noite * .2})` : 'rgba(160,150,130,.5)'; ctx.lineWidth = pass ? 3.2 : 6;
      ctx.beginPath(); let abriu = false;
      traco.forEach(p => { if (naFenda(p.a)) { abriu = false; return; } const x = C.x + Math.cos(p.a) * p.r, y = C.y + Math.sin(p.a) * p.r * .92; abriu ? ctx.lineTo(x, y) : ctx.moveTo(x, y); abriu = true; });
      ctx.stroke();
    }
    for (let k = 0; k < 7; k++) {
      const a = GAP.a + (GAP.b - GAP.a) * (k / 6), x = C.x + Math.cos(a) * RAIO, y = C.y + Math.sin(a) * RAIO * .92;
      ctx.strokeStyle = 'rgba(235,228,210,.28)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(x + 8, y, 16, Math.PI * .55, Math.PI * 1.45); ctx.stroke();
      ctx.fillStyle = 'rgba(235,228,210,.22)'; ctx.beginPath(); ctx.arc(x + (k % 2 ? -4 : 4), y + (k % 3 - 1) * 5, 3, 0, 7); ctx.fill();
    }
    glifos.forEach(gl => {
      if (naFenda(gl.a)) return;
      const x = C.x + Math.cos(gl.a) * (RAIO - 26), y = C.y + Math.sin(gl.a) * (RAIO - 26) * .92;
      ctx.save(); ctx.translate(x, y); ctx.rotate(gl.a + Math.PI / 2);
      const brilho = noite > .3 ? 0.35 + 0.25 * Math.sin(t * 1.3 + gl.a * 3) : 0;
      if (brilho > 0) { ctx.shadowColor = `rgba(255,240,200,${brilho})`; ctx.shadowBlur = 14; }
      ctx.strokeStyle = 'rgba(245,240,226,.85)'; ctx.lineWidth = 2.6; ctx.beginPath();
      if (gl.tipo === 0) { ctx.moveTo(-2, -12); ctx.lineTo(-4, 12); ctx.moveTo(-1, -4); ctx.lineTo(10, -4); ctx.moveTo(-12, 7); ctx.lineTo(12, 7); }
      else if (gl.tipo === 1) { ctx.moveTo(0, -12); ctx.lineTo(0, 12); ctx.moveTo(-10, -9); ctx.quadraticCurveTo(-17, 0, -10, 9); ctx.moveTo(10, -9); ctx.quadraticCurveTo(17, 0, 10, 9); }
      else { ctx.moveTo(0, -12); ctx.lineTo(0, 8); ctx.moveTo(-11, -2); ctx.quadraticCurveTo(-8, 12, 0, 12); ctx.quadraticCurveTo(8, 12, 11, -2); }
      ctx.stroke(); ctx.restore();
    });
    ctx.shadowBlur = 0;
  }
  function casa(c, t) {
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.ang);
    const w = c.w, h = c.h;
    ctx.fillStyle = '#8f6a45'; ctx.fillRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6);
    if (c.telha) {
      ctx.fillStyle = '#9a4b2e'; ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.strokeStyle = 'rgba(60,24,14,.55)'; ctx.lineWidth = 1.4;
      for (let y = -h / 2 + 6; y < h / 2; y += 7) { ctx.beginPath(); for (let x = -w / 2; x < w / 2; x += 9) { ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 4.5, y + 4, x + 9, y); } ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,190,150,.08)'; ctx.fillRect(-w / 2, -h / 2, w, h / 2);
    } else {
      ctx.fillStyle = '#b49452'; ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.strokeStyle = 'rgba(96,74,30,.5)'; ctx.lineWidth = 1;
      const sway = Math.sin(t * 2 + c.i) * rajada(t) * 1.5;
      for (let x = -w / 2 + 2; x < w / 2; x += 3) { ctx.beginPath(); ctx.moveTo(x, -h / 2); ctx.lineTo(x + sway, 0); ctx.lineTo(x, h / 2); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(150,120,60,.9)';
      for (let x = -w / 2; x < w / 2; x += 4) { const s = Math.sin(t * 3 + x * .3 + c.i) * rajada(t) * 3; ctx.beginPath(); ctx.moveTo(x, h / 2); ctx.lineTo(x + s, h / 2 + 5); ctx.stroke(); }
    }
    ctx.strokeStyle = 'rgba(40,24,14,.6)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0); ctx.stroke();
    if (c.velorio) {
      ctx.fillStyle = '#2a170c'; ctx.fillRect(-w / 2 - 6, -12, 8, 24);
      ctx.fillStyle = 'rgba(255,190,90,.35)'; ctx.beginPath(); ctx.moveTo(-w / 2 - 6, -12); ctx.lineTo(-w / 2 - 46, -26); ctx.lineTo(-w / 2 - 46, 26); ctx.lineTo(-w / 2 - 6, 12); ctx.fill();
      ctx.fillStyle = '#5b4030'; ctx.fillRect(w / 2 - 22, -h / 2 + 8, 12, 12);
    }
    ctx.restore();
  }
  function pocoD() {
    ctx.fillStyle = '#6f675c'; ctx.beginPath(); ctx.arc(poco.x, poco.y, 24, 0, 7); ctx.fill();
    ctx.strokeStyle = '#4b453d'; ctx.lineWidth = 2;
    for (let k = 0; k < 12; k++) { const a = k * .52; ctx.beginPath(); ctx.moveTo(poco.x + Math.cos(a) * 15, poco.y + Math.sin(a) * 15); ctx.lineTo(poco.x + Math.cos(a) * 24, poco.y + Math.sin(a) * 24); ctx.stroke(); }
    ctx.fillStyle = '#10161a'; ctx.beginPath(); ctx.arc(poco.x, poco.y, 15, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(150,180,200,.35)'; ctx.beginPath(); ctx.ellipse(poco.x - 4, poco.y - 3, 4, 2, .4, 0, 7); ctx.fill();
    ctx.strokeStyle = '#5a3e26'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(poco.x - 30, poco.y - 4); ctx.lineTo(poco.x + 30, poco.y + 4); ctx.stroke();
  }
  function varal(t) {
    const a = casas[2], b = casas[3], x1 = a.x + 50, y1 = a.y + 30, x2 = b.x - 30, y2 = b.y - 30;
    ctx.strokeStyle = 'rgba(60,40,24,.8)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + 12, x2, y2); ctx.stroke();
    ['#d8cdb4', '#8a3b2a', '#c7b48a', '#46607a'].forEach((cor, k) => {
      const u = 0.2 + k * 0.2, x = lerp(x1, x2, u), y = lerp(y1, y2, u) + 10 * Math.sin(u * Math.PI), v = rajada(t), fl = Math.sin(t * 6 + k) * 4 * v + v * 8;
      ctx.fillStyle = cor; ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x + 9, y); ctx.lineTo(x + 9 + fl, y + 18); ctx.lineTo(x - 9 + fl * .8, y + 20); ctx.closePath(); ctx.fill();
    });
  }
  function fogueiraD(t, acesa) {
    ctx.fillStyle = '#3a2a1e'; ctx.beginPath(); ctx.arc(fogueira.x, fogueira.y, 16, 0, 7); ctx.fill();
    ctx.strokeStyle = '#5b3a22'; ctx.lineWidth = 4;
    for (let k = 0; k < 5; k++) { const a = k * 1.25; ctx.beginPath(); ctx.moveTo(fogueira.x + Math.cos(a) * 18, fogueira.y + Math.sin(a) * 18); ctx.lineTo(fogueira.x - Math.cos(a) * 4, fogueira.y - Math.sin(a) * 4); ctx.stroke(); }
    if (!acesa) return;
    for (let k = 0; k < 7; k++) { const a = t * 9 + k * 2.1, r = 6 + Math.sin(a) * 3; ctx.fillStyle = k % 2 ? 'rgba(255,170,60,.9)' : 'rgba(255,90,30,.8)'; ctx.beginPath(); ctx.arc(fogueira.x + Math.sin(a * 1.3) * 4 + rajada(t) * 3, fogueira.y + Math.cos(a) * 4, r, 0, 7); ctx.fill(); }
  }
  const vel = casas[4];
  return {
    titulo: 'A vila de luto', legenda: 'Nove casas de taipa num entroncamento, o velório na casa de telha, a fogueira no pátio e o círculo de cal com o trecho apagado do lado da estrada. Escala sugerida no mapa: 40 passos de largura.',
    horaInicial: 0.08, fogo: true,
    fixo,
    desenhar(L, t, dt) {
      casas.forEach(c => sombraRet(c.x, c.y, c.ang, c.w, c.h, L));
      veg.capins.forEach(g => capim(g, t));
      circulo(L, t); pocoD(); fogueiraD(t, L.escuro > .3);
      casas.forEach(c => casa(c, t)); varal(t);
      veg.moitas.forEach(m => moita(m, t, L)); veg.cactos.forEach(c => cacto(c, L));
      poeiraD(t, dt, L);
      const fontes = [{ x: vel.x + Math.cos(vel.ang) * (vel.w / 2 - 16), y: vel.y + Math.sin(vel.ang) * (vel.w / 2 - 16) - vel.h / 2 + 14, taxa: .5 }];
      if (L.escuro > .3) fontes.push({ x: fogueira.x, y: fogueira.y, taxa: .9 });
      fumacaD(fontes, fumaca, t, dt, L);
    },
    luzes(L, t) {
      const porta = { x: vel.x - Math.cos(vel.ang) * (vel.w / 2 + 26), y: vel.y - Math.sin(vel.ang) * (vel.w / 2 + 26) };
      const l = [{ x: porta.x, y: porta.y, r: 120 * tremor(t, 1), cor: [255, 180, 90], forca: .9 }, { x: poco.x + 30, y: poco.y + 4, r: 70 * tremor(t, 3), cor: [255, 200, 120], forca: .7 }];
      if (L.escuro > .3) l.push({ x: fogueira.x, y: fogueira.y, r: 230 * tremor(t, 2), cor: [255, 140, 60], forca: 1 });
      casas.forEach((c, k) => { if (!c.velorio && k % 2 === 0) l.push({ x: c.x, y: c.y + c.h / 2 + 8, r: 46 * tremor(t, k + 5), cor: [255, 190, 110], forca: .55 }); });
      return l;
    },
    depois(L, t) { olhosD(L, t, olhos, grande); },
  };
}

// ================= RUÍDO E TERRENO PINTADO =================
function hash(i, j, s) { let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(s, 982451653); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function vnoise(x, y, s) { const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); const a = hash(i, j, s), b = hash(i + 1, j, s), c = hash(i, j + 1, s), d = hash(i + 1, j + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm(x, y, s, o = 4) { let t = 0, amp = .5, f = 1, n = 0; for (let k = 0; k < o; k++) { t += vnoise(x * f, y * f, s + k * 17) * amp; n += amp; f *= 2; amp *= .5; } return t / n; }
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
// pinta o chão com ruído em camadas: manchas grandes de terra, areia e cascalho
function terreno(g, seed, cores, mascara) {
  const w = 375, h = 250, img = g.createImageData(w, h), d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const X = x * 4, Y = y * 4;
    const n1 = fbm(X * .004, Y * .004, seed), n2 = fbm(X * .02, Y * .02, seed + 50, 3), n3 = vnoise(X * .09, Y * .09, seed + 90);
    let c = mix(cores.escuro, cores.base, Math.min(1, Math.max(0, (n1 - .3) * 2.2)));
    c = mix(c, cores.claro, Math.min(.45, Math.max(0, (n2 - .58) * 1.5)));
    c = c.map(v => v * (.93 + n3 * .12));
    if (mascara) c = mascara(X, Y, c);
    const k = (y * w + x) * 4; d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255;
  }
  const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h; tmp.getContext('2d').putImageData(img, 0, 0);
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(tmp, 0, 0, W, H);
  // grão fino: areia, pedrinhas, gravetos
  for (let i = 0; i < 9000; i++) { const x = R() * W, y = R() * H, r = R() < .9 ? .6 + R() * 1.2 : 1.5 + R() * 2.5; g.fillStyle = R() > .5 ? `rgba(60,38,20,${.15 + R() * .25})` : `rgba(240,220,180,${.1 + R() * .2})`; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(70,46,24,.35)'; g.lineWidth = 1;
  for (let i = 0; i < 260; i++) { const x = R() * W, y = R() * H, a = R() * 6.28, l = 4 + R() * 10; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
}
// seixo com volume
function seixo(g, x, y, r, tom) {
  g.fillStyle = 'rgba(40,24,12,.35)'; g.beginPath(); g.ellipse(x + r * .35, y + r * .4, r, r * .75, 0, 0, 7); g.fill();
  const gr = g.createRadialGradient(x - r * .35, y - r * .35, r * .1, x, y, r * 1.1);
  gr.addColorStop(0, `rgb(${tom.map(v => Math.min(255, v + 50)).join(',')})`); gr.addColorStop(1, `rgb(${tom.map(v => v - 30).join(',')})`);
  g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r, r * .78, R() * 3, 0, 7); g.fill();
}

// ---------- sombra que cresce com o sol ----------
const vetorSombra = L => ({ x: Math.cos(L.sol) * L.sombra / 40, y: (Math.sin(L.sol) * .6 + .25) * L.sombra / 40 });
// sombra suave: três passadas, para não ficar com borda dura
function sombraForma(desenho, dx, dy, a) {
  if (Math.abs(dx) + Math.abs(dy) < .5) return;
  [[.85, .4], [1, .35], [1.12, .25]].forEach(([k, f]) => { ctx.save(); ctx.translate(dx * k, dy * k); ctx.fillStyle = `rgba(36,20,10,${a * f})`; desenho(); ctx.fill(); ctx.restore(); });
}

// ================= PLANTAS DA CAATINGA =================
function jurema(p, t, L) {
  const v = rajada(t), s = Math.sin(t * 1.5 + p.f) * v * 3 + v * 2, sv = vetorSombra(L);
  sombraForma(() => { ctx.beginPath(); p.folhas.forEach(f => { ctx.moveTo(p.x + f.x + f.r, p.y + f.y); ctx.arc(p.x + f.x, p.y + f.y, f.r, 0, 7); }); }, sv.x * 14, sv.y * 14, .5);
  ctx.strokeStyle = '#4a3624'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  p.galhos.forEach(g => { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + g.x + s * g.k, p.y + g.y + s * .3 * g.k); ctx.stroke(); });
  p.folhas.forEach((f, k) => {
    const ox = s * f.k, sh = (Math.sin(t * 4 + k) * v) * .8;
    ctx.fillStyle = `rgb(${f.c.join(',')})`; ctx.beginPath(); ctx.arc(p.x + f.x + ox + sh, p.y + f.y + sh * .5, f.r, 0, 7); ctx.fill();
  });
  ctx.fillStyle = 'rgba(230,236,170,.22)'; p.folhas.slice(0, 5).forEach(f => { ctx.beginPath(); ctx.arc(p.x + f.x - f.r * .3 + s * f.k, p.y + f.y - f.r * .3, f.r * .45, 0, 7); ctx.fill(); });
}
function novaJurema(x, y, r) {
  const galhos = [], folhas = [];
  const n = 5 + Math.floor(R() * 4);
  for (let k = 0; k < n; k++) { const a = R() * 6.28, l = r * (.6 + R() * .6); galhos.push({ x: Math.cos(a) * l, y: Math.sin(a) * l * .85, k: l / r }); }
  const verde = R() > .5 ? [108, 116, 70] : [126, 124, 78];
  for (let k = 0; k < 26; k++) { const g = galhos[k % n], u = .3 + R() * .8; folhas.push({ x: g.x * u + (R() - .5) * r * .4, y: g.y * u + (R() - .5) * r * .4, r: r * (.16 + R() * .14), k: u * g.k, c: verde.map(v => v + (R() - .5) * 30) }); }
  folhas.sort((a, b) => a.y - b.y);
  return { tipo: 'jurema', x, y, r, galhos, folhas, f: R() * 6.28 };
}
function macambira(p, t, L) {
  const v = rajada(t), sv = vetorSombra(L);
  sombraForma(() => { ctx.beginPath(); ctx.arc(p.x, p.y, p.r * .8, 0, 7); }, sv.x * 6, sv.y * 6, .4);
  p.folhas.forEach((f, k) => {
    const s = Math.sin(t * 2.2 + k + p.f) * v * .06;
    const a = f.a + s, l = f.l, bx = p.x + Math.cos(a) * l, by = p.y + Math.sin(a) * l;
    const n = a + Math.PI / 2, w = p.r * .1;
    ctx.fillStyle = k % 2 ? '#7d8a5a' : '#94995f';
    ctx.beginPath(); ctx.moveTo(p.x + Math.cos(n) * w, p.y + Math.sin(n) * w); ctx.quadraticCurveTo(p.x + Math.cos(a) * l * .6 + Math.cos(n) * w, p.y + Math.sin(a) * l * .6 + Math.sin(n) * w, bx, by); ctx.lineTo(p.x - Math.cos(n) * w, p.y - Math.sin(n) * w); ctx.fill();
    ctx.strokeStyle = 'rgba(60,70,40,.55)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(bx, by); ctx.stroke();
  });
  ctx.fillStyle = '#9b4a2e'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * .14, 0, 7); ctx.fill();
}
function novaMacambira(x, y, r) { const folhas = []; const n = 14 + Math.floor(R() * 6); for (let k = 0; k < n; k++) folhas.push({ a: k / n * 6.28 + R() * .3, l: r * (.7 + R() * .4) }); return { tipo: 'macambira', x, y, r, folhas, f: R() * 6.28 }; }
function xiquexique(p, L) {
  const sv = vetorSombra(L);
  sombraForma(() => { ctx.beginPath(); p.seg.forEach(s => { ctx.moveTo(s.x + s.r, s.y); ctx.arc(s.x, s.y, s.r, 0, 7); }); }, sv.x * 5, sv.y * 5, .45);
  p.seg.forEach(s => {
    const g = ctx.createRadialGradient(s.x - s.r * .4, s.y - s.r * .4, 1, s.x, s.y, s.r);
    g.addColorStop(0, '#9fb08a'); g.addColorStop(1, '#4f6a55');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(250,240,200,.7)'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(s.x + Math.cos(k * 2.1) * s.r * .55, s.y + Math.sin(k * 2.1) * s.r * .55, .9, 0, 7); ctx.fill(); }
  });
}
function novoXique(x, y) { const seg = []; let cx = x, cy = y, a = R() * 6.28; for (let k = 0; k < 9; k++) { seg.push({ x: cx, y: cy, r: 5 + R() * 2 }); a += (R() - .5) * 1.4; cx += Math.cos(a) * 9; cy += Math.sin(a) * 9; if (R() < .25) { a += 1.8; } } return { tipo: 'xique', x, y, seg }; }
function mandacaru(p, L) {
  const sv = vetorSombra(L);
  // é alto: a sombra estica muito no fim da tarde
  if (L.sombra > 1) p.cols.forEach(c => { ctx.save(); ctx.lineCap = 'round'; [[.4, 1], [.3, 1.08]].forEach(([a, k]) => { ctx.strokeStyle = `rgba(36,20,10,${a * .55})`; ctx.lineWidth = c.r * 1.7; ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + sv.x * c.h * k, c.y + sv.y * c.h * k); ctx.stroke(); }); ctx.restore(); });
  p.cols.forEach(c => {
    const g = ctx.createRadialGradient(c.x - c.r * .35, c.y - c.r * .35, 1, c.x, c.y, c.r);
    g.addColorStop(0, '#8fae7c'); g.addColorStop(.7, '#557a4e'); g.addColorStop(1, '#3d5a3a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(30,48,30,.7)'; ctx.lineWidth = 1;
    for (let k = 0; k < 8; k++) { const a = k * .785; ctx.beginPath(); ctx.moveTo(c.x + Math.cos(a) * c.r * .25, c.y + Math.sin(a) * c.r * .25); ctx.lineTo(c.x + Math.cos(a) * c.r, c.y + Math.sin(a) * c.r); ctx.stroke(); }
    ctx.fillStyle = 'rgba(250,245,215,.85)'; ctx.beginPath(); ctx.arc(c.x - 1, c.y - 1, 1.6, 0, 7); ctx.fill();
  });
}
function novoMandacaru(x, y) { const cols = [{ x, y, r: 13 + R() * 3, h: 60 }]; const n = 2 + Math.floor(R() * 4); for (let k = 0; k < n; k++) { const a = R() * 6.28, d = 22 + R() * 14; cols.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, r: 8 + R() * 3, h: 38 + R() * 16 }); } return { tipo: 'mandacaru', x, y, cols }; }
function touceira(p, t) {
  const v = rajada(t);
  p.fios.forEach((f, k) => {
    const s = (Math.sin(t * 2.6 + p.f + k * .4) * .5 + .7) * v * 10;
    ctx.strokeStyle = f.c; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(p.x + f.x, p.y + f.y); ctx.quadraticCurveTo(p.x + f.x + f.dx * .5 + s * .3, p.y + f.y - f.h * .6, p.x + f.x + f.dx + s, p.y + f.y - f.h); ctx.stroke();
  });
}
function novaTouceira(x, y, n) { const fios = []; for (let k = 0; k < n; k++) fios.push({ x: (R() - .5) * 14, y: (R() - .5) * 8, h: 7 + R() * 12, dx: (R() - .5) * 8, c: R() > .4 ? 'rgba(196,172,106,.9)' : 'rgba(150,132,78,.9)' }); return { tipo: 'capim', x, y, fios, f: R() * 6.28 }; }
// planta em grupos, guiada por ruído (a caatinga não é espalhada por igual)
function caatinga(seed, livre, quant) {
  const lista = [];
  const tenta = (n, tipo, limiar, fabrica) => { for (let i = 0; i < n * 12 && lista.filter(p => p.tipo === tipo).length < n; i++) { const x = R() * W, y = R() * H; if (fbm(x * .004, y * .004, seed) < limiar) continue; if (!livre(x, y, tipo)) continue; lista.push(fabrica(x, y)); } };
  tenta(quant.jurema, 'jurema', .48, (x, y) => novaJurema(x, y, 18 + R() * 22));
  tenta(quant.macambira, 'macambira', .5, (x, y) => novaMacambira(x, y, 14 + R() * 10));
  tenta(quant.xique, 'xique', .4, novoXique);
  tenta(quant.mandacaru, 'mandacaru', .35, novoMandacaru);
  tenta(quant.capim, 'capim', .42, (x, y) => novaTouceira(x, y, 6 + Math.floor(R() * 8)));
  lista.sort((a, b) => a.y - b.y);
  return lista;
}
function desenharCaatinga(lista, t, L, baixa) {
  lista.forEach(p => {
    if (baixa !== (p.tipo === 'capim' || p.tipo === 'xique')) return;
    if (p.tipo === 'jurema') jurema(p, t, L); else if (p.tipo === 'macambira') macambira(p, t, L); else if (p.tipo === 'xique') xiquexique(p, L); else if (p.tipo === 'mandacaru') mandacaru(p, L); else touceira(p, t);
  });
}
// urubus planando: só a sombra deles passa pelo chão
function urubus(L, t, centro) {
  if (L.i > 1 && L.i < 6) return;
  for (let k = 0; k < 3; k++) {
    const a = t * (.09 + k * .02) + k * 2.1, rx = 220 + k * 60, x = centro.x + Math.cos(a) * rx, y = centro.y + Math.sin(a) * rx * .6;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2 + Math.PI); ctx.fillStyle = 'rgba(30,18,10,.28)';
    const asa = 26 + Math.sin(t * 1.5 + k) * 2;
    ctx.beginPath(); ctx.moveTo(0, -6); ctx.quadraticCurveTo(-asa * .5, -10, -asa, 2); ctx.lineTo(-asa * .6, 2); ctx.lineTo(-4, 6); ctx.lineTo(0, 12); ctx.lineTo(4, 6); ctx.lineTo(asa * .6, 2); ctx.lineTo(asa, 2); ctx.quadraticCurveTo(asa * .5, -10, 0, -6); ctx.fill();
    ctx.restore();
  }
}

// ================= CENÁRIO 1: A ESTRADA AO ENTARDECER =================
function cenaEstrada() {
  R = rng(21);
  const P = s => { const u = s / 1800; return [lerp(-80, W + 60, u) + Math.sin(u * 6.5) * 80, lerp(H + 60, -40, u) + Math.sin(u * 3.6 + 1) * 70]; };
  const pts = []; for (let s = 0; s <= 1800; s += 8) pts.push(P(s));
  const distEstrada = (x, y) => { let m = 1e9; for (let i = 0; i < pts.length; i += 2) { const d = Math.hypot(x - pts[i][0], y - pts[i][1]); if (d < m) m = d; } return m; };
  // leito de riacho seco cruzando a estrada
  const riacho = s => { const u = s / 1700; return [lerp(-60, W + 60, u), lerp(170, 900, u) + Math.sin(u * 9) * 60 + Math.sin(u * 3) * 40]; };
  const rpts = []; for (let s = 0; s <= 1700; s += 8) rpts.push(riacho(s));
  const distRiacho = (x, y) => { let m = 1e9; for (let i = 0; i < rpts.length; i += 2) { const d = Math.hypot(x - rpts[i][0], y - rpts[i][1]); if (d < m) m = d; } return m; };
  const carroca = { x: 520, y: 600, ang: -0.95 };
  const marco = { x: 1010, y: 300 };
  const vila = { x: W - 40, y: 40 };
  const cerca = []; for (let s = 120; s < 1300; s += 26) { const p = P(s), q = P(s + 4), nx = -(q[1] - p[1]), ny = q[0] - p[0], m = Math.hypot(nx, ny); if (distRiacho(p[0], p[1]) < 70) continue; cerca.push({ x: p[0] + nx / m * 92, y: p[1] + ny / m * 92, k: s }); }
  const plantas = caatinga(21, (x, y, tipo) => {
    const de = distEstrada(x, y), dr = distRiacho(x, y);
    if (de < (tipo === 'capim' ? 46 : 70) || dr < (tipo === 'capim' ? 30 : 56)) return false;
    if (Math.hypot(x - carroca.x, y - carroca.y) < 110 || Math.hypot(x - marco.x, y - marco.y) < 50 || Math.hypot(x - vila.x, y - vila.y) < 330) return false;
    if (cerca.some(c => Math.hypot(x - c.x, y - c.y) < 20)) return false;
    return true;
  }, { jurema: 70, macambira: 26, xique: 20, mandacaru: 14, capim: 260 });
  const olhos = []; for (let k = 0; k < 7; k++) { const p = P(240 + k * 190); olhos.push({ x: p[0] + (k % 2 ? 130 : -140), y: p[1] + (k % 2 ? 50 : -40), f: R() * 6.28 }); }
  const fumaca = [], pegadas = [];
  for (let s = 60; s < 1700; s += 34) { const p = P(s), q = P(s + 4), a = Math.atan2(q[1] - p[1], q[0] - p[0]); [-1, 1].forEach((lado, j) => pegadas.push({ x: p[0] + Math.cos(a + Math.PI / 2) * (8 * lado + (R() - .5) * 20) + Math.cos(a) * j * 15, y: p[1] + Math.sin(a + Math.PI / 2) * (8 * lado + (R() - .5) * 20) + Math.sin(a) * j * 15, a })); }

  function fixo(g) {
    terreno(g, 21, { escuro: [138, 98, 60], base: [170, 132, 86], claro: [194, 162, 114] }, (x, y, c) => {
      const dr = distRiacho(x, y);
      if (dr < 70) { const k = 1 - dr / 70; c = mix(c, [214, 192, 150], k * .85); }
      return c;
    });
    // leito seco: lama rachada em placas e seixos rolados
    g.save(); g.beginPath(); rpts.forEach((p, i) => i ? g.lineTo(p[0], p[1] - 48) : g.moveTo(p[0], p[1] - 48)); for (let i = rpts.length - 1; i >= 0; i--) g.lineTo(rpts[i][0], rpts[i][1] + 48); g.closePath(); g.clip();
    g.strokeStyle = 'rgba(120,90,58,.55)'; g.lineWidth = 1.2;
    for (let i = 0; i < 700; i++) { const p = rpts[Math.floor(R() * rpts.length)], x = p[0] + (R() - .5) * 100, y = p[1] + (R() - .5) * 96; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 3; k++) g.lineTo(x + (R() - .5) * 30, y + (R() - .5) * 30); g.stroke(); }
    g.restore();
    for (let i = 0; i < 90; i++) { const p = rpts[Math.floor(R() * rpts.length)]; seixo(g, p[0] + (R() - .5) * 80, p[1] + (R() - .5) * 70, 3 + R() * 7, [150 + R() * 40, 140 + R() * 30, 125 + R() * 20]); }
    // estrada de terra batida: borda solta, sulcos de roda e capim no meio
    for (let s = -40; s <= 1840; s += 3) {
      const p = P(s), w = 44 + fbm(s * .01, 3, 5) * 18;
      const gr = g.createRadialGradient(p[0], p[1], 2, p[0], p[1], w);
      gr.addColorStop(0, 'rgba(176,104,62,.16)'); gr.addColorStop(.75, 'rgba(160,92,54,.12)'); gr.addColorStop(1, 'rgba(160,92,54,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(p[0], p[1], w, 0, 7); g.fill();
    }
    const lado = (s, off) => { const p = P(s), q = P(s + 3), nx = -(q[1] - p[1]), ny = q[0] - p[0], m = Math.hypot(nx, ny) || 1; return [p[0] + nx / m * off, p[1] + ny / m * off]; };
    [-15, 15].forEach(off => { g.strokeStyle = 'rgba(108,58,30,.55)'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); for (let s = -40; s <= 1840; s += 10) { const p = lado(s, off + (vnoise(s * .02, off, 9) - .5) * 4); s === -40 ? g.moveTo(p[0], p[1]) : g.lineTo(p[0], p[1]); } g.stroke(); g.strokeStyle = 'rgba(200,140,92,.25)'; g.lineWidth = 1.5; g.stroke(); });
    for (let s = 0; s < 1800; s += 7) { if (vnoise(s * .03, 1, 4) < .45) continue; const p = lado(s, (R() - .5) * 6); g.strokeStyle = 'rgba(150,140,80,.7)'; g.lineWidth = 1; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + (R() - .5) * 6, p[1] - 4 - R() * 5); g.stroke(); } }
    // pegadas de quem passou correndo, todas rumo à vila
    g.fillStyle = 'rgba(92,48,24,.35)'; pegadas.forEach(p => { g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.beginPath(); g.ellipse(0, 0, 5, 2.4, 0, 0, 7); g.fill(); g.restore(); });
    // seixos na beira
    for (let i = 0; i < 120; i++) { const s = R() * 1800, p = lado(s, (R() > .5 ? 1 : -1) * (40 + R() * 20)); seixo(g, p[0], p[1], 2 + R() * 4, [130, 116, 100]); }
    // a vila ao longe, no canto: o fim do círculo de cal e dois telhados
    g.strokeStyle = 'rgba(245,240,226,.85)'; g.lineWidth = 3; g.beginPath(); g.arc(W + 80, -60, 300, Math.PI * .52, Math.PI * .98); g.stroke();
    [[W - 110, 90, .2], [W - 60, 190, -.1]].forEach(([x, y, a]) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#9a4b2e'; g.fillRect(-36, -24, 72, 48); g.strokeStyle = 'rgba(60,24,14,.55)'; g.lineWidth = 1.2; for (let yy = -18; yy < 24; yy += 7) { g.beginPath(); for (let xx = -36; xx < 36; xx += 9) { g.moveTo(xx, yy); g.quadraticCurveTo(xx + 4.5, yy + 4, xx + 9, yy); } g.stroke(); } g.restore(); });
  }
  function cercaD(L, t) {
    const sv = vetorSombra(L);
    ctx.strokeStyle = 'rgba(36,20,10,.28)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    cerca.forEach((c, i) => { if (i % 7 === 3) return; ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + sv.x * 12, c.y + sv.y * 12); ctx.stroke(); });
    [[-2, 'rgba(70,60,52,.55)'], [2, 'rgba(170,160,148,.9)']].forEach(([o, cor]) => {
      ctx.strokeStyle = cor; ctx.lineWidth = 1.2;
      for (let i = 0; i < cerca.length - 1; i++) { const a = cerca[i], b = cerca[i + 1]; if (Math.hypot(a.x - b.x, a.y - b.y) > 40 || i % 7 === 2 || i % 7 === 3) continue; const balanco = Math.sin(t * 2 + i) * rajada(t) * 3; ctx.beginPath(); ctx.moveTo(a.x, a.y + o); ctx.quadraticCurveTo((a.x + b.x) / 2 + balanco, (a.y + b.y) / 2 + o + 3, b.x, b.y + o); ctx.stroke(); }
    });
    cerca.forEach((c, i) => { if (i % 7 === 3) return; const g = ctx.createRadialGradient(c.x - 1.5, c.y - 1.5, .5, c.x, c.y, 5); g.addColorStop(0, '#9c7a54'); g.addColorStop(1, '#4a3420'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, 5, 0, 7); ctx.fill(); });
  }
  function carrocaD(L, t) {
    const sv = vetorSombra(L);
    ctx.save(); ctx.translate(carroca.x, carroca.y); ctx.rotate(carroca.ang);
    sombraForma(() => { ctx.beginPath(); ctx.rect(-62, -34, 124, 68); }, ...rot(sv.x * 26, sv.y * 26, -carroca.ang), .55);
    // varais quebrados e a lança
    ctx.strokeStyle = '#5a3e26'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(60, -10); ctx.lineTo(130, -26); ctx.moveTo(60, 12); ctx.lineTo(98, 30); ctx.stroke();
    ctx.strokeStyle = '#7a5636'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(98, 30); ctx.lineTo(110, 52); ctx.stroke();
    // caixa de tábuas
    const gr = ctx.createLinearGradient(-60, -30, 60, 30); gr.addColorStop(0, '#8a6440'); gr.addColorStop(1, '#5e4128');
    ctx.fillStyle = gr; ctx.fillRect(-60, -32, 120, 64);
    ctx.strokeStyle = 'rgba(40,26,14,.7)'; ctx.lineWidth = 1.5; for (let y = -32; y <= 32; y += 10.6) { ctx.beginPath(); ctx.moveTo(-60, y); ctx.lineTo(60, y); ctx.stroke(); }
    ctx.strokeStyle = '#3e2a1a'; ctx.lineWidth = 4; ctx.strokeRect(-60, -32, 120, 64);
    // tábua solta, faltando
    ctx.fillStyle = '#2b1c10'; ctx.fillRect(10, -11, 40, 10);
    // sacos de pano tombados
    [[-30, -8, '#cbbf9f'], [-12, 10, '#b8a983']].forEach(([x, y, c]) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, 16, 11, .4, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(80,64,40,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 8, y - 6); ctx.lineTo(x + 6, y + 5); ctx.stroke(); });
    // eixo e uma roda; a outra caiu no chão
    ctx.fillStyle = '#2f2012'; ctx.fillRect(-10, -42, 8, 84);
    ctx.fillStyle = '#4a3220'; ctx.fillRect(-26, 32, 40, 9);
    ctx.restore();
    // a roda caída, de raios
    const rx = carroca.x - 70, ry = carroca.y - 40;
    ctx.save(); ctx.translate(rx, ry); ctx.rotate(.4);
    sombraForma(() => { ctx.beginPath(); ctx.arc(0, 0, 30, 0, 7); }, sv.x * 6, sv.y * 6, .4);
    ctx.strokeStyle = '#3e2a1a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 28, 0, 7); ctx.stroke();
    ctx.lineWidth = 3; for (let k = 0; k < 10; k++) { const a = k * .628; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 26, Math.sin(a) * 26); ctx.stroke(); }
    ctx.fillStyle = '#5e4128'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, 7); ctx.fill();
    ctx.restore();
  }
  function marcoD(L) {
    const sv = vetorSombra(L);
    sombraForma(() => { ctx.beginPath(); ctx.ellipse(marco.x, marco.y, 26, 20, .3, 0, 7); }, sv.x * 18, sv.y * 18, .5);
    const gr = ctx.createRadialGradient(marco.x - 8, marco.y - 8, 2, marco.x, marco.y, 28); gr.addColorStop(0, '#b4aca0'); gr.addColorStop(1, '#6e665c');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(marco.x, marco.y, 26, 20, .3, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(245,240,226,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(marco.x, marco.y, 12, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(marco.x - 2, marco.y - 10); ctx.lineTo(marco.x - 4, marco.y + 10); ctx.moveTo(marco.x - 1, marco.y - 3); ctx.lineTo(marco.x + 7, marco.y - 3); ctx.moveTo(marco.x - 9, marco.y + 5); ctx.lineTo(marco.x + 9, marco.y + 5); ctx.stroke();
  }
  function rot(x, y, a) { return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]; }
  return {
    titulo: 'A estrada ao entardecer', legenda: 'A corrida contra o sol. A estrada atravessa a caatinga e um riacho seco; uma carroça abandonada perdeu a roda, um marco de pedra guarda um traço velho, e lá no canto se vê o fim do círculo e os telhados da vila. As pegadas na terra vão todas para lá. Escala sugerida: 80 passos de largura.',
    horaInicial: 0.17, fogo: false,
    fixo,
    desenhar(L, t, dt) {
      desenharCaatinga(plantas, t, L, true);
      cercaD(L, t); marcoD(L); carrocaD(L, t);
      desenharCaatinga(plantas, t, L, false);
      urubus(L, t, { x: carroca.x + 60, y: carroca.y - 40 });
      poeiraD(t, dt, L);
      fumacaD([{ x: W - 110, y: 120, taxa: .45, r0: 6, cresce: 14, a0: .2, sobe: true }], fumaca, t, dt, L);
    },
    luzes(L, t) { return [{ x: W - 70, y: 140, r: 300 * tremor(t, 4), cor: [255, 150, 70], forca: .65 }, { x: W - 200, y: 60, r: 120 * tremor(t, 7), cor: [255, 180, 90], forca: .5 }]; },
    depois(L, t) { olhosD(L, t, olhos, { x: P(820)[0] - 170, y: P(820)[1] + 60, vai: 90 }); },
  };
}

// ================= CENÁRIO 3: O MOCÓ DA SERROTA =================
function cenaMoco() {
  R = rng(33);
  const centro = { x: 760, y: 400 };
  // o lajedo: uma laje de granito só, de borda irregular
  const borda = []; for (let k = 0; k < 120; k++) { const a = k / 120 * 6.28, r = 330 * (.78 + fbm(Math.cos(a) * 1.4 + 5, Math.sin(a) * 1.4 + 5, 33, 3) * .5); borda.push([centro.x + Math.cos(a) * r * 1.35, centro.y + Math.sin(a) * r * .82]); }
  const dentroLajedo = (x, y) => { let c = false; for (let i = 0, j = borda.length - 1; i < borda.length; j = i++) { const [xi, yi] = borda[i], [xj, yj] = borda[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  // matacões: pedras redondas em cima da laje
  const matacoes = [];
  for (let n = 0; n < 400 && matacoes.length < 13; n++) { const x = centro.x + (R() - .5) * 760, y = centro.y + (R() - .5) * 440; if (!dentroLajedo(x, y)) continue; const r = 28 + R() * 46; if (matacoes.some(m => Math.hypot(m.x - x, m.y - y) < m.r + r - 10)) continue; if (Math.hypot(x - (centro.x + 20), y - (centro.y + 110)) < r + 80 || Math.hypot(x - (centro.x - 300), y - (centro.y + 70)) < r + 130 || Math.hypot(x - (centro.x + 60), y - (centro.y - 150)) < r + 60) continue; const pts = []; for (let k = 0; k < 24; k++) { const a = k / 24 * 6.28; pts.push([Math.cos(a) * r * (.88 + vnoise(Math.cos(a) * 2 + n, Math.sin(a) * 2, 7) * .24), Math.sin(a) * r * .86 * (.88 + vnoise(Math.cos(a) * 2, Math.sin(a) * 2 + n, 8) * .24)]); } const liquen = []; for (let k = 0; k < 10; k++) liquen.push({ x: (R() - .5) * r * 1.4, y: (R() - .5) * r * 1.2, r: 2 + R() * r * .1, c: R() > .6 ? 'rgba(206,150,70,.32)' : 'rgba(176,186,150,.3)' }); const racha = []; let rx = (R() - .5) * r, ry = (R() - .5) * r * .6, ra = R() * 6.28; for (let k = 0; k < 5; k++) { racha.push([rx, ry]); ra += (R() - .5) * 1.2; rx += Math.cos(ra) * r * .18; ry += Math.sin(ra) * r * .14; } matacoes.push({ x, y, r, pts, tom: R(), liquen, racha }); }
  matacoes.sort((a, b) => a.y - b.y);
  const caldeirao = { x: centro.x + 20, y: centro.y + 110, r: 56 };
  const cava = { x: centro.x - 300, y: centro.y + 70 };   // a lavra de cal, na beira da laje
  const fenda = { x: centro.x + 60, y: centro.y - 150 };  // de onde saem os morcegos
  const lenha = { x: 470, y: 760 }, ruina = { x: 1090, y: 720, ang: -.12 }, carrinho = { x: 330, y: 560, ang: .5 }, lamparina = { x: 1030, y: 790 };
  const caminho = s => { const u = s / 700; return [lerp(760, 720, u) + Math.sin(u * 4) * 60, lerp(H + 40, 640, u)]; };
  const baratas = Array.from({ length: 22 }, () => ({ a: R() * 6.28, d: rr(40, 95), v: rr(.6, 2), f: R() * 6.28, pausa: R() * 6 }));
  const morcegos = Array.from({ length: 9 }, (_, k) => ({ f: R() * 6.28, v: .6 + R() * .5, r: 120 + R() * 300, k }));
  const plantas = caatinga(33, (x, y, tipo) => {
    if (dentroLajedo(x, y)) return tipo === 'capim' ? R() < .15 : tipo === 'macambira' ? R() < .5 : false;
    if (Math.hypot(x - lenha.x, y - lenha.y) < 110 || Math.hypot(x - ruina.x, y - ruina.y) < 120 || Math.hypot(x - carrinho.x, y - carrinho.y) < 70) return false;
    if (Math.abs(x - caminho((H + 40 - y) / (H + 40 - 640) * 700)[0]) < 46 && y > 630) return false;
    return true;
  }, { jurema: 60, macambira: 30, xique: 22, mandacaru: 10, capim: 220 });
  const olhos = [{ x: fenda.x, y: fenda.y - 6 }, { x: centro.x - 480, y: centro.y - 120 }, { x: centro.x + 520, y: centro.y - 60 }, { x: centro.x + 360, y: centro.y + 300 }, { x: centro.x - 120, y: centro.y + 330 }].map(o => ({ ...o, f: R() * 6.28 }));

  function fixo(g) {
    terreno(g, 33, { escuro: [134, 96, 58], base: [166, 128, 82], claro: [192, 160, 112] });
    // trilha batida subindo
    for (let s = -40; s <= 720; s += 3) { const p = caminho(s), w = 26 + fbm(s * .02, 1, 3) * 10; const gr = g.createRadialGradient(p[0], p[1], 1, p[0], p[1], w); gr.addColorStop(0, 'rgba(184,120,74,.2)'); gr.addColorStop(1, 'rgba(184,120,74,0)'); g.fillStyle = gr; g.beginPath(); g.arc(p[0], p[1], w, 0, 7); g.fill(); }
    // a laje: degradê de granito, grãos, liquens e rachaduras
    g.save(); g.beginPath(); borda.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath();
    g.shadowColor = 'rgba(30,16,6,.5)'; g.shadowBlur = 24; g.shadowOffsetY = 10;
    const lg = g.createLinearGradient(centro.x - 400, centro.y - 300, centro.x + 400, centro.y + 300); lg.addColorStop(0, '#bdb3a6'); lg.addColorStop(.5, '#a79d90'); lg.addColorStop(1, '#8d8478');
    g.fillStyle = lg; g.fill(); g.shadowBlur = 0; g.shadowOffsetY = 0; g.clip();
    for (let i = 0; i < 9000; i++) { const x = centro.x + (R() - .5) * 980, y = centro.y + (R() - .5) * 620; const v = R(); g.fillStyle = v < .4 ? 'rgba(60,54,48,.35)' : v < .7 ? 'rgba(235,228,216,.35)' : 'rgba(170,120,110,.25)'; g.fillRect(x, y, 1.6, 1.6); }
    for (let i = 0; i < 70; i++) { const x = centro.x + (R() - .5) * 900, y = centro.y + (R() - .5) * 560, r = 6 + R() * 26; const cor = R() > .5 ? `rgba(206,138,58,${.25 + R() * .3})` : `rgba(170,184,140,${.2 + R() * .25})`; g.fillStyle = cor; for (let k = 0; k < 8; k++) { g.beginPath(); g.arc(x + (R() - .5) * r, y + (R() - .5) * r * .7, r * (.2 + R() * .3), 0, 7); g.fill(); } }
    g.strokeStyle = 'rgba(60,52,46,.6)'; g.lineWidth = 1.6; g.lineCap = 'round';
    for (let i = 0; i < 16; i++) { let x = centro.x + (R() - .5) * 800, y = centro.y + (R() - .5) * 480, a = R() * 6.28; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 9; k++) { a += (R() - .5) * .8; x += Math.cos(a) * 18; y += Math.sin(a) * 12; g.lineTo(x, y); } g.stroke(); }
    // anéis de esfoliação, típicos do granito ao sol
    g.strokeStyle = 'rgba(230,224,214,.22)'; g.lineWidth = 2; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(centro.x - 120 + i * 30, centro.y - 40, 260 - i * 40, 150 - i * 24, .1, Math.PI * 1.05, Math.PI * 1.9); g.stroke(); }
    g.restore();
    // a lavra de cal: degraus brancos cavados na beira
    for (let k = 0; k < 4; k++) { const r = 110 - k * 22; g.fillStyle = k % 2 ? '#e7e2d6' : '#d6d0c2'; g.beginPath(); for (let i = 0; i < 40; i++) { const a = i / 40 * 6.28, rr2 = r * (.85 + vnoise(Math.cos(a) * 2, Math.sin(a) * 2, 40 + k) * .3); i ? g.lineTo(cava.x + Math.cos(a) * rr2, cava.y + Math.sin(a) * rr2 * .7) : g.moveTo(cava.x + Math.cos(a) * rr2, cava.y + Math.sin(a) * rr2 * .7); } g.closePath(); g.fill(); g.strokeStyle = 'rgba(120,110,96,.5)'; g.lineWidth = 1.5; g.stroke(); }
    g.fillStyle = '#5a5248'; g.beginPath(); g.ellipse(cava.x + 6, cava.y + 8, 22, 14, 0, 0, 7); g.fill();
    for (let i = 0; i < 26; i++) { const a = R() * 6.28, d = 110 + R() * 80; seixo(g, cava.x + Math.cos(a) * d, cava.y + Math.sin(a) * d * .7, 3 + R() * 6, [232, 228, 218]); }
    // poeira de cal espalhada pelo chão em volta
    for (let i = 0; i < 400; i++) { const a = R() * 6.28, d = 100 + R() * 200; g.fillStyle = `rgba(240,236,226,${R() * .3})`; g.beginPath(); g.arc(cava.x + Math.cos(a) * d, cava.y + Math.sin(a) * d * .7, 1 + R() * 4, 0, 7); g.fill(); }
    // a fenda escura na pedra
    g.fillStyle = '#1b1612'; g.beginPath(); g.moveTo(fenda.x - 40, fenda.y - 6); g.quadraticCurveTo(fenda.x, fenda.y - 16, fenda.x + 46, fenda.y + 2); g.quadraticCurveTo(fenda.x, fenda.y + 8, fenda.x - 40, fenda.y - 6); g.fill();
    pintarPedrinhas(g, 120);
  }
  function matacao(m, L) {
    const sv = vetorSombra(L);
    const forma = () => { ctx.beginPath(); m.pts.forEach(([px, py], i) => i ? ctx.lineTo(m.x + px, m.y + py) : ctx.moveTo(m.x + px, m.y + py)); ctx.closePath(); };
    if (!m.soSombra) {} 
    const lx = -Math.cos(L.sol) * .5 - .2, ly = -.5;
    const gr = ctx.createRadialGradient(m.x + lx * m.r * .6, m.y + ly * m.r * .6, m.r * .1, m.x, m.y, m.r * 1.15);
    const base = m.tom > .5 ? [178, 168, 156] : [160, 150, 140];
    gr.addColorStop(0, `rgb(${base.map(v => v + 40).join(',')})`); gr.addColorStop(.6, `rgb(${base.join(',')})`); gr.addColorStop(1, `rgb(${base.map(v => v - 60).join(',')})`);
    ctx.fillStyle = gr; forma(); ctx.fill();
    ctx.strokeStyle = 'rgba(60,52,46,.45)'; ctx.lineWidth = 1.2; forma(); ctx.stroke();
    ctx.save(); forma(); ctx.clip();
    m.liquen.forEach(l => { ctx.fillStyle = l.c; ctx.beginPath(); ctx.arc(m.x + l.x, m.y + l.y, l.r, 0, 7); ctx.fill(); });
    ctx.strokeStyle = 'rgba(60,52,46,.35)'; ctx.lineWidth = 1; ctx.beginPath(); m.racha.forEach(([x, y], i) => i ? ctx.lineTo(m.x + x, m.y + y) : ctx.moveTo(m.x + x, m.y + y)); ctx.stroke();
    ctx.restore();
  }
  function caldeiraoD(L, t) {
    const c = caldeirao;
    ctx.save(); ctx.beginPath(); ctx.ellipse(c.x, c.y, c.r, c.r * .62, .15, 0, 7); ctx.clip();
    // a água reflete o céu da hora
    const ceu = L.i <= 1 ? [120, 150, 170] : L.i === 2 ? [140, 80, 110] : L.i === 6 ? [200, 140, 130] : [20, 26, 40];
    ctx.fillStyle = `rgb(${ceu.join(',')})`; ctx.fillRect(c.x - c.r, c.y - c.r, c.r * 2, c.r * 2);
    ctx.fillStyle = 'rgba(40,52,40,.45)'; ctx.fillRect(c.x - c.r, c.y - c.r, c.r * 2, c.r * 2);
    const v = rajada(t);
    ctx.strokeStyle = `rgba(255,255,255,${.12 + v * .2})`; ctx.lineWidth = 1;
    for (let k = 0; k < 7; k++) { const y = c.y - c.r * .5 + k * 9 + Math.sin(t * 1.5 + k) * 2, x = c.x - c.r + ((t * 20 * (0.3 + v) + k * 23) % (c.r * 2)); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 8, y - 2, x + 16, y); ctx.stroke(); }
    if (L.escuro > .5) { ctx.fillStyle = 'rgba(230,236,250,.55)'; ctx.beginPath(); ctx.ellipse(c.x - 14 + Math.sin(t * .8) * v * 2, c.y - 6, 9, 6, 0, 0, 7); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(70,64,56,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(c.x, c.y, c.r, c.r * .62, .15, 0, 7); ctx.stroke();
    ctx.strokeStyle = 'rgba(80,110,70,.5)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(c.x, c.y, c.r + 3, c.r * .62 + 3, .15, Math.PI * .1, Math.PI * .7); ctx.stroke();
  }
  function lenhaD(L, t) {
    const sv = vetorSombra(L);
    sombraForma(() => { ctx.beginPath(); ctx.ellipse(lenha.x, lenha.y, 92, 46, 0, 0, 7); }, sv.x * 18, sv.y * 18, .55);
    // toras empilhadas em fileiras, de ponta para quem olha de cima
    for (let fila = 0; fila < 4; fila++) for (let k = 0; k < 6 - fila; k++) {
      const x = lenha.x - 70 + k * 26 + fila * 13, y = lenha.y - 20 + fila * 3 - fila * 8;
      ctx.fillStyle = fila % 2 ? '#6a4c32' : '#7c5a3c'; ctx.fillRect(x - 11, y - 34, 22, 68);
      ctx.strokeStyle = 'rgba(40,26,14,.6)'; ctx.lineWidth = 1; ctx.strokeRect(x - 11, y - 34, 22, 68);
      ctx.fillStyle = '#b48a5a'; ctx.beginPath(); ctx.ellipse(x, y + 34, 11, 6, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(110,70,40,.7)'; ctx.beginPath(); ctx.ellipse(x, y + 34, 6, 3, 0, 0, 7); ctx.stroke();
    }
    // galhos soltos jogados por cima
    ctx.strokeStyle = '#4e3826'; ctx.lineCap = 'round'; ctx.lineWidth = 3;
    [[-90, -40, 40, 30], [20, -50, 100, -10], [-60, 40, 30, 50]].forEach(([a, b, c, d]) => { ctx.beginPath(); ctx.moveTo(lenha.x + a, lenha.y + b); ctx.lineTo(lenha.x + c, lenha.y + d); ctx.stroke(); });
    // machado fincado num toco
    ctx.fillStyle = '#5a4030'; ctx.beginPath(); ctx.arc(lenha.x + 120, lenha.y + 30, 18, 0, 7); ctx.fill(); ctx.fillStyle = '#a78458'; ctx.beginPath(); ctx.arc(lenha.x + 120, lenha.y + 30, 13, 0, 7); ctx.fill();
    ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(lenha.x + 120, lenha.y + 30); ctx.lineTo(lenha.x + 160, lenha.y + 6); ctx.stroke();
    ctx.fillStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(lenha.x + 112, lenha.y + 24); ctx.lineTo(lenha.x + 126, lenha.y + 22); ctx.lineTo(lenha.x + 124, lenha.y + 40); ctx.closePath(); ctx.fill();
  }
  function baratasD(L, t) {
    if (L.i < 1 || L.i > 3) return;
    const quantas = L.i === 1 ? 8 : baratas.length;
    baratas.slice(0, quantas).forEach((b, k) => {
      const anda = Math.sin(t * .9 + b.pausa) > -.3;
      const a = b.a + (anda ? t * b.v * .5 : 0) + Math.sin(t * 3 + b.f) * .4, d = b.d + Math.sin(t * 1.7 + k) * 12;
      const x = lenha.x + Math.cos(a) * d * 1.25, y = lenha.y + Math.sin(a) * d * .75;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2 + (anda ? 0 : .6));
      ctx.fillStyle = '#4a2a16'; ctx.beginPath(); ctx.ellipse(0, 0, 3.4, 6, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(150,90,50,.6)'; ctx.beginPath(); ctx.ellipse(-1, -1.5, 1.2, 3.2, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(58,34,20,.9)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(-1, -5); ctx.quadraticCurveTo(-3, -9, -6, -11); ctx.moveTo(1, -5); ctx.quadraticCurveTo(3, -9, 6, -11);
      const pe = anda ? Math.sin(t * 30 + k) * 1.5 : 0; for (let j = -1; j <= 1; j++) { ctx.moveTo(-3, j * 2.5); ctx.lineTo(-6, j * 3 + pe); ctx.moveTo(3, j * 2.5); ctx.lineTo(6, j * 3 - pe); }
      ctx.stroke(); ctx.restore();
    });
  }
  function ruinaD(L) {
    const sv = vetorSombra(L);
    ctx.save(); ctx.translate(ruina.x, ruina.y); ctx.rotate(ruina.ang);
    const paredes = [[-80, -55, 160, 14], [-80, -55, 14, 110], [66, -55, 14, 60], [-80, 41, 70, 14], [20, 41, 60, 14]];
    sombraForma(() => { ctx.beginPath(); paredes.forEach(p => ctx.rect(...p)); }, ...[sv.x * 30, sv.y * 30], .55);
    ctx.fillStyle = '#a0794e'; ctx.beginPath(); ctx.rect(-66, -41, 132, 82); ctx.fill();
    ctx.fillStyle = 'rgba(80,56,32,.4)'; for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc(-60 + R2(i) * 120, -36 + R2(i + 7) * 72, 2 + R2(i + 3) * 5, 0, 7); ctx.fill(); }
    paredes.forEach(p => { const gr = ctx.createLinearGradient(p[0], p[1], p[0] + p[2], p[1] + p[3]); gr.addColorStop(0, '#b78e62'); gr.addColorStop(1, '#8a6642'); ctx.fillStyle = gr; ctx.fillRect(...p); ctx.strokeStyle = 'rgba(60,40,22,.6)'; ctx.lineWidth = 1; ctx.strokeRect(...p); });
    // pedaços de parede caídos
    [[74, 20], [82, 34], [60, 12]].forEach(([x, y]) => { ctx.fillStyle = '#9a7650'; ctx.fillRect(x, y, 10, 7); });
    // sacos de cal guardados lá dentro e uma picareta
    [[-40, -10], [-18, 4]].forEach(([x, y]) => { ctx.fillStyle = '#ece6d8'; ctx.beginPath(); ctx.ellipse(x, y, 15, 11, .3, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(120,110,90,.6)'; ctx.stroke(); });
    ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(10, -20); ctx.lineTo(44, 16); ctx.stroke(); ctx.strokeStyle = '#8c9298'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(4, -6); ctx.quadraticCurveTo(12, -24, 30, -26); ctx.stroke();
    ctx.restore();
  }
  function R2(i) { return hash(i, 3, 77); }
  function carrinhoD(L) {
    const sv = vetorSombra(L);
    ctx.save(); ctx.translate(carrinho.x, carrinho.y); ctx.rotate(carrinho.ang);
    sombraForma(() => { ctx.beginPath(); ctx.ellipse(0, 0, 40, 24, 0, 0, 7); }, sv.x * 12, sv.y * 12, .5);
    ctx.strokeStyle = '#5a3e26'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-28, -14); ctx.lineTo(-72, -22); ctx.moveTo(-28, 14); ctx.lineTo(-72, 18); ctx.stroke();
    const gr = ctx.createRadialGradient(-6, -6, 2, 0, 0, 40); gr.addColorStop(0, '#7d746a'); gr.addColorStop(1, '#4a443e');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(-32, -22); ctx.lineTo(26, -16); ctx.quadraticCurveTo(40, 0, 26, 16); ctx.lineTo(-32, 22); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#efe9dc'; ctx.beginPath(); ctx.ellipse(-4, 0, 22, 13, 0, 0, 7); ctx.fill();
    for (let k = 0; k < 6; k++) seixoCtx(-14 + k * 5, -4 + (k % 3) * 4, 3.5);
    ctx.fillStyle = '#2b2622'; ctx.beginPath(); ctx.ellipse(38, 0, 7, 15, 0, 0, 7); ctx.fill();
    ctx.restore();
  }
  function seixoCtx(x, y, r) { ctx.fillStyle = '#f7f3ea'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(150,140,120,.5)'; ctx.beginPath(); ctx.arc(x + r * .3, y + r * .3, r * .5, 0, 7); ctx.fill(); }
  function morcegosD(L, t) {
    if (L.i < 2 || L.i > 3) return;
    ctx.fillStyle = 'rgba(20,14,12,.9)';
    morcegos.forEach(m => {
      const u = ((t * .12 * m.v + m.f) % 1), a = m.f * 3 + u * 4, r = u * m.r;
      const x = fenda.x + Math.cos(a) * r + Math.sin(t * 3 + m.k) * 10, y = fenda.y + Math.sin(a) * r * .7 - u * 140;
      const bate = Math.sin(t * 22 + m.k) * 5;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-6, -4 - bate, -12, 1); ctx.quadraticCurveTo(-6, 0, 0, 3); ctx.quadraticCurveTo(6, 0, 12, 1); ctx.quadraticCurveTo(6, -4 - bate, 0, 0); ctx.fill();
      ctx.restore();
    });
  }
  function lamparinaD(t, acesa) {
    ctx.fillStyle = 'rgba(36,20,10,.4)'; ctx.beginPath(); ctx.ellipse(lamparina.x + 4, lamparina.y + 4, 9, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#6b5a40'; ctx.beginPath(); ctx.arc(lamparina.x, lamparina.y, 7, 0, 7); ctx.fill();
    ctx.fillStyle = '#8f7a56'; ctx.beginPath(); ctx.arc(lamparina.x - 2, lamparina.y - 2, 3, 0, 7); ctx.fill();
    if (acesa) { ctx.fillStyle = 'rgba(255,200,100,.95)'; ctx.beginPath(); ctx.ellipse(lamparina.x + rajada(t) * 2, lamparina.y - 6, 2.6, 4 + Math.sin(t * 15) * .8, 0, 0, 7); ctx.fill(); }
  }
  return {
    titulo: 'O mocó da serrota', legenda: 'O lajedo de granito onde a vila tira cal, a meia légua dali. Matacões, um caldeirão de água parada, a lavra branca cavada na beira, a casinha de taipa em ruínas onde guardam os sacos, a lenha empilhada e uma lamparina esquecida na trilha. Ao entardecer, alguma coisa sai de baixo da lenha. Escala sugerida: 30 passos de largura.',
    horaInicial: 0.12, fogo: false,
    fixo,
    desenhar(L, t, dt) {
      desenharCaatinga(plantas, t, L, true);
      caldeiraoD(L, t);
      { const sv = vetorSombra(L); matacoes.forEach(m => sombraForma(() => { ctx.beginPath(); m.pts.forEach(([px, py], i) => i ? ctx.lineTo(m.x + px, m.y + py) : ctx.moveTo(m.x + px, m.y + py)); ctx.closePath(); }, sv.x * m.r * .9, sv.y * m.r * .9, .6)); }
      matacoes.forEach(m => matacao(m, L));
      lenhaD(L, t); baratasD(L, t); ruinaD(L); carrinhoD(L); lamparinaD(t, L.escuro > .15);
      desenharCaatinga(plantas, t, L, false);
      urubus(L, t, { x: centro.x, y: centro.y });
      morcegosD(L, t);
      poeiraD(t, dt, L);
    },
    luzes(L, t) { return L.escuro > .15 ? [{ x: lamparina.x, y: lamparina.y - 4, r: 130 * tremor(t, 6), cor: [255, 180, 90], forca: .9 }] : []; },
    depois(L, t) { olhosD(L, t, olhos, { x: centro.x - 420, y: centro.y + 260, vai: 120 }); },
  };
}

  const som = (() => {
  let ac = null, ligado = false, nos = {};
  const alvo = { grilo: 0, fogo: 0 };
  let prox = 0;
  function ruido(seg) { const b = ac.createBuffer(1, ac.sampleRate * seg, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
  function laco(buf) { const s = ac.createBufferSource(); s.buffer = buf; s.loop = true; s.start(); return s; }
  function montar() {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    const mestre = ac.createGain(); mestre.gain.value = .9; mestre.connect(ac.destination);
    const br = ruido(4);
    const v = laco(br), vf = ac.createBiquadFilter(); vf.type = 'bandpass'; vf.frequency.value = 500; vf.Q.value = .6;
    const vg = ac.createGain(); vg.gain.value = 0; v.connect(vf).connect(vg).connect(mestre);
    const ci = laco(br), cf = ac.createBiquadFilter(); cf.type = 'bandpass'; cf.frequency.value = 5200; cf.Q.value = 9;
    const cam = ac.createGain(); cam.gain.value = 0; const lfo = ac.createOscillator(); lfo.frequency.value = 38; const lg = ac.createGain(); lg.gain.value = .5; lfo.connect(lg).connect(cam.gain); lfo.start();
    const cg = ac.createGain(); cg.gain.value = 0; ci.connect(cf).connect(cam).connect(cg).connect(mestre);
    const fg = ac.createGain(); fg.gain.value = 0; fg.connect(mestre);
    const d1 = ac.createOscillator(), d2 = ac.createOscillator(); d1.frequency.value = 55; d2.frequency.value = 58.3;
    const dg = ac.createGain(); dg.gain.value = 0; d1.connect(dg); d2.connect(dg); dg.connect(mestre); d1.start(); d2.start();
    const gg = ac.createGain(); gg.gain.value = 0; gg.connect(mestre);
    nos = { vg, vf, cg, fg, dg, gg, br };
    agendar();
  }
  function agendar() {
    if (!ac) return;
    const agora = ac.currentTime;
    if (prox < agora) prox = agora;
    while (prox < agora + .5) {
      if (alvo.grilo > .01) {
        const pan = ac.createStereoPanner ? ac.createStereoPanner() : null, f = 4300 + Math.random() * 600;
        if (pan) { pan.pan.value = Math.random() * 1.6 - .8; pan.connect(nos.gg); }
        for (let k = 0; k < 3; k++) {
          const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f;
          const ti = prox + k * .055; g.gain.setValueAtTime(0, ti); g.gain.linearRampToValueAtTime(.06, ti + .008); g.gain.linearRampToValueAtTime(0, ti + .035);
          o.connect(g).connect(pan || nos.gg); o.start(ti); o.stop(ti + .05);
        }
      }
      if (alvo.fogo > .01 && Math.random() < .7) {
        const s = ac.createBufferSource(); s.buffer = nos.br; const g = ac.createGain(), f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1500;
        const ti = prox + Math.random() * .3; g.gain.setValueAtTime(.25, ti); g.gain.exponentialRampToValueAtTime(.001, ti + .04);
        s.connect(f).connect(g).connect(nos.fg); s.start(ti, Math.random() * 3, .05);
      }
      prox += .28 + Math.random() * .6;
    }
    setTimeout(agendar, 200);
  }
  function ajustar(L, h, temFogo) {
    if (!ligado || !ac) return;
    const t = ac.currentTime, liso = (p, v) => p.setTargetAtTime(v, t, .6), rj = rajada(performance.now() / 1000);
    liso(nos.vg.gain, .02 + rj * .22); nos.vf.frequency.setTargetAtTime(380 + rj * 520, t, .8);
    const tarde = L.i <= 1 ? Math.max(0, 1 - Math.max(0, (h - .2) / .1)) : 0;
    liso(nos.cg.gain, .05 * tarde);
    alvo.grilo = (L.i === 2 || L.i === 3 || L.i === 5) ? 1 : 0;
    alvo.fogo = temFogo && L.escuro > .3 ? 1 : 0;
    liso(nos.gg.gain, alvo.grilo); liso(nos.fg.gain, alvo.fogo);
    liso(nos.dg.gain, L.i === 4 ? .09 : 0);
  }
  function alternar() {
    if (!ac) montar();
    ligado = !ligado;
    (ligado ? ac.resume() : ac.suspend()).catch(() => {});
    return ligado;
  }
  return { ajustar, alternar, ligado: () => ligado };
})();

export const CENAS_VIVAS = {
  estrada: { nome: 'A estrada ao entardecer', largura: 80, fabrica: cenaEstrada },
  vila: { nome: 'A vila de luto', largura: 40, fabrica: cenaVila },
  moco: { nome: 'O mocó da serrota', largura: 30, fabrica: cenaMoco },
};
export const ASPECTO_VIVO = H / W;

// a hora da cena segue o painel do mestre: parte do dia ou fase da noite
export function horaDaNoite(n) {
  if (!n) return 0.06;
  const dia = n.dia ?? -1;
  if ((n.fase < 0 || n.fase === 4) && dia >= 0) return [0.0, 0.0, 0.06, 0.2][dia] ?? 0.06;
  return [0.34, 0.52, 0.70, 0.86, 0.95][n.fase] ?? 0.06;
}

// liga um cenário num canvas; devolve os controles
export function criarCenaViva(canvas, id) {
  const def = CENAS_VIVAS[id] || CENAS_VIVAS.vila;
  ctx = canvas.getContext('2d');
  const cena = def.fabrica();
  const fixoCv = document.createElement('canvas'); fixoCv.width = W; fixoCv.height = H;
  cena.fixo(fixoCv.getContext('2d'));
  let hora = cena.horaInicial, alvo = hora, vivo = true, escala = 1;
  const medir = () => { const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1); if (!r.width) return; canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.width * dpr * H / W); escala = canvas.width / W; };
  const ro = new ResizeObserver(medir); ro.observe(canvas); medir();
  const t0 = performance.now(); let ultimo = t0;
  function quadro(agora) {
    if (!vivo) return;
    ctx = canvas.getContext('2d');
    const dt = Math.min(0.05, (agora - ultimo) / 1000); ultimo = agora;
    const t = (agora - t0) / 1000;
    hora += (alvo - hora) * Math.min(1, dt * 0.6);
    const L = luzEm(hora);
    som.ajustar(L, hora, cena.fogo);
    ctx.setTransform(escala, 0, 0, escala, 0, 0);
    ctx.drawImage(fixoCv, 0, 0);
    cena.desenhar(L, t, dt);
    ctx.fillStyle = `rgba(${L.tom.map(Math.round).join(',')},${L.tomA})`; ctx.globalCompositeOperation = 'soft-light'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
    escuridao(L, cena.luzes(L, t));
    vagaD(L, t);
    cena.depois(L, t);
    nevoa(L, t);
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * .95); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.4)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);
  return {
    setHora(h, ja) { alvo = h; if (ja) hora = h; },
    setVento(v) { vento = v; },
    fase: () => luzEm(hora).nome,
    som: () => som.alternar(),
    somLigado: () => som.ligado(),
    destruir() { vivo = false; ro.disconnect(); },
  };
}
