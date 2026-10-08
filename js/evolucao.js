// Regras de evolução de nível (Tormenta20, livro básico) para as classes da mesa.
// Só números e nomes de habilidades; as descrições dos poderes ficam no banco.

const P = (c) => `poder de ${c}`;
function tabela(c, extras) {
  const t = {};
  for (let n = 2; n <= 20; n++) t[n] = [P(c)];
  Object.entries(extras).forEach(([n, l]) => { t[n] = n === '1' ? l : [...l, ...(t[n] || [])]; });
  return t;
}

export const CLASSES = {
  Arcanista: { pv0: 8, pv: 2, pm: 6, chave: 'INT', magias: 'cada',
    niveis: tabela('arcanista', { 1: ['caminho do arcanista', 'magias (1º círculo)'], 5: ['magias (2º círculo)'], 9: ['magias (3º círculo)'], 13: ['magias (4º círculo)'], 17: ['magias (5º círculo)'] }) },
  Bardo: { pv0: 12, pv: 3, pm: 4, chave: 'CAR', magias: 'par',
    niveis: tabela('bardo', { 1: ['inspiração +1', 'magias (1º círculo)'], 2: ['eclético'], 5: ['inspiração +2'], 6: ['magias (2º círculo)'], 9: ['inspiração +3'], 10: ['magias (3º círculo)'], 13: ['inspiração +4'], 14: ['magias (4º círculo)'], 17: ['inspiração +5'] }) },
  Bucaneiro: { pv0: 16, pv: 4, pm: 3, chave: null, magias: null,
    niveis: tabela('bucaneiro', { 1: ['audácia', 'insolência'], 2: ['evasão'], 3: ['esquiva sagaz +1'], 5: ['panache'], 7: ['esquiva sagaz +2'], 10: ['evasão aprimorada'], 11: ['esquiva sagaz +3'], 15: ['esquiva sagaz +4'], 19: ['esquiva sagaz +5'] }) },
  Druida: { pv0: 16, pv: 4, pm: 4, chave: 'SAB', magias: 'par',
    niveis: tabela('druida', { 1: ['devoto fiel', 'empatia selvagem', 'magias (1º círculo)'], 2: ['caminho dos ermos'], 6: ['magias (2º círculo)'], 10: ['magias (3º círculo)'], 14: ['magias (4º círculo)'] }) },
  Ladino: { pv0: 12, pv: 3, pm: 4, chave: null, magias: null,
    niveis: tabela('ladino', { 1: ['ataque furtivo +1d6', 'especialista'], 2: ['evasão'], 3: ['ataque furtivo +2d6'], 4: ['esquiva sobrenatural'], 5: ['ataque furtivo +3d6'], 7: ['ataque furtivo +4d6'], 8: ['olhos nas costas'], 9: ['ataque furtivo +5d6'], 10: ['evasão aprimorada'], 11: ['ataque furtivo +6d6'], 13: ['ataque furtivo +7d6'], 15: ['ataque furtivo +8d6'], 17: ['ataque furtivo +9d6'], 19: ['ataque furtivo +10d6'] }) },
};

const treino = (n) => (n >= 15 ? 6 : n >= 7 ? 4 : 2);
const ARMA_DISTANCIA = /besta|arco|funda|azagaia|pistola|mosquete|dardo|zarabatana|rede/i;

