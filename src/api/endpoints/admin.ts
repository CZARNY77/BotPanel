import { request } from "../http";
import type { AdminLogEntry, LogSource } from "../types";

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
