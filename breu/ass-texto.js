// Como narrar cada Assombro: o que se ouve antes, o que se vê, como luta e como morre.
// A descrição, o especial e os despojos vêm do livro.
export const ASS_TEXTO = {
 "cinza-1": {
  "tipo": "CINZA · MIÚDO · COMUM",
  "desc": "Pequeno, de cauda longa, anda em bando de cinco a dez. Rói o que sobrou das fogueiras e se enfia por qualquer buraco.",
  "esp": "Bando. Um bando inteiro conta como um único Assombro Comum. Cada 4 de dano derruba um deles; com o bando pela metade, o ataque cai para 1d20. Pelas frestas. Ignora linhas de sal e passa por buracos do tamanho de um punho.",
  "despojos": "Resíduo de cinza (1 punhado).",
  "alt": "0,3 m de altura",
  "chega": "Do lado de fora, um chiado baixo de muitos bichos ao mesmo tempo, como brasa caindo na água. O som vem do chão, das frestas, de todo lado.",
  "aparece": "São pequenos e são muitos. Pretos de fuligem, de cauda comprida, com olhinhos de brasa. O bando se mexe como uma coisa só, e entra por qualquer buraco do tamanho de um punho.",
  "morre": "Os últimos se espalham em fagulhas, correm para as frestas e se apagam ali."
 },
 "cinza-2": {
  "tipo": "CINZA · PEQUENO · COMUM",
  "desc": "Do tamanho de um cachorro, focinho sempre no chão. Segue o cheiro de fumaça e de quem acendeu fogo recentemente.",
  "esp": "Rastro de fogo. Sabe onde está qualquer pessoa que tenha acendido uma chama nesta noite. Mordida que queima. Quando acerta, a vítima perde 1 Prumo além do dano.",
  "despojos": "Resíduo de cinza, uma presa.",
  "alt": "0,9 m de altura",
  "chega": "Lá fora, no escuro, um fungado curto, repetido. Para. Recomeça, um pouco mais perto. No ar, um cheiro de lenha molhada que queimou.",
  "aparece": "Do mato sai uma coisa do tamanho de um cachorro, de focinho colado no chão. A pele parece carvão rachado, e pelas rachaduras brilha uma brasa fraca. Ela levanta a cabeça e fareja na direção de vocês.",
  "morre": "Ele desmancha em borralho morno, e o vento leva."
 },
 "cinza-3": {
  "tipo": "CINZA · GRANDE · FORTE",
  "desc": "Alto e esguio, de braços longos demais, anda devagar e para de repente. Fica imóvel na beira do círculo esperando alguém se mexer.",
  "esp": "Braço comprido. Ataca quem está até três passos para dentro de uma brecha, sem precisar entrar. Imóvel. Parado, é confundido com um tronco queimado; Percepção 20 para notar.",
  "despojos": "Ossos longos (servem de cabo para lança marcada), resíduo.",
  "alt": "2,6 m de altura"
 },
 "cinza-4": {
  "tipo": "CINZA · GRANDE · FORTE",
  "desc": "Pesado, de patas grossas, carrega nas costas uma corcunda de cinza acumulada que solta fuligem quando ele respira.",
  "esp": "Nuvem de fuligem. Uma vez por noite, sacode a corcunda: todos a até cinco passos perdem 1 dado na próxima rolagem, e chamas pequenas se apagam. Cego. Um grupo em silêncio total não é encontrado por ele.",
  "despojos": "Pele grossa (couro para tambor), resíduo em quantidade.",
  "alt": "3,0 m de altura",
  "chega": "O chão treme de leve, num passo pesado e lento. Uma respiração grossa, funda. E do céu começa a cair uma fuligem fina, como se chovesse cinza.",
  "aparece": "É enorme, do tamanho de dois homens. Patas grossas, e nas costas uma corcunda de cinza acumulada que solta fuligem a cada respiração. A cabeça baixa vai de um lado para o outro. Ela não enxerga: ela escuta.",
  "morre": "Ela tomba de lado, e a corcunda desaba numa montanha de cinza quente que fica fumegando até o sol."
 },
 "raiz-1": {
  "tipo": "RAIZ · MIÚDO · COMUM",
  "desc": "Do tamanho de um gato, de corpo comprido que se enrola em postes, cercas e pernas.",
  "esp": "Agarrar. Quando acerta, a vítima fica presa: perde o movimento até vencer uma disputa de Atletismo. Escalador. Sobe por paredes e cercas; ataca traços no modo No ar.",
  "despojos": "Fibra de raiz (vira corda que não arrebenta).",
  "alt": "0,3 m de altura"
 },
 "raiz-2": {
  "tipo": "RAIZ · MÉDIO · COMUM",
  "desc": "Do tamanho de uma pessoa. Paciente, fica imóvel como um tronco seco junto às cercas, até alguém passar ao alcance.",
  "esp": "Emboscada. Se não foi notado, seu primeiro ataque rola com +2 dados. Parece mato. Percepção 20 para notar enquanto ele está parado.",
  "despojos": "Fibra de raiz, espinhos (pontas de flecha).",
  "alt": "1,9 m de altura"
 },
 "raiz-3": {
  "tipo": "RAIZ · GRANDE · FORTE",
  "desc": "Comprida e baixa, rasteja com dezenas de patas finas, como uma centopeia de galhos secos. Passa por baixo de quase tudo.",
  "esp": "Por baixo. Ataca traços no modo No chão com +1 dado. Muitas patas. Quando é atingida por uma arma comum, não perde o movimento.",
  "despojos": "Fibra de raiz em quantidade, pele.",
  "alt": "0,7 m de altura, 5 m de comprimento"
 },
 "raiz-4": {
  "tipo": "RAIZ · ENORME · FORTE",
  "desc": "Alto como uma árvore jovem, com braços que se esticam muito além do corpo. Puxa as pessoas para fora dos círculos.",
  "esp": "Puxar. Quando acerta alguém a até cinco passos, pode arrastá-lo três passos na sua direção, inclusive para fora de um círculo. Sente o medo. Ataca primeiro quem tiver mais Pavor.",
  "despojos": "Fibra e espinhos em quantidade, sangue.",
  "alt": "4,5 m de altura"
 },
 "osso-1": {
  "tipo": "OSSO · PEQUENO · COMUM",
  "desc": "Encouraçado como um tatu, se enrola numa bola de espinhos de osso e rola contra portas e círculos.",
  "esp": "Bola de ossos. Enrolado, ganha +3 de Defesa, mas não ataca pessoas: só círculos e portas. Pancada. Quando ataca um círculo e não o supera, tira 4 de força em vez de 3.",
  "despojos": "Placas de osso (pontas de lança e flecha).",
  "alt": "0,5 m de altura",
  "chega": "Um barulho de pedra rolando, mas não tem pedra nenhuma. Toc, toc, toc, cada vez mais rápido, vindo pela estrada.",
  "aparece": "Uma bola de espinhos de osso, do tamanho de um cesto, rola até a linha e para. Desenrola devagar: é um bicho encouraçado como um tatu, de placas de osso amarelado.",
  "morre": "As placas se soltam e caem espalhadas no chão, como louça quebrada."
 },
 "osso-2": {
  "tipo": "OSSO · PEQUENO · COMUM",
  "desc": "Do tamanho de um cachorro grande, magro, quase só esqueleto e dentes. A mandíbula se abre em quatro partes.",
  "esp": "Mordida que prende. Quando acerta, continua mordendo: no começo da rodada seguinte, causa d6 de novo se a vítima não se soltar com Atletismo 15.",
  "despojos": "Dentes e placas de osso.",
  "alt": "1,0 m de altura"
 },
 "osso-3": {
  "tipo": "OSSO · GRANDE · FORTE",
  "desc": "Anda ereto, com uma carapaça que parece armadura e garras do tamanho de facões. Avança devagar e não recua.",
  "esp": "Carapaça. Armas marcadas sem essência causam 2 de dano a menos contra ele. Não recua. Imune a Repelir.",
  "despojos": "Placas grandes de osso (escudos), ossos longos.",
  "alt": "2,2 m de altura"
 },
 "osso-4": {
  "tipo": "OSSO · GRANDE · FORTE",
  "desc": "Do tamanho de um boi, de quatro, com chifres e uma carapaça pesada. Territorial, bate a cabeça contra muros até um deles ceder.",
  "esp": "Investida. Se correu antes de atacar um círculo, rola +1 dado. Território. Volta ao mesmo lugar toda noite até ser morto.",
  "despojos": "Chifres, placas grandes, pele.",
  "alt": "2,6 m de altura"
 },
 "sopro-1": {
  "tipo": "SOPRO · MIÚDO · COMUM",
  "desc": "Achatado como uma folha, cabe na palma da mão e passa pelo buraco da fechadura.",
  "esp": "Achatado. Ignora traços no modo No ar com força menor que 15. Sussurro. Quem ele ataca perde 1 Prumo além do dano.",
  "despojos": "Pele fina (quase nenhuma utilidade, exceto para tinta).",
  "alt": "0,1 m de altura"
 },
 "sopro-2": {
  "tipo": "SOPRO · PEQUENO · COMUM",
  "desc": "Da altura de uma criança, curioso e cruelmente brincalhão. Espia pelas janelas e chama as pessoas pelo nome, com a voz de alguém querido.",
  "esp": "Voz emprestada. Uma vez por fase, imita a voz de alguém que o grupo conhece. Quem ouvir testa Firmeza 15 ou perde 1d6 de Prumo e sente vontade de abrir a porta.",
  "despojos": "Pele translúcida.",
  "alt": "1,1 m de altura"
 },
 "sopro-3": {
  "tipo": "SOPRO · GRANDE · FORTE",
  "desc": "Alto e dobrado, de braços muito finos e longos. Anda pelos tetos e pelas copas e desce de uma vez sobre quem está embaixo.",
  "esp": "Pelo alto. Ataca traços no modo No ar com +1 dado e ignora os do modo No chão. Bote. Na primeira rodada em que ataca, a vítima perde 1 dado na defesa.",
  "despojos": "Ossos finos e longos (agulhas de tatuagem), pele.",
  "alt": "2,4 m de altura"
 },
 "sopro-4": {
  "tipo": "SOPRO · ENORME · FORTE",
  "desc": "Grande e esgarçado como um lençol ao vento, quase sem corpo sólido, com um rosto e duas mãos. Cobre um grupo inteiro de uma vez.",
  "esp": "Cobrir. Ataca até três pessoas lado a lado com uma única rolagem. Quase não está ali. Armas marcadas sem essência causam só metade do dano.",
  "despojos": "Pele translúcida em grande quantidade (o melhor couro para tambor).",
  "alt": "3,5 m de altura"
 },
 "lodo-1": {
  "tipo": "LODO · MIÚDO · COMUM",
  "desc": "Do tamanho de um sapo grande, de mãos largas que grudam em paredes, tetos e pele.",
  "esp": "Grudar. Quando acerta, fica preso na vítima e causa d4 por rodada até ser arrancado (uma ação, ou um acerto de qualquer arma).",
  "despojos": "Resíduo de lodo.",
  "alt": "0,3 m de altura"
 },
 "lodo-2": {
  "tipo": "LODO · PEQUENO · COMUM",
  "desc": "Baixo e largo como um porco grande, de cabeça baixa, sempre fuçando e mastigando. Lento e guloso.",
  "esp": "Apaga o sal. O rastro dele desfaz qualquer linha de sal ou pó que atravessar. Guloso. Uma isca de carne o distrai por uma fase inteira.",
  "despojos": "Resíduo de lodo em quantidade.",
  "alt": "0,8 m de altura"
 },
 "lodo-3": {
  "tipo": "LODO · MÉDIO · FORTE",
  "desc": "De pé, com o corpo de gente feito de lama, o contorno sempre pingando. De longe, parece alguém da vila voltando tarde para casa.",
  "esp": "De longe, parece gente. Percepção 15 para perceber o que é antes que chegue a cinco passos. Escorrer. Passa por brechas pela metade: um círculo com força abaixo de 10 não o segura.",
  "despojos": "Resíduo de lodo, sangue.",
  "alt": "1,8 m de altura"
 },
 "lodo-4": {
  "tipo": "LODO · ENORME · FORTE",
  "desc": "Uma massa grande e lenta de lodo, com braços curtos que se formam e somem. Avança sobre o círculo como uma maré.",
  "esp": "Maré. Quando ataca um círculo e não o supera, tira 5 de força em vez de 3. Engolir. Quem cai em Sangue zero ao lado dele é puxado para dentro e só pode ser salvo se o Atoleiro morrer até o fim da fase.",
  "despojos": "Resíduo de lodo em grande quantidade, pele.",
  "alt": "3,5 m de altura"
 },
 "velho": {
  "tipo": "LODO E RAIZ · ENORME · VELHO",
  "desc": "Mistura de Lodo e Raiz. Antigo, cansado e terrível, arrasta-se entre as árvores com coisas presas no corpo: rodas de carroça, pedaços de cerca, restos do que já engoliu. Toda a região em volta dele fica em silêncio.",
  "esp": "Duas essências. Contra ele, traços e armas de Sopro valem +4; de Cinza não mudam nada (vencem a Raiz, perdem para o Lodo); de Osso valem −4. Descobrir isso a tempo é metade da luta. Duas ações. Age duas vezes por rodada. Raízes no chão. Uma vez por noite, prende todos a até dez passos (Atletismo 20 para se soltar). Faro antigo. Fareja quem está sob traços de Calar.",
  "despojos": "Sangue em quantidade, pele, fibra, resíduo, e o que ele tiver preso no corpo.",
  "alt": "6,0 m de altura"
 }
};

