export type Photo = {
  key: string;
  src: string;
  srcset: string;
  full: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  portrait?: boolean;
};

const widths = [480, 800, 1200];
const set = (base: string, ws: number[]) => ws.map((w) => `${base}-${w}.webp ${w}w`).join(', ');

const make = (
  key: string,
  base: string,
  width: number,
  height: number,
  alt: string,
  caption: string,
  ws: number[] = widths,
): Photo => {
  // The default <img src> is the 800w derivative; narrower originals fall back
  // to their largest available width so the src always resolves to a real file.
  const srcWidth = ws.includes(800) ? 800 : Math.max(...ws.filter((w) => w <= 800));
  return {
    key,
    src: `${base}-${srcWidth}.webp`,
    srcset: set(base, ws),
    full: `${base}-${ws[ws.length - 1]}.webp`,
    width,
    height,
    alt,
    caption,
    portrait: height > width,
  };
};

export const photos: Record<string, Photo> = {
  table19: make(
    'table19',
    '/images/photos/table-19',
    800,
    1067,
    'Young players from Chess United leaning over their boards at numbered tables during Tournament 1.0, with parents and spectators watching behind them.',
    'Tournament 1.0, table 19.',
  ),
  hall: make(
    'hall',
    '/images/photos/tournament-hall',
    800,
    1067,
    'A full tournament hall at Rovers Coffee during Chess United Tournament 1.0, with players at every table and warm pendant lights overhead.',
    'The hall at Rovers Coffee.',
  ),
  medals: make(
    'medals',
    '/images/photos/three-medals',
    800,
    1067,
    'The champion, second-place and third-place medals for Chess United Tournament 1.0, with red, white and blue ribbons.',
    'Champion, 2nd and 3rd.',
  ),
  champion: make(
    'champion',
    '/images/photos/champion-medal',
    800,
    533,
    'A close-up of the Chess United Tournament 1.0 champion, second-place and third-place medals.',
    'The full medal set.',
  ),
  gold: make(
    'gold',
    '/images/photos/medal-champion',
    800,
    600,
    'Close-up of the gold Chess United Tournament 1.0 medal for the Open Division champion, with its red, white and blue ribbon.',
    'Champion · Open Division.',
  ),
  silver: make(
    'silver',
    '/images/photos/medal-second',
    800,
    600,
    'Close-up of the silver Chess United Tournament 1.0 medal for 2nd place in the Kiddies Division.',
    '2nd place · Kiddies Division.',
  ),
  bronze: make(
    'bronze',
    '/images/photos/medal-third',
    800,
    600,
    'Close-up of the bronze Chess United Tournament 1.0 medal for 3rd place in the Open Division.',
    '3rd place · Open Division.',
  ),
  flatlay: make(
    'flatlay',
    '/images/photos/merch-flatlay',
    800,
    1067,
    'Chess United merchandise arranged on a wooden table: black chess-piece bookends, a club tumbler and a pin badge.',
    'Club merch on the table.',
  ),
  medalist: make(
    'medalist',
    '/images/photos/medalist',
    800,
    600,
    'A young medalist holding up a Chess United medal beside a club organizer in front of the Tournament 1.0 partners and sponsors banner.',
    'A medalist and an organizer.',
  ),
  merchheld: make(
    'merchheld',
    '/images/photos/merch-in-hand',
    800,
    1067,
    'Two Chess United members holding up a club pin and a keychain in front of the club backdrop.',
    'The pin and the keychain.',
  ),
  crew: make(
    'crew',
    '/images/photos/chowking-crew',
    800,
    600,
    'Chess United members and young players in club shirts at Chowking.',
    'At Chowking.',
  ),
  selfie: make(
    'selfie',
    '/images/photos/banner-selfie',
    800,
    600,
    'Two Chess United members smiling in front of the Tournament 1.0 partners and sponsors banner.',
    'At the Tournament 1.0 banner.',
    [480, 800, 1080],
  ),
  club: make(
    'club',
    '/images/photos/club-selfie',
    800,
    600,
    'Three people posing together at a restaurant, with a Chess United shirt in the middle.',
    'At the table.',
  ),
  hall2: make(
    'hall2',
    '/images/photos/tournament-hall-2',
    800,
    600,
    'Young players and spectators fill the tournament hall at Rovers Coffee during Chess United Tournament 1.0.',
    'More of the hall.',
  ),
  restaurant: make(
    'restaurant',
    '/images/photos/restaurant-group',
    800,
    1067,
    'Three people smiling together at a restaurant under red lanterns, with a Chess United shirt in the middle.',
    'Under the lanterns.',
  ),
  idcard: make(
    'idcard',
    '/images/photos/member-id-selfie',
    800,
    600,
    'Two Chess United members in front of a tropical flower backdrop, one holding up a club member ID on a branded lanyard while the other holds a printed sheet of the Chess United logo.',
    'Member ID and lanyard.',
  ),
  lanyard: make(
    'lanyard',
    '/images/photos/lanyard-mockup',
    480,
    1092,
    'Chess United lanyard design: a blue half and a red half printed with the club name and knight logo, a black-and-white checkered lower strap, and a member ID card holder.',
    'The club lanyard.',
    [480, 900],
  ),
  jersey: make(
    'jersey',
    '/images/photos/club-jersey',
    800,
    372,
    'Front and back of the white Chess United sublimation jersey: blue and red raglan sleeves, the club crest on the chest, and a knight with a player name and number on the back.',
    'The club jersey.',
  ),
  merchlife: make(
    'merchlife',
    '/images/photos/merch-lifestyle',
    800,
    1131,
    'A club member in the Chess United t-shirt and cap drinks from a branded mug while holding a blue Chess United notebook, against a painted blue backdrop.',
    'Worn, printed, carried.',
    [480, 800],
  ),
};

