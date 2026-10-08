"""Monstros em pixel (32x32, 4 quadros) + versões morto / ferido / desmaiado.

Uso: python3 tools/monstros.py PASTA_SAIDA
Gera <tipo>-<variante>.png (folha de 4 quadros), <tipo>-<variante>-morto.png (1 quadro, deitado)
e, para os personagens, <id>-ferido.png e <id>-caido.png.
"""
import os, sys, random
from PIL import Image, ImageEnhance
sys.path.insert(0, os.path.dirname(__file__))
from sprites import C, W, H, body, eyes, CHARS, frame as pet_frame

# ---------- peças comuns ----------
def small_head(c, skin, sh, cy=12, rx=6, ry=5):
    c.e(16, cy, rx, ry, skin)
    for y in range(cy - ry, cy + ry + 1):
        for x in range(19, 24):
            if c.get(x, y): c.p(x, y, sh)

def legs(c, col, feet, y0=27):
    c.r(12, y0, 14, 29, col); c.r(17, y0, 19, 29, col)
    c.r(11, 30, 14, 30, feet); c.r(17, 30, 20, 30, feet)

def blade(c, pts, col='#b8bec6', hi='#e8ecf0'):
    c.pts(pts, col); c.p(*pts[-1], hi)

# ---------- monstros ----------
def goblin(c, blink, v):
    skin, sh = ('#8aa63e', '#6a8430') if v == 'a' else ('#9a9a3a', '#7a7a2c')
    tun, tun_sh = ('#6b4a2a', '#53381f') if v == 'a' else ('#7a2e2e', '#5c2222')
    c.r(12, 19, 19, 25, tun); c.r(17, 19, 19, 25, tun_sh)
    c.pts([(12, 26), (14, 26), (16, 26), (18, 26)], tun_sh)
    c.r(10, 20, 11, 23, skin); c.r(20, 20, 21, 23, skin)
    legs(c, skin, '#3a2a1a')
    small_head(c, skin, sh, 13, 6, 5)
    c.pts([(9, 11), (8, 10), (7, 9), (6, 9), (9, 12)], skin); c.pts([(23, 11), (24, 10), (25, 9), (26, 9), (23, 12)], sh)  # orelhas
    eyes(c, '#f0d030', '#fff6b0', y=12, blink=blink, lx=13, rx=18)
    c.r(14, 16, 17, 16, '#2a2a10'); c.pts([(14, 17), (17, 17)], '#f0f0d0')                                           # dentes
    if v == 'a': blade(c, [(22, 22), (23, 21), (24, 20), (25, 19)])
    else: c.r(23, 10, 23, 25, '#7a5230'); c.pts([(22, 9), (23, 8), (24, 9), (23, 7)], '#b8bec6')
    return '#1a2008'

def hobgoblin(c, blink, v):
    skin, sh = '#c06a3a', '#9a522c'
    arm, arm_sh = '#4c4c56', '#383842'
    body(c, arm, arm_sh, skin, skin, '#3a2a22', '#1e1a18')
    c.r(11, 18, 20, 19, '#6a6a76'); c.r(11, 24, 20, 25, '#6a3a22'); c.p(16, 24, '#c9a24a')
    c.e(16, 11, 7, 6, skin); c.r(20, 6, 23, 16, sh); c.r(11, 16, 21, 17, skin)
    c.r(9, 4, 23, 8, arm); c.r(9, 8, 10, 12, arm); c.r(22, 8, 23, 12, arm_sh); c.r(15, 2, 17, 4, '#a03030')          # elmo com crista
    c.r(9, 9, 23, 9, '#2a2a30')
    eyes(c, '#f8e040', '#ffffff', y=11, blink=blink)
    c.pts([(14, 15), (18, 15)], '#f0f0d0'); c.r(15, 15, 17, 15, '#4a1e10')
    if v == 'a':
        blade(c, [(23, 23), (24, 22), (25, 21), (26, 20), (27, 19), (28, 18)])
        c.r(22, 23, 23, 24, '#5a3a20')
    else:
        c.r(4, 18, 9, 26, '#6a4a2a'); c.r(5, 19, 8, 25, '#8a6a3a'); c.p(6, 22, '#c9a24a')                           # escudo
        c.r(24, 6, 24, 27, '#7a5230'); c.pts([(23, 5), (24, 3), (25, 5), (24, 4)], '#b8bec6')
    return '#1e0e08'

