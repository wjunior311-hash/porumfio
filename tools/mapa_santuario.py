"""Desenha o Santuário de Tenebra (vista interna) como mapa ilustrado em SVG e renderiza em PNG.

Uso: python3 tools/mapa_santuario.py SAIDA.png
Grade: 40 px = 1,5 m (35 x 20 quadrados).
"""
import math, random, sys
from playwright.sync_api import sync_playwright

R = random.Random(7)
W, H, CELL = 1400, 800, 40
out = []
def add(s): out.append(s)

def rr(a, b): return R.uniform(a, b)

# ---------------- defs: texturas e brilhos ----------------
DEFS = '''
<defs>
  <filter id="snowTex" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="4" seed="3"/>
    <feColorMatrix values="0 0 0 0 0.80  0 0 0 0 0.85  0 0 0 0 0.91  0 0 0 -1.1 1.05"/>
  </filter>
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="5"/>
    <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0"/>
    <feComposite in2="SourceGraphic" operator="in"/>
  </filter>
  <filter id="stone" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="4" seed="11" result="n"/>
    <feDiffuseLighting in="n" lighting-color="#ffffff" surfaceScale="2.2" result="l"><feDistantLight azimuth="235" elevation="55"/></feDiffuseLighting>
    <feComposite in="l" in2="SourceGraphic" operator="arithmetic" k1="1.15" k2="0" k3="0" k4="0"/>
    <feComposite in2="SourceGraphic" operator="in"/>
  </filter>
  <filter id="fur" x="-20%" y="-20%" width="140%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="0.035 0.06" numOctaves="3" seed="2" result="t"/>
    <feDisplacementMap in="SourceGraphic" in2="t" scale="9" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.18 0.45" numOctaves="4" seed="9" result="s"/>
    <feDiffuseLighting in="s" lighting-color="#ffffff" surfaceScale="1.6" result="sl"><feDistantLight azimuth="240" elevation="58"/></feDiffuseLighting>
    <feComposite in="sl" in2="d" operator="arithmetic" k1="0.78" k2="0" k3="0" k4="0" result="lit"/>
    <feComposite in="lit" in2="d" operator="in"/>
  </filter>
  <radialGradient id="peltShade" cx="0.5" cy="0.45" r="0.6"><stop offset="0" stop-color="#ffffff" stop-opacity="0.12"/><stop offset="1" stop-color="#000000" stop-opacity="0.25"/></radialGradient>
  <filter id="wood" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.02 0.4" numOctaves="3" seed="4" result="w"/>
    <feDiffuseLighting in="w" lighting-color="#ffffff" surfaceScale="1.5" result="wl"><feDistantLight azimuth="235" elevation="60"/></feDiffuseLighting>
    <feComposite in="wl" in2="SourceGraphic" operator="arithmetic" k1="1.1" k2="0" k3="0" k4="0"/>
    <feComposite in2="SourceGraphic" operator="in"/>
  </filter>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="4" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="softglow" x="-80%" y="-80%" width="260%" height="260%">
    <feGaussianBlur stdDeviation="9" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
    <feDropShadow dx="5" dy="7" stdDeviation="5" flood-color="#05040a" flood-opacity="0.75"/>
  </filter>
  <radialGradient id="purpleLight"><stop offset="0" stop-color="#b46cff" stop-opacity="0.55"/><stop offset="1" stop-color="#b46cff" stop-opacity="0"/></radialGradient>
  <radialGradient id="orangeLight"><stop offset="0" stop-color="#ffab4a" stop-opacity="0.7"/><stop offset="1" stop-color="#ffab4a" stop-opacity="0"/></radialGradient>
  <radialGradient id="circleLight"><stop offset="0" stop-color="#7d4dff" stop-opacity="0.32"/><stop offset="0.7" stop-color="#5b33c8" stop-opacity="0.12"/><stop offset="1" stop-color="#5b33c8" stop-opacity="0"/></radialGradient>
  <radialGradient id="ghostG" cx="0.5" cy="0.35" r="0.65"><stop offset="0" stop-color="#d6ecff" stop-opacity="0.95"/><stop offset="0.6" stop-color="#7fb4ff" stop-opacity="0.55"/><stop offset="1" stop-color="#5a7dff" stop-opacity="0"/></radialGradient>
  <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.6"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.45"/></radialGradient>
</defs>
'''

