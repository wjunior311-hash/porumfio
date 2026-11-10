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
