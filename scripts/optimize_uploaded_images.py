"""Build web assets from the visually reviewed November 24 original uploads."""
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'research/uploads-2026-11-24'
OUT = ROOT / 'public/images/uploads'
OUT.mkdir(parents=True, exist_ok=True)
assets = {}
for record in json.loads((SOURCE / 'manifest.json').read_text())['images']:
    if record['usage'] != 'published':
        continue
    original = SOURCE / 'raw' / record['filename']
    assert hashlib.sha256(original.read_bytes()).hexdigest() == record['sha']
    image = ImageOps.exif_transpose(Image.open(original)).convert('RGBA')
    variants = []
    widths = (300, 600) if record['kind'] == 'logo' else (450, 1000)
    for requested in widths:
        if record['kind'] == 'logo':
            width, height = requested, requested * 3 // 4
            tile = Image.new('RGBA', (width, height), 'white')
            fit = ImageOps.contain(image, (int(width * .88), int(height * .88)), Image.Resampling.LANCZOS)
            tile.alpha_composite(fit, ((width - fit.width) // 2, (height - fit.height) // 2))
        else:
            width = min(requested, image.width)
            height = round(width * image.height / image.width)
            tile = Image.new('RGBA', (width, height), 'white')
            tile.alpha_composite(image.resize((width, height), Image.Resampling.LANCZOS))
        filename = f"{record['key']}-{record['sha'][:10]}-{width}.webp"
        tile.convert('RGB').save(OUT / filename, 'WEBP', quality=90, method=6)
        variants.append({'src': f'/images/uploads/{filename}', 'width': width, 'height': height})
    assets[record['key']] = {
        'src': variants[-1]['src'],
        'srcset': ', '.join(f"{v['src']} {v['width']}w" for v in {v['width']: v for v in variants}.values()),
        'width': variants[-1]['width'], 'height': variants[-1]['height'],
        'alt': record['label'],
    }
(ROOT / 'src/data/uploaded-images.json').write_text(json.dumps(assets, indent=2) + '\n')
print(f'Built {len(assets)} original-artwork asset sets.')
