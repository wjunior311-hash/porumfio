// Conteúdo da rodada 5 e do Pozeiro. Fonte única para o app e para o livro.

// ---------- o Pozeiro ----------
export const POZEIRO = {
  k: 'pozeiro', n: 'Pozeiro',
  d: 'Estudou sete anos no Almofariz, a casa de pedra da serra onde se aprende a moer a noite. Transforma resíduo de Assombro, osso e erva em pós que fazem dormir, cegar, calar e arder. Carrega a licença tatuada na cabeça raspada, e a desconfiança de quem a reconhece.',
  pericias: ['Ofícios', 'Pontaria'], fortes: 'Juízo, Agilidade',
  hab: ['Bolsa de pós', 'Você conhece três pós e começa cada aventura com quatro doses prontas. De manhã, com o pilão, prepara mais duas.'],
  equip: 'Pilão de pedra, bolsa de couro com seis saquinhos, zarabatana com dez dardos, faca, cajado.', protecao: 0,
  armas: ['Zarabatana', 'Faca'],
  licenca: 'Com desconhecidos que reconhecem a tatuagem, você perde 1 dado em Lábia: ninguém sabe se você terminou o Almofariz ou se é um Rasgado disfarçado. Com quem conhece o Almofariz (guardas, Riscadores, mercadores de despojo), ganha 1 dado.',
  pergunta: 'Por que o Almofariz deixou você sair, e o que ainda espera de você?',
  caminhos: [
    { k: 'polvorista', n: 'Polvorista', d: 'Estouro e alcance', habs: [
      ['Flecha que estoura', '', 'Um pó levado em flecha ou dardo pega também quem estiver a até dois passos do alvo.'],
      ['Mão leve', '', 'Você prepara três doses por manhã em vez de duas, e um pó nunca estoura na sua mão.']] },
    { k: 'fumaceira', n: 'Fumaceira', d: 'Fumaça e linha', habs: [
      ['Nuvem que fica', '', 'Um pó queimado na chama vira uma fumaça que dura a fase inteira, e não só a rodada.'],
      ['Linha de pó', '', 'Uma linha de pó no chão funciona como um traço de Barrar com a força do pó, sem gastar Brasa.']] },
  ],
  recomendacao: 'Um Pozeiro por grupo é o ideal: dois fazem a mesa girar em torno dos pós.',
};

export const ARMAS_EXTRA = { Zarabatana: ['d4', 'Médio', 'Silenciosa. O dardo leva uma dose de pó.'] };

// efeitos de pó
export const POS = [
  { k: 'sono', n: 'Sono', ingr: 'erva', d: 'O Assombro perde a próxima ação. Um Comum que não resista por 5 ou mais dorme até a fase virar.' },
  { k: 'fuligem', n: 'Fuligem', ingr: 'resíduo', d: 'Cega quem caça pelo movimento: o Assombro perde 2 dados para atacar até a fase virar.' },
  { k: 'faro', n: 'Faro falso', ingr: 'resíduo', d: 'Assombros que farejam seguem o cheiro para onde o pó caiu, por uma fase inteira.' },
  { k: 'silencio', n: 'Silêncio', ingr: 'erva', d: 'Numa roda de três passos, nada faz som até a fase virar. Quem ouve não percebe quem está dentro.' },
  { k: 'ardencia', n: 'Ardência', ingr: 'resíduo', d: 'd6 de dano que fere Assombros, como uma arma marcada. Com a essência certa, d10.' },
  { k: 'sal', n: 'Sal grosso', ingr: 'sal', d: 'O Assombro recua três passos e perde o movimento.' },
  { k: 'lume', n: 'Lume', ingr: 'erva', d: 'O alvo brilha fraco até o amanhecer: todos o enxergam no escuro, sem que a luz atraia nada.' },
  { k: 'estouro', n: 'Estouro', ingr: 'resíduo', d: 'Estrondo e clarão: quem estiver a três passos perde 1 dado na próxima rolagem. Chama tudo o que ouve, de longe.' },
];

