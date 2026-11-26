// A luta de todo mundo: fichas curtas dos NPCs, iniciativa, efeitos que entram e saem sozinhos.
import * as M from './mestre-dados.js?v=2';

const sem = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// fichas de luta dos NPCs. ini = bônus de iniciativa. pericias: dados e bônus de cada teste.
// poupa: não deixa ninguém do grupo abaixo de 1 de Sangue (escolhe não matar).
export const FICHAS_NPC = {
  rosario: { n: 'Rosário', sangue: 10, defesa: 11, ini: 2, atq: '1d20+1', dano: 'd4', arma: 'pincel quebrado, faca de cozinha', pericias: { Luta: '1d20+1', Atletismo: '1d20+2', Traços: '1d20', Percepção: '1d20+1' }, nota: 'Corajosa e impulsiva. Corre para a linha quando vê o pai sendo desfeito.' },
  bento: { n: 'Bento', sangue: 8, defesa: 10, ini: 1, atq: '1d20', dano: 'd4', arma: 'faca de cal', pericias: { Traços: '2d20+2', Luta: '1d20', Atletismo: '1d20' }, nota: 'Aprendiz do Antero. Sabe riscar, não sabe brigar. Gagueja com medo.' },
  bras: { n: 'Brás', sangue: 14, defesa: 12, ini: 2, atq: '2d20+2', dano: 'd6', arma: 'facão de estrada', pericias: { Luta: '2d20+2', Saberes: '2d20+3', Percepção: '1d20+2', Sobrevivência: '2d20+2' }, nota: 'Andou muita estrada. Sabe dos bichos e dos Rasgados. Briga bem e não corre.' },
  lindalva: { n: 'Dona Lindalva', sangue: 6, defesa: 9, ini: 0, atq: '1d20', dano: 'd3', arma: 'nenhuma', pericias: { Lábia: '1d20+1' }, nota: 'Não luta. Quer o marido de volta.' },
  firmina: { n: 'Dona Firmina', sangue: 7, defesa: 10, ini: 0, atq: '1d20', dano: 'd4', arma: 'cajado', pericias: { Saberes: '2d20+3', Lábia: '2d20+2' }, nota: 'Velha. Fica com as crianças nos fundos.' },
  zuleide: { n: 'Dona Zuleide', sangue: 6, defesa: 9, ini: 0, atq: '1d20', dano: 'd3', arma: 'nenhuma', pericias: { Saberes: '1d20+2' }, nota: 'Não luta.' },
  orlando: { n: 'Seu Orlando', sangue: 10, defesa: 11, ini: 1, atq: '1d20+1', dano: 'd6', arma: 'porrete', pericias: { Luta: '1d20+1', Lábia: '1d20+2' }, nota: 'Comerciante. Luta se não tiver para onde correr.' },
  joana: { n: 'Joana', sangue: 12, defesa: 12, ini: 1, atq: '2d20+1', dano: 'd6', arma: 'martelo de ferreira', pericias: { Luta: '2d20+1', Ofícios: '2d20+3', Atletismo: '1d20+2' }, nota: 'Ferreira. Bate forte.' },
  celeste: { n: 'Celeste, a bordadeira', sangue: 40, defesa: 16, ini: 4, atq: '2d20+5', dano: 'd6', arma: 'tesoura de bordar', poupa: true, pericias: { Luta: '2d20+5', Pontaria: '2d20+5', Lábia: '3d20+4', Saberes: '2d20+5', Percepção: '2d20+4' }, nota: 'Rasgada, Pregadora. Muito mais forte que o grupo. Não rola Pavor. Escolhe não matar: ninguém cai abaixo de 1 de Sangue pelas mãos dela. Se ficar com metade do Sangue ou menos, o moço a puxa para cima da Corcunda e eles vão embora.' },
  zeca: { n: 'Zeca, o moço dos baldes', sangue: 30, defesa: 15, ini: 3, atq: '2d20+4', dano: 'd8', arma: 'vara de ponta de osso (alcance 2)', poupa: true, pericias: { Luta: '2d20+4', Pontaria: '2d20+5', Atletismo: '2d20+3', Percepção: '1d20+3' }, nota: 'Rasgado, o cão de guarda dela. Não rola Pavor. Se joga na frente dela quando ela é atacada. Também não mata.' },
};
export function fichaNpc(nome) {
  const s = sem(nome).replace(/^(dona|seu) /, '');
  const k = Object.keys(FICHAS_NPC).find((x) => s.startsWith(x) || s.includes(x));
  return k ? { k, ...FICHAS_NPC[k] } : null;
}
// iniciativa dos bichos: os menores são mais rápidos
const INI_TAM = { Miúdo: 4, Pequeno: 3, Médio: 2, Grande: 1, Enorme: 0 };
// o que vale na luta para qualquer peça do mapa (bicho ou NPC)
export function fichaDe(t) {
  if (!t) return null;
  if (t.kind === 'assombro') {
    const b = M.BESTIARIO.find((x) => x.id === t.data?.best); if (!b) return null;
    return { n: b.nome, sangue: b.sangue, defesa: b.defesa, ini: INI_TAM[b.tam] ?? 2, atq: b.atq, dano: b.dano, familia: b.familia, best: b, pericias: { Luta: b.atq, Percepção: b.atq } };
  }
  if (t.kind === 'npc') return fichaNpc(t.nome);
  return null;
}
// rola "2d20+3": vale o maior dado, mais o bônus. extra = dados a mais (ou a menos)
export function rolarExpr(expr, extra = 0) {
  const m = /(\d+)d(\d+)\s*\+?\s*(-?\d*)/.exec(expr || '1d20') || [0, 1, 20, 0];
  const f = +m[2], bonus = +(m[3] || 0), n = +m[1] + extra, vazia = n <= 0;
  const dados = Array.from({ length: vazia ? 2 : n }, () => 1 + Math.floor(Math.random() * f));
  const fica = vazia ? Math.min(...dados) : Math.max(...dados);
  return { dados, fica, bonus, total: fica + bonus, vazia };
}
export function rolarDanoExpr(expr, mais = 0) {
  const m = /(\d*)d(\d+)\s*\+?\s*(-?\d*)/.exec(expr || 'd4'); if (!m) return { dados: [1], total: 1 };
  const n = +(m[1] || 1) + mais, f = +m[2], b = +(m[3] || 0);
  const dados = Array.from({ length: Math.max(1, n) }, () => 1 + Math.floor(Math.random() * f));
  return { dados, total: dados.reduce((s, x) => s + x, 0) + b };
}

