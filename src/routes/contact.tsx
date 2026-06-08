import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Instagram, Mail, MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { SiteLayout } from '@/components/site-layout';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSettings } from '@/lib/use-site-settings';

export const Route = createFileRoute('/contact')({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: 'Contact — Women in Leadership' },
      {
        name: 'description',
        content: 'Get in touch with the Women in Leadership team.',
      },
    ],
  }),
});

function ContactPage() {
  const { data: settings } = useSiteSettings();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSending(true);
    const { error } = await supabase
      .from('contact_messages')
      .insert({ name, email, message });
    setSending(false);
    if (error) {
      toast.error('Something went wrong. Please try again.');
      return;
    }
    toast.success("Thank you — we'll be in touch soon.");
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-24 md:pt-24">
        <div className="grid gap-16 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-purple">Contact</p>
            <h1 className="mt-4 font-display text-5xl leading-tight text-brand-ink md:text-6xl">
              Let's <span className="font-serif italic">talk.</span>
            </h1>
            <p className="mt-6 text-lg text-brand-ink/70">
              Speaking, sponsorship, mentorship, or just a hello — we'd love to hear from
              you.
            </p>

            <ul className="mt-10 space-y-4 text-base">
              {settings?.email && (
                <li>
                  <a
                    href={`mailto:${settings.email}`}
                    className="inline-flex items-center gap-3 text-brand-ink hover:text-brand-purple"
                  >
                    <Mail size={18} /> {settings.email}
                  </a>
                </li>
              )}
              {settings?.whatsapp_url && (
                <li>
                  <a
                    href={settings.whatsapp_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-3 text-brand-ink hover:text-brand-purple"
                  >
                    <MessageCircle size={18} /> WhatsApp community
                  </a>
                </li>
              )}
              {settings?.instagram_url && (
                <li>
                  <a
                    href={settings.instagram_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-3 text-brand-ink hover:text-brand-purple"
                  >
                    <Instagram size={18} /> @womeninleadershipteam
                  </a>
                </li>
              )}
            </ul>
          </div>

          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-border/60 bg-card p-8 shadow-sm"
          >
            <div className="space-y-5">
              <div>
                <label className="text-xs uppercase tracking-widest text-brand-ink/60">
                  Your name
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-brand-ink outline-none transition-colors focus:border-brand-purple"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-brand-ink/60">
                  Email
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-brand-ink outline-none transition-colors focus:border-brand-purple"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-brand-ink/60">
                  Message
                </label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-brand-ink outline-none transition-colors focus:border-brand-purple"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-purple px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Send size={14} /> {sending ? 'Sending…' : 'Send message'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}