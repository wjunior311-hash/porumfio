import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { GRUPOS, infoPoder, lerMagia, CONDICOES, PERICIAS, circuloMaximo } from './regras.js';
import { installMesa } from './mesa.js';

const SUPABASE_URL = 'https://pziqkepgluxvdikllfwq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_J0n__8-3G6Tf6rnz4Xu_7A_uLIbfKbJ';
const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } });

// ---------- estado ----------
const S = { session: null, me: null, chars: {}, order: [], spells: {}, members: [], invites: [], settings: {}, gmNote: null, scenes: [], tokens: [], ready: false };
let mesa = null;
const ui = { tab: {}, open: {}, roll: null, novo: { nome: '', espacos: 1 }, modal: null, pendingRender: false, installDismissed: lsGet('pf-install-off') === '1' };
let deferredInstall = null;

// ---------- utilidades ----------
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (v) => (v >= 0 ? '+' + v : String(v));
const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
const d20 = () => 1 + Math.floor(Math.random() * 20);
function lsGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch {} }
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2400);
}
const role = () => S.me?.role;
const isGM = () => role() === 'gm' || role() === 'admin';
const isAdmin = () => role() === 'admin';
const canEdit = (cid) => isGM() || S.me?.character_id === cid;
const PAPEL = { player: 'Jogador', gm: 'Mestre', admin: 'Administrador' };
const ATRIB_MAGIA = { Arcanista: 'INT', Bardo: 'CAR', Druida: 'SAB', 'Clérigo': 'SAB', Bucaneiro: 'CAR' };
const sprite = (id) => `assets/pixel/${encodeURIComponent(id)}.png`;
const petHTML = (id, size, ko = false) =>
  `<div class="pet${ko ? ' ko' : ''}" style="width:${size}px;height:${size}px;background-image:url('${sprite(id)}')" aria-hidden="true"></div>`;

function rollDice(expr) {
  const m = String(expr).replace(/\s/g, '').match(/^(\d+)d(\d+)([+-]\d+)?/i);
  if (!m) return null;
  const n = +m[1], f = +m[2], mod = m[3] ? +m[3] : 0, dice = [];
  for (let i = 0; i < n; i++) dice.push(1 + Math.floor(Math.random() * f));
  return { total: dice.reduce((a, b) => a + b, 0) + mod, text: '[' + dice.join(', ') + ']' + (mod ? (mod > 0 ? ' + ' + mod : ' − ' + -mod) : '') };
}
function showRoll(r) { ui.roll = r; clearTimeout(showRoll.t); showRoll.t = setTimeout(() => { ui.roll = null; renderRoll(); }, 9000); renderRoll(); }
function test(title, bonus, critOn = 20) {
  const r = d20(), total = r + bonus, crit = r >= critOn, fumble = r === 1;
  showRoll({ title, n: total, detail: `d20 [${r}] ${bonus >= 0 ? '+ ' + bonus : '− ' + -bonus}${crit ? ' · CRÍTICO!' : fumble ? ' · falha crítica' : ''}`, crit, fumble });
}
function renderRoll() {
  let el = $('#rollcard');
  if (!ui.roll) { el?.remove(); return; }
  const r = ui.roll;
  const html = `<div class="n" style="color:${r.crit ? 'var(--gold)' : r.fumble ? 'var(--red)' : 'var(--txt)'};${r.small ? 'font-size:28px' : ''}">${esc(r.n)}</div>
    <div style="flex:1;min-width:0"><div style="font-weight:700">${esc(r.title)}</div><div class="small" style="color:#c9bfcc;margin-top:2px">${esc(r.detail)}</div></div>
    <button class="sm" data-act="closeRoll" aria-label="Fechar resultado">×</button>`;
  if (!el) { el = document.createElement('div'); el.id = 'rollcard'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.className = 'rollcard' + (r.crit ? ' crit' : '');
  el.innerHTML = html;
}

// ---------- dados ----------
async function loadAll() {
  const uid = S.session.user.id;
  const { data: me } = await sb.from('profiles').select('*').eq('user_id', uid).maybeSingle();
  S.me = me;
  if (!me) return;
  const [chars, spells, members, settings, scenes, tokens] = await Promise.all([
    sb.from('characters').select('*').order('sort'),
    sb.from('character_spells').select('*').order('sort'),
    sb.from('profiles').select('user_id, display_name, role, character_id, created_at').order('created_at'),
    sb.from('app_settings').select('*'),
    sb.from('scenes').select('*').order('created_at'),
    sb.from('tokens').select('*').order('created_at'),
  ]);
  S.scenes = scenes.data || [];
  S.tokens = tokens.data || [];
  S.chars = {}; S.order = [];
  (chars.data || []).forEach((c) => { S.chars[c.id] = c; S.order.push(c.id); });
  S.spells = {};
  (spells.data || []).forEach((s) => { (S.spells[s.character_id] ||= []).push(s); });
  S.members = members.data || [];
  S.settings = Object.fromEntries((settings.data || []).map((r) => [r.key, r.value]));
  if (isGM()) {
    const { data } = await sb.from('gm_notes').select('*').order('id').limit(1).maybeSingle();
    S.gmNote = data;
  }
  if (isAdmin()) await loadInvites();
}
async function loadInvites() {
  const { data } = await sb.from('invites').select('*').order('created_at');
  S.invites = data || [];
}

let channel = null;
function subscribe() {
  if (channel) sb.removeChannel(channel);
  channel = sb.channel('mesa')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'characters' }, (p) => {
      const row = p.new;
      if (!row?.id) return;
      if (!S.chars[row.id]) S.order.push(row.id);
      S.chars[row.id] = row;
      softRender();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'scenes' }, (p) => { mesa.onRealtime('scenes', p); softRender(); })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tokens' }, (p) => { mesa.onRealtime('tokens', p); softRender(); })
    .subscribe();
}

async function patch(cid, changes, silent = false) {
  const c = S.chars[cid];
  if (!c) return;
  const before = JSON.parse(JSON.stringify(c.data));
  Object.assign(c.data, changes);
  render();
  const { error } = await sb.rpc('patch_character', { cid, patch: changes });
  if (error) {
    c.data = before; render();
    toast('Não consegui salvar. Confira sua internet.');
  } else if (!silent) {
    // ok
  }
}

// ---------- rotas ----------
function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const [name, arg] = h.split('/');
  return { name: name || '', arg: arg ? decodeURIComponent(arg) : '' };
}
function go(path) { location.hash = '#/' + path; }

function softRender() {
  const a = document.activeElement;
  if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && $('#app').contains(a)) { ui.pendingRender = true; return; }
  if (ui.modal) { ui.pendingRender = true; return; }
  render();
}

function render() {
  ui.pendingRender = false;
  const r = route();
  const app = $('#app');
  const scrollY = window.scrollY;
  let html = '';
  app.classList.toggle('wide', ['mestre', 'admin', 'mesa'].includes(r.name));
  document.body.classList.toggle('tvmode', r.name === 'mesa' && r.arg === 'tv');
  if (r.name === 'convite') html = viewInvite(r.arg);
  else if (!S.session) html = viewLogin();
  else if (!S.me) html = viewNoProfile();
  else if (r.name === 'ficha' && S.chars[r.arg]) html = viewSheet(r.arg) + nav('ficha', r.arg);
  else if (r.name === 'grupo') html = viewParty() + nav('grupo');
  else if (r.name === 'mesa') html = r.arg === 'tv' ? mesa.viewMesa(true) : mesa.viewMesa(false) + nav('mesa');
  else if (r.name === 'mestre' && isGM()) html = viewGM() + nav('mestre');
  else if (r.name === 'admin' && isAdmin()) html = viewAdmin() + nav('mais');
  else if (r.name === 'mais') html = viewMore() + nav('mais');
  else {
    const home = S.me.character_id && S.chars[S.me.character_id] ? 'ficha/' + S.me.character_id : isGM() ? 'mestre' : 'grupo';
    location.replace('#/' + home); return;
  }
  app.innerHTML = html;
  if (route().name === (render.last || '')) window.scrollTo(0, scrollY);
  render.last = route().name;
  renderModal();
  renderRoll();
}

