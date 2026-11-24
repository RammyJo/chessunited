/** Exact YouTube IDs and titles supplied by the club. Videos stay on YouTube. */
export const youtubeVideos = [
  { id: 'p7UlQhmxxac', slug: 'bean-leaf', title: 'Bean Leaf — Chess United', category: 'Coffee sponsor' },
  { id: 'HMuQZwBUE1w', slug: 'tricycle-campaign', title: 'Chess United — Tricycle Campaign', category: 'In the community' },
  { id: 'wm4kIJQlYLQ', slug: 'batang-pinoy-2026', title: 'National Chess Qualifier — Batang Pinoy 2026', category: 'Competition' },
  { id: 'pLbrd2FsJhQ', slug: 'tournament-highlights', title: 'Chess Tournament — Highlights Video', category: 'Tournament highlights' },
  { id: 'hiXYM_ezono', slug: 'awards-ceremony', title: 'Chess United — Awards Ceremony', category: 'Celebrating the players' },
];
export const youtubeWatchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
