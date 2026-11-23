"""Rebuild sponsor tiles from original artwork without clipping or stretching."""
from pathlib import Path
import json
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
manifest_path = ROOT / "research" / "image-manifest.json"
manifest = json.loads(manifest_path.read_text())
out = ROOT / "public" / "images" / "sponsors"
out.mkdir(parents=True, exist_ok=True)

for key, record in manifest["sponsors"].items():
    source = ROOT / "research" / "sponsors-raw" / record["source"]
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original).convert("RGBA")
        sizes = []
        for width in (600, 300):
            height = width * 3 // 4
            padding = round(width * .055)
            artwork = ImageOps.contain(image, (width - padding * 2, height - padding * 2), Image.Resampling.LANCZOS)
            tile = Image.new("RGB", (width, height), "white")
            tile.paste(artwork, ((width - artwork.width) // 2, (height - artwork.height) // 2), artwork)
            path = out / f"{key}-{width}.webp"
            tile.save(path, "WEBP", quality=90, method=6)
            sizes.append({"w": width, "h": height, "path": "/" + path.relative_to(ROOT / "public").as_posix(), "bytes": path.stat().st_size})
        record.update(width=600, height=450, sizes=sizes)

manifest_path.write_text(json.dumps(manifest, indent=2))
print(f"Rebuilt {len(manifest['sponsors'])} complete sponsor artworks at 600 and 300 pixels.")