// ---------- telas: entrar e convite ----------
function viewLogin() {
  return `<section class="auth">
    <div class="brand">POR UM FIO</div>
    <h1>Entrar na mesa</h1>
    <form class="form" data-form="login">
      <div><label class="flab" for="lg-email">E-mail</label><input class="field" id="lg-email" name="email" type="email" autocomplete="email" required></div>
      <div><label class="flab" for="lg-pass">Senha</label><input class="field" id="lg-pass" name="password" type="password" autocomplete="current-password" required></div>
      <div class="err" id="lg-err"></div>
      <button class="primary" type="submit">Entrar</button>
    </form>
    <p class="small muted" style="margin:0">Ainda não tem conta? Use o link de convite que você recebeu. Esqueceu a senha? Peça para o administrador trocar para você.</p>
  </section>`;
}
const inviteCache = {};
function viewInvite(token) {
  const inv = inviteCache[token];
  if (!inv) {
    inviteCache[token] = { loading: true };
    sb.functions.invoke('convite', { body: { action: 'peek', token } }).then(({ data, error }) => {
      inviteCache[token] = error || data?.error ? { error: data?.error || 'Este convite não existe, já foi usado ou foi cancelado.' } : data;
      render();
    });
    return `<section class="auth"><div class="brand">POR UM FIO</div><p class="muted">Abrindo seu convite…</p></section>`;
  }
  if (inv.loading) return `<section class="auth"><div class="brand">POR UM FIO</div><p class="muted">Abrindo seu convite…</p></section>`;
  if (inv.error) return `<section class="auth"><div class="brand">POR UM FIO</div><h1>Convite indisponível</h1><p class="muted">${esc(inv.error)}</p><a class="primary" style="display:flex;align-items:center;justify-content:center;text-decoration:none" href="#/">Ir para a entrada</a></section>`;
  const who = inv.character ? `para jogar com <b>${esc(inv.character)}</b>` : inv.role === 'gm' ? 'para ser o <b>mestre da mesa</b>' : '';
  const pet = inv.character_id ? `<div class="petbox" style="width:120px;height:120px">${petHTML(inv.character_id, 112)}</div>` : `<div class="petbox" style="width:120px;height:120px">${petHTML('pato', 112)}</div>`;
  const logged = S.session ? `<p class="small muted" style="margin:0">Você já está conectado em outra conta neste aparelho. <button class="link" data-act="logout">Sair dela</button> para usar este convite.</p>` : '';
  return `<section class="auth">
    <div class="brand">POR UM FIO</div>
    ${pet}
    <h1>Você foi convidado ${who}</h1>
    <p class="muted" style="margin:0">Crie sua conta. Depois é só entrar com esse e-mail e senha em qualquer aparelho.</p>
    ${logged}
    <form class="form" data-form="accept" data-token="${esc(token)}">
      <div><label class="flab" for="iv-name">Como quer ser chamado</label><input class="field" id="iv-name" name="name" autocomplete="nickname" required maxlength="60"></div>
      <div><label class="flab" for="iv-email">E-mail</label><input class="field" id="iv-email" name="email" type="email" autocomplete="email" required></div>
      <div><label class="flab" for="iv-pass">Crie uma senha</label><input class="field" id="iv-pass" name="password" type="password" autocomplete="new-password" minlength="6" required></div>
      <div class="err" id="iv-err"></div>
      <button class="primary" type="submit">Criar conta e entrar</button>
    </form>
  </section>`;
}
function viewNoProfile() {
  return `<section class="auth"><div class="brand">POR UM FIO</div><h1>Conta sem mesa</h1>
    <p class="muted">Sua conta existe, mas não está ligada a nenhum personagem. Peça um convite ao administrador.</p>
    <button class="primary" data-act="logout">Sair</button></section>`;
}

// ---------- navegação ----------
const ICON = {
  ficha: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>',
  grupo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.8 3 2.6 3.5 5.2"/></svg>',
  mestre: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8.7 5v10L12 22l-8.7-5V7z"/><path d="M12 2v20M3.3 7L12 12l8.7-5"/></svg>',
  mesa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/></svg>',
  mais: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>',
};
function nav(active, arg) {
  const mine = S.me?.character_id;
  const items = [];
  if (mine) items.push(['ficha/' + mine, 'Ficha', 'ficha', active === 'ficha' && arg === mine]);
  items.push(['grupo', 'Grupo', 'grupo', active === 'grupo' || (active === 'ficha' && arg !== mine)]);
  items.push(['mesa', 'Mesa', 'mesa', active === 'mesa']);
  if (isGM()) items.push(['mestre', 'Mestre', 'mestre', active === 'mestre']);
  items.push(['mais', 'Mais', 'mais', active === 'mais']);
  return `<nav class="nav" aria-label="Seções"><div class="nav-in">${items.map(([href, label, ic, on]) =>
    `<a href="#/${href}" class="${on ? 'on' : ''}" ${on ? 'aria-current="page"' : ''}>${ICON[ic]}${label}</a>`).join('')}</div></nav>`;
}

// ---------- instalação ----------
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function installBanner(force = false) {
  if (isStandalone()) return force ? `<div class="card small muted">O app já está instalado neste aparelho.</div>` : '';
  if (!force && ui.installDismissed) return '';
  return `<div class="install">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c7d0f5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M12 7v7M9 11l3 3 3-3"/></svg>
    <div style="flex:1"><b>Instalar na tela de início</b><span>Abre como app, em tela cheia.</span></div>
    <button class="use" data-act="install">Instalar</button>
    ${force ? '' : '<button class="sm" data-act="installOff" aria-label="Agora não">×</button>'}
  </div>`;
}
async function doInstall() {
  if (deferredInstall) {
    deferredInstall.prompt();
    const r = await deferredInstall.userChoice.catch(() => null);
    deferredInstall = null;
    if (r?.outcome === 'accepted') toast('Pronto! Procure o ícone na tela de início.');
    render();
    return;
  }
  ui.modal = { type: 'installHelp' }; renderModal();
}

// ---------- ficha ----------
function sheetTabs(cid) {
  const t = ['Resumo', 'Perícias', 'Habilidades'];
  if ((S.spells[cid] || []).length) t.push('Magias');
  t.push('Mochila', 'Notas');
  return t;
}
function attackInfo(a) {
  const [name, bonus, dmg, crit, type, range] = a;
  const b = parseInt(String(bonus).replace(/[^\d-]/g, ''), 10) || 0;
  const c = String(crit || '');
  const critOn = /\b(1[5-9])\b/.test(c) ? parseInt(c.match(/\b(1[5-9])\b/)[1], 10) : 20;
  const mult = (c.match(/x\d/) || ['x2'])[0];
  const dmg1 = String(dmg || '').split('/')[0].trim();
  return { name, b, dmg: dmg1, critOn, line: [range && range !== '—' ? 'alcance ' + String(range).toLowerCase() : 'corpo a corpo', critOn < 20 ? 'crítico ' + critOn : 'crítico ' + mult.replace('x', '×'), String(type || '').toLowerCase()].filter(Boolean).join(' · ') };
}
function skillVal(d, name) {
  const v = d.skills?.[name];
  return v === null || v === undefined ? null : num(v);
}

