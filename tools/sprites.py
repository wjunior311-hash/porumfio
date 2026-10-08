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
def hippion(c, blink):
    skin, sh = '#5fb3a8', '#3f8f86'
    body(c, '#efe3c4', '#d8c9a2', skin, skin, '#4a3526', '#2e2018')
    c.r(11, 18, 13, 26, '#6b4a30'); c.r(18, 18, 20, 26, '#5a3c26')  # colete
    c.pts([(14, 19), (15, 20), (16, 20), (17, 19)], '#7cc4b8')         # peito à mostra
    c.r(11, 25, 20, 25, '#3a2a1c'); c.p(16, 25, '#d4a640')             # cinto + fivela
    c.pts([(12, 18), (13, 19), (14, 20), (15, 21), (16, 22), (17, 23)], '#2f5f8f')  # faixa azul
    c.r(9, 19, 10, 21, '#4fa79c'); c.r(21, 19, 22, 21, '#4fa79c')     # escamas ombro
    c.p(9, 20, '#d4a640'); c.p(22, 20, '#d4a640')
    head(c, skin, sh)
    # moicano de barbatana
    for i, (x, top) in enumerate([(12, 4), (13, 2), (14, 1), (15, 0), (16, 1), (17, 2), (18, 3), (19, 5)]):
        c.r(x, top, x, 6, '#2c8c84' if i % 2 else '#39a399')
        c.p(x, top, '#d4a640')
    c.r(20, 5, 21, 9, '#2c8c84'); c.p(22, 8, '#2c8c84'); c.r(21, 10, 21, 14, '#2c8c84')
    # orelhas-barbatana
    c.pts([(8, 10), (7, 9), (8, 11), (9, 11)], '#39a399'); c.pts([(24, 10), (25, 9), (24, 11)], '#39a399')
    c.p(9, 13, '#d4a640')                                              # brinco
    eyes(c, '#1d3c55', '#bfe8ff', blink=blink)
    c.r(15, 15, 17, 15, '#2c6b63')                                     # sorriso de canto
    c.p(18, 14, '#2c6b63')
    return '#14282a'

def malekir(c, blink):
    skin, sh = '#5a3a2a', '#432a1e'
    body(c, '#231a26', '#1a121c', '#231a26', skin, '#1a121c', '#120c14')
    c.r(14, 18, 17, 23, '#4a2a5e'); c.r(15, 18, 16, 21, skin)           # veste roxa + peito
    c.r(13, 18, 13, 26, '#c9a24a'); c.r(18, 18, 18, 26, '#c9a24a')     # debrum dourado
    c.r(11, 24, 20, 24, '#4a2a5e'); c.p(16, 25, '#c9a24a')
    c.r(8, 22, 10, 24, '#231a26'); c.r(21, 22, 23, 24, '#231a26')     # mangas largas
    for x in (8, 22):                                                 # tranças atrás dos ombros
        c.r(x, 10, x + 1, 22, '#141014')
        for y in (14, 18, 22): c.p(x, y, '#c9a24a')
    head(c, skin, sh)
    c.r(11, 5, 21, 6, '#141014'); c.pts([(10, 7), (22, 7), (13, 4), (16, 4), (19, 4)], '#141014')
    horn, horn_sh = '#c2ad84', '#8a7656'                                # chifres de carneiro
    c.pts([(11, 4), (10, 3), (9, 2), (8, 2), (7, 3), (6, 4), (6, 5), (7, 6), (8, 7), (8, 8)], horn)
    c.pts([(10, 4), (9, 3), (7, 5), (7, 7)], horn_sh)
    c.pts([(21, 4), (22, 3), (23, 2), (24, 2), (25, 3), (26, 4), (26, 5), (25, 6), (24, 7), (24, 8)], horn)
    c.pts([(22, 4), (23, 3), (25, 5), (25, 7)], horn_sh)
    eyes(c, '#e0a63a', '#fff1c4', blink=blink)
    c.r(15, 16, 17, 16, '#2a1a12'); c.p(16, 17, '#c9a24a')            # cavanhaque dourado
    return '#0c070d'

