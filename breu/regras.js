// Regras de criação de personagem do Breu (capítulo 4 do Livro Básico).

export const ATRIBUTOS = [
  { k: 'vigor', n: 'Vigor', d: 'Força, resistência, aguentar o tranco.' },
  { k: 'agilidade', n: 'Agilidade', d: 'Reflexo, mira, equilíbrio, passo leve.' },
  { k: 'juizo', n: 'Juízo', d: 'Atenção, raciocínio, memória, traçar.' },
  { k: 'presenca', n: 'Presença', d: 'Convencer, liderar, cantar, acalmar.' },
  { k: 'firmeza', n: 'Firmeza', d: 'Coragem, fé, vontade de seguir.' },
];

export const PERICIAS = [
  ['Atletismo', 'Correr, nadar, escalar, carregar, segurar uma porta.'],
  ['Luta', 'Atacar de perto: lança, facão, machado, punho.'],
  ['Pontaria', 'Arco, funda, arremesso.'],
  ['Furtividade', 'Andar sem ser ouvido, se esconder, ficar imóvel.'],
  ['Sobrevivência', 'Achar abrigo e água, ler o tempo, não se perder.'],
  ['Percepção', 'Notar rastros, sons, falhas num traço, perigo.'],
  ['Traços', 'Riscar, ler e consertar traços.'],
  ['Ervas e Cura', 'Tratar feridas, preparar chás e unguentos.'],
  ['Ofícios', 'Construir, consertar, trabalhar madeira, couro e osso.'],
  ['Saberes', 'Histórias, lugares, costumes, o que se sabe dos Assombros.'],
  ['Lábia', 'Convencer, negociar, mentir, acalmar uma multidão.'],
  ['Canto', 'Cantar, tocar, improvisar verso, segurar o ânimo dos outros.'],
];

export const SOTAQUES = {
  Serra: 'Mais força em Barrar e em traços de Osso, mas leva o dobro do tempo.',
  Litoral: 'Não se apaga com chuva nem água; mais força em Sopro e Lodo. Fraco em terra seca e pedra.',
  'Terra seca': 'Traça na metade do tempo; mais força em Cinza. Gasta mais rápido.',
  Mata: 'Mais força em Prender e em traços de Raiz. Não funciona no ar.',
  Cidades: 'Qualquer um aprende sem perder dado; aceito em todo lugar. Sem bônus.',
};

export const ORIGENS = [
  { k: 'serra', n: 'A serra', pericia: 'Ofícios', sotaque: 'Serra', pergunta: 'Que pedra da sua casa você ainda lembra de cor?', d: 'Frio, neblina, pedra e casas agarradas na encosta.' },
  { k: 'litoral', n: 'O litoral e o mangue', pericia: 'Atletismo', sotaque: 'Litoral', pergunta: 'Quem te ensinou a ler a maré?', d: 'Palafitas, barcos, lama e o sobe e desce da maré.' },
  { k: 'seca', n: 'A terra seca', pericia: 'Sobrevivência', sotaque: 'Terra seca', pergunta: 'Que poço secou na sua infância?', d: 'Chão rachado, poços fundos, sol que pesa.' },
  { k: 'mata', n: 'A mata', pericia: 'Furtividade', sotaque: 'Mata', pergunta: 'Que som da mata te faz parar até hoje?', d: 'Árvores que cobrem o céu, rios, trilhas que somem.' },
  { k: 'cidade', n: 'Uma cidade de vigília', pericia: 'Saberes', sotaque: 'Cidades', pergunta: 'Você foi convocado, se ofereceu ou fugiu da convocação?', d: 'Muros, guarda, toque de recolher e ordem.' },
  { k: 'estrada', n: 'A estrada', pericia: 'Percepção', sotaque: null, pergunta: 'De qual lugar você nunca mais voltou?', d: 'Sem casa fixa. De abrigo em abrigo, antes do sol cair.' },
];

