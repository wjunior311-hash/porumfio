// Mapa compartilhado da mesa: cena, peças, escuro, círculos e movimento limitado por rodada.
// Posições são guardadas de 0 a 1 (fração da largura e da altura da imagem).
import * as M from './mestre-dados.js';
import { criarCenaViva, CENAS_VIVAS, ASPECTO_VIVO, horaDaNoite } from './cenas-vivas.js?v=18';

const HORAS = [['', 'Seguir a noite'], [0.06, 'Tarde'], [0.2, 'Entardecer'], [0.34, 'Crepúsculo'], [0.52, 'Breu'], [0.7, 'Hora Morta'], [0.86, 'Antes da aurora'], [0.95, 'Aurora']];
const VENTOS = [[0.15, 'Vento calmo'], [0.45, 'Vento médio'], [0.85, 'Vento forte']];

// o elenco da one-shot: quem tem retrato entra no mapa com ele
const ELENCO = [['Celeste', 'celeste'], ['Zeca', 'zeca'], ['Brás', 'bras'], ['Rosário', 'rosario'], ['Bento', 'bento'], ['Dona Lindalva', 'lindalva'], ['Dona Zuleide', 'zuleide', 1], ['Seu Orlando', 'orlando', 1], ['Joana', 'joana', 1], ['Dona Firmina', 'firmina', 1]];
const semAcento = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/^(dona|seu) /, '').trim();
const fotoNpc = (nome) => { const e = ELENCO.find(([n]) => semAcento(n) === semAcento(nome)); return e && !e[2] ? `img/tok/${e[1]}.webp` : null; };
// quem tem uma forma verdadeira para revelar no meio da noite
const FORMA = { celeste: 'img/tok/celeste-rasgada.webp', zeca: 'img/tok/zeca-rasgado.webp' };
// a forma só aparece quando a imagem existe de verdade
const formaOk = {};
Object.values(FORMA).forEach((src) => { const im = new Image(); im.onload = () => { formaOk[src] = true; }; im.src = src; });
const formaDe = (nome) => { const f = FORMA[semAcento(nome)]; return f && formaOk[f] ? f : null; };
// peça do personagem: recorte de rosto em fundo claro, quando existe
const TOK_PJ = ['tiao', 'flecha', 'inacio', 'damiao', 'priya', 'kaeleen'];
const tokDe = (src) => { const m = /img\/pj\/([a-z]+)\.webp$/.exec(src || ''); return m && TOK_PJ.includes(m[1]) ? `img/tok/${m[1]}.webp` : src; };
const RAIOS = [{ n: 'Pequeno', r: 1 }, { n: 'Médio', r: 3 }, { n: 'Grande', r: 6 }];

