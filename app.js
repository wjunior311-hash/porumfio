const KEY="porumfio-v1";

const firebaseConfig={
  apiKey:"AIzaSyBx3o9HmKLndbsfeKj1EkP0nt_nFL2eEY",
  authDomain:"por-um-fio.firebaseapp.com",
  projectId:"por-um-fio",
  storageBucket:"por-um-fio.firebasestorage.app",
  messagingSenderId:"874474910219",
  appId:"1:874474910219:web:88305c7b0179f3fa6dcd0e"
};
let db=null,cloudReady=false,remoteApplying=false,cloudUnsubscribe=null,cloudDirty=false;

function initCloud(){
  if(!window.firebase)return;
  try{
    firebase.initializeApp(firebaseConfig);
    db=firebase.firestore();
    firebase.auth().signInAnonymously().then(()=>{
      cloudReady=true;
      if(cloudDirty) syncCloud();
      subscribeCloud();
    }).catch(err=>{
      console.error("Firebase Auth:",err);
      const sync=$(".sync"); if(sync) sync.textContent="⚠️ Firebase não conectado";
    });
  }catch(err){console.warn("Firebase:",err);}
}
function cloudSnapshot(){
  const payload=clone(state);
  Object.values(payload).forEach(c=>{c.image="";});
  return payload;
}
function syncCloud(){
  if(!cloudReady||!db||remoteApplying)return;
  const payload={state:cloudSnapshot(),updatedAt:firebase.firestore.FieldValue.serverTimestamp()};
  db.collection("campaign").doc("state").set(payload,{merge:false}).then(()=>{
    cloudDirty=false;
    const sync=$(".sync"); if(sync) sync.textContent="✓ Sincronizado em tempo real";
  }).catch(err=>{
    console.error("Firebase sync:",err);
    const sync=$(".sync"); if(sync) sync.textContent="⚠️ Erro ao sincronizar";
    toast("Não foi possível sincronizar com a mesa.");
  });
}
function subscribeCloud(){
  if(!db)return;
  if(cloudUnsubscribe)cloudUnsubscribe();
  cloudUnsubscribe=db.collection("campaign").doc("state").onSnapshot(snap=>{
    if(!snap.exists){syncCloud();return;}
    const remote=snap.data()?.state;
    if(!remote)return;
    remoteApplying=true;
    const localImages={};
    Object.entries(state).forEach(([n,c])=>{localImages[n]=c.image||"";});
    state=remote;
    migrate();
    Object.entries(localImages).forEach(([n,img])=>{if(state[n]&&img)state[n].image=img;});
    localStorage.setItem(KEY,JSON.stringify(state));
    remoteApplying=false;
    render();
    if(cloudDirty) syncCloud();
  },err=>console.warn("Firebase listener:",err));
}


