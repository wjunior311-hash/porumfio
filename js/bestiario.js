// Fichas de monstros do mestre: bloco curto de estatísticas, com ataques que rolam sozinhos.
import { MONSTROS } from './mesa.js';

export const TESOUROS = ['nenhum', 'metade', 'padrão', 'dobro', 'triplo'];
const ATRS = ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'];

// "Clava +7 (1d6+3); Mordida +5 (1d4+2, x3)" → [{nome, bonus, dano}]
export function lerAtaques(txt) {
  const out = [];
  const re = /([^;,+\-()][^;+\-()]*?)\s*([+\-−–]\s*\d+)\s*\(\s*(\d+d\d+(?:\s*[+\-−–]\s*\d+)?)[^)]*\)/gi;
  let m;
  while ((m = re.exec(String(txt || '')))) {
    out.push({ nome: m[1].replace(/^(?:[\s,;]+|e\s+)+/i, '').trim(), bonus: parseInt(m[2].replace(/[−–]/, '-').replace(/\s/g, ''), 10), dano: m[3].replace(/[−–]/g, '-').replace(/\s/g, '') });
  }
  return out;
}

export function installBestiario(ctx) {
  const { S, ui, sb, esc, num, toast, render, renderModal, actions, forms, test, showRoll, rollDice } = ctx;
  const fmt = (v) => (num(v) >= 0 ? '+' + num(v) : String(num(v)));
  const spriteURL = (b) => (b.sprite ? `assets/monstros/${b.sprite}.png` : null);

  function sheetHTML(b, compact = false) {
    const atks = [...lerAtaques(b.melee).map((a) => ({ ...a, tipo: 'corpo a corpo' })), ...lerAtaques(b.ranged).map((a) => ({ ...a, tipo: 'à distância' }))];
    const atkBtns = atks.map((a, i) => `<div class="row" style="gap:6px;flex-wrap:wrap">
        <button class="roll" data-act="bAtk" data-b="${b.id}" data-i="${i}">${esc(a.nome)} ${fmt(a.bonus)}</button>
        <button class="ghost" data-act="bDmg" data-b="${b.id}" data-i="${i}">Dano ${esc(a.dano)}</button></div>`).join('');
    const sem = (txt) => txt && !lerAtaques(txt).length ? `<div class="small">${esc(txt)}</div>` : '';
    return `<div class="grid3" style="text-align:center">
        <div class="card attr"><small>PV</small><b>${num(b.pv)}</b></div>
        <div class="card attr"><small>DEFESA</small><b>${num(b.def)}</b></div>
        <button class="save" data-act="bTest" data-title="Iniciativa: ${esc(b.name)}" data-v="${num(b.init)}"><b>${fmt(b.init)}</b><span>Iniciativa</span></button>
      </div>
      ${atkBtns || sem(b.melee) || sem(b.ranged) ? `<span class="lbl">Ataques</span>${atkBtns}${sem(b.melee)}${sem(b.ranged)}` : ''}
      <div class="grid3">${[['Fortitude', b.fort], ['Reflexos', b.ref], ['Vontade', b.will]].map(([n, v]) =>
        `<button class="save" data-act="bTest" data-title="${n}: ${esc(b.name)}" data-v="${num(v)}"><b>${fmt(v)}</b><span>${n}</span></button>`).join('')}</div>
      ${compact ? '' : `<div class="grid3" style="grid-template-columns:repeat(6,minmax(0,1fr));gap:4px">${ATRS.map((k) =>
        `<div class="card attr" style="padding:6px 2px"><small>${k}</small><b style="font-size:18px">${fmt(b.attrs?.[k])}</b></div>`).join('')}</div>`}
      <div class="small" style="line-height:1.6">
        ${b.skills ? `<div><b>Perícias</b> ${esc(b.skills)}</div>` : ''}
        <div><b>Deslocamento</b> ${esc(b.speed)}</div>
        ${b.equipment ? `<div><b>Equipamento</b> ${esc(b.equipment)}</div>` : ''}
        <div><b>Tesouro</b> ${esc(b.treasure)}</div>
        ${b.notes ? `<div style="white-space:pre-line;margin-top:4px">${esc(b.notes)}</div>` : ''}
      </div>`;
  }

  function viewSection() {
    const list = [...S.bestiary].sort((a, b) => a.name.localeCompare(b.name, 'pt'));
    return `<div class="row" style="justify-content:space-between;margin-top:10px"><h2 class="lbl">Fichas de monstros · ${list.length}</h2>
        <button class="use" data-act="bNew">+ Incluir ficha</button></div>
      <div class="party">${list.map((b) => `<button class="item" style="appearance:none;color:var(--txt);text-align:left;width:100%" data-act="bView" data-id="${b.id}">
        <div class="petbox" style="width:44px;height:44px">${spriteURL(b) ? `<div class="pet" style="width:42px;height:42px;background-image:url('${spriteURL(b)}')"></div>` : ''}</div>
        <div style="flex:1;min-width:0"><div class="name">${esc(b.name)}${b.nd ? ` <span class="small muted">ND ${esc(b.nd)}</span>` : ''}</div>
        <div class="small muted" style="font-size:12px">PV ${num(b.pv)} · Def ${num(b.def)} · Inic ${fmt(b.init)}</div></div></button>`).join('') || '<p class="small muted">Nenhuma ficha ainda.</p>'}</div>`;
  }

  function formBody(b) {
    const v = b || { name: '', sprite: '', nd: '', pv: '', def: '', init: '', melee: '', ranged: '', attrs: {}, fort: '', ref: '', will: '', skills: '', speed: '9m (6q)', equipment: '', treasure: 'nenhum', notes: '' };
    const spriteOpts = `<option value="">— sem boneco —</option>` + MONSTROS.flatMap(([k, n]) => ['a', 'b'].map((x) =>
      `<option value="${k}-${x}" ${v.sprite === `${k}-${x}` ? 'selected' : ''}>${n} (versão ${x === 'a' ? 1 : 2})</option>`)).join('');
    const inp = (name, label, val, type = 'text', extra = '') => `<div><label class="flab" for="bf-${name}">${label}</label><input class="field" id="bf-${name}" name="${name}" type="${type}" ${type === 'number' ? 'inputmode="numeric"' : ''} value="${esc(val ?? '')}" ${extra}></div>`;
    return `<h2>${b ? 'Editar ficha' : 'Incluir ficha'}</h2>
      <form class="form" data-form="bSave" data-id="${b ? b.id : ''}">
        ${inp('name', 'Nome', v.name, 'text', 'required maxlength="60" placeholder="Ex.: Bandido Ligeiro"')}
        <div class="grid2"><div><label class="flab" for="bf-sprite">Boneco no mapa</label><select class="field" id="bf-sprite" name="sprite">${spriteOpts}</select></div>${inp('nd', 'ND', v.nd, 'text', 'maxlength="6" placeholder="1/4"')}</div>
        <div class="grid3">${inp('pv', 'Pontos de vida', v.pv, 'number', 'required min="1"')}${inp('def', 'Defesa', v.def, 'number', 'required')}${inp('init', 'Iniciativa', v.init, 'number')}</div>
        ${inp('melee', 'Corpo a corpo', v.melee, 'text', 'placeholder="Clava +7 (1d6+3)"')}
        ${inp('ranged', 'À distância', v.ranged, 'text', 'placeholder="Funda +5 (1d4+1)"')}
        <div class="grid3">${ATRS.map((k) => inp('a_' + k, k, v.attrs?.[k] ?? '', 'number')).join('')}</div>
        <div class="grid3">${inp('fort', 'Fortitude', v.fort, 'number')}${inp('ref', 'Reflexos', v.ref, 'number')}${inp('will', 'Vontade', v.will, 'number')}</div>
        ${inp('skills', 'Outras perícias', v.skills, 'text', 'placeholder="Furtividade +5, Percepção +2"')}
        ${inp('speed', 'Deslocamento', v.speed, 'text', 'placeholder="9m (6q)"')}
        ${inp('equipment', 'Equipamento', v.equipment, 'text', 'placeholder="Clava, funda, pedras x20"')}
        <div><label class="flab" for="bf-treasure">Tesouro</label><select class="field" id="bf-treasure" name="treasure">${TESOUROS.map((t) => `<option value="${t}" ${v.treasure === t ? 'selected' : ''}>${t[0].toUpperCase() + t.slice(1)}</option>`).join('')}</select></div>
        <div><label class="flab" for="bf-notes">Observações (habilidades, táticas)</label><textarea class="field" id="bf-notes" name="notes" style="min-height:90px">${esc(v.notes)}</textarea></div>
        <p class="small muted" style="margin:0">Escreva os ataques como no livro, "Nome +bônus (dano)". Separe vários com ponto e vírgula. O app cria os botões de rolar.</p>
        <button class="primary" type="submit">Salvar ficha</button>
      </form><button class="link" data-act="closeModal">Cancelar</button>`;
  }

  function modalBody(m) {
    if (m.type === 'bNew') return formBody(null);
    if (m.type === 'bEdit') return formBody(S.bestiary.find((x) => x.id === m.id));
    if (m.type === 'bView') {
      const b = S.bestiary.find((x) => x.id === m.id);
      if (!b) return '<p>Ficha não encontrada.</p><button class="link" data-act="closeModal">Fechar</button>';
      return `<div class="row" style="gap:12px">${spriteURL(b) ? `<div class="petbox" style="width:60px;height:60px"><div class="pet" style="width:56px;height:56px;background-image:url('${spriteURL(b)}')"></div></div>` : ''}
          <div><h2>${esc(b.name)}</h2>${b.nd ? `<div class="small muted">ND ${esc(b.nd)}</div>` : ''}</div></div>
        ${sheetHTML(b)}
        <div class="row" style="gap:8px;flex-wrap:wrap"><button class="use" data-act="bToMap" data-id="${b.id}">Pôr no mapa</button>
          <button class="ghost" data-act="bEditOpen" data-id="${b.id}">Editar</button><button class="ghost" data-act="bCopy" data-id="${b.id}">Duplicar</button>
          <button class="ghost danger" data-act="bDelete" data-id="${b.id}">Apagar</button></div>
        <button class="link" data-act="closeModal">Fechar</button>`;
    }
    return null;
  }

  const findB = (id) => S.bestiary.find((x) => x.id === id);
  function atkList(b) { return [...lerAtaques(b.melee), ...lerAtaques(b.ranged)]; }

  Object.assign(actions, {
    bNew() { ui.modal = { type: 'bNew' }; renderModal(); },
    bView(el) { ui.modal = { type: 'bView', id: el.dataset.id }; renderModal(); },
    bEditOpen(el) { ui.modal = { type: 'bEdit', id: el.dataset.id }; renderModal(); },
    bTest(el) { test(el.dataset.title, num(el.dataset.v)); },
    bAtk(el) { const b = findB(el.dataset.b), a = atkList(b)[+el.dataset.i]; test(`${b.name}: ${a.nome}`, a.bonus); },
    bDmg(el) {
      const b = findB(el.dataset.b), a = atkList(b)[+el.dataset.i], r = rollDice(a.dano);
      if (r) showRoll({ title: `Dano: ${a.nome} (${b.name})`, n: r.total, detail: a.dano + ' → ' + r.text });
    },
    bToMap(el) { const b = findB(el.dataset.id); ui.modal = null; renderModal(); location.hash = '#/mesa'; setTimeout(() => actions.addMonster({ bid: b.id }), 50); },
    async bCopy(el) {
      const b = findB(el.dataset.id);
      const { id, created_at, updated_at, ...rest } = b;
      const { data, error } = await sb.from('bestiary').insert({ ...rest, name: b.name + ' (cópia)' }).select().single();
      if (error) return toast('Não consegui duplicar.');
      if (!findB(data.id)) S.bestiary.push(data);
      ui.modal = { type: 'bEdit', id: data.id }; renderModal(); render();
    },
    async bDelete(el) {
      const b = findB(el.dataset.id);
      if (!confirm(`Apagar a ficha "${b.name}"? Monstros já no mapa continuam lá.`)) return;
      ui.modal = null; renderModal();
      S.bestiary = S.bestiary.filter((x) => x.id !== b.id); render();
      const { error } = await sb.from('bestiary').delete().eq('id', b.id);
      if (error) toast('Não consegui apagar.');
    },
  });

  Object.assign(forms, {
    async bSave(f) {
      const n = (k) => (f[k].value === '' ? 0 : num(f[k].value));
      const row = {
        name: f.name.value.trim(), sprite: f.sprite.value || null, nd: f.nd.value.trim(),
        pv: Math.max(1, n('pv')), def: n('def'), init: n('init'), melee: f.melee.value.trim(), ranged: f.ranged.value.trim(),
        attrs: Object.fromEntries(ATRS.map((k) => [k, n('a_' + k)])), fort: n('fort'), ref: n('ref'), will: n('will'),
        skills: f.skills.value.trim(), speed: f.speed.value.trim() || '9m (6q)', equipment: f.equipment.value.trim(),
        treasure: f.treasure.value, notes: f.notes.value.trim(), updated_at: new Date().toISOString(),
      };
      const id = f.dataset.id;
      const q = id ? sb.from('bestiary').update(row).eq('id', id).select().single() : sb.from('bestiary').insert(row).select().single();
      const { data, error } = await q;
      if (error) return toast('Não consegui salvar a ficha.');
      const i = S.bestiary.findIndex((x) => x.id === data.id);
      if (i >= 0) S.bestiary[i] = data; else S.bestiary.push(data);
      ui.modal = { type: 'bView', id: data.id }; renderModal(); render();
      toast('Ficha salva.');
    },
  });

  function onRealtime(p) {
    if (p.eventType === 'DELETE') { S.bestiary = S.bestiary.filter((x) => x.id !== p.old.id); return; }
    const i = S.bestiary.findIndex((x) => x.id === p.new.id);
    if (i >= 0) S.bestiary[i] = p.new; else S.bestiary.push(p.new);
  }

  return { viewSection, modalBody, onRealtime, sheetHTML };
}