def malekir_fx(c, t):
    # chamas negras com ouro nas mãos, oscilando
    for side, hx in ((-1, 6), (1, 25)):
        dy = 0 if (t + hx) % 2 else -1
        c.r(hx - 1, 22, hx + 1, 23, '#5a3a2a')                          # palma aberta
        c.r(hx - 1, 20 + dy, hx + 1, 21 + dy, '#f2c14e')                 # miolo dourado
        c.p(hx, 21 + dy, '#fff1c4')
        c.pts([(hx - 1, 19 + dy), (hx, 18 + dy), (hx + side, 17 + dy), (hx, 16 + dy + (t % 2))], '#2a2030')
        c.p(hx + 1, 19 + dy, '#2a2030')

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

def neo(c, blink):
    skin, sh, light = '#5e6b3a', '#47522a', '#7a8650'
    cape, cape_sh = '#6e6538', '#544c28'
    body(c, '#4a3524', '#3a2918', skin, skin, '#3a2918', '#251a10')
    # capa rasgada sobre os ombros
    c.r(8, 17, 23, 21, cape); c.r(19, 17, 23, 21, cape_sh)
    c.r(8, 22, 9, 26, cape); c.r(22, 22, 23, 26, cape_sh)
    c.pts([(10, 22), (12, 22), (13, 23), (19, 22), (21, 23), (8, 27), (23, 27)], cape_sh)
    c.pts([(9, 19), (12, 20), (21, 19)], '#3a3418')                       # furos
    # couro: alça diagonal com adagas
    c.pts([(11, 22), (12, 23), (13, 24), (14, 25), (15, 26)], '#2a1d12')
    c.pts([(17, 22), (18, 22), (17, 24), (18, 24)], '#b9c0c6')            # cabos das adagas
    c.r(10, 26, 21, 26, '#2a1d12'); c.r(12, 27, 13, 27, '#6b5236')        # cinto + bolsa
    c.r(9, 23, 9, 25, '#8a6a3a')                                         # corda enrolada
    # capuz pontudo
    c.e(14, 10, 7, 7, cape); c.pts([(11, 3), (12, 2), (12, 1), (13, 2)], cape)
    c.r(7, 9, 8, 16, cape_sh); c.pts([(9, 7), (10, 14)], '#3a3418')
    c.e(16, 11, 4, 4, '#2c2a14')                                         # sombra do rosto
    # cabeça de jacaré
    c.r(15, 10, 19, 14, skin); c.r(19, 11, 26, 13, skin); c.r(19, 14, 26, 14, sh)
    c.r(15, 13, 18, 14, sh); c.r(19, 11, 24, 11, light); c.p(26, 11, None)
    c.pts([(25, 14), (23, 14), (21, 14)], '#e6dcae')                      # dentes
    c.p(26, 12, '#2a2a18')                                               # narina
    c.pts([(20, 12), (22, 12), (17, 12)], sh)                            # escamas
    if blink: c.r(17, 11, 18, 11, '#2a2a18')
    else: c.r(17, 10, 18, 11, '#f0b830'); c.p(18, 11, '#2a2a18')
    return '#15160c'

def neo_fx(c, t):
    # mão erguida segurando a faca curva junto ao peito, brilho correndo na lâmina
    c.r(19, 20, 20, 21, '#5e6b3a')
    blade = [(18, 21), (17, 21), (16, 21), (15, 22), (14, 22), (13, 23)]
    c.pts(blade, '#cfd6dc'); c.p(21, 21, '#4a3524')
    x, y = blade[t % 4 + 1]; c.p(x, y, '#ffffff')

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

CHARS = [
    ('hippion', hippion, None), ('malekir', malekir, malekir_fx), ('fani', fani, fani_fx),
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
