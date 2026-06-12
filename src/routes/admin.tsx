import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { LogOut, Plus, Trash2, Pencil, Save, X } from 'lucide-react';
import { SiteLayout } from '@/components/site-layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/use-auth';
import { useIsAdmin } from '@/lib/use-is-admin';
import { useDraft } from '@/lib/use-draft';
import { ImageUploadField } from '@/components/image-upload-field';
import { composeLocation, VIRTUAL_PLATFORMS, type LocationDetails } from '@/lib/event-location';

export const Route = createFileRoute('/admin')({
  component: AdminPage,
});

type EventRow = {
  id?: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  location_type: string;
  location_details: LocationDetails;
  image_url: string | null;
  speakers: string | null;
  registration_url: string | null;
  theme: string | null;
  topic: string | null;
  status: 'upcoming' | 'past';
};

type EventSpeaker = {
  id?: string;
  name: string;
  title: string | null;
  photo_url: string | null;
  social_url: string | null;
};

function AdminPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'events' | 'announcement' | 'subscribers' | 'messages' | 'settings'>('events');

  useEffect(() => {
    // Double-check with the auth server before kicking the admin out — a
    // transient null during token refresh (backgrounded tab) is not a sign-out.
    if (authLoading || user) return;
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && !data.session) navigate({ to: '/auth' });
    });
    return () => {
      cancelled = true;
    };
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
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-24 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-purple">Admin</p>
            <h1 className="mt-2 font-display text-4xl text-brand-ink">Dashboard</h1>
            <p className="mt-2 break-all text-sm text-brand-ink/60">Signed in as {user.email}</p>
          </div>
          <button
            onClick={() => signOut().then(() => navigate({ to: '/' }))}
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm hover:border-brand-purple"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>

        <div className="mt-10 flex w-fit max-w-full flex-wrap gap-1 rounded-2xl border border-border bg-card p-1 sm:rounded-full">
          {(['events', 'announcement', 'subscribers', 'messages', 'settings'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1.5 text-xs capitalize transition-colors sm:px-5 sm:py-2 sm:text-sm ${
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
          {tab === 'announcement' && <AnnouncementAdmin />}
          {tab === 'subscribers' && <SubscribersAdmin />}
          {tab === 'messages' && <MessagesAdmin />}
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
  location_type: 'onsite',
  location_details: {},
  image_url: '',
  speakers: '',
  registration_url: '',
  theme: '',
  topic: '',
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

  const save = async (row: EventRow, speakerRows: EventSpeaker[]): Promise<boolean> => {
    const { id, ...rest } = row;
    const payload = {
      ...rest,
      event_date: new Date(row.event_date).toISOString(),
      location: composeLocation(row.location_type, row.location_details),
      speakers: speakerRows.map((s) => s.name.trim()).filter(Boolean).join(', '),
    };
    let eventId = id;
    if (id) {
      const { error } = await supabase.from('events').update(payload as any).eq('id', id);
      if (error) {
        toast.error(error.message);
        return false;
      }
    } else {
      const { data, error } = await supabase
        .from('events')
        .insert(payload as any)
        .select('id')
        .single();
      if (error || !data) {
        toast.error(error?.message ?? 'Could not create event');
        return false;
      }
      eventId = data.id;
    }

    // Replace this event's speaker list
    const sb = supabase as any;
    const { error: delErr } = await sb.from('event_speakers').delete().eq('event_id', eventId);
    if (delErr) {
      toast.error(`Event saved, but speakers failed: ${delErr.message}`);
      return false;
    }
    const cleanSpeakers = speakerRows
      .filter((s) => s.name.trim())
      .map((s, i) => ({
        event_id: eventId,
        name: s.name.trim(),
        title: s.title?.trim() || null,
        photo_url: s.photo_url || null,
        social_url: s.social_url?.trim() || null,
        display_order: i,
      }));
    if (cleanSpeakers.length > 0) {
      const { error: insErr } = await sb.from('event_speakers').insert(cleanSpeakers);
      if (insErr) {
        toast.error(`Event saved, but speakers failed: ${insErr.message}`);
        return false;
      }
    }

    toast.success('Saved — visible to all visitors');
    setEditing(null);
    qc.invalidateQueries({ queryKey: ['admin', 'events'] });
    qc.invalidateQueries({ queryKey: ['events'] });
    qc.invalidateQueries({ queryKey: ['event-speakers'] });
    qc.invalidateQueries({ queryKey: ['speakers'] });
    return true;
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    qc.invalidateQueries({ queryKey: ['admin', 'events'] });
    qc.invalidateQueries({ queryKey: ['events'] });
    qc.invalidateQueries({ queryKey: ['speakers'] });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
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
          key={editing.id ?? 'new'}
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
                onClick={() =>
                  setEditing({
                    ...(e as any),
                    location_type: (e as any).location_type ?? 'onsite',
                    location_details: (e as any).location_details ?? {},
                    event_date: new Date(e.event_date).toISOString().slice(0, 16),
                  } as EventRow)
                }
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
  onSave: (r: EventRow, speakers: EventSpeaker[]) => Promise<boolean>;
}) {
  const [r, setR] = useState<EventRow>(row);
  const [sp, setSp] = useState<EventSpeaker[]>([]);
  const [saving, setSaving] = useState(false);
  const u = <K extends keyof EventRow>(k: K, v: EventRow[K]) => setR((p) => ({ ...p, [k]: v }));
  const ud = (k: keyof LocationDetails, v: string) =>
    setR((p) => ({ ...p, location_details: { ...p.location_details, [k]: v } }));

  const draftKey = row.id ?? 'new';
  const draftR = useDraft(`event:${draftKey}:row`, r, setR);
  const draftSp = useDraft(`event:${draftKey}:speakers`, sp, setSp);

  // Load this event's existing speakers (unless a draft was restored)
  const { data: existingSp } = useQuery({
    queryKey: ['admin', 'event-speakers', row.id],
    enabled: !!row.id,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('event_speakers')
        .select('*')
        .eq('event_id', row.id)
        .order('display_order');
      return (data ?? []) as EventSpeaker[];
    },
  });
  useEffect(() => {
    if (existingSp && !draftSp.wasRestored && sp.length === 0 && existingSp.length > 0) {
      setSp(existingSp.map((s) => ({ id: s.id, name: s.name, title: s.title, photo_url: s.photo_url, social_url: s.social_url })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingSp]);

  const updateSpeaker = (i: number, patch: Partial<EventSpeaker>) =>
    setSp((p) => p.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSave(r, sp);
    setSaving(false);
    if (ok) {
      draftR.clear();
      draftSp.clear();
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-brand-purple/40 bg-card p-6">
      {(draftR.wasRestored || draftSp.wasRestored) && (
        <p className="mb-4 rounded-lg bg-brand-sand/60 px-3 py-2 text-xs text-brand-ink/70">
          Restored your unsaved draft. Save to publish it, or keep editing.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title">
          <input className={inputCls} value={r.title} onChange={(e) => u('title', e.target.value)} />
        </Field>
        <Field label="Date & time">
          <input type="datetime-local" className={inputCls} value={r.event_date} onChange={(e) => u('event_date', e.target.value)} />
        </Field>
        <Field label="Status">
          <select className={inputCls} value={r.status} onChange={(e) => u('status', e.target.value as 'upcoming' | 'past')}>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
        </Field>
        <Field label="Location type">
          <select
            className={inputCls}
            value={r.location_type}
            onChange={(e) => u('location_type', e.target.value)}
          >
            <option value="onsite">Onsite (physical address)</option>
            <option value="virtual">Virtual (online platform)</option>
          </select>
        </Field>

        {r.location_type === 'virtual' ? (
          <>
            <Field label="Streaming platform">
              <select
                className={inputCls}
                value={r.location_details.platform ?? ''}
                onChange={(e) => ud('platform', e.target.value)}
              >
                <option value="">Select a platform…</option>
                {VIRTUAL_PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </Field>
            {r.location_details.platform === 'Other' && (
              <Field label="Platform name">
                <input
                  className={inputCls}
                  value={r.location_details.custom_platform ?? ''}
                  onChange={(e) => ud('custom_platform', e.target.value)}
                />
              </Field>
            )}
          </>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:col-span-2 md:grid-cols-3">
            <Field label="House number">
              <input className={inputCls} value={r.location_details.house ?? ''} onChange={(e) => ud('house', e.target.value)} />
            </Field>
            <Field label="Street">
              <input className={inputCls} value={r.location_details.street ?? ''} onChange={(e) => ud('street', e.target.value)} />
            </Field>
            <Field label="City">
              <input className={inputCls} value={r.location_details.city ?? ''} onChange={(e) => ud('city', e.target.value)} />
            </Field>
            <Field label="State">
              <input className={inputCls} value={r.location_details.state ?? ''} onChange={(e) => ud('state', e.target.value)} />
            </Field>
            <Field label="Zip / postal code">
              <input className={inputCls} value={r.location_details.zip ?? ''} onChange={(e) => ud('zip', e.target.value)} />
            </Field>
            <Field label="Country">
              <input className={inputCls} value={r.location_details.country ?? ''} onChange={(e) => ud('country', e.target.value)} />
            </Field>
          </div>
        )}

        <Field label="Event flyer / image">
          <ImageUploadField
            value={r.image_url || null}
            onChange={(url) => u('image_url', url ?? '')}
            folder="events"
            label="Upload event flyer"
          />
        </Field>
        <Field label="Registration URL">
          <input className={inputCls} value={r.registration_url ?? ''} onChange={(e) => u('registration_url', e.target.value)} />
        </Field>
        <Field label="Theme">
          <input className={inputCls} value={r.theme ?? ''} onChange={(e) => u('theme', e.target.value)} />
        </Field>
        <Field label="Topic">
          <input className={inputCls} value={r.topic ?? ''} onChange={(e) => u('topic', e.target.value)} />
        </Field>
        <Field label="Description" full>
          <textarea rows={4} className={inputCls} value={r.description ?? ''} onChange={(e) => u('description', e.target.value)} />
        </Field>
      </div>

      {/* Speakers for this event */}
      <div className="mt-8 border-t border-border pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg text-brand-ink">Speakers for this event</h3>
            <p className="text-xs text-brand-ink/50">
              These appear on the event page and on the Speakers page (grouped by upcoming / past).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSp((p) => [...p, { name: '', title: '', photo_url: '', social_url: '' }])}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:border-brand-purple"
          >
            <Plus size={14} /> Add speaker
          </button>
        </div>
        {sp.length === 0 && (
          <p className="mt-4 rounded-lg border border-dashed border-border p-4 text-center text-sm text-brand-ink/50">
            No speakers added yet.
          </p>
        )}
        <div className="mt-4 space-y-4">
          {sp.map((s, i) => (
            <div key={i} className="rounded-xl border border-border bg-background p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <input className={inputCls} value={s.name} onChange={(e) => updateSpeaker(i, { name: e.target.value })} />
                </Field>
                <Field label="Title / role">
                  <input className={inputCls} value={s.title ?? ''} onChange={(e) => updateSpeaker(i, { title: e.target.value })} />
                </Field>
                <Field label="Photo">
                  <ImageUploadField
                    value={s.photo_url || null}
                    onChange={(url) => updateSpeaker(i, { photo_url: url ?? '' })}
                    folder="speakers"
                    label="Upload speaker photo"
                  />
                </Field>
                <Field label="Social URL (LinkedIn etc.)">
                  <input className={inputCls} value={s.social_url ?? ''} onChange={(e) => updateSpeaker(i, { social_url: e.target.value })} />
                </Field>
              </div>
              <button
                type="button"
                onClick={() => setSp((p) => p.filter((_, idx) => idx !== i))}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-destructive hover:border-destructive"
              >
                <Trash2 size={12} /> Remove speaker
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-brand-purple px-5 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
        >
          <Save size={14} /> {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onCancel} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm">
          <X size={14} /> Close (keeps draft)
        </button>
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
  const draft = useDraft('site-settings', form, setForm, !!form);

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
    draft.clear();
    toast.success('Settings saved — visible to all visitors');
    qc.invalidateQueries({ queryKey: ['site_settings'] });
    qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
  };

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-2xl">Site settings</h2>
      {draft.wasRestored && (
        <p className="mt-3 rounded-lg bg-brand-sand/60 px-3 py-2 text-xs text-brand-ink/70">
          Restored your unsaved draft. Save to publish it.
        </p>
      )}
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

/* ----------------- ANNOUNCEMENT BAR ----------------- */

function AnnouncementAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['admin', 'announcement'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('id, announcement_text, announcement_active')
        .limit(1)
        .maybeSingle();
      return data;
    },
  });
  const [form, setForm] = useState<any>(null);
  const draft = useDraft('announcement', form, setForm, !!form);
  useEffect(() => { if (data && !form) setForm(data); }, [data, form]);
  if (!form) return <p className="text-brand-ink/50">Loading…</p>;

  const save = async () => {
    const { error } = await supabase
      .from('site_settings')
      .update({
        announcement_text: form.announcement_text,
        announcement_active: form.announcement_active,
      })
      .eq('id', form.id);
    if (error) return toast.error(error.message);
    draft.clear();
    toast.success('Announcement updated — visible to all visitors');
    qc.invalidateQueries({ queryKey: ['site_settings'] });
    qc.invalidateQueries({ queryKey: ['admin', 'announcement'] });
  };

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-2xl">Announcement bar</h2>
      <p className="mt-1 text-sm text-brand-ink/60">
        A purple bar at the top of every page. Long text auto-scrolls.
      </p>
      {draft.wasRestored && (
        <p className="mt-3 rounded-lg bg-brand-sand/60 px-3 py-2 text-xs text-brand-ink/70">
          Restored your unsaved draft. Save to publish it.
        </p>
      )}
      <div className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-6">
        <Field label="Message">
          <textarea
            rows={3}
            className={inputCls}
            value={form.announcement_text ?? ''}
            onChange={(e) => setForm({ ...form, announcement_text: e.target.value })}
          />
        </Field>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!form.announcement_active}
            onChange={(e) => setForm({ ...form, announcement_active: e.target.checked })}
          />
          Show announcement bar on the site
        </label>
        <div>
          <button onClick={save} className="inline-flex items-center gap-2 rounded-full bg-brand-purple px-5 py-2 text-sm text-white hover:opacity-90">
            <Save size={14} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------- NEWSLETTER SUBSCRIBERS ----------------- */

function SubscribersAdmin() {
  const { data } = useQuery({
    queryKey: ['admin', 'subscribers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const exportCsv = () => {
    const rows = data ?? [];
    const header = 'email,created_at\n';
    const body = rows.map((r: any) => `${r.email},${r.created_at}`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wil-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Newsletter subscribers</h2>
          <p className="mt-1 text-sm text-brand-ink/60">{data?.length ?? 0} total</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={!data?.length}
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm hover:border-brand-purple disabled:opacity-50"
        >
          Download CSV
        </button>
      </div>
      <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
        {(data ?? []).map((s: any) => (
          <div key={s.id} className="flex items-center justify-between gap-4 p-4">
            <p className="truncate text-sm text-brand-ink">{s.email}</p>
            <p className="text-xs text-brand-ink/50">{new Date(s.created_at).toLocaleDateString()}</p>
          </div>
        ))}
        {data && data.length === 0 && (
          <p className="p-6 text-center text-sm text-brand-ink/50">No subscribers yet.</p>
        )}
      </div>
    </div>
  );
}

/* ----------------- CONTACT MESSAGES ----------------- */

function MessagesAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['admin', 'messages'],
    queryFn: async () => {
      const { data } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const remove = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    const { error } = await supabase.from('contact_messages').delete().eq('id', id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ['admin', 'messages'] });
  };

  return (
    <div>
      <h2 className="font-display text-2xl">Contact messages</h2>
      <p className="mt-1 text-sm text-brand-ink/60">{data?.length ?? 0} total</p>
      <div className="mt-6 space-y-3">
        {(data ?? []).map((m: any) => (
          <div key={m.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-brand-ink">{m.name}</p>
                <a href={`mailto:${m.email}`} className="text-sm text-brand-purple hover:underline">{m.email}</a>
                <p className="mt-1 text-xs text-brand-ink/50">{new Date(m.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => remove(m.id)} className="rounded-full border border-border p-2 text-destructive hover:border-destructive">
                <Trash2 size={14} />
              </button>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-brand-ink/80">{m.message}</p>
          </div>
        ))}
        {data && data.length === 0 && (
          <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-brand-ink/50">No messages yet.</p>
        )}
      </div>
    </div>
  );
}