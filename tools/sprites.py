"""Gera os bichinhos em pixel (32x32) de Por Um Fio, com quadros de animação.

Uso: python3 sprites.py OUT_DIR
Saída por personagem: <nome>.png (folha 4 quadros, 32x32 cada) e <nome>.gif (preview ampliado)
e um preview.png com todos.
"""
import sys, os
from PIL import Image

W = H = 32

def hexc(h, a=255):
    h = h.lstrip('#'); return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)

class C:
    def __init__(s):
        s.px = [[None] * W for _ in range(H)]
    def p(s, x, y, c):
        if 0 <= x < W and 0 <= y < H: s.px[y][x] = hexc(c) if c else None
    def r(s, x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): s.p(x, y, c)
    def e(s, cx, cy, rx, ry, c):
        for y in range(H):
            for x in range(W):
                if ((x - cx) / (rx + .5)) ** 2 + ((y - cy) / (ry + .5)) ** 2 <= 1: s.p(x, y, c)
    def pts(s, lst, c):
        for x, y in lst: s.p(x, y, c)
    def row(s, y, spans, c):
        for a, b in spans: s.r(a, y, b, y, c)
    def get(s, x, y):
        return s.px[y][x] if 0 <= x < W and 0 <= y < H else None
    def outline(s, c):
        oc = hexc(c); add = []
        for y in range(H):
            for x in range(W):
                if s.px[y][x] is None and any(s.get(x + dx, y + dy) for dx, dy in ((1,0),(-1,0),(0,1),(0,-1))):
                    add.append((x, y))
        for x, y in add: s.px[y][x] = oc
    def shift(s, y_from, dy):
        """desloca tudo de y<=y_from em dy (respiração)"""
        new = [[None] * W for _ in range(H)]
        for y in range(H):
            for x in range(W):
                if s.px[y][x] is None: continue
                ny = y + dy if y <= y_from else y
                if 0 <= ny < H and new[ny][x] is None or y > y_from:
                    if 0 <= ny < H: new[ny][x] = s.px[y][x]
        s.px = new
    def img(s):
        im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        for y in range(H):
            for x in range(W):
                if s.px[y][x]: im.putpixel((x, y), s.px[y][x])
        return im

# ---------- base chibi ----------
def head(c, skin, shade):
    c.e(16, 11, 7, 6, skin)
    # sombra lado direito / queixo
    for y in range(6, 18):
        for x in range(20, 24):
            if c.get(x, y): c.p(x, y, shade)
    c.r(11, 16, 21, 17, None); c.e(16, 15, 5, 2, skin)
    c.r(18, 16, 20, 17, shade)

def eyes(c, col='#1b1420', hi='#ffffff', y=12, blink=False, lx=12, rx=19):
    if blink:
        c.r(lx, y + 1, lx + 1, y + 1, col); c.r(rx, y + 1, rx + 1, y + 1, col); return
    c.r(lx, y, lx + 1, y + 1, col); c.r(rx, y, rx + 1, y + 1, col)
    c.p(lx, y, hi); c.p(rx, y, hi)

def body(c, top, top_sh, arm, hand, legs, feet):
    c.r(11, 18, 20, 26, top); c.r(18, 18, 20, 26, top_sh)
    c.r(9, 19, 10, 23, arm); c.r(21, 19, 22, 23, arm)
    c.r(9, 24, 10, 24, hand); c.r(21, 24, 22, 24, hand)
    c.r(12, 27, 14, 29, legs); c.r(17, 27, 19, 29, legs)
    c.r(11, 30, 14, 30, feet); c.r(17, 30, 20, 30, feet)

def blush(c, col):
    c.p(11, 14, col); c.p(21, 14, col)

