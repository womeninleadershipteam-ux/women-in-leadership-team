import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Calendar, Sparkles } from 'lucide-react';
import { SiteLayout } from '@/components/site-layout';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSettings } from '@/lib/use-site-settings';
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
      const { data } = await supabase
        .from('speakers')
        .select('*')
        .eq('featured', true)
        .order('display_order', { ascending: true })
        .limit(4);
      return data ?? [];
    },
  });
}

function HomePage() {
  const { data: settings } = useSiteSettings();
  const { data: upcoming } = useUpcomingEvent();
  const { data: speakers } = useFeaturedSpeakers();

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 pt-16 pb-24 md:grid-cols-2 md:gap-16 md:pt-24 md:pb-32">
          <div className="flex flex-col justify-center wil-rise">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-purple/30 bg-brand-purple/5 px-4 py-1.5 text-xs uppercase tracking-widest text-brand-purple">
              <Sparkles size={12} /> A community-led movement
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
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
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
                <Calendar size={14} /> Next event
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
            {upcoming.registration_url ? (
              <a
                href={upcoming.registration_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-brand-ink px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Register now <ArrowRight size={16} />
              </a>
            ) : (
              <Link
                to="/events"
                className="inline-flex items-center gap-2 rounded-full bg-brand-ink px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Learn more <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Mission */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-brand-purple">Our mission</p>
        <p className="mt-6 font-serif text-3xl leading-relaxed text-brand-ink md:text-4xl">
          We're building rooms where ambition feels at home — where women across industries
          share what they've learned, ask what they don't know, and leave with people in
          their corner.
        </p>
      </section>

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
    </SiteLayout>
  );
}