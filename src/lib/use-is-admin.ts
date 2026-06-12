import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/use-auth';

export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()
      .then(({ data, error }) => {
        if (!cancelled) {
          // Only update on a definitive answer. A transient error (e.g. an
          // expired token mid-refresh after the tab was backgrounded) must
          // not strip admin access from the UI.
          if (!error) setIsAdmin(!!data);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { isAdmin, loading };
}

export async function makeMeAdmin(userId: string) {
  // Allowed only if no admin exists yet, but RLS blocks INSERT unless caller is admin.
  // This helper exists for completeness; bootstrap is done via SQL.
  return supabase.from('user_roles').insert({ user_id: userId, role: 'admin' });
}