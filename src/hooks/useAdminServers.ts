// Every server the bot is on, for panel admins. Loaded on first need (All servers, Ctrl+K, a server outside
// the admin's own list) and kept for the session of the tab; `reload` asks the bot again.
import { useCallback, useEffect, useState } from "react";
import { getAdminServers } from "../api/endpoints/admin";
import type { AdminServer } from "../api/types";
import { translate } from "../i18n";

type State = { servers: AdminServer[]; total: number; loaded: boolean; loading: boolean; error: string | null };

let cache: State = { servers: [], total: 0, loaded: false, loading: false, error: null };
let pending: Promise<void> | null = null;
const listeners = new Set<(state: State) => void>();

const publish = (next: State) => {
  cache = next;
  listeners.forEach((listener) => listener(next));
};

const load = () => {
  if (pending) return pending;
  publish({ ...cache, loading: true, error: null });
  pending = getAdminServers()
    .then(({ servers, total }) => publish({ servers, total, loaded: true, loading: false, error: null }))
    .catch((err) => publish({ ...cache, loaded: true, loading: false, error: err instanceof Error ? err.message : translate("error.servers") }))
    .finally(() => {
      pending = null;
    });
  return pending;
};

export const useAdminServers = (enabled: boolean) => {
  const [state, setState] = useState(cache);

  useEffect(() => {
    listeners.add(setState);
    setState(cache);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  useEffect(() => {
    if (enabled && !cache.loaded && !cache.loading) void load();
  }, [enabled]);

  const reload = useCallback(() => load(), []);
  return { ...state, reload };
};
