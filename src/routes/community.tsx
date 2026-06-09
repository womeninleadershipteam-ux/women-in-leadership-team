import { createFileRoute } from '@tanstack/react-router';
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

const pillars = [
  { icon: 'bx-heart', title: 'Emotional intelligence', body: 'Self-awareness, empathy, and the ability to lead yourself before leading others.' },
  { icon: 'bx-trending-up', title: 'Capacity building', body: 'Practical skills, frameworks, and habits that scale with your ambition.' },
  { icon: 'bx-broadcast', title: 'Influence & impact', body: 'Move the needle in the rooms you already occupy — without waiting for a title.' },
  { icon: 'bx-buildings', title: 'Legacy & nation building', body: 'Lead in a way that the next generation of women will thank you for.' },
];

const audience = [
  'Young women aspiring to lead',
  'Women currently in leadership positions',
  'Emerging professionals',
  'Entrepreneurs',
  'Women in ministry and service',
  'Students and graduates',
  'Women seeking growth, clarity, and influence',
];

function CommunityPage() {
  const { data: settings } = useSiteSettings();
  return (
    <SiteLayout>
      <section className="mx-auto max-w-4xl px-6 pt-16 pb-16 md:pt-24">
        <p className="text-xs uppercase tracking-[0.25em] text-brand-purple">The community</p>
        <h1 className="mt-4 font-display text-5xl leading-tight text-brand-ink md:text-6xl">
          About <span className="font-serif italic">us.</span>
        </h1>
        <p className="mt-8 font-serif text-2xl leading-relaxed text-brand-ink/80">
          Women in Leadership is a transformational platform designed to equip, inspire,
          and empower young women, emerging leaders, professionals, entrepreneurs, and
          purpose-driven women to lead with confidence, influence, character, and impact —
          beyond titles or recognition.
        </p>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-brand-purple">Our mission</p>
            <p className="mt-3 font-serif text-xl leading-relaxed text-brand-ink">
              To equip and empower women with the mindset, confidence, leadership
              capacity, and emotional intelligence needed to lead effectively and create
              lasting impact.
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-brand-purple">Our vision</p>
            <p className="mt-3 font-serif text-xl leading-relaxed text-brand-ink">
              To raise purpose-driven women who lead with clarity, influence, excellence,
              and impact in their generation.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-border/40 bg-brand-sand/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-3xl text-brand-ink md:text-4xl">
            Core leadership pillars
          </h2>
          <p className="mt-3 max-w-2xl text-brand-ink/70">
            Four pillars shape every conversation, workshop, and panel we host.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p) => (
              <div key={p.title} className="rounded-2xl border border-border/50 bg-card p-6">
                <i className={`bx ${p.icon} text-2xl text-brand-purple`} />
                <h3 className="mt-3 font-display text-lg text-brand-ink">{p.title}</h3>
                <p className="mt-1 text-sm text-brand-ink/70">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-20">
        <h2 className="font-display text-3xl text-brand-ink md:text-4xl">
          Who this is for
        </h2>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {audience.map((a) => (
            <li key={a} className="flex items-start gap-3 text-base text-brand-ink/85">
              <i className="bx bx-check-circle mt-0.5 text-xl text-brand-purple" />
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-24 text-center">
        <h2 className="font-display text-3xl text-brand-ink md:text-5xl">
          Come find your people.
        </h2>
        <p className="mt-6 text-lg text-brand-ink/70">
          Join the WhatsApp community for event invites, mentorship moments, and
          conversations you won't find anywhere else.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          {settings?.whatsapp_url && (
            <a
              href={settings.whatsapp_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-brand-purple px-7 py-3.5 text-sm font-medium text-white hover:opacity-90"
            >
              <i className="bx bxl-whatsapp text-lg" /> Join WhatsApp
              <i className="bx bx-right-arrow-alt text-lg" />
            </a>
          )}
          {settings?.instagram_url && (
            <a
              href={settings.instagram_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-brand-ink/20 px-7 py-3.5 text-sm font-medium text-brand-ink hover:border-brand-purple hover:text-brand-purple"
            >
              <i className="bx bxl-instagram text-lg" /> Follow on Instagram
            </a>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}