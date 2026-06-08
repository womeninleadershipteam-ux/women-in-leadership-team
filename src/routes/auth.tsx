import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { SiteLayout } from '@/components/site-layout';
import { useAuth } from '@/lib/use-auth';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/auth')({
  component: AuthPage,
});

function AuthPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'signin' | 'reset'>('signin');

  useEffect(() => {
    if (user) navigate({ to: '/admin' });
  }, [user, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        navigate({ to: '/admin' });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success('Password reset email sent.');
        setMode('signin');
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteLayout>
      <section className="mx-auto flex max-w-md flex-col px-6 py-24">
        <h1 className="font-display text-3xl text-brand-ink">Admin sign in</h1>
        <p className="mt-2 text-sm text-brand-ink/60">
          For Women in Leadership team members.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-xs uppercase tracking-widest text-brand-ink/60">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 outline-none focus:border-brand-purple"
            />
          </div>
          {mode === 'signin' && (
            <div>
              <label className="text-xs uppercase tracking-widest text-brand-ink/60">
                Password
              </label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 outline-none focus:border-brand-purple"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-brand-purple px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting
              ? 'Please wait…'
              : mode === 'signin'
                ? 'Sign in'
                : 'Send reset link'}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === 'signin' ? 'reset' : 'signin')}
            className="w-full text-center text-xs text-brand-ink/60 hover:text-brand-purple"
          >
            {mode === 'signin' ? 'Forgot password?' : 'Back to sign in'}
          </button>
        </form>
      </section>
    </SiteLayout>
  );
}