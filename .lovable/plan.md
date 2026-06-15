## What this delivers

A focused batch covering everything except the live newsletter send (which needs a provider — see "Next turn").

### 1. Logo fix
- `src/components/wil-logo.tsx` — `.png` import returns a URL string, not an object. Replace `logoAsset.url` with `logoAsset`. Keep `wil-logo.png`.

### 2. Slug-based URLs for events and speakers
- New migration: add `slug TEXT UNIQUE` to `public.events` and `public.event_speakers`; backfill from titles/names; trigger to auto-generate on insert if empty; collision-safe (`-2`, `-3`).
- New routes:
  - `src/routes/events.$slug.tsx` — event detail by slug (move logic out of `events.$eventId.tsx`).
  - `src/routes/speakers.$slug.tsx` — new speaker detail page.
- Keep `events.$eventId.tsx` as a redirect: if the param is a UUID, look up the slug and `redirect` to `/events/$slug`; otherwise treat the param as a slug.
- Update every internal `<Link to="/events/$eventId" params={{ eventId }}>` → `to="/events/$slug" params={{ slug }}`.
- Speaker cards on `/speakers` become clickable `<Link>` to `/speakers/$slug`.

### 3. Speaker detail page (`/speakers/$slug`)
- Hero with rounded portrait, name, role, bio.
- Multi-link contact block: email, website, LinkedIn, X/Twitter, Instagram, etc.
- "Events they spoke at" list, linking to event detail pages.
- SEO `head()` with name + role.

### 4. Speaker image rules
- `event_speakers`: drop ratio choice; force 1:1 in `ImageUploadField`.
- Admin speaker block: remove the aspect-ratio dropdown, add an inline warning "Upload a square (1:1) image; non-square uploads are center-cropped."
- All speaker `<img>` usages get `rounded-full` + `aspect-square object-cover`.

### 5. Gender placeholders for missing speaker photos
- Migration: add `gender TEXT CHECK (gender IN ('female','male','unspecified')) DEFAULT 'female'` to `event_speakers`.
- Generate two placeholder assets (`speaker-placeholder-female.png`, `speaker-placeholder-male.png`) via `imagegen`, upload through `lovable-assets`.
- Helper `speakerPhotoUrl(s)` picks photo → gender placeholder → neutral fallback. Used by cards and detail page.
- Admin form: add gender select next to the photo upload.

### 6. Newsletter / blast composer in admin (UI + draft persistence, no live send yet)
- New `Newsletters` tab in `/admin`.
- Composer:
  - Subject, preview text.
  - Rich text editor (Tiptap — already-clean React/TS lib; bold, italic, headings, lists, links, blockquote, horizontal rule, image insert from upload, alignment, text color from brand palette).
  - Inline images uploaded to a new public `newsletter-images` bucket.
  - Live HTML preview pane (desktop + mobile toggle).
- Audience selector:
  - "All subscribers" or pick individuals (searchable multi-select, shows email + parsed first name).
  - Subscriber count badge.
- Drafts:
  - New table `public.newsletter_drafts` (admin-only) so drafts persist across devices/refresh (replacing the localStorage-only flow for this surface).
- "Send" button is present but disabled with tooltip "Connect Resend to enable sending" until the provider is wired.

### 7. First-name backfill (review screen)
- New admin tool "Backfill subscriber names":
  - Parses local-part of email (`jane.doe+news@x.com` → `Jane`, strips `+tag`, splits on `.`/`_`/`-`, capitalizes, drops digit-only or mailbox-y locals like `info`, `hello`, `team`, `admin`, `contact`, `support` → fallback `Friend`).
  - Renders a table: email | guessed name | editable input | include checkbox.
  - On "Save selected", writes to `newsletter_subscribers.first_name` (new column).
- Migration: add `first_name TEXT` to `newsletter_subscribers`.

### Next turn (after you confirm)
- Pick a provider (recommend **Resend** for its Broadcasts + Audiences API).
- I'll connect via the Lovable Resend connector, add a server function `sendNewsletter` that syncs the chosen audience to Resend and creates+sends a broadcast, and flip the send button on.

### Technical notes
- All new public-schema tables get `GRANT` + RLS scoped to `has_role(auth.uid(), 'admin')`.
- Slug trigger uses `regexp_replace(lower(...), '[^a-z0-9]+', '-', 'g')` and a uniqueness loop.
- Tiptap deps: `@tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image @tiptap/extension-text-align @tiptap/extension-color @tiptap/extension-text-style`.