// jeitos de levar o pó
export const LEVAR = [
  { n: 'Na mão', d: 'Jogado em quem está perto. Pontaria contra a Defesa.' },
  { n: 'Na ponta', d: 'Numa flecha ou dardo. O ataque normal da arma; se acertar, o pó pega.' },
  { n: 'Soprado', d: 'Pela zarabatana, a distância média, sem barulho.' },
  { n: 'Na linha', d: 'Espalhado no chão numa ação: quem atravessar recebe o efeito.' },
  { n: 'Na chama', d: 'Queimado numa lamparina, vira fumaça numa roda de cinco passos. Não precisa acertar, mas pega quem estiver dentro, amigo ou não.' },
];

// ---------- patamares ----------
export const PATAMARES = [
  { m: 0, n: 'Novato', d: 'A habilidade inicial do ofício.' },
  { m: 3, n: 'Calejado', d: 'O caminho do ofício e as duas habilidades dele.' },
  { m: 6, n: 'Veterano', d: 'A terceira habilidade do caminho.' },
  { m: 9, n: 'Mestre do ofício', d: 'Uma habilidade de mestria.' },
  { m: 12, n: 'Lenda', d: 'Um feito que muda o mundo à sua volta, combinado com o mestre.' },
];

// 3ª habilidade (marco 6) e mestria (marco 9) de cada caminho
export const CAMINHO_ALTO = {
  batedor: [['Atalho de sol', 'Uma vez por viagem, encurta um trecho em meio dia sem perder o pouso.'], ['Ninguém fica para trás', 'Na estrada, todo o grupo usa o seu Pé na estrada e nunca é pego pelo Crepúsculo por erro de caminho.']],
  embaixador: [['Casa aberta', 'Toda comunidade em que você já esteve abriga o grupo por uma noite, sem pedir nada.'], ['Paz de uma noite', 'Uma vez por aventura, convence dois grupos inimigos (vilas, guarda, até Rasgados) a passarem uma noite sem se atacar.']],
  mestrecirculos: [['Círculo vivo', 'A primeira investida de cada fase não tira força dos seus círculos.'], ['Costura de vila', 'Você sozinho traça um círculo de vila num dia, sem mutirão.']],
  marcador: [['Agulha de passagem', 'Tatua uma Marca numa noite, em vez de num dia inteiro.'], ['Marca de duas pontas', 'Uma vez, faz uma Marca que vale para duas pessoas: as duas gastam a Brasa de quem usar.']],
  curandeira: [['Mão que levanta', 'Quem você trata volta da queda com metade do Sangue, e não com 1.'], ['Ninguém morre hoje', 'Uma vez por noite, alguém que cairia morto fica caído até a aurora.']],
  benzedeira: [['Reza de longe', 'Sua reza alcança quem você vê, não só quem você toca.'], ['Fechar o corpo', 'Uma vez por noite, um aliado ignora todo o Pavor e o pânico até a fase virar.']],
  repentista: [['Verso que corta', 'Seu canto tira 1 dado de todos os Assombros que ouvem por uma rodada.'], ['Toada de vila', 'Cantando a noite toda, ninguém da comunidade testa Pavor.']],
  memoria: [['Nome antigo', 'Sabe o nome de um Velho pela descrição; dito em voz alta, ele perde a próxima ação.'], ['Mapa cantado', 'Uma vez por aventura, lembra um caminho, um abrigo ou um objeto de antes que ninguém mais conhece.']],
  rastreador: [['Covil marcado', 'Achado o covil, você sabe quantos Assombros dormem lá e de que família.'], ['Caçada de dia', 'Entra numa fenda que nunca fecha e volta, uma vez por aventura, sem testar Pavor.']],
  matador: [['Golpe certo', 'Seu primeiro ataque contra um Assombro em cada noite rola com +1 dado.'], ['Matador de Velhos', 'Contra um Velho, seu dano ignora a primeira resistência dele.']],
  muralha: [['Parede de gente', 'Enquanto você estiver na brecha, ela conta como um círculo com a sua Defesa como força.'], ['Ninguém passa', 'Uma vez por noite, um ataque que derrubaria você só tira metade.']],
  lanca: [['Lança comprida', 'Ataca de três passos, por cima de dois aliados.'], ['Varrer a brecha', 'Uma vez por fase, ataca todos os Assombros numa brecha de uma vez.']],
  polvorista: [['Pó de chuva', 'Um Estouro ou Ardência pega todos numa roda de três passos.'], ['Barril da aurora', 'Uma vez por aventura, prepara uma carga que derruba um Velho por uma fase inteira.']],
  fumaceira: [['Fumaça que esconde', 'Na sua fumaça, Assombros não encontram ninguém que fique parado.'], ['Muro de fumaça', 'Uma vez por noite, sua fumaça vale como um círculo inteiro até a fase virar.']],
};

