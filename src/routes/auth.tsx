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
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');

  useEffect(() => {
    if (user) navigate({ to: '/admin' });
  }, [user, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        // Best-effort: claim admin role if this is the bootstrap email
        try { await supabase.rpc('claim_initial_admin'); } catch { /* ignore */ }
        navigate({ to: '/admin' });
      } else if (mode === 'signup') {
        await signUp(email, password);
        // If email confirmation is disabled, session exists immediately
        try { await supabase.rpc('claim_initial_admin'); } catch { /* ignore */ }
        toast.success('Account created. Check your email if confirmation is required.');
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
          {mode !== 'reset' && (
            <div>
              <label className="text-xs uppercase tracking-widest text-brand-ink/60">
                Password
              </label>
              <input
                required
                type="password"
                minLength={8}
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
                : mode === 'signup'
                  ? 'Create account'
                  : 'Send reset link'}
          </button>
          <div className="flex flex-col gap-2 text-center text-xs text-brand-ink/60">
            {mode === 'signin' && (
              <>
                <button type="button" onClick={() => setMode('reset')} className="hover:text-brand-purple">
                  Forgot password?
                </button>
                <button type="button" onClick={() => setMode('signup')} className="hover:text-brand-purple">
                  First time? Create the admin account
                </button>
              </>
            )}
            {mode !== 'signin' && (
              <button type="button" onClick={() => setMode('signin')} className="hover:text-brand-purple">
                Back to sign in
              </button>
            )}
          </div>
        </form>
      </section>
    </SiteLayout>
  );
}