export const OFICIOS = [
  { k: 'mensageiro', n: 'Mensageiro', d: 'Leva cartas, sal, remédio e notícia entre as comunidades, sempre correndo contra o sol. Conhece cada abrigo da estrada e cada atalho que só dá certo de dia.',
    pericias: ['Atletismo', 'Sobrevivência'], fortes: 'Agilidade, Vigor',
    hab: ['Pé na estrada', 'Você viaja uma vez e meia a distância normal num dia e ganha +1 dado em Sobrevivência na estrada.'],
    equip: 'Bolsa de couro, faca, funda, lanterna de fresta, cantil, mapa riscado à mão.', protecao: 0,
    armas: ['Faca', 'Funda'] },
  { k: 'riscador', n: 'Riscador', d: 'Quem traça, lê e conserta as proteções. Em muitas vilas, é a pessoa mais importante depois do sol, e a primeira a ser culpada quando um círculo rompe.',
    pericias: ['Traços', 'Ofícios'], fortes: 'Juízo, Firmeza',
    hab: ['Mão firme', 'Uma vez por noite, você refaz uma rolagem de Traços e fica com o melhor resultado.'],
    equip: 'Carvão, giz de osso, vara de medir, cordão com nós, faca, saco de sal.', protecao: 0, essenciaExtra: true,
    armas: ['Faca'] },
  { k: 'rezadeira', n: 'Rezadeira / Ervateira', d: 'Cuida do corpo e do medo. Conhece as plantas, os chás, as rezas e o jeito de segurar a mão de quem está tremendo.',
    pericias: ['Ervas e Cura', 'Saberes'], fortes: 'Juízo, Presença',
    hab: ['Mão que cura', 'Com ervas, você devolve 1d6 + Juízo de Sangue a um ferido, uma vez por pessoa por dia.'],
    equip: 'Bolsa de ervas, pilão pequeno, faca, panos limpos, cabaça de unguento.', protecao: 0,
    armas: ['Faca'] },
  { k: 'cantador', n: 'Cantador', d: 'Guarda a memória das comunidades e leva as notícias no verso. No cerco, é quem mantém todo mundo de pé quando a noite pesa.',
    pericias: ['Canto', 'Lábia'], fortes: 'Presença, Firmeza',
    hab: ['Verso de coragem', '1 Prumo. Uma vez por fase da noite, devolve 1 dado a todos que ouvem você, na próxima rolagem deles.'],
    equip: 'Viola, pandeiro ou rabeca, caderno de versos, faca, cobertor.', protecao: 0,
    armas: ['Faca'] },
  { k: 'cacador', n: 'Caçador', d: 'Vai atrás do que ronda as roças. Lê rastros, prepara armadilhas e sabe que um Assombro morto vale mais que dez afastados.',
    pericias: ['Pontaria', 'Percepção'], fortes: 'Agilidade, Juízo',
    hab: ['Ler o rastro', 'Pelos sinais deixados, você descobre o sentido com que um Assombro caça antes de vê-lo.'],
    equip: 'Arco e 12 flechas (6 marcadas), faca, corda, iscas, armadilha de laço.', protecao: 0,
    armas: ['Arco (6 flechas marcadas)', 'Faca'] },
  { k: 'guardiao', n: 'Guardião', d: 'Fica na linha quando o círculo rompe. Segura a brecha, protege quem traça, é o último a dormir e o primeiro a acordar.',
    pericias: ['Luta', 'Atletismo'], fortes: 'Vigor, Firmeza',
    hab: ['Firme na linha', 'Enquanto você defende uma brecha, nenhum Assombro passa por ela sem antes derrubar você.'],
    equip: 'Lança marcada com ponta de osso, couraça de couro cru (+2), escudo de madeira (+1), facão.', protecao: 3,
    armas: ['Lança marcada (ponta de osso)', 'Facão'] },
];

export const ARMAS = {
  Faca: ['d6', 'Perto ou arremesso', 'Discreta. Cabe na bota.'],
  Facão: ['d8', 'Perto', '+1 dado para atravessar vegetação fechada.'],
  Funda: ['d6', 'Longe', 'Munição em qualquer chão.'],
  'Arco (6 flechas marcadas)': ['d8', 'Longe', 'Silencioso. As flechas marcadas ferem Assombros.'],
  'Lança marcada (ponta de osso)': ['d8', 'Dois passos', 'Ataca por cima de um aliado. Marcada: fere Assombros.'],
};

export const MARCAS = [
  { k: 'olho', n: 'Marca do olho', onde: 'Em volta dos olhos', d: 'Até o amanhecer, enxerga no escuro como num fim de tarde. Sob luz direta, perde 1 dado.', custo: 1 },
  { k: 'espinhaco', n: 'Marca do espinhaço', onde: 'Nuca e coluna', d: 'Ao receber dano, corte-o pela metade.', custo: 2 },
  { k: 'guarda', n: 'Marca da guarda', onde: 'Antebraço', d: 'Um aliado ao alcance da sua mão ganha +2 de Defesa até a fase virar.', custo: 1 },
  { k: 'passo', n: 'Marca do passo', onde: 'Canela e tornozelo', d: 'Nesta rodada, você corre o dobro e não pode ser ouvido.', custo: 1 },
  { k: 'mao', n: 'Marca da mão firme', onde: 'Dorso da mão', d: '+1 dado numa rolagem de Traços.', custo: 1 },
  { k: 'sal', n: 'Marca do sal', onde: 'Peito', d: 'Ignore o teste de Pavor desta fase.', custo: 1 },
  { k: 'garganta', n: 'Marca da garganta', onde: 'Pescoço', d: 'Sua voz alcança uma vila inteira; habilidades de canto valem para todos que ouvirem.', custo: 1 },
  { k: 'couro', n: 'Marca do couro', onde: 'Ombros', d: '+2 de Defesa até a fase virar.', custo: 1 },
];

