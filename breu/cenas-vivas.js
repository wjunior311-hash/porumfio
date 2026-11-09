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
// caminho suave por pontos (Catmull-Rom), com comprimento e distância
function caminhoSuave(pts, passo = 6) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / passo));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  const ac = [0]; for (let i = 1; i < out.length; i++) ac.push(ac[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
  const len = ac[ac.length - 1];
  const P = (s) => { s = Math.max(0, Math.min(len, s)); let i = 1; while (i < ac.length - 1 && ac[i] < s) i++; const u = (s - ac[i - 1]) / ((ac[i] - ac[i - 1]) || 1); return [lerp(out[i - 1][0], out[i][0], u), lerp(out[i - 1][1], out[i][1], u)]; };
  const dist = (x, y) => { let m = 1e9; for (let i = 0; i < out.length; i += 2) { const d = Math.hypot(x - out[i][0], y - out[i][1]); if (d < m) m = d; } return m; };
  return { P, len, dist, pts: out };
}
// terra batida: leito largo de manchas, sulcos de roda e capim no meio
function estradaTerra(g, cam, larg, sulco, capimNoMeio = true) {
  for (let s = 0; s <= cam.len; s += 3) {
    const p = cam.P(s), w = larg + fbm(s * .01, 3, 5) * larg * .4;
    const gr = g.createRadialGradient(p[0], p[1], 2, p[0], p[1], w);
    gr.addColorStop(0, 'rgba(176,104,62,.17)'); gr.addColorStop(.75, 'rgba(160,92,54,.12)'); gr.addColorStop(1, 'rgba(160,92,54,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(p[0], p[1], w, 0, 7); g.fill();
  }
  const lado = (s, off) => { const p = cam.P(s), q = cam.P(s + 3), nx = -(q[1] - p[1]), ny = q[0] - p[0], m = Math.hypot(nx, ny) || 1; return [p[0] + nx / m * off, p[1] + ny / m * off]; };
  if (sulco) [-sulco, sulco].forEach(off => { g.strokeStyle = 'rgba(108,58,30,.5)'; g.lineWidth = 4.5; g.lineCap = 'round'; g.beginPath(); for (let s = 0; s <= cam.len; s += 10) { const p = lado(s, off + (vnoise(s * .02, off, 9) - .5) * 4); s === 0 ? g.moveTo(p[0], p[1]) : g.lineTo(p[0], p[1]); } g.stroke(); g.strokeStyle = 'rgba(200,140,92,.22)'; g.lineWidth = 1.4; g.stroke(); });
  if (capimNoMeio) for (let s = 0; s < cam.len; s += 7) { if (vnoise(s * .03, 1, 4) < .5) continue; const p = lado(s, (R() - .5) * 6); g.strokeStyle = 'rgba(150,140,80,.65)'; g.lineWidth = 1; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + (R() - .5) * 6, p[1] - 4 - R() * 5); g.stroke(); } }
  for (let i = 0; i < cam.len / 14; i++) { const s = R() * cam.len, p = lado(s, (R() > .5 ? 1 : -1) * (larg * .8 + R() * 14)); seixo(g, p[0], p[1], 1.6 + R() * 3.4, [130, 116, 100]); }
}

// ---------- telhados vistos de cima, pintados uma vez numa folha só ----------
function telhado(tipo, w, h, op = {}) {
  const M = 34, cv = document.createElement('canvas'); cv.width = w + M * 2; cv.height = h + M * 2 + (op.alpendre ? 40 : 0);
  const g = cv.getContext('2d'); g.translate(M + w / 2, M + h / 2);
  const ah = op.alpendre ? 34 : 0;
  // o alpendre: um puxado de telhado mais baixo na frente, com os esteios na beira
  if (ah) {
    const aw = w * .72;
    g.fillStyle = tipo === 'telha' ? '#7c3a23' : '#94783f'; g.fillRect(-aw / 2, h / 2 - 4, aw, ah + 4);
    if (tipo === 'telha') { g.strokeStyle = 'rgba(40,16,8,.5)'; g.lineWidth = 1; for (let x = -aw / 2; x < aw / 2; x += 8) { g.beginPath(); g.moveTo(x, h / 2); g.lineTo(x, h / 2 + ah); g.stroke(); } }
    else { for (let x = -aw / 2; x < aw / 2; x += 2.5) { g.strokeStyle = `rgba(${R() > .5 ? '196,170,104' : '120,96,52'},.7)`; g.lineWidth = 1; g.beginPath(); g.moveTo(x, h / 2); g.lineTo(x + (R() - .5) * 2, h / 2 + ah + R() * 4); g.stroke(); } }
    g.fillStyle = 'rgba(20,10,4,.35)'; g.fillRect(-aw / 2, h / 2 - 2, aw, 6);
    [-aw / 2 + 5, 0, aw / 2 - 5].forEach((x) => { g.fillStyle = '#4a3220'; g.beginPath(); g.arc(x, h / 2 + ah - 3, 4, 0, 7); g.fill(); });
  }
  // beiral: a sombra da aba sobre a parede
  g.fillStyle = 'rgba(30,14,6,.45)'; g.fillRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4);
  const meia = (lado) => { g.beginPath(); lado < 0 ? g.rect(-w / 2, -h / 2, w, h / 2) : g.rect(-w / 2, 0, w, h / 2); };
  if (tipo === 'telha') {
    [-1, 1].forEach((lado) => {
      g.save(); meia(lado); g.clip();
      const base = lado < 0 ? [170, 84, 50] : [134, 62, 36];
      g.fillStyle = `rgb(${base.join(',')})`; g.fillRect(-w / 2, -h / 2, w, h);
      // telha capa e canal, em fiadas: o canal é mais escuro, a capa tem um brilho no meio
      const tw = 9, th = 13;
      for (let y = lado < 0 ? -h / 2 : 0, fila = 0; (lado < 0 ? y < 0 : y < h / 2); y += th, fila++) {
        for (let x = -w / 2, col = 0; x < w / 2; x += tw, col++) {
          const j = (R() - .5) * 22, musgo = R() < (op.velha ? .14 : .04), falta = op.velha && R() < .03;
          if (falta) { g.fillStyle = '#2a1a10'; g.fillRect(x, y, tw, th); continue; }
          const c = base.map((v) => v + j + (col % 2 ? -18 : 10));
          const gr = g.createLinearGradient(x, 0, x + tw, 0);
          gr.addColorStop(0, `rgb(${c.map((v) => v - 30).join(',')})`); gr.addColorStop(.5, `rgb(${c.map((v) => v + (col % 2 ? 0 : 26)).join(',')})`); gr.addColorStop(1, `rgb(${c.map((v) => v - 30).join(',')})`);
          g.fillStyle = gr;
          g.beginPath(); if (lado < 0) { g.moveTo(x, y + th); g.lineTo(x, y + 2); g.quadraticCurveTo(x + tw / 2, y - 3, x + tw, y + 2); g.lineTo(x + tw, y + th); } else { g.moveTo(x, y); g.lineTo(x, y + th - 2); g.quadraticCurveTo(x + tw / 2, y + th + 3, x + tw, y + th - 2); g.lineTo(x + tw, y); } g.fill();
          if (musgo) { g.fillStyle = 'rgba(96,104,58,.45)'; g.beginPath(); g.arc(x + tw / 2, y + th / 2, 4 + R() * 3, 0, 7); g.fill(); }
        }
        g.fillStyle = 'rgba(30,12,6,.28)'; g.fillRect(-w / 2, lado < 0 ? y + th - 2 : y, w, 2);
      }
      g.restore();
    });
    // cumeeira: telhas maiores emborcadas ao longo do meio
    for (let x = -w / 2; x < w / 2; x += 14) { const gr = g.createLinearGradient(0, -6, 0, 6); gr.addColorStop(0, '#c4704a'); gr.addColorStop(1, '#7a3620'); g.fillStyle = gr; g.beginPath(); g.ellipse(x + 7, 0, 8.5, 6.5, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(40,14,6,.5)'; g.lineWidth = 1; g.stroke(); }
  } else {
    [-1, 1].forEach((lado) => {
      g.save(); meia(lado); g.clip();
      const base = lado < 0 ? [190, 158, 96] : [150, 120, 66];
      g.fillStyle = `rgb(${base.join(',')})`; g.fillRect(-w / 2, -h / 2, w, h);
      // palha em camadas: fios curtos descendo do meio para a beira, cada fiada com a borda desfiada
      for (let y0 = 0; y0 < h / 2; y0 += 9) {
        for (let i = 0; i < w * 1.3; i++) {
          const x = -w / 2 + R() * w, l = 10 + R() * 8, k = R();
          const c = k < .4 ? base.map((v) => v + 30) : k < .8 ? base.map((v) => v - 10) : base.map((v) => v - 50);
          g.strokeStyle = `rgba(${c.map(Math.round).join(',')},.8)`; g.lineWidth = .9 + R() * .6;
          const ya = lado * y0, yb = lado * (y0 + l);
          g.beginPath(); g.moveTo(x, ya); g.lineTo(x + (R() - .5) * 3, yb); g.stroke();
        }
        g.fillStyle = 'rgba(40,24,8,.18)'; g.fillRect(-w / 2, lado < 0 ? -y0 - 9 : y0 + 7, w, 2);
      }
      g.restore();
    });
    // a beira desfiada passando da parede
    g.lineWidth = 1;
    for (let x = -w / 2; x < w / 2; x += 2) [-1, 1].forEach((lado) => { g.strokeStyle = 'rgba(150,120,64,.8)'; g.beginPath(); g.moveTo(x, lado * h / 2); g.lineTo(x + (R() - .5) * 3, lado * (h / 2 + 3 + R() * 6)); g.stroke(); });
    // cumeeira: um feixe amarrado com corda
    g.fillStyle = '#8c6c36'; g.fillRect(-w / 2, -6, w, 12);
    g.strokeStyle = 'rgba(60,40,16,.7)'; g.lineWidth = 1; for (let x = -w / 2; x < w / 2; x += 3) { g.beginPath(); g.moveTo(x, -6); g.lineTo(x + 2, 6); g.stroke(); }
    g.strokeStyle = '#5a3e1e'; g.lineWidth = 2.4; for (let x = -w / 2 + 12; x < w / 2; x += 22) { g.beginPath(); g.moveTo(x, -7); g.lineTo(x, 7); g.stroke(); }
  }
  // luz geral: o canto do sol mais claro, o outro mais fundo
  const gl = g.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); gl.addColorStop(0, 'rgba(255,230,190,.12)'); gl.addColorStop(1, 'rgba(20,8,2,.18)');
  g.fillStyle = gl; g.fillRect(-w / 2, -h / 2, w, h);
  if (op.velha) { for (let i = 0; i < 12; i++) { g.fillStyle = 'rgba(40,30,20,.25)'; g.beginPath(); g.arc((R() - .5) * w, (R() - .5) * h, 6 + R() * 12, 0, 7); g.fill(); } }
  // chaminé de barro
  if (op.chamine) { const [cx, cy] = op.chamine; g.fillStyle = 'rgba(20,10,4,.4)'; g.fillRect(cx - 9 + 4, cy - 9 + 5, 18, 18); g.fillStyle = '#9a6a48'; g.fillRect(cx - 9, cy - 9, 18, 18); g.fillStyle = '#1c120c'; g.fillRect(cx - 5, cy - 5, 10, 10); g.strokeStyle = 'rgba(60,36,20,.7)'; g.strokeRect(cx - 9, cy - 9, 18, 18); }
  g.strokeStyle = 'rgba(30,14,6,.55)'; g.lineWidth = 1.2; g.strokeRect(-w / 2, -h / 2, w, h);
  return { cv, ox: M + w / 2, oy: M + h / 2 };
}

