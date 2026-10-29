import { request } from "../http";
import type { EmojiTriggerSettings } from "../types";

export async function getEmojiTriggers(serverId: string): Promise<EmojiTriggerSettings> {
  const data = await request<EmojiTriggerSettings>(`/api/servers/${serverId}/emoji-triggers`);
  return { triggers: data.triggers ?? [], requireExact: Boolean(data.requireExact) };
}

export async function updateEmojiTriggers(
  serverId: string,
  settings: EmojiTriggerSettings
): Promise<EmojiTriggerSettings> {
  const data = await request<EmojiTriggerSettings>(`/api/servers/${serverId}/emoji-triggers`, {
    method: "PATCH",
    body: settings,
  });
  return { triggers: data.triggers ?? [], requireExact: Boolean(data.requireExact) };
}
