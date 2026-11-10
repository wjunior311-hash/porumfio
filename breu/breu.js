import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import * as R from './regras.js?v=4';
import * as M from './mestre-dados.js';
import * as CT from './conteudo.js';
import { ligado as fisico, chaveHtml as fisicoHtml, pedirDados, quandoMudar } from './fisico.js?v=1';
import { criarMapa } from './mapa.js?v=39';
import { criarMesa } from './mesa.js?v=31';

// Mesmo projeto e mesmas contas do Por Um Fio; as tabelas do Breu são separadas (breu_*).
const SUPABASE_URL = 'https://pziqkepgluxvdikllfwq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_J0n__8-3G6Tf6rnz4Xu_7A_uLIbfKbJ';
const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } });

const S = { session: null, me: null, chars: [], members: [], invites: [], notes: {}, rolls: [], noite: null, mesa: {}, pedido: null, guia: null, video: null, ready: false };
const ui = { invite: null, inviteErr: '', loginErr: '', busy: false, saved: '' };

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (v) => (v >= 0 ? '+' + v : String(v));
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600);
}
const role = () => S.me?.role;
const isGM = () => role() === 'gm' || role() === 'admin';
const isAdmin = () => role() === 'admin';
const PAPEL = { player: 'Jogador', gm: 'Mestre', admin: 'Administrador' };
const STATUS = { rascunho: 'Rascunho', pronto: 'Enviado ao mestre', aprovado: 'Aprovado' };
const memberName = (uid) => S.members.find((m) => m.user_id === uid)?.display_name || 'Alguém';
const charById = (id) => S.chars.find((c) => c.id === id);
const canEdit = (c) => c && (c.owner === S.session?.user.id || isGM());
// a criação fica aberta até o mestre aprovar; depois, a ficha muda só pelos marcos
const canEditCreation = (c) => c && (isGM() || (c.owner === S.session?.user.id && c.status !== 'aprovado'));

const MAPA = criarMapa({ sb, S, isGM: () => isGM(), esc, toast, picOf: (p) => picOf(p), picChar: (c) => picChar(c), estCls: (c) => estCls(c), charById: (id) => charById(id), rerender: () => rerender(),
  onCenas: () => MESA?.pintarTopo(), onSel: () => {},
  animar: (r) => MESA?.animar(r), efeito: (e) => MESA?.efeito(e), noite: () => S.noite,
  ferir: (c, dano, txt) => { S.noite ||= novaNoite(); const t = trackerDe(c); t.sangue = Math.max(0, t.sangue - dano); logNoite(txt); salvarNoite(); MESA?.repintar(); },
  forcaCirculo: (v, txt) => { S.noite ||= novaNoite(); S.noite.circulo = v; if (txt) logNoite(txt); salvarNoite(); MESA?.repintar(); } });
let MESA = null;
quandoMudar(() => { if (route().name === 'ficha') rerender(); });
function criarAMesa() {
  MESA = criarMesa({ sb, S, esc, toast, isGM: () => isGM(), MAPA, route: () => route(), go: (p) => go(p), rerender: () => rerender(),
    charById: (id) => charById(id), picChar: (c) => picChar(c), estCls: (c) => estCls(c), estadoDe: (c) => estadoDe(c), ESTADOS,
    trackerDe: (c) => trackerDe(c), garantirNoite: () => { S.noite ||= novaNoite(); }, virarFase: () => virarFase(), salvarNoite: () => salvarNoite(),
    registrar: (c, l, r, d) => registrar(c, l, r, d), logNoite: (t) => logNoite(t) });
}
// repinta a tela certa: a mesa do mestre se repinta por partes, o resto recarrega
function rr() { if (route().name === 'mapa' && MESA) { MESA.repintar(); MAPA.redraw(); } else rerender(); }

// ---------- rotas ----------
function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const [name, arg, arg2] = h.split('/');
  return { name: name || '', arg: arg ? decodeURIComponent(arg) : '', arg2: arg2 || '' };
}
const go = (p) => { location.hash = '#/' + p; };

// ---------- dados ----------
async function loadAll() {
  const uid = S.session.user.id;
  const { data: me } = await sb.from('breu_members').select('*').eq('user_id', uid).maybeSingle();
  S.me = me;
  if (!me) return;
  const [chars, members] = await Promise.all([
    sb.from('breu_characters').select('*').order('created_at'),
    sb.from('breu_members').select('user_id, display_name, role, created_at').order('created_at'),
  ]);
  S.chars = (chars.data || []).map((c) => ({ ...c, data: R.norm(c.data || {}) }));
  S.members = members.data || [];
  const nt = await sb.from('breu_state').select('*').in('key', ['noite', 'mesa', 'pedido', 'guia', 'video']);
  const est = Object.fromEntries((nt.data || []).map((r) => [r.key, r.value]));
  S.noite = est.noite || null; S.mesa = est.mesa || {}; S.pedidos = est.pedido?.lista || (est.pedido?.id ? [est.pedido] : []); S.guia = est.guia || null; S.video = est.video || null;
  if (S.video?.id) S.videoVisto = S.video.id; // um vídeo que já passou não volta a tocar ao abrir o app
  const rl = await sb.from('breu_rolls').select('*').order('created_at', { ascending: false }).limit(30);
  S.rolls = rl.data || [];
  if (isGM()) {
    const { data } = await sb.from('breu_gm_notes').select('*');
    S.notes = Object.fromEntries((data || []).map((n) => [n.character_id, n.note]));
  }
  if (isAdmin()) await loadInvites();
}
async function loadInvites() {
  const { data } = await sb.from('breu_invites').select('*').order('created_at', { ascending: false });
  S.invites = data || [];
}

let channel = null;
function subscribe() {
  if (channel) sb.removeChannel(channel);
  channel = sb.channel('breu')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'breu_characters' }, (p) => {
      if (p.eventType === 'DELETE') S.chars = S.chars.filter((c) => c.id !== p.old.id);
      else {
        p.new.data = R.norm(p.new.data || {});
        const i = S.chars.findIndex((c) => c.id === p.new.id);
        if (i < 0) S.chars.push(p.new);
        else if (route().name !== 'criar' || route().arg !== p.new.id) S.chars[i] = p.new;
      }
      if (!['criar', 'evoluir'].includes(route().name) || (route().name === 'evoluir' && !ui.evo?.tipo)) rerender();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'breu_cenas' }, (p) => MAPA.onCena(p))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'breu_tokens' }, (p) => MAPA.onToken(p))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'breu_state' }, (p) => {
      if (p.new?.key === 'cena') { MAPA.onAtiva(p.new.value); return; }
      if (p.new?.key === 'mesa') { S.mesa = p.new.value || {}; return; }
      if (p.new?.key === 'pedido') { MESA.onPedido(p.new.value); return; }
      if (p.new?.key === 'guia') { MESA.onGuia(p.new.value); return; }
      if (p.new?.key === 'video') { MESA.onVideo(p.new.value); return; }
      if (p.new?.key !== 'noite') return;
      if (noiteSalvando) return;
      S.noite = p.new.value; if (['', 'noite'].includes(route().name)) rerender();
      else if (route().name === 'ficha') { const c = charById(route().arg), im = document.querySelector('.sheet-head .pic img'); if (c && im) im.src = picChar(c); } else if (route().name === 'mapa') { MAPA.redraw(); MESA.onNoite(); }
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'breu_rolls' }, (p) => {
      if (S.rolls.some((r) => r.id === p.new.id)) return;
      S.rolls.unshift(p.new); S.rolls = S.rolls.slice(0, 40);
      if (route().name === '') rerender();
      MESA.onRoll(p.new);
    })
    .subscribe();
}

// ---------- salvar personagem (com espera curta) ----------
const pending = {};
function saveSoon(c) {
  ui.saved = 'Salvando…'; paintSaved();
  clearTimeout(pending[c.id]);
  pending[c.id] = setTimeout(() => saveNow(c), 700);
}
async function saveNow(c) {
  clearTimeout(pending[c.id]);
  const { error } = await sb.rpc('breu_patch', { cid: c.id, patch: c.data });
  ui.saved = error ? 'Não consegui salvar. Confira sua internet.' : 'Salvo';
  paintSaved();
  return !error;
}
function paintSaved() { const el = $('.saved'); if (el) el.textContent = ui.saved; }

// ---------- render ----------
function render() {
  const r = route();
  const app = $('#app');
  let html = '';
  app.classList.toggle('wide', r.name === 'admin');
  const gmMesa = r.name === 'mapa' && S.me && MESA?.desktop();
  const jogMesa = r.name === 'mapa' && S.me && MESA?.jogDesktop();
  app.classList.toggle('mapa', r.name === 'mapa' && !gmMesa && !jogMesa);
  app.classList.toggle('mesa-gm', !!(gmMesa || jogMesa));
  // no computador, as telas de leitura ficam mais largas
  app.classList.toggle('largo', ['', 'ficha', 'noite', 'prontos'].includes(r.name));
  if (r.name === 'convite') html = viewInvite(r.arg);
  else if (!S.session) html = viewLogin();
  else if (!S.me) html = viewNoMember();
  else if (r.name === 'criar' && charById(r.arg) && canEditCreation(charById(r.arg))) html = viewWizard(charById(r.arg), +r.arg2 || 0);
  else if (r.name === 'evoluir' && charById(r.arg) && canEdit(charById(r.arg))) html = viewEvoluir(charById(r.arg));
  else if (r.name === 'ficha' && charById(r.arg)) html = viewSheet(charById(r.arg));
  else if (r.name === 'admin' && isAdmin()) html = viewAdmin();
  else if (r.name === 'prontos') html = viewProntos();
  else if (r.name === 'noite' && isGM()) html = viewNoite();
  else if (r.name === 'mapa') html = gmMesa ? MESA.viewGM() : jogMesa ? MESA.viewJogador() : top() + MAPA.view() + MESA.dockWrap();
  else if (r.name === '') html = viewMesa();
  else { location.replace('#/'); return; }
  app.innerHTML = html;
  if (r.name === 'mapa' && S.me) { MAPA.mount(); MESA.mount(); } else MAPA.unmount();
}

function top(extra = '') {
  return `<header class="top"><a href="#/" aria-label="Início"><img src="img/logo-horizontal.webp" alt="Breu"></a>
    <div class="acts">${extra}<a class="btn sm ghost" href="#/mapa">${isGM() ? 'Mesa' : 'Mapa'}</a>${isGM() ? '<a class="btn sm ghost" href="#/noite">Montar noite</a>' : ''}${isAdmin() ? '<a class="btn sm ghost" href="#/admin">Convites</a>' : ''}<button class="btn sm ghost" data-act="logout">Sair</button></div></header>`;
}

// ---------- entrar ----------
function viewLogin() {
  return `<section class="auth">
    <img class="logo" src="img/logo-principal.webp" alt="Breu">
    <p class="tag">Um RPG de horror e sobrevivência</p>
    <form class="card form" data-form="login">
      <div><label class="flab" for="lg-email">E-mail</label><input class="field" id="lg-email" name="email" type="email" autocomplete="email" required></div>
      <div><label class="flab" for="lg-pass">Senha</label><input class="field" id="lg-pass" name="password" type="password" autocomplete="current-password" required></div>
      ${ui.loginErr ? `<p class="err" role="alert">${esc(ui.loginErr)}</p>` : ''}
      <button class="btn primary block" ${ui.busy ? 'disabled' : ''}>Entrar</button>
      <p class="small dim" style="margin:0;text-align:center">Ainda não tem conta? Peça o link de convite ao mestre.</p>
    </form>
    <a class="back" href="../">← Escolher outra mesa</a>
  </section>`;
}
function viewNoMember() {
  return `<section class="auth">
    <img class="logo" src="img/logo-principal.webp" alt="Breu">
    <div class="card"><h3>Você ainda não está nesta mesa</h3>
    <p class="muted" style="margin-top:8px">Sua conta existe, mas ainda não foi convidada para Breu. Peça o link de convite ao mestre e abra com esta mesma conta.</p>
    <button class="btn block" data-act="logout">Sair</button></div>
    <a class="back" href="../">← Escolher outra mesa</a>
  </section>`;
}

