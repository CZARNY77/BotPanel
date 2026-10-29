// Editable copy of a resource + registry of unsaved changes (one bar for the whole app).
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { errorText, useToast } from "../components/ui/Toast";
import type { Resource } from "./useServerResource";

type Registration = {
  label: string;
  dirty: boolean;
  saving: boolean;
  save: () => Promise<boolean>;
  reset: () => void;
};

type UnsavedApi = {
  entries: Registration[];
  register: (id: string, reg: Registration | null) => void;
  hasDirty: boolean;
  saving: boolean;
  saveAll: () => Promise<void>;
  discardAll: () => void;
  /** Returns true (and draws attention to the bar) when navigation must be blocked. */
  block: () => boolean;
  shakeKey: number;
};

const UnsavedContext = createContext<UnsavedApi | null>(null);

export const UnsavedChangesProvider = ({ children }: { children: ReactNode }) => {
  const [map, setMap] = useState<Record<string, Registration>>({});
  const [shakeKey, setShakeKey] = useState(0);

  const register = useCallback((id: string, reg: Registration | null) => {
    setMap((prev) => {
      if (!reg) {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      }
      const current = prev[id];
      if (current && current.dirty === reg.dirty && current.saving === reg.saving) return prev;
      return { ...prev, [id]: reg };
    });
  }, []);

  const entries = useMemo(() => Object.values(map).filter((entry) => entry.dirty), [map]);
  const hasDirty = entries.length > 0;

  useEffect(() => {
    if (!hasDirty) return undefined;
    const onUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [hasDirty]);

  const api = useMemo<UnsavedApi>(
    () => ({
      entries,
      register,
      hasDirty,
      saving: entries.some((entry) => entry.saving),
      saveAll: async () => {
        for (const entry of entries) {
          const ok = await entry.save();
          if (!ok) return;
        }
      },
      discardAll: () => entries.forEach((entry) => entry.reset()),
      block: () => {
        if (!hasDirty) return false;
        setShakeKey((key) => key + 1);
        return true;
      },
      shakeKey,
    }),
    [entries, register, hasDirty, shakeKey]
  );

  return <UnsavedContext.Provider value={api}>{children}</UnsavedContext.Provider>;
};

export const useUnsavedChanges = (): UnsavedApi => {
  const value = useContext(UnsavedContext);
  if (!value) throw new Error("useUnsavedChanges must be used inside UnsavedChangesProvider");
  return value;
};

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

let editableSeq = 0;

export type Editable<T> = {
  value: T | undefined;
  set: (next: T | ((prev: T) => T)) => void;
  dirty: boolean;
  saving: boolean;
  save: () => Promise<boolean>;
  reset: () => void;
};

export function useEditable<T>(
  resource: Resource<T>,
  options: {
    label: string;
    save: (value: T) => Promise<T>;
    validate?: (value: T) => string | null;
    successMessage?: string;
  }
): Editable<T> {
  const toast = useToast();
  const { register } = useUnsavedChanges();
  const idRef = useRef(`editable-${++editableSeq}`);
  const [draft, setDraft] = useState<T | undefined>(resource.data);
  const [saving, setSaving] = useState(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const setResourceData = resource.setData;

  // Take fresh server data when it arrives (initial load, reload).
  useEffect(() => {
    setDraft(resource.data);
  }, [resource.data]);

  const dirty = draft !== undefined && resource.data !== undefined && !same(draft, resource.data);

  const save = useCallback(async (): Promise<boolean> => {
    if (draft === undefined) return false;
    const { validate, save: persist, label, successMessage } = optionsRef.current;
    const problem = validate?.(draft) ?? null;
    if (problem) {
      toast.error(problem);
      return false;
    }
    setSaving(true);
    try {
      const saved = await persist(draft);
      setResourceData(saved);
      setDraft(saved);
      toast.success(successMessage ?? `${label} saved.`);
      return true;
    } catch (err) {
      toast.error(errorText(err, `Failed to save ${label.toLowerCase()}.`));
      return false;
    } finally {
      setSaving(false);
    }
  }, [draft, setResourceData, toast]);

  const reset = useCallback(() => setDraft(resource.data), [resource.data]);

  // The registry only re-renders when dirty/saving change; functions are read through refs.
  const saveRef = useRef(save);
  const resetRef = useRef(reset);
  saveRef.current = save;
  resetRef.current = reset;

  useEffect(() => {
    register(idRef.current, {
      label: optionsRef.current.label,
      dirty,
      saving,
      save: () => saveRef.current(),
      reset: () => resetRef.current(),
    });
  }, [register, dirty, saving]);

  useEffect(() => {
    const id = idRef.current;
    return () => register(id, null);
  }, [register]);

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setDraft((prev) => {
      if (prev === undefined) return prev;
      return typeof next === "function" ? (next as (p: T) => T)(prev) : next;
    });
  }, []);

  return { value: draft, set, dirty, saving, save, reset };
}
