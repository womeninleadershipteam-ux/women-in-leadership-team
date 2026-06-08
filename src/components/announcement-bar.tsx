import { useEffect, useState } from 'react';
import { useSiteSettings } from '@/lib/use-site-settings';

const STORAGE_PREFIX = 'wil-announcement-dismissed:';

function hashText(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return String(h);
}

export function AnnouncementBar() {
  const { data: settings } = useSiteSettings();
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid SSR flash

  const text = settings?.announcement_text?.trim() ?? '';
  const active = !!settings?.announcement_active && text.length > 0;
  const storageKey = active ? STORAGE_PREFIX + hashText(text) : '';

  useEffect(() => {
    if (!active) return;
    try {
      setDismissed(localStorage.getItem(storageKey) === '1');
    } catch {
      setDismissed(false);
    }
  }, [active, storageKey]);

  if (!active || dismissed) return null;

  const shouldMarquee = text.length > 80;

  return (
    <div className="relative w-full overflow-hidden bg-brand-purple text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-sm">
        <i className="bx bx-bell shrink-0 text-base" aria-hidden />
        <div className="min-w-0 flex-1 overflow-hidden">
          {shouldMarquee ? (
            <div className="wil-marquee">
              <span className="pr-16">{text}</span>
              <span className="pr-16" aria-hidden>
                {text}
              </span>
            </div>
          ) : (
            <p className="truncate">{text}</p>
          )}
        </div>
        <button
          onClick={() => {
            try {
              localStorage.setItem(storageKey, '1');
            } catch {
              /* ignore */
            }
            setDismissed(true);
          }}
          aria-label="Dismiss announcement"
          className="shrink-0 rounded-full p-1 transition-colors hover:bg-white/15"
        >
          <i className="bx bx-x text-lg" />
        </button>
      </div>
    </div>
  );
}