const magicData={Hippion:[["Comando","1º • Encantamento • Padrão • Curto • 1 rodada • 1 PM","Dá uma ordem irresistível: Fuja, Largue, Pare, Senta ou Venha."],["Sono","1º • Encantamento • Padrão • Curto • Cena • 1 PM","Se falhar, fica inconsciente e caído ou, em situação perigosa, exausto por 1 rodada e depois fatigado. Se passar, fica fatigado por 1d4 rodadas."]],Malekir:[["Adaga Mental","1º • Encantamento • Padrão • Curto • Instantânea • 1 PM","2d6 de dano psíquico e atordoado por 1 rodada; na resistência, metade do dano e sem condição."],["Armadura Arcana","1º • Abjuração • Padrão • Pessoal • Cena • 1 PM","+5 Defesa; cumulativo com outras magias, não com armaduras."],["Compreensão","1º • Adivinhação • Padrão • Toque • Cena • 1 PM","Entende textos e idiomas, comunica-se sem idioma comum e pode ouvir pensamentos de criatura tocada."],["Concentração de Combate","1º • Adivinhação • Livre • Pessoal • 1 rodada • 1 PM","Ao fazer ataque, rola dois dados e usa o melhor."],["Conjurar Monstro","1º • Convocação • Completa • Curto • Sustentada • 1 PM","Conjura monstro Pequeno de energia sob seu comando."],["Explosão de Chamas","1º • Evocação • Padrão • Pessoal • Instantânea • 1 PM","Leque de chamas causa 2d6 de fogo."],["Imagem Espelhada","1º • Ilusão • Padrão • Pessoal • Cena • 1 PM","Três cópias; +6 Defesa. Cada erro do inimigo remove uma imagem e reduz o bônus em 2."],["Seta Infalível de Talude","1º • Evocação • Padrão • Médio • Instantânea • 1 PM","Duas setas de energia, 1d4+1 essência cada."],["Toque Chocante","1º • Evocação • Padrão • Toque • Instantânea • 1 PM","2d8+2 eletricidade; armadura de metal impõe -5 no teste de resistência."]],Fani:[["Arma Mágica","1º • Transmutação • Padrão • Toque • Cena • 1 PM","+1 ataque e dano; pode usar atributo-chave de magia no ataque."],["Bênção","1º • Encantamento • Padrão • Curto • Cena • 1 PM","Aliados recebem +1 ataque e dano."],["Comando","1º • Encantamento • Padrão • Curto • 1 rodada • 1 PM","Ordem irresistível: Fuja, Largue, Pare, Senta ou Venha."],["Consagrar","1º • Evocação • Padrão • Longo • 1 dia • 1 PM","Maximiza PV curados por luz e dano de luz contra mortos-vivos na área."],["Controlar Plantas","1º • Transmutação • Padrão • Curto • Cena • 1 PM","Vegetação enreda criaturas e transforma área em terreno difícil."],["Curar Ferimentos","1º • Evocação • Padrão • Toque • Instantânea • 1 PM","Recupera 2d8+2 PV."]],Neo:[],Zuri:[["Armadura Arcana","1º • Abjuração • Padrão • Pessoal • Cena • 1 PM","Cria uma película protetora invisível, mas tangível, fornecendo +5 na Defesa. Esse bônus é cumulativo com outras magias, mas não com bônus fornecido por armaduras."],["Flecha de Luz","1º • Evocação • Padrão • Médio • Instantânea • 1 PM","Lança uma flecha luminosa contra o alvo, que sofre 2d8+2 pontos de dano de luz e fica ofuscado por 1 rodada. Passar no teste de resistência reduz o dano à metade e evita a condição."],["Raio do Enfraquecimento","1º • Necromancia • Padrão • Curto • Cena • 1 PM","Dispara um raio púrpura que drena as forças do alvo. Se falhar na resistência, fica fatigado. Se passar, fica vulnerável. Efeitos de magia não acumulam."],["Vitalidade Fantasma","1º • Necromancia • Padrão • Pessoal • Instantânea • 1 PM","Suga energia vital da terra, recebendo 2d10 pontos de vida temporários. Os PV temporários desaparecem ao final da cena."]]};
const base={
Hippion:{race:"Sereia",origin:"Marujo",className:"Bucaneiro",level:4,deity:"Oceano",hp:44,maxHp:44,mp:12,maxMp:12,def:19,fort:8,ref:6,will:6,init:6,per:6,speed:9,attrs:{FOR:3,DES:2,CON:4,INT:1,SAB:0,CAR:4},
attacks:[["Tridente","+7","1d8+5","x2","Perfuração","Curto"],["Besta Leve","+4","1d8","crit 19","Perfuração","Médio"]],
powers:[["Acrobático","Você pode usar sua Destreza em vez de Força em testes de Atletismo. Além disso, terreno difícil não reduz seu deslocamento nem o impede de realizar investidas."],["Ataque Acrobático","Quando se aproxima de um inimigo com um salto ou pirueta (usando Atletismo ou Acrobacia para se mover) e o ataca no mesmo turno, recebe +2 nesse teste de ataque e na rolagem de dano."],["Ataque Pesado","Quando faz um ataque corpo a corpo com uma arma de duas mãos, pode pagar 1 PM. Se acertar, além do dano faz uma manobra derrubar ou empurrar contra o alvo como ação livre."],["Audácia","Quando faz um teste de perícia, pode gastar 2 PM para somar seu Carisma no teste. Não pode usar em testes de ataque."],["Canção dos Mares","Pode lançar duas: Amedrontar, Comando, Despedaçar, Enfeitiçar, Hipnotismo ou Sono (atributo-chave Carisma). Se aprender novamente uma delas, o custo diminui em 1 PM."],["Esquiva Sagaz","Recebe +1 na Defesa e em Reflexos. Aumenta em +1 a cada quatro níveis. Exige liberdade de movimentos."],["Estilo de Duas Mãos","Se usar arma corpo a corpo com as duas mãos, recebe +5 nas rolagens de dano. Não funciona com armas leves."],["Evasão","Quando sofre ataque que permite Reflexos para reduzir dano à metade, não sofre dano se passar. Exige liberdade de movimentos."],["Insolência","Soma seu Carisma na Defesa, limitado pelo nível. Exige liberdade de movimentos."],["Mestre do Tridente","Tridente é arma simples para você. Recebe +2 em dano com azagaias, lanças e tridentes."],["Mestre dos Mares","Pode falar com animais aquáticos e aprende Acalmar Animal, mas só contra criaturas aquáticas. Reaprender reduz custo em 1 PM."],["Passagem de Navio","Consegue transporte marítimo para você e aliados sem custos, desde que todos paguem com trabalho, passando em ao menos um teste de perícia adequado."],["Transformação Anfíbia","Respira debaixo d'água e tem cauda com natação 12m. Fora d'água, pernas e deslocamento 9m. Mais de um dia sem água impede recuperar PM com descanso."]],
skills:{Acrobacia:6,Adestramento:null,Atletismo:5,Atuação:6,Cavalgar:4,Conhecimento:null,Cura:2,Diplomacia:6,Enganação:8,Fortitude:8,Furtividade:4,Guerra:null,Iniciativa:6,Intimidação:6,Intuição:2,Investigação:3,Jogatina:null,Ladinagem:null,Luta:7,Misticismo:null,Nobreza:null,"Ofício":null,Percepção:2,Pilotagem:6,Pontaria:4,Reflexos:7,Religião:null,Sobrevivência:2,Vontade:2},
trained:["Acrobacia","Enganação","Fortitude","Iniciativa","Luta","Pilotagem","Reflexos"],
items:[["Corda",1],["Mochila",0],["Saco de dormir",1],["Traje de viajante",0],["Besta Leve",1],["Tridente",1],["Armadura de couro",2]]},

Malekir:{race:"Suraggel (Sulfure)",origin:"Aristocrata",className:"Arcanista",level:4,deity:"Wynna",hp:26,maxHp:26,mp:31,maxMp:31,def:16,fort:7,ref:8,will:9,init:6,per:6,speed:9,attrs:{FOR:1,DES:4,CON:3,INT:5,SAB:0,CAR:2},
attacks:[["Espada Curta","+3","1d6+1","crit 19","Perfuração","Curto"],["Bordão","+3","1d6+1 / 1d6+1","x2","Impacto","—"]],
powers:[["Arcano de Batalha","Soma o bônus do atributo-chave nas rolagens de dano para magias."],["Aumento de Atributo","Recebe +1 em um atributo. Pode escolher várias vezes, uma vez por patamar para o mesmo atributo."],["Bênção do Mana","Recebe +1 PM a cada nível ímpar."],["Caminho do Arcanista","É um mago, capaz de lançar magia através de seu estudo mágico."],["Conhecimento Mágico","Aprende duas magias de qualquer círculo que possa lançar. Pode escolher novamente."],["Herança de Pyra","Ao fazer teste de resistência ou atributo para remover condição, pode gastar 2 PM para rolar novamente."],["Herança Divina","É uma criatura do tipo espírito e recebe visão no escuro."],["Magias","Pode lançar magias arcanas de 1º círculo. A cada quatro níveis, libera círculo maior."],["Sangue Azul","Tem influência política suficiente para ser tratado com mais leniência pela guarda, conseguir audiência com nobre local etc."]],
skills:{Acrobacia:6,Adestramento:null,Atletismo:3,Atuação:4,Cavalgar:6,Conhecimento:9,Cura:2,Diplomacia:6,Enganação:6,Fortitude:7,Furtividade:6,Guerra:null,Iniciativa:8,Intimidação:4,Intuição:2,Investigação:9,Jogatina:null,Ladinagem:null,Luta:3,Misticismo:9,Nobreza:9,"Ofício":null,Percepção:6,Pilotagem:null,Pontaria:6,Reflexos:6,Religião:null,Sobrevivência:2,Vontade:4},
trained:["Conhecimento","Diplomacia","Enganação","Fortitude","Iniciativa","Investigação","Misticismo","Nobreza","Vontade"],
items:[["Mochila",0],["Saco de dormir",1],["Traje de viajante",0],["Joia de família",0],["Traje da Corte",1],["Varinha arcana",1],["Varinha arcana",1],["Bordão",2],["Espada Curta",1]]},

Neo:{race:"Trog",origin:"Cão de Briga",className:"Ladino",level:4,deity:"Hyninn",hp:41,maxHp:41,mp:16,maxMp:16,def:16,fort:7,ref:9,will:4,init:7,per:7,speed:9,attrs:{FOR:4,DES:3,CON:5,INT:0,SAB:2,CAR:0},
attacks:[["Mordida","+8","1d6+4","x2","Perfuração","Curto"],["Adaga","+8","1d4+4","crit 19","Perfuração","Curto"],["Espada Curta","+8","1d6+4","crit 19","Perfuração","Curto"],["Besta Leve","+5","1d8","crit 19","Perfuração","Médio"]],
powers:[["Apostar com o Trapaceiro","Ao fazer teste de perícia, gasta 1 PM para apostar com Hyninn. Você e o mestre rolam 1d20; o mestre mantém o resultado secreto e você escolhe entre os dois."],["Ataque Furtivo","Uma vez por rodada, ao atingir criatura desprevenida, em alcance curto ou flanqueada, causa 1d6 extra. A cada dois níveis aumenta +1d6. Imune a crítico é imune."],["Cão de Briga","Na primeira vez por cena em que faz a ação agredir, pode fazer um ataque extra."],["Emboscar","Na primeira rodada de cada combate, pode gastar 2 PM para executar uma ação padrão adicional."],["Especialista","Escolhe perícias treinadas igual à Inteligência (mínimo 1). Em teste dessas perícias, gasta 1 PM para dobrar bônus de treinamento; não vale para ataque."],["Esquiva Sobrenatural","No 4º nível, nunca fica surpreendido."],["Evasão","A partir do 2º nível, ao passar em Reflexos para reduzir dano à metade, não sofre dano."],["Mau Cheiro","Ação padrão + 2 PM: gás fétido; criaturas em alcance curto, exceto trogs, fazem Fortitude contra veneno ou ficam enjoadas 1d6 rodadas."],["Mordida","Arma natural 1d6, crítico x2, perfuração. Ao atacar, pode gastar 1 PM para ataque extra com mordida."],["Reptiliano","Criatura monstro, visão no escuro, +1 Defesa já incluído e +5 Furtividade sem armadura/roupas pesadas."],["Sangue Frio","Sofre 1 dano adicional por dado de dano de frio."],["Sombra","+2 Furtividade, sem penalidade por deslocamento normal e penalidade por ações chamativas reduzida para -10. Requer Furtividade treinada."],["Velocidade Ladina","Uma vez por rodada, gasta 2 PM para fazer uma ação de movimento adicional."]],
skills:{Acrobacia:7,Adestramento:null,Atletismo:6,Atuação:2,Cavalgar:5,Conhecimento:null,Cura:4,Diplomacia:2,Enganação:4,Fortitude:7,Furtividade:9,Guerra:null,Iniciativa:7,Intimidação:2,Intuição:6,Investigação:2,Jogatina:4,Ladinagem:7,Luta:8,Misticismo:null,Nobreza:null,"Ofício":null,Percepção:6,Pilotagem:null,Pontaria:5,Reflexos:7,Religião:null,Sobrevivência:4,Vontade:4},
trained:["Acrobacia","Enganação","Fortitude","Furtividade","Iniciativa","Jogatina","Ladinagem","Luta","Percepção","Reflexos"],
items:[["Mochila",0],["Saco de dormir",1],["Traje de viajante",0],["Manoplas ou arma marcial",1],["Mordida",0],["Adaga",1],["Espada Curta",1],["Besta Leve",1],["Virotes (20)",1],["Armadura de couro",2]]},

Fani:{race:"Dahllan",origin:"Herói Camponês",className:"Druida",level:4,deity:"Allihanna",hp:40,maxHp:40,mp:23,maxMp:23,def:16,fort:8,ref:7,will:10,init:8,per:8,speed:9,attrs:{FOR:2,DES:3,CON:3,INT:0,SAB:4,CAR:2},
attacks:[["Besta Leve","+7","1d8","crit 19","Perfuração","Médio"],["Arco Curto","+7","1d6","x3","Perfuração","Médio"],["Bordão","+4","1d6+2 / 1d6+2","x2","Impacto","—"]],
powers:[["Amiga das Plantas","Pode lançar Controlar Plantas com Sabedoria. Se aprender novamente, custo -1 PM."],["Armadura de Allihanna","Ação de movimento +1 PM: pele vira casca, +2 Defesa até fim da cena."],["Aspecto do Verão","Aprende magia de transmutação. Pode gastar 1 PM para arma em chamas: +1d6 fogo; cada acerto dá 1 PM temporário, até seu nível por cena."],["Caminho dos Ermos","No 2º nível, atravessa terreno difícil sem redução e CD para rastreá-la +10; apenas terrenos naturais."],["Compreender os Ermos","+2 Sobrevivência e pode usar Sabedoria em Adestramento."],["Coração Heroico","+3 PM; em novo patamar (5º, 11º, 17º), +3 PM."],["Dedo Verde","Aprende e pode lançar Controlar Plantas; se aprender novamente, custo -1 PM."],["Devoto Fiel","Torna-se devoto de deus disponível para druida e recebe dois poderes concedidos, em vez de um."],["Empatia Selvagem (x2)","Comunica-se com animais e usa Adestramento para mudar atitude e pedir favores. Ao receber novamente, +2 Adestramento."],["Força dos Penhascos","+2 Fortitude. Ao sofrer dano em solo/pedra, gasta PM limitado por Sabedoria e reduz 10 por PM."],["Forma Selvagem","Pode se transformar em animais; lista na página 63."],["Magias","Escolhe três escolas e lança magias divinas de 1º círculo delas; círculos maiores nos níveis 6, 10 e 14. Começa com duas e aprende uma a cada nível par; atributo-chave Sabedoria."]],
skills:{Acrobacia:3,Adestramento:8,Atletismo:4,Atuação:4,Cavalgar:5,Conhecimento:null,Cura:8,Diplomacia:4,Enganação:4,Fortitude:7,Furtividade:3,Guerra:null,Iniciativa:7,Intimidação:4,Intuição:8,Investigação:2,Jogatina:null,Ladinagem:null,Luta:4,Misticismo:null,Nobreza:null,"Ofício":null,Percepção:8,Pilotagem:null,Pontaria:7,Reflexos:5,Religião:null,Sobrevivência:10,Vontade:8},
trained:["Adestramento","Cura","Iniciativa","Intuição","Percepção","Pontaria","Sobrevivência","Vontade"],
items:[["Mochila",0],["Saco de dormir",1],["Traje de viajante",0],["Instrumentos de ofício",0],["Traje de Plebeu",0],["Arco Curto",2],["Bordão",2],["Besta Leve",1],["Armadura de couro",2],["Escudo Leve",1]]},

Zuri:{race:"Medusa",origin:"Artista",className:"Bardo",level:4,deity:"Wynna",hp:33,maxHp:33,mp:22,maxMp:22,def:16,fort:5,ref:8,will:4,init:6,per:4,speed:9,attrs:{FOR:1,DES:4,CON:3,INT:2,SAB:0,CAR:4},
attacks:[["Espada Curta","+3","1d6+1","crit 19","Perfuração","Curto"],["Machadinha","+3","1d6+1","x3","Corte","Curto"]],
powers:[["Bênção do Mana","Você recebe +1 PM a cada nível ímpar."],["Cria de Megalokk","Você é uma criatura do tipo monstro e recebe visão no escuro."],["Dom Artístico","Você recebe +2 em testes de Atuação, e recebe o dobro de tibares em apresentações."],["Eclético","A partir do 2º nível, você pode gastar 1 PM para receber todos os benefícios de ser treinado em uma perícia por um teste."],["Inspiração","Você pode gastar uma ação padrão e 2 PM para inspirar as pessoas com sua arte. Você e todos os seus aliados em alcance curto ganham +1 em testes de perícia até o fim da cena. A cada quatro níveis, pode gastar +2 PM para aumentar o bônus em +1."],["Inspiração Marcial","Quando você usa Inspiração, você e seus aliados aplicam o bônus recebido em rolagens de dano (além de testes de perícia)."],["Inspiração Revigorante","Quando você usa Inspiração, você e seus aliados recebem uma quantidade de PV temporários igual a 5 vezes o bônus fornecido."],["Magias","Escolha três escolas de magia. Uma vez feita, essa escolha não pode ser mudada. Você pode lançar magias arcanas de 1º círculo que pertençam a essas escolas. À medida que sobe de nível, pode lançar magias de círculos maiores (2º círculo no 6º nível, 3º círculo no 10º nível e 4º círculo no 14º nível). Você começa com duas magias de 1º círculo. A cada nível par (2º, 4º etc.), aprende uma magia de qualquer círculo e escola que possa lançar. Você pode lançar essas magias vestindo armaduras leves sem precisar de testes de Misticismo. Seu atributo-chave para lançar magias é Carisma e você soma seu bônus de Carisma no seu total de PM. Veja o Capítulo 4 para as regras de magia."],["Música: Melodia Curativa","Criaturas a sua escolha no alcance recuperam 1d6 PV. Quando usa esta habilidade, você pode gastar mais pontos de mana. Para cada PM extra, aumente a cura em +1d6 PV."],["Natureza Venenosa","Você recebe resistência a veneno 5 e pode gastar uma ação de movimento e 1 PM para envenenar uma arma que esteja empunhando. A arma causa +1d12 pontos de dano de veneno. O veneno dura até você acertar um ataque ou até o fim da cena (o que acontecer primeiro)."],["Olhar Atordoante","Você pode gastar uma ação de movimento e 1 PM para forçar uma criatura em alcance curto a fazer um teste de Fortitude (CD Car). Se a criatura falhar, fica atordoada por 1 rodada. Se passar, fica imune a esta habilidade por um dia."],["Sortudo","Você pode gastar 3 PM para rolar novamente um teste recém realizado (apenas uma vez por teste)."]],
skills:{Acrobacia:6,Adestramento:6,Atletismo:3,Atuação:10,Cavalgar:6,Conhecimento:4,Cura:2,Diplomacia:6,Enganação:8,Fortitude:5,Furtividade:8,Guerra:4,Iniciativa:6,Intimidação:8,Intuição:4,Investigação:4,Jogatina:6,Ladinagem:8,Luta:3,Misticismo:6,Nobreza:4,"Ofício":2,Percepção:4,Pilotagem:6,Pontaria:6,Reflexos:8,Religião:2,Sobrevivência:2,Vontade:4},
trained:["Atuação","Enganação","Furtividade","Intimidação","Intuição","Ladinagem","Misticismo","Percepção","Reflexos","Vontade"],
items:[["Flauta Doce",0],["Estojo de disfarces ou um instrumento musical a sua escolha",1],["Mochila",0],["Saco de dormir",1],["Traje de viajante",0],["Espada Curta",1],["Machadinha",1],["Armadura de couro",2]]}
};