// ---------- efeitos: dados a mais ou a menos que entram e saem sozinhos ----------
// alvo: 'pc:<id do personagem>' ou 'tok:<id da peça>'. dura: 'proxima' (a próxima rolagem), 'rodada', 'fase', 'noite'
export const DURA = { proxima: 'na próxima rolagem', rodada: 'até a próxima rodada', fase: 'até a fase virar', noite: 'até o amanhecer' };
export function efeitosDe(n, alvo) { return (n?.efeitos || []).filter((e) => e.alvo === alvo); }
export function dadosExtra(n, alvo) { return efeitosDe(n, alvo).reduce((s, e) => s + (e.dados || 0), 0); }
export function addEfeito(n, e) { n.efeitos ||= []; n.efeitos.push({ id: Math.random().toString(36).slice(2, 9), ...e }); }
export function gastarProxima(n, alvo) { const antes = (n?.efeitos || []).length; if (!antes) return false; n.efeitos = n.efeitos.filter((e) => !(e.alvo === alvo && e.dura === 'proxima')); return n.efeitos.length !== antes; }
export function limparEfeitos(n, quando) {
  const fim = { rodada: ['rodada'], fase: ['rodada', 'fase', 'proxima'], noite: ['rodada', 'fase', 'proxima', 'noite'] }[quando] || [];
  const antes = (n?.efeitos || []).length; if (!antes) return false;
  n.efeitos.filter((e) => fim.includes(e.dura) && e.circ).forEach((e) => { n.circulo = Math.max(0, (n.circulo ?? 14) - e.circ); });
  n.efeitos = n.efeitos.filter((e) => !fim.includes(e.dura)); return n.efeitos.length !== antes;
}
export function efeitoTxt(e) { return `${e.dados ? `${e.dados > 0 ? '+' : '−'}${Math.abs(e.dados)} dado${Math.abs(e.dados) > 1 ? 's' : ''}` : ''}${e.dados && e.nota ? ': ' : ''}${e.nota || ''} (${DURA[e.dura] || ''}${e.de ? `, de ${e.de}` : ''})`; }
