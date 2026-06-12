import { useEffect, useRef, useState } from 'react';

/**
 * Persists unsaved form state to localStorage so admins never lose work.
 * - Restores a draft on mount (returns wasRestored so callers can show a hint)
 * - Saves on every change (debounced via microtask batching of React renders)
 * - clear() removes the draft after a successful save / cancel
 */
export function useDraft<T>(key: string, value: T, setValue: (v: T) => void, enabled = true) {
  const storageKey = `wil-draft:${key}`;
  const restored = useRef(false);
  const [wasRestored, setWasRestored] = useState(false);

  // Restore once on mount
  useEffect(() => {
    if (!enabled || restored.current || typeof window === 'undefined') return;
    restored.current = true;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setValue(JSON.parse(raw) as T);
        setWasRestored(true);
      }
    } catch {
      /* ignore corrupt drafts */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, storageKey]);

  // Save on change (after restore attempt)
  useEffect(() => {
    if (!enabled || !restored.current || typeof window === 'undefined') return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      /* storage full — ignore */
    }
  }, [value, enabled, storageKey]);

  const clear = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  };

  return { clear, wasRestored };
}