export const LENDAS = [
  'Um Riscador funda um sotaque novo, que entra no mapa.',
  'Uma Cantadora compõe um verso que vira traço: quem canta, risca.',
  'Um Guardião ergue uma vila nova e é chamado para ser seu primeiro círculo.',
  'Uma Rezadeira descobre a reza que acalma um Velho por uma noite inteira.',
  'Um Caçador mata um Velho, e a pele vira o maior tambor da terra.',
  'Um Mensageiro abre uma estrada nova, com pousos que ninguém conhecia.',
  'Um Pozeiro inventa um pó que o Almofariz não sabia fazer.',
];

// ---------- habilidades gerais ----------
// req: { atrib: { k: n } } | { pericia: nome } | { dom: true }
export const GERAIS = [
  { k: 'sono-leve', n: 'Sono leve', d: 'Nunca é pego dormindo: acorda ao menor ruído, pronto para agir.' },
  { k: 'mutirao', n: 'Mão de mutirão', d: 'Quando ajuda alguém, dá 2 dados em vez de 1.' },
  { k: 'relogio', n: 'Relógio no corpo', d: 'Sabe sempre quanto falta para o sol cair ou nascer, e o grupo nunca erra a hora do Entardecer.' },
  { k: 'couro-duro', n: 'Couro duro', d: '+3 de Sangue máximo.', req: { atrib: { vigor: 2 } } },
  { k: 'cabeca-fria', n: 'Cabeça fria', d: '+2 de Prumo máximo.', req: { atrib: { firmeza: 2 } } },
  { k: 'olho-soleira', n: 'Olho de soleira', d: '+1 dado para notar falha, desgaste ou sotaque num traço.' },
  { k: 'voz-acalma', n: 'Voz que acalma', d: 'Uma ação tira 1 Pavor de dois aliados ao seu lado.', req: { atrib: { presenca: 2 } } },
  { k: 'traco-ligeiro', n: 'Traço ligeiro', d: 'Risca uma soleira ou janela numa ação, sem gastar tempo.', req: { pericia: 'Traços' } },
  { k: 'brasa-guardada', n: 'Brasa guardada', d: '+1 de Brasa máxima.', req: { dom: true } },
  { k: 'pe-de-mula', n: 'Pé de mula', d: 'Carrega o dobro e não cansa na estrada.', req: { atrib: { vigor: 3 } } },
  { k: 'arremesso', n: 'Arremesso certeiro', d: 'Faca, pedra, arpão e pó jogado com +1 dado.' },
  { k: 'benzedura', n: 'Benzedura de casa', d: 'Uma vez por noite, tira 1 Pavor de alguém, mesmo sem ser Rezadeira.' },
  { k: 'sem-ruido', n: 'Passo de gato', d: '+1 dado em Furtividade contra Assombros que ouvem.', req: { atrib: { agilidade: 2 } } },
  { k: 'leitor-rastro', n: 'Leitor de rastro', d: 'Pelo rastro, sabe a família de um Assombro.', req: { pericia: 'Percepção' } },
  { k: 'mao-de-erva', n: 'Mão de erva', d: 'Prepara um chá que devolve 1d6 de Sangue, uma vez por pessoa por dia, mesmo sem ser Rezadeira.' },
  { k: 'ouvido-noite', n: 'Ouvido de noite', d: 'Sabe a fase da noite pelo som, e ouve um Assombro chegando um passo antes de todos.' },
  { k: 'firme-no-escuro', n: 'Firme no escuro', d: 'No escuro total, perde só um dado, e não a mão inteira.', req: { atrib: { firmeza: 3 } } },
  { k: 'negociante', n: 'Negociante de feira', d: 'Compra 1 vigia mais barato e vende despojo por 1 vigia a mais.', req: { pericia: 'Lábia' } },
  { k: 'reparo', n: 'Mão de reparo', d: 'Conserta arma, escudo ou couraça na estrada, numa hora, sem rolagem.', req: { pericia: 'Ofícios' } },
  { k: 'corredor', n: 'Fôlego de estrada', d: 'Corre o dobro numa rodada, uma vez por fase.', req: { atrib: { vigor: 2 } } },
  { k: 'lider', n: 'Voz de comando', d: 'Uma vez por fase, diz a um aliado o que fazer: ele age antes de todos, com +1 dado.', req: { atrib: { presenca: 3 } } },
  { k: 'saber-assombro', n: 'Lido nos Assombros', d: 'Saberes 10 basta para saber o sentido de um Assombro que você vê.', req: { pericia: 'Saberes' } },
  { k: 'sotaque-facil', n: 'Ouvido de sotaque', d: 'Usa traços de qualquer sotaque sem perder dado.', req: { pericia: 'Traços' } },
  { k: 'teimosia', n: 'Teimosia', d: 'Uma vez por noite, refaz um teste de Pavor e fica com o melhor.' },
];

