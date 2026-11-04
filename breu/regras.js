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
  { k: 'serra', n: 'A serra', pericia: 'Ofícios', sotaque: 'Serra', pergunta: 'Que pedra da sua casa você ainda lembra de cor?', d: 'Frio, neblina, pedra e casas agarradas na encosta.' , costume: ["Pé de pedra", "+1 dado para escalar e andar em encosta. O frio da serra não te custa Sangue."], visual: "Lã grossa em camadas, mantas de tear e gorros de tricô, em cinza-azulado e terra queimada. Traços entalhados em plaquinhas de pedra-sabão penduradas no pescoço. Botas de couro amarradas até a canela." },
  { k: 'litoral', n: 'O litoral e o mangue', pericia: 'Atletismo', sotaque: 'Litoral', pergunta: 'Quem te ensinou a ler a maré?', d: 'Palafitas, barcos, lama e o sobe e desce da maré.' , costume: ["Fôlego de maré", "Prende a respiração o dobro do tempo e não perde dado andando na lama ou na água rasa."], visual: "Tecido leve que seca rápido, calça arregaçada, pés descalços e chapéu de palha largo, em azul anil e branco desbotados de sal. Rede de pesca usada como capa, colares de conchas. Traços pintados com lama do mangue nos braços." },
  { k: 'seca', n: 'A terra seca', pericia: 'Sobrevivência', sotaque: 'Terra seca', pergunta: 'Que poço secou na sua infância?', d: 'Chão rachado, poços fundos, sol que pesa.' , costume: ["Sede curta", "Aguenta um dia inteiro sem água sem perder nada e ganha +1 dado para achar água."], visual: "Algodão cru claro, lenço cobrindo o rosto contra a poeira e couro curtido nas pernas contra os espinhos, em ocre e vermelho de barro. Traços riscados com carvão e cinza; sempre um tição na cintura." },
  { k: 'mata', n: 'A mata', pericia: 'Furtividade', sotaque: 'Mata', pergunta: 'Que som da mata te faz parar até hoje?', d: 'Árvores que cobrem o céu, rios, trilhas que somem.' , costume: ["Ouvido de mata", "+1 dado em Percepção para ouvir, e de dia você nunca se perde na mata."], visual: "Algodão tingido com casca e folha, em verde-escuro e marrom. Cesto trançado nas costas, colares de sementes. Traços riscados em pulseiras de fibra e em lascas de casca de árvore." },
  { k: 'cidade', n: 'Uma cidade de vigília', pericia: 'Saberes', sotaque: 'Cidades', pergunta: 'Você foi convocado, se ofereceu ou fugiu da convocação?', d: 'Muros, guarda, toque de recolher e ordem.' , costume: ["Papel em dia", "Você tem salvo-conduto: entra em cidades muradas sem ser barrado e ganha +1 dado em Lábia com guardas e autoridades."], visual: "Peças de uniforme reaproveitadas, botões de metal e braçadeira numerada da convocação, em cinza e ferrugem, as cores oficiais. Traços carimbados em placas de metal, todos iguais." },
  { k: 'estrada', n: 'A estrada', pericia: 'Percepção', sotaque: null, pergunta: 'De qual lugar você nunca mais voltou?', d: 'Sem casa fixa. De abrigo em abrigo, antes do sol cair.' , costume: ["Casa em qualquer lugar", "Você sempre consegue pouso ou uma troca justa numa comunidade, porque sabe chegar como visitante."], visual: "Peças de vários lugares, muito remendo, bolsa grande e sapatos gastos. Um objeto de cada lugar por onde passou, cada um com um traço de sotaque diferente." },
];

