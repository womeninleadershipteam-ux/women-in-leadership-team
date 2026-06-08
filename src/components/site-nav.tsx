import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const links = [
  { to: '/', label: 'Home' },
  { to: '/events', label: 'Events' },
  { to: '/community', label: 'Community' },
  { to: '/speakers', label: 'Speakers' },
  { to: '/contact', label: 'Contact' },
] as const;

export function SiteNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-brand-cream/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="group flex items-center gap-2">
          <span className="font-display text-lg font-semibold tracking-tight text-brand-ink">
            Women in Leadership
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm text-brand-ink/70 transition-colors hover:text-brand-purple"
              activeProps={{ className: 'text-brand-purple font-medium' }}
              activeOptions={{ exact: l.to === '/' }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-brand-ink"
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/40 bg-brand-cream md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-4">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-md py-2 text-base text-brand-ink/80 hover:text-brand-purple"
                activeProps={{ className: 'text-brand-purple font-medium' }}
                activeOptions={{ exact: l.to === '/' }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}