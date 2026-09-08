import { describe, expect, test } from 'bun:test';
import { mergeSpeakerRows } from './speaker-grouping';

const event = (id: string, title: string) => ({
  id,
  title,
  event_date: '2026-01-01T12:00:00Z',
  status: 'past',
});

const row = (overrides: Partial<Parameters<typeof mergeSpeakerRows>[0][number]> = {}) => ({
  id: overrides.id ?? crypto.randomUUID(),
  profile_id: overrides.profile_id ?? null,
  slug: overrides.slug ?? 'speaker',
  name: overrides.name ?? 'Maranatha Ovbiagele',
  title: overrides.title ?? 'Speaker',
  bio: overrides.bio ?? null,
  photo_url: overrides.photo_url ?? null,
  social_url: overrides.social_url ?? null,
  gender: overrides.gender ?? 'female',
  events: overrides.events ?? event('event-1', 'Women in Leadership 1.0'),
});

describe('speaker profile grouping', () => {
  test('renders repeat event appearances as one grouped profile card', () => {
    const grouped = mergeSpeakerRows([
      row({ profile_id: 'profile-1', title: 'Host', events: event('event-1', 'First event') }),
      row({ profile_id: 'profile-1', title: 'Speaker', events: event('event-2', 'Second event') }),
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.events).toHaveLength(2);
    expect(grouped[0]?.roles).toEqual(['Host', 'Speaker']);
  });

  test('handles punctuation, spacing, and accents for legacy rows', () => {
    const grouped = mergeSpeakerRows([
      row({ profile_id: null, name: 'Zoë  Ade-ola', title: 'Host' }),
      row({ profile_id: null, name: "Zoe Adeola", title: 'Moderator', events: event('event-2', 'Second event') }),
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.events).toHaveLength(2);
  });

  test('does not merge two stable profiles with the same name', () => {
    const grouped = mergeSpeakerRows([
      row({ profile_id: 'profile-1', title: 'Host' }),
      row({ profile_id: 'profile-2', title: 'Speaker', events: event('event-2', 'Second event') }),
    ]);

    expect(grouped).toHaveLength(2);
  });
});