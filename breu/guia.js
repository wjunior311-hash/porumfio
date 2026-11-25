// O guia da mesa, dentro do app: o mestre segue a sessão por aqui e aperta os botões que mexem no mapa.
import { GENTE, VISTO, ROLA, FX_C, PISTAS, PISTA_ONDE, MUNDO, ATOS, RESOLVER, SITUACOES, MOMENTOS as M } from './guia-dados.js?v=17';

export const PADRAO_GUIA = { aqui: 'inicio', trecho: '', corpo: '', celeste: '', bras: '', pistas: [], tarefas: {}, rec: {}, armado: [] };
// o que o grupo conseguiu durante o dia; muda o conserto, o corpo e a noite
export const RECURSOS = [
  ['cal', 'Saco de cal', 'do mocó', 'Sem ele, o conserto do círculo tem −2.'],
  ['lenha', 'Feixes de lenha', 'do mocó', 'Para queimar o corpo são precisos 2.', 2],
  ['caixa', 'Caixa de riscador de Antero', 'no velório', '+1 dado no conserto.'],
  ['caderno', 'Caderno de lições', 'na casa do aprendiz', '+1 dado no conserto.'],
  ['bento', 'Bento ajudando', 'conversando com ele', '+1 dado no conserto.'],
  ['po', 'O pó que chia', 'com o homem tatuado', 'Jogado no braço da bordadeira, revela as Marcas.'],
  ['trancas', 'Trancas nas portas', 'mutirão na oficina', 'Se o círculo cair, quem está nas casas trancadas sobrevive.'],
  ['agua', 'Potes cheios', 'na casa de farinha', 'A vila aguenta a noite sem sede.'],
];
export const faixaDe = (total) => (total < 10 ? 0 : total < 15 ? 1 : total < 20 ? 2 : 3);
// o atributo de cada rolagem que não é perícia
const ATR_DIRETO = { Firmeza: 'firmeza', Presença: 'presenca', Vigor: 'vigor', Agilidade: 'agilidade', Juízo: 'juizo' };
export { ROLA, GENTE, VISTO, PISTAS };