const clone=o=>JSON.parse(JSON.stringify(o));
let state=JSON.parse(localStorage.getItem(KEY)||"null")||clone(base);
let selected=localStorage.getItem(KEY+"-selected")||"Hippion";
let tab="Resumo";
const conditionCatalog=[["⛓️","Preso"],["⚔️","Flanqueado"],["☠️","Envenenado"],["🩸","Sangrando"],["🌀","Atordoado"],["💤","Caído"],["😵","Inconsciente"],["👁️","Cego"],["🔇","Surdo"],["🧱","Lento"],["🪶","Ofuscado"],["🔒","Paralisado"],["😨","Apavorado"],["😰","Abalado"],["😵‍💫","Confuso"],["💘","Enfeitiçado"],["🤢","Enjoado"],["🥱","Fatigado"],["🥀","Exausto"],["💢","Debilitado"],["💪","Fraco"],["🌫️","Esmorecido"],["😶‍🌫️","Fascinado"],["😤","Frustrado"],["😳","Pasmo"],["🛡️","Vulnerável"],["🪨","Alquebrado"],["🦶","Desprevenido"]];

const fixedCharacterImages={
  Hippion:"assets/characters/hippion.webp",
  Malekir:"assets/characters/malekir.webp",
  Neo:"assets/characters/neo.webp",
  Fani:"assets/characters/fani.webp",
  Zuri:"assets/characters/zuri.webp"
};

