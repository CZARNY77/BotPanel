// Per-server data cache. <ServerScope key={serverId}> creates a fresh cache, so switching
// servers can never show another server's data (replaces the old manual isActiveServer checks).
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Server } from "../api/types";

type Entry = { data?: unknown; promise?: Promise<unknown> };

type ScopeValue = {
  server: Server;
  serverId: string;
  cache: Map<string, Entry>;
};

const ScopeContext = createContext<ScopeValue | null>(null);

export const ServerScope = ({ server, children }: { server: Server; children: ReactNode }) => {
  const cache = useRef(new Map<string, Entry>());
  return (
    <ScopeContext.Provider value={{ server, serverId: server.id, cache: cache.current }}>
      {children}
    </ScopeContext.Provider>
  );
};

export const useServerScope = (): ScopeValue => {
  const value = useContext(ScopeContext);
  if (!value) throw new Error("useServerScope must be used inside ServerScope");
  return value;
};

export type Resource<T> = {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  setData: (next: T | ((prev: T | undefined) => T)) => void;
};

export function useServerResource<T>(key: string, fetcher: (serverId: string) => Promise<T>): Resource<T> {
  const { serverId, cache } = useServerScope();
  const [data, setDataState] = useState<T | undefined>(() => cache.get(key)?.data as T | undefined);
  const [loading, setLoading] = useState(data === undefined);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(
    async (force: boolean) => {
      const entry = cache.get(key) ?? {};
      if (!force && entry.data !== undefined) {
        setDataState(entry.data as T);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const promise = !force && entry.promise ? entry.promise : fetcherRef.current(serverId);
        cache.set(key, { ...entry, promise });
        const result = (await promise) as T;
        cache.set(key, { data: result });
        setDataState(result);
      } catch (err) {
        cache.set(key, {});
        setError(err instanceof Error ? err.message : "Request failed.");
      } finally {
        setLoading(false);
      }
    },
    [cache, key, serverId]
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const setData = useCallback(
    (next: T | ((prev: T | undefined) => T)) => {
      setDataState((prev) => {
        const value = typeof next === "function" ? (next as (p: T | undefined) => T)(prev) : next;
        cache.set(key, { data: value });
        return value;
      });
    },
    [cache, key]
  );

  return { data, loading, error, reload: () => load(true), setData };
}
