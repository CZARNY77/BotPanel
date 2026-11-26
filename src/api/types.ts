// Types 1:1 with the API contract (PLAN_PRZEBUDOWY_PANELU.md, chapter 6).
// `Api*` types describe raw payloads; the rest are what components use.

export type ApiUser = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
  is_admin_panel?: boolean;
};

export type User = {
  id: string;
  username: string;
  avatarUrl?: string;
  isAdminPanel: boolean;
};

/** K2: one entry of GET /api/servers */
export type ApiServer = {
  id: string;
  name: string;
  icon_url: string | null;
  owner: boolean;
  permissions: string | number;
  bot_present: boolean;
  member_count: number | null;
};

export type Server = {
  id: string;
  name: string;
  iconUrl: string | null;
  /** `panel`: opened by a panel admin, outside the user's own list. */
  role: "owner" | "admin" | "manager" | "panel";
  botPresent: boolean;
  memberCount: number | null;
};

/** K18: GET /api/health (raw, no envelope) */
export type HealthPayload = {
  status: "ok" | "not_ready";
  ready: boolean;
  initialized: boolean;
  guilds: number;
};

export type BotState = "online" | "starting" | "offline" | "unknown";

export type ChannelOption = { id: string; name: string };
export type RoleOption = { id: string; name: string };

export type ApiMetadata = {
  guild_id: string;
  channels: ChannelOption[];
  voice_channels: ChannelOption[];
  roles: RoleOption[];
};

export type ServerMetadata = {
  channels: ChannelOption[];
  voiceChannels: ChannelOption[];
  roles: RoleOption[];
};

export type EmojiOption = { id: string; name: string; url?: string };

/** K3/K4 */
export type ServerSettings = { timezone: string };

export type GreetingSettings = {
  enabled: boolean;
  channelId: string;
  type: "embed" | "text";
  text: string;
  embed: {
    title: string;
    description: string;
    color: string;
    showAvatar: boolean;
  };
};

export type AutoRoleSettings = { enabled: boolean; roleId: string };

/** K5 EventItem */
export type EventItem = {
  id: string;
  title: string;
  description: string;
  date: string; // dd.mm.yyyy
  time: string; // HH:MM
  timezone: string;
  intervalDays: number;
  repeating: boolean;
  channelId: string;
  roleId: string;
  durationMinutes: number;
  messageId: string;
  active: boolean;
  nextEventId: string | null;
  signups: { yes: number; no: number; maybe: number };
};

/** K6/K7 body */
export type EventInput = {
  title: string;
  description: string;
  date: string;
  time: string;
  intervalDays: number;
  channelId: string;
  roleId: string;
  durationMinutes: number;
  timezone?: string;
};

export type EventStatusFilter = "active" | "all";
export type EventPingMode = "unchecked" | "tentative" | "declined";

/** K8 */
export type SignupStatus = "Yes" | "No" | "Maybe";
export type EventSignups = {
  eventId: string;
  signups: { userId: string; name: string; status: SignupStatus }[];
  unchecked: number | null;
};

export type EmojiTrigger = { emoji: string; imageUrls: string[] };
export type EmojiTriggerSettings = { triggers: EmojiTrigger[]; requireExact: boolean };

export type VoicePresenceSchedule = {
  id: string;
  name: string;
  enabled: boolean;
  dayOfWeek: number; // 0 = Monday
  time: string;
  channelIds: string[];
  lastRun: string | null;
};

export type VoicePresenceSettings = {
  manualChannelIds: string[];
  manualName: string;
  schedules: VoicePresenceSchedule[];
};

export type VoicePresenceMember = {
  id: string;
  name: string;
  channelId: string;
  channelName: string;
};

export type VoicePresenceLog = {
  id: string;
  createdAt: string | null;
  source: "manual" | "schedule";
  scheduleId?: string | null;
  name: string | null;
  channels: ChannelOption[];
  members: VoicePresenceMember[];
  totalMembers: number;
  totalChannels: number;
};

export type RoleReactionPair = { emoji: string; roleId: string };

export type RoleReactionMessage = {
  key: string;
  channelId: string;
  type: "text" | "embed";
  message: string;
  embed: { title: string; description: string; color: string };
  pairs: RoleReactionPair[];
  messageId: string;
};

export type RoleReactionSettings = { enabled: boolean; messages: RoleReactionMessage[] };

export type WarthogSettings = {
  enabled: boolean;
  roleLock: boolean;
  allowedRoles: string[];
  whitelist: string[];
  bounceMessage: string;
  bounceGif: string;
};

/** K15 */
export type BanDmSettings = { enabled: boolean; message: string; unbanMessage: string };

/** K13/K14 */
export type AntiSpamAction = "auto" | "timeout" | "delete";
export type AntiSpamSettings = {
  enabled: boolean;
  action: AntiSpamAction;
  exemptRoleIds: string[];
  logChannelId: string;
};

/** K11/K12 */
export type TimeoutDmSettings = { enabled: boolean; message: string };

export type LogSource = "conqbot" | "botpanel";

export type AdminLogEntry = {
  id: string | null;
  source: LogSource;
  level: string;
  logger: string | null;
  message: string;
  timestamp?: string;
  context: Record<string, unknown>;
  userId: string | null;
};

/** K16 */
export type UploadResult = { upload_id: string; path: string; url: string };

/** GET /api/admin/servers: every server the bot is on (panel admins only, 403 otherwise). */
export type ApiAdminServer = {
  id: string;
  name: string;
  icon_url: string | null;
  member_count: number | null;
  owner_id: string | null;
  bot_present: boolean;
};

export type AdminServer = {
  id: string;
  name: string;
  iconUrl: string | null;
  memberCount: number | null;
  ownerId: string | null;
};