// ---------- convite ----------
function viewInvite(token) {
  if (!ui.invite || ui.invite.token !== token) {
    ui.invite = { token, loading: true };
    fn({ action: 'breu_peek', token }).then((r) => { ui.invite = { token, ...r }; render(); });
  }
  const inv = ui.invite;
  if (inv.loading) return `<div class="splash"><img src="img/logo-principal.webp" alt="Carregando"></div>`;
  if (inv.error) return `<section class="auth"><img class="logo" src="img/logo-principal.webp" alt="Breu"><div class="card"><h3>Convite indisponível</h3><p class="muted" style="margin-top:8px">${esc(inv.error)}</p><a class="btn block" href="#/">Ir para a entrada</a></div></section>`;
  const papel = inv.role === 'gm' ? ' como mestre' : '';
  if (S.session && S.me) {
    return `<section class="auth"><img class="logo" src="img/logo-principal.webp" alt="Breu"><div class="card"><h3>Você já está na mesa</h3><p class="muted" style="margin-top:8px">Esta conta já faz parte de Breu. Este convite pode ficar para outra pessoa.</p><a class="btn primary block" href="#/">Ir para a mesa</a></div></section>`;
  }
  if (S.session) {
    return `<section class="auth"><img class="logo" src="img/logo-principal.webp" alt="Breu"><p class="tag">Convite para a mesa${papel}</p>
      <div class="card form"><p style="margin:0">Você está entrando com <b>${esc(S.session.user.email)}</b>.</p>
      <div><label class="flab" for="iv-nome">Como quer ser chamado na mesa?</label><input class="field" id="iv-nome" value="${esc(S.session.user.user_metadata?.display_name || '')}"></div>
      ${ui.inviteErr ? `<p class="err" role="alert">${esc(ui.inviteErr)}</p>` : ''}
      <button class="btn primary block" data-act="joinLogged" ${ui.busy ? 'disabled' : ''}>Entrar na mesa com esta conta</button>
      <button class="btn ghost block" data-act="logout">Usar outra conta</button></div></section>`;
  }
  return `<section class="auth">
    <img class="logo" src="img/logo-principal.webp" alt="Breu">
    <p class="tag">Convite para a mesa${papel}</p>
    <form class="card form" data-form="accept">
      <p class="muted" style="margin:0">Crie sua conta para montar o seu personagem. Se você já joga no Por Um Fio, use o mesmo e-mail e a mesma senha.</p>
      <div><label class="flab" for="ac-nome">Seu nome</label><input class="field" id="ac-nome" name="name" autocomplete="name" required maxlength="60"></div>
      <div><label class="flab" for="ac-email">E-mail</label><input class="field" id="ac-email" name="email" type="email" autocomplete="email" required></div>
      <div><label class="flab" for="ac-pass">Senha</label><input class="field" id="ac-pass" name="password" type="password" autocomplete="new-password" minlength="6" required><p class="fhelp" style="margin:6px 0 0">Pelo menos 6 caracteres.</p></div>
      ${ui.inviteErr ? `<p class="err" role="alert">${esc(ui.inviteErr)}</p>` : ''}
      <button class="btn primary block" ${ui.busy ? 'disabled' : ''}>Entrar na mesa</button>
    </form>
  </section>`;
}

async function fn(body) {
  const { data: { session } } = await sb.auth.getSession();
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/convite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: 'Bearer ' + (session?.access_token || SUPABASE_KEY) },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return { error: j.error || 'Algo deu errado. Tente de novo.' };
    return j;
  } catch { return { error: 'Sem conexão. Confira sua internet.' }; }
}

// ---------- mesa ----------
function charCard(c) {
  const p = c.data || {}, of = R.oficioDe(p), or = R.origemDe(p);
  const sub = [of?.n, or?.n].filter(Boolean).join(' · ') || 'Começando a criação';
  const st = c.status || 'rascunho';
  const href = c.status === 'rascunho' && canEdit(c) ? `#/criar/${c.id}/0` : `#/ficha/${c.id}`;
  return `<a class="ccard" href="${href}">
    <div class="pic ${estCls(c)}${of ? '' : ' vazio'}">${of ? `<img src="${picChar(c)}" alt="">` : '?'}</div>
    <div><b>${esc(p.nome || 'Sem nome')}</b><span class="sub">${esc(sub)}</span><div class="small dim">${esc(memberName(c.owner))}${R.marcosGanhos(p) ? ` · ${R.marcosGanhos(p)} marco${R.marcosGanhos(p) > 1 ? 's' : ''}` : ''}</div>
    ${c.owner === S.session.user.id && (R.melhoriasPendentes(p) || R.precisaCaminho(p)) ? '<span class="badge">Pronto para evoluir</span>' : ''}</div>
    <span class="chip ${st}">${STATUS[st]}</span></a>`;
}
function viewMesa() {
  const uid = S.session.user.id;
  const meus = S.chars.filter((c) => c.owner === uid);
  const outros = S.chars.filter((c) => c.owner !== uid);
  const podeCriar = isGM() || meus.length === 0;
  return `${top()}
    <section class="hero"><p class="lbl">Olá, ${esc(S.me.display_name)}</p><h1>A mesa</h1></section>
    ${faixaNoite()}
    <a class="btn primary block mapa-cta" href="#/mapa">${isGM() ? 'Abrir a mesa do mestre' : 'Abrir o mapa da mesa'}</a>
    <div class="home"><div class="h-a">
    <h2>${isGM() && meus.length > 1 ? 'Seus personagens' : 'Seu personagem'}</h2>
    ${meus.length ? `<div class="chars">${meus.map(charCard).join('')}</div>` : `<div class="empty"><p>Você ainda não tem personagem.</p><p class="small">A criação leva uns 20 minutos e salva sozinha: dá para parar e voltar depois.</p></div>`}
    ${podeCriar ? `<button class="btn primary block" style="margin-top:12px" data-act="novo">${meus.length ? 'Criar outro personagem' : 'Criar meu personagem'}</button>
      <a class="btn block" style="margin-top:8px" href="#/prontos">Ou escolher um personagem pronto</a>` : ''}
    <h2>Antes de começar</h2>
    <div class="box">Pense em quem você é antes de pensar em números: de onde veio, o que faz, qual noite te mudou e quem você quer proteger. As regras se encaixam depois.</div>
    </div><div class="h-b">
    <h2>O grupo</h2>
    ${outros.length ? `<div class="chars">${outros.map(charCard).join('')}</div>` : `<p class="muted">Ninguém mais criou personagem ainda.</p>`}
    ${S.rolls.length ? `<h2>Rolagens da mesa</h2><div class="rolls">${S.rolls.slice(0, 12).map(rollRow).join('')}</div>` : ''}
    </div></div>`;
}

// ---------- painel do mestre: a noite ----------
let noiteSalvando = false;
const aprovados = () => S.chars.filter((c) => c.status === 'aprovado');
const naSessao = () => aprovados().filter((c) => !(S.mesa?.ausentes || []).includes(c.id));
const bestOf = (id) => M.BESTIARIO.find((b) => b.id === id);
function novaNoite() {
  const pjs = Math.max(1, naSessao().length || 4);
  return { tipo: 'dura', pjs, familias: [], fases: [[], [], [], []], fase: -1, pavorDif: 15, pressagio: null, paisagem: 'A terra seca', complicacao: null, circulo: 14, grupo: {}, log: [] };
}
async function salvarNoite() {
  noiteSalvando = true;
  const { error } = await sb.from('breu_state').upsert({ key: 'noite', value: S.noite, updated_at: new Date().toISOString() });
  setTimeout(() => { noiteSalvando = false; }, 600);
  if (error) toast('Não consegui salvar a noite.');
}
function logNoite(t) { S.noite.log.unshift({ t, em: Date.now() }); S.noite.log = S.noite.log.slice(0, 40); }
function trackerDe(c) {
  const b = R.barras(c.data);
  const t = (S.noite.grupo[c.id] ||= { sangue: b.sangue, prumo: b.prumo, pavor: 0, brasa: b.brasa });
  if (t.vigias == null) t.vigias = 25;
  return t;
}
function faixaNoite() {
  const n = S.noite;
  if (!n) return '';
  if ((n.fase < 0 || n.fase === 4) && (n.dia ?? -1) >= 0) return `<div class="faixa-noite"><span class="sol-f">${['🌅', '☀️', '🌤️', '🌇'][n.dia]}</span><div><span class="lbl">O dia agora</span><b>${CT.PARTES_DIA[n.dia].n}</b></div></div>`;
  if (n.fase < 0) return '';
  const f = M.FASES[n.fase];
  return `<div class="faixa-noite"><img src="img/fase-${f.k}.webp" alt=""><div><span class="lbl">A noite agora</span><b>${f.n}</b></div></div>`;
}