export function criarMapa(ctx) {
  const { sb, S, isGM, esc, toast, picOf, picChar, charById } = ctx;
  const estCls = ctx.estCls || (() => '');
  // gente da vila e Assombros entram sem nome: os jogadores só veem ?? até o mestre revelar
  const nomeTok = (t) => { if ((t.kind !== 'npc' && t.kind !== 'assombro') || t.data?.nomeVisto) return esc(t.nome); return isGM() ? `${esc(t.nome)} <i class="nm-oc">??</i>` : '??'; };
  const uid = () => S.session?.user.id;
  const MP = { cenas: [], ativa: null, ver: null, tokens: [], tool: 'mover', brush: 3, sel: null, zoom: window.innerWidth < 700 ? 1.6 : 1, loaded: false, busy: false, live: {} };
  let bc = null; // canal de broadcast (arrasto ao vivo)
  let viva = null; // cenário vivo desenhado em código
  const vivaId = (c) => (c?.img?.startsWith('viva:') ? c.img.slice(5) : null);
  const horaCena = (c) => (c?.fog?.hora != null && c.fog.hora !== '' ? +c.fog.hora : horaDaNoite(S.noite));
  const syncViva = () => { const c = cena(); if (viva && c) { viva.setHora(horaCena(c)); viva.setVento(c.fog?.vento ?? 0.45); } };
  let el = null; // raiz montada
  let W = 0, H = 0;

  const cena = () => MP.cenas.find((c) => c.id === MP.ver) || null;
  const passoPx = () => (cena() ? W / cena().largura : 10);
  const tokPx = () => Math.max(40, Math.min(72, passoPx() * 1.5));
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
    if (!MP.ver || !MP.cenas.some((c) => c.id === MP.ver) || !isGM()) MP.ver = isGM() ? (MP.ver && MP.cenas.some((c) => c.id === MP.ver) ? MP.ver : MP.ativa || MP.cenas.find((c) => c.img === 'viva:estrada')?.id || MP.cenas.at(-1)?.id || null) : MP.ativa;
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
    if (p.new.id === MP.ver && el) { syncViva(); if (MP.tool === 'mover' || !isGM()) { drawFog(); draw(); paintBar(); } }
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
    else { paintBar(); ctx.onCenas?.(); }
  }

  // ---------- visão ----------
  function view() {
    MP.mesa = false;
    if (!MP.loaded) { load().then(() => ctx.rerender()); return `<p class="muted">Abrindo o mapa…</p>`; }
    const c = cena();
    const gm = isGM();
    if (!c) {
      return `<section class="hero"><p class="lbl">O mapa</p><h1>Nenhuma cena</h1></section>
        ${gm ? `<button class="btn primary block" data-mp="vivas">Criar os cenários vivos da one-shot</button>${formNovaCena(true)}` : `<div class="empty"><p>O mestre ainda não mostrou nenhuma cena.</p><p class="small">Quando ele mostrar, ela aparece aqui sozinha.</p></div>`}`;
    }
    return `<div class="mp" data-mproot>
      <div class="mp-head">
        <div><p class="lbl">${gm && MP.ativa !== c.id ? 'Só você vê esta cena' : 'Cena'}</p><h1 class="mp-title">${esc(c.nome)}</h1></div>
        <div class="mp-rod"><span class="lbl">Rodada</span><b data-mp-rodada>${c.rodada}</b></div>
      </div>
      <div class="mp-bar" data-mpbar>${barHtml()}</div>
      ${stageHtml()}
      <div class="mp-side" data-mpside>${sideHtml()}</div>
      ${gm ? `<details class="mp-more"><summary>Cenas</summary>${listaCenas()}${formNovaCena(false)}</details>` : ''}
    </div>`;
  }

  function stageHtml() {
    const c = cena(); if (!c) return '';
    return `<div class="mp-wrap"><div class="mp-stage ${isGM() && MP.tool !== 'mover' ? 'pintando' : ''}" data-mpstage style="width:${MP.zoom * 100}%">
        ${vivaId(c) ? `<canvas class="mp-bg mp-viva" data-mpviva aria-hidden="true"></canvas>` : c.img ? `<img class="mp-bg" src="${esc(c.img)}" alt="" draggable="false">` : `<div class="mp-bg mp-blank"></div>`}
        <svg class="mp-svg" data-mpsvg></svg>
        <div class="mp-toks" data-mptoks></div>
        <canvas class="mp-fog" data-mpfog></canvas>
        <div class="mp-ring" data-mpring hidden></div>
      </div></div>`;
  }

  function barHtml() {
    const c = cena(); if (!c) return '';
    const zoom = `<div class="seg"><button class="${MP.zoom === 1 ? 'on' : ''}" data-mp="zoom" data-v="1">1×</button><button class="${MP.zoom === 1.6 ? 'on' : ''}" data-mp="zoom" data-v="1.6">1,6×</button><button class="${MP.zoom === 2.4 ? 'on' : ''}" data-mp="zoom" data-v="2.4">2,4×</button></div>`;
    if (!isGM()) {
      const pc = meuPc();
      const mov = pc ? `<span class="mp-mov">Movimento: <b>${Math.max(0, pc.passos - distPassos(pc, pc.x, pc.y)).toFixed(1).replace('.', ',')}</b> de ${String(pc.passos).replace('.', ',')} passos</span>` : '';
      const circ = pc ? `<div class="seg">${RAIOS.map((r) => `<button data-mp="circ" data-v="${r.r}">Círculo ${r.n.toLowerCase()}</button>`).join('')}</div>` : '';
      return `${mov}${zoom}${somBtn()}${circ}${!pc && meusChars().length ? meusChars().map((ch) => `<button class="btn sm" data-mp="entrar" data-v="${ch.id}">Colocar ${esc(ch.data.nome || 'meu personagem')} na cena</button>`).join('') : ''}`;
    }
    const fogOn = c.fog?.on !== false;
    return `<div class="seg"><button class="${MP.tool === 'mover' ? 'on' : ''}" data-mp="tool" data-v="mover">Mover</button><button class="${MP.tool === 'revelar' ? 'on' : ''}" data-mp="tool" data-v="revelar" ${fogOn ? '' : 'disabled'}>Revelar</button><button class="${MP.tool === 'cobrir' ? 'on' : ''}" data-mp="tool" data-v="cobrir" ${fogOn ? '' : 'disabled'}>Cobrir</button></div>
      ${MP.tool !== 'mover' ? `<div class="seg">${[1.5, 3, 6].map((b) => `<button class="${MP.brush === b ? 'on' : ''}" data-mp="brush" data-v="${b}">${b === 1.5 ? 'Pincel fino' : b === 3 ? 'Médio' : 'Largo'}</button>`).join('')}</div>` : ''}
      <button class="btn sm primary" data-mp="rodada">Nova rodada</button>
      ${zoom}${somBtn()}
      ${vivaId(c) ? `<select class="field sm" data-mphora aria-label="Hora da cena">${HORAS.map(([v, n]) => `<option value="${v}" ${String(c.fog?.hora ?? '') === String(v) ? 'selected' : ''}>${n}</option>`).join('')}</select><select class="field sm" data-mpvento aria-label="Vento">${VENTOS.map(([v, n]) => `<option value="${v}" ${(c.fog?.vento ?? 0.45) === v ? 'selected' : ''}>${n}</option>`).join('')}</select>` : ''}
      <button class="btn sm" data-mp="fog">${fogOn ? 'Tirar o escuro' : 'Pôr o escuro'}</button>
      ${MP.mesa ? '' : MP.ativa === c.id ? `<span class="mp-on">Os jogadores estão vendo</span><button class="btn sm" data-mp="esconderCena">Tirar dos jogadores</button>` : `<button class="btn sm" data-mp="mostrar">Mostrar aos jogadores</button>`}`;
  }

  const somBtn = () => (vivaId(cena()) ? `<button class="btn sm ${viva?.somLigado() ? 'primary' : ''}" data-mp="som">${viva?.somLigado() ? 'Som ligado' : 'Ligar o som'}</button>` : '');
  const meusChars = () => S.chars.filter((ch) => ch.owner === uid() && ch.status === 'aprovado');

  function sideHtml() {
    if (MP.mesa) return selHtml() || (isGM() ? `<p class="ms-dica">Clique numa peça no mapa para mexer nela: Sangue, nome, esconder, tirar.</p>` : `<p class="ms-dica">Arraste o seu personagem. Ele anda até o limite de passos da rodada; na próxima rodada, o limite volta.</p>`);
    const c = cena(); if (!c) return '';
    const sel = selHtml();
    if (!isGM()) return sel || `<p class="small muted">Arraste o seu personagem. Ele anda até o limite de passos da rodada; na próxima rodada, o limite volta.</p>`;
    return sel + addHtml();
  }
  function selHtml() {
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
          ${t.kind === 'npc' && formaDe(t.nome) ? `<div class="mp-row"><span>Forma</span><b>${t.img === formaDe(t.nome) ? 'verdadeira' : 'disfarçada'}</b><button class="btn sm ${t.img === formaDe(t.nome) ? '' : 'primary'}" data-mp="forma">${t.img === formaDe(t.nome) ? 'Voltar ao disfarce' : 'Revelar a forma verdadeira'}</button></div>` : ''}
          ${t.kind === 'npc' || t.kind === 'assombro' ? `<div class="mp-row"><span>Nome para os jogadores</span><b>${d.nomeVisto ? esc(t.nome) : '??'}</b><button class="btn sm ${d.nomeVisto ? '' : 'primary'}" data-mp="nome">${d.nomeVisto ? 'Esconder o nome' : 'Revelar o nome'}</button></div>` : ''}
          <div class="mp-row">${t.kind !== 'pc' ? `<button class="btn sm" data-mp="visivel">${t.visivel ? 'Esconder dos jogadores' : 'Revelar aos jogadores'}</button>` : ''}<button class="btn sm ghost" data-mp="apagar">Tirar da cena</button></div></div>`;
      }
    }
    return sel;
  }
  function addHtml() {
    if (!cena()) return '';
    const naCena = new Set(MP.tokens.filter((x) => x.kind === 'pc').map((x) => x.character_id));
    const faltam = S.chars.filter((ch) => ch.status === 'aprovado' && !naCena.has(ch.id));
    return `<div class="mp-add">
        ${faltam.length ? `<button class="btn sm" data-mp="grupo">Colocar o grupo (${faltam.length})</button>` : ''}
        <select class="field sm" data-mpbest><option value="">+ Assombro (entra escondido)</option>${['Cinza', 'Raiz', 'Osso', 'Sopro', 'Lodo', 'Velho'].map((f) => `<optgroup label="${f}">${M.BESTIARIO.filter((b) => (f === 'Velho' ? b.grau === 'Velho' : b.familia === f && b.grau !== 'Velho')).map((b) => `<option value="${b.id}">${esc(b.nome)} · ${b.grau}</option>`).join('')}</optgroup>`).join('')}</select>
        <div class="mp-elenco">${ELENCO.filter(([n]) => !MP.tokens.some((x) => x.kind === 'npc' && semAcento(x.nome) === semAcento(n))).map(([n, k, sem]) => `<button class="btn sm" data-mp="elenco" data-v="${esc(n)}" title="${sem ? 'Ainda sem retrato' : ''}">${sem ? '' : `<img src="img/tok/${k}.webp" alt="">`}${esc(n)}</button>`).join('')}</div>
        <form class="mp-npc" data-mpform="npc"><input class="field sm" name="nome" placeholder="+ Pessoa (nome)" maxlength="40"><button class="btn sm">Pôr</button></form>
        <div class="seg">${RAIOS.map((r) => `<button data-mp="circ" data-v="${r.r}">Círculo ${r.n.toLowerCase()}</button>`).join('')}</div>
      </div>`;
  }

  function listaCenas() {
    const faltam = Object.keys(CENAS_VIVAS).filter((k) => !MP.cenas.some((c) => c.img === 'viva:' + k));
    return `${faltam.length ? `<button class="btn sm primary" data-mp="vivas">Criar os cenários vivos da one-shot (${faltam.length})</button>` : ''}<div class="mp-cenas">${MP.cenas.map((c) => `<div class="mp-cena ${c.id === MP.ver ? 'on' : ''}">
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
    MP.mesa = el.classList.contains('mesa');
    if (!stage || !cena()) return;
    const img = el.querySelector('img.mp-bg');
    viva?.destruir(); viva = null;
    const cvv = el.querySelector('[data-mpviva]');
    if (cvv) { viva = criarCenaViva(cvv, vivaId(cena())); viva.setHora(horaCena(cena()), true); viva.setVento(cena().fog?.vento ?? 0.45); }
    MP.mesa = el.classList.contains('mesa');
    const wrap0 = el.querySelector('.mp-wrap');
    const size = () => {
      if (MP.mesa) { const a = cena().aspecto, w = Math.min(wrap0.clientWidth, wrap0.clientHeight / a) * MP.zoom; stage.style.width = Math.floor(w) + 'px'; }
      W = stage.clientWidth; H = W * cena().aspecto; stage.style.height = H + 'px'; drawFog(); draw();
    };
    if (img && !img.complete) img.addEventListener('load', size, { once: true });
    size();
    const meu = !isGM() && meuPc(), wrap = el.querySelector('.mp-wrap');
    if (meu && wrap.scrollWidth > wrap.clientWidth) { wrap.scrollLeft = meu.x * W - wrap.clientWidth / 2; wrap.scrollTop = meu.y * H - wrap.clientHeight / 2; }
    new ResizeObserver(() => { if (stage.clientWidth !== W || MP.mesa) size(); }).observe(MP.mesa ? wrap0 : stage);
    stage.addEventListener('pointerdown', onDown);
  }
  function refresh() { ctx.rerender(); }
  function paintBar() { const b = el?.querySelector('[data-mpbar]'); if (b) b.innerHTML = barHtml(); const r = el?.querySelector('[data-mp-rodada]'); if (r && cena()) r.textContent = cena().rodada; }
  function paintSide() { const s = el?.querySelector('[data-mpside]'); if (s) s.innerHTML = sideHtml(); const a = el?.querySelector('[data-mpadd]'); if (a) a.innerHTML = addHtml(); ctx.onSel?.(); }

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
      const src = t.img || (ch ? tokDe(picChar(ch)) : '');
      const d = t.data || {};
      const ferido = d.max && d.sangue != null && d.sangue <= d.max / 2;
      return `<div class="mp-tok k-${t.kind} ${ch ? estCls(ch) : ''} ${MP.sel === t.id ? 'sel' : ''} ${t.visivel ? '' : 'oculto'} ${t.owner === uid() ? 'meu' : ''} ${podeMover(t) ? 'mov' : ''} ${ferido ? 'ferido' : ''}" data-tok="${t.id}" style="width:${sz}px;height:${sz}px;left:${t.x * W}px;top:${t.y * H}px">
        ${src ? `<img src="${esc(src)}" alt="" draggable="false">` : `<i>${esc((t.nome || '?')[0])}</i>`}<span class="nm">${nomeTok(t)}</span></div>`;
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
    if (a === 'mostrarId') { await mostrarCena(v); return; }
    if (a === 'som') { viva?.som(); paintBar(); return; }
    if (a === 'elenco') { await porNpc(v); return true; }
    if (a === 'vivas') {
      const faltam = Object.entries(CENAS_VIVAS).filter(([k]) => !MP.cenas.some((x) => x.img === 'viva:' + k));
      const rows = faltam.map(([k, d]) => ({ nome: d.nome, img: 'viva:' + k, aspecto: ASPECTO_VIVO, largura: d.largura, fog: { on: false, revela: [] } }));
      const { data, error } = await sb.from('breu_cenas').insert(rows).select();
      if (error) { toast('Não consegui criar os cenários.'); return; }
      data.forEach((d) => { if (!MP.cenas.some((x) => x.id === d.id)) MP.cenas.push(d); });
      MP.ver = data[0]?.id || MP.ver; await loadTokens(); toast('Cenários criados. Mostre aos jogadores quando quiser.'); refresh(); return;
    }
    if (a === 'tool') { MP.tool = v; paintBar(); el.querySelector('[data-mpstage]').classList.toggle('pintando', v !== 'mover'); return; }
    if (a === 'brush') { MP.brush = +v; paintBar(); return; }
    if (a === 'ver') { MP.ver = v; MP.sel = null; await loadTokens(); refresh(); return; }
    if (a === 'esconderCena') {
      const { error } = await sb.from('breu_state').upsert({ key: 'cena', value: { ativa: null }, updated_at: new Date().toISOString() });
      if (error) { toast('Não consegui tirar a cena.'); return; }
      MP.ativa = null; toast('Os jogadores não veem mais esta cena.'); paintBar(); return;
    }
    if (a === 'mostrar') { await mostrarCena(c.id); return; }
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
    if (a === 'grupo') { await porGrupo(); return; }
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
    else if (a === 'forma') { const alt = formaDe(sel.nome); if (!alt) return; sel.img = sel.img === alt ? fotoNpc(sel.nome) : alt; await sb.from('breu_tokens').update({ img: sel.img }).eq('id', sel.id); enviar('reload', {}); draw(); paintSide(); return; }
    else if (a === 'nome') { d.nomeVisto = !d.nomeVisto; sel.data = d; await sb.from('breu_tokens').update({ data: d }).eq('id', sel.id); enviar('reload', {}); draw(); paintSide(); return; }
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
    if (t.matches('[data-mpbest]') && t.value) { const id = t.value; t.value = ''; await porAssombro(id); return true; }
    if (t.matches('[data-mphora]') || t.matches('[data-mpvento]')) {
      const fog = { ...(c.fog || {}) };
      if (t.matches('[data-mphora]')) fog.hora = t.value === '' ? null : +t.value; else fog.vento = +t.value;
      c.fog = fog; syncViva();
      await sb.from('breu_cenas').update({ fog }).eq('id', c.id);
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
      const { error } = await sb.from('breu_tokens').insert({ cena_id: c.id, kind: 'npc', nome, img: fotoNpc(nome), x: 0.5, y: 0.5, ax: 0.5, ay: 0.5, visivel: true });
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

  // ---------- o que o guia do mestre aperta ----------
  // procura um lugar vazio perto de (cx, cy), longe das outras peças
  function lugarLivre(cx, cy, raio, extra = []) {
    const a = cena()?.aspecto || 0.667, ocup = [...MP.tokens.filter((t) => t.kind !== 'circulo').map((t) => [t.x, t.y]), ...extra];
    let best = { x: cx, y: cy }, bd = -1;
    for (let i = 0; i < 80; i++) {
      const ang = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * raio;
      const x = Math.max(0.06, Math.min(0.94, cx + Math.cos(ang) * r)), y = Math.max(0.08, Math.min(0.92, cy + (Math.sin(ang) * r) / a));
      const d = ocup.length ? Math.min(...ocup.map(([ox, oy]) => Math.hypot(x - ox, (y - oy) * a))) - Math.hypot(x - cx, (y - cy) * a) * 0.15 : 1 - Math.hypot(x - cx, y - cy);
      if (d > bd) { bd = d; best = { x, y }; }
    }
    return best;
  }
  const cenaDe = (key) => MP.cenas.find((c) => c.img === 'viva:' + key) || null;
  async function garantirCena(key) {
    let c = cenaDe(key); if (c) return c;
    const d = CENAS_VIVAS[key]; if (!d) return null;
    const { data, error } = await sb.from('breu_cenas').insert({ nome: d.nome, img: 'viva:' + key, aspecto: ASPECTO_VIVO, largura: d.largura, fog: { on: false, revela: [] } }).select().single();
    if (error) { toast('Não consegui criar o cenário.'); return null; }
    if (!MP.cenas.some((x) => x.id === data.id)) MP.cenas.push(data);
    return data;
  }
  async function verCena(id) { if (MP.ver === id) return; MP.ver = id; MP.sel = null; await loadTokens(); refresh(); }
  async function mostrarCena(id) {
    const { error } = await sb.from('breu_state').upsert({ key: 'cena', value: { ativa: id }, updated_at: new Date().toISOString() });
    if (error) { toast('Não consegui mostrar a cena.'); return false; }
    MP.ativa = id;
    if (MP.ver !== id) await verCena(id); else { paintBar(); ctx.onCenas?.(); }
    toast('Os jogadores agora veem: ' + (MP.cenas.find((c) => c.id === id)?.nome || 'a cena') + '.');
    return true;
  }
  async function esconderCena() {
    await sb.from('breu_state').upsert({ key: 'cena', value: { ativa: null }, updated_at: new Date().toISOString() });
    MP.ativa = null; paintBar(); ctx.onCenas?.();
  }
  async function porGrupo() {
    const c = cena(); if (!c) return;
    const naCena = new Set(MP.tokens.filter((x) => x.kind === 'pc').map((x) => x.character_id));
    const faltam = S.chars.filter((ch) => ch.status === 'aprovado' && !naCena.has(ch.id));
    if (!faltam.length) { toast('O grupo já está na cena.'); return; }
    // o grupo entra junto, perto do centro de baixo
    const usados = [];
    const rows = faltam.map((ch) => { const { x, y } = lugarLivre(0.5, 0.62, 0.12, usados); usados.push([x, y]); return { cena_id: c.id, kind: 'pc', character_id: ch.id, owner: ch.owner, nome: ch.data.nome || 'Sem nome', x, y, ax: x, ay: y, passos: S.mesa?.passos || 6 }; });
    const { error } = await sb.from('breu_tokens').insert(rows);
    if (error) toast('Não consegui colocar o grupo.'); else { await loadTokens(); draw(); paintSide(); toast('O grupo entrou na cena.'); }
  }
  async function porNpc(nome) {
    const c = cena(); if (!c) return;
    const ja = MP.tokens.find((x) => x.kind === 'npc' && semAcento(x.nome) === semAcento(nome));
    if (ja) { MP.sel = ja.id; draw(); paintSide(); toast(nome + ' já está no mapa: selecionei a peça.'); return; }
    const { x, y } = lugarLivre(0.5, 0.42, 0.26);
    const { error } = await sb.from('breu_tokens').insert({ cena_id: c.id, kind: 'npc', nome, img: fotoNpc(nome), x, y, ax: x, ay: y, visivel: true });
    if (error) toast('Não consegui pôr a pessoa.'); else { await loadTokens(); draw(); paintSide(); toast(nome + ' entrou no mapa. Os jogadores veem ??.'); }
  }
  async function porAssombro(id) {
    const c = cena(); if (!c) return;
    const b = M.BESTIARIO.find((x) => x.id === id); if (!b) return;
    const n = MP.tokens.filter((x) => x.data?.best === b.id).length;
    const sel = MP.tokens.find((x) => x.id === MP.sel);
    // sem peça escolhida, entra na borda do mapa, fora da vila
    const ang = Math.random() * Math.PI * 2, x = sel ? Math.min(0.97, sel.x + 0.05) : 0.5 + Math.cos(ang) * 0.44, y = sel ? sel.y : 0.5 + Math.sin(ang) * 0.42;
    const { error } = await sb.from('breu_tokens').insert({ cena_id: c.id, kind: 'assombro', nome: b.nome + (n ? ' ' + (n + 1) : ''), img: `img/ass/${b.id}.webp`, x, y, ax: x, ay: y, passos: 6, visivel: false, data: { best: b.id, sangue: b.sangue, max: b.sangue } });
    if (error) toast('Não consegui pôr o Assombro.'); else { await loadTokens(); draw(); paintSide(); toast(b.nome + ' está no mapa, escondido. Arraste e revele quando aparecer.'); }
  }
  async function revelarAssombro(id) {
    const t = MP.tokens.find((x) => x.kind === 'assombro' && x.data?.best === id && !x.visivel);
    if (!t) { toast('Não há ' + (M.BESTIARIO.find((b) => b.id === id)?.nome || 'Assombro') + ' escondido nesta cena. Ponha um primeiro.'); return; }
    t.visivel = true; await sb.from('breu_tokens').update({ visivel: true }).eq('id', t.id);
    enviar('reload', {}); MP.sel = t.id; draw(); paintSide(); toast(t.nome + ' apareceu para os jogadores.');
  }
  async function trocarForma(nome) {
    const t = MP.tokens.find((x) => x.kind === 'npc' && semAcento(x.nome) === semAcento(nome));
    const alt = formaDe(nome);
    if (!t || !alt) { toast(t ? 'A imagem da forma verdadeira ainda não chegou.' : nome + ' não está nesta cena.'); return; }
    t.img = t.img === alt ? fotoNpc(t.nome) : alt;
    await sb.from('breu_tokens').update({ img: t.img }).eq('id', t.id); enviar('reload', {}); MP.sel = t.id; draw(); paintSide();
  }
  const api = {
    setMesa: (v) => { MP.mesa = v; }, cenas: () => MP.cenas, ativa: () => MP.ativa, ver: () => MP.ver, cena, cenaDe, garantirCena, verCena, mostrarCena, esconderCena,
    porGrupo, porNpc, porAssombro, revelarAssombro, trocarForma, formaDe, tokens: () => MP.tokens,
    temNpc: (nome) => MP.tokens.some((x) => x.kind === 'npc' && semAcento(x.nome) === semAcento(nome)),
    grupoFalta: () => { const na = new Set(MP.tokens.filter((x) => x.kind === 'pc').map((x) => x.character_id)); return S.chars.filter((ch) => ch.status === 'aprovado' && !na.has(ch.id)).length; },
    stageHtml, barHtml, sideHtml, addHtml, listaCenas, formNovaCena, paintBar, paintSide, loaded: () => MP.loaded,
  };

  async function delCena(id) {
    if (!confirm('Apagar esta cena e tudo o que está nela?')) return;
    const { error } = await sb.from('breu_cenas').delete().eq('id', id);
    if (error) { toast('Não consegui apagar.'); return; }
    MP.cenas = MP.cenas.filter((c) => c.id !== id);
    if (MP.ver === id) { MP.ver = MP.cenas.at(-1)?.id || null; await loadTokens(); }
    refresh();
  }

  return {
    view, mount, redraw: () => { draw(); syncViva(); }, onCena, onToken, onAtiva, onChange, onSubmit, load, api,
    unmount() { el = null; viva?.destruir(); viva = null; },
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
