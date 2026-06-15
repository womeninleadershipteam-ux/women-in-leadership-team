import { createFileRoute, Link, notFound, redirect } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { SiteLayout } from '@/components/site-layout';
import { supabase } from '@/integrations/supabase/client';
import { speakerPhotoUrl } from '@/lib/speaker-placeholder';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute('/events/$slug')({
  // Old UUID-style URLs (and admin/editor links) redirect to the slug URL.
  beforeLoad: async ({ params }) => {
    if (UUID_RE.test(params.slug)) {
      const { data } = await supabase.from('events').select('slug').eq('id', params.slug).maybeSingle();
      if (data?.slug) throw redirect({ to: '/events/$slug', params: { slug: data.slug }, replace: true });
    }
  },
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
  const { slug } = Route.useParams();
  const { data: ev, isLoading } = useQuery({
    queryKey: ['event', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: related } = useQuery({
    queryKey: ['events', 'related', ev?.id],
    enabled: !!ev?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('id,slug,title,event_date,image_url,status,location')
        .neq('id', ev!.id)
        .order('event_date', { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  const { data: eventSpeakers } = useQuery({
    queryKey: ['event-speakers', ev?.id],
    enabled: !!ev?.id,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('event_speakers')
        .select('id, slug, name, title, photo_url, social_url, gender')
        .eq('event_id', ev!.id)
        .order('display_order');
      return (data ?? []) as {
        id: string;
        slug: string;
        name: string;
        title: string | null;
        photo_url: string | null;
        social_url: string | null;
        gender: string | null;
      }[];
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
  const fallbackSpeakers = (ev.speakers ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const hasStructuredSpeakers = (eventSpeakers?.length ?? 0) > 0;
  const isPast = ev.status === 'past';
  const theme = (ev as any).theme as string | null | undefined;
  const topic = (ev as any).topic as string | null | undefined;
  const upcomingRelated = (related ?? []).filter((r) => r.status === 'upcoming');
  const pastRelated = (related ?? []).filter((r) => r.status === 'past');

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
              {theme ? <span className="ml-2 text-brand-ink/40">— {theme}</span> : null}
            </p>
            <h1 className="mt-3 font-display text-4xl leading-tight text-brand-ink md:text-5xl">
              {ev.title}
            </h1>
            {topic && (
              <p className="mt-3 font-serif text-xl italic text-brand-ink/70">{topic}</p>
            )}

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
              {(hasStructuredSpeakers || fallbackSpeakers.length > 0) && (
                <div className="flex items-start gap-3">
                  <i className="bx bx-microphone mt-0.5 text-xl text-brand-purple" />
                  <div>
                    <dt className="text-xs uppercase tracking-widest text-brand-ink/50">
                      Speakers
                    </dt>
                    <dd>
                      {hasStructuredSpeakers ? (
                        <ul className="mt-2 space-y-3">
                          {eventSpeakers!.map((s) => (
                            <li key={s.id} className="flex items-center gap-3">
                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-brand-sand">
                                {s.photo_url ? (
                                  <img src={s.photo_url} alt={s.name} className="h-full w-full object-cover" loading="lazy" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center font-display text-sm text-brand-clay/50">
                                    {s.name.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                {s.social_url ? (
                                  <a
                                    href={s.social_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-medium text-brand-ink hover:text-brand-purple"
                                  >
                                    {s.name}
                                  </a>
                                ) : (
                                  <p className="font-medium text-brand-ink">{s.name}</p>
                                )}
                                {s.title && <p className="truncate text-xs text-brand-ink/60">{s.title}</p>}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <ul className="mt-1 space-y-1">
                          {fallbackSpeakers.map((name) => (
                            <li key={name} className="font-medium text-brand-ink">
                              {name}
                            </li>
                          ))}
                        </ul>
                      )}
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

      {(upcomingRelated.length > 0 || pastRelated.length > 0) && (
        <section className="border-t border-border/40 bg-brand-sand/30">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-2xl text-brand-ink md:text-3xl">More events</h2>
              <Link to="/events" className="text-sm text-brand-purple hover:underline">
                View all <i className="bx bx-right-arrow-alt align-middle" />
              </Link>
            </div>

            {upcomingRelated.length > 0 && (
              <div className="mt-8">
                <p className="text-xs uppercase tracking-[0.25em] text-brand-purple">Upcoming</p>
                <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {upcomingRelated.map((r) => (
                    <RelatedCard key={r.id} ev={r} />
                  ))}
                </div>
              </div>
            )}

            {pastRelated.length > 0 && (
              <div className="mt-10">
                <p className="text-xs uppercase tracking-[0.25em] text-brand-ink/50">Past</p>
                <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {pastRelated.map((r) => (
                    <RelatedCard key={r.id} ev={r} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </SiteLayout>
  );
}

function RelatedCard({ ev }: { ev: any }) {
  const date = new Date(ev.event_date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return (
    <Link
      to="/events/$slug"
      params={{ slug: ev.id }}
      className="group flex gap-4 rounded-xl border border-border/50 bg-card p-3 transition-all hover:border-brand-purple/40 hover:shadow-md"
    >
      <div className="aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-brand-sand">
        {ev.image_url ? (
          <img
            src={ev.image_url}
            alt={ev.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-xl text-brand-clay/40">
            WIL
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 font-display text-base text-brand-ink group-hover:text-brand-purple">
          {ev.title}
        </h3>
        <p className="mt-1 text-xs text-brand-ink/60">
          <i className="bx bx-calendar align-middle" /> {date}
        </p>
        {ev.location && (
          <p className="mt-0.5 truncate text-xs text-brand-ink/50">
            <i className="bx bx-map align-middle" /> {ev.location}
          </p>
        )}
      </div>
    </Link>
  );
}