import { API_BASE, ApiError, request } from "../http";
import type { ApiUser, User } from "../types";

export const authUrl = `${API_BASE}/auth/discord`;

const toUser = (raw: ApiUser): User => ({
  id: String(raw.id),
  username: raw.global_name || raw.username || "User",
  avatarUrl: raw.avatar
    ? `https://cdn.discordapp.com/avatars/${raw.id}/${raw.avatar}.png`
    : undefined,
  isAdminPanel: Boolean(raw.is_admin_panel),
});

export async function getMe(): Promise<User | null> {
  try {
    const data = await request<{ user: ApiUser }>("/api/me");
    return data.user ? toUser(data.user) : null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

/** K1: invalidates the session on the bot side. */
export async function logout(): Promise<void> {
  await request<{ loggedOut: boolean }>("/auth/logout", { method: "POST" });
}

export async function sendClientLog(
  level: string,
  message: string,
  context?: Record<string, unknown>
): Promise<void> {
  await request<{ logged: boolean }>("/api/logs", {
    method: "POST",
    body: { level, message, context, logger: "botpanel" },
  });
}
