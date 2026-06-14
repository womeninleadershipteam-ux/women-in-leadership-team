import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const TEN_YEARS_SECONDS = 60 * 60 * 24 * 365 * 10;
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
type ImageRatio = '4:5' | '3:4' | '1:1';

const RATIO_VALUES: Record<ImageRatio, number> = {
  '4:5': 4 / 5,
  '3:4': 3 / 4,
  '1:1': 1,
};

function ratioToCss(ratio: ImageRatio) {
  return ratio.replace(':', ' / ');
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image'));
    };
    img.src = url;
  });
}

async function cropToRatio(file: File, ratio: ImageRatio): Promise<File> {
  const img = await loadImage(file);
  const targetRatio = RATIO_VALUES[ratio];
  const imageRatio = img.naturalWidth / img.naturalHeight;
  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;

  if (imageRatio > targetRatio) {
    sw = img.naturalHeight * targetRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else if (imageRatio < targetRatio) {
    sh = img.naturalWidth / targetRatio;
    sy = (img.naturalHeight - sh) / 2;
  }

  const outputWidth = ratio === '1:1' ? 1200 : ratio === '4:5' ? 1200 : 1200;
  const outputHeight = ratio === '1:1' ? 1200 : ratio === '4:5' ? 1500 : 1600;
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not prepare image crop');
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outputWidth, outputHeight);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  if (!blob) throw new Error('Could not crop image');
  const safeName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]+/gi, '-').toLowerCase();
  return new File([blob], `${safeName || 'image'}-${ratio.replace(':', 'x')}.jpg`, {
    type: 'image/jpeg',
  });
}

/**
 * Uploads an image to the private `event-images` bucket and returns a
 * long-lived signed URL so every visitor can view it.
 */
export function ImageUploadField({
  value,
  onChange,
  folder,
  label = 'Upload image',
  defaultRatio = '1:1',
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  label?: string;
  defaultRatio?: ImageRatio;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [ratio, setRatio] = useState<ImageRatio>(defaultRatio);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      toast.error('Image must be under 20MB');
      return;
    }
    setUploading(true);
    try {
      const cropped = await cropToRatio(file, ratio);
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('event-images')
        .upload(path, cropped, { contentType: cropped.type, upsert: false });
      if (upErr) throw upErr;
      const { data, error: signErr } = await supabase.storage
        .from('event-images')
        .createSignedUrl(path, TEN_YEARS_SECONDS);
      if (signErr || !data?.signedUrl) throw signErr ?? new Error('Could not create image link');
      onChange(data.signedUrl);
      toast.success('Image uploaded');
    } catch (e: any) {
      toast.error(e?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
      {value ? (
        <div className="flex items-center gap-3">
          <img src={value} alt="Uploaded preview" className="h-16 w-16 rounded-lg border border-border object-cover" />
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs hover:border-brand-purple disabled:opacity-50"
            >
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} Replace
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-destructive hover:border-destructive"
            >
              <X size={12} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-4 text-sm text-brand-ink/60 hover:border-brand-purple hover:text-brand-purple disabled:opacity-50"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? 'Uploading…' : label}
        </button>
      )}
    </div>
  );
}