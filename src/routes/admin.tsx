import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { LogOut, Plus, Trash2, Pencil, Save, X } from 'lucide-react';
import { SiteLayout } from '@/components/site-layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/use-auth';
import { useIsAdmin } from '@/lib/use-is-admin';

export const Route = createFileRoute('/admin')({
  component: AdminPage,
});

type EventRow = {
  id?: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  image_url: string | null;
  speakers: string | null;
  registration_url: string | null;
  status: 'upcoming' | 'past';
};

type SpeakerRow = {
  id?: string;
  name: string;
  title: string | null;
  bio: string | null;
  photo_url: string | null;
  social_url: string | null;
  featured: boolean;
};

function AdminPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'events' | 'speakers' | 'settings'>('events');

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: '/auth' });
  }, [user, authLoading, navigate]);

  if (authLoading || roleLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-6xl px-6 py-24 text-brand-ink/50">Loading…</div>
      </SiteLayout>
    );
  }
  if (!user) return null;

  if (!isAdmin) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h1 className="font-display text-3xl text-brand-ink">Not authorized</h1>
          <p className="mt-3 text-brand-ink/60">
            Your account ({user.email}) doesn't have admin access. Ask a team member to
            grant you the admin role.
          </p>
          <p className="mt-2 break-all text-xs text-brand-ink/40">User ID: {user.id}</p>
          <button
            onClick={() => signOut().then(() => navigate({ to: '/' }))}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm hover:border-brand-purple"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-purple">Admin</p>
            <h1 className="mt-2 font-display text-4xl text-brand-ink">Dashboard</h1>
            <p className="mt-2 text-sm text-brand-ink/60">Signed in as {user.email}</p>
          </div>
          <button
            onClick={() => signOut().then(() => navigate({ to: '/' }))}
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm hover:border-brand-purple"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>

        <div className="mt-10 flex gap-1 rounded-full border border-border bg-card p-1 w-fit">
          {(['events', 'speakers', 'settings'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-5 py-2 text-sm capitalize transition-colors ${
                tab === t
                  ? 'bg-brand-purple text-white'
                  : 'text-brand-ink/70 hover:text-brand-ink'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-10">
          {tab === 'events' && <EventsAdmin />}
          {tab === 'speakers' && <SpeakersAdmin />}
          {tab === 'settings' && <SettingsAdmin />}
        </div>

        <p className="mt-12 text-xs text-brand-ink/40">
          <Link to="/" className="hover:text-brand-purple">← Back to site</Link>
        </p>
      </section>
    </SiteLayout>
  );
}

/* ----------------- EVENTS ----------------- */

const emptyEvent: EventRow = {
  title: '',
  description: '',
  event_date: new Date().toISOString().slice(0, 16),
  location: '',
  image_url: '',
  speakers: '',
  registration_url: '',
  status: 'upcoming',
};

function EventsAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<EventRow | null>(null);

  const { data: events } = useQuery({
    queryKey: ['admin', 'events'],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });
      return data ?? [];
    },
  });

  const save = async (row: EventRow) => {
    const payload = {
      ...row,
      event_date: new Date(row.event_date).toISOString(),
    };
    const { error } = row.id
      ? await supabase.from('events').update(payload).eq('id', row.id)
      : await supabase.from('events').insert(payload);
    if (error) return toast.error(error.message);
    toast.success('Saved');
    setEditing(null);
    qc.invalidateQueries({ queryKey: ['admin', 'events'] });
    qc.invalidateQueries({ queryKey: ['events', 'all'] });
    qc.invalidateQueries({ queryKey: ['events', 'upcoming-one'] });
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    qc.invalidateQueries({ queryKey: ['admin', 'events'] });
    qc.invalidateQueries({ queryKey: ['events', 'all'] });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl">Events</h2>
        <button
          onClick={() => setEditing(emptyEvent)}
          className="inline-flex items-center gap-2 rounded-full bg-brand-ink px-4 py-2 text-sm text-white hover:opacity-90"
        >
          <Plus size={14} /> New event
        </button>
      </div>

      {editing && (
        <EventEditor
          row={editing}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}

      <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
        {(events ?? []).map((e) => (
          <div key={e.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-brand-ink truncate">{e.title}</p>
              <p className="text-xs text-brand-ink/50">
                {new Date(e.event_date).toLocaleString()} · {e.status}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing({ ...e, event_date: new Date(e.event_date).toISOString().slice(0, 16) } as EventRow)}
                className="rounded-full border border-border p-2 hover:border-brand-purple"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => remove(e.id)}
                className="rounded-full border border-border p-2 text-destructive hover:border-destructive"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {events && events.length === 0 && (
          <p className="p-6 text-center text-sm text-brand-ink/50">No events yet.</p>
        )}
      </div>
    </div>
  );
}

function EventEditor({
  row,
  onCancel,
  onSave,
}: {
  row: EventRow;
  onCancel: () => void;
  onSave: (r: EventRow) => void;
}) {
  const [r, setR] = useState<EventRow>(row);
  const u = <K extends keyof EventRow>(k: K, v: EventRow[K]) => setR((p) => ({ ...p, [k]: v }));
  return (
    <div className="mt-6 rounded-2xl border border-brand-purple/40 bg-card p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title">
          <input className={inputCls} value={r.title} onChange={(e) => u('title', e.target.value)} />
        </Field>
        <Field label="Date & time">
          <input type="datetime-local" className={inputCls} value={r.event_date} onChange={(e) => u('event_date', e.target.value)} />
        </Field>
        <Field label="Location">
          <input className={inputCls} value={r.location ?? ''} onChange={(e) => u('location', e.target.value)} />
        </Field>
        <Field label="Status">
          <select className={inputCls} value={r.status} onChange={(e) => u('status', e.target.value as 'upcoming' | 'past')}>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
        </Field>
        <Field label="Image URL">
          <input className={inputCls} value={r.image_url ?? ''} onChange={(e) => u('image_url', e.target.value)} />
        </Field>
        <Field label="Registration URL">
          <input className={inputCls} value={r.registration_url ?? ''} onChange={(e) => u('registration_url', e.target.value)} />
        </Field>
        <Field label="Speakers (comma separated)" full>
          <input className={inputCls} value={r.speakers ?? ''} onChange={(e) => u('speakers', e.target.value)} />
        </Field>
        <Field label="Description" full>
          <textarea rows={4} className={inputCls} value={r.description ?? ''} onChange={(e) => u('description', e.target.value)} />
        </Field>
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={() => onSave(r)} className="inline-flex items-center gap-2 rounded-full bg-brand-purple px-5 py-2 text-sm text-white hover:opacity-90">
          <Save size={14} /> Save
        </button>
        <button onClick={onCancel} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm">
          <X size={14} /> Cancel
        </button>
      </div>
    </div>
  );
}

/* ----------------- SPEAKERS ----------------- */

const emptySpeaker: SpeakerRow = {
  name: '',
  title: '',
  bio: '',
  photo_url: '',
  social_url: '',
  featured: true,
};

function SpeakersAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<SpeakerRow | null>(null);

  const { data: speakers } = useQuery({
    queryKey: ['admin', 'speakers'],
    queryFn: async () => {
      const { data } = await supabase.from('speakers').select('*').order('display_order');
      return data ?? [];
    },
  });

  const save = async (row: SpeakerRow) => {
    const { error } = row.id
      ? await supabase.from('speakers').update(row).eq('id', row.id)
      : await supabase.from('speakers').insert(row);
    if (error) return toast.error(error.message);
    toast.success('Saved');
    setEditing(null);
    qc.invalidateQueries({ queryKey: ['admin', 'speakers'] });
    qc.invalidateQueries({ queryKey: ['speakers', 'all'] });
    qc.invalidateQueries({ queryKey: ['speakers', 'featured'] });
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this speaker?')) return;
    const { error } = await supabase.from('speakers').delete().eq('id', id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ['admin', 'speakers'] });
    qc.invalidateQueries({ queryKey: ['speakers', 'all'] });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl">Speakers</h2>
        <button
          onClick={() => setEditing(emptySpeaker)}
          className="inline-flex items-center gap-2 rounded-full bg-brand-ink px-4 py-2 text-sm text-white hover:opacity-90"
        >
          <Plus size={14} /> New speaker
        </button>
      </div>

      {editing && (
        <div className="mt-6 rounded-2xl border border-brand-purple/40 bg-card p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <input className={inputCls} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </Field>
            <Field label="Title / role">
              <input className={inputCls} value={editing.title ?? ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            </Field>
            <Field label="Photo URL">
              <input className={inputCls} value={editing.photo_url ?? ''} onChange={(e) => setEditing({ ...editing, photo_url: e.target.value })} />
            </Field>
            <Field label="Social URL (LinkedIn etc.)">
              <input className={inputCls} value={editing.social_url ?? ''} onChange={(e) => setEditing({ ...editing, social_url: e.target.value })} />
            </Field>
            <Field label="Bio" full>
              <textarea rows={4} className={inputCls} value={editing.bio ?? ''} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} />
            </Field>
            <Field label="Featured on home page" full>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} />
                Show on homepage
              </label>
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => save(editing)} className="inline-flex items-center gap-2 rounded-full bg-brand-purple px-5 py-2 text-sm text-white hover:opacity-90">
              <Save size={14} /> Save
            </button>
            <button onClick={() => setEditing(null)} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm">
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
        {(speakers ?? []).map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-brand-ink truncate">{s.name}</p>
              <p className="text-xs text-brand-ink/50">{s.title ?? '—'}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(s as SpeakerRow)} className="rounded-full border border-border p-2 hover:border-brand-purple">
                <Pencil size={14} />
              </button>
              <button onClick={() => remove(s.id)} className="rounded-full border border-border p-2 text-destructive hover:border-destructive">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {speakers && speakers.length === 0 && (
          <p className="p-6 text-center text-sm text-brand-ink/50">No speakers yet.</p>
        )}
      </div>
    </div>
  );
}

