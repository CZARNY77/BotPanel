export type User = {
  id: string;
  username: string;
  avatarUrl?: string;
  isAdminPanel?: boolean;
};

export type Server = {
  id: string;
  name: string;
  iconUrl?: string;
  memberCount?: number;
  hasBot?: boolean;
  role?: "owner" | "admin";
};

export type ServerSettings = {
  prefix: string;
  language: string;
  timezone: string;
  welcomeMessage: string;
  logChannelId: string;
  autoRoleId: string;
  features: {
    autoModeration: boolean;
    eventReminders: boolean;
    voicePresence: boolean;
  };
};

export type ChannelOption = {
  id: string;
  name: string;
};

export type RoleOption = {
  id: string;
  name: string;
};

export type ServerMetadata = {
  channels: ChannelOption[];
  voiceChannels: ChannelOption[];
  roles: RoleOption[];
};

export type WelcomeSettings = {
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

export type FarewellSettings = WelcomeSettings;

export type AutoRoleSettings = {
  enabled: boolean;
  roleId: string;
};

export type EventItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  intervalDays: number;
  channelId: string;
  roleId: string;
  durationMinutes: number;
  messageId?: string;
};

export type EventInput = {
  title: string;
  description: string;
  date: string;
  time: string;
  intervalDays: number;
  channelId: string;
  roleId: string;
  durationMinutes: number;
};

export type EventPingMode = "unchecked" | "tentative" | "declined";

export type EmojiTrigger = {
  emoji: string;
  imageUrls: string[];
};

export type EmojiOption = {
  id: string;
  name: string;
  url?: string;
};

export type EmojiTriggerSettings = {
  triggers: EmojiTrigger[];
  requireExact: boolean;
};

export type VoicePresenceSchedule = {
  id: string;
  name?: string;
  enabled: boolean;
  dayOfWeek: number;
  time: string;
  channelIds: string[];
  lastRun?: string | null;
};

export type VoicePresenceSettings = {
  manualChannelIds: string[];
  manualName?: string;
  schedules: VoicePresenceSchedule[];
};

export type VoicePresenceMember = {
  id: string;
  name: string;
  channelId: string;
  channelName: string;
};

export type VoicePresenceLog = {
  id?: string | null;
  createdAt?: string | null;
  source: "manual" | "schedule";
  scheduleId?: string | null;
  name?: string | null;
  channels: ChannelOption[];
  members: VoicePresenceMember[];
  totalMembers: number;
  totalChannels: number;
};

export type RoleReactionPair = {
  emoji: string;
  roleId: string;
};

export type RoleReactionMessage = {
  key?: string;
  channelId: string;
  type: "text" | "embed";
  message: string;
  embed?: {
    title: string;
    description: string;
    color: string;
  };
  pairs: RoleReactionPair[];
  messageId?: string;
};

export type RoleReactionSettings = {
  enabled: boolean;
  messages: RoleReactionMessage[];
};

export type AdminLogEntry = {
  id?: string | null;
  source: "conqbot" | "botpanel";
  level: string;
  logger?: string;
  message: string;
  timestamp?: string;
  context?: Record<string, unknown>;
  userId?: string | null;
};

export type WarthogSettings = {
  enabled: boolean;
  roleLock: boolean;
  allowedRoles: string[];
  whitelist: string[];
  bounceMessage: string;
  bounceGif: string;
};

export type BanDmSettings = {
  enabled: boolean;
  message: string;
};

export type AntiSpamSettings = {
  enabled: boolean;
};
