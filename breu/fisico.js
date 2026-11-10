// Dados de verdade: o jogador rola na mesa e digita o que saiu. O app faz a conta.
const chave = (cid) => 'breu-fisico-' + cid;
export function fisicoDe(cid) { try { return localStorage.getItem(chave(cid)) === '1'; } catch { return false; } }
export function setFisico(cid, on) { try { on ? localStorage.setItem(chave(cid), '1') : localStorage.removeItem(chave(cid)); } catch { /* sem armazenamento: vale só nesta tela */ } memo[cid] = on; }
const memo = {};
const ligado = (cid) => (cid in memo ? memo[cid] : fisicoDe(cid));
export { ligado };

export function chaveHtml(cid) {
  const on = ligado(cid);
  return `<div class="fis-tg" role="group" aria-label="Como você rola os dados"><span>Seus dados</span>
    <button type="button" data-fis="${cid}:0" class="${on ? '' : 'on'}" aria-pressed="${!on}">Rolar no app</button>
    <button type="button" data-fis="${cid}:1" class="${on ? 'on' : ''}" aria-pressed="${on}">Tenho dados aqui</button></div>`;
}

const ouvintes = [];
export function quandoMudar(fn) { ouvintes.push(fn); }
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-fis]'); if (!b) return;
  e.preventDefault(); e.stopPropagation();
  const [cid, v] = b.dataset.fis.split(':'); setFisico(cid, v === '1'); ouvintes.forEach((fn) => fn(cid));
}, true);

// abre a caixa para digitar os números. Devolve a lista, ou null se cancelar.
export function pedirDados({ n, faces = 20, titulo = '', como = '' }) {
  return new Promise((ok) => {
    const fundo = document.createElement('div'); fundo.className = 'fis-fundo';
    const nome = faces === 20 ? 'dado de 20 lados' : `dado de ${faces} lados`;
    fundo.innerHTML = `<form class="fis-caixa" role="dialog" aria-label="Digite os dados">
      <span class="fis-lbl">${titulo}</span>
      <b class="fis-t">Role ${n === 1 ? `1 ${nome}` : `${n} ${nome.replace('dado', 'dados')}`}</b>
      ${como ? `<p class="fis-como">${como}</p>` : ''}
      <p class="fis-como">Digite o número que saiu em cada um:</p>
      <div class="fis-ins">${Array.from({ length: n }, (_, i) => `<input type="number" inputmode="numeric" min="1" max="${faces}" required aria-label="Dado ${i + 1}" placeholder="${i + 1}º">`).join('')}</div>
      <p class="fis-erro" hidden>Cada dado vai de 1 a ${faces}.</p>
      <div class="fis-bts"><button type="button" class="btn ghost" data-x>Cancelar</button><button class="btn primary">Mandar para a mesa</button></div>
    </form>`;
    document.body.appendChild(fundo);
    const ins = [...fundo.querySelectorAll('input')], erro = fundo.querySelector('.fis-erro');
    setTimeout(() => ins[0].focus(), 30);
    // ao digitar um número que já fecha o dado, pula para o próximo
    ins.forEach((el, i) => el.addEventListener('input', () => { const v = +el.value; if (ins[i + 1] && (v >= 3 || (faces < 10 && v >= 1) || el.value.length >= 2)) ins[i + 1].focus(); }));
    const fim = (v) => { fundo.remove(); document.removeEventListener('keydown', esc); ok(v); };
    const esc = (e) => { if (e.key === 'Escape') fim(null); };
    document.addEventListener('keydown', esc);
    fundo.querySelector('[data-x]').onclick = () => fim(null);
    fundo.addEventListener('click', (e) => { if (e.target === fundo) fim(null); });
    fundo.querySelector('form').onsubmit = (e) => {
      e.preventDefault();
      const vs = ins.map((el) => +el.value);
      if (vs.some((v) => !Number.isInteger(v) || v < 1 || v > faces)) { erro.hidden = false; return; }
      fim(vs);
    };
  });
}
