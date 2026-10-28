# Asset inventory

Status: **VERIFIED** — every supplied source file is accounted for, and every
displayed image was checked against its source and alt text.

The club supplied **27 JPEGs** on 2026-10-23 (file times 10:45–11:00), a further
**8 files** on 2026-10-26 (5 new sources, 3 repeats of earlier files) and **4 more**
later the same day (jersey artwork, a merchandise lifestyle photo, a higher-resolution
lanyard file and a replacement Tournament 2.0 poster). The second lanyard file and the
first Tournament 2.0 poster supersede the versions from the earlier batch. They all
remain untouched in the operator's `Downloads` folder.
Optimized derivatives live in `public/images`; the source-to-output map is also
machine-readable in `research/image-manifest.json`.

## Summary

| Class | Sources | Derivatives | Role |
| --- | ---: | ---: | --- |
| Photographs | 19 | 55 WebP | Real club, tournament and merch photography |
| Posters / graphics | 11 | 22 WebP + 1 cropped QR | Schedule, events, results, merch, partners, QR |
| Logo / brand | 1 | 7 files | Logo, app icons, favicon, OG card |
| Hero | 1 (reuses photo) | 3 WebP + 1 JPEG | Home-page portrait crop |
| **Displayed sources** | **30** | — | 19 photos + 10 poster sources + logo |
| Source-only, not displayed | 1 | 2 WebP | T1 program poster |
| Unused | 3 | 0 | 2 personal-brand posters, 1 Messenger invite screenshot |
| Superseded this batch | 2 | 0 | First (626 px) lanyard file, first Tournament 2.0 poster |

No stock photography, generated imagery, tracking pixels or third-party image
CDNs are used. The only generated raster is `og.jpg` (a branded social card made
from the supplied logo).

## Photography

Photographs are resized proportionally; no content is removed. Each has
480/800/1200 px WebP variants, except the banner selfie (480/800/1080), the
merchandise lifestyle shot (480/800) and the lanyard artwork, whose 2048 px-tall
source is served at 480/900. `alt` text and captions live in `src/data/images.ts`.

| Key | Source file | Source px / bytes | Outputs (WebP, bytes) | Used on |
| --- | --- | --- | --- | --- |
| `table19` | `a66fa455-ad10-43bb-a2c9-96c959af723c.jpg` | 1536×2048 / 203,590 | `table-19-480/800/1200` — 55,380 / 108,976 / 182,980 | Hero source, home gallery, gallery |
| `hall` | `3fcb7c6e-57cf-4ebd-b5ef-06ad56bf0d6b.jpg` | 1536×2048 / 188,204 | `tournament-hall-480/800/1200` — 48,640 / 97,202 / 171,958 | Play, home gallery, gallery |
| `medals` | `5c070c9d-7c3e-4db3-a0d7-a3b3f511b2a6.jpg` | 1536×2048 / 258,476 | `three-medals-480/800/1200` — 61,994 / 153,398 / 284,798 | Events T1 recap, home gallery, gallery |
| `champion` | `52924d3e-ebc9-4382-8c3a-a4cc63c94dcd.jpg` | 1536×1024 / 169,931 | `champion-medal-480/800/1200` — 39,992 / 90,122 / 171,074 | Gallery |
| `gold` | `55644f40-2f10-455e-92e6-e1d99ab5cc78.jpg` | 2048×1536 / 232,062 | `medal-champion-480/800/1200` — 36,726 / 85,862 / 165,342 | Gallery (champion, Open) |
| `silver` | `e7cafd39-b59d-4b69-89bc-6c3260b1e57a.jpg` | 2048×1536 / 210,331 | `medal-second-480/800/1200` — 33,472 / 80,980 / 152,532 | Gallery (2nd, Kiddies) |
| `bronze` | `39097b16-14c6-4d21-9e47-0a17d2a27790.jpg` | 2048×1536 / 136,113 | `medal-third-480/800/1200` — 25,742 / 49,658 / 81,760 | Gallery (3rd, Open) |
| `flatlay` | `14c1c942-23ec-4581-9b8c-3699f0335dd2.jpg` | 1536×2048 / 141,239 | `merch-flatlay-480/800/1200` — 38,136 / 75,452 / 122,672 | Home merch block, home gallery, gallery |
| `medalist` | `12ecbe4a-a70e-4423-ada3-fe8e98088060.jpg` | 2048×1536 / 174,515 | `medalist-480/800/1200` — 31,912 / 63,062 / 105,418 | About, events T1 recap, home gallery, gallery |
| `merchheld` | `97954572-bc30-406c-83d8-38d2a5c6f5a6.jpg` | 1536×2048 / 128,282 | `merch-in-hand-480/800/1200` — 33,766 / 62,504 / 101,114 | Gallery |
| `crew` | `d876ff22-ae53-4908-b302-b265bf6b5ba5.jpg` | 2048×1536 / 226,724 | `chowking-crew-480/800/1200` — 36,948 / 78,962 / 139,100 | Gallery (club life) |
| `selfie` | `d8152276-6ef8-4318-9652-2410cdfc9654.jpg` | 1080×810 / 40,687 | `banner-selfie-480/800/1080` — 16,712 / 30,184 / 43,364 | Gallery |
| `club` | `7eb8c41b-fdec-4c57-915f-5725710ce8ee.jpg` | 2048×1536 / 137,801 | `club-selfie-480/800/1200` — 26,668 / 50,000 / 79,448 | Gallery (club life) |
| `hall2` | `857444a9-ae15-4afc-90f5-0127d4c50d4f.jpg` | 2048×1536 / 235,101 | `tournament-hall-2-480/800/1200` — 42,670 / 89,520 / 155,412 | Home gallery, gallery |
| `restaurant` | `9011d057-d23e-462a-afaa-9334cc060411.jpg` | 1536×2048 / 188,819 | `restaurant-group-480/800/1200` — 51,258 / 99,102 / 165,226 | Gallery (club life) |
| `idcard` | `66879aaa-0910-4add-8f7a-91e96c2312db.jpg` | 2048×1536 / 190,223 | `member-id-selfie-480/800/1200` — 36,774 / 73,574 / 120,652 | Gallery (club life) |
| `lanyard` | `8d1a9c4d-52a4-47d5-81d1-7e20a5e57dfb.jpg` | 900×2048 / 62,727 | `lanyard-mockup-480/900` — 27,516 / 58,952 | Merchandise, ID kit block |
| `jersey` | `71872df2-e3a8-4674-a263-1cfc0eb72fd7.jpg` | 1446×672 / 29,890 | `club-jersey-480/800/1200` — 7,038 / 13,286 / 22,600 | Merchandise — club jersey section |
| `merchlife` | `c962c821-c428-4a1e-862d-926c773305c3.jpg` | 1448×2047 / 281,377 | `merch-lifestyle-480/800` — 85,660 / 209,860 | Merchandise — featured worn-merch section |

