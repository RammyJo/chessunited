# YouTube library — 25 November 2026

The owner requested a Videos navigation tab using these five original YouTube
links, with playback on the website and no video downloads or hosted copies.
Titles and IDs are recorded in `src/data/videos.ts`.

| Video | Original video |
| --- | --- |
| Bean Leaf — Chess United (coffee sponsor) | https://www.youtube.com/watch?v=p7UlQhmxxac |
| Chess United — Tricycle Campaign | https://www.youtube.com/watch?v=HMuQZwBUE1w |
| National Chess Qualifier — Batang Pinoy 2026 | https://www.youtube.com/watch?v=wm4kIJQlYLQ |
| Chess Tournament — Highlights Video | https://www.youtube.com/watch?v=pLbrd2FsJhQ |
| Chess United — Awards Ceremony | https://www.youtube.com/watch?v=hiXYM_ezono |

`/videos/` uses a single responsive YouTube privacy-enhanced embed. It loads only
after Play or a selection; selecting another video removes the previous iframe
to stop its audio. The player permits fullscreen, inline mobile playback and
YouTube controls. Its strict-origin-when-cross-origin referrer policy supplies
the parent origin required by YouTube embeds. Direct YouTube links remain
available, including all five in the no-JavaScript view. Video fragments select
a title without autoplaying on initial navigation.

The parent CSP adds only `https://www.youtube-nocookie.com` to frame-src. It does
not allow third-party video scripts in the parent page or wildcard origins.
YouTube provides streaming and its own player assets within the frame. No media
files were downloaded, transcoded or added to the repository for this library.

The original homepage highlight film and its existing muted autoplay remain in
place. The new YouTube highlights link is a separate entry in the video library;
do not replace or remove the existing homepage film without a user request.

The requested subtle homepage archive section sits after the sponsors, directly
before the footer, and links to `/events/#past-events`. The existing permanent
event archive is retained.
