const KEY="porumfio-v1";

const base={
Hippion:{race:"Sereia",origin:"Marujo",className:"Bucaneiro",level:4,deity:"Oceano",hp:44,maxHp:44,mp:12,maxMp:12,def:19,fort:8,ref:6,will:6,init:6,per:6,speed:9,attrs:{FOR:3,DES:2,CON:4,INT:1,SAB:0,CAR:4},
attacks:[["Tridente","+7","1d8+5","x2","Perfuração","Curto"],["Besta Leve","+4","1d8","crit 19","Perfuração","Médio"]],
powers:[
["Acrobático","Pode usar Destreza no lugar de Força em testes de Atletismo. Terreno difícil não reduz seu deslocamento nem impede investidas."],
["Ataque Acrobático","Ao se aproximar com salto ou pirueta usando Atletismo/Acrobacia e atacar no mesmo turno, recebe +2 no ataque e no dano."],
["Ataque Pesado","Com arma corpo a corpo de duas mãos, pode gastar 1 PM; se acertar, além do dano faz derrubar ou empurrar como ação livre."]
],
skills:{Acrobacia:6,Adestramento:null,Atletismo:5,Atuação:6,Cavalgar:4,Conhecimento:null,Cura:2,Diplomacia:6,Enganação:8,Fortitude:8,Furtividade:4,Guerra:null,Iniciativa:6,Intimidação:6,Intuição:2,Investigação:3,Jogatina:null,Ladinagem:null,Luta:7,Misticismo:null,Nobreza:null,"Ofício":null,Percepção:2,Pilotagem:6,Pontaria:4,Reflexos:7,Religião:null,Sobrevivência:2,Vontade:2},
trained:["Acrobacia","Enganação","Fortitude","Iniciativa","Luta","Pilotagem","Reflexos"],
items:[["Corda",1],["Mochila",0],["Saco de dormir",1],["Traje de viajante",0],["Besta Leve",1],["Tridente",1],["Armadura de couro",2]]},

Malekir:{race:"Suraggel (Sulfure)",origin:"Aristocrata",className:"Arcanista",level:4,deity:"Wynna",hp:26,maxHp:26,mp:31,maxMp:31,def:16,fort:7,ref:8,will:9,init:6,per:6,speed:9,attrs:{FOR:1,DES:4,CON:3,INT:5,SAB:0,CAR:2},
attacks:[["Espada Curta","+3","1d6+1","crit 19","Perfuração","Curto"],["Bordão","+3","1d6+1 / 1d6+1","x2","Impacto","—"]],
powers:[
["Arcano de Batalha","Soma o bônus do atributo-chave nas rolagens de dano das magias."],
["Aumento de Atributo","Recebe +1 em um atributo à escolha. Pode ser escolhido novamente, respeitando o limite de uma vez por patamar para o mesmo atributo."],
["Bênção do Mana","Recebe +1 PM a cada nível ímpar."],
["Caminho do Arcanista","Seu caminho mágico define como você lança magias; Malekir segue o caminho de estudo mágico."],
["Conhecimento Mágico","Aprende duas magias de qualquer círculo que possa lançar. Pode escolher este poder novamente."]
],
skills:{Acrobacia:6,Adestramento:null,Atletismo:3,Atuação:4,Cavalgar:6,Conhecimento:9,Cura:2,Diplomacia:6,Enganação:6,Fortitude:7,Furtividade:6,Guerra:null,Iniciativa:8,Intimidação:4,Intuição:2,Investigação:9,Jogatina:null,Ladinagem:null,Luta:3,Misticismo:9,Nobreza:9,"Ofício":null,Percepção:6,Pilotagem:null,Pontaria:6,Reflexos:6,Religião:null,Sobrevivência:2,Vontade:4},
trained:["Conhecimento","Diplomacia","Enganação","Fortitude","Iniciativa","Investigação","Misticismo","Nobreza","Vontade"],
items:[["Mochila",0],["Saco de dormir",1],["Traje de viajante",0],["Joia de família",0],["Traje da Corte",1],["Varinha arcana",1],["Varinha arcana",1],["Bordão",2],["Espada Curta",1]]},

Neo:{race:"Trog",origin:"Cão de Briga",className:"Ladino",level:4,deity:"Hyninn",hp:41,maxHp:41,mp:16,maxMp:16,def:16,fort:7,ref:9,will:4,init:7,per:7,speed:9,attrs:{FOR:4,DES:3,CON:5,INT:0,SAB:2,CAR:0},
attacks:[["Mordida","+8","1d6+4","x2","Perfuração","Curto"],["Adaga","+8","1d4+4","crit 19","Perfuração","Curto"],["Espada Curta","+8","1d6+4","crit 19","Perfuração","Curto"],["Besta Leve","+5","1d8","crit 19","Perfuração","Médio"]],
powers:[
["Apostar com o Trapaceiro","Ao fazer um teste de perícia, pode gastar 1 PM para apostar com Hyninn: você e o mestre rolam 1d20 e você escolhe entre seu resultado e o resultado oculto do mestre."],
["Ataque Furtivo","Uma vez por rodada, ao atingir uma criatura desprevenida, em alcance curto ou flanqueada, causa 1d6 de dano extra. O dano aumenta em +1d6 a cada dois níveis."]
],
skills:{Acrobacia:7,Adestramento:null,Atletismo:6,Atuação:2,Cavalgar:5,Conhecimento:null,Cura:4,Diplomacia:2,Enganação:4,Fortitude:7,Furtividade:9,Guerra:null,Iniciativa:7,Intimidação:2,Intuição:6,Investigação:2,Jogatina:4,Ladinagem:7,Luta:8,Misticismo:null,Nobreza:null,"Ofício":null,Percepção:6,Pilotagem:null,Pontaria:5,Reflexos:7,Religião:null,Sobrevivência:4,Vontade:4},
trained:["Acrobacia","Enganação","Fortitude","Furtividade","Iniciativa","Jogatina","Ladinagem","Luta","Percepção","Reflexos"],
items:[["Mochila",0],["Saco de dormir",1],["Traje de viajante",0],["Manoplas ou arma marcial",1],["Mordida",0],["Adaga",1],["Espada Curta",1],["Besta Leve",1],["Virotes (20)",1],["Armadura de couro",2]]},

Fani:{race:"Dahllan",origin:"Herói Camponês",className:"Druida",level:4,deity:"Allihanna",hp:40,maxHp:40,mp:23,maxMp:23,def:16,fort:8,ref:7,will:10,init:8,per:8,speed:9,attrs:{FOR:2,DES:3,CON:3,INT:0,SAB:4,CAR:2},
attacks:[["Besta Leve","+7","1d8","crit 19","Perfuração","Médio"],["Arco Curto","+7","1d6","x3","Perfuração","Médio"],["Bordão","+4","1d6+2 / 1d6+2","x2","Impacto","—"]],
powers:[
["Amiga das Plantas","Pode lançar Controlar Plantas usando Sabedoria como atributo-chave. Se aprender a magia novamente, seu custo diminui em 1 PM."],
["Armadura de Allihanna","Gasta uma ação de movimento e 1 PM para transformar a pele em casca de árvore e receber +2 na Defesa até o fim da cena."],
["Aspecto do Verão","Aprende uma magia de transmutação. Também pode gastar 1 PM para cobrir uma arma de chamas, causando +1d6 de fogo; cada acerto gera 1 PM temporário, até o limite de seu nível por cena."]
],
skills:{Acrobacia:3,Adestramento:8,Atletismo:4,Atuação:4,Cavalgar:5,Conhecimento:null,Cura:8,Diplomacia:4,Enganação:4,Fortitude:7,Furtividade:3,Guerra:null,Iniciativa:7,Intimidação:4,Intuição:8,Investigação:2,Jogatina:null,Ladinagem:null,Luta:4,Misticismo:null,Nobreza:null,"Ofício":null,Percepção:8,Pilotagem:null,Pontaria:7,Reflexos:5,Religião:null,Sobrevivência:10,Vontade:8},
trained:["Adestramento","Cura","Iniciativa","Intuição","Percepção","Pontaria","Sobrevivência","Vontade"],
items:[["Mochila",0],["Saco de dormir",1],["Traje de viajante",0],["Instrumentos de ofício",0],["Traje de Plebeu",0],["Arco Curto",2],["Bordão",2],["Besta Leve",1],["Armadura de couro",2],["Escudo Leve",1]]},

Zuri:{race:"Medusa",origin:"—",className:"Bardo",level:2,deity:"Nimb",hp:21,maxHp:21,mp:13,maxMp:13,def:16,fort:4,ref:7,will:3,init:5,per:3,speed:9,attrs:{FOR:1,DES:4,CON:3,INT:2,SAB:0,CAR:4},
attacks:[["Espada Curta","+2","1d6+1","crit 19","Perfuração","Curto"],["Machadinha","+2","1d6+1","x3","Corte","Curto"]],
powers:[
["Cria de Megalokk","É uma criatura do tipo monstro e possui visão no escuro."],
["Natureza Venenosa","Tem resistência a veneno 5. Pode gastar uma ação de movimento e 1 PM para envenenar uma arma; ela causa +1d12 de veneno até acertar ou até o fim da cena."],
["Olhar Atordoante","Gasta uma ação de movimento e 1 PM para exigir Fortitude de uma criatura em alcance curto. Se falhar, fica atordoada por 1 rodada; se passar, fica imune por um dia."],
["Inspiração","Gasta uma ação padrão e 2 PM para dar a você e aliados em alcance curto +1 em testes de perícia até o fim da cena. A cada quatro níveis, pode gastar +2 PM para aumentar o bônus em +1."],
["Eclético","A partir do 2º nível, pode gastar 1 PM para receber, em um teste, todos os benefícios de ser treinado em uma perícia."],
["Inspiração Revigorante","Ao usar Inspiração, você e seus aliados recebem PV temporários iguais a 5 vezes o bônus concedido."],
["Dom Artístico","Recebe +2 em testes de Atuação e o dobro de tibares em apresentações."],
["Atraente","Recebe +2 em testes de perícias baseadas em Carisma contra criaturas que possam se sentir fisicamente atraídas por você."],
["Bênção do Mana","Recebe +1 PM a cada nível ímpar."]
],
skills:{Acrobacia:2,Atuação:6,Diplomacia:6,Enganação:6,Fortitude:4,Furtividade:7,Iniciativa:5,Intuição:4,Percepção:3,Reflexos:7,Vontade:3},
trained:["Atuação","Diplomacia","Enganação","Furtividade"],
items:[["Mochila",0],["Saco de dormir",1],["Traje de viajante",0],["Espada Curta",1],["Machadinha",1],["Armadura de couro",2]]}
};

