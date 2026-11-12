import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { photos } from './images';

// Keep the feature unpublished until the supplied film is available locally.
// The preview flag is used only for local layout/playback checks with fixtures.
const src = '/videos/chess-united-highlights.mp4';
export const highlightVideo = existsSync(resolve(process.cwd(), 'public' + src)) || process.env.HIGHLIGHT_VIDEO_PREVIEW === '1'
  ? {
      src,
      poster: photos.hall2.full,
      posterSrcset: photos.hall2.srcset,
      width: 1920,
      height: 1080,
    }
  : null;
