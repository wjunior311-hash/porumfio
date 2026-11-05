// Mapa compartilhado da mesa: cena, peças, escuro, círculos e movimento limitado por rodada.
// Posições são guardadas de 0 a 1 (fração da largura e da altura da imagem).
import * as M from './mestre-dados.js';

const RAIOS = [{ n: 'Pequeno', r: 1 }, { n: 'Médio', r: 3 }, { n: 'Grande', r: 6 }];

export function criarMapa(ctx) {
  const { sb, S, isGM, esc, toast, picOf, picChar, charById } = ctx;
  const uid = () => S.session?.user.id;
  const MP = { cenas: [], ativa: null, ver: null, tokens: [], tool: 'mover', brush: 3, sel: null, zoom: window.innerWidth < 700 ? 1.6 : 1, loaded: false, busy: false, live: {} };
  let bc = null; // canal de broadcast (arrasto ao vivo)
  let el = null; // raiz montada
  let W = 0, H = 0;

  const cena = () => MP.cenas.find((c) => c.id === MP.ver) || null;
  const passoPx = () => (cena() ? W / cena().largura : 10);
  const tokPx = () => Math.max(30, Math.min(68, passoPx() * 1.5));
  const meuPc = () => MP.tokens.find((t) => t.kind === 'pc' && t.owner === uid());
  const podeMover = (t) => isGM() || (t.owner === uid() && (t.kind === 'pc' || t.kind === 'circulo'));
  const distPassos = (t, x, y) => { const c = cena(); return Math.hypot(x - t.ax, (y - t.ay) * c.aspecto) * c.largura; };

  // ---------- dados ----------
  async function load() {
    const [cs, st] = await Promise.all([
      sb.from('breu_cenas').select('*').order('created_at'),
      sb.from('breu_state').select('*').eq('key', 'cena').maybeSingle(),
    ]);
    MP.cenas = cs.data || [];
    MP.ativa = st.data?.value?.ativa || null;
    if (!MP.ver || !MP.cenas.some((c) => c.id === MP.ver) || !isGM()) MP.ver = isGM() ? (MP.ver && MP.cenas.some((c) => c.id === MP.ver) ? MP.ver : MP.ativa || MP.cenas.at(-1)?.id || null) : MP.ativa;
    await loadTokens();
    MP.loaded = true;
  }
  async function loadTokens() {
    if (!MP.ver) { MP.tokens = []; return; }
    const { data } = await sb.from('breu_tokens').select('*').eq('cena_id', MP.ver);
    MP.tokens = data || [];
  }

  function canal() {
    if (bc) return;
    bc = sb.channel('breu-mapa', { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'mv' }, ({ payload: p }) => {
        if (p.cena !== MP.ver) return;
        const t = MP.tokens.find((x) => x.id === p.id); if (!t) return;
        t.x = p.x; t.y = p.y; posToken(t);
      })
      .on('broadcast', { event: 'reload' }, async () => { if (!el) return; await loadTokens(); draw(); })
      .subscribe();
  }
  const enviar = (event, payload) => bc?.send({ type: 'broadcast', event, payload });

  // eventos do banco (chamados pelo canal principal do app)
  function onCena(p) {
    if (p.eventType === 'DELETE') { MP.cenas = MP.cenas.filter((c) => c.id !== p.old.id); if (MP.ver === p.old.id) MP.ver = null; refresh(); return; }
    const i = MP.cenas.findIndex((c) => c.id === p.new.id);
    if (i < 0) MP.cenas.push(p.new); else MP.cenas[i] = p.new;
    if (p.new.id === MP.ver && el) { if (MP.tool === 'mover' || !isGM()) { drawFog(); draw(); paintBar(); } }
  }
  function onToken(p) {
    if (p.eventType === 'DELETE') { MP.tokens = MP.tokens.filter((t) => t.id !== p.old.id); if (MP.sel === p.old.id) MP.sel = null; draw(); return; }
    if (p.new.cena_id !== MP.ver) return;
    if (MP.drag?.id === p.new.id) return;
    const i = MP.tokens.findIndex((t) => t.id === p.new.id);
    if (i < 0) MP.tokens.push(p.new); else MP.tokens[i] = p.new;
    draw();
  }
  async function onAtiva(v) {
    MP.ativa = v?.ativa || null;
    if (!isGM()) { MP.ver = MP.ativa; await loadTokens(); refresh(); }
    else paintBar();
  }

  // ---------- visão ----------
  function view() {
    if (!MP.loaded) { load().then(() => ctx.rerender()); return `<p class="muted">Abrindo o mapa…</p>`; }
    const c = cena();
    const gm = isGM();
    if (!c) {
      return `<section class="hero"><p class="lbl">O mapa</p><h1>Nenhuma cena</h1></section>
        ${gm ? formNovaCena(true) : `<div class="empty"><p>O mestre ainda não mostrou nenhuma cena.</p><p class="small">Quando ele mostrar, ela aparece aqui sozinha.</p></div>`}`;
    }
    return `<div class="mp" data-mproot>
      <div class="mp-head">
        <div><p class="lbl">${gm && MP.ativa !== c.id ? 'Só você vê esta cena' : 'Cena'}</p><h1 class="mp-title">${esc(c.nome)}</h1></div>
        <div class="mp-rod"><span class="lbl">Rodada</span><b data-mp-rodada>${c.rodada}</b></div>
      </div>
      <div class="mp-bar" data-mpbar>${barHtml()}</div>
      <div class="mp-wrap"><div class="mp-stage ${isGM() && MP.tool !== 'mover' ? 'pintando' : ''}" data-mpstage style="width:${MP.zoom * 100}%">
        ${c.img ? `<img class="mp-bg" src="${esc(c.img)}" alt="" draggable="false">` : `<div class="mp-bg mp-blank"></div>`}
        <svg class="mp-svg" data-mpsvg></svg>
        <div class="mp-toks" data-mptoks></div>
        <canvas class="mp-fog" data-mpfog></canvas>
        <div class="mp-ring" data-mpring hidden></div>
      </div></div>
      <div class="mp-side" data-mpside>${sideHtml()}</div>
      ${gm ? `<details class="mp-more"><summary>Cenas</summary>${listaCenas()}${formNovaCena(false)}</details>` : ''}
    </div>`;
  }

  function barHtml() {
    const c = cena(); if (!c) return '';
    const zoom = `<div class="seg"><button class="${MP.zoom === 1 ? 'on' : ''}" data-mp="zoom" data-v="1">1×</button><button class="${MP.zoom === 1.6 ? 'on' : ''}" data-mp="zoom" data-v="1.6">1,6×</button><button class="${MP.zoom === 2.4 ? 'on' : ''}" data-mp="zoom" data-v="2.4">2,4×</button></div>`;
    if (!isGM()) {
      const pc = meuPc();
      const mov = pc ? `<span class="mp-mov">Movimento: <b>${Math.max(0, pc.passos - distPassos(pc, pc.x, pc.y)).toFixed(1).replace('.', ',')}</b> de ${String(pc.passos).replace('.', ',')} passos</span>` : '';
      const circ = pc ? `<div class="seg">${RAIOS.map((r) => `<button data-mp="circ" data-v="${r.r}">Círculo ${r.n.toLowerCase()}</button>`).join('')}</div>` : '';
      return `${mov}${zoom}${circ}${!pc && meusChars().length ? meusChars().map((ch) => `<button class="btn sm" data-mp="entrar" data-v="${ch.id}">Colocar ${esc(ch.data.nome || 'meu personagem')} na cena</button>`).join('') : ''}`;
    }
    const fogOn = c.fog?.on !== false;
    return `<div class="seg"><button class="${MP.tool === 'mover' ? 'on' : ''}" data-mp="tool" data-v="mover">Mover</button><button class="${MP.tool === 'revelar' ? 'on' : ''}" data-mp="tool" data-v="revelar" ${fogOn ? '' : 'disabled'}>Revelar</button><button class="${MP.tool === 'cobrir' ? 'on' : ''}" data-mp="tool" data-v="cobrir" ${fogOn ? '' : 'disabled'}>Cobrir</button></div>
      ${MP.tool !== 'mover' ? `<div class="seg">${[1.5, 3, 6].map((b) => `<button class="${MP.brush === b ? 'on' : ''}" data-mp="brush" data-v="${b}">${b === 1.5 ? 'Pincel fino' : b === 3 ? 'Médio' : 'Largo'}</button>`).join('')}</div>` : ''}
      <button class="btn sm primary" data-mp="rodada">Nova rodada</button>
      ${zoom}
      <button class="btn sm" data-mp="fog">${fogOn ? 'Tirar o escuro' : 'Pôr o escuro'}</button>
      ${MP.ativa === c.id ? `<span class="mp-on">Os jogadores estão vendo</span>` : `<button class="btn sm" data-mp="mostrar">Mostrar aos jogadores</button>`}`;
  }

  const meusChars = () => S.chars.filter((ch) => ch.owner === uid() && ch.status === 'aprovado');

  function sideHtml() {
    const c = cena(); if (!c) return '';
    const t = MP.tokens.find((x) => x.id === MP.sel);
    let sel = '';
    if (t) {
      const d = t.data || {};
      if (t.kind === 'circulo') {
        sel = `<div class="mp-sel"><b>${esc(t.nome || 'Círculo')}</b>
          <div class="mp-row"><span>Força</span><button class="btn sm" data-mp="forca" data-v="-1">−</button><b>${d.forca ?? 0}</b><button class="btn sm" data-mp="forca" data-v="1">+</button></div>
          <div class="mp-row"><span>Tamanho</span>${RAIOS.map((r) => `<button class="btn sm ${d.raio === r.r ? 'primary' : ''}" data-mp="raio" data-v="${r.r}">${r.n}</button>`).join('')}</div>
          <button class="btn sm ghost" data-mp="apagar">Apagar o círculo</button></div>`;
      } else if (isGM()) {
        const b = d.best ? M.BESTIARIO.find((x) => x.id === d.best) : null;
        sel = `<div class="mp-sel"><b>${esc(t.nome)}</b>${b ? `<span class="small muted"> · ${b.grau} de ${b.familia} · ${b.sentido} · Defesa ${b.defesa} · ${b.atq} · ${b.dano}</span>` : ''}
          ${t.kind !== 'pc' ? `<div class="mp-row"><span>Sangue</span><button class="btn sm" data-mp="sangue" data-v="-5">−5</button><button class="btn sm" data-mp="sangue" data-v="-1">−1</button><b>${d.sangue ?? '–'}${d.max ? ' / ' + d.max : ''}</b><button class="btn sm" data-mp="sangue" data-v="1">+1</button></div>` : ''}
          <div class="mp-row"><span>Passos por rodada</span><button class="btn sm" data-mp="passos" data-v="-1">−</button><b>${t.passos}</b><button class="btn sm" data-mp="passos" data-v="1">+</button></div>
          <div class="mp-row">${t.kind !== 'pc' ? `<button class="btn sm" data-mp="visivel">${t.visivel ? 'Esconder dos jogadores' : 'Revelar aos jogadores'}</button>` : ''}<button class="btn sm ghost" data-mp="apagar">Tirar da cena</button></div></div>`;
      }
    }
    if (!isGM()) return sel || `<p class="small muted">Arraste o seu personagem. Ele anda até o limite de passos da rodada; na próxima rodada, o limite volta.</p>`;
    const naCena = new Set(MP.tokens.filter((x) => x.kind === 'pc').map((x) => x.character_id));
    const faltam = S.chars.filter((ch) => ch.status === 'aprovado' && !naCena.has(ch.id));
    return `${sel}
      <div class="mp-add">
        ${faltam.length ? `<button class="btn sm" data-mp="grupo">Colocar o grupo (${faltam.length})</button>` : ''}
        <select class="field sm" data-mpbest><option value="">+ Assombro (entra escondido)</option>${['Cinza', 'Raiz', 'Osso', 'Sopro', 'Lodo', 'Velho'].map((f) => `<optgroup label="${f}">${M.BESTIARIO.filter((b) => (f === 'Velho' ? b.grau === 'Velho' : b.familia === f && b.grau !== 'Velho')).map((b) => `<option value="${b.id}">${esc(b.nome)} · ${b.grau}</option>`).join('')}</optgroup>`).join('')}</select>
        <form class="mp-npc" data-mpform="npc"><input class="field sm" name="nome" placeholder="+ Pessoa (nome)" maxlength="40"><button class="btn sm">Pôr</button></form>
        <div class="seg">${RAIOS.map((r) => `<button data-mp="circ" data-v="${r.r}">Círculo ${r.n.toLowerCase()}</button>`).join('')}</div>
      </div>`;
  }

  function listaCenas() {
    return `<div class="mp-cenas">${MP.cenas.map((c) => `<div class="mp-cena ${c.id === MP.ver ? 'on' : ''}">
      <button class="linkish" data-mp="ver" data-v="${c.id}">${esc(c.nome)}</button>${c.id === MP.ativa ? '<span class="mp-on">no ar</span>' : ''}
      <label class="small">Largura em passos <input class="field sm" type="number" min="5" max="400" value="${c.largura}" data-mplarg="${c.id}"></label>
      <button class="btn sm ghost" data-mp="delcena" data-v="${c.id}">Apagar</button></div>`).join('')}</div>`;
  }
  function formNovaCena(first) {
    return `<form class="card mp-nova" data-mpform="cena">
      <h3>${first ? 'Crie a primeira cena' : 'Nova cena'}</h3>
      <label class="flab">Nome</label><input class="field" name="nome" required maxlength="60" placeholder="O pouso da encruzilhada">
      <label class="flab" style="margin-top:10px">Imagem do cenário</label><input class="field" type="file" name="img" accept="image/*" required>
      <label class="flab" style="margin-top:10px">Quantos passos cabem na largura da imagem?</label>
      <input class="field" name="largura" type="number" min="5" max="400" value="30">
      <p class="fhelp">Um cômodo grande tem uns 10 passos; um pátio, uns 30; um trecho de estrada, uns 80. Isso decide o quanto cada um anda por rodada.</p>
      <button class="btn primary block" ${MP.busy ? 'disabled' : ''}>${MP.busy ? 'Enviando…' : 'Criar a cena'}</button></form>`;
  }

  // ---------- desenho ----------
  function mount() {
    el = document.querySelector('[data-mproot]');
    canal();
    if (!el) { el = null; return; }
    const stage = el.querySelector('[data-mpstage]');
    const img = el.querySelector('img.mp-bg');
    const size = () => { W = stage.clientWidth; H = W * cena().aspecto; stage.style.height = H + 'px'; drawFog(); draw(); };
    if (img && !img.complete) img.addEventListener('load', size, { once: true });
    size();
    const meu = !isGM() && meuPc(), wrap = el.querySelector('.mp-wrap');
    if (meu && wrap.scrollWidth > wrap.clientWidth) { wrap.scrollLeft = meu.x * W - wrap.clientWidth / 2; wrap.scrollTop = meu.y * H - wrap.clientHeight / 2; }
    new ResizeObserver(() => { if (stage.clientWidth !== W) size(); }).observe(stage);
    stage.addEventListener('pointerdown', onDown);
  }
  function refresh() { ctx.rerender(); }
  function paintBar() { const b = el?.querySelector('[data-mpbar]'); if (b) b.innerHTML = barHtml(); const r = el?.querySelector('[data-mp-rodada]'); if (r && cena()) r.textContent = cena().rodada; }
  function paintSide() { const s = el?.querySelector('[data-mpside]'); if (s) s.innerHTML = sideHtml(); }

  function revelado(x, y) {
    const c = cena(); if (!c || c.fog?.on === false) return true;
    return (c.fog?.revela || []).some((r) => Math.hypot((x - r.x), (y - r.y) * c.aspecto) * c.largura <= r.r * 0.85);
  }

  function drawFog() {
    const cv = el?.querySelector('[data-mpfog]'); const c = cena(); if (!cv || !c) return;
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    g.clearRect(0, 0, W, H);
    if (c.fog?.on === false) return;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = isGM() ? 'rgba(4,6,9,.7)' : 'rgba(4,6,9,1)';
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'destination-out';
    const pp = passoPx();
    for (const r of c.fog?.revela || []) {
      const cx = r.x * W, cy = r.y * H, rr = r.r * pp;
      const gr = g.createRadialGradient(cx, cy, rr * 0.55, cx, cy, rr);
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, rr, 0, Math.PI * 2); g.fill();
    }
  }

  function draw() {
    if (!el) return;
    const box = el.querySelector('[data-mptoks]'); if (!box || !cena()) return;
    const sz = tokPx(), pp = passoPx();
    const vis = MP.tokens.filter((t) => isGM() || t.owner === uid() || (t.visivel && (t.kind === 'pc' || t.kind === 'circulo' || revelado(t.x, t.y))));
    const circ = vis.filter((t) => t.kind === 'circulo').map((t) => {
      const r = (t.data?.raio || 1) * pp;
      return `<div class="mp-circ ${MP.sel === t.id ? 'sel' : ''} ${podeMover(t) ? 'mov' : ''}" data-tok="${t.id}" style="width:${r * 2}px;height:${r * 2}px;left:${t.x * W}px;top:${t.y * H}px"><span>${t.data?.forca ?? 0}</span></div>`;
    }).join('');
    const pecas = vis.filter((t) => t.kind !== 'circulo').map((t) => {
      const ch = t.character_id ? charById(t.character_id) : null;
      const src = t.img || (ch ? picChar(ch) : '');
      const d = t.data || {};
      const ferido = d.max && d.sangue != null && d.sangue <= d.max / 2;
      return `<div class="mp-tok k-${t.kind} ${MP.sel === t.id ? 'sel' : ''} ${t.visivel ? '' : 'oculto'} ${t.owner === uid() ? 'meu' : ''} ${podeMover(t) ? 'mov' : ''} ${ferido ? 'ferido' : ''}" data-tok="${t.id}" style="width:${sz}px;height:${sz}px;left:${t.x * W}px;top:${t.y * H}px">
        ${src ? `<img src="${esc(src)}" alt="" draggable="false">` : `<i>${esc((t.nome || '?')[0])}</i>`}<span class="nm">${esc(t.nome)}</span></div>`;
    }).join('');
    box.innerHTML = circ + pecas;
    const pc = !isGM() && meuPc();
    const ring = el.querySelector('[data-mpring]');
    if (pc && !MP.drag) showRing(pc, false); else if (!MP.drag) ring.hidden = true;
    paintBar();
  }
  function posToken(t) {
    const n = el?.querySelector(`[data-tok="${t.id}"]`); if (!n) return;
    n.style.left = t.x * W + 'px'; n.style.top = t.y * H + 'px';
  }
  function showRing(t, forte) {
    const ring = el.querySelector('[data-mpring]'); const r = t.passos * passoPx();
    ring.hidden = false; ring.classList.toggle('forte', !!forte);
    Object.assign(ring.style, { width: r * 2 + 'px', height: r * 2 + 'px', left: t.ax * W + 'px', top: t.ay * H + 'px' });
  }

  // ---------- arrastar, revelar, cobrir ----------
  function pos(e) {
    const r = el.querySelector('[data-mpstage]').getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)) };
  }
  function onDown(e) {
    const c = cena(); if (!c) return;
    const stage = e.currentTarget;
    if (isGM() && MP.tool !== 'mover') {
      e.preventDefault(); stage.setPointerCapture(e.pointerId);
      pintar(pos(e));
      const mv = (ev) => pintar(pos(ev));
      const up = () => { stage.removeEventListener('pointermove', mv); stage.removeEventListener('pointerup', up); stage.removeEventListener('pointercancel', up); salvarFog(); };
      stage.addEventListener('pointermove', mv); stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
      return;
    }
    let n = e.target.closest('[data-tok]');
    if (n && !podeMover(MP.tokens.find((x) => x.id === n.dataset.tok) || {})) {
      // peças empilhadas: prefere a que esta pessoa pode mover
      const alt = document.elementsFromPoint(e.clientX, e.clientY).map((x) => x.closest?.('[data-tok]')).find((x) => x && podeMover(MP.tokens.find((y) => y.id === x.dataset.tok) || {}));
      if (alt) n = alt;
    }
    if (!n) { if (MP.sel) { MP.sel = null; draw(); paintSide(); } return; }
    const t = MP.tokens.find((x) => x.id === n.dataset.tok); if (!t) return;
    if (MP.sel !== t.id) { MP.sel = t.id; paintSide(); }
    if (!podeMover(t)) { draw(); return; }
    e.preventDefault(); stage.setPointerCapture(e.pointerId);
    const p0 = pos(e), o = { x: t.x, y: t.y };
    const limite = !isGM() && t.kind === 'pc';
    MP.drag = { id: t.id, moved: false };
    if (limite) showRing(t, true);
    let last = 0;
    const mv = (ev) => {
      const p = pos(ev);
      let x = o.x + (p.x - p0.x), y = o.y + (p.y - p0.y);
      x = Math.max(0, Math.min(1, x)); y = Math.max(0, Math.min(1, y));
      if (limite) {
        const d = distPassos(t, x, y);
        if (d > t.passos) { const k = t.passos / d; x = t.ax + (x - t.ax) * k; y = t.ay + (y - t.ay) * k; }
      }
      if (Math.abs(x - t.x) + Math.abs(y - t.y) > 0.0005) MP.drag.moved = true;
      t.x = x; t.y = y; posToken(t);
      if (limite) { const m = el.querySelector('.mp-mov b'); if (m) m.textContent = Math.max(0, t.passos - distPassos(t, x, y)).toFixed(1).replace('.', ','); }
      const now = Date.now(); if (now - last > 70) { last = now; enviar('mv', { cena: c.id, id: t.id, x, y }); }
    };
    const up = async () => {
      stage.removeEventListener('pointermove', mv); stage.removeEventListener('pointerup', up); stage.removeEventListener('pointercancel', up);
      const moved = MP.drag.moved; MP.drag = null;
      if (!moved) { draw(); return; }
      enviar('mv', { cena: c.id, id: t.id, x: t.x, y: t.y });
      const patch = { x: t.x, y: t.y };
      if (isGM() && t.kind === 'pc' && !e.altKey) { /* o mestre empurra: a rodada do jogador conta a partir daqui */ patch.ax = t.x; patch.ay = t.y; t.ax = t.x; t.ay = t.y; }
      const { error } = await sb.from('breu_tokens').update(patch).eq('id', t.id);
      if (error) { toast(/alcance/.test(error.message) ? 'Fora do alcance desta rodada.' : 'Não consegui mover.'); t.x = o.x; t.y = o.y; enviar('mv', { cena: c.id, id: t.id, x: o.x, y: o.y }); }
      draw();
    };
    stage.addEventListener('pointermove', mv); stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
  }

  function pintar(p) {
    const c = cena(); c.fog = c.fog || { on: true, revela: [] }; c.fog.revela = c.fog.revela || [];
    const L = c.largura;
    if (MP.tool === 'revelar') {
      const perto = c.fog.revela.some((r) => Math.hypot(p.x - r.x, (p.y - r.y) * c.aspecto) * L < MP.brush * 0.35 && r.r >= MP.brush);
      if (!perto) c.fog.revela.push({ x: +p.x.toFixed(4), y: +p.y.toFixed(4), r: MP.brush });
    } else {
      c.fog.revela = c.fog.revela.filter((r) => Math.hypot(p.x - r.x, (p.y - r.y) * c.aspecto) * L > MP.brush);
    }
    drawFog();
  }
  async function salvarFog() {
    const c = cena(); if (c.fog.revela.length > 1500) c.fog.revela = c.fog.revela.slice(-1500);
    const { error } = await sb.from('breu_cenas').update({ fog: c.fog }).eq('id', c.id);
    if (error) toast('Não consegui salvar o escuro.');
  }

  // ---------- ações ----------
  async function act(t, e) {
    const a = t.dataset.mp, v = t.dataset.v, c = cena();
    const sel = MP.tokens.find((x) => x.id === MP.sel);
    if (a === 'zoom') { MP.zoom = +v; refresh(); return; }
    if (a === 'tool') { MP.tool = v; paintBar(); el.querySelector('[data-mpstage]').classList.toggle('pintando', v !== 'mover'); return; }
    if (a === 'brush') { MP.brush = +v; paintBar(); return; }
    if (a === 'ver') { MP.ver = v; MP.sel = null; await loadTokens(); refresh(); return; }
    if (a === 'mostrar') {
      const { error } = await sb.from('breu_state').upsert({ key: 'cena', value: { ativa: c.id }, updated_at: new Date().toISOString() });
      if (error) { toast('Não consegui mostrar a cena.'); return; }
      MP.ativa = c.id; toast('Os jogadores agora veem esta cena.'); paintBar(); return;
    }
    if (a === 'fog') {
      c.fog = { ...(c.fog || {}), on: c.fog?.on === false, revela: c.fog?.revela || [] };
      if (c.fog.on === false) MP.tool = 'mover';
      await sb.from('breu_cenas').update({ fog: c.fog }).eq('id', c.id); drawFog(); draw(); return;
    }
    if (a === 'rodada') {
      t.disabled = true;
      await Promise.all(MP.tokens.filter((x) => x.kind === 'pc' || x.kind === 'npc' || x.kind === 'assombro').map((x) => { x.ax = x.x; x.ay = x.y; return sb.from('breu_tokens').update({ ax: x.x, ay: x.y }).eq('id', x.id); }));
      c.rodada = (c.rodada || 1) + 1;
      await sb.from('breu_cenas').update({ rodada: c.rodada }).eq('id', c.id);
      t.disabled = false; draw(); toast(`Rodada ${c.rodada}.`); return;
    }
    if (a === 'grupo') {
      const naCena = new Set(MP.tokens.filter((x) => x.kind === 'pc').map((x) => x.character_id));
      const faltam = S.chars.filter((ch) => ch.status === 'aprovado' && !naCena.has(ch.id));
      const rows = faltam.map((ch, i) => { const x = 0.36 + (i % 4) * 0.09, y = 0.55 + Math.floor(i / 4) * 0.12; return { cena_id: c.id, kind: 'pc', character_id: ch.id, owner: ch.owner, nome: ch.data.nome || 'Sem nome', x, y, ax: x, ay: y, passos: S.mesa?.passos || 6 }; });
      const { error } = await sb.from('breu_tokens').insert(rows);
      if (error) toast('Não consegui colocar o grupo.'); else { await loadTokens(); draw(); paintSide(); }
      return;
    }
    if (a === 'entrar') {
      const ch = charById(v); if (!ch) return;
      const { error } = await sb.from('breu_tokens').insert({ cena_id: c.id, kind: 'pc', character_id: ch.id, owner: uid(), nome: ch.data.nome || 'Sem nome', x: 0.5, y: 0.55 });
      if (error) toast('Não consegui entrar na cena.'); else { await loadTokens(); draw(); }
      return;
    }
    if (a === 'circ') {
      const base = isGM() ? (sel && sel.kind !== 'circulo' ? sel : null) : meuPc();
      const x = base ? base.x : 0.5, y = base ? base.y : 0.5;
      const forca = isGM() ? 10 : +(prompt('Força do círculo (o resultado da sua rolagem de Traços):', '10') || 0);
      if (!isGM() && !forca) return;
      const { data, error } = await sb.from('breu_tokens').insert({ cena_id: c.id, kind: 'circulo', owner: uid(), nome: 'Círculo', x, y, ax: x, ay: y, data: { raio: +v, forca } }).select().single();
      if (error) { toast('Não consegui traçar.'); return; }
      if (!MP.tokens.some((x2) => x2.id === data.id)) MP.tokens.push(data);
      MP.sel = data.id; draw(); paintSide(); return;
    }
    if (!sel) return;
    const d = { ...(sel.data || {}) };
    if (a === 'forca') { d.forca = Math.max(0, (d.forca || 0) + +v); }
    else if (a === 'raio') { d.raio = +v; }
    else if (a === 'sangue') { d.sangue = Math.max(0, Math.min(d.max || 999, (d.sangue ?? d.max ?? 0) + +v)); }
    else if (a === 'passos') { const p = Math.max(0, sel.passos + +v); sel.passos = p; await sb.from('breu_tokens').update({ passos: p }).eq('id', sel.id); draw(); paintSide(); return; }
    else if (a === 'visivel') {
      sel.visivel = !sel.visivel;
      await sb.from('breu_tokens').update({ visivel: sel.visivel }).eq('id', sel.id);
      enviar('reload', {}); draw(); paintSide(); return;
    } else if (a === 'apagar') {
      const { error } = await sb.from('breu_tokens').delete().eq('id', sel.id);
      if (error) { toast('Não consegui apagar.'); return; }
      MP.tokens = MP.tokens.filter((x) => x.id !== sel.id); MP.sel = null; draw(); paintSide(); return;
    } else return;
    sel.data = d;
    const { error } = await sb.from('breu_tokens').update({ data: d }).eq('id', sel.id);
    if (error) toast('Não consegui salvar.');
    draw(); paintSide();
  }

  async function onChange(t) {
    const c = cena();
    if (t.matches('[data-mpbest]') && t.value) {
      const b = M.BESTIARIO.find((x) => x.id === t.value); t.value = '';
      const n = MP.tokens.filter((x) => x.data?.best === b.id).length;
      const sel = MP.tokens.find((x) => x.id === MP.sel);
      const x = sel ? Math.min(0.97, sel.x + 0.05) : 0.5, y = sel ? sel.y : 0.3;
      const { error } = await sb.from('breu_tokens').insert({ cena_id: c.id, kind: 'assombro', nome: b.nome + (n ? ' ' + (n + 1) : ''), img: `img/ass/${b.id}.webp`, x, y, ax: x, ay: y, passos: 6, visivel: false, data: { best: b.id, sangue: b.sangue, max: b.sangue } });
      if (error) toast('Não consegui pôr o Assombro.'); else { await loadTokens(); draw(); }
      return true;
    }
    if (t.dataset.mplarg) {
      const v = Math.max(5, Math.min(400, +t.value || 30));
      await sb.from('breu_cenas').update({ largura: v }).eq('id', t.dataset.mplarg);
      const cc = MP.cenas.find((x) => x.id === t.dataset.mplarg); if (cc) cc.largura = v;
      refresh(); return true;
    }
    return false;
  }

  async function onSubmit(f) {
    const k = f.dataset.mpform; if (!k) return false;
    const c = cena();
    if (k === 'npc') {
      const nome = f.nome.value.trim(); if (!nome) return true;
      const { error } = await sb.from('breu_tokens').insert({ cena_id: c.id, kind: 'npc', nome, x: 0.5, y: 0.5, ax: 0.5, ay: 0.5, visivel: true });
      if (error) toast('Não consegui pôr a pessoa.'); else { f.reset(); await loadTokens(); draw(); }
      return true;
    }
    if (k === 'cena') {
      const file = f.img.files[0]; if (!file) return true;
      MP.busy = true; refresh();
      try {
        const { blob, aspecto } = await reduzir(file, 2000);
        const path = `cenas/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.webp`;
        const up = await sb.storage.from('breu').upload(path, blob, { contentType: 'image/webp', upsert: false });
        if (up.error) throw up.error;
        const url = sb.storage.from('breu').getPublicUrl(path).data.publicUrl;
        const { data, error } = await sb.from('breu_cenas').insert({ nome: f.nome.value.trim() || 'Cena', img: url, aspecto, largura: Math.max(5, Math.min(400, +f.largura.value || 30)) }).select().single();
        if (error) throw error;
        if (!MP.cenas.some((x) => x.id === data.id)) MP.cenas.push(data);
        MP.ver = data.id; MP.tokens = []; toast('Cena criada. Ela só aparece para os jogadores quando você mostrar.');
      } catch (err) { console.error(err); toast('Não consegui criar a cena.'); }
      MP.busy = false; refresh();
      return true;
    }
    return false;
  }

  async function delCena(id) {
    if (!confirm('Apagar esta cena e tudo o que está nela?')) return;
    const { error } = await sb.from('breu_cenas').delete().eq('id', id);
    if (error) { toast('Não consegui apagar.'); return; }
    MP.cenas = MP.cenas.filter((c) => c.id !== id);
    if (MP.ver === id) { MP.ver = MP.cenas.at(-1)?.id || null; await loadTokens(); }
    refresh();
  }

  return {
    view, mount, redraw: () => draw(), onCena, onToken, onAtiva, onChange, onSubmit, load,
    unmount() { el = null; },
    async click(e) {
      const t = e.target.closest('[data-mp]'); if (!t) return false;
      e.preventDefault();
      if (t.dataset.mp === 'delcena') { await delCena(t.dataset.v); return true; }
      await act(t, e); return true;
    },
  };
}

// reduz a imagem no navegador antes de enviar (o ChatGPT entrega PNG pesado)
function reduzir(file, max) {
  return new Promise((ok, fail) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      cv.toBlob((b) => (b ? ok({ blob: b, aspecto: cv.height / cv.width }) : fail(new Error('blob'))), 'image/webp', 0.86);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = fail;
    img.src = URL.createObjectURL(file);
  });
}
