// Classification of bot logs by message text (fragile; later: a `category` field in the bot's logs).
import type { AdminLogEntry } from "../../api/types";
import type { IconName } from "../../components/ui/Icon";

export type LogCategory = "all" | "house" | "guild" | "events" | "errors" | "other";

export const categories: { key: LogCategory; label: string; icon: IconName }[] = [
  { key: "all", label: "All", icon: "menu" },
  { key: "house", label: "House joins", icon: "users" },
  { key: "guild", label: "Bot joins", icon: "globe" },
  { key: "events", label: "Events", icon: "events" },
  { key: "errors", label: "Errors", icon: "warning" },
  { key: "other", label: "Other", icon: "info" },
];

const text = (value?: string | null) => (value ?? "").toLowerCase();

const isError = (log: AdminLogEntry) => ["error", "critical"].includes(text(log.level));

const isHouse = (log: AdminLogEntry) => {
  const m = text(log.message);
  const l = text(log.logger);
  return m.includes("joined house") || m.includes("join house") || m.includes("added to house") || m.includes("added to the house") || l.includes("recruitment") || l.includes("houses_manager");
};

const isGuild = (log: AdminLogEntry) => {
  const m = text(log.message);
  const l = text(log.logger);
  return (
    ["added to a new server", "removed from server", "guild join", "guild leave", "joined server"].some((t) => m.includes(t)) ||
    ["guild_log_service", "bot_join_guild", "on_guild_join", "on_guild_remove"].some((t) => l.includes(t))
  );
};

const isEvent = (log: AdminLogEntry) => {
  const m = text(log.message);
  const l = text(log.logger);
  return m.includes("event") || m.includes("attendance") || m.includes("signup") || l.includes("event") || l.includes("attendance");
};

export const filterLogs = (logs: AdminLogEntry[], category: LogCategory) => {
  switch (category) {
    case "house":
      return logs.filter(isHouse);
    case "guild":
      return logs.filter(isGuild);
    case "events":
      return logs.filter(isEvent);
    case "errors":
      return logs.filter(isError);
    case "other":
      return logs.filter((log) => !isError(log) && !isHouse(log) && !isGuild(log) && !isEvent(log));
    default:
      return logs;
  }
};
