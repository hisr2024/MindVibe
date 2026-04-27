"""Generate placeholder icon assets for Sakha Voice Companion.

Creates 5 PNGs at the spec'd dimensions so EAS prebuild succeeds.
Visual: a stylized white Shankha (conch) silhouette over the canonical
COSMIC_VOID + DIVINE_GOLD palette. Real branding can be dropped in
later by swapping the files at assets/shankha/<name>.png — the config
paths don't change.
"""
from PIL import Image, ImageDraw
from pathlib import Path

OUT = Path(__file__).parent.parent / "kiaanverse-mobile/apps/sakha-mobile/assets/shankha"
OUT.mkdir(parents=True, exist_ok=True)

COSMIC_VOID = (5, 7, 20, 255)   # #050714
DIVINE_GOLD = (212, 160, 23, 255)  # #D4A017
SHANKHA_CREAM = (250, 245, 235, 255)
TRANSPARENT = (0, 0, 0, 0)


def draw_shankha(draw: ImageDraw.ImageDraw, cx: int, cy: int, size: int, fill):
    """Draw a stylized conch-like silhouette centered at (cx, cy)."""
    # Outer spiral body — a teardrop ellipse
    r = size
    draw.ellipse([cx - r, cy - int(r * 1.1), cx + r, cy + int(r * 0.9)], fill=fill)
    # Pointy tip at top — a triangle
    draw.polygon(
        [
            (cx - int(r * 0.5), cy - int(r * 0.9)),
            (cx + int(r * 0.5), cy - int(r * 0.9)),
            (cx, cy - int(r * 1.6)),
        ],
        fill=fill,
    )
    # Concentric rings — inner spiral hint
    inner = int(r * 0.6)
    draw.ellipse([cx - inner, cy - inner, cx + inner, cy + inner], fill=COSMIC_VOID)
    inner2 = int(r * 0.35)
    draw.ellipse([cx - inner2, cy - inner2, cx + inner2, cy + inner2], fill=fill)


def gold_dot_border(img: Image.Image, n_dots: int = 24, dot_r: int = 6):
    """Add a sparse gold-dot border around the canvas (cosmic stars hint)."""
    draw = ImageDraw.Draw(img)
    w, h = img.size
    margin = w // 16
    import math
    cx, cy = w // 2, h // 2
    rad = (w // 2) - margin
    for i in range(n_dots):
        a = 2 * math.pi * i / n_dots
        x = int(cx + rad * math.cos(a))
        y = int(cy + rad * math.sin(a))
        draw.ellipse([x - dot_r, y - dot_r, x + dot_r, y + dot_r], fill=DIVINE_GOLD)


# ── icon.png — 1024x1024 ──
img = Image.new("RGBA", (1024, 1024), COSMIC_VOID)
draw = ImageDraw.Draw(img)
draw_shankha(draw, 512, 540, 320, SHANKHA_CREAM)
gold_dot_border(img)
img.save(OUT / "icon.png")
print(f"  wrote {OUT / 'icon.png'}")

# ── splash.png — 2048x2048 (Expo will scale) ──
img = Image.new("RGBA", (2048, 2048), COSMIC_VOID)
draw = ImageDraw.Draw(img)
draw_shankha(draw, 1024, 1024, 380, SHANKHA_CREAM)
img.save(OUT / "splash.png")
print(f"  wrote {OUT / 'splash.png'}")

# ── adaptive-icon-foreground.png — 1024x1024, transparent bg + 432px safe zone ──
img = Image.new("RGBA", (1024, 1024), TRANSPARENT)
draw = ImageDraw.Draw(img)
draw_shankha(draw, 512, 540, 240, SHANKHA_CREAM)  # smaller — safe zone
img.save(OUT / "adaptive-icon-foreground.png")
print(f"  wrote {OUT / 'adaptive-icon-foreground.png'}")

# ── adaptive-icon-background.png — 1024x1024, solid cosmic void ──
img = Image.new("RGBA", (1024, 1024), COSMIC_VOID)
img.save(OUT / "adaptive-icon-background.png")
print(f"  wrote {OUT / 'adaptive-icon-background.png'}")

# ── notification-icon.png — 96x96, white silhouette only ──
img = Image.new("RGBA", (96, 96), TRANSPARENT)
draw = ImageDraw.Draw(img)
draw_shankha(draw, 48, 50, 30, (255, 255, 255, 255))
img.save(OUT / "notification-icon.png")
print(f"  wrote {OUT / 'notification-icon.png'}")

print("\nDone. 5 placeholder assets generated.")