function migrate(){
  if(state.Zuri && state.Zuri._sheetVersion!==3){
    const keep={image:state.Zuri.image||fixedCharacterImages.Zuri,conditions:Array.isArray(state.Zuri.conditions)?state.Zuri.conditions:[],masterNote:typeof state.Zuri.masterNote==="string"?state.Zuri.masterNote:""};
    state.Zuri=clone(base.Zuri); Object.assign(state.Zuri,keep); state.Zuri._sheetVersion=3; cloudDirty=true;
  }
  Object.entries(base).forEach(([name,b])=>{
    if(!state[name]) state[name]=clone(b);
    const c=state[name];
    c.maxLoad=10+(Number(c.attrs?.FOR)||0)*2;
    if(!Array.isArray(c.items)) c.items=clone(b.items);
    c.items=c.items.map(x=>Array.isArray(x)?x:[x,1]);
    if(!Array.isArray(c.trained)) c.trained=clone(b.trained);
    if(!c.powers || !Array.isArray(c.powers) || typeof c.powers[0]==="string") c.powers=clone(b.powers);
    if(!c.skills) c.skills=clone(b.skills);
    c.image=fixedCharacterImages[name]||c.image||"";
    if(!Array.isArray(c.conditions)) c.conditions=[];
    if(typeof c.masterNote!=="string") c.masterNote="";
  });
}
migrate();