# ---------- personagens ----------
def fani(c, blink):
    skin, sh = '#f2c6a6', '#ddab88'
    hair, hair_sh = '#c45a24', '#9c4218'
    # cabelo de trás (longo)
    c.r(8, 8, 24, 22, hair); c.r(21, 8, 24, 22, hair_sh)
    body(c, '#5f8a33', '#4a6e26', skin, skin, '#4a6e26', '#5b3d22')
    for x, y in [(11, 20), (13, 22), (15, 19), (17, 21), (19, 23), (12, 25), (16, 24), (19, 19)]:
        c.p(x, y, '#7fae45')                                           # folhas
    c.pts([(12, 18), (13, 19), (14, 20), (17, 20), (18, 19), (19, 18)], '#7a5530')  # cordas
    c.p(16, 20, '#4fd1c5')                                             # pingente
    head(c, skin, sh)
    c.r(9, 4, 23, 7, hair); c.r(9, 8, 10, 13, hair); c.r(22, 8, 23, 13, hair_sh)
    c.pts([(12, 8), (13, 8), (18, 8)], hair)                             # franja
    c.pts([(10, 5), (12, 4)], '#7fae45'); c.p(11, 5, '#ffffff')          # flor e folha
    eyes(c, '#2aa7a0', '#d9fffb', blink=blink)
    c.pts([(12, 14), (20, 14), (13, 15)], '#e09a7a')                     # sardas
    c.r(15, 15, 17, 15, '#b45f4a')
    return '#2a1a10'

def fani_fx(c, t):
    # camaleão no ombro direito, olho que gira
    c.r(22, 16, 25, 17, '#5fae4a'); c.p(25, 15, '#5fae4a'); c.p(26, 16, '#5fae4a')
    c.p(24, 15, '#3f8a35'); c.p(23, 15, '#4fd1c5')
    c.p(26, 15 if t % 2 else 16, '#1b1420')
    c.pts([(21, 18), (21, 19), (22, 19)], '#3f8a35')                     # rabo enrolado

def zuri(c, blink):
    skin, sh = '#6b4330', '#54321f'
    snake, snake_sh = '#4f7a42', '#3a5a30'
    body(c, '#2a2638', '#1f1c2b', '#2a2638', skin, '#1f1c2b', '#141220')
    c.r(14, 18, 17, 22, '#e8e0d0'); c.r(11, 23, 20, 24, '#6a3a8c')     # blusa + faixa roxa
    c.r(11, 18, 11, 26, '#b8913a'); c.r(20, 18, 20, 26, '#b8913a')
    c.p(16, 24, '#c9a24a')
    c.r(8, 17, 23, 18, '#2a2638')                                      # capuz caído nos ombros
    # massa de cobras atrás da cabeça
    c.e(16, 9, 10, 7, snake)
    for x, y in [(8, 6), (12, 3), (20, 3), (24, 6), (7, 11), (25, 11), (16, 2), (10, 14), (22, 14)]:
        c.p(x, y, snake_sh); c.p(x + 1, y, '#6f9a5a')                      # escamas/brilho
    head(c, skin, sh)
    # cobras caindo na testa
    c.row(6, [(10, 13), (15, 17), (19, 22)], snake); c.row(7, [(10, 11), (14, 14), (18, 18), (22, 22)], snake_sh)
    c.pts([(12, 6), (16, 6), (20, 6)], '#6f9a5a')
    # olhos de serpente: dourados com fenda
    if blink:
        c.r(12, 12, 13, 12, '#1b1420'); c.r(19, 12, 20, 12, '#1b1420')
    else:
        c.r(12, 11, 13, 12, '#f0b030'); c.r(19, 11, 20, 12, '#f0b030')
        c.p(13, 11, '#1b1420'); c.p(13, 12, '#1b1420'); c.p(20, 11, '#1b1420'); c.p(20, 12, '#1b1420')
    c.p(16, 9, '#e0b84a')                                              # lua na testa
    c.r(15, 15, 17, 15, '#3a2018'); c.p(17, 14, '#3a2018')              # sorriso de canto
    return '#0e0c16'

