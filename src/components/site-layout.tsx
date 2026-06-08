import type { ReactNode } from 'react';
import { SiteNav } from './site-nav';
import { SiteFooter } from './site-footer';

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-brand-cream text-brand-ink">
      <SiteNav />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}