const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const capacity=c=>10+(Number(c.attrs?.FOR)||0)*2;
const load=c=>c.items.reduce((sum,i)=>sum+Number(i[1]||0),0);

function save(){
  localStorage.setItem(KEY,JSON.stringify(state));
  localStorage.setItem(KEY+"-selected",selected);
  if(!remoteApplying){
    cloudDirty=true;
    if(cloudReady)syncCloud();
  }
  const sync=$(".sync"); if(sync) sync.textContent=cloudReady?"⟳ Enviando para a mesa…":"⟳ Conectando à mesa…";
}
function toast(t){
  const e=$("#toast"); e.textContent=t; e.classList.add("show");
  clearTimeout(window.tt); window.tt=setTimeout(()=>e.classList.remove("show"),1800);
}

function render(){
 if(tab==="Mestre"){
  document.title="Por Um Fio — Mestre";
  $(" #app".trim()).innerHTML=`<div class="shell master-shell">
   <header class="top"><div class="brand">POR UM FIO</div><button class="master-exit" id="exitMaster">← Fichas</button></header>
   <section class="master-hero"><div class="eyebrow">Tormenta20 • campanha</div><h1>Área do Mestre</h1><p>Controle da mesa em tempo real</p></section>
   <section class="master-screen">${masterView()}</section>
  </div>`;
  const exit=$("#exitMaster");
  if(exit) exit.onclick=()=>{tab="Resumo";render()};
  bindBody();
  return;
 }
 const c=state[selected];
 document.title="Por Um Fio — "+selected;
 const tabs=["Resumo","Ataques","Poderes","Magias","Mochila","Perícias"];
 $(" #app".trim()).innerHTML=`<div class="shell">
  <header class="top"><div class="brand">POR UM FIO</div><button class="master-open" id="openMaster">⚔️ Mestre</button></header>
  <section class="hero"><div class="eyebrow">Tormenta20 • campanha</div><h1>Por Um Fio</h1><p>5 personagens • ficha de mesa • sincronização em tempo real</p></section>
  <div class="roster">${Object.entries(state).map(([n,x])=>`<button class="char ${n===selected?"active":""}" data-char="${n}">
    <div class="avatar ${x.image?"has-image":""}">${x.image?`<img src="${x.image}" alt="">`:`<span>${n[0]}</span>`}</div>
    <div class="name">${n}</div><div class="meta">Nível ${x.level} • ${x.className}</div></button>`).join("")}</div>
  <section class="sheet">
   <div class="sheethead character-head">
    <div class="character-photo ${c.image?"has-image":""}">${c.image?`<img src="${c.image}" alt="Imagem de ${esc(selected)}">`:"<span>🎲</span>"}</div>
    <div class="character-info"><div class="eyebrow">${esc(c.race)} • ${esc(c.origin)}</div><h2>${esc(selected)}</h2><p>${esc(c.className)} • nível ${c.level} • ${esc(c.deity)}</p>
    <label class="upload-photo">📷 ${c.image?"Trocar imagem":"Adicionar imagem"}<input id="photoInput" type="file" accept="image/*"></label></div>
   </div>
   <nav class="tabs">${tabs.map(t=>`<button class="tab ${tab===t?"active":""}" data-tab="${t}">${t}</button>`).join("")}</nav>
   <div class="content">${body(c)}</div>
  </section>
 </div>`;
 document.querySelectorAll("[data-char]").forEach(b=>b.onclick=()=>{selected=b.dataset.char;tab="Resumo";save();render()});
 document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render()});
 const photo=$("#photoInput"); if(photo) photo.onchange=uploadPhoto;
 const open=$("#openMaster"); if(open) open.onclick=()=>{tab="Mestre";render()};
 bindBody();
}
function masterView(){
 const entries=Object.entries(state);
 const effects=entries.reduce((n,[,c])=>n+(c.conditions||[]).length,0);
 const active=entries.filter(([,c])=>(c.conditions||[]).length).length;
 const cards=entries.map(([n,c])=>masterCard(n,c)).join("");
 return `<div class="master-banner">
   <div><div class="master-banner-kicker">⚔️ MESA DE JOGO</div><strong>CONTROLE DA MESA</strong><span>Controle em tempo real • todos acompanham a batalha</span></div>
   <div class="master-live"><i></i><b>MESA ATIVA</b><small>sincronizado</small></div>
  </div>
  <div class="master-summary">
   <div><span>PERSONAGENS</span><b>${entries.length}</b></div>
   <div><span>COM EFEITOS</span><b>${active}</b></div>
   <div><span>EFEITOS ATIVOS</span><b>${effects}</b></div>
  </div>
  <div class="master-grid">${cards}</div>
  <div class="master-footer"><span>⚔️ POR UM FIO</span><small>Controle da mesa em tempo real</small></div>`;
}