def zuri_fx(c, t):
    # cabeças de cobra que espiam e mostram a língua
    heads = [(6, 7, -1), (26, 7, 1), (9, 2, -1), (23, 2, 1), (5, 13, -1), (27, 13, 1), (16, 0, 0)]
    for i, (x, y, d) in enumerate(heads):
        off = (t + i) % 2
        hx, hy = x + d * off, y - off * (1 if d == 0 else 0)
        c.p(x - d, y + 1, '#3a5a30')
        c.r(hx, hy, hx + (1 if d >= 0 else 0), hy, '#6f9a5a') if d != 0 else c.p(hx, hy, '#6f9a5a')
        c.p(hx, hy, '#4f7a42'); c.p(hx + (d if d else 0), hy, '#6f9a5a')
        if (t + i) % 4 == 0: c.p(hx + 2 * d if d else hx, hy - (1 if d == 0 else 0), '#d04a4a')
    # flauta na mão, abaixada, e notas mágicas
    c.pts([(22, 24), (23, 23), (24, 22), (25, 21), (26, 20), (27, 19)], '#c8ced6')
    c.pts([(24, 22), (26, 20)], '#8f97a1')
    for i, (x, y) in enumerate([(28, 15), (26, 12), (29, 10)]):
        if (t + i) % 3 != 2:
            c.pts([(x, y), (x, y + 1), (x + 1, y - 1)], '#b48cff'); c.p(x - 1, y + 1, '#b48cff')

def pato(c, blink):
    robe, robe_sh, robe_hi = '#6b6866', '#4e4b49', '#8a8683'
    body(c, robe, robe_sh, robe, '#6b6560', robe_sh, '#33302e')
    c.r(10, 18, 21, 27, robe); c.r(18, 18, 21, 27, robe_sh)            # manto até o chão
    c.r(15, 18, 16, 27, robe_hi)                                       # faixa bordada
    for y in (20, 23, 26): c.p(15, y, '#a19c97')
    # penas nos ombros
    for x, y in [(8, 19), (7, 21), (8, 23), (23, 19), (24, 21), (23, 23)]:
        c.pts([(x, y), (x, y + 1)], '#8a8683'); c.p(x + (1 if x < 16 else -1), y, robe_sh)
    # capuz grande
    c.e(16, 10, 8, 8, robe); c.e(19, 10, 5, 7, robe_sh)
    c.e(16, 11, 5, 4, '#1c1a19')                                       # sombra do rosto
    c.p(16, 2, robe_hi); c.p(21, 4, '#a19c97'); c.r(21, 5, 21, 7, '#a19c97')  # pingente
    # bico largo saindo da sombra
    bill, bill_sh = '#d6c69a', '#a8966c'
    c.r(15, 12, 17, 12, bill); c.r(14, 13, 18, 13, bill); c.r(13, 14, 19, 15, bill)
    c.r(13, 16, 19, 16, bill_sh); c.p(19, 15, bill_sh)
    c.pts([(15, 13), (17, 13)], '#7a6a4a')                               # narinas
    if not blink: c.p(13, 11, '#ece6da'); c.p(19, 11, '#ece6da')        # olhos brilhando no escuro
    return '#141312'

def pato_fx(c, t):
    # d20 claro na mão direita, ao lado do corpo, quicando de leve
    dy = -1 if t in (1, 2) else 0
    c.r(23, 23 + dy, 25, 25 + dy, '#e6e1d8'); c.p(23, 23 + dy, None); c.p(25, 25 + dy, None)
    c.p(24, 24 + dy, '#6b6866'); c.p(25, 23 + dy, '#bdb7ac')


