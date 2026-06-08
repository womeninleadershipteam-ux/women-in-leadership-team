import { createFileRoute } from '@tanstack/react-router';
import { ArrowRight, Heart, MessageCircle, Sparkles, Users } from 'lucide-react';
import { SiteLayout } from '@/components/site-layout';
import { useSiteSettings } from '@/lib/use-site-settings';

export const Route = createFileRoute('/community')({
  component: CommunityPage,
  head: () => ({
    meta: [
      { title: 'Community — Women in Leadership' },
      {
        name: 'description',
        content:
          'Learn about the Women in Leadership movement — our values, what we stand for, and how to get involved.',
      },
    ],
  }),
});

const values = [
  {
    icon: Heart,
    title: 'Generosity first',
    body: 'We share what we know. Knowledge held tightly helps no one.',
  },
  {
    icon: Sparkles,
    title: 'Courage over polish',
    body: 'We pick honest conversations over the perfect take. Always.',
  },
  {
    icon: Users,
    title: 'Lift as you rise',
    body: 'Every door you walk through is a door you can hold open.',
  },
];

function CommunityPage() {
  const { data: settings } = useSiteSettings();
  return (
    <SiteLayout>
      <section className="mx-auto max-w-4xl px-6 pt-16 pb-16 md:pt-24">
        <p className="text-xs uppercase tracking-[0.25em] text-brand-purple">The community</p>
        <h1 className="mt-4 font-display text-5xl leading-tight text-brand-ink md:text-6xl">
          A movement, <span className="font-serif italic">not a membership.</span>
        </h1>
        <p className="mt-8 font-serif text-2xl leading-relaxed text-brand-ink/80">
          Women in Leadership started with a simple idea: the conversations that change
          careers don't usually happen in conference halls. They happen between sessions,
          over coffee, in honest messages between people who decided to show up for each
          other.
        </p>
        <p className="mt-6 text-lg leading-relaxed text-brand-ink/70">
          We're building the room where those conversations are the whole point — across
          industries, career stages, and continents. Whether you're leading a team of two
          hundred or quietly preparing for your first promotion, you belong here.
        </p>
      </section>

      <section className="border-y border-border/40 bg-brand-sand/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-3xl text-brand-ink md:text-4xl">What we stand for</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-border/50 bg-card p-8">
                <v.icon size={24} className="text-brand-purple" />
                <h3 className="mt-4 font-display text-xl text-brand-ink">{v.title}</h3>
                <p className="mt-2 text-brand-ink/70">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h2 className="font-display text-3xl text-brand-ink md:text-5xl">
          Come find your people.
        </h2>
        <p className="mt-6 text-lg text-brand-ink/70">
          Join the WhatsApp community for event invites, mentorship moments, job openings
          shared between members, and conversations you won't find anywhere else.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          {settings?.whatsapp_url && (
            <a
              href={settings.whatsapp_url}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-2 rounded-full bg-brand-purple px-7 py-3.5 text-sm font-medium text-white transition-all hover:gap-3 hover:opacity-90"
            >
              <MessageCircle size={16} /> Join WhatsApp
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </a>
          )}
          {settings?.instagram_url && (
            <a
              href={settings.instagram_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-brand-ink/20 px-7 py-3.5 text-sm font-medium text-brand-ink transition-colors hover:border-brand-purple hover:text-brand-purple"
            >
              Follow on Instagram
            </a>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}