def kobold(c, blink, v):
    sc, sh = ('#b05a2e', '#8a4422') if v == 'a' else ('#6a7a8a', '#4e5c6a')
    c.r(12, 19, 19, 25, sh); c.r(13, 19, 18, 24, sc); c.pts([(14, 21), (16, 22), (15, 23)], '#d8a070')            # barriga
    c.r(10, 20, 11, 23, sc); c.r(20, 20, 21, 23, sh)
    legs(c, sc, '#2a1a10')
    c.pts([(10, 26), (9, 27), (8, 27), (7, 26)], sc)                                                                  # rabo
    c.e(15, 12, 5, 5, sc); c.r(18, 12, 24, 15, sc); c.r(18, 15, 24, 16, sh); c.p(24, 12, None)
    c.pts([(12, 6), (11, 5), (17, 6), (18, 5)], '#e8d8b0')                                                            # chifrinhos
    c.pts([(23, 13), (21, 16), (19, 16)], '#f0e8c8')
    if blink: c.r(16, 11, 17, 11, '#1a1010')
    else: c.r(16, 10, 17, 11, '#f0c020'); c.p(17, 11, '#1a1010')
    c.r(10, 24, 21, 24, '#5a3a20')
    if v == 'a': c.r(22, 8, 22, 26, '#7a5230'); c.pts([(21, 7), (22, 5), (23, 7), (22, 6)], '#b8bec6')
    else:
        c.r(23, 16, 23, 24, '#6a4a2a'); c.pts([(22, 14), (23, 13), (24, 14), (23, 15)], '#f08a20'); c.p(23, 12, '#ffe060')  # tocha
    return '#1a0c06'

def bandido(c, blink, v):
    skin, sh = ('#c89068', '#a87454') if v == 'a' else ('#6a4430', '#54331f')
    cloth, cloth_sh = ('#4a3a2a', '#382a1e') if v == 'a' else ('#2e3a4a', '#222c38')
    body(c, cloth, cloth_sh, cloth, skin, '#2a2420', '#181412')
    c.r(11, 24, 20, 24, '#6a4a2a'); c.p(13, 24, '#c9a24a')
    c.pts([(11, 18), (12, 19), (13, 20), (14, 21), (15, 22)], '#6a4a2a')
    c.e(16, 11, 7, 6, skin); c.r(20, 6, 23, 16, sh); c.r(11, 16, 21, 17, skin)
    c.r(9, 4, 23, 8, cloth); c.r(9, 9, 10, 15, cloth); c.r(22, 9, 23, 15, cloth_sh)                                   # capuz
    c.r(10, 13, 22, 17, '#7a2a2a' if v == 'a' else '#3a3a3a'); c.r(10, 13, 22, 13, '#5a1e1e' if v == 'a' else '#2a2a2a')  # lenço no rosto
    eyes(c, '#2a1a10', '#ffffff', y=10, blink=blink)
    if v == 'a': c.r(22, 20, 23, 26, '#6a4a2a'); c.r(21, 17, 24, 20, '#7a5a3a')                                       # clava
    else:
        c.r(21, 21, 27, 21, '#6a4a2a'); c.pts([(26, 18), (27, 19), (27, 20), (27, 22), (27, 23), (26, 24)], '#4a3a2a'); c.pts([(24, 21), (29, 21)], '#b8bec6')
    return '#120c08'