// Tudo o que muda automaticamente ao passar do nível atual para o próximo.
export function ganhosDoNivel(ficha) {
  const cls = CLASSES[ficha.className];
  if (!cls) return null;
  const de = Number(ficha.level) || 1, para = de + 1;
  const con = Number(ficha.attrs?.CON) || 0;
  const nomes = (ficha.powers || []).map((p) => p[0]);
  const pv = cls.pv + con;
  let pm = cls.pm, pmNotas = [];
  if (nomes.includes('Bênção do Mana') && para % 2 === 1) { pm += 1; pmNotas.push('+1 da Bênção do Mana'); }
  if (nomes.includes('Coração Heroico') && [5, 11, 17].includes(para)) { pm += 3; pmNotas.push('+3 do Coração Heroico (novo patamar)'); }
  const tabelaNivel = cls.niveis[para] || [];
  const automaticas = tabelaNivel.filter((x) => !/^poder de |^magias \(/.test(x));
  const circuloNovo = (tabelaNivel.find((x) => /^magias \(/.test(x)) || '').replace(/^magias \(|\)$/g, '');
  const ganhaPoder = tabelaNivel.some((x) => /^poder de /.test(x));
  let magiaNova = false;
  if (cls.magias === 'par') magiaNova = para % 2 === 0;
  if (cls.magias === 'cada') {
    const caminho = (ficha.powers || []).find((p) => p[0] === 'Caminho do Arcanista');
    magiaNova = caminho && /feiticeiro/i.test(caminho[1]) ? para % 2 === 1 : true;
  }
  const meio = Math.floor(para / 2) - Math.floor(de / 2);
  const treinoMais = treino(para) - treino(de);
  const esquiva = automaticas.some((x) => /^esquiva sagaz/.test(x)); // +1 na Defesa e em Reflexos
  return { de, para, cls, pv, pvFormula: `${cls.pv} + Con ${con >= 0 ? '+' : ''}${con}`, pm, pmNotas, automaticas, circuloNovo, ganhaPoder, magiaNova, meio, treinoMais, esquiva };
}

// Aplica os números na ficha (retorna as mudanças para salvar).
export function aplicarNivel(ficha, g) {
  const trained = ficha.trained || [];
  const skills = { ...(ficha.skills || {}) };
  if (g.meio || g.treinoMais) {
    Object.keys(skills).forEach((k) => {
      if (skills[k] === null || skills[k] === undefined) return;
      skills[k] = Number(skills[k]) + g.meio + (trained.includes(k) ? g.treinoMais : 0);
    });
  }
  if (g.esquiva && skills.Reflexos != null) skills.Reflexos += 1;
  const attacks = (ficha.attacks || []).map((a) => {
    const pericia = ARMA_DISTANCIA.test(a[0]) || /médio|longo/i.test(a[5] || '') ? 'Pontaria' : 'Luta';
    const d = g.meio + (trained.includes(pericia) ? g.treinoMais : 0);
    if (!d) return a;
    const b = (parseInt(String(a[1]).replace(/[^\d-]/g, ''), 10) || 0) + d;
    const c = [...a]; c[1] = (b >= 0 ? '+' : '') + b; return c;
  });
  return {
    level: g.para,
    maxHp: Number(ficha.maxHp || 0) + g.pv, hp: Number(ficha.hp || 0) + g.pv,
    maxMp: Number(ficha.maxMp || 0) + g.pm, mp: Number(ficha.mp || 0) + g.pm,
    skills, attacks,
    def: Number(ficha.def || 0) + (g.esquiva ? 1 : 0),
    levelUp: false,
  };
}

// ----- pré-requisitos -----
const ATR = { for: 'FOR', des: 'DES', con: 'CON', int: 'INT', sab: 'SAB', car: 'CAR' };
export function checarPreRequisitos(pre, ficha, nivelNovo) {
  if (!pre) return { ok: true, falta: [] };
  const falta = [];
  const nomes = (ficha.powers || []).map((p) => p[0].toLowerCase().replace(/\s*\(x\d+\)$/, ''));
  const caminho = ((ficha.powers || []).find((p) => p[0] === 'Caminho do Arcanista') || [, ''])[1].toLowerCase();
  pre.split(/,\s*/).forEach((parte) => {
    const p = parte.trim(); if (!p) return;
    let m;
    if ((m = p.match(/^(\d+)º nível de/i))) { if (nivelNovo < +m[1]) falta.push(`nível ${m[1]}`); return; }
    if ((m = p.match(/^(For|Des|Con|Int|Sab|Car)\s+(-?\d+)/i))) {
      const v = Number(ficha.attrs?.[ATR[m[1].toLowerCase()]]) || 0;
      if (v < +m[2]) falta.push(`${m[1]} ${m[2]}`); return;
    }
    if ((m = p.match(/^treinado em (.+)$/i))) {
      m[1].split(/\s+e\s+/).forEach((sk) => {
        const nome = sk.replace(/\s*\(.*\)/, '').trim();
        if (!(ficha.trained || []).some((t) => t.toLowerCase() === nome.toLowerCase())) falta.push(`treinado em ${sk.trim()}`);
      });
      return;
    }
    const opcoes = p.split(/\s+ou\s+/i).map((x) => x.trim().toLowerCase());
    const tem = opcoes.some((o) => nomes.includes(o) || (['bruxo', 'mago', 'feiticeiro'].includes(o) && caminho.includes(o)));
    if (!tem) falta.push(p);
  });
  return { ok: !falta.length, falta };
}

// ----- estilo e recomendações -----
const ESTILOS = [
  ['ataque', 'quem bate forte', /\b(dano|ataque|acerto|crítico|golpe)\b/i],
  ['defesa', 'quem aguenta pancada', /\b(Defesa|resistência|redução de dano|PV temporários|evita)\b/],
  ['mobilidade', 'quem se move rápido', /\b(deslocamento|movimento|salto|investida|terreno)\b/i],
  ['furtivo', 'quem age nas sombras', /\b(Furtividade|desprevenid|escondid|furtiv|surpres)/i],
  ['controle', 'quem atrapalha os inimigos', /\b(abalad|atordoad|enredad|caíd|derrubar|apavorad|fascinad|pasm|lent|imóvel|medo)/i],
  ['suporte', 'quem ajuda o grupo', /\b(aliad|cura|recupera|inspira)/i],
  ['magia', 'quem vive de magia', /\b(magias?|lança|arcan\w*|círculo)\b/i],
  ['social', 'quem resolve na conversa', /\b(Diplomacia|Enganação|Intimidação|Nobreza|festa|convers|influência)/i],
];
export function tagsDe(texto) { return ESTILOS.filter(([, , re]) => re.test(texto)).map(([k]) => k); }

export function perfil(ficha) {
  const cont = {};
  (ficha.powers || []).forEach(([n, d]) => tagsDe(n + ' ' + d).forEach((t) => { cont[t] = (cont[t] || 0) + 1; }));
  const top = Object.entries(cont).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k);
  const frase = top.map((k) => ESTILOS.find((e) => e[0] === k)[1]).join(' e ');
  return { top, frase, cont };
}

export function sentiFalta(ficha) {
  const p = perfil(ficha), dicas = [];
  const temDistancia = (ficha.attacks || []).some((a) => ARMA_DISTANCIA.test(a[0]) || /médio|longo/i.test(a[5] || ''));
  const melhorDist = Math.max(-99, ...(ficha.attacks || []).filter((a) => ARMA_DISTANCIA.test(a[0]) || /médio|longo/i.test(a[5] || '')).map((a) => parseInt(String(a[1]).replace(/[^\d-]/g, ''), 10) || 0));
  const melhorPerto = Math.max(-99, ...(ficha.attacks || []).filter((a) => !(ARMA_DISTANCIA.test(a[0]) || /médio|longo/i.test(a[5] || ''))).map((a) => parseInt(String(a[1]).replace(/[^\d-]/g, ''), 10) || 0));
  if (!temDistancia) dicas.push('Você não tem nenhum ataque à distância.');
  else if (melhorPerto > melhorDist + 2) dicas.push(`Fora do corpo a corpo seu melhor ataque é ${melhorDist >= 0 ? '+' : ''}${melhorDist}.`);
  if (!p.cont.defesa && Number(ficha.def) < 17) dicas.push(`Sua Defesa é ${ficha.def} e nada na ficha te protege mais.`);
  if (!p.cont.mobilidade) dicas.push('Nada na ficha te ajuda a se mover mais rápido.');
  return dicas.slice(0, 2);
}
