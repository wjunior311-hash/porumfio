// Mesa virtual: mapa com grade, peças dos personagens e monstros, arrastar e soltar.

export const MONSTROS = [
  ['goblin', 'Goblin'], ['hobgoblin', 'Hobgoblin'], ['kobold', 'Kobold'], ['bandido', 'Bandido'], ['trog', 'Trog'],
  ['esqueleto', 'Esqueleto'], ['zumbi', 'Zumbi'], ['afogado', 'Afogado'], ['capitao-afogado', 'Capitão afogado'],
  ['carnical', 'Carniçal'], ['aparicao', 'Aparição'],
];
const nomeMonstro = (id) => (MONSTROS.find((m) => m[0] === id) || [id, id])[1];

export function installMesa(ctx) {
  const { S, ui, sb, esc, num, toast, render, renderModal, actions, forms, CONDICOES } = ctx;
  ui.mesa = ui.mesa || { zoom: window.innerWidth < 700 ? 2.5 : 1, grade: false, img: {} };

  const activeScene = () => S.scenes.find((s) => s.active) || S.scenes[0];
  const tokensOf = (sid) => S.tokens.filter((t) => t.scene_id === sid);
  const isGM = () => S.me && (S.me.role === 'gm' || S.me.role === 'admin');
  const canMove = (t) => isGM() || (t.kind === 'pc' && S.me?.character_id === t.character_id);
  const imgURL = (s) => (/^https?:/.test(s.image) ? s.image : s.image);

  function imgSize(s) {
    const src = imgURL(s);
    if (ui.mesa.img[src]) return ui.mesa.img[src];
    if (!ui.mesa.img['loading:' + src]) {
      ui.mesa.img['loading:' + src] = true;
      const im = new Image();
      im.onload = () => { ui.mesa.img[src] = { w: im.naturalWidth, h: im.naturalHeight }; render(); };
      im.onerror = () => toast('Não consegui abrir a imagem do mapa.');
      im.src = src;
    }
    return null;
  }

  function spriteOf(t) {
    if (t.kind === 'pc') {
      const c = S.chars[t.character_id];
      const d = c?.data || {};
      const hp = num(d.hp), max = Math.max(1, num(d.maxHp, 1));
      if (hp <= 0) return { url: `assets/pixel/${t.character_id}-caido.png`, still: true };
      if (hp < max / 2) return { url: `assets/pixel/${t.character_id}-ferido.png`, still: true };
      return { url: `assets/pixel/${t.character_id}.png`, still: false };
    }
    if (t.dead) return { url: `assets/monstros/${t.sprite}-morto.png`, still: true };
    return { url: `assets/monstros/${t.sprite}.png`, still: false };
  }

  function tokenHTML(t, s, sz, tv) {
    const sp = spriteOf(t);
    const left = (num(s.off_x) + num(t.x) * num(s.grid)) / sz.w * 100;
    const top = (num(s.off_y) + num(t.y) * num(s.grid)) / sz.h * 100;
    const w = num(s.grid) * (t.size || 1) / sz.w * 100;
    const c = t.kind === 'pc' ? S.chars[t.character_id] : null;
    const conds = (c ? c.data.conditions : t.conditions) || [];
    let bar = '';
    if (t.kind === 'pc' && c) {
      const p = Math.max(0, Math.min(100, num(c.data.hp) / Math.max(1, num(c.data.maxHp, 1)) * 100));
      bar = `<div class="tk-bar"><i style="width:${p}%"></i></div>`;
    } else if (isGM() && !tv && !t.dead && t.max_hp) {
      const p = Math.max(0, Math.min(100, num(t.hp) / Math.max(1, num(t.max_hp)) * 100));
      bar = `<div class="tk-bar"><i style="width:${p}%"></i></div>`;
    }
    const mine = t.kind === 'pc' && S.me?.character_id === t.character_id;
    return `<div class="tk${canMove(t) ? ' movable' : ''}${t.dead ? ' dead' : ''}${t.hidden ? ' hidden-tk' : ''}${mine ? ' mine' : ''}" data-tk="${t.id}"
        style="left:${left}%;top:${top}%;width:${w}%" ${isGM() ? 'tabindex="0" role="button"' : ''} aria-label="${esc(t.label)}">
      <div class="tk-sprite${sp.still ? ' still' : ''}" style="background-image:url('${sp.url}')"></div>
      ${conds.length ? `<div class="tk-cond">${esc(conds[0])}${conds.length > 1 ? ' +' + (conds.length - 1) : ''}</div>` : ''}
      ${t.dead && (tv || !isGM()) ? '' : `<div class="tk-name">${esc(t.label)}</div>`}${bar}
    </div>`;
  }

  function gridOverlay(s, sz) {
    const g = num(s.grid) / sz.w * 100, gy = num(s.grid) / sz.h * 100;
    const ox = num(s.off_x) / sz.w * 100, oy = num(s.off_y) / sz.h * 100;
    return `<div class="grid-ov" style="background-size:${g}% ${gy}%;background-position:${ox}% ${oy}%"></div>`;
  }

  function viewMesa(tv) {
    const s = activeScene();
    if (!s) return `<div class="page"><h1 class="disp">Mesa</h1><p class="muted">Nenhum mapa ainda.${isGM() ? ' Crie um mapa nas ferramentas abaixo.' : ''}</p>${isGM() ? gmBar(null) : ''}</div>`;
    const sz = imgSize(s);
    const toks = tokensOf(s.id).filter((t) => !(tv && t.hidden)).sort((a, b) => (a.dead === b.dead ? 0 : a.dead ? -1 : 1));
    const board = `<div class="board-wrap${tv ? ' tv' : ''}" style="${sz ? `--ratio:${sz.w / sz.h}` : ''}"><div class="board" id="board" style="${tv ? '' : `width:${ui.mesa.zoom * 100}%`}">
        <img src="${esc(imgURL(s))}" alt="Mapa: ${esc(s.name)}" draggable="false">
        ${sz && ui.mesa.grade ? gridOverlay(s, sz) : ''}
        ${sz ? toks.map((t) => tokenHTML(t, s, sz, tv)).join('') : ''}
      </div></div>`;
    if (tv) {
      return `<section class="tv-wrap">${board}
        <div class="tv-title"><span class="disp">${esc(s.name)}</span></div>
        <a class="tv-exit" href="#/mesa" aria-label="Sair da tela cheia">×</a></section>`;
    }
    return `<header class="topbar"><div><div class="brand">MESA</div><div class="disp" style="font-size:20px;font-weight:700">${esc(s.name)}</div></div>
        <div class="row" style="gap:6px"><button class="sm" data-act="zoom" data-d="-1" aria-label="Diminuir mapa">−</button><button class="sm" data-act="zoom" data-d="1" aria-label="Aumentar mapa">+</button></div></header>
      <div class="page" style="padding-left:0;padding-right:0">
        ${board}
        <div style="padding:0 14px;display:flex;flex-direction:column;gap:10px">
          <p class="small muted" style="margin:0">${isGM() ? 'Arraste qualquer peça. Toque numa peça para dano, condição ou morte.' : S.me?.character_id ? 'Arraste a sua peça para andar. Cada quadrado tem 1,5 m.' : 'Cada quadrado tem 1,5 m.'}</p>
          ${isGM() ? gmBar(s) : ''}
        </div>
      </div>`;
  }

  function gmBar(s) {
    const opts = S.scenes.map((x) => `<option value="${x.id}" ${s && x.id === s.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('');
    const monsters = s ? tokensOf(s.id).filter((t) => t.kind === 'monster') : [];
    return `<div class="card" style="display:flex;flex-direction:column;gap:10px">
        <span class="lbl">Ferramentas do mestre</span>
        ${S.scenes.length ? `<div><label class="flab" for="cena">Mapa na mesa</label><select class="field" id="cena" data-change="scene">${opts}</select></div>` : ''}
        <div class="row" style="flex-wrap:wrap;gap:8px">
          ${s ? `<a class="ghost" style="display:inline-flex;align-items:center;text-decoration:none" href="#/mesa/tv" target="_blank" rel="noopener">Abrir na TV</a>
          <button class="ghost" data-act="addMonster">+ Monstro</button>
          <button class="ghost" data-act="placeParty">Pôr o grupo no mapa</button>
          <button class="ghost" data-act="toggleGrid">${ui.mesa.grade ? 'Esconder grade' : 'Ver grade'}</button>` : ''}
          <button class="ghost" data-act="newScene">Novo mapa</button>
        </div>
        ${s && ui.mesa.grade ? `<div class="grid3" style="grid-template-columns:repeat(3,minmax(0,1fr))">
          ${[['grid', 'Tamanho do quadrado', 0.5], ['off_x', 'Mover grade →', 1], ['off_y', 'Mover grade ↓', 1]].map(([k, l, st]) => `<div class="card" style="padding:8px;text-align:center">
            <div class="small muted" style="font-size:12px">${l}</div>
            <div class="row" style="justify-content:center;gap:6px;margin-top:4px"><button class="sm" data-act="gridAdj" data-k="${k}" data-d="${-st}" aria-label="${l} menos">−</button>
            <span class="disp" style="min-width:40px">${num(s[k])}</span><button class="sm" data-act="gridAdj" data-k="${k}" data-d="${st}" aria-label="${l} mais">+</button></div></div>`).join('')}
        </div><p class="small muted" style="margin:0">Ajuste até os quadrados baterem com os do desenho.</p>` : ''}
      </div>
      ${monsters.length ? `<div class="card" style="display:flex;flex-direction:column;gap:6px"><span class="lbl">Monstros nesta cena · ${monsters.length}</span>
        ${monsters.map((t) => `<button class="item" style="appearance:none;color:var(--txt);text-align:left;width:100%" data-act="tokenMenu" data-id="${t.id}">
          <div class="petbox" style="width:40px;height:40px"><div class="${t.dead ? '' : 'pet'}" style="width:38px;height:38px;image-rendering:pixelated;background-size:${t.dead ? '100% 100%' : '400% 100%'};background-image:url('${spriteOf(t).url}')"></div></div>
          <div style="flex:1;min-width:0"><div class="name">${esc(t.label)}${t.hidden ? ' <span class="small muted">(escondido)</span>' : ''}</div>
          <div class="small muted" style="font-size:12px">${t.dead ? 'morto' : `PV ${num(t.hp)}/${num(t.max_hp)} · Def ${num(t.def)}`}${(t.conditions || []).length ? ' · ' + esc(t.conditions.join(', ')) : ''}</div></div></button>`).join('')}
      </div>` : ''}`;
  }

  // ---------- arrastar ----------
  let drag = null, gridTimer = null;
  document.addEventListener('pointerdown', (ev) => {
    const el = ev.target.closest('.tk');
    if (!el || !el.closest('#board')) return;
    const t = S.tokens.find((x) => x.id === el.dataset.tk);
    if (!t) return;
    const board = document.getElementById('board');
    drag = { el, t, board, rect: board.getBoundingClientRect(), sx: ev.clientX, sy: ev.clientY, moved: false, ox: el.offsetLeft, oy: el.offsetTop };
    if (canMove(t)) { el.setPointerCapture(ev.pointerId); ev.preventDefault(); }
  });
  document.addEventListener('pointermove', (ev) => {
    if (!drag || !canMove(drag.t)) return;
    const dx = ev.clientX - drag.sx, dy = ev.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    drag.moved = true;
    drag.el.classList.add('dragging');
    drag.el.style.left = (drag.ox + dx) + 'px';
    drag.el.style.top = (drag.oy + dy) + 'px';
  });
  document.addEventListener('pointerup', async (ev) => {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.moved) { if (isGM()) actions.tokenMenu({ dataset: { id: d.t.id } }); return; }
    const s = activeScene(), sz = imgSize(s);
    const scale = d.rect.width / sz.w;
    const px = (d.el.offsetLeft) / scale, py = (d.el.offsetTop) / scale;
    const nx = Math.round((px - num(s.off_x)) / num(s.grid)), ny = Math.round((py - num(s.off_y)) / num(s.grid));
    const old = { x: d.t.x, y: d.t.y };
    d.t.x = nx; d.t.y = ny; render();
    const { error } = await sb.rpc('move_token', { tid: d.t.id, nx, ny });
    if (error) { d.t.x = old.x; d.t.y = old.y; render(); toast('Não consegui mover essa peça.'); }
  });

  // ---------- ações do mestre ----------
  async function updToken(t, changes) {
    Object.assign(t, changes); render(); renderModal();
    const { error } = await sb.from('tokens').update(changes).eq('id', t.id);
    if (error) toast('Não consegui salvar.');
  }
  function freeSpot(s, taken) {
    const sz = imgSize(s);
    const cols = sz ? Math.floor((sz.w - num(s.off_x)) / num(s.grid)) : 20, rows = sz ? Math.floor((sz.h - num(s.off_y)) / num(s.grid)) : 12;
    const cx = Math.floor(cols / 2), cy = Math.floor(rows / 2);
    for (let r = 0; r < Math.max(cols, rows); r++) {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const x = cx + dx, y = cy + dy, k = x + ',' + y;
        if (x < 0 || y < 0 || x >= cols || y >= rows || taken.has(k)) continue;
        taken.add(k); return { x, y };
      }
    }
    return { x: cx, y: cy };
  }

  Object.assign(actions, {
    zoom(el) { ui.mesa.zoom = Math.max(1, Math.min(4, ui.mesa.zoom + num(el.dataset.d) * 0.5)); render(); },
    toggleGrid() { ui.mesa.grade = !ui.mesa.grade; render(); },
    async gridAdj(el) {
      const s = activeScene(), k = el.dataset.k;
      const v = Math.max(k === 'grid' ? 10 : -500, Math.round((num(s[k]) + num(el.dataset.d)) * 10) / 10);
      s[k] = v; render();
      clearTimeout(gridTimer); gridTimer = setTimeout(async () => {
        const { error } = await sb.from('scenes').update({ [k]: v }).eq('id', s.id);
        if (error) toast('Não consegui salvar a grade.');
      }, 400);
    },
    async placeParty() {
      const s = activeScene();
      const have = new Set(tokensOf(s.id).filter((t) => t.kind === 'pc').map((t) => t.character_id));
      const taken = new Set(tokensOf(s.id).map((t) => t.x + ',' + t.y));
      const rows = S.order.filter((id) => !have.has(id)).map((id) => ({ scene_id: s.id, kind: 'pc', character_id: id, label: S.chars[id].name, ...freeSpot(s, taken) }));
      if (!rows.length) return toast('O grupo inteiro já está neste mapa.');
      const { data, error } = await sb.from('tokens').insert(rows).select();
      if (error) return toast('Não consegui colocar o grupo.');
      data.forEach((t) => { if (!S.tokens.find((x) => x.id === t.id)) S.tokens.push(t); }); render();
    },
    addMonster(el) {
      const m = { type: 'addMonster', kind: lastPick('kind') || 'goblin', v: 'a', qtd: 1, bid: null };
      const bid = el && (el.bid || el.dataset?.bid);
      if (bid) presetFrom(m, bid);
      ui.modal = m; renderModal();
    },
    pickMonster(el) { ui.modal.kind = el.dataset.k; renderModal(); },
    pickVariant(el) { ui.modal.v = el.dataset.v; renderModal(); },
    qtd(el) { ui.modal.qtd = Math.max(1, Math.min(10, ui.modal.qtd + num(el.dataset.d))); renderModal(); },
    tokenMenu(el) { ui.modal = { type: 'token', id: el.dataset.id }; renderModal(); },
    tkHp(el) { const t = S.tokens.find((x) => x.id === ui.modal.id); const hp = Math.max(0, Math.min(num(t.max_hp), num(t.hp) + num(el.dataset.d))); updToken(t, { hp, dead: hp <= 0 ? true : t.dead }); },
    tkDead() { const t = S.tokens.find((x) => x.id === ui.modal.id); updToken(t, { dead: !t.dead }); },
    tkHide() { const t = S.tokens.find((x) => x.id === ui.modal.id); updToken(t, { hidden: !t.hidden }); },
    tkCond(el) {
      const t = S.tokens.find((x) => x.id === ui.modal.id), v = el.dataset.v, cs = t.conditions || [];
      updToken(t, { conditions: cs.includes(v) ? cs.filter((x) => x !== v) : [...cs, v] });
    },
    async tkRemove() {
      const t = S.tokens.find((x) => x.id === ui.modal.id);
      if (!confirm(`Tirar ${t.label} do mapa?`)) return;
      ui.modal = null; renderModal();
      S.tokens = S.tokens.filter((x) => x.id !== t.id); render();
      const { error } = await sb.from('tokens').delete().eq('id', t.id);
      if (error) toast('Não consegui tirar a peça.');
    },
    tkOpenSheet() { const t = S.tokens.find((x) => x.id === ui.modal.id); ui.modal = null; renderModal(); location.hash = '#/ficha/' + t.character_id; },
    newScene() { ui.modal = { type: 'newScene' }; renderModal(); },
  });

  function presetFrom(m, bid) {
    const b = (S.bestiary || []).find((x) => x.id === bid);
    if (!b) { m.bid = null; m.nome = m.pv = m.def = undefined; return; }
    m.bid = b.id; m.nome = b.name; m.pv = b.pv; m.def = b.def;
    if (b.sprite) { const i = b.sprite.lastIndexOf('-'); m.kind = b.sprite.slice(0, i); m.v = b.sprite.slice(i + 1); }
  }
  document.addEventListener('change', (ev) => {
    if (ev.target.dataset.change === 'bestPick' && ui.modal?.type === 'addMonster') { presetFrom(ui.modal, ev.target.value); renderModal(); }
  });
  function lastPick(k) { try { return localStorage.getItem('pf-m-' + k); } catch { return null; } }
  function savePick(k, v) { try { localStorage.setItem('pf-m-' + k, v); } catch {} }

  Object.assign(forms, {
    async addMonster(f) {
      const s = activeScene(), m = ui.modal;
      const base = f.nome.value.trim() || nomeMonstro(m.kind);
      const hp = Math.max(1, num(f.pv.value, 10)), def = num(f.def.value, 10);
      savePick('kind', m.kind); savePick('pv-' + m.kind, hp); savePick('def-' + m.kind, def);
      const taken = new Set(tokensOf(s.id).map((t) => t.x + ',' + t.y));
      const rows = Array.from({ length: m.qtd }, (_, i) => ({
        scene_id: s.id, kind: 'monster', sprite: `${m.kind}-${m.v}`, label: m.qtd > 1 ? `${base} ${i + 1}` : base,
        hp, max_hp: hp, def, hidden: f.oculto.checked, bestiary_id: m.bid || null, ...freeSpot(s, taken),
      }));
      ui.modal = null; renderModal();
      const { data, error } = await sb.from('tokens').insert(rows).select();
      if (error) return toast('Não consegui colocar os monstros.');
      data.forEach((t) => { if (!S.tokens.find((x) => x.id === t.id)) S.tokens.push(t); }); render();
      toast(rows.length > 1 ? `${rows.length} monstros no mapa.` : 'Monstro no mapa.');
    },
    async tkHpSet(f, sub) {
      const t = S.tokens.find((x) => x.id === ui.modal.id), n = Math.abs(num(f.n.value)), mode = sub?.value || 'minus';
      let hp = num(t.hp); hp = mode === 'minus' ? hp - n : mode === 'plus' ? hp + n : n;
      hp = Math.max(0, Math.min(num(t.max_hp), hp));
      updToken(t, { hp, dead: hp <= 0 ? true : false });
    },
    async newScene(f) {
      const name = f.nome.value.trim() || 'Mapa novo';
      const file = f.arquivo.files[0];
      const btn = f.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Enviando…';
      let image = f.pronto.value;
      if (file) {
        if (file.size > 15 * 1024 * 1024) { btn.disabled = false; btn.textContent = 'Criar mapa'; return toast('A imagem precisa ter até 15 MB.'); }
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z]/g, '');
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await sb.storage.from('mapas').upload(path, file, { contentType: file.type, upsert: false });
        if (error) { btn.disabled = false; btn.textContent = 'Criar mapa'; return toast('Não consegui enviar a imagem.'); }
        image = sb.storage.from('mapas').getPublicUrl(path).data.publicUrl;
      }
      if (!image) { btn.disabled = false; btn.textContent = 'Criar mapa'; return toast('Escolha uma imagem.'); }
      const { data, error } = await sb.from('scenes').insert({ name, image, grid: 70 }).select().single();
      if (error) { btn.disabled = false; btn.textContent = 'Criar mapa'; return toast('Não consegui criar o mapa.'); }
      S.scenes.push(data);
      await setActive(data.id);
      ui.modal = null; renderModal(); ui.mesa.grade = true; location.hash = '#/mesa'; render();
      toast('Mapa criado. Ajuste a grade para os quadrados baterem.');
    },
  });

  async function setActive(id) {
    S.scenes.forEach((x) => { x.active = x.id === id; }); render();
    const { error: e1 } = await sb.from('scenes').update({ active: false }).neq('id', id).eq('active', true);
    const { error: e2 } = await sb.from('scenes').update({ active: true }).eq('id', id);
    if (e1 || e2) toast('Não consegui trocar o mapa.');
  }
  document.addEventListener('change', (ev) => { if (ev.target.dataset.change === 'scene') setActive(ev.target.value); });

  function modalBody(m) {
    if (m.type === 'addMonster') {
      const pv = m.pv ?? (lastPick('pv-' + m.kind) || ''), def = m.def ?? (lastPick('def-' + m.kind) || '');
      const best = S.bestiary || [];
      return `<h2>Colocar monstro</h2>
        ${best.length ? `<div><label class="flab" for="mo-ficha">Usar uma ficha</label><select class="field" id="mo-ficha" data-change="bestPick">
          <option value="">— sem ficha —</option>${[...best].sort((a, b) => a.name.localeCompare(b.name, 'pt')).map((b) => `<option value="${b.id}" ${m.bid === b.id ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select></div>` : ''}
        <div class="mgrid">${MONSTROS.map(([k, n]) => `<button class="mpick${m.kind === k ? ' on' : ''}" data-act="pickMonster" data-k="${k}" aria-pressed="${m.kind === k}">
          <span class="pet" style="width:48px;height:48px;background-image:url('assets/monstros/${k}-${m.v}.png')"></span><span>${n}</span></button>`).join('')}</div>
        <div class="row" style="gap:8px"><span class="small muted" style="flex:1">Versão</span>
          ${['a', 'b'].map((v) => `<button class="${m.v === v ? 'use' : 'ghost'}" data-act="pickVariant" data-v="${v}">${v === 'a' ? '1' : '2'}</button>`).join('')}</div>
        <form class="form" data-form="addMonster">
          <div class="row"><span class="small muted" style="flex:1">Quantos</span><button type="button" class="sm" data-act="qtd" data-d="-1" aria-label="Menos">−</button>
            <span class="disp" style="width:28px;text-align:center;font-weight:700">${m.qtd}</span><button type="button" class="sm" data-act="qtd" data-d="1" aria-label="Mais">+</button></div>
          <div><label class="flab" for="mo-nome">Nome</label><input class="field" id="mo-nome" name="nome" placeholder="${esc(nomeMonstro(m.kind))}" value="${esc(m.nome || '')}" maxlength="40"></div>
          <div class="grid2"><div><label class="flab" for="mo-pv">PV de cada</label><input class="field" id="mo-pv" name="pv" type="number" inputmode="numeric" min="1" value="${esc(pv)}" required></div>
            <div><label class="flab" for="mo-def">Defesa</label><input class="field" id="mo-def" name="def" type="number" inputmode="numeric" min="0" value="${esc(def)}" required></div></div>
          <label class="row small" style="gap:10px"><input type="checkbox" class="chk" name="oculto"> Entrar escondido (só você vê até revelar)</label>
          <button class="primary" type="submit">Colocar no mapa</button>
        </form><button class="link" data-act="closeModal">Cancelar</button>`;
    }
    if (m.type === 'token') {
      const t = S.tokens.find((x) => x.id === m.id);
      if (!t) return '<p>Peça não encontrada.</p><button class="link" data-act="closeModal">Fechar</button>';
      if (t.kind === 'pc') {
        return `<h2>${esc(t.label)}</h2><p class="small muted" style="margin:0">PV, PM e condições ficam na ficha.</p>
          <button class="primary" data-act="tkOpenSheet">Abrir ficha</button>
          <button class="ghost" style="height:46px" data-act="tkRemove">Tirar do mapa</button><button class="link" data-act="closeModal">Fechar</button>`;
      }
      return `<h2>${esc(t.label)}</h2>
        <div class="total"><span>PV<br><span class="small muted">Defesa ${num(t.def)}</span></span><b>${num(t.hp)} / ${num(t.max_hp)}</b></div>
        ${(() => { const b = t.bestiary_id && (S.bestiary || []).find((x) => x.id === t.bestiary_id); return b && ctx.bestiario ? `<details class="card"><summary style="cursor:pointer;font-weight:700">Ficha: ${esc(b.name)}</summary><div style="display:flex;flex-direction:column;gap:10px;margin-top:10px">${ctx.bestiario.sheetHTML(b, true)}</div></details>` : ''; })()}
        <form class="form" data-form="tkHpSet"><div><label class="flab" for="tk-n">Quantidade</label><input class="field" id="tk-n" name="n" type="number" inputmode="numeric" min="0" required autofocus></div>
          <div class="grid3"><button class="roll" type="submit" name="mode" value="minus" style="height:46px">Dano</button><button class="use" type="submit" name="mode" value="plus" style="height:46px">Cura</button><button class="ghost" type="submit" name="mode" value="set" style="height:46px">Definir</button></div></form>
        <div class="row" style="gap:8px;flex-wrap:wrap"><button class="ghost" data-act="tkDead">${t.dead ? 'Reviver' : 'Marcar como morto'}</button>
          <button class="ghost" data-act="tkHide">${t.hidden ? 'Revelar para a mesa' : 'Esconder da mesa'}</button>
          <button class="ghost danger" data-act="tkRemove">Tirar do mapa</button></div>
        <span class="lbl">Condições</span>
        <div class="row" style="flex-wrap:wrap;gap:6px">${CONDICOES.map((c) => `<button class="${(t.conditions || []).includes(c) ? 'cond' : 'addcond'}" data-act="tkCond" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div>
        <button class="link" data-act="closeModal">Fechar</button>`;
    }
    if (m.type === 'newScene') {
      return `<h2>Novo mapa</h2>
        <form class="form" data-form="newScene">
          <div><label class="flab" for="sc-nome">Nome</label><input class="field" id="sc-nome" name="nome" maxlength="60" placeholder="Ex.: Taverna do Porto"></div>
          <div><label class="flab" for="sc-arq">Imagem do mapa (do seu aparelho)</label><input class="field" id="sc-arq" name="arquivo" type="file" accept="image/jpeg,image/png,image/webp" style="padding:10px"></div>
          <div><label class="flab" for="sc-pronto">Ou um dos mapas prontos</label><select class="field" id="sc-pronto" name="pronto">
            <option value="">—</option><option value="assets/maps/santuario-de-tenebra-v2.jpg">Santuário de Tenebra (redesenhado)</option><option value="assets/maps/santuario-de-tenebra.jpg">Santuário de Tenebra (original)</option></select></div>
          <button class="primary" type="submit">Criar mapa</button>
        </form><button class="link" data-act="closeModal">Cancelar</button>`;
    }
    return null;
  }

  function onRealtime(table, p) {
    const list = table === 'scenes' ? S.scenes : S.tokens;
    if (p.eventType === 'DELETE') {
      const i = list.findIndex((x) => x.id === p.old.id); if (i >= 0) list.splice(i, 1);
    } else {
      const row = p.new, i = list.findIndex((x) => x.id === row.id);
      if (i >= 0) list[i] = row; else list.push(row);
      if (table === 'tokens' && row.hidden && !isGM()) { const j = list.findIndex((x) => x.id === row.id); list.splice(j, 1); }
    }
  }

  return { viewMesa, modalBody, onRealtime, activeScene };
}