function cenaVila() {
  R = rng(71);
  // o mesmo desenho do mapa do guia, ampliado para a cena
  const S = 1.38, Gm = (x, y) => [750 + (x - 450) * S, 500 + (y - 320) * S];
  const C = { x: 750, y: 486 }, RAIO = 403, GAP = { a: -0.42, b: -0.08 };
  const noCirc = (a, r = RAIO) => [C.x + Math.cos(a) * r, C.y + Math.sin(a) * r * .92];
  const bez = (p0, c, p1, n) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, u = 1 - t; return [u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]]; });
  const estrada = caminhoSuave([[-60, 200], ...bez([0, 210], [300, 250], [470, 290], 8), ...bez([470, 290], [640, 330], [900, 250], 8).slice(1), [960, 235]].map(([x, y], i) => (i === 0 ? Gm(-30, 205) : Gm(x, y))));
  const trilha = caminhoSuave([[700, 450], [600, 360], [520, 250], [380, 160], [200, 80], [-40, -10]]);
  const patio = { x: 760, y: 520 };
  // as casas: [id, x, y, w, h, tipo, extras]
  const casas = [
    ['velorio', 410, 107, 176, 112, 'telha', { alpendre: true, chamine: [60, -20] }],
    ['zuleide', 640, 141, 132, 92, 'telha', { alpendre: true }],
    ['farinha', 205, 193, 200, 140, 'palha', { chamine: [-50, 30], aberta: true }],
    ['venda', 180, 331, 146, 96, 'telha', {}],
    ['oficina', 200, 451, 124, 88, 'palha', { chamine: [34, -14] }],
    ['cicero', 365, 550, 120, 84, 'palha', {}],
    ['casabento', 535, 531, 116, 82, 'palha', {}],
    ['firmina', 735, 551, 118, 82, 'telha', {}],
    ['fechada', 625, 441, 124, 86, 'telha', { velha: true }],
  ].map(([id, gx, gy, w, h, tipo, op]) => {
    const [x0, y0] = Gm(gx, gy), x = C.x + (x0 - C.x) * .8, y = C.y + (y0 - C.y) * .8; w *= .9; h *= .9; const ang = Math.atan2(patio.y - y, patio.x - x) - Math.PI / 2 + (R() - .5) * .14;
    return { id, x, y, w, h, tipo, op, ang, sprite: telhado(tipo, w, h, op) };
  });
  const casa = Object.fromEntries(casas.map((c) => [c.id, c]));
  // um ponto na frente de uma casa (o lado +y dela olha para o pátio)
  const frente = (c, d = 0, lado = 0) => { const fx = -Math.sin(c.ang), fy = Math.cos(c.ang), lx = Math.cos(c.ang), ly = Math.sin(c.ang); return [c.x + fx * (c.h / 2 + d) + lx * lado, c.y + fy * (c.h / 2 + d) + ly * lado]; };
  const [poX, poY] = Gm(470, 380), poco = { x: poX, y: poY };
  const juazeiro = { x: 985, y: 520, r: 72 };
  const carroca = { x: 640, y: 590, ang: .35 };
  const zeca = { x: 1262, y: 506 };
  const cerca = []; for (let k = 0; k < 9; k++) cerca.push({ x: zeca.x - 30 + k * 2, y: zeca.y - 150 + k * 36 });
  const naCasa = (x, y, folga) => casas.some((c) => { const dx = x - c.x, dy = y - c.y, lx = dx * Math.cos(-c.ang) - dy * Math.sin(-c.ang), ly = dx * Math.sin(-c.ang) + dy * Math.cos(-c.ang); return Math.abs(lx) < c.w / 2 + folga && Math.abs(ly) < c.h / 2 + folga + 20; });
  const dentro = (x, y) => Math.hypot(x - C.x, (y - C.y) / .92) < RAIO - 12;
  const plantas = caatinga(71, (x, y, tipo) => {
    if (estrada.dist(x, y) < (tipo === 'capim' ? 40 : 66) || trilha.dist(x, y) < (tipo === 'capim' ? 20 : 40)) return false;
    if (naCasa(x, y, tipo === 'capim' ? 10 : 34)) return false;
    if (Math.hypot(x - juazeiro.x, y - juazeiro.y) < 110 || Math.hypot(x - poco.x, y - poco.y) < 70 || Math.hypot(x - carroca.x, y - carroca.y) < 80 || Math.hypot(x - zeca.x, y - zeca.y) < 90) return false;
    const rc = Math.hypot(x - C.x, (y - C.y) / .92);
    if (Math.abs(rc - RAIO) < 34) return false; // a faixa do círculo fica limpa
    if (rc < RAIO) return tipo === 'capim' ? R() < .35 : (tipo === 'jurema' || tipo === 'mandacaru') && R() < .12 && Math.hypot(x - patio.x, y - patio.y) > 200;
    return true;
  }, { jurema: 70, macambira: 26, xique: 20, mandacaru: 16, capim: 300 });
  const traco = []; for (let a = 0; a < Math.PI * 2; a += 0.01) traco.push({ a, r: RAIO + Math.sin(a * 9) * 4 + (R() - .5) * 3 });
  const glifos = []; for (let k = 0; k < 16; k++) glifos.push({ a: (k / 16) * Math.PI * 2 + 0.11, tipo: k % 3 });
  const naFenda = (a) => { let x = a % (Math.PI * 2); if (x > Math.PI) x -= Math.PI * 2; return x > GAP.a && x < GAP.b; };
  // o trecho: '' ou 'aberto' (apagado), 'fino' ou 'forte' (consertado), 'brecha' (rompido na noite)
  const TR = { estado: '', alvo: 0, prog: 0 };
  function setTrecho(v, ja) { TR.estado = v || ''; TR.alvo = v === 'fino' || v === 'forte' ? 1 : 0; if (ja) TR.prog = TR.alvo; }
  const olhos = Array.from({ length: 6 }, (_, i) => { const a = GAP.a - 0.2 + i * 0.1, d = RAIO + 80 + (i % 3) * 30; const [x, y] = noCirc(a, d); return { x, y, f: R() * 6.28 }; });
  const [gx2, gy2] = noCirc((GAP.a + GAP.b) / 2, RAIO + 150), grande = { x: gx2, y: gy2, vai: 60 };
  const fumaca = [];

  function fixo(g) {
    // o chão: terra, com o pátio varrido mais claro e a terra pisada em volta das casas
    terreno(g, 71, { escuro: [142, 102, 62], base: [172, 134, 88], claro: [198, 168, 120] }, (x, y, c) => {
      const dp = Math.hypot(x - patio.x, (y - patio.y) * 1.2); if (dp < 300) c = mix(c, [206, 176, 128], (1 - dp / 300) * .55);
      const rc = Math.hypot(x - C.x, (y - C.y) / .92); if (rc < RAIO) c = mix(c, [190, 156, 108], .18);
      return c;
    });
    // trilhas de pé: da porta de cada casa até o pátio
    casas.forEach((c) => { const [fx, fy] = frente(c, 18), cam = caminhoSuave([[fx, fy], [lerp(fx, patio.x, .5) + (R() - .5) * 40, lerp(fy, patio.y, .5) + (R() - .5) * 40], [lerp(fx, patio.x, .82), lerp(fy, patio.y, .82)]]); for (let s = 0; s <= cam.len; s += 4) { const p = cam.P(s), gr = g.createRadialGradient(p[0], p[1], 1, p[0], p[1], 14); gr.addColorStop(0, 'rgba(214,184,136,.22)'); gr.addColorStop(1, 'rgba(214,184,136,0)'); g.fillStyle = gr; g.beginPath(); g.arc(p[0], p[1], 14, 0, 7); g.fill(); } });
    estradaTerra(g, trilha, 18, 0, false);
    estradaTerra(g, estrada, 46, 15);
    // marcas de vassoura de mato no pátio
    g.strokeStyle = 'rgba(120,88,52,.16)'; g.lineWidth = 1;
    for (let i = 0; i < 90; i++) { const a = R() * 6.28, d = R() * 220, x = patio.x + Math.cos(a) * d, y = patio.y + Math.sin(a) * d * .8, b = R() * 6.28; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x, y, 14 + k * 2.2, b, b + .9); g.stroke(); } }
    // pó de cal espalhado na faixa do círculo, mais forte perto da linha
    for (let i = 0; i < 2600; i++) { const a = R() * 6.28; if (naFenda(a)) continue; const d = RAIO + (R() - .5) * (R() < .7 ? 16 : 44), [x, y] = noCirc(a, d); g.fillStyle = `rgba(240,234,220,${.08 + R() * .22})`; g.beginPath(); g.arc(x, y, .6 + R() * 1.8, 0, 7); g.fill(); }
    // o trecho apagado: borrões de mão em meia-lua e a cal arrastada
    for (let k = 0; k < 8; k++) { const a = lerp(GAP.a, GAP.b, k / 7), [x, y] = noCirc(a); g.strokeStyle = `rgba(232,224,206,${.16 + R() * .1})`; g.lineWidth = 10 + R() * 6; g.lineCap = 'round'; g.beginPath(); g.arc(x + 10, y, 18 + R() * 6, Math.PI * .55, Math.PI * 1.45); g.stroke(); }
    { const [x, y] = noCirc(-0.2, RAIO + 36); g.save(); g.translate(x, y); g.rotate(.6); g.fillStyle = 'rgba(30,16,6,.35)'; g.beginPath(); g.ellipse(4, 5, 13, 9, 0, 0, 7); g.fill(); g.fillStyle = '#8c8a84'; g.beginPath(); g.ellipse(0, 0, 13, 9, 0, 0, 7); g.fill(); g.fillStyle = '#efe9dc'; g.beginPath(); g.ellipse(-1, -1, 9, 6, 0, 0, 7); g.fill(); g.restore(); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(240,234,220,${R() * .4})`; g.beginPath(); g.arc(x + 10 + R() * 40, y + (R() - .5) * 26, 1 + R() * 3, 0, 7); g.fill(); } }
    // pegadas pequenas indo e vindo da casa do pouso até o trecho
    { const [za, zb] = frente(casa.zuleide, 30), [ta, tb] = noCirc(-0.25, RAIO - 10); const cam = caminhoSuave([[za, zb], [lerp(za, ta, .5), lerp(zb, tb, .5) + 30], [ta, tb]]); g.fillStyle = 'rgba(96,58,30,.3)'; for (let s = 10; s < cam.len; s += 17) { const p = cam.P(s), q = cam.P(s + 2), a = Math.atan2(q[1] - p[1], q[0] - p[0]); g.save(); g.translate(p[0] + Math.cos(a + 1.57) * ((s / 17) % 2 ? 4 : -4), p[1] + Math.sin(a + 1.57) * ((s / 17) % 2 ? 4 : -4)); g.rotate(a); g.beginPath(); g.ellipse(0, 0, 4, 1.8, 0, 0, 7); g.fill(); g.restore(); } }
    // quintais: o que cada casa deixa do lado de fora (pintado no chão, parado)
    const at = (c, d, l) => frente(c, d, l);
    // velório: cadeiras de quem espera, a fita preta na porta, flores no chão
    { const c = casa.velorio; [[-60, 54], [-30, 60], [40, 58], [70, 50]].forEach(([l, d], k) => { const [x, y] = at(c, d, l); cadeira(g, x, y, c.ang + (R() - .5) * .5); }); const [px, py] = at(c, 34, 0); g.fillStyle = '#121212'; g.fillRect(px - 2, py - 18, 4, 14); for (let i = 0; i < 14; i++) { g.fillStyle = ['#f0e6c8', '#d8b8e0', '#e8d060'][i % 3]; g.beginPath(); g.arc(px + (R() - .5) * 46, py + 8 + R() * 16, 2.4, 0, 7); g.fill(); } }
    // pouso de Zuleide: vasos de planta no alpendre e o banco
    { const c = casa.zuleide; [[-50, 30], [-36, 30], [48, 30]].forEach(([l, d]) => { const [x, y] = at(c, d, l); pote(g, x, y, 8, false); g.fillStyle = '#5f7a44'; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(x + (R() - .5) * 10, y + (R() - .5) * 10, 3.5, 0, 7); g.fill(); } }); }
    // venda: sacos, um barril, a tabuleta e o toldo listrado
    { const c = casa.venda; g.save(); const [tx, ty] = at(c, 14, 0); g.translate(tx, ty); g.rotate(c.ang); g.fillStyle = 'rgba(30,16,6,.3)'; g.fillRect(-56, 4, 116, 30); for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? '#c9b98f' : '#8a3b2a'; g.fillRect(-58 + k * 14.5, 0, 14.5, 26); } g.fillStyle = 'rgba(255,240,210,.12)'; g.fillRect(-58, 0, 116, 8); g.strokeStyle = 'rgba(60,30,14,.6)'; g.strokeRect(-58, 0, 116, 26); g.restore(); [[-80, 30, '#e3d6b4'], [-70, 46, '#d8c8a0'], [78, 36, '#e3d6b4']].forEach(([l, d, cor]) => { const [x, y] = at(c, d, l); saco(g, x, y, 11, cor); }); const [bx2, by2] = at(c, 44, 64); g.fillStyle = 'rgba(30,16,6,.35)'; g.beginPath(); g.arc(bx2 + 4, by2 + 4, 13, 0, 7); g.fill(); g.fillStyle = '#6e4a2c'; g.beginPath(); g.arc(bx2, by2, 13, 0, 7); g.fill(); g.strokeStyle = '#3a3634'; g.lineWidth = 2.5; g.beginPath(); g.arc(bx2, by2, 10, 0, 7); g.stroke(); }
    // oficina: bigorna no toco, tina d'água, ferro e trancas encostadas
    { const c = casa.oficina; const [ax, ay] = at(c, 30, -30); g.fillStyle = 'rgba(30,16,6,.35)'; g.beginPath(); g.arc(ax + 4, ay + 5, 15, 0, 7); g.fill(); g.fillStyle = '#5a4030'; g.beginPath(); g.arc(ax, ay, 15, 0, 7); g.fill(); g.fillStyle = '#9a7650'; g.beginPath(); g.arc(ax, ay, 11, 0, 7); g.fill(); g.save(); g.translate(ax, ay); g.rotate(c.ang); g.fillStyle = '#3b3e42'; g.beginPath(); g.moveTo(-16, -6); g.lineTo(12, -6); g.quadraticCurveTo(22, -4, 24, 0); g.quadraticCurveTo(22, 4, 12, 6); g.lineTo(-16, 6); g.closePath(); g.fill(); g.fillStyle = 'rgba(200,210,220,.35)'; g.fillRect(-14, -5, 24, 3); g.restore(); const [tx2, ty2] = at(c, 34, 32); g.fillStyle = '#4a3220'; g.beginPath(); g.arc(tx2, ty2, 14, 0, 7); g.fill(); g.fillStyle = '#2a3a44'; g.beginPath(); g.arc(tx2, ty2, 10, 0, 7); g.fill(); for (let k = 0; k < 5; k++) { const [x, y] = at(c, 8 + k * 5, 58); g.strokeStyle = '#4a4a4c'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(c.ang) * 34, y + Math.sin(c.ang) * 34); g.stroke(); } }
    // casa das crianças: amarelinha riscada no chão e um pião largado
    { const c = casa.cicero; const [x0, y0] = at(c, 40, -10); g.save(); g.translate(x0, y0); g.rotate(c.ang); g.strokeStyle = 'rgba(240,234,220,.55)'; g.lineWidth = 1.6; [[0, 0], [0, 20], [-10, 40], [10, 40], [0, 60], [-10, 80], [10, 80]].forEach(([x, y]) => g.strokeRect(x - 10, y, 20, 20)); g.beginPath(); g.arc(0, 112, 12, Math.PI, 0); g.stroke(); g.restore(); const [px2, py2] = at(c, 30, 46); g.fillStyle = '#8a3b2a'; g.beginPath(); g.arc(px2, py2, 5, 0, 7); g.fill(); g.strokeStyle = '#d8c8a0'; g.lineWidth = 1; g.beginPath(); g.moveTo(px2, py2); g.quadraticCurveTo(px2 + 12, py2 + 8, px2 + 22, py2 - 2); g.stroke(); }
    // casa do aprendiz: baldes de cal e o pincel de agave
    { const c = casa.casabento; [[-30, 24], [-12, 30]].forEach(([l, d]) => { const [x, y] = at(c, d, l); g.fillStyle = 'rgba(30,16,6,.3)'; g.beginPath(); g.arc(x + 3, y + 4, 11, 0, 7); g.fill(); g.fillStyle = '#7d746a'; g.beginPath(); g.arc(x, y, 11, 0, 7); g.fill(); g.fillStyle = '#efe9dc'; g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill(); }); const [x, y] = at(c, 30, 10); g.strokeStyle = '#7a5a34'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 26, y + 8); g.stroke(); g.fillStyle = '#d8d0c0'; g.beginPath(); g.ellipse(x + 30, y + 9, 6, 4, .3, 0, 7); g.fill(); }
    // parteira: canteiro de ervas cercado de varas e o varal de panos brancos
    { const c = casa.firmina; const [x0, y0] = at(c, 44, -36); g.save(); g.translate(x0, y0); g.rotate(c.ang); g.fillStyle = '#7a5434'; g.fillRect(-34, -18, 68, 40); g.fillStyle = 'rgba(60,36,18,.4)'; for (let k = -14; k < 22; k += 9) g.fillRect(-34, k, 68, 2); for (let i = 0; i < 26; i++) { g.fillStyle = ['#6f8a4a', '#8aa058', '#56713c'][i % 3]; g.beginPath(); g.arc(-28 + (i % 8) * 8, -12 + Math.floor(i / 8) * 10, 3 + R() * 1.6, 0, 7); g.fill(); } g.strokeStyle = '#5a3e26'; g.lineWidth = 2; g.strokeRect(-36, -20, 72, 44); g.restore(); }
    // casa fechada: tábuas em X na porta, mato crescendo encostado, pote quebrado
    { const c = casa.fechada; const [x, y] = at(c, 4, 0); g.save(); g.translate(x, y); g.rotate(c.ang); g.fillStyle = 'rgba(30,16,6,.3)'; g.fillRect(-16, 2, 34, 10); g.strokeStyle = '#5a4030'; g.lineWidth = 5; g.beginPath(); g.moveTo(-15, -2); g.lineTo(15, 10); g.moveTo(-15, 10); g.lineTo(15, -2); g.stroke(); g.restore(); for (let i = 0; i < 26; i++) { const [px, py] = at(c, -10 + R() * 30, (R() - .5) * (c.w + 20)); g.strokeStyle = 'rgba(160,140,80,.8)'; g.lineWidth = 1; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(px, py); g.lineTo(px + (R() - .5) * 8, py - 5 - R() * 7); g.stroke(); } } const [qx, qy] = at(c, 26, 40); g.fillStyle = '#a85c36'; [[0, 0, 7, 0, 3], [9, 4, 5, 3, 5.5]].forEach(([dx, dy, r, a0, a1]) => { g.beginPath(); g.arc(qx + dx, qy + dy, r, a0, a1); g.lineTo(qx + dx, qy + dy); g.fill(); }); }
    // casa de farinha: cascas de mandioca, o cocho e a lenha
    { const c = casa.farinha; for (let i = 0; i < 60; i++) { const [x, y] = at(c, 20 + R() * 40, -80 + R() * 70); g.fillStyle = R() > .5 ? '#8a5a38' : '#c9a878'; g.save(); g.translate(x, y); g.rotate(R() * 6.28); g.fillRect(-5, -1.5, 10, 3); g.restore(); } const [lx, ly] = at(c, 30, 70); g.save(); g.translate(lx, ly); g.rotate(c.ang); lenhaPilha(g, 0, 0, 10); g.restore(); }
    // a cerca de Zeca, fora do círculo, perto do trecho: estacas e arame
    g.strokeStyle = 'rgba(170,160,148,.85)'; g.lineWidth = 1.2; g.beginPath(); cerca.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.stroke();
    cerca.forEach((p) => { const gr = g.createRadialGradient(p.x - 1.5, p.y - 1.5, .5, p.x, p.y, 5); gr.addColorStop(0, '#9c7a54'); gr.addColorStop(1, '#4a3420'); g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, 5, 0, 7); g.fill(); });
    // os dois baldes e a vara de Zeca
    [[-16, 8], [16, -6]].forEach(([dx, dy]) => { const x = zeca.x + 28 + dx, y = zeca.y + dy; g.fillStyle = 'rgba(30,16,6,.35)'; g.beginPath(); g.arc(x + 3, y + 4, 11, 0, 7); g.fill(); g.fillStyle = '#5e4128'; g.beginPath(); g.arc(x, y, 11, 0, 7); g.fill(); g.fillStyle = '#2a3e4a'; g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill(); g.fillStyle = 'rgba(200,220,235,.3)'; g.beginPath(); g.ellipse(x - 2, y - 2, 3, 1.5, .4, 0, 7); g.fill(); });
    g.strokeStyle = '#7a5636'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(zeca.x + 2, zeca.y + 30); g.lineTo(zeca.x + 58, zeca.y - 26); g.stroke();
    // debaixo do juazeiro: o banquinho de Celeste e o cesto de linhas
    { const x = juazeiro.x + 18, y = juazeiro.y + 30; g.fillStyle = 'rgba(30,16,6,.3)'; g.fillRect(x - 10, y - 6, 24, 18); tabuas(g, x - 12, y - 10, 24, 18, '#6e4d30', false); const cx = x + 30, cy = y + 6; g.fillStyle = '#b8955a'; g.beginPath(); g.arc(cx, cy, 11, 0, 7); g.fill(); g.strokeStyle = 'rgba(110,80,36,.8)'; g.lineWidth = 1; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(cx, cy, 3 + k * 2, 0, 7); g.stroke(); } ['#a8402c', '#2f5d8a', '#e9c64a', '#2f6d4a'].forEach((cor, k) => { g.fillStyle = cor; g.beginPath(); g.arc(cx - 4 + (k % 2) * 8, cy - 4 + Math.floor(k / 2) * 8, 3.4, 0, 7); g.fill(); }); }
    pintarPedrinhas(g, 70);
  }

  // ---------- peças que mudam com a luz ----------
  function casaD(c, L) {
    const sv = vetorSombra(L);
    sombraForma(() => { ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.ang); ctx.beginPath(); ctx.rect(-c.w / 2 - 4, -c.h / 2 - 4, c.w + 8, c.h + 8 + (c.op.alpendre ? 30 : 0)); ctx.restore(); }, sv.x * 34, sv.y * 34, .55);
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.ang); ctx.drawImage(c.sprite.cv, -c.sprite.ox, -c.sprite.oy); ctx.restore();
  }
  function juazeiroD(t, L) {
    const v = rajada(t), sv = vetorSombra(L), j = juazeiro;
    sombraForma(() => { ctx.beginPath(); ctx.ellipse(j.x, j.y, j.r, j.r * .86, 0, 0, 7); }, sv.x * 60, sv.y * 60, .6);
    // a copa: o juazeiro fica verde mesmo na seca
    for (let k = 0; k < 34; k++) { const a = k * 2.399, d = Math.sqrt(k / 34) * j.r * .78, s = Math.sin(t * 1.2 + k) * v * 2.4; const x = j.x + Math.cos(a) * d + s, y = j.y + Math.sin(a) * d * .9; const r = j.r * (.3 - d / j.r * .1); ctx.fillStyle = `rgb(${68 + (k % 5) * 6},${92 + (k % 4) * 7},${50 + (k % 3) * 5})`; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
    for (let k = 0; k < 14; k++) { const a = k * 2.399 + .5, d = Math.sqrt(k / 14) * j.r * .55; ctx.fillStyle = 'rgba(170,190,110,.28)'; ctx.beginPath(); ctx.arc(j.x + Math.cos(a) * d - 10, j.y + Math.sin(a) * d * .9 - 12, j.r * .14, 0, 7); ctx.fill(); }
  }
  function pocoD(L) {
    const sv = vetorSombra(L), p = poco;
    sombraForma(() => { ctx.beginPath(); ctx.arc(p.x, p.y, 30, 0, 7); }, sv.x * 14, sv.y * 14, .5);
    const gr = ctx.createRadialGradient(p.x - 8, p.y - 8, 4, p.x, p.y, 32); gr.addColorStop(0, '#a49a8c'); gr.addColorStop(1, '#5e574e'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p.x, p.y, 30, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(50,44,38,.6)'; ctx.lineWidth = 1.4; for (let k = 0; k < 14; k++) { const a = k * .449; ctx.beginPath(); ctx.moveTo(p.x + Math.cos(a) * 19, p.y + Math.sin(a) * 19); ctx.lineTo(p.x + Math.cos(a) * 30, p.y + Math.sin(a) * 30); ctx.stroke(); }
    ctx.fillStyle = '#0d1418'; ctx.beginPath(); ctx.arc(p.x, p.y, 19, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(150,180,200,.3)'; ctx.beginPath(); ctx.ellipse(p.x - 5, p.y - 4, 5, 2.4, .4, 0, 7); ctx.fill();
    // o sarilho: dois paus e o rolo com a corda
    ctx.fillStyle = '#4a3220'; [[-34, 0], [34, 0]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(p.x + dx, p.y + dy, 5, 0, 7); ctx.fill(); });
    const rg = ctx.createLinearGradient(0, p.y - 5, 0, p.y + 5); rg.addColorStop(0, '#9a7650'); rg.addColorStop(1, '#5a3e26'); ctx.fillStyle = rg; ctx.fillRect(p.x - 32, p.y - 5, 64, 10);
    ctx.strokeStyle = 'rgba(214,196,150,.8)'; ctx.lineWidth = 1; for (let x = -10; x < 10; x += 2.5) { ctx.beginPath(); ctx.moveTo(p.x + x, p.y - 5); ctx.lineTo(p.x + x + 1.5, p.y + 5); ctx.stroke(); }
    ctx.fillStyle = '#6a4c32'; ctx.beginPath(); ctx.arc(p.x + 40, p.y + 22, 9, 0, 7); ctx.fill(); ctx.fillStyle = '#2a3e4a'; ctx.beginPath(); ctx.arc(p.x + 40, p.y + 22, 6, 0, 7); ctx.fill();
  }
  function carrocaD(L, t) {
    const sv = vetorSombra(L), k = carroca;
    ctx.save(); ctx.translate(k.x, k.y); ctx.rotate(k.ang);
    sombraForma(() => { ctx.beginPath(); ctx.rect(-50, -30, 100, 60); }, ...[sv.x * 24, sv.y * 24].map((v, i, a) => (i ? a[0] * Math.sin(-k.ang) + v * Math.cos(-k.ang) : v * Math.cos(-k.ang) - a[1] * Math.sin(-k.ang))), .5);
    ctx.strokeStyle = '#5a3e26'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(48, -12); ctx.lineTo(108, -16); ctx.moveTo(48, 12); ctx.lineTo(108, 16); ctx.stroke();
    ctx.fillStyle = '#2f2012'; ctx.fillRect(-8, -38, 8, 76);
    // a lona amarrada por cima da carga de pó
    const gr = ctx.createLinearGradient(0, -30, 0, 30); gr.addColorStop(0, '#a89878'); gr.addColorStop(.5, '#8a7a5c'); gr.addColorStop(1, '#6e6048'); ctx.fillStyle = gr;
    const onda = Math.sin(t * 2.2) * rajada(t) * 2;
    ctx.beginPath(); ctx.moveTo(-48, -28); ctx.lineTo(46, -28 + onda); ctx.lineTo(46, 28); ctx.lineTo(-48, 28); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(60,48,30,.55)'; ctx.lineWidth = 1.2; [-14, 0, 14].forEach((y) => { ctx.beginPath(); ctx.moveTo(-48, y); ctx.quadraticCurveTo(0, y + 4, 46, y); ctx.stroke(); });
    ctx.strokeStyle = '#3e2a1a'; ctx.lineWidth = 2; [-30, 0, 30].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, -30); ctx.lineTo(x, 30); ctx.stroke(); });
    ctx.restore();
  }
  function trechoD(L, t, dt) {
    // a linha nova vai sendo riscada da ponta de cima para a de baixo, devagar, como uma mão de riscador
    TR.prog += (TR.alvo - TR.prog) * Math.min(1, dt * (TR.alvo ? 0.9 : 2.5));
    if (TR.prog < 0.01) {
      if (TR.estado === 'brecha') {
        // brecha: a linha racha para fora, com uma luz vermelha baixa
        const [x, y] = noCirc((GAP.a + GAP.b) / 2); const p = 0.5 + 0.5 * Math.sin(t * 3);
        const gr = ctx.createRadialGradient(x, y, 4, x, y, 90); gr.addColorStop(0, `rgba(255,70,30,${0.35 + p * 0.25})`); gr.addColorStop(1, 'rgba(255,70,30,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 90, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(30,8,4,.7)'; ctx.lineWidth = 2.5; ctx.beginPath();
        for (let k = 0; k < 7; k++) { const a = lerp(GAP.a - .06, GAP.b + .06, k / 6), [cx, cy] = noCirc(a, RAIO + (k % 2 ? 9 : -9)); k ? ctx.lineTo(cx, cy) : ctx.moveTo(cx, cy); } ctx.stroke();
      }
      return;
    }
    const forte = TR.estado === 'forte', fim = lerp(GAP.a, GAP.b, Math.min(1, TR.prog));
    const noite = Math.min(1, L.escuro * 1.2);
    ctx.lineCap = 'round';
    [[forte ? 6 : 4, 'rgba(150,140,120,.35)'], [forte ? 3.6 : 2.2, `rgba(250,246,234,${forte ? .95 : .75})`]].forEach(([lw, cor]) => {
      ctx.strokeStyle = cor; ctx.lineWidth = lw; ctx.beginPath(); let ini = true;
      for (let a = GAP.a - 0.01; a <= fim; a += 0.008) { const tremor = forte ? 0 : Math.sin(a * 140) * 1.6; const [x, y] = noCirc(a, RAIO + tremor); ini ? ctx.moveTo(x, y) : ctx.lineTo(x, y); ini = false; }
      ctx.stroke();
    });
    // a ponta que está riscando agora brilha
    if (TR.prog < 0.98) { const [x, y] = noCirc(fim); const gr = ctx.createRadialGradient(x, y, 1, x, y, 26); gr.addColorStop(0, 'rgba(255,250,230,.9)'); gr.addColorStop(1, 'rgba(255,250,230,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 26, 0, 7); ctx.fill(); }
    // consertado forte: brilha de leve à noite, com a mão do riscador
    if (forte && noite > .3) { ctx.save(); ctx.shadowColor = `rgba(255,240,200,${0.4 + 0.2 * Math.sin(t * 1.5)})`; ctx.shadowBlur = 16; ctx.strokeStyle = 'rgba(255,250,235,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let a = GAP.a; a <= fim; a += 0.01) { const [x, y] = noCirc(a); a === GAP.a ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); ctx.restore(); }
  }
  function circulo(L, t) {
    const noite = Math.min(1, L.escuro * 1.2);
    ctx.lineCap = 'round';
    [[7, 'rgba(150,140,120,.4)'], [3.4, `rgba(246,242,230,${0.8 + noite * .18})`], [1.2, 'rgba(255,255,250,.6)']].forEach(([lw, cor]) => {
      ctx.strokeStyle = cor; ctx.lineWidth = lw; ctx.beginPath(); let abriu = false;
      traco.forEach((p) => { if (naFenda(p.a)) { abriu = false; return; } const [x, y] = noCirc(p.a, p.r); abriu ? ctx.lineTo(x, y) : ctx.moveTo(x, y); abriu = true; });
      ctx.stroke();
    });
    glifos.forEach((gl) => {
      if (naFenda(gl.a)) return;
      const [x, y] = noCirc(gl.a, RAIO - 26);
      ctx.save(); ctx.translate(x, y); ctx.rotate(gl.a + Math.PI / 2);
      const brilho = noite > .3 ? 0.35 + 0.25 * Math.sin(t * 1.3 + gl.a * 3) : 0;
      if (brilho > 0) { ctx.shadowColor = `rgba(255,240,200,${brilho})`; ctx.shadowBlur = 14; }
      ctx.strokeStyle = 'rgba(245,240,226,.88)'; ctx.lineWidth = 2.6; ctx.beginPath();
      if (gl.tipo === 0) { ctx.moveTo(-2, -12); ctx.lineTo(-4, 12); ctx.moveTo(-1, -4); ctx.lineTo(10, -4); ctx.moveTo(-12, 7); ctx.lineTo(12, 7); }
      else if (gl.tipo === 1) { ctx.moveTo(0, -12); ctx.lineTo(0, 12); ctx.moveTo(-10, -9); ctx.quadraticCurveTo(-17, 0, -10, 9); ctx.moveTo(10, -9); ctx.quadraticCurveTo(17, 0, 10, 9); }
      else { ctx.moveTo(0, -12); ctx.lineTo(0, 8); ctx.moveTo(-11, -2); ctx.quadraticCurveTo(-8, 12, 0, 12); ctx.quadraticCurveTo(8, 12, 11, -2); }
      ctx.stroke(); ctx.restore();
    });
    ctx.shadowBlur = 0;
  }
  const vel = casa.velorio, far = casa.farinha;
  const pontoTelhado = (c) => { const [cx, cy] = c.op.chamine; return [c.x + cx * Math.cos(c.ang) - cy * Math.sin(c.ang), c.y + cx * Math.sin(c.ang) + cy * Math.cos(c.ang)]; };
  return {
    titulo: 'A vila de luto', legenda: 'A vila desenhada como no mapa do guia: o velório no alto, o pouso de Zuleide ao lado, a casa de farinha à esquerda, a venda, a oficina, as casas de baixo e a casa fechada. O juazeiro onde a bordadeira costura, o poço do pátio, a carroça do homem tatuado, e o círculo de cal com o trecho apagado do lado da estrada, onde fica a cerca do moço dos baldes. Escala sugerida no mapa: 40 passos de largura.',
    horaInicial: 0.08, fogo: false, setTrecho,
    fixo,
    desenhar(L, t, dt) {
      desenharCaatinga(plantas, t, L, true);
      circulo(L, t); trechoD(L, t, dt);
      pocoD(L); carrocaD(L, t);
      casas.forEach((c) => casaD(c, L));
      juazeiroD(t, L);
      desenharCaatinga(plantas, t, L, false);
      urubus(L, t, { x: C.x, y: C.y - 60 });
      poeiraD(t, dt, L);
      const fontes = [{ x: pontoTelhado(vel)[0], y: pontoTelhado(vel)[1], taxa: .45 }, { x: pontoTelhado(far)[0], y: pontoTelhado(far)[1], taxa: L.escuro > .3 ? .2 : .5 }];
      if (L.escuro < .5) fontes.push({ x: pontoTelhado(casa.oficina)[0], y: pontoTelhado(casa.oficina)[1], taxa: .6 });
      fumacaD(fontes, fumaca, t, dt, L);
    },
    luzes(L, t) {
      const [px, py] = frente(vel, 30), [fx, fy] = frente(far, 20);
      const l = [{ x: px, y: py, r: 140 * tremor(t, 1), cor: [255, 180, 90], forca: .9 }, { x: fx, y: fy, r: 120 * tremor(t, 2), cor: [255, 170, 80], forca: .75 }];
      // lamparinas tapadas: só um fio de luz na frente de algumas casas
      ['zuleide', 'venda', 'firmina', 'casabento', 'cicero'].forEach((id, k) => { const [x, y] = frente(casa[id], 10); l.push({ x, y, r: 44 * tremor(t, k + 5), cor: [255, 190, 110], forca: .5 }); });
      if (TR.estado === 'brecha' && TR.prog < 0.01) { const [x, y] = noCirc((GAP.a + GAP.b) / 2); l.push({ x, y, r: 120 * (0.85 + 0.15 * Math.sin(t * 3)), cor: [255, 60, 30], forca: .8 }); }
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

// ================= INTERIORES: casas vistas de cima, sem o telhado =================
// peças estáticas (pintadas uma vez no fixo) recebem o contexto g; as vivas usam ctx
function sombraMovel(g, desenho, dx, dy, a) { g.save(); g.translate(dx, dy); g.fillStyle = `rgba(30,16,6,${a})`; g.filter = 'blur(4px)'; desenho(g); g.fill(); g.restore(); g.filter = 'none'; }
function tabuas(g, x, y, w, h, cor, vert) {
  g.fillStyle = cor; g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(40,24,12,.45)'; g.lineWidth = 1;
  const n = Math.max(2, Math.round((vert ? w : h) / 14));
  for (let k = 1; k < n; k++) { g.beginPath(); if (vert) { const xx = x + w * k / n; g.moveTo(xx, y); g.lineTo(xx, y + h); } else { const yy = y + h * k / n; g.moveTo(x, yy); g.lineTo(x + w, yy); } g.stroke(); }
  for (let i = 0; i < (w * h) / 260; i++) { g.strokeStyle = `rgba(30,18,8,${.08 + R() * .15})`; const xx = x + R() * w, yy = y + R() * h; g.beginPath(); g.moveTo(xx, yy); vert ? g.lineTo(xx + (R() - .5) * 2, yy + 6 + R() * 14) : g.lineTo(xx + 6 + R() * 14, yy + (R() - .5) * 2); g.stroke(); }
  g.fillStyle = 'rgba(255,230,190,.07)'; g.fillRect(x, y, w, Math.min(h, 4));
  g.strokeStyle = 'rgba(30,18,8,.75)'; g.lineWidth = 1.4; g.strokeRect(x + .5, y + .5, w - 1, h - 1);
}
// manchas suaves de ruído por cima de um piso: dá o gasto e a umidade que o chão de casa tem
function manchasRuido(g, x, y, w, h, seed, escuro, claro, forca = 1) {
  const sw = Math.ceil(w / 4), sh = Math.ceil(h / 4), img = g.createImageData(sw, sh), d = img.data;
  for (let j = 0; j < sh; j++) for (let i = 0; i < sw; i++) {
    const n = fbm((x + i * 4) * .006, (y + j * 4) * .006, seed), m = vnoise((x + i * 4) * .05, (y + j * 4) * .05, seed + 3);
    const k = (j * sw + i) * 4, v = (n - .5) * 2.2 + (m - .5) * .4;
    const c = v < 0 ? escuro : claro; d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = Math.min(255, Math.abs(v) * 120 * forca);
  }
  const tmp = document.createElement('canvas'); tmp.width = sw; tmp.height = sh; tmp.getContext('2d').putImageData(img, 0, 0);
  g.imageSmoothingEnabled = true; g.drawImage(tmp, x, y, w, h);
}
function pisoInterno(g, x, y, w, h, tipo) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  if (tipo === 'cimento') {
    const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, '#94432f'); gr.addColorStop(1, '#7b3425'); g.fillStyle = gr; g.fillRect(x, y, w, h);
    for (let i = 0; i < w * h / 90; i++) { g.fillStyle = R() > .5 ? `rgba(40,10,6,${R() * .12})` : `rgba(230,150,120,${R() * .07})`; const r = 3 + R() * 22; g.beginPath(); g.ellipse(x + R() * w, y + R() * h, r, r * .6, R() * 3, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(50,14,8,.22)'; g.lineWidth = 1;
    for (let xx = x + 110; xx < x + w; xx += 110) { g.beginPath(); g.moveTo(xx, y); g.lineTo(xx, y + h); g.stroke(); }
    for (let yy = y + 110; yy < y + h; yy += 110) { g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke(); }
    // gasto onde mais se pisa: o caminho da porta até a mesa
    manchasRuido(g, x, y, w, h, 9 + Math.round(y), [60, 14, 8], [214, 120, 92], .8);
    g.fillStyle = 'rgba(200,120,90,.06)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse(x + w * .1 + R() * w * .8, y + h * .45 + (R() - .5) * h * .3, 30, 16, 0, 0, 7); g.fill(); }
  } else {
    g.fillStyle = tipo === 'tijolo' ? '#a5644a' : '#8b6a48'; g.fillRect(x, y, w, h);
    if (tipo === 'tijolo') {
      g.strokeStyle = 'rgba(60,26,14,.35)'; g.lineWidth = 1.2;
      for (let yy = y, l = 0; yy < y + h; yy += 22, l++) { g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke(); for (let xx = x + (l % 2) * 22; xx < x + w; xx += 44) { g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx, yy + 22); g.stroke(); } }
    }
    for (let i = 0; i < w * h / 60; i++) { g.fillStyle = R() > .5 ? `rgba(70,46,26,${R() * .14})` : `rgba(200,170,130,${R() * .1})`; const r = 2 + R() * 18; g.beginPath(); g.ellipse(x + R() * w, y + R() * h, r, r * .6, R() * 3, 0, 7); g.fill(); }
    manchasRuido(g, x, y, w, h, 5 + Math.round(x), [70, 44, 24], [214, 184, 140], tipo === 'tijolo' ? .6 : 1);
    if (tipo !== 'tijolo') { g.strokeStyle = 'rgba(60,40,22,.13)'; g.lineWidth = 1; for (let i = 0; i < w * h / 2600; i++) { const cx = x + R() * w, cy = y + R() * h, a = R() * 6.28; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(cx, cy, 30 + k * 3, a, a + .9); g.stroke(); } } }
  }
  g.restore();
}
// paredes grossas de taipa; caiada = pintada de cal
function paredes(g, rects, caiada) {
  // sombra das paredes no chão: uma larga e suave, outra curta e escura junto do pé da parede
  [[40, .55], [10, .6]].forEach(([b, a]) => { g.save(); g.shadowColor = `rgba(20,10,4,${a})`; g.shadowBlur = b; rects.forEach(([x, y, w, h]) => { g.fillStyle = '#7d5a38'; g.fillRect(x, y, w, h); }); g.restore(); });
  rects.forEach(([x, y, w, h]) => {
    const horiz = w > h, gr = horiz ? g.createLinearGradient(0, y, 0, y + h) : g.createLinearGradient(x, 0, x + w, 0);
    if (caiada) { gr.addColorStop(0, '#e7dcc6'); gr.addColorStop(.5, '#d6c8ad'); gr.addColorStop(1, '#bfae90'); }
    else { gr.addColorStop(0, '#b38758'); gr.addColorStop(.5, '#9c7348'); gr.addColorStop(1, '#80603c'); }
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    for (let i = 0; i < w * h / 22; i++) { g.fillStyle = R() > .5 ? `rgba(60,38,20,${R() * (caiada ? .16 : .3)})` : `rgba(240,220,190,${R() * .2})`; g.beginPath(); g.arc(x + R() * w, y + R() * h, .8 + R() * 2.2, 0, 7); g.fill(); }
    if (caiada) { for (let i = 0; i < (w + h) / 50; i++) { g.fillStyle = 'rgba(150,108,70,.55)'; const xx = x + R() * w, yy = y + R() * h; g.beginPath(); g.ellipse(xx, yy, 3 + R() * 9, 2 + R() * 4, R() * 3, 0, 7); g.fill(); } }
    g.strokeStyle = 'rgba(50,30,14,.45)'; g.lineWidth = 1;
    for (let i = 0; i < (w + h) / 40; i++) { let xx = x + R() * w, yy = y + R() * h; g.beginPath(); g.moveTo(xx, yy); for (let k = 0; k < 3; k++) { xx += (R() - .5) * 10; yy += (R() - .5) * 10; g.lineTo(xx, yy); } g.stroke(); }
    g.restore();
    g.strokeStyle = 'rgba(40,24,12,.8)'; g.lineWidth = 1.5; g.strokeRect(x + .5, y + .5, w - 1, h - 1);
  });
}
// porta: soleira de pedra e a folha de madeira aberta
function porta(g, x, y, w, h, ladoFolha, ang) {
  g.fillStyle = '#8f877a'; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x, y, w, 3);
  if (!ladoFolha) return;
  const [hx, hy] = ladoFolha, comp = Math.max(w, h) - 4;
  g.save(); g.translate(hx, hy); g.rotate(ang); tabuas(g, 0, -5, comp, 10, '#6b4a2c', true); g.restore();
}
function janela(g, x, y, w, h, horiz) {
  g.fillStyle = '#5a4630'; g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(255,240,200,.15)'; g.fillRect(x + 2, y + 2, w - 4, h - 4);
  g.strokeStyle = '#3e2c1a'; g.lineWidth = 2;
  if (horiz) { for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x + w * k / 4, y); g.lineTo(x + w * k / 4, y + h); g.stroke(); } }
  else { for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x, y + h * k / 4); g.lineTo(x + w, y + h * k / 4); g.stroke(); } }
}
function mesa(g, x, y, w, h, cor) { sombraMovel(g, c => { c.beginPath(); c.rect(x, y, w, h); }, 6, 8, .45); tabuas(g, x, y, w, h, cor || '#7a5636', w < h); }
function banco(g, x, y, w, h) { sombraMovel(g, c => { c.beginPath(); c.rect(x, y, w, h); }, 4, 5, .4); tabuas(g, x, y, w, h, '#6e4d30', w < h); }
function cadeira(g, x, y, ang) {
  g.save(); g.translate(x, y); g.rotate(ang);
  sombraMovel(g, c => { c.beginPath(); c.rect(-17, -17, 34, 34); }, 4, 5, .4);
  g.fillStyle = '#6a482c'; g.fillRect(-17, -17, 34, 34);
  g.fillStyle = '#c4a468'; g.fillRect(-13, -13, 26, 26);
  g.strokeStyle = 'rgba(110,80,36,.7)'; g.lineWidth = 1; for (let k = -12; k < 13; k += 4) { g.beginPath(); g.moveTo(-13, k); g.lineTo(13, k + 2); g.moveTo(k, -13); g.lineTo(k + 2, 13); g.stroke(); }
  g.fillStyle = '#4e3420'; g.fillRect(-19, -21, 38, 7);
  g.restore();
}
function pote(g, x, y, r, cheio = true) {
  g.fillStyle = 'rgba(30,16,6,.4)'; g.beginPath(); g.ellipse(x + r * .3, y + r * .35, r * 1.05, r * .9, 0, 0, 7); g.fill();
  const gr = g.createRadialGradient(x - r * .35, y - r * .35, r * .1, x, y, r); gr.addColorStop(0, '#d0875a'); gr.addColorStop(.7, '#a85c36'); gr.addColorStop(1, '#6e3a22');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  g.strokeStyle = 'rgba(70,34,18,.6)'; g.lineWidth = 1; g.beginPath(); g.arc(x, y, r * .78, 0, 7); g.stroke();
  g.fillStyle = '#4a2a18'; g.beginPath(); g.arc(x, y, r * .45, 0, 7); g.fill();
  if (cheio) { g.fillStyle = '#20303a'; g.beginPath(); g.arc(x, y, r * .36, 0, 7); g.fill(); g.fillStyle = 'rgba(200,220,235,.35)'; g.beginPath(); g.ellipse(x - r * .12, y - r * .12, r * .12, r * .06, .5, 0, 7); g.fill(); }
  else { g.fillStyle = '#2a1a10'; g.beginPath(); g.arc(x, y, r * .36, 0, 7); g.fill(); }
}
function esteira(g, x, y, w, h, ang) {
  g.save(); g.translate(x, y); g.rotate(ang || 0);
  g.fillStyle = 'rgba(30,16,6,.25)'; g.fillRect(-w / 2 + 3, -h / 2 + 4, w, h);
  g.fillStyle = '#c7a465'; g.fillRect(-w / 2, -h / 2, w, h);
  g.strokeStyle = 'rgba(120,88,40,.55)'; g.lineWidth = 1.2;
  for (let k = -h / 2 + 4; k < h / 2; k += 5) { g.beginPath(); g.moveTo(-w / 2, k); g.lineTo(w / 2, k); g.stroke(); }
  g.strokeStyle = 'rgba(150,112,56,.4)'; for (let k = -w / 2 + 6; k < w / 2; k += 10) { g.beginPath(); g.moveTo(k, -h / 2); g.lineTo(k, h / 2); g.stroke(); }
  g.strokeStyle = '#8a6a34'; g.lineWidth = 2; g.strokeRect(-w / 2, -h / 2, w, h);
  g.restore();
}
function cama(g, x, y, w, h, chita) {
  sombraMovel(g, c => { c.beginPath(); c.rect(x, y, w, h); }, 6, 8, .45);
  g.fillStyle = '#5e3e24'; g.fillRect(x, y, w, h);
  g.fillStyle = '#d9cdb2'; g.fillRect(x + 6, y + 6, w - 12, h - 12);
  // lençol de chita: flores grandes
  g.save(); g.beginPath(); g.rect(x + 6, y + h * .3, w - 12, h * .7 - 6); g.clip();
  g.fillStyle = chita || '#b8432f'; g.fillRect(x, y, w, h);
  for (let i = 0; i < w * h / 260; i++) { const fx = x + R() * w, fy = y + R() * h; g.fillStyle = ['#e9c64a', '#2f6d4a', '#f2e8d0'][i % 3]; for (let p = 0; p < 5; p++) { const a = p * 1.256; g.beginPath(); g.arc(fx + Math.cos(a) * 4, fy + Math.sin(a) * 4, 3, 0, 7); g.fill(); } }
  g.strokeStyle = 'rgba(60,20,10,.35)'; g.lineWidth = 2; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x + 10 + R() * w * .3, y + h * .35 + R() * h * .5); g.quadraticCurveTo(x + w * .5, y + h * .5 + (R() - .5) * 30, x + w - 10, y + h * .4 + R() * h * .5); g.stroke(); }
  g.restore();
  g.fillStyle = '#efe6d2'; g.beginPath(); g.ellipse(x + w * .3, y + h * .17, w * .18, h * .08, 0, 0, 7); g.fill(); if (w > 120) { g.beginPath(); g.ellipse(x + w * .7, y + h * .17, w * .18, h * .08, 0, 0, 7); g.fill(); }
}
// tapete de retalhos: tiras de pano de cor trançadas, oval
function tapete(g, x, y, rx, ry) {
  g.fillStyle = 'rgba(30,16,6,.3)'; g.beginPath(); g.ellipse(x + 4, y + 5, rx, ry, 0, 0, 7); g.fill();
  const cores = ['#a8402c', '#d9b45a', '#3e6a8a', '#e8dcc0', '#5a7a44', '#8a3b5a', '#c96a3a'];
  for (let k = 0; k < 14; k++) { const u = 1 - k / 14; g.fillStyle = cores[(k * 3) % cores.length]; g.beginPath(); g.ellipse(x, y, rx * u, ry * u, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(30,16,6,.25)'; g.lineWidth = 1; g.setLineDash([3, 3]); g.stroke(); g.setLineDash([]); }
  g.fillStyle = 'rgba(255,240,210,.08)'; g.beginPath(); g.ellipse(x - rx * .2, y - ry * .25, rx * .6, ry * .4, 0, 0, 7); g.fill();
}
function cesto(g, x, y, r, dentro) {
  g.fillStyle = 'rgba(30,16,6,.35)'; g.beginPath(); g.arc(x + 3, y + 4, r, 0, 7); g.fill();
  g.fillStyle = '#b8955a'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  g.strokeStyle = 'rgba(110,80,36,.8)'; g.lineWidth = 1; for (let k = 2; k < r; k += 3) { g.beginPath(); g.arc(x, y, k, 0, 7); g.stroke(); }
  for (let k = 0; k < 16; k++) { const a = k / 16 * 6.28; g.beginPath(); g.moveTo(x + Math.cos(a) * r * .3, y + Math.sin(a) * r * .3); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.stroke(); }
  if (dentro) { dentro.forEach((c, k) => { g.fillStyle = c; g.beginPath(); g.ellipse(x + (k % 2 ? 4 : -4) * (k > 1 ? -1 : 1), y + (k - 1.5) * r * .25, r * .55, r * .3, k, 0, 7); g.fill(); }); }
  g.strokeStyle = '#7a5a30'; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke();
}
function bau(g, x, y, w, h) { sombraMovel(g, c => { c.beginPath(); c.rect(x, y, w, h); }, 5, 6, .45); tabuas(g, x, y, w, h, '#5d3d22', false); g.strokeStyle = '#2e2014'; g.lineWidth = 3; g.strokeRect(x + 3, y + 3, w - 6, h - 6); g.fillStyle = '#8c8070'; g.fillRect(x + w / 2 - 5, y + h - 8, 10, 8); }
function fogao(g, x, y, w, h) {
  sombraMovel(g, c => { c.beginPath(); c.rect(x, y, w, h); }, 6, 8, .5);
  const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, '#b57d52'); gr.addColorStop(1, '#8a5a38'); g.fillStyle = gr; g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(30,20,14,.35)'; for (let i = 0; i < 30; i++) { g.beginPath(); g.arc(x + R() * w, y + R() * h, 2 + R() * 6, 0, 7); g.fill(); }
  g.strokeStyle = '#4e3220'; g.lineWidth = 2; g.strokeRect(x, y, w, h);
  // chapa de ferro com duas bocas
  g.fillStyle = '#2c2826'; g.fillRect(x + 10, y + 8, w - 20, h - 22);
  [[x + w * .3, y + h * .42], [x + w * .7, y + h * .42]].forEach(([cx, cy]) => { g.strokeStyle = '#4a4440'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, Math.min(w, h) * .2, 0, 7); g.stroke(); g.beginPath(); g.arc(cx, cy, Math.min(w, h) * .12, 0, 7); g.stroke(); });
}
function panela(g, x, y, r, dentro) {
  g.fillStyle = '#1e1c1a'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  g.strokeStyle = '#55504a'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r - 2, 0, 7); g.stroke();
  g.fillStyle = dentro || '#5a2e1c'; g.beginPath(); g.arc(x, y, r - 5, 0, 7); g.fill();
  g.strokeStyle = '#1e1c1a'; g.lineWidth = 4; g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + r + 14, y - 4); g.stroke();
}
function prateleira(g, x, y, w, h, itens) {
  tabuas(g, x, y, w, h, '#6a4a2e', w < h);
  const horiz = w > h, n = itens || Math.round((horiz ? w : h) / 26);
  for (let k = 0; k < n; k++) {
    const u = (k + .5) / n, cx = horiz ? x + w * u : x + w / 2, cy = horiz ? y + h / 2 : y + h * u, tipo = k % 4;
    if (tipo === 0) pote(g, cx, cy, Math.min(w, h) * .32, R() > .5);
    else if (tipo === 1) { g.fillStyle = '#8d9296'; g.beginPath(); g.arc(cx, cy, Math.min(w, h) * .28, 0, 7); g.fill(); g.strokeStyle = '#5e6266'; g.lineWidth = 1; g.stroke(); }
    else if (tipo === 2) { g.fillStyle = '#2f4a3a'; g.beginPath(); g.arc(cx, cy, Math.min(w, h) * .2, 0, 7); g.fill(); g.fillStyle = 'rgba(200,230,210,.4)'; g.beginPath(); g.arc(cx - 2, cy - 2, 2, 0, 7); g.fill(); }
    else { g.fillStyle = '#d8ccae'; g.beginPath(); g.ellipse(cx, cy, Math.min(w, h) * .3, Math.min(w, h) * .22, R(), 0, 7); g.fill(); }
  }
}
function saco(g, x, y, r, cor) {
  g.fillStyle = 'rgba(30,16,6,.35)'; g.beginPath(); g.ellipse(x + 4, y + 5, r * 1.1, r * .9, 0, 0, 7); g.fill();
  const gr = g.createRadialGradient(x - r * .3, y - r * .3, 2, x, y, r); gr.addColorStop(0, cor || '#e8dcc0'); gr.addColorStop(1, '#a8987a');
  g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r, r * .82, R(), 0, 7); g.fill();
  g.strokeStyle = 'rgba(110,92,60,.6)'; g.lineWidth = 1; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(x - r * .6, y - r * .3 + k * r * .3); g.lineTo(x + r * .6, y - r * .2 + k * r * .3); g.stroke(); }
  g.fillStyle = '#8a6a40'; g.beginPath(); g.arc(x + r * .5, y - r * .55, r * .18, 0, 7); g.fill();
}
function lenhaPilha(g, x, y, n) {
  for (let k = 0; k < n; k++) { const a = (R() - .5) * .5, xx = x + (k % 4) * 16 - 24, yy = y + Math.floor(k / 4) * 12 - 10; g.save(); g.translate(xx, yy); g.rotate(a); g.fillStyle = k % 2 ? '#6a4c32' : '#7c5a3c'; g.fillRect(-40, -6, 80, 12); g.fillStyle = '#b48a5a'; g.beginPath(); g.ellipse(40, 0, 3, 6, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(40,26,14,.6)'; g.lineWidth = 1; g.strokeRect(-40, -6, 80, 12); g.restore(); }
}
function oratorio(g, x, y) {
  g.fillStyle = 'rgba(30,16,6,.4)'; g.fillRect(x - 20, y - 14, 44, 32);
  tabuas(g, x - 22, y - 16, 44, 30, '#5a3a22', true);
  g.fillStyle = '#2a1a10'; g.fillRect(x - 14, y - 10, 28, 18);
  g.fillStyle = '#c9b28a'; g.beginPath(); g.ellipse(x, y - 1, 5, 7, 0, 0, 7); g.fill();
  ['#c94a3a', '#e9d36a', '#f2efe6'].forEach((c, k) => { g.fillStyle = c; g.beginPath(); g.arc(x - 9 + k * 9, y + 10, 3, 0, 7); g.fill(); });
}
function velaBase(g, x, y, castical) {
  if (castical) { g.fillStyle = '#6b5a40'; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); g.fillStyle = '#8f7a56'; g.beginPath(); g.arc(x - 2, y - 2, 4, 0, 7); g.fill(); }
  g.fillStyle = '#efe7d2'; g.beginPath(); g.arc(x, y, 4.5, 0, 7); g.fill(); g.fillStyle = 'rgba(220,210,180,.8)'; g.beginPath(); g.ellipse(x + 4, y + 3, 3, 2, .6, 0, 7); g.fill();
}
function chamaD(x, y, t, k, grande) {
  const s = grande || 1, v = rajada(t) * .3;
  ctx.fillStyle = 'rgba(255,170,60,.35)'; ctx.beginPath(); ctx.arc(x, y - 3 * s, 7 * s * tremor(t, k), 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,214,120,.95)'; ctx.beginPath(); ctx.ellipse(x + Math.sin(t * 7 + k) * v * 2, y - 4 * s, 2.4 * s, (4 + Math.sin(t * 15 + k) * .9) * s, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,230,.95)'; ctx.beginPath(); ctx.arc(x, y - 3 * s, 1.1 * s, 0, 7); ctx.fill();
}
function redeD(r, t) {
  // rede de dormir vista de cima: punhos amarrados nos armadores, pano largo afundado no meio, varanda de franja nas bordas
  const { x1, y1, x2, y2, larg, cor, faixa } = r, dx = x2 - x1, dy = y2 - y1, Lr = Math.hypot(dx, dy), ux = dx / Lr, uy = dy / Lr, nx = -uy, ny = ux;
  const s = Math.sin(t * 1.1 + r.f) * (2.5 + rajada(t) * 3) * (r.balanca ?? 1);
  const P = (u, v) => [x1 + dx * u + nx * (v + s * Math.sin(u * Math.PI)), y1 + dy * u + ny * (v + s * Math.sin(u * Math.PI))];
  const w = larg * 1.5, a0 = .2, a1 = .8;
  const meia = (u) => { const k = (u - a0) / (a1 - a0); return w * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, k))), .45); };
  const borda = (lado) => { const pts = []; for (let i = 0; i <= 24; i++) { const u = a0 + (a1 - a0) * i / 24; pts.push(P(u, lado * meia(u))); } return pts; };
  const e = borda(1), d = borda(-1);
  // sombra no chão
  ctx.fillStyle = 'rgba(30,16,6,.28)'; ctx.beginPath(); ctx.ellipse((x1 + x2) / 2 + 8 + nx * s, (y1 + y2) / 2 + 12 + ny * s, Lr * .32, w * .95, Math.atan2(dy, dx), 0, 7); ctx.fill();
  // punhos: cordinhas do armador até a ponta do pano
  ctx.strokeStyle = 'rgba(214,196,150,.9)'; ctx.lineWidth = .8;
  for (let k = -3; k <= 3; k++) { const [ax, ay] = P(a0 + .015, k * w * .1), [bx, by] = P(a1 - .015, k * w * .1); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(ax, ay); ctx.moveTo(x2, y2); ctx.lineTo(bx, by); ctx.stroke(); }
  // varanda: franja saindo das duas bordas
  ctx.strokeStyle = r.franja || 'rgba(235,222,190,.85)'; ctx.lineWidth = 1;
  [[e, 1], [d, -1]].forEach(([pts, lado]) => pts.forEach(([px, py], i) => { if (i < 3 || i > 21) return; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + nx * lado * 6 + ux * 1.5, py + ny * lado * 6 + uy * 1.5); ctx.stroke(); }));
  // o pano
  const corpo = () => { ctx.beginPath(); e.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); for (let i = d.length - 1; i >= 0; i--) ctx.lineTo(d[i][0], d[i][1]); ctx.closePath(); };
  ctx.fillStyle = cor; corpo(); ctx.fill();
  ctx.save(); corpo(); ctx.clip();
  (faixa || []).forEach((c, k) => { const o = (k - (faixa.length - 1) / 2) * w * .32; ctx.strokeStyle = c; ctx.lineWidth = w * .12; ctx.beginPath(); for (let i = 0; i <= 24; i++) { const u = a0 + (a1 - a0) * i / 24, [px, py] = P(u, o * meia(u) / w); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); });
  // dobras do tecido e o fundo afundado (mais escuro no meio)
  ctx.strokeStyle = 'rgba(40,20,8,.18)'; ctx.lineWidth = 1;
  for (let k = 1; k < 9; k++) { const u = a0 + (a1 - a0) * k / 9; const [ax, ay] = P(u, meia(u)), [bx, by] = P(u, -meia(u)); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo((ax + bx) / 2 + ux * 4, (ay + by) / 2 + uy * 4, bx, by); ctx.stroke(); }
  const [mx, my] = P(.5, 0); const g = ctx.createRadialGradient(mx, my, 2, mx, my, Lr * .32); g.addColorStop(0, 'rgba(20,10,4,.28)'); g.addColorStop(1, 'rgba(255,240,210,.08)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.restore();
  ctx.strokeStyle = 'rgba(40,24,12,.55)'; ctx.lineWidth = 1; corpo(); ctx.stroke();
  // armadores na parede
  [[x1, y1], [x2, y2]].forEach(([x, y]) => { ctx.fillStyle = '#2a1c12'; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 7); ctx.fill(); ctx.fillStyle = '#6a5a48'; ctx.beginPath(); ctx.arc(x, y, 2, 0, 7); ctx.fill(); });
}
// a luz do dia entrando por portas e janelas; some quando escurece
function feixe(f, L, t) {
  const forca = Math.max(0, 1 - L.escuro * 1.6) * (L.i === 6 ? .9 : 1);
  if (forca < .02) return;
  const quente = L.i >= 1 ? [255, 170, 90] : [255, 236, 200];
  const { x, y, w, dx, dy } = f, inc = Math.cos(L.sol) * 40, nx = -dy, ny = dx;
  const px = x + dx * f.len + nx * inc * .01 + (f.desvio || 0) * Math.cos(L.sol) * 60, py = y + dy * f.len;
  const g = ctx.createLinearGradient(x, y, px, py); g.addColorStop(0, `rgba(${quente.join(',')},${.34 * forca})`); g.addColorStop(1, `rgba(${quente.join(',')},0)`);
  ctx.fillStyle = g; ctx.beginPath();
  ctx.moveTo(x + nx * w / 2, y + ny * w / 2); ctx.lineTo(x - nx * w / 2, y - ny * w / 2);
  ctx.lineTo(px - nx * w * .8, py - ny * w * .8); ctx.lineTo(px + nx * w * .8, py + ny * w * .8); ctx.closePath(); ctx.fill();
  // poeira dançando no facho
  ctx.fillStyle = `rgba(255,240,210,${.5 * forca})`;
  for (let k = 0; k < 14; k++) { const u = ((t * .03 + k * .071 + (f.k || 0)) % 1), side = Math.sin(k * 7.3 + t * .4) * .45; ctx.fillRect(x + dx * f.len * u * .8 + nx * w * side, y + dy * f.len * u * .8 + ny * w * side + Math.sin(t + k) * 3, 1.4, 1.4); }
}
function penumbra(L, rects, a) {
  const k = (a ?? .3) * (1 - L.escuro);
  if (k < .01) return;
  ctx.fillStyle = `rgba(28,16,8,${k})`; rects.forEach(([x, y, w, h]) => ctx.fillRect(x, y, w, h));
}
function chaoDeFora(g, seed) {
  terreno(g, seed, { escuro: [138, 100, 62], base: [168, 128, 82], claro: [196, 164, 118] });
  pintarPedrinhas(g, 90);
}
function vapor(lista, x, y, t, dt, L) {
  if (R() < dt * 6) lista.push({ x: x + (R() - .5) * 4, y, a: .45, r: 2 });
  for (let k = lista.length - 1; k >= 0; k--) { const p = lista[k]; p.y -= 14 * dt; p.x += Math.sin(t * 2 + k) * 6 * dt + rajada(t) * 4 * dt; p.r += 3 * dt; p.a -= .22 * dt; if (p.a <= 0) { lista.splice(k, 1); continue; } ctx.fillStyle = `rgba(235,230,220,${p.a * (1 - L.escuro * .3)})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
}
function brasaD(x, y, w, h, t, forte) {
  const f = forte ? 1 : .55;
  for (let k = 0; k < 9; k++) { const a = t * (forte ? 8 : 3) + k * 2.3; ctx.fillStyle = k % 2 ? `rgba(255,150,50,${.8 * f})` : `rgba(255,80,20,${.7 * f})`; ctx.beginPath(); ctx.arc(x + (k / 8 - .5) * w * .8 + Math.sin(a) * 2, y + Math.cos(a * 1.3) * h * .25, (forte ? 6 : 4) + Math.sin(a) * 2, 0, 7); ctx.fill(); }
}

