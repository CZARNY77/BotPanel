import { ApiError, BotEvent, EmojiItem, GuildServer } from "./types";

const API_BASE = "https://conqbot.blcdev.com";
export const API_URL = `${API_BASE}/api`;
export const AUTH_URL = `${API_BASE}/auth/discord`;

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const error: ApiError = new Error(payload?.message || "Request failed");
    error.status = response.status;
    throw error;
  }

  return payload as T;
}

export function getUserServers() {
  return fetchJson<GuildServer[]>("/user_servers");
}

export function getServerVerification(serverId: string) {
  const query = new URLSearchParams({ server_id: serverId }).toString();
  return fetchJson<{ verified: boolean; message?: string }>(`/server_verification?${query}`);
}

export function getEmojis(serverId: string) {
  const query = new URLSearchParams({ server_id: serverId }).toString();
  return fetchJson<EmojiItem[]>(`/get_emojis?${query}`);
}

export function createEvent(event: BotEvent & { serverId: string }) {
  return fetchJson<{ ok: boolean; id?: string }>("/create_event", {
    method: "POST",
    body: JSON.stringify(event)
  });
}

export function changeHouseName(serverId: string, house: string) {
  return fetchJson<{ ok: boolean; house: string }>("/change_house_name", {
    method: "POST",
    body: JSON.stringify({ serverId, house })
  });
}