function viewSheet(cid) {
  const c = S.chars[cid], d = c.data, edit = canEdit(cid), mine = S.me.character_id === cid;
  const tabs = sheetTabs(cid);
  let tab = ui.tab[cid] || 'Resumo';
  if (!tabs.includes(tab)) tab = 'Resumo';
  const hp = num(d.hp), maxHp = Math.max(1, num(d.maxHp, 1)), mp = num(d.mp), maxMp = Math.max(0, num(d.maxMp));
  const ko = hp <= 0;
  const owner = S.members.find((m) => m.character_id === cid);
  const minus = (k, l) => edit ? `<button class="btn" data-act="vital" data-c="${cid}" data-k="${k}" data-d="-1" aria-label="${l} menos 1">−</button>` : '';
  const plus = (k, l) => edit ? `<button class="btn" data-act="vital" data-c="${cid}" data-k="${k}" data-d="1" aria-label="${l} mais 1">+</button>` : '';
  return `<div class="page">
    ${mine ? installBanner() : ''}
    ${!edit ? `<div class="card small muted">Você está vendo a ficha de ${esc(c.name)}${owner ? ' (jogador: ' + esc(owner.display_name) + ')' : ''}. Só o dono e o mestre podem mudar.</div>` : ''}
    <section class="head">
      <div class="petbox" style="width:78px;height:78px">${petHTML(cid, 72, ko)}</div>
      <div style="flex:1;min-width:0">
        <h1>${esc(c.name)}</h1>
        <div class="small muted">${esc(d.race)} · ${esc(d.className)} ${esc(d.level)} · ${esc(d.origin)}</div>
        ${d.deity ? `<div class="small muted">Devoto de ${esc(d.deity)}</div>` : ''}
      </div>
      <div class="defbox"><b>${esc(d.def)}</b><span>Defesa</span></div>
    </section>
    <section class="card vitals">
      <div class="vital">${minus('hp', 'PV')}
        <div class="mid"><div class="top"><span style="font-size:12px;font-weight:700;color:var(--red-l);letter-spacing:1px">PV${ko ? ' · CAÍDO' : ''}</span>
          <button class="val" ${edit ? `data-act="vitalSet" data-c="${cid}" data-k="hp"` : 'disabled'} aria-label="Ajustar PV">${hp}<span> / ${maxHp}</span></button></div>
          <div class="track"><i style="width:${Math.max(0, Math.min(100, hp / maxHp * 100))}%;background:var(--red)"></i></div></div>
        ${plus('hp', 'PV')}</div>
      <div class="vital">${minus('mp', 'PM')}
        <div class="mid"><div class="top"><span style="font-size:12px;font-weight:700;color:var(--blue-l);letter-spacing:1px">PM</span>
          <button class="val" ${edit ? `data-act="vitalSet" data-c="${cid}" data-k="mp"` : 'disabled'} aria-label="Ajustar PM">${mp}<span> / ${maxMp}</span></button></div>
          <div class="track"><i style="width:${maxMp ? Math.max(0, Math.min(100, mp / maxMp * 100)) : 0}%;background:var(--blue)"></i></div></div>
        ${plus('mp', 'PM')}</div>
    </section>
    <nav class="tabs" aria-label="Partes da ficha">${tabs.map((t) => `<button class="tab ${t === tab ? 'on' : ''}" data-act="tab" data-c="${cid}" data-t="${t}">${t}</button>`).join('')}</nav>
    ${tab === 'Resumo' ? tabSummary(cid) : ''}
    ${tab === 'Perícias' ? tabSkills(cid) : ''}
    ${tab === 'Habilidades' ? tabPowers(cid) : ''}
    ${tab === 'Magias' ? tabSpells(cid) : ''}
    ${tab === 'Mochila' ? tabBag(cid) : ''}
    ${tab === 'Notas' ? tabNotes(cid) : ''}
  </div>`;
}

function tabSummary(cid) {
  const d = S.chars[cid].data, edit = canEdit(cid);
  const at = d.attrs || {};
  const attrs = ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'].map((k) => `<div class="card attr"><small>${k}</small><b>${fmt(num(at[k]))}</b></div>`).join('');
  const saves = [['Fortitude', 'fort'], ['Reflexos', 'ref'], ['Vontade', 'will']].map(([n, k]) => {
    const v = skillVal(d, n) ?? num(d[k]);
    return `<button class="save" data-act="test" data-title="${n}" data-b="${v}"><b>${fmt(v)}</b><span>${n}</span></button>`;
  }).join('');
  const conds = (d.conditions || []).map((x) => `<button class="cond" ${edit ? `data-act="condOff" data-c="${cid}" data-v="${esc(x)}" aria-label="Tirar ${esc(x)}"` : 'disabled'}>${esc(x)}${edit ? ' ×' : ''}</button>`).join('');
  const atks = (d.attacks || []).map((a, i) => {
    const k = attackInfo(a);
    return `<div class="card" style="display:flex;flex-direction:column;gap:8px">
      <div class="row" style="justify-content:space-between;align-items:flex-start"><div><div style="font-weight:700">${esc(k.name)}</div><div class="small muted" style="margin-top:2px">${esc(k.line)}</div></div><span class="chip c-arm">ARMA</span></div>
      <div class="row" style="gap:8px"><button class="roll" data-act="attack" data-c="${cid}" data-i="${i}">Atacar ${fmt(k.b)}</button>${k.dmg ? `<button class="ghost" data-act="damage" data-c="${cid}" data-i="${i}">Dano ${esc(k.dmg)}</button>` : ''}</div></div>`;
  }).join('');
  const armors = (d.items || []).filter((it) => /armadura|escudo|gibão|cota/i.test(it[0])).map((it) =>
    `<div class="card row" style="justify-content:space-between;align-items:flex-start"><div><div style="font-weight:700">${esc(it[0])}</div><div class="small muted" style="margin-top:2px">Vestida · já somada na Defesa</div></div><span class="chip c-def">${/escudo/i.test(it[0]) ? 'ESCUDO' : 'ARMADURA'}</span></div>`).join('');
  return `
    <h2 class="lbl">Condições</h2>
    <div class="row" style="flex-wrap:wrap;gap:6px">${conds || '<span class="small muted">Nenhuma no momento</span>'}${edit ? `<button class="addcond" data-act="condAdd" data-c="${cid}">+ Condição</button>` : ''}</div>
    <h2 class="lbl" style="margin-top:6px">Atributos</h2><div class="grid3">${attrs}</div>
    <h2 class="lbl" style="margin-top:6px">Resistências <small>· toque para rolar</small></h2><div class="grid3">${saves}</div>
    <h2 class="lbl" style="margin-top:6px">Equipamentos</h2>${atks}${armors}
    <div class="card row" style="justify-content:space-between"><span class="small muted">Deslocamento</span><span class="disp" style="font-size:18px;font-weight:700">${esc(d.speed ?? 9)} m</span></div>`;
}

function tabSkills(cid) {
  const d = S.chars[cid].data, tr = d.trained || [];
  const rows = PERICIAS.map(([n, a]) => {
    const v = skillVal(d, n), t = tr.includes(n);
    return `<button class="skill" ${v === null ? 'disabled' : `data-act="test" data-title="${n}" data-b="${v}"`}>
      <span style="color:${t ? 'var(--gold)' : '#3a3044'}" aria-hidden="true">●</span><span style="flex:1">${n} <span class="small" style="color:var(--dim)">${a}</span>${t ? '<span class="sr"> (treinada)</span>' : ''}</span>
      <span class="v" style="color:${v === null ? 'var(--dim)' : 'var(--txt)'}">${v === null ? 'só treinado' : fmt(v)}</span></button>`;
  }).join('');
  return `<div class="row" style="justify-content:space-between;margin:0 2px"><h2 class="lbl">Perícias</h2><span class="small muted"><span style="color:var(--gold)">●</span> treinada · toque para rolar</span></div>${rows}`;
}

