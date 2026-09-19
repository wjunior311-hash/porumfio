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

const magicData={
Hippion:[
["Comando","1º • Encantamento • Padrão • Curto • 1 humanoide • 1 rodada • Vontade anula • 1 PM","Você dá uma ordem irresistível que o alvo deve ouvir, embora não precise entendê-la. Se falhar na resistência, obedece no próprio turno. Fuja: gasta o turno se afastando de você. Largue: solta o que estiver segurando e não pode pegar de volta até o início do próximo turno, embora possa fazer outras ações. Pare: fica pasmo (uma vez por cena). Senta: senta como ação livre e não pode se levantar até o início do próximo turno. Venha: gasta o turno se aproximando de você.\n\nAprimoramentos:\n+1 PM: muda o alvo para 1 criatura.\n+2 PM: aumenta a quantidade de alvos em +1."],
["Sono","1º • Encantamento • Padrão • Curto • 1 criatura de ND 2 ou menor • Cena • Vontade parcial • 1 PM","Um sono místico recai sobre o alvo. Se passar na resistência, fica fatigado por 1 rodada. Se falhar, fica inconsciente e caído.\n\nAprimoramentos:\n+2 PM: muda o alvo para uma área de quadrado com 3m de lado; todas as criaturas dentro do limite de ND são afetadas.\n+2 PM: afeta alvos de ND 5 ou menor. Requer 2º círculo.\n+5 PM: afeta alvos de ND 10 ou menor. Requer 3º círculo.\n+5 PM: muda o alvo para criaturas escolhidas; todas as criaturas válidas no alcance são afetadas.\n+9 PM: afeta alvos de ND 15 ou menor. Requer 4º círculo.\n+14 PM: afeta alvos de qualquer ND. Requer 5º círculo."]
],
Malekir:[
["Adaga Mental","1º • Encantamento • Padrão • Curto • 1 criatura • Instantânea • Vontade parcial • 1 PM","Você dispara uma adaga imaterial contra a mente do alvo, causando 2d6 de dano psíquico e deixando-o atordoado por 1 rodada. Se passar na resistência, sofre metade do dano e evita a condição. Uma criatura só pode ser atordoada por esta magia uma vez por cena.\n\nAprimoramentos:\n+1 PM: lança sem gesticular ou falar e a adaga fica invisível; se o alvo falhar na resistência, não percebe que você lançou a magia.\n+2 PM: duração de 1 dia; você sabe a direção e localização do alvo enquanto ele estiver no mesmo mundo.\n+2 PM: aumenta o dano em +1d6."],
["Armadura Arcana","1º • Abjuração • Padrão • Pessoal • Você • Cena • 1 PM","Cria uma película protetora invisível, mas tangível, que fornece +5 na Defesa. O bônus é cumulativo com outras magias, mas não com bônus de armaduras.\n\nAprimoramentos:\n+1 PM: execução vira reação. Quando sofre um ataque, cria um escudo que fornece +5 na Defesa contra esse ataque, cumulativo com o bônus básico da magia e com armaduras.\n+2 PM: aumenta o bônus de Defesa em +1.\n+2 PM: duração de 1 dia."],
["Compreensão","1º • Adivinhação • Padrão • Toque • 1 criatura ou texto • Cena • Vontade anula (veja texto) • 1 PM","Você entende um texto tocado mesmo sem conhecer o idioma. Ao tocar uma criatura inteligente, consegue se comunicar com ela sem idioma em comum. Ao tocar uma criatura não inteligente, como um animal, percebe seus sentimentos. Também pode gastar uma ação de movimento para ouvir os pensamentos de uma criatura tocada; um alvo involuntário pode fazer Vontade para evitar esse efeito.\n\nAprimoramentos:\n+1 PM: alcance curto.\n+2 PM: alcance curto e alvo criaturas escolhidas; entende todas, mas só ouve os pensamentos de uma por vez.\n+2 PM: alvo 1 criatura; em vez do normal, vasculha pensamentos para extrair informações. Vontade anula. Requer 2º círculo.\n+5 PM: alcance pessoal e alvo você; fala, entende e escreve qualquer idioma. Requer 3º círculo."],
["Concentração de Combate","1º • Adivinhação • Livre • Pessoal • Você • 1 rodada • 1 PM","Você amplia sua percepção e antecipa movimentos. Quando faz um teste de ataque, rola dois dados e usa o melhor resultado.\n\nAprimoramentos:\n+2 PM: execução padrão e duração cena. Requer 2º círculo.\n+5 PM: além do normal, inimigos que atacarem você rolam dois dados e usam o pior resultado. Requer 3º círculo.\n+9 PM: execução padrão, alcance curto, alvo criaturas escolhidas e duração cena. Requer 4º círculo.\n+14 PM: execução padrão e duração 1 dia. Além do normal, você recebe um sexto sentido que avisa sobre perigos e ameaças, fica imune a surpreendido e desprevenido e recebe +10 em Defesa e Reflexos. Requer 5º círculo."],
["Conjurar Monstro","1º • Convocação • Completa • Curto • 1 criatura conjurada • Sustentada • 1 PM","Conjura um monstro Pequeno. Ele tem For 14, Des 17, outros atributos nulos, deslocamento 9m, 20 PV, Defesa 0 (ataques acertam automaticamente), Reflexos igual ao seu e imunidade a efeitos que exigem Fortitude ou Vontade. Você escolhe aparência e dano entre corte, impacto e perfuração. Ele age no seu próximo turno e pode fazer uma ação de movimento por rodada. Com ação padrão, você dá uma ordem: Mover (dobra o deslocamento), Atacar (acerta automaticamente e causa 2d4+2) ou Lançar Magia (serve como ponto de origem para uma magia sua de execução padrão ou menor; você paga os PM normalmente). Só pode existir um monstro por vez e ele não age sem ordem.\n\nAprimoramentos:\n+1 PM: deslocamento de escalada ou natação igual ao terrestre.\n+1 PM: +3m de deslocamento.\n+1 PM: dano do ataque vira ácido, fogo, frio ou eletricidade.\n+2 PM: percepção às cegas em alcance curto.\n+2 PM: +10 PV por categoria de tamanho.\n+2 PM: tamanho Médio; For 18, Des 16, 45 PV, deslocamento 12m e ataque 2d6+4.\n+2 PM: resistência 5 contra dois tipos de dano.\n+4 PM: nova ordem Sopro, causando o dobro do dano em cone de 6m; Reflexos reduz à metade.\n+5 PM: tamanho Grande; For 24, Des 14, 75 PV, deslocamento 12m e ataque 3d6+7. Requer 2º círculo.\n+9 PM: deslocamento de voo igual ao dobro do terrestre.\n+9 PM: imunidade contra dois tipos de dano.\n+9 PM: tamanho Enorme; For 32, Des 12, 110 PV, deslocamento 15m e ataque 4d6+11. Requer 4º círculo.\n+14 PM: tamanho Colossal; For 41, Des 10, 180 PV, deslocamento 15m e ataque 6d6+15. Requer 5º círculo."],
["Explosão de Chamas","1º • Evocação • Padrão • Pessoal • Cone 6m • Instantânea • Reflexos reduz à metade • 1 PM","Um leque de chamas causa 2d6 de dano de fogo às criaturas na área.\n\nTruque: alcance curto, alvo 1 objeto e Reflexos anula; cria pequena explosão sem dano que pode acender vela, tocha ou fogueira e colocar fogo em objeto inflamável com RD 0.\n\nAprimoramentos:\n+1 PM: aumenta o dano em +1d6.\n+1 PM: Reflexos passa a ser parcial; quem passar sofre metade do dano, quem falhar fica em chamas."],
["Imagem Espelhada","1º • Ilusão • Padrão • Pessoal • Você • Cena • 1 PM","Cria três cópias ilusórias que imitam suas ações. Você recebe +6 na Defesa. Cada ataque que erra você destrói uma imagem e reduz o bônus em 2. O inimigo precisa ver as cópias para ser confundido. Se você estiver invisível ou o atacante fechar os olhos, não recebe o bônus, embora o atacante ainda sofra as penalidades normais por não enxergar.\n\nAprimoramentos:\n+2 PM: +1 cópia e +2 Defesa.\n+2 PM: quando uma cópia é destruída, emite um clarão; quem a destruiu fica ofuscado por 1 rodada. Requer 2º círculo."],
["Seta Infalível de Talude","1º • Evocação • Padrão • Médio • Até 2 criaturas escolhidas • Instantânea • 1 PM","Lança duas setas de energia, cada uma causando 1d4+1 de dano de essência. Pode dividir as setas entre alvos ou concentrá-las em um só. Um bônus no dano de magias se aplica a apenas uma seta.\n\nAprimoramentos:\n+2 PM: transforma as setas em lanças de energia que caem do céu; cada uma causa 1d8+1. Requer 2º círculo.\n+2 PM: aumenta para três setas/lanças.\n+4 PM: aumenta para cinco. Requer 2º círculo.\n+9 PM: aumenta para dez. Requer 4º círculo."],
["Toque Chocante","1º • Evocação • Padrão • Toque • 1 criatura • Instantânea • Fortitude reduz à metade • 1 PM","Arcos elétricos envolvem sua mão e causam 2d8+2 de dano de eletricidade. Se o alvo usa armadura de metal ou carrega muito metal, a critério do mestre, sofre -5 no teste de resistência.\n\nAprimoramentos:\n+1 PM: aumenta o dano em +1d8+1.\n+2 PM: resistência passa a nenhum. Como parte da execução, faça um ataque corpo a corpo; se acertar, causa o dano do ataque e da magia.\n+2 PM: alcance pessoal e área esfera de 6m de raio; raios atingem todas as criaturas na área."]
],
Fani:[
["Arma Mágica","1º • Transmutação • Padrão • Toque • 1 arma empunhada • Cena • 1 PM","A arma é considerada mágica e fornece +1 nos testes de ataque e rolagens de dano (bônus de encanto). Se você empunhar a arma, pode usar seu atributo-chave de magias nos testes de ataque no lugar do atributo original, sem acumular com efeitos que já somem esse atributo.\n\nAprimoramentos:\n+2 PM: aumenta o bônus em +1, limitado pelo círculo máximo que você pode lançar.\n+2 PM: a arma causa +1d6 de ácido, eletricidade, fogo ou frio, escolhido ao lançar. Só pode usar este aprimoramento uma vez.\n+3 PM: muda o bônus de dano do aprimoramento anterior para +2d6."],
["Bênção","1º • Encantamento • Padrão • Curto • Aliados • Cena • 1 PM","Abençoa os aliados, concedendo +1 em testes de ataque e rolagens de dano. Bênção anula Perdição.\n\nAprimoramentos:\n+1 PM: alvo vira 1 cadáver e duração 1 semana; o cadáver não se decompõe nem pode ser transformado em morto-vivo durante a duração.\n+2 PM: aumenta os bônus em +1, limitado pelo círculo máximo que você pode lançar."],
["Comando","1º • Encantamento • Padrão • Curto • 1 humanoide • 1 rodada • Vontade anula • 1 PM","Você dá uma ordem irresistível que o alvo deve ouvir. Se falhar na resistência, obedece no próprio turno: Fuja, Largue, Pare, Senta ou Venha.\n\nAprimoramentos:\n+1 PM: alvo vira 1 criatura.\n+2 PM: aumenta a quantidade de alvos em +1."],
["Consagrar","1º • Evocação • Padrão • Longo • Esfera de 9m de raio • 1 dia • 1 PM","Enche a área com energia positiva. Efeitos de luz que curam PV ou canalizam energia positiva têm seus efeitos maximizados. Por exemplo, Curar Ferimentos cura automaticamente 18 PV na área. Não pode ser lançada em área com símbolo visível dedicado a outra divindade. Consagrar anula Profanar.\n\nAprimoramentos:\n+1 PM: mortos-vivos na área sofrem -2 em testes e Defesa.\n+2 PM: aumenta essas penalidades em -1.\n+9 PM: execução de 1 hora, duração permanente e componente material de incenso e óleos no valor de T$ 1.000. Requer 4º círculo."],
["Controlar Plantas","1º • Transmutação • Padrão • Curto • Quadrado de 9m de lado • Cena • Reflexos anula • 1 PM","Só funciona em área com vegetação. As plantas se enroscam nas criaturas; quem falhar na resistência fica enredado. Uma vítima pode se libertar com ação padrão e Acrobacia ou Atletismo. A área vira terreno difícil. No início do turno de cada criatura, a vegetação tenta enredá-la novamente, exigindo novo Reflexos.\n\nTruque: área vira alvo de 1 planta e resistência nenhuma; você pode fazê-la se mover como animada, sem causar dano ou atrapalhar concentração.\n\nAprimoramentos:\n+1 PM: duração instantânea; as plantas diminuem, terreno difícil vira normal e deixa de fornecer camuflagem; dissipa o uso normal da magia.\n+1 PM: além do normal, quem falhar fica imóvel.\n+2 PM: alcance pessoal, alvo você e resistência nenhuma; pode se comunicar com plantas, que começam prestativas, e fazer Diplomacia com elas."],
["Curar Ferimentos","1º • Evocação • Padrão • Toque • 1 criatura • Instantânea • 1 PM","Canaliza luz que recupera 2d8+2 PV.\n\nTruque: alvo 1 morto-vivo; em vez de curar, causa 1d8 de dano de luz, com Vontade reduzindo à metade.\n\nAprimoramentos:\n+1 PM: aumenta a cura em +1d8+1.\n+2 PM: remove uma condição de fadiga do alvo.\n+2 PM: alcance curto.\n+5 PM: alcance curto e alvo criaturas escolhidas."]
],
Neo:[],
Zuri:[
["Armadura Arcana","1º • Abjuração • Padrão • Pessoal • Você • Cena • 1 PM","Cria uma película protetora invisível, mas tangível, fornecendo +5 na Defesa. O bônus é cumulativo com outras magias, mas não com bônus de armaduras.\n\nAprimoramentos:\n+1 PM: execução vira reação. Quando sofre um ataque, cria escudo que fornece +5 na Defesa contra esse ataque, cumulativo com o bônus básico e armaduras.\n+2 PM: aumenta o bônus de Defesa em +1.\n+2 PM: duração de 1 dia."],
["Flecha de Luz","1º • Evocação • Padrão • Médio • 1 criatura • Instantânea • Reflexos parcial • 1 PM","Lança uma flecha luminosa; o alvo sofre 2d8+2 de dano de luz e fica ofuscado por 1 rodada. Passar na resistência reduz o dano à metade e evita a condição.\n\nAprimoramentos:\n+1 PM: alvo é uma criatura que tenha causado dano a você ou seus aliados na última rodada; dados de dano viram d10.\n+2 PM: aumenta o dano em +1d8+1.\n+2 PM: aumenta o número de alvos em +1, limitado pelo círculo máximo que você pode lançar.\n+2 PM (Apenas Arcanos): quem falhar fica cego por 1 rodada e depois ofuscado. Requer 2º círculo.\n+3 PM (Apenas Arqueiros de Lenórienn): alcance pessoal, alvo seu arco arcano, duração sustentada e resistência nenhuma; o arco emite luz de tocha e causa +2d8+2 de luz, deixando ofuscadas as criaturas que sofrerem dano.\n+1 PM (Apenas Elfos): alvo 1 duyshidakk ou 1 devoto de Aharadak, Tauron ou Thwor; dano usa d10.\n+2 PM (Apenas Divinos): além do normal, cada alvo que falhar faz com que o próximo aliado que o ferir receba PV temporários iguais à metade do dano causado pela magia. Requer 2º círculo."],
["Raio do Enfraquecimento","1º • Necromancia • Padrão • Curto • 1 criatura • Cena • Fortitude parcial • 1 PM","Um raio púrpura drena as forças do alvo. Se falhar na resistência, fica fatigado; se passar, fica vulnerável. Efeitos desta magia não se acumulam.\n\nTruque: alcance toque e Fortitude anula; ao tocar, o alvo fica fatigado.\n\nAprimoramentos:\n+2 PM: se falhar, fica exausto; se passar, fica fatigado. Requer 2º círculo.\n+5 PM: como acima, mas alvo vira criaturas escolhidas. Requer 3º círculo."],
["Vitalidade Fantasma","1º • Necromancia • Padrão • Pessoal • Você • Instantânea • 1 PM","Você suga energia vital da terra e recebe 2d10 PV temporários. Eles desaparecem ao final da cena.\n\nAprimoramentos:\n+2 PM: aumenta os PV temporários em +1d10. Caso a magia cause dano, em vez disso aumenta o dano em +1d10.\n+5 PM: alcance vira área esfera de 6m de raio centrada em você e resistência Fortitude reduz à metade. Em vez do normal, suga energia das criaturas vivas na área, causando 1d10 de dano de trevas e recebendo PV temporários iguais ao dano total causado. Os temporários desaparecem ao fim da cena. Requer 2º círculo."]
]};
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
  Hippion:"assets/characters/hippion.webp",
  Malekir:"assets/characters/malekir.webp",
  Neo:"assets/characters/neo.webp",
  Fani:"assets/characters/fani.webp",
  Zuri:"assets/characters/zuri.webp"
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
 return `<div class="skills">${Object.entries(c.skills).sort(([a],[b])=>a.localeCompare(b,"pt-BR")).map(([n,v])=>`<div class="skill ${c.trained.includes(n)?"trained":""}"><button data-skill="${esc(n)}">${c.trained.includes(n)?'<span class="trained-mark">◆</span>':""}${esc(n)}</button>${v==null?'<b class="skill-unavailable">—</b>':`<label class="skill-edit"><span>+</span><input type="number" class="skill-input" data-skill-value="${esc(n)}" value="${Number(v)}" aria-label="Bônus de ${esc(n)}"></label>`}</div>`).join("")}</div><div class="legend"><span class="trained-mark">◆</span> Perícia treinada • clique no nome para rolar • edite o bônus no campo ao lado.</div><div class="sync">Os bônus de perícia podem ser editados e ficam sincronizados com a mesa.</div>`;
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
 <div class="list">${c.items.map((p,i)=>{const cat=catalogMatch(p[0]);return `<div class="row item-row"><div class="item-icon">${"🎒"}</div><div class="item-main"><div class="item-title-line"><b>${esc(p[0])}</b>${cat?`<span class="catalog-badge">Livro</span>`:""}</div><div class="item-size-row"><label>Espaços</label><input type="number" min="0" step="0.5" class="item-size-input" data-item-size="${i}" value="${Number(p[1])||0}" aria-label="Espaços de ${esc(p[0])}"><span>•</span><span>Quantidade</span></div><div class="item-qty"><button type="button" class="qtybtn" data-item-qty="${i}" data-delta="-1">−</button><input type="number" min="0" step="1" class="qty-input" data-item-qty-input="${i}" value="${Number.isFinite(Number(p[3]))?Number(p[3]):1}" aria-label="Quantidade de ${esc(p[0])}"><button type="button" class="qtybtn" data-item-qty="${i}" data-delta="1">+</button></div>${cat?`<details class="item-details"><summary>ⓘ Ver descrição e benefício</summary><div class="catalog-data">${esc(cat.data||"")}</div><p>${esc(cat.desc||"")}</p>${cat.effect?`<div class="catalog-effect"><b>Benefício</b> ${esc(cat.effect)}</div>`:""}</details>`:""}<input class="item-note" data-item-note="${i}" value="${esc(p[2]||"")}" placeholder="Anotação do item…"></div><button class="smallbtn" data-remove="${i}" title="Remover item">×</button></div>`}).join("")}</div>
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
