// As cartas do arsenal de Antero: o desenho, o símbolo riscado, o que a peça faz.
// Quem não leu o símbolo vê o risco, mas não sabe a essência.
import * as R from './regras.js?v=9';

const T = 'stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"';
// os riscos de Antero, como estão no couro: triângulo, círculo, losango, cruz e xis
const SIMB = {
  Cinza: `<path d="M20 7 L33 32 H7 Z" ${T}/>`,
  Lodo: `<circle cx="20" cy="20" r="11" ${T}/>`,
  Raiz: `<path d="M20 6 L32 20 L20 34 L8 20 Z" ${T}/>`,
  Sopro: `<path d="M20 7 V33 M7 20 H33" ${T}/>`,
  Osso: `<path d="M9 9 L31 31 M31 9 L9 31" ${T}/>`,
  Som: `<path d="M12 20 h0.1 M17 13 a10 10 0 0 1 0 14 M23 8 a16 16 0 0 1 0 24" ${T}/>`,
};
const VENCE = { Cinza: 'Raiz', Raiz: 'Osso', Osso: 'Sopro', Sopro: 'Lodo', Lodo: 'Cinza' };
const PERDE = Object.fromEntries(Object.entries(VENCE).map(([a, b]) => [b, a]));

export const essencias = (ess) => String(ess || '').split(/\s+e\s+/).filter((e) => SIMB[e]);
export function simbolo(ess, cls = '') {
  return essencias(ess).map((e) => `<svg class="simb ${cls}" viewBox="0 0 40 40" aria-hidden="true">${SIMB[e]}</svg>`).join('');
}

// o Riscador lê qualquer símbolo; os outros leem o que já leram (ou o que a luta mostrou)
export function lido(p, k) {
  if (!p) return false;
  if (p.oficio === 'riscador' || R.oficiosAprendidos(p).some((o) => o.k === 'riscador')) return true;
  return (p.leu || []).includes(k);
}
export const tentouLer = (p, k) => (p?.leuNao || []).includes(k);
// para ler: a melhor entre Traços e Saberes
export function periciaLer(p) { return R.grauPericia(p, 'Saberes') > R.grauPericia(p, 'Traços') ? 'Saberes' : 'Traços'; }

export function municaoDe(p, a) { if (!a?.mun) return null; return p?.municao ?? a.mun; }

// o que a essência faz contra quem
export function contraHtml(a) {
  const e = essencias(a.ess).find((x) => VENCE[x]);
  if (!e) return '<li class="ess-som">Não fere: o som age sobre todos os bichos, de qualquer essência.</li>';
  return `<li class="ess-v">Forte contra <b>${VENCE[e]}</b>: +1 dado no ataque e no dano</li><li class="ess-p">Fraca contra <b>${PERDE[e]}</b>: −1 dado no ataque</li>`;
}

// a carta. opts: { p (a ficha de quem vê), botoes (html), dono (nome de quem pegou), mini }
export function cartaHtml(a, { p = null, botoes = '', dono = '', mini = false } = {}) {
  const leu = lido(p, a.k), mun = municaoDe(p?.armaMarcada === a.k ? p : null, a);
  const arte = a.img ? `<img src="${a.img}" alt="">` : `<span class="ct-arte-simb">${simbolo(a.ess)}</span>`;
  return `<article class="carta ${dono ? 'tomada' : ''} ${mini ? 'mini' : ''}" data-carta="${a.k}">
    <div class="ct-arte">${arte}<b class="ct-nome">${a.curto || a.n}</b></div>
    <div class="ct-corpo">
      <div class="ct-chips">${a.dano ? `<span>Dano ${a.dano}</span>` : '<span>Instrumento</span>'}<span>${a.per}</span>${(a.tags || []).map((t) => `<span>${t}</span>`).join('')}${mun != null ? `<span class="ct-mun">${mun} de ${a.mun}</span>` : ''}</div>
      ${dono ? `<span class="ct-dono">Com ${dono}</span>` : `<p class="ct-txt">${a.d}</p>
      ${leu ? `<div class="ct-ess"><span class="lbl">Essência: ${a.ess}</span><ul>${contraHtml(a)}</ul></div>`
        : `<div class="ct-ess nao"><span class="lbl">Essência: você não sabe ler este risco</span>${tentouLer(p, a.k) ? '<small>Você tentou e não entendeu. Pergunte a quem sabe.</small>' : ''}</div>`}
      ${botoes ? `<div class="ct-bts">${botoes}</div>` : ''}`}
    </div>
  </article>`;
}

// escolher em quem bater: só os bichos que os jogadores estão vendo
export function escolherAlvo(alvos, titulo, pergunta = 'Em quem você ataca?') {
  return new Promise((ok) => {
    const fundo = document.createElement('div'); fundo.className = 'fis-fundo';
    fundo.innerHTML = `<div class="fis-caixa alvo-caixa" role="dialog" aria-label="Em quem você ataca">
      <span class="fis-lbl">${titulo}</span><b class="fis-t">${pergunta}</b>
      <div class="alvo-lista">${alvos.map((x, i) => `<button type="button" data-i="${i}">${x.img ? `<img src="${x.img}" alt="">` : ''}<span><b>${x.nome}</b><small>${x.perto}</small></span></button>`).join('')}</div>
      <div class="fis-bts"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="button" class="btn" data-sem>Outra coisa (o mestre diz)</button></div>
    </div>`;
    document.body.appendChild(fundo);
    const fim = (v) => { fundo.remove(); ok(v); };
    fundo.querySelector('[data-x]').onclick = () => fim(null);
    fundo.querySelector('[data-sem]').onclick = () => fim('sem');
    fundo.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) fim(alvos[+b.dataset.i]); else if (e.target === fundo) fim(null); });
  });
}