function powerCost(info) { return info.pm ? `<span class="chip c-pm">${info.pm} PM${info.extras ? '+' : ''}</span>` : info.extras ? '<span class="chip c-pm">PM variável</span>' : '<span class="chip c-free">grátis</span>'; }
function tabPowers(cid) {
  const d = S.chars[cid].data, edit = canEdit(cid);
  const by = {};
  (d.powers || []).forEach(([name, desc], i) => { const inf = infoPoder(name); (by[inf.grupo] ||= []).push({ name, desc, i, inf }); });
  return ['passiva', 'luta', 'pericia', 'fora', 'magia'].filter((g) => by[g]).map((g) => {
    const G = GRUPOS[g];
    const cards = by[g].map(({ name, desc, inf }) => {
      const key = cid + ':p:' + name, open = ui.open[key];
      const when = inf.quando || String(desc).split(/(?<=\.)\s/)[0];
      const usable = edit && (inf.pm || inf.extras);
      return `<div class="card" style="display:flex;flex-direction:column;gap:6px">
        <div class="row" style="justify-content:space-between;gap:8px"><span style="font-weight:700">${esc(name)}</span>${g === 'magia' || g === 'passiva' ? '' : powerCost(inf)}</div>
        <div class="when">${esc(when)}</div>
        ${open ? `<div class="rule">${esc(desc)}</div>` : ''}
        <div class="row" style="gap:8px"><button class="link" data-act="toggle" data-k="${esc(key)}">${open ? 'Fechar' : 'Ler regra completa'}</button><span style="flex:1"></span>
        ${usable ? `<button class="use" data-act="usePower" data-c="${cid}" data-n="${esc(name)}">Usar</button>` : ''}</div></div>`;
    }).join('');
    return `<div class="ghead"><span class="gicon" style="background:${G.cor};color:${G.tinta}" aria-hidden="true">${G.icone}</span><div><h2>${G.titulo}</h2><div class="small muted" style="margin-top:1px">${G.dica}</div></div></div>${cards}`;
  }).join('');
}

function tabSpells(cid) {
  const c = S.chars[cid], d = c.data, edit = canEdit(cid);
  const key = ATRIB_MAGIA[d.className] || 'CAR';
  const lvl = num(d.level, 1);
  const cd = 10 + Math.floor(lvl / 2) + num(d.attrs?.[key]);
  const circ = circuloMaximo(d.className, lvl);
  const list = (S.spells[cid] || []).map((sp) => {
    const m = lerMagia(sp, d), k = cid + ':m:' + sp.id, open = ui.open[k];
    return `<div class="card" style="display:flex;flex-direction:column;gap:8px">
      <div class="row" style="justify-content:space-between;gap:8px"><span style="font-weight:700;font-size:17px">${esc(sp.name)}</span><span class="chip c-pm">${m.custoBase} PM${m.aprimoramentos.length ? '+' : ''}</span></div>
      <div class="when">${esc(m.principal)}</div>
      <div class="row" style="flex-wrap:wrap;gap:6px">${m.tags.map((t) => `<span class="tagx">${esc(t)}</span>`).join('')}</div>
      ${open ? `<div class="rule">${m.truque ? '<b>Truque (0 PM):</b> ' + esc(m.truque) + '\n\n' : ''}<b>Aprimoramentos:</b>\n${m.aprimoramentos.map((a) => `+${a.pm} PM: ${esc(a.texto)}${a.bloqueio ? ' — ' + esc(a.bloqueio) : ''}`).join('\n') || 'nenhum'}</div>` : ''}
      <div class="row" style="gap:8px"><button class="link" data-act="toggle" data-k="${esc(k)}">${open ? 'Fechar' : 'Truque e aprimoramentos'}</button><span style="flex:1"></span>
      ${edit ? `<button class="use" data-act="cast" data-c="${cid}" data-s="${sp.id}">Lançar</button>` : ''}</div></div>`;
  }).join('');
  return `<div class="card grid3" style="text-align:center">
      <div><div class="disp" style="font-size:20px;font-weight:700">${key}</div><div class="small muted" style="font-size:11px">atributo-chave</div></div>
      <div><div class="disp" style="font-size:20px;font-weight:700">${cd}</div><div class="small muted" style="font-size:11px">CD para resistir</div></div>
      <div><div class="disp" style="font-size:20px;font-weight:700">${circ}º</div><div class="small muted" style="font-size:11px">círculo máximo</div></div></div>
    <div class="small muted" style="margin:0 2px">No nível ${lvl}, dá para gastar até <b style="color:var(--txt)">${lvl} PM</b> numa magia, somando os aprimoramentos.</div>${list}`;
}

function tabBag(cid) {
  const d = S.chars[cid].data, edit = canEdit(cid);
  const items = d.items || [];
  const max = num(d.maxLoad, 10);
  const load = items.reduce((a, it) => a + num(it[1]) * num(it[3], 1), 0);
  const over = load > max;
  const col = over ? 'var(--red)' : load > max * 0.8 ? 'var(--gold)' : '#7fb8e0';
  const rows = items.map((it, i) => {
    const w = num(it[1]), q = num(it[3], 1);
    const meta = (w === 0 ? 'não ocupa espaço' : String(w).replace('.', ',') + (w === 1 ? ' espaço' : ' espaços') + ' cada') + (it[2] ? ' · ' + it[2] : '');
    return `<div class="item"><div style="flex:1;min-width:0"><div class="name">${esc(it[0])}</div><div class="small muted" style="font-size:12px;margin-top:1px">${esc(meta)}</div></div>
      ${edit ? `<button class="sm" data-act="itemQty" data-c="${cid}" data-i="${i}" data-d="-1" aria-label="Usar ou tirar um ${esc(it[0])}">−</button>` : ''}
      <span class="disp" style="font-size:17px;font-weight:700;width:24px;text-align:center">${q}</span>
      ${edit ? `<button class="sm" data-act="itemQty" data-c="${cid}" data-i="${i}" data-d="1" aria-label="Somar um ${esc(it[0])}">+</button>` : ''}</div>`;
  }).join('');
  return `<div class="card" style="display:flex;flex-direction:column;gap:8px">
      <div class="row" style="justify-content:space-between;align-items:baseline"><span class="lbl">Carga</span><span class="disp" style="font-size:18px;font-weight:700;color:${col}">${String(Math.round(load * 10) / 10).replace('.', ',')} <span style="font-size:14px;color:var(--dim)">/ ${max} espaços</span></span></div>
      <div class="track"><i style="width:${Math.min(100, load / max * 100)}%;background:${col}"></i></div>
      ${over ? `<div class="small" style="color:#f3b0a8">Sobrecarregado: penalidade de armadura −5 e deslocamento −3 m. Limite máximo: ${max * 2} espaços.</div>` : ''}</div>
    <div class="card row"><span class="small muted" style="flex:1">Tibares</span>
      ${edit ? `<button class="sm" data-act="money" data-c="${cid}" data-d="-10" aria-label="Gastar 10 tibares">−</button>` : ''}
      <button class="val disp" style="appearance:none;border:0;background:none;color:var(--txt);font-size:20px;font-weight:700;min-width:84px;text-align:center" ${edit ? `data-act="moneySet" data-c="${cid}"` : 'disabled'}>T$ ${num(d.money).toLocaleString('pt-BR')}</button>
      ${edit ? `<button class="sm" data-act="money" data-c="${cid}" data-d="10" aria-label="Ganhar 10 tibares">+</button>` : ''}</div>
    <h2 class="lbl" style="margin:4px 2px 0">Itens · ${items.length}</h2>${rows}
    ${edit ? `<form class="card" data-form="addItem" data-c="${cid}" style="display:flex;flex-direction:column;gap:8px;border-style:dashed">
      <label class="lbl" for="novo-item">Novo item</label>
      <input class="field" id="novo-item" name="nome" placeholder="Nome do item" value="${esc(ui.novo.nome)}" data-in="novoNome" maxlength="80">
      <div class="row"><span class="small muted" style="flex:1">Espaços que ocupa</span>
        <button type="button" class="sm" data-act="slots" data-d="-0.5" aria-label="Menos espaço">−</button>
        <span class="disp" style="font-size:17px;font-weight:700;width:32px;text-align:center">${String(ui.novo.espacos).replace('.', ',')}</span>
        <button type="button" class="sm" data-act="slots" data-d="0.5" aria-label="Mais espaço">+</button></div>
      <button class="primary" type="submit">Guardar na mochila</button></form>` : ''}`;
}