// ---------- traços prontos ----------
export const TRACOS_PRONTOS = [
  ['Soleira', 'Barrar', 'No chão', 'Uma porta ou passagem que nada atravessa sem superar a força.'],
  ['Tranca', 'Barrar', 'No ar', 'O mesmo, numa janela, telhado ou alçapão.'],
  ['Roda de pouso', 'Barrar', 'Em volta', 'O círculo pequeno de quem dorme na estrada.'],
  ['Parede de casa', 'Barrar', 'Em volta', 'O círculo médio que protege uma casa pequena.'],
  ['Escudo riscado', 'Barrar', 'Num objeto', 'O escudo soma a força do traço dividida por 5 à Defesa, até o amanhecer.'],
  ['Pele fechada', 'Barrar', 'Na pele', 'Pintado com carvão: o primeiro ataque da noite contra você precisa superar a força, ou erra.'],
  ['Empurrão', 'Repelir', 'Num objeto', 'Um cajado que joga o Assombro para trás quando toca.'],
  ['Linha de recuo', 'Repelir', 'No chão', 'Quem tenta atravessar a linha recua e perde a ação.'],
  ['Janela que expulsa', 'Repelir', 'No ar', 'O que tenta entrar pela janela é jogado para fora.'],
  ['Olho de vigia', 'Revelar', 'No ar', 'Uma janela que mostra o que se aproxima no escuro.'],
  ['Chão que conta', 'Revelar', 'No chão', 'O chão riscado mostra os rastros de quem passou nesta noite.'],
  ['Lanterna que lê', 'Revelar', 'Num objeto', 'A luz da lanterna mostra traços apagados e fendas prestes a abrir.'],
  ['Lâmina riscada', 'Ferir', 'Num objeto', 'A arma fere Assombros até o amanhecer.'],
  ['Chão de espinho', 'Ferir', 'No chão', 'Quem atravessa a linha sofre d6.'],
  ['Telhado de cacos', 'Ferir', 'No ar', 'O que desce pelo telhado sofre d6.'],
  ['Casa calada', 'Calar', 'Em volta', 'Quem está dentro não é ouvido nem farejado.'],
  ['Passo calado', 'Calar', 'Na pele', 'Seus passos não fazem som até o amanhecer.'],
  ['Lanterna cega', 'Calar', 'Num objeto', 'A lanterna ilumina sem que a luz atraia nada.'],
  ['Laço', 'Prender', 'No chão', 'Uma armadilha riscada que segura quem pisa.'],
  ['Rede riscada', 'Prender', 'Num objeto', 'A rede segura até um Assombro Grande.'],
  ['Porta que agarra', 'Prender', 'No ar', 'O que força a porta fica preso nela.'],
  ['Tambor de vigília', 'Som', 'Num objeto', 'O círculo ganha +4 enquanto alguém tocar.'],
  ['Sino de muralha', 'Som', 'No ar', 'Pendurado no alto, quem ouve não se aproxima por uma fase.'],
  ['Manto de breu', 'Ocultar', 'Na pele', 'Parado e em silêncio, você some para todos os sentidos dos Assombros.'],
  ['Casa que some', 'Ocultar', 'Em volta', 'A casa inteira desaparece para os Assombros enquanto ninguém fizer barulho.'],
];