function viewNoite() {
  const n = (S.noite ||= novaNoite());
  const total = M.ameacaTotal(n.tipo, n.pjs), alvo = M.ameacaFase(total);
  const montar = `
    <h2>Montar a noite</h2>
    <div class="card form">
      <div><span class="flab">Tipo de noite</span><div class="sub-opts">${M.NOITES.map((x) => `<button class="pill${n.tipo === x.k ? ' sel' : ''}" data-nt="tipo" data-v="${x.k}">${x.n}</button>`).join('')}</div></div>
      <div class="ro-adj"><div><span class="flab">Personagens</span><p class="fhelp" style="margin:0">Sem ninguém com o Dom desperto, conte a noite um degrau abaixo.</p></div>
        <div class="stepper"><button data-nt-pjs="-1" aria-label="Menos">−</button><span class="v">${n.pjs}</span><button data-nt-pjs="1" aria-label="Mais">+</button></div></div>
      <div class="pool"><span class="lbl">Ameaça da noite</span><strong>${total}</strong></div>
      <div><span class="flab">Famílias (uma ou duas)</span><div class="sub-opts">${M.FAMILIAS.map((f) => `<button class="pill${n.familias.includes(f) ? ' sel' : ''}" data-nt-fam="${f}">${f}</button>`).join('')}</div></div>
      <button class="btn primary" data-act="sortear">Sortear Assombros</button>
    </div>
    <div class="fases-m">${M.FASES.slice(0, 4).map((f, i) => { const ids = n.fases[i] || [], c = M.custo(ids);
      return `<div class="fase-m${n.fase === i ? ' agora' : ''}"><div class="fm-head"><img src="img/fase-${f.k}.webp" alt=""><b>${f.n}</b><span class="${c === alvo[i] ? 'ok' : 'warn'}">${c} de ${alvo[i]}</span></div>
        ${ids.map((id, j) => { const b = bestOf(id); return `<div class="ass-m"><div><b>${esc(b.nome)}</b> <span class="dim small">${b.familia} · ${b.grau} · ${b.sentido}</span><div class="small">Sangue ${b.sangue} · Defesa ${b.defesa} · Ataque ${b.atq} · Dano ${b.dano}</div></div><button class="btn sm ghost" data-nt-rm="${i}:${j}" aria-label="Tirar">×</button></div>`; }).join('') || '<p class="small dim" style="margin:4px 0">Ninguém.</p>'}
        <select class="field sm" data-nt-add="${i}"><option value="">+ Pôr um Assombro…</option>${M.BESTIARIO.map((b) => `<option value="${b.id}">${b.nome} (${b.familia}, ${b.grau})</option>`).join('')}</select></div>`; }).join('')}</div>
    <h2>Presságio e complicação</h2>
    <div class="card form">
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button class="btn" data-act="pressagio">Rolar presságio</button>${n.pressagio ? `<span class="small"><b>${n.pressagio.r}:</b> ${esc(n.pressagio.t)} <span class="dim">(${esc(n.pressagio.s)})</span></span>` : ''}</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><select class="field sm" id="nt-pais" style="width:auto">${Object.keys(M.COMPLICACOES).map((k) => `<option ${n.paisagem === k ? 'selected' : ''}>${k}</option>`).join('')}</select><button class="btn" data-act="complicacao">Rolar complicação</button></div>
      ${n.complicacao ? `<p class="small" style="margin:0">${esc(n.complicacao)}</p>` : ''}
    </div>`;

  const dia = n.dia ?? -1;
  const diaHtml = `
    <h2>O dia</h2>
    <div class="relogio-m dia-m">${CT.PARTES_DIA.map((x, i) => `<button class="rm${i === dia ? ' on' : i < dia ? ' foi' : ''}" data-dia="${i}"><span class="sol">${['🌅', '☀️', '🌤️', '🌇'][i]}</span><span>${x.n}</span></button>`).join('')}</div>
    ${dia >= 0 ? `<div class="box">${esc(CT.PARTES_DIA[dia].d)} Cada coisa importante que o grupo faz gasta uma parte do dia.</div>` : '<p class="small dim">Toque na parte do dia em que o grupo está.</p>'}
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn sm" data-act="evento">Rolar evento de estrada</button>${n.evento ? `<span class="small" style="align-self:center"><b>${n.evento.r}:</b> ${esc(n.evento.t)}</span>` : ''}</div>
    <details class="prontos" style="margin-top:10px"><summary>Pousos da estrada</summary><table class="weap"><tbody>${CT.POUSOS.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</tbody></table></details>`;
  const prox = n.fase + 1;
  const conduzir = `
    <h2>Conduzir</h2>
    <div class="relogio-m">${M.FASES.map((f, i) => `<div class="rm${i === n.fase ? ' on' : i < n.fase ? ' foi' : ''}"><img src="img/fase-${f.k}.webp" alt=""><span>${f.n}</span></div>`).join('')}</div>
    ${n.fase >= 0 ? `<div class="box">${esc(M.FASES[n.fase].d)}</div>` : ''}
    ${n.fase >= 0 && n.fase < 4 && n.fases[n.fase]?.length ? `<p class="small" style="margin:0">Chegam agora: <b>${n.fases[n.fase].map((id) => bestOf(id).nome).join(', ')}</b>.</p>` : ''}
    <div class="ro-adj"><div><span class="flab">Teste de Pavor na virada</span><p class="fhelp" style="margin:0">Cada jogador rola Firmeza contra ${n.pavorDif} no celular. Quem falha recebe 1 Pavor.</p></div>
      <div class="sub-opts">${[15, 20].map((v) => `<button class="pill${n.pavorDif === v ? ' sel' : ''}" data-nt-pdif="${v}">${v}</button>`).join('')}</div></div>
    ${prox <= 4 ? `<button class="btn primary block" data-act="virarFase">${n.fase < 0 ? 'Começar a noite: Crepúsculo' : `Virar para ${M.FASES[prox].n}`}</button>` : `<button class="btn block" data-act="novaNoite">Começar uma nova noite</button>`}`;

  const grupo = `
    <h2>O grupo</h2>
    ${aprovados().length ? `<div class="grupo-m">${aprovados().map((c) => { const t = trackerDe(c), b = R.barras(c.data);
      const est = [t.sangue <= 0 ? 'caído' : t.sangue <= b.sangue / 2 ? 'ferido' : '', t.prumo <= 0 ? 'pânico' : ''].filter(Boolean);
      const cnt = (k, max, lbl) => `<div class="cnt"><span>${lbl}</span><div><button data-trk="${c.id}:${k}:-1" aria-label="Menos ${lbl}">−</button><b>${t[k]}${max != null ? `<small>/${max}</small>` : ''}</b><button data-trk="${c.id}:${k}:1" aria-label="Mais ${lbl}">+</button></div></div>`;
      return `<div class="pj-m${est.length ? ' alerta' : ''}"><div class="pj-head"><span class="pj-pic ${estCls(c)}"><img src="${picChar(c)}" alt=""></span><div><b>${esc(c.data.nome)}</b><span class="small dim">Defesa ${b.defesa} · Firmeza ${R.atrib(c.data).firmeza}${t.pavor ? ` · mão −${t.pavor}` : ''}</span></div>${est.map((e) => `<span class="chip pronto">${e}</span>`).join('')}</div>
        <div class="cnts">${cnt('sangue', b.sangue, 'Sangue')}${cnt('prumo', b.prumo, 'Prumo')}${cnt('pavor', null, 'Pavor')}${cnt('brasa', b.brasa, 'Brasa')}</div>
        ${`<div class="ret-m"><span class="flab">Retrato</span><div class="sub-opts">${ESTADOS.map(([k, l]) => `<button class="pill${(S.noite.retrato?.[c.id] || 'auto') === k ? ' sel' : ''}" data-ret="${c.id}:${k}">${l}${k === 'auto' ? ` <small>(${ESTADOS.find((e) => e[0] === estadoDe(c, true))?.[1] || ''})</small>` : ''}</button>`).join('')}</div></div>`}
        ${t.prumo <= 0 ? `<button class="btn sm" data-panico="${c.id}">Rolar pânico</button>` : ''}</div>`; }).join('')}</div>` : '<p class="muted">Nenhuma ficha aprovada ainda.</p>'}
    <h2>O círculo</h2>
    <div class="card circ-m">
      <div class="pool"><span class="lbl">Força do círculo</span><strong>${n.circulo > 0 ? n.circulo : 'Rompido'}</strong></div>
      <div class="sub-opts"><button class="btn sm" data-act="investida">Investida não passou (−3)</button><button class="btn sm" data-act="brecha">Abriu brecha</button></div>
      <div style="display:flex;gap:8px;align-items:center"><label class="flab" for="nt-forca" style="margin:0">Refazer com força</label><input class="field" id="nt-forca" type="number" min="0" max="40" value="${Math.max(0, n.circulo)}" style="width:90px"><button class="btn sm" data-act="refazer">Refazer</button></div>
    </div>
    ${n.log.length ? `<h2>O que aconteceu</h2><ol class="marcos">${n.log.slice(0, 15).map((l) => `<li class="small">${esc(l.t)}</li>`).join('')}</ol>` : ''}`;
  const regras = `<h2>Regras desta mesa</h2>
    <div class="card"><div class="ro-adj"><div><span class="flab">Começar com Marca</span><p class="fhelp" style="margin:0">Quem cria em Faísca pode escolher uma Marca já na criação.</p></div>
      <div class="sub-opts">${[[true, 'Sim'], [false, 'Não']].map(([v, l]) => `<button class="pill${marcaInicialLiberada() === v ? ' sel' : ''}" data-mesa-marca="${v}">${l}</button>`).join('')}</div></div></div>`;
  return `${top()}<h1>A noite</h1><p class="muted" style="margin-top:6px">Só você vê esta tela. Os jogadores veem apenas a fase atual na mesa.</p>${diaHtml}${conduzir}${grupo}${montar}${regras}`;
}

async function virarFase() {
  const n = S.noite, prox = n.fase + 1;
  if (prox > 4) return;
  n.fase = prox; if (prox === 0) n.dia = -1;
  const f = M.FASES[prox];
  const res = [];
  if (prox === 4) {
    aprovados().forEach((c) => { const t = trackerDe(c); t.pavor = 0; t.brasa = R.barras(c.data).brasa; });
    n.dia = 0;
    logNoite('Aurora. As fendas fecharam; o Pavor sumiu e a Brasa voltou.');
  } else {
    // o Pavor é dos jogadores: cada um rola a Firmeza no próprio celular, e quem falha ganha 1 Pavor
    const chegam = (n.fases[prox] || []).map((id) => bestOf(id).nome);
    logNoite(`${f.n}. Pedi o Pavor a todos (Firmeza contra ${n.pavorDif}).${chegam.length ? ' Chegam: ' + chegam.join(', ') + '.' : ''}`);
    await salvarNoite();
    await MESA.pedirPavor(f.n, n.pavorDif);
  }
  await salvarNoite(); rr();
  toast(prox === 4 ? 'Aurora!' : `${f.n}: pedi o Pavor a todos. Cada um rola no celular.`);
}

// ---------- personagens prontos ----------
function viewProntos() {
  const usados = new Set(S.chars.map((c) => c.data?.pronto).filter(Boolean));
  return `${top()}<h1>Personagens prontos</h1>
    <p class="muted" style="margin-top:8px">Seis pessoas que já se conhecem, feitas para a primeira aventura. Escolha um e ajuste o que quiser antes de enviar ao mestre: nome, história, atributos.</p>
    <div class="opts">${R.PRONTOS.map((p) => { const of = R.oficioDe(p), or = R.origemDe(p), b = R.barras(p), em = usados.has(p.id);
      return `<button class="opt of pr" data-pronto="${p.id}" ${em ? 'disabled' : ''}>
        <span class="pic"><img src="img/pr-${p.id}.webp" alt=""></span>
        <span class="meta">${em ? 'Já escolhido' : `${of.n} · ${or.n}`}</span><b>${esc(p.nome)}</b><p>${esc(p.conceito)}</p>
        <span class="hab dim">Sangue ${b.sangue} · Prumo ${b.prumo} · Defesa ${b.defesa}${b.brasa ? ` · Brasa ${b.brasa}` : ''}</span></button>`; }).join('')}</div>
    <div class="actions"><a class="btn ghost" href="#/">Voltar</a></div>`;
}

// ---------- assistente de criação ----------
const PASSOS = [
  ['conceito', 'Quem é você'],
  ['origem', 'Origem'],
  ['oficio', 'Ofício'],
  ['dom', 'O Dom'],
  ['atributos', 'Atributos'],
  ['historia', 'História'],
  ['revisao', 'Revisão'],
];

function viewWizard(c, step) {
  const p = c.data;
  if (!marcaInicialLiberada() && p.marca) { p.marca = ''; p.marcaSangue = false; saveSoon(c); }
  step = Math.max(0, Math.min(PASSOS.length - 1, step));
  const [key, nome] = PASSOS[step];
  const bars = PASSOS.map((_, i) => `<i class="${i === step ? 'on' : i < step ? 'done' : ''}"></i>`).join('');
  const body = { conceito: stepConceito, origem: stepOrigem, oficio: stepOficio, dom: stepDom, atributos: stepAtributos, historia: stepHistoria, revisao: stepRevisao }[key](p, c);
  const last = step === PASSOS.length - 1;
  return `${top()}
    <div class="steps" aria-hidden="true">${bars}</div>
    <div class="stepname"><span class="lbl">Passo ${step + 1} de ${PASSOS.length}</span><a class="lbl" href="#/" style="text-decoration:none">Sair e continuar depois</a></div>
    <h1 style="margin-bottom:10px">${nome}</h1>
    ${resumo(p)}
    <div class="wiz" data-char="${c.id}">${body}</div>
    <p class="saved" aria-live="polite">${esc(ui.saved)}</p>
    <div class="wfoot">
      ${step > 0 ? `<a class="btn" href="#/criar/${c.id}/${step - 1}">Voltar</a>` : `<a class="btn" href="#/">Mesa</a>`}
      ${last ? `<button class="btn primary" data-act="enviar" data-id="${c.id}" ${R.pendencias(p).length ? 'disabled' : ''}>${c.status === 'rascunho' ? 'Enviar ao mestre' : 'Salvar'}</button>`
             : `<a class="btn primary" href="#/criar/${c.id}/${step + 1}">Próximo</a>`}
    </div>`;
}

function resumo(p) {
  const of = R.oficioDe(p), or = R.origemDe(p), b = R.barras(p);
  const it = [p.nome, or?.n, of?.n, p.oficio ? R.domDe(p).n : ''].filter(Boolean);
  if (!it.length) return '';
  return `<div class="resumo"><span>${it.map(esc).join(' · ')}</span>${of ? `<span class="dim">Sangue ${b.sangue} · Prumo ${b.prumo} · Defesa ${b.defesa}</span>` : ''}</div>`;
}

// estados do retrato: o mestre força um, ou ele segue o Sangue e o Prumo marcados no painel
const ESTADOS = [['auto', 'Automático'], ['inteiro', 'Inteiro'], ['ferido', 'Ferido'], ['panico', 'Pânico'], ['caido', 'Caído']];
function estadoDe(c, auto = false) {
  const forc = S.noite?.retrato?.[c.id];
  if (!auto && forc && forc !== 'auto') return forc;
  const t = S.noite?.grupo?.[c.id]; if (!t) return 'inteiro';
  const b = R.barras(c.data);
  return t.sangue <= 0 ? 'caido' : t.prumo <= 0 ? 'panico' : t.sangue <= b.sangue / 2 ? 'ferido' : 'inteiro';
}
// o retrato é sempre o mesmo; o estado vira um efeito visual (classe est-*)
const picChar = (c) => picOf(c.data);
const estCls = (c) => (c ? 'est-' + estadoDe(c) : '');
const picOf = (p) => (p.retrato ? p.retrato : p.pronto ? `img/pr-${p.pronto}.webp` : R.oficioDe(p) ? `img/of-${R.oficioDe(p).k}.webp` : '');

const inp = (k, v, ph = '', max = 80) => `<input class="field" data-k="${k}" value="${esc(v)}" placeholder="${esc(ph)}" maxlength="${max}">`;
const area = (k, v, ph = '') => `<textarea class="field" data-k="${k}" placeholder="${esc(ph)}" maxlength="1200">${esc(v)}</textarea>`;