export const heroImage = {
  src: '/images/hero-960.webp',
  srcset: '/images/hero-640.webp 640w, /images/hero-960.webp 960w, /images/hero-1280.webp 1280w',
  jpg: '/images/hero.jpg',
  width: 960,
  height: 1280,
  alt: 'A young Chess United player studying the board at table 19 during Tournament 1.0, surrounded by players and spectators in a warm-lit hall.',
};

export const posters = {
  t1: '/images/posters/tournament-1-0-900.webp',
  t2: '/images/posters/tournament-2-0-900.webp',
  mario: '/images/posters/super-mario-cup-900.webp',
  weekly: '/images/posters/weekly-chess-900.webp',
  merch: '/images/posters/merch-price-list-900.webp',
  sponsors: '/images/posters/partners-1-0-900.webp',
  program: '/images/posters/program-1-0-892.webp',
  qr: '/images/posters/community-qr-760.webp',
  rovers: '/images/posters/weekly-rovers-900.webp',
  top10Open: '/images/posters/top10-open-900.webp',
  top10Kiddies: '/images/posters/top10-kiddies-900.webp',
};

export const galleryHome = [photos.table19, photos.hall, photos.medals, photos.flatlay, photos.medalist, photos.hall2];export const galleryAll = [
  photos.table19,
  photos.medalist,
  photos.hall,
  photos.hall2,
  photos.medals,
  photos.champion,
  photos.gold,
  photos.silver,
  photos.bronze,
  photos.flatlay,
  photos.merchheld,
  photos.selfie,
  photos.crew,
  photos.club,
  photos.restaurant,
  photos.idcard,
];

export type Sponsor = {
  name: string;
  src: string;
  srcset: string;
  alt: string;
};

// Artwork supplied by the club in the "SPONSOR LOGOS" Drive folder; each logo is
// placed on a white 4:3 tile by scripts/optimize_images.py. Sources and Drive
// file IDs are logged in research/SPONSOR_SOURCES.md.
const sponsor = (name: string, alt: string, key = name): Sponsor => ({
  name,
  src: `/images/sponsors/${key}-600.webp`,
  srcset: `/images/sponsors/${key}-300.webp 300w, /images/sponsors/${key}-600.webp 600w`,
  alt,
});

