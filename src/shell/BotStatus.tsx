import { useEffect, useState } from "react";
import { getHealth } from "../api/endpoints/servers";
import { onBotStarting } from "../api/http";
import type { BotState } from "../api/types";

const POLL_MS = 60_000;

const labels: Record<BotState, { text: string; tone: string; title: string }> = {
  online: { text: "Online", tone: "var(--bd-ok)", title: "ConqBot is online" },
  starting: { text: "Starting", tone: "var(--bd-warn)", title: "ConqBot is starting. Changes may take a moment." },
  offline: { text: "Offline", tone: "var(--bd-err)", title: "ConqBot is not responding" },
  unknown: { text: "Checking", tone: "var(--bd-text-muted)", title: "Checking bot status" },
};

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

export const BotStatus = ({ state }: { state: BotState }) => {
  const label = labels[state];
  return (
    <span className="bot-status" title={label.title} role="status">
      <span className="dot" style={{ color: label.tone }} aria-hidden="true" />
      <span className="bot-status__text">{label.text}</span>
    </span>
  );
};