function stepConceito(p) {
  return `<p class="intro">Breu é sobre gente comum que resolveu não ficar só esperando o sol. Ninguém aqui é herói escolhido.</p>
    <div><label class="flab">Nome</label>${inp('nome', p.nome, 'Como te chamam')}</div>
    <div><label class="flab">Em uma frase, quem é você?</label><p class="fhelp">Ex.: a filha do Riscador que nunca quis riscar; o barqueiro que perdeu o irmão na maré.</p>${inp('conceito', p.conceito, '', 160)}</div>
    <div><label class="flab">Como você é por fora</label><p class="fhelp">Idade, jeito, roupa, cicatriz, o que chama atenção.</p>${area('aparencia', p.aparencia)}</div>`;
}

function stepOrigem(p) {
  const o = R.origemDe(p);
  const opts = R.ORIGENS.map((x) => `<button class="opt of${p.origem === x.k ? ' sel' : ''}" data-set="origem" data-v="${x.k}" aria-pressed="${p.origem === x.k}">
      <span class="pic or"><img src="img/or-${x.k}.webp" alt="" onerror="this.remove()"></span>
      <span class="meta">Perícia: ${x.pericia} · Sotaque: ${x.sotaque || 'um à escolha'}</span><b>${x.n}</b><p>${x.d}</p>
      <span class="hab"><b>${x.costume[0]}.</b> ${x.costume[1]}</span>
      ${p.origem === x.k ? `<span class="hab dim"><b>Como é a gente de lá:</b> ${x.visual}</span>` : ''}</button>`).join('');
  let extra = '';
  if (o?.k === 'estrada') {
    extra += `<div><label class="flab">Que sotaque de traços você aprendeu pelo caminho?</label><div class="sub-opts">${Object.keys(R.SOTAQUES).map((s) => `<button class="pill${p.sotaqueEstrada === s ? ' sel' : ''}" data-set="sotaqueEstrada" data-v="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>`;
  }
  extra += extraPicker(p);
  const sot = R.sotaque(p);
  return `<p class="intro">De que tipo de lugar você vem? A origem dá uma perícia treinada, um costume da terra e o seu jeito de riscar traços, o sotaque.</p>
    <div class="opts">${opts}</div>${extra}
    ${sot ? `<div class="box"><b>Sotaque ${esc(sot)}:</b> ${esc(R.SOTAQUES[sot])}</div>` : ''}`;
}

function extraPicker(p) {
  if (!R.periciaOrigemRepete(p)) return '';
  const o = R.origemDe(p), ja = R.oficioDe(p).pericias;
  return `<div class="box">A perícia da sua origem (<b>${o.pericia}</b>) já vem do seu ofício. Escolha outra qualquer:</div>
    <div class="sub-opts">${R.PERICIAS.map(([n]) => n).filter((n) => !ja.includes(n)).map((n) => `<button class="pill${p.periciaExtra === n ? ' sel' : ''}" data-set="periciaExtra" data-v="${esc(n)}">${esc(n)}</button>`).join('')}</div>`;
}

function stepOficio(p) {
  const opts = R.OFICIOS.map((x) => `<button class="opt of${p.oficio === x.k ? ' sel' : ''}" data-set="oficio" data-v="${x.k}" aria-pressed="${p.oficio === x.k}">
      <span class="pic"><img src="img/of-${x.k}.webp" alt=""></span>
      <span class="meta">${x.pericias.join(' · ')}</span><b>${x.n}</b><p>${x.d}</p>
      ${p.oficio === x.k ? `<span class="hab"><b>${x.hab[0]}.</b> ${x.hab[1]}<br><span class="dim">Leva: ${x.equip}</span></span>` : ''}</button>`).join('');
  return `<p class="intro">O que você faz por causa da noite. O ofício dá duas perícias treinadas, uma habilidade e o seu equipamento. Mais tarde, você escolhe um caminho dentro dele.</p>
    <div class="opts">${opts}</div>${extraPicker(p)}${livrePicker(p)}${posPicker(p)}`;
}

function livrePicker(p, attr = 'data-set="periciaLivre"') {
  if (!p.oficio || !p.origem) return '';
  const ja = R.periciasFixas(p);
  return `<h2>Sua perícia livre</h2>
    <p class="intro">Além das três que vêm da origem e do ofício, escolha mais uma, qualquer uma. É o que ninguém espera de alguém como você.</p>
    <div class="sub-opts">${R.PERICIAS.map(([n]) => n).filter((n) => !ja.includes(n)).map((n) => `<button class="pill${p.periciaLivre === n ? ' sel' : ''}" ${attr} data-v="${esc(n)}">${esc(n)}</button>`).join('')}</div>`;
}

function posPicker(p) {
  if (p.oficio !== 'pozeiro') return '';
  const of = R.oficioDe(p);
  return `<h2>Seus três pós</h2>
    <p class="intro">No Almofariz você aprendeu a moer três pós. Os outros vêm com os marcos.</p>
    <div class="opts">${R.POS.map((x) => `<button class="opt${p.pos.includes(x.k) ? ' sel' : ''}" data-po="${x.k}" aria-pressed="${p.pos.includes(x.k)}"><span class="meta">Base: ${x.ingr}</span><b>${x.n}</b><p>${x.d}</p></button>`).join('')}</div>
    <div class="box"><b>A licença.</b> ${of.licenca}</div>`;
}

// regra da mesa: o mestre decide se dá para começar com Marca
const marcaInicialLiberada = () => S.mesa?.marcaInicial !== false;

function stepDom(p) {
  const n = R.essenciasPermitidas(p);
  const semMarca = !marcaInicialLiberada();
  let html = `<p class="intro">Algumas pessoas nascem com uma chama por dentro que faz os traços valerem mais. Quase sempre ela dorme.</p>
    <div class="opts">
      <button class="opt${p.dom === 'adormecido' ? ' sel' : ''}" data-set="dom" data-v="adormecido"><span class="meta">6 pontos de atributo · Brasa 0</span><b>Adormecido</b><p>O Dom ainda dorme. Você risca traços, mas apagados, sem a força da Brasa. Ele pode despertar jogando.</p></button>
      <button class="opt${p.dom === 'faisca' ? ' sel' : ''}" data-set="dom" data-v="faisca"><span class="meta">5 pontos de atributo · Brasa 2</span><b>Faísca</b><p>O Dom já acordou. Você acende traços básicos. Custa 1 ponto de atributo${semMarca ? '. Nesta mesa, as Marcas vêm jogando.' : ', e você pode começar com uma Marca tatuada.'}</p></button>
    </div>`;
  if (p.dom === 'faisca' && !semMarca) {
    html += `<h2>Uma Marca?</h2><p class="intro">Opcional. Se escolher, ela foi a noite que acordou o seu Dom.</p>
      <div class="opts"><button class="opt${!p.marca ? ' sel' : ''}" data-set="marca" data-v=""><b>Nenhuma por enquanto</b></button>
      ${R.MARCAS.map((m) => `<button class="opt${p.marca === m.k ? ' sel' : ''}" data-set="marca" data-v="${m.k}"><span class="meta">${m.onde} · ${m.custo} Brasa</span><b>${m.n}</b><p>${m.d}</p></button>`).join('')}</div>`;
    if (p.marca) {
      html += `<div><label class="flab">Com que tinta?</label><div class="opts">
        <button class="opt${!p.marcaSangue ? ' sel' : ''}" data-set="marcaSangue" data-v="0"><b>Tinta comum</b><p>Carregar a noite no corpo pesa: −1 no Prumo máximo.</p></button>
        <button class="opt${p.marcaSangue ? ' sel' : ''}" data-set="marcaSangue" data-v="1"><b>Sangue de Assombro</b><p>Mais forte: não reduz o Prumo e custa 1 Brasa a menos. Mas soma 1 de <b>Sombra</b>, que nunca vai embora.</p></button></div></div>`;
    }
  }
  if (n) {
    html += `<h2>Essência</h2><p class="intro">Quem sabe Traços conhece ${n === 2 ? 'duas essências' : 'uma essência'}: o tipo de Assombro contra o qual seus traços valem mais.</p>
      <div class="sub-opts">${Object.entries(R.ESSENCIAS).map(([e, d]) => `<button class="pill${p.essencias.includes(e) ? ' sel' : ''}" data-ess="${e}" aria-pressed="${p.essencias.includes(e)}">${e} <span class="dim small">${d}</span></button>`).join('')}</div>`;
  }
  return html;
}

function stepAtributos(p) {
  const total = R.pontosTotais(p), sobra = total - R.pontosUsados(p), b = R.barras(p);
  const of = R.oficioDe(p);
  return `<p class="intro">Todos começam em 1. Distribua ${total} pontos. Nenhum passa de 4 agora.${of ? ` Para ${of.n.toLowerCase()}, costumam pesar <b>${of.fortes}</b>.` : ''}</p>
    <div class="pool${sobra === 0 ? ' zero' : ''}"><span class="lbl">Pontos sobrando</span><strong>${sobra}</strong></div>
    ${of ? `<button class="btn sm" data-act="sugerir" style="justify-self:start">Distribuir pelo ofício</button>` : ''}
    <div class="attrs">${R.ATRIBUTOS.map((a) => `<div class="attr"><b>${a.n}</b>
      <div class="stepper"><button data-attr="${a.k}" data-d="-1" aria-label="Menos ${a.n}" ${p.atrib[a.k] <= 1 ? 'disabled' : ''}>−</button><span class="v">${p.atrib[a.k]}</span><button data-attr="${a.k}" data-d="1" aria-label="Mais ${a.n}" ${p.atrib[a.k] >= 4 || sobra <= 0 ? 'disabled' : ''}>+</button></div>
      <p>${a.d}</p></div>`).join('')}</div>
    <h2>Suas barras</h2>
    <div class="bars">
      <div class="bar"><span>Sangue</span><strong>${b.sangue}</strong></div>
      <div class="bar"><span>Prumo</span><strong>${b.prumo}</strong></div>
      <div class="bar"><span>Brasa</span><strong>${b.brasa}</strong></div>
      <div class="bar"><span>Defesa</span><strong>${b.defesa}</strong></div>
    </div>
    <p class="small dim">Sangue é a vida. Prumo é o quanto você aguenta de medo antes de entrar em pânico. Brasa alimenta os traços e as Marcas.</p>`;
}

function stepHistoria(p) {
  const o = R.origemDe(p);
  return `<p class="intro">Respostas curtas bastam. O mestre vai usar tudo isso na história.</p>
    <div><label class="flab">A noite que te mudou</label><p class="fhelp">A cicatriz, a perda ou o susto que fez você sair depois do Crepúsculo. Uma ou duas frases.</p>${area('marcaNoite', p.marcaNoite)}</div>
    ${p.oficio === 'pozeiro' ? `<div><label class="flab">${esc(R.oficioDe(p).pergunta)}</label>${area('respostaPozeiro', p.respostaPozeiro)}</div>` : ''}
    <div><label class="flab">Seu laço</label><p class="fhelp">Alguém do grupo ou da sua comunidade que importa para você, e por quê.</p>${area('laco', p.laco)}</div>
    ${o ? `<div><label class="flab">${esc(o.pergunta)}</label>${area('respostaOrigem', p.respostaOrigem)}</div>` : ''}
    <div><label class="flab">Quem você quer proteger? E quem você não conseguiu?</label>${area('protege', p.protege)}</div>
    <div><label class="flab">Do que você tem mais medo?</label><p class="fhelp">Do escuro, de ficar sozinho, de virar o que caça… ou outra coisa.</p>${area('medo', p.medo)}</div>`;
}

function stepRevisao(p) {
  const pend = R.pendencias(p);
  const idx = Object.fromEntries(PASSOS.map(([k], i) => [k, i]));
  const charId = route().arg;
  return `${pend.length ? `<div class="box"><b>Falta pouco:</b><ul style="margin:6px 0 0;padding-left:18px">${pend.map(([k, t]) => `<li><a href="#/criar/${charId}/${idx[k] ?? 0}">${esc(t)}</a></li>`).join('')}</ul></div>`
    : `<div class="box"><b>Tudo pronto.</b> Confira a ficha e envie ao mestre. Ainda dá para mudar depois, até ele aprovar.</div>`}
    ${sheetBody(p)}`;
}

