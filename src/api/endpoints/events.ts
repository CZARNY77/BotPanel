import { request } from "../http";
import type {
  EventInput,
  EventItem,
  EventPingMode,
  EventSignups,
  EventStatusFilter,
} from "../types";

const base = (serverId: string) => `/api/servers/${serverId}/events`;

/** K5 */
export async function getEvents(
  serverId: string,
  status: EventStatusFilter = "all"
): Promise<EventItem[]> {
  const data = await request<{ events: EventItem[] }>(`${base(serverId)}?status=${status}`);
  return data.events ?? [];
}

/** K6 */
export async function createEvent(serverId: string, input: EventInput): Promise<EventItem> {
  const data = await request<{ event: EventItem }>(base(serverId), { method: "POST", body: input });
  return data.event;
}

/** K7: 409 when the event already finished. */
export async function updateEvent(
  serverId: string,
  eventId: string,
  input: EventInput
): Promise<EventItem> {
  const data = await request<{ event: EventItem }>(`${base(serverId)}/${eventId}`, {
    method: "PATCH",
    body: input,
  });
  return data.event;
}

export async function deleteEvent(serverId: string, eventId: string): Promise<string> {
  const data = await request<{ event_id: string }>(`${base(serverId)}/${eventId}`, {
    method: "DELETE",
  });
  return data.event_id ?? eventId;
}

export async function pingEvent(
  serverId: string,
  eventId: string,
  mode: EventPingMode
): Promise<number> {
  const data = await request<{ pinged: number }>(`${base(serverId)}/${eventId}/ping`, {
    method: "POST",
    body: { mode },
  });
  return Number(data.pinged ?? 0);
}

/** K8 */
export async function getEventSignups(serverId: string, eventId: string): Promise<EventSignups> {
  return request<EventSignups>(`${base(serverId)}/${eventId}/signups`);
}