function tabNotes(cid) {
  const d = S.chars[cid].data, edit = canEdit(cid);
  return `<label class="lbl" for="notas-${cid}">Anotações do personagem</label>
    <p class="small muted" style="margin:0 2px">A mesa toda consegue ler. Salva sozinho quando você sai do campo.</p>
    <textarea class="field" id="notas-${cid}" style="min-height:320px" data-save="notes" data-c="${cid}" ${edit ? '' : 'readonly'} placeholder="NPCs, pistas, lugares, dívidas…">${esc(d.notes || '')}</textarea>`;
}

// ---------- grupo ----------
function partyCard(cid, gm = false) {
  const c = S.chars[cid], d = c.data;
  const hp = num(d.hp), maxHp = Math.max(1, num(d.maxHp, 1)), mp = num(d.mp), maxMp = num(d.maxMp);
  const owner = S.members.find((m) => m.character_id === cid);
  const conds = (d.conditions || []).map((x) => `<span class="cond" style="min-height:28px;font-size:12px">${esc(x)}</span>`).join('');
  return `<div class="card pc">
    <div class="row">
      <a href="#/ficha/${cid}" class="petbox" style="width:56px;height:56px;text-decoration:none" aria-label="Abrir ficha de ${esc(c.name)}">${petHTML(cid, 52, hp <= 0)}</a>
      <div style="flex:1;min-width:0">
        <div class="row" style="justify-content:space-between"><a href="#/ficha/${cid}" style="color:var(--txt);font-weight:700;text-decoration:none">${esc(c.name)}</a><span class="small muted">Def ${esc(d.def)}</span></div>
        <div class="small muted" style="font-size:12px">${esc(d.className)} ${esc(d.level)}${owner ? ' · ' + esc(owner.display_name) : ' · sem jogador'}</div>
        <div class="row" style="gap:8px;margin-top:5px"><div class="mini-track"><i style="width:${Math.max(0, Math.min(100, hp / maxHp * 100))}%;background:var(--red)"></i></div><span class="disp small" style="width:52px;text-align:right">${hp}/${maxHp}</span></div>
        <div class="row" style="gap:8px;margin-top:3px"><div class="mini-track"><i style="width:${maxMp ? Math.max(0, Math.min(100, mp / maxMp * 100)) : 0}%;background:var(--blue)"></i></div><span class="disp small" style="width:52px;text-align:right">${mp}/${maxMp}</span></div>
      </div>
    </div>
    ${conds ? `<div class="row" style="flex-wrap:wrap;gap:4px">${conds}</div>` : ''}
    ${gm ? `<div class="row" style="gap:6px;flex-wrap:wrap">
      <button class="ghost" data-act="vitalSet" data-c="${cid}" data-k="hp">Dano / cura</button>
      <button class="ghost" data-act="vital" data-c="${cid}" data-k="mp" data-d="-1">−1 PM</button>
      <button class="ghost" data-act="vital" data-c="${cid}" data-k="mp" data-d="1">+1 PM</button>
      <button class="ghost" data-act="condAdd" data-c="${cid}">Condição</button></div>` : ''}
  </div>`;
}
function viewParty() {
  return `<header class="topbar"><div class="brand">${esc(S.settings.campaign?.name || 'POR UM FIO').toUpperCase()}</div></header>
    <div class="page"><h1 class="disp" style="margin:4px 2px 2px;font-size:26px">O grupo</h1>${S.order.map((id) => partyCard(id)).join('')}</div>`;
}

// ---------- mestre ----------
function viewGM() {
  return `<header class="topbar"><div class="row"><div class="petbox" style="width:48px;height:48px">${petHTML('pato', 44)}</div><div><div class="brand">ÁREA DO MESTRE</div><div class="disp" style="font-size:20px;font-weight:700">${esc(S.settings.campaign?.name || 'Por Um Fio')}</div></div></div></header>
    <div class="page">
      <div class="row" style="flex-wrap:wrap;gap:8px">
        <a class="use" style="display:inline-flex;align-items:center;text-decoration:none;height:40px" href="#/mesa">Abrir a mesa</a>
        <button class="ghost" data-act="restAll">Descanso: recuperar tudo</button>
        <button class="ghost" data-act="initAll">Rolar iniciativa do grupo</button>
      </div>
      <div class="party">${S.order.map((id) => partyCard(id, true)).join('')}</div>
      <label class="lbl" for="gmnote" style="margin-top:8px">Só para o mestre</label>
      <textarea class="field" id="gmnote" data-save="gmnote" style="min-height:180px" placeholder="Segredos, ganchos, nomes de NPC… ninguém da mesa vê.">${esc(S.gmNote?.body || '')}</textarea>
    </div>`;
}

// ---------- mais ----------
function viewMore() {
  const char = S.me.character_id ? S.chars[S.me.character_id] : null;
  return `<header class="topbar"><div class="brand">POR UM FIO</div></header>
    <div class="page">
      <div class="card row">
        <div class="petbox" style="width:56px;height:56px">${petHTML(char ? char.id : 'pato', 52)}</div>
        <div style="flex:1"><div style="font-weight:700;font-size:17px">${esc(S.me.display_name)}</div>
        <div class="small muted">${PAPEL[S.me.role]}${char ? ' · ' + esc(char.name) : ''}</div>
        <div class="small muted" style="font-size:12px">${esc(S.session.user.email)}</div></div>
      </div>
      ${installBanner(true)}
      <button class="ghost" style="height:48px" data-act="logout">Sair desta conta</button>
      ${isAdmin() ? `<a class="adm-link" href="#/admin"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></svg>administração</a>` : ''}
    </div>`;
}

