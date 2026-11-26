import type { IconName } from "../components/ui/Icon";
import type { MessageKey } from "../i18n";

export type SectionKey =
  | "overview"
  | "greetings"
  | "events"
  | "voice-snapshots"
  | "emoji-triggers"
  | "role-reactions"
  | "autorole"
  | "moderation"
  | "settings"
  | "console";

export type SectionDef = {
  key: SectionKey;
  /** i18n key of the label. */
  label: MessageKey;
  icon: IconName;
  hue: string;
  keywords: string;
  adminOnly?: boolean;
};

export const sections: SectionDef[] = [
  { key: "overview", label: "section.overview", icon: "overview", hue: "var(--cb-hue-overview)", keywords: "home dashboard status przegląd start" },
  { key: "greetings", label: "section.greetings", icon: "greetings", hue: "var(--cb-hue-greetings)", keywords: "welcome farewell join leave message powitania pożegnania" },
  { key: "events", label: "section.events", icon: "events", hue: "var(--cb-hue-events)", keywords: "signups calendar ping rsvp wydarzenia zapisy" },
  { key: "voice-snapshots", label: "section.voice-snapshots", icon: "voice", hue: "var(--cb-hue-voice)", keywords: "presence attendance schedule history obecność głos" },
  { key: "emoji-triggers", label: "section.emoji-triggers", icon: "emoji", hue: "var(--cb-hue-emoji)", keywords: "image random reaction emoji obrazek" },
  { key: "role-reactions", label: "section.role-reactions", icon: "reactions", hue: "var(--cb-hue-reactions)", keywords: "self assign roles emoji role reakcje" },
  { key: "autorole", label: "section.autorole", icon: "autorole", hue: "var(--cb-hue-autorole)", keywords: "join role new member rola nowy" },
  { key: "moderation", label: "section.moderation", icon: "moderation", hue: "var(--cb-hue-moderation)", keywords: "anti-spam ban unban timeout dm warthog moderacja spam" },
  { key: "settings", label: "section.settings", icon: "settings", hue: "var(--cb-hue-settings)", keywords: "timezone time zone server ustawienia strefa czasowa" },
  { key: "console", label: "section.console", icon: "console", hue: "var(--cb-hue-console)", keywords: "logs admins admin konsola logi", adminOnly: true },
];

export const sectionByKey = new Map(sections.map((section) => [section.key, section]));

export const sectionPath = (serverId: string, key: SectionKey, search = "") =>
  `/dashboard/${serverId}/${key}${search}`;
