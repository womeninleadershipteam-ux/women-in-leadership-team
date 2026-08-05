import { createFileRoute, Link, notFound, redirect } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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
  loader: async ({ params }) => {
    const { data } = await supabase
      .from('events')
      .select('id, title, description')
      .eq('slug', params.slug)
      .maybeSingle();
    if (!data) throw notFound();
    return { id: data.id, title: data.title as string, description: (data.description as string | null) ?? null };
  },
  component: EventDetailPage,
  head: ({ loaderData, params }) => {
    const title = loaderData?.title
      ? `${loaderData.title} — Women in Leadership`
      : 'Event — Women in Leadership';
    const description =
      loaderData?.description?.slice(0, 155) ?? 'Event details, speakers, and registration.';
    const url = `https://women-in-leadership-team.lovable.app/events/${params.slug}`;
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'article' },
        { property: 'og:url', content: url },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      links: [{ rel: 'canonical', href: url }],
    };
  },
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
  const { id } = Route.useLoaderData();
  const [flyerOpen, setFlyerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();
  const { data: ev, isLoading } = useQuery({
    queryKey: ['event', slug],
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: related } = useQuery({
    queryKey: ['events', 'related', ev?.id],
    enabled: !!ev?.id,
    refetchOnMount: 'always',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id,slug,title,event_date,image_url,status,location')
        .neq('id', ev!.id)
        .order('event_date', { ascending: false })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: eventSpeakers } = useQuery({
    queryKey: ['event-speakers', ev?.id],
    enabled: !!ev?.id,
    refetchOnMount: 'always',
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('event_speakers')
        .select('id, slug, name, title, bio, photo_url, social_url, gender')
        .eq('event_id', ev!.id)
        .order('display_order');
      if (error) throw error;
      return (data ?? []) as {
        id: string;
        slug: string;
        name: string;
        title: string | null;
        bio: string | null;
        photo_url: string | null;
        social_url: string | null;
        gender: string | null;
      }[];
    },
  });

  useEffect(() => {
    if (!ev) return;
    queryClient.setQueryData(['events', 'all'], (old: any[] | undefined) => {
      if (!old?.length) return old;
      return old.map((item) => (item.id === ev.id ? { ...item, ...ev } : item));
    });
  }, [ev, queryClient]);

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
  const recordingUrl = (ev as any).recording_url as string | null | undefined;

  const shareEvent = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: ev.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* user dismissed share sheet */
    }
  };

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
          {/* Flyer — scaled down to preserve original aspect, clickable for full view */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setFlyerOpen(true)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl bg-brand-sand p-3 shadow-xl ring-1 ring-border/40 focus:outline-none focus:ring-2 focus:ring-brand-purple"
              aria-label="View event flyer in full size"
            >
              <div className="mx-auto max-w-[260px]">
                {ev.image_url ? (
                  <img
                    src={ev.image_url}
                    alt={`${ev.title} flyer`}
                    className="block h-auto max-h-[380px] w-auto max-w-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex aspect-square h-full w-full items-center justify-center font-display text-6xl text-brand-clay/40">
                    WIL
                  </div>
                )}
              </div>
              <div className="pointer-events-none absolute inset-0 flex items-start justify-end p-3 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="rounded-full bg-brand-ink/70 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
                  <i className="bx bx-fullscreen" /> Click to expand
                </span>
              </div>
            </button>
          </div>

          {/* Flyer lightbox */}
          {flyerOpen && ev.image_url && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/90 p-4 backdrop-blur-sm"
              onClick={() => setFlyerOpen(false)}
              role="dialog"
              aria-modal="true"
              aria-label="Event flyer full view"
            >
              <button
                type="button"
                onClick={() => setFlyerOpen(false)}
                className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Close flyer"
              >
                <i className="bx bx-x text-2xl" />
              </button>
              <img
                src={ev.image_url}
                alt={`${ev.title} flyer full view`}
                className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
              <a
                href={ev.image_url}
                download={`${ev.slug ?? 'event'}-flyer`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-6 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-brand-ink shadow-lg hover:bg-white/90"
              >
                <i className="bx bx-download text-lg" /> Download flyer
              </a>
            </div>
          )}

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
                              <Link
                                to="/speakers/$slug"
                                params={{ slug: s.slug }}
                                className="flex items-center gap-3 hover:text-brand-purple"
                              >
                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-brand-sand">
                                  <img src={speakerPhotoUrl(s)} alt={s.name} className="h-full w-full object-cover" loading="lazy" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-brand-ink">{s.name}</p>
                                  {s.title && <p className="truncate text-xs text-brand-ink/60">{s.title}</p>}
                                </div>
                              </Link>
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
      params={{ slug: ev.slug }}
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