// Dados do mestre (capítulos 6, 7 e 10 do Livro Básico).
export const AMEACA = { Comum: 1, Forte: 2, Velho: 4 };
export const NOITES = [
  { k: 'tranquila', n: 'Tranquila', porPJ: 1 },
  { k: 'dura', n: 'Dura', porPJ: 1.5 },
  { k: 'terrivel', n: 'Terrível', porPJ: 2 },
];
export const FASES = [
  { k: 'crepusculo', n: 'Crepúsculo', parte: 0.2, d: 'Os primeiros chegam, rápidos e poucos.' },
  { k: 'breu', n: 'Breu', parte: 0.3, d: 'Eles chegam em número e testam cada traço.' },
  { k: 'hora-morta', n: 'Hora Morta', parte: 0.4, d: 'O pior momento. Os maiores aparecem.' },
  { k: 'antes-aurora', n: 'Antes da Aurora', parte: 0.1, d: 'Os que restam fogem para as fendas. Um Assombro encurralado ataca com +2 dados e não recua.' },
  { k: 'aurora', n: 'Aurora', parte: 0, d: 'As fendas fecham. O que ficou deste lado morre. A Brasa volta e o Pavor some.' },
];
export const FAMILIAS = ['Cinza', 'Raiz', 'Osso', 'Sopro', 'Lodo'];
export const BESTIARIO = [
{
"id": "cinza-1",
"nome": "Tisnado",
"familia": "Cinza",
"grau": "Comum",
"tam": "Miúdo",
"sentido": "Sente medo",
"sangue": 12,
"defesa": 11,
"atq": "1d20+2",
"dano": "d6"
},
{
"id": "cinza-2",
"nome": "Farejador de Borralho",
"familia": "Cinza",
"grau": "Comum",
"tam": "Pequeno",
"sentido": "Fareja",
"sangue": 12,
"defesa": 11,
"atq": "1d20+2",
"dano": "d6"
},
{
"id": "cinza-3",
"nome": "Varapau",
"familia": "Cinza",
"grau": "Forte",
"tam": "Grande",
"sentido": "Vê movimento",
"sangue": 20,
"defesa": 13,
"atq": "2d20+3",
"dano": "d8"
},
{
"id": "cinza-4",
"nome": "Corcunda de Cinza",
"familia": "Cinza",
"grau": "Forte",
"tam": "Grande",
"sentido": "Ouve",
"sangue": 24,
"defesa": 12,
"atq": "2d20+3",
"dano": "d8"
},
{
"id": "raiz-1",
"nome": "Enroscado",
"familia": "Raiz",
"grau": "Comum",
"tam": "Miúdo",
"sentido": "Vê movimento",
"sangue": 10,
"defesa": 12,
"atq": "1d20+2",
"dano": "d6"
},
{
"id": "raiz-2",
"nome": "Tocaia",
"familia": "Raiz",
"grau": "Comum",
"tam": "Médio",
"sentido": "Vê movimento",
"sangue": 14,
"defesa": 11,
"atq": "1d20+3",
"dano": "d8"
},
{
"id": "raiz-3",
"nome": "Rasteira",
"familia": "Raiz",
"grau": "Forte",
"tam": "Grande",
"sentido": "Fareja",
"sangue": 22,
"defesa": 13,
"atq": "2d20+3",
"dano": "d8"
},
{
"id": "raiz-4",
"nome": "Alcança",
"familia": "Raiz",
"grau": "Forte",
"tam": "Enorme",
"sentido": "Sente medo",
"sangue": 26,
"defesa": 12,
"atq": "2d20+4",
"dano": "d10"
},
{
"id": "osso-1",
"nome": "Rolador",
"familia": "Osso",
"grau": "Comum",
"tam": "Pequeno",
"sentido": "Ouve",
"sangue": 12,
"defesa": 13,
"atq": "1d20+2",
"dano": "d6"
},
{
"id": "osso-2",
"nome": "Bocarra",
"familia": "Osso",
"grau": "Comum",
"tam": "Pequeno",
"sentido": "Fareja",
"sangue": 12,
"defesa": 12,
"atq": "1d20+3",
"dano": "d8"
},
{
"id": "osso-3",
"nome": "Couraça",
"familia": "Osso",
"grau": "Forte",
"tam": "Grande",
"sentido": "Vê movimento",
"sangue": 22,
"defesa": 15,
"atq": "2d20+3",
"dano": "d8"
},
{
"id": "osso-4",
"nome": "Touro de Ossos",
"familia": "Osso",
"grau": "Forte",
"tam": "Grande",
"sentido": "Ouve",
"sangue": 28,
"defesa": 14,
"atq": "2d20+4",
"dano": "d10"
},
{
"id": "sopro-1",
"nome": "Fresta",
"familia": "Sopro",
"grau": "Comum",
"tam": "Miúdo",
"sentido": "Sente medo",
"sangue": 6,
"defesa": 14,
"atq": "1d20+2",
"dano": "d6"
},
{
"id": "sopro-2",
"nome": "Espia",
"familia": "Sopro",
"grau": "Comum",
"tam": "Pequeno",
"sentido": "Ouve",
"sangue": 10,
"defesa": 13,
"atq": "1d20+2",
"dano": "d6"
},
{
"id": "sopro-3",
"nome": "Pendurado",
"familia": "Sopro",
"grau": "Forte",
"tam": "Grande",
"sentido": "Vê movimento",
"sangue": 18,
"defesa": 14,
"atq": "2d20+3",
"dano": "d8"
},
{
"id": "sopro-4",
"nome": "Lençol",
"familia": "Sopro",
"grau": "Forte",
"tam": "Enorme",
"sentido": "Sente medo",
"sangue": 20,
"defesa": 13,
"atq": "2d20+3",
"dano": "d8"
},
{
"id": "lodo-1",
"nome": "Gruda",
"familia": "Lodo",
"grau": "Comum",
"tam": "Miúdo",
"sentido": "Fareja",
"sangue": 10,
"defesa": 11,
"atq": "1d20+2",
"dano": "d6"
},
{
"id": "lodo-2",
"nome": "Fuçador",
"familia": "Lodo",
"grau": "Comum",
"tam": "Pequeno",
"sentido": "Fareja",
"sangue": 14,
"defesa": 10,
"atq": "1d20+2",
"dano": "d6"
},
{
"id": "lodo-3",
"nome": "Escorrido",
"familia": "Lodo",
"grau": "Forte",
"tam": "Médio",
"sentido": "Ouve",
"sangue": 20,
"defesa": 12,
"atq": "2d20+3",
"dano": "d8"
},
{
"id": "lodo-4",
"nome": "Atoleiro",
"familia": "Lodo",
"grau": "Forte",
"tam": "Enorme",
"sentido": "Sente medo",
"sangue": 30,
"defesa": 10,
"atq": "2d20+3",
"dano": "d8"
},
{
"id": "velho",
"nome": "O Velho do Charco",
"familia": "Lodo",
"grau": "Velho",
"tam": "Enorme",
"sentido": "Fareja",
"sangue": 40,
"defesa": 15,
"atq": "3d20+5",
"dano": "d10"
}
];
export const PRESSAGIOS = [
  [1, 2, 'Os cachorros da vila param de latir de uma vez.', 'Um Assombro que ouve está perto.'],
  [3, 4, 'Cheiro de fogueira apagada sem fogueira nenhuma.', 'Família Cinza.'],
  [5, 6, 'Os galhos estalam sem vento.', 'Família Raiz.'],
  [7, 8, 'Ossos de bicho aparecem empilhados na estrada.', 'Família Osso.'],
  [9, 10, 'Alguém jura ter ouvido a voz de um parente morto.', 'Família Sopro.'],
  [11, 12, 'O chão fica úmido onde não choveu.', 'Família Lodo.'],
  [13, 14, 'O sol se põe vermelho demais.', 'Noite terrível.'],
  [15, 16, 'Uma criança desenha um traço que ninguém ensinou.', 'Alguém vai despertar o Dom.'],
  [17, 18, 'As corujas cantam antes da hora.', 'Algo vem pelo alto.'],
  [19, 20, 'Nada. Silêncio absoluto.', 'Um Velho anda por perto.'],
];
export const COMPLICACOES = {
  'A serra': ['Neblina que apaga a lanterna', 'Deslizamento que bloqueia o caminho', 'Um traço entalhado antigo, de sotaque desconhecido', 'Frio que custa 1 de Sangue por fase a quem não tem abrigo'],
  'O mar': ['Uma ressaca engole a praia e apaga parte do círculo', 'Um barco à deriva com alguém dentro', 'O vento do mar apaga as lanternas', 'Algo foi trazido pela maré e está na areia'],
  'O mangue': ['A maré sobe e apaga parte do círculo', 'Lama até os joelhos (−1 dado em movimento)', 'As raízes escondem quem chega', 'Um Lodo que estava enterrado'],
  'A terra seca': ['O poço da vila secou', 'Tempestade de poeira', 'O carvão acabou', 'Um viajante pede abrigo, e ninguém sabe quem é'],
  'A mata': ['O rio subiu e cortou a trilha', 'Uma armadilha de caçador esquecida', 'As árvores cobrem o céu, e o sol chega mais tarde', 'Um Raiz confundido com um tronco'],
  'As cidades de vigília': ['Toque de recolher', 'A guarda exige documento', 'Alguém pagou para não ser convocado e o grupo foi chamado no lugar', 'Um traço oficial falsificado'],
};
export const PANICO = [[1, 5, 'Foge para o lugar que parece mais seguro, mesmo que não seja.'], [6, 10, 'Congela. Não age nem se move.'], [11, 15, 'Grita. Todo Assombro por perto sabe onde ele está.'], [16, 20, 'Ataca às cegas o que estiver mais perto, amigo ou não.']];