// ---------- ficha ----------
function sheetBody(p, c = null) {
  const of = R.oficioDe(p), or = R.origemDe(p), b = R.barras(p), at = R.atrib(p), dom = R.domDe(p), cam = R.caminhoDe(p);
  const ms = R.marcas(p), ess = R.essencias(p);
  const armas = of ? of.armas : [];
  return `<div class="ficha"><div class="f-a">
    <div class="sheet-head">
      <div class="pic ${c ? estCls(c) : ''}${p.pronto || p.retrato ? ' retrato' : ''}">${of ? `<img src="${c ? picChar(c) : picOf(p)}" alt="">` : ''}</div>
      <div><p class="lbl" style="margin:0 0 4px">${esc([of?.n, cam?.n, or?.n].filter(Boolean).join(' · '))}</p><h1>${esc(p.nome || 'Sem nome')}</h1>${p.conceito ? `<p class="sub" style="margin:6px 0 0">${esc(p.conceito)}</p>` : ''}${c && R.marcosGanhos(p) ? `<span class="chip" style="margin-top:8px;display:inline-block">${R.patamar(p).n}</span>` : ''}</div>
    </div>
    ${c && c.status === 'aprovado' && !p.pronto && !p.periciaLivre && canEdit(c) ? `<div class="evo livre"><div><span class="lbl">Regra nova</span><p style="margin:4px 0 0">Agora todo personagem começa com uma <b>perícia livre</b>, além das três da origem e do ofício.</p></div></div>${livrePicker(p, 'data-livre="1"')}` : ''}
    ${c ? evoBanner(c) : ''}
    <h2>Atributos</h2>
    <div class="stat-row">${R.ATRIBUTOS.map((a) => podeRolar(c) ? `<button class="stat rollable" data-roll-attr="${a.k}" aria-label="Rolar ${a.n}"><strong>${at[a.k]}</strong><span>${a.n}</span></button>` : `<div class="stat"><strong>${at[a.k]}</strong><span>${a.n}</span></div>`).join('')}</div>
    ${podeRolar(c) ? '<p class="small" style="margin-top:6px;color:var(--brasa2)">Toque num atributo ou numa perícia para rolar.</p>' : ''}
    <p class="small dim" style="margin-top:6px">Na rolagem, pegue tantos d20 quanto o atributo e fique com o maior.</p>
    <h2>Barras</h2>
    <div class="bars">
      <div class="bar"><span>Sangue</span><strong>${b.sangue}</strong></div>
      <div class="bar"><span>Prumo</span><strong>${b.prumo}</strong></div>
      <div class="bar"><span>Brasa</span><strong>${b.brasa}</strong></div>
      <div class="bar"><span>Defesa</span><strong>${b.defesa}</strong></div>
    </div>
    ${b.sombra ? `<p class="small" style="margin-top:8px">Sombra: <b style="color:var(--brasa2)">${b.sombra}</b> de 7.</p>` : ''}
    <h2>Perícias</h2>
    <div class="skills">${R.PERICIAS.map(([n]) => { const g = R.grauPericia(p, n); const tag = podeRolar(c) ? 'button' : 'div'; return `<${tag} class="${g ? 't' : ''}${podeRolar(c) ? ' rollable' : ''}" ${podeRolar(c) ? `data-roll-per="${esc(n)}"` : ''}><span>${n}${g > 1 ? ` <span class="dim small">${R.GRAUS[g]}</span>` : ''}</span>${g ? `<em>+${R.bonusPericia(g)}</em>` : '<span class="dim">+0</span>'}</${tag}>`; }).join('')}</div>
    </div><div class="f-b">
    ${or ? `<h2>Origem</h2><div class="or-wrap"><img class="or-fig" src="img/or-${or.k}.webp" alt="" onerror="this.remove()"><dl class="kv"><div><dt>Costume da terra</dt><dd><b>${or.costume[0]}.</b> ${or.costume[1]}</dd></div><div><dt>Como é a gente de lá</dt><dd class="small">${or.visual}</dd></div></dl></div>` : ''}
    ${of ? `<h2>Ofício</h2><dl class="kv"><div><dt>Habilidade inicial</dt><dd><b>${of.hab[0]}.</b> ${of.hab[1]}</dd></div>
      ${cam ? cam.habs.map(([n, custo, d]) => `<div><dt>Caminho ${esc(cam.n)}</dt><dd><b>${n}.</b>${custo ? ` <span class="dim">(${custo})</span>` : ''} ${d}</dd></div>`).join('') : `<div><dt>Caminho</dt><dd class="dim">Escolhido no terceiro marco: ${of.caminhos.map((x) => x.n).join(' ou ')}.</dd></div>`}
      ${R.caminhoAlto(p).map((h) => `<div><dt>${h.marco === 6 ? 'Veterano' : 'Mestria'}</dt><dd><b>${h.n}.</b> ${h.d}</dd></div>`).join('')}
      ${R.oficiosAprendidos(p).map((o) => `<div><dt>De outro ofício (${o.n})</dt><dd><b>${o.hab[0]}.</b> ${o.hab[1]}</dd></div>`).join('')}
      ${of.k === 'pozeiro' ? `<div><dt>A licença</dt><dd class="small">${of.licenca}</dd></div>` : ''}</dl>` : ''}
    ${R.posDe(p).length ? `<h2>Pós</h2><dl class="kv">${R.posDe(p).map((k) => { const x = R.POS.find((y) => y.k === k); return `<div><dt>${x.n} · base ${x.ingr}</dt><dd>${x.d}</dd></div>`; }).join('')}</dl>
      <p class="small dim" style="margin-top:6px">Na mão, na ponta, soprado, na linha ou na chama. A força é a rolagem de Ofícios do preparo; o Assombro resiste com a mão de ataque dele.</p>` : ''}
    ${R.geraisDe(p).length ? `<h2>Habilidades gerais</h2><dl class="kv">${R.geraisDe(p).map((g) => `<div><dt>${g.n}</dt><dd>${g.d}</dd></div>`).join('')}</dl>` : ''}
    <h2>Traços e Dom</h2>
    <dl class="kv">
      <div><dt>Dom</dt><dd><b>${dom.n}</b> (Brasa ${dom.brasa}). ${dom.d}</dd></div>
      <div><dt>Sotaque${R.sotaques(p).length > 1 ? 's' : ''}</dt><dd>${esc(R.sotaques(p).join(', ') || '—')}</dd></div>
      <div><dt>Raízes</dt><dd>${R.tracosConhecidos(p).join(', ')}</dd></div>
      <div><dt>Modos</dt><dd>No chão, no ar, em volta, num objeto, na pele</dd></div>
      <div><dt>Essências</dt><dd>${ess.length ? ess.map((e) => `${e} (${R.ESSENCIAS[e]})`).join(', ') : 'Nenhuma'}</dd></div>
      ${R.sotaques(p).filter((x) => R.TRACO_SOTAQUE[x]).map((x) => `<div><dt>Traço do sotaque ${esc(x)}</dt><dd><b>${R.TRACO_SOTAQUE[x][0]}.</b> ${R.TRACO_SOTAQUE[x][1]}</dd></div>`).join('')}
      ${ms.map((m) => `<div><dt>Marca</dt><dd><img class="marca-ic" src="img/m-${m.k}.webp" alt=""><b>${m.n}</b> (${m.onde.toLowerCase()}${m.sangue ? ', com sangue de Assombro' : ''}). ${m.d} Custa ${Math.max(1, m.custo - (m.sangue ? 1 : 0))} Brasa.</dd></div>`).join('')}
    </dl>
    <details class="prontos"><summary>Traços prontos que você sabe (${R.tracosProntos(p).length})</summary>
      <table class="weap"><tbody>${R.tracosProntos(p).map(([n, r, m, d]) => `<tr><td>${n}<div class="small dim">${r} · ${m}</div></td><td>${d}</td></tr>`).join('')}</tbody></table>
      <p class="small dim">Às pressas: numa ação, com metade da força, some na próxima virada de fase.</p></details>
    <h2>Equipamento</h2>
    ${armas.length ? `<table class="weap"><thead><tr><th>Arma</th><th>Dano</th><th>Alcance</th></tr></thead><tbody>${armas.map((a) => `<tr><td>${esc(a)}<div class="small dim">${esc(R.ARMAS[a]?.[2] || '')}</div></td><td>${podeRolar(c) && R.ARMAS[a]?.[0] ? `<button class="dmg" data-roll-dmg="${R.ARMAS[a][0]}" data-arma="${esc(a)}">${R.ARMAS[a][0]}</button>` : R.ARMAS[a]?.[0] || ''}</td><td>${R.ARMAS[a]?.[1] || ''}</td></tr>`).join('')}</tbody></table>` : ''}
    <dl class="kv" style="margin-top:12px">
      ${of ? `<div><dt>Do ofício</dt><dd>${esc(of.equip)}</dd></div>` : ''}
      <div><dt>Kit comum</dt><dd>${esc(R.KIT)}</dd></div>
      <div><dt>Dinheiro inicial</dt><dd>2 noites e 5 vigias</dd></div>
    </dl>
    <p class="small dim" style="margin-top:8px">Armas comuns não matam Assombros: só empurram. Para ferir, a arma precisa estar marcada.</p>
    <h2>História</h2>
    <dl class="kv">
      ${p.aparencia ? `<div><dt>Aparência</dt><dd>${esc(p.aparencia)}</dd></div>` : ''}
      ${p.marcaNoite ? `<div><dt>A noite que me mudou</dt><dd class="quote">${esc(p.marcaNoite)}</dd></div>` : ''}
      ${p.laco ? `<div><dt>Laço</dt><dd>${esc(p.laco)}</dd></div>` : ''}
      ${or && p.respostaOrigem ? `<div><dt>${esc(or.pergunta)}</dt><dd>${esc(p.respostaOrigem)}</dd></div>` : ''}
      ${p.respostaPozeiro ? `<div><dt>Por que o Almofariz me deixou sair</dt><dd>${esc(p.respostaPozeiro)}</dd></div>` : ''}
    ${p.protege ? `<div><dt>Quem protejo</dt><dd>${esc(p.protege)}</dd></div>` : ''}
      ${p.medo ? `<div><dt>Meu maior medo</dt><dd>${esc(p.medo)}</dd></div>` : ''}
    </dl>
    ${c ? evoHistorico(p) : ''}</div></div>`;
}

// faixa de evolução no topo da ficha
function evoBanner(c) {
  const p = c.data, mine = canEdit(c), pend = R.melhoriasPendentes(p), n = R.marcosGanhos(p);
  if (c.status !== 'aprovado' && !n) return '';
  const partes = [];
  if (pend && mine) partes.push(`<b>${pend} marco${pend > 1 ? 's' : ''} para gastar.</b> ${R.precisaCaminho(p) ? 'Hora de escolher o caminho do ofício.' : 'Escolha uma melhoria.'}`);
  else partes.push(`<b>${n} marco${n === 1 ? '' : 's'}.</b> ${n < 3 ? `O caminho do ofício chega no terceiro.` : ''}`);
  if (R.domPodeSubir(p)) partes.push(`O Dom pode subir para <b>${R.DOM[R.domIndex(p) + 1].n}</b>, se a mesa concordar.`);
  return `<div class="evo">
    <div><span class="lbl">Evolução</span><p style="margin:4px 0 0">${partes.join(' ')}</p></div>
    ${pend && mine ? `<a class="btn primary" href="#/evoluir/${c.id}">Evoluir</a>` : ''}
  </div>`;
}

function evoHistorico(p) {
  if (!p.marcos.length && !p.melhorias.length && !p.caminho) return '';
  const cam = R.caminhoDe(p);
  const linhas = p.marcos.map((m, i) => {
    const mel = p.melhorias[i];
    return `<li><span class="lbl">Marco ${i + 1}</span> ${esc(m.motivo || '')}${mel ? `<br><span class="small">→ ${esc(R.descreveMelhoria(mel))}</span>` : '<br><span class="small dim">→ melhoria por escolher</span>'}${i === 2 && cam ? `<br><span class="small">→ Caminho: ${esc(cam.n)}</span>` : ''}</li>`;
  }).join('');
  return `<h2>Marcos</h2><ol class="marcos">${linhas}</ol>${p.domSubidas ? `<p class="small">O Dom subiu ${p.domSubidas} grau${p.domSubidas > 1 ? 's' : ''} com a mesa.</p>` : ''}`;
}