def trog(c, blink, v):
    sk, sh, lt = ('#6a7a4a', '#525e38', '#88986a') if v == 'a' else ('#5a6a6e', '#454f52', '#788a8e')
    body(c, sk, sh, sk, sk, sh, '#2a2a1e')
    c.r(11, 24, 20, 26, '#6a4a2a'); c.pts([(12, 27), (15, 27), (18, 27)], '#6a4a2a')                                  # tanga
    c.pts([(13, 19), (15, 20), (17, 21), (14, 22)], lt)
    c.e(15, 11, 6, 6, sk); c.r(19, 11, 26, 14, sk); c.r(19, 14, 26, 15, sh); c.p(26, 11, None)
    c.r(9, 6, 21, 7, sh); c.pts([(11, 4), (14, 3), (17, 4), (20, 5)], sh)                                             # crista
    c.pts([(25, 14), (23, 15), (21, 15)], '#ece2b8'); c.p(26, 12, '#1a1a10')
    if blink: c.r(17, 10, 18, 10, '#1a1a10')
    else: c.r(17, 9, 18, 10, '#e8302a'); c.p(18, 10, '#1a1a10')
    if v == 'a': c.r(24, 4, 24, 26, '#7a5230'); c.pts([(23, 3), (24, 1), (25, 3), (24, 2)], '#9aa0a8')                # azagaia
    else: c.r(22, 19, 23, 26, '#5a3a20'); c.r(21, 15, 24, 19, '#6a4a2a'); c.pts([(21, 16), (24, 17)], '#9aa0a8')     # porrete com pregos
    return '#12140a'

def esqueleto(c, blink, v):
    bone, bsh = '#e6e0cc', '#b8b29e'
    c.r(15, 18, 16, 26, bone)                                                                                          # coluna
    for y in (19, 21, 23): c.r(12, y, 19, y, bone); c.p(19, y, bsh)                                                   # costelas
    c.r(13, 25, 18, 26, bsh)
    c.r(10, 19, 10, 24, bone); c.r(21, 19, 21, 24, bone)
    c.r(13, 27, 13, 29, bone); c.r(18, 27, 18, 29, bone); c.r(12, 30, 14, 30, bsh); c.r(17, 30, 19, 30, bsh)
    c.e(16, 11, 6, 6, bone); c.r(19, 6, 22, 15, bsh); c.r(13, 16, 19, 17, bone)
    c.r(12, 10, 14, 12, '#1a1418'); c.r(18, 10, 20, 12, '#1a1418')                                                   # órbitas
    if not blink: c.p(13, 11, '#7affc0'); c.p(19, 11, '#7affc0')
    c.p(16, 13, '#3a3030'); c.pts([(14, 15), (16, 15), (18, 15)], '#3a3030')
    if v == 'a':
        c.r(5, 18, 9, 18, '#6a5a3a'); c.r(5, 17, 5, 19, '#6a5a3a')
        blade(c, [(22, 23), (23, 22), (24, 21), (25, 20), (26, 19), (27, 18)], '#9a8a70', '#c0b090')                  # espada enferrujada
    else:
        c.pts([(23, 13), (24, 14), (25, 16), (25, 18), (25, 20), (25, 22), (24, 24), (23, 25)], '#7a5230')
        c.r(23, 14, 23, 24, '#d8d0c0')                                                                                 # arco
    return '#2a241e'

def zumbi(c, blink, v):
    sk, sh = ('#7a9070', '#5e7256')
    cl, cl_sh = ('#5a4a6a', '#463a54') if v == 'a' else ('#6a5a3a', '#54462c')
    body(c, cl, cl_sh, sk, sk, '#3a3440', '#1e1a22')
    c.pts([(12, 25), (14, 26), (17, 25), (19, 26), (13, 22), (18, 21)], '#15111a')                                     # rasgos
    c.p(16, 20, '#8a2a2a'); c.p(17, 20, '#6a1e1e')
    c.r(9, 19, 10, 20, sk); c.r(21, 19, 22, 20, sk)
    c.r(4, 19, 9, 20, sk); c.r(4, 21, 5, 21, sh)                                                                       # braço esticado
    if v == 'a': c.r(22, 19, 27, 20, sk); c.r(26, 21, 27, 21, sh)
    else: c.r(21, 21, 22, 23, '#8a2a2a')                                                                               # sem um braço
    c.e(16, 11, 7, 6, sk); c.r(20, 6, 23, 16, sh); c.r(11, 16, 21, 17, sk)
    c.r(10, 5, 22, 6, '#3a3a2a'); c.pts([(12, 4), (17, 4), (20, 5)], '#3a3a2a')
    eyes(c, '#f0f0d0', '#c0c000', y=11, blink=blink)
    c.r(14, 15, 18, 16, '#2a1414'); c.pts([(15, 15), (17, 15)], '#d0d0b0')
    c.pts([(12, 8), (21, 13)], '#5a2a2a')
    return '#141a12'

