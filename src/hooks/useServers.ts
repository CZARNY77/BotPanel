import { useCallback, useEffect, useState } from "react";
import { getUserServers } from "../api/client";
import { GuildServer } from "../api/types";

export function useServers() {
  const [servers, setServers] = useState<GuildServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  const loadServers = useCallback(async () => {
    setLoading(true);
    setUnauthorized(false);
    setError(null);
    try {
      const data = await getUserServers();
      setServers(data);
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 401) {
        setUnauthorized(true);
      } else {
        setError((err as Error).message ?? "Failed to load servers");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServers();
  }, [loadServers]);

  return { servers, loading, error, unauthorized, refresh: loadServers };
}
