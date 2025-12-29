import type {
  ChannelOption,
  EmojiOption,
  EmojiTrigger,
  EventInput,
  EventItem,
  Server,
  ServerMetadata,
  ServerSettings,
  User,
  WelcomeSettings,
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

const defaultMetadata: ServerMetadata = {
  channels: [],
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

let mockEvents: Record<string, EventItem[]> = {
  "9001": [
    {
      id: "evt_1",
      title: "Weekly siege",
      description: "Gather at the north gate.",
      date: "18.10.2025",
      time: "19:00",
      repeating: true,
      channelId: "333",
      roleId: "555",
      durationMinutes: 90,
    },
  ],
};

let mockEmojiTriggers: Record<string, EmojiTrigger[]> = {
  "9001": [
    { emoji: ":fire:", imageUrl: "https://placehold.co/320x180" },
    { emoji: ":sword:", imageUrl: "https://placehold.co/320x180" },
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

let mockWarthog: Record<string, boolean> = {
  "9001": true,
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
        date: asString(item.date ?? item.event_date),
        time: asString(item.time ?? item.event_time),
        repeating: asBoolean(item.repeating ?? item.is_repeating),
        channelId: asString(item.channelId ?? item.channel_id ?? item.channel),
        roleId: asString(item.roleId ?? item.role_id ?? item.role),
        durationMinutes: asNumber(item.durationMinutes ?? item.duration_minutes ?? item.duration),
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
      const imageUrl = asString(item.imageUrl ?? item.image_url ?? item.url);
      if (!emoji && !imageUrl) {
        return null;
      }
      return { emoji, imageUrl };
    })
    .filter((trigger): trigger is EmojiTrigger => trigger !== null);
};

const normalizeMetadata = (payload: unknown): ServerMetadata => {
  const raw = isRecord(payload)
    ? (payload.data as Record<string, unknown> | undefined) ?? payload
    : null;

  if (!isRecord(raw)) {
    return { ...defaultMetadata };
  }

  const channelsRaw = Array.isArray(raw.channels) ? raw.channels : [];
  const rolesRaw = Array.isArray(raw.roles) ? raw.roles : [];

  return {
    channels: channelsRaw
      .filter(isRecord)
      .map(normalizeOption)
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

export async function getEmojiTriggers(id: string): Promise<EmojiTrigger[]> {
  if (USE_MOCKS) {
    await sleep(200);
    return mockEmojiTriggers[id] ?? [];
  }

  try {
    const response = await request<unknown>(`/api/servers/${id}/emoji-triggers`);
    const raw = isRecord(response) && Array.isArray(response.triggers) ? response.triggers : response;
    return normalizeEmojiTriggers(raw);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return [];
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
  triggers: EmojiTrigger[]
): Promise<EmojiTrigger[]> {
  if (USE_MOCKS) {
    await sleep(300);
    mockEmojiTriggers = {
      ...mockEmojiTriggers,
      [id]: triggers,
    };
    return triggers;
  }

  const response = await request<unknown>(`/api/servers/${id}/emoji-triggers`, {
    method: "PATCH",
    body: JSON.stringify({ triggers }),
  });
  const raw = isRecord(response) && Array.isArray(response.triggers) ? response.triggers : response;
  return normalizeEmojiTriggers(raw);
}

export async function getWarthog(id: string): Promise<boolean> {
  if (USE_MOCKS) {
    await sleep(150);
    return mockWarthog[id] ?? true;
  }

  try {
    const response = await request<unknown>(`/api/servers/${id}/warthog`);
    if (isRecord(response)) {
      return asBoolean(response.enabled ?? response.warthogEnabled, true);
    }
    return true;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return true;
    }
    throw error;
  }
}

export async function updateWarthog(id: string, enabled: boolean): Promise<boolean> {
  if (USE_MOCKS) {
    await sleep(250);
    mockWarthog = {
      ...mockWarthog,
      [id]: enabled,
    };
    return enabled;
  }

  const response = await request<unknown>(`/api/servers/${id}/warthog`, {
    method: "PATCH",
    body: JSON.stringify({ enabled }),
  });

  if (isRecord(response)) {
    return asBoolean(response.enabled ?? response.warthogEnabled, enabled);
  }

  return enabled;
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
