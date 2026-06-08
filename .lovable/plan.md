## Two things I need you to decide first

**1. "I don't want people logging in or creating an account" vs. an admin dashboard.**
You still need to log in yourself to manage events, speakers, the announcement bar, and the newsletter. Public users won't see a login link anywhere — but you (the admin) need a way in. I'll:

- Remove all login/signup CTAs from the public site (nav, footer, anywhere).
- Keep the `/auth` route working but hidden — you reach it by typing the URL.
- Disable public sign-ups entirely (only your bootstrapped admin account exists; no one can self-register).

Tell me if you want this, or if you'd rather I rip out auth completely (in which case I cannot give you an admin dashboard — content would only change via my edits).

**2. "Configure this website for Vercel."**
This template is built on TanStack Start targeting Cloudflare Workers (Lovable's hosting). Vercel is a different host with a different runtime. Switching means:

- Rewriting the Vite/Nitro deployment preset.
- The Lovable preview here will still work, but **Lovable's own publish flow will no longer be the path to production** — you'd deploy by pushing to GitHub and connecting Vercel.
- Lovable Cloud (your database/auth/emails) stays where it is — Vercel just hosts the frontend + server functions.

Tell me whether you actually want Vercel, or whether you meant "make it deployable without errors" (in which case I'll keep the current Lovable hosting, which is already Vercel-class and one click to publish).

---

## What I'll build (assuming "yes" to hidden admin + actually wanting Vercel)

### Phase 1 — Database & backend
- Add `newsletter_subscribers` table (email, created_at) + public insert policy.
- Add `announcement` columns to `site_settings`: `announcement_text`, `announcement_active` (bool).
- Bootstrap admin role for `womeninleadershipteam@gmail.com` (creates a placeholder auth user if it doesn't exist yet, then grants admin).
- Disable Supabase Auth public sign-ups (admin-create-user only).
- Set up Lovable Cloud email infrastructure + scaffold a transactional "new contact message" template that fires to `womeninleadershipteam@gmail.com` on form submit.

### Phase 2 — Branding & layout
- Drop `logo.svg` into the project as an asset; replace text logo in `SiteNav` and `SiteFooter`.
- Add boxicons via CDN in `__root.tsx` and swap lucide-react icons → boxicons across nav, footer, cards, hero badges.
- Change hero kicker "A community-led movement" → "W/ Maranatha Ovbiagele".
- Footer copy → `Copyright (c) {currentYear}, Women in Leadership.` with `{currentYear}` dynamic.
- Replace "Admin" footer link with "Made by TDG" → `https://wa.me/+2349065718162?text=...` (pre-filled message).
- Remove any visible auth links from nav/footer.

### Phase 3 — New features
- **Announcement bar** (`<AnnouncementBar>` in `SiteLayout`): pulls from `site_settings.announcement_text`; renders only when `announcement_active`; dismissible via `x` (state stored in localStorage by text hash, so a new announcement reappears); auto-marquee scroll when text exceeds ~80 chars.
- **Event detail pages** at `/events/$eventId.tsx`: 1:1 flyer, full description, date/location, speakers list, prominent custom "Register" button linking to `registration_url`. Cards on `/events` link here. SEO `head()` per event.
- **Flyer aspect ratio**: change `/events` card image from `16/10` → `1:1`.
- **Newsletter signup** component (email + submit) on `/` and `/events` writing to `newsletter_subscribers`.
- **About / Vision / Core Pillars** content from your flyer images, woven into the home page (About Us, Mission, Vision blocks) and the existing `/community` page (Target Audience + 4 Core Leadership Pillars).
- **Past event flyers** gallery section on home that appears once `events` with `status='past'` and `image_url` exist (1:1 thumbnails linking to detail pages).

### Phase 4 — Admin dashboard updates
- Add UI for managing: the announcement bar text + toggle, newsletter subscribers (read-only list + CSV export), and editing event flyer URLs (1:1).

### Phase 5 — Routing & cleanup
- Audit every route file, ensure `errorComponent` + `notFoundComponent`, add a root catch-all `$.tsx` for 404s.
- Per-route SEO `head()` (title + description + og tags) on every page.
- Remove the orphaned `reset-password.tsx` route if it was tied to public signup.
- Delete the now-unused `useAuth`/`use-is-admin` surface from public components (keep them only in `/admin` and `/auth`).

### Phase 6 — Vercel (only if you confirm)
- Switch the Nitro preset to `vercel-edge` (or `vercel` node, depending on your preference — edge is faster but stricter).
- Add `vercel.json` if needed for rewrites; ensure SPA-style routing works for deep links.
- Move all `process.env.*` reads into server-function handlers (already done in the template), confirm no Cloudflare-only APIs are referenced.
- Add a `.env.example` listing the required vars (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- Verify build passes locally.

---

## Technical notes
- Admin bootstrap SQL: looks up `auth.users` for the email; if found, inserts `('<uid>', 'admin')` into `user_roles`. If not, inserts an `auth.users` row via Supabase admin SQL with a temporary password reset link you'll use once.
- Announcement marquee uses a pure CSS `@keyframes` animation on overflow — no JS scroll library needed.
- Logo: imported as a real SVG (`?react` import) so it inherits text color where needed.
- Newsletter is single-table; if you want double opt-in or sending, that's a follow-up.

---

**Reply with:**
1. Hidden admin login: yes / rip out auth entirely
2. Vercel: yes (I'll do the migration) / no (keep Lovable hosting and just make sure publish is clean)

Once you answer those two, I'll execute the whole plan in one go.