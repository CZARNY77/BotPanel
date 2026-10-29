import { request } from "../http";
import type {
  AntiSpamSettings,
  BanDmSettings,
  TimeoutDmSettings,
  WarthogSettings,
} from "../types";

// Each module lives under its own envelope key (kept for compatibility, see contract ch. 6).
const make = <T, K extends string>(path: string, key: K) => ({
  get: async (serverId: string): Promise<T> => {
    const data = await request<Record<K, T>>(`/api/servers/${serverId}/${path}`);
    return data[key];
  },
  update: async (serverId: string, settings: Partial<T>): Promise<T> => {
    const data = await request<Record<K, T>>(`/api/servers/${serverId}/${path}`, {
      method: "PATCH",
      body: settings,
    });
    return data[key];
  },
});

export const warthogApi = make<WarthogSettings, "warthog">("warthog", "warthog");
/** K15 */
export const banDmApi = make<BanDmSettings, "ban_dm">("ban-dm", "ban_dm");
/** K13/K14 */
export const antiSpamApi = make<AntiSpamSettings, "anti_spam">("anti-spam", "anti_spam");
/** K11/K12 */
export const timeoutDmApi = make<TimeoutDmSettings, "timeout_dm">("timeout-dm", "timeout_dm");
