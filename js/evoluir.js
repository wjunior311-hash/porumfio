// Assistente de subir de nível: mostra o que vem automático, recomenda poderes e aplica tudo na ficha.
import { ganhosDoNivel, aplicarNivel, checarPreRequisitos, perfil, sentiFalta, tagsDe } from './evolucao.js';

const NOME_ESTILO = { ataque: 'dano', defesa: 'defesa', mobilidade: 'movimento', furtivo: 'furtividade', controle: 'controle', suporte: 'ajuda o grupo', magia: 'magia', social: 'conversa' };

export function installEvoluir(ctx) {
  const { S, ui, sb, esc, num, toast, render, actions, forms, patch } = ctx;
  ui.evo = ui.evo || {};
  const st = (cid) => (ui.evo[cid] ||= { escolha: null, outro: { nome: '', desc: '' }, magia: { nome: '', meta: '', desc: '' }, todos: false, abertos: {} });

  async function carregarPoderes() {
    if (S.classPowers) return;
    const { data } = await sb.from('class_powers').select('*').order('name');
    S.classPowers = data || [];
    render();
  }

  function opcoes(cid) {
    const d = S.chars[cid].data, g = ganhosDoNivel(d);
    const tenho = new Set((d.powers || []).map((p) => p[0].replace(/\s*\(x\d+\)$/, '').toLowerCase()));
    const prof = perfil(d);
    return (S.classPowers || []).filter((p) => p.class === d.className).map((p) => {
      const pre = checarPreRequisitos(p.prereq, d, g.para);
      const repetivel = /pode escolher (este poder )?(várias|outras) vezes|escolher novamente/i.test(p.description);
      const ja = tenho.has(p.name.toLowerCase()) && !repetivel;
      const tags = tagsDe(p.name + ' ' + p.description);
      const combina = tags.filter((t) => prof.top.includes(t));
      return { ...p, pre, ja, tags, combina, ok: pre.ok && !ja };
    });
  }

  function viewEvoluir(cid) {
    const c = S.chars[cid];
    if (!c) return '<div class="page"><p>Personagem não encontrado.</p></div>';
    const d = c.data, g = ganhosDoNivel(d);
    if (!g) return `<div class="page"><p class="muted">A classe ${esc(d.className)} ainda não está no assistente.</p></div>`;
    if (!S.classPowers) carregarPoderes();
    const s = st(cid), ops = opcoes(cid), prof = perfil(d), falta = sentiFalta(d);
    const rec = ops.filter((o) => o.ok && o.combina.length).sort((a, b) => b.combina.length - a.combina.length).slice(0, 3);
    const outros = ops.filter((o) => !rec.includes(o));
    const pericias = g.meio || g.treinoMais
      ? `<div class="row" style="justify-content:space-between"><span>Perícias</span><span class="disp" style="color:var(--gold)">+${g.meio} em todas${g.treinoMais ? `, +${g.meio + g.treinoMais} nas treinadas` : ''}</span></div>` : '';
    const cardPoder = (o, destaque) => {
      const sel = s.escolha === o.name, aberto = s.abertos[o.name] || destaque;
      const motivo = !o.ok ? (o.ja ? 'Você já tem' : 'Falta: ' + o.pre.falta.join(', ')) : '';
      return `<div class="pick${sel ? ' pick-on' : ''}${o.ok ? '' : ' off'}">
        <div class="row" style="justify-content:space-between;gap:8px">
          <span style="font-weight:700">${esc(o.name)}</span>
          ${destaque ? '<span class="chip" style="background:var(--gold);color:#1d1720">COMBINA</span>' : !o.ok ? '<span class="chip" style="background:#2a2232;color:var(--muted)">BLOQUEADO</span>' : ''}
        </div>
        ${destaque && o.combina.length ? `<span class="small" style="color:#f0d38a">Puxa para ${o.combina.map((t) => NOME_ESTILO[t]).join(' e ')}, como o resto da sua ficha.</span>` : ''}
        ${motivo ? `<span class="small" style="color:#f0b9a0">${esc(motivo)}</span>` : ''}
        ${aberto ? `<span class="small" style="color:#c9bfcc;line-height:1.45">${esc(o.description)}</span>` : ''}
        <div class="row" style="gap:8px">
          ${destaque ? '' : `<button class="link" data-act="evoAbrir" data-c="${cid}" data-n="${esc(o.name)}">${aberto ? 'Fechar' : 'Ler'}</button>`}
          <span style="flex:1"></span>
          ${o.ok ? `<button class="${sel ? 'use' : 'ghost'}" data-act="evoEscolher" data-c="${cid}" data-n="${esc(o.name)}">${sel ? 'Escolhido' : 'Escolher'}</button>` : ''}
        </div></div>`;
    };
    const podeConfirmar = (!g.ganhaPoder || s.escolha) && true;
    return `<header class="topbar"><a class="sm" style="display:flex;align-items:center;justify-content:center;text-decoration:none" href="#/ficha/${cid}" aria-label="Voltar para a ficha">‹</a>
        <div class="brand">SUBINDO DE NÍVEL</div><div style="width:38px"></div></header>
      <div class="page">
        <section class="row" style="gap:14px">
          <div class="pet hop" style="width:76px;height:76px;background-image:url('assets/pixel/${cid}.png')"></div>
          <div><div class="small muted">${esc(c.name)} · ${esc(d.className)}</div><h1 class="disp" style="margin:0;font-size:30px">Nível ${g.de} <span style="color:var(--gold)">→ ${g.para}</span></h1></div>
        </section>

        <section class="card" style="display:flex;flex-direction:column;gap:10px">
          <h2 class="lbl">Vem automático</h2>
          <div class="row" style="justify-content:space-between"><span>Pontos de vida <span class="muted small">(${esc(g.pvFormula)})</span></span><span class="disp" style="color:var(--red-l)">${num(d.maxHp)} → ${num(d.maxHp) + g.pv}</span></div>
          <div class="row" style="justify-content:space-between"><span>Pontos de mana <span class="muted small">(${g.cls.pm} por nível${g.pmNotas.length ? ', ' + esc(g.pmNotas.join(', ')) : ''})</span></span><span class="disp" style="color:var(--blue-l)">${num(d.maxMp)} → ${num(d.maxMp) + g.pm}</span></div>
          ${pericias}
          ${g.esquiva ? `<div class="row" style="justify-content:space-between"><span>Esquiva sagaz</span><span class="disp" style="color:var(--gold)">+1 Defesa e Reflexos</span></div>` : ''}
          ${g.automaticas.filter((x) => !/^esquiva sagaz/.test(x)).map((x) => `<div><b>${esc(x[0].toUpperCase() + x.slice(1))}</b> <span class="small muted">— leia na sua classe no livro</span></div>`).join('')}
          ${g.circuloNovo ? `<div><b>Novo círculo de magia:</b> ${esc(g.circuloNovo)}. Os aprimoramentos que pediam esse círculo destravam sozinhos.</div>` : ''}
        </section>

        ${g.ganhaPoder ? `<section style="display:flex;flex-direction:column;gap:8px">
          <h2 class="lbl" style="margin:0 2px">Escolha um poder de ${esc(d.className.toLowerCase())}</h2>
          ${!S.classPowers ? '<p class="small muted">Carregando os poderes…</p>' : `
          ${prof.frase ? `<p class="when" style="margin:0 2px">Seu estilo parece de <b>${esc(prof.frase)}</b>. Estes combinam:</p>` : ''}
          ${rec.map((o) => cardPoder(o, true)).join('') || '<p class="small muted" style="margin:0 2px">Nenhuma recomendação clara: veja a lista toda.</p>'}
          ${falta.length ? `<div class="card" style="background:#20283a;border-color:#2f3b55;color:#dbe2ff;font-size:14px;line-height:1.45"><b>Sente falta disso?</b> ${falta.map(esc).join(' ')}</div>` : ''}
          <button class="ghost" style="height:44px" data-act="evoTodos" data-c="${cid}">${s.todos ? 'Esconder a lista toda' : `Ver todos os poderes de ${esc(d.className.toLowerCase())} (${ops.length})`}</button>
          ${s.todos ? outros.sort((a, b) => (b.ok - a.ok) || a.name.localeCompare(b.name, 'pt')).map((o) => cardPoder(o, false)).join('') : ''}
          <div class="pick${s.escolha === '__outro' ? ' pick-on' : ''}">
            <span style="font-weight:700">Outro poder</span>
            <span class="small muted">Poder geral, de origem ou da sua divindade, no lugar do poder de classe.</span>
            <label class="sr" for="evo-on">Nome do poder</label><input class="field" id="evo-on" placeholder="Nome do poder" value="${esc(s.outro.nome)}" data-in="evoOutroNome" data-c="${cid}">
            <label class="sr" for="evo-od">O que ele faz</label><textarea class="field" id="evo-od" style="min-height:70px" placeholder="O que ele faz" data-in="evoOutroDesc" data-c="${cid}">${esc(s.outro.desc)}</textarea>
            <div class="row"><span style="flex:1"></span><button class="${s.escolha === '__outro' ? 'use' : 'ghost'}" data-act="evoEscolher" data-c="${cid}" data-n="__outro">${s.escolha === '__outro' ? 'Escolhido' : 'Escolher este'}</button></div>
          </div>`}
        </section>` : ''}

        ${g.magiaNova ? `<section class="card" style="display:flex;flex-direction:column;gap:10px">
          <h2 class="lbl">Aprenda uma magia nova</h2>
          <p class="small muted" style="margin:0">Escolha no livro ou no baralho de magias, de um círculo que você já pode lançar${g.circuloNovo ? ` (agora até o ${esc(g.circuloNovo)})` : ''}. Pode deixar em branco e adicionar depois.</p>
          <div><label class="flab" for="evo-mn">Nome</label><input class="field" id="evo-mn" value="${esc(s.magia.nome)}" data-in="evoMagiaNome" data-c="${cid}" placeholder="Ex.: Raio do Enfraquecimento"></div>
          <div><label class="flab" for="evo-mm">Linha de cima da carta</label><input class="field" id="evo-mm" value="${esc(s.magia.meta)}" data-in="evoMagiaMeta" data-c="${cid}" placeholder="1º • Necromancia • Padrão • Curto • 1 criatura • Cena • Fortitude parcial • 1 PM"></div>
          <div><label class="flab" for="evo-md">Texto da magia (com os aprimoramentos)</label><textarea class="field" id="evo-md" style="min-height:120px" data-in="evoMagiaDesc" data-c="${cid}" placeholder="O que ela faz.&#10;&#10;Aprimoramentos:&#10;+1 PM: …">${esc(s.magia.desc)}</textarea></div>
        </section>` : ''}

        <button class="primary" data-act="evoConfirmar" data-c="${cid}" ${podeConfirmar ? '' : 'disabled'}>${g.ganhaPoder && !s.escolha ? 'Escolha um poder para continuar' : `Subir para o nível ${g.para}`}</button>
        <p class="small muted" style="margin:0 2px;text-align:center">Depois de subir, o mestre pode desfazer ajustando a ficha.</p>
      </div>`;
  }

  Object.assign(actions, {
    evoEscolher(el) { st(el.dataset.c).escolha = el.dataset.n; render(); },
    evoAbrir(el) { const s = st(el.dataset.c); s.abertos[el.dataset.n] = !s.abertos[el.dataset.n]; render(); },
    evoTodos(el) { const s = st(el.dataset.c); s.todos = !s.todos; render(); },
    async liberarNivel(el) { const c = S.chars[el.dataset.c]; await patch(c.id, { levelUp: !c.data.levelUp }); toast(c.data.levelUp ? `${c.name} pode subir de nível.` : 'Subida de nível cancelada.'); },
    async evoConfirmar(el) {
      const cid = el.dataset.c, c = S.chars[cid], d = c.data, g = ganhosDoNivel(d), s = st(cid);
      let poder = null;
      if (g.ganhaPoder) {
        if (s.escolha === '__outro') {
          if (!s.outro.nome.trim()) return toast('Escreva o nome do poder.');
          poder = [s.outro.nome.trim(), s.outro.desc.trim()];
        } else {
          const o = (S.classPowers || []).find((p) => p.class === d.className && p.name === s.escolha);
          if (!o) return toast('Escolha um poder.');
          poder = [o.name, o.description];
        }
      }
      if (!confirm(`Subir ${c.name} para o nível ${g.para}?`)) return;
      const mud = aplicarNivel(d, g);
      if (poder) mud.powers = [...(d.powers || []), poder];
      await patch(cid, mud);
      if (g.magiaNova && s.magia.nome.trim()) {
        const meta = s.magia.meta.trim() || '1º • 1 PM';
        const { data, error } = await sb.from('character_spells').insert({ character_id: cid, sort: (S.spells[cid] || []).length, name: s.magia.nome.trim(), meta, description: s.magia.desc.trim() }).select().single();
        if (error) toast('O nível subiu, mas não consegui salvar a magia. Adicione depois.');
        else (S.spells[cid] ||= []).push(data);
      }
      delete ui.evo[cid];
      toast(`${c.name} agora é nível ${g.para}!`);
      location.hash = '#/ficha/' + cid;
    },
  });

  document.addEventListener('input', (ev) => {
    const k = ev.target.dataset.in, cid = ev.target.dataset.c;
    if (!k || !k.startsWith('evo')) return;
    const s = st(cid);
    if (k === 'evoOutroNome') s.outro.nome = ev.target.value;
    if (k === 'evoOutroDesc') s.outro.desc = ev.target.value;
    if (k === 'evoMagiaNome') s.magia.nome = ev.target.value;
    if (k === 'evoMagiaMeta') s.magia.meta = ev.target.value;
    if (k === 'evoMagiaDesc') s.magia.desc = ev.target.value;
  });

  return { viewEvoluir };
}
