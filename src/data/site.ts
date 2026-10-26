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
  nav: [
    { href: '/events/', label: 'Events' },
    { href: '/play/', label: 'Weekly play' },
    { href: '/gallery/', label: 'Gallery' },
    { href: '/shop/', label: 'Merchandise' },
    { href: '/about/', label: 'About' },
    { href: '/visit/', label: 'Visit' },
  ],
};

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

export type MerchItem = { name: string; price: number; note?: string };
export type MerchGroup = { name: string; blurb: string; items: MerchItem[] };

export const merch: MerchGroup[] = [
  {
    name: 'Apparel',
    blurb: 'Club colours for tournament day and everywhere else.',
    items: [
      { name: 'T-shirt', price: 300, note: 'medium only' },
      { name: 'Polo shirt', price: 400 },
      { name: 'Sublimation shirt', price: 600 },
      { name: 'Cap', price: 150 },
    ],
  },
  {
    name: 'Chess gear',
    blurb: 'The kit that earns its place in the bag.',
    items: [
      { name: 'Chess set', price: 800 },
      { name: 'Tumbler', price: 250 },
      { name: 'Mug', price: 120 },
      { name: 'Magic mug', price: 180 },
      { name: 'Mousepad', price: 100 },
      { name: 'Lanyard', price: 100 },
      { name: 'Member ID', price: 100 },
    ],
  },
  {
    name: 'Desk & study',
    blurb: 'For the player who studies the game away from the board.',
    items: [
      { name: 'Wall clock', price: 275 },
      { name: 'Table clock', price: 250 },
      { name: 'Notebook', price: 150 },
      { name: 'Pen', price: 50 },
    ],
  },
  {
    name: 'Small things',
    blurb: 'Pocket-sized club spirit.',
    items: [
      { name: 'Hand fan', price: 120 },
      { name: 'Pocket mirror', price: 75 },
      { name: 'Keychain', price: 50 },
      { name: 'Ref magnet', price: 50 },
      { name: 'Stickers', price: 5 },
    ],
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

export const team = [
  { name: 'Yel Romero', role: 'Club President' },
  { name: 'Elito Batulan', role: 'Club Vice President' },
  { name: 'Ricky Shetty', role: 'MC' },
];

export const formatPeso = (amount: number) =>
  '₱' + amount.toLocaleString('en-PH');

export const mapsUrl = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