// ================= CENÁRIO 4: A CASA DO VELÓRIO =================
function cenaVelorio() {
  R = rng(44);
  const T = 22, X0 = 170, Y0 = 110, X1 = 1390, Y1 = 900, XM = 860, YM = 470, XQ = 1150;
  const sala = [X0 + T, Y0 + T, XM - X0 - T, Y1 - Y0 - 2 * T], quarto = [XM + T, Y0 + T, XQ - XM - T, YM - Y0 - T], riscador = [XQ + T, Y0 + T, X1 - XQ - 2 * T, YM - Y0 - T], cozinha = [XM + T, YM + T, X1 - XM - 2 * T, Y1 - YM - 2 * T];
  const muros = [
    [X0, Y0, 300, T], [X0 + 380, Y0, X1 - X0 - 380 - 460, T], [X1 - 380, Y0, 380, T],          // norte, com janelas
    [X0, Y1 - T, 380, T], [X0 + 460, Y1 - T, X1 - X0 - 460 - 270, T], [X1 - 190, Y1 - T, 190, T], // sul
    [X0, Y0, T, 350], [X0, Y0 + 460, T, Y1 - Y0 - 460],                                          // oeste, porta da frente
    [X1 - T, Y0, T, 590], [X1 - T, Y0 + 680, T, Y1 - Y0 - 680],                                  // leste, porta dos fundos
    [XM, Y0, T, 140], [XM, Y0 + 220, T, 260], [XM, Y0 + 570, T, Y1 - Y0 - 570],                  // sala | resto
    [XM, YM, 230, T], [XM + 310, YM, XQ + 60 - XM - 310, T], [XQ + 140, YM, X1 - XQ - 140, T],                                          // quartos | cozinha
    [XQ, Y0, T, YM - Y0],                                                                         // quarto | riscador
  ];
  const corpo = { x: 520, y: 505 }, velas = [[350, 430], [690, 430], [350, 580], [690, 580], [812, 200]];
  const redeRosario = { x1: XM + T, y1: 400, x2: XQ, y2: 300, larg: 22, cor: '#d9b45a', faixa: ['#a8402c', '#2f6d4a', '#a8402c'], f: 1.7, balanca: .8 };
  const fogaoP = { x: 980, y: Y1 - T - 74, w: 190, h: 70 };
  const feixes = [
    { x: X0 + T, y: Y0 + 405, w: 92, dx: 1, dy: 0, len: 300, desvio: 0, k: .1 },        // porta da frente
    { x: X0 + 340, y: Y0 + T, w: 70, dx: 0, dy: 1, len: 230, desvio: 1, k: .3 },         // janela norte da sala
    { x: X0 + 420, y: Y1 - T, w: 70, dx: 0, dy: -1, len: 200, desvio: 1, k: .5 },        // janela sul da sala
    { x: X1 - 420, y: Y0 + T, w: 70, dx: 0, dy: 1, len: 180, desvio: 1, k: .7 },         // janela do quarto
    { x: X1 - 230, y: Y1 - T, w: 70, dx: 0, dy: -1, len: 170, desvio: 1, k: .9 },        // janela da cozinha
    { x: X1 - T, y: Y0 + 635, w: 80, dx: -1, dy: 0, len: 220, desvio: 0, k: .2 },        // porta dos fundos
  ];
  const vaporCafe = [], fumaca = [];
  const plantas = caatinga(44, (x, y) => (x < X0 - 30 || x > X1 + 30 || y < Y0 - 30 || y > Y1 + 30) && !(x < X0 && Math.abs(y - (Y0 + 405)) < 120), { jurema: 6, macambira: 6, xique: 4, mandacaru: 2, capim: 70 });

  function fixo(g) {
    chaoDeFora(g, 44);
    // terreiro varrido na frente da porta
    const gp = g.createRadialGradient(X0 - 20, Y0 + 405, 10, X0 - 20, Y0 + 405, 200); gp.addColorStop(0, 'rgba(206,170,116,.7)'); gp.addColorStop(1, 'rgba(206,170,116,0)'); g.fillStyle = gp; g.fillRect(0, 0, W, H);
    pisoInterno(g, ...sala, 'cimento'); pisoInterno(g, ...quarto, 'cimento'); pisoInterno(g, ...riscador, 'terra'); pisoInterno(g, ...cozinha, 'terra');
    // ---- a sala do velório ----
    // bancos encostados e cadeiras trazidas das outras casas
    banco(g, X0 + T + 30, Y0 + T + 14, 230, 34); banco(g, X0 + T + 470, Y0 + T + 14, 140, 34); banco(g, X0 + T + 40, Y1 - T - 48, 260, 34); banco(g, X0 + T + 540, Y1 - T - 48, 120, 34);
    [[300, 330, .1], [400, 320, -.15], [640, 330, .2], [740, 340, -.1], [300, 690, 3.1], [420, 700, 3.3], [650, 690, 2.9], [760, 680, 3.2], [800, 505, 1.6]].forEach(([x, y, a]) => cadeira(g, x, y, a));
    // a mesa grande com o corpo
    mesa(g, corpo.x - 190, corpo.y - 62, 380, 124, '#6e4a2c');
    g.save(); g.translate(corpo.x, corpo.y);
    sombraMovel(g, c => { c.beginPath(); c.ellipse(0, 0, 160, 44, 0, 0, 7); }, 3, 4, .35);
    // lençol branco até o peito, com dobras
    const lg = g.createLinearGradient(0, -40, 0, 40); lg.addColorStop(0, '#f4efe2'); lg.addColorStop(1, '#d3cbb8'); g.fillStyle = lg;
    g.beginPath(); g.moveTo(-90, -38); g.quadraticCurveTo(40, -50, 160, -22); g.quadraticCurveTo(172, 0, 160, 22); g.quadraticCurveTo(40, 50, -90, 38); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(150,140,120,.6)'; g.lineWidth = 1.4; [[-60, -30, 120, -14], [-40, 0, 150, 2], [-60, 28, 120, 16], [60, -36, 90, 30]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo((a + c) / 2, (b + d) / 2 + 8, c, d); g.stroke(); });
    // pés marcando o lençol
    g.fillStyle = 'rgba(160,150,130,.5)'; g.beginPath(); g.ellipse(150, -10, 8, 10, 0, 0, 7); g.ellipse(150, 12, 8, 10, 0, 0, 7); g.fill();
    // ombros na camisa escura, por cima do lençol
    g.fillStyle = '#34404e'; g.beginPath(); g.moveTo(-92, -34); g.quadraticCurveTo(-128, -40, -132, -14); g.lineTo(-132, 14); g.quadraticCurveTo(-128, 40, -92, 34); g.closePath(); g.fill();
    // a cabeça: rosto para cima, o cabelo branco ralo em volta
    g.fillStyle = '#d9d4c8'; g.beginPath(); g.ellipse(-158, 0, 22, 19, 0, 0, 7); g.fill();
    g.fillStyle = '#7e5236'; g.beginPath(); g.ellipse(-148, 0, 18, 15, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,220,180,.18)'; g.beginPath(); g.ellipse(-151, -4, 8, 5, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(40,20,10,.45)'; g.beginPath(); g.ellipse(-140, 0, 2.5, 3.5, 0, 0, 7); g.fill();
    g.fillStyle = '#d9d4c8'; g.beginPath(); g.ellipse(-134, 0, 4, 9, 0, 0, 7); g.fill();
    // as mãos cruzadas na beira do lençol
    g.fillStyle = '#7e5236'; g.strokeStyle = 'rgba(40,20,10,.6)'; g.lineWidth = 1;
    g.beginPath(); g.ellipse(-84, -5, 13, 6, .35, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.ellipse(-84, 5, 13, 6, -.35, 0, 7); g.fill(); g.stroke();
    // ramos de alecrim e flores do mato em volta
    for (let k = 0; k < 18; k++) { const a = k / 18 * 6.28, x = Math.cos(a) * 175, y = Math.sin(a) * 52; g.strokeStyle = '#4f6a3c'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a + 1.4) * 14, y + Math.sin(a + 1.4) * 6); g.stroke(); g.fillStyle = ['#f0e6c8', '#d8b8e0', '#e8d060'][k % 3]; g.beginPath(); g.arc(x + Math.cos(a + 1.4) * 14, y + Math.sin(a + 1.4) * 6, 3, 0, 7); g.fill(); }
    g.restore();
    velas.slice(0, 4).forEach(([x, y]) => velaBase(g, x, y, true));
    // bacia de água e pano de quem lavou o corpo
    g.fillStyle = '#9aa0a2'; g.beginPath(); g.arc(760, 600, 28, 0, 7); g.fill(); g.fillStyle = '#5f7680'; g.beginPath(); g.arc(760, 600, 21, 0, 7); g.fill(); g.fillStyle = '#ece4d2'; g.beginPath(); g.ellipse(772, 590, 16, 8, .6, 0, 7); g.fill();
    pote(g, X0 + T + 34, Y0 + 520, 22);
    oratorio(g, XM - 40, Y0 + T + 34); velaBase(g, velas[4][0], velas[4][1]);
    // o chapéu de couro de Antero, no prego junto da porta
    g.save(); g.translate(X0 + T + 22, Y0 + 300); g.fillStyle = 'rgba(30,16,6,.35)'; g.beginPath(); g.ellipse(4, 5, 30, 26, 0, 0, 7); g.fill(); g.fillStyle = '#6a4424'; g.beginPath(); g.ellipse(0, 0, 30, 26, 0, 0, 7); g.fill(); g.fillStyle = '#7c5230'; g.beginPath(); g.ellipse(0, 0, 17, 15, 0, 0, 7); g.fill(); g.strokeStyle = '#3a2412'; g.lineWidth = 1.5; for (let k = 0; k < 8; k++) { const a = k * .785; g.beginPath(); g.moveTo(Math.cos(a) * 18, Math.sin(a) * 16); g.lineTo(Math.cos(a) * 28, Math.sin(a) * 24); g.stroke(); } g.restore();
    // ---- o quarto ----
    cama(g, XM + T + 20, Y0 + T + 14, 150, 190, '#a8402c'); bau(g, XM + T + 190, Y0 + T + 20, 70, 44);
    // o pincel quebrado que Rosário escondeu, aparecendo debaixo da cama
    g.save(); g.translate(XM + T + 172, Y0 + T + 196); g.rotate(-.4); g.fillStyle = '#7a5a34'; g.fillRect(0, -2, 26, 4); g.fillStyle = '#2c2420'; g.fillRect(24, -4, 10, 8); g.restore();
    // ---- o quartinho do riscador ----
    mesa(g, XQ + T + 20, Y0 + T + 20, 170, 80, '#7a5636');
    // a caixa de riscador aberta em cima da mesa: cal, carvão, pincéis, a tinta pela metade
    g.save(); g.translate(XQ + T + 105, Y0 + T + 60);
    tabuas(g, -60, -26, 120, 52, '#5a3a20', true); g.fillStyle = '#3a2614'; g.fillRect(-55, -21, 110, 42);
    g.fillStyle = '#ece6d8'; for (let k = 0; k < 7; k++) { g.beginPath(); g.arc(-44 + (k % 3) * 9, -10 + Math.floor(k / 3) * 9, 4 + (k % 2), 0, 7); g.fill(); }
    g.fillStyle = '#1b1816'; for (let k = 0; k < 5; k++) g.fillRect(-10 + k * 6, -16, 4, 30);
    g.fillStyle = '#7a5a34'; for (let k = 0; k < 3; k++) g.fillRect(24, -14 + k * 10, 26, 3); g.fillStyle = '#c8b08a'; for (let k = 0; k < 3; k++) g.fillRect(48, -15 + k * 10, 6, 5);
    g.restore();
    pote(g, 1340, 256, 15, false); g.fillStyle = '#5a2030'; g.beginPath(); g.arc(1340, 256, 6, 0, 7); g.fill();
    saco(g, 1335, 310, 24); saco(g, 1330, 360, 22);
    // um círculo de treino riscado no chão, com os sinais do ofício
    g.save(); g.translate(1240, 362); g.strokeStyle = 'rgba(240,234,220,.8)'; g.lineWidth = 2.4; g.beginPath(); g.arc(0, 0, 62, .2, 6.1); g.stroke();
    for (let k = 0; k < 6; k++) { const a = k * 1.047 + .3; g.save(); g.translate(Math.cos(a) * 46, Math.sin(a) * 46); g.rotate(a + 1.57); g.beginPath(); g.moveTo(0, -7); g.lineTo(0, 7); g.moveTo(-6, -3); g.lineTo(6, -3); g.stroke(); g.restore(); }
    g.fillStyle = 'rgba(240,234,220,.5)'; for (let k = 0; k < 30; k++) { g.beginPath(); g.arc((R() - .5) * 150, (R() - .5) * 150, 1 + R() * 2, 0, 7); g.fill(); } g.restore();
    // ---- a cozinha ----
    fogao(g, fogaoP.x, fogaoP.y, fogaoP.w, fogaoP.h); panela(g, fogaoP.x + fogaoP.w * .3, fogaoP.y + fogaoP.h * .42, 18, '#2a1a10'); panela(g, fogaoP.x + fogaoP.w * .7, fogaoP.y + fogaoP.h * .42, 16, '#6a3a20');
    lenhaPilha(g, 1240, 770, 6);
    mesa(g, 1080, 590, 220, 90, '#7a5636'); banco(g, 1090, 548, 200, 28); banco(g, 1090, 692, 200, 28);
    // as canecas do café do velório
    [[1110, 615], [1150, 640], [1200, 610], [1240, 650], [1270, 620]].forEach(([x, y]) => { g.fillStyle = '#e6e0d2'; g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill(); g.fillStyle = '#3a2214'; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); });
    prateleira(g, X1 - T - 30, YM + T + 20, 24, 150);
    pote(g, 1310, 840, 26); pote(g, 1256, 852, 22);
    // pilão de madeira
    g.fillStyle = 'rgba(30,16,6,.35)'; g.beginPath(); g.arc(954, 544, 26, 0, 7); g.fill(); g.fillStyle = '#7a5636'; g.beginPath(); g.arc(950, 540, 24, 0, 7); g.fill(); g.fillStyle = '#3a2614'; g.beginPath(); g.arc(950, 540, 13, 0, 7); g.fill();
    // portas e janelas
    paredes(g, muros, true);
    porta(g, X0, Y0 + 350, T, 110, [X0 + T, Y0 + 352], 1.1);
    porta(g, X1 - T, Y0 + 590, T, 90, [X1 - T, Y0 + 592], 2.2);
    porta(g, XM, Y0 + 140, T, 80); porta(g, XM, Y0 + 480, T, 90); porta(g, XM + 230, YM, 80, T); porta(g, XQ + 60, YM, 80, T);
    janela(g, X0 + 300, Y0, 80, T, true); janela(g, X1 - 460, Y0, 80, T, true); janela(g, X0 + 380, Y1 - T, 80, T, true); janela(g, X1 - 270, Y1 - T, 80, T, true);
  }
  return {
    interior: true, titulo: 'A casa do velório', legenda: 'A casa de Antero, sem o telhado. Na sala de cimento vermelho, o corpo na mesa grande entre quatro velas, os bancos e as cadeiras trazidas da vila, o oratório e o chapéu dele no prego. Atrás: o quarto do casal, o quartinho do riscador com a caixa aberta e um círculo de treino no chão, e a cozinha com o café do velório no fogo. Escala sugerida: 16 passos de largura.',
    horaInicial: 0.1, fogo: true,
    fixo,
    desenhar(L, t, dt) {
      { const sv = vetorSombra(L); sombraForma(() => { ctx.beginPath(); ctx.rect(X0, Y0, X1 - X0, Y1 - Y0); }, sv.x * 30, sv.y * 30, .5); }
      desenharCaatinga(plantas, t, L, true); desenharCaatinga(plantas, t, L, false);
      penumbra(L, [sala, quarto, riscador, cozinha], .32);
      feixes.forEach(f => feixe(f, L, t));
      velas.forEach(([x, y], k) => chamaD(x, y, t, k));
      brasaD(fogaoP.x + fogaoP.w / 2, fogaoP.y + fogaoP.h - 6, fogaoP.w * .6, 10, t, false);
      vapor(vaporCafe, fogaoP.x + fogaoP.w * .3, fogaoP.y + fogaoP.h * .4, t, dt, L);
      poeiraD(t, dt, { ...L, escuro: Math.max(L.escuro, .7) });
    },
    luzes(L, t) {
      const l = velas.slice(0, 4).map(([x, y], k) => ({ x, y, r: 190 * tremor(t, k), cor: [255, 180, 90], forca: .85 }));
      l.push({ x: velas[4][0], y: velas[4][1], r: 90 * tremor(t, 9), cor: [255, 190, 110], forca: .8 });
      l.push({ x: fogaoP.x + fogaoP.w / 2, y: fogaoP.y + fogaoP.h, r: 170 * tremor(t, 4), cor: [255, 130, 50], forca: .75 });
      l.push({ x: 1190, y: 635, r: 120 * tremor(t, 5), cor: [255, 190, 110], forca: .6 });
      return l;
    },
    depois() {},
  };
}

