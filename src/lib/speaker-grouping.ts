export type SpeakerEvent = {
  id: string;
  title: string;
  event_date: string;
  status: string;
};

export type SpeakerRow = {
  id: string;
  profile_id?: string | null;
  slug: string;
  name: string;
  title: string | null;
  bio: string | null;
  photo_url: string | null;
  social_url: string | null;
  gender: string | null;
  events: SpeakerEvent | null;
};

export type GroupedSpeaker = Omit<SpeakerRow, 'events' | 'title'> & {
  roles: string[];
  events: SpeakerEvent[];
};

/**
 * Normalizes legacy names for matching only. Stable profile IDs always win;
 * this fallback handles accents, punctuation, and spacing without using loose
 * partial-name matching that could combine different people.
 */
export function normalizeSpeakerName(name: string) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function detailsScore(row: SpeakerRow) {
  return (row.bio ? 4 : 0) + (row.photo_url ? 2 : 0) + (row.social_url ? 1 : 0) + (row.title ? 1 : 0);
}

function addRole(roles: string[], role: string | null) {
  const cleanRole = role?.trim();
  if (!cleanRole || roles.some((existing) => existing.toLowerCase() === cleanRole.toLowerCase())) return;
  roles.push(cleanRole);
}

export function mergeSpeakerRows(rows: SpeakerRow[]): GroupedSpeaker[] {
  const profileKeysByName = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!row.profile_id) continue;
    const nameKey = normalizeSpeakerName(row.name);
    const keys = profileKeysByName.get(nameKey) ?? new Set<string>();
    keys.add(`profile:${row.profile_id}`);
    profileKeysByName.set(nameKey, keys);
  }

  const groups = new Map<string, GroupedSpeaker>();

  for (const row of rows) {
    const nameKey = normalizeSpeakerName(row.name);
    const profileKeys = profileKeysByName.get(nameKey);
    // A legacy row with no profile ID may join a profile only when there is
    // exactly one unambiguous profile for its normalized name.
    const key = row.profile_id
      ? `profile:${row.profile_id}`
      : profileKeys?.size === 1
        ? Array.from(profileKeys)[0]
        : `legacy:${nameKey}`;
    const current = groups.get(key);

    if (!current) {
      groups.set(key, {
        id: row.id,
        profile_id: row.profile_id ?? null,
        slug: row.slug,
        name: row.name.trim(),
        bio: row.bio,
        photo_url: row.photo_url,
        social_url: row.social_url,
        gender: row.gender,
        roles: row.title?.trim() ? [row.title.trim()] : [],
        events: row.events ? [row.events] : [],
      });
      continue;
    }

    const bestRow = detailsScore(row) > detailsScore(current) ? row : null;
    const eventIds = new Set(current.events.map((event) => event.id));
    addRole(current.roles, row.title);
    if (row.events && !eventIds.has(row.events.id)) current.events.push(row.events);
    if (bestRow) {
      current.name = bestRow.name.trim();
      current.slug = bestRow.slug;
      current.bio = bestRow.bio || current.bio;
      current.photo_url = bestRow.photo_url || current.photo_url;
      current.social_url = bestRow.social_url || current.social_url;
      current.gender = bestRow.gender || current.gender;
    } else {
      current.bio ||= row.bio;
      current.photo_url ||= row.photo_url;
      current.social_url ||= row.social_url;
      current.gender ||= row.gender;
    }
  }

  return Array.from(groups.values()).map((speaker) => ({
    ...speaker,
    events: speaker.events.sort(
      (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime(),
    ),
  }));
}