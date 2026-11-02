export type Prize = { place: string; amount: number; note?: string };

export type Division = {
  name: string;
  ages: string;
  fee: number;
  prizes: Prize[];
};

export type ResultPlace = { rank: number; name: string };

export type ResultBoard = {
  division: string;
  ages: string;
  places: ResultPlace[];
  poster: string;
  posterWidth: number;
  posterHeight: number;
};

export type Event = {
  slug: string;
  name: string;
  shortName: string;
  kicker: string;
  date: string; // ISO date
  dateLabel: string;
  day: string;
  month: string;
  year: string;
  start: string;
  end: string;
  timeLabel: string;
  venue: string;
  venueShort: string;
  address: string;
  mapsQuery: string;
  status: 'upcoming' | 'past';
  poster?: string;
  posterWidth?: number;
  posterHeight?: number;
  divisions: Division[];
  results?: ResultBoard[];
  highlight: string;
  note?: string;
  ics?: string;
};

/* `id` doubles as the icon name, so it is narrowed to the accounts the site has
   artwork for. */
export type SocialAccount = {
  id: 'facebook' | 'instagram' | 'youtube';
  label: string;
  href: string;
};

export const site = {
  name: 'Chess United',
  legalName: 'Chess United',
  tagline: 'Chess for everyone.',
  description:
    'Community chess in San Fernando City, La Union. Weekly Saturday play at two tables, plus age-division tournaments with cash prizes.',
  city: 'San Fernando City',
  region: 'La Union',
  country: 'Philippines',
  groupName: 'CHESS UNITED – REGION 1 NETWORK',
  groupUrl: 'https://m.me/j/HytA8igzNnAWDEXo/?send_source=gc:qr_code_scan_c',
  /* Official club social accounts, run by the club's VA (Bryl).
     Leave a href as an empty string until the account exists — empty entries are
     hidden everywhere they are rendered, so nothing half-live is ever published. */
  social: [
    { id: 'facebook', label: 'Facebook', href: '' },
    { id: 'instagram', label: 'Instagram', href: '' },
    { id: 'youtube', label: 'YouTube', href: '' },
  ] as SocialAccount[],
  nav: [
    { href: '/events/', label: 'Events' },
    { href: '/membership/', label: 'Membership' },
    { href: '/gallery/', label: 'Gallery' },
    { href: '/shop/', label: 'Merchandise' },
    { href: '/partners/', label: 'Partner clubs' },
    { href: '/about/', label: 'About' },
    { href: '/visit/', label: 'Visit' },
  ],
};

/* ---------------------------------------------------------------------------
   Membership — any player can register online and get a digital club card.
   A printed card with the club lanyard is the club's ₱200 option.
   --------------------------------------------------------------------------- */
export const membership = {
  printFee: 200,
  printIncludes: 'The printed membership ID card and a club lanyard',
  cardPath: '/membership/?m=',
};

/* ---------------------------------------------------------------------------
   GCash — the club takes payment by QR scan, not by card. Buyers scan the
   club's GCash QR, then paste the 13-digit reference number from their receipt;
   a club officer matches it by hand before the entry or order is confirmed.
   --------------------------------------------------------------------------- */
export const gcash = {
  referenceLength: 13,
  instructions:
    'Scan the Chess United GCash QR, pay the exact amount, then copy the 13-digit reference number from your GCash receipt.',
};

/* ---------------------------------------------------------------------------
   Shipping — how the club sends things out.
   The NCF Tap Card travels nationwide by LBC or J&T Express; merchandise goes
   anywhere in the world by FedEx, UPS, DHL, LBC or Philippine Post.
   --------------------------------------------------------------------------- */
export type Courier = {
  id: string;
  label: string;
  scope: 'ph' | 'intl';
  note: string;
};

export const couriers: Courier[] = [
  { id: 'lbc', label: 'LBC', scope: 'ph', note: 'Nationwide, and worldwide for merchandise.' },
  { id: 'jt', label: 'J&T Express', scope: 'ph', note: 'Nationwide.' },
  { id: 'fedex', label: 'FedEx', scope: 'intl', note: 'International merchandise.' },
  { id: 'ups', label: 'UPS', scope: 'intl', note: 'International merchandise.' },
  { id: 'dhl', label: 'DHL', scope: 'intl', note: 'International merchandise.' },
  {
    id: 'phlpost',
    label: 'Philippine Post',
    scope: 'intl',
    note: 'International merchandise, economy service.',
  },
];


