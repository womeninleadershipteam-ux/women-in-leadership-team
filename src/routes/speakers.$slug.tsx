import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Mail, Globe, Linkedin, Twitter, Instagram, Phone } from 'lucide-react';
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

type ContactLink = {
  raw: string;
  href: string;
  label: string;
  Icon: typeof Globe;
};

export const Route = createFileRoute('/speakers/$slug')({
  loader: async ({ params }) => {
    const { data } = await (supabase as any)
      .from('event_speakers')
      .select('id, name, title')
      .eq('slug', params.slug)
      .maybeSingle();
    if (!data) throw notFound();
    return { id: data.id as string, name: data.name as string, title: (data.title as string | null) ?? null };
  },
  component: SpeakerDetailPage,
  head: ({ loaderData, params }) => {
    const title = loaderData?.name
      ? `${loaderData.name} — Women in Leadership`
      : 'Speaker — Women in Leadership';
    const description = loaderData?.name
      ? `${loaderData.name}${loaderData.title ? `, ${loaderData.title}` : ''} — profile, bio, and events they spoke at.`
      : 'Speaker profile, bio, and the events they spoke at.';
    const url = `https://women-in-leadership-team.lovable.app/speakers/${params.slug}`;
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'profile' },
        { property: 'og:url', content: url },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      links: [{ rel: 'canonical', href: url }],
    };
  },
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

function normalizeContactLink(value: string): ContactLink | null {
  const raw = value.trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) || lower.startsWith('mailto:');
  const isPhone = /^\+?[\d\s().-]{7,}$/.test(raw) || lower.startsWith('tel:');

  if (isEmail) {
    const email = raw.replace(/^mailto:/i, '');
    return { raw, href: `mailto:${email}`, label: email, Icon: Mail };
  }
  if (isPhone) {
    const phone = raw.replace(/^tel:/i, '');
    return { raw, href: `tel:${phone.replace(/\s+/g, '')}`, label: phone, Icon: Phone };
  }

  const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const u = href.toLowerCase();
  if (u.includes('linkedin.com')) return { raw, href, label: 'LinkedIn', Icon: Linkedin };
  if (u.includes('twitter.com') || u.includes('x.com')) return { raw, href, label: 'X / Twitter', Icon: Twitter };
  if (u.includes('instagram.com')) return { raw, href, label: 'Instagram', Icon: Instagram };
  return { raw, href, label: 'Website', Icon: Globe };
}

function SpeakerDetailPage() {
  const { slug } = Route.useParams();
  const { data: speaker, isLoading } = useQuery({
    queryKey: ['speaker', slug],
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('event_speakers')
        .select('id, slug, name, title, bio, photo_url, social_url, gender, events(id, slug, title, event_date, status)')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data as Speaker | null;
    },
  });

  const { data: otherAppearances } = useQuery({
    queryKey: ['speaker', 'other-events', slug, speaker?.name],
    enabled: !!speaker?.name,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('event_speakers')
        .select('id, name, events(id, slug, title, event_date, status)')
        .eq('name', speaker!.name)
        .neq('id', speaker!.id);
      if (error) throw error;
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
    .map(normalizeContactLink)
    .filter(Boolean) as ContactLink[];

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
              speaker.bio.includes('<') ? (
                <div
                  className="rich-text-content mt-6 max-w-none text-brand-ink/80"
                  dangerouslySetInnerHTML={{ __html: speaker.bio }}
                />
              ) : (
                <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-brand-ink/80">
                  {speaker.bio}
                </p>
              )
            )}

            {links.length > 0 && (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.25em] text-brand-purple">Contact and social links</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {links.map(({ raw, href, label, Icon }) => {
                    return (
                      <a
                        key={`${label}-${href}`}
                        href={href}
                        target={href.startsWith('mailto:') || href.startsWith('tel:') ? undefined : '_blank'}
                        rel={href.startsWith('mailto:') || href.startsWith('tel:') ? undefined : 'noreferrer'}
                        aria-label={raw}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-brand-ink hover:border-brand-purple hover:text-brand-purple"
                      >
                        <Icon size={14} /> {label}
                        {!href.startsWith('mailto:') && !href.startsWith('tel:') && <ExternalLink size={12} className="opacity-60" />}
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