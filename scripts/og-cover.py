"""Render scripts/og-cover.html to public/og-cover-<date>.png (1200x630, the size
every link preview - WhatsApp, LinkedIn, X, iMessage, Slack - expects).

    python scripts/og-cover.py      (needs playwright + chromium)

The HTML loads the site's Google Fonts, so the cover matches the page.
"""
import pathlib
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).resolve().parent.parent
src = (root / "scripts" / "og-cover.html").as_uri()
out = root / "public" / "og-cover-2026-09.png"   # versioned: share previews cache by URL

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1200, "height": 630}, device_scale_factor=1)
    pg.goto(src, wait_until="networkidle")
    pg.evaluate("document.fonts.ready")
    pg.wait_for_timeout(800)
    pg.screenshot(path=str(out), clip={"x": 0, "y": 0, "width": 1200, "height": 630})
    b.close()
print(f"wrote {out} ({out.stat().st_size // 1024} KB)")