export const events: Event[] = [
  {
    slug: 'tournament-2-0',
    name: 'Chess United Tournament 2.0',
    shortName: 'Tournament 2.0',
    kicker: 'Up next',
    date: '2026-11-07',
    dateLabel: 'Saturday, 7 November 2026',
    day: '07',
    month: 'NOV',
    year: '2026',
    start: '10:00',
    end: '18:00',
    timeLabel: '10:00 AM – 6:00 PM',
    venue: 'Robinsons Mall La Union',
    venueShort: 'Robinsons Mall, San Fernando',
    address: 'Robinsons Place La Union, San Fernando City, La Union',
    mapsQuery: 'Robinsons Mall La Union, San Fernando City, La Union',
    status: 'upcoming',
    poster: '/images/posters/tournament-2-0-900.webp',
    posterWidth: 900,
    posterHeight: 675,
    highlight: '₱5,000 Open champion',
    ics: '/calendar/chess-united-tournament-2-0.ics',
    divisions: [
      {
        name: 'Open Division',
        ages: '13 & above',
        fee: 350,
        prizes: [
          { place: 'Champion', amount: 5000, note: 'plus trophy' },
          { place: '2nd place', amount: 3000, note: 'plus medal' },
          { place: '3rd place', amount: 2000, note: 'plus medal' },
          { place: '4th place', amount: 1000 },
          { place: '5th place', amount: 700 },
          { place: '6th–10th place', amount: 500 },
          { place: 'Top Lady', amount: 500 },
          { place: 'Top Senior', amount: 500 },
          { place: 'Top Junior', amount: 500, note: '13–16 years old' },
          { place: 'Top San Fernando', amount: 500 },
          { place: 'Top La Union', amount: 500 },
        ],
      },
      {
        name: 'Kiddies Division',
        ages: '12 & below',
        fee: 300,
        prizes: [
          { place: 'Champion', amount: 3000, note: 'plus trophy' },
          { place: '2nd place', amount: 2000, note: 'plus medal' },
          { place: '3rd place', amount: 1000, note: 'plus medal' },
          { place: '4th place', amount: 700 },
          { place: '5th place', amount: 500 },
          { place: '6th–10th place', amount: 300 },
          { place: 'Youngest participant', amount: 300 },
        ],
      },
    ],
  },
  {
    slug: 'super-mario-cup',
    name: 'Ortega Chess Tournament: Super Mario Cup',
    shortName: 'Super Mario Cup',
    kicker: 'December',
    date: '2026-12-05',
    dateLabel: 'Saturday, 5 December 2026',
    day: '05',
    month: 'DEC',
    year: '2026',
    start: '09:00',
    end: '17:00',
    timeLabel: '9:00 AM – 5:00 PM',
    venue: 'Ortega Convention Center',
    venueShort: 'Ortega Convention Center',
    address:
      'Ortega Convention Center, New Government Center, Barangay Sevilla / Sagayad, San Fernando City, La Union',
    mapsQuery:
      'Ortega Convention Center, New Government Center, Barangay Sevilla, San Fernando City, La Union',
    status: 'upcoming',
    poster: '/images/posters/super-mario-cup-900.webp',
    posterWidth: 900,
    posterHeight: 636,
    highlight: '₱50,000 winner take all',
    note: 'Christmas blessing: 100% of proceeds will go to NASUDI.',
    ics: '/calendar/chess-united-super-mario-cup.ics',
    divisions: [
      {
        name: 'Open Division',
        ages: '13 & above',
        fee: 500,
        prizes: [{ place: 'Winner take all', amount: 50000 }],
      },
      {
        name: 'Kiddies Division',
        ages: '12 & below',
        fee: 400,
        prizes: [{ place: 'Kids prize', amount: 5000 }],
      },
    ],
  },
  {
    slug: 'tournament-1-0',
    name: 'Chess United Tournament 1.0',
    shortName: 'Tournament 1.0',
    kicker: 'In the books',
    date: '2026-10-17',
    dateLabel: 'Saturday, 17 October 2026',
    day: '17',
    month: 'OCT',
    year: '2026',
    start: '10:00',
    end: '18:00',
    timeLabel: '10:00 AM – 6:00 PM',
    venue: 'Rovers Coffee',
    venueShort: 'Rovers Coffee, Lingsat',
    address:
      'Rovers Coffee, MacArthur Highway, opposite Saint Louis College, Barangay Lingsat, San Fernando City, La Union',
    mapsQuery: 'Rovers Coffee, MacArthur Highway, Lingsat, San Fernando City, La Union',
    status: 'past',
    poster: '/images/posters/tournament-1-0-900.webp',
    posterWidth: 900,
    posterHeight: 675,
    highlight: 'The first tournament day',
    divisions: [
      {
        name: 'Open Division',
        ages: '13 & above',
        fee: 300,
        prizes: [
          { place: 'Champion', amount: 3000, note: 'plus medal' },
          { place: '2nd place', amount: 2000, note: 'plus medal' },
          { place: '3rd place', amount: 1000, note: 'plus medal' },
          { place: '4th place', amount: 500 },
          { place: '5th place', amount: 500 },
          { place: 'Top Lady', amount: 300 },
        ],
      },
      {
        name: 'Kiddies Division',
        ages: '12 & below',
        fee: 250,
        prizes: [
          { place: 'Champion', amount: 2000, note: 'plus medal' },
          { place: '2nd place', amount: 1500, note: 'plus medal' },
          { place: '3rd place', amount: 700, note: 'plus medal' },
          { place: '4th place', amount: 500 },
          { place: '5th place', amount: 500 },
          { place: '6th–10th place', amount: 300 },
        ],
      },
    ],
    results: [
      {
        division: 'Open Division',
        ages: '13 & above',
        poster: '/images/posters/top10-open-900.webp',
        posterWidth: 900,
        posterHeight: 1273,
        places: [
          { rank: 1, name: 'Quiban Fernan' },
          { rank: 2, name: 'Subido Joel' },
          { rank: 3, name: 'Halabaso Adriel Josh' },
          { rank: 4, name: 'Dawa Abimelech' },
          { rank: 5, name: 'Agaton Conrado' },
          { rank: 6, name: 'Tadina Fernando' },
          { rank: 7, name: 'Dayap Larry' },
          { rank: 8, name: 'Cabading Verne Jules' },
          { rank: 9, name: 'Foronda Mario' },
          { rank: 10, name: 'Tadina Hector' },
        ],
      },
      {
        division: 'Kiddies Division',
        ages: '12 & below',
        poster: '/images/posters/top10-kiddies-900.webp',
        posterWidth: 900,
        posterHeight: 1273,
        places: [
          { rank: 1, name: 'Macaraig Jayniel Carl' },
          { rank: 2, name: 'Carreon Rhenzzell Charl' },
          { rank: 3, name: 'Agaton Hiraya Rocia' },
          { rank: 4, name: 'Cagdan Maxyne Jocheb' },
          { rank: 5, name: 'Lestino Drake Jordan' },
          { rank: 6, name: 'Laconsay Riannne' },
          { rank: 7, name: 'Lucio Andriel Judah' },
          { rank: 8, name: 'Abaya Ma. Antoinette Hope' },
          { rank: 9, name: 'Corre Kathaleyah' },
          { rank: 10, name: 'Laygo Jevaun Kyle' },
        ],
      },
    ],
  },
];

