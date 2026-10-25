"""Crop the Messenger QR out of the club's QR poster.

The full poster is 760x964 and the code itself is only about 380px wide. At the
150px display size used on the Visit page that left the code too small to scan
comfortably, so this script extracts it with a clean quiet zone and saves a
square WebP. Re-run after replacing the source poster.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "images" / "posters" / "community-qr-760.webp"
OUT = ROOT / "public" / "images" / "posters" / "community-qr-code.webp"

# Bounding box of the code in the 760x964 poster, plus a white quiet zone.
BOX = (160, 394, 622, 844)
PAD = 40
SIZE = 480

image = Image.open(SRC).convert("RGB")
crop = image.crop(BOX)
side = max(crop.size) + PAD * 2
canvas = Image.new("RGB", (side, side), "white")
canvas.paste(crop, ((side - crop.width) // 2, (side - crop.height) // 2))
canvas = canvas.resize((SIZE, SIZE), Image.LANCZOS)
canvas.save(OUT, "WEBP", quality=95, method=6)

print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size:,} bytes, {SIZE}x{SIZE})")