export const OFICIOS = [
  { k: 'mensageiro', n: 'Mensageiro', d: 'Leva cartas, sal, remédio e notícia entre as comunidades, sempre correndo contra o sol. Conhece cada abrigo da estrada e cada atalho que só dá certo de dia.',
    pericias: ['Atletismo', 'Sobrevivência'], fortes: 'Agilidade, Vigor',
    hab: ['Pé na estrada', 'Você viaja uma vez e meia a distância normal num dia e ganha +1 dado em Sobrevivência na estrada.'],
    equip: 'Bolsa de couro, faca, funda, lanterna de fresta, cantil, mapa riscado à mão.', protecao: 0,
    caminhos: [{ k: 'batedor', n: 'Batedor', d: 'Estradas e rapidez', habs: [['Antes do sol', '2 Sangue', 'Uma vez por viagem, encontra um abrigo seguro antes do Crepúsculo.'], ['Passo sem som', '', 'Andando devagar, nunca é percebido por Assombros que ouvem.']] },
      { k: 'embaixador', n: 'Embaixador', d: 'Acordos entre povos', habs: [['Palavra empenhada', '2 Prumo', '+2 dados em Lábia para convencer uma comunidade a abrigar ou ajudar o grupo.'], ['Muitos sotaques', '', 'Não perde dado com traços de sotaques que já viu de perto.']] }],
    armas: ['Faca', 'Funda'] },
  { k: 'riscador', n: 'Riscador', d: 'Quem traça, lê e conserta as proteções. Em muitas vilas, é a pessoa mais importante depois do sol, e a primeira a ser culpada quando um círculo rompe.',
    pericias: ['Traços', 'Ofícios'], fortes: 'Juízo, Firmeza',
    hab: ['Mão firme', 'Uma vez por noite, você refaz uma rolagem de Traços e fica com o melhor resultado.'],
    equip: 'Carvão, giz de osso, vara de medir, cordão com nós, faca, saco de sal.', protecao: 0, essenciaExtra: true,
    caminhos: [{ k: 'mestrecirculos', n: 'Mestre de Círculos', d: 'Grandes defesas', habs: [['Círculo largo', '', 'Seus círculos levam metade do tempo, e você traça círculos grandes sem perder dado.'], ['Costura firme', '', 'Seus círculos começam com +3 de força.']] },
      { k: 'marcador', n: 'Marcador', d: 'Tatua Marcas nos outros', habs: [['Agulha certa', '', 'Tatua Marcas em outras pessoas; quem recebe gasta 1 Brasa a menos para usá-las.'], ['Tinta escura', '', 'A primeira Marca de sangue de Assombro que você faz em cada pessoa não soma Sombra.']] }],
    armas: ['Faca'] },
  { k: 'rezadeira', n: 'Rezadeira / Ervateira', d: 'Cuida do corpo e do medo. Conhece as plantas, os chás, as rezas e o jeito de segurar a mão de quem está tremendo.',
    pericias: ['Ervas e Cura', 'Saberes'], fortes: 'Juízo, Presença',
    hab: ['Mão que cura', 'Com ervas, você devolve 1d6 + Juízo de Sangue a um ferido, uma vez por pessoa por dia.'],
    equip: 'Bolsa de ervas, pilão pequeno, faca, panos limpos, cabaça de unguento.', protecao: 0,
    caminhos: [{ k: 'curandeira', n: 'Curandeira', d: 'O corpo', habs: [['Fecha a ferida', '2 Prumo', 'Tira o estado de ferido de alguém no meio da noite.'], ['Chá de vigília', '', 'Preparado de dia; quem toma ganha +1 dado nos testes de Pavor daquela noite.']] },
      { k: 'benzedeira', n: 'Benzedeira', d: 'O medo', habs: [['Reza que acalma', '2 Prumo', 'Remove todo o Pavor de uma pessoa.'], ['Benzer o lugar', '', 'Assombros que sentem medo não encontram quem está num cômodo benzido.']] }],
    armas: ['Faca'] },
  { k: 'cantador', n: 'Cantador', d: 'Guarda a memória das comunidades e leva as notícias no verso. No cerco, é quem mantém todo mundo de pé quando a noite pesa.',
    pericias: ['Canto', 'Lábia'], fortes: 'Presença, Firmeza',
    hab: ['Verso de coragem', '1 Prumo. Uma vez por fase da noite, devolve 1 dado a todos que ouvem você, na próxima rolagem deles.'],
    equip: 'Viola, pandeiro ou rabeca, caderno de versos, faca, cobertor.', protecao: 0,
    caminhos: [{ k: 'repentista', n: 'Repentista', d: 'Ânimo no cerco', habs: [['Desafio', '', 'Cantando para alguém em pânico, você encerra o pânico na hora.'], ['Toada do cerco', '', 'Enquanto você canta, Assombros que ouvem perdem 1 dado.']] },
      { k: 'memoria', n: 'Guardião da Memória', d: 'Saber e nomes', habs: [['Já ouvi falar', '', 'Com Saberes 10, sabe o sentido e a essência de um Assombro só pela descrição.'], ['Caminho cantado', '', 'Nunca se perde numa estrada que alguém já lhe cantou.']] }],
    armas: ['Faca'] },
  { k: 'cacador', n: 'Caçador', d: 'Vai atrás do que ronda as roças. Lê rastros, prepara armadilhas e sabe que um Assombro morto vale mais que dez afastados.',
    pericias: ['Pontaria', 'Percepção'], fortes: 'Agilidade, Juízo',
    hab: ['Ler o rastro', 'Pelos sinais deixados, você descobre o sentido com que um Assombro caça antes de vê-lo.'],
    equip: 'Arco e 12 flechas (6 marcadas), faca, corda, iscas, armadilha de laço.', protecao: 0,
    caminhos: [{ k: 'rastreador', n: 'Rastreador', d: 'Achar e enganar', habs: [['Faro de covil', '', 'Encontra onde um Assombro se esconde durante o dia, perto das fendas que não fecham.'], ['Isca certa', '', 'Suas iscas e armadilhas enganam qualquer sentido.']] },
      { k: 'matador', n: 'Matador de Assombros', d: 'Abater e esfolar', habs: [['Golpe na essência', '2 Sangue', '+1 dado de dano contra um Assombro.'], ['Esfolar', '', 'Sempre tira despojos inteiros; pele e sangue vêm em dobro.']] }],
    armas: ['Arco (6 flechas marcadas)', 'Faca'] },
  { k: 'guardiao', n: 'Guardião', d: 'Fica na linha quando o círculo rompe. Segura a brecha, protege quem traça, é o último a dormir e o primeiro a acordar.',
    pericias: ['Luta', 'Atletismo'], fortes: 'Vigor, Firmeza',
    hab: ['Firme na linha', 'Enquanto você defende uma brecha, nenhum Assombro passa por ela sem antes derrubar você.'],
    equip: 'Lança marcada com ponta de osso, couraça de couro cru (+2), escudo de madeira (+1), facão.', protecao: 3,
    caminhos: [{ k: 'muralha', n: 'Muralha', d: 'Proteger', habs: [['Escudo vivo', '1 Sangue', 'Recebe no lugar de um aliado ao seu lado o ataque que era para ele.'], ['Não recuo', '', 'Não recebe Pavor enquanto estiver numa brecha.']] },
      { k: 'lanca', n: 'Lança', d: 'Atacar', habs: [['Investida', '2 Sangue', 'Ataca dois Assombros na mesma ação.'], ['Contragolpe', '', 'Quando um Assombro erra um ataque contra você, você ataca de volta na hora.']] }],
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

export const RAIZES = [
  { n: 'Barrar', grau: 'básica', d: 'Fecha a passagem. O Assombro precisa superar a força para atravessar.' },
  { n: 'Repelir', grau: 'básica', d: 'Empurra. Quem não supera a força recua e perde a ação.' },
  { n: 'Revelar', grau: 'básica', d: 'Mostra o escondido: Assombros parados, rastros, fendas prestes a abrir, traços apagados.' },
  { n: 'Ferir', grau: 'avançada', d: 'Num objeto, a arma fere Assombros. No chão, quem atravessa sofre d6.' },
  { n: 'Calar', grau: 'avançada', d: 'Abafa som, luz e cheiro. Assombros que ouvem ou farejam não percebem quem está dentro.' },
  { n: 'Prender', grau: 'avançada', d: 'Quem toca fica preso até vencer a força numa ação.' },
  { n: 'Som', grau: 'mestra', d: 'Num tambor de pele de Assombro: o círculo ganha +4 e quem ouve não se aproxima.' },
  { n: 'Ocultar', grau: 'mestra', d: 'Quem está dentro some para todos os sentidos dos Assombros, parado e em silêncio.' },
];

export const DOM = [
  { k: 'adormecido', n: 'Adormecido', brasa: 0, d: 'Seus traços saem apagados, sem a força da Brasa.' },
  { k: 'faisca', n: 'Faísca', brasa: 2, d: 'Acende traços básicos.' },
  { k: 'chama', n: 'Chama', brasa: 4, d: 'Acende traços avançados.' },
  { k: 'fogueira', n: 'Fogueira', brasa: 6, d: 'Acende traços mestres.' },
  { k: 'incendio', n: 'Incêndio', brasa: 8, d: 'O limite humano conhecido.' },
];

export const GRAUS = ['sem treino', 'treinado', 'experiente', 'mestre'];

export const MARCOS_EXEMPLOS = [
  'Sobreviveu a uma noite terrível',
  'Protegeu alguém correndo risco real',
  'Aprendeu um traço de outro sotaque',
  'Matou um Assombro Forte ou Velho',
  'Cumpriu o alvo da aventura',
  'Perdeu algo que importava',
  'A sessão de hoje',
];

export const novoPersonagem = () => ({
  nome: '', conceito: '', aparencia: '',
  origem: '', sotaqueEstrada: '', periciaExtra: '',
  oficio: '',
  dom: 'adormecido', marca: '', marcaSangue: false, essencias: [],
  atrib: { vigor: 1, agilidade: 1, juizo: 1, presenca: 1, firmeza: 1 },
  respostaOrigem: '', marcaNoite: '', laco: '', medo: '', protege: '',
  notas: '',
  // evolução
  marcos: [], melhorias: [], caminho: '', domSubidas: 0,
});

// fichas antigas não têm os campos de evolução
export function norm(p) {
  p.marcos ||= []; p.melhorias ||= []; p.caminho ||= ''; p.domSubidas ||= 0; p.essencias ||= [];
  return p;
}

export const pontosTotais = (p) => (p.dom === 'faisca' ? 5 : 6);
export const pontosUsados = (p) => ATRIBUTOS.reduce((a, x) => a + (p.atrib[x.k] - 1), 0);

export function origemDe(p) { return ORIGENS.find((o) => o.k === p.origem); }
export function oficioDe(p) { return OFICIOS.find((o) => o.k === p.oficio); }
export function caminhoDe(p) { return oficioDe(p)?.caminhos.find((c) => c.k === p.caminho); }
const melh = (p, tipo) => norm(p).melhorias.filter((m) => m.tipo === tipo);

// a perícia da origem repetida com o ofício vira uma à escolha
export function periciaOrigemRepete(p) {
  const o = origemDe(p), f = oficioDe(p);
  return !!(o && f && f.pericias.includes(o.pericia));
}

// perícias da criação (treinadas)
export function periciasIniciais(p) {
  const o = origemDe(p), f = oficioDe(p), out = [];
  if (f) out.push(...f.pericias);
  if (o) {
    if (periciaOrigemRepete(p)) { if (p.periciaExtra) out.push(p.periciaExtra); }
    else out.push(o.pericia);
  }
  return [...new Set(out)];
}
// grau de cada perícia: 0 sem treino, 1 treinado (+3), 2 experiente (+6), 3 mestre (+9)
export function grauPericia(p, n) {
  const base = periciasIniciais(p).includes(n) ? 1 : 0;
  return Math.min(3, base + melh(p, 'pericia').filter((m) => m.alvo === n).length);
}
export function pericias(p) { return PERICIAS.map(([n]) => n).filter((n) => grauPericia(p, n) > 0); }
export const bonusPericia = (g) => g * 3;

export function atrib(p) {
  const a = { ...p.atrib };
  melh(p, 'atributo').forEach((m) => { a[m.alvo] = Math.min(5, a[m.alvo] + 1); });
  return a;
}

export function sotaqueInicial(p) {
  const o = origemDe(p);
  if (!o) return '';
  return o.sotaque || p.sotaqueEstrada || '';
}
export const sotaque = sotaqueInicial;
export function sotaques(p) { return [sotaqueInicial(p), ...melh(p, 'sotaque').map((m) => m.alvo)].filter(Boolean); }

export function sabeTracos(p) { return grauPericia(p, 'Traços') > 0; }
export function essenciasPermitidas(p) { return periciasIniciais(p).includes('Traços') ? (oficioDe(p)?.essenciaExtra ? 2 : 1) : 0; }
export function essencias(p) { return [...new Set([...(p.essencias || []), ...melh(p, 'essencia').map((m) => m.alvo)])]; }

export function tracosConhecidos(p) {
  const r = ['Barrar'];
  if (periciasIniciais(p).includes('Traços')) r.push('Repelir', 'Revelar');
  melh(p, 'raiz').forEach((m) => { if (!r.includes(m.alvo)) r.push(m.alvo); });
  return RAIZES.map((x) => x.n).filter((n) => r.includes(n));
}

export function domIndex(p) {
  const base = p.dom === 'faisca' ? 1 : 0;
  return Math.min(DOM.length - 1, base + (p.domSubidas || 0));
}
export const domDe = (p) => DOM[domIndex(p)];

// todas as Marcas: a da criação e as recebidas nos marcos
export function marcas(p) {
  const out = [];
  if (p.dom === 'faisca' && p.marca) out.push({ k: p.marca, sangue: !!p.marcaSangue });
  melh(p, 'marca').forEach((m) => out.push({ k: m.alvo, sangue: !!m.sangue }));
  return out.map((m) => ({ ...MARCAS.find((x) => x.k === m.k), sangue: m.sangue }));
}

export function barras(p) {
  const a = atrib(p), f = oficioDe(p), ms = marcas(p);
  return {
    sangue: 10 + a.vigor * 3,
    prumo: 6 + a.firmeza * 2 - ms.filter((m) => !m.sangue).length,
    brasa: domDe(p).brasa,
    defesa: 10 + a.agilidade + (f?.protecao || 0),
    sombra: ms.filter((m) => m.sangue).length,
  };
}

// ---------- evolução por marcos ----------
export const marcosGanhos = (p) => norm(p).marcos.length;
export const melhoriasFeitas = (p) => norm(p).melhorias.length;
export const melhoriasPendentes = (p) => Math.max(0, marcosGanhos(p) - melhoriasFeitas(p));
// no terceiro marco, além da melhoria, escolhe o caminho do ofício
export const precisaCaminho = (p) => !p.caminho && marcosGanhos(p) >= 3 && melhoriasFeitas(p) >= 2;
// a cada quatro marcos o Dom pode subir um grau, se a mesa concordar
export const domPodeSubir = (p) => Math.floor(marcosGanhos(p) / 4) > (p.domSubidas || 0) && domIndex(p) < DOM.length - 1;

const RAIZ_PEDE = { 'básica': 0, 'avançada': 2, 'mestra': 3 };

// opções de melhoria, cada uma com os alvos possíveis e, se bloqueada, o motivo
export function opcoesMelhoria(p) {
  const a = atrib(p), di = domIndex(p), conhecidas = tracosConhecidos(p), ess = essencias(p), sot = sotaques(p);
  const ops = [];
  ops.push({ tipo: 'atributo', n: '+1 em um atributo', d: 'Máximo 5. Sangue e Prumo sobem junto, se for o caso.',
    alvos: ATRIBUTOS.filter((x) => a[x.k] < 5).map((x) => ({ v: x.k, n: `${x.n} ${a[x.k]} → ${a[x.k] + 1}`, d: x.d })) });
  ops.push({ tipo: 'pericia', n: '+1 grau numa perícia', d: 'De sem treino a treinado, a experiente, a mestre. Vale também para aprender uma perícia nova.',
    alvos: PERICIAS.filter(([n]) => grauPericia(p, n) < 3).map(([n, d]) => { const g = grauPericia(p, n); return { v: n, n: `${n}: ${GRAUS[g]} → ${GRAUS[g + 1]} (+${(g + 1) * 3})`, d }; }) });
  ops.push({ tipo: 'raiz', n: 'Aprender uma raiz de traço', d: 'Raízes avançadas pedem o Dom em Chama; mestras, em Fogueira.',
    alvos: RAIZES.filter((r) => !conhecidas.includes(r.n)).map((r) => ({ v: r.n, n: `${r.n} (${r.grau})`, d: r.d, bloq: di < RAIZ_PEDE[r.grau] ? `Pede o Dom em ${DOM[RAIZ_PEDE[r.grau]].n}` : '' })) });
  ops.push({ tipo: 'essencia', n: 'Aprender uma essência', d: 'Seus traços valem +4 contra o tipo de Assombro que ela vence.',
    alvos: Object.entries(ESSENCIAS).filter(([e]) => !ess.includes(e)).map(([e, d]) => ({ v: e, n: e, d })) });
  ops.push({ tipo: 'marca', n: 'Receber uma Marca', d: 'Pede o Dom desperto e alguém que tatue. Combine a cena com o mestre.',
    bloq: di < 1 ? 'Pede o Dom desperto (Faísca ou mais)' : '',
    alvos: MARCAS.map((m) => ({ v: m.k, n: m.n, d: `${m.onde}. ${m.d}` })) });
  ops.push({ tipo: 'sotaque', n: 'Aprender outro sotaque', d: 'Exige alguém que ensine e algumas noites de prática.',
    alvos: Object.keys(SOTAQUES).filter((x) => !sot.includes(x)).map((x) => ({ v: x, n: x, d: SOTAQUES[x] })) });
  return ops.map((o) => ({ ...o, bloq: o.bloq || (o.alvos.filter((x) => !x.bloq).length ? '' : 'Nada disponível agora') }));
}

export function descreveMelhoria(m) {
  const at = ATRIBUTOS.find((x) => x.k === m.alvo);
  return {
    atributo: `+1 em ${at?.n}`,
    pericia: `+1 grau em ${m.alvo}`,
    raiz: `Aprendeu a raiz ${m.alvo}`,
    essencia: `Aprendeu a essência ${m.alvo}`,
    marca: `Recebeu a ${MARCAS.find((x) => x.k === m.alvo)?.n}${m.sangue ? ' (sangue de Assombro)' : ''}`,
    sotaque: `Aprendeu o sotaque ${m.alvo}`,
  }[m.tipo] || m.tipo;
}

// sugestão de atributos pelo ofício: os dois fortes primeiro
export function sugerirAtributos(p) {
  const f = oficioDe(p); if (!f) return null;
  const nomes = f.fortes.split(',').map((x) => x.trim());
  const ks = nomes.map((n) => ATRIBUTOS.find((a) => a.n === n)?.k).filter(Boolean);
  const ordem = [...ks, ...['firmeza', 'vigor', 'agilidade', 'juizo', 'presenca'].filter((k) => !ks.includes(k))];
  const a = { vigor: 1, agilidade: 1, juizo: 1, presenca: 1, firmeza: 1 };
  let pts = pontosTotais(p);
  const plano = pts === 6 ? [2, 2, 1, 1] : [2, 2, 1];
  plano.forEach((n, i) => { a[ordem[i]] += n; pts -= n; });
  return a;
}

// o que ainda falta para a ficha estar completa (por passo)
export function pendencias(p) {
  const f = [];
  if (!p.nome.trim()) f.push(['conceito', 'Dê um nome ao personagem.']);
  if (!p.origem) f.push(['origem', 'Escolha uma origem.']);
  else {
    if (p.origem === 'estrada' && !p.sotaqueEstrada) f.push(['origem', 'Escolha o sotaque de quem vem da estrada.']);
    if (periciaOrigemRepete(p) && !p.periciaExtra) f.push(['oficio', 'A perícia da origem repete a do ofício: escolha outra.']);
  }
  if (!p.oficio) f.push(['oficio', 'Escolha um ofício.']);
  const sobra = pontosTotais(p) - pontosUsados(p);
  if (sobra > 0) f.push(['atributos', `Ainda sobram ${sobra} ponto${sobra > 1 ? 's' : ''} de atributo.`]);
  if (sobra < 0) f.push(['atributos', 'Você gastou pontos demais nos atributos.']);
  if ((p.essencias || []).length < essenciasPermitidas(p)) f.push(['dom', 'Escolha a essência de traço que você conhece.']);
  if (!p.marcaNoite.trim()) f.push(['historia', 'Escreva a noite que te mudou.']);
  if (!p.laco.trim()) f.push(['historia', 'Escreva o seu laço.']);
  return f;
}

// ---------- personagens prontos (aventura A Vila do Último Poço) ----------
const pronto = (o) => ({ ...novoPersonagem(), ...o });
export const PRONTOS = [
  pronto({ id: 'dita', nome: 'Dita', origem: 'serra', oficio: 'riscador', periciaExtra: 'Saberes',
    conceito: 'A Riscadora mais velha que alguém conhece. Já perdeu a conta dos círculos que fez.',
    aparencia: 'Uns 60 anos, pele negra retinta, cabelo crespo branco e curto. Manta de tear cinza-azulado, plaquinhas de pedra-sabão no pescoço, dedos sempre sujos de carvão.',
    dom: 'faisca', marca: 'mao', marcaSangue: false, essencias: ['Osso', 'Cinza'],
    atrib: { vigor: 1, agilidade: 1, juizo: 4, presenca: 1, firmeza: 3 },
    marcaNoite: 'A noite em que o círculo da vila dela rompeu e ela não estava lá para refazer. Desde então, nunca dorme longe de um círculo que não tenha riscado.',
    laco: 'Nando apareceu na porta dela fugido da cidade, e ela ensinou o traço a ele. Acha que o menino tem o Dom dormindo.',
    respostaOrigem: 'A soleira da casa da mãe, gasta no meio de tanto ser riscada.',
    protege: 'Quem ainda não aprendeu a riscar. Não conseguiu proteger a própria vila.',
    medo: 'Que a mão comece a tremer de vez.' }),
  pronto({ id: 'caetano', nome: 'Caetano', origem: 'litoral', oficio: 'guardiao', periciaExtra: 'Percepção',
    conceito: 'Pescador de mangue que virou o homem que fica na brecha.',
    aparencia: 'Uns 35 anos, grande e forte, pele morena queimada de sol, barba cheia, cicatriz na sobrancelha. Rede de pesca no ombro, colar de conchas, escudo pintado com lama.',
    atrib: { vigor: 4, agilidade: 2, juizo: 1, presenca: 1, firmeza: 3 },
    marcaNoite: 'A maré subiu de noite e apagou metade do círculo das palafitas. Ele segurou a brecha com um remo até o sol nascer.',
    laco: 'Casado com Davi. Toda noite promete que os dois vão ver o sol juntos.',
    respostaOrigem: 'O avô, que contava as ondas em voz alta.',
    protege: 'Davi, e quem estiver atrás dele na brecha. Não conseguiu proteger o irmão mais novo.',
    medo: 'Água escura subindo sem fazer barulho.' }),
  pronto({ id: 'davi', nome: 'Davi', origem: 'estrada', sotaqueEstrada: 'Litoral', oficio: 'mensageiro',
    conceito: 'Mensageiro que conhece cada abrigo entre a serra e o mar e conta o tempo pelo sol.',
    aparencia: 'Uns 25 anos, magro, pele parda, cachos com as laterais raspadas, brinco de argola. Roupa de remendos, funda enrolada no pulso, lanterna fechada na cintura, aliança de fio trançado.',
    atrib: { vigor: 2, agilidade: 4, juizo: 2, presenca: 2, firmeza: 1 },
    marcaNoite: 'Chegou a uma vila depois do Crepúsculo, com remédio para uma criança. Ninguém abriu a porta. Ele passou a noite num poço seco, ouvindo.',
    laco: 'Casado com Caetano. E deve a vida a Marta, que o achou ferido na estrada.',
    respostaOrigem: 'Da vila onde nasceu. Não sabe se ainda existe.',
    protege: 'As cartas que leva: são a voz de quem não pode viajar.',
    medo: 'Perder a hora e o sol cair no meio da estrada.' }),
  pronto({ id: 'socorro', nome: 'Socorro', origem: 'mata', oficio: 'rezadeira',
    conceito: 'Rezadeira que cura o corpo com erva e o medo com a voz.',
    aparencia: 'Uns 45 anos, pele marrom, cabelo crespo preso num lenço verde, cicatriz de queimadura na mão. Colares de sementes e búzios, cesto de ervas nas costas, pilão de pedra.',
    atrib: { vigor: 1, agilidade: 2, juizo: 3, presenca: 3, firmeza: 2 },
    marcaNoite: 'Segurou uma lamparina acesa para uma parteira trabalhar, e um Assombro veio atrás da luz. A queimadura na mão é dessa noite. A criança nasceu.',
    laco: 'Tratou a perna de Caetano depois de uma brecha. Acha que ele se arrisca demais e diz isso toda vez.',
    respostaOrigem: 'O silêncio de repente dos sapos. Quer dizer que alguma coisa passou.',
    protege: 'Quem treme. Não conseguiu salvar a mãe, que ensinou tudo a ela.',
    medo: 'Esquecer uma reza na hora em que precisar dela.' }),
  pronto({ id: 'nando', nome: 'Nando', origem: 'cidade', oficio: 'cantador',
    conceito: 'Fugiu da convocação com uma rabeca e um caderno de versos. Não se arrepende.',
    aparencia: 'Uns 22 anos, descendente de japoneses, cabelo preto comprido preso de qualquer jeito, olheiras. Paletó de uniforme cinza com botões faltando, braçadeira numerada rasgada.',
    atrib: { vigor: 1, agilidade: 2, juizo: 2, presenca: 4, firmeza: 2 },
    marcaNoite: 'A noite da convocação: chamaram o número dele para guardar a muralha. Ele pulou o muro do outro lado.',
    laco: 'Deve tudo a Dita, que o recebeu e ensinou a riscar. Quer fazer uma canção que ela aprove.',
    respostaOrigem: 'Fugi. E toco toda noite para não ter que pensar em quem foi no meu lugar.',
    protege: 'As histórias das vilas que atravessa: se ninguém cantar, somem.',
    medo: 'Ser encontrado pela guarda da cidade.' }),
  pronto({ id: 'marta', nome: 'Marta', origem: 'seca', oficio: 'cacador',
    conceito: 'Caçadora que lê rastro em chão de pedra e não confia em ninguém da cidade.',
    aparencia: 'Uns 55 anos, pele clara curtida de sol, sardas, cabelo grisalho curto, magra e dura. Lenço vermelho de barro, perneiras de couro, arco nas costas, flecha marcada na mão.',
    atrib: { vigor: 2, agilidade: 4, juizo: 3, presenca: 1, firmeza: 1 },
    marcaNoite: 'Seguiu os rastros do Assombro que levou o marido. Achou o covil. Voltou sozinha, com uma pele e sem vontade de conversar.',
    laco: 'Achou Davi ferido na estrada e trouxe nas costas. Finge que não gosta dele.',
    respostaOrigem: 'O poço do sítio do pai. Foi quando a família foi embora para a estrada.',
    protege: 'A roça dos outros. Não conseguiu proteger o marido.',
    medo: 'Ficar velha demais para puxar o arco.' }),
];

// ---------- rolagem ----------
// atributo que a perícia costuma usar (o mestre pode pedir outro)
export const PERICIA_ATRIB = { Atletismo: 'vigor', Luta: 'vigor', Pontaria: 'agilidade', Furtividade: 'agilidade', Sobrevivência: 'juizo', Percepção: 'juizo', Traços: 'juizo', 'Ervas e Cura': 'juizo', Ofícios: 'juizo', Saberes: 'juizo', Lábia: 'presenca', Canto: 'presenca' };
export const DIFICULDADES = [[10, 'Fácil'], [15, 'Normal'], [20, 'Difícil'], [25, 'Quase impossível']];
const d = (n) => { const a = new Uint32Array(1); crypto.getRandomValues(a); return 1 + (a[0] % n); };

// mão de d20: atributo ± ajustes (máx. 5). Mão vazia: 2d20, fica com o pior.
export function rolar(p, { attr, pericia = '', ajuste = 0, dif = 0 }) {
  const a = atrib(p)[attr] || 1;
  const mao = Math.min(5, a + ajuste);
  const vazia = mao <= 0;
  const dados = Array.from({ length: vazia ? 2 : mao }, () => d(20));
  const fica = vazia ? Math.min(...dados) : Math.max(...dados);
  const bonus = pericia ? bonusPericia(grauPericia(p, pericia)) : 0;
  const total = fica + bonus;
  return { attr, pericia, ajuste, dif, mao, vazia, dados, fica, bonus, total,
    passou: dif ? total >= dif : null,
    marcante: !vazia && dados.includes(20),
    desastre: dados.every((x) => x === 1) };
}
export function rolarDano(expr) {
  const m = String(expr).match(/^(\d*)d(\d+)$/); if (!m) return null;
  const n = +(m[1] || 1), f = +m[2], dados = Array.from({ length: n }, () => d(f));
  return { expr, dados, total: dados.reduce((s, x) => s + x, 0) };
}