function masterCard(n,c){
 const hpPct=Math.max(0,Math.min(100,c.hp/c.maxHp*100)),mpPct=Math.max(0,Math.min(100,c.mp/c.maxMp*100));
 const chips=conditionCatalog.map(([ic,label])=>`<button class="condition-chip ${c.conditions.includes(label)?"on":""}" data-condition="${n}" data-value="${esc(label)}"><span>${ic}</span>${label}</button>`).join("");
 return `<article class="master-card ${c.hp<=0?"down":""}"><div class="master-card-top"><div class="master-avatar">${c.image?`<img src="${c.image}" alt="">`:`<span>${n[0]}</span>`}</div><div class="master-name"><strong>${esc(n)}</strong><span>${esc(c.className)} • Nv. ${c.level}</span></div><div class="master-status-count">${c.conditions.length}<small>efeitos</small></div></div><div class="master-resources"><div class="master-resource hp"><div><span>PV</span><b>${c.hp}/${c.maxHp}</b></div><div class="master-bar"><i style="width:${hpPct}%"></i></div><div class="master-stepper"><button data-master-hp="${n}" data-delta="-5">−5</button><button data-master-hp="${n}" data-delta="-1">−1</button><button data-master-hp="${n}" data-delta="1">+1</button><button data-master-hp="${n}" data-delta="5">+5</button></div></div><div class="master-resource mp"><div><span>PM</span><b>${c.mp}/${c.maxMp}</b></div><div class="master-bar"><i style="width:${mpPct}%"></i></div><div class="master-stepper"><button data-master-mp="${n}" data-delta="-5">−5</button><button data-master-mp="${n}" data-delta="-1">−1</button><button data-master-mp="${n}" data-delta="1">+1</button><button data-master-mp="${n}" data-delta="5">+5</button></div></div></div><div class="condition-title"><span>Condições e estados</span><small>toque para aplicar/remover</small></div><div class="condition-chips">${chips}</div><div class="master-note"><span>📝 Anotação</span><input data-note="${n}" value="${esc(c.masterNote)}" placeholder="Ex.: preso na teia, marcado pelo vilão..."></div></article>`;
}
function body(c){
 if(tab==="Mestre") return masterView();
 if(tab==="Resumo") return `${c.conditions.length?`<div class="active-effects"><div class="active-effects-title">⚠️ Efeitos ativos</div><div class="active-effects-list">${c.conditions.map(v=>`<span>${esc(v)}</span>`).join("")}</div></div>`:""}<div class="bars"><div class="statcard resource hp-card"><div class="resource-top"><div class="label">Pontos de Vida</div><strong>${c.hp} / ${c.maxHp}</strong></div><div class="resource-bar"><span style="width:${Math.max(0,Math.min(100,c.hp/c.maxHp*100))}%"></span></div><div class="controls"><button data-hp="-5">−5</button><button data-hp="-1">−</button><button data-hp="1" class="plus">+</button><button data-hp="5" class="plus">+5</button></div></div><div class="statcard resource mp-card"><div class="resource-top"><div class="label">Pontos de Mana</div><strong>${c.mp} / ${c.maxMp}</strong></div><div class="resource-bar"><span style="width:${Math.max(0,Math.min(100,c.mp/c.maxMp*100))}%"></span></div><div class="controls"><button data-mp="-5">−5</button><button data-mp="-1">−</button><button data-mp="1" class="plus">+</button><button data-mp="5" class="plus">+5</button></div></div></div><div class="section"><div class="sectiontitle"><h3>Defesas e combate</h3></div><div class="grid">${[['Defesa',c.def],['Fortitude',c.fort],['Reflexos',c.ref],['Vontade',c.will],['Iniciativa',c.init],['Percepção',c.per]].map(x=>`<div class="mini"><span class="label">${x[0]}</span><strong>${x[1]}</strong></div>`).join("")}</div></div>
  <div class="section"><div class="sectiontitle"><h3>Atributos</h3></div><div class="grid">${Object.entries(c.attrs).map(x=>`<div class="mini"><span class="label">${x[0]}</span><strong>${x[1]>=0?"+":""}${x[1]}</strong></div>`).join("")}</div></div>
  <div class="section"><div class="sectiontitle"><h3>Movimento</h3></div><div class="row"><div><b>Deslocamento</b><div class="sub">Carga ${load(c)} / ${capacity(c)} espaços</div></div><span class="pill">${c.speed}m</span></div></div>
  <div class="sync">✓ Salvo neste aparelho</div>`;
 if(tab==="Ataques") return `<div class="list">${c.attacks.map((a,i)=>`<div class="row"><div><b>⚔️ ${esc(a[0])}</b><div class="sub">${a[1]} • ${a[2]} • ${a[3]} • ${a[4]} • ${a[5]}</div></div><button class="roll" data-attack="${i}">Rolar</button></div>`).join("")}</div><div class="sync">Rolagens são d20 locais.</div>`;
 if(tab==="Poderes") return `<div class="list powers">${c.powers.map(p=>`<details class="power"><summary><span class="power-icon">✦</span><b>${esc(p[0])}</b></summary><div class="power-text">${esc(p[1])}</div></details>`).join("")}</div>`;
 if(tab==="Magias") return magicView();
 if(tab==="Mochila") return inventory(c);
 return `<div class="skills">${Object.entries(c.skills).map(([n,v])=>`<div class="skill ${c.trained.includes(n)?"trained":""}"><button data-skill="${esc(n)}">${c.trained.includes(n)?'<span class="trained-mark">◆</span>':""}${esc(n)}</button><b>${v==null?"—":"+"+v}</b></div>`).join("")}</div><div class="legend"><span class="trained-mark">◆</span> Perícia treinada</div><div class="sync">Toque em uma perícia para rolar.</div>`;
}

