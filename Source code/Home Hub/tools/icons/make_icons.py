"""Draws the tab icons that aren't hand-made (generic smart home, ad blocker,
web page, router) in the same rounded-square style as the others.
Run: python3 tools/icons/make_icons.py   (needs Pillow). Writes into assets/."""
import math, os
from PIL import Image, ImageDraw, ImageFilter

S = 1024
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "assets")

def base(top, bottom):
    g = Image.new("RGBA", (S, S))
    d = ImageDraw.Draw(g)
    for y in range(S):
        t = y / (S - 1)
        d.line([(0, y), (S, y)], fill=tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)) + (255,))
    m = Image.new("L", (S, S), 0)
    ImageDraw.Draw(m).rounded_rectangle([40, 40, S - 40, S - 40], radius=200, fill=255)
    out = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    out.paste(g, (0, 0), m)
    return out

W = (255, 255, 255, 255)

def save(img, name):
    img.resize((512, 512), Image.LANCZOS).save(os.path.join(OUT, name))

def smarthome():
    im = base((255, 167, 38), (239, 108, 0))
    d = ImageDraw.Draw(im)
    d.polygon([(512, 190), (830, 470), (760, 470), (760, 810), (264, 810), (264, 470), (194, 470)], fill=W)
    c = (245, 124, 0, 255)
    # light bulb inside the house
    d.ellipse([422, 450, 602, 630], fill=c)
    d.rectangle([462, 610, 562, 690], fill=c)
    d.rounded_rectangle([462, 700, 562, 730], radius=12, fill=c)
    return im

def adblock():
    im = base((38, 166, 154), (0, 121, 107))
    d = ImageDraw.Draw(im)
    d.polygon([(512, 170), (800, 270), (780, 560), (512, 850), (244, 560), (224, 270)], fill=W)
    c = (0, 137, 123, 255)
    d.ellipse([372, 360, 652, 640], outline=c, width=56)
    d.line([(410, 600), (614, 400)], fill=c, width=56)
    return im

def web():
    im = base((92, 107, 192), (57, 73, 171))
    d = ImageDraw.Draw(im)
    cx, cy, r = 512, 512, 300
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=W, width=48)
    d.ellipse([cx - 130, cy - r, cx + 130, cy + r], outline=W, width=40)
    d.line([(cx, cy - r), (cx, cy + r)], fill=W, width=40)
    d.line([(cx - r, cy), (cx + r, cy)], fill=W, width=40)
    for dy in (-150, 150):
        w = math.sqrt(r * r - dy * dy)
        d.line([(cx - w + 20, cy + dy), (cx + w - 20, cy + dy)], fill=W, width=34)
    return im

def router():
    im = base((66, 165, 245), (30, 110, 220))
    d = ImageDraw.Draw(im)
    for x in (300, 512, 724):
        d.rounded_rectangle([x - 28, 250, x + 28, 600], radius=28, fill=W)
    d.rounded_rectangle([200, 560, 824, 760], radius=60, fill=W)
    c = (40, 120, 225, 255)
    for x in (330, 430, 530):
        d.ellipse([x - 27, 633, x + 27, 687], fill=c)
    return im

if __name__ == "__main__":
    save(smarthome(), "smarthome.png")
    save(adblock(), "adblock.png")
    save(web(), "web.png")
    save(router(), "glrouter.png")
