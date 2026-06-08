import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

const emailSchema = z.string().trim().email().max(255);

export function NewsletterSignup({
  source = 'home',
  variant = 'light',
}: {
  source?: string;
  variant?: 'light' | 'dark';
}) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: parsed.data, source });
    setSubmitting(false);
    if (error) {
      if (error.code === '23505') {
        toast.success("You're already on the list — see you at the next one.");
        setEmail('');
        return;
      }
      toast.error('Something went wrong. Please try again.');
      return;
    }
    toast.success("You're in. We'll send updates soon.");
    setEmail('');
  };

  const isDark = variant === 'dark';
  return (
    <form
      onSubmit={onSubmit}
      className={`flex w-full max-w-xl flex-col gap-3 sm:flex-row ${isDark ? 'text-white' : 'text-brand-ink'}`}
    >
      <label className="sr-only" htmlFor="newsletter-email">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className={`flex-1 rounded-full border px-5 py-3 text-sm outline-none transition-colors ${
          isDark
            ? 'border-white/30 bg-white/10 placeholder:text-white/60 focus:border-white'
            : 'border-border bg-card placeholder:text-brand-ink/40 focus:border-brand-purple'
        }`}
      />
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-purple px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <i className="bx bx-envelope text-base" />
        {submitting ? 'Subscribing…' : 'Subscribe'}
      </button>
    </form>
  );
}