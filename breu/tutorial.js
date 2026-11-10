// "Como usar": passeio guiado pela tela do jogador, apontando cada parte de verdade.
const PASSOS = [
  { t: 'Bem-vindo à mesa', d: 'Este é o lugar do jogo. Tudo o que o mestre mostra aparece aqui sozinho, sem precisar recarregar. Vou te mostrar cada parte. Leva 1 minuto.' },
  { s: '.jg-titulo', t: 'A cena', d: 'O nome do lugar onde a história está agora. Quando o mestre muda de lugar, a tela muda junto.' },
  { s: '.ms-rel', t: 'As fases da noite', d: 'Os cinco desenhos são as fases da noite: Crepúsculo, Breu, Hora Morta, Antes da Aurora e Aurora. A que está acesa é a de agora. Em cada virada de fase, o app pede para todo mundo rolar o medo (o Pavor).' },
  { s: '.mp-wrap', t: 'O mapa', d: 'As bolinhas com rosto são as peças. A sua tem o rosto do seu personagem. <b>Arraste a sua peça</b> para andar. Toque em qualquer peça para ver quem é.' },
  { s: '[data-mp="entrar"]', t: 'Entrar no mapa', d: 'Se este botão aparecer, seu personagem ainda não está na cena. Aperte e a sua peça aparece.' },
  { s: '.mp-mov', t: 'Quanto você anda', d: 'Numa rodada, cada um anda até 6 passos. Aqui mostra quanto ainda falta. Uma rodada é a vez de todo mundo agir uma vez; o mestre vira a rodada.' },
  { s: '.jg-ficha', t: 'Seu personagem', d: 'Toque aqui para abrir a ficha completa: história, armas, habilidades.' },
  { s: '.jg-b.sangue', t: 'Sangue', d: 'Sua vida. Quando chega a zero, você cai. Caído, precisa que alguém te trate.' },
  { s: '.jg-b.prumo', t: 'Prumo', d: 'Seu fôlego. É o que você gasta para usar as habilidades da ficha (as que dizem "custa 2 Prumo").' },
  { s: '.jg-b.pavor', t: 'Pavor', d: 'O medo que você acumulou. <b>Cada ponto de Pavor tira um dado de tudo</b> o que você rolar, até o amanhecer. Ganha quando falha no teste de medo.' },
  { s: '.jg-b.brasa', t: 'Brasa', d: 'A força do seu Dom. É gasta para acender os traços de cal mais fortes.' },
  { s: '.jg-b.vigias', t: 'Vigias', d: 'Seu dinheiro. Todo mundo começa com 25. O mestre desconta quando você compra algo.' },
  { s: '.fis-tg', t: 'Seus dados', d: '<b>Rolar no app</b>: o app sorteia os dados para você. <b>Tenho dados aqui</b>: você rola os seus dados de verdade e digita os números que saíram. O app faz a conta igualzinho.' },
  { s: '.dk-card.pede', t: 'O mestre pediu uma rolagem', d: 'Quando o mestre pede, aparece este cartão com o botão pronto. É só apertar. Se tiver dois botões, o destacado é o seu melhor.' },
  { s: '.dk-abre', t: 'Rolar dados', d: 'Toque aqui para abrir seus dados. Quando o mestre pedir uma rolagem, ela também aparece aqui.' },
  { s: '.dk-grid', t: 'Atributos', d: 'O que o seu corpo e a sua cabeça têm de força. <b>3d20</b> quer dizer: rola 3 dados de 20 lados e vale o <b>maior</b>. Quanto mais dados, melhor.' },
  { s: '.dk-grid + .lbl + .dk-grid, .dk-grid ~ .dk-grid', t: 'Perícias', d: 'O que você aprendeu a fazer. <b>As que estão em laranja</b> são as que você treinou: ganham <b>+3</b> (ou mais) no resultado. As cinzas você nunca treinou: vale só o dado.' },
  { s: '.jg-feed', t: 'Rolagens da mesa', d: 'Aqui aparece tudo o que todo mundo rolou. Os dados também rolam no meio da tela, para a mesa inteira ver.' },
  { s: '.ms-links', t: 'Fichas e Sair', d: '<b>Fichas</b> leva para o início, com a sua ficha. <b>Sair</b> desconecta.' },
  { s: '[data-tour]', t: 'Pronto', d: 'Se quiser ver de novo, é só tocar em <b>Como usar</b>. O resto o mestre conta na hora.' },
];

const visivel = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 && getComputedStyle(el).visibility !== 'hidden'; };
const VISTO = 'breu-tour-visto';
export function jaViu() { try { return localStorage.getItem(VISTO) === '1'; } catch { return true; } }

