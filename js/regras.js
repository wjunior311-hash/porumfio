// Regras de Tormenta20 usadas pela ficha: grupos de poderes, custos, círculos e aprimoramentos.

// Em que momento cada poder é usado.
export const GRUPOS = {
  passiva: { titulo: 'Sempre valendo', dica: 'Já estão somadas na ficha. Você não precisa fazer nada.', icone: '✓', cor: '#22302a', tinta: '#9fd8b8' },
  luta: { titulo: 'Na luta, quando você quiser', dica: 'Você escolhe usar durante o seu turno ou como reação.', icone: '»', cor: '#3a2228', tinta: '#f3b0a8' },
  pericia: { titulo: 'Em testes de perícia', dica: 'Para quando você precisa muito passar num teste.', icone: '+', cor: '#3a2d12', tinta: '#f0d38a' },
  fora: { titulo: 'Fora da luta', dica: 'Viagem, conversa e exploração.', icone: '≈', cor: '#1f3040', tinta: '#9fd0f0' },
  magia: { titulo: 'De onde vêm suas magias', dica: 'Explicam o que você pode lançar. As magias estão na aba Magias.', icone: '✶', cor: '#2a2240', tinta: '#c3aaff' },
};

// Catálogo dos poderes que os personagens têm hoje.
// pm: custo base (0 = grátis). extras: opções que aumentam o custo.
// nivelPorExtra: o extra só pode ser usado uma vez a cada N níveis.
export const PODERES = {
  // Hippion
  'Audácia': { grupo: 'pericia', pm: 2, quando: 'Some seu Carisma num teste de perícia. Não vale para ataque.' },
  'Insolência': { grupo: 'passiva', quando: 'Seu Carisma entra na Defesa (limitado pelo nível).' },
  'Evasão': { grupo: 'passiva', quando: 'Se passar em Reflexos contra uma área, não sofre dano nenhum.' },
  'Esquiva Sagaz': { grupo: 'passiva', quando: '+1 na Defesa e em Reflexos (aumenta a cada 4 níveis).' },
  'Acrobático': { grupo: 'passiva', quando: 'Terreno difícil não te atrasa. Usa Destreza em Atletismo.' },
  'Ataque Acrobático': { grupo: 'luta', quando: 'Chegou no inimigo com salto ou pirueta e atacou? +2 no ataque e no dano.' },
  'Ataque Pesado': { grupo: 'luta', pm: 1, quando: 'Acertou com arma de duas mãos? Derruba ou empurra o alvo de graça.' },
  'Estilo de Duas Mãos': { grupo: 'passiva', quando: '+5 no dano com arma corpo a corpo nas duas mãos.' },
  'Mestre do Tridente': { grupo: 'passiva', quando: '+2 no dano com tridente, lança e azagaia.' },
  'Canção dos Mares': { grupo: 'magia', quando: 'Te dá duas magias de encantamento, lançadas com Carisma.' },
  'Mestre dos Mares': { grupo: 'fora', quando: 'Conversa com animais aquáticos.' },
  'Transformação Anfíbia': { grupo: 'fora', quando: 'Respira debaixo d’água e nada 12 m com a cauda.' },
  'Passagem de Navio': { grupo: 'fora', quando: 'Viagem de barco de graça para o grupo, pagando com trabalho.' },
  // Malekir
  'Arcano de Batalha': { grupo: 'passiva', quando: 'Soma Inteligência no dano das suas magias.' },
  'Aumento de Atributo': { grupo: 'passiva', quando: '+1 num atributo (já está na ficha).' },
  'Bênção do Mana': { grupo: 'passiva', quando: '+1 PM a cada nível ímpar (já está na ficha).' },
  'Caminho do Arcanista': { grupo: 'magia', quando: 'Você é um mago: aprende magias estudando.' },
  'Conhecimento Mágico': { grupo: 'magia', quando: 'Aprendeu duas magias extras.' },
  'Herança de Pyra': { grupo: 'luta', pm: 2, quando: 'Falhou num teste para se livrar de uma condição? Role de novo.' },
  'Herança Divina': { grupo: 'passiva', quando: 'Você é espírito e enxerga no escuro.' },
  'Sangue Azul': { grupo: 'fora', quando: 'Influência com nobres e com a guarda.' },
  'Magias': { grupo: 'magia', quando: 'Explica quais círculos você pode lançar e quando ganha magias novas.' },
  // Fani
  'Amiga das Plantas': { grupo: 'magia', quando: 'Lança Controlar Plantas com Sabedoria.' },
  'Armadura de Allihanna': { grupo: 'luta', pm: 1, quando: 'Ação de movimento: a pele vira casca, +2 na Defesa até o fim da cena.' },
  'Aspecto do Verão': { grupo: 'luta', pm: 1, quando: 'Arma em chamas: +1d6 de fogo, e cada acerto te dá 1 PM temporário.' },
  'Caminho dos Ermos': { grupo: 'passiva', quando: 'Atravessa terreno natural difícil sem atraso e é difícil de rastrear.' },
  'Compreender os Ermos': { grupo: 'passiva', quando: '+2 em Sobrevivência e usa Sabedoria em Adestramento.' },
  'Coração Heroico': { grupo: 'passiva', quando: '+3 PM (já está na ficha).' },
  'Dedo Verde': { grupo: 'magia', quando: 'Aprendeu Controlar Plantas.' },
  'Devoto Fiel': { grupo: 'passiva', quando: 'Recebe dois poderes da sua divindade em vez de um.' },
  'Empatia Selvagem (x2)': { grupo: 'fora', quando: 'Conversa com animais e usa Adestramento para pedir favores.' },
  'Força dos Penhascos': { grupo: 'luta', quando: 'Levou dano pisando em terra ou pedra? Gaste PM para reduzir 10 de dano por PM.',
    extras: [{ pm: 1, texto: 'Reduz 10 de dano', repetivel: true, limite: 'SAB' }], pm: 0, variavel: true },
  'Forma Selvagem': { grupo: 'luta', pm: 3, quando: 'Ação completa: vira um animal. Não fala nem lança magias assim.' },
  // Neo
  'Apostar com o Trapaceiro': { grupo: 'pericia', pm: 1, quando: 'Você e o mestre rolam um d20; você escolhe qual vale.' },
  'Ataque Furtivo': { grupo: 'luta', quando: 'Acertou alguém desprevenido ou flanqueado? Dano extra (uma vez por rodada).' },
  'Cão de Briga': { grupo: 'luta', quando: 'Primeira vez que agride na cena: ganha um ataque extra.' },
  'Emboscar': { grupo: 'luta', pm: 2, quando: 'Na primeira rodada do combate: ganha uma ação padrão a mais.' },
  'Especialista': { grupo: 'pericia', pm: 1, quando: 'Dobra o bônus de treino numa perícia escolhida (não vale ataque).' },
  'Esquiva Sobrenatural': { grupo: 'passiva', quando: 'Nunca fica surpreendido.' },
  'Mau Cheiro': { grupo: 'luta', pm: 2, quando: 'Ação padrão: gás fétido deixa quem está perto enjoado.' },
  'Mordida': { grupo: 'luta', pm: 1, quando: 'Ao atacar, gaste 1 PM para morder também.' },
  'Reptiliano': { grupo: 'passiva', quando: 'Enxerga no escuro, +1 na Defesa e +5 em Furtividade sem armadura pesada.' },
  'Sangue Frio': { grupo: 'passiva', quando: 'Atenção: sofre 1 de dano a mais por dado de frio.' },
  'Sombra': { grupo: 'passiva', quando: '+2 em Furtividade e se esconde mesmo andando normalmente.' },
  'Velocidade Ladina': { grupo: 'luta', pm: 2, quando: 'Uma vez por rodada: ganha uma ação de movimento a mais.' },
  // Zuri
  'Cria de Megalokk': { grupo: 'passiva', quando: 'Você é monstro e enxerga no escuro.' },
  'Dom Artístico': { grupo: 'passiva', quando: '+2 em Atuação e ganha o dobro em apresentações.' },
  'Eclético': { grupo: 'pericia', pm: 1, quando: 'Fica treinada em qualquer perícia por um teste.' },
  'Inspiração': { grupo: 'luta', pm: 2, quando: 'Ação padrão: você e aliados próximos ganham +1 em perícias até o fim da cena.',
    extras: [{ pm: 2, texto: '+1 no bônus da Inspiração', repetivel: true, aCadaNiveis: 4 }] },
  'Inspiração Marcial': { grupo: 'passiva', quando: 'Sua Inspiração também soma no dano.' },
  'Inspiração Revigorante': { grupo: 'passiva', quando: 'Sua Inspiração também dá PV temporários (5 × o bônus).' },
  'Música: Melodia Curativa': { grupo: 'luta', pm: 1, quando: 'Ação padrão: aliados no alcance curto recuperam 1d6 PV.',
    extras: [{ pm: 1, texto: '+1d6 de cura', repetivel: true }] },
  'Natureza Venenosa': { grupo: 'luta', pm: 1, quando: 'Ação de movimento: envenena a arma, +1d12 de veneno no próximo acerto.' },
  'Olhar Atordoante': { grupo: 'luta', pm: 1, quando: 'Ação de movimento: o alvo faz Fortitude ou fica atordoado 1 rodada.' },
  'Sortudo': { grupo: 'pericia', pm: 3, quando: 'Role de novo um teste que acabou de fazer.' },
};

