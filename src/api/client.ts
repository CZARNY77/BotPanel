import type {
  ChannelOption,
  EmojiOption,
  EmojiTrigger,
  EmojiTriggerSettings,
  EventInput,
  EventItem,
  EventPingMode,
  FarewellSettings,
  AutoRoleSettings,
  RoleReactionMessage,
  RoleReactionSettings,
  AdminLogEntry,
  Server,
  ServerMetadata,
  ServerSettings,
  WarthogSettings,
  User,
  WelcomeSettings,
  VoicePresenceLog,
  VoicePresenceSettings,
} from "./types";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(
  /\/$/,
  ""
) ?? "";
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

const defaultSettings: ServerSettings = {
  prefix: "!",
  language: "en-US",
  timezone: "Europe/Warsaw",
  welcomeMessage: "Welcome aboard! Let us know if you need help.",
  logChannelId: "",
  autoRoleId: "",
  features: {
    autoModeration: true,
    eventReminders: true,
    voicePresence: false,
  },
};

const defaultWelcome: WelcomeSettings = {
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

const defaultFarewell: FarewellSettings = {
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

const defaultAutorole: AutoRoleSettings = {
  enabled: false,
  roleId: "",
};

const defaultRoleReactionMessage: RoleReactionMessage = {
  key: "",
  channelId: "",
  type: "text",
  message: "React below to receive a role.",
  embed: {
    title: "Choose your role",
    description: "React below to receive a role.",
    color: "#2f7cff",
  },
  pairs: [],
  messageId: "",
};

const defaultRoleReactions: RoleReactionSettings = {
  enabled: false,
  messages: [],
};

const defaultVoicePresenceSettings: VoicePresenceSettings = {
  manualChannelIds: [],
  manualName: "",
  schedules: [],
};

const defaultWarthogSettings: WarthogSettings = {
  enabled: true,
  roleLock: false,
  allowedRoles: [],
  whitelist: [],
  bounceMessage: "Warthog bounced off. This user is protected.",
  bounceGif: "",
};

const defaultMetadata: ServerMetadata = {
  channels: [],
  voiceChannels: [],
  roles: [],
};

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const mockUser: User = {
  id: "1122334455",
  username: "Czarny",
  avatarUrl: "https://cdn.discordapp.com/embed/avatars/0.png",
};

const mockServers: Server[] = [
  {
    id: "9001",
    name: "Conq Warriors",
    iconUrl: "https://cdn.discordapp.com/embed/avatars/1.png",
    memberCount: 148,
    hasBot: true,
    role: "owner",
  },
  {
    id: "9002",
    name: "Regiment West",
    iconUrl: "https://cdn.discordapp.com/embed/avatars/2.png",
    memberCount: 72,
    hasBot: true,
    role: "admin",
  },
  {
    id: "9003",
    name: "Frontline HQ",
    iconUrl: "https://cdn.discordapp.com/embed/avatars/3.png",
    memberCount: 210,
    hasBot: false,
    role: "admin",
  },
];

const mockMetadata: Record<string, ServerMetadata> = {
  "9001": {
    channels: [
      { id: "111", name: "#welcome" },
      { id: "222", name: "#announcements" },
      { id: "333", name: "#events" },
    ],
    voiceChannels: [
      { id: "888", name: "War Room" },
      { id: "889", name: "Strategy" },
    ],
    roles: [
      { id: "555", name: "@Raid" },
      { id: "666", name: "@Guild" },
      { id: "777", name: "@Everyone" },
    ],
  },
};

let mockSettings: Record<string, ServerSettings> = {
  "9001": {
    ...defaultSettings,
    prefix: "?",
    welcomeMessage: "Welcome to Conq Warriors!",
    features: {
      autoModeration: true,
      eventReminders: true,
      voicePresence: true,
    },
  },
  "9002": {
    ...defaultSettings,
    prefix: "!",
    welcomeMessage: "Join the fights right on schedule.",
  },
};

let mockWelcome: Record<string, WelcomeSettings> = {
  "9001": {
    ...defaultWelcome,
    channelId: "111",
  },
};

let mockFarewell: Record<string, FarewellSettings> = {
  "9001": {
    ...defaultFarewell,
    channelId: "111",
  },
};

let mockEvents: Record<string, EventItem[]> = {
  "9001": [
    {
      id: "evt_1",
      title: "Weekly siege",
      description: "Gather at the north gate.",
      date: "18.10.2025",
      time: "19:00",
      intervalDays: 7,
      channelId: "333",
      roleId: "555",
      durationMinutes: 90,
    },
  ],
};

let mockEmojiTriggers: Record<string, EmojiTriggerSettings> = {
  "9001": {
    requireExact: false,
    triggers: [
      { emoji: ":fire:", imageUrls: ["https://placehold.co/320x180"] },
      { emoji: ":sword:", imageUrls: ["https://placehold.co/320x180"] },
    ],
  },
};

let mockRoleReactions: Record<string, RoleReactionSettings> = {
  "9001": {
    enabled: true,
    messages: [
      {
        ...defaultRoleReactionMessage,
        key: "mock-1",
        channelId: "333",
        pairs: [
          { emoji: "<:flame:123456789>", roleId: "555" },
          { emoji: "<:shield:987654321>", roleId: "666" },
        ],
      },
    ],
  },
};

let mockVoicePresenceSettings: Record<string, VoicePresenceSettings> = {
  "9001": {
    manualChannelIds: ["888"],
    manualName: "War room check",
    schedules: [
      {
        id: "sched-1",
        name: "Wednesday raid",
        enabled: true,
        dayOfWeek: 2,
        time: "20:00",
        channelIds: ["888", "889"],
        lastRun: null,
      },
    ],
  },
};

let mockVoicePresenceLogs: Record<string, VoicePresenceLog[]> = {
  "9001": [
    {
      id: "log-1",
      createdAt: new Date().toISOString(),
      source: "manual",
      name: "War room check",
      channels: [
        { id: "888", name: "War Room" },
        { id: "889", name: "Strategy" },
      ],
      members: [
        { id: "101", name: "Czarny", channelId: "888", channelName: "War Room" },
        { id: "102", name: "Nim", channelId: "889", channelName: "Strategy" },
      ],
      totalMembers: 2,
      totalChannels: 2,
    },
  ],
};

let mockEmojis: Record<string, EmojiOption[]> = {
  "9001": [
    {
      id: "<:flame:123456789>",
      name: "flame",
      url: "https://cdn.discordapp.com/emojis/123456789.png",
    },
    {
      id: "<:shield:987654321>",
      name: "shield",
      url: "https://cdn.discordapp.com/emojis/987654321.png",
    },
  ],
};

let mockWarthog: Record<string, WarthogSettings> = {
  "9001": {
    ...defaultWarthogSettings,
    enabled: true,
  },
};

let mockAutorole: Record<string, AutoRoleSettings> = {
  "9001": {
    enabled: true,
    roleId: "555",
  },
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withDefaults = (settings?: ServerSettings | null): ServerSettings => ({
  ...defaultSettings,
  ...settings,
  features: {
    ...defaultSettings.features,
    ...(settings?.features ?? {}),
  },
});

const withWelcomeDefaults = (settings?: Partial<WelcomeSettings> | null): WelcomeSettings => ({
  ...defaultWelcome,
  ...settings,
  embed: {
    ...defaultWelcome.embed,
    ...(settings?.embed ?? {}),
  },
});

const withFarewellDefaults = (settings?: Partial<FarewellSettings> | null): FarewellSettings => ({
  ...defaultFarewell,
  ...settings,
  embed: {
    ...defaultFarewell.embed,
    ...(settings?.embed ?? {}),
  },
});

const withAutoroleDefaults = (settings?: Partial<AutoRoleSettings> | null): AutoRoleSettings => ({
  ...defaultAutorole,
  ...settings,
});

const withRoleReactionsDefaults = (
  settings?: Partial<RoleReactionSettings> | null
): RoleReactionSettings => ({
  ...defaultRoleReactions,
  ...settings,
  messages: Array.isArray(settings?.messages)
    ? settings?.messages ?? []
    : defaultRoleReactions.messages,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : value != null ? String(value) : fallback;

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === "number" && !Number.isNaN(value) ? value : fallback;

const asBoolean = (value: unknown, fallback = false): boolean =>
  typeof value === "boolean" ? value : fallback;

const normalizeServer = (item: Record<string, unknown>): Server | null => {
  const idValue = item.id ?? item.guild_id ?? item.guildId;
  const nameValue = item.name ?? item.guild_name ?? item.guildName;

  if (!idValue || !nameValue) {
    return null;
  }

  const iconValue = item.iconUrl ?? item.icon ?? item.icon_url ?? item.guild_icon;
  const memberCountValue = item.memberCount ?? item.member_count ?? item.members;
  const hasBotValue = item.hasBot ?? item.has_bot ?? item.bot_present ?? true;
  const ownerFlag = item.owner ?? item.is_owner;
  const permissionsValue = item.permissions ?? item.perms;
  const isAdmin =
    typeof permissionsValue === "number"
      ? (permissionsValue & 0x8) === 0x8
      : false;
  const roleValue =
    item.role ??
    (ownerFlag ? "owner" : item.is_admin ? "admin" : isAdmin ? "admin" : undefined);

  return {
    id: String(idValue),
    name: String(nameValue),
    iconUrl: typeof iconValue === "string" ? iconValue : undefined,
    memberCount:
      typeof memberCountValue === "number" ? memberCountValue : undefined,
    hasBot: typeof hasBotValue === "boolean" ? hasBotValue : true,
    role: roleValue === "owner" || roleValue === "admin" ? roleValue : undefined,
  };
};

const normalizeUser = (item: Record<string, unknown>): User | null => {
  const idValue = item.id ?? item.user_id;
  if (!idValue) {
    return null;
  }
  const usernameValue = item.username ?? item.global_name ?? item.name ?? "User";
  const avatarUrlValue = item.avatarUrl ?? item.avatar_url;
  const avatarHash = item.avatar;
  const avatarUrl =
    typeof avatarUrlValue === "string"
      ? avatarUrlValue
      : typeof avatarHash === "string"
      ? `https://cdn.discordapp.com/avatars/${idValue}/${avatarHash}.png`
      : undefined;

  return {
    id: String(idValue),
    username: String(usernameValue),
    avatarUrl,
    isAdminPanel: asBoolean(item.is_admin_panel ?? item.isAdminPanel ?? item.admin_panel),
  };
};

const normalizeOption = (item: Record<string, unknown>): ChannelOption | null => {
  const idValue = item.id ?? item.value ?? item.channel_id ?? item.role_id;
  const nameValue = item.name ?? item.label ?? item.channel_name ?? item.role_name;

  if (!idValue || !nameValue) {
    return null;
  }

  return {
    id: String(idValue),
    name: String(nameValue),
  };
};

const stripVoicePrefix = (value: string) => value.replace(/^voice\s*-\s*/i, "");

const normalizeEmojiOption = (item: Record<string, unknown>): EmojiOption | null => {
  const idValue = item.id ?? item.value ?? item.emoji_id ?? item.emoji;
  const nameValue = item.name ?? item.label ?? item.emoji_name;
  const urlValue = item.url ?? item.imageUrl ?? item.image_url;

  if (!idValue || !nameValue) {
    return null;
  }

  return {
    id: String(idValue),
    name: String(nameValue),
    url: typeof urlValue === "string" ? urlValue : "",
  };
};

const normalizeEmojiOptions = (payload: unknown): EmojiOption[] => {
  const raw =
    Array.isArray(payload)
      ? payload
      : isRecord(payload) && Array.isArray(payload.emojis)
      ? payload.emojis
      : [];

  return raw
    .filter(isRecord)
    .map(normalizeEmojiOption)
    .filter((item): item is EmojiOption => item !== null);
};

const extractUploadUrl = (payload: unknown): string | null => {
  if (typeof payload === "string") {
    const trimmed = payload.trim();
    return trimmed ? trimmed : null;
  }

  if (!isRecord(payload)) {
    return null;
  }

  const candidates = [
    payload.url,
    payload.location,
    payload.path,
    payload.file,
    payload.imageUrl,
    payload.image_url,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  if (isRecord(payload.data)) {
    return extractUploadUrl(payload.data);
  }

  return null;
};

const withApiBase = (value: string): string => {
  if (/^https?:\/\//.test(value)) {
    return value;
  }
  const path = value.startsWith("/") ? value : `/${value}`;
  return API_BASE ? `${API_BASE}${path}` : path;
};

const normalizeWelcome = (payload: unknown): WelcomeSettings => {
  const raw = isRecord(payload)
    ? (payload.welcome as Record<string, unknown> | undefined) ??
      (payload.data as Record<string, unknown> | undefined) ??
      payload
    : null;

  if (!isRecord(raw)) {
    return withWelcomeDefaults();
  }

  const embedRaw = isRecord(raw.embed) ? raw.embed : {};
  const typeValue = raw.type ?? raw.message_type;

  return withWelcomeDefaults({
    enabled: asBoolean(raw.enabled ?? raw.is_enabled ?? raw.active, defaultWelcome.enabled),
    channelId: asString(raw.channelId ?? raw.channel_id ?? raw.channel, defaultWelcome.channelId),
    type: typeValue === "text" ? "text" : "embed",
    text: asString(raw.text ?? raw.message, defaultWelcome.text),
    embed: {
      title: asString(embedRaw.title ?? embedRaw.header, defaultWelcome.embed.title),
      description: asString(embedRaw.description ?? embedRaw.body, defaultWelcome.embed.description),
      color: asString(embedRaw.color, defaultWelcome.embed.color),
      showAvatar: asBoolean(embedRaw.showAvatar ?? embedRaw.show_avatar, defaultWelcome.embed.showAvatar),
    },
  });
};

const normalizeFarewell = (payload: unknown): FarewellSettings => {
  const raw = isRecord(payload)
    ? (payload.farewell as Record<string, unknown> | undefined) ??
      (payload.data as Record<string, unknown> | undefined) ??
      payload
    : null;

  if (!isRecord(raw)) {
    return withFarewellDefaults();
  }

  const embedRaw = isRecord(raw.embed) ? raw.embed : {};
  const typeValue = raw.type ?? raw.message_type;

  return withFarewellDefaults({
    enabled: asBoolean(raw.enabled ?? raw.is_enabled ?? raw.active, defaultFarewell.enabled),
    channelId: asString(raw.channelId ?? raw.channel_id ?? raw.channel, defaultFarewell.channelId),
    type: typeValue === "text" ? "text" : "embed",
    text: asString(raw.text ?? raw.message, defaultFarewell.text),
    embed: {
      title: asString(embedRaw.title ?? embedRaw.header, defaultFarewell.embed.title),
      description: asString(
        embedRaw.description ?? embedRaw.body,
        defaultFarewell.embed.description
      ),
      color: asString(embedRaw.color, defaultFarewell.embed.color),
      showAvatar: asBoolean(
        embedRaw.showAvatar ?? embedRaw.show_avatar,
        defaultFarewell.embed.showAvatar
      ),
    },
  });
};

const normalizeAutorole = (payload: unknown): AutoRoleSettings => {
  const raw = isRecord(payload)
    ? (payload.autorole as Record<string, unknown> | undefined) ??
      (payload.data as Record<string, unknown> | undefined) ??
      payload
    : null;

  if (!isRecord(raw)) {
    return withAutoroleDefaults();
  }

  return withAutoroleDefaults({
    enabled: asBoolean(raw.enabled ?? raw.is_enabled ?? raw.active, defaultAutorole.enabled),
    roleId: asString(raw.roleId ?? raw.role_id ?? raw.role, defaultAutorole.roleId),
  });
};

const normalizeWarthogSettings = (payload: unknown): WarthogSettings => {
  const raw = isRecord(payload)
    ? (payload.warthog as Record<string, unknown> | undefined) ??
      (payload.data as Record<string, unknown> | undefined) ??
      payload
    : null;

  if (!isRecord(raw)) {
    return { ...defaultWarthogSettings };
  }

  const allowedRolesRaw = raw.allowedRoles ?? raw.allowed_roles;
  const whitelistRaw = raw.whitelist ?? raw.immune;

  return {
    enabled: asBoolean(raw.enabled ?? raw.warthogEnabled, defaultWarthogSettings.enabled),
    roleLock: asBoolean(raw.roleLock ?? raw.role_lock, defaultWarthogSettings.roleLock),
    allowedRoles: Array.isArray(allowedRolesRaw)
      ? (allowedRolesRaw as unknown[])
          .map((item) => asString(item))
          .filter((value): value is string => Boolean(value))
      : [],
    whitelist: Array.isArray(whitelistRaw)
      ? (whitelistRaw as unknown[])
          .map((item) => asString(item))
          .filter((value): value is string => Boolean(value))
      : [],
    bounceMessage: asString(
      raw.bounceMessage ?? raw.bounce_message,
      defaultWarthogSettings.bounceMessage
    ),
    bounceGif: asString(raw.bounceGif ?? raw.bounce_gif, defaultWarthogSettings.bounceGif),
  };
};

const normalizeEvents = (payload: unknown): EventItem[] => {
  const raw = isRecord(payload)
    ? (payload.events as unknown[] | undefined) ??
      (payload.data as unknown[] | undefined) ??
      (payload.data && isRecord(payload.data) ? (payload.data as Record<string, unknown>).events : undefined) ??
      payload
    : payload;

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter(isRecord)
    .map((item) => {
      const idValue = item.id ?? item.event_id ?? item.eventId;
      const titleValue = item.title ?? item.name;
      if (!idValue || !titleValue) {
        return null;
      }
      return {
        id: String(idValue),
        title: String(titleValue),
        description: asString(item.description ?? item.details),
        date: asString(item.date ?? item.date_start_event ?? item.event_date),
        time: asString(item.time ?? item.time_start_event ?? item.event_time),
        intervalDays: (() => {
          const interval =
            item.intervalDays ?? item.interval ?? item.repeat_days ?? item.repeatDays;
          const parsed = Number(interval);
          if (Number.isFinite(parsed)) {
            return parsed;
          }
          return asBoolean(item.repeating ?? item.is_repeating) ? 1 : 0;
        })(),
        channelId: asString(item.channelId ?? item.channel_id ?? item.channel),
        roleId: asString(item.roleId ?? item.role_id ?? item.role),
        durationMinutes: (() => {
          const duration = asNumber(item.durationMinutes ?? item.duration_minutes ?? item.duration);
          if (Number.isFinite(duration) && duration > 0) {
            return duration;
          }
          const hours = Number(item.activity_time ?? item.activityTime);
          return Number.isFinite(hours) ? hours * 60 : 0;
        })(),
        messageId: asString(item.messageId ?? item.message_id ?? item.message),
      } as EventItem;
    })
    .filter((event): event is EventItem => event !== null);
};

const normalizeEmojiTriggers = (payload: unknown): EmojiTrigger[] => {
  const raw = isRecord(payload)
    ? (payload.triggers as unknown[] | undefined) ??
      (payload.data as unknown[] | undefined) ??
      (payload.data && isRecord(payload.data) ? (payload.data as Record<string, unknown>).triggers : undefined) ??
      payload
    : payload;

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter(isRecord)
    .map((item) => {
      const emoji = asString(item.emoji ?? item.reaction);
      const imagesRaw =
        (Array.isArray(item.imageUrls) ? item.imageUrls : null) ??
        (Array.isArray(item.image_urls) ? item.image_urls : null);
      const imageUrls = imagesRaw
        ? imagesRaw.map((url) => asString(url)).filter((url) => url)
        : [];
      const fallbackUrl = asString(item.imageUrl ?? item.image_url ?? item.url);
      if (!imageUrls.length && fallbackUrl) {
        imageUrls.push(fallbackUrl);
      }
      if (!emoji && imageUrls.length === 0) {
        return null;
      }
      return { emoji, imageUrls };
    })
    .filter((trigger): trigger is EmojiTrigger => trigger !== null);
};

const normalizeEmojiTriggerSettings = (payload: unknown): EmojiTriggerSettings => {
  const raw = isRecord(payload)
    ? (payload.data as Record<string, unknown> | undefined) ??
      payload
    : null;
  const triggers = normalizeEmojiTriggers(raw);
  const requireExact = isRecord(raw)
    ? asBoolean(raw.requireExact ?? raw.require_exact ?? raw.emoji_trigger_require_exact, false)
    : false;
  return { triggers, requireExact };
};

const normalizeVoicePresenceSettings = (payload: unknown): VoicePresenceSettings => {
  const raw = isRecord(payload)
    ? ((payload.settings as Record<string, unknown> | undefined) ??
        (payload.data as Record<string, unknown> | undefined) ??
        payload)
    : null;

  if (!isRecord(raw)) {
    return { ...defaultVoicePresenceSettings };
  }

  const manualChannelIdsRaw = raw.manualChannelIds ?? raw.manual_channel_ids;
  const manualChannelIds = Array.isArray(manualChannelIdsRaw)
    ? manualChannelIdsRaw
        .map((item: unknown) => asString(item))
        .filter((value): value is string => Boolean(value))
    : [];
  const manualName = asString(raw.manualName ?? raw.manual_name, "");

  const schedulesRaw = Array.isArray(raw.schedules) ? raw.schedules : [];
  const schedules = schedulesRaw
    .filter(isRecord)
    .map((item) => ({
      id: asString(item.id ?? item._id ?? item.key),
      name: asString(item.name ?? item.label ?? "", ""),
      enabled: asBoolean(item.enabled, true),
      dayOfWeek: Number(item.dayOfWeek ?? item.day_of_week ?? 0),
      time: asString(item.time ?? "00:00"),
      channelIds: (() => {
        const channelIdsRaw = item.channelIds ?? item.channel_ids;
        return Array.isArray(channelIdsRaw)
          ? channelIdsRaw
              .map((value: unknown) => asString(value))
              .filter((value): value is string => Boolean(value))
          : [];
      })(),
      lastRun: asString(item.lastRun ?? item.last_run, "") || null,
    }))
    .filter((schedule) => schedule.id && Number.isFinite(schedule.dayOfWeek));

  return {
    manualChannelIds,
    manualName,
    schedules,
  };
};

const normalizeVoicePresenceLogs = (payload: unknown): VoicePresenceLog[] => {
  const raw = isRecord(payload)
    ? (payload.logs as unknown[] | undefined) ??
      (payload.data as unknown[] | undefined) ??
      payload
    : null;

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter(isRecord)
    .map((item) => ({
      id: asString(item.id ?? item._id),
      createdAt: asString(item.createdAt ?? item.created_at, "") || null,
      source: (asString(item.source, "manual") as "manual" | "schedule") ?? "manual",
      scheduleId: asString(item.scheduleId ?? item.schedule_id, "") || null,
      name: asString(item.name ?? item.label, "") || null,
      channels: Array.isArray(item.channels)
        ? item.channels
            .filter(isRecord)
            .map(normalizeOption)
            .filter((channel): channel is ChannelOption => channel !== null)
        : [],
      members: Array.isArray(item.members)
        ? item.members
            .filter(isRecord)
            .map((member) => ({
              id: asString(member.id),
              name: asString(member.name),
              channelId: asString(member.channelId ?? member.channel_id),
              channelName: asString(member.channelName ?? member.channel_name),
            }))
            .filter((member) => member.id && member.name)
        : [],
      totalMembers: asNumber(item.totalMembers ?? item.total_members ?? 0),
      totalChannels: asNumber(item.totalChannels ?? item.total_channels ?? 0),
    }))
    .filter((log) => log.id);
};

const normalizeRoleReactions = (payload: unknown): RoleReactionSettings => {
  const raw = isRecord(payload)
    ? (payload.roleReactions as Record<string, unknown> | undefined) ??
      (payload.role_reactions as Record<string, unknown> | undefined) ??
      (payload.data as Record<string, unknown> | undefined) ??
      payload
    : null;

  if (!isRecord(raw)) {
    return withRoleReactionsDefaults();
  }

  const normalizePairs = (pairsValue: unknown) => {
    const pairsRaw = Array.isArray(pairsValue) ? pairsValue : [];
    return pairsRaw
      .filter(isRecord)
      .map((item) => ({
        emoji: asString(item.emoji ?? item.emoji_id ?? item.emojiId),
        roleId: asString(item.roleId ?? item.role_id ?? item.role),
      }))
      .filter((pair) => pair.emoji && pair.roleId);
  };

  const normalizeMessage = (item: Record<string, unknown>): RoleReactionMessage => {
    const embedRaw = isRecord(item.embed) ? item.embed : {};
    const messageType =
      String(item.type ?? item.message_type ?? item.messageType ?? "text").toLowerCase() ===
      "embed"
        ? "embed"
        : "text";
    return {
      key: asString(item.key ?? item.id ?? item.clientId),
      channelId: asString(item.channelId ?? item.channel_id ?? item.channel),
      type: messageType,
      message: asString(item.message ?? item.text, defaultRoleReactionMessage.message),
      embed: {
        title: asString(embedRaw.title, defaultRoleReactionMessage.embed?.title ?? ""),
        description: asString(embedRaw.description, defaultRoleReactionMessage.embed?.description ?? ""),
        color: asString(embedRaw.color, defaultRoleReactionMessage.embed?.color ?? "#2f7cff"),
      },
      pairs: normalizePairs(item.pairs),
      messageId: asString(item.messageId ?? item.message_id),
    };
  };

  const messagesRaw = Array.isArray(raw.messages) ? raw.messages : null;
  const messages = messagesRaw
    ? messagesRaw.filter(isRecord).map(normalizeMessage)
    : [
        normalizeMessage({
          channelId: raw.channelId ?? raw.channel_id ?? raw.channel,
          message: raw.message ?? raw.text,
          messageId: raw.messageId ?? raw.message_id,
          pairs: raw.pairs,
          type: raw.type ?? raw.message_type ?? raw.messageType ?? "text",
          embed: raw.embed,
        }),
      ];

  return withRoleReactionsDefaults({
    enabled: asBoolean(raw.enabled ?? raw.is_enabled ?? raw.active, defaultRoleReactions.enabled),
    messages: messages.filter((message) => message.channelId || message.pairs.length),
  });
};

const normalizeMetadata = (payload: unknown): ServerMetadata => {
  const raw = isRecord(payload)
    ? (payload.data as Record<string, unknown> | undefined) ?? payload
    : null;

  if (!isRecord(raw)) {
    return { ...defaultMetadata };
  }

  const channelsRaw = Array.isArray(raw.channels) ? raw.channels : [];
  const voiceChannelsRaw = Array.isArray(raw.voice_channels)
    ? raw.voice_channels
    : Array.isArray(raw.voiceChannels)
    ? raw.voiceChannels
    : [];
  const rolesRaw = Array.isArray(raw.roles) ? raw.roles : [];

  return {
    channels: channelsRaw
      .filter(isRecord)
      .map(normalizeOption)
      .filter((item): item is ChannelOption => item !== null),
    voiceChannels: voiceChannelsRaw
      .filter(isRecord)
      .map((item) => {
        const option = normalizeOption(item);
        if (!option) {
          return null;
        }
        return { ...option, name: stripVoicePrefix(option.name) };
      })
      .filter((item): item is ChannelOption => item !== null),
    roles: rolesRaw
      .filter(isRecord)
      .map(normalizeOption)
      .filter((item): item is ChannelOption => item !== null),
  };
};

const extractServers = (payload: unknown): Server[] => {
  if (Array.isArray(payload)) {
    return payload
      .filter(isRecord)
      .map(normalizeServer)
      .filter((server): server is Server => server !== null);
  }

  if (isRecord(payload)) {
    const nested = payload.servers ?? payload.data ?? payload.guilds;
    if (Array.isArray(nested)) {
      return nested
        .filter(isRecord)
        .map(normalizeServer)
        .filter((server): server is Server => server !== null);
    }
  }

  return [];
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(message || "Request failed", response.status);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const payload = (await response.json()) as unknown;
  if (isRecord(payload) && typeof payload.status === "string") {
    if (payload.status === "error") {
      const message = typeof payload.error === "string" ? payload.error : "Request failed";
      throw new ApiError(message, response.status);
    }
    if (payload.status === "ok") {
      return (payload.data ?? {}) as T;
    }
  }
  return payload as T;
}

export async function getMe(): Promise<User | null> {
  if (USE_MOCKS) {
    await sleep(500);
    return mockUser;
  }

  try {
    const result = await request<{ user?: User }>("/api/me");
    if (isRecord(result.user)) {
      return normalizeUser(result.user);
    }
    if (isRecord(result)) {
      return normalizeUser(result as Record<string, unknown>);
    }
    return null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function logout(): Promise<void> {
  if (USE_MOCKS) {
    await sleep(200);
    return;
  }

  try {
    await request<void>("/auth/logout", { method: "POST" });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return;
    }
    throw error;
  }
}

export async function getServers(): Promise<Server[]> {
  if (USE_MOCKS) {
    await sleep(500);
    return mockServers.filter((server) => server.hasBot !== false);
  }

  const response = await request<unknown>("/api/servers");
  const servers = extractServers(response);
  if (servers.length > 0) {
    return servers.filter((server) => server.hasBot !== false);
  }
  if (Array.isArray(response)) {
    return (response as Server[]).filter((server) => server.hasBot !== false);
  }
  return [];
}

export async function getServerMetadata(id: string): Promise<ServerMetadata> {
  if (USE_MOCKS) {
    await sleep(200);
    return mockMetadata[id] ?? { ...defaultMetadata };
  }

  try {
    const response = await request<unknown>(`/api/servers/${id}/metadata`);
    return normalizeMetadata(response);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { ...defaultMetadata };
    }
    throw error;
  }
}

export async function getWelcomeSettings(id: string): Promise<WelcomeSettings> {
  if (USE_MOCKS) {
    await sleep(300);
    return withWelcomeDefaults(mockWelcome[id]);
  }

  try {
    const response = await request<unknown>(`/api/servers/${id}/welcome`);
    const raw = isRecord(response) && isRecord(response.welcome) ? response.welcome : response;
    return normalizeWelcome(raw);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return withWelcomeDefaults();
    }
    throw error;
  }
}

export async function updateWelcomeSettings(
  id: string,
  settings: WelcomeSettings
): Promise<WelcomeSettings> {
  if (USE_MOCKS) {
    await sleep(400);
    mockWelcome = {
      ...mockWelcome,
      [id]: settings,
    };
    return withWelcomeDefaults(settings);
  }

  const response = await request<unknown>(`/api/servers/${id}/welcome`, {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
  const raw = isRecord(response) && isRecord(response.welcome) ? response.welcome : response;
  return normalizeWelcome(raw);
}

export async function getFarewellSettings(id: string): Promise<FarewellSettings> {
  if (USE_MOCKS) {
    await sleep(300);
    return withFarewellDefaults(mockFarewell[id]);
  }

  try {
    const response = await request<unknown>(`/api/servers/${id}/farewell`);
    const raw = isRecord(response) && isRecord(response.farewell) ? response.farewell : response;
    return normalizeFarewell(raw);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return withFarewellDefaults();
    }
    throw error;
  }
}

export async function updateFarewellSettings(
  id: string,
  settings: FarewellSettings
): Promise<FarewellSettings> {
  if (USE_MOCKS) {
    await sleep(400);
    mockFarewell = {
      ...mockFarewell,
      [id]: settings,
    };
    return withFarewellDefaults(settings);
  }

  const response = await request<unknown>(`/api/servers/${id}/farewell`, {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
  const raw = isRecord(response) && isRecord(response.farewell) ? response.farewell : response;
  return normalizeFarewell(raw);
}

export async function getEvents(id: string): Promise<EventItem[]> {
  if (USE_MOCKS) {
    await sleep(300);
    return mockEvents[id] ?? [];
  }

  try {
    const response = await request<unknown>(`/api/servers/${id}/events`);
    const raw = isRecord(response) && Array.isArray(response.events) ? response.events : response;
    return normalizeEvents(raw);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return [];
    }
    throw error;
  }
}

export async function createEvent(
  id: string,
  payload: EventInput
): Promise<EventItem> {
  if (USE_MOCKS) {
    await sleep(400);
    const nextEvent = { id: `evt_${Date.now()}`, ...payload };
    mockEvents = {
      ...mockEvents,
      [id]: [nextEvent, ...(mockEvents[id] ?? [])],
    };
    return nextEvent;
  }

  const response = await request<unknown>(`/api/servers/${id}/events`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const normalized =
    isRecord(response) && isRecord(response.event)
      ? normalizeEvents([response.event])[0]
      : normalizeEvents(response)[0];

  if (!normalized) {
    throw new Error("Invalid event response.");
  }

  return normalized;
}

export async function updateEvent(
  id: string,
  eventId: string,
  payload: EventInput
): Promise<EventItem> {
  if (USE_MOCKS) {
    await sleep(350);
    const updated = { id: eventId, ...payload };
    mockEvents = {
      ...mockEvents,
      [id]: (mockEvents[id] ?? []).map((eventItem) =>
        eventItem.id === eventId ? updated : eventItem
      ),
    };
    return updated;
  }

  const response = await request<unknown>(`/api/servers/${id}/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  const normalized =
    isRecord(response) && isRecord(response.event)
      ? normalizeEvents([response.event])[0]
      : normalizeEvents(response)[0];

  if (!normalized) {
    throw new Error("Invalid event response.");
  }

  return normalized;
}

export async function deleteEvent(id: string, eventId: string): Promise<string> {
  if (USE_MOCKS) {
    await sleep(200);
    mockEvents = {
      ...mockEvents,
      [id]: (mockEvents[id] ?? []).filter((eventItem) => eventItem.id !== eventId),
    };
    return eventId;
  }

  const response = await request<unknown>(`/api/servers/${id}/events/${eventId}`, {
    method: "DELETE",
  });
  if (isRecord(response)) {
    const deleted = response.event_id ?? response.eventId ?? response.id;
    if (deleted) {
      return String(deleted);
    }
  }
  return eventId;
}

export async function pingEvent(
  id: string,
  eventId: string,
  mode: EventPingMode
): Promise<number> {
  if (USE_MOCKS) {
    await sleep(200);
    return 0;
  }

  const response = await request<unknown>(`/api/servers/${id}/events/${eventId}/ping`, {
    method: "POST",
    body: JSON.stringify({ mode }),
  });

  if (isRecord(response)) {
    const pinged = response.pinged ?? response.count ?? response.total;
    if (pinged !== undefined) {
      return Number(pinged);
    }
  }
  return 0;
}

export async function getEmojis(id: string): Promise<EmojiOption[]> {
  if (USE_MOCKS) {
    await sleep(200);
    return mockEmojis[id] ?? [];
  }

  try {
    const response = await request<unknown>(`/api/get_emojis?guild_id=${encodeURIComponent(id)}`);
    return normalizeEmojiOptions(response);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return [];
    }
    throw error;
  }
}

export async function getEmojiTriggers(id: string): Promise<EmojiTriggerSettings> {
  if (USE_MOCKS) {
    await sleep(200);
    return mockEmojiTriggers[id] ?? { triggers: [], requireExact: false };
  }

  try {
    const response = await request<unknown>(`/api/servers/${id}/emoji-triggers`);
    return normalizeEmojiTriggerSettings(response);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { triggers: [], requireExact: false };
    }
    throw error;
  }
}

export async function uploadImage(file: File, guildId?: string): Promise<string> {
  if (USE_MOCKS) {
    await sleep(200);
    return "https://placehold.co/480x270";
  }

  const formData = new FormData();
  formData.append("file", file);
  if (guildId) {
    formData.append("guild_id", guildId);
  }

  const response = await fetch(`${API_BASE}/api/uploads`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(message || "Upload failed.", response.status);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as unknown)
    : await response.text();

  const url = extractUploadUrl(payload);
  if (!url) {
    throw new Error("Upload succeeded but no URL was returned.");
  }

  return withApiBase(url);
}

export async function updateEmojiTriggers(
  id: string,
  settings: EmojiTriggerSettings
): Promise<EmojiTriggerSettings> {
  if (USE_MOCKS) {
    await sleep(300);
    mockEmojiTriggers = {
      ...mockEmojiTriggers,
      [id]: settings,
    };
    return settings;
  }

  const response = await request<unknown>(`/api/servers/${id}/emoji-triggers`, {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
  return normalizeEmojiTriggerSettings(response);
}

export async function getVoicePresenceSettings(id: string): Promise<VoicePresenceSettings> {
  if (USE_MOCKS) {
    await sleep(200);
    return mockVoicePresenceSettings[id] ?? { ...defaultVoicePresenceSettings };
  }

  try {
    const response = await request<unknown>(`/api/servers/${id}/voice-presence/settings`);
    return normalizeVoicePresenceSettings(response);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { ...defaultVoicePresenceSettings };
    }
    throw error;
  }
}

export async function updateVoicePresenceSettings(
  id: string,
  settings: VoicePresenceSettings
): Promise<VoicePresenceSettings> {
  if (USE_MOCKS) {
    await sleep(300);
    mockVoicePresenceSettings = {
      ...mockVoicePresenceSettings,
      [id]: settings,
    };
    return settings;
  }

  const response = await request<unknown>(`/api/servers/${id}/voice-presence/settings`, {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
  return normalizeVoicePresenceSettings(response);
}

export async function runVoicePresence(
  id: string,
  channelIds: string[],
  name?: string
): Promise<VoicePresenceLog | null> {
  if (USE_MOCKS) {
    await sleep(300);
    const log: VoicePresenceLog = {
      id: `log-${Date.now()}`,
      createdAt: new Date().toISOString(),
      source: "manual",
      name: name || "",
      channels: mockMetadata[id]?.voiceChannels ?? [],
      members: [],
      totalMembers: 0,
      totalChannels: (mockMetadata[id]?.voiceChannels ?? []).length,
    };
    mockVoicePresenceLogs = {
      ...mockVoicePresenceLogs,
      [id]: [log, ...(mockVoicePresenceLogs[id] ?? [])],
    };
    return log;
  }

  const response = await request<unknown>(`/api/servers/${id}/voice-presence/run`, {
    method: "POST",
    body: JSON.stringify({ channelIds, name }),
  });
  const raw = isRecord(response) ? response.snapshot : response;
  const logs = normalizeVoicePresenceLogs({ logs: raw ? [raw] : [] });
  return logs[0] ?? null;
}

export async function getVoicePresenceLogs(
  id: string,
  options: { limit?: number; offset?: number } = {}
): Promise<VoicePresenceLog[]> {
  if (USE_MOCKS) {
    await sleep(200);
    return mockVoicePresenceLogs[id] ?? [];
  }

  const query = new URLSearchParams();
  if (options.limit) {
    query.set("limit", String(options.limit));
  }
  if (options.offset) {
    query.set("offset", String(options.offset));
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await request<unknown>(`/api/servers/${id}/voice-presence/logs${suffix}`);
  return normalizeVoicePresenceLogs(response);
}

export async function getRoleReactions(id: string): Promise<RoleReactionSettings> {
  if (USE_MOCKS) {
    await sleep(200);
    return mockRoleReactions[id] ?? withRoleReactionsDefaults();
  }

  try {
    const response = await request<unknown>(`/api/servers/${id}/role-reactions`);
    return normalizeRoleReactions(response);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return withRoleReactionsDefaults();
    }
    throw error;
  }
}

export async function updateRoleReactions(
  id: string,
  settings: RoleReactionSettings
): Promise<RoleReactionSettings> {
  if (USE_MOCKS) {
    await sleep(300);
    mockRoleReactions = {
      ...mockRoleReactions,
      [id]: settings,
    };
    return settings;
  }

  const response = await request<unknown>(`/api/servers/${id}/role-reactions`, {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
  return normalizeRoleReactions(response);
}

const normalizeAdminLog = (item: Record<string, unknown>): AdminLogEntry | null => {
  const source = asString(item.source);
  const message = asString(item.message);
  if (!source || !message || (source !== "conqbot" && source !== "botpanel")) {
    return null;
  }
  return {
    id: asString(item.id ?? item._id),
    source: source as AdminLogEntry["source"],
    level: asString(item.level ?? "INFO"),
    logger: asString(item.logger ?? ""),
    message,
    timestamp: asString(item.timestamp ?? ""),
    context: isRecord(item.context) ? (item.context as Record<string, unknown>) : undefined,
    userId: asString(item.userId ?? item.user_id ?? ""),
  };
};

export async function getAdminLogs(params: {
  source: "conqbot" | "botpanel";
  level?: string;
  limit?: number;
  offset?: number;
}): Promise<AdminLogEntry[]> {
  const query = new URLSearchParams();
  query.set("source", params.source);
  if (params.level) {
    query.set("level", params.level);
  }
  if (params.limit) {
    query.set("limit", String(params.limit));
  }
  if (params.offset) {
    query.set("offset", String(params.offset));
  }
  const response = await request<unknown>(`/api/admin/logs?${query.toString()}`);
  const raw = isRecord(response) && Array.isArray(response.logs) ? response.logs : response;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map((item) => (isRecord(item) ? normalizeAdminLog(item) : null)).filter(
    (item): item is AdminLogEntry => item !== null
  );
}

export async function getAdminUsers(): Promise<string[]> {
  const response = await request<unknown>("/api/admin/users");
  const raw = isRecord(response) && Array.isArray(response.users) ? response.users : response;
  return Array.isArray(raw) ? raw.map((item) => String(item)) : [];
}

export async function addAdminUser(userId: string): Promise<string[]> {
  const response = await request<unknown>("/api/admin/users", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
  const raw = isRecord(response) && Array.isArray(response.users) ? response.users : response;
  return Array.isArray(raw) ? raw.map((item) => String(item)) : [];
}

export async function removeAdminUser(userId: string): Promise<string[]> {
  const response = await request<unknown>(`/api/admin/users/${userId}`, {
    method: "DELETE",
  });
  const raw = isRecord(response) && Array.isArray(response.users) ? response.users : response;
  return Array.isArray(raw) ? raw.map((item) => String(item)) : [];
}

export async function sendClientLog(
  level: string,
  message: string,
  context?: Record<string, unknown>
): Promise<void> {
  if (USE_MOCKS) {
    await sleep(50);
    return;
  }
  await request<void>("/api/logs", {
    method: "POST",
    body: JSON.stringify({
      level,
      message,
      context,
      logger: "botpanel",
    }),
  });
}

export async function getWarthog(id: string): Promise<WarthogSettings> {
  if (USE_MOCKS) {
    await sleep(150);
    return mockWarthog[id] ?? { ...defaultWarthogSettings };
  }

  try {
    const response = await request<unknown>(`/api/servers/${id}/warthog`);
    return normalizeWarthogSettings(response);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { ...defaultWarthogSettings };
    }
    throw error;
  }
}

export async function updateWarthog(
  id: string,
  settings: WarthogSettings
): Promise<WarthogSettings> {
  if (USE_MOCKS) {
    await sleep(250);
    mockWarthog = {
      ...mockWarthog,
      [id]: settings,
    };
    return settings;
  }

  const response = await request<unknown>(`/api/servers/${id}/warthog`, {
    method: "PATCH",
    body: JSON.stringify(settings),
  });

  return normalizeWarthogSettings(response);
}

export async function getAutorole(id: string): Promise<AutoRoleSettings> {
  if (USE_MOCKS) {
    await sleep(250);
    return withAutoroleDefaults(mockAutorole[id]);
  }

  try {
    const response = await request<unknown>(`/api/servers/${id}/autorole`);
    const raw = isRecord(response) && isRecord(response.autorole) ? response.autorole : response;
    return normalizeAutorole(raw);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return withAutoroleDefaults();
    }
    throw error;
  }
}

export async function updateAutorole(
  id: string,
  settings: AutoRoleSettings
): Promise<AutoRoleSettings> {
  if (USE_MOCKS) {
    await sleep(300);
    mockAutorole = {
      ...mockAutorole,
      [id]: settings,
    };
    return withAutoroleDefaults(settings);
  }

  const response = await request<unknown>(`/api/servers/${id}/autorole`, {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
  const raw = isRecord(response) && isRecord(response.autorole) ? response.autorole : response;
  return normalizeAutorole(raw);
}

export async function getServerSettings(id: string): Promise<ServerSettings> {
  if (USE_MOCKS) {
    await sleep(450);
    return withDefaults(mockSettings[id]);
  }

  const response = await request<unknown>(`/api/servers/${id}/settings`);
  const raw = isRecord(response) && isRecord(response.settings) ? response.settings : response;
  return withDefaults(raw as ServerSettings);
}

export async function updateServerSettings(
  id: string,
  settings: ServerSettings
): Promise<ServerSettings> {
  if (USE_MOCKS) {
    await sleep(600);
    mockSettings = {
      ...mockSettings,
      [id]: settings,
    };
    return settings;
  }

  const response = await request<unknown>(`/api/servers/${id}/settings`, {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
  const raw = isRecord(response) && isRecord(response.settings) ? response.settings : response;
  return withDefaults(raw as ServerSettings);
}

export async function getInviteUrl(serverId?: string): Promise<string> {
  if (USE_MOCKS) {
    await sleep(250);
    return "https://discord.com/oauth2/authorize?client_id=123&scope=bot%20applications.commands";
  }

  if (serverId) {
    const result = await request<{ url?: string; invite_url?: string }>(
      `/api/servers/${serverId}/invite`
    );
    return result.url ?? result.invite_url ?? "";
  }

  const result = await request<{ url?: string; invite_url?: string }>("/api/invite");
  return result.url ?? result.invite_url ?? "";
}

export const authUrl = `${API_BASE}/auth/discord`;
