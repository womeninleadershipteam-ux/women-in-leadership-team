import femaleUrl from '@/assets/speaker-placeholder-female.jpg';
import maleUrl from '@/assets/speaker-placeholder-male.jpg';

export type SpeakerGender = 'female' | 'male' | 'unspecified';

export function speakerPhotoUrl(s: { photo_url?: string | null; gender?: string | null }): string {
  if (s.photo_url) return s.photo_url;
  return s.gender === 'male' ? maleUrl : femaleUrl;
}