function magicView(){const list=magicData[selected]||[];if(!list.length)return '<div class="empty"><div class="empty-icon">✦</div><b>Sem magias na ficha</b><div class="sub">Não há magias registradas no PDF enviado.</div></div>';return '<div class="list powers">'+list.map(m=>'<details class="power magic"><summary><span class="power-icon">✧</span><b>'+esc(m[0])+'</b></summary><div class="magic-meta">'+esc(m[1])+'</div><div class="power-text">'+esc(m[2])+'</div></details>').join('')+'</div><div class="sync">Magias transcritas das fichas enviadas.</div>';}function inventory(c){
 const cap=capacity(c), used=load(c), full=used>cap;
 let slots="";
 for(let i=1;i<=cap;i++) slots+=`<span class="slot ${i<=used?"filled":""}">${i<=used?"◆":""}</span>`;
 return `
 <div class="inventory-head"><div><div class="label">Mochila</div><strong>${used} / ${cap} espaços</strong></div><span class="inventory-icon">🎒</span></div>
 <div class="capacity-note ${full?"over":""}">Capacidade = 10 + 2 × Força (${c.attrs.FOR}). Cada item ocupa os espaços indicados na ficha.</div>
 <div class="slot-grid">${slots}</div>
 <div class="inventory-add"><input id="newitem" placeholder="Nome do item…"><input id="newsize" type="number" min="0" step="0.5" value="1" aria-label="Espaços"><button id="additem">+ Item</button></div>
 <div class="list">${c.items.map((p,i)=>`<div class="row item-row"><div class="item-icon">◈</div><div class="item-main"><b>${esc(p[0])}</b><div class="sub">${p[1]} espaço${p[1]==1?"":"s"}</div></div><button class="smallbtn" data-remove="${i}">×</button></div>`).join("")}</div>
 <div class="sync">Cada alteração fica salva neste aparelho.</div>`;
}

