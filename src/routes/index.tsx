import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { SiteLayout } from '@/components/site-layout';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSettings } from '@/lib/use-site-settings';
import { NewsletterSignup } from '@/components/newsletter-signup';
import heroImg from '@/assets/hero.jpg';

export const Route = createFileRoute('/')({
  component: HomePage,
  head: () => ({
    meta: [
      { title: 'Women in Leadership — Lead, mentor, rise together' },
      {
        name: 'description',
        content:
          'Join a growing community of women shaping the future of leadership. Events, mentorship, and honest conversations.',
      },
    ],
  }),
});

function useUpcomingEvent() {
  return useQuery({
    queryKey: ['events', 'upcoming-one'],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'upcoming')
        .order('event_date', { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });
}

function useFeaturedSpeakers() {
  return useQuery({
    queryKey: ['speakers', 'featured'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('event_speakers')
        .select('id, name, title, photo_url, events!inner(event_date)')
        .order('created_at', { ascending: false })
        .limit(4);
      return (data ?? []) as { id: string; name: string; title: string | null; photo_url: string | null }[];
    },
  });
}

function usePastFlyers() {
  return useQuery({
    queryKey: ['events', 'past-flyers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('id, title, image_url, event_date')
        .eq('status', 'past')
        .not('image_url', 'is', null)
        .order('event_date', { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });
}

function HomePage() {
  const { data: settings } = useSiteSettings();
  const { data: upcoming } = useUpcomingEvent();
  const { data: speakers } = useFeaturedSpeakers();
  const { data: pastFlyers } = usePastFlyers();

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 pt-16 pb-24 md:grid-cols-2 md:gap-16 md:pt-24 md:pb-32">
          <div className="flex flex-col justify-center wil-rise">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-purple/30 bg-brand-purple/5 px-4 py-1.5 text-xs uppercase tracking-widest text-brand-purple">
              <i className="bx bxs-crown text-sm" /> W/ MARANTHA OVBIAGELE
            </span>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] text-brand-ink md:text-7xl">
              Lead with{' '}
              <span className="font-serif italic text-brand-purple">courage.</span>{' '}
              Rise together.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-brand-ink/70">
              {settings?.mission_statement ??
                'We bring women together to learn, lead, and lift each other up — through honest conversations, mentorship, and events that turn ambition into action.'}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/events"
                className="group inline-flex items-center gap-2 rounded-full bg-brand-purple px-6 py-3 text-sm font-medium text-white transition-all hover:gap-3 hover:opacity-90"
              >
                See upcoming events
                <i className="bx bx-right-arrow-alt text-lg transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/community"
                className="inline-flex items-center gap-2 rounded-full border border-brand-ink/20 px-6 py-3 text-sm font-medium text-brand-ink transition-colors hover:border-brand-purple hover:text-brand-purple"
              >
                Join the community
              </Link>
            </div>
          </div>

          <div className="relative wil-rise wil-rise-delay-2">
            <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-brand-sand shadow-2xl">
              <img
                src={heroImg}
                alt="Women in conversation at a Women in Leadership event"
                className="h-full w-full object-cover"
                width={1600}
                height={1100}
              />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl bg-brand-cream p-5 shadow-xl ring-1 ring-border/60 md:block">
              <p className="font-serif text-xl italic text-brand-ink">
                "I left every event a little braver."
              </p>
              <p className="mt-2 text-xs uppercase tracking-widest text-brand-ink/50">
                — Community member
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming event CTA */}
      {upcoming && (
        <section className="border-y border-border/40 bg-brand-sand/40 py-16">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-brand-purple">
                <i className="bx bx-calendar-event text-base" /> Next event
              </p>
              <h2 className="mt-3 font-display text-3xl text-brand-ink md:text-4xl">
                {upcoming.title}
              </h2>
              <p className="mt-2 text-brand-ink/70">
                {new Date(upcoming.event_date).toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {upcoming.location ? ` · ${upcoming.location}` : ''}
              </p>
            </div>
            <Link
              to="/events/$eventId"
              params={{ eventId: upcoming.id }}
              className="inline-flex items-center gap-2 rounded-full bg-brand-ink px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              View event <i className="bx bx-right-arrow-alt text-lg" />
            </Link>
          </div>
        </section>
      )}

      {/* About / Mission / Vision */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-purple">About us</p>
            <p className="mt-4 text-base leading-relaxed text-brand-ink/80">
              Women in Leadership is a transformational platform designed to equip,
              inspire, and empower young women, emerging leaders, professionals,
              entrepreneurs, and purpose-driven women to lead with confidence, influence,
              character, and impact — beyond titles or recognition.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-purple">Our mission</p>
            <p className="mt-4 font-serif text-xl leading-relaxed text-brand-ink">
              To equip and empower women with the mindset, confidence, leadership capacity,
              and emotional intelligence needed to lead effectively and create lasting
              impact.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-purple">Our vision</p>
            <p className="mt-4 font-serif text-xl leading-relaxed text-brand-ink">
              To raise purpose-driven women who lead with clarity, influence, excellence,
              and impact in their generation.
            </p>
          </div>
        </div>
      </section>

      {/* Core leadership pillars */}
      <section className="border-y border-border/40 bg-brand-sand/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs uppercase tracking-[0.25em] text-brand-purple">
            Core leadership pillars
          </p>
          <h2 className="mt-3 font-display text-3xl text-brand-ink md:text-4xl">
            What we build, in <span className="font-serif italic">every</span> session.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: 'bx-heart', t: 'Emotional intelligence', d: 'Lead yourself before you lead a room.' },
              { icon: 'bx-trending-up', t: 'Capacity building', d: 'Skills and structures that scale with you.' },
              { icon: 'bx-broadcast', t: 'Influence & impact', d: 'Move the needle in the spaces you already occupy.' },
              { icon: 'bx-buildings', t: 'Legacy & nation building', d: 'Lead today in a way tomorrow will thank you for.' },
            ].map((p) => (
              <div key={p.t} className="rounded-2xl border border-border/50 bg-card p-6">
                <i className={`bx ${p.icon} text-2xl text-brand-purple`} />
                <h3 className="mt-3 font-display text-lg text-brand-ink">{p.t}</h3>
                <p className="mt-1 text-sm text-brand-ink/70">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Past event flyers */}
      {pastFlyers && pastFlyers.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-brand-purple">
                Past events
              </p>
              <h2 className="mt-3 font-display text-3xl text-brand-ink md:text-4xl">
                The rooms we've built.
              </h2>
            </div>
            <Link to="/events" className="hidden text-sm text-brand-purple hover:underline md:inline">
              All events →
            </Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {pastFlyers.map((f) => (
              <Link
                key={f.id}
                to="/events/$eventId"
                params={{ eventId: f.id }}
                className="group block overflow-hidden rounded-2xl border border-border/50 bg-card"
              >
                <div className="aspect-square overflow-hidden bg-brand-sand">
                  <img
                    src={f.image_url!}
                    alt={f.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <p className="font-display text-base text-brand-ink">{f.title}</p>
                  <p className="mt-1 text-xs text-brand-ink/55">
                    {new Date(f.event_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured speakers */}
      {speakers && speakers.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-3xl text-brand-ink md:text-4xl">
              Voices in our community
            </h2>
            <Link
              to="/speakers"
              className="hidden text-sm text-brand-purple hover:underline md:inline"
            >
              All speakers →
            </Link>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {speakers.map((s) => (
              <div key={s.id} className="group">
                <div className="aspect-square overflow-hidden rounded-2xl bg-brand-sand">
                  {s.photo_url ? (
                    <img
                      src={s.photo_url}
                      alt={s.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display text-3xl text-brand-ink/30">
                      {s.name.charAt(0)}
                    </div>
                  )}
                </div>
                <p className="mt-4 font-display text-lg text-brand-ink">{s.name}</p>
                {s.title && (
                  <p className="text-sm text-brand-ink/60">{s.title}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-3xl border border-brand-purple/20 bg-brand-purple p-10 text-white md:p-16">
          <p className="text-xs uppercase tracking-[0.25em] text-white/70">Stay in the loop</p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl">
            Get event invites & updates.
          </h2>
          <p className="mt-3 max-w-xl text-white/80">
            One email when something matters — new event drops, speaker reveals, and
            community moments. No spam, ever.
          </p>
          <div className="mt-8">
            <NewsletterSignup source="home" variant="dark" />
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}