function viewSheet(c) {
  const st = c.status || 'rascunho';
  const mine = c.owner === S.session.user.id;
  const p = c.data;
  const acts = [];
  if (canEditCreation(c)) acts.push(`<a class="btn" href="#/criar/${c.id}/0">${st === 'aprovado' ? 'Corrigir a criação' : 'Editar'}</a>`);
  if (isGM() && st === 'pronto') acts.push(`<button class="btn primary" data-act="status" data-id="${c.id}" data-v="aprovado">Aprovar</button>`, `<button class="btn" data-act="status" data-id="${c.id}" data-v="rascunho">Devolver para ajustes</button>`);
  if (isGM() && st === 'aprovado') acts.push(`<button class="btn ghost" data-act="status" data-id="${c.id}" data-v="rascunho">Reabrir a criação</button>`);
  if ((mine && st === 'rascunho') || isAdmin()) acts.push(`<button class="btn ghost" data-act="apagar" data-id="${c.id}">Apagar</button>`);
  const gm = isGM() && st === 'aprovado' ? `<h2>Mestre</h2>
    <div class="card form">
      <div><label class="flab" for="mc-mot">Dar um marco</label><p class="fhelp">Em geral, um por sessão e mais um ao fim de cada aventura.</p>
        <select class="field" id="mc-mot">${R.MARCOS_EXEMPLOS.map((m) => `<option>${esc(m)}</option>`).join('')}<option value="">Outro motivo…</option></select>
        <input class="field" id="mc-out" placeholder="Escreva o motivo" maxlength="120" style="margin-top:8px;display:none"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" data-act="darMarco" data-id="${c.id}">Dar marco</button>
      ${R.marcosGanhos(p) > R.melhoriasFeitas(p) ? `<button class="btn ghost" data-act="tirarMarco" data-id="${c.id}">Tirar o último</button>` : ''}
      ${R.domPodeSubir(p) ? `<button class="btn" data-act="subirDom" data-id="${c.id}">Subir o Dom para ${R.DOM[R.domIndex(p) + 1].n}</button>` : ''}</div>
    </div>` : '';
  return `${top()}
    <p class="lbl" style="display:flex;justify-content:space-between;align-items:center;margin:0 0 12px"><span>${mine ? 'Seu personagem' : 'De ' + esc(memberName(c.owner))}</span><span class="chip ${st}">${STATUS[st]}</span></p>
    ${sheetBody(p, c)}
    ${gm}
    ${isGM() ? `<h2>Anotações do mestre</h2><textarea class="field" data-gmnote="${c.id}" placeholder="Só o mestre vê isto.">${esc(S.notes[c.id] || '')}</textarea>` : ''}
    <div class="actions">${acts.join('')}<a class="btn ghost" href="#/">Voltar à mesa</a></div>
    ${ui.roller?.cid === c.id ? viewRoller(c) : ''}`;
}

