import { events, type Event } from './site';
import { regionalEvents } from './regional-events.mjs';
import artwork from './november-25-images.json';
import november26Artwork from './november-26-images.json';
import { eventPhase, manilaToday } from '../lib/event-dates.mjs';

type Artwork = { src: string; srcset?: string; width: number; height: number; alt: string };
export type ArchivedEvent = {
  slug: string; legacySlug?: string; name: string; shortName: string;
  kind: string; scope: string; date: string; endDate: string; dateLabel: string;
  venue: string; locality: string; region: string; description: string;
  organizer?: string; venuePending?: boolean; format?: string; categories?: string;
  registrationUrl?: string; contacts?: { name: string; phone: string }[];
  prizes?: string; poster?: Artwork; profileImage?: Artwork; profilePoster?: Artwork; clubEvent?: Event;
  ics?: string;
};

const clubEvents: ArchivedEvent[] = events.map(event => ({
  slug: event.slug === 'super-mario-cup' ? 'tournament-3-0' : event.slug,
  legacySlug: event.slug,
  name: event.name, shortName: event.shortName, kind: 'Tournament',
  scope: event.city === 'Manila' ? 'Club away event' : 'Elyu',
  date: event.date, endDate: event.date, dateLabel: event.dateLabel,
  venue: event.venue, locality: event.city ?? 'San Fernando City', region: event.region ?? 'La Union',
  venuePending: event.venuePending, organizer: 'Chess United',
  description: event.note ?? `${event.name} at ${event.venue}.`,
  poster: event.poster ? { src: event.poster, width: event.posterWidth ?? 900, height: event.posterHeight ?? 675, alt: `Original poster for ${event.name}` } : undefined,
  clubEvent: event, ics: event.ics,
}));

export const eventArchive: ArchivedEvent[] = [
  ...clubEvents,
  ...regionalEvents.map(record => ({
    ...record,
    profileImage: record.slug === 'coach-henry-youth-visit-2026' ? november26Artwork['coach-henry-champion'] : undefined,
    poster: 'posterKey' in record && record.posterKey ? artwork[record.posterKey as keyof typeof artwork] : undefined,
    profilePoster: 'profilePosterKey' in record && record.profilePosterKey ? artwork[record.profilePosterKey as keyof typeof artwork] : undefined,
    ics: record.date >= '2026-11-25' ? `/calendar/${record.slug}.ics` : undefined,
  })),
];
export const archiveToday = manilaToday();
export const presentEvents = eventArchive.filter(e => eventPhase(e, archiveToday) === 'present').sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
export const pastEvents = eventArchive.filter(e => eventPhase(e, archiveToday) === 'past').sort((a, b) => b.date.localeCompare(a.date));
export const homeEvents = presentEvents.filter(e => e.scope === 'Elyu' && e.kind === 'Tournament');
export const coachingVisit = eventArchive.find(e => e.slug === 'coach-henry-youth-visit-2026')!;
export const eventPath = (event: ArchivedEvent) => `/events/${event.slug}/`;