export const sponsors: Sponsor[] = [
  sponsor('Freedom Church', 'Freedom Church logo: a brushstroke cross in blue and red.', 'freedom-church'),
  sponsor('Marlon Floating Cottage', 'Marlon Floating Cottage logo: an illustrated nipa cottage over water.', 'marlon-cottage'),
  sponsor('Sports Clinic · City YESDO', 'Sports Clinic call-for-participants poster from the City of San Fernando Youth, Education and Sports Development Office.', 'sports-clinic'),
  sponsor('Pokemon La Union Community', 'Pokemon La Union Community Casual VGC shield logo with a poke ball.', 'pokemon-lau'),
  sponsor('Paolyn Houseboat', 'Paolyn Houseboat logo: a houseboat on Lakinisan Lagoon, Coron Island, Palawan.', 'paolyn-houseboat'),
  sponsor('Gordon Ramsay Bar & Grill', 'Three Chess United members posing in front of a Gordon Ramsay Bar and Grill storefront.', 'gordon-ramsay-bar'),
  sponsor('Healthy Globe', 'Healthy Globe logo: a globe with a green sprout and the verse 3 John 2.', 'healthy-globe'),
  sponsor('National United Chess Federation of the Philippines', 'National United Chess Federation of the Philippines seal with an eagle over a chessboard globe.', 'nucf'),
  sponsor('Influencers United', 'Influencers United logo with the tagline Social Media For Social Good.', 'influencers-united'),
  sponsor('Elite Shuttle', 'Elite Shuttle logo: a glowing emblem in a Halloween-themed artwork.', 'elite-shuttle'),
  sponsor("Jaypee's Bakeshop and Cafe", "Jaypee's Bakeshop and Cafe logo from La Union, with the tagline Quality Is Our Recipe.", 'jaypees'),
  sponsor('Aloha Cares', 'Aloha Cares logo in green and red script with a heart.', 'aloha-cares'),
  sponsor('Chess United', 'Chess United logo: a knight, rook and pawn above the club name.', 'chess-united'),
  sponsor('NASUDI Center for Women and Children', 'NASUDI Center for Women and Children logo: two figures under a blue roof.', 'nasudi'),
  sponsor('Benz-Ban Resort', 'Benz-Ban Resort and Blck1 Cafe logo: a sun rising over waves between palm trees.', 'benz-ban-resort'),
  sponsor('Fixel Printing Services', 'Fixel Printing Services logo built from pixel blocks in yellow and red.', 'fixel-printing'),
  sponsor('Bless La Union 2025', 'Bless La Union 2025 event artwork against a Philippine flag.', 'bless-la-union'),
  sponsor('Chess United wordmark', 'Chess United wordmark with a gold crown over the U.', 'chess-united-wordmark'),
  sponsor('Bless La Union', 'Bless La Union logo in yellow, white and red.', 'bless-la-union-stage'),
  sponsor('Northern Ilocos Chess Club', 'Northern Ilocos Chess Club seal with two queens and the year Est. 2026.', 'northern-ilocos-chess'),
  sponsor('Let There Be Matcha', 'Let There Be Matcha tea house logo on a green background.', 'matcha'),
  sponsor('Reve Snaps Camera Rental', 'Reve Snaps Camera Rental La Union logo in red and black type.', 'reve-snaps'),
  sponsor('San Fernando Tayo · City YESDO', 'Sports Clinic poster from the City of San Fernando under the San Fernando Tayo branding.', 'san-fernando-tayo'),
  sponsor('19th GoPalaro Rapid Chess Tournament', 'Poster of the 19th GoPalaro Rapid Chess Tournament at SM City La Union.', 'gopalaro-rapid'),
  sponsor('Elyu Spinners', 'Elyu Spinners logo: paddles crossed under a sunset wave.', 'elyu-spinners'),
  sponsor('VALUE · La Union Emcees', 'VALUE logo: the Vibrant Association of La Union Emcees, with a microphone and waves.', 'value'),
  sponsor("Children's Island Boodle Fight", "Children's Island Boodle Fight logo: a child holding a boodle fight spread.", 'childrens-island'),
  sponsor('Sto. Tomas Batangas Chess Players Association', 'City of Sto. Tomas Batangas Chess Players Association logo with a knight in Philippine colours.', 'sto-tomas-chess'),
  sponsor('Chingo Spot', 'Chingo Spot logo: a monkey chef in a blue hat holding ramen and fried chicken.', 'chingo-spot'),
];