export const TRACO_SOTAQUE = {
  Serra: ['Pedra de esquina', 'Um traço entalhado que dura um mês, feito na metade do tempo normal.'],
  Litoral: ['Espiral de maré', 'Um círculo que a água não apaga e que se refaz sozinho uma vez por noite.'],
  'Terra seca': ['Ponto corrido', 'Uma linha pontilhada riscada correndo, numa ação, com metade da força.'],
  Mata: ['Trança de cerca', 'Traços amarrados em cordas e cercas, que podem ser desmontados e levados para outro lugar.'],
  Cidades: ['Selo de muralha', 'Um traço carimbado em placa de metal, igual em toda parte: quem sabe ler o reconhece e confia nele.'],
};

export const PRESSA = 'Riscar às pressas: numa única ação, em vez do tempo normal. O traço sai com metade da força e some na próxima virada de fase. Serve para tapar uma brecha agora e refazer direito depois.';

// ---------- despojos ----------
export const DESPOJOS = [
  ['Sangue', 'Tinta de Marca (mais forte, soma Sombra) e iscas que enganam o faro dos Assombros.'],
  ['Pele', 'Tambores de vigília, couraças e bolsas que escondem cheiro.'],
  ['Osso', 'Pontas de arma que seguram o traço Ferir por uma semana, e não só até o amanhecer.'],
  ['Resíduo', 'A base dos pós do Pozeiro, pó de lume, e uma tinta que deixa riscar a essência daquela família uma vez, mesmo sem conhecê-la.'],
];

export const ITENS = [
  ['Lança de osso', 15, 'Osso de Forte', 'Ponta que segura o traço Ferir por uma semana.'],
  ['Flechas de osso (6)', 10, 'Osso de Comum', 'Seguram o Ferir por uma semana.'],
  ['Tambor de vigília', 20, 'Pele de Forte', 'O círculo ganha +4 enquanto tocado (com o traço Som).'],
  ['Couraça de casco', 15, 'Pele de Osso', '+2 de Defesa, sem perder dado em Furtividade.'],
  ['Capa de fibra', 15, 'Resíduo de Raiz', '+1 dado em Furtividade contra Assombros que veem movimento.'],
  ['Bolsa sem cheiro', 10, 'Pele de qualquer família', 'O que vai dentro não é farejado.'],
  ['Amuleto de sal e osso', 10, 'Osso e sal', 'Uma vez por noite, ignora 1 Pavor.'],
  ['Isca de sangue', 10, 'Sangue', 'Atrai Assombros para onde você deixar, por uma fase.'],
  ['Pó de lume (3 punhados)', 10, 'Resíduo', 'Marca caminhos sem chamar ninguém.'],
  ['Tinta de essência', 15, 'Resíduo', 'Risca a essência daquela família uma vez, mesmo sem conhecê-la.'],
  ['Tinta de Marca', 20, 'Sangue de Forte', 'Uma Marca de sangue: mais forte, mas soma 1 de Sombra.'],
  ['Lanterna de osso', 15, 'Osso e resíduo de Sopro', 'Uma lanterna de fresta que nunca apaga com vento.'],
  ['Sino de osso', 15, 'Osso de Sopro', 'Tocado, avisa toda a vila; com o traço Som, afasta quem ouve.'],
  ['Corda de fibra', 10, 'Resíduo de Raiz', 'Nunca arrebenta; segura um Assombro Grande preso.'],
  ['Lentes de breu', 25, 'Resíduo de Breu (raríssimo)', 'Enxerga no escuro como num fim de tarde. Só um artesão mestre faz.'],
];