export type WeeklySession = {
  name: string;
  when: string;
  time: string;
  venue: string;
  address: string;
  mapsQuery: string;
  poster: string;
  posterWidth: number;
  posterHeight: number;
  blurb: string;
};

/* Two standing weekly tables, each published on its own club poster. */
export const weeklySessions: WeeklySession[] = [
  {
    name: 'Robinsons Mall La Union',
    when: 'Every Saturday',
    time: '10:00 AM – 2:00 PM',
    venue: 'Robinsons Mall La Union',
    address: 'Robinsons Place La Union, San Fernando City, La Union',
    mapsQuery: 'Robinsons Mall La Union, San Fernando City, La Union',
    poster: '/images/posters/weekly-chess-900.webp',
    posterWidth: 900,
    posterHeight: 1273,
    blurb:
      'The main weekly session: a four-hour table in the mall for kids, teens and adults, whether you are learning the moves or preparing for tournament day.',
  },
  {
    name: 'Rovers Coffee',
    when: 'Every Saturday morning',
    time: '10:00 AM – 12:00 PM',
    venue: 'Rovers Coffee',
    address:
      'Rovers Coffee, MacArthur Highway, opposite Saint Louis College, Barangay Lingsat, San Fernando City, La Union',
    mapsQuery: 'Rovers Coffee, MacArthur Highway, San Fernando City, La Union',
    poster: '/images/posters/weekly-rovers-900.webp',
    posterWidth: 900,
    posterHeight: 1600,
    blurb:
      'The morning table at the coffee shop that hosted Tournament 1.0 — a two-hour session for anyone who wants to play before the day gets busy.',
  },
];

export const upcomingEvents = events.filter((e) => e.status === 'upcoming');

/* `id` is the key the order form posts and the key `functions/api/_catalog.js`
   prices server-side. The two lists must stay in step. */
export type MerchItem = { id: string; name: string; price: number; note?: string };
export type MerchGroup = { name: string; blurb: string; items: MerchItem[] };