Hero derivatives from `table19`:

| File | Pixels | Bytes |
| --- | --- | ---: |
| `/images/hero-640.webp` | 640×853 | 89,636 |
| `/images/hero-960.webp` | 960×1280 | 149,740 |
| `/images/hero-1280.webp` | 1280×1707 | 220,744 |
| `/images/hero.jpg` (fallback) | 1000×1333 | 237,227 |

## Posters and graphics

Posters are kept as text-bearing images; the site reproduces their facts in HTML
so the information remains readable and indexable. They are not used as the only
source of any fact.

| Key | Source file | Source px / bytes | Outputs (WebP, bytes) | Used on |
| --- | --- | --- | --- | --- |
| `t1` | `767745ad-7cf5-476d-b85c-c739721d54ec.jpg` | 2048×1535 / 215,460 | `tournament-1-0-560/900` — 45,184 / 82,284 | Events T1 recap poster |
| `t2` | `b1200d6e-1a7a-4254-89ea-bdf2099befa4.jpg` | 1448×1086 / 205,507 | `tournament-2-0-560/900` — 77,248 / 145,740 | Events T2 poster; event JSON-LD image. Replaces `474a7a64-0373-4c0e-9fbc-e9c4458e4707.jpg` |
| `mario` | `266a4f5c-3575-4d87-ab78-cea6c564fed5.jpg` | 2000×1414 / 228,918 | `super-mario-cup-560/900` — 49,706 / 89,854 | Events Mario poster; event JSON-LD image |
| `weekly` | `fa6dc7c9-6b2c-48be-b3fe-ca2519b1d1fc.jpg` | 1414×2000 / 160,107 | `weekly-chess-560/900` — 51,974 / 87,358 | Robinsons weekly poster, rendered on `/play/` |
| `rovers` | `47e168d1-2072-42d6-b6e4-5b7df4b81366.jpg` | 1080×1920 / 127,282 | `weekly-rovers-560/900` — 61,062 / 107,330 | Rovers Coffee weekly poster, rendered on `/play/` |
| `top10open` | `a943bad4-7e55-43c5-ac6c-dd43ea045cad.jpg` | 1414×2000 / 187,924 | `top10-open-560/900` — 61,336 / 104,014 | Events — Tournament 1.0 Open results |
| `top10kids` | `c9e048a1-89fa-44e0-b4b1-1ffb7eeab5f5.jpg` | 1414×2000 / 210,798 | `top10-kiddies-560/900` — 68,978 / 115,286 | Events — Tournament 1.0 Kiddies results |
| `merch` | `5a4d8f73-9107-4ae5-9db5-84e8a8a5636c.jpg` | 2000×1414 / 290,381 | `merch-price-list-560/900` — 60,788 / 114,734 | Merchandise price-list poster |
| `sponsors` | `7569a681-69ba-4d78-b300-59e827530814.jpg` | 1030×2049 / 256,442 | `partners-1-0-560/900` — 138,408 / 263,682 | About partners poster |
| `program` | `1ca3bb3f-b8c0-44fb-8284-cdfff717c142.jpg` | 892×636 / 67,008 | `program-1-0-640/892` — 48,536 / 75,838 | **Source only** — T1 program/team facts; not rendered |
| `qr` | `c4c90e7d-5cec-4529-bc08-7370d921109c.jpg` | 1290×1636 / 158,922 | `community-qr-480/760` — 38,014 / 65,134 | QR source for the Visit crop |