export const DESPOJO_VALOR = 'Na cidade, despojo vende bem: um punhado de resíduo vale 2 vigias, um osso grande 1 noite, uma pele inteira 5 noites. Mas quem paga melhor é a Ferida Aberta, que quer sangue para as Marcas dos Rasgados: o dobro, e ninguém fica sabendo. Até alguém ficar.';

// ---------- o dia e a estrada ----------
export const PARTES_DIA = [
  { k: 'manha', n: 'Manhã', d: 'O sol nasceu. Hora de tratar os feridos, refazer traços e preparar pós.' },
  { k: 'sol-alto', n: 'Sol alto', d: 'O melhor momento para viajar e investigar.' },
  { k: 'tarde', n: 'Tarde', d: 'Quem está longe de casa começa a pensar no pouso.' },
  { k: 'entardecer', n: 'Entardecer', d: 'A última chance de traçar. Depois disso, vem o Crepúsculo.' },
];

export const EVENTOS_ESTRADA = [
  'Um viajante pede para seguir junto. Diz que vai para o mesmo lugar.',
  'A ponte caiu. O outro caminho é mais longo.',
  'Um rastro fresco cruza a estrada, em direção ao mato.',
  'Uma vila vazia, com a mesa posta e a comida ainda morna.',
  'A guarda da convocação para todo mundo e pede documento.',
  'Uma feira pequena na encruzilhada: dá para trocar, ouvir notícia e perder tempo.',
  'Um círculo antigo na beira da estrada, de um sotaque que ninguém conhece.',
  'Uma criança sozinha na estrada, às quatro da tarde.',
  'Chuva forte: traços na pele e no chão se apagam mais rápido.',
  'Um mensageiro ferido, com uma carta que não é para vocês.',
  'Um abrigo de pedra já ocupado por outro grupo.',
  'Um Rasgado sentado na beira do caminho, esperando alguém.',
  'Fumaça no horizonte: uma vila pode ter caído ontem.',
  'Um despojo largado na estrada. Quem deixou ali?',
  'Uma mula sem dono, carregada.',
  'Um trecho de estrada com traços entalhados no chão, ainda acesos.',
  'Um velho Riscador pede ajuda para refazer o círculo da casa.',
  'A estrada some numa várzea alagada.',
  'Um Pozeiro do Almofariz procura alguém que fugiu.',
  'Nada acontece. O silêncio é tanto que ninguém consegue conversar.',
];

export const POUSOS = [
  ['Abrigo de pedra', 'Traço entalhado antigo, força 15. Todo mundo conhece, e alguém pode já estar lá.'],
  ['Casa abandonada', 'Paredes e telhado, mas por que foi abandonada?'],
  ['Copa de árvore', 'Longe dos que rastejam, perto dos que voam.'],
  ['Roda de pouso', 'O seu próprio círculo, só tão forte quanto quem riscou.'],
  ['Vila no caminho', 'O mais seguro, se abrirem a porta. O Embaixador ajuda; uma cabeça raspada atrapalha.'],
];
