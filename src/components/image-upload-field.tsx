import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const TEN_YEARS_SECONDS = 60 * 60 * 24 * 365 * 10;
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Uploads an image to the private `event-images` bucket and returns a
 * long-lived signed URL so every visitor can view it.
 */
export function ImageUploadField({
  value,
  onChange,
  folder,
  label = 'Upload image',
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image must be under 5MB');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('event-images')
        .upload(path, file, { contentType: file.type, upsert: false });
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