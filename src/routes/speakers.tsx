import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { SiteLayout } from '@/components/site-layout';
import { supabase } from '@/integrations/supabase/client';
import { speakerPhotoUrl } from '@/lib/speaker-placeholder';

export const Route = createFileRoute('/speakers')({
  component: SpeakersPage,
  head: () => ({
    meta: [
      { title: 'Speakers — Women in Leadership' },
      {
        name: 'description',
        content:
          'Meet the women who share their stories, expertise, and perspective at Women in Leadership events.',
      },
    ],
  }),
});

type EventSpeakerWithEvent = {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  bio: string | null;
  photo_url: string | null;
  social_url: string | null;
  gender: string | null;
  events: { id: string; title: string; event_date: string; status: string } | null;
};

function useEventSpeakers() {
  return useQuery({
    queryKey: ['speakers', 'by-event'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('event_speakers')
        .select('id, slug, name, title, bio, photo_url, social_url, gender, events(id, title, event_date, status)')
        .order('display_order', { ascending: true });
      return (data ?? []) as EventSpeakerWithEvent[];
    },
  });
}

function SpeakersPage() {
  const { data: speakers, isLoading } = useEventSpeakers();
  const upcoming = (speakers ?? []).filter((s) => s.events?.status === 'upcoming');
  const past = (speakers ?? []).filter((s) => s.events?.status === 'past');
  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-16 md:pt-24">
        <p className="text-xs uppercase tracking-[0.25em] text-brand-purple">Speakers</p>
        <h1 className="mt-4 font-display text-5xl text-brand-ink md:text-6xl">
          Women worth <span className="font-serif italic">listening to.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-brand-ink/70">
          Founders, executives, creatives, and quietly brilliant operators. Every speaker
          brings a story you won't find on a panel anywhere else.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        {isLoading ? (
          <p className="text-brand-ink/50">Loading…</p>
        ) : speakers && speakers.length > 0 ? (
          <div className="space-y-16">
            {upcoming.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-brand-purple">
                  Upcoming speakers
                </p>
                <div className="mt-8 grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
                  {upcoming.map((s) => (
                    <SpeakerCard key={s.id} s={s} />
                  ))}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-brand-ink/50">
                  Past speakers
                </p>
                <div className="mt-8 grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
                  {past.map((s) => (
                    <SpeakerCard key={s.id} s={s} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-border bg-brand-sand/30 p-8 text-center text-brand-ink/60">
            Speaker line-up coming soon.
          </p>
        )}
      </section>
    </SiteLayout>
  );
}

function SpeakerCard({ s }: { s: EventSpeakerWithEvent }) {
  const eventDate = s.events
    ? new Date(s.events.event_date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;
  return (
    <article className="group">
      <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-brand-sand">
        {s.photo_url ? (
          <img
            src={s.photo_url}
            alt={s.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-5xl text-brand-clay/40">
            {s.name.charAt(0)}
          </div>
        )}
      </div>
      <h3 className="mt-5 font-display text-2xl text-brand-ink">{s.name}</h3>
      {s.title && <p className="text-sm text-brand-ink/60">{s.title}</p>}
      {s.events && (
        <p className="mt-2 text-xs uppercase tracking-widest text-brand-ink/50">
          {s.events.title}
          {eventDate ? ` · ${eventDate}` : ''}
        </p>
      )}
      {s.bio && <p className="mt-3 text-sm leading-relaxed text-brand-ink/75">{s.bio}</p>}
      {s.social_url && (
        <a
          href={s.social_url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-brand-purple hover:underline"
        >
          Connect <ExternalLink size={12} />
        </a>
      )}
    </article>
  );
}