// Bichinho virtual: só diversão. Nada daqui mexe na ficha nem na mesa.

const FALAS = {
  hippion: ['Mar calmo nunca fez bom marinheiro.', 'Cadê meu tridente? Ah, tá aqui.', 'Alguém aí tem um peixe?', 'Hoje o vento tá a nosso favor!'],
  malekir: ['O conhecimento é a única chama que não se apaga.', 'Não encoste nos meus pergaminhos.', 'Wynna, me dê paciência com este grupo.', 'Sinto cheiro de magia antiga…'],
  fani: ['Psiu! A floresta tá ouvindo.', 'Meu camaleão mudou de cor de novo.', 'Já abraçou uma árvore hoje?', 'Allihanna cuida da gente.'],
  neo: ['…', 'Brilhante. Posso pegar?', 'Sssh. Tem alguém vindo.', 'Aposto que você não me viu chegar.'],
  zuri: ['Uma música pra alegrar a mesa?', 'Minhas cobras gostaram de você.', 'Não olha muito fundo nos meus olhos, hein.', 'O show não pode parar!'],
};
const HABITAT = {
  hippion: { ceu: '#233a52', chao: '#c9a86a', meio: '#2f6d8f', deco: 'mar' },
  malekir: { ceu: '#24183a', chao: '#3a2a3e', meio: '#2c1f40', deco: 'arcano' },
  fani: { ceu: '#1f3a2a', chao: '#4a6a2e', meio: '#2a4a2a', deco: 'floresta' },
  neo: { ceu: '#14161a', chao: '#2e2a22', meio: '#1c1e20', deco: 'esgoto' },
  zuri: { ceu: '#2a1830', chao: '#5a3a28', meio: '#3a1e3a', deco: 'palco' },
};

