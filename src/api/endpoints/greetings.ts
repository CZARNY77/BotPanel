import { request } from "../http";
import type { GreetingSettings } from "../types";

export type GreetingKind = "welcome" | "farewell";

export async function getGreeting(serverId: string, kind: GreetingKind): Promise<GreetingSettings> {
  const data = await request<Record<GreetingKind, GreetingSettings>>(
    `/api/servers/${serverId}/${kind}`
  );
  return data[kind];
}

export async function updateGreeting(
  serverId: string,
  kind: GreetingKind,
  settings: GreetingSettings
): Promise<GreetingSettings> {
  const data = await request<Record<GreetingKind, GreetingSettings>>(
    `/api/servers/${serverId}/${kind}`,
    { method: "PATCH", body: settings }
  );
  return data[kind];
}