// as jogadas de cada bicho: o que você anuncia no começo da rodada (intenção) e o que acontece na vez dele
export const JOGADAS = {
  'cinza-2': [
    { n: 'Bafo de borralho (poder)', quando: 'Quando há gente a até 3 passos', diga: 'O peito dele incha. Pelas rachaduras da pele, a brasa morta acende um instante.', faz: 'Cospe brasa morta num cone de 3 passos: cada um ali rola Atletismo contra 1d20+2 ou sofre d6. Quem foi atingido fica com a fuligem colada: até se lavar (uma ação, com água), todos os Farejadores sabem onde ele está.' },
    { n: 'Seguir o rastro', quando: 'Quando ainda não achou ninguém', diga: 'O focinho cola no chão. Ele vira de uma vez na direção de quem acendeu fogo ou está sangrando.', faz: 'Anda até 6 passos direto para essa pessoa. Se chegar, ataca na mesma vez.' },
    { n: 'Mordida que queima', quando: 'Quando está colado em alguém', diga: 'Ele abaixa a cabeça e mostra os dentes em brasa.', faz: 'Ataque 1d20+2 contra a Defesa. Acertou: d6 de dano e a pessoa perde 1 Prumo.' },
    { n: 'Rodear o círculo', quando: 'Quando a linha está inteira', diga: 'Ele dá a volta na linha, farejando cada palmo, procurando onde o cheiro de gente passa.', faz: 'Investe contra o trecho mais fraco: 1d20+2 contra a força. Não superou: a linha perde 3.' },
    { n: 'Fugir ferido', quando: 'Com metade do Sangue ou menos', diga: 'Ele gane, um som de brasa molhada, e recua para o escuro.', faz: 'Foge 6 passos. Volta na próxima fase, com o Sangue que tem.' },
  ],
  'cinza-1': [
    { n: 'Enxame de fagulhas (poder)', quando: 'Quando acerta alguém', diga: 'As fagulhas sobem pela roupa como formiga, por dentro da manga, pela gola.', faz: 'Quem foi coberto sofre d4 por rodada até rolar no chão (gasta o movimento) ou alguém bater nas fagulhas (uma ação).' },
    { n: 'Entrar pela boca (poder)', quando: 'Quando alguém grita, canta ou fala alto perto dele', diga: 'O bando inteiro vira para o som.', faz: 'Quem fez barulho a até 2 passos rola Firmeza 12 ou engole fagulha: perde a voz na próxima vez (sem Canto, sem Lábia, sem encorajar).' },
    { n: 'Pelas frestas', quando: 'Quando há parede ou porta', diga: 'O chiado vem de dentro das paredes. Pelos buracos do tamanho de um punho, começam a entrar.', faz: 'O bando ignora sal e entra por qualquer fresta. Aparece do lado de dentro, perto de quem tem mais Pavor.' },
    { n: 'Cobrir', quando: 'Quando chega em alguém', diga: 'O bando sobe pelas pernas de quem está mais perto, como formiga em brasa.', faz: 'Ataque 1d20+2 (1d20 se o bando estiver pela metade). Acertou: d6 de dano. Cada 4 de dano que o bando sofre derruba um deles.' },
    { n: 'Caçar o medo', quando: 'Sempre que alguém falha no Pavor', diga: 'O bando inteiro para, e todas as cabecinhas viram na mesma direção.', faz: 'Muda o alvo para quem tem mais Pavor, mesmo que esteja longe.' },
  ],
  'osso-1': [
    { n: 'Chuva de espinhos (poder)', quando: 'Quando está cercado ou preso', diga: 'As placas tremem. Um estalo seco, como galho quebrando, e ele se abre de uma vez.', faz: 'Dispara espinhos de osso em todos até 3 passos: um ataque 1d20+2 contra cada um, d4 de dano. O espinho fica cravado: −1 dado até alguém arrancar (uma ação, mais d4 de dano).' },
    { n: 'Tampão (poder)', quando: 'Quando a linha abriu uma brecha', diga: 'Ele rola até a brecha e se enrola dentro dela, encaixado como pedra em muro.', faz: 'Ninguém passa pela brecha, nem para dentro nem para fora, enquanto ele estiver lá. Fechar a brecha com cal fica impossível até tirarem ele (Empurrar contra a Defesa 16).' },
    { n: 'Rolar contra a linha', quando: 'Quando o círculo está de pé', diga: 'Ele se enrola numa bola de espinhos e pega embalo, toc, toc, toc, cada vez mais rápido.', faz: 'Enrolado: Defesa 16. Investe contra o círculo, 1d20+2 contra a força. Não superou: a linha perde 4 (e não 3).' },
    { n: 'Arrombar', quando: 'Quando há uma porta no caminho', diga: 'A bola bate na porta e a madeira estala.', faz: '1d20+2 contra a porta (tranca de ferro vale 14, porta comum 10). Superou: a porta abre.' },
    { n: 'Desenrolar', quando: 'Quando a linha cai ou ele é preso', diga: 'As placas se abrem com um estalo de osso, e lá dentro tem dentes.', faz: 'Volta à Defesa 13 e passa a atacar gente: 1d20+2, d6 de dano.' },
  ],
  'cinza-4': [
    { n: 'Soterrar (poder)', quando: 'Quando pisa perto de alguém', diga: 'A pata desce, e o chão em volta vira uma onda de cinza quente.', faz: 'Todos a até 2 passos rolam Atletismo 15 ou ficam enterrados até a cintura: presos, sem andar, e −1 dado em tudo até alguém cavar (uma ação) ou vencerem Atletismo 15 na própria vez.' },
    { n: 'Escutar', quando: 'Antes de achar alguém', diga: 'A cabeça baixa vai de um lado para o outro. Ela parou. Está escutando.', faz: 'Quem fizer barulho nesta rodada vira o alvo. Um grupo em silêncio total não é achado.' },
    { n: 'Pisão', quando: 'Quando está perto de alguém', diga: 'Ela levanta a pata da frente, e o chão inteiro espera.', faz: 'Ataque 2d20+3 contra a Defesa. Acertou: d8 de dano, e quem tiver Sangue baixo cai no chão.' },
    { n: 'Nuvem de fuligem (anuncie uma rodada antes)', quando: 'Uma vez na noite', diga: 'A corcunda incha. Ela está enchendo o peito de cinza.', faz: 'Na vez seguinte, sacode a corcunda: todos a até 5 passos perdem 1 dado na próxima rolagem.' },
    { n: 'Derrubar a linha', quando: 'Quando há círculo entre ela e o barulho', diga: 'Ela abaixa a cabeça e anda contra a linha como quem anda contra o vento.', faz: '2d20+3 contra a força do círculo. Não superou: a linha perde 3. Superou: abre uma brecha do tamanho dela.' },
  ],
};
// para os bichos sem jogadas escritas: o básico
export const JOGADA_BASE = [
  { n: 'Caçar', quando: 'Antes de achar alguém', diga: 'Ele procura pelo sentido dele: fareja, escuta, espera alguém se mexer ou sente o medo.', faz: 'Anda até o alvo mais fácil para o sentido dele.' },
  { n: 'Atacar', quando: 'Quando está colado em alguém', diga: 'Ele se prepara para o bote.', faz: 'Rola o ataque dele contra a Defesa. Acertou: dano.' },
  { n: 'Investir contra a linha', quando: 'Quando há círculo no caminho', diga: 'Ele mede a linha e investe.', faz: 'Ataque contra a força do círculo. Não superou: perde 3.' },
  { n: 'Fugir ferido', quando: 'Com metade do Sangue ou menos', diga: 'Ele recua para o escuro.', faz: 'Foge e volta na próxima fase.' },
];

