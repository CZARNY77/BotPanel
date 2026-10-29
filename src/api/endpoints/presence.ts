import { request } from "../http";
import type { VoicePresenceLog, VoicePresenceSettings } from "../types";

const base = (serverId: string) => `/api/servers/${serverId}/voice-presence`;

/** K9 */
export async function getPresenceSettings(serverId: string): Promise<VoicePresenceSettings> {
  const data = await request<{ settings: VoicePresenceSettings }>(`${base(serverId)}/settings`);
  return data.settings;
}

export async function updatePresenceSettings(
  serverId: string,
  settings: VoicePresenceSettings
): Promise<VoicePresenceSettings> {
  const data = await request<{ settings: VoicePresenceSettings }>(`${base(serverId)}/settings`, {
    method: "PATCH",
    body: settings,
  });
  return data.settings;
}

export async function runPresence(
  serverId: string,
  channelIds: string[],
  name: string
): Promise<VoicePresenceLog> {
  const data = await request<{ snapshot: VoicePresenceLog }>(`${base(serverId)}/run`, {
    method: "POST",
    body: { channelIds, name },
  });
  return data.snapshot;
}

/** K10: limit 1–100. */
export async function getPresenceLogs(
  serverId: string,
  limit = 20,
  offset = 0
): Promise<VoicePresenceLog[]> {
  const data = await request<{ logs: VoicePresenceLog[] }>(
    `${base(serverId)}/logs?limit=${limit}&offset=${offset}`
  );
  return data.logs ?? [];
}

export async function deletePresenceLog(serverId: string, logId: string): Promise<void> {
  await request<{ log_id: string }>(`${base(serverId)}/logs/${logId}`, { method: "DELETE" });
}
