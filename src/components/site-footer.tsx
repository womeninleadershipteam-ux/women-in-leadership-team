import { Link } from '@tanstack/react-router';
import { Instagram, Mail, MessageCircle } from 'lucide-react';
import { useSiteSettings } from '@/lib/use-site-settings';

export function SiteFooter() {
  const { data: settings } = useSiteSettings();
  return (
    <footer className="mt-32 border-t border-border/40 bg-brand-sand/40">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-3">
          <div className="md:col-span-2">
            <p className="font-display text-2xl text-brand-ink md:text-3xl">
              Women in Leadership
            </p>
            <p className="mt-3 max-w-md font-serif text-lg italic text-brand-ink/70">
              {settings?.footer_tagline ??
                'A community for women who lead — and women becoming leaders.'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-brand-ink/60">
              Connect
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              {settings?.whatsapp_url && (
                <li>
                  <a
                    href={settings.whatsapp_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-brand-ink/80 transition-colors hover:text-brand-purple"
                  >
                    <MessageCircle size={16} /> WhatsApp community
                  </a>
                </li>
              )}
              {settings?.instagram_url && (
                <li>
                  <a
                    href={settings.instagram_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-brand-ink/80 transition-colors hover:text-brand-purple"
                  >
                    <Instagram size={16} /> Instagram
                  </a>
                </li>
              )}
              {settings?.email && (
                <li>
                  <a
                    href={`mailto:${settings.email}`}
                    className="inline-flex items-center gap-2 text-brand-ink/80 transition-colors hover:text-brand-purple"
                  >
                    <Mail size={16} /> {settings.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border/40 pt-6 text-xs text-brand-ink/50 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} Women in Leadership. Made with care.</p>
          <Link to="/auth" className="hover:text-brand-purple">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}