// o poder de cada família, para os bichos sem jogadas escritas
export const FAMILIA = {
  cinza: { n: 'Brasa morta (poder da família)', quando: 'Quando está perto de alguém', diga: 'Pelas rachaduras da pele, uma brasa sem luz acende.', faz: 'Cospe ou espalha brasa morta: d6 em quem estiver a até 2 passos (Atletismo 12 para escapar). Apaga qualquer chama pequena por perto.' },
  osso: { n: 'Espinhos (poder da família)', quando: 'Quando é atacado de perto', diga: 'Os ossos por baixo da pele se mexem, como dedos procurando saída.', faz: 'Quem o atacou corpo a corpo leva d4 dos espinhos, acertando ou não.' },
  lodo: { n: 'Chão que engole (poder da família)', quando: 'Quando alguém está em terra molhada ou baixa', diga: 'A terra amolece debaixo dos pés, como se respirasse.', faz: 'Quem está a até 3 passos rola Atletismo 12 ou afunda até o joelho: perde o movimento até sair.' },
  raiz: { n: 'Raízes (poder da família)', quando: 'Quando alguém corre ou foge', diga: 'O chão estala, e raízes sobem como mãos.', faz: 'Prende quem estiver a até 4 passos (Atletismo 15 para escapar) e puxa um passo para perto dele.' },
  sopro: { n: 'Levar o fôlego (poder da família)', quando: 'Quando alguém fala, canta ou risca', diga: 'O ar fica frio de repente, e a respiração de todo mundo vira fumaça.', faz: 'Quem está a até 3 passos rola Firmeza 12 ou perde o fôlego: −1 dado na próxima rolagem. Apaga traços frescos: −2 na força do último traço riscado.' },
};

