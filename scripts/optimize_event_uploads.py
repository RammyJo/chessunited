"""Rebuild the November 25 event posters and sponsor logos from their originals."""
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'research/uploads-2026-11-25'
OUT = ROOT / 'public/images/uploads'
assets = {}
for record in json.loads((SOURCE / 'manifest.json').read_text())['images']:
    source = SOURCE / 'raw' / record['filename']
    assert hashlib.sha256(source.read_bytes()).hexdigest() == record['sha']
    image = ImageOps.exif_transpose(Image.open(source)).convert('RGBA')
    variants = []
    for size in ((300, 600) if record['kind'] == 'logo' else (600, 1200)):
        if record['kind'] == 'logo':
            width, height = size, size * 3 // 4
            canvas = Image.new('RGBA', (width, height), 'white')
            fitted = ImageOps.contain(image, (int(width * .88), int(height * .88)), Image.Resampling.LANCZOS)
            canvas.alpha_composite(fitted, ((width - fitted.width) // 2, (height - fitted.height) // 2))
        else:
            width = min(size, image.width)
            height = round(width * image.height / image.width)
            canvas = image.resize((width, height), Image.Resampling.LANCZOS)
        name = f"{record['key']}-{record['sha'][:10]}-{width}.webp"
        canvas.convert('RGB').save(OUT / name, 'WEBP', quality=92, method=6)
        variants.append({'src': '/images/uploads/' + name, 'width': width, 'height': height})
    assets[record['key']] = {
        'src': variants[-1]['src'],
        'srcset': ', '.join(f"{v['src']} {v['width']}w" for v in {v['width']: v for v in variants}.values()),
        'width': variants[-1]['width'], 'height': variants[-1]['height'], 'alt': record['label'],
    }
(ROOT / 'src/data/november-25-images.json').write_text(json.dumps(assets, indent=2) + '\n')
print(f'Rebuilt {len(assets)} original-artwork asset sets.')
