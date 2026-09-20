"""Branded hero billboards for the 3D screens: logo + one line on the left,
the product on the right. 1600x1008 = the panel's landscape ratio (w*0.63).

    python scripts/heroes.py      (needs Pillow; writes public/shots/hero-*.webp)

Logos are read from the source repos on this machine (CompKit website,
D:/hgv-parking, D:/Dev/SailsCardsTRG, D:/clippd); the screenshots come from
public/shots. Re-run after swapping any of those."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1600, 1008
OUT = r"C:\Users\info\Desktop\KrisCreates Portfolio\portfolio\public\shots"
FONTS = r"C:\Windows\Fonts"
BOLD = FONTS + r"\segoeuib.ttf"
SEMI = FONTS + r"\seguisb.ttf"
REG = FONTS + r"\segoeui.ttf"


def font(path, size):
    return ImageFont.truetype(path, size)


def glow_bg(base, glow, at, radius=520):
    im = Image.new("RGB", (W, H), base)
    g = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(g)
    x, y = at
    d.ellipse((x - radius, y - radius, x + radius, y + radius), fill=glow + (150,))
    g = g.filter(ImageFilter.GaussianBlur(220))
    im.paste(g, (0, 0), g)
    return im


def rounded(im, r):
    m = Image.new("L", im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, im.width - 1, im.height - 1), r, fill=255)
    out = im.convert("RGBA")
    out.putalpha(m)
    return out


def shadow(canvas, box, blur=40, alpha=140):
    s = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(s).rounded_rectangle(box, 28, fill=(0, 0, 0, alpha))
    s = s.filter(ImageFilter.GaussianBlur(blur))
    canvas.alpha_composite(s)


def fit(im, w=None, h=None):
    im = im.convert("RGBA")
    if w and not h:
        h = round(im.height * w / im.width)
    elif h and not w:
        w = round(im.width * h / im.height)
    return im.resize((w, h), Image.LANCZOS)


def wrap(draw, text, f, maxw):
    words, lines, cur = text.split(), [], ""
    for wd in words:
        t = (cur + " " + wd).strip()
        if draw.textlength(t, font=f) <= maxw:
            cur = t
        else:
            lines.append(cur)
            cur = wd
    lines.append(cur)
    return lines


def text_block(canvas, x, y, title, sub, tcol, scol, tsize=64, ssize=30, maxw=560):
    d = ImageDraw.Draw(canvas)
    ft, fs = font(BOLD, tsize), font(REG, ssize)
    for ln in wrap(d, title, ft, maxw):
        d.text((x, y), ln, font=ft, fill=tcol)
        y += tsize * 1.12
    y += 14
    for ln in wrap(d, sub, fs, maxw):
        d.text((x, y), ln, font=fs, fill=scol)
        y += ssize * 1.4
    return y


def phone(canvas, path, x, y, h, angle=0):
    im = rounded(fit(Image.open(path), h=h), 36)
    if angle:
        im = im.rotate(angle, expand=True, resample=Image.BICUBIC)
    shadow(canvas, (x + 10, y + 30, x + im.width - 10, y + im.height + 10))
    canvas.alpha_composite(im, (x, y))
    return im.width, im.height


def screen(canvas, path, x, y, w):
    im = rounded(fit(Image.open(path), w=w), 22)
    shadow(canvas, (x + 10, y + 30, x + im.width - 10, y + im.height + 10))
    canvas.alpha_composite(im, (x, y))


# ---------------- CompKit ----------------
c = glow_bg((4, 7, 5), (147, 240, 37), (1250, 800), 560).convert("RGBA")
logo = fit(Image.open(r"C:\Users\info\Desktop\CompKit Website\assets\images\compkit-logo.png"), w=420)
c.alpha_composite(logo, (80, 150))
text_block(c, 90, 430, "Instant-win games on the order page",
           "Eight HTML5 canvas games for WooCommerce, licensed per module and served from my own licence server.",
           (232, 240, 232), (150, 165, 150), tsize=56, maxw=520)
screen(c, OUT + r"\compkit-scratchcard-play-black-gold.webp", 660, 90, 1120)
c = c.crop((0, 0, W, H))
c.convert("RGB").save(OUT + r"\hero-compkit.webp", quality=86)

# ---------------- Truck It Lets Park ----------------
c = glow_bg((9, 9, 11), (124, 58, 237), (1200, 300), 600).convert("RGBA")
badge = rounded(fit(Image.open(r"D:\hgv-parking\app\assets\icon.png"), w=250), 56)
c.alpha_composite(badge, (90, 110))
text_block(c, 90, 400, "Free overnight HGV parking, mapped",
           "4,581 stops built from OpenStreetMap, route planning with arrival times, and what other drivers found when they stopped.",
           (240, 238, 248), (160, 155, 185), tsize=56, maxw=560)
phone(c, OUT + r"\truckit-filters.webp", 1160, 150, 820, angle=-6)
phone(c, OUT + r"\truckit-route-map.webp", 780, 90, 860)
c = c.crop((0, 0, W, H))
c.convert("RGB").save(OUT + r"\hero-truckit.webp", quality=86)

# ---------------- Pokellectr ----------------
c = Image.new("RGBA", (W, H), (255, 216, 77, 255))
d = ImageDraw.Draw(c)
# faint tilted card shapes like the feature graphic
for (x, y, a) in [(-120, 560, 18), (300, -160, -12), (620, 700, 22)]:
    card = Image.new("RGBA", (300, 420), (255, 228, 120, 255))
    card = rounded(card, 40).rotate(a, expand=True, resample=Image.BICUBIC)
    c.alpha_composite(card, (x, y))
fg = Image.open(r"D:\Dev\SailsCardsTRG\store\feature-graphic.png").convert("RGBA")
mark = fit(fg.crop((140, 150, 345, 345)), w=190)            # the card mark
c.alpha_composite(mark, (90, 120))
BRIC = "D:/Dev/SailsCardsTRG/node_modules/@expo-google-fonts/bricolage-grotesque/700Bold/BricolageGrotesque_700Bold.ttf"
fb = font(BRIC, 118)
d = ImageDraw.Draw(c)
navy, gold = (0x17, 0x20, 0x33), (0xF5, 0xB3, 0x2E)  # theme.ts palette.navy / yellowDeep
x0, y0 = 88, 330
d.text((x0, y0), "Poké", font=fb, fill=navy)
x0 += d.textlength("Poké", font=fb)
d.text((x0, y0), "ll", font=fb, fill=gold)
x0 += d.textlength("ll", font=fb)
d.text((x0, y0), "ectr", font=fb, fill=navy)
text_block(c, 92, 500, "Point. Scan. It's in your binder.",
           "Identifies the exact printing offline, prices it, grades the centring, and keeps score while you rip the box.",
           (17, 24, 39), (90, 80, 40), tsize=50, maxw=560)
phone(c, OUT + r"\pokellectr-packs.webp", 1120, 170, 760, angle=-6)
phone(c, OUT + r"\pokellectr-scan.webp", 770, 110, 820)
c = c.crop((0, 0, W, H))
c.convert("RGB").save(OUT + r"\hero-pokellectr.webp", quality=86)

# ---------------- ClippD ----------------
c = glow_bg((8, 10, 18), (56, 140, 255), (1250, 850), 560).convert("RGBA")
icon = rounded(fit(Image.open(r"D:\clippd\site\icon-256.png"), w=120), 30)
c.alpha_composite(icon, (90, 150))
d = ImageDraw.Draw(c)
fw = font(BOLD, 78)
d.text((232, 158), "Clipp", font=fw, fill=(240, 244, 255))
d.text((232 + d.textlength("Clipp", font=fw), 158), "D", font=fw, fill=(96, 165, 250))
text_block(c, 90, 320, "Long podcasts in. Published shorts out.",
           "Scores every moment, cuts it vertical with word-timed captions, and schedules it across every account you own.",
           (232, 236, 248), (140, 150, 180), tsize=56, maxw=540)
screen(c, OUT + r"\clippd-clips.webp", 680, 90, 1100)
c = c.crop((0, 0, W, H))
c.convert("RGB").save(OUT + r"\hero-clippd.webp", quality=86)
print("ok")