// ---------- admin ----------
function inviteLink(token) { return new URL('#/convite/' + token, location.href.split('#')[0]).href; }
function viewAdmin() {
  const charOpts = (sel) => `<option value="">— nenhum —</option>` + S.order.map((id) => `<option value="${id}" ${sel === id ? 'selected' : ''}>${esc(S.chars[id].name)}</option>`).join('');
  const roleOpts = (sel) => Object.entries(PAPEL).map(([k, v]) => `<option value="${k}" ${sel === k ? 'selected' : ''}>${v}</option>`).join('');
  const members = S.members.map((m) => `<tr>
      <td><b>${esc(m.display_name)}</b>${m.user_id === S.me.user_id ? ' <span class="small muted">(você)</span>' : ''}</td>
      <td><label class="sr" for="r-${m.user_id}">Papel</label><select class="field" id="r-${m.user_id}" style="min-height:40px" data-change="role" data-u="${m.user_id}" ${m.user_id === S.me.user_id ? 'disabled' : ''}>${roleOpts(m.role)}</select></td>
      <td><label class="sr" for="c-${m.user_id}">Personagem</label><select class="field" id="c-${m.user_id}" style="min-height:40px" data-change="char" data-u="${m.user_id}">${charOpts(m.character_id)}</select></td>
      <td style="white-space:nowrap"><button class="link" data-act="resetPass" data-u="${m.user_id}">Trocar senha</button>${m.user_id === S.me.user_id ? '' : ` · <button class="link danger" data-act="removeUser" data-u="${m.user_id}">Remover</button>`}</td></tr>`).join('');
  const invites = S.invites.map((iv) => {
    const st = iv.revoked ? 'cancelado' : iv.used_at ? 'usado' : 'aguardando';
    const who = iv.character_id ? S.chars[iv.character_id]?.name : '—';
    return `<tr><td><b>${esc(iv.label)}</b></td><td>${PAPEL[iv.role]}</td><td>${esc(who)}</td><td>${st}</td>
      <td style="white-space:nowrap">${st === 'aguardando' ? `<button class="link" data-act="copyInvite" data-t="${iv.token}">Copiar link</button> · <button class="link danger" data-act="revokeInvite" data-t="${iv.token}">Cancelar</button>` : ''}</td></tr>`;
  }).join('');
  return `<header class="topbar"><div class="brand">ADMINISTRAÇÃO</div><a class="link" href="#/mais">Voltar</a></header>
    <div class="page">
      <p class="small muted" style="margin:0 2px">Só você vê esta área. Aqui dá para mexer em tudo do app.</p>
      <h2 class="lbl" style="margin-top:6px">Pessoas na mesa</h2>
      <div class="card scrollx"><table class="list"><thead><tr><th>Nome</th><th>Papel</th><th>Personagem</th><th></th></tr></thead><tbody>${members || '<tr><td colspan="4" class="muted">Ninguém se cadastrou ainda.</td></tr>'}</tbody></table></div>
      <h2 class="lbl" style="margin-top:10px">Convites</h2>
      <div class="card scrollx"><table class="list"><thead><tr><th>Para</th><th>Papel</th><th>Personagem</th><th>Situação</th><th></th></tr></thead><tbody>${invites}</tbody></table></div>
      <form class="card form" data-form="newInvite">
        <span class="lbl">Novo convite</span>
        <div class="grid3" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
          <div><label class="flab" for="ni-label">Para quem</label><input class="field" id="ni-label" name="label" required maxlength="40"></div>
          <div><label class="flab" for="ni-role">Papel</label><select class="field" id="ni-role" name="role">${roleOpts('player')}</select></div>
          <div><label class="flab" for="ni-char">Personagem</label><select class="field" id="ni-char" name="character_id">${charOpts('')}</select></div>
        </div>
        <button class="primary" type="submit">Criar convite</button>
      </form>
      <h2 class="lbl" style="margin-top:10px">Configurações</h2>
      <form class="card form" data-form="settings">
        <div><label class="flab" for="st-name">Nome da campanha</label><input class="field" id="st-name" name="name" value="${esc(S.settings.campaign?.name || 'Por Um Fio')}" maxlength="60"></div>
        <button class="primary" type="submit">Salvar</button>
      </form>
    </div>`;
}

