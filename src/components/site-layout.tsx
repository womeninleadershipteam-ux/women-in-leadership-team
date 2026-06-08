import type { ReactNode } from 'react';
import { SiteNav } from './site-nav';
import { SiteFooter } from './site-footer';
import { AnnouncementBar } from './announcement-bar';

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-brand-cream text-brand-ink">
      <AnnouncementBar />
      <SiteNav />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}