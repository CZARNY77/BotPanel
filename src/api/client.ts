import type { Server, ServerSettings, User } from "./types";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(
  /\/$/,
  ""
) ?? "";
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

const defaultSettings: ServerSettings = {
  prefix: "!",
  language: "pl-PL",
  timezone: "Europe/Warsaw",
  welcomeMessage: "Witaj na serwerze! Daj nam znac, jesli potrzebujesz pomocy.",
  logChannelId: "",
  autoRoleId: "",
  features: {
    autoModeration: true,
    eventReminders: true,
    voicePresence: false,
  },
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

let mockSettings: Record<string, ServerSettings> = {
  "9001": {
    ...defaultSettings,
    prefix: "?",
    welcomeMessage: "Witaj w Conq Warriors!",
    features: {
      autoModeration: true,
      eventReminders: true,
      voicePresence: true,
    },
  },
  "9002": {
    ...defaultSettings,
    prefix: "!",
    welcomeMessage: "Dolaczaj do bitew w rytmie harmonogramu.",
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

  return (await response.json()) as T;
}

export async function getMe(): Promise<User | null> {
  if (USE_MOCKS) {
    await sleep(500);
    return mockUser;
  }

  try {
    return await request<User>("/api/me");
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
    return mockServers;
  }

  return request<Server[]>("/api/servers");
}

export async function getServerSettings(id: string): Promise<ServerSettings> {
  if (USE_MOCKS) {
    await sleep(450);
    return withDefaults(mockSettings[id]);
  }

  return request<ServerSettings>(`/api/servers/${id}/settings`).then(withDefaults);
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

  return request<ServerSettings>(`/api/servers/${id}/settings`, {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
}

export async function getInviteUrl(serverId?: string): Promise<string> {
  if (USE_MOCKS) {
    await sleep(250);
    return "https://discord.com/oauth2/authorize?client_id=123&scope=bot%20applications.commands";
  }

  if (serverId) {
    const result = await request<{ url: string }>(
      `/api/servers/${serverId}/invite`
    );
    return result.url;
  }

  const result = await request<{ url: string }>("/api/invite");
  return result.url;
}

export const authUrl = `${API_BASE}/auth/discord`;