let aberto = null;
export function abrirTour() {
  if (aberto) return;
  let passos = [], i = 0;
  const atual = () => PASSOS.filter((p) => !p.s || visivel(document.querySelector(p.s)));
  const raiz = document.createElement('div'); raiz.className = 'tour'; raiz.setAttribute('role', 'dialog'); raiz.setAttribute('aria-label', 'Como usar');
  raiz.innerHTML = '<div class="tour-luz"></div><div class="tour-card" aria-live="polite"></div>';
  document.body.appendChild(raiz); aberto = raiz;
  const luz = raiz.querySelector('.tour-luz'), card = raiz.querySelector('.tour-card');
  const fechar = () => { try { localStorage.setItem(VISTO, '1'); } catch { /* ok */ } raiz.remove(); aberto = null; removeEventListener('resize', pos); document.removeEventListener('keydown', tecla); };
  const tecla = (e) => { if (e.key === 'Escape') fechar(); if (e.key === 'ArrowRight') ir(1); if (e.key === 'ArrowLeft') ir(-1); };
  function pos() {
    const p = passos[i], el = p.s && document.querySelector(p.s);
    const W = innerWidth, H = innerHeight, cw = Math.min(360, W - 32);
    card.style.width = cw + 'px';
    if (!el) { luz.style.cssText = `left:${W / 2}px;top:${H / 2}px;width:0;height:0`; card.style.left = (W - cw) / 2 + 'px'; card.style.top = Math.max(16, (H - card.offsetHeight) / 2) + 'px'; return; }
    const r = el.getBoundingClientRect(), m = 6;
    const box = { l: Math.max(4, r.left - m), t: Math.max(4, r.top - m), w: Math.min(W - 8, r.width + m * 2), h: Math.min(H - 8, r.height + m * 2) };
    luz.style.cssText = `left:${box.l}px;top:${box.t}px;width:${box.w}px;height:${box.h}px`;
    const ch = card.offsetHeight;
    // tenta embaixo, depois em cima, depois ao lado, senão no canto de baixo
    let top, left = Math.min(W - cw - 16, Math.max(16, box.l + box.w / 2 - cw / 2));
    if (box.t + box.h + ch + 14 < H) top = box.t + box.h + 12;
    else if (box.t - ch - 14 > 0) top = box.t - ch - 12;
    else if (box.l - cw - 16 > 0) { left = box.l - cw - 12; top = Math.min(H - ch - 16, Math.max(16, box.t)); }
    else if (box.l + box.w + cw + 16 < W) { left = box.l + box.w + 12; top = Math.min(H - ch - 16, Math.max(16, box.t)); }
    else top = H - ch - 16;
    card.style.left = left + 'px'; card.style.top = top + 'px';
  }
  function pintar() {
    passos = atual(); i = Math.min(i, passos.length - 1);
    const p = passos[i], el = p.s && document.querySelector(p.s);
    if (el) el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    card.innerHTML = `<span class="tour-n">${i + 1} de ${passos.length}</span><b class="tour-t">${p.t}</b><p>${p.d}</p>
      <div class="tour-bts"><button class="btn ghost sm" data-t="sair">${i === passos.length - 1 ? 'Fechar' : 'Pular'}</button><span>${i ? '<button class="btn sm" data-t="volta">Voltar</button>' : ''}${i < passos.length - 1 ? '<button class="btn primary sm" data-t="vai">Próximo</button>' : '<button class="btn primary sm" data-t="sair">Entendi</button>'}</span></div>`;
    requestAnimationFrame(pos);
    card.querySelector('[data-t="vai"],[data-t="sair"]:last-child')?.focus();
  }
  const ir = (d) => { const cur = passos[i]; const novos = atual(); let j = novos.indexOf(cur); if (j < 0) j = i; passos = novos; i = Math.max(0, Math.min(passos.length - 1, j + d)); pintarSem(); };
  function pintarSem() { const keep = passos[i]; pintar(); const j = passos.indexOf(keep); if (j >= 0 && j !== i) { i = j; pintar(); } }
  raiz.addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (!b) return; const t = b.dataset.t; if (t === 'sair') fechar(); else ir(t === 'vai' ? 1 : -1); });
  addEventListener('resize', pos); document.addEventListener('keydown', tecla);
  pintar();
}

document.addEventListener('click', (e) => { if (e.target.closest('[data-tour]') && !e.target.closest('.tour')) { e.preventDefault(); abrirTour(); } }, true);