function bindBody(){
 document.querySelectorAll("[data-master-hp]").forEach(b=>b.onclick=()=>{const c=state[b.dataset.masterHp];c.hp=Math.max(0,Math.min(c.maxHp,c.hp+Number(b.dataset.delta)));save();render()});
 document.querySelectorAll("[data-master-mp]").forEach(b=>b.onclick=()=>{const c=state[b.dataset.masterMp];c.mp=Math.max(0,Math.min(c.maxMp,c.mp+Number(b.dataset.delta)));save();render()});
 document.querySelectorAll("[data-condition]").forEach(b=>b.onclick=()=>{const c=state[b.dataset.condition],v=b.dataset.value;c.conditions.includes(v)?c.conditions=c.conditions.filter(x=>x!==v):c.conditions.push(v);save();render()});
 document.querySelectorAll("[data-note]").forEach(i=>i.onchange=()=>{state[i.dataset.note].masterNote=i.value;save()});
 document.querySelectorAll("[data-hp]").forEach(b=>b.onclick=()=>{const c=state[selected];c.hp=Math.max(0,Math.min(c.maxHp,c.hp+Number(b.dataset.hp)));save();render()});
 document.querySelectorAll("[data-mp]").forEach(b=>b.onclick=()=>{const c=state[selected];c.mp=Math.max(0,Math.min(c.maxMp,c.mp+Number(b.dataset.mp)));save();render()});
 document.querySelectorAll("[data-attack]").forEach(b=>b.onclick=()=>{const a=state[selected].attacks[Number(b.dataset.attack)],d=1+Math.floor(Math.random()*20),bonus=Number(a[1].replace("+",""));toast(a[0]+": d20 "+d+" + "+a[1]+" = "+(d+bonus))});
 document.querySelectorAll("[data-skill]").forEach(b=>b.onclick=()=>{const n=b.dataset.skill,v=state[selected].skills[n];if(v==null)return toast(n+": perícia não disponível na ficha.");const d=1+Math.floor(Math.random()*20);toast(n+": d20 "+d+" + "+v+" = "+(d+v))});
 document.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{state[selected].items.splice(Number(b.dataset.remove),1);save();render()});
 const add=$("#additem");
 if(add)add.onclick=()=>{const name=$("#newitem").value.trim(),size=Number($("#newsize").value);if(!name)return; if(size<0)return; const c=state[selected];if(load(c)+size>capacity(c))return toast("A mochila não comporta esse item.");c.items.push([name,size]);save();render()};
}

function uploadPhoto(e){
 const file=e.target.files?.[0]; if(!file)return;
 if(file.size>2.5*1024*1024)return toast("Escolha uma imagem de até 2,5 MB.");
 const reader=new FileReader();
 reader.onload=()=>{state[selected].image=reader.result;save();render();};
 reader.readAsDataURL(file);
}
render();
initCloud();
