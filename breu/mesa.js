// A mesa ao vivo: a tela do mestre no computador (guia, mapa e painel juntos),
// o pedido de rolagem, os dados que rolam no meio do mapa e o vídeo de abertura.
import * as R from './regras.js';
import * as M from './mestre-dados.js';
import { CENAS_VIVAS } from './cenas-vivas.js?v=20';
import { criarGuia, faixaDe } from './guia.js?v=8';
import { ROLA, FX_C } from './guia-dados.js?v=5';

const ATR = { Vigor: 'vigor', Agilidade: 'agilidade', Juízo: 'juizo', Presença: 'presenca', Firmeza: 'firmeza' };
const ATN = Object.fromEntries(R.ATRIBUTOS.map((a) => [a.k, a.n]));
const ORDEM_CENAS = Object.keys(CENAS_VIVAS);
const CURTO = { estrada: 'Estrada', vila: 'Vila', moco: 'Mocó', velorio: 'Velório', farinha: 'Casa de farinha', zuleide: 'Zuleide' };
const VIDEO = 'video/abertura.mp4';
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

export function criarMesa(ctx) {
  const { sb, S, esc, toast, isGM, MAPA } = ctx;
  const A = MAPA.api;
  const U = { aba: 'rolagens', novas: 0, scroll: 0, dk: false };
  const pjs = () => S.chars.filter((c) => c.status === 'aprovado');
  const noMapa = () => ctx.route().name === 'mapa';
  const desktop = () => isGM() && window.innerWidth >= 1100;

  // ---------- o guia ----------
  let salvarT = null;
  const G = criarGuia({
    S, R, esc,
    salvar: (E) => { S.guia = E; MAPA.redraw(); clearTimeout(salvarT); salvarT = setTimeout(() => sb.from('breu_state').upsert({ key: 'guia', value: E, updated_at: new Date().toISOString() }), 500); },
    repintar: (topo) => { pintarGuia(topo); pintarPainel(); MAPA.redraw(); },
    nomeAcao, acao: (t, v) => acao(t, v), pedir: (p) => pedir(p), encerrar: (id) => encerrar(id),
  });
  G.setEstado(S.guia);

  function nomeCena(key) { return A.cenaDe(key)?.nome || CENAS_VIVAS[key]?.nome || key; }
  function nomeBest(id) { return M.BESTIARIO.find((b) => b.id === id)?.nome || 'Assombro'; }
  function nomeAcao(tipo, v) {
    if (tipo === 'video') return 'Passar a abertura para todos';
    if (tipo === 'cena') { const c = A.cenaDe(v); return c && A.ativa() === c.id ? `✓ No ar: ${nomeCena(v)}` : `Mostrar: ${nomeCena(v)}`; }
    if (tipo === 'grupo') { const n = A.grupoFalta(); return n ? `Colocar o grupo no mapa (${n})` : '✓ O grupo está no mapa'; }
    if (tipo === 'npc') return A.temNpc(v) ? `✓ ${v} está no mapa` : `Pôr ${v} no mapa`;
    if (tipo === 'assombro') return `Pôr ${nomeBest(v)} (escondido)`;
    if (tipo === 'revelar') return `Revelar ${nomeBest(v)} aos jogadores`;
    if (tipo === 'forma') return A.formaDe(v) ? `Mostrar a forma verdadeira de ${v}` : null;
    if (tipo === 'fase') {
      const i = +v, f = M.FASES[i], agora = S.noite?.fase ?? -1;
      if (!f) return null;
      return agora >= i ? `✓ ${f.n}` : i === 0 ? 'Começar a noite: Crepúsculo' : `Virar para ${f.n}`;
    }
    return null;
  }
  async function acao(tipo, v) {
    if (tipo === 'video') { tocarVideo(); return; }
    if (tipo === 'cena') { const c = await A.garantirCena(v); if (c) await A.mostrarCena(c.id); }
    else if (tipo === 'grupo') await A.porGrupo();
    else if (tipo === 'npc') await A.porNpc(v);
    else if (tipo === 'assombro') await A.porAssombro(v);
    else if (tipo === 'revelar') await A.revelarAssombro(v);
    else if (tipo === 'forma') await A.trocarForma(v);
    else if (tipo === 'fase') {
      const i = +v, agora = S.noite?.fase ?? -1;
      if (agora >= i) { toast('Esta fase já começou.'); return; }
      if (i !== agora + 1) { toast(`Antes, vire para ${M.FASES[agora + 1].n}.`); return; }
      await virar();
    }
    pintarGuia(); pintarPainel();
  }
  async function virar() { ctx.garantirNoite(); await ctx.virarFase(); pintarTopo(); pintarGuia(); pintarPainel(); MAPA.redraw(); }

  // ---------- pedido de rolagem ----------
  // vários pedidos podem ficar no ar ao mesmo tempo; cada um some quando o mestre encerra
  async function salvarPedidos() {
    const { error } = await sb.from('breu_state').upsert({ key: 'pedido', value: { lista: S.pedidos }, updated_at: new Date().toISOString() });
    if (error) toast('Não consegui mandar o pedido.');
    pintarPainel(); pintarGuia(); pintarDock();
    return !error;
  }
  async function pedir(p) {
    S.pedidos ||= [];
    // pedir de novo a mesma rolagem do guia troca a antiga; um Pavor novo troca o Pavor velho
    S.pedidos = S.pedidos.filter((x) => !(p.rola && x.rola === p.rola) && !(p.pavor && x.pavor));
    S.pedidos = [...S.pedidos, { id: uuid(), em: Date.now(), ...p }].slice(-8);
    if (await salvarPedidos()) { toast('Pedido enviado: ' + p.label + '.'); U.aba = 'rolagens'; pintarPainel(); }
  }
  async function encerrar(id) { S.pedidos = (S.pedidos || []).filter((x) => x.id !== id); await salvarPedidos(); }
  const respostas = (p) => S.rolls.filter((r) => r.detail?.pedido === p.id);

  // ---------- a tela do mestre ----------
  function viewGM() {
    ctx.garantirNoite();
    A.setMesa(true);
    if (!A.loaded()) return MAPA.view();
    const c = A.cena();
    return `<div class="mesa" data-mproot>
      <header class="ms-top">
        <a class="ms-logo" href="#/" aria-label="Fichas"><img src="img/logo-horizontal.webp" alt="Breu"></a>
        <div class="ms-cenas" data-ms-cenas>${cenasHtml()}</div>
        <div class="ms-rel" data-ms-rel>${relogioHtml()}</div>
        <div class="ms-links"><button class="btn sm" data-ms="video" title="Toca a abertura em cima do mapa, para todos; no fim, mostra a estrada">▶ Abertura</button><a class="ms-link" href="#/noite" title="Montar a noite e as regras">Noite</a><a class="ms-link" href="#/" title="As fichas">Fichas</a></div>
      </header>
      <aside class="ms-guia" data-ms-guia>${G.html()}</aside>
      <section class="ms-centro">
        ${c ? `<div class="ms-mhead"><div class="ms-mnome"><span class="lbl">${A.ativa() === c.id ? '<i class="ms-ponto"></i>Os jogadores veem' : 'Só você vê esta cena'}</span><h1>${esc(c.nome)}</h1></div>
          <button class="btn sm ms-addb ${U.add ? 'on' : ''}" data-ms="add" aria-expanded="${!!U.add}">+ Pôr no mapa</button>
          <div class="mp-rod"><span class="lbl">Rodada</span><b data-mp-rodada>${c.rodada}</b></div></div>
          <div class="ms-add" data-ms-add ${U.add ? '' : 'hidden'}><div data-mpadd>${A.addHtml()}</div><details class="mp-more"><summary>Cenários próprios</summary>${A.listaCenas()}${A.formNovaCena(false)}</details></div>
          <div class="mp-bar" data-mpbar>${A.barHtml()}</div>
          ${A.stageHtml()}`
        : `<div class="ms-vazio"><h1>Nenhum cenário ainda</h1><p class="muted">Crie os cenários da one-shot. Eles ficam guardados e só aparecem para os jogadores quando você mostrar.</p><button class="btn primary" data-mp="vivas">Criar os cenários vivos</button></div>`}
      </section>
      <aside class="ms-painel">
        <div class="ms-sel mp-side" data-mpside>${A.sideHtml()}</div>
        <nav class="ms-abas" role="tablist">${[['rolagens', 'Rolagens'], ['grupo', 'Grupo'], ['mesa', 'A história']].map(([k, n]) => `<button role="tab" aria-selected="${U.aba === k}" class="${U.aba === k ? 'on' : ''}" data-ms="aba" data-v="${k}">${n}${k === 'rolagens' && U.novas && U.aba !== k ? `<i>${U.novas}</i>` : ''}</button>`).join('')}</nav>
        <div class="ms-aba" data-ms-aba>${abaHtml()}</div>
      </aside>
    </div>`;
  }

  function cenasHtml() {
    const cs = [...A.cenas()].sort((a, b) => ordem(a) - ordem(b));
    const falta = ORDEM_CENAS.filter((k) => !A.cenaDe(k));
    return cs.map((c) => `<div class="ms-cena ${c.id === A.ver() ? 'ver' : ''} ${c.id === A.ativa() ? 'ar' : ''}">
        <button class="ms-cn" data-mp="ver" data-v="${c.id}" title="${esc(c.nome)}: ver aqui, sem mostrar">${esc(CURTO[c.img?.slice(5)] || c.nome)}${A.separados().filter((x) => x.cena === c.id).map((x) => `<span class="ms-sep" title="${esc(x.ch.data.nome)} está aqui, sozinho">${esc(x.ch.data.nome.split(' ')[0])}</span>`).join('')}</button>
        ${c.id === A.ativa() ? '<span class="ms-ar">no ar</span>' : `<button class="ms-mostrar" data-mp="mostrarId" data-v="${c.id}" title="Mostrar aos jogadores" aria-label="Mostrar ${esc(c.nome)} aos jogadores">▶</button>`}</div>`).join('')
      + (falta.length && cs.length ? `<button class="ms-cena ms-mais" data-mp="vivas" title="Criar os cenários que faltam">+ ${falta.length}</button>` : '')
      + (A.ativa() ? `<button class="ms-preta" data-ms="tela-preta" title="Os jogadores ficam sem cena">Tela preta</button>` : '');
  }
  const ordem = (c) => { const k = c.img?.startsWith('viva:') ? c.img.slice(5) : ''; const i = ORDEM_CENAS.indexOf(k); return i < 0 ? 99 : i; };

  function relogioHtml(soVer) {
    const n = S.noite || {}, f = n.fase ?? -1, prox = soVer ? 9 : f + 1;
    return `<div class="ms-fases">${M.FASES.map((x, i) => `<span class="${i === f ? 'on' : i < f ? 'foi' : ''}" title="${esc(x.n)}"><img src="img/fase-${x.k}.webp" alt="">${i === f ? `<b>${esc(x.n)}</b>` : ''}</span>`).join('')}</div>
      ${prox <= 4 ? `<button class="btn sm ${f < 0 ? '' : 'primary'}" data-ms="fase" title="Vira a fase e pede a todos que rolem o Pavor">${prox === 0 ? 'Começar a noite' : `→ ${esc(M.FASES[prox].n)}`}</button>` : ''}`;
  }

  function abaHtml() {
    if (U.aba === 'grupo') return grupoHtml();
    if (U.aba === 'mesa') return `${circuloHtml()}${G.estadoHtml()}${S.noite?.log?.length ? `<div class="g-painel"><h4>O que aconteceu na noite</h4><ol class="ms-log">${S.noite.log.slice(0, 12).map((l) => `<li>${esc(l.t)}</li>`).join('')}</ol></div>` : ''}`;
    return rolagensHtml();
  }

  function circuloHtml() {
    const f = S.noite?.circulo ?? 14;
    return `<div class="g-painel ms-circ"><h4>O círculo da vila <small>os Assombros investem contra isto</small></h4>
      <div class="ms-cf"><b class="${f <= 0 ? 'rompido' : ''}">${f > 0 ? f : 'Brecha'}</b><div class="g-seg"><button data-ms="circ" data-v="-3">Investida (−3)</button><button data-ms="circ" data-v="-1">−1</button><button data-ms="circ" data-v="1">+1</button><button data-ms="circ" data-v="0">Brecha</button></div></div>
      <label class="ms-cr">Consertado com <input class="field sm" type="number" min="0" max="40" value="${Math.max(0, f)}" data-ms-forca> <span>(o resultado da rolagem de Traços)</span></label></div>`;
  }
  function rolagensHtml() {
    let h = '';
    for (const p of [...(S.pedidos || [])].reverse()) {
      const quem = p.quem?.length ? pjs().filter((c) => p.quem.includes(c.id)) : pjs();
      const rs = respostas(p), r = p.rola ? ROLA[p.rola] : null;
      h += `<div class="ms-pedido"><div class="ms-ph"><span class="lbl">Pedido no ar</span><button class="btn sm ghost" data-g="cancelar" data-v="${p.id}">Encerrar</button></div>
        <b class="ms-pl">${esc(p.label)}</b><span class="ms-pper">${esc([p.per, p.alt].filter(Boolean).join(' ou '))}${p.dif ? ` · precisa de ${p.dif}` : ''}</span>
        <div class="ms-resp">${quem.map((c) => { const x = rs.find((y) => y.character_id === c.id);
          if (!x) return `<div class="ms-r esp"><img src="${esc(ctx.picChar(c))}" alt=""><span>${esc(c.data.nome)}</span><i>rolando…</i></div>`;
          const f = faixaDe(x.total);
          if (p.dif) return `<div class="ms-r ${x.total >= p.dif ? 'f2' : 'f0'}"><img src="${esc(ctx.picChar(c))}" alt=""><span>${esc(c.data.nome)}</span><b>${x.total}</b><p>${x.total >= p.dif ? 'Segurou o medo.' : p.pavor ? 'Falhou: ganhou 1 Pavor (já anotado no Grupo).' : 'Falhou.'}</p></div>`;
          return `<div class="ms-r f${f}"><img src="${esc(ctx.picChar(c))}" alt=""><span>${esc(c.data.nome)}</span><b>${x.total}</b>${r ? `<p><em>${FX_C[f]}</em> ${esc(r.f[f])}</p>` : ''}</div>`; }).join('')}</div></div>`;
    }
    h += !U.livre ? `<button class="btn sm block ghost" data-ms="livre">+ Pedir outra rolagem</button>` : `<form class="ms-livre" data-ms-form="pedir"><span class="lbl">Pedir uma rolagem</span>
      <div class="ms-lr"><select class="field sm" name="per" aria-label="O que rolar"><optgroup label="Perícias">${R.PERICIAS.map(([n]) => `<option>${n}</option>`).join('')}</optgroup><optgroup label="Atributos">${Object.keys(ATR).map((n) => `<option>${n}</option>`).join('')}</optgroup></select>
      <select class="field sm" name="quem" aria-label="Quem rola"><option value="">Todos</option>${pjs().map((c) => `<option value="${c.id}">${esc(c.data.nome)}</option>`).join('')}</select>
      <button class="btn sm primary">Pedir</button></div>
      <p class="ms-dica">Aparece na tela de quem você escolheu, com um botão para rolar. A resposta chega aqui.</p></form>`;
    if (!(S.pedidos || []).length && !U.livre) h = `<p class="ms-dica">Os pedidos de rolagem saem dos botões do guia, à esquerda. As respostas aparecem aqui.</p>` + h;
    h += `<div class="ms-feed">${S.rolls.slice(0, 18).map(linhaRoll).join('') || '<p class="ms-dica">Nenhuma rolagem ainda.</p>'}</div>`;
    return h;
  }
  function linhaRoll(r) {
    const c = ctx.charById(r.character_id), d = r.detail || {};
    const f = d.tipo === 'dano' ? 'dano' : 'f' + faixaDe(r.total);
    const hora = new Date(r.created_at || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `<div class="ms-rl ${f}">${c ? `<img src="${esc(ctx.picChar(c))}" alt="">` : '<span></span>'}<div><b>${esc(c?.data?.nome || 'Alguém')}</b><span>${esc(r.label)}${d.dif ? (d.passou ? ' · passou' : ' · falhou') : ''}</span><small>${esc((d.dados || []).join(' · '))}${d.bonus ? ' + ' + d.bonus : ''} · ${hora}</small></div><strong>${r.total}</strong></div>`;
  }

  function grupoHtml() {
    if (!pjs().length) return '<p class="ms-dica">Nenhuma ficha aprovada ainda.</p>';
    return `<div class="ms-grupo">${pjs().map((c) => {
      const t = ctx.trackerDe(c), b = R.barras(c.data);
      const cnt = (k, max, lbl) => `<div class="ms-cnt ${k}"><span>${lbl}</span><button data-trk="${c.id}:${k}:-1" aria-label="Menos ${lbl}">−</button><b>${t[k]}${max != null ? `<small>/${max}</small>` : ''}</b><button data-trk="${c.id}:${k}:1" aria-label="Mais ${lbl}">+</button></div>`;
      const est = ctx.estadoDe(c);
      return `<div class="ms-pj ${est !== 'inteiro' ? 'alerta' : ''}"><div class="ms-pjh"><span class="ms-pic ${ctx.estCls(c)}"><img src="${esc(ctx.picChar(c))}" alt=""></span><div><b>${esc(c.data.nome)}</b><small>Defesa ${b.defesa} · Firmeza ${R.atrib(c.data).firmeza}${t.pavor ? ` · <em>mão −${t.pavor}</em>` : ''}</small></div>
          <select class="ms-est" data-ms-est="${c.id}" aria-label="Retrato de ${esc(c.data.nome)}">${ctx.ESTADOS.map(([k, l]) => `<option value="${k}" ${(S.noite?.retrato?.[c.id] || 'auto') === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="ms-cnts">${cnt('sangue', b.sangue, 'Sangue')}${cnt('prumo', b.prumo, 'Prumo')}${cnt('pavor', null, 'Pavor')}${cnt('brasa', b.brasa, 'Brasa')}</div>
        ${t.prumo <= 0 ? `<button class="btn sm" data-panico="${c.id}">Rolar o pânico</button>` : ''}</div>`;
    }).join('')}</div>`;
  }

  // ---------- pintar sem recarregar a tela ----------
  function pintarGuia(topo) {
    const g = document.querySelector('[data-ms-guia]'); if (!g) return;
    const y = g.scrollTop; g.innerHTML = G.html(); g.scrollTop = topo ? 0 : y; if (topo) U.scroll = 0;
  }
  function pintarPainel() {
    const a = document.querySelector('[data-ms-aba]'); if (!a) return;
    const y = a.scrollTop; a.innerHTML = abaHtml(); a.scrollTop = y;
    const nav = document.querySelector('.ms-abas');
    if (nav) nav.querySelectorAll('button').forEach((b) => { const on = b.dataset.v === U.aba; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); const i = b.querySelector('i'); if (b.dataset.v === 'rolagens') { if (U.novas && !on) { if (i) i.textContent = U.novas; else b.insertAdjacentHTML('beforeend', `<i>${U.novas}</i>`); } else i?.remove(); } });
  }
  function pintarTopo() {
    const c = document.querySelector('[data-ms-cenas]'); if (c) c.innerHTML = cenasHtml();
    const r = document.querySelector('[data-ms-rel]'); if (r) r.innerHTML = relogioHtml();
    const l = document.querySelector('.ms-mnome .lbl'); const cn = A.cena();
    if (l && cn) l.innerHTML = A.ativa() === cn.id ? '<i class="ms-ponto"></i>Os jogadores veem' : 'Só você vê esta cena';
  }
  function repintar() { if (document.querySelector('.mesa')) { pintarTopo(); pintarGuia(); pintarPainel(); } pintarDock(); estadoProprio(); }

  function mount() {
    const g = document.querySelector('[data-ms-guia]');
    if (g) { g.scrollTop = U.scroll; g.addEventListener('scroll', () => { U.scroll = g.scrollTop; }, { passive: true }); }
    if (noMapa()) preCarregarVideo();
    estadoProprio();
  }

  // ---------- o jogador: pedido e dados ----------
  const uid = () => S.session?.user.id;
  function meuChar() {
    const t = A.tokens().find((x) => x.kind === 'pc' && x.owner === uid());
    return (t && ctx.charById(t.character_id)) || S.chars.find((c) => c.owner === uid() && c.status === 'aprovado') || null;
  }
  const pedidosPara = (c) => (c ? (S.pedidos || []).filter((p) => (!p.quem?.length || p.quem.includes(c.id)) && Date.now() - p.em < 90 * 60e3) : []);
  const pedidoPara = (c) => pedidosPara(c).at(-1) || null;
  const pavorDe = (c) => S.noite?.grupo?.[c.id]?.pavor || 0;
  function maoDe(c, per) {
    const at = R.atrib(c.data), attr = ATR[per] || R.PERICIA_ATRIB[per];
    const n = Math.min(5, (at[attr] || 1) - pavorDe(c)), b = ATR[per] ? 0 : R.bonusPericia(R.grauPericia(c.data, per));
    return { n, b, txt: `${n <= 0 ? '2d20 (fica o pior)' : n + 'd20'}${b ? '+' + b : ''}`, forca: (n <= 0 ? 0 : n * 10) + b * 2 };
  }
  function fichaMini(c) {
    const b = R.barras(c.data), t = S.noite?.grupo?.[c.id] || { sangue: b.sangue, prumo: b.prumo, pavor: 0, brasa: b.brasa };
    const barra = (k, n, max, lbl) => `<div class="jg-b ${k}"><span>${lbl}</span><b>${n}${max != null ? `<small>/${max}</small>` : ''}</b>${max ? `<i style="--p:${Math.max(0, Math.min(1, n / max))}"></i>` : ''}</div>`;
    return `<a class="jg-ficha" href="#/ficha/${c.id}" title="Abrir a ficha"><span class="ms-pic ${ctx.estCls(c)}"><img src="${esc(ctx.picChar(c))}" alt=""></span><div><b>${esc(c.data.nome)}</b><small>Defesa ${b.defesa}${t.pavor ? ` · <em>Pavor ${t.pavor}</em>` : ''}</small></div></a>
      <div class="jg-barras">${barra('sangue', t.sangue, b.sangue, 'Sangue')}${barra('prumo', t.prumo, b.prumo, 'Prumo')}${barra('pavor', t.pavor, null, 'Pavor')}${b.brasa ? barra('brasa', t.brasa, b.brasa, 'Brasa') : ''}</div>`;
  }
  function dockHtml(lateral) {
    if (isGM() && desktop()) return '';
    const c = meuChar(); if (!c || c.owner !== uid()) return lateral ? '<p class="ms-dica">Seu personagem ainda não foi aprovado pelo mestre.</p>' : '';
    let h = lateral ? fichaMini(c) : '';
    const aberto = lateral || U.dk;
    const meus = pedidosPara(c), ultimo = meus.at(-1);
    for (const p of meus) {
      const feito = S.rolls.find((r) => r.character_id === c.id && r.detail?.pedido === p.id);
      if (feito && p !== ultimo) continue;
      if (feito) h += `<div class="dk-card feito"><span class="lbl">${esc(p.label)}</span><p>Você tirou <b>${feito.total}</b>${p.dif ? (feito.total >= p.dif ? `, contra ${p.dif}: segurou o medo.` : `, contra ${p.dif}: ganhou 1 Pavor (um dado a menos em tudo até o amanhecer).`) : '. O mestre conta o que acontece.'}</p></div>`;
      else {
        const ops = [p.per, p.alt].filter(Boolean).map((per) => ({ per, ...maoDe(c, per) }));
        const top = Math.max(...ops.map((o) => o.forca));
        h += `<div class="dk-card pede"><span class="lbl">O mestre pede</span><b class="dk-t">${esc(p.label)}</b>${p.dif ? `<p class="dk-nota" style="margin:-6px 0 10px">Precisa tirar ${p.dif} ou mais.</p>` : ''}
          <div class="dk-bts">${ops.map((o) => `<button class="btn primary ${ops.length === 1 || o.forca === top ? 'melhor' : ''}" data-dk="rolar" data-per="${esc(o.per)}" data-ped="${p.id}"><span>Rolar ${esc(o.per)}</span><small>${o.txt}</small></button>`).join('')}</div>
          ${pavorDe(c) ? `<p class="dk-nota">Pavor ${pavorDe(c)}: um dado a menos por Pavor.</p>` : ''}</div>`;
      }
    }
    const pers = [...Object.keys(ATR).map((n) => ({ n, a: true })), ...R.PERICIAS.map(([n]) => ({ n, g: R.grauPericia(c.data, n) }))];
    h += `<div class="dk-livre ${aberto ? 'aberto' : ''}">
      ${aberto ? `<div class="dk-folha"><div class="dk-fh"><b>${lateral ? 'Rolar dados' : 'Rolar como ' + esc(c.data.nome)}</b>${lateral ? '' : '<button class="btn sm ghost" data-dk="fechar">Fechar</button>'}</div>
        <span class="lbl">Atributos</span><div class="dk-grid">${pers.filter((x) => x.a).map((x) => `<button data-dk="rolar" data-per="${x.n}"><b>${x.n}</b><small>${maoDe(c, x.n).txt}</small></button>`).join('')}</div>
        <span class="lbl">Perícias</span><div class="dk-grid">${pers.filter((x) => !x.a).sort((a, b) => b.g - a.g).map((x) => `<button class="${x.g ? 'treino' : ''}" data-dk="rolar" data-per="${x.n}"><b>${x.n}</b><small>${maoDe(c, x.n).txt}</small></button>`).join('')}</div>
        <p class="dk-nota">O mestre diz quando rolar e o que é preciso tirar. A rolagem aparece para a mesa toda.</p></div>` : ''}
      ${lateral ? '' : `<button class="dk-abre" data-dk="abrir" aria-expanded="${U.dk}">${dieSvg('?', 'dk-ic')}<span>Rolar dados</span></button>`}</div>`;
    if (lateral) h += `<div class="jg-feed"><span class="lbl">Rolagens da mesa</span>${S.rolls.slice(0, 8).map(linhaRoll).join('') || '<p class="ms-dica">Ninguém rolou ainda.</p>'}</div>`;
    return h;
  }
  const dockWrap = () => `<div class="dock" data-dock>${dockHtml()}</div>`;
  function pintarDock() { const d = document.querySelector('[data-dock]'); if (d) d.innerHTML = dockHtml(d.classList.contains('lateral')); const r = document.querySelector('.jog [data-ms-rel]'); if (r) r.innerHTML = relogioHtml(true); }

  // ---------- a tela do jogador no computador: mapa grande e a ficha ao lado ----------
  const jogDesktop = () => !isGM() && window.innerWidth >= 1000;
  function viewJogador() {
    A.setMesa(true);
    if (!A.loaded()) return MAPA.view();
    A.setMesa(true);
    const c = A.cena();
    return `<div class="mesa jog" data-mproot>
      <header class="ms-top"><a class="ms-logo" href="#/" aria-label="Início"><img src="img/logo-horizontal.webp" alt="Breu"></a>
        <div class="jg-titulo">${c ? `<span class="lbl">Cena</span><b>${esc(c.nome)}</b>` : ''}</div>
        <div class="ms-rel" data-ms-rel>${relogioHtml(true)}</div>
        <div class="ms-links">${c ? `<span class="jg-rod">Rodada <b data-mp-rodada>${c.rodada}</b></span>` : ''}<a class="ms-link" href="#/">Fichas</a><button class="ms-link" data-act="logout">Sair</button></div></header>
      <section class="ms-centro">${c ? `<div class="mp-bar" data-mpbar>${A.barHtml()}</div>${A.stageHtml()}` : `<div class="ms-vazio"><h1>Aguardando o mestre</h1><p class="muted">Quando ele mostrar uma cena, ela aparece aqui sozinha.</p></div>`}</section>
      <aside class="ms-painel jg-painel"><div class="dock lateral" data-dock>${dockHtml(true)}</div>${c ? `<div class="ms-sel mp-side" data-mpside>${A.sideHtml()}</div>` : ''}</aside>
    </div>`;
  }

  async function rolarComo(c, per, pedId) {
    const attr = ATR[per] || R.PERICIA_ATRIB[per], pericia = ATR[per] ? '' : per;
    const p = pedId ? (S.pedidos || []).find((x) => x.id === pedId) || null : null;
    const ajuste = -pavorDe(c);
    const dif = p?.dif || 0;
    const res = R.rolar(c.data, { attr, pericia, ajuste, dif });
    const label = p ? p.label : pericia ? `${per} (${ATN[attr]})` : per;
    U.dk = false;
    const row = await ctx.registrar(c, label, res, { tipo: 'teste', dados: res.dados, fica: res.fica, bonus: res.bonus, mao: res.mao, ajuste, dif, passou: dif ? res.passou : undefined, marcante: res.marcante, desastre: res.desastre, vazia: res.vazia, per, ...(p ? { pedido: p.id } : {}) });
    animar(row || { character_id: c.id, label, total: res.total, detail: { dados: res.dados, fica: res.fica, bonus: res.bonus, vazia: res.vazia, marcante: res.marcante, desastre: res.desastre } });
    pintarDock();
  }

  // ---------- dados rolando no meio da mesa ----------
  let caixa = null, some = null;
  function dieSvg(v, cls = '') {
    return `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true"><polygon class="d-f" points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5"/><path class="d-l" d="M50,22 L76,66 L24,66 Z M50,22 L50,3 M50,22 L9,26.5 M50,22 L91,26.5 M24,66 L9,26.5 M24,66 L9,73.5 M24,66 L50,97 M76,66 L91,26.5 M76,66 L91,73.5 M76,66 L50,97"/><text x="50" y="${String(v).length > 1 ? 56 : 57}" text-anchor="middle">${v}</text></svg>`;
  }
  function animar(r) {
    if (!r || !noMapa()) return;
    if (!caixa) { caixa = document.createElement('div'); caixa.id = 'dados'; caixa.setAttribute('aria-live', 'polite'); caixa.addEventListener('click', fecharDados); document.body.appendChild(caixa); }
    const w = document.querySelector('.mp-wrap')?.getBoundingClientRect();
    const box = w && w.width > 560 ? { left: Math.max(0, w.left), top: Math.max(0, w.top), width: Math.min(w.width, innerWidth), height: Math.min(w.height, innerHeight - Math.max(0, w.top)) } : { left: 0, top: 0, width: innerWidth, height: innerHeight };
    Object.assign(caixa.style, { left: box.left + 'px', top: box.top + 'px', width: box.width + 'px', height: box.height + 'px' });
    if (!caixa.classList.contains('on')) { caixa.innerHTML = '<div class="dd-mesa"></div>'; caixa.classList.add('on'); caixa.classList.remove('saindo'); }
    const mesa = caixa.firstChild;
    while (mesa.children.length >= 6) mesa.firstChild.remove();
    const c = ctx.charById(r.character_id), d = r.detail || {};
    const dados = d.dados?.length ? d.dados : [r.total];
    const dano = d.tipo === 'dano', ataque = d.tipo === 'ataque';
    const pic = c ? ctx.picChar(c) : r.img, quem = c?.data?.nome || r.nome || 'Alguém';
    let fi = dados.indexOf(d.fica); if (d.vazia) fi = dados.indexOf(Math.min(...dados));
    const f = ataque ? (d.ruim ? 'dano ataque' : 'f2 ataque') : dano ? 'dano' : d.dif ? (d.marcante ? 'f3' : d.passou ? 'f2' : 'f0') : 'f' + faixaDe(r.total);
    const card = document.createElement('div');
    card.className = `dd-card ${f}`;
    card.innerHTML = `<div class="dd-quem">${pic ? `<img src="${esc(pic)}" alt="">` : ''}<div><b>${esc(quem)}</b><span>${esc(r.label)}</span></div></div>
      <div class="dd-dados">${dados.map((x, i) => `<span class="dd-d ${dano ? 'cubo' : ''} ${!dano && i === fi ? 'fica' : ''} ${!dano && x === 20 ? 'vinte' : ''}" style="--i:${i};--rx:${(Math.random() * 2 - 1).toFixed(2)}" data-v="${x}">${dano ? `<b>?</b>` : dieSvg('?')}</span>`).join('')}</div>
      <div class="dd-total"><strong>${r.total}</strong><small>${ataque ? esc(d.resultado || '') : dano ? 'de dano' : d.dif ? `contra ${d.dif}: ${d.passou ? 'passou' : /Pavor/.test(r.label) ? 'falhou, +1 Pavor' : 'falhou'}` : `${d.vazia ? 'mão vazia: ficou o pior' : dados.length > 1 ? 'ficou o maior' : ''}${d.bonus ? ` · ${d.fica} + ${d.bonus}` : ''}`}</small>${d.marcante ? '<em>Saiu um 20!</em>' : d.desastre ? '<em>Tudo 1</em>' : ''}</div>`;
    mesa.appendChild(card);
    mesa.classList.toggle('muitos', mesa.children.length > 2);
    const ds = [...card.querySelectorAll('.dd-d')], max = dano ? 6 : 20;
    const t0 = performance.now(), dur = 900;
    const tick = () => {
      const t = performance.now() - t0; let ok = 0;
      ds.forEach((el, i) => {
        const fim = dur + i * 110, alvo = el.querySelector('text') || el.querySelector('b');
        if (t >= fim) { if (!el.classList.contains('pousou')) { alvo.textContent = el.dataset.v; el.classList.add('pousou'); } ok++; }
        else if (Math.floor(t / 55) !== +el.dataset.q) { el.dataset.q = Math.floor(t / 55); alvo.textContent = 1 + Math.floor(Math.random() * max); }
      });
      if (ok < ds.length) requestAnimationFrame(tick); else { card.classList.add('pronto'); if (!dano && !ataque && dados.includes(20) && !card.dataset.vinte) { card.dataset.vinte = 1; efeito({ tipo: 'vinte', nome: quem }); } }
    };
    requestAnimationFrame(tick);
    som(ds.length);
    clearTimeout(some); some = setTimeout(fecharDados, dur + ds.length * 110 + 3800);
  }
  function fecharDados() {
    if (!caixa?.classList.contains('on')) return;
    caixa.classList.add('saindo'); clearTimeout(some);
    setTimeout(() => { caixa.classList.remove('on', 'saindo'); caixa.innerHTML = ''; }, 380);
  }
  let ac = null;
  function som(n) {
    try {
      if (!navigator.userActivation?.hasBeenActive) return;
      ac ||= new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      const buf = ac.createBuffer(1, ac.sampleRate * 0.05, ac.sampleRate), ch = buf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / ch.length, 3);
      const batidas = 5 + n * 2;
      for (let k = 0; k < batidas; k++) {
        const t = ac.currentTime + k * (0.05 + Math.random() * 0.07) * (1 + k / batidas);
        const src = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain();
        src.buffer = buf; bp.type = 'bandpass'; bp.frequency.value = 1800 + Math.random() * 2200; bp.Q.value = 3;
        g.gain.value = 0.32 * (1 - k / batidas);
        src.connect(bp).connect(g).connect(ac.destination); src.start(t);
      }
    } catch { /* sem som, tudo bem */ }
  }

  // ---------- efeitos na tela: dano, brecha, Assombro aparecendo, um 20 ----------
  let fxBox = null;
  function fx() { if (!fxBox) { fxBox = document.createElement('div'); fxBox.id = 'efeitos'; fxBox.setAttribute('aria-live', 'polite'); document.body.appendChild(fxBox); } return fxBox; }
  function solto(html, cls, ms) { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; fx().appendChild(d); setTimeout(() => d.remove(), ms); }
  function tremer(forca) { const a = document.getElementById('app'); a.classList.remove('fx-treme', 'fx-treme2'); void a.offsetWidth; a.classList.add(forca > 1 ? 'fx-treme2' : 'fx-treme'); setTimeout(() => a.classList.remove('fx-treme', 'fx-treme2'), 650); }
  function efeito(e) {
    if (!S.me || !e) return;
    if (e.tipo === 'dano' || e.tipo === 'brecha') fecharDados();
    if (e.tipo === 'dano') {
      const meu = !isGM() && meuChar()?.id === e.cid;
      tremer(meu ? 2 : 1);
      solto('', `fx-flash ${meu ? 'forte' : ''}`, 1100);
      solto(`<b>−${e.valor}</b><span>${meu ? 'Você perdeu Sangue' : esc(e.nome) + ' perdeu Sangue'}</span>`, 'fx-num', 1900);
    } else if (e.tipo === 'brecha') {
      tremer(2); solto('', 'fx-flash forte', 1300);
      solto('<span>A linha rompeu</span>', 'fx-faixa brecha', 2600);
    } else if (e.tipo === 'assombro') {
      solto(`${e.img ? `<i style="background-image:url('${esc(e.img)}')"></i>` : ''}<span>${e.nome ? esc(e.nome) : 'Alguma coisa saiu do escuro'}</span>`, 'fx-ass', 2600);
    } else if (e.tipo === 'vinte') {
      solto(`<span>${esc(e.nome)} tirou um 20</span>`, 'fx-faixa vinte', 2400);
    }
  }
  // o estado do próprio personagem pinta a borda da tela do jogador
  function estadoProprio() {
    const app = document.getElementById('app'); if (!app) return;
    const c = !isGM() && meuChar(); const t = c && S.noite?.grupo?.[c.id];
    const b = c && R.barras(c.data);
    app.classList.toggle('fx-ferido', !!(t && t.sangue > 0 && t.sangue <= b.sangue / 3));
    app.classList.toggle('fx-caido', !!(t && t.sangue <= 0));
    app.classList.toggle('fx-panico', !!(t && t.prumo <= 0));
    const p = Math.min(3, t?.pavor || 0); app.style.setProperty('--pavor', p); app.classList.toggle('fx-pavor', p > 0);
  }

  // ---------- o vídeo de abertura ----------
  let video = null, preVideo = null;
  // o vídeo inteiro é baixado antes, para tocar sem travar; quem abre o app já começa a baixar
  let videoUrl = null, baixando = null, progresso = 0;
  function baixarVideo() {
    baixando ||= (async () => {
      try {
        const r = await fetch(VIDEO, { cache: 'force-cache' });
        const total = +r.headers.get('content-length') || 0, partes = [];
        const leitor = r.body.getReader(); let n = 0;
        for (;;) { const { done, value } = await leitor.read(); if (done) break; partes.push(value); n += value.length; if (total) { progresso = n / total; mostrarProgresso(); } }
        videoUrl = URL.createObjectURL(new Blob(partes, { type: 'video/mp4' }));
      } catch { videoUrl = VIDEO; }
      progresso = 1; mostrarProgresso();
      return videoUrl;
    })();
    return baixando;
  }
  function mostrarProgresso() { const b = video?.querySelector('.vd-carrega i'); if (b) b.style.width = Math.round(progresso * 100) + '%'; }
  const preCarregarVideo = () => setTimeout(baixarVideo, 1500);
  // o vídeo toca para todos, por cima do mapa (não em tela cheia)
  async function tocarVideo() {
    if (!isGM()) return;
    const v = { id: uuid(), em: Date.now(), acao: 'tocar' };
    S.video = v;
    const { error } = await sb.from('breu_state').upsert({ key: 'video', value: v, updated_at: new Date().toISOString() });
    if (error) toast('Não consegui mandar o vídeo para os jogadores.');
    abrirVideo(v);
  }
  function onVideo(v) {
    S.video = v;
    if (!v || isGM()) return;
    if (v.acao === 'tocar' && Date.now() - v.em < 120000 && S.videoVisto !== v.id) {
      S.videoVisto = v.id;
      if (!noMapa()) { ctx.go('mapa'); setTimeout(() => abrirVideo(v), 700); } else abrirVideo(v);
    } else if (v.acao === 'parar' && video) fimVideo();
  }
  // a caixa do vídeo fica exatamente em cima da área do mapa
  function encaixarVideo() {
    if (!video) return;
    const w = document.querySelector('.mp-wrap')?.getBoundingClientRect();
    const r = w && w.width > 200 && w.height > 150 ? { left: w.left, top: Math.max(0, w.top), width: w.width, height: Math.min(w.height, innerHeight - Math.max(0, w.top)) }
      : { left: Math.max(12, (innerWidth - 900) / 2), top: 80, width: Math.min(900, innerWidth - 24), height: Math.min(506, (Math.min(900, innerWidth - 24)) * 9 / 16) };
    Object.assign(video.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
  }
  function abrirVideo(v) {
    S.videoVisto = v.id;
    fecharVideo();
    video = document.createElement('div'); video.className = 'vd'; video.setAttribute('role', 'dialog'); video.setAttribute('aria-label', 'Abertura');
    video.innerHTML = `<video playsinline preload="auto"></video>
      <div class="vd-carrega" ${videoUrl ? 'hidden' : ''}><span>Carregando a abertura…</span><b><i style="width:${Math.round(progresso * 100)}%"></i></b></div>
      <button class="vd-som" hidden>Toque para ligar o som</button>
      <div class="vd-ui">${isGM() ? '<button class="btn sm" data-vd="pular">Pular e abrir a estrada</button>' : ''}</div>`;
    document.body.appendChild(video);
    encaixarVideo(); clearInterval(abrirVideo.t); abrirVideo.t = setInterval(encaixarVideo, 400);
    const el = video.querySelector('video'), somB = video.querySelector('.vd-som');
    document.body.classList.add('vendo-video');
    const caixa = video;
    baixarVideo().then((url) => {
      if (video !== caixa) return;
      caixa.querySelector('.vd-carrega').hidden = true;
      el.src = url;
      // quem chegou atrasado (mais de 8 s) pula para onde os outros estão
      const atraso = (Date.now() - v.em) / 1000;
      if (atraso > 8 && atraso < 70) el.addEventListener('loadedmetadata', () => { el.currentTime = atraso; }, { once: true });
      el.play().catch(() => { el.muted = true; el.play().catch(() => {}); somB.hidden = false; });
    });
    somB.addEventListener('click', () => { el.muted = false; somB.hidden = true; el.play(); });
    el.addEventListener('ended', () => fimVideo());
    video.querySelector('[data-vd="pular"]')?.addEventListener('click', async () => {
      await sb.from('breu_state').upsert({ key: 'video', value: { ...v, acao: 'parar' }, updated_at: new Date().toISOString() });
      fimVideo();
    });
  }
  function fecharVideo() { clearInterval(abrirVideo.t); document.body.classList.remove('vendo-video'); if (video) { video.querySelector('video')?.pause(); video.remove(); video = null; } }
  async function fimVideo() {
    fecharVideo();
    if (isGM()) {
      const c = await A.garantirCena('estrada');
      if (c) await A.mostrarCena(c.id);
      if (G.estado().aqui === 'inicio') G.ir('corrida');
      repintar();
    } else if (!noMapa()) ctx.go('mapa');
  }

  // ---------- eventos ----------
  async function click(e) {
    const g = e.target.closest('[data-g]');
    if (g && isGM()) { await G.click(e); return true; }
    const t = e.target.closest('[data-ms],[data-dk]'); if (!t) return false;
    e.preventDefault();
    const a = t.dataset.ms || t.dataset.dk, v = t.dataset.v;
    if (t.dataset.ms) {
      if (a === 'add') { U.add = !U.add; const box = document.querySelector('[data-ms-add]'); if (box) box.hidden = !U.add; t.classList.toggle('on', U.add); return true; }
      if (a === 'livre') { U.livre = true; pintarPainel(); return true; }
      if (a === 'aba') { U.aba = v; if (v === 'rolagens') U.novas = 0; pintarPainel(); return true; }
      if (a === 'video') { tocarVideo(); return true; }
      if (a === 'fase') { t.disabled = true; await virar(); return true; }
      if (a === 'circ') { ctx.garantirNoite(); const f = S.noite.circulo ?? 14, v = +t.dataset.v; S.noite.circulo = v === 0 ? 0 : Math.max(0, f + v); ctx.logNoite(v === 0 ? 'O círculo abriu uma brecha.' : `Força do círculo: ${S.noite.circulo}.`); await ctx.salvarNoite(); pintarPainel(); return true; }
      if (a === 'tela-preta') { await A.esconderCena(); pintarTopo(); toast('Os jogadores estão sem cena.'); return true; }
    }
    if (a === 'abrir') { U.dk = !U.dk; pintarDock(); return true; }
    if (a === 'fechar') { U.dk = false; pintarDock(); return true; }
    if (a === 'rolar') { const c = meuChar(); if (!c) return true; t.disabled = true; await rolarComo(c, t.dataset.per, t.dataset.ped || null); return true; }
    return true;
  }
  async function onChange(t) {
    if (G.change(t)) return true;
    if (t.matches('[data-ms-forca]')) { ctx.garantirNoite(); S.noite.circulo = Math.max(0, Math.min(40, +t.value || 0)); ctx.logNoite(`Círculo consertado com força ${S.noite.circulo}.`); await ctx.salvarNoite(); G.marcar('trecho', S.noite.circulo >= 20 ? 'forte' : S.noite.circulo >= 10 ? 'fino' : 'aberto'); MAPA.redraw(); pintarPainel(); toast(`Força do círculo: ${S.noite.circulo}.`); return true; }
    if (t.dataset.msEst) { ctx.garantirNoite(); S.noite.retrato = { ...(S.noite.retrato || {}), [t.dataset.msEst]: t.value }; await ctx.salvarNoite(); pintarPainel(); MAPA.redraw(); return true; }
    return false;
  }
  async function onSubmit(f) {
    if (f.dataset.msForm !== 'pedir') return false;
    const per = f.per.value, quem = f.quem.value;
    const nome = quem ? ctx.charById(quem)?.data.nome : '';
    U.livre = false;
    await pedir({ label: per + (nome ? ` (${nome})` : ''), per, quem: quem ? [quem] : [] });
    return true;
  }
  // o Pavor da virada: quem falha ganha 1 Pavor, anotado pelo app do mestre
  function aplicarPavor(r) {
    const p = (S.pedidos || []).find((x) => x.id === r.detail?.pedido); if (!p?.pavor || r.detail?.passou !== false) return;
    ctx.garantirNoite(); const n = S.noite; n.pavorVisto ||= [];
    if (n.pavorVisto.includes(r.id)) return;
    n.pavorVisto.push(r.id); n.pavorVisto = n.pavorVisto.slice(-60);
    const c = ctx.charById(r.character_id); if (!c) return;
    const t = ctx.trackerDe(c); t.pavor = Math.min(9, (t.pavor || 0) + 1);
    ctx.logNoite(`${c.data.nome} falhou no Pavor (${r.total}) e ganhou 1 Pavor.`);
    ctx.salvarNoite();
  }
  async function pedirPavor(fase, dif) { await pedir({ label: `O Pavor: ${fase}`, per: 'Firmeza', dif, pavor: true, quem: [] }); }
  function onRoll(r) {
    if (isGM()) { aplicarPavor(r); if (U.aba !== 'rolagens') U.novas++; pintarPainel(); if (r.detail?.pedido) pintarGuia(); }
    pintarDock();
    animar(r);
  }
  function onPedido(v) { const antes = new Set((S.pedidos || []).map((x) => x.id)); S.pedidos = v?.lista || (v?.id ? [v] : []); repintar(); if (!isGM() && noMapa() && pedidosPara(meuChar()).some((x) => !antes.has(x.id))) toast('O mestre pediu uma rolagem.'); }
  function onGuia(v) { S.guia = v; MAPA.redraw(); if (JSON.stringify(v) === JSON.stringify(G.estado())) return; G.setEstado(v); pintarGuia(); pintarPainel(); }
  function onNoite() { repintar(); }

  return { efeito, baixarVideo: preCarregarVideo, animar, pedirPavor, viewGM, viewJogador, jogDesktop, desktop, mount, dockWrap, pintarDock, repintar, click, onChange, onSubmit, onRoll, onPedido, onGuia, onVideo, onNoite, pintarTopo, pintarPainel };
}
