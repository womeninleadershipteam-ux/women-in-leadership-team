import { useSiteSettings } from '@/lib/use-site-settings';
import { WilLogo } from './wil-logo';

const TDG_WHATSAPP =
  'https://wa.me/2349065718162?text=' +
  encodeURIComponent(
    "Hi TDG, I saw your work on the Women in Leadership website and I'd like to talk about a project.",
  );

export function SiteFooter() {
  const { data: settings } = useSiteSettings();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-32 border-t border-border/40 bg-brand-sand/40">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-3">
          <div className="md:col-span-2">
            <WilLogo className="h-12 w-auto md:h-14" />
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
                    <i className="bx bxl-whatsapp text-base" /> WhatsApp community
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
                    <i className="bx bxl-instagram text-base" /> Instagram
                  </a>
                </li>
              )}
              {settings?.email && (
                <li>
                  <a
                    href={`mailto:${settings.email}`}
                    className="inline-flex items-center gap-2 text-brand-ink/80 transition-colors hover:text-brand-purple"
                  >
                    <i className="bx bx-envelope text-base" /> {settings.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border/40 pt-6 text-xs text-brand-ink/50 md:flex-row md:items-center">
          <p>Copyright (c) {year}, Women in Leadership.</p>
          <a
            href={TDG_WHATSAPP}
            target="_blank"
            rel="noreferrer"
            className="hover:text-brand-purple"
          >
            Made by{' '}
            <span className="font-medium text-brand-ink/70 underline-offset-2 hover:underline">
              TDG
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}