// ---------- modais ----------
function renderModal() {
  const root = $('#modal-root');
  const m = ui.modal;
  if (!m) { root.innerHTML = ''; return; }
  let body = '';
  if (m.type === 'installHelp') {
    body = isIOS()
      ? `<h2>Instalar no iPhone</h2><ol class="when" style="margin:0;padding-left:20px;line-height:1.7">
          <li>Abra este site no <b>Safari</b>.</li><li>Toque em <b>Compartilhar</b> (o quadrado com a seta para cima).</li>
          <li>Role e toque em <b>Adicionar à Tela de Início</b>.</li><li>Toque em <b>Adicionar</b>.</li></ol>`
      : `<h2>Instalar no celular</h2><ol class="when" style="margin:0;padding-left:20px;line-height:1.7">
          <li>Abra este site no <b>Chrome</b>.</li><li>Toque nos <b>três pontinhos</b> no canto de cima.</li>
          <li>Toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</li></ol>`;
    body += `<button class="primary" data-act="closeModal">Entendi</button>`;
  }
  if (m.type === 'vital') {
    const c = S.chars[m.cid], label = m.k === 'hp' ? 'PV' : 'PM';
    body = `<h2>${esc(c.name)}: ${label}</h2>
      <p class="small muted" style="margin:0">Agora: ${num(c.data[m.k])} de ${num(c.data[m.k === 'hp' ? 'maxHp' : 'maxMp'])}</p>
      <form class="form" data-form="vital" data-c="${m.cid}" data-k="${m.k}">
        <div><label class="flab" for="vt-n">Quantidade</label><input class="field" id="vt-n" name="n" type="number" inputmode="numeric" min="0" max="999" required autofocus></div>
        <div class="grid3">
          <button class="roll" type="submit" name="mode" value="minus" style="height:48px">${m.k === 'hp' ? 'Dano' : 'Gastar'}</button>
          <button class="use" type="submit" name="mode" value="plus" style="height:48px">${m.k === 'hp' ? 'Cura' : 'Recuperar'}</button>
          <button class="ghost" type="submit" name="mode" value="set" style="height:48px">Definir</button>
        </div></form>
      <button class="link" data-act="closeModal">Cancelar</button>`;
  }
  if (m.type === 'money') {
    const c = S.chars[m.cid];
    body = `<h2>Tibares de ${esc(c.name)}</h2>
      <form class="form" data-form="money" data-c="${m.cid}">
        <div><label class="flab" for="mn-n">Quantidade</label><input class="field" id="mn-n" name="n" type="number" inputmode="numeric" min="0" required autofocus></div>
        <div class="grid3">
          <button class="roll" type="submit" name="mode" value="minus" style="height:48px">Gastar</button>
          <button class="use" type="submit" name="mode" value="plus" style="height:48px">Ganhar</button>
          <button class="ghost" type="submit" name="mode" value="set" style="height:48px">Definir</button>
        </div></form>
      <button class="link" data-act="closeModal">Cancelar</button>`;
  }
  if (m.type === 'cond') {
    const c = S.chars[m.cid], has = c.data.conditions || [];
    body = `<h2>Condição em ${esc(c.name)}</h2>
      <div class="row" style="flex-wrap:wrap;gap:6px">${CONDICOES.filter((x) => !has.includes(x)).map((x) => `<button class="addcond" data-act="condOn" data-c="${m.cid}" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>
      <button class="link" data-act="closeModal">Fechar</button>`;
  }
  if (m.type === 'cast' || m.type === 'power') body = castBody(m);
  if (!body && mesa) body = mesa.modalBody(m) || '';
  root.innerHTML = `<div class="scrim" data-act="scrim"><div class="sheet" role="dialog" aria-modal="true">${body}</div></div>`;
  const f = root.querySelector('[autofocus]'); if (f) setTimeout(() => f.focus(), 30);
}

function castState(m) {
  const c = S.chars[m.cid], d = c.data, lvl = num(d.level, 1), mp = num(d.mp);
  let title, base, opts, summary;
  if (m.type === 'cast') {
    const sp = (S.spells[m.cid] || []).find((s) => String(s.id) === String(m.sid));
    const info = lerMagia(sp, d);
    title = sp.name; base = info.custoBase; summary = info.principal;
    opts = info.aprimoramentos.map((a) => ({ ...a, max: a.repetivel ? 9 : 1 }));
  } else {
    const inf = infoPoder(m.name);
    title = m.name; base = inf.pm || 0; summary = inf.quando;
    opts = (inf.extras || []).map((x, i) => {
      let max = x.repetivel ? 9 : 1, bloqueio = '';
      if (x.aCadaNiveis) { max = Math.floor(lvl / x.aCadaNiveis); if (!max) bloqueio = `Libera no nível ${x.aCadaNiveis}`; }
      if (x.limite) max = Math.max(0, num(d.attrs?.[x.limite]));
      return { id: i, pm: x.pm, texto: x.texto, bloqueio, max };
    });
  }
  const sel = m.sel || {};
  const total = base + opts.reduce((a, o) => a + (sel[o.id] || 0) * o.pm, 0);
  return { c, d, lvl, mp, title, base, opts, sel, total, summary };
}
function castBody(m) {
  const st = castState(m);
  const limit = st.lvl;
  const tooMuch = st.total > limit, noMana = st.total > st.mp, nothing = st.total === 0 && m.type === 'power' && !st.base;
  const opts = st.opts.map((o) => {
    const n = st.sel[o.id] || 0, off = !!o.bloqueio;
    const ctrl = off ? '' : o.max > 1
      ? `<div class="row" style="gap:6px"><button class="sm" data-act="optDec" data-o="${o.id}" aria-label="Menos">−</button><span class="disp" style="width:20px;text-align:center;font-weight:700">${n}</span><button class="sm" data-act="optInc" data-o="${o.id}" data-max="${o.max}" aria-label="Mais">+</button></div>`
      : `<input type="checkbox" class="chk" data-act="optToggle" data-o="${o.id}" ${n ? 'checked' : ''} aria-label="Usar este aprimoramento">`;
    return `<div class="opt ${off ? 'off' : ''}"><span class="chip c-pm" style="margin-top:3px">+${o.pm}</span><div class="t">${esc(o.texto)}${off ? `<span class="why">${esc(o.bloqueio)}</span>` : ''}</div>${ctrl}</div>`;
  }).join('');
  let warn = '';
  if (tooMuch) warn = `No nível ${st.lvl} o máximo é ${limit} PM de uma vez.`;
  else if (noMana) warn = `Você só tem ${st.mp} PM. Descanse para recuperar.`;
  return `<h2>${esc(st.title)}</h2>
    ${st.summary ? `<p class="when" style="margin:0">${esc(st.summary)}</p>` : ''}
    ${st.opts.length ? `<span class="lbl">${m.type === 'cast' ? 'Aprimoramentos' : 'Gastar PM a mais'}</span>${opts}` : ''}
    <div class="total"><span>Custo total<br><span class="small muted">você tem ${st.mp} PM</span></span><b>${st.total} PM</b></div>
    ${warn ? `<div class="err">${warn}</div>` : ''}
    <button class="primary" data-act="confirmCast" ${tooMuch || noMana || nothing ? 'disabled' : ''}>${m.type === 'cast' ? 'Lançar' : 'Usar'} gastando ${st.total} PM</button>
    <button class="link" data-act="closeModal">Cancelar</button>`;
}

// ---------- ações ----------
const actions = {
  closeRoll() { ui.roll = null; renderRoll(); },
  closeModal() { ui.modal = null; renderModal(); if (ui.pendingRender) render(); },
  scrim(el, ev) { if (ev.target === el) actions.closeModal(); },
  async logout() { await sb.auth.signOut(); S.session = null; S.me = null; location.hash = '#/'; render(); },
  install() { doInstall(); },
  installOff() { ui.installDismissed = true; lsSet('pf-install-off', '1'); render(); },
  tab(el) { ui.tab[el.dataset.c] = el.dataset.t; render(); },
  toggle(el) { ui.open[el.dataset.k] = !ui.open[el.dataset.k]; render(); },
  test(el) { test(el.dataset.title, num(el.dataset.b)); },
  attack(el) { const a = attackInfo(S.chars[el.dataset.c].data.attacks[+el.dataset.i]); test(a.name, a.b, a.critOn); },
  damage(el) {
    const a = attackInfo(S.chars[el.dataset.c].data.attacks[+el.dataset.i]);
    const r = rollDice(a.dmg); if (!r) return toast('Não entendi o dano dessa arma.');
    showRoll({ title: 'Dano: ' + a.name, n: r.total, detail: a.dmg + ' → ' + r.text });
  },
  vital(el) {
    const c = S.chars[el.dataset.c], k = el.dataset.k, max = num(c.data[k === 'hp' ? 'maxHp' : 'maxMp']);
    const v = Math.min(max, Math.max(k === 'hp' ? -max : 0, num(c.data[k]) + num(el.dataset.d)));
    patch(c.id, { [k]: v });
  },
  vitalSet(el) { ui.modal = { type: 'vital', cid: el.dataset.c, k: el.dataset.k }; renderModal(); },
  money(el) { const c = S.chars[el.dataset.c]; patch(c.id, { money: Math.max(0, num(c.data.money) + num(el.dataset.d)) }); },
  moneySet(el) { ui.modal = { type: 'money', cid: el.dataset.c }; renderModal(); },
  condAdd(el) { ui.modal = { type: 'cond', cid: el.dataset.c }; renderModal(); },
  condOn(el) { const c = S.chars[el.dataset.c]; ui.modal = null; renderModal(); patch(c.id, { conditions: [...(c.data.conditions || []), el.dataset.v] }); },
  condOff(el) { const c = S.chars[el.dataset.c]; patch(c.id, { conditions: (c.data.conditions || []).filter((x) => x !== el.dataset.v) }); },
  itemQty(el) {
    const c = S.chars[el.dataset.c], i = +el.dataset.i, items = (c.data.items || []).map((x) => [...x]);
    const q = num(items[i][3], 1) + num(el.dataset.d);
    if (q <= 0) { if (!confirm(`Tirar "${items[i][0]}" da mochila?`)) return; items.splice(i, 1); } else items[i][3] = q;
    patch(c.id, { items });
  },
  slots(el) { ui.novo.espacos = Math.max(0, ui.novo.espacos + num(el.dataset.d)); render(); },
  cast(el) { ui.modal = { type: 'cast', cid: el.dataset.c, sid: el.dataset.s, sel: {} }; renderModal(); },
  usePower(el) { ui.modal = { type: 'power', cid: el.dataset.c, name: el.dataset.n, sel: {} }; renderModal(); },
  optInc(el) { const s = ui.modal.sel; const o = el.dataset.o; s[o] = Math.min(num(el.dataset.max, 9), (s[o] || 0) + 1); renderModal(); },
  optDec(el) { const s = ui.modal.sel; const o = el.dataset.o; s[o] = Math.max(0, (s[o] || 0) - 1); renderModal(); },
  optToggle(el) { const s = ui.modal.sel; s[el.dataset.o] = el.checked ? 1 : 0; renderModal(); },
  confirmCast() {
    const st = castState(ui.modal);
    const cid = ui.modal.cid;
    ui.modal = null; renderModal();
    patch(cid, { mp: st.mp - st.total });
    showRoll({ title: st.title, n: '−' + st.total, small: true, detail: `${st.total} PM gastos. Agora: ${st.mp - st.total} PM.` });
  },
  async restAll() {
    if (!confirm('Recuperar todos os PV e PM do grupo e limpar as condições?')) return;
    for (const id of S.order) { const d = S.chars[id].data; await patch(id, { hp: num(d.maxHp), mp: num(d.maxMp), conditions: [] }, true); }
    toast('Grupo descansado.');
  },
  initAll() {
    const r = S.order.map((id) => { const d = S.chars[id].data; const b = skillVal(d, 'Iniciativa') ?? num(d.init); const x = d20(); return { n: S.chars[id].name, t: x + b }; }).sort((a, b) => b.t - a.t);
    showRoll({ title: 'Iniciativa', n: r[0]?.t ?? '', small: true, detail: r.map((x) => `${x.n} ${x.t}`).join(' · ') });
  },
  async copyInvite(el) {
    const link = inviteLink(el.dataset.t);
    try { await navigator.clipboard.writeText(link); toast('Link copiado!'); } catch { prompt('Copie o link:', link); }
  },
  async revokeInvite(el) {
    if (!confirm('Cancelar este convite? O link deixa de funcionar.')) return;
    const { error } = await sb.from('invites').update({ revoked: true }).eq('token', el.dataset.t);
    if (error) return toast('Não consegui cancelar.');
    await loadInvites(); render();
  },
  async resetPass(el) {
    const p = prompt('Nova senha (mínimo 6 caracteres):'); if (!p) return;
    const { data, error } = await sb.functions.invoke('convite', { body: { action: 'reset', user_id: el.dataset.u, password: p } });
    toast(error || data?.error ? (data?.error || 'Não consegui trocar.') : 'Senha trocada. Avise a pessoa.');
  },
  async removeUser(el) {
    const m = S.members.find((x) => x.user_id === el.dataset.u);
    if (!confirm(`Remover a conta de ${m?.display_name}? A ficha do personagem continua salva.`)) return;
    const { data, error } = await sb.functions.invoke('convite', { body: { action: 'remove', user_id: el.dataset.u } });
    if (error || data?.error) return toast(data?.error || 'Não consegui remover.');
    S.members = S.members.filter((x) => x.user_id !== el.dataset.u); render(); toast('Conta removida.');
  },
};

const forms = {
  async login(f) {
    const err = $('#lg-err'); err.textContent = '';
    const { error } = await sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.password.value });
    if (error) { err.textContent = 'E-mail ou senha não conferem.'; return; }
  },
  async accept(f) {
    const err = $('#iv-err'); err.textContent = '';
    const btn = f.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Criando…';
    const body = { action: 'accept', token: f.dataset.token, name: f.name.value, email: f.email.value, password: f.password.value };
    const { data, error } = await sb.functions.invoke('convite', { body });
    if (error || data?.error) {
      let msg = data?.error;
      if (!msg && error?.context?.json) { try { msg = (await error.context.json()).error; } catch {} }
      err.textContent = msg || 'Não consegui criar a conta. Tente de novo.';
      btn.disabled = false; btn.textContent = 'Criar conta e entrar'; return;
    }
    const { error: e2 } = await sb.auth.signInWithPassword({ email: body.email.trim().toLowerCase(), password: body.password });
    if (e2) { err.textContent = 'Conta criada! Agora entre com seu e-mail e senha.'; location.hash = '#/'; return; }
    location.hash = '#/';
  },
  vital(f, sub) {
    const c = S.chars[f.dataset.c], k = f.dataset.k, n = Math.abs(num(f.n.value)), mode = sub?.value || 'minus';
    const max = num(c.data[k === 'hp' ? 'maxHp' : 'maxMp']);
    let v = num(c.data[k]);
    v = mode === 'minus' ? v - n : mode === 'plus' ? v + n : n;
    v = Math.min(max, Math.max(k === 'hp' ? -max : 0, v));
    ui.modal = null; renderModal();
    patch(c.id, { [k]: v });
  },
  money(f, sub) {
    const c = S.chars[f.dataset.c], n = Math.abs(num(f.n.value)), mode = sub?.value || 'minus';
    let v = num(c.data.money); v = mode === 'minus' ? v - n : mode === 'plus' ? v + n : n;
    ui.modal = null; renderModal();
    patch(c.id, { money: Math.max(0, v) });
  },
  addItem(f) {
    const nome = ui.novo.nome.trim(); if (!nome) return toast('Escreva o nome do item.');
    const c = S.chars[f.dataset.c];
    const items = [...(c.data.items || []), [nome, ui.novo.espacos, '', 1]];
    ui.novo = { nome: '', espacos: 1 };
    patch(c.id, { items });
  },
  async newInvite(f) {
    const row = { label: f.label.value.trim(), role: f.role.value, character_id: f.character_id.value || null };
    const { data, error } = await sb.from('invites').insert(row).select().single();
    if (error) return toast('Não consegui criar o convite.');
    await loadInvites(); render();
    try { await navigator.clipboard.writeText(inviteLink(data.token)); toast('Convite criado e link copiado!'); } catch { toast('Convite criado.'); }
  },
  async settings(f) {
    const value = { ...(S.settings.campaign || {}), name: f.name.value.trim() || 'Por Um Fio' };
    const { error } = await sb.from('app_settings').upsert({ key: 'campaign', value, updated_at: new Date().toISOString() });
    if (error) return toast('Não consegui salvar.');
    S.settings.campaign = value; toast('Salvo.'); render();
  },
};

// ---------- eventos ----------
document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-act]');
  if (!el || el.tagName === 'INPUT') return;
  const fn = actions[el.dataset.act];
  if (fn) { if (el.dataset.act !== 'scrim') ev.preventDefault(); fn(el, ev); }
});
document.addEventListener('change', async (ev) => {
  const el = ev.target;
  if (el.dataset.act === 'optToggle') return actions.optToggle(el);
  if (el.dataset.change === 'role' || el.dataset.change === 'char') {
    const field = el.dataset.change === 'role' ? 'role' : 'character_id';
    const value = el.value || null;
    const { error } = await sb.from('profiles').update({ [field]: value }).eq('user_id', el.dataset.u);
    if (error) { toast(field === 'character_id' ? 'Esse personagem já tem outro jogador.' : 'Não consegui salvar.'); }
    else { const m = S.members.find((x) => x.user_id === el.dataset.u); if (m) m[field] = value; toast('Salvo.'); }
    render();
  }
});
document.addEventListener('input', (ev) => {
  if (ev.target.dataset.in === 'novoNome') ui.novo.nome = ev.target.value;
});
document.addEventListener('focusout', async (ev) => {
  const el = ev.target;
  if (el.dataset?.save === 'notes') {
    const c = S.chars[el.dataset.c];
    if (c && (c.data.notes || '') !== el.value) await patch(c.id, { notes: el.value }, true).then(() => toast('Anotação salva.'));
  }
  if (el.dataset?.save === 'gmnote' && S.gmNote && S.gmNote.body !== el.value) {
    const body = el.value;
    const { error } = await sb.from('gm_notes').update({ body, updated_at: new Date().toISOString(), updated_by: S.session.user.id }).eq('id', S.gmNote.id);
    if (error) toast('Não consegui salvar a anotação.'); else { S.gmNote.body = body; toast('Anotação salva.'); }
  }
  setTimeout(() => { if (ui.pendingRender && !(document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) render(); }, 50);
});
document.addEventListener('submit', (ev) => {
  const f = ev.target, fn = forms[f.dataset.form];
  if (!fn) return;
  ev.preventDefault();
  fn(f, ev.submitter);
});
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && ui.modal) actions.closeModal(); });
window.addEventListener('hashchange', () => { ui.modal = null; render(); window.scrollTo(0, 0); });
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; });
window.addEventListener('appinstalled', () => { toast('App instalado!'); render(); });

mesa = installMesa({ S, ui, sb, esc, num, toast, render, renderModal, actions, forms, CONDICOES });

// ---------- início ----------
async function boot() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  const { data } = await sb.auth.getSession();
  S.session = data.session;
  if (S.session) { await loadAll(); subscribe(); }
  render();
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && (!S.session || S.session.user.id !== session.user.id)) {
      S.session = session; await loadAll(); subscribe(); render();
    } else if (event === 'SIGNED_OUT') {
      S.session = null; S.me = null; render();
    } else if (session) S.session = session;
  });
}
boot();
