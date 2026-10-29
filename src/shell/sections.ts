import type { IconName } from "../components/ui/Icon";

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
  label: string;
  icon: IconName;
  hue: string;
  keywords: string;
  adminOnly?: boolean;
};

export const sections: SectionDef[] = [
  { key: "overview", label: "Overview", icon: "overview", hue: "var(--cb-hue-overview)", keywords: "home dashboard status" },
  { key: "greetings", label: "Greetings", icon: "greetings", hue: "var(--cb-hue-greetings)", keywords: "welcome farewell join leave message" },
  { key: "events", label: "Events", icon: "events", hue: "var(--cb-hue-events)", keywords: "signups calendar ping rsvp" },
  { key: "voice-snapshots", label: "Voice snapshots", icon: "voice", hue: "var(--cb-hue-voice)", keywords: "presence attendance schedule history" },
  { key: "emoji-triggers", label: "Emoji triggers", icon: "emoji", hue: "var(--cb-hue-emoji)", keywords: "image random reaction" },
  { key: "role-reactions", label: "Role reactions", icon: "reactions", hue: "var(--cb-hue-reactions)", keywords: "self assign roles emoji" },
  { key: "autorole", label: "Auto role", icon: "autorole", hue: "var(--cb-hue-autorole)", keywords: "join role new member" },
  { key: "moderation", label: "Moderation", icon: "moderation", hue: "var(--cb-hue-moderation)", keywords: "anti-spam ban unban timeout dm warthog" },
  { key: "settings", label: "Settings", icon: "settings", hue: "var(--cb-hue-settings)", keywords: "timezone time zone server" },
  { key: "console", label: "Console", icon: "console", hue: "var(--cb-hue-console)", keywords: "logs admins admin", adminOnly: true },
];

export const sectionByKey = new Map(sections.map((section) => [section.key, section]));

export const sectionPath = (serverId: string, key: SectionKey, search = "") =>
  `/dashboard/${serverId}/${key}${search}`;