# ---------------- área externa: neve ----------------
def snow():
    add(f'<rect width="{W}" height="{H}" fill="#e1e8f0"/>')
    add(f'<rect width="{W}" height="{H}" filter="url(#snowTex)" opacity="0.9"/>')
    # sombras azuladas de vento na neve
    for _ in range(40):
        x, y = rr(-50, W), rr(-30, H)
        add(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{rr(40,120):.0f}" ry="{rr(6,14):.0f}" fill="#9fb2c8" opacity="{rr(0.10,0.22):.2f}" transform="rotate({rr(-12,-4):.0f} {x:.0f} {y:.0f})" style="filter: blur(4px)"/>')
    # sombra projetada do prédio na neve
    add('<rect x="86" y="50" width="1250" height="690" fill="#5d6f88" opacity="0.35" style="filter: blur(10px)"/>')
    # pedras
    for _ in range(22):
        x, y = rr(0, W), rr(0, H)
        if 50 < x < 1350 and 20 < y < 750: continue
        r = rr(8, 22)
        add(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{r:.0f}" ry="{r*0.65:.0f}" fill="#525c68"/>')
        add(f'<ellipse cx="{x-2:.0f}" cy="{y-4:.0f}" rx="{r*0.85:.0f}" ry="{r*0.4:.0f}" fill="#f2f6fa"/>')
    # capim seco saindo da neve
    for _ in range(18):
        x = rr(0, W); y = rr(735, H) if R.random() < 0.6 else rr(0, 32)
        for k in range(5):
            add(f'<path d="M{x+k*3:.0f} {y:.0f} l{rr(-4,4):.0f} {-rr(6,13):.0f}" stroke="#5a5040" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>')
    # pegadas chegando na porta de baixo
    px, py = 470, 800
    for i in range(16):
        px += 14 + rr(-2, 2); py -= 5 + rr(0, 2)
        side = 7 if i % 2 else -7
        add(f'<ellipse cx="{px:.0f}" cy="{py+side:.0f}" rx="6" ry="3.6" fill="#8496ae" opacity="0.55" transform="rotate(-20 {px:.0f} {py+side:.0f})"/>')

def snowdrifts():
    # neve acumulada encostada nas paredes por fora
    for _ in range(60):
        side = R.choice(['t', 'b', 'l', 'r'])
        if side == 't': x, y = rr(80, 1320), rr(28, 40)
        elif side == 'b': x, y = rr(80, 1320), rr(720, 732)
        elif side == 'l': x, y = rr(68, 80), rr(40, 720)
        else: x, y = rr(1320, 1332), rr(40, 720)
        add(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{rr(14,40):.0f}" ry="{rr(5,10):.0f}" fill="#f4f7fb" opacity="0.9" style="filter: blur(2px)"/>')
    # neve no topo das paredes
    for _ in range(34):
        side = R.choice(['t', 'b', 'l', 'r'])
        if side in 'tb':
            x = rr(90, 1310); y = rr(44, 74) if side == 't' else rr(686, 716)
            add(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{rr(8,22):.0f}" ry="{rr(3,6):.0f}" fill="#eef3f8" opacity="{rr(0.35,0.6):.2f}" style="filter: blur(1.5px)"/>')
        else:
            y = rr(50, 710); x = rr(84, 114) if side == 'l' else rr(1286, 1316)
            add(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{rr(3,6):.0f}" ry="{rr(8,22):.0f}" fill="#eef3f8" opacity="{rr(0.35,0.6):.2f}" style="filter: blur(1.5px)"/>')

# ---------------- piso interno ----------------
FX0, FY0, FX1, FY1 = 120, 80, 1280, 680
def floor():
    add(f'<rect x="{FX0}" y="{FY0}" width="{FX1-FX0}" height="{FY1-FY0}" fill="#1d2034"/>')
    g = ['<g filter="url(#stone)">']
    for y in range(FY0, FY1, CELL):
        off = 0 if ((y - FY0) // CELL) % 2 == 0 else CELL // 2
        for x in range(FX0 - off, FX1, CELL):
            c = R.choice(['#2a2e48', '#272a43', '#2d3150', '#24283f', '#2b2f4a'])
            x0 = max(x, FX0); x1 = min(x + CELL, FX1)
            if x1 - x0 < 4: continue
            g.append(f'<rect x="{x0+1.5:.1f}" y="{y+1.5:.1f}" width="{x1-x0-3:.1f}" height="{CELL-3}" rx="3" fill="{c}"/>')
    g.append('</g>')
    add(''.join(g))
    # rachaduras
    for _ in range(40):
        x, y = rr(FX0, FX1), rr(FY0, FY1)
        d = f'M{x:.0f} {y:.0f}'
        for k in range(R.randint(2, 4)):
            x += rr(-14, 14); y += rr(-14, 14); d += f' L{x:.0f} {y:.0f}'
        add(f'<path d="{d}" stroke="#12131f" stroke-width="1.2" fill="none" opacity="0.7"/>')

# ---------------- círculos de runas ----------------
def rune(cx, cy, ang, size, col):
    s = size
    kinds = [
        f'M{-s} {-s} L{s} {s} M{-s} {s} L0 0',
        f'M0 {-s} L0 {s} M0 {-s/2} L{s} {-s}',
        f'M{-s} {s} L0 {-s} L{s} {s}',
        f'M{-s} 0 L{s} 0 M0 {-s} L{s/2} {s}',
        f'M{-s/2} {-s} L{-s/2} {s} M{-s/2} 0 L{s} {-s}',
        f'M{-s} {-s} Q{s} 0 {-s} {s}',
    ]
    d = R.choice(kinds)
    add(f'<path transform="translate({cx:.1f} {cy:.1f}) rotate({ang:.1f})" d="{d}" stroke="{col}" stroke-width="2" fill="none" stroke-linecap="round"/>')

def magic_circle(cx, cy, r, points=7, step=3, runes=True):
    col = '#c39bff'
    add(f'<circle cx="{cx}" cy="{cy}" r="{r*1.35:.0f}" fill="url(#circleLight)"/>')
    add(f'<g filter="url(#glow)" opacity="0.95">')
    add(f'<circle cx="{cx}" cy="{cy}" r="{r}" stroke="{col}" stroke-width="3" fill="none"/>')
    add(f'<circle cx="{cx}" cy="{cy}" r="{r*0.84:.1f}" stroke="{col}" stroke-width="2" fill="none"/>')
    pts = [(cx + r * 0.84 * math.cos(-math.pi/2 + 2*math.pi*i/points), cy + r * 0.84 * math.sin(-math.pi/2 + 2*math.pi*i/points)) for i in range(points)]
    d = 'M' + ' L'.join(f'{pts[(i*step) % points][0]:.1f} {pts[(i*step) % points][1]:.1f}' for i in range(points + 1))
    add(f'<path d="{d}" stroke="{col}" stroke-width="2.4" fill="none" stroke-linejoin="round"/>')
    add(f'<circle cx="{cx}" cy="{cy}" r="{r*0.36:.1f}" stroke="{col}" stroke-width="1.6" fill="none"/>')
    if runes:
        n = int(r / 7)
        for i in range(n):
            a = 2 * math.pi * i / n
            rune(cx + r * 0.92 * math.cos(a), cy + r * 0.92 * math.sin(a), math.degrees(a) + 90, 4.2, col)
    add('</g>')

# ---------------- móveis e objetos ----------------
def bed(x, y, w=80, h=150, flip=False):
    add(f'<g filter="url(#shadow)">')
    add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="5" fill="#4a4a57" filter="url(#stone)"/>')
    add(f'<rect x="{x+5}" y="{y+5}" width="{w-10}" height="{h-10}" rx="3" fill="#565665" filter="url(#stone)"/>')
    add('</g>')
    py = y + h - 34 if flip else y + 10
    add(f'<rect x="{x+14}" y="{py}" width="{w-28}" height="24" rx="8" fill="#8f8698" filter="url(#stone)"/>')
    fy = y + 14 if flip else y + 40
    col = R.choice(['#7a5636', '#5e422c', '#86603e', '#4e3828', '#6b4a33'])
    cx, ph = x + w / 2, h - 52
    t, btm = fy, fy + ph
    d = (f'M{cx} {t-4} C{cx+14} {t-4} {cx+18} {t+6} {cx+22} {t+12} C{cx+34} {t+6} {cx+42} {t+10} {cx+38} {t+22} '
         f'C{cx+32} {t+30} {cx+30} {t+40} {cx+31} {t+52} C{cx+33} {btm-30} {cx+30} {btm-20} {cx+40} {btm-10} '
         f'C{cx+36} {btm+2} {cx+24} {btm} {cx+16} {btm-6} C{cx+8} {btm+2} {cx-8} {btm+2} {cx-16} {btm-6} '
         f'C{cx-24} {btm} {cx-36} {btm+2} {cx-40} {btm-10} C{cx-30} {btm-20} {cx-33} {btm-30} {cx-31} {t+52} '
         f'C{cx-30} {t+40} {cx-32} {t+30} {cx-38} {t+22} C{cx-42} {t+10} {cx-34} {t+6} {cx-22} {t+12} '
         f'C{cx-18} {t+6} {cx-14} {t-4} {cx} {t-4} Z')
    add(f'<g filter="url(#shadow)"><g filter="url(#fur)"><path d="{d}" fill="{col}"/></g></g>')
    add(f'<path d="{d}" fill="url(#peltShade)"/>')
    add(f'<path d="M{cx} {t+8} C{cx+2} {t+40} {cx-2} {btm-40} {cx} {btm-12}" stroke="#000" stroke-opacity="0.18" stroke-width="3" fill="none"/>')

def chair(cx, cy, ang):
    add(f'<g transform="translate({cx:.1f} {cy:.1f}) rotate({ang:.1f})" filter="url(#shadow)">'
        f'<rect x="-15" y="-13" width="30" height="26" rx="6" fill="#4a4752" filter="url(#stone)"/>'
        f'<rect x="-17" y="-17" width="34" height="9" rx="4" fill="#5c5866"/></g>')

def round_table(cx, cy, r):
    for i in range(8):
        a = 2 * math.pi * i / 8 + math.pi / 8
        chair(cx + (r + 22) * math.cos(a), cy + (r + 22) * math.sin(a), math.degrees(a) - 90)
    add(f'<g filter="url(#shadow)"><circle cx="{cx}" cy="{cy}" r="{r}" fill="#1b1a20" filter="url(#wood)"/></g>')
    for k in range(1, 5):
        add(f'<circle cx="{cx}" cy="{cy}" r="{r*k/5:.1f}" stroke="#2a2830" stroke-width="1.3" fill="none" opacity="0.8"/>')
    add(f'<ellipse cx="{cx-r*0.3:.0f}" cy="{cy-r*0.35:.0f}" rx="{r*0.45:.0f}" ry="{r*0.18:.0f}" fill="#ffffff" opacity="0.05"/>')

def candles(cx, cy, n=3):
    add(f'<circle cx="{cx}" cy="{cy}" r="46" fill="url(#purpleLight)"/>')
    for i in range(n):
        x, y = cx + rr(-8, 8), cy + rr(-6, 6)
        add(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="4.5" fill="#e6dccb"/>')
        add(f'<circle cx="{x:.1f}" cy="{y-1:.1f}" r="2.2" fill="#f2c8ff" filter="url(#glow)"/>')

def barrel(cx, cy, r=18):
    add(f'<g filter="url(#shadow)"><circle cx="{cx}" cy="{cy}" r="{r}" fill="#6a4628" filter="url(#wood)"/></g>')
    add(f'<circle cx="{cx}" cy="{cy}" r="{r-3}" stroke="#2b2420" stroke-width="2.5" fill="none"/>')
    add(f'<circle cx="{cx}" cy="{cy}" r="{r*0.45:.1f}" stroke="#2b2420" stroke-width="1.5" fill="none"/>')

def drum(cx, cy, r):
    add(f'<g filter="url(#shadow)"><circle cx="{cx}" cy="{cy}" r="{r}" fill="#7a4e2e" filter="url(#wood)"/></g>')
    add(f'<circle cx="{cx}" cy="{cy}" r="{r-4}" fill="#d9c7a8" filter="url(#stone)"/>')
    add(f'<circle cx="{cx}" cy="{cy}" r="{r-4}" stroke="#5a3a22" stroke-width="2" fill="none"/>')
    for i in range(8):
        a = 2 * math.pi * i / 8
        add(f'<circle cx="{cx + (r-1.5)*math.cos(a):.1f}" cy="{cy + (r-1.5)*math.sin(a):.1f}" r="1.6" fill="#c9a24a"/>')

def lute(cx, cy, ang, s=1.0):
    add(f'<g transform="translate({cx} {cy}) rotate({ang}) scale({s})" filter="url(#shadow)">'
        f'<ellipse cx="0" cy="12" rx="14" ry="17" fill="#8a5a2e" filter="url(#wood)"/>'
        f'<circle cx="0" cy="10" r="4" fill="#2a1a10"/>'
        f'<rect x="-3" y="-30" width="6" height="30" fill="#5a3a22"/>'
        f'<rect x="-5" y="-38" width="10" height="9" rx="2" fill="#3a2614"/></g>')

def chest(x, y, w, h, ang=0, open_=False):
    add(f'<g transform="rotate({ang} {x+w/2} {y+h/2})" filter="url(#shadow)">')
    add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="3" fill="#5c3c24" filter="url(#wood)"/>')
    add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="3" fill="none" stroke="#2a1d12" stroke-width="2"/>')
    if open_:
        add(f'<rect x="{x+5}" y="{y+5}" width="{w-10}" height="{h-10}" fill="#2b1a2e"/>')
        for i in range(4):
            add(f'<rect x="{x+8+i*(w-16)/4:.0f}" y="{y+8+rr(0,6):.0f}" width="{(w-16)/4-2:.0f}" height="{h-20}" rx="3" fill="{R.choice(["#6a3a8c","#7a4a9c","#d8c8a8"])}"/>')
    else:
        add(f'<rect x="{x+w/2-5}" y="{y+h/2-4}" width="10" height="8" fill="#c9a24a"/>')
        add(f'<line x1="{x+w*0.3}" y1="{y}" x2="{x+w*0.3}" y2="{y+h}" stroke="#2a1d12" stroke-width="2"/>')
        add(f'<line x1="{x+w*0.7}" y1="{y}" x2="{x+w*0.7}" y2="{y+h}" stroke="#2a1d12" stroke-width="2"/>')
    add('</g>')

def scrolls_shelf(x, y, w, h):
    add(f'<g filter="url(#shadow)"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="3" fill="#4e3624" filter="url(#wood)"/></g>')
    for i in range(6):
        sx, sy = x + 8 + rr(0, w - 30), y + 8 + rr(0, h - 22)
        add(f'<g transform="rotate({rr(-30,30):.0f} {sx+10:.0f} {sy+4:.0f})"><rect x="{sx:.0f}" y="{sy:.0f}" width="{rr(20,32):.0f}" height="8" rx="4" fill="#dccdae"/><rect x="{sx-2:.0f}" y="{sy-1:.0f}" width="4" height="10" rx="2" fill="#a88c60"/></g>')
    add(f'<rect x="{x+w*0.5:.0f}" y="{y+h*0.55:.0f}" width="{w*0.4:.0f}" height="{h*0.3:.0f}" rx="4" fill="#6a3a8c" opacity="0.9"/>')

def ghost(cx, cy, s, ang):
    add(f'<g transform="translate({cx} {cy}) rotate({ang}) scale({s})" filter="url(#softglow)" opacity="0.85">'
        f'<path d="M0 -26 C 13 -26 17 -12 15 2 C 14 14 20 26 10 34 C 6 26 2 38 -3 30 C -7 38 -12 28 -15 34 C -20 22 -14 10 -15 0 C -16 -14 -12 -26 0 -26 Z" fill="url(#ghostG)"/>'
        f'<path d="M-15 -2 C -24 0 -30 8 -32 14" stroke="#a9ceff" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.6"/>'
        f'<path d="M15 -2 C 24 2 28 10 30 16" stroke="#a9ceff" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.6"/>'
        f'<ellipse cx="-5" cy="-13" rx="2.4" ry="3.2" fill="#1f2a55" opacity="0.8"/><ellipse cx="5" cy="-13" rx="2.4" ry="3.2" fill="#1f2a55" opacity="0.8"/></g>')

def altar(x, y, w, h):
    add(f'<rect x="{x-30}" y="{y-30}" width="{w+60}" height="{h+60}" fill="url(#orangeLight)" opacity="0.6"/>')
    add(f'<g filter="url(#shadow)"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4" fill="#232028" filter="url(#stone)"/></g>')
    add(f'<rect x="{x+8}" y="{y+8}" width="{w-16}" height="{h-16}" rx="2" fill="#2e2236"/>')
    cx, cy, r = x + w / 2 - 6, y + h / 2, min(w, h) * 0.32
    pts = [(cx + r * math.cos(-math.pi/2 + 2*math.pi*i/5), cy + r * math.sin(-math.pi/2 + 2*math.pi*i/5)) for i in range(5)]
    d = 'M' + ' L'.join(f'{pts[(i*2) % 5][0]:.1f} {pts[(i*2) % 5][1]:.1f}' for i in range(6))
    add(f'<g filter="url(#glow)"><circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r*1.08:.1f}" stroke="#a67ad8" stroke-width="1.6" fill="none"/><path d="{d}" stroke="#a67ad8" stroke-width="1.6" fill="none"/></g>')
    for i, (dx, dy, a) in enumerate([(14, 18, 30), (w - 30, 22, -40), (16, h - 26, -20), (w - 34, h - 22, 50)]):
        add(f'<g transform="translate({x+dx} {y+dy}) rotate({a})"><path d="M0 0 L22 -2 L26 0 L22 2 Z" fill="#c8ced6"/><rect x="-8" y="-2" width="9" height="4" fill="#4a3020"/></g>')
    # vela grande laranja do lado de fora do altar
    ox, oy = x + w + 4, y + h / 2
    add(f'<circle cx="{ox}" cy="{oy}" r="60" fill="url(#orangeLight)"/>')
    add(f'<circle cx="{ox}" cy="{oy}" r="11" fill="#3a2a1a"/><circle cx="{ox}" cy="{oy}" r="7" fill="#e8d6b8"/>')
    add(f'<circle cx="{ox}" cy="{oy-1}" r="4" fill="#ffcf7a" filter="url(#glow)"/>')

def brazier(cx, cy):
    add(f'<g filter="url(#shadow)"><rect x="{cx-20}" y="{cy-20}" width="40" height="40" rx="3" fill="#4a4a57" filter="url(#stone)"/></g>')
    add(f'<circle cx="{cx}" cy="{cy}" r="14" fill="#b08038"/><circle cx="{cx}" cy="{cy}" r="10" fill="#7a5420"/><circle cx="{cx-3}" cy="{cy-3}" r="4" fill="#e8c070" opacity="0.6"/>')

def pedestal_scroll(cx, cy):
    add(f'<g filter="url(#shadow)"><rect x="{cx-20}" y="{cy-22}" width="40" height="44" rx="3" fill="#4a4a57" filter="url(#stone)"/></g>')
    add(f'<g transform="rotate(-12 {cx} {cy})"><rect x="{cx-14}" y="{cy-9}" width="28" height="18" rx="2" fill="#e2d2ac"/><rect x="{cx-16}" y="{cy-10}" width="4" height="20" rx="2" fill="#a88c60"/><rect x="{cx+12}" y="{cy-10}" width="4" height="20" rx="2" fill="#a88c60"/>'
        f'<path d="M{cx-9} {cy-3} h16 M{cx-9} {cy+2} h12" stroke="#7a6440" stroke-width="1.4"/></g>')

# ---------------- paredes ----------------
WX0, WY0, WX1, WY1, T = 80, 40, 1320, 720, 40
def walls():
    add(f'<rect x="{WX0}" y="{WY0}" width="{WX1-WX0}" height="{WY1-WY0}" fill="none" stroke="#000" stroke-width="10" opacity="0.35" style="filter: blur(5px)" transform="translate(4 6)"/>')
    g = ['<g filter="url(#stone)">']
    def blocks(x0, y0, x1, y1, horiz):
        if horiz:
            for row, yy in enumerate(range(int(y0), int(y1), 20)):
                x = x0 - (0 if row % 2 == 0 else 18)
                while x < x1:
                    bw = rr(26, 46); a = max(x, x0); b = min(x + bw, x1)
                    if b - a > 3: g.append(f'<rect x="{a+1:.1f}" y="{yy+1}" width="{b-a-2:.1f}" height="18" rx="2" fill="{R.choice(["#45444f","#4c4b57","#3f3e49","#504e5b"])}"/>')
                    x += bw
        else:
            for col, xx in enumerate(range(int(x0), int(x1), 20)):
                y = y0 - (0 if col % 2 == 0 else 18)
                while y < y1:
                    bh = rr(26, 46); a = max(y, y0); b = min(y + bh, y1)
                    if b - a > 3: g.append(f'<rect x="{xx+1}" y="{a+1:.1f}" width="18" height="{b-a-2:.1f}" rx="2" fill="{R.choice(["#45444f","#4c4b57","#3f3e49","#504e5b"])}"/>')
                    y += bh
    add(f'<rect x="{WX0}" y="{WY0}" width="{WX1-WX0}" height="{T}" fill="#26252d"/>')
    add(f'<rect x="{WX0}" y="{WY1-T}" width="{WX1-WX0}" height="{T}" fill="#26252d"/>')
    add(f'<rect x="{WX0}" y="{WY0}" width="{T}" height="{WY1-WY0}" fill="#26252d"/>')
    add(f'<rect x="{WX1-T}" y="{WY0}" width="{T}" height="{WY1-WY0}" fill="#26252d"/>')
    blocks(WX0, WY0, WX1, WY0 + T, True); blocks(WX0, WY1 - T, WX1, WY1, True)
    blocks(WX0, WY0 + T, WX0 + T, WY1 - T, False); blocks(WX1 - T, WY0 + T, WX1, WY1 - T, False)
    g.append('</g>')
    add(''.join(g))
    # sombra interna das paredes sobre o piso
    add(f'<rect x="{FX0}" y="{FY0}" width="{FX1-FX0}" height="{FY1-FY0}" fill="none" stroke="#0a0a12" stroke-width="16" opacity="0.55" style="filter: blur(6px)"/>')
    # pilastras
    pil = [(WX0 + 230, WY0), (WX0 + 470, WY0), (WX1 - 470, WY0), (WX1 - 230, WY0),
           (WX0 + 230, WY1 - T), (WX0 + 470, WY1 - T), (WX1 - 470, WY1 - T), (WX1 - 230, WY1 - T)]
    for (x, y) in pil:
        dy = -10 if y == WY0 else 0
        add(f'<g filter="url(#shadow)"><rect x="{x-24}" y="{y+dy}" width="48" height="{T+10}" rx="3" fill="#55535f" filter="url(#stone)"/></g>')
        add(f'<rect x="{x-18}" y="{y+dy+6}" width="36" height="{T-2}" rx="2" fill="none" stroke="#2b2a32" stroke-width="2"/>')
    for (x, y) in [(WX0, WY0 + 210), (WX0, WY1 - 210), (WX1 - T, WY0 + 210), (WX1 - T, WY1 - 210)]:
        dx = -10 if x == WX0 else 0
        add(f'<g filter="url(#shadow)"><rect x="{x+dx}" y="{y-24}" width="{T+10}" height="48" rx="3" fill="#55535f" filter="url(#stone)"/></g>')
    for (x, y) in [(WX0, WY0), (WX1 - T, WY0), (WX0, WY1 - T), (WX1 - T, WY1 - T)]:
        add(f'<g filter="url(#shadow)"><rect x="{x-8}" y="{y-8}" width="{T+16}" height="{T+16}" rx="4" fill="#5b5966" filter="url(#stone)"/></g>')

def doors():
    # porta dupla de baixo
    add(f'<rect x="640" y="{WY1-T}" width="120" height="{T}" fill="#1d2034"/>')
    for i, x in enumerate((642, 701)):
        add(f'<rect x="{x}" y="{WY1-T+6}" width="57" height="{T-8}" fill="#6a4628" filter="url(#wood)"/>')
        for k in range(1, 4):
            add(f'<line x1="{x+k*14}" y1="{WY1-T+6}" x2="{x+k*14}" y2="{WY1-2}" stroke="#3a2614" stroke-width="2"/>')
        add(f'<rect x="{x+(46 if i==0 else 6)}" y="{WY1-T+16}" width="5" height="12" fill="#9aa0a8"/>')
    for x in (620, 760):
        add(f'<g filter="url(#shadow)"><rect x="{x-12}" y="{WY1-T-14}" width="24" height="{T+20}" rx="3" fill="#5b5966" filter="url(#stone)"/></g>')
    # porta lateral esquerda
    add(f'<rect x="{WX0}" y="340" width="{T}" height="80" fill="#1d2034"/>')
    add(f'<rect x="{WX0+6}" y="344" width="{T-10}" height="72" fill="#6a4628" filter="url(#wood)"/>')
    for k in range(1, 4):
        add(f'<line x1="{WX0+6}" y1="{344+k*18}" x2="{WX0+T-4}" y2="{344+k*18}" stroke="#3a2614" stroke-width="2"/>')
    add(f'<g filter="url(#shadow)"><path d="M{WX0-22} 326 h{T+26} v108 h-{T+26} z M{WX0-10} 338 v84 h{T+2} v-84 z" fill="#5b5966" fill-rule="evenodd" filter="url(#stone)"/></g>')
    add(f'<path d="M{WX0-22} 326 q{(T+26)/2} -22 {T+26} 0" fill="#5b5966"/>')

def grid():
    lines = []
    for x in range(0, W + 1, CELL):
        lines.append(f'M{x} 0 V{H}')
    for y in range(0, H + 1, CELL):
        lines.append(f'M0 {y} H{W}')
    add(f'<path d="{" ".join(lines)}" stroke="#0b0b14" stroke-width="1" opacity="0.28" fill="none"/>')

def build():
    add(DEFS)
    snow()
    floor()
    add(f'<rect x="{FX0}" y="{FY0}" width="{FX1-FX0}" height="{FY1-FY0}" fill="#3a1f66" opacity="0.18"/>')
    for _ in range(14):
        x, y = rr(FX0, FX1), rr(FY0, FY1)
        add(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{rr(60,140):.0f}" ry="{rr(20,40):.0f}" fill="#8f6cff" opacity="0.06" style="filter: blur(14px)"/>')
    magic_circle(380, 380, 112, 7, 3)
    magic_circle(1020, 380, 112, 7, 3)
    magic_circle(700, 380, 172, 7, 2)
    # camas de cima e de baixo
    for x in (230, 350): bed(x, 92)
    for x in (770, 890, 1010): bed(x, 92)
    for x in (330, 450): bed(x, 518, flip=True)
    for x in (860, 980): bed(x, 518, flip=True)
    round_table(700, 380, 74)
    # cantos
    scrolls_shelf(128, 90, 92, 70); scrolls_shelf(140, 175, 60, 80)
    barrel(205, 115, 16)
    chest(132, 540, 70, 44, -18, open_=True); chest(150, 610, 64, 40, 8)
    barrel(205, 540, 15); barrel(230, 640, 15)
    drum(1230, 112, 28); drum(1185, 122, 22); drum(1250, 168, 20); drum(1190, 600, 22)
    lute(1218, 220, 35, 0.9); lute(1196, 252, 15, 0.8); lute(1240, 520, -40, 0.9)
    chest(1196, 610, 70, 44, -10, open_=True); barrel(1150, 640, 15)
    altar(1150, 300, 110, 150)
    brazier(590, 625); pedestal_scroll(810, 625)
    walls()
    doors()
    snowdrifts()
    # velas roxas nos pés das pilastras e nos cantos
    for (x, y) in [(310, 92), (550, 92), (850, 92), (1090, 92), (310, 668), (550, 668), (850, 668), (1090, 668),
                   (130, 250), (130, 510), (1270, 250), (1270, 510), (132, 92), (1268, 92), (132, 668), (1268, 668)]:
        candles(x, y, 3)
    # fantasmas
    ghost(640, 185, 1.25, 10); ghost(565, 255, 0.85, -25); ghost(255, 285, 1.1, 20)
    ghost(1185, 285, 1.0, -15); ghost(300, 575, 1.0, 35); ghost(1120, 505, 1.05, -40)
    grid()
    add(f'<rect width="{W}" height="{H}" fill="url(#vignette)"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">' + ''.join(out) + '</svg>'

if __name__ == '__main__':
    svg = build()
    dest = sys.argv[1]
    open(dest.rsplit('.', 1)[0] + '.svg', 'w').write(svg)
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=2)
        pg.set_content(f'<html><body style="margin:0">{svg}</body></html>')
        pg.wait_for_timeout(300)
        pg.screenshot(path=dest, clip={'x': 0, 'y': 0, 'width': W, 'height': H})
        b.close()
