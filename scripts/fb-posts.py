"""Render each card in scripts/fb-posts.html to a Facebook-ready JPG.

    python scripts/fb-posts.py      (needs playwright + chromium)

Writes ../Facebook/posts/NN-slug.jpg at 1080x1080. JPG because Facebook will
not accept the .webp files the portfolio uses, and square because that is what
fills a phone feed.

It also exports the raw project screenshots to ../Facebook/posts/raw/ as JPGs,
for the times a plain screenshot says more than a designed card.
"""
import pathlib
from PIL import Image
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).resolve().parent.parent
out = root.parent / "Facebook" / "posts"
raw = out / "raw"
out.mkdir(parents=True, exist_ok=True)
raw.mkdir(exist_ok=True)

CARDS = {
    "p01": "01-intro",
    "p02": "02-compkit-email",
    "p03": "03-compkit-themes",
    "p04": "04-truckit-dataset",
    "p05": "05-truckit-honesty",
    "p06": "06-pokellectr-ocr",
    "p07": "07-pokellectr-grading",
    "p08": "08-clippd-pipeline",
    "p09": "09-clippd-whop",
    "p10": "10-hire-me",
    "p11": "11-pokellectr-launch",
}

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1120, "height": 1200}, device_scale_factor=1)
    pg.goto((root / "scripts" / "fb-posts.html").as_uri(), wait_until="networkidle")
    pg.evaluate("document.fonts.ready")
    pg.wait_for_timeout(1200)
    for el_id, slug in CARDS.items():
        png = out / f"{slug}.png"
        pg.locator(f"#{el_id}").screenshot(path=str(png))
        Image.open(png).convert("RGB").save(out / f"{slug}.jpg", quality=92, optimize=True)
        png.unlink()
        print("card", slug)
    b.close()

# plain screenshots, converted for Facebook
for src in sorted((root / "public" / "shots").glob("*.webp")):
    if src.stem.startswith("hero-"):
        continue
    Image.open(src).convert("RGB").save(raw / f"{src.stem}.jpg", quality=90, optimize=True)
print("wrote", out)
