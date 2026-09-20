"""Facebook Page assets for the portfolio, in the site's own look.

    python scripts/social.py      (needs Pillow + playwright)

Writes to  ..\Facebook\  (next to the portfolio repo, not inside it):
  fb-profile.png   1024x1024, the mark on the site's black, framed for the circle crop
  fb-cover.png     1640x624 from scripts/fb-cover.html (site fonts via Google Fonts)
  fb-cover-mobile-preview.png   the centre crop a phone shows, for checking
  linkedin-banner.png   1584x396 from scripts/linkedin-banner.html
"""
import pathlib
from PIL import Image, ImageDraw, ImageFilter
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).resolve().parent.parent
out = root.parent / "Facebook"
out.mkdir(exist_ok=True)
BG = (3, 4, 4, 255)

# ---- profile picture: the mark inside the circle Facebook will cut -------------
size = 1024
im = Image.new("RGBA", (size, size), BG)
mark = Image.open(root / "public" / "logo-mark-src.png").convert("RGBA")
mark = mark.crop(mark.getbbox())
mark.thumbnail((int(size * 0.56), int(size * 0.56)), Image.LANCZOS)
pos = ((size - mark.width) // 2, (size - mark.height) // 2)
glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
glow.paste(Image.new("RGBA", mark.size, (147, 240, 37, 120)), pos, mark)
glow = glow.filter(ImageFilter.GaussianBlur(size * 0.07))
im.alpha_composite(glow)
im.alpha_composite(mark, pos)
# faint ring just inside the circle edge so the crop reads as deliberate
ring = Image.new("RGBA", (size, size), (0, 0, 0, 0))
ImageDraw.Draw(ring).ellipse((14, 14, size - 14, size - 14), outline=(147, 240, 37, 70), width=6)
im.alpha_composite(ring)
im.convert("RGB").save(out / "fb-profile.png", optimize=True)

# ---- cover -----------------------------------------------------------------------
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1640, "height": 624}, device_scale_factor=1)
    pg.goto((root / "scripts" / "fb-cover.html").as_uri(), wait_until="networkidle")
    pg.evaluate("document.fonts.ready")
    pg.wait_for_timeout(800)
    pg.screenshot(path=str(out / "fb-cover.png"), clip={"x": 0, "y": 0, "width": 1640, "height": 624})
    # LinkedIn personal banner
    pg2 = b.new_page(viewport={"width": 1584, "height": 396}, device_scale_factor=1)
    pg2.goto((root / "scripts" / "linkedin-banner.html").as_uri(), wait_until="networkidle")
    pg2.evaluate("document.fonts.ready")
    pg2.wait_for_timeout(800)
    pg2.screenshot(path=str(out / "linkedin-banner.png"), clip={"x": 0, "y": 0, "width": 1584, "height": 396})
    b.close()

# what a phone shows: 640x360 aspect from the centre
cover = Image.open(out / "fb-cover.png")
mw = round(624 * 640 / 360)
cover.crop(((1640 - mw) // 2, 0, (1640 - mw) // 2 + mw, 624)).save(out / "fb-cover-mobile-preview.png")
print("wrote", out)
