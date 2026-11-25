import { useEffect, useState } from "react";
import { getHealth } from "../api/endpoints/servers";
import { onBotStarting } from "../api/http";
import type { BotState } from "../api/types";

const POLL_MS = 60_000;

/** K18: reads /api/health instead of the old always-green badge (B-08). */
export const useBotState = (): BotState => {
  const [state, setState] = useState<BotState>("unknown");

  useEffect(() => {
    let alive = true;
    let timer: number | undefined;
    const check = async () => {
      try {
        const health = await getHealth();
        if (!alive) return;
        if (health?.status === "not_ready") setState("offline");
        else setState(health?.ready ? "online" : "starting");
      } catch {
        if (alive) setState("offline");
      }
      timer = window.setTimeout(check, POLL_MS);
    };
    void check();
    const off = onBotStarting(() => setState("starting"));
    return () => {
      alive = false;
      window.clearTimeout(timer);
      off();
    };
  }, []);

  return state;
};