const rnd = (n) => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
export const d = (n) => 1 + rnd(n);
export const pick = (arr) => arr[rnd(arr.length)];
export const tabela = (t, r) => t.find((x) => r >= x[0] && r <= x[1]);
export const ameacaTotal = (tipo, pjs) => Math.round((NOITES.find((x) => x.k === tipo)?.porPJ || 1.5) * pjs);
export const ameacaFase = (total) => { const a = FASES.slice(0, 4).map((f) => Math.round(total * f.parte)); a[2] += total - a.reduce((s, x) => s + x, 0); return a; };
export const custo = (ids) => ids.reduce((s, id) => s + (AMEACA[BESTIARIO.find((b) => b.id === id)?.grau] || 0), 0);

// sorteia Assombros das famílias escolhidas até completar a Ameaça de cada fase.
// Velhos só na Hora Morta; Fortes a partir do Breu.
export function sortear(total, familias) {
  const fams = familias.length ? familias : FAMILIAS;
  const pool = BESTIARIO.filter((b) => fams.includes(b.familia));
  return ameacaFase(total).map((alvo, i) => {
    const out = []; let resto = alvo, tent = 0;
    while (resto > 0 && tent++ < 40) {
      const ok = pool.filter((b) => AMEACA[b.grau] <= resto && (b.grau !== 'Velho' || i === 2) && (b.grau !== 'Forte' || i > 0));
      if (!ok.length) break;
      // prefere o maior que cabe na Hora Morta, para ter um momento forte
      const b = i === 2 && !out.length ? ok.sort((a, b2) => AMEACA[b2.grau] - AMEACA[a.grau])[0] : pick(ok);
      out.push(b.id); resto -= AMEACA[b.grau];
    }
    return out;
  });
}
