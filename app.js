const KEY="porumfio-v1";
const SUPABASE_URL="https://pziqkepgluxvdikllfwq.supabase.co";
const SUPABASE_KEY="sb_publishable_J0n__8-3G6Tf6rnz4Xu_7A_uLIbfKbJ";
let sb=null,cloudReady=false,remoteApplying=false,cloudUnsubscribe=null,cloudDirty=false,cloudInitializing=true;

async function initCloud(){
  if(!window.supabase?.createClient)return;
  try{
    sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
    const {data,error}=await sb.from("campaign_characters").select("name,state");
    if(error)throw error;
    if(data?.length){
      remoteApplying=true;
      data.forEach(row=>{if(row.state)state[row.name]=row.state;});
      migrate();
      localStorage.setItem(KEY,JSON.stringify(state));
      remoteApplying=false;
    }else{
      for(const [name,c] of Object.entries(state)){
        const {error:seedError}=await sb.from("campaign_characters").upsert({name,state:cloudCharacter(c),updated_at:new Date().toISOString()});
        if(seedError)throw seedError;
      }
    }
    cloudReady=true;
    cloudInitializing=false;
    if(cloudDirty){
      for(const name of Object.keys(state)) await syncCloud(name);
      cloudDirty=false;
    }
    subscribeCloud();
    render();
  }catch(err){
    cloudInitializing=false;
    console.error("Supabase:",err);
    const sync=document.querySelector(".sync");if(sync)sync.textContent="⚠️ Supabase não conectado";
  }
}
function cloudCharacter(c){
  const payload=clone(c);payload.image="";return payload;
}
async function syncCloud(characterName=selected){
  if(!cloudReady||!sb||remoteApplying||cloudInitializing)return;
  const c=state[characterName];if(!c)return;
  try{
    const {error}=await sb.from("campaign_characters").upsert({name:characterName,state:cloudCharacter(c),updated_at:new Date().toISOString()});
    if(error)throw error;
    cloudDirty=false;
    const sync=document.querySelector(".sync");if(sync)sync.textContent="✓ Sincronizado em tempo real";
  }catch(err){
    console.error("Supabase sync:",err);
    const sync=document.querySelector(".sync");if(sync)sync.textContent="⚠️ Erro ao sincronizar";
    toast("Não foi possível sincronizar com a mesa.");
  }
}
function subscribeCloud(){
  if(!sb)return;
  if(cloudUnsubscribe)cloudUnsubscribe();
  const channel=sb.channel("por-um-fio-characters")
    .on("postgres_changes",{event:"*",schema:"public",table:"campaign_characters"},payload=>{
      const row=payload.new;
      if(!row?.name||!row?.state)return;
      if(row.name===selected&&cloudDirty)return;
      remoteApplying=true;
      state[row.name]=row.state;
      migrate();
      localStorage.setItem(KEY,JSON.stringify(state));
      remoteApplying=false;
      render();
    })
    .subscribe(status=>{
      if(status==="SUBSCRIBED"){
        const sync=document.querySelector(".sync");if(sync)sync.textContent="✓ Mesa conectada em tempo real";
      }
    });
  cloudUnsubscribe=()=>sb.removeChannel(channel);
}

