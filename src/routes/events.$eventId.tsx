import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { SiteLayout } from '@/components/site-layout';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/events/$eventId')({
  component: EventDetailPage,
  head: () => ({
    meta: [
      { title: 'Event — Women in Leadership' },
      {
        name: 'description',
        content: 'Event details, speakers, and registration.',
      },
    ],
  }),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-4xl text-brand-ink">Event not found</h1>
        <p className="mt-3 text-brand-ink/60">
          We couldn't find that event. It may have been removed.
        </p>
        <Link
          to="/events"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-purple px-5 py-2.5 text-sm text-white"
        >
          <i className="bx bx-left-arrow-alt text-lg" /> Back to events
        </Link>
      </div>
    </SiteLayout>
  ),
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl text-brand-ink">Something went wrong</h1>
        <p className="mt-3 text-sm text-brand-ink/60">{error.message}</p>
      </div>
    </SiteLayout>
  ),
});

function EventDetailPage() {
  const { eventId } = Route.useParams();
  const { data: ev, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-4xl px-6 py-24 text-brand-ink/50">Loading…</div>
      </SiteLayout>
    );
  }

  if (!ev) throw notFound();

  const date = new Date(ev.event_date);
  const dateStr = date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const speakers = (ev.speakers ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const isPast = ev.status === 'past';

  return (
    <SiteLayout>
      <article className="mx-auto max-w-5xl px-6 pt-12 pb-24 md:pt-20">
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-sm text-brand-ink/60 hover:text-brand-purple"
        >
          <i className="bx bx-left-arrow-alt text-base" /> All events
        </Link>

        <div className="mt-8 grid gap-12 md:grid-cols-[1fr,1.2fr] md:items-start">
          {/* Flyer 1:1 */}
          <div className="aspect-square overflow-hidden rounded-2xl bg-brand-sand shadow-xl ring-1 ring-border/40">
            {ev.image_url ? (
              <img
                src={ev.image_url}
                alt={`${ev.title} flyer`}
                className="h-full w-full object-cover"
                width={1200}
                height={1200}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-6xl text-brand-clay/40">
                WIL
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-purple">
              {isPast ? 'Past event' : 'Upcoming event'}
            </p>
            <h1 className="mt-3 font-display text-4xl leading-tight text-brand-ink md:text-5xl">
              {ev.title}
            </h1>

            <dl className="mt-6 grid gap-4 text-sm">
              <div className="flex items-start gap-3">
                <i className="bx bx-calendar-event mt-0.5 text-xl text-brand-purple" />
                <div>
                  <dt className="text-xs uppercase tracking-widest text-brand-ink/50">Date</dt>
                  <dd className="font-medium text-brand-ink">{dateStr}</dd>
                  <dd className="text-brand-ink/60">{timeStr}</dd>
                </div>
              </div>
              {ev.location && (
                <div className="flex items-start gap-3">
                  <i className="bx bx-map mt-0.5 text-xl text-brand-purple" />
                  <div>
                    <dt className="text-xs uppercase tracking-widest text-brand-ink/50">Location</dt>
                    <dd className="font-medium text-brand-ink">{ev.location}</dd>
                  </div>
                </div>
              )}
              {speakers.length > 0 && (
                <div className="flex items-start gap-3">
                  <i className="bx bx-microphone mt-0.5 text-xl text-brand-purple" />
                  <div>
                    <dt className="text-xs uppercase tracking-widest text-brand-ink/50">
                      Speakers
                    </dt>
                    <dd>
                      <ul className="mt-1 space-y-1">
                        {speakers.map((name) => (
                          <li key={name} className="font-medium text-brand-ink">
                            {name}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                </div>
              )}
            </dl>

            {ev.description && (
              <div className="mt-8 border-t border-border/50 pt-8">
                <h2 className="font-display text-xl text-brand-ink">About this event</h2>
                <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-brand-ink/80">
                  {ev.description}
                </p>
              </div>
            )}

            {/* Register CTA */}
            <div className="mt-10">
              {ev.registration_url && !isPast ? (
                <a
                  href={ev.registration_url}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-3 rounded-full bg-brand-purple px-8 py-4 text-base font-semibold text-white shadow-lg shadow-brand-purple/20 transition-all hover:gap-4 hover:opacity-90"
                >
                  <i className="bx bx-calendar-check text-xl" />
                  Register for this event
                  <i className="bx bx-right-arrow-alt text-xl transition-transform group-hover:translate-x-0.5" />
                </a>
              ) : isPast && ev.registration_url ? (
                <a
                  href={ev.registration_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-brand-ink/20 px-6 py-3 text-sm text-brand-ink hover:border-brand-purple hover:text-brand-purple"
                >
                  <i className="bx bx-play-circle text-lg" /> Event recap
                </a>
              ) : !isPast ? (
                <p className="text-sm text-brand-ink/60">
                  Registration link coming soon — join our WhatsApp to be first to know.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </article>
    </SiteLayout>
  );
}