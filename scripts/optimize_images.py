"""Build production image derivatives from the supplied originals.
Originals are read-only and live in Downloads; nothing is overwritten.
"""
from PIL import Image, ImageOps, ImageDraw, ImageFont
from pathlib import Path
import json

SRC = Path(r"C:\Users\ORAS Intern\Downloads")
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "images"
OUT.mkdir(parents=True, exist_ok=True)
(OUT / "photos").mkdir(exist_ok=True)
(OUT / "posters").mkdir(exist_ok=True)

# id -> (source filename, output name, widths, crop aspect (w/h) or None)
PHOTOS = {
    "table19":   ("a66fa455-ad10-43bb-a2c9-96c959af723c.jpg", "table-19", [480, 800, 1200], None),
    "hall":      ("3fcb7c6e-57cf-4ebd-b5ef-06ad56bf0d6b.jpg", "tournament-hall", [480, 800, 1200], None),
    "medals":    ("5c070c9d-7c3e-4db3-a0d7-a3b3f511b2a6.jpg", "three-medals", [480, 800, 1200], None),
    "champion":  ("52924d3e-ebc9-4382-8c3a-a4cc63c94dcd.jpg", "champion-medal", [480, 800, 1200], None),
    "gold":      ("55644f40-2f10-455e-92e6-e1d99ab5cc78.jpg", "medal-champion", [480, 800, 1200], None),
    "silver":    ("e7cafd39-b59d-4b69-89bc-6c3260b1e57a.jpg", "medal-second", [480, 800, 1200], None),
    "bronze":    ("39097b16-14c6-4d21-9e47-0a17d2a27790.jpg", "medal-third", [480, 800, 1200], None),
    "flatlay":   ("14c1c942-23ec-4581-9b8c-3699f0335dd2.jpg", "merch-flatlay", [480, 800, 1200], None),
    "medalist":  ("12ecbe4a-a70e-4423-ada3-fe8e98088060.jpg", "medalist", [480, 800, 1200], None),
    "merchheld": ("97954572-bc30-406c-83d8-38d2a5c6f5a6.jpg", "merch-in-hand", [480, 800, 1200], None),
    "crew":      ("d876ff22-ae53-4908-b302-b265bf6b5ba5.jpg", "chowking-crew", [480, 800, 1200], None),
    "selfie":    ("d8152276-6ef8-4318-9652-2410cdfc9654.jpg", "banner-selfie", [480, 800, 1200], None),
    "club":      ("7eb8c41b-fdec-4c57-915f-5725710ce8ee.jpg", "club-selfie", [480, 800, 1200], None),
    "hall2":     ("857444a9-ae15-4afc-90f5-0127d4c50d4f.jpg", "tournament-hall-2", [480, 800, 1200], None),
    "restaurant":("9011d057-d23e-462a-afaa-9334cc060411.jpg", "restaurant-group", [480, 800, 1200], None),
    "idcard":    ("66879aaa-0910-4add-8f7a-91e96c2312db.jpg", "member-id-selfie", [480, 800, 1200], None),
    "lanyard":   ("8d1a9c4d-52a4-47d5-81d1-7e20a5e57dfb.jpg", "lanyard-mockup", [480, 900], None),
    "jersey":    ("71872df2-e3a8-4674-a263-1cfc0eb72fd7.jpg", "club-jersey", [480, 800, 1200], None),
    "merchlife": ("c962c821-c428-4a1e-862d-926c773305c3.jpg", "merch-lifestyle", [480, 800], None),
}

POSTERS = {
    "t1":       ("767745ad-7cf5-476d-b85c-c739721d54ec.jpg", "tournament-1-0", [560, 900], None),
    "t2":       ("b1200d6e-1a7a-4254-89ea-bdf2099befa4.jpg", "tournament-2-0", [560, 900], None),
    "mario":    ("266a4f5c-3575-4d87-ab78-cea6c564fed5.jpg", "super-mario-cup", [560, 900], None),
    "weekly":   ("fa6dc7c9-6b2c-48be-b3fe-ca2519b1d1fc.jpg", "weekly-chess", [560, 900], None),
    "merch":    ("5a4d8f73-9107-4ae5-9db5-84e8a8a5636c.jpg", "merch-price-list", [560, 900], None),
    "sponsors": ("7569a681-69ba-4d78-b300-59e827530814.jpg", "partners-1-0", [560, 900], None),
    "program":  ("1ca3bb3f-b8c0-44fb-8284-cdfff717c142.jpg", "program-1-0", [640, 1000], None),
    "qr":       ("c4c90e7d-5cec-4529-bc08-7370d921109c.jpg", "community-qr", [480, 760], None),
    "rovers":   ("47e168d1-2072-42d6-b6e4-5b7df4b81366.jpg", "weekly-rovers", [560, 900], None),
    "top10open":("a943bad4-7e55-43c5-ac6c-dd43ea045cad.jpg", "top10-open", [560, 900], None),
    "top10kids":("c9e048a1-89fa-44e0-b4b1-1ffb7eeab5f5.jpg", "top10-kiddies", [560, 900], None),
}

