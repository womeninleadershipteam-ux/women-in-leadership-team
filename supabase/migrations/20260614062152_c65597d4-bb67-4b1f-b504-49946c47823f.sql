ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS image_aspect_ratio text NOT NULL DEFAULT '1:1';

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_image_aspect_ratio_check;

ALTER TABLE public.events
  ADD CONSTRAINT events_image_aspect_ratio_check
  CHECK (image_aspect_ratio IN ('4:5', '3:4', '1:1'));

ALTER TABLE public.event_speakers
  ADD COLUMN IF NOT EXISTS photo_aspect_ratio text NOT NULL DEFAULT '4:5';

ALTER TABLE public.event_speakers
  DROP CONSTRAINT IF EXISTS event_speakers_photo_aspect_ratio_check;

ALTER TABLE public.event_speakers
  ADD CONSTRAINT event_speakers_photo_aspect_ratio_check
  CHECK (photo_aspect_ratio IN ('4:5', '3:4', '1:1'));