// O guia da mesa, dentro do app: o mestre segue a sessão por aqui e aperta os botões que mexem no mapa.
import { GENTE, VISTO, ROLA, FX_C, PISTAS, ATOS, RESOLVER, MOMENTOS as M } from './guia-dados.js?v=5';

export const PADRAO_GUIA = { aqui: 'inicio', trecho: '', corpo: '', celeste: '', bras: '', pistas: [], tarefas: {}, rec: {} };
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
  function setEstado(v) { E = { ...PADRAO_GUIA, ...(v || {}) }; E.rec ||= {}; }
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
  const pjs = () => S.chars.filter((c) => c.status === 'aprovado');
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
      ${p.rola ? rolaHtml(p.rola) : ''}</li>`).join('')}</ol></section>`;
  }

// ---------------- a noite, montada pelo estado ----------------
function noiteHtml() {
  const corpoNaVila = E.corpo !== 'queimado';
  const aberto = E.trecho === 'aberto' || !E.trecho;
  const oculta = E.celeste !== 'descoberta' && E.celeste !== 'presa';
  const ondeCorpo = E.corpo === 'fechada' ? 'a casa fechada' : 'a casa do velório';
  const alvo = E.corpo === 'queimado' ? 'o trecho' : ondeCorpo;
  const mais = corpoNaVila ? ' + 1 Farejador de Borralho (o morto chama)' : '';
  const investida = aberto
    ? { f: 'O trecho está aberto: eles entram', d: 'Não precisam investir contra nada. Passam pelo buraco e vão direto para ' + alvo + '. Quem estiver no caminho, luta: clique no Assombro, escolha o personagem e aperte <b>Rolar ataque</b>. Se acertar, o dano sai do Sangue sozinho.' }
    : { f: 'Eles investem contra o trecho', d: `O trecho tem a força que o conserto tirou. Cada investida: clique no Assombro, escolha <b>O círculo da vila</b> e aperte <b>Rolar ataque</b> (a força fica na aba A história). <b>Não superou:</b> a linha segura e perde 3 de força. <b>Superou:</b> abre uma brecha e ele entra. Fechar a brecha leva uma rodada inteira e uma nova rolagem de Traços.` };
  const rodadas = { f: 'Rode em rodadas', d: 'Diga: "Agora a noite anda em rodadas." Em cada rodada, <b>os jogadores agem primeiro</b>, na ordem que quiserem: cada um anda (até os passos dele) e faz uma ação (atacar, riscar, curar, encorajar, ajudar). <b>Depois agem os Assombros.</b> No app, aperte <b>Nova rodada</b> a cada volta. Arma sem traço não fere Assombro: só faz ele perder o próximo movimento.' };
  const pavor = { f: 'O Pavor da virada', d: 'Quando você vira a fase, o app pede Firmeza a todos: cada jogador rola no próprio celular. Quem tira menos de 15 ganha 1 Pavor sozinho (menos um dado em tudo até o amanhecer). Encorajar alguém (uma ação) tira 1.' };
  const fimFase = { f: 'Quando a ameaça desta fase acabar, avance', d: 'Os Assombros morreram, foram empurrados para fora, ou recuaram para o escuro. Não precisa matar todos: depois de três ou quatro rodadas sem chance, eles recuam e esperam a próxima fase.' };

  let hm;
  if (oculta) {
    hm = [
      pavor,
      { f: 'Leia o silêncio', leia: [['', 'É o meio da noite, a hora em que até os grilos se calam. Ninguém sabe dizer quando foi que parou de ouvir o fungado lá fora. Alguém cochilou sentado. O escuro está tão quieto que dá para ouvir a respiração de quem está do lado.']] },
      { f: 'Pergunte quem está acordado e onde', pergunte: '"Quem está de vigia agora? Onde?"', d: 'A resposta decide o que eles veem. Quem estiver no trecho vê tudo. Quem estiver na casa de farinha só ouve. Se ninguém vigia, é o rapaz da cal quem dá o grito.' },
      { f: 'Quem vigia rola Percepção', rola: 'vigia', d: 'A faixa diz quanto eles enxergam a tempo. Mesmo quem falha vê o resultado: a linha apaga.' },
      { f: 'Mostre a bordadeira apagando o trecho', d: 'Você <b>não diz</b> "ela usou Apagar". Você descreve o que eles veem, e eles concluem. Leia a versão de quem está mais perto:', leia: [['Para quem está no trecho, ou tirou 20+', 'No escuro, alguém se ajoelha em cima da linha. Uma figura de chapéu largo, xale nos ombros. A mão dela passa na cal em meia-lua, devagar, como quem alisa um lençol. Onde a mão passa, a linha some.'], ['Para quem está longe', `A linha de cal do trecho, que brilhava fraquinho no escuro, apaga de um lado só, como vela soprada. E do lado de fora, alguma coisa grande se mexe.`]] },
      { f: 'Faça a regra acontecer', d: `O trecho perde força: <b>${E.trecho === 'forte' ? '−2, porque o conserto foi 20 ou mais' : aberto ? 'ele já estava aberto, então ela só abre caminho' : '−4'}</b>. É a habilidade Apagar dos Rasgados.` },
      { f: 'Mostre que os Assombros não tocam nela', d: 'É este momento que entrega a verdade aos jogadores. Revele a Corcunda no app, entrando pelo trecho, e leia:', acoes: [['revelar', 'cinza-4']], leia: [['', 'Pelo vão da linha entra uma coisa curvada, de costas de cinza, maior do que um homem agachado. Ela passa a um palmo da mulher ajoelhada. Fareja o ar. Vira a cabeça na direção dela... e segue em frente. Não toca. A mulher nem se mexe.']] },
      corpoNaVila
        ? { f: 'Ao mesmo tempo: o corpo some', leia: [['', 'Da casa do velório vem um grito: "Cadê ele? Cadê o corpo?" A mesa está vazia. As velas ainda acesas em volta de nada. A porta dos fundos está aberta, e no chão de terra tem um rastro, como se tivessem arrastado alguma coisa pesada. E a moça de lenço não está em lugar nenhum.']], d: 'A filha levou o pai pela porta dos fundos, com a ajuda do moço dos baldes, e se trancou na casa do lado. A bordadeira vai para lá depois de apagar a linha. O cheiro do morto mudou de lugar: os Farejadores mudam de direção.' }
        : { f: 'Ao mesmo tempo: a viúva abre a porta', leia: [['', 'Alguém vê: a porta da casa do velório está aberta, escancarada para o escuro. A senhora de luto está parada na soleira, com a vela na mão, chamando baixinho o nome do marido.']], d: 'A bordadeira convenceu ela de que Antero volta se a porta ficar aberta. A vela chama tudo o que está lá fora.' },
      { f: 'Dê a escolha a Damião', pergunte: corpoNaVila ? '"Damião: você corre atrás da moça ou fica segurando a brecha?"' : '"Damião: você vai buscar a senhora na porta ou fica segurando a brecha?"', d: 'É o medo que ele escreveu: ter que escolher quem salvar. Não resolva por ele.' },
      { f: 'Se alguém confrontar a bordadeira', leia: [['Celeste', '"Vocês não entendem. Ele não morreu. Ele foi visitado. Se a gente deixar a porta aberta, ele volta. Todos voltam."']], d: 'Se alguém <b>ferir</b> ela e ela sangrar, os Assombros passam a atacar ela também. O moço dos baldes se joga na frente dela. Se Damião ou Tião conversaram com ele à tarde e deu certo, ele hesita uma rodada antes. Quando a verdade aparecer, mostre a forma deles no mapa.', acoes: [['forma', 'Celeste'], ['forma', 'Zeca']] },
      E.bras === 'aliado' ? { f: 'O homem tatuado grita', d: '<i>"É ela! Os bichos não tocam nela! É Rasgada!"</i> Agora a vila inteira sabe.' } : null,
      { f: 'As vozes lá de fora', d: 'Priya ouve a cantiga que só ela e a irmã sabiam. Flecha ouve uma voz doce chamando o nome dela, igualzinha a alguém de casa.', rola: 'voz' },
      rodadas,
      fimFase,
    ];
  } else if (E.celeste === 'presa') {
    hm = [pavor,
      { f: 'Leia o silêncio', leia: [['', 'É o meio da noite, a hora em que até os grilos se calam. A bordadeira, amarrada no canto, parou de chorar. Está quieta demais.']] },
      { f: 'Ela tenta fugir', d: 'O moço dos baldes corta as cordas dela no escuro. Os dois correm para o trecho. Quem estiver de vigia rola Percepção.', rola: 'vigia' },
      { f: 'Se ela chegar ao trecho', d: `Ela se ajoelha e apaga a linha com a mão (${E.trecho === 'forte' ? '−2 de força' : '−4 de força'}). A Corcunda entra pelo vão e passa por ela sem tocar.` },
      { f: 'A Corcunda entra', d: 'Revele no app. Ela vai atrás de luz e de gente.' },
      corpoNaVila ? { f: 'O corpo', d: 'A moça de lenço aproveita a confusão e some com o corpo do pai para a casa do lado.' } : null,
      { f: 'As vozes lá de fora', rola: 'voz' }, rodadas, fimFase];
  } else {
    hm = [pavor,
      { f: 'Leia o silêncio', leia: [['', 'É o meio da noite, a hora em que até os grilos se calam. A bordadeira está sentada no meio da vila, vigiada, de mãos no colo. Ela sorri para o escuro.']] },
      { f: 'Ela tenta chegar ao trecho', d: 'O moço dos baldes cria uma confusão do outro lado da casa de farinha para distrair os vigias. Quem estiver de vigia rola Percepção.', rola: 'vigia' },
      { f: 'A Corcunda entra pelo trecho mais fraco', d: 'Revele no app.' },
      corpoNaVila ? { f: 'O corpo', d: 'A moça de lenço some com o corpo do pai para a casa do lado.' } : null,
      { f: 'As vozes lá de fora', rola: 'voz' }, rodadas, fimFase];
  }

  return `
  <div class="g-meta"><span class="g-pill tempo">60 min</span>${acaoBtn(['cena', 'vila'])}${acaoBtn(['cena', 'farinha'])}</div>
  <p class="g-instr" style="margin-top:0">Esta noite foi montada pelo que você marcou na aba A história: <b>trecho ${aberto ? 'aberto' : E.trecho === 'forte' ? 'consertado forte' : 'consertado fino'}</b>, <b>corpo ${E.corpo === 'queimado' ? 'queimado' : E.corpo === 'fechada' ? 'na casa fechada' : 'no velório'}</b>, <b>bordadeira ${oculta ? 'escondida' : E.celeste}</b>. Mude na aba <b>A história</b>, à direita, e a noite muda aqui.</p>

  ${passosHtml([
    { f: 'Pergunte onde cada um passa a noite', pergunte: '"A vila inteira está na casa de farinha. Onde vocês ficam: lá dentro, de vigia no trecho, no velório com o corpo, ou em outro lugar?"', app: 'Arraste as peças de cada um para onde disseram. Os Assombros entram pelos botões de cada fase, escondidos na borda do mapa.', acoes: [['cena', 'vila'], ['grupo']] },
    { f: 'Comece a noite: Crepúsculo', d: 'A luz das cenas vivas escurece sozinha, e o app pede a cada jogador que role Firmeza (o Pavor). As respostas chegam na aba Rolagens.', acoes: [['fase', 0]] },
  ], 'Antes de escurecer')}

  ${passosHtml([
    { f: 'Leia', leia: [['', 'A luz vai embora devagar e depois de uma vez. O céu fica roxo, depois cinza, depois de nenhuma cor. Os grilos começam. Lá fora do círculo, no mato, alguma coisa fareja. Dá para ouvir: um fungado curto, repetido, que vai dando a volta na vila.'], ['', `E para sempre do mesmo lado. Do lado d${E.corpo === 'fechada' ? 'a casa fechada' : E.corpo === 'queimado' ? 'o trecho' : 'a casa do velório'}.`]] },
    { f: `Revele: 2 Farejadores de Borralho${mais}`, d: `Eles caçam pelo cheiro e vão direto para ${alvo}. Os botões põem as peças escondidas fora do círculo; revele quando eles aparecerem.`, acoes: [['assombro', 'cinza-2'], ['assombro', 'cinza-2'], ...(corpoNaVila ? [['assombro', 'cinza-2']] : [])] },
    investida, rodadas, fimFase,
  ], 'Crepúsculo')}

  ${passosHtml([
    { f: 'Vire para o Breu', d: 'Cada jogador rola o Pavor no celular.', acoes: [['fase', 1]] },
    { f: 'Leia', leia: [['', 'A noite fechou. Agora só existe o que uma lamparina tapada alcança. O resto é um preto sem fundo, e do preto vêm os barulhos: pedra rolando, mato quebrando, unha raspando no chão.'], ['', 'Alguma coisa bate na linha de cal. O círculo segura. Mas vocês sentiram, no peito, ele balançar.']] },
    { f: `Revele: 1 Tisnado, 1 Farejador de Borralho e 1 Rolador${mais}`, d: 'O Rolador se enrola feito bola e rola contra o trecho, testando a linha.', acoes: [['assombro', 'cinza-1'], ['assombro', 'cinza-2'], ['assombro', 'osso-1'], ...(corpoNaVila ? [['assombro', 'cinza-2']] : [])] },
    investida,
    { f: 'Dentro da casa de farinha, o pânico', d: 'As crianças choram (se ninguém as acalmou à tarde), e o choro chama. Alguém precisa acalmar a vila: Canto ou Lábia 15. Priya é a melhor.' },
    { f: 'Se a linha falhar, a cena é de Tião', d: 'É o pesadelo dele: um círculo malfeito destruindo uma comunidade. Pergunte: "Tião, o que passa pela sua cabeça agora?"' },
    rodadas, fimFase,
  ], 'Breu')}

  ${passosHtml([{ f: 'Vire para a Hora Morta', d: `Chega a Corcunda de Cinza${corpoNaVila ? ' e mais 1 Farejador' : ''}. Cada jogador rola o Pavor no celular.`, acoes: [['fase', 2], ['assombro', 'cinza-4'], ...(corpoNaVila ? [['assombro', 'cinza-2']] : [])] }, ...hm.filter((p) => p !== pavor)], 'Hora Morta')}

  ${passosHtml([
    { f: 'Vire para Antes da Aurora', d: 'Cada jogador rola o Pavor no celular.', acoes: [['fase', 3]] },
    { f: 'Leia', leia: [['', 'O céu, lá longe, muda de preto para um cinza que ainda não é luz. O que está lá fora sabe o que isso quer dizer. Os barulhos ficam mais rápidos, mais desesperados. O que não conseguir voltar para a fenda antes do sol vai ficar encurralado.']] },
    { f: 'Os Assombros fogem', d: 'Cada um corre para a fenda mais perto. Em fuga, não atacam o círculo, só quem estiver no caminho. Atacar um em fuga, pelas costas, dá <b>+1 dado</b>.' },
    { f: 'Cuidado com o encurralado', d: 'Um Assombro sem caminho até a fenda ataca com <b>+2 dados</b> e não recua. É a hora mais comum de perder alguém.' },
  ], 'Antes da aurora')}
  <div class="g-seguir"><button class="g-acao forte" data-g="ir" data-v="aurora">O sol nasceu: Aurora →</button></div>`;
}

