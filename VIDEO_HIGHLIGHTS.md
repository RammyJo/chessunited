# Homepage highlights

The homepage features the supplied **Chess United Video Highlights 5.0 Version**
as a complete one-minute film, directly below the opening hero/ticker.

## Website assets

| Asset | Resolution | Bytes |
| --- | --- | --- |
| `public/videos/chess-united-highlights.mp4` | 1920×1080 | 22,499,800 |
| `public/videos/chess-united-highlights-720p.mp4` | 1280×720 | 12,632,440 |

Both contain all 1,806 video frames and the source's original AAC audio stream,
with the same 60.209-second runtime. The original 184,226,285-byte upload is kept
outside the repository; only the web encodes are committed. Each file stays
below Cloudflare Pages' 25 MiB asset limit. The MP4 index is at the beginning
(`faststart`), and keyframes are at most two seconds apart for seeking.

The responsive WebP covers under `public/images/highlights/` are extracted from
33.75 seconds of the actual film. Ending credits and watermarks remain in the
full video.

## Playback and performance

- `src/data/highlights.ts` checks that both films and all covers exist, then
  fingerprints their URLs so a replacement refreshes cached media.
- `HighlightVideo.astro` shows the cover and play button. No video source is
  assigned until the visitor chooses to watch. The hero's Watch button starts
  playback and takes the visitor to the feature.
- `highlight-video.js` chooses 720p at viewport widths up to 760 CSS pixels and
  1080p above that. Native inline controls and sound follow the play gesture.
  Keyboard activation, retry after an error and pausing on a hidden tab are
  supported. The film does not autoplay on page load.
- Video responses are cached for 30 days; URLs include a content fingerprint.
  The security policy explicitly permits same-origin media.

For a replacement, update the runtime label and VideoObject metadata, extract a
new representative cover, and verify playback and byte-range seeking on the
live domain. Preserve full footage and audio unless the owner requests an edit.

When pre-uploading assets through a proxy with request size limits, upload each
video separately before the complete `dist/` upload. The final upload reuses
their existing content hashes and produces the complete deployment manifest.
