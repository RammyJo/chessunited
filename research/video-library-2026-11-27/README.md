# Owner-supplied video library — 27 November 2026, Manila

The owner asked to replace all five YouTube embeds/links with supplied video files.
The initial ZIP exceeded the chat-to-workspace transfer limit; the owner supplied
this publicly downloadable Drive folder instead:
https://drive.google.com/drive/folders/1i_FcRBY0rVJAzA43tGxpIS-XINSt0cSf

All five originals were downloaded from that folder with expected byte counts
and SHA-256 checks. Filenames and visual frames identify the videos; the generic
videoplayback.mp4 is the awards ceremony, and CHESS-UNITED-SnapYT.App.mp4 is the
tricycle campaign. manifest.json records the exact source IDs, hashes, probes,
matching titles and every hosted output. Originals remain outside Git in the
workspace's attachments/chess-videos-nov27 directory; the supplied Drive folder
is the durable original source.

All five supplied files are H.264/AAC at 640×360. The three short files are
remuxed to fast-start MP4. The two ~20-minute files exceed Pages' per-asset size
limit, so they are remuxed into complete VOD HLS playlists with fragmented MP4
segments. No clipping, rescaling, re-encoding, watermarks or audio replacement.
Both video and audio packet stream hashes match their original files for all
five hosted outputs. The format duration of HLS is about 0.13 seconds shorter due
to container timing/padding, with identical full audio and video packet bytes.
Source-frame posters are extracted at 5 seconds, with 320/640 pixel derivatives.

Rebuild media from the same originals:

```sh
python scripts/prepare_video_library.py --source-dir /path/to/originals
```

/videos/ retains five independent players, titles and existing fragment URLs.
All players have native controls, inline playback, posters, no autoplay and
preload=none. HLS uses native playback where available; otherwise a visitor's
Play click loads the locally bundled hls.js 1.7.4 adapter. It uses MediaSource,
disables workers, and keeps limited buffers. Only same-origin media/script
requests are required. Starting one video pauses the others; network failures
show a retry state. MediaSource requires blob: in media-src; the obsolete
YouTube frame-src allowance is removed. No remote scripts, media hosts, unsafe
eval or worker allowances are added. The homepage highlights remain untouched.