// Primeiro círculo de cada nível de magia, por classe.
const CIRCULOS = {
  Arcanista: [1, 5, 9, 13, 17],
  Clérigo: [1, 5, 9, 13, 17],
  Bardo: [1, 6, 10, 14],
  Druida: [1, 6, 10, 14],
};
const ARCANOS = ['Arcanista', 'Bardo'];
const DIVINOS = ['Clérigo', 'Druida', 'Paladino'];

export function circuloMaximo(classe, nivel) {
  const t = CIRCULOS[classe];
  if (!t) return 1; // magias de raça ou poder: só 1º círculo
  let c = 0;
  t.forEach((n, i) => { if (nivel >= n) c = i + 1; });
  return Math.max(1, c);
}

export function infoPoder(nome) {
  return PODERES[nome] || { grupo: 'passiva', quando: '' };
}

// Lê o texto da magia e separa descrição, truque e aprimoramentos.
export function lerMagia(magia, ficha) {
  const meta = (magia.meta || '').split('•').map((s) => s.trim()).filter(Boolean);
  const custoBase = parseInt((meta.find((m) => /PM$/.test(m)) || '1').replace(/\D/g, ''), 10) || 1;
  const circulo = parseInt(meta[0], 10) || 1;
  const tags = meta.filter((m) => !/PM$/.test(m));
  const texto = magia.description || magia.desc || '';
  const [antes, aprim = ''] = texto.split(/\n\s*Aprimoramentos:\s*\n/);
  const partes = antes.split(/\n\s*\n/);
  const principal = partes[0] || '';
  const truque = (partes.find((p) => /^Truque:/.test(p)) || '').replace(/^Truque:\s*/, '');
  const circMax = circuloMaximo(ficha.className, ficha.level || 1);
  const classe = ficha.className || '';
  const raca = (ficha.race || '').toLowerCase();
  const aprimoramentos = aprim.split('\n').map((l) => l.trim()).filter((l) => /^\+\d+\s*PM/.test(l)).map((linha, i) => {
    const pm = parseInt(linha.match(/^\+(\d+)/)[1], 10);
    const restr = (linha.match(/\(Apenas ([^)]+)\)/) || [])[1] || '';
    const reqCirc = parseInt((linha.match(/Requer (\d)º círculo/) || [])[1] || '0', 10);
    let txt = linha.replace(/^\+\d+\s*PM\s*(\([^)]*\))?\s*:\s*/, '').replace(/\s*Requer \dº círculo\.?/, '').trim();
    let bloqueio = '';
    if (reqCirc && reqCirc > circMax) bloqueio = `Precisa do ${reqCirc}º círculo`;
    if (restr) {
      const r = restr.toLowerCase();
      const ok = (r === 'arcanos' && ARCANOS.includes(classe)) || (r === 'divinos' && DIVINOS.includes(classe)) ||
        (r === 'elfos' && raca.includes('elf'));
      if (!ok) bloqueio = `Só para ${restr.toLowerCase()}`;
    }
    return { id: i, pm, texto: txt, bloqueio, repetivel: /^aumenta/i.test(txt) && !/só pode usar este aprimoramento uma vez/i.test(txt) };
  });
  return { custoBase, circulo, tags, principal, truque, aprimoramentos, circMax };
}