def afogado(c, blink, v, capitao=False):
    sk, sh = ('#7a9aa8', '#5e7c8a') if v == 'a' else ('#6a8a7a', '#526e60')
    cl, cl_sh = ('#3a4a5a', '#2a3846') if not capitao else ('#3a2a4a', '#2a1e38')
    body(c, cl, cl_sh, sk, sk, '#2a3440', '#18202a')
    c.pts([(12, 19), (12, 21), (13, 23), (19, 20), (19, 22), (18, 24)], '#3a7a4a')                                     # algas
    c.e(16, 11, 7, 6, sk); c.r(20, 6, 23, 16, sh); c.r(11, 16, 21, 17, sk)
    c.pts([(10, 6), (9, 8), (9, 10), (10, 13), (22, 6), (23, 9), (23, 12)], '#2e6a3e')                                  # cabelo de alga
    c.r(11, 5, 21, 6, '#2e6a3e')
    eyes(c, '#c8f0ff' if not capitao else '#60ffd0', '#ffffff', y=11, blink=blink)
    c.r(14, 15, 18, 15, '#2a3a44'); c.p(19, 14, '#2a3a44')
    c.pts([(12, 17), (20, 18)], '#a8d8f0')                                                                              # gotas
    if capitao:
        c.r(8, 3, 24, 5, '#1e1a22'); c.r(11, 1, 21, 3, '#1e1a22'); c.r(8, 5, 24, 5, '#c9a24a'); c.p(16, 2, '#e8e0cc')  # chapéu tricórnio
        c.r(11, 18, 12, 26, '#c9a24a'); c.r(19, 18, 20, 26, '#c9a24a')
        blade(c, [(22, 23), (23, 22), (24, 21), (25, 20), (26, 20), (27, 19)], '#a8b0b8', '#e0e8f0')                    # sabre
        c.r(21, 23, 22, 24, '#c9a24a')
    return '#0e161c'

def capitao_afogado(c, blink, v):
    return afogado(c, blink, v, capitao=True)

def carnical(c, blink, v):
    sk, sh = ('#8a7a8e', '#6c5e70') if v == 'a' else ('#8e8a6a', '#706c50')
    c.r(12, 19, 19, 25, sk); c.r(17, 19, 19, 25, sh); c.pts([(13, 20), (13, 22), (14, 24)], sh)                       # corpo magro curvado
    c.r(11, 25, 20, 26, '#3a2a2a')
    legs(c, sk, '#2a2228')
    c.r(8, 20, 10, 25, sk); c.r(21, 20, 23, 25, sh)
    c.pts([(7, 26), (8, 27), (9, 27), (10, 26)], '#e8e0d0'); c.pts([(21, 26), (22, 27), (23, 27), (24, 26)], '#e8e0d0')  # garras
    c.e(16, 12, 6, 5, sk); c.r(20, 8, 22, 16, sh)
    c.pts([(10, 7), (11, 6), (21, 6), (22, 7)], sk)
    eyes(c, '#f04040', '#ffb0b0', y=11, blink=blink, lx=13, rx=18)
    c.r(13, 15, 19, 16, '#1a0e12'); c.pts([(13, 15), (15, 15), (17, 15), (19, 15)], '#e8e0d0')
    c.pts([(16, 17), (16, 18), (17, 18)], '#c04a6a')                                                                    # língua
    return '#160e14'