def hippion(c, blink):
    skin, sh, lt = '#3fb8b0', '#2a948e', '#72d8cd'
    hair, hair_sh = '#1f6b62', '#154d47'
    shirt, shirt_sh = '#8c2f45', '#6a2235'
    # cabelo longo atrás, caindo nos ombros, com trancinhas
    c.r(9, 6, 23, 18, hair); c.r(21, 6, 23, 18, hair_sh)
    c.pts([(9, 19), (10, 20), (22, 19), (23, 20)], hair_sh)
    body(c, shirt, shirt_sh, shirt, skin, '#3a2a22', '#22181a')
    c.r(14, 18, 17, 24, skin); c.r(15, 18, 16, 19, lt)                   # peito aberto
    c.pts([(13, 18), (13, 19), (18, 18), (18, 19)], shirt_sh)             # gola
    c.pts([(14, 19), (15, 20), (16, 20), (17, 19)], '#d4a640'); c.p(16, 21, '#e8c060')  # colar + medalhão
    c.r(19, 18, 19, 23, '#22252b'); c.p(19, 20, '#d4a640'); c.p(19, 22, '#e8e0cc')    # alça + fivela + caveirinha
    # braços cruzados na frente do peito
    c.r(9, 18, 10, 21, shirt); c.r(21, 18, 22, 21, shirt_sh)
    c.r(9, 22, 22, 23, skin); c.r(9, 23, 22, 23, sh)
    c.r(9, 24, 10, 24, None); c.r(21, 24, 22, 24, None)
    c.pts([(12, 22), (13, 23), (14, 22), (15, 23)], '#9a7444')            # corda no pulso
    c.pts([(18, 22), (20, 22)], lt)                                       # escamas
    c.r(11, 24, 20, 24, shirt_sh)
    c.r(11, 25, 20, 26, '#22252b'); c.r(15, 25, 16, 26, '#d4a640')        # cinto preto, fivela
    c.p(12, 26, '#efcfb4'); c.p(17, 27, '#d4a640')                         # concha + bússola
    head(c, skin, sh)
    # topete espetado
    for x, top in [(10, 4), (11, 2), (12, 3), (13, 1), (14, 2), (15, 0), (16, 1), (17, 0), (18, 2), (19, 1), (20, 3), (21, 2), (22, 4)]:
        c.r(x, top, x, 6, hair if x % 2 else hair_sh)
    c.r(9, 5, 23, 7, hair); c.pts([(12, 7), (14, 8), (18, 7)], hair)
    c.r(9, 8, 9, 14, hair); c.r(23, 8, 23, 14, hair_sh)
    c.pts([(9, 15), (9, 17), (23, 15), (23, 17)], '#9a7444')              # contas das tranças
    eyes(c, '#f08a2a', '#ffe0b0', blink=blink)
    c.pts([(12, 10), (13, 10), (19, 9), (20, 10)], '#154d47')              # sobrancelha arqueada
    c.r(15, 15, 17, 15, '#1f6b62'); c.p(18, 14, '#1f6b62')                 # sorriso de canto
    c.r(15, 16, 16, 16, '#2a948e')                                         # cavanhaque
    c.p(10, 12, '#d4a640')                                                 # brinco
    return '#0e2624'

def hippion_fx(c, t):
    # orelhas-barbatana coladas na cabeça, que se abrem um pouco
    fin, fin_dk, gold = '#2f62b0', '#1f4480', '#e8c050'
    o = 1 if t in (1, 2) else 0
    left = [(8, 10), (8, 11), (8, 12), (7, 10 - o), (7, 11), (6, 10 - o), (7, 9 - o)]
    c.pts(left, fin); c.pts([(6, 10 - o), (7, 9 - o)], gold); c.p(7, 11, fin_dk)
    c.pts([(32 - x, y) for x, y in left], fin); c.pts([(26, 10 - o), (25, 9 - o)], gold); c.p(25, 11, fin_dk)
    # tridente em pé, seguro pela mão direita
    shaft, metal, hi = '#7a5230', '#d4a640', '#f2d880'
    c.r(26, 6, 26, 30, shaft)
    c.r(24, 5, 28, 5, metal); c.r(24, 2, 24, 4, metal); c.r(26, 1, 26, 4, metal); c.r(28, 2, 28, 4, metal)
    c.pts([(24, 1), (26, 0), (28, 1)], hi if t % 4 == 0 else metal)
    c.r(23, 22, 25, 23, '#3fb8b0'); c.p(25, 23, '#2a948e')               # mão no cabo
    c.pts([(26, 12), (26, 13)], '#9a7444')                                # amarração

