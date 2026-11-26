import type { BotState } from "../../api/types";
import { useT, type MessageKey } from "../../i18n";

const labels: Record<BotState, { text: MessageKey; tone: string; title: MessageKey }> = {
  online: { text: "bot.online", tone: "var(--cb-ok)", title: "bot.onlineTitle" },
  starting: { text: "bot.starting", tone: "var(--cb-warn)", title: "bot.startingTitle" },
  offline: { text: "bot.offline", tone: "var(--cb-err)", title: "bot.offlineTitle" },
  unknown: { text: "bot.checking", tone: "var(--cb-text-muted)", title: "bot.checkingTitle" },
};

export const BotStatus = ({ state }: { state: BotState }) => {
  const { t } = useT();
  const label = labels[state];
  return (
    <span className="bot-status" title={t(label.title)} role="status">
      <span className="dot" style={{ color: label.tone }} aria-hidden="true" />
      <span className="bot-status__text">{t(label.text)}</span>
    </span>
  );
};
