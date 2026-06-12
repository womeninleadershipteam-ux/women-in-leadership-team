export type OnsiteDetails = {
  house?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
};

export type VirtualDetails = {
  platform?: string;
  custom_platform?: string;
};

export type LocationDetails = OnsiteDetails & VirtualDetails;

export const VIRTUAL_PLATFORMS = [
  'Google Meet',
  'Zoom',
  'Microsoft Teams',
  'YouTube Live',
  'Instagram Live',
  'Facebook Live',
  'X (Twitter) Spaces',
  'Telegram',
  'WhatsApp',
  'Other',
] as const;

/** Builds the human-readable location string shown to visitors. */
export function composeLocation(type: string, d: LocationDetails): string {
  if (type === 'virtual') {
    const platform = d.platform === 'Other' ? d.custom_platform : d.platform;
    return platform ? `Virtual — ${platform}` : 'Virtual';
  }
  const line1 = [d.house, d.street].filter(Boolean).join(' ');
  return [line1, d.city, d.state, d.zip, d.country].filter(Boolean).join(', ');
}