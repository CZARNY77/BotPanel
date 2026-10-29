import { request } from "../http";
import type { RoleReactionSettings } from "../types";

export async function getRoleReactions(serverId: string): Promise<RoleReactionSettings> {
  const data = await request<{ role_reactions: RoleReactionSettings }>(
    `/api/servers/${serverId}/role-reactions`
  );
  return data.role_reactions;
}

export async function updateRoleReactions(
  serverId: string,
  settings: RoleReactionSettings
): Promise<RoleReactionSettings> {
  const data = await request<{ role_reactions: RoleReactionSettings }>(
    `/api/servers/${serverId}/role-reactions`,
    { method: "PATCH", body: settings }
  );
  return data.role_reactions;
}
