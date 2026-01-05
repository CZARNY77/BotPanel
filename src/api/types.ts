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
  repeating: boolean;
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
  repeating: boolean;
  channelId: string;
  roleId: string;
  durationMinutes: number;
};

export type EmojiTrigger = {
  emoji: string;
  imageUrl: string;
};

export type EmojiOption = {
  id: string;
  name: string;
  url: string;
};

export type EmojiTriggerSettings = {
  triggers: EmojiTrigger[];
  requireExact: boolean;
};

export type RoleReactionPair = {
  emoji: string;
  roleId: string;
};

export type RoleReactionSettings = {
  enabled: boolean;
  channelId: string;
  message: string;
  pairs: RoleReactionPair[];
  messageId?: string;
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
