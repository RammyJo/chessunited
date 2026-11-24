import images from './uploaded-images.json';

export const uploadedImages = images;
export type UploadedImage = (typeof images)[keyof typeof images];

/** Exact supplied artwork; other named partners retain their text-only cards. */
export const partnerArtwork: Record<string, UploadedImage> = {
  'Signs, Wonders and Miracles': images['signs-wonders-miracles'],
  'Love God and Thy Neighbor Fellowship': images['love-god-neighbor'],
  'Freedom in Christ Center Fellowship Bangcusay Inc.': images['freedom-christ-bangcusay'],
  'Metro Davao Youth Chess Club': images['metro-davao-youth-chess'],
  'YMCA Davao': images['ymca-davao'],
  'Bing Chess Club': images['bing-chess-club'],
  'Cebu Chess Hub': images['cebu-chess-hub'],
  'Manila Science High School Chess Club': images['manila-science-chess'],
  'Universidad de Manila Chess Club': images['universidad-manila-chess'],
  'United Queens Chess Club': images['united-queens-chess'],
  'UP Chess Club': images['up-chess-club'],
  'Shell': images.shell,
  'Charm’s Food Corner': images['charms-food-corner'],
  'Anytime Fitness': images['anytime-fitness'],
};

/** These photos have no confirmed catalogue price or variant mapping. */
export const merchandiseCollection = [
  { name: 'Blue wristwatch', image: images.watch },
  { name: 'Flip calendar', image: images['flip-calendar'] },
  { name: 'Wireless charger & phone stand', image: images['wireless-charger'] },
  { name: 'Bamboo tray', image: images['bamboo-tray'] },
  { name: 'Bamboo tissue box', image: images['tissue-box'] },
  { name: 'Bottles & tumblers', image: images.bottles },
  { name: '2027 calendar design', image: images['calendar-2027'] },
];
