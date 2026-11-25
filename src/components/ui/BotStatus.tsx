import type { BotState } from "../../api/types";

const labels: Record<BotState, { text: string; tone: string; title: string }> = {
  online: { text: "Online", tone: "var(--bd-ok)", title: "ConqBot is online" },
  starting: { text: "Starting", tone: "var(--bd-warn)", title: "ConqBot is starting. Changes may take a moment." },
  offline: { text: "Offline", tone: "var(--bd-err)", title: "ConqBot is not responding" },
  unknown: { text: "Checking", tone: "var(--bd-text-muted)", title: "Checking bot status" },
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
