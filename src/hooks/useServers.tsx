import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getServers } from "../api/endpoints/servers";
import type { Server } from "../api/types";

type ServersValue = {
  servers: Server[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

const ServersContext = createContext<ServersValue | null>(null);

export const LAST_SERVER_KEY = "conqbot.lastServerId";

export const rememberServer = (id: string) => {
  try {
    localStorage.setItem(LAST_SERVER_KEY, id);
  } catch {
    /* storage may be blocked */
  }
};

export const lastServer = () => {
  try {
    return localStorage.getItem(LAST_SERVER_KEY);
  } catch {
    return null;
  }
};

export const ServersProvider = ({ children }: { children: ReactNode }) => {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setServers(await getServers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load servers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return <ServersContext.Provider value={{ servers, loading, error, reload }}>{children}</ServersContext.Provider>;
};

export const useServers = (): ServersValue => {
  const value = useContext(ServersContext);
  if (!value) throw new Error("useServers must be used inside ServersProvider");
  return value;
};