export function criarGuia(ctx) {
  const { S, R, esc } = ctx;
  let E = { ...PADRAO_GUIA };
  const estado = () => E;
  function setEstado(v) { E = { ...PADRAO_GUIA, ...(v || {}) }; E.rec ||= {}; E.armado ||= []; }
  const rec = (k) => E.rec?.[k] || 0;
  // o que vale agora no conserto do círculo, pelo que o grupo juntou
  function bonusConserto() {
    const d = ['caixa', 'caderno', 'bento'].filter((k) => rec(k)).length;
    return `<div class="g-agora"><b>Agora:</b> ${d ? `+${d} dado${d > 1 ? 's' : ''} (${['caixa', 'caderno', 'bento'].filter((k) => rec(k)).map((k) => RECURSOS.find((r) => r[0] === k)[1].toLowerCase()).join(', ')})` : 'nenhum dado a mais'} · ${rec('cal') ? 'com cal' : '<span class="ruim">sem cal: −2 no resultado</span>'}. <small>Marque o que conseguiram na aba A história.</small></div>`;
  }
  function recBotoes(ks) {
    return `<div class="g-recs">${ks.map((k) => { const r = RECURSOS.find((x) => x[0] === k), n = rec(k), max = r[4];
      return max ? `<div class="g-rec ${n ? 'on' : ''}"><span>${r[1]}</span><button data-g="rec" data-k="${k}" data-v="-1" aria-label="Menos">−</button><b>${n}/${max}</b><button data-g="rec" data-k="${k}" data-v="1" aria-label="Mais">+</button></div>`
        : `<button class="g-rec ${n ? 'on' : ''}" data-g="rec" data-k="${k}" data-v="t"><i>${n ? '✓' : ''}</i>${r[1]}</button>`; }).join('')}</div>`;
  }
  function mudar(patch) { E = { ...E, ...patch }; ctx.salvar(E); }

  // ---------- dados dos personagens, tirados das fichas ----------
  const pjs = () => S.chars.filter((c) => c.status === 'aprovado' && !(S.mesa?.ausentes || []).includes(c.id));
  function dadosDe(c, per) {
    const p = c.data, at = R.atrib(p);
    if (ATR_DIRETO[per]) return { n: at[ATR_DIRETO[per]] || 1, b: 0 };
    return { n: at[R.PERICIA_ATRIB[per]] || 1, b: R.bonusPericia(R.grauPericia(p, per)) };
  }
  const forca = (d) => d.n * 10 + d.b * 2;
  const txtDados = (d) => `${d.n}d20${d.b ? '+' + d.b : ''}`;
  function melhor(c, r) { return [r.per, r.alt].filter(Boolean).map((per) => ({ per, ...dadosDe(c, per) })).sort((a, b) => forca(b) - forca(a))[0]; }

  // ---------- pedaços ----------
  const leiaHtml = (l) => `<div class="g-leia">${l.map(([q, t]) => `<p>${q ? `<span class="g-quem">${esc(q)}</span>` : ''}${esc(t)}</p>`).join('')}</div>`;
  function avatar(id) { const g = GENTE[id]; return g.foto ? `<span class="g-av" style="background-image:url('${g.foto}')"></span>` : `<span class="g-av">${g.nome.replace(/^(Dona|Seu) /, '')[0]}</span>`; }
  const genteHtml = (ids) => `<div class="g-gente">${ids.map((id) => `<button class="g-chip" data-g="npc" data-v="${id}">${avatar(id)}<span>${GENTE[id].nome}<small>eles veem: ${VISTO[id][0]}</small></span></button>`).join('')}</div>`;

  function acaoBtn([tipo, v]) {
    const nome = ctx.nomeAcao(tipo, v);
    if (!nome) return '';
    const feito = nome.startsWith('✓');
    return `<button class="g-acao ${feito ? 'feito' : ''}" data-g="acao" data-t="${tipo}" data-v="${esc(v ?? '')}"><span>${feito ? '✓' : '▶'}</span>${esc(feito ? nome.slice(2) : nome)}</button>`;
  }

  // respostas ao pedido que está valendo
  function respostasHtml(id) {
    const p = [...(S.pedidos || [])].reverse().find((x) => x.rola === id); if (!p) return '';
    const r = ROLA[id], quem = p.quem?.length ? pjs().filter((c) => p.quem.includes(c.id)) : pjs();
    const rolls = S.rolls.filter((x) => x.detail?.pedido === p.id);
    return `<div class="g-resp"><div class="g-resp-h"><b>Pedido no ar</b><button class="g-mini" data-g="cancelar" data-v="${p.id}">Encerrar o pedido</button></div>
      ${quem.map((c) => { const x = rolls.find((y) => y.character_id === c.id);
        if (!x) return `<div class="g-r esperando"><span>${esc(c.data.nome)}</span><i>esperando…</i></div>`;
        const f = faixaDe(x.total);
        return `<div class="g-r f${f}"><span>${esc(c.data.nome)}</span><b>${x.total}</b><em>${FX_C[f]}</em><p>${esc(r.f[f])}</p></div>`; }).join('')}</div>`;
  }

  function rolaHtml(id, pistaExtra) {
    const r = ROLA[id], pers = [r.per, r.alt].filter(Boolean);
    const lista = pjs().map((c) => ({ c, d: melhor(c, r) })).sort((a, b) => forca(b.d) - forca(a.d));
    const top = lista[0] ? forca(lista[0].d) : 0;
    const pista = pistaExtra || r.pista;
    const pedindo = (S.pedidos || []).some((x) => x.rola === id);
    return `<div class="g-rola">
      <p class="g-pede">Peça <b>${pers.join(' ou ')}</b> · ${esc(r.quem)}</p>
      ${r.pede ? `<p class="g-nota">${r.pede}</p>` : ''}
      ${id === 'conserto' ? bonusConserto() : ''}
      <div class="g-pedir"><button class="g-acao forte" data-g="pedir" data-v="${id}" data-q="">${pedindo ? 'Pedir de novo a todos' : 'Pedir a todos'}</button>
        ${lista.map(({ c, d }) => `<button class="g-dado ${forca(d) === top ? 'bom' : ''}" data-g="pedir" data-v="${id}" data-q="${c.id}" title="Pedir só a ${esc(c.data.nome)}">${esc(c.data.nome)} ${txtDados(d)}</button>`).join('')}</div>
      ${respostasHtml(id)}
      <div class="g-faixas">${r.f.map((t, i) => `<div class="g-faixa f${i}"><b>${FX_C[i]}</b><p>${esc(t)}</p></div>`).join('')}</div>
      ${r.nota ? `<p class="g-nota">${esc(r.nota)}</p>` : ''}
      ${pista ? `<button class="g-pista-m ${E.pistas.includes(pista) ? 'on' : ''}" data-g="pista" data-v="${pista}">${E.pistas.includes(pista) ? '✓ Pista anotada' : 'Anotar a pista'}: ${PISTAS.find((p) => p[0] === pista)[1]}</button>` : ''}
    </div>`;
  }

  const abertos = new Set();
  function opcoesHtml(ops, chave) {
    return `<div class="g-opcoes">${ops.map((o, i) => {
      if (o.ir) return `<div class="g-op ir"><button class="g-cab" data-g="ir" data-v="${o.ir}"><span class="g-ic">→</span><span class="g-txt">${esc(o.t)}${o.s ? `<small>${esc(o.s)}</small>` : ''}</span></button></div>`;
      const k = chave + ':' + i, aberto = abertos.has(k);
      return `<div class="g-op ${o.rola ? 'dado' : 'nota'}"><button class="g-cab" data-g="abre" data-v="${k}" aria-expanded="${aberto}"><span class="g-ic">${o.rola ? 'd20' : 'i'}</span><span class="g-txt">${esc(o.t)}${o.s ? `<small>${esc(o.s)}</small>` : ''}</span><span class="g-tag">${o.rola ? ROLA[o.rola].per : 'ver'}</span></button>
        ${aberto ? `<div class="g-corpo">${o.rola ? rolaHtml(o.rola, o.pista) : `<p>${o.nota}</p>`}</div>` : ''}</div>`;
    }).join('')}</div>`;
  }

  function passosHtml(ps, titulo) {
    return `<section class="g-bloco"><h3 class="g-rot">${titulo || 'Faça nesta ordem'}</h3><ol class="g-passos">${ps.filter(Boolean).map((p) => `<li><div class="g-pf">${p.f}</div>
      ${p.d ? `<p class="g-pd">${p.d}</p>` : ''}
      ${p.app ? `<p class="g-papp"><span>No app</span>${p.app}</p>` : ''}
      ${p.acoes ? `<div class="g-acoes">${p.acoes.map(acaoBtn).join('')}</div>` : ''}
      ${p.pergunte ? `<p class="g-pperg"><span>Pergunte</span>${p.pergunte}</p>` : ''}
      ${p.leia ? leiaHtml(p.leia) : ''}
      ${p.ganchos ? ganchosHtml(p.ganchos) : ''}
      ${p.rola ? rolaHtml(p.rola) : ''}
      ${p.arm ? armBtn(p.arm) : ''}</li>`).join('')}</ol></section>`;
  }

  // o que ficou armado na preparação: o mestre marca, e cada fase lembra o que acontece
  const ARMADO = {
    ferir: ['Traço Ferir no caminho', 'O bicho que atravessar o traço toma <b>d6</b> de dano (2d6 se a essência do traço vencer a dele). Se saiu fraco na rolagem, apaga depois do primeiro.'],
    sal: ['Sal na porta e nas janelas', 'Quem fareja (Farejador, Corcunda) não passa por onde tem sal: força 12. <b>O bando de Tisnados passa</b>: entra pelas frestas.'],
    isca: ['A isca', 'Quem fareja vai primeiro até a isca e <b>perde uma rodada lá</b>. Se a isca está em cima do traço Ferir, toma o dano do traço também.'],
    laco: ['O laço ou a rede', 'O primeiro bicho que passar por ali <b>fica preso</b> até vencer Atletismo 15 (role pelo bicho no painel dele).'],
    criancas: ['As crianças escondidas', 'No Breu, o bando de Tisnados <b>não vai até elas</b>. Se a rolagem foi ruim, elas choram e o bando vai direto para lá.'],
  };
  const armBtn = (k) => { const on = E.armado.includes(k); return `<button class="g-pista-m ${on ? 'on' : ''}" data-g="arm" data-v="${k}">${on ? '✓ Ficou armado' : 'Marcar: ficou armado'} (${ARMADO[k][0].toLowerCase()})</button>`; };
  function armadoHtml() {
    const ks = E.armado.filter((k) => ARMADO[k]);
    return { f: ks.length ? 'O que eles armaram (lembre na hora)' : 'Eles não armaram nada', d: ks.length ? `<ul class="g-armado">${ks.map((k) => `<li><b>${ARMADO[k][0]}:</b> ${ARMADO[k][1]}</li>`).join('')}</ul>Quando um bicho passar por uma dessas coisas, aplique na hora e conte o que acontece.` : 'Os bichos chegam direto, sem nada no caminho. Se marcou errado, volte ao Último sol e marque o que ficou armado.' };
  }

  const nomePista = (k) => PISTAS.find((p) => p[0] === k)[1];
  function ganchosHtml(gs) {
    return `<div class="g-ganchos">${gs.map((g, i) => `<div class="g-gancho">
      <div class="g-gq"><span class="g-gn">${i + 1}</span>${esc(g.q)}</div>
      <div class="g-leia"><p>${esc(g.leia)}</p></div>
      ${g.regra ? `<p class="g-gregra"><b>Importante:</b> ${esc(g.regra)}</p>` : ''}
      <div class="g-gpe">${g.ps.length ? `<span class="g-gps">Pista lá: ${g.ps.map((k) => `<span class="${E.pistas.includes(k) ? 'on' : ''}">${E.pistas.includes(k) ? '✓ ' : ''}${esc(nomePista(k))}</span>`).join('')}</span>` : '<span class="g-gps">Sem pista, mas ajuda na noite</span>'}
      <button class="g-acao forte" data-g="ir" data-v="${g.ir}">Alguém topou: abrir ${esc(g.leva)} →</button></div></div>`).join('')}</div>`;
  }

  function pistasHtml() {
    const n = E.pistas.length;
    const falta = PISTAS.filter(([k]) => !E.pistas.includes(k));
    return `<section class="g-bloco"><h3 class="g-rot">As pistas: ${n} de ${PISTAS.length}</h3><div class="g-pistas">
      <p class="g-nota">${n >= 3 ? 'Com isso eles já podem desconfiar da bordadeira. Se alguém mostrar uma pista ao homem tatuado, ele confirma.' : 'Com 3 pistas eles já conseguem desconfiar da bordadeira. Se falta muito, releia o pedido da vila que leva até o lugar.'}</p>
      <ul>${PISTAS.map(([k, t]) => { const tem = E.pistas.includes(k), [l, ln] = PISTA_ONDE[k]; return `<li class="${tem ? 'on' : ''}"><span>${tem ? '✓' : '·'} ${esc(t)}</span>${tem ? '' : `<button class="g-mini" data-g="ir" data-v="${l}">está em: ${esc(ln)} →</button>`}</li>`; }).join('')}</ul>
      ${falta.length ? '' : '<p class="g-nota">Acharam todas.</p>'}</div></section>`;
  }

// ---------------- a noite, montada pelo estado ----------------
function noiteHtml() {
  const aberto = E.trecho === 'aberto' || !E.trecho;
  const corpoNaVila = E.corpo !== 'queimado';
  const ondeCorpo = E.corpo === 'fechada' ? 'a casa fechada' : 'a casa do velório';
  const mais = corpoNaVila ? ' + 1 Farejador (o morto chama)' : '';
  const rodadas = { f: 'Como corre cada rodada', d: '<b>1. Você anuncia a intenção de cada bicho.</b> Clique na peça: o painel da direita mostra o que ele pode fazer. Escolha uma jogada e leia a intenção em voz alta. <b>2. Os jogadores agem</b>, na ordem que quiserem: cada um anda e faz uma ação. No celular deles tem a lista do que dá para fazer (atacar, empurrar, prender, chamar para si, enganar o sentido, ler o bicho, riscar na hora, tratar, encorajar). <b>3. Os bichos agem</b>: faça a jogada que você anunciou, a não ser que os jogadores tenham mudado tudo. Aperte <b>Nova rodada</b> a cada volta.' };
  const armaRegra = { f: 'Quando um jogador ataca com a arma marcada', d: 'Ele aperta <b>Atacar</b> no celular e escolhe o bicho. <b>O app faz a conta sozinho</b>: soma ou tira 1 dado pela essência, compara com a Defesa do bicho, rola o dano e <b>tira o Sangue do bicho no seu mapa</b>. Você só recebe o aviso ("Farejador: −7 de Sangue") e narra o golpe. Quando o bicho cai pela metade, o aviso diz que ele foge. <b>Se o jogador disser só "eu bato nele"</b>, peça para usar o botão Atacar. Arma sem marca não fere, mas o bicho perde o próximo movimento. Esta noite: Lodo vence Cinza (Farejador, Tisnado, Corcunda), Raiz vence Osso (Rolador), e Cinza vence Raiz.' };
  const fimFase = { f: 'Quando a fase acaba', d: 'Bicho morto vira cinza e despojo. Bicho com metade do Sangue ou menos <b>foge ferido</b> para o escuro e volta na fase seguinte com o Sangue que tem. A fase acaba quando não sobra bicho de pé deste lado da linha.' };
  const terror = (itens) => ({ f: 'Se a mesa esfriar, solte um destes', d: 'Um por vez, sem pressa. Depois, silêncio.', leia: itens.map((t) => ['', t]) });
  const investida = aberto
    ? { f: 'O trecho está aberto', d: 'Eles não investem: passam pelo vão. Quem estiver no caminho, luta.' }
    : { f: 'Quando um bicho investe contra a linha', d: 'Clique no bicho, escolha <b>O círculo da vila</b> e aperte <b>Rolar o ataque</b>. <b>Não superou:</b> a linha segura e perde 3 de força (o Rolador tira 4). <b>Superou:</b> abre uma brecha. Fechar a brecha é Riscar na hora, ou alguém segura a brecha com a lança enquanto outro risca.' };

  return `
  <div class="g-meta"><span class="g-pill tempo">80 min</span>${acaoBtn(['cena', 'farinha'])}${acaoBtn(['cena', 'vila'])}</div>
  <p class="g-instr" style="margin-top:0">Esta noite foi montada pelo que você marcou na aba A história: <b>trecho ${aberto ? 'aberto' : E.trecho === 'forte' ? 'consertado forte' : 'consertado fino'}</b>, <b>corpo ${E.corpo === 'queimado' ? 'queimado' : E.corpo === 'fechada' ? 'na casa fechada' : 'no velório'}</b>. A bordadeira ainda não foi descoberta.</p>

  ${passosHtml([
    { f: 'Antes de falar qualquer coisa: confira a mesa', d: '<b>1. Quem veio?</b> Quem faltou: na aba <b>Grupo</b>, no cartão da pessoa, aperte <b>O jogador saiu: tirar da sessão</b>. Se chegar no meio, aperte <b>Chegou: pôr na mesa</b>, no mesmo lugar. <b>2.</b> Peça para todo mundo abrir o app no celular e entrar na mesa. Quem nunca abriu vê um tutorial rápido; quem quiser rever, toca no <b>?</b> no canto da tela. <b>3.</b> Quem vai usar dado de verdade toca em <b>Tenho dados aqui</b> na própria mesa: o app pede o número e faz a conta. <b>4.</b> A cena aberta tem que ser a casa de farinha (botão logo abaixo). <b>5. Duas pessoas no mesmo aparelho?</b> Na aba <b>Grupo</b>, no cartão do segundo personagem, em <b>Quem joga</b>, escolha a conta de quem está com o aparelho. Na tela dela aparece <b>Jogando agora como</b>, com os dois rostos: um toque troca de personagem. Quando você pedir uma rolagem, aparece um aviso para o outro personagem também.' },
    { f: 'Passe a abertura da noite', d: 'Com todo mundo na mesa, aperte: o vídeo (1 min 12 s) lembra o que aconteceu e apresenta os seis de novo. Quando acabar, feche o vídeo e siga.', acoes: [['video', 'abertura2']] },
    { f: 'Comece lembrando onde pararam', d: 'Conte em poucas frases: o corpo de Antero queimou no Entardecer, e a viúva, chorando, contou o que a bordadeira sussurrou (que Antero volta se a porta ficar aberta). O trecho foi consertado, mas fino. O caçador chegou por último. E agora o sol está indo embora.' },
    { f: 'Leia: a vila se junta', d: 'Mostre a casa de farinha e, se as peças do grupo não estiverem nela, aperte o segundo botão.', acoes: [['cena', 'farinha'], ['grupo']], leia: [['', 'A vila inteira se espreme na casa de farinha: crianças no colo, velhos no chão, o cheiro de mandioca e de medo. Alguém tranca a porta. Ninguém acende nada.'], ['Dona Firmina, para vocês', '"O Antero dizia: círculo só segura. Quem quer ver o sol tem que fazer o bicho sangrar." Ela bate o cajado no tablado do forno, duas vezes. "Rosário. Mostra para eles."']] },
    { f: 'O arsenal de Antero', d: 'A Rosário levanta as tábuas do tablado. Embaixo, embrulhado em couro: dez peças marcadas pelo pai dela, a vida inteira de trabalho. Aperte o botão: cada jogador vê o arsenal no celular e pega <b>uma</b> peça. São 10 peças para 6 pessoas: deixe eles discutirem.', acoes: [['arsenal'], ['prova', 'arsenal']], leia: [['Rosário', '"Meu pai marcou uma por ano. Cada risco é de uma noite que ele não deixou ninguém morrer. Escolham direito: tem marca que serve para um bicho e não serve para outro."']] },
    { f: 'Se perguntarem qual serve', d: 'Cada peça tem um símbolo riscado: a essência. <b>O Tião reconhece todos de cara</b> (é riscador). Os outros rolam Traços ou Saberes 10. No celular, cada carta tem o botão <b>Ler o risco</b>: o app rola e conta a essência para quem acertar. Os riscos: <b>círculo é Lodo</b> (facão e funda, as certas: Lodo vence Cinza, e os bichos da vila até agora eram todos de Cinza; o Brás sabe disso, se perguntarem), <b>losango é Raiz</b> (forcado e foice, as erradas: Cinza vence Raiz), triângulo é Cinza (faca e arco), cruz é Sopro (lança e pandeiro), xis é Osso (machado e rabeca). Se alguém pegar sem perguntar, deixe pegar: na luta, o app mostra o erro na hora.' },
    { f: 'O caderno de armadilhas', d: 'É assim que os jogadores descobrem que dá para se preparar. Aperte o botão: a página aparece grande na tela de todos. Leia e mostre que cada desenho é uma ação.', acoes: [['prova', 'caderno']], leia: [['Rosário abre um caderninho de capa de couro', '"Isso aqui era a cabeça do meu pai." Nas páginas, desenhos a carvão: um traço riscado atravessando um caminho, com um bicho caído no meio. Um pedaço de carne amarrado num pau, e setas levando até o traço. Uma linha de sal numa janela. Um laço de corda no chão. Embaixo de tudo, na letra torta dele: "o bicho vem pelo nariz, pelo ouvido ou pelo medo. Escolhe por onde ele vem, e espera ele lá."']] },
    { f: 'A preparação: 3 rodadas antes da noite', d: 'Diga: "Vocês têm até o sol sumir. Três rodadas: cada um faz uma coisa por rodada." Abaixo está cada coisa que dá para fazer. Para cada uma: aperte <b>Pedir</b> no nome de quem vai fazer, leia o resultado que aparece e, se deu certo, aperte <b>Marcar: ficou armado</b>. Na noite, o guia lembra você do que cada armadilha faz. <b>Se ninguém tiver ideia</b>, a Rosário aponta para o caderno: "Meu pai começava pelo nariz deles." Se quiserem fazer outra coisa que não está na lista, deixe: escolha a perícia que faz sentido e peça a rolagem pelo painel do personagem.', pergunte: '"O que cada um faz agora, antes de escurecer?"' },
    { f: 'Armar um traço Ferir no caminho', rola: 'prepFerir', arm: 'ferir' },
    { f: 'Linha de sal nas janelas e na porta', rola: 'prepSal', arm: 'sal' },
    { f: 'Montar uma isca', rola: 'prepIsca', arm: 'isca' },
    { f: 'Armar um laço ou uma rede', rola: 'prepLaco', arm: 'laco' },
    { f: 'Reforçar o trecho (agora tem cal)', rola: 'conserto', d: 'É o mesmo conserto de antes. Digite o novo resultado na aba A história, se for maior.' },
    { f: 'Acalmar e esconder as crianças', rola: 'prepCriancas', arm: 'criancas' },
    { f: 'Explique a noite (é a primeira vez deles)', d: 'Antes do vídeo. Leia com calma:', leia: [
      ['A noite anda em rodadas', 'Agora a noite anda em rodadas. No começo de cada uma, eu conto o que cada bicho vai fazer. Vocês têm a vez de vocês para reagir: cada um anda e faz uma coisa. Depois os bichos agem.'],
      ['Todo mundo tem o que fazer', 'No celular de vocês tem a lista: atacar, empurrar o bicho para uma armadilha, prender, chamar ele para si para salvar alguém, enganar o nariz ou o ouvido dele, ler que bicho é, riscar um traço na hora, tratar quem caiu, encorajar quem está com medo.'],
      ['A arma marcada', 'Só arma marcada fere. Para bater, toquem em Atacar na carta da arma e escolham o bicho: o app conta tudo. A marca certa contra o bicho certo dá um dado a mais. A errada, um a menos. Arma comum só faz ele perder o passo.'],
      ['O corpo e a cabeça', 'O Sangue é o corpo: zerou, cai, e tem até a fase virar para alguém socorrer. O Prumo é a cabeça: zerou, pânico. E cada vez que a noite muda de fase, todo mundo rola Firmeza: quem falha ganha 1 Pavor, um dado a menos em tudo até o amanhecer. O app desconta sozinho.']] },
    { f: 'Comece a noite: Crepúsculo', d: 'Primeiro o vídeo da noite caindo (22 segundos). Quando acabar, aperte o segundo: as cenas escurecem e o app pede o Pavor a todos.', acoes: [['video', 'noite'], ['fase', 0]] },
  ], 'O último sol')}

  ${passosHtml([
    { f: 'Leia', d: 'Mostre a vila: é o mapa da noite inteira. Ponha o grupo no mapa e <b>arraste as peças deles para dentro da casa de farinha</b> (ou para onde cada um disse que ficaria na preparação).', acoes: [['cena', 'vila'], ['grupo']], leia: [['', 'A luz vai embora devagar e depois de uma vez. E os bichos da vila calam todos ao mesmo tempo: as galinhas, o cachorro, os grilos. Um silêncio de quem prendeu a respiração.'], ['', `Lá fora, perto ${E.corpo === 'queimado' ? 'da pira, onde o corpo de Antero queimou' : 'de ' + ondeCorpo}, alguma coisa fareja. Pela fresta da porta dá para ver: dois bichos do tamanho de cachorro, com a pele em brasa morta, fuçando ${E.corpo === 'queimado' ? 'a cinza da pira. Um deles levanta a cabeça com alguma coisa na boca. É um osso. É do Antero.' : 'a porta.'}`]] },
    { f: `Ponha no mapa: 2 Farejadores de Borralho${mais}`, d: `Aperte uma vez para cada um. Eles entram <b>escondidos</b>: só você vê (aparecem apagados no seu mapa). Arraste cada um para perto ${E.corpo === 'queimado' ? 'da pira' : 'de ' + ondeCorpo}, do lado de fora do círculo.`, acoes: [['assombro', corpoNaVila ? 'cinza-2:3' : 'cinza-2:2']] },
    { f: 'Revele os Farejadores', d: 'Quando terminar de ler, aperte: a imagem do bicho aparece grande na tela de todos e a peça fica visível no mapa deles. Eles comem primeiro e só depois sentem o cheiro de gente: isso dá <b>uma rodada</b> para quem quiser agir antes deles (atirar de longe, mexer na isca, se esconder).', acoes: [['revelar', 'cinza-2']] },
    armadoHtml(), rodadas, investida, armaRegra,
    terror(['A cinza da pira se mexe sem vento.', 'Alguém lá dentro começa a rezar baixinho, e outra pessoa manda calar.', 'O fungado para. Ninguém sabe onde o bicho está. Depois, bem devagar, alguma coisa roça a parede, do lado de fora, bem onde alguém encostou a cabeça.']),
    fimFase,
  ], 'Crepúsculo')}

  ${passosHtml([
    { f: 'Vire para o Breu', d: 'Cada jogador rola o Pavor no celular.', acoes: [['fase', 1]] },
    { f: 'Leia', leia: [['', 'A noite fechou de vez. Agora não existe nada além do escuro, e do escuro vêm os barulhos: pedra rolando sem pedra, toc, toc, toc. E de dentro das paredes da casa de farinha, um chiado, como brasa caindo na água.']] },
    { f: `Ponha no mapa: o bando de Tisnados e 1 Rolador${mais}`, d: 'Entram escondidos. Arraste o <b>bando de Tisnados</b> para colado na parede da casa de farinha (ele entra pelas frestas, por dentro: sal não segura). Arraste o <b>Rolador</b> para a estrada, de frente para o trecho fino. Os Farejadores que fugiram feridos no Crepúsculo voltam agora, com o Sangue que tinham: arraste as peças deles de volta para perto.', acoes: [['assombro', 'cinza-1'], ['assombro', 'osso-1']] },
    { f: 'Revele quando aparecerem', d: 'O Rolador primeiro (o toc, toc, toc vira um bicho de casca rolando na estrada). O bando por último, quando o chiado sair de dentro da parede.', acoes: [['revelar', 'osso-1'], ['revelar', 'cinza-1']] },
    { f: 'O bando caça o medo', d: 'Quem falhou no Pavor vira o alvo. As crianças, se ninguém as acalmou na preparação, choram: o bando vai para o canto delas.' },
    { f: 'Bento pode morrer aqui', d: 'Se o bando chegar nas crianças, ou se a linha abrir uma brecha e ninguém segurar na mesma rodada, o Bento se joga na frente: <i>"P-para trás, vocês!"</i> Ele leva o ataque no lugar delas. <b>Ele só sobrevive se alguém, na mesma rodada, chamar o bicho para si, empurrar, ou tratar ele depois que cair.</b> Se o grupo errar tudo, o Bento morre com uma criança no colo.' },
    armadoHtml(), rodadas, investida, armaRegra,
    { f: 'Se a linha falhar, a cena é do Tião', d: 'É o pesadelo dele: um círculo malfeito destruindo uma comunidade. Pergunte: "Tião, o que passa pela sua cabeça agora?"' },
    terror(['Uma criança tosse. Todo mundo prende o ar. O chiado para.', 'Alguma coisa fareja pela fresta debaixo da porta, devagar, de um lado para o outro.', 'Priya ouve, lá fora, a cantiga que só ela e a irmã sabiam. Do jeito que a irmã cantava.', 'Flecha ouve uma voz chamando o nome dela, igualzinha a alguém de casa. "Abre. Sou eu."']),
    fimFase,
  ], 'Breu')}

  ${passosHtml([
    { f: 'Vire para a Hora Morta', d: 'Cada jogador rola o Pavor no celular. Não revele a Corcunda ainda: ela entra pela linha, ao lado da bordadeira.', acoes: [['fase', 2]] },
    { f: 'Leia o silêncio', leia: [['', 'É o meio da noite, a hora em que até o escuro para. Nenhum barulho. Nenhum fungado. E então, pela fresta da porta, vocês veem uma coisa que não veem há horas.'], ['', 'Luz. Uma lanterna amarela, lá fora, no trecho. A única luz da noite inteira.']] },
    { f: 'A bordadeira recebe visita', d: 'Antes, no mapa, <b>arraste a bordadeira e o moço dos baldes para o trecho</b> do círculo, do lado da estrada. Depois o vídeo da fenda (13 segundos). Depois leia. A linha perde força: <b>' + (E.trecho === 'forte' ? '−2, porque o conserto foi 20 ou mais' : '−4') + '</b>.', acoes: [['video', 'fenda']], leia: [['', 'A bordadeira está ajoelhada em cima da linha de cal, com a lanterna acesa do lado. O moço dos baldes, de pé atrás dela, segura o chapéu no peito. Ela passa a mão na cal em meia-lua, devagar, como quem alisa um lençol, e canta baixinho. Onde a mão passa, a linha some.'], ['', 'Do escuro, por cima dela, sai uma coisa curvada, de costas de cinza, maior que um homem agachado. Passa a um palmo do rosto dela. Fareja. E segue em frente. Não toca nela.']] },
    { f: 'Revele a Corcunda e as formas verdadeiras', d: 'Os jogadores agora entendem tudo. Passe o vídeo da bordadeira se revelando e mostre as formas deles no mapa.', acoes: [['assombro', 'cinza-4'], ['revelar', 'cinza-4'], ['video', 'celeste'], ['forma', 'Celeste'], ['forma', 'Zeca']] },
    { f: 'Rosário corre para a linha', d: 'Isso acontece antes de qualquer jogador alcançar o trecho. É a cena que faz deles inimigos.', leia: [['', 'A porta da casa de farinha bate. É a Rosário, correndo para o trecho com o pincel quebrado do pai na mão, gritando para a bordadeira sair de cima da linha.'], ['', 'A bordadeira levanta. Abraça a Rosário como quem consola. E vocês veem, à luz da lanterna, a tesoura de bordar entrando nas costas dela. Devagar.'], ['Celeste, no ouvido dela', '"Shhh. Seu pai está te esperando do outro lado."'], ['', 'A Rosário cai em cima da linha do pai.']] },
    { f: 'A viúva vai com eles', leia: [['', 'Lá de dentro, alguém grita. A senhora de luto passou pela porta e está andando para o escuro, descalça, sem olhar para trás. A bordadeira estende a mão para ela.'], ['Lindalva', '"Ela disse que ele está esperando. Me deixem ir."']], d: 'Se tentarem segurar, deixe tentar (Prender, Lábia 15): ela hesita, mas escapa quando a Corcunda investe contra a linha e todo mundo olha para lá. Ela vai.' },
    { f: 'Se lutarem com a bordadeira e o moço', d: 'Eles são fortes de verdade, e <b>escolhem</b> não matar: morto não abre porta, e quem fica vivo e assustado pode ser recrutado. Clique na peça de cada um: o painel da direita tem a ficha e as jogadas. <b>A bordadeira</b> (Pregadora, Sangue 20, Defesa 13): tesoura que faz sangrar, linha vermelha que costura a boca de quem canta, pó de lume que faz alguém brilhar no escuro, a voz que dá Pavor, a lanterna que chama mais bichos. <b>O moço</b> (Sangue 16, Defesa 13): a vara de ponta de osso, o balde de sangue que batiza alguém para os bichos, o dardo de sono, e se joga na frente dela. Ele <b>não hesita</b>: a conversa com o Damião não deu certo.' },
    { f: 'A Corcunda, dentro da linha (antes de o moço montar)', d: 'Ela escuta: um grupo em silêncio total não é achado. Ela tem dois poderes: <b>Soterrar</b> (enterra quem está perto até a cintura) e a <b>Nuvem de fuligem</b> (anuncie uma rodada antes). Clique nela para ver as jogadas.' },
    armadoHtml(), rodadas, investida, armaRegra,
    { f: 'Eles vão embora montados', leia: [['', 'O moço dos baldes encosta as palmas das mãos na corcunda do bicho. As palmas têm marcas escuras, frescas. A Corcunda abaixa devagar, como cavalo manso.'], ['', 'Ele sobe. A bordadeira pega a lanterna e dá a mão para a viúva. Os três vão embora pela estrada: ele montado no bicho, as duas andando do lado, a luz amarela balançando. Os outros bichos abrem caminho, como gado para o dono. A lanterna vai ficando pequena no escuro, até virar um ponto. E apaga.']], d: 'Ninguém consegue seguir esta noite: fora do círculo, os bichos atacam quem não é Rasgado, e montado o moço corre o dobro. Se alguém ferir a bordadeira até sangrar (metade do Sangue), os bichos se viram contra ela, e o moço a puxa para cima da Corcunda. Se a Corcunda ainda estiver lá dentro quando ele montar, ela sai com eles: a Hora Morta fica só com os bichos menores.' },
    fimFase,
  ], 'Hora Morta')}

  ${passosHtml([
    { f: 'Vire para Antes da Aurora', d: 'Cada jogador rola o Pavor no celular.', acoes: [['fase', 3]] },
    { f: 'Leia', leia: [['', 'O céu, lá longe, muda de preto para um cinza que ainda não é luz. O que está lá fora sabe o que isso quer dizer. Unhas arranhando madeira, cada vez mais rápido. Os bichos ficam desesperados.']] },
    { f: 'Os Assombros fogem', d: 'Cada um corre para a fenda mais perto. Em fuga, só atacam quem estiver no caminho. Atacar um em fuga, pelas costas, dá <b>+1 dado</b>.' },
    { f: 'Cuidado com o encurralado', d: 'Um bicho sem caminho até a fenda ataca com <b>+2 dados</b> e não recua. É a hora mais comum de perder alguém.' },
    rodadas,
  ], 'Antes da aurora')}
  <div class="g-seguir"><button class="g-acao forte" data-g="ir" data-v="aurora">O sol nasceu: Aurora →</button></div>`;
}

function auroraHtml() {
  const fim = [];
  if (E.trecho && E.trecho !== 'aberto') fim.push('O círculo segurou onde foi consertado. A linha está arranhada, mas inteira, menos no trecho onde a bordadeira se ajoelhou.');
  else fim.push('O trecho aberto deixou a noite entrar. Conte as casas que não aguentaram, e quem estava nelas.');
  fim.push('A Rosário está caída em cima da linha do pai, com o pincel quebrado ainda na mão. Alguém precisa decidir o que fazer com ela antes do sol esquentar.');
  fim.push('A casa da viúva amanhece com a porta aberta. Na soleira, no lugar dela, tem um bordado em linha vermelha: a cantiga que só a Priya e a irmã sabiam, ponto por ponto.');
  fim.push('O Bento, se sobreviveu, não larga a faca de cal. Se não sobreviveu, a criança que ele segurava não solta a mão dele.');
  return `
  <div class="g-meta"><span class="g-pill tempo">10 min</span></div>
  <div class="g-acoes">${acaoBtn(['fase', 4])}</div>
  ${leiaHtml([['', 'O sol aparece por cima do mato seco como se nada tivesse acontecido. A luz entra pelas frestas das portas. O Pavor vai saindo do corpo devagar, como água de roupa no varal.'], ['', 'A vila conta quem sobrou. E quem foi embora.']])}
  <section class="g-bloco"><h3 class="g-rot">O que contar</h3><div class="g-mestre">${fim.map((f) => `<p>${f}</p>`).join('')}</div></section>
  <section class="g-bloco"><h3 class="g-rot">O gancho da campanha</h3><div class="g-mestre"><p>A bordadeira levou o caderno. O Brás, se tiver confiança no grupo, conta o que sabe: <i>"Ela é da romaria. Eles andam de vila em vila, à noite, sem círculo. Onde passam, as soleiras amanhecem apagadas. Vão estar na estrada na lua nova."</i></p><p><b>Logo depois da fala do Brás, passe o vídeo da lenda</b> (2 min 31 s): é o que se conta sobre eles nas vilas. Deixe terminar em silêncio antes de perguntar qualquer coisa.</p><div class="g-acoes">${acaoBtn(['video', 'rasgados'])}</div><p>Os jogadores têm motivo de sobra: a Rosário, a viúva levada, o Zeca (amigo do Damião, da comunidade do Tião), e a cantiga da irmã da Priya, que a bordadeira conhece. Eles ficam com as armas de Antero.</p></div></section>
  <section class="g-bloco"><h3 class="g-rot">Para fechar</h3><div class="g-trava">Pergunte a cada jogador, um de cada vez: <b>o que o seu personagem leva desta noite?</b> Uma frase basta.</div></section>`;
}

function mapaHtml() {
  const casa = (id, x, y, w, h, nome, l2) => `<g class="casa" data-g="ir" data-v="${id}" role="button" tabindex="0" aria-label="${nome}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="var(--taipa2)" stroke="var(--linha)" stroke-width="2"/><text x="${x + w / 2}" y="${y + h / 2 + (l2 ? -3 : 5)}" text-anchor="middle" font-size="15" font-weight="700">${nome}</text>${l2 ? `<text x="${x + w / 2}" y="${y + h / 2 + 15}" text-anchor="middle" font-size="12.5" fill="var(--cinza)" style="fill:var(--cinza)">${l2}</text>` : ''}</g>`;
  const lugar = (id, x, y, r, nome, l2) => `<g class="lugar" data-g="ir" data-v="${id}" role="button" tabindex="0" aria-label="${nome}"><circle cx="${x}" cy="${y}" r="${r}" fill="var(--taipa2)" stroke="var(--brasa)" stroke-width="2"/><text x="${x}" y="${y + (l2 ? -2 : 5)}" text-anchor="middle" font-size="14" font-weight="700">${nome}</text>${l2 ? `<text x="${x}" y="${y + 15}" text-anchor="middle" font-size="12" style="fill:var(--cinza)">${l2}</text>` : ''}</g>`;
  return `<div class="g-mapa"><svg viewBox="0 0 900 640" role="img" aria-label="Mapa da vila: clique onde os jogadores forem">
    <path d="M 740.9 294.6 A 292 292 0 1 1 714.6 196.6" fill="none" stroke="var(--cal)" stroke-width="5" stroke-linecap="round" opacity=".85"/><path d="M 714.6 196.6 A 292 292 0 0 1 740.9 294.6" fill="none" stroke="var(--sangue)" stroke-width="3" stroke-dasharray="4 6" opacity=".9"/>
    <path d="M 0 210 Q 300 250 470 290 T 900 250" fill="none" stroke="var(--linha)" stroke-width="34" opacity=".55"/>
    <text x="38" y="200" font-size="13" style="fill:var(--cinza)">estrada</text>
    ${casa('velorio', 290, 70, 240, 74, 'Casa do velório', 'Lindalva, Rosário, o corpo')}
    ${casa('zuleide', 550, 108, 180, 66, 'Casa de Zuleide', 'onde Celeste dorme')}
    ${casa('venda', 100, 300, 160, 62, 'Venda', 'Seu Orlando')}
    ${casa('oficina', 120, 420, 160, 62, 'Oficina', 'Joana, a ferreira')}
    ${casa('firmina', 650, 520, 170, 62, 'Casa de Firmina', 'a parteira')}
    ${casa('casabento', 450, 500, 170, 62, 'Casa de Bento', 'o caderno de lições')}
    ${casa('cicero', 290, 520, 150, 60, 'Casa de Graça', 'as crianças')}
    ${casa('fechada', 545, 410, 160, 62, 'Casa fechada', 'vazia, com chave')}
    ${casa('farinha', 120, 160, 170, 66, 'Casa de farinha', 'onde a vila dorme')}
    ${lugar('celeste', 450, 230, 54, 'Celeste', 'na sombra')}
    ${lugar('bras', 330, 380, 50, 'Brás', 'a carroça')}
    ${lugar('patio', 470, 380, 40, 'Poço', 'pátio')}
    <g class="lugar" data-g="ir" data-v="trecho" role="button" tabindex="0" aria-label="O trecho apagado"><rect x="760" y="215" width="128" height="44" rx="8" fill="var(--taipa2)" stroke="var(--sangue)" stroke-width="2.5"/><text x="824" y="235" text-anchor="middle" font-size="14" font-weight="700">Trecho apagado</text><text x="824" y="251" text-anchor="middle" font-size="12" style="fill:var(--cinza)">Bento, o conserto</text></g>
    ${lugar('cerca', 815, 330, 42, 'Zeca', 'na cerca')}
    <g class="lugar" data-g="ir" data-v="moco" role="button" tabindex="0" aria-label="O mocó da serrota"><rect x="20" y="40" width="190" height="52" rx="8" fill="var(--taipa2)" stroke="var(--linha)" stroke-width="2" stroke-dasharray="6 4"/><text x="115" y="62" text-anchor="middle" font-size="14" font-weight="700">↖ Mocó da serrota</text><text x="115" y="80" text-anchor="middle" font-size="12" style="fill:var(--cinza)">meia légua: cal e lenha</text></g>
  </svg><p class="g-legenda">Clique onde os jogadores forem. A linha branca é o círculo. O tracejado vermelho, do lado da estrada, é o trecho apagado.</p></div>`;
}

  const GAVETAS = {
  situacoes: () => `<h2>Se acontecer…</h2><p class="g-cinza">As situações que costumam travar a mesa, com a saída de cada uma. Clique para abrir.</p>
    ${SITUACOES.map(([grupo, itens]) => `<h4>${grupo}</h4><div class="g-conversa">${itens.map(([q, r]) => `<details><summary>${q}</summary><p>${r}</p></details>`).join('')}</div>`).join('')}`,
  resolver: () => `<h2>Travei: como resolver</h2><p class="g-cinza">Para quando um jogador faz algo que não está no guia.</p>
    ${RESOLVER.passos.map(([t, d], i) => `<h4>${i + 1}. ${t}</h4><p>${d}</p>`).join('')}
    <h4>Qual perícia usar</h4><table class="g-tab"><tbody>${RESOLVER.pericias.map(([q, p]) => `<tr><td>${q}</td><td><b>${p}</b></td></tr>`).join('')}</tbody></table>
    <h4>Para pedir a rolagem</h4><p>Na aba <b>Rolagens</b>, à direita, aperte <b>+ Pedir outra rolagem</b>, escolha a perícia e quem rola.</p>`,
  segredo: () => `<h2>O segredo</h2><p style="color:var(--cinza)">Só para o mestre.</p>
    <div class="g-mestre"><p><b>Quem matou o riscador foi Celeste.</b> Ela é uma Rasgada da Ferida Aberta, disfarçada de bordadeira. Chegou ontem pedindo abrigo para o Dia Curto, com o "sobrinho" Zeca.</p></div>
    <h4>O que aconteceu</h4><ul><li>Antero passou a semana refazendo o círculo. Faltava um trecho, do lado da estrada.</li><li>Ao raiar do dia, ele saiu para fechar. Celeste foi atrás, levando café.</li><li>Com ele ajoelhado riscando, ela o golpeou na nuca com a tesoura de bordar e esfregou o traço com a mão, em meia-lua.</li><li>Voltou antes de alguém acordar. A vila achou que "a noite pegou ele no fim da madrugada".</li></ul>
    <h4>Por quê</h4><p>Para a Ferida Aberta, cada traço prende o mundo ferido fechado. Uma vila aberta na noite mais longa do ano é, para ela, um ato de fé. Ela não é cruel: acredita que está salvando todo mundo.</p>
    <h4>O que ela quer agora</h4><ul><li>Que o trecho fique aberto até a Hora Morta.</li><li>Recrutar quem estiver desesperado: a viúva, Inácio, Priya.</li><li>Se o círculo for consertado, apagá-lo por dentro na Hora Morta.</li></ul>
    <h4>Se descobrirem cedo</h4><p>Ela não luta de dia. Chora, nega e diz que foi Brás. A vila tende a acreditar nela.</p>
    <h4>A ironia</h4><p>É Celeste quem costura a mortalha de Antero, com carinho, cantarolando baixinho.</p>`,
  gente: () => `<h2>Pessoas</h2><p style="color:var(--cinza)">Clique em alguém para ver como é, o que quer e o que diz.</p>${genteHtml(Object.keys(GENTE))}`,
  dados: () => dadosTabela(),
  conduzir: () => `<h2>Como conduzir</h2>
    <h4>O ciclo</h4><ul><li><b>Descreva</b> em três ou quatro frases. Os textos para ler já estão em cada momento.</li><li><b>Pergunte: "o que vocês fazem?"</b> E espere. Silêncio na mesa é gente pensando.</li><li><b>Diga o que acontece.</b> Quase sempre, simplesmente acontece.</li></ul>
    <h4>Quando pedir dado</h4><p>Só quando o resultado é incerto <b>e</b> falhar é interessante. Perguntar o preço do sal não tem dado. Pular o muro sem ser visto, tem. Na dúvida, dificuldade 15.</p>
    <h4>Quando falham</h4><p>A história anda do mesmo jeito, com um custo: demora, alguém vê, gasta tempo, 1 de Pavor. A pista sempre aparece para quem procura no lugar certo.</p>
    <h4>Faixas de resultado</h4><p>Cada rolagem desta mesa tem quatro faixas. Quem tira mais leva também o que está nas faixas de baixo.</p>
    <h4>Nomes</h4><p>Os jogadores não sabem o nome de ninguém da vila. Descreva a pessoa pelo que se vê ("a moça de lenço", "o homem tatuado"). Quando alguém perguntar o nome, a pessoa responde, e você aperta <b>Revelar o nome</b> na peça, no app. Até lá, eles veem ?? embaixo da peça.</p>
    <h4>Mostre, não conte</h4><p>Quando um NPC faz algo escondido, você não diz "ela usou um poder". Você descreve o que os personagens veem e deixa os jogadores concluírem. A página da noite já traz o texto de cada caso.</p>
    <h4>Como rodar uma luta</h4><ul><li>Diga "agora a noite anda em rodadas".</li><li>Os jogadores agem primeiro, na ordem que quiserem: cada um anda e faz uma ação.</li><li>Depois os Assombros agem. Eles atacam rolando a mão contra a Defesa do personagem, ou contra a força do círculo.</li><li>Atacar é Luta ou Pontaria contra a Defesa do Assombro. Acertou: role o dano e tire do Sangue dele no app. Arma sem traço não fere: só faz ele perder o próximo movimento.</li><li>No app, aperte <b>Nova rodada</b> a cada volta.</li></ul>
    <h4>Círculo e brecha</h4><p>Cada investida que não supera a força do círculo tira 3 dela. Uma que supera abre uma brecha: fechar leva uma rodada inteira e uma nova rolagem de Traços.</p>
    <h4>Muitos jogadores</h4><p>Se alguém está calado há tempo, vire para ele: "e você, Flecha, enquanto isso?" É metade do trabalho.</p>
    <h4>Os NPCs vêm até eles</h4><p>Se a mesa parar, alguém da vila aparece com o que quer. A vila não espera.</p>`,
};


  function dadosTabela() {
    const pers = ['Percepção', 'Traços', 'Sobrevivência', 'Furtividade', 'Lábia', 'Atletismo', 'Ervas e Cura', 'Saberes', 'Firmeza', 'Presença'];
    return `<h2>Dados de cada um</h2><p class="g-cinza">Rola essa quantidade de d20 e fica com o maior. O +3 é de perícia treinada. Tirado das fichas aprovadas.</p>
      <div class="g-x"><table class="g-tab"><thead><tr><th></th>${pers.map((k) => `<th>${k}</th>`).join('')}</tr></thead><tbody>${pjs().map((c) => `<tr><td><b>${esc(c.data.nome)}</b></td>${pers.map((k) => `<td>${txtDados(dadosDe(c, k))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  // ---------- o momento atual ----------
  function html() {
    const m = M[E.aqui] || M.inicio;
    let h = `<div class="g-top"><button class="g-mini segredo" data-g="gaveta" data-v="segredo">O segredo</button><button class="g-mini" data-g="gaveta" data-v="gente">Pessoas</button><button class="g-mini" data-g="gaveta" data-v="dados">Dados</button><button class="g-mini" data-g="gaveta" data-v="conduzir">Como conduzir</button><button class="g-mini travei" data-g="gaveta" data-v="resolver">Travei: como resolver</button><button class="g-mini travei" data-g="gaveta" data-v="situacoes">Se acontecer…</button></div>
      <nav class="g-atos">${ATOS.map(([id, a, n], i) => `<button class="g-ato ${m.ato === i ? 'on' : ''} ${m.ato > i ? 'feito' : ''}" data-g="ir" data-v="${id}"><b>${a}</b><span>${n}</span></button>`).join('')}</nav>`;
    h += m.lugar ? `<div class="g-migalha"><button data-g="ir" data-v="patio">← Mapa da vila</button></div>` : '';
    h += `<h2 class="g-titulo">${esc(m.titulo)}</h2>`;
    if (m.noite) h += noiteHtml();
    else if (m.aurora) h += auroraHtml();
    else {
      const cm = m.cena || (/vila de luto/i.test(m.app || '') ? 'vila' : null);
      h += `<div class="g-meta">${m.tempo ? `<span class="g-pill tempo">${esc(m.tempo)}</span>` : ''}${cm ? acaoBtn(['cena', cm]) : m.app ? `<span class="g-pill app">No app: ${esc(m.app)}</span>` : ''}</div>`;
      if (m.hub) h += mapaHtml();
      if (m.leia) h += `<section class="g-bloco"><h3 class="g-rot">Leia ao entrarem</h3>${leiaHtml(m.leia)}</section>`;
      if (m.passos) h += passosHtml(m.passos, m.lugar ? 'Se acontecer' : 'Faça nesta ordem');
      if (m.hub) h += pistasHtml();
      if (m.recursos) h += `<section class="g-bloco"><h3 class="g-rot">Marque o que conseguiram aqui</h3>${recBotoes(m.recursos)}</section>`;
      if (m.quem) h += `<section class="g-bloco"><h3 class="g-rot">Quem está aqui</h3><p class="g-nota">Clique numa pessoa para ver o que ela responde. Se ela ainda não apareceu para os jogadores, use o botão para mostrar.</p><div class="g-acoes">${m.quem.map((k) => acaoBtn(['npc', GENTE[k].nome])).join('')}</div>${genteHtml(m.quem)}</section>`;
      if (m.opcoes) h += `<section class="g-bloco"><h3 class="g-rot">${m.hub ? 'Também dá para fazer' : 'O que eles podem fazer'}</h3>${opcoesHtml(m.opcoes, E.aqui)}</section>`;
      if (m.vila) h += `<section class="g-bloco"><h3 class="g-rot">A vila não espera</h3><div class="g-trava"><p>Se a mesa parar, faça uma destas coisas acontecer:</p><ul>${m.vila.map((v) => `<li>${v}</li>`).join('')}</ul></div></section>`;
      if (m.mestre) h += `<section class="g-bloco"><h3 class="g-rot">Só para você</h3><div class="g-mestre">${m.mestre.map((p) => `<p>${p}</p>`).join('')}</div></section>`;
      if (m.trava) h += `<section class="g-bloco"><h3 class="g-rot">Se a mesa travar</h3><div class="g-trava">${m.trava}</div></section>`;
      const seg = [...(m.seguir || [])];
      if (m.voltar) seg.unshift(['patio', '← Voltar ao mapa da vila']);
      if (seg.length) h += `<div class="g-seguir">${seg.map(([id, t]) => `<button class="g-acao ${t.startsWith('←') ? '' : 'forte'}" data-g="ir" data-v="${id}">${esc(t)}${t.startsWith('←') ? '' : ' →'}</button>`).join('')}</div>`;
    }
    return h;
  }

  // ---------- estado da mesa (aba do painel) ----------
  const TAREFAS = ['—', 'Consertar o círculo', 'Preparar o corpo', 'Buscar no mocó', 'Convencer a família', 'Investigar', 'Confiança da vila', 'Trancas (mutirão)', 'Outra'];
  function estadoHtml() {
    const seg = (k, ops) => `<div class="g-seg">${ops.map(([v, t]) => `<button class="${E[k] === v ? 'on' : ''}" data-g="set" data-k="${k}" data-v="${v}">${t}</button>`).join('')}</div>`;
    const n = E.pistas.length;
    return `<div class="g-painel"><h4>O que o grupo conseguiu <small>clique para marcar</small></h4>${recBotoes(RECURSOS.map((r) => r[0]))}
        <p class="g-cont">${rec('lenha') >= 2 ? '<b>Dá para queimar o corpo.</b>' : `Lenha para queimar o corpo: ${rec('lenha')} de 2.`} ${rec('cal') ? '' : 'Sem cal, o conserto tem −2.'}</p></div>
      <div class="g-painel"><h4>Antes do pôr do sol <small>decide a noite</small></h4>
        <div class="g-esc"><span>O trecho apagado</span>${seg('trecho', [['aberto', 'Aberto'], ['fino', 'Consertado fino'], ['forte', 'Consertado 20+']])}</div>
        <div class="g-esc"><span>O corpo de Antero</span>${seg('corpo', [['velorio', 'No velório'], ['fechada', 'Casa fechada'], ['queimado', 'Queimado']])}</div>
        <div class="g-esc"><span>Celeste</span>${seg('celeste', [['', 'Escondida'], ['descoberta', 'Descoberta'], ['presa', 'Presa']])}</div>
        <div class="g-esc"><span>Brás</span>${seg('bras', [['', 'Desconfiado'], ['aliado', 'Aliado']])}</div></div>
      <div class="g-painel"><h4>Pistas achadas <small>3 bastam</small></h4>
        <div class="g-pistas">${PISTAS.map(([k, t]) => `<button class="${E.pistas.includes(k) ? 'on' : ''}" data-g="pista" data-v="${k}"><i>${E.pistas.includes(k) ? '✓' : ''}</i>${t}</button>`).join('')}</div>
        <p class="g-cont ${n >= 3 ? 'ok' : ''}"><b>${n}</b> de 6${n >= 3 ? ': já dá para chegar em Celeste.' : ''}</p></div>
      <div class="g-painel"><h4>Tarefas da tarde <small>uma por parte</small></h4>
        <div class="g-tarefas"><div class="g-tl g-th"><span></span><span>Tarde</span><span>Entardecer</span></div>
        ${pjs().map((c) => `<div class="g-tl"><span>${esc(c.data.nome)}</span>${[0, 1].map((k) => `<select data-g-tarefa="${c.id}" data-k="${k}" aria-label="${esc(c.data.nome)}">${TAREFAS.map((t) => `<option ${(E.tarefas[c.id] || [])[k] === t ? 'selected' : ''}>${t}</option>`).join('')}</select>`).join('')}</div>`).join('')}</div>
        <button class="g-limpar" data-g="zerar">Zerar o guia para uma nova sessão</button></div>`;
  }

  // ---------- gavetas ----------
  function gaveta(h) {
    let m = document.getElementById('g-modal');
    if (!m) { m = document.createElement('div'); m.id = 'g-modal'; document.body.appendChild(m); }
    m.innerHTML = `<div class="g-veu" data-g="fecha"></div><div class="g-gaveta" role="dialog" aria-modal="true"><button class="g-mini g-fechar" data-g="fecha">Fechar</button>${h}</div>`;
    m.hidden = false;
  }
  const fecha = () => { const m = document.getElementById('g-modal'); if (m) m.hidden = true; };
  function npcGaveta(id) {
    const g = GENTE[id];
    gaveta(`${g.foto ? `<div class="g-retrato" style="background-image:url('${g.foto}')"></div>` : ''}<h2>${g.nome}</h2><p class="g-cinza">${g.papel}</p>
      <h4>Como os jogadores veem (sem o nome)</h4><p class="g-fala">${VISTO[id][1]}</p>
      <p class="g-cinza">Os jogadores não sabem o nome. Diga só se perguntarem, e então aperte <b>Revelar o nome</b> na peça.</p>
      <div class="g-acoes">${acaoBtn(['npc', g.nome])}</div>
      <h4>O que quer</h4><p>${g.quer}</p><h4>Como fala</h4><p>${g.fala}</p>
      ${g.conversa ? `<h4>Se perguntarem…</h4>${g.conversa.dica ? `<p class="g-cinza">${g.conversa.dica}</p>` : ''}
        <div class="g-conversa">${g.conversa.linhas.map(([q, r]) => `<details><summary>${q}</summary><p>${r}</p></details>`).join('')}</div>
        ${g.conversa.rola ? `<h4>Para arrancar mais dela, peça uma rolagem</h4>${rolaHtml(g.conversa.rola)}` : ''}` : `<h4>Falas prontas</h4>${g.falas.map((f) => `<p class="g-fala">${f}</p>`).join('')}`}
      <h4>Se perguntarem do mundo ou da vila</h4><p class="g-cinza">${g.mundo || ''}</p>
        <div class="g-conversa">${MUNDO.map(([q, r]) => `<details><summary>${q}</summary><p>${r}</p></details>`).join('')}</div>
      <h4>O que só você sabe</h4><div class="g-mestre"><p>${g.segredo}</p></div>
      <h4>Quem é</h4><p>${g.como}</p>`);
  }

  // ---------- cliques ----------
  async function click(e) {
    const t = e.target.closest('[data-g]'); if (!t) return false;
    e.preventDefault();
    const g = t.dataset.g, v = t.dataset.v;
    if (g === 'fecha') { fecha(); return true; }
    if (g === 'ir') { fecha(); mudar({ aqui: v }); ctx.repintar(true); return true; }
    if (g === 'abre') { abertos.has(v) ? abertos.delete(v) : abertos.add(v); ctx.repintar(); return true; }
    if (g === 'npc') { if (GENTE[v]) npcGaveta(v); return true; }
    if (g === 'gaveta') { gaveta(v === 'dados' ? dadosTabela() : GAVETAS[v]()); if (v === 'gente') { /* chips dentro da gaveta */ } return true; }
    if (g === 'rec') {
      const k = t.dataset.k, r = RECURSOS.find((x) => x[0] === k), n = rec(k);
      const novo = v === 't' ? (n ? 0 : 1) : Math.max(0, Math.min(r[4] || 1, n + +v));
      mudar({ rec: { ...E.rec, [k]: novo } }); ctx.repintar(); return true;
    }
    if (g === 'arm') { mudar({ armado: E.armado.includes(v) ? E.armado.filter((x) => x !== v) : [...E.armado, v] }); ctx.repintar(); return true; }
    if (g === 'pista') { mudar({ pistas: E.pistas.includes(v) ? E.pistas.filter((x) => x !== v) : [...E.pistas, v] }); ctx.repintar(); return true; }
    if (g === 'set') { const k = t.dataset.k; mudar({ [k]: E[k] === v && v ? '' : v }); ctx.repintar(); return true; }
    if (g === 'zerar') { if (t.dataset.certo) { E = { ...PADRAO_GUIA }; ctx.salvar(E); ctx.repintar(true); } else { t.dataset.certo = '1'; t.textContent = 'Clique de novo para zerar tudo'; } return true; }
    if (g === 'acao') { t.disabled = true; fecha(); await ctx.acao(t.dataset.t, v); t.disabled = false; return true; }
    if (g === 'pedir') { const r = ROLA[v]; await ctx.pedir({ rola: v, label: r.nome, per: r.per, alt: r.alt || '', quem: t.dataset.q ? [t.dataset.q] : [] }); ctx.repintar(); return true; }
    if (g === 'cancelar') { await ctx.encerrar(v); ctx.repintar(); return true; }
    return true;
  }
  function change(t) {
    if (!t.matches('[data-g-tarefa]')) return false;
    const id = t.dataset.gTarefa, tar = { ...E.tarefas, [id]: [...(E.tarefas[id] || ['—', '—'])] };
    tar[id][+t.dataset.k] = t.value; mudar({ tarefas: tar }); return true;
  }

  return { html, estadoHtml, click, change, estado, setEstado, ir: (id) => mudar({ aqui: id }), marcar: (k, v) => mudar({ [k]: v }), faixaTexto: (rola, total) => ROLA[rola]?.f[faixaDe(total)] };
}