// ---------- rolagem ----------
const podeRolar = (c) => !!c && canEdit(c) && c.status === 'aprovado';
const ATN = Object.fromEntries(R.ATRIBUTOS.map((a) => [a.k, a.n]));
function rollRow(r) {
  const c = charById(r.character_id), d = r.detail || {};
  const nome = c?.data?.nome || 'Alguém';
  const quando = new Date(r.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const res = d.tipo === 'dano' ? `${r.total} de dano` : `${r.total}${d.dif ? (d.passou ? ' · passou' : ' · falhou') : ''}`;
  const extra = d.marcante ? ' · 20!' : d.desastre ? ' · tudo 1' : '';
  return `<div class="roll-row${d.passou === false ? ' fail' : ''}${d.marcante ? ' crit' : ''}"><span class="rr-who">${esc(nome)}</span><span class="rr-what">${esc(r.label)}<span class="dim small"> · ${esc((d.dados || []).join(', '))}</span></span><b>${esc(res + extra)}</b><span class="dim small">${quando}</span></div>`;
}
function viewRoller(c) {
  const p = c.data, ro = ui.roller, at = R.atrib(p);
  const mao = Math.min(5, (at[ro.attr] || 1) + ro.ajuste);
  const bonus = ro.pericia ? R.bonusPericia(R.grauPericia(p, ro.pericia)) : 0;
  const res = ro.res;
  return `<div class="roller-back" data-act="fecharRoll"></div>
  <section class="roller" role="dialog" aria-label="Rolagem">
    <div class="ro-head"><b>${esc(p.nome)}</b><button class="btn sm ghost" data-act="fecharRoll" aria-label="Fechar">Fechar</button></div>
    ${res ? `<div class="ro-res${res.passou === false ? ' fail' : res.passou ? ' ok' : ''}">
      <div class="ro-dice">${res.dados.map((x, i) => `<span class="die${x === res.fica && i === res.dados.indexOf(res.fica) ? ' kept' : ''}${x === 20 ? ' vinte' : ''}">${x}</span>`).join('')}</div>
      <div class="ro-total"><strong>${res.total}</strong><span>${res.vazia ? 'mão vazia: ficou o pior' : 'ficou o maior'}${res.bonus ? ` + ${res.bonus}` : ''}${res.dif ? ` · dificuldade ${res.dif}` : ''}</span></div>
      ${res.dif ? `<p class="ro-verdict">${res.passou ? 'Deu certo.' : 'Não deu.'}</p>` : ''}
      ${res.marcante ? '<p class="ro-note">Saiu um 20: o mestre acrescenta algo a seu favor.</p>' : ''}
      ${res.desastre ? '<p class="ro-note">Todos os dados deram 1: algo dá errado, mesmo que passe.</p>' : ''}
    </div>` : ''}
    <div><span class="flab">Atributo</span><div class="sub-opts">${R.ATRIBUTOS.map((a) => `<button class="pill${ro.attr === a.k ? ' sel' : ''}" data-ro-attr="${a.k}">${a.n} ${at[a.k]}</button>`).join('')}</div></div>
    <div><label class="flab" for="ro-per">Perícia</label><select class="field" id="ro-per"><option value="">Nenhuma</option>${R.PERICIAS.map(([n]) => { const g = R.grauPericia(p, n); return `<option value="${esc(n)}" ${ro.pericia === n ? 'selected' : ''}>${n}${g ? ` (+${R.bonusPericia(g)})` : ''}</option>`; }).join('')}</select></div>
    <div class="ro-adj"><div><span class="flab">Regra de ouro</span><p class="fhelp" style="margin:0">Pavor, ferida, cansaço tiram; ajuda, canto, calma devolvem.</p></div>
      <div class="stepper"><button data-ro-adj="-1" aria-label="Tirar um dado">−</button><span class="v">${ro.ajuste > 0 ? '+' + ro.ajuste : ro.ajuste}</span><button data-ro-adj="1" aria-label="Devolver um dado">+</button></div></div>
    <div><span class="flab">Dificuldade (o mestre diz)</span><div class="sub-opts">${R.DIFICULDADES.map(([n, t]) => `<button class="pill${ro.dif === n ? ' sel' : ''}" data-ro-dif="${n}">${n} <span class="dim small">${t}</span></button>`).join('')}</div></div>
    ${fisicoHtml(ro.cid)}
    <button class="btn primary block ro-go" data-act="rolar">${fisico(ro.cid) ? 'Digitar os dados: ' : 'Rolar '}${mao <= 0 ? '2d20 (mão vazia, fica o pior)' : `${mao}d20`}${bonus ? ` + ${bonus}` : ''}</button>
  </section>`;
}
async function registrar(c, label, res, detail) {
  const { data, error } = await sb.from('breu_rolls').insert({ character_id: c.id, user_id: S.session.user.id, label, total: res.total, detail }).select().single();
  if (!error && data && !S.rolls.some((r) => r.id === data.id)) { S.rolls.unshift(data); S.rolls = S.rolls.slice(0, 40); }
  if (error) toast('Rolou, mas não consegui mostrar para a mesa.');
  return data || null;
}

// ---------- evoluir ----------
function viewEvoluir(c) {
  const p = c.data, pend = R.melhoriasPendentes(p);
  ui.evo ||= {};
  const cabeca = `${top()}<p class="lbl" style="margin:0 0 6px"><a href="#/ficha/${c.id}" style="color:inherit;text-decoration:none">← ${esc(p.nome)}</a></p>`;
  if (R.precisaCaminho(p)) {
    const of = R.oficioDe(p);
    return `${cabeca}<h1>Escolha o caminho</h1>
      <p class="muted" style="margin-top:8px">No terceiro marco, ${esc(p.nome)} se aprofunda no ofício de ${of.n.toLowerCase()}. Você ganha as duas habilidades do caminho escolhido. Não dá para trocar depois.</p>
      <div class="opts">${of.caminhos.map((x) => `<button class="opt${ui.evo.caminho === x.k ? ' sel' : ''}" data-evo-caminho="${x.k}"><span class="meta">${esc(x.d)}</span><b>${esc(x.n)}</b>
        ${x.habs.map(([n, custo, d]) => `<p><b style="font-family:var(--body);font-size:15px">${n}.</b>${custo ? ` <span class="dim">(${custo})</span>` : ''} ${d}</p>`).join('')}</button>`).join('')}</div>
      <div class="wfoot"><a class="btn" href="#/ficha/${c.id}">Depois</a><button class="btn primary" data-act="confirmarCaminho" data-id="${c.id}" ${ui.evo.caminho ? '' : 'disabled'}>Seguir este caminho</button></div>`;
  }
  if (!pend) {
    return `${cabeca}<h1>Tudo em dia</h1><p class="muted" style="margin-top:8px">Não há marcos para gastar. O mestre dá marcos quando ${esc(p.nome)} vive algo que o muda.</p>
      ${p.melhorias.length ? `<button class="btn ghost" data-act="desfazer" data-id="${c.id}">Desfazer a última melhoria</button>` : ''}
      <div class="actions"><a class="btn primary" href="#/ficha/${c.id}">Ver a ficha</a></div>`;
  }
  const ops = R.opcoesMelhoria(p);
  const op = ops.find((o) => o.tipo === ui.evo.tipo);
  const alvoSel = op?.alvos.find((a) => a.v === ui.evo.alvo);
  let passo2 = '';
  if (op) {
    passo2 = `<h2 id="evo-alvos">${esc(op.n)}</h2><p class="intro">${esc(op.d)}</p>
      <div class="opts">${op.alvos.map((a) => `<button class="opt${ui.evo.alvo === a.v ? ' sel' : ''}" data-evo-alvo="${esc(a.v)}" ${a.bloq ? 'disabled' : ''}>${a.bloq ? `<span class="meta">${esc(a.bloq)}</span>` : ''}<b>${esc(a.n)}</b><p>${esc(a.d || '')}</p></button>`).join('')}</div>`;
    if (op.tipo === 'marca' && alvoSel) {
      passo2 += `<div><label class="flab">Com que tinta?</label><div class="opts">
        <button class="opt${!ui.evo.sangue ? ' sel' : ''}" data-evo-sangue="0"><b>Tinta comum</b><p>−1 no Prumo máximo.</p></button>
        <button class="opt${ui.evo.sangue ? ' sel' : ''}" data-evo-sangue="1"><b>Sangue de Assombro</b><p>Não reduz o Prumo e custa 1 Brasa a menos. Soma 1 de Sombra, para sempre. Sombra atual: ${R.barras(p).sombra} de 7.</p></button></div></div>`;
    }
  }
  return `${cabeca}<h1>Evoluir</h1>
    <p class="muted" style="margin-top:8px">Marco ${R.melhoriasFeitas(p) + 1}: <i>${esc(p.marcos[R.melhoriasFeitas(p)]?.motivo || '')}</i>. ${pend > 1 ? `Depois deste, ainda sobra${pend > 2 ? 'm' : ''} ${pend - 1}.` : ''}</p>
    <div class="opts">${ops.map((o) => `<button class="opt${ui.evo.tipo === o.tipo ? ' sel' : ''}" data-evo-tipo="${o.tipo}" ${o.bloq ? 'disabled' : ''}>${o.bloq ? `<span class="meta">${esc(o.bloq)}</span>` : ''}<b>${esc(o.n)}</b><p>${esc(o.d)}</p></button>`).join('')}</div>
    ${passo2}
    <div class="wfoot"><a class="btn" href="#/ficha/${c.id}">Depois</a><button class="btn primary" data-act="confirmarMelhoria" data-id="${c.id}" ${alvoSel && !alvoSel.bloq ? '' : 'disabled'}>Confirmar</button></div>`;
}

// ---------- administração ----------
function inviteLink(token) { return new URL('#/convite/' + token, location.href.split('#')[0]).href; }
function viewAdmin() {
  const abertos = S.invites.filter((i) => !i.revoked && (i.uses ?? 0) < (i.max_uses ?? 1));
  const usados = S.invites.filter((i) => (i.uses ?? 0) >= (i.max_uses ?? 1));
  return `${top()}
    <h1>Convites e pessoas</h1>
    <h2>Novo convite</h2>
    <form class="card form" data-form="invite">
      <div><label class="flab" for="nv-label">Para quem</label><input class="field" id="nv-label" name="label" placeholder="Ex.: Ana, ou Grupo da primeira mesa" maxlength="60" required></div>
      <div><label class="flab" for="nv-max">Quantas pessoas podem usar este link</label><p class="fhelp">1 para mandar no privado. Mais de 1 para mandar no grupo: o link para de funcionar quando todos entrarem.</p><input class="field" id="nv-max" name="max" type="number" min="1" max="30" value="1" style="width:110px"></div>
      <div><label class="flab" for="nv-role">Papel</label><select class="field" id="nv-role" name="role"><option value="player">Jogador</option><option value="gm">Mestre</option></select></div>
      <button class="btn primary">Criar link</button>
      <p class="small dim" style="margin:0">Quem já tem conta no Por Um Fio entra com o mesmo e-mail e senha.</p>
    </form>
    <h2>Links abertos</h2>
    ${abertos.length ? `<div class="list">${abertos.map((i) => `<div class="row"><div class="who"><b>${esc(i.label)}</b> <span class="dim small">${PAPEL[i.role]}${(i.max_uses ?? 1) > 1 ? ` · ${i.uses ?? 0} de ${i.max_uses} entraram` : ''}</span><div class="linkbox">${esc(inviteLink(i.token))}</div></div>
      <div style="display:flex;gap:6px"><button class="btn sm primary" data-act="copiar" data-token="${i.token}">Copiar</button><button class="btn sm ghost" data-act="revogar" data-token="${i.token}">Cancelar</button></div></div>`).join('')}</div>` : '<p class="muted">Nenhum link aberto.</p>'}
    <h2>Na mesa</h2>
    <div class="list">${S.members.map((m) => `<div class="row"><div class="who"><b>${esc(m.display_name)}</b></div>
      ${m.user_id === S.session.user.id ? `<span class="chip">${PAPEL[m.role]}</span>` : `<select class="field" data-role="${m.user_id}" aria-label="Papel de ${esc(m.display_name)}">${Object.entries(PAPEL).map(([k, v]) => `<option value="${k}" ${m.role === k ? 'selected' : ''}>${v}</option>`).join('')}</select>`}</div>`).join('')}</div>
    ${usados.length ? `<p class="small dim" style="margin-top:12px">${usados.length} convite${usados.length > 1 ? 's' : ''} já usado${usados.length > 1 ? 's' : ''}.</p>` : ''}`;
}

// ---------- eventos ----------
document.addEventListener('click', async (e) => {
  if (route().name === 'mapa' && e.target.closest('[data-mp]')) { await MAPA.click(e); return; }
  if (MESA && await MESA.click(e)) return;
  const t = e.target.closest('[data-dia],[data-po],[data-mesa-marca],[data-nt],[data-nt-pjs],[data-nt-fam],[data-nt-rm],[data-nt-pdif],[data-trk],[data-ret],[data-livre],[data-panico],[data-roll-attr],[data-roll-per],[data-roll-dmg],[data-ro-attr],[data-ro-adj],[data-ro-dif],[data-pronto],[data-act],[data-set],[data-attr],[data-ess],[data-evo-tipo],[data-evo-alvo],[data-evo-sangue],[data-evo-caminho]');
  if (!t) return;
  const wiz = t.closest('.wiz');
  const c = wiz ? charById(wiz.dataset.char) : null;

  if (t.dataset.set && c) {
    e.preventDefault();
    const k = t.dataset.set; let v = t.dataset.v;
    if (k === 'marcaSangue') v = v === '1';
    c.data[k] = v;
    if (k === 'origem') { c.data.periciaExtra = ''; if (v !== 'estrada') c.data.sotaqueEstrada = ''; }
    if (['origem', 'oficio', 'periciaExtra'].includes(k) && R.periciasFixas(c.data).includes(c.data.periciaLivre)) c.data.periciaLivre = '';
    if (k === 'oficio') { c.data.periciaExtra = ''; c.data.essencias = c.data.essencias.slice(0, R.essenciasPermitidas(c.data)); }
    if (k === 'dom' && v === 'adormecido') { c.data.marca = ''; c.data.marcaSangue = false; }
    if (k === 'dom') fitAttrs(c.data);
    if (k === 'marca' && !v) c.data.marcaSangue = false;
    saveSoon(c); rerender(); return;
  }
  if (t.dataset.po && c) {
    const k = t.dataset.po, arr = c.data.pos;
    if (arr.includes(k)) c.data.pos = arr.filter((x) => x !== k);
    else { arr.push(k); if (arr.length > 3) arr.shift(); }
    saveSoon(c); rerender(); return;
  }
  if (t.dataset.ess && c) {
    const e2 = t.dataset.ess, max = R.essenciasPermitidas(c.data), arr = c.data.essencias;
    if (arr.includes(e2)) c.data.essencias = arr.filter((x) => x !== e2);
    else { arr.push(e2); if (arr.length > max) arr.shift(); }
    saveSoon(c); rerender(); return;
  }
  if (t.dataset.attr && c) {
    const k = t.dataset.attr, d = +t.dataset.d, p = c.data;
    const nv = p.atrib[k] + d;
    if (nv < 1 || nv > 4) return;
    if (d > 0 && R.pontosUsados(p) >= R.pontosTotais(p)) return;
    p.atrib[k] = nv; saveSoon(c); rerender(); return;
  }

  const fc = route().name === 'ficha' ? charById(route().arg) : null;
  if (fc && (t.dataset.rollAttr || t.dataset.rollPer)) {
    const per = t.dataset.rollPer || '';
    ui.roller = { cid: fc.id, attr: t.dataset.rollAttr || R.PERICIA_ATRIB[per] || 'juizo', pericia: per, ajuste: ui.roller?.ajuste || 0, dif: ui.roller?.dif || 0, res: null };
    rerender(); return;
  }
  if (fc && t.dataset.rollDmg) {
    let df = null;
    if (fisico(fc.id)) { const q = R.dadosDe(t.dataset.rollDmg); df = await pedirDados({ n: q.n, faces: q.f, titulo: `Dano: ${t.dataset.arma}`, como: q.n > 1 ? 'O app soma todos.' : '' }); if (!df) return; }
    const r = R.rolarDano(t.dataset.rollDmg, df); if (!r) return;
    toast(`${t.dataset.arma}: ${r.total} de dano (${t.dataset.rollDmg})`);
    registrar(fc, `Dano: ${t.dataset.arma}`, r, { tipo: 'dano', dados: r.dados, expr: r.expr, ...(df ? { fisico: true } : {}) }); return;
  }
  if (ui.roller && t.dataset.roAttr) { ui.roller.attr = t.dataset.roAttr; ui.roller.res = null; rerender(); return; }
  if (ui.roller && t.dataset.roAdj) { ui.roller.ajuste = Math.max(-5, Math.min(4, ui.roller.ajuste + +t.dataset.roAdj)); ui.roller.res = null; rerender(); return; }
  if (ui.roller && t.dataset.roDif) { const n = +t.dataset.roDif; ui.roller.dif = ui.roller.dif === n ? 0 : n; ui.roller.res = null; rerender(); return; }
  if (t.dataset.livre) { const c = charById(route().arg); if (!c || c.owner !== S.session?.user.id && !isGM()) return; c.data.periciaLivre = t.dataset.v; await saveNow(c); rerender(); toast('Perícia livre escolhida.'); return; }
  if (route().name === 'mapa' && isGM() && (t.dataset.trk || t.dataset.panico)) {
    S.noite ||= novaNoite(); const n = S.noite;
    if (t.dataset.trk) { const [id, k, dlt] = t.dataset.trk.split(':'); const c = charById(id), tr = trackerDe(c), b = R.barras(c.data);
      const max = { sangue: b.sangue, prumo: b.prumo, brasa: b.brasa, pavor: 9, vigias: 999 }[k]; const antes = tr[k]; tr[k] = Math.max(0, Math.min(max, tr[k] + +dlt));
      if (k === 'sangue' && tr[k] < antes) MAPA.api.efeitoTodos({ tipo: 'dano', cid: c.id, nome: c.data.nome, valor: antes - tr[k] }); }
    if (t.dataset.panico) { const c = charById(t.dataset.panico), r = M.d(20), l = M.tabela(M.PANICO, r); logNoite(`${c.data.nome} entrou em pânico (${r}): ${l[2]}`); toast(`${c.data.nome}: ${l[2]}`); }
    salvarNoite(); rr(); return;
  }
  if (route().name === 'noite' && S.noite) {
    const n = S.noite;
    if (t.dataset.mesaMarca) {
      S.mesa = { ...S.mesa, marcaInicial: t.dataset.mesaMarca === 'true' };
      sb.from('breu_state').upsert({ key: 'mesa', value: S.mesa, updated_at: new Date().toISOString() }).then(({ error }) => toast(error ? 'Não consegui salvar.' : 'Regra da mesa salva.'));
      rerender(); return;
    }
    if (t.dataset.dia != null) { n.dia = +t.dataset.dia; logNoite(`Dia: ${CT.PARTES_DIA[n.dia].n}.`); salvarNoite(); rerender(); return; }
    if (t.dataset.nt === 'tipo') { n.tipo = t.dataset.v; salvarNoite(); rerender(); return; }
    if (t.dataset.ntPjs) { n.pjs = Math.max(1, Math.min(8, n.pjs + +t.dataset.ntPjs)); salvarNoite(); rerender(); return; }
    if (t.dataset.ntFam) { const f = t.dataset.ntFam; n.familias = n.familias.includes(f) ? n.familias.filter((x) => x !== f) : [...n.familias, f].slice(-2); salvarNoite(); rerender(); return; }
    if (t.dataset.ntRm) { const [i, j] = t.dataset.ntRm.split(':').map(Number); n.fases[i].splice(j, 1); salvarNoite(); rerender(); return; }
    if (t.dataset.ntPdif) { n.pavorDif = +t.dataset.ntPdif; salvarNoite(); rerender(); return; }
    if (t.dataset.trk) { const [id, k, dlt] = t.dataset.trk.split(':'); const c = charById(id), tr = trackerDe(c), b = R.barras(c.data);
      const max = { sangue: b.sangue, prumo: b.prumo, brasa: b.brasa, pavor: 9, vigias: 999 }[k]; tr[k] = Math.max(0, Math.min(max, tr[k] + +dlt));
      salvarNoite(); rerender(); return; }
    if (t.dataset.ret) { const [id, k] = t.dataset.ret.split(':'); n.retrato = { ...(n.retrato || {}), [id]: k }; salvarNoite(); rerender(); return; }
    if (t.dataset.panico) { const c = charById(t.dataset.panico), r = M.d(20), l = M.tabela(M.PANICO, r);
      logNoite(`${c.data.nome} entrou em pânico (${r}): ${l[2]}`); toast(`${c.data.nome}: ${l[2]}`); salvarNoite(); rerender(); return; }
  }
  if (t.dataset.pronto) {
    const base = R.PRONTOS.find((x) => x.id === t.dataset.pronto); if (!base) return;
    t.disabled = true;
    const d = JSON.parse(JSON.stringify(base)); d.pronto = d.id; delete d.id;
    const { data, error } = await sb.from('breu_characters').insert({ owner: S.session.user.id, data: d, name: d.nome, status: 'rascunho' }).select().single();
    if (error) { toast('Não consegui pegar este personagem. Tente de novo.'); t.disabled = false; return; }
    data.data = R.norm(data.data); S.chars.push(data); go(`criar/${data.id}/6`); return;
  }
  if (t.dataset.evoTipo) { ui.evo = { tipo: t.dataset.evoTipo }; rerender(); $('#evo-alvos')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
  if (t.dataset.evoAlvo) { ui.evo.alvo = t.dataset.evoAlvo; rerender(); if (ui.evo.tipo !== 'marca') $('.wfoot')?.scrollIntoView({ behavior: 'smooth', block: 'end' }); return; }
  if (t.dataset.evoSangue) { ui.evo.sangue = t.dataset.evoSangue === '1'; rerender(); return; }
  if (t.dataset.evoCaminho) { ui.evo = { caminho: t.dataset.evoCaminho }; rerender(); return; }

  const act = t.dataset.act;
  if (S.noite && route().name === 'noite') {
    const n = S.noite;
    if (act === 'evento') { const r = M.d(20); n.evento = { r, t: CT.EVENTOS_ESTRADA[r - 1] }; logNoite(`Estrada (${r}): ${n.evento.t}`); salvarNoite(); rerender(); return; }
    if (act === 'sortear') { n.fases = M.sortear(M.ameacaTotal(n.tipo, n.pjs), n.familias); salvarNoite(); rerender(); return; }
    if (act === 'pressagio') { const r = M.d(20), l = M.tabela(M.PRESSAGIOS, r); n.pressagio = { r, t: l[2], s: l[3] }; salvarNoite(); rerender(); return; }
    if (act === 'complicacao') { n.paisagem = $('#nt-pais').value; n.complicacao = M.pick(M.COMPLICACOES[n.paisagem] || Object.values(M.COMPLICACOES)[0]); salvarNoite(); rerender(); return; }
    if (act === 'virarFase') { t.disabled = true; await virarFase(); return; }
    if (act === 'novaNoite') { if (!confirm('Começar uma nova noite? O relógio, o grupo e o círculo voltam ao início.')) return; S.noite = novaNoite(); salvarNoite(); rerender(); return; }
    if (act === 'investida') { n.circulo = Math.max(0, n.circulo - 3); logNoite(`Investida no círculo: força ${n.circulo}.`); salvarNoite(); rerender(); return; }
    if (act === 'brecha') { n.circulo = 0; logNoite('O círculo abriu uma brecha.'); salvarNoite(); rerender(); return; }
    if (act === 'refazer') { n.circulo = Math.max(0, +$('#nt-forca').value || 0); logNoite(`Círculo refeito com força ${n.circulo}.`); salvarNoite(); rerender(); return; }
  }
  if (act === 'fecharRoll') { ui.roller = null; rerender(); return; }
  if (act === 'rolar' && fc && ui.roller) {
    const ro = ui.roller;
    let df = null;
    if (fisico(fc.id)) { const n = Math.min(5, (R.atrib(fc.data)[ro.attr] || 1) + ro.ajuste); df = await pedirDados({ n: n <= 0 ? 2 : n, titulo: [ATN[ro.attr], ro.pericia].filter(Boolean).join(' + '), como: n <= 0 ? 'Mão vazia: vale o <b>menor</b> deles.' : n > 1 ? 'Vale o <b>maior</b>.' : '' }); if (!df) return; }
    const res = R.rolar(fc.data, { ...ro, dadosFisicos: df });
    ro.res = res; rerender();
    const label = [ATN[ro.attr], ro.pericia].filter(Boolean).join(' + ');
    registrar(fc, label, res, { tipo: 'teste', dados: res.dados, fica: res.fica, bonus: res.bonus, mao: res.mao, ajuste: ro.ajuste, dif: ro.dif, passou: res.passou, marcante: res.marcante, desastre: res.desastre, vazia: res.vazia, ...(df ? { fisico: true } : {}) });
    return;
  }
  if (act === 'sugerir') {
    const ch = charById($('.wiz').dataset.char), a = R.sugerirAtributos(ch.data);
    if (a) { ch.data.atrib = a; saveSoon(ch); rerender(); toast('Distribuí pelos atributos fortes do ofício. Ajuste à vontade.'); }
    return;
  }
  if (act === 'confirmarCaminho') {
    const ch = charById(t.dataset.id); ch.data.caminho = ui.evo.caminho;
    const ok = await saveNow(ch); toast(ok ? 'Caminho escolhido.' : 'Não consegui salvar.'); ui.evo = null; rerender(); return;
  }
  if (act === 'confirmarMelhoria') {
    const ch = charById(t.dataset.id);
    const m = { tipo: ui.evo.tipo, alvo: ui.evo.alvo }; if (m.tipo === 'marca') m.sangue = !!ui.evo.sangue;
    ch.data.melhorias.push(m);
    const ok = await saveNow(ch);
    if (!ok) { ch.data.melhorias.pop(); toast('Não consegui salvar.'); return; }
    toast(R.descreveMelhoria(m) + '.'); ui.evo = null;
    if (R.melhoriasPendentes(ch.data) || R.precisaCaminho(ch.data)) { rerender(); window.scrollTo(0, 0); } else go('ficha/' + ch.id);
    return;
  }
  if (act === 'desfazer') {
    const ch = charById(t.dataset.id); const m = ch.data.melhorias.pop();
    if (!(await saveNow(ch))) { ch.data.melhorias.push(m); toast('Não consegui desfazer.'); return; }
    toast('Desfeito: ' + R.descreveMelhoria(m) + '.'); rerender(); return;
  }
  if (act === 'darMarco') {
    const sel = $('#mc-mot'), motivo = sel.value || $('#mc-out').value.trim();
    if (!motivo) { toast('Escreva o motivo do marco.'); return; }
    const { error } = await sb.rpc('breu_dar_marco', { cid: t.dataset.id, motivo });
    if (error) return toast('Não consegui dar o marco.');
    const ch = charById(t.dataset.id); ch.data.marcos.push({ motivo }); toast('Marco dado.'); rerender(); return;
  }
  if (act === 'tirarMarco') {
    const { error } = await sb.rpc('breu_tirar_marco', { cid: t.dataset.id });
    if (error) return toast('Não consegui tirar.');
    charById(t.dataset.id).data.marcos.pop(); toast('Último marco retirado.'); rerender(); return;
  }
  if (act === 'subirDom') {
    const { error } = await sb.rpc('breu_subir_dom', { cid: t.dataset.id, delta: 1 });
    if (error) return toast('Não consegui subir o Dom.');
    const ch = charById(t.dataset.id); ch.data.domSubidas = (ch.data.domSubidas || 0) + 1; toast('O Dom subiu: ' + R.domDe(ch.data).n + '.'); rerender(); return;
  }
  if (act === 'logout') { await sb.auth.signOut(); S.me = null; location.hash = '#/'; return; }
  if (act === 'novo') {
    t.disabled = true;
    const { data, error } = await sb.from('breu_characters').insert({ owner: S.session.user.id, data: R.novoPersonagem(), status: 'rascunho' }).select().single();
    if (error) { toast('Não consegui começar. Tente de novo.'); t.disabled = false; return; }
    data.data = R.norm(data.data); S.chars.push(data); go(`criar/${data.id}/0`); return;
  }
  if (act === 'enviar') {
    const ch = charById(t.dataset.id);
    if (ch.status === 'rascunho') ch.status = 'pronto';
    const ok = await saveNow(ch);
    if (ok) await sb.from('breu_characters').update({ status: ch.status }).eq('id', ch.id);
    toast(ok ? (ch.status === 'pronto' ? 'Enviado ao mestre!' : 'Salvo.') : 'Não consegui salvar.');
    go('ficha/' + ch.id); return;
  }
  if (act === 'status') {
    const ch = charById(t.dataset.id);
    const { error } = await sb.from('breu_characters').update({ status: t.dataset.v }).eq('id', ch.id);
    if (error) return toast('Não consegui mudar.');
    ch.status = t.dataset.v; toast(STATUS[ch.status]); rerender(); return;
  }
  if (act === 'apagar') {
    if (!confirm('Apagar este personagem? Não dá para desfazer.')) return;
    const { error } = await sb.from('breu_characters').delete().eq('id', t.dataset.id);
    if (error) return toast('Não consegui apagar.');
    S.chars = S.chars.filter((x) => x.id !== t.dataset.id); go(''); return;
  }
  if (act === 'joinLogged') {
    ui.busy = true; ui.inviteErr = ''; render();
    const r = await fn({ action: 'breu_accept', token: ui.invite.token, name: $('#iv-nome').value });
    ui.busy = false;
    if (r.error) { ui.inviteErr = r.error; render(); return; }
    await loadAll(); subscribe(); go(''); return;
  }
  if (act === 'copiar') {
    const link = inviteLink(t.dataset.token);
    try { await navigator.clipboard.writeText(link); toast('Link copiado. Mande no WhatsApp.'); } catch { prompt('Copie o link:', link); }
    return;
  }
  if (act === 'revogar') {
    await sb.from('breu_invites').update({ revoked: true }).eq('token', t.dataset.token);
    await loadInvites(); render(); return;
  }
});

function fitAttrs(p) {
  // ao trocar o Dom, se os pontos passarem do total, tira do maior atributo
  while (R.pontosUsados(p) > R.pontosTotais(p)) {
    const k = R.ATRIBUTOS.map((a) => a.k).sort((a, b) => p.atrib[b] - p.atrib[a])[0];
    p.atrib[k]--;
  }
}

function rerender() { const y = window.scrollY; render(); window.scrollTo(0, y); }

document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset.k) {
    const c = charById(t.closest('.wiz')?.dataset.char);
    if (!c) return;
    c.data[t.dataset.k] = t.value; saveSoon(c); return;
  }
  if (t.dataset.gmnote) {
    const id = t.dataset.gmnote; S.notes[id] = t.value;
    clearTimeout(pending['gm' + id]);
    pending['gm' + id] = setTimeout(() => sb.from('breu_gm_notes').upsert({ character_id: id, note: S.notes[id], updated_at: new Date().toISOString() }), 800);
  }
});

