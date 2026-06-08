import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type SiteSettings = {
  id: string;
  whatsapp_url: string | null;
  instagram_url: string | null;
  email: string | null;
  mission_statement: string | null;
  footer_tagline: string | null;
};

export function useSiteSettings() {
  return useQuery({
    queryKey: ['site_settings'],
    queryFn: async (): Promise<SiteSettings | null> => {
      const { data } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      return data as SiteSettings | null;
    },
  });
}