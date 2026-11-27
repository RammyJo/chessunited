# General club registration

The owner confirmed that the redesign replaces the general Membership signup and that only the Registration Sheet tab should be reset. Orders and payment records must remain.

The form collects full name, age calculated from date of birth, birth date, barangay, city and province, chess club, level, FIDE or Chess.com ranking (or Unrated), tournaments played from 0 through 100+, and guest count and names. These ten logical areas occupy twelve Sheet columns because city/province and guest count/names are separate columns. New registrations receive an acknowledgement with no membership number, card or payment request.

New records are durable in D1 `club_registrations`, private in the officer dashboard, and mirrored with RAW values into the existing spreadsheet's `Registrations` tab. An identity hash and submission retry token prevent duplicate submissions; neither is displayed or mirrored. Birth date and guest validation run on the server. Anonymous GET cannot list registrations.

## One-time Sheet reset

Migration 0009 is additive and defaults to disabled. Once the updated backend is deployed, the operator enables the redesign and privately sets `club_registration_setup.reset_requested=1`. No public request can set this flag. The existing scheduled Sheets worker services the request under its shared sync lease.

Before clearing the original tab, the worker duplicates the old `Registrations` Sheet to `Tournament Entries` and verifies all copied values. A conflicting existing backup blocks the reset. It clears only the original tab's values, validation and notes, writes and verifies the new twelve-column header, verifies no old rows remain, and records completion. The original Sheet ID and spreadsheet link remain. Completed resets never run again, including after a lost signup response. Subsequent writes verify headers and existing row contents and read back the result before marking it synced.

Legacy tournament payment synchronization moves to `Tournament Entries`. Orders, Memberships, source customer records and payment states are retained. Existing private member-card links redirect to `/membership/card/`, which remains private, noindex and outside the sitemap. Old signup POSTs stop issuing numbers after activation.

Tests cover validated fields, private acknowledgement, concurrent and lost-response retries, real local Workers/D1 storage, exact Sheet columns, RAW input, financial preservation and conflicting backups. Browser checks exercise phone, tablet and desktop widths without adding fake production registrations.