def aparicao(c, blink, v):
    g, gsh = ('#c8dcff', '#8aa8e8') if v == 'a' else ('#c8a8f0', '#8a6ac8')
    c.e(16, 19, 7, 8, g); c.r(20, 12, 23, 26, gsh)
    for x, y in [(10, 27), (12, 29), (14, 27), (17, 30), (19, 28), (21, 29)]: c.p(x, y, gsh)
    c.r(9, 20, 9, 25, g); c.r(23, 20, 23, 25, gsh); c.pts([(8, 26), (24, 26)], g)
    c.e(16, 10, 7, 7, g); c.e(16, 11, 5, 4, '#1a1830')                                                                  # capuz e rosto escuro
    if not blink: c.r(13, 10, 14, 11, '#a0fff0'); c.r(18, 10, 19, 11, '#a0fff0')
    c.p(16, 3, '#ffffff')
    return '#3a3a6a'

MONSTROS = {
    'goblin': ('Goblin', goblin), 'hobgoblin': ('Hobgoblin', hobgoblin), 'kobold': ('Kobold', kobold),
    'bandido': ('Bandido', bandido), 'trog': ('Trog', trog), 'esqueleto': ('Esqueleto', esqueleto),
    'zumbi': ('Zumbi', zumbi), 'afogado': ('Afogado', afogado), 'capitao-afogado': ('Capitão afogado', capitao_afogado),
    'carnical': ('Carniçal', carnical), 'aparicao': ('Aparição', aparicao),
}
SANGUE = {'esqueleto': None, 'aparicao': None, 'zumbi': '#3a5a2a', 'afogado': '#4a7a8a', 'capitao-afogado': '#4a7a8a'}

def mframe(fn, v, t):
    c = C()
    oc = fn(c, t == 3, v)
    if t in (1, 2): c.shift(26, 1)
    c.outline(oc)
    return c.img()

def morto(base_img, kind):
    """Deitado de lado, mais apagado, com poça (ou ossos espalhados / névoa)."""
    im = base_img.rotate(90, expand=False, resample=Image.NEAREST)
    im = ImageEnhance.Color(im).enhance(0.45)
    im = ImageEnhance.Brightness(im).enhance(0.8)
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    poca = SANGUE.get(kind, '#7a1e1e')
    if kind == 'aparicao':
        im.putalpha(im.getchannel('A').point(lambda a: a * 0.45))
    elif poca:
        c = C(); c.e(15, 25, 9, 3, poca); c.e(19, 26, 5, 2, poca); out.alpha_composite(c.img())
    else:
        c = C(); c.pts([(5, 27), (6, 28), (26, 26), (27, 27), (24, 29)], '#d8d0bc'); out.alpha_composite(c.img())
    out.alpha_composite(im, (0, 7))
    return out

def ferido(img):
    c = C()
    c.r(10, 8, 22, 8, '#e8e0d0'); c.p(21, 8, '#c03030')                                                                 # faixa na testa
    c.pts([(9, 20), (10, 21), (22, 22)], '#c03030')                                                                     # arranhões
    c.pts([(23, 9), (23, 10)], '#9ad0ff')                                                                               # suor
    out = img.copy(); out.alpha_composite(c.img()); return out

def caido(img):
    im = img.rotate(90, expand=False, resample=Image.NEAREST)
    im = ImageEnhance.Color(im).enhance(0.7)
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    out.alpha_composite(im, (0, 7))
    c = C()
    for x, y in [(6, 6), (10, 4), (14, 6), (8, 8)]: c.p(x, y, '#ffe070')                                               # estrelinhas
    c.pts([(9, 6), (11, 6), (10, 5), (10, 7)], '#ffe070')
    out.alpha_composite(c.img()); return out

def main(out):
    os.makedirs(out, exist_ok=True)
    for kind, (_, fn) in MONSTROS.items():
        for v in ('a', 'b'):
            frames = [mframe(fn, v, t) for t in range(4)]
            sheet = Image.new('RGBA', (W * 4, H), (0, 0, 0, 0))
            for i, f in enumerate(frames): sheet.paste(f, (i * W, 0))
            sheet.save(f'{out}/{kind}-{v}.png')
            morto(frames[0], kind).save(f'{out}/{kind}-{v}-morto.png')
    for name, fn, fx in CHARS:
        f0 = pet_frame(fn, fx, 0)
        ferido(f0).save(f'{out}/{name}-ferido.png')
        caido(f0).save(f'{out}/{name}-caido.png')

if __name__ == '__main__':
    main(sys.argv[1])