def malekir(c, blink):
    skin, sh, lt = '#2c2833', '#1e1b24', '#45404f'
    robe, robe_sh = '#5c2f7e', '#432262'
    wine, gold = '#7c2338', '#c9a24a'
    # tranças longas atrás
    c.r(8, 8, 24, 21, '#121014'); c.pts([(9, 22), (23, 22)], '#121014')
    body(c, robe, robe_sh, robe, skin, '#2a1636', '#160c1c')
    c.r(15, 18, 16, 21, skin); c.p(16, 20, '#a75cff')                     # peito + pingente roxo
    c.pts([(14, 18), (14, 19), (13, 20), (17, 18), (17, 19), (18, 20)], wine)   # lapelas vinho
    c.pts([(13, 18), (18, 18), (12, 21), (19, 21)], gold)
    c.r(11, 23, 20, 24, wine); c.r(11, 25, 20, 25, '#6b4428'); c.p(16, 25, gold)   # faixa + cinto
    c.r(15, 26, 16, 26, gold)                                              # medalhão
    # mangas largas abertas
    c.r(7, 19, 10, 24, robe); c.r(7, 24, 10, 25, wine); c.pts([(7, 19), (7, 25)], gold)
    c.r(21, 19, 24, 24, robe_sh); c.r(21, 24, 24, 25, wine); c.pts([(24, 19), (24, 25)], gold)
    # tranças da frente com contas douradas
    for x in (9, 22):
        c.r(x, 10, x, 21, '#121014')
        for y in (13, 16, 19): c.p(x, y, gold)
    head(c, skin, sh)
    c.r(11, 4, 21, 6, '#121014'); c.pts([(13, 3), (16, 3), (19, 3)], '#121014')
    # chifres de carneiro vermelhos, enrolando para fora e para baixo
    horn, horn_sh = '#9a2c3e', '#621a28'
    L = [(10, 6), (10, 5), (9, 4), (8, 3), (7, 3), (6, 3), (5, 4), (4, 5), (4, 6), (4, 7), (5, 8), (6, 9), (7, 9), (8, 8), (7, 7), (6, 7)]
    c.pts(L, horn); c.pts([(9, 5), (8, 4), (5, 5), (5, 6), (6, 8)], horn_sh); c.p(9, 3, '#c04a5a'); c.p(8, 2, horn)
    R = [(32 - x, y) for x, y in L]
    c.pts(R, horn); c.pts([(23, 5), (24, 4), (27, 5), (27, 6), (26, 8)], horn_sh); c.p(23, 3, '#c04a5a'); c.p(24, 2, horn)
    eyes(c, '#e8412e', '#ffb09a', blink=blink)
    c.pts([(12, 10), (13, 10), (19, 10), (20, 10)], '#121014')             # sobrancelhas sérias
    c.r(15, 15, 17, 15, '#121014'); c.r(15, 16, 17, 16, '#8a8090')          # boca + cavanhaque grisalho
    c.pts([(9, 12), (23, 12)], gold)                                       # brincos
    return '#08060a'

def malekir_fx(c, t):
    # chamas magenta sobre as mãos, dançando
    core, mid, edge = '#ffb6ff', '#d43fd4', '#7e2a96'
    for side, hx in ((-1, 6), (1, 25)):
        c.r(hx - 1, 21, hx + 1, 21, '#2c2833')                             # dedos
        a = (t + (0 if side < 0 else 1)) % 2
        flame = [(hx - 1, 20), (hx, 20), (hx + 1, 20), (hx - 1, 19), (hx, 19), (hx + 1, 19),
                 (hx, 18), (hx + side * a, 17), (hx - side, 18), (hx + side * a, 16)]
        c.pts(flame, mid); c.pts([(hx - 1, 20), (hx + 1, 20), (hx - side, 18)], edge)
        c.pts([(hx, 20), (hx, 19)], core)
        if t % 2: c.p(hx - side * 2, 15, edge)                             # faísca