// ================= CENÁRIO 5: A CASA DE FARINHA =================
function cenaFarinha() {
  R = rng(55);
  const T = 20, X0 = 150, Y0 = 120, X1 = 1350, Y1 = 880;
  const dentro = [X0 + T, Y0 + T, X1 - X0 - T, Y1 - Y0 - T];
  // meia-parede ao norte e a leste; o resto é aberto, só esteios
  const muros = [[X0, Y0, X1 - X0, T], [X1 - T, Y0, T, 520], [X0, Y0, T, 260]];
  const esteios = [[X0 + 10, Y0 + 10], [X0 + 410, Y0 + 10], [X0 + 810, Y0 + 10], [X1 - 10, Y0 + 10], [X0 + 10, Y0 + 390], [X1 - 10, Y0 + 390], [X0 + 10, Y1 - 10], [X0 + 410, Y1 - 10], [X0 + 810, Y1 - 10], [X1 - 10, Y1 - 10]];
  const forno = { x: 560, y: 450, r: 200 }, boca = { x: 560, y: 450 + 200 * .82 + 18 };
  const lamparinas = [esteios[1], esteios[2], esteios[4], esteios[5], esteios[7], esteios[8]].map(([x, y], k) => ({ x: x + (k % 2 ? -18 : 18), y: y + (y > 500 ? -22 : 22) }));
  const potes = Array.from({ length: 7 }, (_, k) => ({ x: 700 + k * 54, y: Y1 - 70, cheio: k < 3 }));
  const fumaca = [];
  const plantas = caatinga(55, (x, y) => x < X0 - 40 || x > X1 + 40 || y < Y0 - 40 || y > Y1 + 40, { jurema: 6, macambira: 4, xique: 4, mandacaru: 2, capim: 60 });
  function fixo(g) {
    chaoDeFora(g, 55);
    pisoInterno(g, ...dentro, 'terra');
    // poeira de farinha em volta do forno e do cocho
    for (let i = 0; i < 1200; i++) { const a = R() * 6.28, d = forno.r + R() * 220; g.fillStyle = `rgba(246,238,214,${R() * .25})`; g.beginPath(); g.arc(forno.x + Math.cos(a) * d * 1.2, forno.y + Math.sin(a) * d * .9, 1 + R() * 3, 0, 7); g.fill(); }
    // ---- o forno: base de barro e a chapa redonda ----
    g.save(); g.shadowColor = 'rgba(20,10,4,.55)'; g.shadowBlur = 26; g.shadowOffsetY = 12;
    const gb = g.createRadialGradient(forno.x - 60, forno.y - 60, 20, forno.x, forno.y, forno.r * 1.25); gb.addColorStop(0, '#c08a5a'); gb.addColorStop(1, '#8a5a36');
    g.fillStyle = gb; g.beginPath(); g.ellipse(forno.x, forno.y, forno.r * 1.18, forno.r * .98, 0, 0, 7); g.fill(); g.restore();
    g.strokeStyle = 'rgba(70,40,20,.5)'; g.lineWidth = 2; for (let k = 0; k < 40; k++) { const a = R() * 6.28; g.beginPath(); g.arc(forno.x, forno.y, forno.r * (1 + R() * .15), a, a + .3); g.stroke(); }
    const gc = g.createRadialGradient(forno.x - 40, forno.y - 40, 10, forno.x, forno.y, forno.r * .9); gc.addColorStop(0, '#4e4a46'); gc.addColorStop(1, '#232020');
    g.fillStyle = gc; g.beginPath(); g.ellipse(forno.x, forno.y, forno.r * .92, forno.r * .78, 0, 0, 7); g.fill();
    // a farinha torrando na chapa, puxada pelo rodo em arcos
    g.save(); g.beginPath(); g.ellipse(forno.x, forno.y, forno.r * .88, forno.r * .74, 0, 0, 7); g.clip();
    for (let i = 0; i < 2600; i++) { const a = R() * 6.28, d = Math.sqrt(R()) * forno.r * .85; if (d < forno.r * .2) continue; g.fillStyle = R() > .3 ? `rgba(236,214,160,${.4 + R() * .5})` : `rgba(200,160,96,${.5})`; g.fillRect(forno.x + Math.cos(a) * d, forno.y + Math.sin(a) * d * .85, 2, 2); }
    g.strokeStyle = 'rgba(120,90,50,.45)'; g.lineWidth = 3; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(forno.x, forno.y, forno.r * (.35 + k * .09), -1 + k * .2, 1.2 + k * .3); g.stroke(); }
    g.restore();
    // o rodo largado em cima
    g.save(); g.translate(forno.x + 40, forno.y - 20); g.rotate(-.5); g.fillStyle = 'rgba(30,16,6,.4)'; g.fillRect(6, 6, 340, 8); g.fillStyle = '#8a6844'; g.fillRect(0, -4, 340, 8); g.fillStyle = '#6a4c2e'; g.fillRect(-10, -26, 16, 52); g.restore();
    // a boca da fornalha, com lenha entrando
    g.fillStyle = '#1a1210'; g.beginPath(); g.ellipse(boca.x, boca.y - 6, 44, 20, 0, 0, 7); g.fill();
    [[-30, 0], [-6, 6], [20, 2]].forEach(([dx, dy], k) => { g.save(); g.translate(boca.x + dx, boca.y + 20 + dy); g.rotate(1.57 + (k - 1) * .25); g.fillStyle = '#6a4c32'; g.fillRect(-36, -6, 72, 12); g.fillStyle = '#2a1a12'; g.fillRect(-36, -6, 14, 12); g.restore(); });
    // ---- a prensa de fuso ----
    const pz = { x: 1110, y: 300 };
    [[-90, 0], [90, 0]].forEach(([dx]) => { g.fillStyle = 'rgba(30,16,6,.4)'; g.fillRect(pz.x + dx - 18, pz.y - 18, 44, 44); tabuas(g, pz.x + dx - 22, pz.y - 22, 44, 44, '#5e3e24', true); });
    g.fillStyle = 'rgba(30,16,6,.45)'; g.fillRect(pz.x - 106, pz.y - 6, 220, 30); tabuas(g, pz.x - 110, pz.y - 14, 220, 28, '#7a5636', false);
    g.fillStyle = '#3a2614'; g.beginPath(); g.arc(pz.x, pz.y, 16, 0, 7); g.fill(); g.strokeStyle = '#8a6844'; g.lineWidth = 6; g.beginPath(); g.moveTo(pz.x - 60, pz.y + 40); g.lineTo(pz.x + 60, pz.y - 40); g.stroke();
    // a massa espremida escorrendo na gamela
    g.fillStyle = '#e8dfc4'; g.fillRect(pz.x - 50, pz.y + 30, 100, 60); g.strokeStyle = '#6a4c2e'; g.lineWidth = 4; g.strokeRect(pz.x - 50, pz.y + 30, 100, 60);
    g.fillStyle = 'rgba(240,236,200,.55)'; g.beginPath(); g.ellipse(pz.x, pz.y + 110, 70, 18, 0, 0, 7); g.fill();
    // ---- o cocho com a mandioca descascada, e as cascas no chão ----
    const cx = 1020, cy = 600; g.fillStyle = 'rgba(30,16,6,.45)'; g.fillRect(cx - 150, cy - 26, 312, 68); tabuas(g, cx - 160, cy - 34, 320, 68, '#6a4a2e', false); g.fillStyle = '#4a3020'; g.fillRect(cx - 148, cy - 22, 296, 44);
    for (let k = 0; k < 34; k++) { const x = cx - 140 + R() * 280, y = cy - 16 + R() * 32, a = (R() - .5) * .8; g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = R() > .3 ? '#f1ead6' : '#e4d6b0'; g.beginPath(); g.ellipse(0, 0, 22, 5, 0, 0, 7); g.fill(); g.restore(); }
    for (let k = 0; k < 60; k++) { const x = cx - 180 + R() * 120, y = cy + 50 + R() * 60; g.strokeStyle = R() > .5 ? '#6a3e22' : '#8a5a34'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 6, y - 4, x + 12 + R() * 6, y + (R() - .5) * 6); g.stroke(); }
    // ---- o rodete de ralar, com a manivela ----
    const rd = { x: 300, y: 720 }; tabuas(g, rd.x - 70, rd.y - 30, 140, 60, '#6a4a2e', false); g.fillStyle = '#9a9ea2'; g.beginPath(); g.ellipse(rd.x, rd.y, 22, 40, 0, 0, 7); g.fill(); g.strokeStyle = '#6a6e72'; g.lineWidth = 1; for (let k = -36; k < 36; k += 5) { g.beginPath(); g.moveTo(rd.x - 20, rd.y + k); g.lineTo(rd.x + 20, rd.y + k); g.stroke(); }
    g.strokeStyle = '#8a6844'; g.lineWidth = 5; g.beginPath(); g.moveTo(rd.x + 70, rd.y); g.lineTo(rd.x + 110, rd.y); g.lineTo(rd.x + 110, rd.y - 30); g.stroke();
    // a pouca lenha que tem
    lenhaPilha(g, 260, 260, 7);
    // os sacos de farinha prontos e a de amanhã
    [[1150, 770], [1198, 800], [1170, 830], [1220, 750], [1130, 820]].forEach(([x, y]) => saco(g, x, y, 26));
    // os potes de água para a noite
    potes.forEach(p => pote(g, p.x, p.y, 22, p.cheio));
    // bancos e esteiras onde a vila vai passar a noite
    banco(g, X0 + 60, Y0 + 40, 260, 32); banco(g, X0 + 470, Y0 + 40, 260, 32); banco(g, X1 - 60, Y0 + 520, 32, 220);
    esteira(g, 232, 470, 110, 60, .1); esteira(g, 240, 560, 110, 60, -.08); esteira(g, 1060, 700, 110, 60, .05);
    paredes(g, muros, false);
  }
  function esteioD(x, y, L) {
    const sv = vetorSombra(L);
    sombraForma(() => { ctx.beginPath(); ctx.arc(x, y, 14, 0, 7); }, sv.x * 60, sv.y * 60, .5);
    const g = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, 15); g.addColorStop(0, '#9a7650'); g.addColorStop(1, '#4e3420');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 15, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(30,18,8,.7)'; ctx.lineWidth = 1; ctx.stroke();
  }
  return {
    interior: true, titulo: 'A casa de farinha', legenda: 'O barracão aberto onde a vila torra a farinha e onde todo mundo se junta na noite. O forno grande de barro com a chapa redonda e o rodo, a fornalha, a prensa de fuso, o cocho de mandioca, o rodete de ralar, os sacos, a pouca lenha, os potes de água e as esteiras. Lamparinas penduradas nos esteios. Escala sugerida: 18 passos de largura.',
    horaInicial: 0.1, fogo: true,
    fixo,
    desenhar(L, t, dt) {
      desenharCaatinga(plantas, t, L, true); desenharCaatinga(plantas, t, L, false);
      penumbra(L, [dentro], .18);
      brasaD(boca.x, boca.y - 6, 70, 16, t, L.escuro > .3);
      esteios.forEach(([x, y]) => esteioD(x, y, L));
      if (L.escuro > .15) lamparinas.forEach((p, k) => { ctx.fillStyle = '#6b5a40'; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, 7); ctx.fill(); chamaD(p.x, p.y, t, k + 3); });
      fumacaD([{ x: boca.x, y: boca.y - 4, taxa: L.escuro > .3 ? .25 : .1, r0: 3, a0: .22, cresce: 7 }], fumaca, t, dt, L);
      poeiraD(t, dt, L);
    },
    luzes(L, t) {
      const l = [{ x: boca.x, y: boca.y, r: (L.escuro > .3 ? 260 : 160) * tremor(t, 2), cor: [255, 130, 50], forca: .9 }];
      if (L.escuro > .15) lamparinas.forEach((p, k) => l.push({ x: p.x, y: p.y, r: 170 * tremor(t, k + 3), cor: [255, 185, 100], forca: .75 }));
      return l;
    },
    depois() {},
  };
}