export const merch: MerchGroup[] = [
  {
    name: 'Apparel',
    blurb: 'Club colours for tournament day and everywhere else.',
    items: [
      { id: 'tshirt', name: 'T-shirt', price: 300, note: 'medium only' },
      { id: 'polo-shirt', name: 'Polo shirt', price: 400 },
      { id: 'sublimation-shirt', name: 'Sublimation shirt', price: 600 },
      { id: 'cap', name: 'Cap', price: 150 },
    ],
  },
  {
    name: 'Chess gear',
    blurb: 'The kit that earns its place in the bag.',
    items: [
      { id: 'chess-set', name: 'Chess set', price: 800 },
      { id: 'tumbler', name: 'Tumbler', price: 250 },
      { id: 'mug', name: 'Mug', price: 120 },
      { id: 'magic-mug', name: 'Magic mug', price: 180 },
      { id: 'mousepad', name: 'Mousepad', price: 100 },
      { id: 'lanyard', name: 'Lanyard', price: 100 },
      { id: 'member-id', name: 'Member ID', price: 100 },
    ],
  },
  {
    name: 'Desk & study',
    blurb: 'For the player who studies the game away from the board.',
    items: [
      { id: 'wall-clock', name: 'Wall clock', price: 275 },
      { id: 'table-clock', name: 'Table clock', price: 250 },
      { id: 'notebook', name: 'Notebook', price: 150 },
      { id: 'pen', name: 'Pen', price: 50 },
    ],
  },
  {
    name: 'Small things',
    blurb: 'Pocket-sized club spirit.',
    items: [
      { id: 'hand-fan', name: 'Hand fan', price: 120 },
      { id: 'pocket-mirror', name: 'Pocket mirror', price: 75 },
      { id: 'keychain', name: 'Keychain', price: 50 },
      { id: 'ref-magnet', name: 'Ref magnet', price: 50 },
      { id: 'stickers', name: 'Stickers', price: 5 },
    ],
  },
];

/* ---------------------------------------------------------------------------
   NCF Tap Card — ordered through the site and shipped nationwide by LBC or
   J&T Express. The club has not published a price, so it is listed without one
   and the club confirms the total before the buyer pays.
   --------------------------------------------------------------------------- */
export const ncfTapCard = {
  id: 'ncf-tap-card',
  name: 'NCF Tap Card',
  price: null as number | null,
  blurb:
    'The National Chess Federation tap card, sold through Chess United. Shipped anywhere in the Philippines by LBC or J&T Express.',
  couriers: ['lbc', 'jt'],
};

/* ---------------------------------------------------------------------------
   Confirmed but not yet published in full: the club has announced the date and
   venue, and the divisions, fees and poster follow. Deliberately kept out of
   `events` so no unannounced prize money or entry fee is ever shown.
   --------------------------------------------------------------------------- */
export type AnnouncedEvent = {
  slug: string;
  name: string;
  date: string;
  dateLabel: string;
  month: string;
  year: string;
  venue: string;
  address: string;
  mapsQuery: string;
  note: string;
};

export const announcedEvents: AnnouncedEvent[] = [
  {
    slug: 'sm-la-union',
    name: 'Chess United Tournament — SM La Union',
    date: '2027-01-09',
    dateLabel: 'Saturday, 9 January 2027',
    month: 'JAN',
    year: '2027',
    venue: 'SM City La Union',
    address: 'SM City La Union, San Fernando City, La Union',
    mapsQuery: 'SM City La Union, San Fernando City, La Union',
    note: 'Date and venue confirmed by the club. Divisions, entry fees and prizes are announced with the official poster.',
  },
];


export const partnerTiers = [
  {
    tier: 'King',
    partners: [
      'Province of La Union',
      'City of San Fernando, La Union',
      'SM',
      'Robinsons Place La Union',
      'CSI La Union Mall',
      'Manna Mall',
      'Rovers',
      'Let There Be Matcha',
    ],
  },
  {
    tier: 'Queen',
    partners: [
      'Hon. Mario Eduardo C. Ortega, MDA',
      'Hon. Hermenegildo "Dong" A. Gualberto',
      'Aloha Cares',
      'Rotary',
      'Lions International',
      'Philippine Eagles',
    ],
  },
  {
    tier: 'Knight',
    partners: ['Freedom Church', 'Influencers United', 'Healthy Globe', 'Daddy Blogger', 'Rickyshetty'],
  },
  {
    tier: 'Bishop',
    partners: ['Media & Vloggers', 'Elyuscraper', '101.7 Love Radio'],
  },
  {
    tier: 'Rook',
    partners: ['Metro Vision Customized Printing', 'TARP KO', 'Fixel Printing Services', 'Channel Print'],
  },
];

