# Elyu chess archive — 25 November 2026

The club requested a permanent archive of present and past La Union chess
events, starting with Chess United 1.0, 2.0 and 3.0. The owner explicitly
confirmed that **3.0 is the 12 December 2026 SM City La Union tournament**.
Its old `super-mario-cup` data/API key, index fragment and calendar UID remain
valid. The display name and calendar summary now use Tournament 3.0. Entry
fees and divisions remain pending; the server still rejects stale entries.

## Records and permanence

`src/data/event-archive.ts` combines the club’s existing events with
`regional-events.mjs`. Every record gets `/events/<slug>/`, which stays built
and indexed after the date passes. The index keeps the older fragment IDs,
including `super-mario-cup` and the Tournament 1.0 results link. All published
Tournament 1.0 standings and result posters are on its permanent page.

Dates are civil dates in Asia/Manila. An event remains in Present Events through
its final day, then moves to Past Events. Browser classification refreshes on
load, return to the page and while an open tab crosses the date boundary. It
moves the existing card; it never deletes a record or changes its permanent URL.
The static HTML also contains every record and link for visitors without JS.

The initial archive contains eight tournaments and one coaching visit; one of
the tournaments is the existing Manila away event and is labelled accordingly.
Add new verified poster records without deleting historical ones. Do not claim
that these initial records exhaust every tournament ever held in La Union.

## New sources

All nine files in `chessunited 2.zip` are preserved with hashes in
`uploads-2026-11-25/manifest.json` and unmodified originals in `raw/`.

- People’s City Chess Championships: ABC Hall, 28–29 November 2026. The poster’s
  `https://forms.gle/38Pwf7ntJspA37sJ6` resolves to an organiser’s Google Form.
- Agkaysa Cup: Conference Hall 2, Aringay, 30 November 2026; rapid 15 minutes +
  3 seconds delay. Contact Blair S. Herjuela using the poster’s public number.
- Elyu Open and Kiddies: Manna Mall, second floor, 6 December 2026; Central La
  Union Chess Knights, Inc. The poster lists rapid FIDE-rated, seven rounds,
  15 minutes + 3 seconds delay. Prizes and public contact numbers are from it.
- First La Union Chessmate Showdown: the supplied poster says **6 December
  2025**, so it belongs in Past Events. Do not silently change it to 2026.
- Coach Henry Calacday: the owner announced a visit from Rizal to La Union
  this weekend, 28–29 November 2026, for Chess United kids, teens and youth.
  The exact local session time, venue and fee were not supplied. His uploaded
  online-class poster is separately labelled and expandable; its online class
  times and fees do not define the local coaching visit.

Regional registrations go directly to the organiser’s source form or public
contacts. They do not use Chess United’s payment API or copy its entry prices.
Calendar files reserve the correct civil days without inventing start times.

## Sponsors

The four missing original logos are Jollibee, Rang-Ay Bank, SMART and Grab.
Homepage, About and Partners all display those originals. Shell is the sole
Fuel partner; Anytime Fitness is the sole Fitness partner at Exclusive Level.
They are removed from the general supporter category to avoid repeating their
current placement. Existing source artwork is retained.

The homepage also shows the major King/Queen tournament supporters as names,
without fabricating missing artwork or duplicating the current exclusive cards.
The previous instruction excluding Robinsons from sponsor listings remains in
effect. Original posters and actual venues of past tournaments remain historical
event records; do not relabel old events as current SM tournaments.