// ================= CENÁRIO 6: A CASA DE DONA ZULEIDE =================
function cenaZuleide() {
  R = rng(66);
  const T = 22, X0 = 290, Y0 = 150, X1 = 1210, Y1 = 690, XC = 900, YA = 850;
  const sala = [X0 + T, Y0 + T, XC - X0 - T, Y1 - Y0 - 2 * T], cozinha = [XC + T, Y0 + T, X1 - XC - 2 * T, Y1 - Y0 - 2 * T], alpendre = [X0, Y1, X1 - X0, YA - Y1];
  const muros = [
    [X0, Y0, 150, T], [X0 + 220, Y0, 560, T], [X0 + 850, Y0, X1 - X0 - 850, T],
    [X0, Y1 - T, 90, T], [X0 + 160, Y1 - T, 110, T], [X0 + 370, Y1 - T, X1 - X0 - 370, T],
    [X0, Y0, T, Y1 - Y0], [X1 - T, Y0, T, Y1 - Y0],
    [XC, Y0, T, 210], [XC, Y0 + 340, T, Y1 - Y0 - 340],
  ];
  const redeZ = { x1: X0 + T, y1: Y0 + 150, x2: XC - 210, y2: Y0 + 360, larg: 26, cor: '#7a9ab0', faixa: ['#e8dcc0', '#c25a3a', '#e8dcc0'], f: .4, balanca: 1 };
  const canto = { x: XC - 110, y: Y0 + T + 70 };   // o canto de Celeste
  const caneca = { x: X0 + 220, y: Y0 + 420 }, vela = { x: X0 + T + 30, y: Y0 + 470 }, fogaoP = { x: XC + 60, y: Y0 + T + 10, w: 170, h: 66 };
  const esteios = [[X0 + 10, YA - 10], [X0 + 320, YA - 10], [X0 + 620, YA - 10], [X1 - 10, YA - 10]];
  const feixes = [
    { x: X0 + 125, y: Y1 - T, w: 60, dx: 0, dy: -1, len: 210, desvio: 1, k: .2 },
    { x: X0 + 320, y: Y1 - T, w: 90, dx: 0, dy: -1, len: 260, desvio: 1, k: .5 },
    { x: X0 + 185, y: Y0 + T, w: 60, dx: 0, dy: 1, len: 200, desvio: 1, k: .8 },
    { x: X0 + 815, y: Y0 + T, w: 60, dx: 0, dy: 1, len: 180, desvio: 1, k: .4 },
  ];
  const vaporCha = [], fumaca = [];
  const plantas = caatinga(66, (x, y) => (x < X0 - 30 || x > X1 + 30 || y < Y0 - 30 || y > YA + 30), { jurema: 8, macambira: 6, xique: 5, mandacaru: 3, capim: 90 });
  function fixo(g) {
    chaoDeFora(g, 66);
    pisoInterno(g, ...sala, 'terra'); pisoInterno(g, ...cozinha, 'terra'); pisoInterno(g, ...alpendre, 'tijolo');
    // ---- a sala ----
    // o oratório de Zuleide e a vela
    oratorio(g, X0 + T + 30, Y0 + 430); velaBase(g, vela.x, vela.y);
    mesa(g, caneca.x - 70, caneca.y - 40, 140, 80, '#7a5636'); cadeira(g, caneca.x - 100, caneca.y, -1.57); cadeira(g, caneca.x + 100, caneca.y, 1.57);
    // o bule e a caneca de chá de Celeste
    g.fillStyle = '#e8e0cc'; g.beginPath(); g.arc(caneca.x, caneca.y, 9, 0, 7); g.fill(); g.fillStyle = '#9a8a3a'; g.beginPath(); g.arc(caneca.x, caneca.y, 6, 0, 7); g.fill();
    g.fillStyle = '#6a7a80'; g.beginPath(); g.arc(caneca.x + 36, caneca.y - 10, 15, 0, 7); g.fill(); g.strokeStyle = '#4a565a'; g.lineWidth = 3; g.beginPath(); g.moveTo(caneca.x + 50, caneca.y - 14); g.lineTo(caneca.x + 62, caneca.y - 22); g.stroke();
    g.fillStyle = '#4e6a3c'; for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(caneca.x - 40 + k * 5, caneca.y + 18, 4, 2, k, 0, 7); g.fill(); }
    bau(g, 760, Y1 - T - 70, 90, 56);
    pote(g, X0 + 390, Y1 - T - 34, 22);
    // onde Zuleide passa o dia: o tapete de retalhos, a cadeira de balanço e os cestos
    tapete(g, X0 + 330, Y0 + 250, 140, 82);
    g.save(); g.translate(X0 + 300, Y0 + 240); g.rotate(.5); sombraMovel(g, (c) => { c.beginPath(); c.rect(-22, -24, 44, 50); }, 5, 6, .45); g.strokeStyle = '#4e3420'; g.lineWidth = 4; g.lineCap = 'round'; [-20, 20].forEach((x) => { g.beginPath(); g.moveTo(x, -34); g.quadraticCurveTo(x + 2, 0, x, 36); g.stroke(); }); g.fillStyle = '#6a482c'; g.fillRect(-20, -24, 40, 46); g.fillStyle = '#c4a468'; g.fillRect(-16, -14, 32, 32); g.strokeStyle = 'rgba(110,80,36,.7)'; g.lineWidth = 1; for (let k = -14; k < 18; k += 4) { g.beginPath(); g.moveTo(-16, k); g.lineTo(16, k + 2); g.stroke(); } g.fillStyle = '#4e3420'; g.fillRect(-20, -28, 40, 8); g.fillStyle = '#c25a3a'; g.beginPath(); g.ellipse(2, 2, 12, 9, .3, 0, 7); g.fill(); g.restore();
    cesto(g, X0 + 470, Y0 + 300, 20, ['#e8dcc0', '#7a9ab0', '#c25a3a']); cesto(g, X0 + 90, Y0 + 92, 16, ['#d9b45a', '#e8dcc0']);
    g.save(); g.translate(X0 + 455, Y0 + 225); g.rotate(-.4); g.fillStyle = 'rgba(30,16,6,.3)'; g.beginPath(); g.ellipse(3, 4, 22, 10, 0, 0, 7); g.fill(); g.fillStyle = '#ece4d2'; g.beginPath(); g.ellipse(0, 0, 22, 10, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(150,130,100,.6)'; g.beginPath(); g.moveTo(-14, -3); g.lineTo(14, 4); g.stroke(); g.restore();
    // o canto de Celeste: a esteira, a trouxa, os bordados presos na parede com espinho
    esteira(g, canto.x, canto.y + 40, 150, 70, 0);
    g.save(); g.translate(canto.x + 46, canto.y + 34); g.fillStyle = 'rgba(30,16,6,.35)'; g.beginPath(); g.ellipse(4, 5, 30, 24, 0, 0, 7); g.fill(); g.fillStyle = '#3e5a78'; g.beginPath(); g.ellipse(0, 0, 30, 24, .3, 0, 7); g.fill(); g.strokeStyle = 'rgba(20,30,50,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-20, -10); g.quadraticCurveTo(0, 4, 22, -8); g.stroke(); g.fillStyle = '#2e4460'; g.beginPath(); g.arc(-4, -18, 8, 0, 7); g.fill(); g.restore();
    // o bastidor redondo com o bordado começado, a tesoura comprida e a linha vermelha
    g.save(); g.translate(canto.x - 50, canto.y + 40); g.fillStyle = '#efe8d8'; g.beginPath(); g.arc(0, 0, 24, 0, 7); g.fill(); g.strokeStyle = '#a07a4a'; g.lineWidth = 4; g.stroke();
    g.fillStyle = '#c94a3a'; for (let k = 0; k < 5; k++) { const a = k * 1.256; g.beginPath(); g.arc(Math.cos(a) * 7, Math.sin(a) * 7, 3, 0, 7); g.fill(); } g.fillStyle = '#4a7a4a'; g.beginPath(); g.ellipse(10, 10, 6, 3, .6, 0, 7); g.fill(); g.restore();
    g.save(); g.translate(canto.x + 4, canto.y + 66); g.rotate(.3); g.strokeStyle = '#a8aeb2'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(0, 0); g.lineTo(34, -4); g.moveTo(0, 0); g.lineTo(34, 4); g.stroke(); g.strokeStyle = '#6a6e72'; g.lineWidth = 2; g.beginPath(); g.arc(-6, -4, 5, 0, 7); g.arc(-6, 5, 5, 0, 7); g.stroke(); g.restore();
    g.fillStyle = '#b0302a'; g.beginPath(); g.arc(canto.x - 14, canto.y + 70, 7, 0, 7); g.fill(); g.strokeStyle = '#b0302a'; g.lineWidth = 1; g.beginPath(); g.moveTo(canto.x - 14, canto.y + 70); g.quadraticCurveTo(canto.x + 10, canto.y + 90, canto.x + 40, canto.y + 76); g.stroke();
    const bordados = [['#efe6d0', '#c94a3a'], ['#e8dcc0', '#3e6a9a'], ['#f2ead8', '#c94a3a'], ['#e4d8bc', '#4a7a4a'], ['#efe6d0', '#c94a3a']];
    bordados.forEach(([fundo, ponto], k) => { const x = XC - 250 + k * 46, y = Y0 + T + 2; g.fillStyle = 'rgba(30,16,6,.3)'; g.fillRect(x + 3, y + 3, 38, 26); g.fillStyle = fundo; g.fillRect(x, y, 38, 26); g.fillStyle = ponto; for (let p = 0; p < 5; p++) { const a = p * 1.256; g.beginPath(); g.arc(x + 19 + Math.cos(a) * 5, y + 13 + Math.sin(a) * 5, 2.2, 0, 7); g.fill(); } g.fillStyle = '#4a7a4a'; g.beginPath(); g.ellipse(x + 10, y + 20, 4, 2, .5, 0, 7); g.fill();
      // o pontinho vermelho em forma de rasgo, no canto de cada um
      g.strokeStyle = '#8a1a14'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x + 31, y + 4); g.lineTo(x + 34, y + 10); g.lineTo(x + 31, y + 16); g.stroke(); g.fillStyle = '#5a4630'; g.beginPath(); g.arc(x + 19, y + 2, 1.6, 0, 7); g.fill(); });
    // ---- a cozinha ----
    fogao(g, fogaoP.x, fogaoP.y, fogaoP.w, fogaoP.h); panela(g, fogaoP.x + fogaoP.w * .3, fogaoP.y + fogaoP.h * .42, 15, '#3a2a14');
    lenhaPilha(g, XC + 120, Y0 + T + 140, 4);
    pote(g, X1 - T - 40, Y1 - T - 50, 26); prateleira(g, X1 - T - 28, Y0 + T + 110, 22, 170);
    mesa(g, XC + 60, Y1 - T - 120, 140, 70, '#6e4d30');
    // pilão
    g.fillStyle = '#7a5636'; g.beginPath(); g.arc(XC + 70, Y0 + 300, 22, 0, 7); g.fill(); g.fillStyle = '#3a2614'; g.beginPath(); g.arc(XC + 70, Y0 + 300, 12, 0, 7); g.fill();
    // ---- o alpendre: a esteira de Zeca, os baldes e a vara ----
    esteira(g, X1 - 170, Y1 + 80, 160, 60, 0);
    g.fillStyle = '#7a6448'; g.beginPath(); g.ellipse(X1 - 120, Y1 + 76, 20, 12, 0, 0, 7); g.fill();     // a trouxa dele, uma camisa enrolada
    [[840, Y1 + 60], [888, Y1 + 86]].forEach(([x, y]) => { g.fillStyle = 'rgba(30,16,6,.35)'; g.beginPath(); g.arc(x + 4, y + 5, 20, 0, 7); g.fill(); g.fillStyle = '#7a5636'; g.beginPath(); g.arc(x, y, 20, 0, 7); g.fill(); g.strokeStyle = '#3a2614'; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, 20, 0, 7); g.stroke(); g.fillStyle = '#3a5866'; g.beginPath(); g.arc(x, y, 14, 0, 7); g.fill(); });
    g.fillStyle = '#8a6844'; g.save(); g.translate(860, Y1 + 130); g.rotate(-.1); g.fillRect(-90, -4, 180, 8); g.restore();
    cadeira(g, X0 + 180, Y1 + 80, .2); banco(g, X0 + 330, Y1 + 40, 180, 30);
    paredes(g, muros, false);
    porta(g, X0 + 270, Y1 - T, 100, T); janela(g, X0 + 90, Y1 - T, 70, T, true); janela(g, X0 + 150, Y0, 70, T, true); janela(g, X0 + 780, Y0, 70, T, true);
    porta(g, XC, Y0 + 210, T, 130);
    // mureta do alpendre
    g.fillStyle = '#9c7348'; g.fillRect(X0, YA - 14, 260, 14); g.fillRect(X0 + 380, YA - 14, X1 - X0 - 380, 14); g.strokeStyle = 'rgba(40,24,12,.7)'; g.lineWidth = 1.2; g.strokeRect(X0, YA - 14, 260, 14); g.strokeRect(X0 + 380, YA - 14, X1 - X0 - 380, 14);
  }
  function esteioD(x, y, L) {
    const sv = vetorSombra(L); sombraForma(() => { ctx.beginPath(); ctx.arc(x, y, 12, 0, 7); }, sv.x * 40, sv.y * 40, .5);
    const g = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, 13); g.addColorStop(0, '#9a7650'); g.addColorStop(1, '#4e3420'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 13, 0, 7); ctx.fill();
  }
  function cortina(t) {
    // pano de chita na porta, mexendo com o vento
    const x0 = X0 + 272, y = Y1 - T / 2, w = 96, v = rajada(t);
    ctx.fillStyle = '#c25a3a';
    ctx.beginPath(); ctx.moveTo(x0, y - 4);
    for (let k = 0; k <= 12; k++) { const x = x0 + w * k / 12, o = Math.sin(t * 3 + k * .9) * (2 + v * 7) - v * 8; ctx.lineTo(x, y - 4 + o * .3); }
    for (let k = 12; k >= 0; k--) { const x = x0 + w * k / 12, o = Math.sin(t * 3 + k * .9) * (2 + v * 7) - v * 8; ctx.lineTo(x, y + 6 + o); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e9c64a'; for (let k = 0; k < 6; k++) { const x = x0 + 8 + k * 16, o = Math.sin(t * 3 + k * 1.4) * (2 + v * 7) - v * 8; ctx.beginPath(); ctx.arc(x, y + 1 + o * .6, 2.4, 0, 7); ctx.fill(); }
  }
  return {
    interior: true, titulo: 'A casa de Dona Zuleide', legenda: 'A casinha da velha que deu pouso a Celeste. Na sala, a rede de Zuleide, o oratório, a mesa com o bule e a caneca de chá. No canto, a esteira de Celeste com a trouxa, o bastidor, a tesoura comprida e os bordados presos na parede. A cozinha atrás, e no alpendre a esteira de Zeca, que não dorme dentro. Escala sugerida: 12 passos de largura.',
    horaInicial: 0.1, fogo: true,
    fixo,
    desenhar(L, t, dt) {
      { const sv = vetorSombra(L); sombraForma(() => { ctx.beginPath(); ctx.rect(X0, Y0, X1 - X0, YA - Y0); }, sv.x * 26, sv.y * 26, .5); }
      desenharCaatinga(plantas, t, L, true); desenharCaatinga(plantas, t, L, false);
      penumbra(L, [sala, cozinha], .34); penumbra(L, [alpendre], .14);
      feixes.forEach(f => feixe(f, L, t));

      esteios.forEach(([x, y]) => esteioD(x, y, L));
      cortina(t);
      chamaD(vela.x, vela.y, t, 1);
      brasaD(fogaoP.x + fogaoP.w / 2, fogaoP.y + fogaoP.h - 6, fogaoP.w * .5, 8, t, false);
      vapor(vaporCha, caneca.x, caneca.y - 4, t, dt, L);
      fumacaD([{ x: fogaoP.x + fogaoP.w / 2, y: Y0 - 6, taxa: .25, r0: 4 }], fumaca, t, dt, L);
      poeiraD(t, dt, { ...L, escuro: Math.max(L.escuro, .6) });
    },
    luzes(L, t) {
      return [
        { x: vela.x, y: vela.y, r: 150 * tremor(t, 1), cor: [255, 185, 100], forca: .85 },
        { x: fogaoP.x + fogaoP.w / 2, y: fogaoP.y + fogaoP.h, r: 150 * tremor(t, 4), cor: [255, 130, 50], forca: .7 },
        { x: caneca.x, y: caneca.y, r: 60, cor: [255, 190, 110], forca: .3 },
      ];
    },
    depois() {},
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
  velorio: { nome: 'A casa do velório', largura: 16, fabrica: cenaVelorio },
  farinha: { nome: 'A casa de farinha', largura: 18, fabrica: cenaFarinha },
  zuleide: { nome: 'A casa de Dona Zuleide', largura: 12, fabrica: cenaZuleide },
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
    // enquanto o vídeo de abertura toca, o cenário para de desenhar e deixa o computador livre
    if (document.body.classList.contains('vendo-video')) { ultimo = agora; requestAnimationFrame(quadro); return; }
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
    if (!cena.interior) nevoa(L, t);
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * .95); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.4)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);
  return {
    setHora(h, ja) { alvo = h; if (ja) hora = h; },
    setVento(v) { vento = v; },
    setTrecho(v, ja) { cena.setTrecho?.(v, ja); },
    fase: () => luzEm(hora).nome,
    som: () => som.alternar(),
    somLigado: () => som.ligado(),
    destruir() { vivo = false; ro.disconnect(); },
  };
}
