"""App icons and favicon from the KrisCreates mark, on the site's black.

    python scripts/icons.py      (needs Pillow)

Source is the transparent mark in public/logo-mark-src.png. Every output is
opaque #030404 so home-screen tiles match the site instead of getting the
OS's white or grey behind a transparent PNG. The 512 keeps the mark inside
the 80% maskable safe zone so Android's circle/squircle masks never clip it.
"""
import pathlib
from PIL import Image, ImageFilter

root = pathlib.Path(__file__).resolve().parent.parent / "public"
BG = (3, 4, 4, 255)
mark = Image.open(root / "logo-mark-src.png").convert("RGBA")
mark = mark.crop(mark.getbbox())


def make(size, mark_frac, glow=True):
    im = Image.new("RGBA", (size, size), BG)
    m = mark.copy()
    m.thumbnail((round(size * mark_frac), round(size * mark_frac)), Image.LANCZOS)
    pos = ((size - m.width) // 2, (size - m.height) // 2)
    if glow and size >= 128:
        g = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        tint = Image.new("RGBA", m.size, (147, 240, 37, 110))
        g.paste(tint, pos, m)
        g = g.filter(ImageFilter.GaussianBlur(size * 0.06))
        im.alpha_composite(g)
    im.alpha_composite(m, pos)
    return im


make(512, 0.62).save(root / "icon-512.png", optimize=True)
make(192, 0.66).save(root / "icon-192.png", optimize=True)
make(180, 0.70).save(root / "apple-touch-icon.png", optimize=True)
make(32, 0.86, glow=False).save(root / "favicon-32.png", optimize=True)
print("icons written")