/* ----------------- SETTINGS ----------------- */

function SettingsAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
      return data;
    },
  });
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data, form]);

  if (!form) return <p className="text-brand-ink/50">Loading…</p>;

  const save = async () => {
    const { error } = await supabase
      .from('site_settings')
      .update({
        whatsapp_url: form.whatsapp_url,
        instagram_url: form.instagram_url,
        email: form.email,
        mission_statement: form.mission_statement,
        footer_tagline: form.footer_tagline,
      })
      .eq('id', form.id);
    if (error) return toast.error(error.message);
    toast.success('Settings saved');
    qc.invalidateQueries({ queryKey: ['site_settings'] });
    qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
  };

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-2xl">Site settings</h2>
      <div className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-6">
        <Field label="WhatsApp community URL">
          <input className={inputCls} value={form.whatsapp_url ?? ''} onChange={(e) => setForm({ ...form, whatsapp_url: e.target.value })} />
        </Field>
        <Field label="Instagram URL">
          <input className={inputCls} value={form.instagram_url ?? ''} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} />
        </Field>
        <Field label="Contact email">
          <input className={inputCls} value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Mission statement (homepage)">
          <textarea rows={3} className={inputCls} value={form.mission_statement ?? ''} onChange={(e) => setForm({ ...form, mission_statement: e.target.value })} />
        </Field>
        <Field label="Footer tagline">
          <input className={inputCls} value={form.footer_tagline ?? ''} onChange={(e) => setForm({ ...form, footer_tagline: e.target.value })} />
        </Field>
        <button onClick={save} className="inline-flex items-center gap-2 rounded-full bg-brand-purple px-5 py-2 text-sm text-white hover:opacity-90">
          <Save size={14} /> Save settings
        </button>
      </div>
    </div>
  );
}

/* ----------------- shared ----------------- */

const inputCls =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-purple';

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${full ? 'md:col-span-2' : ''}`}>
      <span className="text-xs uppercase tracking-widest text-brand-ink/60">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}