const clone=o=>JSON.parse(JSON.stringify(o));
let state=JSON.parse(localStorage.getItem(KEY)||"null")||clone(base);
let selected=localStorage.getItem(KEY+"-selected")||"Hippion";
let tab="Resumo";

function migrate(){
  Object.entries(base).forEach(([name,b])=>{
    if(!state[name]) state[name]=clone(b);
    const c=state[name];
    c.maxLoad=10+(Number(c.attrs?.FOR)||0)*2;
    if(!Array.isArray(c.items)) c.items=clone(b.items);
    c.items=c.items.map(x=>Array.isArray(x)?x:[x,1]);
    if(!Array.isArray(c.trained)) c.trained=clone(b.trained);
    if(!c.powers || !Array.isArray(c.powers) || typeof c.powers[0]==="string") c.powers=clone(b.powers);
    if(!c.skills) c.skills=clone(b.skills);
    if(!c.image) c.image="";
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
  const sync=$(".sync"); if(sync) sync.textContent="✓ Salvo neste aparelho";
}
function toast(t){
  const e=$("#toast"); e.textContent=t; e.classList.add("show");
  clearTimeout(window.tt); window.tt=setTimeout(()=>e.classList.remove("show"),1800);
}

function render(){
 const c=state[selected];
 document.title="Por Um Fio — "+selected;
 const tabs=["Resumo","Ataques","Poderes","Mochila","Perícias"];
 $("#app").innerHTML=`<div class="shell">
  <header class="top"><div class="brand">POR UM FIO</div><div class="badge">mesa ativa</div></header>
  <section class="hero"><div class="eyebrow">Tormenta20 • campanha</div><h1>Por Um Fio</h1><p>5 personagens • ficha de mesa • salvamento local</p></section>
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
 bindBody();
}

function body(c){
 if(tab==="Resumo") return `
  <div class="bars">
   <div class="statcard"><div class="label">Pontos de Vida</div><div class="big">${c.hp} / ${c.maxHp}</div><div class="controls"><button data-hp="-1">−</button><button data-hp="1" class="plus">+</button></div></div>
   <div class="statcard"><div class="label">Pontos de Mana</div><div class="big">${c.mp} / ${c.maxMp}</div><div class="controls"><button data-mp="-1">−</button><button data-mp="1" class="plus">+</button></div></div>
  </div>
  <div class="section"><div class="sectiontitle"><h3>Defesas e combate</h3></div><div class="grid">${[['Defesa',c.def],['Fortitude',c.fort],['Reflexos',c.ref],['Vontade',c.will],['Iniciativa',c.init],['Percepção',c.per]].map(x=>`<div class="mini"><span class="label">${x[0]}</span><strong>${x[1]}</strong></div>`).join("")}</div></div>
  <div class="section"><div class="sectiontitle"><h3>Atributos</h3></div><div class="grid">${Object.entries(c.attrs).map(x=>`<div class="mini"><span class="label">${x[0]}</span><strong>${x[1]>=0?"+":""}${x[1]}</strong></div>`).join("")}</div></div>
  <div class="section"><div class="sectiontitle"><h3>Movimento</h3></div><div class="row"><div><b>Deslocamento</b><div class="sub">Carga ${load(c)} / ${capacity(c)} espaços</div></div><span class="pill">${c.speed}m</span></div></div>
  <div class="sync">✓ Salvo neste aparelho</div>`;
 if(tab==="Ataques") return `<div class="list">${c.attacks.map((a,i)=>`<div class="row"><div><b>⚔️ ${esc(a[0])}</b><div class="sub">${a[1]} • ${a[2]} • ${a[3]} • ${a[4]} • ${a[5]}</div></div><button class="roll" data-attack="${i}">Rolar</button></div>`).join("")}</div><div class="sync">Rolagens são d20 locais.</div>`;
 if(tab==="Poderes") return `<div class="list powers">${c.powers.map(p=>`<details class="power"><summary><span class="power-icon">✦</span><b>${esc(p[0])}</b></summary><div class="power-text">${esc(p[1])}</div></details>`).join("")}</div>`;
 if(tab==="Mochila") return inventory(c);
 return `<div class="skills">${Object.entries(c.skills).map(([n,v])=>`<div class="skill ${c.trained.includes(n)?"trained":""}"><button data-skill="${esc(n)}">${c.trained.includes(n)?'<span class="trained-mark">◆</span>':""}${esc(n)}</button><b>${v==null?"—":"+"+v}</b></div>`).join("")}</div><div class="legend"><span class="trained-mark">◆</span> Perícia treinada</div><div class="sync">Toque em uma perícia para rolar.</div>`;
}

function inventory(c){
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