/* Chess United GLOBAL — the network behind the local club.
   Marker positions are percentages of the 1600x800 equirectangular map in
   public/images/world-map.svg (generated by scripts/make_world_map.mjs). */
export type GlobalHub = {
  location: string;
  role: string;
  blurb: string;
};

export type GlobalNetwork = {
  name: string;
  where: string;
  status: 'active' | 'building';
  marker: string;
  note: string;
};

export const globalHubs: GlobalHub[] = [
  { location: 'San Fernando City, La Union', role: 'Asian HQ', blurb: 'The home table: weekly Saturdays in the mall and every tournament division.' },
  { location: 'Vancouver, Canada', role: 'North American HQ', blurb: 'The founding hub that carries the club across the Pacific.' },
  { location: 'Bombay, India', role: 'South Asian HQ', blurb: 'Building the network where the game has been played for a thousand years.' },
];

export const globalNetworks: GlobalNetwork[] = [
  { name: 'CU Luzon Network', where: 'Luzon, Philippines', status: 'active', marker: 'luzon', note: 'The strongest regional network — anchored by Region 1 and San Fernando City.' },
  { name: 'CU Visayas Network', where: 'Samar and Cebu, Philippines', status: 'building', marker: 'visayas', note: 'Taking shape in Samar and Cebu.' },
  { name: 'CU Mindanao Network', where: 'General Santos, Philippines', status: 'building', marker: 'mindanao', note: 'Taking shape in General Santos.' },
];

export const globalMarkers: Record<string, { x: number; y: number }> = {
  vancouver: { x: 15.8, y: 22.62 },
  'san-fernando': { x: 83.42, y: 40.77 },
  bombay: { x: 70.23, y: 39.4 },
  jerusalem: { x: 59.78, y: 32.35 },
  luzon: { x: 83.61, y: 41.89 },
  visayas: { x: 84.44, y: 43.89 },
  mindanao: { x: 84.75, y: 46.17 },
};

export type Officer = {
  name: string;
  role: string;
  note?: string;
  open?: boolean;
  /* Portrait path, e.g. '/images/officers/yel-romero.webp'.
     Until a photo is supplied the card falls back to the officer's initials. */
  photo?: string;
  photoAlt?: string;
};

export type OfficerGroup = { id: string; title: string; caption: string; officers: Officer[] };

export const officerGroups: OfficerGroup[] = [
  {
    id: 'senior',
    title: 'Senior club officers',
    caption: 'The seven officers who steer the club.',
    officers: [
      { name: 'Yel Romero', role: 'Club President' },
      { name: 'Elito Batulan', role: 'Club Vice President' },
      { name: 'Ricky Shetty', role: 'Master of Ceremonies' },
      /* The remaining senior officers are placeholders until the club sends the
         names, roles and photos. Replace these five entries with the real
         officers; add `photo: '/images/officers/<file>.webp'` to each. */
      { name: 'Officer', role: 'To be confirmed', open: true },
      { name: 'Officer', role: 'To be confirmed', open: true },
      { name: 'Officer', role: 'To be confirmed', open: true },
      { name: 'Officer', role: 'To be confirmed', open: true },
    ],
  },
  {
    id: 'junior',
    title: 'Junior club officers',
    caption: 'The kids’ own cabinet — the same offices, elected from the Kiddies Division.',
    officers: [
      { name: 'Ryan Shetty', role: 'President' },
      { name: 'Daniel Allan', role: 'Vice President', note: 'Tournament Director' },
      { name: 'Ymer Cargamento', role: 'Secretary', note: 'Isaac' },
      { name: 'Rianne Shetty', role: 'Public Relations Officer', note: 'Official video editor' },
      { name: 'Renzo Shetty', role: 'Treasurer' },
      { name: 'Auditor', role: 'Seat open', open: true },
    ],
  },
];

/* The working team behind the club — the people who build, document and run it.
   Add `photo: '/images/team/<file>.webp'` when portraits are supplied. */
export type TeamMember = { name: string; role: string; photo?: string; photoAlt?: string };

export const team: TeamMember[] = [
  { name: 'Ram', role: 'Website & App Developer' },
  { name: 'Bryce', role: 'Chess United VA' },
  { name: 'Marck', role: 'Chess United Drone Pilot' },
  { name: 'Noel', role: 'Chess United Photographer' },
  { name: 'Vee', role: 'Chess United Videographer' },
];


export const formatPeso = (amount: number) =>
  '₱' + amount.toLocaleString('en-PH');

export const mapsUrl = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