The cropped QR is `/images/posters/community-qr-code.webp` (480×480, 59,144 B).
It was decoded with ZXing-C++ to:

```
https://m.me/j/HytA8igzNnAWDEXo/?send_source=gc:qr_code_scan_c
```

That is the URL stored in `src/data/site.ts` and used by every “Join the group”
link.

## Sponsor logos

30 sponsor artwork files supplied via the club's Google Drive folder
“SPONSOR LOGOS” (downloaded 2026-10-27). Originals are kept read-only in
`research/sponsors-raw/` with their Drive file IDs logged in
`research/SPONSOR_SOURCES.md`. The Rovers file is kept in the archive but is
not published as a sponsor logo (removed on request 2026-10-27; Rovers still
appears as a weekly-session venue).
`scripts/optimize_images.py` places each one on
a white 4:3 tile and writes `public/images/sponsors/<key>-600/300.webp`;
`src/data/images.ts` exports the typed list rendered as two horizontally
scrolling logo rows in the partners section of `/about/` (the only page that
shows them). Names are
transcribed from the artwork — proof them before the next deploy.

## Brand and interface assets

| File | Pixels | Bytes | Notes |
| --- | --- | ---: | --- |
| `/images/logo.webp` | 560×560 | 35,834 | Header/footer mark, from `dc091ca1-0e95-4e90-a4ce-02d35d62889f.jpg` |
| `/images/logo-300.png` | 300×300 | 83,947 | Square PNG mark |
| `/images/icon-512.png` | 512×512 | 185,221 | Manifest / JSON-LD logo |
| `/images/icon-192.png` | 192×192 | 40,794 | Manifest icon |
| `/images/favicon-64.png` | 64×64 | 7,308 | `rel="icon"` |
| `/images/apple-touch-icon.png` | 180×180 | 37,019 | iOS home-screen icon |
| `/images/og.jpg` | 1200×630 | 110,076 | Generated social card |
| `/manifest.webmanifest` | — | — | App name, icons, theme |

## Fonts

| File | Bytes | License |
| --- | ---: | --- |
| `/fonts/archivo-black-latin.woff2` | 18,604 | SIL OFL 1.1 — `OFL-ArchivoBlack.txt` |
| `/fonts/manrope-latin.woff2` | 24,836 | SIL OFL 1.1 — `OFL-Manrope.txt` |

Both are self-hosted, Latin-subset WOFF2 files. No Google Fonts request is made at
runtime.

## Unused supplied files

These are intentionally **not** on the site. They remain in the source folder.

| Source file | Pixels / bytes | Why unused |
| --- | --- | --- |
| `0f0242ac-c7a1-47d0-b2e2-4a4a534f5e06.jpg` | 2000×1414 / 258,443 | Personal-brand collage about Ricky Shetty; out of scope for the club site |
| `d38c9c60-9378-4cc1-b0ff-065ada123269.jpg` | 2000×1414 / 257,434 | Second personal-brand poster; out of scope |
| `f923c353-345c-4550-a56d-04edfdd285a8.jpg` | 1290×1146 / 65,929 | Messenger invite screenshot with a time-sensitive “72 members” count; the group link is the live channel |

Superseded by a better file from the same day — the pipeline no longer references
them, but their derivatives were deleted so the old artwork cannot be served:

| Source file | Pixels / bytes | Superseded by |
| --- | --- | --- |
| `620fb610-7804-422a-98e4-f6b6f5f13ea5.jpg` | 626×949 / 23,593 | `8d1a9c4d…` lanyard artwork (900×2048) |
| `474a7a64-0373-4c0e-9fbc-e9c4458e4707.jpg` | 2048×1535 / 270,564 | `b1200d6e…` Tournament 2.0 poster (new venue and prizes) |

The three medal close-ups (`55644f40…`, `e7cafd39…`, `39097b16…`) were added to
the gallery in the 2026-10-23 pass. `/gallery/` shows 16 of the 19 photo sources;
the other three (lanyard artwork, jersey artwork and the worn-merch lifestyle
shot) are used on the merchandise page, where they carry the product facts.

## Ownership and permission

- The club photos and posters were supplied by Chess United for this project. No
  separate reuse license was supplied; do not redistribute them outside the club
  site without the club's permission.
- Partner logos appear only inside the supplied Tournament 1.0 sponsors poster.
  They remain trademarks of their owners; the site does not redraw or relicense
  them.
- The fonts are covered by the SIL Open Font License files in `public/fonts/`.
- The site code has no open-source license file. Treat it as club project work
  until Chess United decides otherwise.
- The generated OG card was rendered from the club logo with a system font at
  build time; it is a club asset, not a font redistribution.

## Regenerating images

Only needed when a source image changes:

```powershell
py scripts\optimize_images.py
npm.cmd run build
```

The script reads originals from `~/Downloads` — set `CHESS_UNITED_SOURCES` to point
somewhere else if they move — never writes to the originals, and refreshes
`research/image-manifest.json`. It requires Python 3 and Pillow; Python is not a
runtime or deployment dependency.
