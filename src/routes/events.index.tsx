import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { SiteLayout } from '@/components/site-layout';
import { supabase } from '@/integrations/supabase/client';
import { NewsletterSignup } from '@/components/newsletter-signup';

export const Route = createFileRoute('/events/')({
  component: EventsPage,
  head: () => ({
    meta: [
      { title: 'Events — Women in Leadership' },
      {
        name: 'description',
        content:
          'Upcoming and past events from the Women in Leadership community. Workshops, panels, and conversations that move careers forward.',
      },
    ],
  }),
});

function useEvents() {
  return useQuery({
    queryKey: ['events', 'all'],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });
      return data ?? [];
    },
  });
}

function EventCard({ ev }: { ev: any }) {
  const dateStr = new Date(ev.event_date).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  return (
    <Link
      to="/events/$slug"
      params={{ slug: ev.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card transition-all hover:border-brand-purple/40 hover:shadow-lg"
    >
      <div className="aspect-square overflow-hidden bg-brand-sand">
        {ev.image_url ? (
          <img
            src={ev.image_url}
            alt={ev.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-4xl text-brand-clay/40">
            WIL
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-brand-purple">
          <span>{ev.status === 'past' ? 'Past event' : 'Upcoming'}</span>
        </div>
        <h3 className="mt-3 font-display text-2xl text-brand-ink">{ev.title}</h3>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-brand-ink/60">
          <span className="inline-flex items-center gap-1.5">
            <i className="bx bx-calendar text-base" /> {dateStr}
          </span>
          {ev.location && (
            <span className="inline-flex items-center gap-1.5">
              <i className="bx bx-map text-base" /> {ev.location}
            </span>
          )}
        </div>
        {ev.description && (
          <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-brand-ink/70">
            {ev.description}
          </p>
        )}
        {ev.speakers && (
          <p className="mt-4 text-xs uppercase tracking-widest text-brand-ink/50">
            Speakers: <span className="normal-case tracking-normal text-brand-ink/70">{ev.speakers}</span>
          </p>
        )}
        <div className="mt-auto pt-6">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-purple">
            View details <i className="bx bx-right-arrow-alt text-lg" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function EventsPage() {
  const { data: events, isLoading } = useEvents();
  const upcoming = (events ?? []).filter((e) => e.status === 'upcoming');
  const past = (events ?? []).filter((e) => e.status === 'past');

  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-12 md:pt-24">
        <p className="text-xs uppercase tracking-[0.25em] text-brand-purple">Events</p>
        <h1 className="mt-4 font-display text-5xl text-brand-ink md:text-6xl">
          Where the work <span className="font-serif italic">happens.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-brand-ink/70">
          Intimate panels, hands-on workshops, and big conversations. Every event is built
          to send you home with new ideas, new contacts, and a little more courage.
        </p>
      </section>

      {isLoading ? (
        <div className="mx-auto max-w-6xl px-6 py-12 text-brand-ink/50">Loading events…</div>
      ) : (
        <>
          <section className="mx-auto max-w-6xl px-6 pb-20">
            <h2 className="font-display text-2xl text-brand-ink">Upcoming</h2>
            {upcoming.length === 0 ? (
              <p className="mt-6 rounded-2xl border border-dashed border-border bg-brand-sand/30 p-8 text-center text-brand-ink/60">
                No upcoming events scheduled. Join our WhatsApp to be the first to know.
              </p>
            ) : (
              <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((e) => (
                  <EventCard key={e.id} ev={e} />
                ))}
              </div>
            )}
          </section>

          {past.length > 0 && (
            <section className="mx-auto max-w-6xl px-6 pb-24">
              <h2 className="font-display text-2xl text-brand-ink">Past events</h2>
              <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {past.map((e) => (
                  <EventCard key={e.id} ev={e} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Newsletter */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-3xl border border-border/60 bg-card p-10 md:p-14">
          <p className="text-xs uppercase tracking-[0.25em] text-brand-purple">
            Never miss the next one
          </p>
          <h2 className="mt-3 font-display text-2xl text-brand-ink md:text-3xl">
            Be first to hear about new events.
          </h2>
          <div className="mt-6">
            <NewsletterSignup source="events" />
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}