export const ESSENCIAS = { Cinza: 'vence Raiz', Raiz: 'vence Osso', Osso: 'vence Sopro', Sopro: 'vence Lodo', Lodo: 'vence Cinza' };

export const KIT = 'Roupa de tecido grosso, cobertor, cantil, carvão para traçar, um saco de sal (3 linhas de soleira), pederneira e comida para três dias.';

export const novoPersonagem = () => ({
  nome: '', conceito: '', aparencia: '',
  origem: '', sotaqueEstrada: '', periciaExtra: '',
  oficio: '',
  dom: 'adormecido', marca: '', marcaSangue: false, essencias: [],
  atrib: { vigor: 1, agilidade: 1, juizo: 1, presenca: 1, firmeza: 1 },
  respostaOrigem: '', marcaNoite: '', laco: '', medo: '', protege: '',
  notas: '',
});

export const pontosTotais = (p) => (p.dom === 'faisca' ? 5 : 6);
export const pontosUsados = (p) => ATRIBUTOS.reduce((a, x) => a + (p.atrib[x.k] - 1), 0);

export function origemDe(p) { return ORIGENS.find((o) => o.k === p.origem); }
export function oficioDe(p) { return OFICIOS.find((o) => o.k === p.oficio); }

// a perícia da origem repetida com o ofício vira uma à escolha
export function periciaOrigemRepete(p) {
  const o = origemDe(p), f = oficioDe(p);
  return !!(o && f && f.pericias.includes(o.pericia));
}

export function pericias(p) {
  const o = origemDe(p), f = oficioDe(p), out = [];
  if (f) out.push(...f.pericias);
  if (o) {
    if (periciaOrigemRepete(p)) { if (p.periciaExtra) out.push(p.periciaExtra); }
    else out.push(o.pericia);
  }
  return [...new Set(out)];
}

export function sotaque(p) {
  const o = origemDe(p);
  if (!o) return '';
  return o.sotaque || p.sotaqueEstrada || '';
}

export function sabeTracos(p) { return pericias(p).includes('Traços'); }
export function essenciasPermitidas(p) { return sabeTracos(p) ? (oficioDe(p)?.essenciaExtra ? 2 : 1) : 0; }

export function tracosConhecidos(p) {
  const r = ['Barrar'];
  if (sabeTracos(p)) r.push('Repelir', 'Revelar');
  return r;
}

export function barras(p) {
  const a = p.atrib, f = oficioDe(p);
  const marcaComum = p.dom === 'faisca' && p.marca && !p.marcaSangue ? 1 : 0;
  return {
    sangue: 10 + a.vigor * 3,
    prumo: 6 + a.firmeza * 2 - marcaComum,
    brasa: p.dom === 'faisca' ? 2 : 0,
    defesa: 10 + a.agilidade + (f?.protecao || 0),
    sombra: p.dom === 'faisca' && p.marca && p.marcaSangue ? 1 : 0,
  };
}

// o que ainda falta para a ficha estar completa (por passo)
export function pendencias(p) {
  const f = [];
  if (!p.nome.trim()) f.push(['nome', 'Dê um nome ao personagem.']);
  if (!p.origem) f.push(['origem', 'Escolha uma origem.']);
  else {
    if (p.origem === 'estrada' && !p.sotaqueEstrada) f.push(['origem', 'Escolha o sotaque de quem vem da estrada.']);
    if (periciaOrigemRepete(p) && !p.periciaExtra) f.push(['origem', 'A perícia da origem repete a do ofício: escolha outra.']);
  }
  if (!p.oficio) f.push(['oficio', 'Escolha um ofício.']);
  const sobra = pontosTotais(p) - pontosUsados(p);
  if (sobra > 0) f.push(['atributos', `Ainda sobram ${sobra} ponto${sobra > 1 ? 's' : ''} de atributo.`]);
  if (sobra < 0) f.push(['atributos', 'Você gastou pontos demais nos atributos.']);
  if (p.essencias.length < essenciasPermitidas(p)) f.push(['dom', 'Escolha a essência de traço que você conhece.']);
  if (!p.marcaNoite.trim()) f.push(['historia', 'Escreva a noite que te mudou.']);
  if (!p.laco.trim()) f.push(['historia', 'Escreva o seu laço.']);
  return f;
}
