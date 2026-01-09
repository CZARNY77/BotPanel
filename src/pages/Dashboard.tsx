import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  createEvent,
  deleteEvent,
  getEmojis,
  getEmojiTriggers,
  getEvents,
  getFarewellSettings,
  getInviteUrl,
  getAdminLogs,
  getAdminUsers,
  getRoleReactions,
  getServerMetadata,
  getServers,
  getAutorole,
  getWelcomeSettings,
  getWarthog,
  pingEvent,
  uploadImage,
  updateAutorole,
  updateEmojiTriggers,
  updateEvent,
  updateFarewellSettings,
  addAdminUser,
  removeAdminUser,
  getVoicePresenceSettings,
  updateVoicePresenceSettings,
  runVoicePresence,
  getVoicePresenceLogs,
  deleteVoicePresenceLog,
  updateRoleReactions,
  updateWelcomeSettings,
  updateWarthog,
} from "../api/client";
import type {
  EmojiTrigger,
  EmojiTriggerSettings,
  EmojiOption,
  AdminLogEntry,
  EventInput,
  EventItem,
  EventPingMode,
  FarewellSettings,
  AutoRoleSettings,
  RoleReactionMessage,
  RoleReactionSettings,
  Server,
  ServerMetadata,
  WarthogSettings,
  VoicePresenceLog,
  VoicePresenceSettings,
  WelcomeSettings,
} from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";
import { LoadingScreen } from "../components/LoadingScreen";
import { SearchableSelect } from "../components/SearchableSelect";
import logo from "../assets/logo.png";
import defaultEmojiOptionsRaw from "../data/default-emojis.json";

type SectionKey =
  | "overview"
  | "welcome"
  | "events"
  | "presence"
  | "emoji"
  | "role-reactions"
  | "autorole"
  | "admin"
  | "other";

type TriggerRow = {
  id: string;
  emoji: string;
  images: TriggerImageRow[];
};

type RoleReactionMessageDraft = Omit<RoleReactionMessage, "embed"> & {
  key: string;
  embed: NonNullable<RoleReactionMessage["embed"]>;
};

type TriggerImageRow = {
  id: string;
  imageUrl: string;
  uploadFile?: File | null;
  previewUrl?: string;
  uploading?: boolean;
};

type LogSource = "conqbot" | "botpanel";
type AdminLogCategory = "all" | "house" | "guild" | "events" | "errors" | "other";

type LoadedState = {
  metadata: boolean;
  welcome: boolean;
  farewell: boolean;
  events: boolean;
  presence: boolean;
  emoji: boolean;
  roleReactions: boolean;
  warthog: boolean;
  autorole: boolean;
};

type LoadingState = LoadedState;

const sections: { key: SectionKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "welcome", label: "Greetings & Farewells" },
  { key: "events", label: "Event Creator" },
  { key: "presence", label: "Voice Presence" },
  { key: "emoji", label: "Emoji Triggers" },
  { key: "role-reactions", label: "Role Reactions" },
  { key: "autorole", label: "Auto Role" },
  { key: "other", label: "Other" },
];

const adminSection = { key: "admin" as const, label: "Admin Console" };

const sectionKeys = new Set([...sections, adminSection].map((section) => section.key));

const sectionIcons: Record<SectionKey, JSX.Element> = {
  overview: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 11.5L12 4l9 7.5M5 10v9h5v-6h4v6h5v-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  welcome: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 10h.01M16 10h.01M7 14c1.4 1 3 1.5 5 1.5s3.6-.5 5-1.5M4 12a8 8 0 1 0 16 0 8 8 0 0 0-16 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  events: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 3v4M17 3v4M4 9h16M6 13h4M6 17h4M14 13h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  presence: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 20a8 8 0 0 1 16 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 7h2m-1-1v2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  emoji: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3l1.8 4 4.2 1.1-3 3.1.7 4.4-3.7-2.2-3.7 2.2.7-4.4-3-3.1 4.2-1.1L12 3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  "role-reactions": (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 11a4 4 0 1 0 8 0 4 4 0 0 0-8 0M4 20v-1a4 4 0 0 1 4-4h4M14.5 18l1.5 1.5L20 15.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  autorole: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3l7 3v5c0 5-3 9-7 11-4-2-7-6-7-11V6l7-3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3l7 3v5c0 5-3 9-7 11-4-2-7-6-7-11V6l7-3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12.5l1.5 1.5 3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  other: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 6h10M4 12h16M4 18h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

const fallbackChannels = [
  { id: "#welcome", name: "#welcome" },
  { id: "#general", name: "#general" },
  { id: "#announcements", name: "#announcements" },
  { id: "#events", name: "#events" },
];

const fallbackRoles = [
  { id: "Raid", name: "Raid" },
  { id: "Guild", name: "Guild" },
  { id: "Officers", name: "Officers" },
  { id: "Everyone", name: "Everyone" },
];

const defaultEmojiOptions = defaultEmojiOptionsRaw as EmojiOption[];

const emptyWelcome: WelcomeSettings = {
  enabled: true,
  channelId: "",
  type: "embed",
  text: "Welcome {user} to {server}.",
  embed: {
    title: "Welcome aboard!",
    description: "Hey {user}, glad to have you in {server}.",
    color: "#2f7cff",
    showAvatar: true,
  },
};

const emptyFarewell: FarewellSettings = {
  enabled: false,
  channelId: "",
  type: "embed",
  text: "Goodbye {user}. Thanks for being with {server}.",
  embed: {
    title: "Farewell!",
    description: "{user} just left {server}.",
    color: "#2f7cff",
    showAvatar: true,
  },
};

const emptyAutorole: AutoRoleSettings = {
  enabled: false,
  roleId: "",
};

const emptyWarthog: WarthogSettings = {
  enabled: true,
  roleLock: false,
  allowedRoles: [],
  whitelist: [],
  bounceMessage: "Warthog bounced off. This user is protected.",
  bounceGif: "",
};

const emptyVoicePresenceSettings: VoicePresenceSettings = {
  manualChannelIds: [],
  manualName: "",
  schedules: [],
};

const roleReactionEmbedDefaults: NonNullable<RoleReactionMessage["embed"]> = {
  title: "Choose your role",
  description: "React below to receive a role.",
  color: "#2f7cff",
};

const emptyRoleReactionMessage: RoleReactionMessageDraft = {
  key: "",
  channelId: "",
  type: "text",
  message: "React below to receive a role.",
  embed: roleReactionEmbedDefaults,
  pairs: [],
  messageId: "",
};

const emptyRoleReactions: RoleReactionSettings = {
  enabled: false,
  messages: [],
};

const emptyEventForm = {
  title: "",
  description: "",
  date: "",
  time: "",
  intervalDays: "0",
  channelId: "",
  roleId: "",
  durationHours: "1",
};

const emptyMetadata: ServerMetadata = {
  channels: [],
  voiceChannels: [],
  roles: [],
};

const emptyLoadedState: LoadedState = {
  metadata: false,
  welcome: false,
  farewell: false,
  events: false,
  presence: false,
  emoji: false,
  roleReactions: false,
  warthog: false,
  autorole: false,
};

const emptyLoadingState: LoadingState = {
  metadata: false,
  welcome: false,
  farewell: false,
  events: false,
  presence: false,
  emoji: false,
  roleReactions: false,
  warthog: false,
  autorole: false,
};

const maxEmojiUploads = 10;
const maxUploadBytes = 5 * 1024 * 1024;
const createId = () => Math.random().toString(36).slice(2, 9);
const activeSectionStorageKey = "conqbot.activeSection";
const activeServerStorageKey = "conqbot.activeServerId";
const presenceDays = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
];

const buildEmojiRows = (triggers: EmojiTrigger[]): TriggerRow[] =>
  triggers.map((trigger) => ({
    id: createId(),
    emoji: trigger.emoji,
    images: buildEmojiImageRows(trigger.imageUrls ?? []),
  }));

const buildEmojiImageRows = (imageUrls: string[]): TriggerImageRow[] => {
  const urls = Array.isArray(imageUrls) && imageUrls.length ? imageUrls : [""];
  return urls.map((imageUrl) => ({
    id: createId(),
    imageUrl,
    uploadFile: null,
    previewUrl: imageUrl,
    uploading: false,
  }));
};

const createEmojiImageRow = (): TriggerImageRow => ({
  id: createId(),
  imageUrl: "",
  uploadFile: null,
  previewUrl: "",
  uploading: false,
});

const buildRoleReactionMessages = (
  messages: RoleReactionSettings["messages"],
  fallbackChannel = ""
): RoleReactionMessageDraft[] =>
  messages.map((message) => ({
    ...emptyRoleReactionMessage,
    ...message,
    key: message.key || createId(),
    channelId: message.channelId || fallbackChannel,
    type: message.type === "embed" ? "embed" : "text",
    embed: {
      ...roleReactionEmbedDefaults,
      ...(message.embed ?? {}),
    },
    pairs: Array.isArray(message.pairs) ? message.pairs : [],
  }));

const createRoleReactionMessage = (channelId = ""): RoleReactionMessageDraft => ({
  ...emptyRoleReactionMessage,
  key: createId(),
  channelId,
});

const isValidDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isValidTime = (value: string) => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
const toPanelDate = (value: string) => {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return "";
  }
  return `${day}.${month}.${year}`;
};
const fromPanelDate = (value: string) => {
  const [day, month, year] = value.split(".");
  if (!day || !month || !year) {
    return "";
  }
  return `${year}-${month}-${day}`;
};
const stripRolePrefix = (value: string) => (value.startsWith("@") ? value.slice(1) : value);

const extractImageUrl = (value: string) => {
  const match = value.match(/https?:\/\/\S+\.(?:png|jpe?g|gif|webp)(?:\?\S+)?/i);
  return match ? match[0] : "";
};

const isPanelUploadUrl = (value: string) => value.includes("/api/uploads/");
const normalizeEmojiRows = (rows: TriggerRow[]) =>
  rows.map((row) => ({ emoji: row.emoji, imageUrls: row.images.map((image) => image.imageUrl) }));
const isEqual = <T,>(left: T, right: T) => JSON.stringify(left) === JSON.stringify(right);
const toggleSelection = (value: string[], id: string) =>
  value.includes(id) ? value.filter((item) => item !== id) : [...value, id];
const getStatusPill = (
  loadedFlag: boolean,
  active: boolean,
  activeLabel = "Enabled",
  inactiveLabel = "Disabled"
) => {
  if (!loadedFlag) {
    return { label: "Loading", tone: "neutral" };
  }
  return {
    label: active ? activeLabel : inactiveLabel,
    tone: active ? "success" : "neutral",
  };
};