export const CONDICOES = [
  'Abalado', 'Agarrado', 'Alquebrado', 'Apavorado', 'Atordoado', 'Caído', 'Cego', 'Confuso', 'Debilitado',
  'Desprevenido', 'Enfeitiçado', 'Enjoado', 'Enredado', 'Envenenado', 'Esmorecido', 'Exausto', 'Fascinado',
  'Fatigado', 'Fraco', 'Frustrado', 'Imóvel', 'Inconsciente', 'Indefeso', 'Lento', 'Ofuscado', 'Paralisado',
  'Pasmo', 'Petrificado', 'Preso', 'Sangrando', 'Sobrecarregado', 'Surdo', 'Surpreendido', 'Vulnerável', 'Em chamas', 'Flanqueado',
];

export const PERICIAS = [
  ['Acrobacia', 'DES'], ['Adestramento', 'CAR'], ['Atletismo', 'FOR'], ['Atuação', 'CAR'], ['Cavalgar', 'DES'],
  ['Conhecimento', 'INT'], ['Cura', 'SAB'], ['Diplomacia', 'CAR'], ['Enganação', 'CAR'], ['Fortitude', 'CON'],
  ['Furtividade', 'DES'], ['Guerra', 'INT'], ['Iniciativa', 'DES'], ['Intimidação', 'CAR'], ['Intuição', 'SAB'],
  ['Investigação', 'INT'], ['Jogatina', 'CAR'], ['Ladinagem', 'DES'], ['Luta', 'FOR'], ['Misticismo', 'INT'],
  ['Nobreza', 'INT'], ['Ofício', 'INT'], ['Percepção', 'SAB'], ['Pilotagem', 'DES'], ['Pontaria', 'DES'],
  ['Reflexos', 'DES'], ['Religião', 'SAB'], ['Sobrevivência', 'SAB'], ['Vontade', 'SAB'],
];
