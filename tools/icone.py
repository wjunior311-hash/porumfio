"""Gera os ícones do app (d20 dourado amarrado por um fio vermelho)."""
import sys
from playwright.sync_api import sync_playwright

def svg(pad):
    s = 512; c = s / 2; r = (s / 2 - pad) * 0.62
    import math
    hexa = [(c + r * math.cos(math.radians(90 + 60 * i)), c - r * math.sin(math.radians(90 + 60 * i))) for i in range(6)]
    P = ' '.join(f'{x:.1f},{y:.1f}' for x, y in hexa)
    top, ul, ll, bot, lr, ur = hexa
    tri = [(c, c - r * 0.52), (c - r * 0.45, c + r * 0.26), (c + r * 0.45, c + r * 0.26)]
    T = ' '.join(f'{x:.1f},{y:.1f}' for x, y in tri)
    lines = ''.join(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}"/>' for a, b in [
        (top, tri[0]), (ul, tri[0]), (ul, tri[1]), (ll, tri[1]), (bot, tri[1]), (bot, tri[2]), (lr, tri[2]), (ur, tri[2]), (ur, tri[0])])
    k = (s / 2 - pad) / 256
    thread = (f'M{c - 250*k:.1f} {c + 120*k:.1f} C {c - 150*k:.1f} {c + 60*k:.1f}, {c - 120*k:.1f} {c - 40*k:.1f}, {c - 40*k:.1f} {c - 20*k:.1f} '
              f'S {c + 120*k:.1f} {c + 110*k:.1f}, {c + 60*k:.1f} {c + 150*k:.1f} S {c - 70*k:.1f} {c + 60*k:.1f}, {c + 40*k:.1f} {c - 30*k:.1f} '
              f'S {c + 170*k:.1f} {c - 140*k:.1f}, {c + 250*k:.1f} {c - 170*k:.1f}')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{s}" height="{s}" viewBox="0 0 {s} {s}">
<rect width="{s}" height="{s}" fill="#15111a"/>
<circle cx="{c}" cy="{c}" r="{r*1.25:.1f}" fill="#2a1d33"/>
<g fill="none" stroke="#e5c06a" stroke-width="{10*k:.1f}" stroke-linejoin="round" stroke-linecap="round">
<polygon points="{P}" fill="#241a2b"/><polygon points="{T}"/>{lines}</g>
<path d="{thread}" fill="none" stroke="#e5584b" stroke-width="{13*k:.1f}" stroke-linecap="round"/>
</svg>'''

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 512, 'height': 512})
    for name, pad, size in [('icon-512', 40, 512), ('icon-192', 40, 192), ('icon-maskable-512', 110, 512), ('apple-touch-icon', 60, 180)]:
        pg.set_content(f'<html><body style="margin:0">{svg(pad)}</body></html>')
        pg.screenshot(path=f'icons/{name}.png', clip={'x': 0, 'y': 0, 'width': 512, 'height': 512})
        if size != 512:
            from PIL import Image
            Image.open(f'icons/{name}.png').resize((size, size), Image.LANCZOS).save(f'icons/{name}.png')
    b.close()