HERO_SRC = "a66fa455-ad10-43bb-a2c9-96c959af723c.jpg"
LOGOSRC = "dc091ca1-0e95-4e90-a4ce-02d35d62889f.jpg"

manifest = {"photos": {}, "posters": {}, "hero": {}, "logo": {}}


def load(name):
    im = Image.open(SRC / name)
    im = ImageOps.exif_transpose(im).convert("RGB")
    return im


def resize_widths(im, widths, folder, stem, quality=82):
    made = []
    for w in widths:
        w = min(w, im.width)
        h = round(im.height * w / im.width)
        r = im.resize((w, h), Image.LANCZOS)
        path = folder / f"{stem}-{w}.webp"
        r.save(path, "WEBP", quality=quality, method=6)
        made.append({"w": w, "h": h, "path": "/" + path.relative_to(ROOT / "public").as_posix(),
                     "bytes": path.stat().st_size})
    return made


for key, (fn, stem, widths, _crop) in PHOTOS.items():
    im = load(fn)
    manifest["photos"][key] = {"source": fn, "width": im.width, "height": im.height,
                               "sizes": resize_widths(im, widths, OUT / "photos", stem)}

for key, (fn, stem, widths, _crop) in POSTERS.items():
    im = load(fn)
    manifest["posters"][key] = {"source": fn, "width": im.width, "height": im.height,
                                "sizes": resize_widths(im, widths, OUT / "posters", stem)}

# Hero: portrait original, responsive + JPEG fallback
hero = load(HERO_SRC)
manifest["hero"] = {"source": HERO_SRC, "width": hero.width, "height": hero.height,
                    "sizes": resize_widths(hero, [640, 960, 1280], OUT, "hero", 84)}
hero_jpg = hero.resize((1000, round(hero.height * 1000 / hero.width)), Image.LANCZOS)
hero_jpg.save(OUT / "hero.jpg", "JPEG", quality=84, optimize=True, progressive=True)

# Logo + icon
logo = load(LOGOSRC)
manifest["logo"] = {"source": LOGOSRC, "width": logo.width, "height": logo.height}
logo.resize((560, 560), Image.LANCZOS).save(OUT / "logo.webp", "WEBP", quality=90, method=6)
logo.resize((300, 300), Image.LANCZOS).save(OUT / "logo-300.png", "PNG", optimize=True)

# square, non-white bounding box for icon
gray = ImageOps.grayscale(logo)
bbox = ImageOps.invert(gray).point(lambda p: 255 if p > 12 else 0).getbbox()
emblem = logo.crop(bbox) if bbox else logo
side = max(emblem.size)
pad = int(side * 0.06)
icon = Image.new("RGB", (side + pad * 2, side + pad * 2), "#0a1533")
emblem.thumbnail((side, side), Image.LANCZOS)
icon.paste(emblem, ((icon.width - emblem.width) // 2, (icon.height - emblem.height) // 2))
icon = icon.resize((512, 512), Image.LANCZOS)
icon.save(OUT / "icon-512.png", "PNG", optimize=True)
icon.resize((192, 192), Image.LANCZOS).save(OUT / "icon-192.png", "PNG", optimize=True)
icon.resize((64, 64), Image.LANCZOS).save(OUT / "favicon-64.png", "PNG", optimize=True)
icon.resize((180, 180), Image.LANCZOS).save(OUT / "apple-touch-icon.png", "PNG", optimize=True)

# OG card 1200x630 — painted only in the three brand colours and their derivatives
og = Image.new("RGB", (1200, 630), "#0a1533")
d = ImageDraw.Draw(og)
# checkerboard band
sq = 30
for y in range(0, 630, sq):
    for x in range(0, 1200, sq):
        if (x // sq + y // sq) % 2 == 0:
            d.rectangle([x, y, x + sq, y + sq], fill="#16244c")
# logo on the right
badge = logo.resize((470, 470), Image.LANCZOS)
og.paste(badge, (700, 80))
try:
    display = ImageFont.truetype("C:/Windows/Fonts/ariblk.ttf", 92)
    small = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 30)
    body = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 26)
except Exception:
    display = small = body = None
d.text((70, 120), "CHESS", font=display, fill="#ffffff")
d.text((70, 212), "FOR", font=display, fill="#ffffff")
d.text((70, 304), "EVERYONE.", font=display, fill="#f7e42e")
d.text((74, 430), "SAN FERNANDO CITY  ·  LA UNION", font=small, fill="#4bbced")
d.text((74, 480), "Two weekly tables every Saturday  ·  from 10 AM", font=body, fill="#d7ecf7")
og.save(OUT / "og.jpg", "JPEG", quality=88, optimize=True, progressive=True)

(ROOT / "research" / "image-manifest.json").write_text(json.dumps(manifest, indent=2))
print(json.dumps({k: len(v.get("sizes", [])) for k, v in manifest.items()}, indent=2))
print("total photos:", sum(len(v["sizes"]) for v in manifest["photos"].values()))
print("total posters:", sum(len(v["sizes"]) for v in manifest["posters"].values()))
