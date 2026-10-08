// Notas da campanha: anotar rápido, etiquetas, privadas ou da mesa, e rabiscos com o dedo.

export const ETIQUETAS = {
  geral: { nome: 'Geral', cor: '#2a2232', tinta: '#d9cfdc' },
  npc: { nome: 'NPC', cor: '#3d2a20', tinta: '#f0b98a' },
  lugar: { nome: 'Lugar', cor: '#2b3550', tinta: '#a9b8ff' },
  pista: { nome: 'Pista', cor: '#3a2d12', tinta: '#f0d38a' },
  item: { nome: 'Item', cor: '#22302a', tinta: '#9fd8b8' },
  divida: { nome: 'Dívida', cor: '#3a2228', tinta: '#f3b0a8' },
  missao: { nome: 'Missão', cor: '#2a2240', tinta: '#c3aaff' },
};

export function installNotas(ctx) {
  const { S, ui, sb, esc, toast, render, renderModal, actions, forms } = ctx;
  ui.notas = ui.notas || { filtro: 'tudo', busca: '', tag: 'geral', shared: false, draft: '' };
  const N = ui.notas;
  const me = () => S.session?.user?.id;
  const nomeDe = (uid) => (uid === me() ? 'você' : S.members.find((m) => m.user_id === uid)?.display_name || 'alguém');
  const quando = (iso) => {
    const d = new Date(iso), hoje = new Date();
    const mesmoDia = d.toDateString() === hoje.toDateString();
    return mesmoDia ? 'hoje, ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };
  const pill = (tag) => { const e = ETIQUETAS[tag] || ETIQUETAS.geral; return `<span class="chip" style="background:${e.cor};color:${e.tinta}">${e.nome.toUpperCase()}</span>`; };

  function filtradas() {
    const q = N.busca.trim().toLowerCase();
    return S.notes.filter((n) => {
      if (N.filtro === 'minhas' && n.author !== me()) return false;
      if (N.filtro === 'mesa' && !n.shared) return false;
      if (ETIQUETAS[N.filtro] && n.tag !== N.filtro) return false;
      if (q && !n.body.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => (Number(!!b.pinned) - Number(!!a.pinned)) || (new Date(b.created_at) - new Date(a.created_at)));
  }

  function card(n) {
    const mine = n.author === me();
    return `<article class="card note-card" ${mine ? `data-act="noteEdit" data-id="${n.id}" role="button" tabindex="0"` : ''}>
      <div class="row" style="justify-content:space-between;gap:8px">
        <div class="row" style="gap:6px">${pill(n.tag)}${n.pinned ? '<span class="chip" style="background:#3a2d12;color:#f0d38a">FIXADA</span>' : ''}</div>
        <span class="small muted" style="font-size:12px">${n.shared ? 'mesa · ' : 'privada · '}${esc(nomeDe(n.author))} · ${quando(n.created_at)}</span>
      </div>
      ${n.body ? `<div class="note-body">${esc(n.body)}</div>` : ''}
      ${n.sketch ? `<img class="note-sketch" src="${n.sketch}" alt="Rabisco">` : ''}
    </article>`;
  }

  function viewNotas() {
    const list = filtradas();
    const tags = Object.entries(ETIQUETAS).map(([k, e]) => `<button class="chip-btn${N.tag === k ? ' on' : ''}" data-act="noteTag" data-t="${k}" aria-pressed="${N.tag === k}">${e.nome}</button>`).join('');
    const filtros = [['tudo', 'Tudo'], ['minhas', 'Minhas'], ['mesa', 'Da mesa'], ...Object.entries(ETIQUETAS).filter(([k]) => k !== 'geral').map(([k, e]) => [k, e.nome])]
      .map(([k, l]) => `<button class="chip-btn${N.filtro === k ? ' on' : ''}" data-act="noteFilter" data-f="${k}" aria-pressed="${N.filtro === k}">${l}</button>`).join('');
    return `<header class="topbar"><div class="brand">POR UM FIO</div></header>
      <div class="page">
        <h1 class="disp" style="margin:0 2px;font-size:26px">Notas</h1>
        <form class="card form" data-form="noteAdd" style="gap:10px">
          <label class="lbl" for="nota-rapida">Anotar rápido</label>
          <textarea id="nota-rapida" class="field" rows="2" style="min-height:70px" placeholder="O que acabou de acontecer?" data-in="noteDraft" maxlength="5000">${esc(N.draft)}</textarea>
          <div class="row" style="flex-wrap:wrap;gap:6px">${tags}</div>
          <label class="row small" style="gap:10px"><input type="checkbox" class="chk" data-act="noteShared" ${N.shared ? 'checked' : ''}> A mesa toda pode ver</label>
          <div class="row" style="gap:8px">
            <button type="button" class="ghost" style="flex:1;height:46px" data-act="noteSketch">Rabiscar</button>
            <button type="submit" class="roll" style="flex:1;height:46px">Salvar nota</button>
          </div>
        </form>
        <div class="row chips-scroll">${filtros}</div>
        <label class="sr" for="nota-busca">Buscar nas notas</label>
        <input id="nota-busca" class="field" type="search" placeholder="Buscar…" value="${esc(N.busca)}" data-in="noteSearch">
        ${list.length ? list.map(card).join('') : `<p class="muted small" style="margin:6px 2px">${S.notes.length ? 'Nenhuma nota com esse filtro.' : 'Nenhuma nota ainda. A primeira fica aqui em cima.'}</p>`}
      </div>`;
  }

  // ---------- rabisco ----------
  const CORES = ['#f1e8da', '#e5c06a', '#e5584b', '#7f8cff', '#7fd1a4'];
  let pad = null;
  function mountSketch() {
    const cv = document.getElementById('sketch');
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    const g = cv.getContext('2d'); g.scale(dpr, dpr);
    g.fillStyle = '#15111a'; g.fillRect(0, 0, w, h);
    if (pad?.img) { const im = new Image(); im.onload = () => g.drawImage(im, 0, 0, w, h); im.src = pad.img; }
    g.lineCap = 'round'; g.lineJoin = 'round';
    let last = null;
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.onpointerdown = (e) => { cv.setPointerCapture(e.pointerId); last = pos(e); pad.dirty = true; };
    cv.onpointermove = (e) => {
      if (!last) return;
      const p = pos(e);
      g.strokeStyle = pad.borracha ? '#15111a' : pad.cor; g.lineWidth = pad.borracha ? 18 : pad.grossura;
      g.beginPath(); g.moveTo(last[0], last[1]); g.lineTo(p[0], p[1]); g.stroke(); last = p;
    };
    cv.onpointerup = cv.onpointercancel = () => { last = null; };
  }
  function sketchBody() {
    return `<h2>Rabisco</h2>
      <canvas id="sketch" class="sketch-pad" aria-label="Área para desenhar com o dedo"></canvas>
      <div class="row" style="gap:8px;flex-wrap:wrap">
        ${CORES.map((c) => `<button class="swatch${!pad.borracha && pad.cor === c ? ' on' : ''}" style="background:${c}" data-act="padColor" data-c="${c}" aria-label="Cor"></button>`).join('')}
        <button class="ghost" data-act="padThick">${pad.grossura > 4 ? 'Traço fino' : 'Traço grosso'}</button>
        <button class="${pad.borracha ? 'use' : 'ghost'}" data-act="padEraser">Borracha</button>
        <button class="ghost" data-act="padClear">Limpar</button>
      </div>
      <button class="primary" data-act="padSave">Guardar rabisco</button>
      <button class="link" data-act="closeModal">Cancelar</button>`;
  }
  function snapshot() { const cv = document.getElementById('sketch'); if (cv && pad) pad.img = cv.toDataURL('image/jpeg', 0.75); }

  // ---------- ações ----------
  Object.assign(actions, {
    noteTag(el) { N.tag = el.dataset.t; render(); },
    noteFilter(el) { N.filtro = el.dataset.f; render(); },
    noteShared(el) { N.shared = el.checked; },
    noteSketch() { pad = { cor: CORES[1], grossura: 3, borracha: false, img: null, dirty: false, alvo: 'nova' }; ui.modal = { type: 'sketch' }; renderModal(); },
    padColor(el) { snapshot(); pad.cor = el.dataset.c; pad.borracha = false; renderModal(); },
    padThick() { snapshot(); pad.grossura = pad.grossura > 4 ? 3 : 7; renderModal(); },
    padEraser() { snapshot(); pad.borracha = !pad.borracha; renderModal(); },
    padClear() { pad.img = null; pad.dirty = false; renderModal(); },
    async padSave() {
      snapshot();
      if (!pad.dirty && !pad.img) return toast('Desenhe alguma coisa primeiro.');
      const sketch = pad.img;
      if (pad.alvo === 'nova') {
        ui.modal = null; renderModal();
        await salvarNova(sketch);
      } else {
        const n = S.notes.find((x) => x.id === pad.alvo);
        ui.modal = { type: 'noteEdit', id: n.id }; renderModal();
        await atualizar(n, { sketch });
      }
    },
    noteEdit(el) { ui.modal = { type: 'noteEdit', id: el.dataset.id }; renderModal(); },
    async notePin() { const n = S.notes.find((x) => x.id === ui.modal.id); await atualizar(n, { pinned: !n.pinned }); renderModal(); },
    async noteShare() { const n = S.notes.find((x) => x.id === ui.modal.id); await atualizar(n, { shared: !n.shared }); renderModal(); },
    noteDraw() { const n = S.notes.find((x) => x.id === ui.modal.id); pad = { cor: CORES[1], grossura: 3, borracha: false, img: n.sketch, dirty: false, alvo: n.id }; ui.modal = { type: 'sketch' }; renderModal(); },
    async noteDelete() {
      const n = S.notes.find((x) => x.id === ui.modal.id);
      if (!confirm('Apagar esta nota?')) return;
      ui.modal = null; renderModal();
      S.notes = S.notes.filter((x) => x.id !== n.id); render();
      const { error } = await sb.from('notes').delete().eq('id', n.id);
      if (error) toast('Não consegui apagar.');
    },
  });
  // quando o modal de rabisco abre, liga o desenho
  const mo = new MutationObserver(() => { if (document.getElementById('sketch') && !document.getElementById('sketch').dataset.on) { document.getElementById('sketch').dataset.on = '1'; mountSketch(); } });
  mo.observe(document.getElementById('modal-root'), { childList: true, subtree: true });

  document.addEventListener('input', (ev) => {
    if (ev.target.dataset.in === 'noteDraft') N.draft = ev.target.value;
    if (ev.target.dataset.in === 'noteSearch') { N.busca = ev.target.value; clearTimeout(N.t); N.t = setTimeout(() => { const pos = ev.target.selectionStart; render(); const el = document.getElementById('nota-busca'); if (el) { el.focus(); el.setSelectionRange(pos, pos); } }, 250); }
  });

  async function salvarNova(sketch = null) {
    const body = N.draft.trim();
    if (!body && !sketch) return toast('Escreva alguma coisa.');
    const row = { body, tag: N.tag, shared: N.shared, sketch };
    const { data, error } = await sb.from('notes').insert(row).select().single();
    if (error) return toast('Não consegui salvar a nota.');
    if (!S.notes.find((x) => x.id === data.id)) S.notes.unshift(data);
    N.draft = ''; render(); toast('Nota salva.');
  }
  async function atualizar(n, changes) {
    Object.assign(n, changes, { updated_at: new Date().toISOString() }); render();
    const { error } = await sb.from('notes').update({ ...changes, updated_at: n.updated_at }).eq('id', n.id);
    if (error) toast('Não consegui salvar.');
  }

  Object.assign(forms, {
    noteAdd() { salvarNova(); },
    async noteSave(f) {
      const n = S.notes.find((x) => x.id === ui.modal.id);
      ui.modal = null; renderModal();
      await atualizar(n, { body: f.body.value.trim(), tag: f.tag.value });
      toast('Nota salva.');
    },
  });

  function modalBody(m) {
    if (m.type === 'sketch') return sketchBody();
    if (m.type === 'noteEdit') {
      const n = S.notes.find((x) => x.id === m.id);
      if (!n) return '<p>Nota não encontrada.</p><button class="link" data-act="closeModal">Fechar</button>';
      return `<h2>Editar nota</h2>
        <form class="form" data-form="noteSave">
          <div><label class="flab" for="ne-body">Texto</label><textarea class="field" id="ne-body" name="body" style="min-height:160px" maxlength="5000">${esc(n.body)}</textarea></div>
          <div><label class="flab" for="ne-tag">Etiqueta</label><select class="field" id="ne-tag" name="tag">${Object.entries(ETIQUETAS).map(([k, e]) => `<option value="${k}" ${n.tag === k ? 'selected' : ''}>${e.nome}</option>`).join('')}</select></div>
          ${n.sketch ? `<img class="note-sketch" src="${n.sketch}" alt="Rabisco">` : ''}
          <button class="primary" type="submit">Salvar</button>
        </form>
        <div class="row" style="gap:8px;flex-wrap:wrap">
          <button class="ghost" data-act="noteShare">${n.shared ? 'Deixar privada' : 'Mostrar para a mesa'}</button>
          <button class="ghost" data-act="notePin">${n.pinned ? 'Desafixar' : 'Fixar no topo'}</button>
          <button class="ghost" data-act="noteDraw">${n.sketch ? 'Editar rabisco' : 'Rabiscar'}</button>
          <button class="ghost danger" data-act="noteDelete">Apagar</button>
        </div>
        <button class="link" data-act="closeModal">Fechar</button>`;
    }
    return null;
  }

  function onRealtime(p) {
    if (p.eventType === 'DELETE') { S.notes = S.notes.filter((x) => x.id !== p.old.id); return; }
    const row = p.new, i = S.notes.findIndex((x) => x.id === row.id);
    if (i >= 0) S.notes[i] = row; else S.notes.unshift(row);
  }

  return { viewNotas, modalBody, onRealtime };
}
