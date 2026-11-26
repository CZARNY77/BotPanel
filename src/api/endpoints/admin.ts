import { request } from "../http";
import type { AdminLogEntry, AdminServer, ApiAdminServer, LogSource } from "../types";

/** K17: limit 1–200, offset >= 0. */
export async function getAdminLogs(params: {
  source: LogSource;
  level?: string;
  limit: number;
  offset: number;
}): Promise<AdminLogEntry[]> {
  const query = new URLSearchParams({
    source: params.source,
    limit: String(params.limit),
    offset: String(params.offset),
  });
  if (params.level) {
    query.set("level", params.level);
  }
  const data = await request<{ logs: AdminLogEntry[] }>(`/api/admin/logs?${query.toString()}`);
  return data.logs ?? [];
}

export async function getAdminUsers(): Promise<string[]> {
  const data = await request<{ users: string[] }>("/api/admin/users");
  return data.users ?? [];
}

export async function addAdminUser(userId: string): Promise<string[]> {
  const data = await request<{ users: string[] }>("/api/admin/users", {
    method: "POST",
    body: { userId },
  });
  return data.users ?? [];
}

export async function removeAdminUser(userId: string): Promise<string[]> {
  const data = await request<{ users: string[] }>(`/api/admin/users/${userId}`, {
    method: "DELETE",
  });
  return data.users ?? [];
}

const toAdminServer = (raw: ApiAdminServer): AdminServer => ({
  id: String(raw.id),
  name: raw.name,
  iconUrl: raw.icon_url,
  memberCount: raw.member_count,
  ownerId: raw.owner_id,
});

/** Every server the bot is on (panel admins only, 403 otherwise). */
export async function getAdminServers(): Promise<{ servers: AdminServer[]; total: number }> {
  const data = await request<{ servers: ApiAdminServer[]; total: number }>("/api/admin/servers");
  const servers = (data.servers ?? []).map(toAdminServer);
  return { servers, total: data.total ?? servers.length };
}
