# Por Um Fio

App de mesa da campanha de Tormenta20: fichas no celular, área do mestre e administração.

## Como funciona
- **Cadastro por convite.** Cada pessoa recebe um link individual (`#/convite/<código>`), cria a conta e já cai na própria ficha.
- **Papéis.** Jogador edita a própria ficha. Mestre edita todas as fichas e tem anotações secretas. Administrador faz tudo, inclusive convites, papéis, senhas e configurações (entrada discreta em *Mais → administração*).
- **Tempo real.** Mudanças em PV, PM, condições e mochila aparecem na hora para todo mundo.
- **Instalável.** Botão *Instalar na tela de início* (Android) ou instruções para o iPhone.

## Breu
O link principal abre uma tela de escolha: **Por Um Fio** (Tormenta20) ou **Breu**. O app instalado na tela de início vai direto para o Por Um Fio.
- `breu/` — a mesa de Breu: convite, criação de personagem em 7 passos (salva sozinha), ficha e convites. Mesmas contas do Por Um Fio.
- `breu/regras.js` — regras de criação do Livro Básico (origens, ofícios, Dom, Marcas, barras).
- Banco: `breu_members`, `breu_characters`, `breu_gm_notes`, `breu_invites`. Só quem está na mesa vê as fichas; só o dono ou o mestre altera; só o mestre aprova.

## Estrutura
- `index.html`, `css/app.css`, `js/app.js` — o app (sem etapa de build; publicado pelo GitHub Pages).
- `js/regras.js` — regras de Tormenta20 usadas na ficha: grupos de poderes, custos, círculos, aprimoramentos.
- `supabase/functions/convite` — função que aceita convites e faz ações de administrador.
- `assets/pixel` — os bichinhos em pixel. `assets/portraits` — retratos. `assets/maps` — mapas.
- `tools/` — scripts que desenham os bichinhos, os mapas e os ícones.

## Banco (Supabase)
`characters` (fichas), `character_spells` (magias), `profiles` (quem é quem), `invites`, `app_settings`, `gm_notes`.
As regras de acesso ficam no próprio banco: só quem tem conta vê as fichas, e só o dono ou o mestre altera cada uma.
O texto das regras dos livros fica só no banco, visível para quem está logado, e não neste repositório.