export function installBichinho(ctx) {
  const { S, ui, sb, esc, num, toast, render, actions } = ctx;
  ui.pet = ui.pet || { fala: {}, anim: null };
  const canCare = (cid) => S.me && (S.me.character_id === cid || S.me.role === 'admin' || S.me.role === 'gm');

  function efetivo(p) {
    const h = Math.max(0, (Date.now() - new Date(p.updated_at).getTime()) / 36e5);
    const hunger = Math.min(100, Math.round(num(p.hunger) + h * 4));
    const energy = p.sleeping ? Math.min(100, Math.round(num(p.energy) + h * 15)) : Math.max(0, Math.round(num(p.energy) - h * 3));
    const mood = Math.max(0, Math.round(num(p.mood) - h * 2 - (hunger > 70 ? h * 2 : 0)));
    return { ...p, hunger, energy, mood };
  }
  function humor(e) {
    if (e.sleeping) return 'Dormindo';
    if (e.hunger > 75) return 'Com fome';
    if (e.energy < 20) return 'Cansado';
    if (e.mood > 75) return 'Radiante';
    if (e.mood > 45) return 'De boa';
    if (e.mood > 20) return 'Meio pra baixo';
    return 'Tristinho';
  }
  function fala(cid, e) {
    if (ui.pet.fala[cid]) return ui.pet.fala[cid];
    if (e.sleeping) return 'Zzz…';
    if (e.hunger > 75) return 'Tô com fome…';
    if (e.energy < 20) return 'Que soninho…';
    if (e.mood < 25) return 'Ninguém me dá atenção…';
    const l = FALAS[cid] || ['Oi!'];
    return l[Math.floor(Date.now() / 60000) % l.length];
  }
  const meter = (v, cor) => `<div class="meter">${Array.from({ length: 10 }, (_, i) => `<i style="${i < Math.round(v / 10) ? `background:${cor}` : ''}"></i>`).join('')}</div>`;

  function habitat(cid) {
    const h = HABITAT[cid] || HABITAT.hippion;
    const deco = {
      mar: `<div class="hb-sol"></div><div class="hb-onda"></div><div class="hb-agua" style="background:${h.meio}"></div><div class="hb-concha"></div>`,
      arcano: `<div class="hb-estante"></div><div class="hb-vela" style="left:18%"></div><div class="hb-vela" style="right:16%"></div><div class="hb-runa"></div>`,
      floresta: `<div class="hb-arvore" style="left:6%"></div><div class="hb-arvore" style="right:4%;transform:scale(.8)"></div><div class="hb-flor" style="left:30%"></div><div class="hb-flor" style="right:28%"></div>`,
      esgoto: `<div class="hb-cano"></div><div class="hb-gota"></div><div class="hb-olhos"></div>`,
      palco: `<div class="hb-cortina" style="left:0"></div><div class="hb-cortina" style="right:0"></div><div class="hb-holofote"></div>`,
    }[h.deco];
    return `<div class="hb" style="background:${h.ceu}">${deco}<div class="hb-chao" style="background:${h.chao}"></div></div>`;
  }

  function viewLista() {
    const ids = S.order.filter((id) => S.pets[id]);
    return `<header class="topbar"><div class="brand">BICHINHOS</div></header>
      <div class="page"><h1 class="disp" style="margin:0 2px;font-size:26px">Bichinhos da mesa</h1>
        <p class="small muted" style="margin:0 2px">Só diversão: nada daqui mexe na ficha nem na mesa. Visite e faça carinho nos dos outros.</p>
        <div class="grid2">${ids.map((id) => { const e = efetivo(S.pets[id]); return `<a class="card" href="#/bichinho/${id}" style="text-decoration:none;color:var(--txt);display:flex;flex-direction:column;align-items:center;gap:4px">
          <div class="pet${e.sleeping ? ' zz' : ''}" style="width:96px;height:96px;background-image:url('assets/pixel/${id}.png')"></div>
          <b>${esc(S.chars[id].name)}</b><span class="small muted">${humor(e)}</span></a>`; }).join('')}</div></div>`;
  }

  function viewPet(cid) {
    const p = S.pets[cid], c = S.chars[cid];
    if (!p || !c) return viewLista();
    const e = efetivo(p), meu = canCare(cid);
    const anim = ui.pet.anim && ui.pet.anim.cid === cid ? ui.pet.anim.tipo : '';
    return `<header class="topbar"><a class="sm" style="display:flex;align-items:center;justify-content:center;text-decoration:none" href="#/bichinho" aria-label="Todos os bichinhos">‹</a>
        <div class="disp" style="font-size:20px;font-weight:700">${esc(c.name)}</div><div style="width:38px"></div></header>
      <div class="page">
        <section class="hb-wrap">
          ${habitat(cid)}
          <button class="hb-pet ${anim}" data-act="petTap" data-c="${cid}" aria-label="Tocar no ${esc(c.name)}">
            <span class="pet${e.sleeping ? ' zz' : ''}" style="width:100%;height:100%;background-image:url('assets/pixel/${cid}.png')"></span>
          </button>
          ${anim === 'amor' ? '<div class="fx fx-amor"><i></i><i></i><i></i></div>' : ''}
          ${anim === 'comida' ? '<div class="fx fx-comida"><i></i></div>' : ''}
          ${e.sleeping ? '<div class="fx-zz">z<span>z</span><b>Z</b></div>' : ''}
          <div class="hb-fala">${esc(fala(cid, e))}</div>
        </section>
        <section class="card" style="display:flex;flex-direction:column;gap:12px">
          <div><div class="row small" style="justify-content:space-between"><b>Ânimo</b><span class="muted">${humor(e)}</span></div>${meter(e.mood, '#e5c06a')}</div>
          <div><div class="row small" style="justify-content:space-between"><b>Fome</b><span class="muted">${e.hunger > 75 ? 'quer comer já' : e.hunger > 40 ? 'aceitaria um petisco' : 'de barriga cheia'}</span></div>${meter(e.hunger, '#f0a35e')}</div>
          <div><div class="row small" style="justify-content:space-between"><b>Energia</b><span class="muted">${e.energy < 20 ? 'precisa dormir' : e.energy > 70 ? 'cheio de gás' : 'bem disposto'}</span></div>${meter(e.energy, '#7fb8e0')}</div>
        </section>
        <div class="grid2" style="grid-template-columns:repeat(${meu ? 4 : 1},minmax(0,1fr))">
          <button class="act" data-act="petAct" data-a="carinho" data-c="${cid}">Carinho</button>
          ${meu ? `<button class="act" data-act="petAct" data-a="petisco" data-c="${cid}">Petisco</button>
          <button class="act" data-act="petAct" data-a="brincar" data-c="${cid}">Brincar</button>
          <button class="act" data-act="petAct" data-a="dormir" data-c="${cid}">${e.sleeping ? 'Acordar' : 'Dormir'}</button>` : ''}
        </div>
        <p class="small muted" style="margin:0 2px">${num(p.pats)} carinho${num(p.pats) === 1 ? '' : 's'} recebido${num(p.pats) === 1 ? '' : 's'}${p.last_pat_by ? ` · o último foi de ${esc(p.last_pat_by)}` : ''}. Só diversão: nada daqui mexe na ficha nem na mesa.</p>
      </div>`;
  }

  function animar(cid, tipo) {
    ui.pet.anim = { cid, tipo }; render();
    clearTimeout(animar.t); animar.t = setTimeout(() => { ui.pet.anim = null; render(); }, 1300);
  }
  async function salvar(cid, mud) {
    const e = efetivo(S.pets[cid]);
    const novo = { mood: e.mood, hunger: e.hunger, energy: e.energy, sleeping: e.sleeping, ...mud, updated_at: new Date().toISOString() };
    ['mood', 'hunger', 'energy'].forEach((k) => { novo[k] = Math.max(0, Math.min(100, Math.round(novo[k]))); });
    Object.assign(S.pets[cid], novo);
    const { error } = await sb.from('pets').update(novo).eq('character_id', cid);
    if (error) toast('Não consegui salvar.');
  }

  Object.assign(actions, {
    petTap(el) {
      const cid = el.dataset.c, l = FALAS[cid] || ['Oi!'];
      ui.pet.fala[cid] = l[Math.floor(Math.random() * l.length)];
      clearTimeout(actions.petTap.t); actions.petTap.t = setTimeout(() => { delete ui.pet.fala[cid]; render(); }, 5000);
      animar(cid, 'pulo');
    },
    async petAct(el) {
      const cid = el.dataset.c, a = el.dataset.a, e = efetivo(S.pets[cid]);
      if (a === 'carinho') {
        animar(cid, 'amor');
        S.pets[cid].mood = Math.min(100, e.mood + 8); S.pets[cid].pats = num(S.pets[cid].pats) + 1;
        const { error } = await sb.rpc('pet_pat', { cid });
        if (error) toast('Não consegui fazer carinho agora.');
        return;
      }
      if (e.sleeping && a !== 'dormir') { ui.pet.fala[cid] = 'Zzz… (ele tá dormindo)'; render(); setTimeout(() => { delete ui.pet.fala[cid]; render(); }, 2500); return; }
      if (a === 'petisco') {
        if (e.hunger < 10) { ui.pet.fala[cid] = 'Não cabe mais nada!'; setTimeout(() => { delete ui.pet.fala[cid]; render(); }, 2500); render(); return; }
        animar(cid, 'comida'); await salvar(cid, { hunger: e.hunger - 25, mood: e.mood + 3 });
      }
      if (a === 'brincar') {
        if (e.energy < 15) { ui.pet.fala[cid] = 'Tô sem energia pra isso…'; setTimeout(() => { delete ui.pet.fala[cid]; render(); }, 2500); render(); return; }
        animar(cid, 'pulo'); await salvar(cid, { energy: e.energy - 15, mood: e.mood + 12, hunger: e.hunger + 5 });
      }
      if (a === 'dormir') { await salvar(cid, { sleeping: !e.sleeping }); render(); }
    },
  });

  function onRealtime(p) {
    if (p.new?.character_id) S.pets[p.new.character_id] = p.new;
  }

  return { viewPet, viewLista, onRealtime };
}