// a bordadeira e o moço dos baldes: Rasgados que estudaram com quem saiu do Almofariz. Podem matar todos; escolhem não matar.
export const RASGADOS = {
  celeste: { ficha: 'Pregadora. Sangue 20, Defesa 13, ataque 2d20+3, tesoura d6. Não rola Pavor. Os bichos só a atacam se ela estiver sangrando (Sangue abaixo da metade). Ela não quer matar: morto não abre porta. Ela fere, marca e sussurra.', jogadas: [
    { n: 'Tesoura que sangra', quando: 'Quando alguém chega perto', diga: 'Ela sorri e abre os braços, como quem vai abraçar.', faz: '2d20+3 contra a Defesa, d6. Quem foi cortado sangra: perde 1 Sangue por rodada até alguém tratar (Ervas e Cura 10). E sangue chama: os bichos vão primeiro em quem sangra.' },
    { n: 'Linha vermelha', quando: 'Quando alguém canta, reza ou fala alto', diga: 'Ela tira do xale um carretel de linha vermelha e lambe a ponta.', faz: 'Pontaria 2d20+3 contra a Defesa: a linha costura a boca da pessoa. Sem falar, sem cantar, sem encorajar, até alguém cortar a linha (uma ação, com lâmina).' },
    { n: 'Pó de lume na pele', quando: 'Quando alguém se esconde no escuro', diga: 'Ela sopra um punhado de pó da palma da mão, devagar, como quem sopra um beijo.', faz: 'Pontaria contra a Defesa: a pessoa brilha fraquinho até o amanhecer. É a única luz da noite: todo bicho enxerga ela, e esconder fica impossível.' },
    { n: 'Voz da fenda', quando: 'Uma vez por fase', diga: 'Ela fecha os olhos e começa a pregar, sem gritar, numa voz que chega dentro do ouvido de cada um.', faz: 'Todos que ouvem rolam Firmeza 15 ou ganham 1 Pavor. "Vocês riscam o mundo como quem costura ferida aberta. E se a gente deixasse sarar?"' },
    { n: 'Lanterna de chamado', quando: 'Quando a fase está acabando', diga: 'Ela abre a portinha da lanterna. A luz amarela sai para o escuro.', faz: 'Na próxima fase chega um Assombro Comum a mais, atraído pela luz.' },
    { n: 'Xale de couro de Assombro', quando: 'Sempre', diga: 'O golpe pega no xale e escorrega, como em couro molhado.', faz: 'O primeiro golpe de arma marcada contra ela, a cada rodada, perde 1 dado.' },
  ] },
  zeca: { ficha: 'Rasgado, o cão de guarda dela. Sangue 16, Defesa 13, ataque 1d20+4, vara d8 (alcance de 2 passos). Não rola Pavor. Era mensageiro: mira boa. Tem a Marca da rédea nas palmas.', jogadas: [
    { n: 'Vara de ponta de osso', quando: 'Quando alguém ameaça a tia', diga: 'Ele gira a vara dos baldes, e da ponta sai um osso afiado.', faz: '1d20+4 contra a Defesa, d8, alcance de 2 passos.' },
    { n: 'Batizar', quando: 'Quando alguém está perto', diga: 'Ele pega um dos baldes. Dentro, um líquido escuro que fede a ferro e a fenda.', faz: 'Joga sangue de Assombro em alguém (Pontaria contra a Defesa). Até lavar com água (uma ação), todo bicho ataca essa pessoa com +1 dado.' },
    { n: 'Dardo de sono', quando: 'Quando alguém corre para a tia', diga: 'Ele leva um caniço fino à boca.', faz: 'Pontaria contra a Defesa: a pessoa resiste com Firmeza contra 14 ou perde a próxima ação.' },
    { n: 'Proteger', quando: 'Sempre que ela é atacada', diga: 'Ele se joga na frente, sem pensar.', faz: 'Leva o golpe no lugar dela.' },
    { n: 'Pó de silêncio', quando: 'Na fuga', diga: 'Ele quebra um frasco no chão. O mundo some de som.', faz: 'Numa roda de 3 passos, nada faz barulho até a fase virar: quem está dentro não é ouvido.' },
    { n: 'A rédea', quando: 'Na saída da Hora Morta', diga: 'Ele encosta as palmas marcadas na corcunda do bicho. A Corcunda abaixa, como cavalo manso.', faz: 'Monta a Corcunda. Montado, age junto com ela: os dois atacam na mesma rodada, e ela corre o dobro.' },
  ] },
};
