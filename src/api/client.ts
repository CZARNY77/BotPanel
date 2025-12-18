import { ApiError, BotEvent, EmojiItem, GuildServer } from "./types";

const API_BASE = "https://conqbot.blcdev.com";
export const API_URL = `${API_BASE}/api/panel`;

export function buildAuthUrl() {
  if (typeof window === "undefined") {
    return `${API_URL}/auth/discord`;
  }
  const redirect = encodeURIComponent(`${window.location.origin}/login`);
  return `${API_URL}/auth/discord?redirect_uri=${redirect}`;
}

function getAuthToken() {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem("conqbot_token");
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    },
    ...init
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const error: ApiError = new Error(payload?.error || payload?.message || "Request failed");
    error.status = response.status;
    throw error;
  }

  return payload as T;
}

export function getUserServers() {
  return fetchJson<{ guilds: GuildServer[] }>("/guilds").then((res) => res.guilds ?? []);
}

export function getServerVerification(serverId: string) {
  const query = new URLSearchParams({ server_id: serverId }).toString();
  return fetchJson<{ verified: boolean; message?: string }>(`/server_verification?${query}`);
}

export function getEmojis(serverId: string) {
  const query = new URLSearchParams({ server_id: serverId }).toString();
  return fetchJson<{ emojis: EmojiItem[] }>(`/emojis?${query}`).then((res) => res.emojis ?? []);
}

export function createEvent(event: BotEvent & { serverId: string }) {
  return fetchJson<{ status: string; event?: BotEvent }>("/events", {
    method: "POST",
    body: JSON.stringify(event)
  });
}

export function changeHouseName(serverId: string, house: string) {
  return fetchJson<{ status: string }>("/house_name", {
    method: "POST",
    body: JSON.stringify({ serverId, house })
  });
}

export function loginWithCode(code: string, redirectUri: string) {
  return fetchJson<{
    status: string;
    token: { access_token: string; expires_at: number; token_type: string };
    user: { id: string; username?: string; avatar?: string };
    guild_ids: number[];
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ code, redirect_uri: redirectUri })
  });
}