document.addEventListener('change', async (e) => {
  const t = e.target;
  if (route().name === 'mapa' && await MAPA.onChange(t)) return;
  if (route().name === 'mapa' && MESA && await MESA.onChange(t)) return;
  if (t.dataset.ntAdd != null && t.value && S.noite) { S.noite.fases[+t.dataset.ntAdd].push(t.value); salvarNoite(); rerender(); return; }
  if (t.id === 'ro-per' && ui.roller) { ui.roller.pericia = t.value; if (t.value) ui.roller.attr = R.PERICIA_ATRIB[t.value] || ui.roller.attr; ui.roller.res = null; rerender(); return; }
  if (t.id === 'mc-mot') { $('#mc-out').style.display = t.value ? 'none' : 'block'; return; }
  if (t.dataset.role) {
    const { error } = await sb.from('breu_members').update({ role: t.value }).eq('user_id', t.dataset.role);
    if (error) { toast('Não consegui mudar o papel.'); return; }
    const m = S.members.find((x) => x.user_id === t.dataset.role); if (m) m.role = t.value;
    toast('Papel atualizado.');
  }
});

document.addEventListener('submit', async (e) => {
  const f = e.target, kind = f.dataset.form;
  if (f.dataset.mpform) { e.preventDefault(); await MAPA.onSubmit(f); return; }
  if (f.dataset.msForm) { e.preventDefault(); await MESA.onSubmit(f); return; }
  if (!kind) return;
  e.preventDefault();
  if (kind === 'login') {
    ui.busy = true; ui.loginErr = ''; render();
    const { error } = await sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.password.value });
    ui.busy = false;
    if (error) { ui.loginErr = 'E-mail ou senha não conferem.'; render(); }
    return;
  }
  if (kind === 'accept') {
    const body = { action: 'breu_accept', token: ui.invite.token, name: f.name.value, email: f.email.value, password: f.password.value };
    ui.busy = true; ui.inviteErr = ''; render();
    const r = await fn(body);
    if (r.error) { ui.busy = false; ui.inviteErr = r.error; render(); return; }
    const { error } = await sb.auth.signInWithPassword({ email: body.email.trim().toLowerCase(), password: body.password });
    ui.busy = false;
    if (error) { ui.inviteErr = 'Conta pronta, mas não consegui entrar. Tente pela tela de entrada.'; render(); return; }
    location.hash = '#/';
    return;
  }
  if (kind === 'invite') {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');
    const { error } = await sb.from('breu_invites').insert({ token, label: f.label.value.trim(), role: f.role.value, max_uses: Math.max(1, Math.min(30, +f.max.value || 1)), created_by: S.session.user.id });
    if (error) { toast('Não consegui criar o link.'); return; }
    await loadInvites(); render();
    try { await navigator.clipboard.writeText(inviteLink(token)); toast('Link criado e copiado.'); } catch { toast('Link criado.'); }
  }
});

// o mestre que estica ou encolhe a janela troca de tela
const formato = () => (window.innerWidth >= 1100 ? 2 : window.innerWidth >= 1000 ? 1 : 0);
let largo = formato();
window.addEventListener('resize', () => { const l = formato(); if (l !== largo) { largo = l; if (route().name === 'mapa') render(); } });

window.addEventListener('hashchange', () => { ui.saved = ''; ui.evo = null; ui.roller = null; render(); window.scrollTo(0, 0); });

// ---------- início ----------
async function boot() {
  criarAMesa();
  const { data: { session } } = await sb.auth.getSession();
  S.session = session;
  if (session) { await loadAll(); if (S.me) { subscribe(); MESA.baixarVideo(); } }
  S.ready = true;
  render();
  sb.auth.onAuthStateChange(async (event, sess) => {
    if (event === 'SIGNED_IN' && (!S.session || S.session.user.id !== sess?.user.id)) {
      S.session = sess; await loadAll(); if (S.me) { subscribe(); MESA.baixarVideo(); } render();
    } else if (event === 'SIGNED_OUT') {
      S.session = null; S.me = null; S.chars = []; render();
    } else if (sess) S.session = sess;
  });
}
boot();
