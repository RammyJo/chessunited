import newArtwork from './november-25-images.json';
import { uploadedImages } from './uploads';

/** Confirmed category exclusivity, updated by the club on 25 November 2026.
 * Keep one organisation per category. Only use official supplied logo artwork.
 */
export const exclusiveSponsors = [
  { category: 'Mall', name: 'SM City La Union' },
  { category: 'Bank', name: 'Rang-Ay Bank' },
  { category: 'Telecom', name: 'SMART' },
  { category: 'Fast food', name: 'Jollibee' },
  { category: 'Food delivery', name: 'Grab' },
  { category: 'Fuel', name: 'Shell' },
  { category: 'Fitness', name: 'Anytime Fitness' },
];

export const exclusiveArtwork = {
  'Rang-Ay Bank': newArtwork['rang-ay-bank'],
  'SMART': newArtwork.smart,
  'Jollibee': newArtwork.jollibee,
  'Grab': newArtwork.grab,
  'Shell': uploadedImages.shell,
  'Anytime Fitness': uploadedImages['anytime-fitness'],
};

export const smLogo = {
  src: '/images/partners/sm-city-la-union-blue-1200.webp',
  srcset: '/images/partners/sm-city-la-union-blue-600.webp 600w, /images/partners/sm-city-la-union-blue-1200.webp 1200w',
  width: 1200, height: 198,
};

/** Centre address transcribed from the owner-supplied NUCFP opening poster. */
export const nucfp = {
  name: 'NUCFP Center',
  fullName: 'National United Chess Federation of the Philippines',
  role: 'Strategic partner',
  city: 'Pasay City',
  address: 'Unit 1D, 9th floor, EGI Rufino Plaza Condominium Complex, Pasay City',
  access: 'Access via LRT Gil Puyat Station',
  mapsQuery: 'EGI Rufino Plaza Condominium Complex, Pasay City, Philippines',
};

// Names on the supplied chess-club artwork. No meeting times or affiliation
// levels are inferred from a logo; these do not create approved directory rows.
export const clubConnections = [
  'Metro Davao Youth Chess Club',
  'YMCA Davao',
  'Bing Chess Club',
  'Cebu Chess Hub',
  'Manila Science High School Chess Club',
  'Universidad de Manila Chess Club',
  'United Queens Chess Club',
  'UP Chess Club',
];

export const additionalSupporters = ['Charm’s Food Corner', 'ELYUSCRAPER'];
