import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Mail, Globe, Linkedin, Twitter, Instagram } from 'lucide-react';
import { SiteLayout } from '@/components/site-layout';
import { supabase } from '@/integrations/supabase/client';
import { speakerPhotoUrl } from '@/lib/speaker-placeholder';

type Speaker = {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  bio: string | null;
  photo_url: string | null;
  social_url: string | null;
  gender: string | null;
  events: { id: string; slug: string; title: string; event_date: string; status: string } | null;
};

export const Route = createFileRoute('/speakers/$slug')({
  loader: async ({ params }) => {
    const { data } = await (supabase as any)
      .from('event_speakers')
      .select('id')
      .eq('slug', params.slug)
      .maybeSingle();
    if (!data) throw notFound();
    return { id: data.id };
  },
  component: SpeakerDetailPage,
  head: () => ({
    meta: [
      { title: 'Speaker — Women in Leadership' },
      { name: 'description', content: 'Speaker profile, bio, and the events they spoke at.' },
    ],
  }),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-4xl text-brand-ink">Speaker not found</h1>
        <Link to="/speakers" className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-purple px-5 py-2.5 text-sm text-white">
          ← Back to speakers
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

function detectKind(url: string) {
  const u = url.toLowerCase();
  if (u.startsWith('mailto:')) return { label: 'Email', Icon: Mail };
  if (u.includes('linkedin.com')) return { label: 'LinkedIn', Icon: Linkedin };
  if (u.includes('twitter.com') || u.includes('x.com')) return { label: 'X / Twitter', Icon: Twitter };
  if (u.includes('instagram.com')) return { label: 'Instagram', Icon: Instagram };
  return { label: 'Website', Icon: Globe };
}

function SpeakerDetailPage() {
  const { slug } = Route.useParams();
  const { data: speaker, isLoading } = useQuery({
    queryKey: ['speaker', slug],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('event_speakers')
        .select('id, slug, name, title, bio, photo_url, social_url, gender, events(id, slug, title, event_date, status)')
        .eq('slug', slug)
        .maybeSingle();
      return data as Speaker | null;
    },
  });

  const { data: otherAppearances } = useQuery({
    queryKey: ['speaker', 'other-events', slug, speaker?.name],
    enabled: !!speaker?.name,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('event_speakers')
        .select('id, name, events(id, slug, title, event_date, status)')
        .eq('name', speaker!.name)
        .neq('id', speaker!.id);
      return ((data ?? []) as any[])
        .map((r) => r.events)
        .filter(Boolean);
    },
  });

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-4xl px-6 py-24 text-brand-ink/50">Loading…</div>
      </SiteLayout>
    );
  }
  if (!speaker) throw notFound();

  const links = (speaker.social_url ?? '')
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const allEvents = [speaker.events, ...((otherAppearances as any[]) ?? [])].filter(Boolean) as Speaker['events'][];

  return (
    <SiteLayout>
      <article className="mx-auto max-w-5xl px-6 pt-12 pb-24 md:pt-20">
        <Link to="/speakers" className="inline-flex items-center gap-1.5 text-sm text-brand-ink/60 hover:text-brand-purple">
          ← Back to speakers
        </Link>
        <div className="mt-8 grid gap-10 md:grid-cols-[280px,1fr] md:items-start">
          <div className="mx-auto md:mx-0">
            <div className="aspect-square w-64 overflow-hidden rounded-full border border-border bg-brand-sand">
              <img
                src={speakerPhotoUrl(speaker)}
                alt={speaker.name}
                className="h-full w-full object-cover"
                width={400}
                height={400}
              />
            </div>
          </div>
          <div>
            <h1 className="font-display text-4xl text-brand-ink md:text-5xl">{speaker.name}</h1>
            {speaker.title && <p className="mt-2 text-lg text-brand-ink/70">{speaker.title}</p>}
            {speaker.bio && (
              <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-brand-ink/80">
                {speaker.bio}
              </p>
            )}

            {links.length > 0 && (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.25em] text-brand-purple">Connect</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {links.map((href) => {
                    const { label, Icon } = detectKind(href);
                    return (
                      <a
                        key={href}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-brand-ink hover:border-brand-purple hover:text-brand-purple"
                      >
                        <Icon size={14} /> {label} <ExternalLink size={12} className="opacity-60" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {allEvents.length > 0 && (
          <section className="mt-16 border-t border-border/40 pt-10">
            <h2 className="font-display text-2xl text-brand-ink">Events they spoke at</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {allEvents.map((e) => e && (
                <Link
                  key={e.id}
                  to="/events/$slug"
                  params={{ slug: e.slug }}
                  className="rounded-xl border border-border/60 bg-card p-4 hover:border-brand-purple"
                >
                  <p className="text-xs uppercase tracking-widest text-brand-purple">
                    {e.status === 'past' ? 'Past event' : 'Upcoming'}
                  </p>
                  <p className="mt-1 font-display text-lg text-brand-ink">{e.title}</p>
                  <p className="mt-1 text-xs text-brand-ink/60">
                    {new Date(e.event_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </SiteLayout>
  );
}