const magicData={Hippion:[["Comando","1º • Encantamento • Padrão • Curto • 1 rodada • 1 PM","Dá uma ordem irresistível: Fuja, Largue, Pare, Senta ou Venha."],["Sono","1º • Encantamento • Padrão • Curto • Cena • 1 PM","Se falhar, fica inconsciente e caído ou, em situação perigosa, exausto por 1 rodada e depois fatigado. Se passar, fica fatigado por 1d4 rodadas."]],Malekir:[["Adaga Mental","1º • Encantamento • Padrão • Curto • Instantânea • 1 PM","2d6 de dano psíquico e atordoado por 1 rodada; na resistência, metade do dano e sem condição."],["Armadura Arcana","1º • Abjuração • Padrão • Pessoal • Cena • 1 PM","+5 Defesa; cumulativo com outras magias, não com armaduras."],["Compreensão","1º • Adivinhação • Padrão • Toque • Cena • 1 PM","Entende textos e idiomas, comunica-se sem idioma comum e pode ouvir pensamentos de criatura tocada."],["Concentração de Combate","1º • Adivinhação • Livre • Pessoal • 1 rodada • 1 PM","Ao fazer ataque, rola dois dados e usa o melhor."],["Conjurar Monstro","1º • Convocação • Completa • Curto • Sustentada • 1 PM","Conjura monstro Pequeno de energia sob seu comando."],["Explosão de Chamas","1º • Evocação • Padrão • Pessoal • Instantânea • 1 PM","Leque de chamas causa 2d6 de fogo."],["Imagem Espelhada","1º • Ilusão • Padrão • Pessoal • Cena • 1 PM","Três cópias; +6 Defesa. Cada erro do inimigo remove uma imagem e reduz o bônus em 2."],["Seta Infalível de Talude","1º • Evocação • Padrão • Médio • Instantânea • 1 PM","Duas setas de energia, 1d4+1 essência cada."],["Toque Chocante","1º • Evocação • Padrão • Toque • Instantânea • 1 PM","2d8+2 eletricidade; armadura de metal impõe -5 no teste de resistência."]],Fani:[["Arma Mágica","1º • Transmutação • Padrão • Toque • Cena • 1 PM","+1 ataque e dano; pode usar atributo-chave de magia no ataque."],["Bênção","1º • Encantamento • Padrão • Curto • Cena • 1 PM","Aliados recebem +1 ataque e dano."],["Comando","1º • Encantamento • Padrão • Curto • 1 rodada • 1 PM","Ordem irresistível: Fuja, Largue, Pare, Senta ou Venha."],["Consagrar","1º • Evocação • Padrão • Longo • 1 dia • 1 PM","Maximiza PV curados por luz e dano de luz contra mortos-vivos na área."],["Controlar Plantas","1º • Transmutação • Padrão • Curto • Cena • 1 PM","Vegetação enreda criaturas e transforma área em terreno difícil."],["Curar Ferimentos","1º • Evocação • Padrão • Toque • Instantânea • 1 PM","Recupera 2d8+2 PV."]],Neo:[],Zuri:[["Armadura Arcana","1º • Abjuração • Padrão • Pessoal • Cena • 1 PM","Cria uma película protetora invisível, mas tangível, fornecendo +5 na Defesa. Esse bônus é cumulativo com outras magias, mas não com bônus fornecido por armaduras."],["Flecha de Luz","1º • Evocação • Padrão • Médio • Instantânea • 1 PM","Lança uma flecha luminosa contra o alvo, que sofre 2d8+2 pontos de dano de luz e fica ofuscado por 1 rodada. Passar no teste de resistência reduz o dano à metade e evita a condição."],["Raio do Enfraquecimento","1º • Necromancia • Padrão • Curto • Cena • 1 PM","Dispara um raio púrpura que drena as forças do alvo. Se falhar na resistência, fica fatigado. Se passar, fica vulnerável. Efeitos de magia não acumulam."],["Vitalidade Fantasma","1º • Necromancia • Padrão • Pessoal • Instantânea • 1 PM","Suga energia vital da terra, recebendo 2d10 pontos de vida temporários. Os PV temporários desaparecem ao final da cena."]]};
const base={
Hippion:{race:"Sereia",origin:"Marujo",className:"Bucaneiro",level:4,deity:"Oceano",money:678,hp:44,maxHp:44,mp:12,maxMp:12,def:19,fort:8,ref:6,will:6,init:6,per:6,speed:9,attrs:{FOR:3,DES:2,CON:4,INT:1,SAB:0,CAR:4},
attacks:[["Tridente do Nó Perfeito","+7","1d8+5","x2","Perfuração","Curto"],["Besta Leve","+4","1d8","crit 19","Perfuração","Médio"]],
powers:[["Acrobático","Você pode usar sua Destreza em vez de Força em testes de Atletismo. Além disso, terreno difícil não reduz seu deslocamento nem o impede de realizar investidas."],["Ataque Acrobático","Quando se aproxima de um inimigo com um salto ou pirueta (usando Atletismo ou Acrobacia para se mover) e o ataca no mesmo turno, recebe +2 nesse teste de ataque e na rolagem de dano."],["Ataque Pesado","Quando faz um ataque corpo a corpo com uma arma de duas mãos, pode pagar 1 PM. Se acertar, além do dano faz uma manobra derrubar ou empurrar contra o alvo como ação livre."],["Audácia","Quando faz um teste de perícia, pode gastar 2 PM para somar seu Carisma no teste. Não pode usar em testes de ataque."],["Canção dos Mares","Pode lançar duas: Amedrontar, Comando, Despedaçar, Enfeitiçar, Hipnotismo ou Sono (atributo-chave Carisma). Se aprender novamente uma delas, o custo diminui em 1 PM."],["Esquiva Sagaz","Recebe +1 na Defesa e em Reflexos. Aumenta em +1 a cada quatro níveis. Exige liberdade de movimentos."],["Estilo de Duas Mãos","Se usar arma corpo a corpo com as duas mãos, recebe +5 nas rolagens de dano. Não funciona com armas leves."],["Evasão","Quando sofre ataque que permite Reflexos para reduzir dano à metade, não sofre dano se passar. Exige liberdade de movimentos."],["Insolência","Soma seu Carisma na Defesa, limitado pelo nível. Exige liberdade de movimentos."],["Mestre do Tridente","Tridente é arma simples para você. Recebe +2 em dano com azagaias, lanças e tridentes."],["Mestre dos Mares","Pode falar com animais aquáticos e aprende Acalmar Animal, mas só contra criaturas aquáticas. Reaprender reduz custo em 1 PM."],["Passagem de Navio","Consegue transporte marítimo para você e aliados sem custos, desde que todos paguem com trabalho, passando em ao menos um teste de perícia adequado."],["Transformação Anfíbia","Respira debaixo d'água e tem cauda com natação 12m. Fora d'água, pernas e deslocamento 9m. Mais de um dia sem água impede recuperar PM com descanso."],["Tridente do Nó Perfeito — Arremesso Aprimorado","Ao arremessar o tridente, você pode usar FOR ou LUTA no lugar de DES para a jogada de ataque. Continuar gastando apenas 1 ação de movimento para arremessar."],["Tridente do Nó Perfeito — Precisão Além do Comum","Se o ataque acertar e o resultado exceder a CD da Defesa da criatura em 10 ou mais, ela sofre -2 na Defesa até o início do seu próximo turno."],["Tridente do Nó Perfeito — Abalado pela Investida","Se você acertar a mesma criatura que já sofreu o efeito acima antes de seu próximo turno, ela fica VULNERÁVEL ao seu próximo ataque. Criatura vulnerável cai no chão ou fica impedida de agir até o início do seu próximo turno (aplicado apenas uma vez por alvo até o fim do seu próximo turno)."]],
skills:{Acrobacia:6,Adestramento:null,Atletismo:5,Atuação:6,Cavalgar:4,Conhecimento:null,Cura:2,Diplomacia:6,Enganação:8,Fortitude:8,Furtividade:4,Guerra:null,Iniciativa:6,Intimidação:6,Intuição:2,Investigação:3,Jogatina:null,Ladinagem:null,Luta:7,Misticismo:null,Nobreza:null,"Ofício":null,Percepção:2,Pilotagem:6,Pontaria:4,Reflexos:7,Religião:null,Sobrevivência:2,Vontade:2},
trained:["Acrobacia","Enganação","Fortitude","Iniciativa","Luta","Pilotagem","Reflexos"],
items:[["Corda",1,"",1],["Mochila",0,"",1],["Saco de dormir",1,"",1],["Traje de viajante",0,"",1],["Besta Leve",1,"",1],["Tridente do Nó Perfeito",1,"",1],["Armadura de couro",2,"",1],["Gazua",2,"",4],["Poção de ódio",1,"",1],["Poção do amor",1,"",1],["Bálsamo",1,"2d4",3]]},

Malekir:{race:"Suraggel (Sulfure)",origin:"Aristocrata",className:"Arcanista",level:4,deity:"Wynna",money:448,hp:26,maxHp:26,mp:31,maxMp:31,def:19,fort:7,ref:8,will:9,init:6,per:6,speed:9,attrs:{FOR:1,DES:4,CON:3,INT:5,SAB:0,CAR:2},
attacks:[["Espada Curta","+3","1d6+1","crit 19","Perfuração","Curto"],["Bordão","+3","1d6+1 / 1d6+1","x2","Impacto","—"]],
powers:[["Arcano de Batalha","Soma o bônus do atributo-chave nas rolagens de dano para magias."],["Aumento de Atributo","Recebe +1 em um atributo. Pode escolher várias vezes, uma vez por patamar para o mesmo atributo."],["Bênção do Mana","Recebe +1 PM a cada nível ímpar."],["Caminho do Arcanista","É um mago, capaz de lançar magia através de seu estudo mágico."],["Conhecimento Mágico","Aprende duas magias de qualquer círculo que possa lançar. Pode escolher novamente."],["Herança de Pyra","Ao fazer teste de resistência ou atributo para remover condição, pode gastar 2 PM para rolar novamente."],["Herança Divina","É uma criatura do tipo espírito e recebe visão no escuro."],["Magias","Pode lançar magias arcanas de 1º círculo. A cada quatro níveis, libera círculo maior."],["Sangue Azul","Tem influência política suficiente para ser tratado com mais leniência pela guarda, conseguir audiência com nobre local etc."]],
skills:{Acrobacia:6,Adestramento:null,Atletismo:3,Atuação:4,Cavalgar:6,Conhecimento:9,Cura:2,Diplomacia:6,Enganação:6,Fortitude:7,Furtividade:6,Guerra:null,Iniciativa:8,Intimidação:4,Intuição:2,Investigação:9,Jogatina:null,Ladinagem:null,Luta:3,Misticismo:9,Nobreza:9,"Ofício":null,Percepção:6,Pilotagem:null,Pontaria:6,Reflexos:6,Religião:null,Sobrevivência:2,Vontade:4},
trained:["Conhecimento","Diplomacia","Enganação","Fortitude","Iniciativa","Investigação","Misticismo","Nobreza","Vontade"],
items:[["Pergaminho de Tamarindo",1,"",1],["Pergaminho relampago",1,"",1],["Consagração de magia",1,"",1],["1 besta",1,"",1],["20 flechas",1,"",1],["1 tocha",1,"",1],["Traje viajante",1,"",1],["Varinha arcana",2,"",1],["Joia de família T$300",1,"",1],["Casaco",1,"",1],["2 balsamos",1,"",1]]},

Neo:{race:"Trog",origin:"Cão de Briga",className:"Ladino",level:4,deity:"Hyninn",money:951,hp:41,maxHp:41,mp:16,maxMp:16,def:16,fort:7,ref:9,will:4,init:7,per:7,speed:9,attrs:{FOR:4,DES:3,CON:5,INT:0,SAB:2,CAR:0},
attacks:[["Mordida","+8","1d6+4","x2","Perfuração","Curto"],["Adaga Comum 1","+8","1d4+4","crit 19","Perfuração","Curto"],["Adaga Comum 2","+8","1d4+4","crit 19","Perfuração","Curto"],["Espada Curta","+8","1d6+4","crit 19","Perfuração","Curto"],["Adaga da Súplica","+8","1d6+4","crit 19","Perfuração","Curto"],["Besta Leve","+5","1d8","crit 19","Perfuração","Médio"]],
powers:[["Apostar com o Trapaceiro","Ao fazer teste de perícia, gasta 1 PM para apostar com Hyninn. Você e o mestre rolam 1d20; o mestre mantém o resultado secreto e você escolhe entre os dois."],["Ataque Furtivo","Uma vez por rodada, ao atingir criatura desprevenida, em alcance curto ou flanqueada, causa 1d6 extra. A cada dois níveis aumenta +1d6. Imune a crítico é imune."],["Cão de Briga","Na primeira vez por cena em que faz a ação agredir, pode fazer um ataque extra."],["Emboscar","Na primeira rodada de cada combate, pode gastar 2 PM para executar uma ação padrão adicional."],["Especialista","Escolhe perícias treinadas igual à Inteligência (mínimo 1). Em teste dessas perícias, gasta 1 PM para dobrar bônus de treinamento; não vale para ataque."],["Esquiva Sobrenatural","No 4º nível, nunca fica surpreendido."],["Evasão","A partir do 2º nível, ao passar em Reflexos para reduzir dano à metade, não sofre dano."],["Mau Cheiro","Ação padrão + 2 PM: gás fétido; criaturas em alcance curto, exceto trogs, fazem Fortitude contra veneno ou ficam enjoadas 1d6 rodadas."],["Mordida","Arma natural 1d6, crítico x2, perfuração. Ao atacar, pode gastar 1 PM para ataque extra com mordida."],["Reptiliano","Criatura monstro, visão no escuro, +1 Defesa já incluído e +5 Furtividade sem armadura/roupas pesadas."],["Sangue Frio","Sofre 1 dano adicional por dado de dano de frio."],["Sombra","+2 Furtividade, sem penalidade por deslocamento normal e penalidade por ações chamativas reduzida para -10. Requer Furtividade treinada."],["Velocidade Ladina","Uma vez por rodada, gasta 2 PM para fazer uma ação de movimento adicional."],["Adaga da Súplica — Retorno Certo","A adaga pode ser arremessada normalmente (Alcance 20 m). Enquanto estiver ao alcance (até 20 metros), basta estender a mão e a adaga retorna imediatamente para sua mão, em linha reta. Tudo que estiver no caminho sofre dano normal da adaga (1d6 perfuração) e pode realizar um teste de Reflexos para reduzir o dano à metade."],["Adaga da Súplica — Súplica das Sombras (1/dia)","Você se dissolve nas sombras, tornando-se invisível até atacar ou até o início do seu próximo turno (o que ocorrer primeiro). Ao atacar, faça um teste de Vontade para manter o efeito. CD base: 10. CD com Infortúnio: 15 (10 + 5). Sucesso: você permanece invisível até o início do seu próximo turno. Falha: a invisibilidade termina imediatamente após o ataque. Pode ser usada 1 vez por dia. Recuperada com um descanso longo."]],
skills:{Acrobacia:7,Adestramento:null,Atletismo:6,Atuação:2,Cavalgar:5,Conhecimento:null,Cura:4,Diplomacia:2,Enganação:4,Fortitude:7,Furtividade:9,Guerra:null,Iniciativa:7,Intimidação:2,Intuição:6,Investigação:2,Jogatina:4,Ladinagem:7,Luta:8,Misticismo:null,Nobreza:null,"Ofício":null,Percepção:6,Pilotagem:null,Pontaria:5,Reflexos:7,Religião:null,Sobrevivência:4,Vontade:4},
trained:["Acrobacia","Enganação","Fortitude","Furtividade","Iniciativa","Jogatina","Ladinagem","Luta","Percepção","Reflexos"],
items:[["Mochila",0],["Saco de dormir",1],["Traje de viajante",0],["Manoplas ou arma marcial",1],["Mordida",0],["Adaga Comum 1",1],["Adaga Comum 2",1],["Adaga da Súplica",1],["Espada Curta",1],["Besta Leve",1],["Virotes (20)",1],["Armadura de couro",2]]},

Fani:{race:"Dahllan",origin:"Herói Camponês",className:"Druida",level:4,deity:"Allihanna",money:542,hp:40,maxHp:40,mp:23,maxMp:23,def:16,fort:8,ref:7,will:10,init:8,per:8,speed:9,attrs:{FOR:2,DES:3,CON:3,INT:0,SAB:4,CAR:2},
attacks:[["Besta Leve","+7","1d8","crit 19","Perfuração","Médio"],["Arco Curto","+7","1d6","x3","Perfuração","Médio"],["Bordão","+4","1d6+2 / 1d6+2","x2","Impacto","—"]],
powers:[["Amiga das Plantas","Pode lançar Controlar Plantas com Sabedoria. Se aprender novamente, custo -1 PM."],["Armadura de Allihanna","Ação de movimento +1 PM: pele vira casca, +2 Defesa até fim da cena."],["Aspecto do Verão","Aprende magia de transmutação. Pode gastar 1 PM para arma em chamas: +1d6 fogo; cada acerto dá 1 PM temporário, até seu nível por cena."],["Caminho dos Ermos","No 2º nível, atravessa terreno difícil sem redução e CD para rastreá-la +10; apenas terrenos naturais."],["Compreender os Ermos","+2 Sobrevivência e pode usar Sabedoria em Adestramento."],["Coração Heroico","+3 PM; em novo patamar (5º, 11º, 17º), +3 PM."],["Dedo Verde","Aprende e pode lançar Controlar Plantas; se aprender novamente, custo -1 PM."],["Devoto Fiel","Torna-se devoto de deus disponível para druida e recebe dois poderes concedidos, em vez de um."],["Empatia Selvagem (x2)","Comunica-se com animais e usa Adestramento para mudar atitude e pedir favores. Ao receber novamente, +2 Adestramento."],["Força dos Penhascos","+2 Fortitude. Ao sofrer dano em solo/pedra, gasta PM limitado por Sabedoria e reduz 10 por PM."],["Forma Selvagem","Pode se transformar em animais; lista na página 63."],["Magias","Escolhe três escolas e lança magias divinas de 1º círculo delas; círculos maiores nos níveis 6, 10 e 14. Começa com duas e aprende uma a cada nível par; atributo-chave Sabedoria."]],
skills:{Acrobacia:3,Adestramento:8,Atletismo:4,Atuação:4,Cavalgar:5,Conhecimento:null,Cura:8,Diplomacia:4,Enganação:4,Fortitude:7,Furtividade:3,Guerra:null,Iniciativa:7,Intimidação:4,Intuição:8,Investigação:2,Jogatina:null,Ladinagem:null,Luta:4,Misticismo:null,Nobreza:null,"Ofício":null,Percepção:8,Pilotagem:null,Pontaria:7,Reflexos:5,Religião:null,Sobrevivência:10,Vontade:8},
trained:["Adestramento","Cura","Iniciativa","Intuição","Percepção","Pontaria","Sobrevivência","Vontade"],
items:[["Mochila",0],["Saco de dormir",1],["Traje de viajante",0],["Instrumentos de ofício",0],["Traje de Plebeu",0],["Arco Curto",2],["Bordão",2],["Besta Leve",1],["Armadura de couro",2],["Escudo Leve",1]]},

Zuri:{race:"Medusa",origin:"Artista",className:"Bardo",level:4,deity:"Wynna",money:637,hp:33,maxHp:33,mp:22,maxMp:22,def:16,fort:5,ref:8,will:4,init:6,per:4,speed:9,attrs:{FOR:1,DES:4,CON:3,INT:2,SAB:0,CAR:4},
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
const specialWeaponData={
  "Tridente do Nó Perfeito":{
    subtitle:"Item Mágico (Tridente) • Tormenta 20",
    description:"Forjado por um mestre artesão de Vitória, este tridente teve seu nó encantado após um feito de engenhosidade digno de lenda. A corda e o nó brilham com magia marítima e precisão.",
    type:"Tridente",category:"Item Mágico",damage:"1d8 (Perfuração)",properties:"Empunhada em Duas Mãos",weight:"2 kg",origin:"Vitória",level:"2",system:"Tormenta 20",
    abilities:[
      ["Arremesso Aprimorado","Ao arremessar o tridente, você pode usar FOR ou LUTA no lugar de DES para a jogada de ataque. Continuar gastando apenas 1 ação de movimento para arremessar."],
      ["Precisão Além do Comum","Se o ataque acertar e o resultado exceder o CD da Defesa da criatura em 10 ou mais, ela sofre -2 na Defesa até o início do seu próximo turno."],
      ["Abalado pela Investida","Se você acertar a mesma criatura que já sofreu o efeito acima antes de seu próximo turno, ela fica VULNERÁVEL ao seu próximo ataque. Criatura vulnerável cai no chão ou fica impedida de agir até o início do seu próximo turno (aplicado apenas uma vez por alvo até o fim do seu próximo turno)."]
    ],
    quote:"Um nó perfeito não é apenas técnica. É intenção, força e propósito alinhados. — Mestre Hadrin, Artesão dos Ventos e das Correntes",footer:"Sistema: Tormenta 20 • Item mágico • Tridente"
  },
  "Adaga da Súplica":{
    subtitle:"Relíquia Roubada da Guilda de Valkaria",
    description:"Forjada nas sombras da própria Guilda, esta adaga simples aos olhos incautos revela segredos esquecidos quando o olhar certo a encontra.",
    type:"Adaga",category:"Relíquia",damage:"1d6 (Perfuração)",properties:"Leve, Fina, Arremessável (20 m)",weight:"0,5 kg",origin:"Guilda de Ladrões de Valkaria",recommended:"5+",
    abilities:[
      ["Passiva: Retorno Certo","A adaga pode ser arremessada normalmente (Alcance 20 m). Enquanto estiver ao alcance (até 20 metros), basta estender a mão e a adaga retorna imediatamente para sua mão, em linha reta. Tudo que estiver no caminho sofre dano normal da adaga (1d6 perfuração) e pode realizar um teste de Reflexos para reduzir o dano à metade."],
      ["Ativa (1/dia): Súplica das Sombras","Você se dissolve nas sombras, tornando-se invisível até atacar ou até o início do seu próximo turno (o que ocorrer primeiro). Ao atacar, faça um teste de VONTADE para manter o efeito. CD BASE: 10. CD COM INFORTÚNIO: 15 (10 + 5). Sucesso: você permanece invisível até o início do seu próximo turno. Falha: a invisibilidade termina imediatamente após o ataque. Pode ser usada 1 vez por dia. Recuperada com um descanso longo."]
    ],
    quote:"Aqueles que a deixam partir, sempre a vêem retornar. — S.",footer:"Sistema: Tormenta 20 • Item de aventura • Nível recomendado: 5+"
  }
};
const itemCatalog=[
 {name:"Luva de Ferro",cat:"Esotérico",price:"T$ 150",spaces:1,data:"+1 bônus",desc:"Dedais interligados por correntes.",effect:"Aumenta em +1 os bônus concedidos por suas magias arcanas pessoais que dão bônus na Defesa ou em testes de resistência."},
 {name:"Adaga",cat:"Arma simples",price:"T$ 2",spaces:1,data:"1d4 • crítico 19 • curto • perfuração",desc:"Faca afiada, facilmente escondida. Pode usar Destreza no ataque e pode ser arremessada.",effect:"+5 em Ladinagem para ocultá-la."},
 {name:"Espada curta",cat:"Arma simples",price:"T$ 10",spaces:1,data:"1d6 • crítico 19 • perfuração",desc:"Espada comum, usada por guardas e como arma secundária."},
 {name:"Foice",cat:"Arma simples",price:"T$ 4",spaces:1,data:"1d6 • crítico x3 • corte",desc:"Ferramenta agrícola com lâmina curva.",effect:"Arma tradicional de druidas."},
 {name:"Clava",cat:"Arma simples",price:"T$ 0",spaces:1,data:"1d6 • crítico x2 • impacto",desc:"Pedaço de madeira usado como arma.",effect:"Preço zero."},
 {name:"Lança",cat:"Arma simples",price:"T$ 2",spaces:1,data:"1d6 • crítico x2 • curto • perfuração",desc:"Haste de madeira com ponta afiada.",effect:"Pode ser arremessada."},
 {name:"Maça",cat:"Arma simples",price:"T$ 12",spaces:1,data:"1d8 • crítico x2 • impacto",desc:"Bastão com peso cheio de protuberâncias na ponta."},
 {name:"Bordão",cat:"Arma simples",price:"T$ 0",spaces:2,data:"1d6/1d6 • crítico x2 • impacto",desc:"Cajado prático, muito usado por viajantes e camponeses.",effect:"Arma dupla."},
 {name:"Pique",cat:"Arma simples",price:"T$ 2",spaces:2,data:"1d8 • crítico x2 • perfuração",desc:"Lança muito longa.",effect:"Arma alongada."},
 {name:"Tacape",cat:"Arma simples",price:"T$ 0",spaces:2,data:"1d10 • crítico x2 • impacto",desc:"Versão maior ou com pregos de uma clava."},
 {name:"Azagaia",cat:"Arma simples",price:"T$ 1",spaces:1,data:"1d6 • crítico x2 • médio • perfuração",desc:"Lança leve e flexível, própria para arremesso.",effect:"Pode ser usada corpo a corpo, mas com –5 no ataque."},
 {name:"Besta leve",cat:"Arma simples",price:"T$ 35",spaces:1,data:"1d8 • crítico 19 • médio • perfuração",desc:"Besta de madeira que dispara virotes.",effect:"Recarregar é uma ação de movimento."},
 {name:"Virotes (20)",cat:"Munição",price:"T$ 2",spaces:1,data:"20 virotes",desc:"Aljava com 20 setas de madeira.",effect:"Recarregar besta leve é ação de movimento; besta pesada, ação padrão."},
 {name:"Funda",cat:"Arma simples",price:"T$ 0",spaces:1,data:"1d4 • crítico x2 • médio • impacto",desc:"Tira de couro para arremessar pedras.",effect:"Recarregar é ação de movimento; aplica Força ao dano."},
 {name:"Pedras (20)",cat:"Munição",price:"T$ 0,5",spaces:1,data:"20 pedras",desc:"Saco com 20 pedras polidas."},
 {name:"Arco curto",cat:"Arma simples",price:"T$ 30",spaces:2,data:"1d6 • crítico x3 • médio • perfuração",desc:"Arco usado para caça e guerra.",effect:"Pode ser usado montado."},
 {name:"Flechas (20)",cat:"Munição",price:"T$ 1",spaces:1,data:"20 flechas",desc:"Aljava com 20 flechas.",effect:"Recarregar arco é ação livre."},
 {name:"Machadinha",cat:"Arma marcial",price:"T$ 6",spaces:1,data:"1d6 • crítico x3 • curto • corte",desc:"Ferramenta útil para cortar madeira e inimigos.",effect:"Pode ser arremessada."},
 {name:"Cimitarra",cat:"Arma marcial",price:"T$ 15",spaces:1,data:"1d6 • crítico 18 • corte",desc:"Espada de lâmina curva e afiada.",effect:"Ágil."},
 {name:"Espada longa",cat:"Arma marcial",price:"T$ 15",spaces:1,data:"1d8 • crítico 19 • corte",desc:"Espada de dois gumes, típica de soldados e guerreiros."},
 {name:"Florete",cat:"Arma marcial",price:"T$ 20",spaces:1,data:"1d6 • crítico 18 • perfuração",desc:"Lâmina leve e fina, muito precisa.",effect:"Ágil."},
 {name:"Machado de batalha",cat:"Arma marcial",price:"T$ 10",spaces:1,data:"1d8 • crítico x3 • corte",desc:"Machado adaptado para combate."},
 {name:"Mangual",cat:"Arma marcial",price:"T$ 8",spaces:1,data:"1d8 • crítico x2 • impacto",desc:"Haste metálica ligada a uma corrente com esfera de aço.",effect:"Versátil; +2 para desarmar."},
 {name:"Martelo de guerra",cat:"Arma marcial",price:"T$ 12",spaces:1,data:"1d8 • crítico x3 • impacto",desc:"Ferramenta adaptada para combate."},
 {name:"Picareta",cat:"Arma marcial",price:"T$ 8",spaces:1,data:"1d6 • crítico x4 • perfuração",desc:"Ferramenta de mineradores adaptada para combate."},
 {name:"Tridente",cat:"Arma marcial",price:"T$ 15",spaces:1,data:"1d8 • crítico x2 • curto • perfuração",desc:"Lança de três pontas, favorita de povos marinhos e gladiadores.",effect:"Versátil; +2 para derrubar. Pode ser arremessado."},
 {name:"Alabarda",cat:"Arma marcial",price:"T$ 10",spaces:2,data:"1d10 • crítico x3 • corte/perfuração",desc:"Haste de 2m com lâmina de machado.",effect:"Alongada."},
 {name:"Alfange",cat:"Arma marcial",price:"T$ 75",spaces:2,data:"2d4 • crítico 18 • corte",desc:"Versão maior da cimitarra, com lâmina larga e curva."},
 {name:"Gadanho",cat:"Arma marcial",price:"T$ 18",spaces:2,data:"2d4 • crítico x4 • corte",desc:"Versão maior da foice, usada com as duas mãos."},
 {name:"Lança montada",cat:"Arma marcial",price:"T$ 10",spaces:2,data:"1d8 • crítico x3 • perfuração",desc:"Lança alongada própria para combate montado.",effect:"Em investida montada causa +2d8; pode ser usada com uma mão montado."},
 {name:"Machado de guerra",cat:"Arma marcial",price:"T$ 20",spaces:2,data:"1d12 • crítico x3 • corte",desc:"Machado imenso de lâmina dupla."},
 {name:"Marreta",cat:"Arma marcial",price:"T$ 20",spaces:2,data:"3d4 • crítico x2 • impacto",desc:"Haste resistente com pesada cabeça de metal ou pedra."},
 {name:"Montante",cat:"Arma marcial",price:"T$ 50",spaces:2,data:"2d6 • crítico 19 • corte",desc:"Espada enorme e pesada, com cerca de 1,5m."},
 {name:"Arco longo",cat:"Arma marcial",price:"T$ 100",spaces:2,data:"1d8 • crítico x3 • médio • perfuração",desc:"Arco de guerra alto e reforçado.",effect:"Aplica Força ao dano; não pode ser usado montado."},
 {name:"Besta pesada",cat:"Arma marcial",price:"T$ 50",spaces:2,data:"1d12 • crítico 19 • médio • perfuração",desc:"Versão maior e mais potente da besta leve.",effect:"Recarregar é ação padrão."},
 {name:"Chicote",cat:"Arma exótica",price:"T$ 2",spaces:1,data:"1d3 • crítico x2 • corte",desc:"Arma que pode atacar a até 4,5m.",effect:"Ágil e versátil; +2 para derrubar ou desarmar."},
 {name:"Espada bastarda",cat:"Arma exótica",price:"T$ 35",spaces:1,data:"1d10/1d12 • crítico 19 • corte",desc:"Espada maior e mais pesada que a longa.",effect:"Adaptável; pode ser usada como marcial de duas mãos."},
 {name:"Katana",cat:"Arma exótica",price:"T$ 100",spaces:1,data:"1d8/1d10 • crítico 19 • corte",desc:"Espada tradicional de lâmina levemente curva.",effect:"Adaptável e ágil; pode ser usada como marcial de duas mãos."},
 {name:"Machado anão",cat:"Arma exótica",price:"T$ 30",spaces:1,data:"1d10 • crítico x3 • corte",desc:"Machado grande tradicional dos anões.",effect:"Pode ser usado como arma marcial de duas mãos."},
 {name:"Corrente de espinhos",cat:"Arma exótica",price:"T$ 25",spaces:2,data:"2d4/2d4 • crítico 19 • corte",desc:"Corrente com espinhos que pode alcançar 4,5m.",effect:"Ágil, dupla e versátil; +2 para derrubar ou desarmar."},
 {name:"Machado táurico",cat:"Arma exótica",price:"T$ 50",spaces:2,data:"2d8 • crítico x3 • corte",desc:"Haste comprida com lâmina extremamente grossa.",effect:"Desbalanceada."},
 {name:"Rede",cat:"Arma exótica",price:"T$ 20",spaces:1,data:"sem dano • curto",desc:"Ao acertar, deixa a vítima enredada em vez de causar dano.",effect:"Deslocamento pela metade, não corre/investe e sofre –2 Defesa e ataques."},
 {name:"Pistola",cat:"Arma de fogo",price:"T$ 250",spaces:1,data:"2d6 • crítico 19/x3 • curto • perfuração",desc:"Arma de fogo comum.",effect:"Recarregar é ação padrão."},
 {name:"Mosquete",cat:"Arma de fogo",price:"T$ 500",spaces:2,data:"2d8 • crítico 19/x3 • médio • perfuração",desc:"Arma de fogo de uso difícil e grande poder.",effect:"Recarregar é ação padrão."},
 {name:"Balas (20)",cat:"Munição",price:"T$ 20",spaces:1,data:"20 balas",desc:"Bolsa com 20 balas e pólvora."},
 {name:"Armadura acolchoada",cat:"Armadura leve",price:"T$ 5",spaces:2,data:"+1 Defesa • penalidade 0",desc:"Túnica acolchoada de linho ou lã.",effect:"+2 em Fortitude."},
 {name:"Armadura de couro",cat:"Armadura leve",price:"T$ 20",spaces:2,data:"+2 Defesa • penalidade 0",desc:"Peitoral de couro curtido e demais partes de couro flexível."},
 {name:"Couro batido",cat:"Armadura leve",price:"T$ 35",spaces:2,data:"+3 Defesa • penalidade –1",desc:"Versão mais pesada da armadura de couro, reforçada com rebites."},
 {name:"Gibão de peles",cat:"Armadura leve",price:"T$ 25",spaces:2,data:"+4 Defesa • penalidade –3",desc:"Armadura formada por várias camadas de peles e couro."},
 {name:"Couraça",cat:"Armadura leve",price:"T$ 500",spaces:2,data:"+5 Defesa • penalidade –4",desc:"Placa metálica que protege peito e costas sobre couro."},
 {name:"Brunea",cat:"Armadura pesada",price:"T$ 50",spaces:5,data:"+5 Defesa • penalidade –2",desc:"Colete de couro coberto com plaquetas de metal."},
 {name:"Cota de malha",cat:"Armadura pesada",price:"T$ 150",spaces:5,data:"+6 Defesa • penalidade –2",desc:"Longa veste de anéis metálicos interligados."},
 {name:"Loriga segmentada",cat:"Armadura pesada",price:"T$ 250",spaces:5,data:"+7 Defesa • penalidade –3",desc:"Armadura composta por tiras horizontais de metal."},
 {name:"Meia armadura",cat:"Armadura pesada",price:"T$ 600",spaces:5,data:"+8 Defesa • penalidade –4",desc:"Cota de malha reforçada com placas de metal."},
 {name:"Armadura completa",cat:"Armadura pesada",price:"T$ 3.000",spaces:5,data:"+10 Defesa • penalidade –5",desc:"Armadura de placas que cobre o corpo inteiro.",effect:"Feita sob medida; adaptar a novo usuário custa T$ 200."},
 {name:"Escudo leve",cat:"Escudo",price:"T$ 5",spaces:1,data:"+1 Defesa • penalidade –1",desc:"Escudo de madeira amarrado ao antebraço.",effect:"Deixa a mão livre para carregar objeto, mas não para manusear arma."},
 {name:"Escudo pesado",cat:"Escudo",price:"T$ 15",spaces:2,data:"+2 Defesa • penalidade –2",desc:"Escudo de aço preso ao antebraço.",effect:"Impede usar aquela mão."},
 {name:"Corda",cat:"Equipamento",price:"T$ 1",spaces:1,data:"10 metros",desc:"Rolo de corda de cânhamo.",effect:"+5 em Atletismo para descer buracos/muros; nó especial exige Destreza CD 15."},
 {name:"Mochila",cat:"Equipamento",price:"T$ 2",spaces:0,data:"—",desc:"Bolsa de lona com tiras para carregar nas costas.",effect:"Não conta como item vestido."},
 {name:"Mochila de aventureiro",cat:"Equipamento",price:"T$ 50",spaces:0,data:"+2 capacidade",desc:"Mochila de couro resistente, cheia de bolsos.",effect:"Aumenta a capacidade de carga em 2 espaços; ela própria não ocupa espaço."},
 {name:"Saco de dormir",cat:"Equipamento",price:"T$ 1",spaces:1,data:"—",desc:"Colchão com cobertura fina, útil para acampamentos.",effect:"Dormir sem saco de dormir e acampamento reduz a recuperação de PV e PM."},
 {name:"Traje de viajante",cat:"Vestuário",price:"T$ 10",spaces:0,data:"—",desc:"Traje básico de viagem.",effect:"Não ocupa espaço."},
 {name:"Gazua",cat:"Ferramenta",price:"T$ 5",spaces:1,data:"Ladinagem",desc:"Barra fina de ferro com ponta torta ou em gancho.",effect:"Sem gazua, –5 em Ladinagem para abrir fechaduras."},
 {name:"Estojo de disfarces",cat:"Ferramenta",price:"T$ 50",spaces:1,data:"Enganação",desc:"Cosméticos, tintas de cabelo e próteses simples.",effect:"Sem o estojo, –5 em Enganação para disfarces."},
 {name:"Instrumentos de Ofício",cat:"Ferramenta",price:"T$ 30",spaces:1,data:"Ofício",desc:"Conjunto específico para uma perícia de Ofício.",effect:"Sem os instrumentos, –5 nessa perícia."},
 {name:"Luneta",cat:"Ferramenta",price:"T$ 100",spaces:1,data:"Percepção",desc:"Cilindro metálico com duas lentes.",effect:"+5 em Percepção para observar coisas em alcance longo ou além."},
 {name:"Maleta de medicamentos",cat:"Ferramenta",price:"T$ 50",spaces:1,data:"Cura",desc:"Caixa com ervas, unguentos, bandagens e materiais médicos.",effect:"Sem ela, –5 em Cura."},
 {name:"Sela",cat:"Ferramenta",price:"T$ 20",spaces:1,data:"Cavalgar",desc:"Peça de couro e pelego com arreios para montaria.",effect:"Sem sela, –5 em Cavalgar; usada no animal, não ocupa espaço do personagem."},
 {name:"Ácido",cat:"Alquímico",price:"T$ 10",spaces:0.5,data:"2d4 ácido",desc:"Frasco de ácido corrosivo.",effect:"Dano conforme a regra do preparado; use o teste de resistência indicado no livro."},
 {name:"Elixir do Amor",cat:"Alquímico — Preparado",price:"T$ 100",spaces:0.5,data:"Vontade CD Car",desc:"Líquido adocicado que provoca paixão.",effect:"Um humanoide que beber fica apaixonado pela primeira criatura que enxergar (condição enfeitiçado; Vontade CD Car anula). O efeito dura 1d3 dias."},
 {name:"Bálsamo restaurador",cat:"Alquímico",price:"T$ 10",spaces:0.5,data:"2d4 PV",desc:"Pasta verde e fedorenta feita de ervas medicinais.",effect:"Consumir é uma ação completa e recupera 2d4 PV."},
 {name:"Bomba",cat:"Alquímico",price:"T$ 50",spaces:0.5,data:"—",desc:"Explosivo alquímico para uso em combate.",effect:"Preparado alquímico do Livro Básico."},
 {name:"Essência de mana",cat:"Alquímico",price:"T$ 50",spaces:0.5,data:"1d4 PM",desc:"Poção feita de ervas raras e compostos alquímicos.",effect:"Beber é uma ação padrão e recupera 1d4 PM."},
 {name:"Fogo alquímico",cat:"Alquímico",price:"T$ 10",spaces:0.5,data:"1d6 fogo/rodada",desc:"Líquido inflamável que se espalha ao ser arremessado.",effect:"Alvo em chamas sofre dano até apagar o fogo."},
 {name:"Pó do desaparecimento",cat:"Alquímico",price:"T$ 100",spaces:0.5,data:"invisibilidade",desc:"Pó alquímico usado para ocultar criaturas.",effect:"Preparado alquímico do Livro Básico."},
 {name:"Óleo",cat:"Equipamento",price:"T$ 0,1",spaces:0.5,data:"1d6 fogo extra",desc:"Frasco com óleo inflamável para lampião.",effect:"Se a criatura sofrer dano de fogo até o fim do seu próximo turno, sofre 1d6 extra e fica em chamas."},
 {name:"Tocha",cat:"Equipamento",price:"T$ 0,1",spaces:1,data:"luz 9m • 1 cena • 1d4+1 fogo",desc:"Bastão de madeira com combustível na ponta.",effect:"Acender é ação padrão; pode ser usada como arma simples leve."},
 {name:"Água benta",cat:"Equipamento",price:"T$ 10",spaces:0.5,data:"2d10 luz",desc:"Água sagrada produzida com Abençoar Alimentos.",effect:"Contra morto-vivo, demônio ou diabo em alcance curto: 2d10 luz; Reflexos CD Sab reduz à metade."},
 {name:"Algemas",cat:"Equipamento",price:"T$ 15",spaces:1,data:"CD 30 Acrobacia / CD 25 Força",desc:"Par de algemas para criaturas Médias.",effect:"Pode prender pulsos; escapar exige teste ou as chaves."},
 {name:"Arpéu",cat:"Equipamento",price:"T$ 5",spaces:1,data:"Pontaria CD 15",desc:"Gancho de aço amarrado a uma corda.",effect:"Subir com ajuda de corda fornece +5 em Atletismo."},
 {name:"Bandoleira de poções",cat:"Equipamento",price:"T$ 20",spaces:1,data:"ação livre",desc:"Cinto com bolsos para pequenos frascos.",effect:"Permite sacar itens alquímicos e poções como ação livre."},
 {name:"Barraca",cat:"Equipamento",price:"T$ 10",spaces:1,data:"+2 Sobrevivência",desc:"Barraca de lona para duas pessoas.",effect:"Conta como saco de dormir para duas pessoas e fornece +2 em Sobrevivência para acampar."},
 {name:"Lampião",cat:"Equipamento",price:"T$ 7",spaces:1,data:"luz 15m • 1 cena",desc:"Cilindro com chama alimentada por óleo.",effect:"Acender é ação padrão; dura uma cena."},
 {name:"Organizador de pergaminhos",cat:"Equipamento",price:"T$ 25",spaces:1,data:"ação livre",desc:"Estojo de madeira ou couro rígido.",effect:"Vestido, permite sacar pergaminhos como ação livre."},
 {name:"Pé de cabra",cat:"Equipamento",price:"T$ 2",spaces:1,data:"+5 Força",desc:"Barra de ferro para alavancar objetos.",effect:"+5 em testes de Força para abrir portas, janelas e baús; pode ser usado como clava."},
 {name:"Símbolo sagrado",cat:"Equipamento",price:"T$ 5",spaces:1,data:"+1 resistência",desc:"Medalhão com símbolo de uma divindade.",effect:"Vestido ou empunhado, se for devoto do deus, fornece +1 em testes de resistência."},
 {name:"Vara de madeira (3m)",cat:"Equipamento",price:"T$ 0,2",spaces:1,data:"3 metros",desc:"Haste de madeira longa.",effect:"Útil para alcançar pontos distantes, mas frágil para servir como arma."},
 {name:"Alaúde élfico",cat:"Ferramenta",price:"T$ 300",spaces:1,data:"Inspiração",desc:"Alaúde de alta qualidade que gera notas vívidas.",effect:"Permite usar Inspiração como ação de movimento; conta como instrumento musical."},
 {name:"Coleção de livros",cat:"Ferramenta",price:"T$ 75",spaces:1,data:"+1 perícia",desc:"Pequena coleção de tomos sobre um assunto.",effect:"+1 em Conhecimento, Guerra, Misticismo, Nobreza ou Religião."},
 {name:"Equipamento de viagem",cat:"Ferramenta",price:"T$ 10",spaces:1,data:"Sobrevivência",desc:"Saco com pederneira, panelas, talheres, anzol, linha e pequena pá.",effect:"Sem ele, –5 em Sobrevivência para acampar; não inclui saco de dormir ou barraca."},
 {name:"Flauta mística",cat:"Ferramenta",price:"T$ 150",spaces:1,data:"+1 CD de magia",desc:"Instrumento com runas e gemas místicas.",effect:"Bardo recebe +1 na CD das magias lançadas com ela; conta como instrumento musical."},
 {name:"Instrumento musical",cat:"Ferramenta",price:"T$ 35",spaces:1,data:"Atuação",desc:"Instrumento típico como bandolim, flauta ou lira.",effect:"Segue as regras de instrumentos musicais."},
 {name:"Tambor das profundezas",cat:"Ferramenta",price:"T$ 80",spaces:1,data:"alcance dobrado",desc:"Tambor anão de sons graves e retumbantes.",effect:"Dobra alcance de Inspiração e Músicas de Bardo; conta como instrumento musical."},
 {name:"Andrajos de aldeão",cat:"Vestuário",price:"T$ 1",spaces:1,data:"+2 Investigação",desc:"Roupas típicas de camponês.",effect:"+2 Investigação para interrogar; se tiver Aparência Inofensiva, +2 na CD. –2 em perícias de Carisma contra pessoas que ligam para classe social."},
 {name:"Bandana",cat:"Vestuário",price:"T$ 5",spaces:1,data:"+1 Intimidação",desc:"Lenço típico de bandidos e piratas.",effect:"+1 em Intimidação."},
 {name:"Botas reforçadas",cat:"Vestuário",price:"T$ 20",spaces:1,data:"+1,5m",desc:"Botas grossas e resistentes.",effect:"Aumentam deslocamento em +1,5m quando ele for reduzido por terreno difícil."},
 {name:"Camisa bufante",cat:"Vestuário",price:"T$ 25",spaces:1,data:"+1 Atuação",desc:"Blusa colorida com mangas e golas longas.",effect:"+1 em Atuação."},
 {name:"Capa esvoaçante",cat:"Vestuário",price:"T$ 25",spaces:1,data:"+1 Enganação",desc:"Capa de seda de movimentos amplos.",effect:"+1 em Enganação."},
 {name:"Capa pesada",cat:"Vestuário",price:"T$ 15",spaces:1,data:"+1 Fortitude",desc:"Capa grossa de couro.",effect:"+1 em Fortitude."},
 {name:"Gorro de ervas",cat:"Vestuário",price:"T$ 75",spaces:1,data:"+1 Vontade",desc:"Chapéu preenchido com ervas para concentração.",effect:"+1 em Vontade."},
 {name:"Luva de pelica",cat:"Vestuário",price:"T$ 5",spaces:1,data:"+1 Ladinagem",desc:"Luvas delicadas que preservam o tato.",effect:"+1 em Ladinagem."},
 {name:"Manopla",cat:"Vestuário",price:"T$ 10",spaces:1,data:"dano desarmado letal",desc:"Luva metálica para socos mais perigosos.",effect:"Ataques desarmados tornam-se letais; conta como arma para melhorias e encantos."},
 {name:"Manto camuflado",cat:"Vestuário",price:"T$ 12",spaces:1,data:"+2 Furtividade",desc:"Manto camuflado para um tipo específico de terreno.",effect:"+2 em Furtividade no terreno correto."},
 {name:"Manto eclesiástico",cat:"Vestuário",price:"T$ 20",spaces:1,data:"+1 Religião",desc:"Manto típico de igrejas e templos.",effect:"+1 em Religião."},
 {name:"Robe místico",cat:"Vestuário",price:"T$ 50",spaces:1,data:"+1 Misticismo",desc:"Manto longo com temas arcanos.",effect:"+1 em Misticismo."},
 {name:"Sapatos de camurça",cat:"Vestuário",price:"T$ 8",spaces:1,data:"—",desc:"Calçados leves e resistentes."},
 {name:"Tabardo",cat:"Vestuário",price:"T$ 10",spaces:1,data:"—",desc:"Peça de roupa usada sobre outras vestimentas."},
 {name:"Traje da corte",cat:"Vestuário",price:"T$ 100",spaces:1,data:"Diplomacia",desc:"Traje refinado para ambientes da nobreza."},
 {name:"Veste de seda",cat:"Vestuário",price:"T$ 25",spaces:1,data:"—",desc:"Roupa elegante de seda."},
 {name:"Mochila de aventureiro",cat:"Equipamento",price:"T$ 50",spaces:0,data:"+2 carga",desc:"Mochila resistente cheia de bolsos.",effect:"+2 espaços de capacidade; não ocupa espaço."},

 {name:"Essência de mana",cat:"Alquímico",price:"T$ 50",spaces:0.5,data:"1d4 PM",desc:"Poção de ervas raras e compostos alquímicos.",effect:"Ação padrão para beber e recuperar 1d4 PM."},
 {name:"Abraço da Noite",cat:"Alimentação divina",price:"T$ 3",spaces:0,data:"benefício até o fim do dia",desc:"Doce gelado dedicado a Tenebra.",effect:"Permite usar Carícia Sombria uma vez; se já possuir, pode usá-la causando 4d6 trevas."},
 {name:"Assado de Entranhas",cat:"Alimentação divina",price:"T$ 2",spaces:0,data:"+1 dano corpo a corpo",desc:"Assado que desperta instintos primais.",effect:"Uma vez até o fim do dia, +1 nas rolagens de dano corpo a corpo por uma cena."},
 {name:"Bênção dos Mares",cat:"Alimentação divina",price:"T$ 4",spaces:0,data:"natação",desc:"Festival de ostras ligado a Oceano.",effect:"Até o fim do dia, pode adquirir deslocamento de natação igual ao deslocamento por uma cena; se já tiver, +3m."},
 {name:"Bolinho de Jade",cat:"Alimentação divina",price:"T$ 4",spaces:0,data:"Kiai Divino",desc:"Bolinho de ervas ligado a Lin-Wu.",effect:"Pode usar Kiai Divino uma vez; se já possuir, uma vez sem pagar PM."},
 {name:"Bombas de Saber",cat:"Alimentação divina",price:"T$ 4",spaces:0,data:"treinamento",desc:"Doce recheado criado para devotos de Tanna-Toh.",effect:"Uma vez até o fim do dia, recebe benefícios de ser treinado numa perícia para um teste."},
 {name:"Caldo de Lena",cat:"Alimentação divina",price:"T$ 3",spaces:0,data:"+2 PV em cura de luz",desc:"Sobremesa de milho dedicada a Lena.",effect:"Quando recebe cura mágica de luz, recupera +2 PV."},
 {name:"Coragem de Sangue",cat:"Alimentação divina",price:"T$ 4",spaces:0,data:"ataque extra",desc:"Doce, especiarias e vinho servidos em chamas.",effect:"Uma vez até o fim do dia, ao fazer a ação agredir, pode executar um ataque extra."},
 {name:"Deleite Mágico",cat:"Alimentação divina",price:"T$ 18",spaces:0,data:"magia 1º círculo por 2 PM",desc:"Folhado mágico ligado a Wynna.",effect:"Escolha uma magia de 1º círculo; até o fim do dia, lance-a uma vez sem aprimoramentos por 2 PM."},
 {name:"Joia do Deserto",cat:"Alimentação divina",price:"T$ 5",spaces:0,data:"+1d6 fogo",desc:"Doce de tâmaras dedicado a Azgher.",effect:"Uma vez até o fim do dia, arma corpo a corpo de corte recebe +1d6 fogo, ou +2d6 contra mortos-vivos."},
 {name:"Justos de Khalmyr",cat:"Alimentação divina",price:"T$ 2",spaces:0,data:"escolher 10",desc:"Biscoito criado para devotos de Khalmyr.",effect:"Até o fim do dia, ao fazer teste de perícia, pode gastar o efeito para escolher 10."},
 {name:"Manjar da Paz",cat:"Alimentação divina",price:"T$ 7",spaces:0,data:"pior d20",desc:"Delícia compartilhada pelos devotos de Marah.",effect:"Uma vez no dia, quando criatura em alcance curto atacar, ela rola dois dados e usa o pior."},
 {name:"Ouro de Dragão",cat:"Alimentação divina",price:"T$ 6",spaces:0,data:"+1 ataques",desc:"Creme doce reservado aos sacerdotes de Kallyadranoch.",effect:"Uma vez até o fim do dia, +1 em testes de ataque por uma cena."},
 {name:"Ovos de Raposa",cat:"Alimentação divina",price:"T$ 3",spaces:0,data:"rerrolar Enganação/Ladinagem",desc:"Ovos recheados ligados a Hyninn.",effect:"Uma vez no dia, rerrole um teste recém-feito de Enganação ou Ladinagem."},
 {name:"Pão de Thwor",cat:"Alimentação divina",price:"T$ 1",spaces:0,data:"rerrolar Fortitude/Força",desc:"Pão que simboliza a tenacidade duyshidakk.",effect:"Uma vez até o fim do dia, rerrole teste de Fortitude ou perícia baseada em Força."},
 {name:"Renascer gentil",cat:"Alimentação divina",price:"T$ 30",spaces:0,data:"benefício divino",desc:"Prato especial de alimentação divina.",effect:"Benefício conforme a descrição de Deuses de Arton."}
];

function catalogMatch(name){
 const n=String(name).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
 if(n==="balsamo"||n==="balsamo restaurador") return itemCatalog.find(x=>x.name==="Bálsamo restaurador");
 return itemCatalog.find(x=>x.name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()===n);
}

const conditionCatalog=[["⛓️","Preso"],["⚔️","Flanqueado"],["☠️","Envenenado"],["🩸","Sangrando"],["🌀","Atordoado"],["💤","Caído"],["😵","Inconsciente"],["👁️","Cego"],["🔇","Surdo"],["🧱","Lento"],["🪶","Ofuscado"],["🔒","Paralisado"],["😨","Apavorado"],["😰","Abalado"],["😵‍💫","Confuso"],["💘","Enfeitiçado"],["🤢","Enjoado"],["🥱","Fatigado"],["🥀","Exausto"],["💢","Debilitado"],["💪","Fraco"],["🌫️","Esmorecido"],["😶‍🌫️","Fascinado"],["😤","Frustrado"],["😳","Pasmo"],["🛡️","Vulnerável"],["🪨","Alquebrado"],["🦶","Desprevenido"]];

const fixedCharacterImages={
  Malekir:"data:image/webp;base64,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",
  Hippion:"data:image/webp;base64,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",
  Zuri:"data:image/webp;base64,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",
  Fani:"data:image/webp;base64,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",
  Neo:"data:image/webp;base64,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"
};



const activeEffectDefs={
  Hippion:{
    "Estilo de Duas Mãos":{type:"power",label:"Estilo de Duas Mãos",summary:"+5 nas rolagens de dano com arma corpo a corpo de duas mãos.",attackFilter:"twohand",damageBonus:5},
    "Mestre do Tridente":{type:"power",label:"Mestre do Tridente",summary:"+2 dano com azagaias, lanças e tridentes.",attackFilter:"trident",damageBonus:2},
    "Ataque Acrobático":{type:"power",label:"Ataque Acrobático",summary:"+2 no ataque e +2 no dano quando a condição do poder for cumprida.",attackBonus:2,damageBonus:2}
  },
  Malekir:{
    "Luva de Ferro":{type:"item",label:"Luva de Ferro",summary:"Aumenta em +1 os bônus de Defesa ou resistência concedidos por suas magias arcanas pessoais.",defenseMagicBonus:1},
    "Armadura Arcana":{type:"magic",label:"Armadura Arcana",summary:"+5 Defesa durante a cena.",defenseBonus:5},
    "Imagem Espelhada":{type:"magic",label:"Imagem Espelhada",summary:"Bônus de Defesa enquanto a magia estiver ativa.",defenseBonus:6}
  },
  Fani:{
    "Arma Mágica":{type:"magic",label:"Arma Mágica",summary:"+1 ataque e +1 dano para a arma tocada.",attackBonus:1,damageBonus:1},
    "Bênção":{type:"magic",label:"Bênção",summary:"+1 ataque e +1 dano para aliados.",attackBonus:1,damageBonus:1}
  },
  Neo:{
    "Ataque Furtivo":{type:"power",label:"Ataque Furtivo",summary:"+2d6 de dano quando o alvo estiver desprevenido, em alcance curto ou flanqueado.",damageDice:2},
    "Cão de Briga":{type:"power",label:"Cão de Briga",summary:"Permite 1 ataque extra na primeira vez por cena em que fizer Agredir.",extraAttack:1},
    "Adaga da Súplica":{type:"item",label:"Adaga da Súplica",summary:"Ativa a Súplica das Sombras: invisibilidade até atacar ou até o início do próximo turno.",conditionOnly:true}
  },
  Zuri:{
    "Armadura Arcana":{type:"magic",label:"Armadura Arcana",summary:"+5 Defesa durante a cena.",defenseBonus:5}
  }
};
function effectKey(name,e){return e.type+":"+name}
function effectIsActive(c,name,e){return Array.isArray(c.activeEffects)&&c.activeEffects.includes(effectKey(name,e))}
function effectToggle(name,e){
  const c=state[selected]; if(!Array.isArray(c.activeEffects))c.activeEffects=[];
  const k=effectKey(name,e);
  c.activeEffects=c.activeEffects.includes(k)?c.activeEffects.filter(function(x){return x!==k}):c.activeEffects.concat(k);
  save(); render();
}
function currentEffects(c){
  const defs=activeEffectDefs[selected]||{};
  return Object.entries(defs).filter(function(pair){return effectIsActive(c,pair[0],pair[1])}).map(function(pair){return {name:pair[0],e:pair[1]}});
}
function attackExtra(c,a){
  let attackBonus=0,damageBonus=0,damageDice=0;
  currentEffects(c).forEach(function(x){
    const e=x.e;
    const ok=!e.attackFilter ||
      (e.attackFilter==="trident" && /tridente|lança|azagaia/i.test(a[0])) ||
      (e.attackFilter==="twohand" && /tridente|bordão|montante|marreta|tacape|gadanho|alfange|alabarda|machado de guerra/i.test(a[0]));
    if(ok){attackBonus+=Number(e.attackBonus)||0;damageBonus+=Number(e.damageBonus)||0;damageDice+=Number(e.damageDice)||0}
  });
  return {attackBonus:attackBonus,damageBonus:damageBonus,damageDice:damageDice};
}
function defenseExtra(c){
  let n=0;
  const effects=currentEffects(c);
  effects.forEach(function(x){n+=Number(x.e.defenseBonus)||0});
  if(effects.some(function(x){return x.e.defenseMagicBonus}) && effects.some(function(x){return x.e.defenseBonus})) n+=1;
  return n;
}
function bindActiveEffects(){
  const c=state[selected],defs=activeEffectDefs[selected]||{};
  if(!Array.isArray(c.activeEffects))c.activeEffects=[];
  function makeButton(name,e){
    const b=document.createElement("button");
    b.type="button"; b.className="use-effect-btn"+(effectIsActive(c,name,e)?" used":"");
    b.textContent=effectIsActive(c,name,e)?"USANDO":"USAR";
    b.onclick=function(ev){ev.preventDefault();ev.stopPropagation();effectToggle(name,e)};
    return b;
  }
  document.querySelectorAll(".power,.item-row").forEach(function(card){
    const title=card.querySelector("summary b,.item-title-line b");
    if(!title)return;
    const name=title.textContent.trim(),e=defs[name];
    if(e&&!card.querySelector(".use-effect-btn")){
      const btn=makeButton(name,e);
      const target=card.querySelector("summary")||card.querySelector(".item-title-line");
      target.appendChild(btn);
    }
  });
  if(tab==="Resumo"){
    const content=document.querySelector(".content");
    if(content&&!content.querySelector(".combo-panel")){
      const effects=currentEffects(c),panel=document.createElement("div");
      panel.className="combo-panel";
      let html='<div class="combo-title">⚡ Combos e efeitos ativos</div>';
      if(!effects.length) html+='<div class="combo-empty">Nenhum efeito temporário em uso.</div>';
      effects.forEach(function(x){html+='<div class="combo-effect"><b>✓ '+esc(x.e.label)+'</b><span>'+esc(x.e.summary)+'</span></div>'});
      c.attacks.forEach(function(a){const x=attackExtra(c,a);if(x.attackBonus||x.damageBonus||x.damageDice){html+='<div class="combo-attack"><b>⚔️ '+esc(a[0])+'</b><span>'+(x.attackBonus?"Ataque +"+x.attackBonus:"")+(x.damageBonus?" • Dano +"+x.damageBonus:"")+(x.damageDice?" • +"+x.damageDice+"d6":"")+'</span></div>'}});
      panel.innerHTML=html;
      content.insertBefore(panel,content.firstChild);
    }
    const def=document.querySelector('[data-stat="def"]')?.closest(".mini");
    if(def&&defenseExtra(c)){const x=document.createElement("small");x.className="combo-extra-stat";x.textContent="+"+defenseExtra(c)+" extra ativo";def.appendChild(x)}
  }
  document.querySelectorAll("[data-attack]").forEach(function(b){b.onclick=function(ev){
    ev.preventDefault();ev.stopPropagation();
    const a=c.attacks[Number(b.dataset.attack)],d=1+Math.floor(Math.random()*20),baseBonus=Number(a[1].replace("+",""))||0,x=attackExtra(c,a),total=d+baseBonus+x.attackBonus;
    toast(a[0]+": d20 "+d+" + "+baseBonus+(x.attackBonus?" + "+x.attackBonus+" extra":"")+" = "+total+(x.damageBonus||x.damageDice?" • dano "+a[2]+(x.damageBonus?" + "+x.damageBonus:"")+(x.damageDice?" + "+x.damageDice+"d6":""):""));
  }});
}
function migrate(){
  if(state.Neo && state.Neo._sheetVersion!==3){
    state.Neo.attacks=clone(base.Neo.attacks);
    state.Neo.items=clone(base.Neo.items);
    state.Neo._sheetVersion=3;
    cloudDirty=true;
  }
  if(state.Hippion && state.Hippion._sheetVersion!==3){
    state.Hippion.attacks=clone(base.Hippion.attacks);
    state.Hippion.items=clone(base.Hippion.items);
    state.Hippion._sheetVersion=3;
    cloudDirty=true;
  }
  if(state.Zuri && state.Zuri._sheetVersion!==3){
    const keep={image:state.Zuri.image||fixedCharacterImages.Zuri,conditions:Array.isArray(state.Zuri.conditions)?state.Zuri.conditions:[],masterNote:typeof state.Zuri.masterNote==="string"?state.Zuri.masterNote:""};
    state.Zuri=clone(base.Zuri); Object.assign(state.Zuri,keep); state.Zuri._sheetVersion=3; cloudDirty=true;
  }
  Object.entries(base).forEach(([name,b])=>{
    if(!state[name]) state[name]=clone(b);
    const c=state[name];
    if(typeof c.money!=="number" || !Number.isFinite(c.money)) c.money=Number(b.money)||0;
    c.maxLoad=10+(Number(c.attrs?.FOR)||0)*2;
    if(!Array.isArray(c.items)) c.items=clone(b.items);
    c.items=c.items.map(x=>{const item=Array.isArray(x)?[x[0],Number(x[1]??1),typeof x[2]==="string"?x[2]:"",Math.max(0,Math.floor(Number(x[3])||1))]:[x,1,"",1];const cat=catalogMatch(item[0]);if(cat)item[1]=cat.spaces;return item;});
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

function save(characterName=selected){
  localStorage.setItem(KEY,JSON.stringify(state));
  localStorage.setItem(KEY+"-selected",selected);
  if(!remoteApplying){cloudDirty=true;if(cloudReady)syncCloud(characterName);}
  const sync=document.querySelector(".sync");if(sync)sync.textContent=cloudReady?"⟳ Enviando para a mesa…":"⟳ Conectando à mesa…";
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
 document.querySelectorAll("[data-char]").forEach(b=>b.onclick=()=>{selected=b.dataset.char;tab="Resumo";save(b.dataset.masterHp);render()});
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
 if(tab==="Resumo") return `${c.conditions.length?`<div class="active-effects"><div class="active-effects-title">⚠️ Efeitos ativos</div><div class="active-effects-list">${c.conditions.map(v=>`<span>${esc(v)}</span>`).join("")}</div></div>`:""}<div class="bars"><div class="statcard resource hp-card"><div class="resource-top"><div class="label">Pontos de Vida</div><strong>${c.hp} / ${c.maxHp}</strong></div><div class="resource-bar"><span style="width:${Math.max(0,Math.min(100,c.hp/c.maxHp*100))}%"></span></div><div class="controls"><button data-hp="-5">−5</button><button data-hp="-1">−</button><button data-hp="1" class="plus">+</button><button data-hp="5" class="plus">+5</button></div></div><div class="statcard resource mp-card"><div class="resource-top"><div class="label">Pontos de Mana</div><strong>${c.mp} / ${c.maxMp}</strong></div><div class="resource-bar"><span style="width:${Math.max(0,Math.min(100,c.mp/c.maxMp*100))}%"></span></div><div class="controls"><button data-mp="-5">−5</button><button data-mp="-1">−</button><button data-mp="1" class="plus">+</button><button data-mp="5" class="plus">+5</button></div></div></div><div class="money-card"><div class="money-icon">🪙</div><div class="money-info"><span class="label">Dinheiro</span><strong>T$ ${c.money}</strong><div class="money-controls"><button data-money="-">−</button><input id="moneyAmount" type="number" min="1" step="1" value="10" aria-label="Quantidade de tibares"><button data-money="+">+</button></div><small>Digite a quantidade e use − ou + para gastar ou receber.</small></div></div><div class="section"><div class="sectiontitle"><h3>Defesas e combate</h3></div><div class="grid">${[['Defesa','def'],['Fortitude','fort'],['Reflexos','ref'],['Vontade','will'],['Iniciativa','init'],['Percepção','per']].map(x=>`<div class="mini editable-mini"><span class="label">${x[0]}</span><input class="stat-input" type="number" data-stat="${x[1]}" value="${c[x[1]]}"></div>`).join("")}</div></div>
  <div class="section"><div class="sectiontitle"><h3>Atributos</h3></div><div class="grid">${Object.entries(c.attrs).map(x=>`<div class="mini editable-mini"><span class="label">${x[0]}</span><input class="stat-input" type="number" data-attr="${x[0]}" value="${x[1]}"></div>`).join("")}</div></div>
  <div class="section"><div class="sectiontitle"><h3>Movimento</h3></div><div class="row editable-row"><div><b>Deslocamento</b><div class="sub">Carga ${load(c)} / ${capacity(c)} espaços</div></div><label class="speed-edit"><input class="stat-input" type="number" data-stat="speed" value="${c.speed}"><span>m</span></label></div></div>
  <div class="sync">✓ Salvo neste aparelho</div>`;
 if(tab==="Ataques") return `<div class="list">${c.attacks.map((a,i)=>{const w=specialWeaponData[a[0]];return `<details class="weapon-card ${w?"special-weapon":""}"><summary><div><b>⚔️ ${esc(a[0])}</b><div class="sub">${a[1]} • ${a[2]} • ${a[3]} • ${a[4]} • ${a[5]}</div></div><button class="roll" data-attack="${i}" type="button">Rolar</button></summary>${w?`<div class="weapon-details"><div class="weapon-subtitle">${esc(w.subtitle)}</div><p>${esc(w.description)}</p><div class="weapon-specs"><span><b>Tipo</b>${esc(w.type)}</span><span><b>Categoria</b>${esc(w.category)}</span><span><b>Dano</b>${esc(w.damage)}</span><span><b>Propriedades</b>${esc(w.properties)}</span><span><b>Peso</b>${esc(w.weight)}</span><span><b>Origem</b>${esc(w.origin)}</span></div><div class="weapon-abilities">${w.abilities.map(x=>`<div><b>${esc(x[0])}</b><p>${esc(x[1])}</p></div>`).join("")}</div><div class="weapon-quote">${esc(w.quote)}</div><div class="weapon-footer">${esc(w.footer||"")}</div></div>`:""}</details>`}).join("")}</div><div class="sync">Armas especiais com informações das fichas enviadas.</div>`;
 if(tab==="Poderes") return `<div class="list powers">${c.powers.map(p=>`<details class="power"><summary><span class="power-icon">✦</span><b>${esc(p[0])}</b></summary><div class="power-text">${esc(p[1])}</div></details>`).join("")}</div>`;
 if(tab==="Magias") return magicView();
 if(tab==="Mochila") return inventory(c);
 return `<div class="skills">${Object.entries(c.skills).map(([n,v])=>`<div class="skill ${c.trained.includes(n)?"trained":""}"><button data-skill="${esc(n)}">${c.trained.includes(n)?'<span class="trained-mark">◆</span>':""}${esc(n)}</button>${v==null?'<b class="skill-unavailable">—</b>':`<label class="skill-edit"><span>+</span><input type="number" class="skill-input" data-skill-value="${esc(n)}" value="${Number(v)}" aria-label="Bônus de ${esc(n)}"></label>`}</div>`).join("")}</div><div class="legend"><span class="trained-mark">◆</span> Perícia treinada • clique no nome para rolar • edite o bônus no campo ao lado.</div><div class="sync">Os bônus de perícia podem ser editados e ficam sincronizados com a mesa.</div>`;
}

function magicView(){const list=magicData[selected]||[];if(!list.length)return '<div class="empty"><div class="empty-icon">✦</div><b>Sem magias na ficha</b><div class="sub">Não há magias registradas no PDF enviado.</div></div>';return '<div class="list powers">'+list.map(m=>'<details class="power magic"><summary><span class="power-icon">✧</span><b>'+esc(m[0])+'</b></summary><div class="magic-meta">'+esc(m[1])+'</div><div class="power-text">'+esc(m[2])+'</div></details>').join('')+'</div><div class="sync">Magias transcritas das fichas enviadas.</div>';}function inventory(c){
 const cap=capacity(c), used=load(c), full=used>cap;
 let slots="";
 for(let i=1;i<=cap;i++) slots+=`<span class="slot ${i<=used?"filled":""}">${i<=used?"◆":""}</span>`;
 const catalogCards=itemCatalog.map((x,i)=>`<article class="catalog-card" data-catalog-card data-search="${esc((x.name+" "+x.cat+" "+x.desc+" "+(x.effect||"")).toLowerCase())}">
   <div class="catalog-card-top"><div><b>${esc(x.name)}</b><small>${esc(x.cat)} • ${esc(x.spaces)} espaço${x.spaces===1?"":"s"} • ${esc(x.price)}</small></div><button type="button" class="catalog-add" data-catalog-add="${i}">Adicionar</button></div>
   <div class="catalog-data">${esc(x.data||"")}</div>
   <p>${esc(x.desc||"")}</p>
   ${x.effect?`<div class="catalog-effect"><b>Benefício</b> ${esc(x.effect)}</div>`:""}
   ${x.source?`<small class="catalog-source">${esc(x.source)}</small>`:""}
 </article>`).join("");
 return `
 <div class="inventory-head"><div><div class="label">Mochila</div><strong>${used} / ${cap} espaços</strong></div><span class="inventory-icon">🎒</span></div>
 <div class="capacity-note ${full?"over":""}">Capacidade = 10 + 2 × Força (${c.attrs.FOR}). Cada item ocupa os espaços indicados na ficha.</div>
 <div class="slot-grid">${slots}</div>
 <button type="button" class="catalog-open" id="openItemCatalog">📚 Adicionar item do catálogo</button>
 <div class="inventory-add"><input id="newitem" placeholder="Item especial / personalizado…"><label class="inventory-field"><span>Espaços</span><input id="newsize" type="number" min="0" step="0.5" value="1" aria-label="Espaços que o item ocupa"></label><label class="inventory-field"><span>Quantidade</span><input id="newqty" type="number" min="1" step="1" value="1" aria-label="Quantidade do item"></label><button id="additem">+ Item</button></div>
 <div class="list">${c.items.map((p,i)=>{const cat=catalogMatch(p[0]);return `<div class="row item-row"><div class="item-icon">${itemIcon(p[0])}</div><div class="item-main"><div class="item-title-line"><b>${esc(p[0])}</b>${cat?`<span class="catalog-badge">Livro</span>`:""}</div><div class="item-size-row"><label>Espaços</label><input type="number" min="0" step="0.5" class="item-size-input" data-item-size="${i}" value="${Number(p[1])||0}" aria-label="Espaços de ${esc(p[0])}"><span>•</span><span>Quantidade</span></div><div class="item-qty"><button type="button" class="qtybtn" data-item-qty="${i}" data-delta="-1">−</button><input type="number" min="0" step="1" class="qty-input" data-item-qty-input="${i}" value="${Number.isFinite(Number(p[3]))?Number(p[3]):1}" aria-label="Quantidade de ${esc(p[0])}"><button type="button" class="qtybtn" data-item-qty="${i}" data-delta="1">+</button></div>${cat?`<details class="item-details"><summary>ⓘ Ver descrição e benefício</summary><div class="catalog-data">${esc(cat.data||"")}</div><p>${esc(cat.desc||"")}</p>${cat.effect?`<div class="catalog-effect"><b>Benefício</b> ${esc(cat.effect)}</div>`:""}</details>`:""}<input class="item-note" data-item-note="${i}" value="${esc(p[2]||"")}" placeholder="Anotação do item…"></div><button class="smallbtn" data-remove="${i}" title="Remover item">×</button></div>`}).join("")}</div>
 <div id="itemCatalog" class="catalog-modal" hidden><div class="catalog-backdrop" id="closeItemCatalog"></div><section class="catalog-panel"><div class="catalog-header"><div><div class="eyebrow">Tormenta20 • catálogo</div><h3>Escolha um item</h3><p>Itens do Livro Básico e de Deuses de Arton.</p></div><button type="button" class="catalog-close" id="closeItemCatalogBtn">×</button></div><input id="catalogSearch" class="catalog-search" placeholder="🔎 Buscar item, categoria ou efeito…"><div class="catalog-list">${catalogCards}</div></section></div>
 <div class="sync">Cada alteração fica salva e sincronizada com a mesa.</div>`;
}
function bindBody(){
 document.querySelectorAll("[data-master-hp]").forEach(b=>b.onclick=()=>{const c=state[b.dataset.masterHp];c.hp=Math.max(0,Math.min(c.maxHp,c.hp+Number(b.dataset.delta)));save(b.dataset.masterHp);render()});
 document.querySelectorAll("[data-master-mp]").forEach(b=>b.onclick=()=>{const c=state[b.dataset.masterMp];c.mp=Math.max(0,Math.min(c.maxMp,c.mp+Number(b.dataset.delta)));save(b.dataset.masterMp);render()});
 document.querySelectorAll("[data-condition]").forEach(b=>b.onclick=()=>{const c=state[b.dataset.condition],v=b.dataset.value;c.conditions.includes(v)?c.conditions=c.conditions.filter(x=>x!==v):c.conditions.push(v);save(b.dataset.condition);render()});
 document.querySelectorAll("[data-note]").forEach(i=>i.onchange=()=>{state[i.dataset.note].masterNote=i.value;save(i.dataset.note)});
 document.querySelectorAll("[data-hp]").forEach(b=>b.onclick=()=>{const c=state[selected];c.hp=Math.max(0,Math.min(c.maxHp,c.hp+Number(b.dataset.hp)));save();render()});
 document.querySelectorAll("[data-mp]").forEach(b=>b.onclick=()=>{const c=state[selected];c.mp=Math.max(0,Math.min(c.maxMp,c.mp+Number(b.dataset.mp)));save();render()});
 document.querySelectorAll("[data-money]").forEach(b=>b.onclick=()=>{const amount=Math.max(1,Math.floor(Number($("#moneyAmount")?.value)||1));const c=state[selected];c.money=Math.max(0,c.money+(b.dataset.money==="+"?amount:-amount));save();render()});
 document.querySelectorAll("[data-stat]").forEach(i=>i.onchange=()=>{const v=Number(i.value);if(Number.isFinite(v)){state[selected][i.dataset.stat]=v;save();render()}});
 document.querySelectorAll("[data-attr]").forEach(i=>i.onchange=()=>{const v=Number(i.value);if(Number.isFinite(v)){state[selected].attrs[i.dataset.attr]=v;state[selected].maxLoad=capacity(state[selected]);save();render()}});
 document.querySelectorAll("[data-attack]").forEach(b=>b.onclick=()=>{const a=state[selected].attacks[Number(b.dataset.attack)],d=1+Math.floor(Math.random()*20),bonus=Number(a[1].replace("+",""));toast(a[0]+": d20 "+d+" + "+a[1]+" = "+(d+bonus))});
 document.querySelectorAll("[data-skill]").forEach(b=>b.onclick=()=>{const n=b.dataset.skill,v=state[selected].skills[n];if(v==null)return toast(n+": perícia não disponível na ficha.");const d=1+Math.floor(Math.random()*20);toast(n+": d20 "+d+" + "+v+" = "+(d+v))});
 document.querySelectorAll("[data-skill-value]").forEach(i=>i.onchange=()=>{const n=i.dataset.skillValue,v=Number(i.value);if(!Number.isFinite(v))return;state[selected].skills[n]=v;save()});
 document.querySelectorAll("[data-item-note]").forEach(i=>i.onchange=()=>{const idx=Number(i.dataset.itemNote);state[selected].items[idx][2]=i.value;save()});
 document.querySelectorAll("[data-item-size]").forEach(i=>i.onchange=()=>{const idx=Number(i.dataset.itemSize),v=Math.max(0,Math.round((Number(i.value)||0)*2)/2);state[selected].items[idx][1]=v;save();render()});
 document.querySelectorAll("[data-item-qty]").forEach(b=>b.onclick=()=>{const idx=Number(b.dataset.itemQty),delta=Number(b.dataset.delta),item=state[selected].items[idx];item[3]=Math.max(0,(Number(item[3])||1)+delta);save();render()});
 document.querySelectorAll("[data-item-qty-input]").forEach(i=>i.onchange=()=>{const idx=Number(i.dataset.itemQtyInput),v=Math.max(0,Math.floor(Number(i.value)||0));state[selected].items[idx][3]=v;save();render()});
 document.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{state[selected].items.splice(Number(b.dataset.remove),1);save();render()});
 const catOpen=$("#openItemCatalog");const catModal=$("#itemCatalog");const closeCat=()=>{if(catModal)catModal.hidden=true};if(catOpen)catOpen.onclick=()=>{if(catModal)catModal.hidden=false;const q=$("#catalogSearch");if(q){q.value="";q.focus()}};document.querySelectorAll("#closeItemCatalog,#closeItemCatalogBtn").forEach(b=>b.onclick=closeCat);document.querySelectorAll("[data-catalog-add]").forEach(b=>b.onclick=()=>{const item=itemCatalog[Number(b.dataset.catalogAdd)],c=state[selected],existing=c.items.find(x=>catalogMatch(x[0])?.name===item.name);if(existing){existing[3]=(Number(existing[3])||1)+1;existing[1]=item.spaces}else{if(load(c)+item.spaces>capacity(c))return toast("A mochila não comporta esse item.");c.items.push([item.name,item.spaces,"",1])}save();render()});const search=$("#catalogSearch");if(search)search.oninput=()=>{const q=search.value.toLowerCase().trim();document.querySelectorAll("[data-catalog-card]").forEach(card=>card.style.display=!q||card.dataset.search.includes(q)?"":"none")};
 const add=$("#additem");
 if(add)add.onclick=()=>{const name=$("#newitem").value.trim(),size=Math.max(0,Math.round((Number($("#newsize").value)||0)*2)/2),qty=Math.max(1,Math.floor(Number($("#newqty").value)||1));if(!name)return; const c=state[selected];if(load(c)+size>capacity(c))return toast("A mochila não comporta esse item.");c.items.push([name,size,"",qty]);save();render()};
 bindActiveEffects();
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