def neo(c, blink):
    skin, sh, lt = '#4f7c3a', '#3a5e2a', '#6c9c50'
    hood, hood_sh, hood_dk = '#4d3d32', '#382c23', '#251c16'
    leather, leather_sh = '#8c5a2c', '#6a4220'
    # capa rasgada caindo nas costas e ombro direito
    c.r(8, 16, 24, 26, hood_sh)
    c.pts([(8, 27), (10, 27), (22, 27), (24, 27), (24, 25)], hood_sh)
    body(c, '#3a2e26', '#2c231c', skin, skin, '#2c231c', '#1c1612')
    # ombreiras de couro com rebites
    c.r(9, 17, 12, 19, leather); c.pts([(10, 18), (12, 18)], '#c8a060')
    c.r(19, 17, 23, 21, hood); c.pts([(20, 20), (22, 21), (23, 19)], hood_dk)   # capa sobre o ombro
    # alças cruzadas, adagas extras, bolsa e corda
    c.pts([(11, 20), (12, 21), (13, 22), (14, 23), (15, 24)], leather)
    c.pts([(17, 21), (18, 21)], '#a0a8b0'); c.pts([(17, 22), (18, 22)], leather_sh)
    c.r(10, 25, 20, 25, leather); c.r(16, 26, 18, 27, leather); c.p(17, 26, '#c8a060')
    c.pts([(8, 24), (9, 23), (10, 24), (9, 25), (8, 25)], '#a07a4a')       # corda enrolada
    # braços enfaixados
    c.pts([(9, 20), (9, 22), (22, 22), (21, 23)], '#8a6a50')
    # capuz
    c.e(15, 10, 7, 7, hood); c.pts([(12, 2), (13, 2), (12, 1)], hood)
    c.r(8, 10, 9, 16, hood_sh); c.pts([(10, 4), (9, 6), (21, 5)], hood_sh)
    c.pts([(10, 8), (11, 14), (20, 4)], hood_dk)                           # rasgos
    c.e(16, 11, 4, 4, hood_dk)                                             # sombra do rosto
    # cabeça de jacaré
    c.r(15, 10, 19, 14, skin); c.r(19, 11, 26, 13, skin); c.r(19, 14, 26, 14, sh)
    c.r(15, 13, 18, 14, sh); c.r(19, 11, 24, 11, lt); c.p(26, 11, None)
    c.pts([(25, 14), (23, 14), (21, 14)], '#ece2b8')                       # dentes
    c.p(26, 12, '#1a1a10')
    c.pts([(20, 12), (22, 12), (17, 12)], sh)
    if blink: c.r(17, 11, 18, 11, '#1a1a10')
    else: c.r(17, 10, 18, 11, '#ffa424'); c.p(18, 10, '#1a1a10'); c.p(18, 11, '#1a1a10')
    return '#0e0b08'

def neo_fx(c, t):
    # mão no ombro segurando a adaga roxa, com relâmpagos que piscam
    c.r(19, 18, 20, 19, '#4f7c3a'); c.p(21, 18, '#b06cff')                 # mão + anel
    c.pts([(18, 19), (17, 20)], '#7a5030')                                 # cabo
    blade = [(16, 20), (15, 21), (14, 21), (13, 22), (12, 22), (11, 23), (10, 23)]
    c.pts(blade, '#c4ccd4')
    glow = ['#b05cff', '#d9a8ff']
    for i, (x, y) in enumerate(blade[2:]):
        if (i + t) % 2 == 0: c.p(x, y, glow[(i + t) % 2])
    if t % 2: c.pts([(9, 22), (11, 24), (14, 20)], '#b05cff')               # faíscas

CHARS = [
    ('hippion', hippion, hippion_fx), ('malekir', malekir, malekir_fx), ('fani', fani, fani_fx),
    ('neo', neo, neo_fx), ('zuri', zuri, zuri_fx), ('pato', pato, pato_fx),
]

def frame(fn, fx, t):
    blink = (t == 3)
    c = C()
    oc = fn(c, blink)
    if fx: fx(c, t)
    if t in (1, 2): c.shift(26, 1)        # respiração: corpo desce 1px
    c.outline(oc)
    return c.img()

def main(out):
    os.makedirs(out, exist_ok=True)
    seq = [0, 0, 1, 2, 2, 1, 0, 3]        # ordem dos quadros na animação
    allframes = []
    for name, fn, fx in CHARS:
        frames = [frame(fn, fx, t) for t in range(4)]
        sheet = Image.new('RGBA', (W * 4, H), (0, 0, 0, 0))
        for i, f in enumerate(frames): sheet.paste(f, (i * W, 0))
        sheet.save(f'{out}/{name}.png')
        big = []
        for t in seq:
            bg = Image.new('RGBA', (W, H), (34, 28, 40, 255)); bg.alpha_composite(frames[t])
            big.append(bg.resize((W * 8, H * 8), Image.NEAREST).convert('P'))
        big[0].save(f'{out}/{name}.gif', save_all=True, append_images=big[1:], duration=220, loop=0)
        allframes.append(frames)
    S = 8; pad = 16
    prev = Image.new('RGBA', (len(CHARS) * (W * S + pad) + pad, H * S + 2 * pad), (34, 28, 40, 255))
    for i, frames in enumerate(allframes):
        prev.alpha_composite(frames[0].resize((W * S, H * S), Image.NEAREST), (pad + i * (W * S + pad), pad))
    prev.save(f'{out}/preview.png')

if __name__ == '__main__':
    main(sys.argv[1])
