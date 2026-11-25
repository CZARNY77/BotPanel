import { request } from "../http";
import type {
  ApiMetadata,
  ApiServer,
  AutoRoleSettings,
  EmojiOption,
  HealthPayload,
  Server,
  ServerMetadata,
  ServerSettings,
} from "../types";

// B-15: Discord sends permissions as a string; ADMINISTRATOR = 0x8.
const hasAdminBit = (permissions: string | number) => {
  try {
    return (BigInt(permissions) & 8n) === 8n;
  } catch {
    return false;
  }
};

const toServer = (raw: ApiServer): Server => ({
  id: String(raw.id),
  name: raw.name,
  iconUrl: raw.icon_url,
  role: raw.owner ? "owner" : hasAdminBit(raw.permissions) ? "admin" : "manager",
  botPresent: raw.bot_present,
  memberCount: raw.member_count,
});

/** K2: servers the user administers, with and without the bot. */
export async function getServers(): Promise<Server[]> {
  const data = await request<{ servers: ApiServer[] }>("/api/servers");
  return (data.servers ?? []).map(toServer);
}

/** K18 (raw payload, no envelope). */
export async function getHealth(): Promise<HealthPayload> {
  return request<HealthPayload>("/api/health", { raw: true });
}

export async function getInviteUrl(serverId?: string): Promise<string> {
  const path = serverId ? `/api/servers/${serverId}/invite` : "/api/invite";
  const data = await request<{ invite_url: string }>(path);
  return data.invite_url ?? "";
}

/** Opens the bot invite in a new tab. */
export const openInvite = async (serverId?: string) => {
  const url = await getInviteUrl(serverId);
  if (!url) throw new Error("Invite link unavailable. Try again in a moment.");
  window.open(url, "_blank", "noopener,noreferrer");
};

const stripVoicePrefix = (value: string) => value.replace(/^voice\s*-\s*/i, "").trim() || value;

export async function getMetadata(serverId: string): Promise<ServerMetadata> {
  const data = await request<ApiMetadata>(`/api/servers/${serverId}/metadata`);
  return {
    channels: data.channels ?? [],
    voiceChannels: (data.voice_channels ?? []).map((c) => ({ ...c, name: stripVoicePrefix(c.name) })),
    roles: data.roles ?? [],
  };
}

export async function getEmojis(serverId: string): Promise<EmojiOption[]> {
  const data = await request<{ emojis: EmojiOption[] }>(
    `/api/get_emojis?guild_id=${encodeURIComponent(serverId)}`
  );
  return data.emojis ?? [];
}

/** K3 */
export async function getServerSettings(serverId: string): Promise<ServerSettings> {
  const data = await request<{ settings: ServerSettings }>(`/api/servers/${serverId}/settings`);
  return data.settings;
}

/** K4 */
export async function updateServerSettings(
  serverId: string,
  settings: ServerSettings
): Promise<ServerSettings> {
  const data = await request<{ settings: ServerSettings }>(`/api/servers/${serverId}/settings`, {
    method: "PATCH",
    body: { timezone: settings.timezone },
  });
  return data.settings;
}

export async function getAutorole(serverId: string): Promise<AutoRoleSettings> {
  const data = await request<{ autorole: AutoRoleSettings }>(`/api/servers/${serverId}/autorole`);
  return data.autorole;
}

export async function updateAutorole(
  serverId: string,
  settings: AutoRoleSettings
): Promise<AutoRoleSettings> {
  const data = await request<{ autorole: AutoRoleSettings }>(`/api/servers/${serverId}/autorole`, {
    method: "PATCH",
    body: settings,
  });
  return data.autorole;
}