function auroraHtml() {
  const fim = [];
  const ok = (E.trecho && E.trecho !== 'aberto') && E.corpo === 'queimado' && (E.celeste === 'descoberta' || E.celeste === 'presa');
  if (ok) fim.push('A vila amanhece inteira. Celeste está amarrada, ou morta. Zeca senta na terra e não sabe para onde ir. Damião e Tião precisam decidir o que fazer com ele.');
  else {
    if (E.trecho && E.trecho !== 'aberto') fim.push('O círculo segurou onde foi consertado. A linha nova está arranhada, mas inteira.');
    else fim.push('O trecho aberto deixou a noite entrar. Conte as casas que não aguentaram, e quem estava nelas.');
    if (E.corpo === 'queimado') fim.push('O corpo de Antero virou cinza no Entardecer. Lindalva não fala com ninguém.');
    else fim.push('O corpo de Antero passou a noite na vila e chamou a noite inteira. Diga onde ele amanheceu.');
    if (E.celeste === 'descoberta' || E.celeste === 'presa') fim.push('Celeste não escapou do sol. Zeca está ao lado dela, ou ao lado de onde ela estava.');
    else fim.push('Na Hora Morta, os Assombros passaram por Celeste sem tocar nela. Todo mundo viu, tarde demais. Na aurora, ela e Zeca sumiram pela estrada.');
  }
  return `
  <div class="g-meta"><span class="g-pill tempo">10 min</span></div>
  <div class="g-acoes">${acaoBtn(['fase', 4])}</div>
  ${leiaHtml([['', 'O sol aparece por cima da caatinga como se nada tivesse acontecido. A luz entra pelas frestas das portas. O Pavor vai saindo do corpo devagar, como água de roupa no varal.'], ['', 'A vila conta quem sobrou.']])}
  <section class="g-bloco"><h3 class="g-rot">O que contar, pelo que aconteceu</h3><div class="g-mestre">${fim.map((f) => `<p>${f}</p>`).join('')}</div></section>
  <section class="g-bloco"><h3 class="g-rot">Se alguém pegou o caderno</h3>${leiaHtml([['A última página', '"A romaria passa na lua nova. O sinal é a vila sem soleira."']])}<p class="g-instr">É o gancho para a próxima sessão. Se ninguém pegou, o caderno some com Celeste.</p></section>
  <section class="g-bloco"><h3 class="g-rot">Para fechar</h3><div class="g-trava">Pergunte a cada jogador, um de cada vez: <b>o que o seu personagem leva desta noite?</b> Uma frase basta. É o fim da sessão.</div></section>`;
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
    <h4>Seis jogadores</h4><p>Se alguém está calado há tempo, vire para ele: "e você, Kaeleen, enquanto isso?" É metade do trabalho.</p>
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
    let h = `<div class="g-top"><button class="g-mini segredo" data-g="gaveta" data-v="segredo">O segredo</button><button class="g-mini" data-g="gaveta" data-v="gente">Pessoas</button><button class="g-mini" data-g="gaveta" data-v="dados">Dados</button><button class="g-mini" data-g="gaveta" data-v="conduzir">Como conduzir</button><button class="g-mini travei" data-g="gaveta" data-v="resolver">Travei: como resolver</button></div>
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
      if (m.recursos) h += `<section class="g-bloco"><h3 class="g-rot">Marque o que conseguiram aqui</h3>${recBotoes(m.recursos)}</section>`;
      if (m.quem) h += `<section class="g-bloco"><h3 class="g-rot">Quem está aqui</h3><p class="g-nota">Clique numa pessoa para ver o que ela responde.</p>${genteHtml(m.quem)}</section>`;
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