const conqbotLogCategories: {
  key: AdminLogCategory;
  label: string;
  tone: "neutral" | "success" | "info" | "warning" | "danger";
  icon: JSX.Element;
}[] = [
  {
    key: "all",
    label: "All",
    tone: "neutral",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4 7h16M4 12h16M4 17h10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: "house",
    label: "House joins",
    tone: "success",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 4l8 6v9H4v-9l8-6z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M9 14l2 2 4-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: "guild",
    label: "Bot joins",
    tone: "info",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M3 12h18M12 3a9 9 0 1 0 9 9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M12 3c2.5 2.5 4 5.2 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.2-4-9s1.5-6.5 4-9z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: "events",
    label: "Events",
    tone: "warning",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M7 4v3M17 4v3M4 9h16M5 7h14a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a1 1 0 0 1 1-1z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: "errors",
    label: "Errors",
    tone: "danger",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 4l8 14H4l8-14z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M12 9v4M12 17h.01"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: "other",
    label: "Other",
    tone: "neutral",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M8 12h.01M12 12h.01M16 12h.01"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

const normalizeLogText = (value?: string) => (value ?? "").toLowerCase();

const isErrorLog = (log: AdminLogEntry) =>
  ["error", "critical"].includes(String(log.level).toLowerCase());

const matchesHouseJoinLog = (log: AdminLogEntry) => {
  const text = normalizeLogText(log.message);
  const logger = normalizeLogText(log.logger);
  return (
    text.includes("joined house") ||
    text.includes("join house") ||
    text.includes("added to house") ||
    text.includes("added to the house") ||
    logger.includes("recruitment") ||
    logger.includes("houses_manager")
  );
};

const matchesGuildJoinLog = (log: AdminLogEntry) => {
  const text = normalizeLogText(log.message);
  const logger = normalizeLogText(log.logger);
  return (
    text.includes("added to a new server") ||
    text.includes("removed from server") ||
    text.includes("guild join") ||
    text.includes("guild leave") ||
    text.includes("joined server") ||
    logger.includes("guild_log_service") ||
    logger.includes("bot_join_guild") ||
    logger.includes("on_guild_join") ||
    logger.includes("on_guild_remove")
  );
};

const matchesEventLog = (log: AdminLogEntry) => {
  const text = normalizeLogText(log.message);
  const logger = normalizeLogText(log.logger);
  return (
    text.includes("event") ||
    text.includes("attendance") ||
    text.includes("signup") ||
    logger.includes("event") ||
    logger.includes("attendance")
  );
};

const isOtherLog = (log: AdminLogEntry) =>
  !isErrorLog(log) &&
  !matchesHouseJoinLog(log) &&
  !matchesGuildJoinLog(log) &&
  !matchesEventLog(log);

const filterConqbotLogs = (logs: AdminLogEntry[], category: AdminLogCategory) => {
  switch (category) {
    case "house":
      return logs.filter(matchesHouseJoinLog);
    case "guild":
      return logs.filter(matchesGuildJoinLog);
    case "events":
      return logs.filter(matchesEventLog);
    case "errors":
      return logs.filter(isErrorLog);
    case "other":
      return logs.filter(isOtherLog);
    default:
      return logs;
  }
};

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const isAdminPanel = Boolean(user?.isAdminPanel);
  const [servers, setServers] = useState<Server[]>([]);
  const [activeServerId, setActiveServerId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>(() => {
    if (typeof window === "undefined") {
      return "overview";
    }
    const stored = window.localStorage.getItem(activeSectionStorageKey);
    return stored && sectionKeys.has(stored as SectionKey)
      ? (stored as SectionKey)
      : "overview";
  });
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState<LoadedState>(emptyLoadedState);
  const [sectionLoading, setSectionLoading] = useState<LoadingState>(emptyLoadingState);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [serverReloadToken, setServerReloadToken] = useState(0);
  const activeServerIdRef = useRef<string | null>(null);

  const [metadata, setMetadata] = useState<ServerMetadata>(emptyMetadata);
  const [welcomeSettings, setWelcomeSettings] = useState<WelcomeSettings>(emptyWelcome);
  const [welcomeBaseline, setWelcomeBaseline] = useState<WelcomeSettings>(emptyWelcome);
  const [welcomeSaving, setWelcomeSaving] = useState(false);
  const [farewellSettings, setFarewellSettings] = useState<FarewellSettings>(emptyFarewell);
  const [farewellBaseline, setFarewellBaseline] = useState<FarewellSettings>(emptyFarewell);
  const [farewellSaving, setFarewellSaving] = useState(false);

  const [eventForm, setEventForm] = useState(emptyEventForm);
  const [eventFormBaseline, setEventFormBaseline] = useState(emptyEventForm);
  const [eventBaselineEditingId, setEventBaselineEditingId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventSaving, setEventSaving] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [eventPingState, setEventPingState] = useState<{
    id: string;
    mode: EventPingMode;
  } | null>(null);

  const [emojiRows, setEmojiRows] = useState<TriggerRow[]>([]);
  const [emojiOptions, setEmojiOptions] = useState<EmojiOption[]>([]);
  const [emojiOptionsLoading, setEmojiOptionsLoading] = useState(false);
  const [emojiSaving, setEmojiSaving] = useState(false);
  const [activeEmojiTriggerId, setActiveEmojiTriggerId] = useState<string | null>(null);
  const [activeEmojiPickerId, setActiveEmojiPickerId] = useState<string | null>(null);
  const [emojiSearch, setEmojiSearch] = useState("");
  const [emojiRequireExact, setEmojiRequireExact] = useState(false);
  const [emojiBaseline, setEmojiBaseline] = useState<EmojiTriggerSettings>({
    triggers: [],
    requireExact: false,
  });

  const [voicePresenceSettings, setVoicePresenceSettings] =
    useState<VoicePresenceSettings>(emptyVoicePresenceSettings);
  const [voicePresenceBaseline, setVoicePresenceBaseline] =
    useState<VoicePresenceSettings>(emptyVoicePresenceSettings);
  const [voicePresenceLogs, setVoicePresenceLogs] = useState<VoicePresenceLog[]>([]);
  const [voicePresenceLogsLoading, setVoicePresenceLogsLoading] = useState(false);
  const [voicePresenceSaving, setVoicePresenceSaving] = useState(false);
  const [voicePresenceRunning, setVoicePresenceRunning] = useState(false);
  const [voicePresenceLogOffset, setVoicePresenceLogOffset] = useState(0);
  const [voicePresenceLogDeletingId, setVoicePresenceLogDeletingId] = useState<string | null>(null);
  const [activePresenceLog, setActivePresenceLog] = useState<VoicePresenceLog | null>(null);
  const [presenceTab, setPresenceTab] = useState<"manual" | "schedule" | "history">("manual");

  const [activeRoleEmojiPickerId, setActiveRoleEmojiPickerId] = useState<string | null>(null);
  const [roleEmojiSearch, setRoleEmojiSearch] = useState("");

  const [roleReactions, setRoleReactions] =
    useState<RoleReactionSettings>(emptyRoleReactions);
  const [roleReactionMessages, setRoleReactionMessages] = useState<RoleReactionMessageDraft[]>([]);
  const [activeRoleReactionKey, setActiveRoleReactionKey] = useState<string | null>(null);
  const [roleReactionsSaving, setRoleReactionsSaving] = useState(false);
  const [roleReactionsBaseline, setRoleReactionsBaseline] =
    useState<RoleReactionSettings>(emptyRoleReactions);

  const [adminUsers, setAdminUsers] = useState<string[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUserInput, setAdminUserInput] = useState("");
  const [adminLogs, setAdminLogs] = useState<Record<LogSource, AdminLogEntry[]>>({
    conqbot: [],
    botpanel: [],
  });
  const [adminLogLevels, setAdminLogLevels] = useState<Record<LogSource, string>>({
    conqbot: "all",
    botpanel: "all",
  });
  const [adminTab, setAdminTab] = useState<"conqbot" | "botpanel" | "access">("conqbot");
  const [adminLogCategory, setAdminLogCategory] = useState<AdminLogCategory>("all");
  const [adminLogsLoading, setAdminLogsLoading] = useState<Record<LogSource, boolean>>({
    conqbot: false,
    botpanel: false,
  });
  const [adminLogOffsets, setAdminLogOffsets] = useState<Record<LogSource, number>>({
    conqbot: 0,
    botpanel: 0,
  });

  const [warthogSettings, setWarthogSettings] = useState<WarthogSettings>(emptyWarthog);
  const [warthogBaseline, setWarthogBaseline] = useState<WarthogSettings>(emptyWarthog);
  const [warthogSaving, setWarthogSaving] = useState(false);
  const [warthogRolePick, setWarthogRolePick] = useState("");
  const [warthogWhitelistInput, setWarthogWhitelistInput] = useState("");

  const [autoroleSettings, setAutoroleSettings] = useState<AutoRoleSettings>(emptyAutorole);
  const [autoroleSaving, setAutoroleSaving] = useState(false);
  const [autoroleBaseline, setAutoroleBaseline] = useState<AutoRoleSettings>(emptyAutorole);

  const updateLoaded = (key: keyof LoadedState, value: boolean) => {
    setLoaded((prev) => ({ ...prev, [key]: value }));
  };

  const updateSectionLoading = (key: keyof LoadingState, value: boolean) => {
    setSectionLoading((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    let active = true;

    const loadServers = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getServers();
        if (!active) {
          return;
        }
        setServers(data);
        const storedServerId =
          typeof window === "undefined" ? null : window.localStorage.getItem(activeServerStorageKey);
        const nextServerId =
          data.find((server) => server.id === storedServerId)?.id ?? data[0]?.id ?? null;
        setActiveServerId(nextServerId);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load servers.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadServers();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (activeServerId) {
      window.localStorage.setItem(activeServerStorageKey, activeServerId);
    } else {
      window.localStorage.removeItem(activeServerStorageKey);
    }
  }, [activeServerId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(activeSectionStorageKey, activeSection);
  }, [activeSection]);

  useEffect(() => {
    activeServerIdRef.current = activeServerId;
  }, [activeServerId]);

  useEffect(() => {
    setLoaded(emptyLoadedState);
    setSectionLoading(emptyLoadingState);
    setMetadata(emptyMetadata);
    setWelcomeSettings(emptyWelcome);
    setWelcomeBaseline(emptyWelcome);
    setFarewellSettings(emptyFarewell);
    setFarewellBaseline(emptyFarewell);
    setEvents([]);
    setEmojiRows([]);
    setEmojiOptions([]);
    setEmojiOptionsLoading(false);
    setEmojiRequireExact(false);
    setEmojiBaseline({ triggers: [], requireExact: false });
    setActiveEmojiTriggerId(null);
    setEmojiSearch("");
    setVoicePresenceSettings(emptyVoicePresenceSettings);
    setVoicePresenceBaseline(emptyVoicePresenceSettings);
    setVoicePresenceLogs([]);
    setVoicePresenceLogOffset(0);
    setVoicePresenceLogsLoading(false);
    setVoicePresenceSaving(false);
    setVoicePresenceRunning(false);
    setVoicePresenceLogDeletingId(null);
    setActivePresenceLog(null);
    setPresenceTab("manual");
    setRoleReactions(emptyRoleReactions);
    setRoleReactionMessages([]);
    setRoleReactionsBaseline(emptyRoleReactions);
    setActiveRoleReactionKey(null);
    setWarthogSettings(emptyWarthog);
    setWarthogBaseline(emptyWarthog);
    setWarthogRolePick("");
    setWarthogWhitelistInput("");
    setAutoroleSettings(emptyAutorole);
    setAutoroleBaseline(emptyAutorole);
    setActiveEmojiPickerId(null);
    setActiveRoleEmojiPickerId(null);
    setRoleEmojiSearch("");
    setAdminTab("conqbot");
    setError(null);
    setSuccess(null);
    setEditingEventId(null);
    setEventForm(emptyEventForm);
    setEventFormBaseline(emptyEventForm);
    setEventBaselineEditingId(null);
    setServerReloadToken((prev) => prev + 1);
  }, [activeServerId]);

  useEffect(() => {
    setError(null);
    setSuccess(null);
    setActiveEmojiTriggerId(null);
    setActiveEmojiPickerId(null);
    setEmojiSearch("");
    setActiveRoleReactionKey(null);
    setActiveRoleEmojiPickerId(null);
    setRoleEmojiSearch("");
  }, [activeSection]);

  useEffect(() => {
    if (!isAdminPanel && activeSection === "admin") {
      setActiveSection("overview");
    }
  }, [isAdminPanel, activeSection]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(".emoji-select")) {
        setActiveEmojiPickerId(null);
        setActiveRoleEmojiPickerId(null);
        setEmojiSearch("");
        setRoleEmojiSearch("");
      }
    };
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  const activeServer = useMemo(
    () => servers.find((server) => server.id === activeServerId) ?? null,
    [servers, activeServerId]
  );

  const isActiveServer = (serverId: string | null) => activeServerIdRef.current === serverId;

  const conqbotLogCounts = useMemo(() => {
    return conqbotLogCategories.reduce(
      (acc, category) => {
        acc[category.key] =
          category.key === "all"
            ? adminLogs.conqbot.length
            : filterConqbotLogs(adminLogs.conqbot, category.key).length;
        return acc;
      },
      {
        all: 0,
        house: 0,
        guild: 0,
        events: 0,
        errors: 0,
        other: 0,
      } as Record<AdminLogCategory, number>
    );
  }, [adminLogs.conqbot]);

  const filteredConqbotLogs = useMemo(
    () => filterConqbotLogs(adminLogs.conqbot, adminLogCategory),
    [adminLogs.conqbot, adminLogCategory]
  );

  const channels = metadata.channels.length ? metadata.channels : fallbackChannels;
  const voiceChannels = metadata.voiceChannels ?? [];
  const roles = metadata.roles.length ? metadata.roles : fallbackRoles;

  useEffect(() => {
    if (!welcomeSettings.channelId && channels.length) {
      const nextChannel = channels[0].id;
      setWelcomeSettings((prev) => ({
        ...prev,
        channelId: nextChannel,
      }));
      setWelcomeBaseline((prev) =>
        prev.channelId ? prev : { ...prev, channelId: nextChannel }
      );
    }
  }, [channels, welcomeSettings.channelId]);

  useEffect(() => {
    if (!farewellSettings.channelId && channels.length) {
      const nextChannel = channels[0].id;
      setFarewellSettings((prev) => ({
        ...prev,
        channelId: nextChannel,
      }));
      setFarewellBaseline((prev) =>
        prev.channelId ? prev : { ...prev, channelId: nextChannel }
      );
    }
  }, [channels, farewellSettings.channelId]);

  useEffect(() => {
    if (!channels.length) {
      return;
    }
    setRoleReactionMessages((prev) => {
      if (prev.length === 0) {
        return prev;
      }
      let changed = false;
      const next = prev.map((message) => {
        if (message.channelId) {
          return message;
        }
        changed = true;
        return { ...message, channelId: channels[0].id };
      });
      return changed ? next : prev;
    });
  }, [channels]);

  useEffect(() => {
    setEventForm((prev) => {
      const nextChannel = prev.channelId || channels[0]?.id || "";
      const nextRole = prev.roleId || "";
      if (nextChannel === prev.channelId && nextRole === prev.roleId) {
        return prev;
      }
      return {
        ...prev,
        channelId: nextChannel,
        roleId: nextRole,
      };
    });
    setEventFormBaseline((prev) => {
      if (eventBaselineEditingId) {
        return prev;
      }
      const nextChannel = prev.channelId || channels[0]?.id || "";
      const nextRole = prev.roleId || "";
      if (nextChannel === prev.channelId && nextRole === prev.roleId) {
        return prev;
      }
      return {
        ...prev,
        channelId: nextChannel,
        roleId: nextRole,
      };
    });
  }, [channels, roles, eventBaselineEditingId]);

  useEffect(() => {
    if (!autoroleSettings.roleId && roles.length) {
      const nextRole = roles[0].id;
      setAutoroleSettings((prev) => ({
        ...prev,
        roleId: nextRole,
      }));
      setAutoroleBaseline((prev) =>
        prev.roleId ? prev : { ...prev, roleId: nextRole }
      );
    }
  }, [roles, autoroleSettings.roleId]);

  const loadMetadata = async () => {
    const serverId = activeServerId;
    if (!serverId || loaded.metadata || sectionLoading.metadata) {
      return;
    }
    updateSectionLoading("metadata", true);
    try {
      const data = await getServerMetadata(serverId);
      if (!isActiveServer(serverId)) {
        return;
      }
      setMetadata(data);
      updateLoaded("metadata", true);
    } catch (err) {
      if (isActiveServer(serverId)) {
        setError(err instanceof Error ? err.message : "Failed to load metadata.");
        updateLoaded("metadata", true);
      }
    } finally {
      if (isActiveServer(serverId)) {
        updateSectionLoading("metadata", false);
      }
    }
  };

  const loadWelcome = async () => {
    const serverId = activeServerId;
    if (!serverId || loaded.welcome || sectionLoading.welcome) {
      return;
    }
    updateSectionLoading("welcome", true);
    try {
      const data = await getWelcomeSettings(serverId);
      if (!isActiveServer(serverId)) {
        return;
      }
      setWelcomeSettings(data);
      setWelcomeBaseline(data);
      updateLoaded("welcome", true);
    } catch (err) {
      if (isActiveServer(serverId)) {
        setError(err instanceof Error ? err.message : "Failed to load welcome settings.");
        updateLoaded("welcome", true);
      }
    } finally {
      if (isActiveServer(serverId)) {
        updateSectionLoading("welcome", false);
      }
    }
  };

  const loadFarewell = async () => {
    const serverId = activeServerId;
    if (!serverId || loaded.farewell || sectionLoading.farewell) {
      return;
    }
    updateSectionLoading("farewell", true);
    try {
      const data = await getFarewellSettings(serverId);
      if (!isActiveServer(serverId)) {
        return;
      }
      setFarewellSettings(data);
      setFarewellBaseline(data);
      updateLoaded("farewell", true);
    } catch (err) {
      if (isActiveServer(serverId)) {
        setError(err instanceof Error ? err.message : "Failed to load farewell settings.");
        updateLoaded("farewell", true);
      }
    } finally {
      if (isActiveServer(serverId)) {
        updateSectionLoading("farewell", false);
      }
    }
  };

  const loadEvents = async () => {
    const serverId = activeServerId;
    if (!serverId || loaded.events || sectionLoading.events) {
      return;
    }
    updateSectionLoading("events", true);
    try {
      const data = await getEvents(serverId);
      if (!isActiveServer(serverId)) {
        return;
      }
      setEvents(data);
      updateLoaded("events", true);
    } catch (err) {
      if (isActiveServer(serverId)) {
        setError(err instanceof Error ? err.message : "Failed to load events.");
        updateLoaded("events", true);
      }
    } finally {
      if (isActiveServer(serverId)) {
        updateSectionLoading("events", false);
      }
    }
  };

  const loadEmojiTriggers = async () => {
    const serverId = activeServerId;
    if (!serverId || loaded.emoji || sectionLoading.emoji) {
      return;
    }
    updateSectionLoading("emoji", true);
    try {
      const data = await getEmojiTriggers(serverId);
      if (!isActiveServer(serverId)) {
        return;
      }
      setEmojiRows(buildEmojiRows(data.triggers));
      setEmojiRequireExact(data.requireExact);
      setEmojiBaseline(data);
      updateLoaded("emoji", true);
    } catch (err) {
      if (isActiveServer(serverId)) {
        setError(err instanceof Error ? err.message : "Failed to load emoji triggers.");
        updateLoaded("emoji", true);
      }
    } finally {
      if (isActiveServer(serverId)) {
        updateSectionLoading("emoji", false);
      }
    }
  };

  const loadVoicePresence = async () => {
    const serverId = activeServerId;
    if (!serverId || loaded.presence || sectionLoading.presence) {
      return;
    }
    updateSectionLoading("presence", true);
    try {
      const data = await getVoicePresenceSettings(serverId);
      if (!isActiveServer(serverId)) {
        return;
      }
      setVoicePresenceSettings(data);
      setVoicePresenceBaseline(data);
      updateLoaded("presence", true);
    } catch (err) {
      if (isActiveServer(serverId)) {
        setError(err instanceof Error ? err.message : "Failed to load voice presence settings.");
        updateLoaded("presence", true);
      }
    } finally {
      if (isActiveServer(serverId)) {
        updateSectionLoading("presence", false);
      }
    }
  };

  const loadVoicePresenceLogs = async (reset = false) => {
    const serverId = activeServerId;
    if (!serverId || voicePresenceLogsLoading) {
      return;
    }
    setVoicePresenceLogsLoading(true);
    try {
      const offset = reset ? 0 : voicePresenceLogOffset;
      const logs = await getVoicePresenceLogs(serverId, {
        limit: 20,
        offset,
      });
      if (!isActiveServer(serverId)) {
        return;
      }
      setVoicePresenceLogs((prev) => (reset ? logs : [...prev, ...logs]));
      setVoicePresenceLogOffset(offset + logs.length);
    } catch (err) {
      if (isActiveServer(serverId)) {
        setError(err instanceof Error ? err.message : "Failed to load presence logs.");
      }
    } finally {
      if (isActiveServer(serverId)) {
        setVoicePresenceLogsLoading(false);
      }
    }
  };

  const loadRoleReactions = async () => {
    const serverId = activeServerId;
    if (!serverId || loaded.roleReactions || sectionLoading.roleReactions) {
      return;
    }
    updateSectionLoading("roleReactions", true);
    try {
      const data = await getRoleReactions(serverId);
      if (!isActiveServer(serverId)) {
        return;
      }
      const fallbackChannel = channels[0]?.id ?? "";
      const messages = buildRoleReactionMessages(data.messages, fallbackChannel);
      setRoleReactions({ ...data, messages });
      setRoleReactionMessages(messages);
      setRoleReactionsBaseline({ ...data, messages });
      updateLoaded("roleReactions", true);
    } catch (err) {
      if (isActiveServer(serverId)) {
        setError(err instanceof Error ? err.message : "Failed to load role reactions.");
        updateLoaded("roleReactions", true);
      }
    } finally {
      if (isActiveServer(serverId)) {
        updateSectionLoading("roleReactions", false);
      }
    }
  };

  const loadEmojiOptions = async () => {
    const serverId = activeServerId;
    if (!serverId || emojiOptionsLoading || emojiOptions.length > 0) {
      return;
    }
    setEmojiOptionsLoading(true);
    try {
      const data = await getEmojis(serverId);
      if (!isActiveServer(serverId)) {
        return;
      }
      setEmojiOptions(data);
    } catch (err) {
      if (isActiveServer(serverId)) {
        setError(err instanceof Error ? err.message : "Failed to load emojis.");
      }
    } finally {
      if (isActiveServer(serverId)) {
        setEmojiOptionsLoading(false);
      }
    }
  };

  const loadWarthog = async () => {
    const serverId = activeServerId;
    if (!serverId || loaded.warthog || sectionLoading.warthog) {
      return;
    }
    updateSectionLoading("warthog", true);
    try {
      const settings = await getWarthog(serverId);
      if (!isActiveServer(serverId)) {
        return;
      }
      setWarthogSettings(settings);
      setWarthogBaseline(settings);
      updateLoaded("warthog", true);
    } catch (err) {
      if (isActiveServer(serverId)) {
        setError(err instanceof Error ? err.message : "Failed to load Warthog settings.");
        updateLoaded("warthog", true);
      }
    } finally {
      if (isActiveServer(serverId)) {
        updateSectionLoading("warthog", false);
      }
    }
  };

  const loadAutorole = async () => {
    const serverId = activeServerId;
    if (!serverId || loaded.autorole || sectionLoading.autorole) {
      return;
    }
    updateSectionLoading("autorole", true);
    try {
      const data = await getAutorole(serverId);
      if (!isActiveServer(serverId)) {
        return;
      }
      setAutoroleSettings(data);
      setAutoroleBaseline(data);
      updateLoaded("autorole", true);
    } catch (err) {
      if (isActiveServer(serverId)) {
        setError(err instanceof Error ? err.message : "Failed to load auto role settings.");
        updateLoaded("autorole", true);
      }
    } finally {
      if (isActiveServer(serverId)) {
        updateSectionLoading("autorole", false);
      }
    }
  };

  const adminLogLimit = 30;

  const loadAdminUsers = async () => {
    if (!isAdminPanel) {
      return;
    }
    setAdminUsersLoading(true);
    try {
      const users = await getAdminUsers();
      setAdminUsers(users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin users.");
    } finally {
      setAdminUsersLoading(false);
    }
  };

  const loadAdminLogs = async (
    source: LogSource,
    reset = false,
    levelOverride?: string
  ) => {
    if (!isAdminPanel) {
      return;
    }
    setAdminLogsLoading((prev) => ({ ...prev, [source]: true }));
    try {
      const offset = reset ? 0 : adminLogOffsets[source];
      const level = levelOverride ?? adminLogLevels[source];
      const logs = await getAdminLogs({
        source,
        level: level === "all" ? undefined : level,
        limit: adminLogLimit,
        offset,
      });
      setAdminLogs((prev) => ({
        ...prev,
        [source]: reset ? logs : [...prev[source], ...logs],
      }));
      setAdminLogOffsets((prev) => ({
        ...prev,
        [source]: offset + logs.length,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin logs.");
    } finally {
      setAdminLogsLoading((prev) => ({ ...prev, [source]: false }));
    }
  };

  const handleAdminLevelChange = (source: LogSource, level: string) => {
    setAdminLogLevels((prev) => ({ ...prev, [source]: level }));
    setAdminLogs((prev) => ({ ...prev, [source]: [] }));
    setAdminLogOffsets((prev) => ({ ...prev, [source]: 0 }));
    void loadAdminLogs(source, true, level);
  };

  useEffect(() => {
    if (!activeServerId) {
      return;
    }

    if (activeSection === "welcome") {
      void loadMetadata();
      void loadWelcome();
      void loadFarewell();
    }

    if (activeSection === "overview") {
      void loadMetadata();
      void loadWelcome();
      void loadFarewell();
      void loadEvents();
      void loadEmojiTriggers();
      void loadRoleReactions();
      void loadAutorole();
      void loadVoicePresence();
      void loadVoicePresenceLogs(true);
    }

    if (activeSection === "events") {
      void loadMetadata();
      void loadEvents();
    }

    if (activeSection === "presence") {
      void loadMetadata();
      void loadVoicePresence();
      void loadVoicePresenceLogs(true);
    }

    if (activeSection === "emoji") {
      void loadEmojiTriggers();
      void loadEmojiOptions();
    }

    if (activeSection === "role-reactions") {
      void loadMetadata();
      void loadRoleReactions();
      void loadEmojiOptions();
    }

    if (activeSection === "other") {
      void loadWarthog();
    }

    if (activeSection === "autorole") {
      void loadMetadata();
      void loadAutorole();
    }

    if (activeSection === "admin") {
      void loadAdminUsers();
      void loadAdminLogs("conqbot", true);
      void loadAdminLogs("botpanel", true);
    }
  }, [activeSection, activeServerId, serverReloadToken]);

  const handleInvite = async () => {
    setInviteLoading(true);
    try {
      const url = await getInviteUrl();
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open invite link.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleServerSelect = (serverId: string) => {
    if (serverId === activeServerId) {
      return;
    }
    if (hasUnsavedChanges) {
      setError("Save or discard your changes before switching servers.");
      return;
    }
    setLoaded(emptyLoadedState);
    setSectionLoading(emptyLoadingState);
    setActiveServerId(serverId);
  };

  const handleSectionSelect = (section: SectionKey) => {
    if (section === activeSection) {
      return;
    }
    if (hasUnsavedChanges) {
      setError("Save or discard your changes before switching sections.");
      return;
    }
    setActiveSection(section);
  };

  const formatPreview = (value: string) =>
    value
      .replace(/{user}/g, user?.username ?? "New member")
      .replace(/{server}/g, activeServer?.name ?? "the server");

  const formatLogTime = (value?: string) => {
    if (!value) {
      return "-";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString("en-GB", {
      hour12: false,
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleWelcomeSave = async () => {
    if (!activeServerId) {
      return;
    }
    if (welcomeSettings.enabled) {
      if (welcomeSettings.type === "text" && !welcomeSettings.text.trim()) {
        setError("Welcome text cannot be empty.");
        return;
      }
      if (
        welcomeSettings.type === "embed" &&
        !welcomeSettings.embed.title.trim() &&
        !welcomeSettings.embed.description.trim()
      ) {
        setError("Provide at least a title or description for the embed.");
        return;
      }
      if (!welcomeSettings.channelId) {
        setError("Pick a channel for the welcome message.");
        return;
      }
    }

    setWelcomeSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const saved = await updateWelcomeSettings(activeServerId, welcomeSettings);
      setWelcomeSettings(saved);
      setWelcomeBaseline(saved);
      setSuccess("Welcome settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save welcome settings.");
    } finally {
      setWelcomeSaving(false);
    }
  };

  const handleFarewellSave = async () => {
    if (!activeServerId) {
      return;
    }
    if (farewellSettings.enabled) {
      if (farewellSettings.type === "text" && !farewellSettings.text.trim()) {
        setError("Farewell text cannot be empty.");
        return;
      }
      if (
        farewellSettings.type === "embed" &&
        !farewellSettings.embed.title.trim() &&
        !farewellSettings.embed.description.trim()
      ) {
        setError("Provide at least a title or description for the farewell embed.");
        return;
      }
      if (!farewellSettings.channelId) {
        setError("Pick a channel for the farewell message.");
        return;
      }
    }

    setFarewellSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const saved = await updateFarewellSettings(activeServerId, farewellSettings);
      setFarewellSettings(saved);
      setFarewellBaseline(saved);
      setSuccess("Farewell settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save farewell settings.");
    } finally {
      setFarewellSaving(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!activeServerId) {
      return;
    }
    if (!eventForm.title.trim()) {
      setError("Event title is required.");
      return;
    }
    if (!eventForm.date.trim() || !isValidDate(eventForm.date)) {
      setError("Pick a valid date.");
      return;
    }
    if (!eventForm.time.trim() || !isValidTime(eventForm.time)) {
      setError("Time must be in 24h format (HH:MM).");
      return;
    }
    if (!eventForm.channelId) {
      setError("Select a channel before creating an event.");
      return;
    }

    const durationHours = Number.parseFloat(eventForm.durationHours);
    if (!Number.isFinite(durationHours) || durationHours <= 0) {
      setError("Duration must be a positive number of hours.");
      return;
    }

    const intervalDays = Number.parseInt(eventForm.intervalDays, 10);
    if (!Number.isFinite(intervalDays) || intervalDays < 0) {
      setError("Repeat interval must be zero or a positive number.");
      return;
    }

    const formattedDate = toPanelDate(eventForm.date);
    if (!formattedDate) {
      setError("Pick a valid date.");
      return;
    }

    const durationMinutes = Math.round(durationHours * 60);

    setEventSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: EventInput = {
        title: eventForm.title,
        description: eventForm.description,
        date: formattedDate,
        time: eventForm.time,
        intervalDays,
        channelId: eventForm.channelId,
        roleId: eventForm.roleId,
        durationMinutes,
      };
      if (editingEventId) {
        const updated = await updateEvent(activeServerId, editingEventId, payload);
        setEvents((prev) =>
          prev.map((eventItem) => (eventItem.id === updated.id ? updated : eventItem))
        );
        setEditingEventId(null);
        setSuccess("Event updated.");
      } else {
        const created = await createEvent(activeServerId, payload);
        setEvents((prev) => [created, ...prev]);
        setSuccess("Event created.");
      }
      setEventForm(emptyEventForm);
      setEventFormBaseline(emptyEventForm);
      setEventBaselineEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event.");
    } finally {
      setEventSaving(false);
    }
  };

  const handleEditEvent = (eventItem: EventItem) => {
    setEditingEventId(eventItem.id);
    const nextForm = {
      title: eventItem.title,
      description: eventItem.description ?? "",
      date: fromPanelDate(eventItem.date),
      time: eventItem.time,
      intervalDays: String(Math.max(0, eventItem.intervalDays ?? 0)),
      channelId: eventItem.channelId,
      roleId: eventItem.roleId,
      durationHours: eventItem.durationMinutes
        ? String(Math.max(0.5, eventItem.durationMinutes / 60))
        : "1",
    };
    setEventForm(nextForm);
    setEventFormBaseline(nextForm);
    setEventBaselineEditingId(eventItem.id);
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    setEventForm(emptyEventForm);
    setEventFormBaseline(emptyEventForm);
    setEventBaselineEditingId(null);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!activeServerId) {
      return;
    }
    setDeletingEventId(eventId);
    setError(null);
    setSuccess(null);
    try {
      const deletedId = await deleteEvent(activeServerId, eventId);
      setEvents((prev) => prev.filter((item) => item.id !== deletedId));
      if (editingEventId === deletedId) {
        handleCancelEdit();
      }
      setSuccess("Event deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event.");
    } finally {
      setDeletingEventId(null);
    }
  };

  const handlePingEvent = async (eventId: string, mode: EventPingMode) => {
    if (!activeServerId) {
      return;
    }
    setEventPingState({ id: eventId, mode });
    setError(null);
    setSuccess(null);
    try {
      const pinged = await pingEvent(activeServerId, eventId, mode);
      const label = mode === "unchecked" ? "unchecked" : mode;
      setSuccess(`Ping sent to ${pinged} ${label} member${pinged === 1 ? "" : "s"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ping event.");
    } finally {
      setEventPingState(null);
    }
  };

  const updateEmojiRow = (id: string, updater: (row: TriggerRow) => TriggerRow) => {
    setEmojiRows((prev) => prev.map((row) => (row.id === id ? updater(row) : row)));
  };

  const updateEmojiImage = (
    triggerId: string,
    imageId: string,
    updater: (image: TriggerImageRow) => TriggerImageRow
  ) => {
    setEmojiRows((prev) =>
      prev.map((row) => {
        if (row.id !== triggerId) {
          return row;
        }
        const images = row.images.map((image) => {
          if (image.id !== imageId) {
            return image;
          }
          const next = updater(image);
          if (
            image.previewUrl &&
            image.previewUrl.startsWith("blob:") &&
            image.previewUrl !== next.previewUrl
          ) {
            URL.revokeObjectURL(image.previewUrl);
          }
          return next;
        });
        return { ...row, images };
      })
    );
  };

  const addEmojiImage = (triggerId: string) => {
    updateEmojiRow(triggerId, (row) => ({
      ...row,
      images: [...row.images, createEmojiImageRow()],
    }));
  };

  const removeEmojiImage = (triggerId: string, imageId: string) => {
    setEmojiRows((prev) =>
      prev.map((row) => {
        if (row.id !== triggerId) {
          return row;
        }
        const image = row.images.find((item) => item.id === imageId);
        if (image?.previewUrl && image.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(image.previewUrl);
        }
        const images = row.images.filter((item) => item.id !== imageId);
        return { ...row, images: images.length ? images : [createEmojiImageRow()] };
      })
    );
  };

  const removeEmojiRow = (id: string) => {
    setEmojiRows((prev) => {
      const row = prev.find((item) => item.id === id);
      if (row) {
        row.images.forEach((image) => {
          if (image.previewUrl && image.previewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(image.previewUrl);
          }
        });
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const closeEmojiModal = () => {
    setActiveEmojiTriggerId(null);
    setActiveEmojiPickerId(null);
    setEmojiSearch("");
  };

  const countEmojiUploads = (rows: TriggerRow[]) =>
    rows.reduce(
      (count, row) =>
        count +
        row.images.filter((image) => isPanelUploadUrl(image.imageUrl)).length,
      0
    );

  const handleEmojiUpload = async (triggerId: string, imageId: string, file: File) => {
    if (!activeServerId) {
      setError("Pick a server before uploading.");
      return;
    }
    const currentRow = emojiRows.find((row) => row.id === triggerId);
    const currentImage = currentRow?.images.find((image) => image.id === imageId);
    const uploadCount = countEmojiUploads(emojiRows);
    if (!isPanelUploadUrl(currentImage?.imageUrl ?? "") && uploadCount >= maxEmojiUploads) {
      setError(`Upload limit reached (${maxEmojiUploads}). Use a link instead.`);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    updateEmojiImage(triggerId, imageId, (image) => ({
      ...image,
      uploadFile: file,
      previewUrl,
      uploading: true,
    }));
    setError(null);
    try {
      const url = await uploadImage(file, activeServerId);
      updateEmojiImage(triggerId, imageId, (image) => ({
        ...image,
        imageUrl: url,
        uploadFile: null,
        previewUrl: url,
        uploading: false,
      }));
    } catch (err) {
      updateEmojiImage(triggerId, imageId, (image) => ({
        ...image,
        uploadFile: null,
        previewUrl: image.imageUrl,
        uploading: false,
      }));
      setError(err instanceof Error ? err.message : "Failed to upload image.");
    }
  };

  const handleEmojiSave = async () => {
    if (!activeServerId) {
      return;
    }

    if (emojiRows.some((row) => row.images.some((image) => image.uploading))) {
      setError("Wait for uploads to finish before saving.");
      return;
    }

    const uploadCount = countEmojiUploads(emojiRows);
    if (uploadCount > maxEmojiUploads) {
      setError(`Upload limit is ${maxEmojiUploads} images. Use links for the rest.`);
      return;
    }

    if (emojiRows.some((row) => !row.emoji.trim())) {
      setError("Every emoji trigger needs an emoji.");
      return;
    }

    if (emojiRows.some((row) => row.images.length === 0)) {
      setError("Each emoji trigger needs at least one image.");
      return;
    }

    if (emojiRows.some((row) => row.images.some((image) => !image.imageUrl.trim()))) {
      setError("Fill in or remove empty image rows.");
      return;
    }

    if (
      emojiRows.some((row) =>
        row.images.some((image) => !/^https?:\/\//.test(image.imageUrl))
      )
    ) {
      setError("Every image URL must start with http:// or https://.");
      return;
    }

    setEmojiSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        triggers: emojiRows.map((row) => ({
          emoji: row.emoji,
          imageUrls: row.images.map((image) => image.imageUrl.trim()),
        })),
        requireExact: emojiRequireExact,
      };
      const updated = await updateEmojiTriggers(activeServerId, payload);
      setEmojiRequireExact(updated.requireExact);
      setEmojiRows(buildEmojiRows(updated.triggers));
      setEmojiBaseline(updated);
      setActiveEmojiTriggerId(null);
      setActiveEmojiPickerId(null);
      setEmojiSearch("");
      setSuccess("Emoji triggers saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save emoji triggers.");
    } finally {
      setEmojiSaving(false);
    }
  };

  const updateVoicePresenceSchedule = (
    scheduleId: string,
    updater: (schedule: VoicePresenceSettings["schedules"][number]) => VoicePresenceSettings["schedules"][number]
  ) => {
    setVoicePresenceSettings((prev) => ({
      ...prev,
      schedules: prev.schedules.map((schedule) =>
        schedule.id === scheduleId ? updater(schedule) : schedule
      ),
    }));
  };

  const addVoicePresenceSchedule = () => {
    setVoicePresenceSettings((prev) => ({
      ...prev,
      schedules: [
        ...prev.schedules,
        {
          id: createId(),
          name: "",
          enabled: true,
          dayOfWeek: 0,
          time: "20:00",
          channelIds: [],
          lastRun: null,
        },
      ],
    }));
  };

  const removeVoicePresenceSchedule = (scheduleId: string) => {
    setVoicePresenceSettings((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((schedule) => schedule.id !== scheduleId),
    }));
  };

  const handleVoicePresenceSave = async () => {
    if (!activeServerId) {
      return;
    }
    if (
      voicePresenceSettings.schedules.some(
        (schedule) => !isValidTime(schedule.time) || schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6
      )
    ) {
      setError("Every schedule needs a valid weekday and time (HH:MM).");
      return;
    }
    setVoicePresenceSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateVoicePresenceSettings(activeServerId, voicePresenceSettings);
      setVoicePresenceSettings(updated);
      setVoicePresenceBaseline(updated);
      setSuccess("Voice presence settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save voice presence settings.");
    } finally {
      setVoicePresenceSaving(false);
    }
  };

  const handleVoicePresenceRun = async () => {
    if (!activeServerId) {
      return;
    }
    setVoicePresenceRunning(true);
    setError(null);
    setSuccess(null);
    try {
      const log = await runVoicePresence(
        activeServerId,
        voicePresenceSettings.manualChannelIds,
        voicePresenceSettings.manualName
      );
      if (log) {
        setVoicePresenceLogs((prev) => [log, ...prev]);
        setVoicePresenceLogOffset((prev) => prev + 1);
        setSuccess("Presence snapshot stored.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch presence.");
    } finally {
      setVoicePresenceRunning(false);
    }
  };

  const handleDeletePresenceLog = async (logId?: string | null) => {
    if (!activeServerId || !logId) {
      return;
    }
    const confirmed = window.confirm("Delete this presence log?");
    if (!confirmed) {
      return;
    }
    setVoicePresenceLogDeletingId(logId);
    setError(null);
    setSuccess(null);
    try {
      await deleteVoicePresenceLog(activeServerId, logId);
      setVoicePresenceLogs((prev) => prev.filter((log) => log.id !== logId));
      if (activePresenceLog?.id === logId) {
        setActivePresenceLog(null);
      }
      setSuccess("Presence log deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete presence log.");
    } finally {
      setVoicePresenceLogDeletingId(null);
    }
  };

  const updateRoleReactionMessage = (
    key: string,
    updater: (message: RoleReactionMessageDraft) => RoleReactionMessageDraft
  ) => {
    setRoleReactionMessages((prev) =>
      prev.map((message) => (message.key === key ? updater(message) : message))
    );
  };

  const addRoleReactionMessage = () => {
    const fallbackChannel = channels[0]?.id ?? "";
    const message = createRoleReactionMessage(fallbackChannel);
    setRoleReactions((prev) => (prev.enabled ? prev : { ...prev, enabled: true }));
    setRoleReactionMessages((prev) => [...prev, message]);
    setActiveRoleReactionKey(message.key);
  };

  const removeRoleReactionMessage = (key: string) => {
    setRoleReactionMessages((prev) => prev.filter((message) => message.key !== key));
    if (activeRoleReactionKey === key) {
      setActiveRoleReactionKey(null);
    }
  };

  const closeRoleReactionModal = () => {
    setActiveRoleReactionKey(null);
    setActiveRoleEmojiPickerId(null);
    setRoleEmojiSearch("");
  };

  const addRoleReactionPair = (messageKey: string) => {
    updateRoleReactionMessage(messageKey, (message) => ({
      ...message,
      pairs: [...message.pairs, { emoji: "", roleId: "" }],
    }));
  };

  const updateRoleReactionPair = (
    messageKey: string,
    index: number,
    updater: (pair: { emoji: string; roleId: string }) => { emoji: string; roleId: string }
  ) => {
    updateRoleReactionMessage(messageKey, (message) => ({
      ...message,
      pairs: message.pairs.map((pair, pairIndex) =>
        pairIndex === index ? updater(pair) : pair
      ),
    }));
  };

  const removeRoleReactionPair = (messageKey: string, index: number) => {
    updateRoleReactionMessage(messageKey, (message) => ({
      ...message,
      pairs: message.pairs.filter((_, pairIndex) => pairIndex !== index),
    }));
  };

  const handleRoleReactionsSave = async () => {
    if (!activeServerId) {
      return;
    }

    if (roleReactions.enabled && roleReactionMessages.length > 0) {
      for (const message of roleReactionMessages) {
        if (!message.channelId) {
          setError("Pick a channel for every reaction message.");
          return;
        }
        if (message.type === "text" && !message.message.trim()) {
          setError("Text messages cannot be empty.");
          return;
        }
        if (message.type === "embed") {
          const description = message.embed?.description ?? message.message;
          if (!description?.trim()) {
            setError("Embed descriptions cannot be empty.");
            return;
          }
        }
        if (message.pairs.length === 0) {
          setError("Every message needs at least one emoji/role pair.");
          return;
        }
        if (message.pairs.some((pair) => !pair.emoji.trim() || !pair.roleId.trim())) {
          setError("Each pair needs an emoji and a role.");
          return;
        }
      }
    }

    setRoleReactionsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const enabled = roleReactions.enabled && roleReactionMessages.length > 0;
      const payload: RoleReactionSettings = {
        enabled,
        messages: roleReactionMessages.map((message) => ({
          key: message.key,
          channelId: message.channelId,
          type: message.type,
          message: message.message,
          embed: message.embed ? { ...message.embed } : undefined,
          pairs: message.pairs.map((pair) => ({ emoji: pair.emoji, roleId: pair.roleId })),
          messageId: message.messageId,
        })),
      };
      const saved = await updateRoleReactions(activeServerId, payload);
      const fallbackChannel = channels[0]?.id ?? "";
      const messages = buildRoleReactionMessages(saved.messages, fallbackChannel);
      setRoleReactions({ ...saved, messages });
      setRoleReactionMessages(messages);
      setRoleReactionsBaseline({ ...saved, messages });
      setActiveRoleReactionKey(null);
      setActiveRoleEmojiPickerId(null);
      setRoleEmojiSearch("");
      setSuccess("Role reactions saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save role reactions.");
    } finally {
      setRoleReactionsSaving(false);
    }
  };

  const handleWarthogToggle = () => {
    setWarthogSettings((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  const handleWarthogRoleSelect = (roleId: string) => {
    if (!roleId) {
      setWarthogRolePick("");
      return;
    }
    setWarthogSettings((prev) => ({
      ...prev,
      allowedRoles: prev.allowedRoles.includes(roleId)
        ? prev.allowedRoles
        : [...prev.allowedRoles, roleId],
    }));
    setWarthogRolePick("");
  };

  const removeWarthogRole = (roleId: string) => {
    setWarthogSettings((prev) => ({
      ...prev,
      allowedRoles: prev.allowedRoles.filter((id) => id !== roleId),
    }));
  };

  const handleWarthogSave = async () => {
    if (!activeServerId) {
      return;
    }
    setWarthogSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const saved = await updateWarthog(activeServerId, warthogSettings);
      setWarthogSettings(saved);
      setWarthogBaseline(saved);
      setSuccess("Warthog settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update Warthog mode.");
    } finally {
      setWarthogSaving(false);
    }
  };

  const addWarthogWhitelist = () => {
    const entries = warthogWhitelistInput
      .split(/[\s,]+/)
      .map((value) => value.trim())
      .filter((value) => value);
    if (entries.length === 0) {
      return;
    }
    setWarthogSettings((prev) => ({
      ...prev,
      whitelist: Array.from(new Set([...prev.whitelist, ...entries])),
    }));
    setWarthogWhitelistInput("");
  };

  const removeWarthogWhitelist = (userId: string) => {
    setWarthogSettings((prev) => ({
      ...prev,
      whitelist: prev.whitelist.filter((entry) => entry !== userId),
    }));
  };

  const handleAutoroleSave = async () => {
    if (!activeServerId) {
      return;
    }
    if (autoroleSettings.enabled && !autoroleSettings.roleId) {
      setError("Choose a role to assign.");
      return;
    }

    setAutoroleSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const saved = await updateAutorole(activeServerId, autoroleSettings);
      setAutoroleSettings(saved);
      setAutoroleBaseline(saved);
      setSuccess("Auto role settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save auto role settings.");
    } finally {
      setAutoroleSaving(false);
    }
  };

  const handleAddAdminUser = async () => {
    if (!adminUserInput.trim()) {
      setError("Enter a Discord user ID.");
      return;
    }
    setError(null);
    setSuccess(null);
    setAdminUsersLoading(true);
    try {
      const users = await addAdminUser(adminUserInput.trim());
      setAdminUsers(users);
      setAdminUserInput("");
      setSuccess("Admin user added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add admin user.");
    } finally {
      setAdminUsersLoading(false);
    }
  };

  const handleRemoveAdminUser = async (userId: string) => {
    setError(null);
    setSuccess(null);
    setAdminUsersLoading(true);
    try {
      const users = await removeAdminUser(userId);
      setAdminUsers(users);
      setSuccess("Admin user removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove admin user.");
    } finally {
      setAdminUsersLoading(false);
    }
  };

  const welcomeChannelLabel =
    channels.find((channel) => channel.id === welcomeSettings.channelId)?.name ??
    (welcomeSettings.channelId || "#channel");
  const farewellChannelLabel =
    channels.find((channel) => channel.id === farewellSettings.channelId)?.name ??
    (farewellSettings.channelId || "#channel");

  const previewText = formatPreview(welcomeSettings.text);
  const previewEmbedTitle = formatPreview(welcomeSettings.embed.title);
  const previewEmbedDescription = formatPreview(welcomeSettings.embed.description);
  const previewFarewellText = formatPreview(farewellSettings.text);
  const previewFarewellEmbedTitle = formatPreview(farewellSettings.embed.title);
  const previewFarewellEmbedDescription = formatPreview(farewellSettings.embed.description);

  const welcomeImagePreview = extractImageUrl(
    welcomeSettings.type === "text" ? welcomeSettings.text : welcomeSettings.embed.description
  );
  const farewellImagePreview = extractImageUrl(
    farewellSettings.type === "text" ? farewellSettings.text : farewellSettings.embed.description
  );

  const channelNameById = useMemo(() => {
    const map = new Map<string, string>();
    channels.forEach((channel) => {
      map.set(channel.id, channel.name);
    });
    return map;
  }, [channels]);

  const roleNameById = useMemo(() => {
    const map = new Map<string, string>();
    roles.forEach((role) => {
      map.set(role.id, stripRolePrefix(role.name));
    });
    return map;
  }, [roles]);

  const triggerEmojiOptions = useMemo(() => {
    return [...emojiOptions, ...defaultEmojiOptions];
  }, [emojiOptions]);

  const triggerEmojiMap = useMemo(() => {
    const map = new Map<string, EmojiOption>();
    triggerEmojiOptions.forEach((emoji) => {
      map.set(emoji.id, emoji);
    });
    return map;
  }, [triggerEmojiOptions]);

  const activeEmojiTrigger = useMemo(
    () => emojiRows.find((row) => row.id === activeEmojiTriggerId) ?? null,
    [emojiRows, activeEmojiTriggerId]
  );

  const activeRoleReactionMessage = useMemo(
    () => roleReactionMessages.find((message) => message.key === activeRoleReactionKey) ?? null,
    [roleReactionMessages, activeRoleReactionKey]
  );

  const roleEmojiOptions = useMemo(() => {
    return [...emojiOptions, ...defaultEmojiOptions];
  }, [emojiOptions]);

  const roleEmojiMap = useMemo(() => {
    const map = new Map<string, EmojiOption>();
    roleEmojiOptions.forEach((emoji) => {
      map.set(emoji.id, emoji);
    });
    return map;
  }, [roleEmojiOptions]);

  const warthogRoleOptions = useMemo(
    () =>
      roles.map((role) => ({
        value: role.id,
        label: stripRolePrefix(role.name),
        disabled: warthogSettings.allowedRoles.includes(role.id),
      })),
    [roles, warthogSettings.allowedRoles]
  );

  const triggerEmojiQuery = emojiSearch.trim().toLowerCase();
  const filteredTriggerCustomEmojis = useMemo(() => {
    if (!triggerEmojiQuery) {
      return emojiOptions;
    }
    return emojiOptions.filter(
      (option) =>
        option.name.toLowerCase().includes(triggerEmojiQuery) ||
        option.id.toLowerCase().includes(triggerEmojiQuery)
    );
  }, [emojiOptions, triggerEmojiQuery]);

  const filteredTriggerDefaultEmojis = useMemo(() => {
    if (!triggerEmojiQuery) {
      return defaultEmojiOptions;
    }
    return defaultEmojiOptions.filter(
      (option) =>
        option.name.toLowerCase().includes(triggerEmojiQuery) ||
        option.id.toLowerCase().includes(triggerEmojiQuery)
    );
  }, [triggerEmojiQuery]);

  const roleEmojiQuery = roleEmojiSearch.trim().toLowerCase();
  const filteredRoleCustomEmojis = useMemo(() => {
    if (!roleEmojiQuery) {
      return emojiOptions;
    }
    return emojiOptions.filter(
      (option) =>
        option.name.toLowerCase().includes(roleEmojiQuery) ||
        option.id.toLowerCase().includes(roleEmojiQuery)
    );
  }, [emojiOptions, roleEmojiQuery]);

  const filteredRoleDefaultEmojis = useMemo(() => {
    if (!roleEmojiQuery) {
      return defaultEmojiOptions;
    }
    return defaultEmojiOptions.filter(
      (option) =>
        option.name.toLowerCase().includes(roleEmojiQuery) ||
        option.id.toLowerCase().includes(roleEmojiQuery)
    );
  }, [roleEmojiQuery]);

  const welcomeLoading =
    !loaded.welcome ||
    !loaded.farewell ||
    sectionLoading.welcome ||
    sectionLoading.farewell ||
    sectionLoading.metadata;
  const eventsLoading = !loaded.events || sectionLoading.events || sectionLoading.metadata;
  const voicePresenceLoading =
    !loaded.presence || sectionLoading.presence || sectionLoading.metadata;
  const emojiLoading =
    !loaded.emoji || sectionLoading.emoji || (emojiOptionsLoading && emojiOptions.length === 0);
  const emojiUploadInProgress = emojiRows.some((row) =>
    row.images.some((image) => image.uploading)
  );
  const roleReactionsLoading =
    !loaded.roleReactions ||
    sectionLoading.roleReactions ||
    sectionLoading.metadata ||
    (emojiOptionsLoading && emojiOptions.length === 0);
  const warthogLoading = !loaded.warthog || sectionLoading.warthog;
  const autoroleLoading =
    !loaded.autorole || sectionLoading.autorole || sectionLoading.metadata;

  const welcomeDirty = loaded.welcome && !isEqual(welcomeSettings, welcomeBaseline);
  const farewellDirty = loaded.farewell && !isEqual(farewellSettings, farewellBaseline);
  const eventFormDirty =
    !isEqual(eventForm, eventFormBaseline) || editingEventId !== eventBaselineEditingId;
  const emojiPendingUpload = emojiRows.some((row) =>
    row.images.some((image) => image.uploadFile || image.uploading)
  );
  const emojiDirty =
    loaded.emoji &&
    (emojiRequireExact !== emojiBaseline.requireExact ||
      !isEqual(normalizeEmojiRows(emojiRows), emojiBaseline.triggers) ||
      emojiPendingUpload);
  const voicePresenceDirty =
    loaded.presence && !isEqual(voicePresenceSettings, voicePresenceBaseline);
  const roleReactionComparable: RoleReactionSettings = {
    enabled: roleReactions.enabled,
    messages: roleReactionMessages.map((message) => ({
      key: message.key,
      channelId: message.channelId,
      type: message.type,
      message: message.message,
      embed: message.embed ? { ...message.embed } : undefined,
      pairs: message.pairs.map((pair) => ({ emoji: pair.emoji, roleId: pair.roleId })),
      messageId: message.messageId,
    })),
  };
  const roleReactionsDirty =
    loaded.roleReactions && !isEqual(roleReactionComparable, roleReactionsBaseline);
  const autoroleDirty = loaded.autorole && !isEqual(autoroleSettings, autoroleBaseline);
  const warthogDirty = loaded.warthog && !isEqual(warthogSettings, warthogBaseline);

  const hasUnsavedChanges = (() => {
    if (activeSection === "welcome") {
      return welcomeDirty || farewellDirty;
    }
    if (activeSection === "events") {
      return eventFormDirty;
    }
    if (activeSection === "emoji") {
      return emojiDirty;
    }
    if (activeSection === "presence") {
      return voicePresenceDirty;
    }
    if (activeSection === "role-reactions") {
      return roleReactionsDirty;
    }
    if (activeSection === "autorole") {
      return autoroleDirty;
    }
    if (activeSection === "other") {
      return warthogDirty;
    }
    return false;
  })();

  const saveBarLabel =
    activeSection === "events"
      ? editingEventId
        ? "Update event"
        : "Create event"
      : "Save changes";
  const saveBarDisabled =
    (activeSection === "welcome" && (welcomeSaving || farewellSaving)) ||
    (activeSection === "events" && eventSaving) ||
    (activeSection === "emoji" && (emojiSaving || emojiUploadInProgress)) ||
    (activeSection === "presence" && voicePresenceSaving) ||
    (activeSection === "role-reactions" && roleReactionsSaving) ||
    (activeSection === "autorole" && autoroleSaving) ||
    (activeSection === "other" && warthogSaving);
  const discardBarDisabled = saveBarDisabled;

  const handleUnsavedSave = async () => {
    if (activeSection === "welcome") {
      if (welcomeDirty) {
        await handleWelcomeSave();
      }
      if (farewellDirty) {
        await handleFarewellSave();
      }
      return;
    }
    if (activeSection === "events") {
      await handleCreateEvent();
      return;
    }
    if (activeSection === "emoji") {
      await handleEmojiSave();
      return;
    }
    if (activeSection === "presence") {
      await handleVoicePresenceSave();
      return;
    }
    if (activeSection === "role-reactions") {
      await handleRoleReactionsSave();
      return;
    }
    if (activeSection === "autorole") {
      await handleAutoroleSave();
      return;
    }
    if (activeSection === "other") {
      await handleWarthogSave();
    }
  };

  const handleUnsavedDiscard = () => {
    setError(null);
    setSuccess(null);
    if (activeSection === "welcome") {
      setWelcomeSettings(welcomeBaseline);
      setFarewellSettings(farewellBaseline);
      return;
    }
    if (activeSection === "events") {
      setEditingEventId(eventBaselineEditingId);
      setEventForm(eventFormBaseline);
      return;
    }
    if (activeSection === "emoji") {
      emojiRows.forEach((row) => {
        row.images.forEach((image) => {
          if (image.previewUrl && image.previewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(image.previewUrl);
          }
        });
      });
      setEmojiRequireExact(emojiBaseline.requireExact);
      setEmojiRows(buildEmojiRows(emojiBaseline.triggers));
      setActiveEmojiPickerId(null);
      setActiveEmojiTriggerId(null);
      setEmojiSearch("");
      return;
    }
    if (activeSection === "presence") {
      setVoicePresenceSettings(voicePresenceBaseline);
      return;
    }
    if (activeSection === "role-reactions") {
      const fallbackChannel = channels[0]?.id ?? "";
      const messages = buildRoleReactionMessages(roleReactionsBaseline.messages, fallbackChannel);
      setRoleReactions({ ...roleReactionsBaseline, messages });
      setRoleReactionMessages(messages);
      setActiveRoleReactionKey(null);
      setActiveRoleEmojiPickerId(null);
      setRoleEmojiSearch("");
      return;
    }
    if (activeSection === "autorole") {
      setAutoroleSettings(autoroleBaseline);
      return;
    }
    if (activeSection === "other") {
      setWarthogSettings(warthogBaseline);
      setWarthogRolePick("");
      setWarthogWhitelistInput("");
      return;
    }
  };

  if (loading) {
    return <LoadingScreen label="Loading dashboard..." />;
  }

  const visibleSections = sections;

  return (
    <div className="dashboard-shell">
      <aside className="server-rail">
        <Link to="/" className="server-brand" title="ConqBot Home">
          <img src={logo} alt="ConqBot logo" />
        </Link>
        <div className="server-divider" />
        <div className="server-list">
          {servers.map((server) => (
            <button
              key={server.id}
              className={`server-button ${server.id === activeServerId ? "active" : ""} ${
                hasUnsavedChanges && server.id !== activeServerId ? "is-disabled" : ""
              }`}
              onClick={() => handleServerSelect(server.id)}
              aria-disabled={hasUnsavedChanges && server.id !== activeServerId}
              title={server.name}
              type="button"
            >
              {server.iconUrl ? (
                <img src={server.iconUrl} alt={server.name} />
              ) : (
                <span>{server.name.slice(0, 1)}</span>
              )}
            </button>
          ))}
        </div>
        <button
          className="server-add"
          type="button"
          onClick={handleInvite}
          disabled={inviteLoading}
        >
          +
        </button>
      </aside>

      <aside className="side-nav">
        <div className="side-header">
          <p className="eyebrow">Selected server</p>
          <div className="server-identity">
            <div className="server-icon">
              {activeServer?.iconUrl ? (
                <img src={activeServer.iconUrl} alt={activeServer.name} />
              ) : (
                <span>{activeServer?.name?.slice(0, 1) ?? "S"}</span>
              )}
            </div>
            <h2 className="server-name">{activeServer?.name ?? "No server"}</h2>
          </div>
          <span className="meta">ID: {activeServer?.id ?? "-"}</span>
        </div>

        <div className="side-divider" />

        <nav className="side-menu">
          {visibleSections.map((section) => (
            <button
              key={section.key}
              type="button"
              className={`side-item ${activeSection === section.key ? "active" : ""} ${
                hasUnsavedChanges && section.key !== activeSection ? "is-disabled" : ""
              }`}
              onClick={() => handleSectionSelect(section.key)}
              aria-disabled={hasUnsavedChanges && section.key !== activeSection}
            >
              <span className="side-item-icon">{sectionIcons[section.key]}</span>
              <span>{section.label}</span>
            </button>
          ))}
        </nav>

        <div className="side-divider" />

        <div className="side-link-group">
          <a
            className="side-link"
            href="https://conqsite.bard-dev.com/home"
            target="_blank"
            rel="noreferrer"
          >
            <span className="side-link-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="M12 3a9 9 0 1 0 9 9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M12 3c2.5 2.5 4 5.2 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.2-4-9s1.5-6.5 4-9z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 12h18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span>Go to Conqsite</span>
          </a>
          {isAdminPanel ? (
            <button
              type="button"
              className={`side-link side-link--admin ${
                activeSection === adminSection.key ? "active" : ""
              } ${hasUnsavedChanges && activeSection !== adminSection.key ? "is-disabled" : ""}`}
              onClick={() => handleSectionSelect(adminSection.key)}
              disabled={hasUnsavedChanges && activeSection !== adminSection.key}
              aria-disabled={hasUnsavedChanges && activeSection !== adminSection.key}
            >
              <span className="side-link-icon" aria-hidden="true">
                {sectionIcons.admin}
              </span>
              <span>{adminSection.label}</span>
            </button>
          ) : null}
          <a
            className="side-link side-link--coffee"
            href="https://ko-fi.com/K3K713SMAY"
            target="_blank"
            rel="noreferrer"
          >
            <span className="side-link-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="M4 8h11v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 9h3a2 2 0 0 1 0 4h-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M6 5c0 1.2 1.2 1.2 1.2 2.4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M10 5c0 1.2 1.2 1.2 1.2 2.4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span>Buy me a coffee</span>
          </a>
        </div>

        <div className="side-footer-links">
          <a
            className="footer-icon"
            href="https://discord.com/invite/CCVJauxa2Y"
            target="_blank"
            rel="noreferrer"
            aria-label="Discord"
            title="Discord"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M18 5.5a14 14 0 0 0-3.5-1.1l-.4.8a13 13 0 0 0-4.2 0l-.4-.8A14 14 0 0 0 6 5.5a14.5 14.5 0 0 0-2.5 10.5 13.5 13.5 0 0 0 4.2 2.2l.8-1.4a9 9 0 0 1-1.3-.6l.3-.2a10 10 0 0 0 9 0l.3.2a9 9 0 0 1-1.3.6l.8 1.4a13.5 13.5 0 0 0 4.2-2.2A14.5 14.5 0 0 0 18 5.5Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M9 12.5a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4ZM15 12.5a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z"
                fill="currentColor"
              />
            </svg>
          </a>
          <Link
            className="footer-icon"
            to="/privacy-policy"
            aria-label="Privacy Policy"
            title="Privacy Policy"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 3l7 3v5c0 5-3 9-7 11-4-2-7-6-7-11V6l7-3z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9.5 12.5l1.5 1.5 3.5-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <Link
            className="footer-icon"
            to="/terms-of-service"
            aria-label="Terms of Service"
            title="Terms of Service"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M7 4h7l3 3v12H7z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 4v3h3M9 12h6M9 16h4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </Link>
        </div>

        <div className="side-profile">
          <div className="profile-info">
            <div className="profile-avatar">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} />
              ) : (
                <span>{user?.username?.slice(0, 1) ?? "U"}</span>
              )}
            </div>
            <div>
              <strong>{user?.username ?? "User"}</strong>
              <span className="meta">ID: {user?.id ?? "-"}</span>
            </div>
          </div>
          <Button variant="ghost" onClick={signOut}>
            Log out
          </Button>
        </div>
      </aside>

      <main className={`dashboard-main ${hasUnsavedChanges ? "has-save-bar" : ""}`}>
        {error ? <div className="alert error">{error}</div> : null}
        {success ? <div className="alert success">{success}</div> : null}

        {activeSection === "overview" ? (
          <section className="content-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">Overview</p>
                <h1>{activeServer?.name ?? "Server overview"}</h1>
                <p className="muted">
                  Quick snapshot of core settings, automations, and attendance tools.
                </p>
              </div>
              <div className="section-actions">
                <Button
                  variant="outline"
                  onClick={() => handleSectionSelect("welcome")}
                >
                  Edit greetings
                </Button>
                <Button onClick={handleInvite} disabled={inviteLoading}>
                  {inviteLoading ? "Opening..." : "Invite bot"}
                </Button>
              </div>
            </div>
            <div className="content-grid content-grid--overview">
              <div className="card-stack">
                <article className="card">
                  <div className="card-header">
                    <div>
                      <h3>Server snapshot</h3>
                      <p className="muted">Live counts from your configuration.</p>
                    </div>
                    <span className={`pill ${activeServer?.hasBot ? "success" : "warning"}`}>
                      {activeServer?.hasBot ? "Bot online" : "Bot missing"}
                    </span>
                  </div>
                  <div className="overview-stats-grid">
                    <div className="overview-stat">
                      <span className="muted">Members</span>
                      <div className="stat">{activeServer?.memberCount ?? 0}</div>
                    </div>
                    <div className="overview-stat">
                      <span className="muted">Text channels</span>
                      <div className="stat">{channels.length}</div>
                    </div>
                    <div className="overview-stat">
                      <span className="muted">Voice channels</span>
                      <div className="stat">{voiceChannels.length}</div>
                    </div>
                    <div className="overview-stat">
                      <span className="muted">Roles</span>
                      <div className="stat">{roles.length}</div>
                    </div>
                    <div className="overview-stat">
                      <span className="muted">Events</span>
                      <div className="stat">
                        {loaded.events ? events.length : "--"}
                      </div>
                    </div>
                    <div className="overview-stat">
                      <span className="muted">Emoji triggers</span>
                      <div className="stat">
                        {loaded.emoji ? emojiRows.length : "--"}
                      </div>
                    </div>
                  </div>
                </article>

                <article className="card">
                  <div className="card-header">
                    <div>
                      <h3>Feature status</h3>
                      <p className="muted">
                        Review what is enabled before opening each module.
                      </p>
                    </div>
                  </div>
                  <div className="overview-feature-list">
                    {(() => {
                      const welcomeStatus = getStatusPill(
                        loaded.welcome,
                        welcomeSettings.enabled
                      );
                      const farewellStatus = getStatusPill(
                        loaded.farewell,
                        farewellSettings.enabled
                      );
                      const autoRoleStatus = getStatusPill(
                        loaded.autorole,
                        autoroleSettings.enabled
                      );
                      const roleReactionStatus = getStatusPill(
                        loaded.roleReactions,
                        roleReactions.enabled
                      );
                      const voicePresenceStatus = getStatusPill(
                        loaded.presence,
                        voicePresenceSettings.schedules.length > 0,
                        "Scheduled",
                        "Manual only"
                      );
                      return [
                        {
                          title: "Welcome messages",
                          description: "Greeting members as they arrive.",
                          status: welcomeStatus,
                          section: "welcome" as const,
                        },
                        {
                          title: "Farewell messages",
                          description: "Send a goodbye when members leave.",
                          status: farewellStatus,
                          section: "welcome" as const,
                        },
                        {
                          title: "Event creator",
                          description: `${loaded.events ? events.length : "--"} active events.`,
                          status: getStatusPill(loaded.events, events.length > 0, "Active", "Empty"),
                          section: "events" as const,
                        },
                        {
                          title: "Emoji triggers",
                          description: `${loaded.emoji ? emojiRows.length : "--"} trigger set(s).`,
                          status: getStatusPill(loaded.emoji, emojiRows.length > 0, "Active", "Empty"),
                          section: "emoji" as const,
                        },
                        {
                          title: "Role reactions",
                          description: `${loaded.roleReactions ? roleReactionMessages.length : "--"} message(s).`,
                          status: roleReactionStatus,
                          section: "role-reactions" as const,
                        },
                        {
                          title: "Auto role",
                          description: "Assign a role when members join.",
                          status: autoRoleStatus,
                          section: "autorole" as const,
                        },
                        {
                          title: "Voice presence",
                          description: `${loaded.presence ? voicePresenceSettings.schedules.length : "--"} schedule(s).`,
                          status: voicePresenceStatus,
                          section: "presence" as const,
                        },
                      ];
                    })().map((item) => (
                      <div key={item.title} className="overview-feature-row">
                        <div>
                          <strong>{item.title}</strong>
                          <span className="muted">{item.description}</span>
                        </div>
                        <span className={`pill ${item.status.tone}`}>{item.status.label}</span>
                        <Button
                          variant="ghost"
                          onClick={() => handleSectionSelect(item.section)}
                        >
                          Open
                        </Button>
                      </div>
                    ))}
                  </div>
                </article>
              </div>

              <div className="card-stack">
                <article className="card">
                  <div className="card-header">
                    <div>
                      <h3>Quick actions</h3>
                      <p className="muted">Jump into the most common tasks.</p>
                    </div>
                  </div>
                  <div className="overview-action-grid">
                    <Button variant="outline" onClick={() => handleSectionSelect("events")}>
                      Create event
                    </Button>
                    <Button variant="outline" onClick={() => handleSectionSelect("emoji")}>
                      Edit emoji triggers
                    </Button>
                    <Button variant="outline" onClick={() => handleSectionSelect("role-reactions")}>
                      Role reactions
                    </Button>
                    <Button variant="outline" onClick={() => handleSectionSelect("presence")}>
                      Presence settings
                    </Button>
                  </div>
                </article>

                <article className="card">
                  <div className="card-header">
                    <div>
                      <h3>Latest presence snapshot</h3>
                      <p className="muted">Most recent voice capture.</p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => loadVoicePresenceLogs(true)}
                      disabled={voicePresenceLogsLoading}
                    >
                      {voicePresenceLogsLoading ? "Refreshing..." : "Refresh"}
                    </Button>
                  </div>
                  {voicePresenceLogs.length === 0 ? (
                    <p className="muted">No snapshots captured yet.</p>
                  ) : (
                    <div className="overview-presence-card">
                      <strong>{formatLogTime(voicePresenceLogs[0]?.createdAt ?? "")}</strong>
                      <div className="overview-presence-stats">
                        <div>
                          <span className="muted">Members</span>
                          <span className="stat">{voicePresenceLogs[0]?.totalMembers ?? 0}</span>
                        </div>
                        <div>
                          <span className="muted">Channels</span>
                          <span className="stat">{voicePresenceLogs[0]?.totalChannels ?? 0}</span>
                        </div>
                      </div>
                      <div className="overview-presence-chips">
                        {(voicePresenceLogs[0]?.channels ?? []).slice(0, 6).map((channel) => (
                          <span key={channel.id} className="pill neutral">
                            {channel.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              </div>
            </div>
          </section>
        ) : null}

        {activeSection === "welcome" ? (
          welcomeLoading ? (
            <LoadingScreen label="Loading welcome settings..." />
          ) : (
            <section className="content-section">
              <div className="section-header">
                <div>
                  <p className="eyebrow">Greetings & Farewells</p>
                  <h1>Set the tone for arrivals and departures</h1>
                  <p className="muted">Toggle welcome or farewell messages and tailor the content.</p>
                </div>
              </div>
              <div className="content-grid content-grid--wide-preview">
                <div className="card-stack">
                  <div className="card">
                    <div className="card-header">
                      <div>
                        <h3>Welcome message</h3>
                        <p className="muted">Greet new members with an automated message.</p>
                      </div>
                      <Button onClick={handleWelcomeSave} disabled={welcomeSaving}>
                        {welcomeSaving ? "Saving..." : "Save welcome"}
                      </Button>
                    </div>
                    <div className="switch-row">
                      <label className="switch-control">
                        <input
                          type="checkbox"
                          checked={welcomeSettings.enabled}
                          onChange={() =>
                            setWelcomeSettings((prev) => ({
                              ...prev,
                              enabled: !prev.enabled,
                            }))
                          }
                          aria-label="Enable welcome message"
                        />
                      </label>
                      <span className="switch-label">Enable welcome message</span>
                    </div>
                    {welcomeSettings.enabled ? (
                      <>
                        <div className="form-grid">
                          <label>
                            Channel
                            <SearchableSelect
                              value={welcomeSettings.channelId}
                              onChange={(value) =>
                                setWelcomeSettings((prev) => ({
                                  ...prev,
                                  channelId: value,
                                }))
                              }
                              options={channels.map((channel) => ({
                                value: channel.id,
                                label: channel.name,
                              }))}
                              placeholder="Search channels..."
                            />
                          </label>
                          <label>
                            Message type
                            <select
                              value={welcomeSettings.type}
                              onChange={(event) =>
                                setWelcomeSettings((prev) => ({
                                  ...prev,
                                  type: event.target.value as "embed" | "text",
                                }))
                              }
                            >
                              <option value="embed">Embed</option>
                              <option value="text">Plain text</option>
                            </select>
                          </label>
                        </div>

                        {welcomeSettings.type === "embed" ? (
                          <div className="form-grid">
                            <label>
                              Embed title
                              <input
                                value={welcomeSettings.embed.title}
                                onChange={(event) =>
                                  setWelcomeSettings((prev) => ({
                                    ...prev,
                                    embed: {
                                      ...prev.embed,
                                      title: event.target.value,
                                    },
                                  }))
                                }
                              />
                            </label>
                            <label>
                              Description
                              <textarea
                                rows={4}
                                value={welcomeSettings.embed.description}
                                onChange={(event) =>
                                  setWelcomeSettings((prev) => ({
                                    ...prev,
                                    embed: {
                                      ...prev.embed,
                                      description: event.target.value,
                                    },
                                  }))
                                }
                              />
                            </label>
                            <div className="field">
                              <span>Accent color</span>
                              <div className="color-input">
                                <input
                                  type="color"
                                  value={welcomeSettings.embed.color}
                                  onChange={(event) =>
                                    setWelcomeSettings((prev) => ({
                                      ...prev,
                                      embed: {
                                        ...prev.embed,
                                        color: event.target.value,
                                      },
                                    }))
                                  }
                                  aria-label="Embed accent color"
                                />
                                <span className="color-value">{welcomeSettings.embed.color}</span>
                              </div>
                            </div>
                            <div className="switch-row">
                              <label className="switch-control">
                                <input
                                  type="checkbox"
                                  checked={welcomeSettings.embed.showAvatar}
                                  onChange={() =>
                                    setWelcomeSettings((prev) => ({
                                      ...prev,
                                      embed: {
                                        ...prev.embed,
                                        showAvatar: !prev.embed.showAvatar,
                                      },
                                    }))
                                  }
                                  aria-label="Show user avatar"
                                />
                              </label>
                              <span className="switch-label">Show user avatar</span>
                            </div>
                          </div>
                        ) : (
                          <div className="form-grid">
                            <label>
                              Message text
                              <textarea
                                rows={4}
                                value={welcomeSettings.text}
                                onChange={(event) =>
                                  setWelcomeSettings((prev) => ({
                                    ...prev,
                                    text: event.target.value,
                                  }))
                                }
                              />
                            </label>
                            <p className="muted">You can use {"{user}"} and {"{server}"} variables.</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="muted">Welcome messages are currently disabled.</p>
                    )}
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <div>
                        <h3>Farewell message</h3>
                        <p className="muted">Say goodbye automatically when members leave.</p>
                      </div>
                      <Button onClick={handleFarewellSave} disabled={farewellSaving}>
                        {farewellSaving ? "Saving..." : "Save farewell"}
                      </Button>
                    </div>
                    <div className="switch-row">
                      <label className="switch-control">
                        <input
                          type="checkbox"
                          checked={farewellSettings.enabled}
                          onChange={() =>
                            setFarewellSettings((prev) => ({
                              ...prev,
                              enabled: !prev.enabled,
                            }))
                          }
                          aria-label="Enable farewell message"
                        />
                      </label>
                      <span className="switch-label">Enable farewell message</span>
                    </div>
                    {farewellSettings.enabled ? (
                      <>
                        <div className="form-grid">
                          <label>
                            Channel
                            <SearchableSelect
                              value={farewellSettings.channelId}
                              onChange={(value) =>
                                setFarewellSettings((prev) => ({
                                  ...prev,
                                  channelId: value,
                                }))
                              }
                              options={channels.map((channel) => ({
                                value: channel.id,
                                label: channel.name,
                              }))}
                              placeholder="Search channels..."
                            />
                          </label>
                          <label>
                            Message type
                            <select
                              value={farewellSettings.type}
                              onChange={(event) =>
                                setFarewellSettings((prev) => ({
                                  ...prev,
                                  type: event.target.value as "embed" | "text",
                                }))
                              }
                            >
                              <option value="embed">Embed</option>
                              <option value="text">Plain text</option>
                            </select>
                          </label>
                        </div>

                        {farewellSettings.type === "embed" ? (
                          <div className="form-grid">
                            <label>
                              Embed title
                              <input
                                value={farewellSettings.embed.title}
                                onChange={(event) =>
                                  setFarewellSettings((prev) => ({
                                    ...prev,
                                    embed: {
                                      ...prev.embed,
                                      title: event.target.value,
                                    },
                                  }))
                                }
                              />
                            </label>
                            <label>
                              Description
                              <textarea
                                rows={4}
                                value={farewellSettings.embed.description}
                                onChange={(event) =>
                                  setFarewellSettings((prev) => ({
                                    ...prev,
                                    embed: {
                                      ...prev.embed,
                                      description: event.target.value,
                                    },
                                  }))
                                }
                              />
                            </label>
                            <div className="field">
                              <span>Accent color</span>
                              <div className="color-input">
                                <input
                                  type="color"
                                  value={farewellSettings.embed.color}
                                  onChange={(event) =>
                                    setFarewellSettings((prev) => ({
                                      ...prev,
                                      embed: {
                                        ...prev.embed,
                                        color: event.target.value,
                                      },
                                    }))
                                  }
                                  aria-label="Embed accent color"
                                />
                                <span className="color-value">{farewellSettings.embed.color}</span>
                              </div>
                            </div>
                            <div className="switch-row">
                              <label className="switch-control">
                                <input
                                  type="checkbox"
                                  checked={farewellSettings.embed.showAvatar}
                                  onChange={() =>
                                    setFarewellSettings((prev) => ({
                                      ...prev,
                                      embed: {
                                        ...prev.embed,
                                        showAvatar: !prev.embed.showAvatar,
                                      },
                                    }))
                                  }
                                  aria-label="Show user avatar"
                                />
                              </label>
                              <span className="switch-label">Show user avatar</span>
                            </div>
                          </div>
                        ) : (
                          <div className="form-grid">
                            <label>
                              Message text
                              <textarea
                                rows={4}
                                value={farewellSettings.text}
                                onChange={(event) =>
                                  setFarewellSettings((prev) => ({
                                    ...prev,
                                    text: event.target.value,
                                  }))
                                }
                              />
                            </label>
                            <p className="muted">You can use {"{user}"} and {"{server}"} variables.</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="muted">Farewell messages are currently disabled.</p>
                    )}
                  </div>
                </div>

                <div className="card-stack">
                  <div className="card discord-preview">
                    <p className="muted">Welcome preview</p>
                    <div className="discord-message">
                      <div className="discord-avatar">
                        <img src={logo} alt="ConqBot" />
                      </div>
                      <div className="discord-body">
                        <div className="discord-header">
                          <span className="discord-username">ConqBot</span>
                          <span className="discord-bot-tag">BOT</span>
                          <span className="discord-time">Today at 19:00</span>
                        </div>
                        {welcomeSettings.enabled ? (
                          welcomeSettings.type === "text" ? (
                            <>
                              <p className="discord-text">{previewText}</p>
                              {welcomeImagePreview ? (
                                <div className="discord-media">
                                  <img src={welcomeImagePreview} alt="Welcome preview" />
                                </div>
                              ) : null}
                            </>
                          ) : (
                            <>
                              <div className="discord-embed">
                                <div
                                  className="discord-embed-accent"
                                  style={{ background: welcomeSettings.embed.color }}
                                />
                                <div className="discord-embed-content">
                                  <div className="discord-embed-title">{previewEmbedTitle}</div>
                                  <div className="discord-embed-description">
                                    {previewEmbedDescription}
                                  </div>
                                  <div className="discord-embed-footer">Welcome message preview</div>
                                </div>
                                {welcomeSettings.embed.showAvatar ? (
                                  <div className="discord-embed-avatar">
                                    {user?.avatarUrl ? (
                                      <img src={user.avatarUrl} alt={user.username ?? "User"} />
                                    ) : (
                                      <span>{user?.username?.slice(0, 1) ?? "U"}</span>
                                    )}
                                  </div>
                                ) : null}
                              </div>
                              {welcomeImagePreview ? (
                                <div className="discord-media">
                                  <img src={welcomeImagePreview} alt="Welcome preview" />
                                </div>
                              ) : null}
                            </>
                          )
                        ) : (
                          <p className="muted">Welcome message disabled.</p>
                        )}
                      </div>
                    </div>
                    <span className="muted">Sending to {welcomeChannelLabel}</span>
                  </div>

                  <div className="card discord-preview">
                    <p className="muted">Farewell preview</p>
                    <div className="discord-message">
                      <div className="discord-avatar">
                        <img src={logo} alt="ConqBot" />
                      </div>
                      <div className="discord-body">
                        <div className="discord-header">
                          <span className="discord-username">ConqBot</span>
                          <span className="discord-bot-tag">BOT</span>
                          <span className="discord-time">Today at 19:00</span>
                        </div>
                        {farewellSettings.enabled ? (
                          farewellSettings.type === "text" ? (
                            <>
                              <p className="discord-text">{previewFarewellText}</p>
                              {farewellImagePreview ? (
                                <div className="discord-media">
                                  <img src={farewellImagePreview} alt="Farewell preview" />
                                </div>
                              ) : null}
                            </>
                          ) : (
                            <>
                              <div className="discord-embed">
                                <div
                                  className="discord-embed-accent"
                                  style={{ background: farewellSettings.embed.color }}
                                />
                                <div className="discord-embed-content">
                                  <div className="discord-embed-title">{previewFarewellEmbedTitle}</div>
                                  <div className="discord-embed-description">
                                    {previewFarewellEmbedDescription}
                                  </div>
                                  <div className="discord-embed-footer">Farewell message preview</div>
                                </div>
                                {farewellSettings.embed.showAvatar ? (
                                  <div className="discord-embed-avatar">
                                    {user?.avatarUrl ? (
                                      <img src={user.avatarUrl} alt={user.username ?? "User"} />
                                    ) : (
                                      <span>{user?.username?.slice(0, 1) ?? "U"}</span>
                                    )}
                                  </div>
                                ) : null}
                              </div>
                              {farewellImagePreview ? (
                                <div className="discord-media">
                                  <img src={farewellImagePreview} alt="Farewell preview" />
                                </div>
                              ) : null}
                            </>
                          )
                        ) : (
                          <p className="muted">Farewell message disabled.</p>
                        )}
                      </div>
                    </div>
                    <span className="muted">Sending to {farewellChannelLabel}</span>
                  </div>
                </div>
              </div>
            </section>
          )
        ) : null}

        {activeSection === "events" ? (
          eventsLoading ? (
            <LoadingScreen label="Loading events..." />
          ) : (
            <section className="content-section">
              <div className="section-header">
                <div>
                  <p className="eyebrow">Event Creator</p>
                  <h1>Plan events in minutes</h1>
                  <p className="muted">Create reminders and keep everyone on schedule.</p>
                </div>
              </div>
              <div className="content-grid content-grid--events">
                <div className="card">
                  {editingEventId ? (
                    <p className="muted">Editing is open in a separate window.</p>
                  ) : (
                    <>
                      <div className="form-grid">
                        <label>
                          Title
                          <input
                            value={eventForm.title}
                            onChange={(event) =>
                              setEventForm((prev) => ({ ...prev, title: event.target.value }))
                            }
                          />
                        </label>
                        <label>
                          Description
                          <textarea
                            rows={3}
                            value={eventForm.description}
                            onChange={(event) =>
                              setEventForm((prev) => ({ ...prev, description: event.target.value }))
                            }
                          />
                        </label>
                        <div className="form-grid split">
                          <label>
                            Date
                            <input
                              type="date"
                              value={eventForm.date}
                              onChange={(event) =>
                                setEventForm((prev) => ({ ...prev, date: event.target.value }))
                              }
                            />
                          </label>
                          <label>
                            Time
                            <input
                              type="time"
                              value={eventForm.time}
                              onChange={(event) =>
                                setEventForm((prev) => ({ ...prev, time: event.target.value }))
                              }
                            />
                          </label>
                        </div>
                        <label>
                          Repeat every (days)
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={eventForm.intervalDays}
                            onChange={(event) =>
                              setEventForm((prev) => ({
                                ...prev,
                                intervalDays: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <div className="form-grid split">
                          <label>
                            Channel
                            <SearchableSelect
                              value={eventForm.channelId}
                              onChange={(value) =>
                                setEventForm((prev) => ({ ...prev, channelId: value }))
                              }
                              options={channels.map((channel) => ({
                                value: channel.id,
                                label: channel.name,
                              }))}
                              placeholder="Search channels..."
                            />
                          </label>
                          <label>
                            Role (optional)
                            <SearchableSelect
                              value={eventForm.roleId}
                              onChange={(value) =>
                                setEventForm((prev) => ({ ...prev, roleId: value }))
                              }
                              options={roles.map((role) => ({
                                value: role.id,
                                label: stripRolePrefix(role.name),
                              }))}
                              placeholder="Search roles..."
                              emptyLabel="None"
                            />
                          </label>
                        </div>
                        <label>
                          Duration (hours)
                          <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={eventForm.durationHours}
                            onChange={(event) =>
                              setEventForm((prev) => ({
                                ...prev,
                                durationHours: event.target.value,
                              }))
                            }
                          />
                        </label>
                      </div>
                      <div className="form-actions">
                        <Button onClick={handleCreateEvent} disabled={eventSaving}>
                          {eventSaving ? "Saving..." : "Create event"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                <div className="card">
                  <h3>Upcoming events</h3>
                  <div className="event-grid">
                    {events.length === 0 ? (
                      <p className="muted">No events scheduled yet.</p>
                    ) : (
                      events.map((eventItem) => {
                        const isPinging = eventPingState?.id === eventItem.id;
                        const pingingMode = eventPingState?.mode;
                        const hasRole = Boolean(eventItem.roleId);
                        return (
                          <div key={eventItem.id} className="event-tile">
                            <div className="event-tile-header">
                              <strong>{eventItem.title}</strong>
                              <span className={`pill ${eventItem.intervalDays > 0 ? "info" : "neutral"}`}>
                                {eventItem.intervalDays > 0
                                  ? `Every ${eventItem.intervalDays} day${
                                      eventItem.intervalDays > 1 ? "s" : ""
                                    }`
                                  : "One-time"}
                              </span>
                            </div>
                            <p className="muted">
                              {eventItem.date} • {eventItem.time}
                            </p>
                            <p className="muted">
                              {channelNameById.get(eventItem.channelId) ?? eventItem.channelId}
                            </p>
                            <div className="event-actions event-actions--ping">
                              <span className="muted">Ping:</span>
                              <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => handlePingEvent(eventItem.id, "unchecked")}
                                disabled={isPinging || !hasRole}
                                title={hasRole ? "Ping members without a signup." : "Set a role to use this ping."}
                              >
                                {isPinging && pingingMode === "unchecked"
                                  ? "Pinging..."
                                  : "Unchecked"}
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => handlePingEvent(eventItem.id, "tentative")}
                                disabled={isPinging}
                              >
                                {isPinging && pingingMode === "tentative"
                                  ? "Pinging..."
                                  : "Tentative"}
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => handlePingEvent(eventItem.id, "declined")}
                                disabled={isPinging}
                              >
                                {isPinging && pingingMode === "declined"
                                  ? "Pinging..."
                                  : "Declined"}
                              </button>
                            </div>
                            <div className="event-actions">
                              <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => handleEditEvent(eventItem)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => handleDeleteEvent(eventItem.id)}
                                disabled={deletingEventId === eventItem.id}
                              >
                                {deletingEventId === eventItem.id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
              {editingEventId ? (
                <div className="event-editor-overlay" role="dialog" aria-modal="true">
                  <div className="event-editor">
                    <div className="event-editor-header">
                      <div>
                        <p className="eyebrow">Edit event</p>
                        <h2>Update event details</h2>
                      </div>
                      <Button variant="ghost" onClick={handleCancelEdit}>
                        Close
                      </Button>
                    </div>
                    <div className="form-grid">
                      <label>
                        Title
                        <input
                          value={eventForm.title}
                          onChange={(event) =>
                            setEventForm((prev) => ({ ...prev, title: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        Description
                        <textarea
                          rows={3}
                          value={eventForm.description}
                          onChange={(event) =>
                            setEventForm((prev) => ({ ...prev, description: event.target.value }))
                          }
                        />
                      </label>
                      <div className="form-grid split">
                        <label>
                          Date
                          <input
                            type="date"
                            value={eventForm.date}
                            onChange={(event) =>
                              setEventForm((prev) => ({ ...prev, date: event.target.value }))
                            }
                          />
                        </label>
                        <label>
                          Time
                          <input
                            type="time"
                            value={eventForm.time}
                            onChange={(event) =>
                              setEventForm((prev) => ({ ...prev, time: event.target.value }))
                            }
                          />
                        </label>
                      </div>
                      <label>
                        Repeat every (days)
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={eventForm.intervalDays}
                          onChange={(event) =>
                            setEventForm((prev) => ({
                              ...prev,
                              intervalDays: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <div className="form-grid split">
                        <label>
                          Channel
                          <SearchableSelect
                            value={eventForm.channelId}
                            onChange={(value) =>
                              setEventForm((prev) => ({ ...prev, channelId: value }))
                            }
                            options={channels.map((channel) => ({
                              value: channel.id,
                              label: channel.name,
                            }))}
                            placeholder="Search channels..."
                          />
                        </label>
                        <label>
                          Role (optional)
                          <SearchableSelect
                            value={eventForm.roleId}
                            onChange={(value) =>
                              setEventForm((prev) => ({ ...prev, roleId: value }))
                            }
                            options={roles.map((role) => ({
                              value: role.id,
                              label: stripRolePrefix(role.name),
                            }))}
                            placeholder="Search roles..."
                            emptyLabel="None"
                          />
                        </label>
                      </div>
                      <label>
                        Duration (hours)
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={eventForm.durationHours}
                          onChange={(event) =>
                            setEventForm((prev) => ({
                              ...prev,
                              durationHours: event.target.value,
                            }))
                          }
                        />
                      </label>
                    </div>
                    <div className="form-actions">
                      <Button onClick={handleCreateEvent} disabled={eventSaving}>
                        {eventSaving ? "Saving..." : "Update event"}
                      </Button>
                      <Button variant="ghost" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>
          )
        ) : null}

        {activeSection === "presence" ? (
          voicePresenceLoading ? (
            <LoadingScreen label="Loading voice presence..." />
          ) : (
            <section className="content-section">
              <div className="section-header">
                <div>
                  <p className="eyebrow">Voice Presence</p>
                  <h1>Track who is in voice channels</h1>
                  <p className="muted">
                    Capture attendance on demand or schedule automatic snapshots.
                  </p>
                </div>
              </div>

              <div className="presence-shell">
                <div className="tab-row">
                  {[
                    { key: "manual", label: "Manual capture" },
                    { key: "schedule", label: "Scheduled capture" },
                    { key: "history", label: "History" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={`tab-button ${presenceTab === tab.key ? "active" : ""}`}
                      onClick={() =>
                        setPresenceTab(tab.key as "manual" | "schedule" | "history")
                      }
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {presenceTab === "manual" ? (
                  <div className="presence-pane">
                    <div className="card">
                      <div className="card-header">
                        <div>
                          <h3>Manual capture</h3>
                          <p className="muted">
                            Pick channels to scan or leave empty for all voice channels.
                          </p>
                        </div>
                        <Button onClick={handleVoicePresenceRun} disabled={voicePresenceRunning}>
                          {voicePresenceRunning ? "Capturing..." : "Fetch presence"}
                        </Button>
                      </div>
                      <div className="form-grid">
                        <label>
                          Capture name
                          <input
                            value={voicePresenceSettings.manualName ?? ""}
                            onChange={(event) =>
                              setVoicePresenceSettings((prev) => ({
                                ...prev,
                                manualName: event.target.value,
                              }))
                            }
                            placeholder="e.g. Weekly voice check"
                          />
                        </label>
                      </div>
                      {voiceChannels.length === 0 ? (
                        <p className="muted">No voice channels found on this server.</p>
                      ) : (
                        <div className="presence-channel-grid presence-channel-grid--scroll">
                          {voiceChannels.map((channel) => (
                            <label key={channel.id} className="presence-channel-option">
                              <input
                                type="checkbox"
                                checked={voicePresenceSettings.manualChannelIds.includes(channel.id)}
                                onChange={() =>
                                  setVoicePresenceSettings((prev) => ({
                                    ...prev,
                                    manualChannelIds: toggleSelection(
                                      prev.manualChannelIds,
                                      channel.id
                                    ),
                                  }))
                                }
                              />
                              <span>{channel.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {presenceTab === "schedule" ? (
                  <div className="presence-pane">
                    <div className="card">
                      <div className="card-header">
                        <div>
                          <h3>Scheduled capture</h3>
                          <p className="muted">
                            Plan recurring snapshots for chosen voice channels.
                          </p>
                        </div>
                        <Button variant="ghost" onClick={addVoicePresenceSchedule}>
                          Add schedule
                        </Button>
                      </div>
                      {voicePresenceSettings.schedules.length === 0 ? (
                        <div className="empty-state">
                          <p className="muted">No schedules yet.</p>
                        </div>
                      ) : (
                        <div className="presence-schedule-list">
                          {voicePresenceSettings.schedules.map((schedule, index) => (
                            <div key={schedule.id} className="presence-schedule-card">
                              <div className="card-header">
                                <div>
                                  <h4>Schedule {index + 1}</h4>
                                  <p className="muted">
                                    Last run: {schedule.lastRun || "Never"}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-ghost"
                                  onClick={() => removeVoicePresenceSchedule(schedule.id)}
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="form-grid">
                                <label>
                                  Schedule name
                                  <input
                                    value={schedule.name ?? ""}
                                    onChange={(event) =>
                                      updateVoicePresenceSchedule(schedule.id, (prev) => ({
                                        ...prev,
                                        name: event.target.value,
                                      }))
                                    }
                                    placeholder="e.g. Saturday raid check"
                                  />
                                </label>
                              </div>
                              <div className="form-grid split">
                                <label>
                                  Day of week
                                  <select
                                    value={schedule.dayOfWeek}
                                    onChange={(event) =>
                                      updateVoicePresenceSchedule(schedule.id, (prev) => ({
                                        ...prev,
                                        dayOfWeek: Number(event.target.value),
                                      }))
                                    }
                                  >
                                    {presenceDays.map((day) => (
                                      <option key={day.value} value={day.value}>
                                        {day.label}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label>
                                  Time
                                  <input
                                    type="time"
                                    value={schedule.time}
                                    onChange={(event) =>
                                      updateVoicePresenceSchedule(schedule.id, (prev) => ({
                                        ...prev,
                                        time: event.target.value,
                                      }))
                                    }
                                  />
                                </label>
                              </div>
                              <div className="switch-row">
                                <label className="switch-control">
                                  <input
                                    type="checkbox"
                                    checked={schedule.enabled}
                                    onChange={() =>
                                      updateVoicePresenceSchedule(schedule.id, (prev) => ({
                                        ...prev,
                                        enabled: !prev.enabled,
                                      }))
                                    }
                                  />
                                </label>
                                <span className="switch-label">Enabled</span>
                              </div>
                              <div className="presence-channel-grid presence-channel-grid--scroll">
                                {voiceChannels.map((channel) => (
                                  <label key={channel.id} className="presence-channel-option">
                                    <input
                                      type="checkbox"
                                      checked={schedule.channelIds.includes(channel.id)}
                                      onChange={() =>
                                        updateVoicePresenceSchedule(schedule.id, (prev) => ({
                                          ...prev,
                                          channelIds: toggleSelection(prev.channelIds, channel.id),
                                        }))
                                      }
                                    />
                                    <span>{channel.name}</span>
                                  </label>
                                ))}
                              </div>
                              {voiceChannels.length === 0 ? (
                                <p className="muted">No voice channels available.</p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {presenceTab === "history" ? (
                  <div className="presence-pane">
                    <div className="card">
                      <div className="card-header">
                        <div>
                          <h3>Presence history</h3>
                          <p className="muted">
                            All snapshots from manual and scheduled runs.
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => loadVoicePresenceLogs(true)}
                          disabled={voicePresenceLogsLoading}
                        >
                          {voicePresenceLogsLoading ? "Refreshing..." : "Refresh"}
                        </Button>
                      </div>
                      {voicePresenceLogs.length === 0 ? (
                        <p className="muted">No snapshots stored yet.</p>
                      ) : (
                        <div className="presence-log-table">
                          {voicePresenceLogs.map((log) => {
                            const name =
                              log.name ||
                              (log.source === "schedule"
                                ? "Scheduled capture"
                                : "Manual capture");
                            return (
                              <div key={log.id ?? log.createdAt} className="presence-log-row">
                                <div>
                                  <strong>{name}</strong>
                                  <p className="muted">{formatLogTime(log.createdAt ?? "")}</p>
                                </div>
                                <div className="presence-log-meta">
                                  <span className="pill neutral">
                                    {log.source === "schedule" ? "Scheduled" : "Manual"}
                                  </span>
                                  <span className="muted">{log.totalChannels} channels</span>
                                  <span className="muted">{log.totalMembers} members</span>
                                </div>
                                <div className="presence-log-actions">
                                  <Button variant="ghost" onClick={() => setActivePresenceLog(log)}>
                                    Details
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    onClick={() => handleDeletePresenceLog(log.id)}
                                    disabled={voicePresenceLogDeletingId === log.id}
                                  >
                                    {voicePresenceLogDeletingId === log.id
                                      ? "Deleting..."
                                      : "Delete"}
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => loadVoicePresenceLogs(false)}
                        disabled={voicePresenceLogsLoading}
                      >
                        Load more
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          )
        ) : null}

        {activeSection === "emoji" ? (
          emojiLoading ? (
            <LoadingScreen label="Loading emoji triggers..." />
          ) : (
            <section className="content-section">
              <div className="section-header">
                <div>
                  <p className="eyebrow">Emoji Triggers</p>
                  <h1>Trigger images with emoji messages</h1>
                  <p className="muted">
                    Add multiple images per emoji. One is chosen at random when it triggers.
                  </p>
                </div>
                <div className="section-actions">
                  <Button
                    variant="outline"
                    onClick={handleEmojiSave}
                    disabled={emojiSaving || emojiUploadInProgress}
                  >
                    {emojiSaving ? "Saving..." : emojiUploadInProgress ? "Uploading..." : "Save triggers"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      const id = createId();
                      setEmojiRows((prev) => [
                        ...prev,
                        {
                          id,
                          emoji: "",
                          images: [createEmojiImageRow()],
                        },
                      ]);
                      setActiveEmojiTriggerId(id);
                    }}
                  >
                    Add trigger
                  </Button>
                </div>
              </div>
              <div className="card">
                <div className="switch-row">
                  <label className="switch-control">
                    <input
                      type="checkbox"
                      checked={emojiRequireExact}
                      onChange={() => setEmojiRequireExact((prev) => !prev)}
                      aria-label="Require exact emoji messages"
                    />
                  </label>
                  <span className="switch-label">
                    Require messages to be only the emoji
                  </span>
                </div>
                <p className="muted">
                  When disabled, the image will send if the emoji appears anywhere in the message.
                </p>
                {emojiRows.length === 0 ? (
                  <div className="empty-state">
                    <p className="muted">No triggers yet.</p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const id = createId();
                        setEmojiRows((prev) => [
                          ...prev,
                          { id, emoji: "", images: [createEmojiImageRow()] },
                        ]);
                        setActiveEmojiTriggerId(id);
                      }}
                    >
                      Add trigger
                    </Button>
                  </div>
                ) : (
                  <div className="trigger-summary-list">
                    {emojiRows.map((trigger) => {
                      const emojiOption = triggerEmojiMap.get(trigger.emoji);
                      return (
                        <div
                          key={trigger.id}
                          className="trigger-summary-card"
                          role="button"
                          tabIndex={0}
                          onClick={() => setActiveEmojiTriggerId(trigger.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setActiveEmojiTriggerId(trigger.id);
                            }
                          }}
                        >
                          <div className="trigger-summary-info">
                            <div className="trigger-summary-emoji">
                              {emojiOption?.url ? (
                                <img src={emojiOption.url} alt={emojiOption.name} />
                              ) : (
                                <span className="emoji-select-placeholder">
                                  {emojiOption?.id || trigger.emoji || "🙂"}
                                </span>
                              )}
                            </div>
                            <div>
                              <strong>
                                {emojiOption?.name ?? (trigger.emoji || "Unassigned emoji")}
                              </strong>
                              <p className="muted">
                                {trigger.images.length} image
                                {trigger.images.length === 1 ? "" : "s"}
                              </p>
                            </div>
                          </div>
                          <div className="trigger-summary-actions">
                            <Button
                              variant="ghost"
                              onClick={(event) => {
                                event.stopPropagation();
                                setActiveEmojiTriggerId(trigger.id);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={(event) => {
                                event.stopPropagation();
                                removeEmojiRow(trigger.id);
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="muted">
                  Uploads: {countEmojiUploads(emojiRows)}/{maxEmojiUploads}. Links are unlimited.
                </p>
              </div>
            </section>
          )
        ) : null}

        {activeSection === "role-reactions" ? (
          roleReactionsLoading ? (
            <LoadingScreen label="Loading role reactions..." />
          ) : (
            <section className="content-section">
              <div className="section-header">
                <div>
                  <p className="eyebrow">Role Reactions</p>
                  <h1>Let members self-assign roles</h1>
                  <p className="muted">
                    Create multiple messages with custom emoji → role pairs.
                  </p>
                </div>
                <div className="section-actions">
                  <Button onClick={handleRoleReactionsSave} disabled={roleReactionsSaving}>
                    {roleReactionsSaving ? "Saving..." : "Save role reactions"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={addRoleReactionMessage}
                  >
                    Add message
                  </Button>
                </div>
              </div>
              <div className="card">
                <div className="switch-row">
                  <label className="switch-control">
                    <input
                      type="checkbox"
                      checked={roleReactions.enabled}
                      onChange={() => {
                        if (roleReactions.enabled) {
                          closeRoleReactionModal();
                        }
                        setRoleReactions((prev) => ({
                          ...prev,
                          enabled: !prev.enabled,
                        }));
                      }}
                      aria-label="Enable role reactions"
                    />
                  </label>
                  <span className="switch-label">Enable role reactions</span>
                </div>
                {roleReactions.enabled ? (
                  roleReactionMessages.length === 0 ? (
                    <div className="empty-state">
                      <p className="muted">Create your first reaction message.</p>
                      <Button variant="outline" onClick={addRoleReactionMessage}>
                        Add message
                      </Button>
                    </div>
                  ) : (
                    <div className="reaction-summary-list">
                      {roleReactionMessages.map((message, messageIndex) => {
                        const channelLabel =
                          channelNameById.get(message.channelId) ?? "Pick a channel";
                        const previewSource =
                          message.type === "text"
                            ? message.message
                            : message.embed?.title ?? message.message;
                        const trimmed = previewSource?.trim() ?? "";
                        const previewText =
                          trimmed.length > 80 ? `${trimmed.slice(0, 80)}...` : trimmed || "No message text yet.";
                        const emojiPairs = message.pairs.filter((pair) => pair.emoji);
                        const emojiPreview = emojiPairs.slice(0, 6);

                        return (
                          <div
                            key={message.key}
                            className="reaction-summary-card"
                            role="button"
                            tabIndex={0}
                            onClick={() => setActiveRoleReactionKey(message.key)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setActiveRoleReactionKey(message.key);
                              }
                            }}
                          >
                            <div className="reaction-summary-main">
                              <div className="reaction-summary-header">
                                <div>
                                  <strong>Reaction message {messageIndex + 1}</strong>
                                  <p className="muted">{channelLabel}</p>
                                </div>
                                <span className="pill neutral">
                                  {message.type === "embed" ? "Embed" : "Text"}
                                </span>
                              </div>
                              <p className="muted">{previewText}</p>
                              <div className="reaction-summary-emojis">
                                {emojiPreview.length === 0 ? (
                                  <span className="muted">No reactions yet.</span>
                                ) : (
                                  <>
                                    {emojiPreview.map((pair, pairIndex) => {
                                      const emojiOption = roleEmojiMap.get(pair.emoji);
                                      return (
                                        <span
                                          key={`${message.key}-${pairIndex}`}
                                          className="emoji-chip"
                                        >
                                          {emojiOption?.url ? (
                                            <img src={emojiOption.url} alt={emojiOption.name} />
                                          ) : (
                                            <span className="emoji-glyph">
                                              {emojiOption?.id ?? pair.emoji}
                                            </span>
                                          )}
                                        </span>
                                      );
                                    })}
                                    {emojiPairs.length > emojiPreview.length ? (
                                      <span className="pill neutral">
                                        +{emojiPairs.length - emojiPreview.length}
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="reaction-summary-actions">
                              <Button
                                variant="ghost"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setActiveRoleReactionKey(message.key);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  removeRoleReactionMessage(message.key);
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <p className="muted">Role reactions are disabled.</p>
                )}
              </div>
            </section>
          )
        ) : null}

        {activeSection === "admin" ? (
          <section className="content-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">Admin</p>
                <h1>System monitoring</h1>
                <p className="muted">
                  Review logs and manage who can access this admin console.
                </p>
              </div>
            </div>
            <div className="tab-row admin-tabs">
              <button
                type="button"
                className={`tab-button ${adminTab === "conqbot" ? "active" : ""}`}
                onClick={() => setAdminTab("conqbot")}
              >
                ConqBot logs
              </button>
              <button
                type="button"
                className={`tab-button ${adminTab === "botpanel" ? "active" : ""}`}
                onClick={() => setAdminTab("botpanel")}
              >
                BotPanel logs
              </button>
              <button
                type="button"
                className={`tab-button ${adminTab === "access" ? "active" : ""}`}
                onClick={() => setAdminTab("access")}
              >
                Admin access
              </button>
            </div>

            {adminTab === "conqbot" ? (
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3>ConqBot logs</h3>
                    <p className="muted">Backend logs captured from the bot runtime.</p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => loadAdminLogs("conqbot", true)}
                    disabled={adminLogsLoading.conqbot}
                  >
                    {adminLogsLoading.conqbot ? "Refreshing..." : "Refresh"}
                  </Button>
                </div>
                <div className="form-grid split">
                  <label>
                    Level
                    <select
                      value={adminLogLevels.conqbot}
                      onChange={(event) => handleAdminLevelChange("conqbot", event.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="INFO">Info</option>
                      <option value="WARNING">Warning</option>
                      <option value="ERROR">Error</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </label>
                </div>
                <div className="log-filters">
                  {conqbotLogCategories.map((category) => (
                    <button
                      key={category.key}
                      type="button"
                      className={`log-filter log-filter--${category.tone} ${
                        adminLogCategory === category.key ? "active" : ""
                      }`}
                      onClick={() => setAdminLogCategory(category.key)}
                    >
                      <span className="log-filter-icon">{category.icon}</span>
                      <span>{category.label}</span>
                      <span className="log-filter-count">{conqbotLogCounts[category.key]}</span>
                    </button>
                  ))}
                </div>
                <div className="log-list">
                  {filteredConqbotLogs.length === 0 ? (
                    <p className="muted">No logs in this category.</p>
                  ) : (
                    filteredConqbotLogs.map((logItem) => (
                      <div key={logItem.id ?? logItem.timestamp} className="log-entry">
                        <div className="log-meta">
                          <span className={`pill log-level log-${logItem.level.toLowerCase()}`}>
                            {logItem.level}
                          </span>
                          <span className="muted">{formatLogTime(logItem.timestamp)}</span>
                          {logItem.logger ? (
                            <span className="muted">{logItem.logger}</span>
                          ) : null}
                        </div>
                        <p>{logItem.message}</p>
                        {logItem.context && Object.keys(logItem.context).length ? (
                          <pre className="log-context">
                            {JSON.stringify(logItem.context, null, 2)}
                          </pre>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => loadAdminLogs("conqbot", false)}
                  disabled={adminLogsLoading.conqbot}
                >
                  Load more
                </Button>
              </div>
            ) : null}

            {adminTab === "botpanel" ? (
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3>BotPanel logs</h3>
                    <p className="muted">Frontend errors reported by the dashboard.</p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => loadAdminLogs("botpanel", true)}
                    disabled={adminLogsLoading.botpanel}
                  >
                    {adminLogsLoading.botpanel ? "Refreshing..." : "Refresh"}
                  </Button>
                </div>
                <div className="form-grid split">
                  <label>
                    Level
                    <select
                      value={adminLogLevels.botpanel}
                      onChange={(event) => handleAdminLevelChange("botpanel", event.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="INFO">Info</option>
                      <option value="WARNING">Warning</option>
                      <option value="ERROR">Error</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </label>
                </div>
                <div className="log-list">
                  {adminLogs.botpanel.length === 0 ? (
                    <p className="muted">No logs yet.</p>
                  ) : (
                    adminLogs.botpanel.map((logItem) => (
                      <div key={logItem.id ?? logItem.timestamp} className="log-entry">
                        <div className="log-meta">
                          <span className={`pill log-level log-${logItem.level.toLowerCase()}`}>
                            {logItem.level}
                          </span>
                          <span className="muted">{formatLogTime(logItem.timestamp)}</span>
                          {logItem.userId ? (
                            <span className="muted">User {logItem.userId}</span>
                          ) : null}
                        </div>
                        <p>{logItem.message}</p>
                        {logItem.context && Object.keys(logItem.context).length ? (
                          <pre className="log-context">
                            {JSON.stringify(logItem.context, null, 2)}
                          </pre>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => loadAdminLogs("botpanel", false)}
                  disabled={adminLogsLoading.botpanel}
                >
                  Load more
                </Button>
              </div>
            ) : null}

            {adminTab === "access" ? (
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3>Admin access</h3>
                    <p className="muted">Only listed user IDs can open this admin tab.</p>
                  </div>
                </div>
                <div className="form-grid">
                  <label>
                    Add admin user ID
                    <input
                      value={adminUserInput}
                      onChange={(event) => setAdminUserInput(event.target.value)}
                      placeholder="Discord user ID"
                    />
                  </label>
                  <Button
                    variant="outline"
                    onClick={handleAddAdminUser}
                    disabled={adminUsersLoading}
                  >
                    {adminUsersLoading ? "Saving..." : "Add admin"}
                  </Button>
                </div>
                <div className="admin-user-list">
                  {adminUsersLoading ? (
                    <p className="muted">Loading admin users...</p>
                  ) : adminUsers.length === 0 ? (
                    <p className="muted">No extra admins added yet.</p>
                  ) : (
                    adminUsers.map((userId) => (
                      <div key={userId} className="admin-user-row">
                        <span>{userId}</span>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => handleRemoveAdminUser(userId)}
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <p className="muted">
                  IDs from `ADMIN_PANEL_USER_IDS` are always allowed and may not disappear after removal.
                </p>
              </div>
            ) : null}
          </section>
        ) : null}

        {activeSection === "autorole" ? (
          autoroleLoading ? (
            <LoadingScreen label="Loading auto role settings..." />
          ) : (
            <section className="content-section">
              <div className="section-header">
                <div>
                  <p className="eyebrow">Auto Role</p>
                  <h1>Assign roles on join</h1>
                  <p className="muted">Automatically grant a role when someone joins the server.</p>
                </div>
                <Button onClick={handleAutoroleSave} disabled={autoroleSaving}>
                  {autoroleSaving ? "Saving..." : "Save auto role"}
                </Button>
              </div>
              <div className="card">
                <div className="switch-row">
                  <label className="switch-control">
                    <input
                      type="checkbox"
                      checked={autoroleSettings.enabled}
                      onChange={() =>
                        setAutoroleSettings((prev) => ({
                          ...prev,
                          enabled: !prev.enabled,
                        }))
                      }
                      aria-label="Enable auto role"
                    />
                  </label>
                  <span className="switch-label">Enable auto role</span>
                </div>
                {autoroleSettings.enabled ? (
                  <div className="form-grid">
                    <label>
                      Role to assign
                      <SearchableSelect
                        value={autoroleSettings.roleId}
                        onChange={(value) =>
                          setAutoroleSettings((prev) => ({
                            ...prev,
                            roleId: value,
                          }))
                        }
                        options={roles.map((role) => ({
                          value: role.id,
                          label: stripRolePrefix(role.name),
                        }))}
                        placeholder="Search roles..."
                        emptyLabel="Select role"
                      />
                    </label>
                    <p className="muted">The bot must have permission to manage roles.</p>
                  </div>
                ) : (
                  <p className="muted">Auto role is disabled.</p>
                )}
              </div>
            </section>
          )
        ) : null}

        {activeSection === "other" ? (
          warthogLoading ? (
            <LoadingScreen label="Loading Warthog settings..." />
          ) : (
            <section className="content-section">
              <div className="section-header">
                <div>
                  <p className="eyebrow">Other</p>
                  <h1>Quick toggles</h1>
                  <p className="muted">Small switches that change the bot behavior instantly.</p>
                </div>
                <Button variant="outline" onClick={handleWarthogSave} disabled={warthogSaving}>
                  {warthogSaving ? "Saving..." : "Save Warthog"}
                </Button>
              </div>
              <div className="card">
                <div className="switch-row">
                  <label className="switch-control">
                    <input
                      type="checkbox"
                      checked={warthogSettings.enabled}
                      onChange={handleWarthogToggle}
                      aria-label="Enable Warthog mode"
                    />
                  </label>
                  <span className="switch-label">Enable Warthog mode</span>
                </div>
                {warthogSettings.enabled ? (
                  <div className="form-grid">
                    <div className="switch-row">
                      <label className="switch-control">
                        <input
                          type="checkbox"
                          checked={warthogSettings.roleLock}
                          onChange={() =>
                            setWarthogSettings((prev) => ({
                              ...prev,
                              roleLock: !prev.roleLock,
                            }))
                          }
                          aria-label="Restrict Warthog to specific roles"
                        />
                      </label>
                      <span className="switch-label">Restrict usage to selected roles</span>
                    </div>

                    {warthogSettings.roleLock ? (
                      <>
                        <label>
                          Add allowed role
                          <SearchableSelect
                            value={warthogRolePick}
                            onChange={handleWarthogRoleSelect}
                            options={warthogRoleOptions}
                            placeholder="Search roles..."
                            emptyLabel="Select role"
                          />
                        </label>
                        {warthogSettings.allowedRoles.length === 0 ? (
                          <p className="muted">No allowed roles yet.</p>
                        ) : (
                          <div className="role-chip-list">
                            {warthogSettings.allowedRoles.map((roleId) => (
                              <div key={roleId} className="role-chip">
                                <span>{roleNameById.get(roleId) ?? roleId}</span>
                                <button
                                  type="button"
                                  className="btn btn-ghost"
                                  onClick={() => removeWarthogRole(roleId)}
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="muted">Anyone with access to the command can use Warthog.</p>
                    )}

                    <div className="form-grid">
                      <label>
                        Whitelist user IDs
                        <input
                          value={warthogWhitelistInput}
                          onChange={(event) => setWarthogWhitelistInput(event.target.value)}
                          placeholder="e.g. 1234567890, 9876543210"
                        />
                      </label>
                      <Button variant="outline" onClick={addWarthogWhitelist}>
                        Add to whitelist
                      </Button>
                    </div>

                    <div className="admin-user-list">
                      {warthogSettings.whitelist.length === 0 ? (
                        <p className="muted">No protected users yet.</p>
                      ) : (
                        warthogSettings.whitelist.map((userId) => (
                          <div key={userId} className="admin-user-row">
                            <span>{userId}</span>
                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={() => removeWarthogWhitelist(userId)}
                            >
                              Remove
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <label>
                      Bounce message
                      <input
                        value={warthogSettings.bounceMessage}
                        onChange={(event) =>
                          setWarthogSettings((prev) => ({
                            ...prev,
                            bounceMessage: event.target.value,
                          }))
                        }
                        placeholder="Warthog bounced off this user."
                      />
                    </label>
                    <label>
                      Bounce GIF URL
                      <input
                        value={warthogSettings.bounceGif}
                        onChange={(event) =>
                          setWarthogSettings((prev) => ({
                            ...prev,
                            bounceGif: event.target.value,
                          }))
                        }
                        placeholder="https://..."
                      />
                    </label>
                  </div>
                ) : (
                  <p className="muted">Warthog is disabled on this server.</p>
                )}
              </div>
            </section>
          )
        ) : null}

        {activeEmojiTrigger ? (
          <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            onClick={closeEmojiModal}
          >
            <div className="modal-panel modal-panel--wide" onClick={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <p className="eyebrow">Emoji trigger</p>
                  <h2>
                    {triggerEmojiMap.get(activeEmojiTrigger.emoji)?.name ??
                      (activeEmojiTrigger.emoji || "New trigger")}
                  </h2>
                  <p className="muted">
                    Choose an emoji and attach multiple images or links.
                  </p>
                </div>
                <div className="modal-actions">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      removeEmojiRow(activeEmojiTrigger.id);
                      closeEmojiModal();
                    }}
                  >
                    Delete
                  </Button>
                  <Button variant="ghost" onClick={closeEmojiModal}>
                    Close
                  </Button>
                </div>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <label>
                    Emoji
                    <div className="emoji-select">
                      <button
                        type="button"
                        className="emoji-select-trigger"
                        onClick={() => {
                          const pickerOpen = activeEmojiPickerId === activeEmojiTrigger.id;
                          setActiveRoleEmojiPickerId(null);
                          setActiveEmojiPickerId(pickerOpen ? null : activeEmojiTrigger.id);
                          setEmojiSearch("");
                        }}
                      >
                        {triggerEmojiMap.get(activeEmojiTrigger.emoji)?.url ? (
                          <img
                            src={triggerEmojiMap.get(activeEmojiTrigger.emoji)?.url}
                            alt={triggerEmojiMap.get(activeEmojiTrigger.emoji)?.name}
                          />
                        ) : activeEmojiTrigger.emoji ? (
                          <span className="emoji-glyph">{activeEmojiTrigger.emoji}</span>
                        ) : (
                          <span className="emoji-select-placeholder">🙂</span>
                        )}
                        <span>
                          {triggerEmojiMap.get(activeEmojiTrigger.emoji)?.name ??
                            (activeEmojiTrigger.emoji ? "Custom emoji" : "Select emoji")}
                        </span>
                      </button>
                      {activeEmojiPickerId === activeEmojiTrigger.id ? (
                        <div className="emoji-select-menu emoji-select-menu--wide">
                          <input
                            className="emoji-search"
                            placeholder="Search emoji..."
                            value={emojiSearch}
                            onChange={(event) => setEmojiSearch(event.target.value)}
                          />
                          <div className="emoji-group">
                            <span className="emoji-group-label">Server emojis</span>
                            <div className="emoji-grid">
                              {filteredTriggerCustomEmojis.length === 0 ? (
                                <span className="muted">No matches.</span>
                              ) : (
                                filteredTriggerCustomEmojis.map((option) => (
                                  <button
                                    key={option.id}
                                    type="button"
                                    className="emoji-option"
                                    onClick={() => {
                                      updateEmojiRow(activeEmojiTrigger.id, (row) => ({
                                        ...row,
                                        emoji: option.id,
                                      }));
                                      setActiveEmojiPickerId(null);
                                      setEmojiSearch("");
                                    }}
                                  >
                                    {option.url ? (
                                      <img src={option.url} alt={option.name} />
                                    ) : (
                                      <span className="emoji-glyph">{option.id}</span>
                                    )}
                                    <span>{option.name}</span>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                          <div className="emoji-group">
                            <span className="emoji-group-label">Default emojis</span>
                            <div className="emoji-grid">
                              {filteredTriggerDefaultEmojis.map((option) => (
                                <button
                                  key={option.id}
                                  type="button"
                                  className="emoji-option"
                                  onClick={() => {
                                    updateEmojiRow(activeEmojiTrigger.id, (row) => ({
                                      ...row,
                                      emoji: option.id,
                                    }));
                                    setActiveEmojiPickerId(null);
                                    setEmojiSearch("");
                                  }}
                                >
                                  <span className="emoji-glyph">{option.id}</span>
                                  <span>{option.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </label>
                </div>

                <div className="trigger-images">
                  {activeEmojiTrigger.images.map((image) => (
                    <div key={image.id} className="trigger-image-row">
                      <label>
                        Image link
                        <input
                          value={image.imageUrl}
                          onChange={(event) =>
                            updateEmojiImage(activeEmojiTrigger.id, image.id, (prev) => ({
                              ...prev,
                              imageUrl: event.target.value,
                              previewUrl: event.target.value,
                              uploadFile: null,
                              uploading: false,
                            }))
                          }
                          placeholder="https://..."
                        />
                      </label>
                      <div className="trigger-upload">
                        <span className="muted">Upload image</span>
                        <label className="file-picker">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) {
                                void handleEmojiUpload(activeEmojiTrigger.id, image.id, file);
                              }
                              event.target.value = "";
                            }}
                          />
                          <span className="btn btn-ghost">
                            {image.uploading ? "Uploading..." : "Upload"}
                          </span>
                        </label>
                        <span className="muted">Max 5MB</span>
                      </div>
                      <div className="trigger-preview">
                        {image.previewUrl ? (
                          <img src={image.previewUrl} alt="Preview" />
                        ) : (
                          <span className="muted">No preview</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => removeEmojiImage(activeEmojiTrigger.id, image.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="section-actions">
                  <Button variant="ghost" onClick={() => addEmojiImage(activeEmojiTrigger.id)}>
                    Add image
                  </Button>
                  <span className="muted">
                    Uploads: {countEmojiUploads(emojiRows)}/{maxEmojiUploads} · Links are unlimited.
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activeRoleReactionMessage ? (
          <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            onClick={closeRoleReactionModal}
          >
            <div className="modal-panel modal-panel--wide" onClick={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <p className="eyebrow">Role reaction</p>
                  <h2>
                    {channelNameById.get(activeRoleReactionMessage.channelId) ??
                      "Reaction message"}
                  </h2>
                  <p className="muted">
                    Configure the message and the emoji → role pairs.
                  </p>
                </div>
                <div className="modal-actions">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      removeRoleReactionMessage(activeRoleReactionMessage.key);
                      closeRoleReactionModal();
                    }}
                  >
                    Delete
                  </Button>
                  <Button variant="ghost" onClick={closeRoleReactionModal}>
                    Close
                  </Button>
                </div>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-grid split">
                    <label>
                      Channel
                      <SearchableSelect
                        value={activeRoleReactionMessage.channelId}
                        onChange={(value) =>
                          updateRoleReactionMessage(activeRoleReactionMessage.key, (prev) => ({
                            ...prev,
                            channelId: value,
                          }))
                        }
                        options={channels.map((channel) => ({
                          value: channel.id,
                          label: channel.name,
                        }))}
                        placeholder="Search channels..."
                      />
                    </label>
                    <label>
                      Message type
                      <select
                        value={activeRoleReactionMessage.type}
                        onChange={(event) =>
                          updateRoleReactionMessage(activeRoleReactionMessage.key, (prev) => ({
                            ...prev,
                            type: event.target.value === "embed" ? "embed" : "text",
                          }))
                        }
                      >
                        <option value="text">Text</option>
                        <option value="embed">Embed</option>
                      </select>
                    </label>
                  </div>
                  {activeRoleReactionMessage.type === "text" ? (
                    <label>
                      Message text
                      <textarea
                        rows={3}
                        value={activeRoleReactionMessage.message}
                        onChange={(event) =>
                          updateRoleReactionMessage(activeRoleReactionMessage.key, (prev) => ({
                            ...prev,
                            message: event.target.value,
                          }))
                        }
                      />
                      <span className="muted">Emoji are supported in the message.</span>
                    </label>
                  ) : (
                    <>
                      <label>
                        Embed title
                        <input
                          value={activeRoleReactionMessage.embed?.title ?? ""}
                          onChange={(event) =>
                            updateRoleReactionMessage(activeRoleReactionMessage.key, (prev) => ({
                              ...prev,
                              embed: {
                                ...prev.embed,
                                title: event.target.value,
                                description: prev.embed?.description ?? prev.message,
                                color: prev.embed?.color ?? "#2f7cff",
                              },
                            }))
                          }
                        />
                      </label>
                      <label>
                        Embed description
                        <textarea
                          rows={3}
                          value={activeRoleReactionMessage.embed?.description ?? activeRoleReactionMessage.message}
                          onChange={(event) =>
                            updateRoleReactionMessage(activeRoleReactionMessage.key, (prev) => ({
                              ...prev,
                              message: event.target.value,
                              embed: {
                                ...prev.embed,
                                title: prev.embed?.title ?? "Choose your role",
                                description: event.target.value,
                                color: prev.embed?.color ?? "#2f7cff",
                              },
                            }))
                          }
                        />
                      </label>
                      <label className="color-input">
                        Accent color
                        <input
                          type="color"
                          value={activeRoleReactionMessage.embed?.color ?? "#2f7cff"}
                          onChange={(event) =>
                            updateRoleReactionMessage(activeRoleReactionMessage.key, (prev) => ({
                              ...prev,
                              embed: {
                                ...prev.embed,
                                title: prev.embed?.title ?? "Choose your role",
                                description: prev.embed?.description ?? prev.message,
                                color: event.target.value,
                              },
                            }))
                          }
                        />
                        <span className="color-value">
                          {activeRoleReactionMessage.embed?.color ?? "#2f7cff"}
                        </span>
                      </label>
                    </>
                  )}
                </div>

                <div className="reaction-list">
                  {activeRoleReactionMessage.pairs.length === 0 ? (
                    <p className="muted">Add at least one emoji/role pair.</p>
                  ) : (
                    activeRoleReactionMessage.pairs.map((pair, pairIndex) => {
                      const emojiOption = roleEmojiMap.get(pair.emoji);
                      const pickerId = `${activeRoleReactionMessage.key}-${pairIndex}`;
                      const pickerOpen = activeRoleEmojiPickerId === pickerId;
                      const pickerLabel =
                        emojiOption?.name ?? (pair.emoji ? "Custom emoji" : "Select emoji");
                      return (
                        <div key={pickerId} className="reaction-row">
                          <div className="emoji-select">
                            <button
                              type="button"
                              className="emoji-select-trigger"
                              onClick={() => {
                                setActiveEmojiPickerId(null);
                                setActiveRoleEmojiPickerId(pickerOpen ? null : pickerId);
                                setRoleEmojiSearch("");
                              }}
                            >
                              {emojiOption?.url ? (
                                <img src={emojiOption.url} alt={emojiOption.name} />
                              ) : pair.emoji ? (
                                <span className="emoji-glyph">{pair.emoji}</span>
                              ) : (
                                <span className="emoji-select-placeholder">🙂</span>
                              )}
                              <span>{pickerLabel}</span>
                            </button>
                            {pickerOpen ? (
                              <div className="emoji-select-menu emoji-select-menu--wide">
                                <input
                                  className="emoji-search"
                                  placeholder="Search emoji..."
                                  value={roleEmojiSearch}
                                  onChange={(event) => setRoleEmojiSearch(event.target.value)}
                                />
                                <div className="emoji-group">
                                  <span className="emoji-group-label">Server emojis</span>
                                  <div className="emoji-grid">
                                    {filteredRoleCustomEmojis.length === 0 ? (
                                      <span className="muted">No matches.</span>
                                    ) : (
                                      filteredRoleCustomEmojis.map((option) => (
                                        <button
                                          key={option.id}
                                          type="button"
                                          className="emoji-option"
                                          onClick={() => {
                                            updateRoleReactionPair(
                                              activeRoleReactionMessage.key,
                                              pairIndex,
                                              (prev) => ({ ...prev, emoji: option.id })
                                            );
                                            setActiveRoleEmojiPickerId(null);
                                            setRoleEmojiSearch("");
                                          }}
                                        >
                                          {option.url ? (
                                            <img src={option.url} alt={option.name} />
                                          ) : (
                                            <span className="emoji-glyph">{option.id}</span>
                                          )}
                                          <span>{option.name}</span>
                                        </button>
                                      ))
                                    )}
                                  </div>
                                </div>
                                <div className="emoji-group">
                                  <span className="emoji-group-label">Default emojis</span>
                                  <div className="emoji-grid">
                                    {filteredRoleDefaultEmojis.map((option) => (
                                      <button
                                        key={option.id}
                                        type="button"
                                        className="emoji-option"
                                        onClick={() => {
                                          updateRoleReactionPair(
                                            activeRoleReactionMessage.key,
                                            pairIndex,
                                            (prev) => ({ ...prev, emoji: option.id })
                                          );
                                          setActiveRoleEmojiPickerId(null);
                                          setRoleEmojiSearch("");
                                        }}
                                      >
                                        <span className="emoji-glyph">{option.id}</span>
                                        <span>{option.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </div>
                          <label>
                            Role
                            <SearchableSelect
                              value={pair.roleId}
                              onChange={(value) =>
                                updateRoleReactionPair(
                                  activeRoleReactionMessage.key,
                                  pairIndex,
                                  (prev) => ({
                                    ...prev,
                                    roleId: value,
                                  })
                                )
                              }
                              options={roles.map((role) => ({
                                value: role.id,
                                label: stripRolePrefix(role.name),
                              }))}
                              placeholder="Search roles..."
                            />
                          </label>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() =>
                              removeRoleReactionPair(activeRoleReactionMessage.key, pairIndex)
                            }
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="section-actions">
                  <Button
                    variant="ghost"
                    onClick={() => addRoleReactionPair(activeRoleReactionMessage.key)}
                  >
                    Add reaction
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activePresenceLog ? (
          <div
            className="presence-modal-overlay"
            role="dialog"
            aria-modal="true"
            onClick={() => setActivePresenceLog(null)}
          >
            <div className="presence-modal" onClick={(event) => event.stopPropagation()}>
              <div className="presence-modal-header">
                <div>
                  <p className="eyebrow">Presence details</p>
                  <h2>{activePresenceLog.name || "Presence snapshot"}</h2>
                  <p className="muted">
                    {formatLogTime(activePresenceLog.createdAt ?? "")} ·{" "}
                    {activePresenceLog.source === "schedule" ? "Scheduled" : "Manual"} ·{" "}
                    {activePresenceLog.totalChannels} channels · {activePresenceLog.totalMembers} members
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setActivePresenceLog(null)}>
                  Close
                </Button>
              </div>
              <div className="presence-detail-list">
                {activePresenceLog.channels.length === 0 ? (
                  <p className="muted">No channels captured.</p>
                ) : (
                  activePresenceLog.channels.map((channel) => {
                    const members = activePresenceLog.members.filter(
                      (member) => member.channelId === channel.id
                    );
                    return (
                      <div key={channel.id} className="presence-detail-block">
                        <span className="muted">{channel.name}</span>
                        {members.length === 0 ? (
                          <span className="muted">No members</span>
                        ) : (
                          <div className="presence-member-list">
                            {members.map((member) => (
                              <span key={member.id} className="pill">
                                {member.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : null}

        {hasUnsavedChanges ? (
          <div className="save-bar" role="status" aria-live="polite">
            <div>
              <strong>Unsaved changes</strong>
              <p className="muted">Save or discard to keep your edits.</p>
            </div>
            <div className="save-bar-actions">
              <Button variant="ghost" onClick={handleUnsavedDiscard} disabled={discardBarDisabled}>
                Cancel
              </Button>
              <Button onClick={handleUnsavedSave} disabled={saveBarDisabled}>
                {saveBarLabel}
              </Button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
};
