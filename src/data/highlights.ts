import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

// These are complete web encodes of the owner-supplied highlights, not excerpts.
// Fingerprints refresh cached media if a later edit replaces one of the files.
const src = '/videos/chess-united-highlights.mp4';
const mobileSrc = '/videos/chess-united-highlights-720p.mp4';
const posterBase = '/images/highlights/chess-united-highlights';
const local = (path: string) => resolve(process.cwd(), 'public' + path);
const fingerprint = (path: string) => `${path}?v=${createHash('sha256').update(readFileSync(local(path))).digest('hex').slice(0,12)}`;
const ready = [src, mobileSrc, `${posterBase}-640.webp`, `${posterBase}-1280.webp`, `${posterBase}-1920.webp`].every(path => existsSync(local(path)));

export const highlightVideo = ready
  ? {
      src: fingerprint(src),
      mobileSrc: fingerprint(mobileSrc),
      poster: fingerprint(`${posterBase}-1280.webp`),
      posterSrcset: [640,1280,1920].map(width => `${fingerprint(`${posterBase}-${width}.webp`)} ${width}w`).join(', '),
      width: 1920,
      height: 1080,
      durationLabel: '1:00',
    }
  : null;
