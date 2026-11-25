import type { EventInput, EventItem } from "../../api/types";
export { dateParts } from "../../components/ui/DateTile";

export type EventForm = {
  title: string;
  description: string;
  date: string; // yyyy-mm-dd (input type=date)
  time: string;
  intervalDays: string;
  durationHours: string;
  channelId: string;
  roleId: string;
  timezone: string;
};

export const emptyForm = (timezone: string): EventForm => ({
  title: "",
  description: "",
  date: "",
  time: "20:00",
  intervalDays: "0",
  durationHours: "1",
  channelId: "",
  roleId: "",
  timezone,
});

/** dd.mm.yyyy (bot) -> yyyy-mm-dd (input) */
export const fromPanelDate = (value: string) => {
  const [day, month, year] = value.split(".");
  return day && month && year ? `${year}-${month}-${day}` : "";
};

/** yyyy-mm-dd (input) -> dd.mm.yyyy (bot) */
export const toPanelDate = (value: string) => {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}.${month}.${year}` : "";
};

export const formFromEvent = (event: EventItem): EventForm => ({
  title: event.title,
  description: event.description ?? "",
  date: fromPanelDate(event.date),
  time: event.time,
  intervalDays: String(Math.max(0, event.intervalDays ?? 0)),
  durationHours: event.durationMinutes ? String(Math.max(0.5, event.durationMinutes / 60)) : "1",
  channelId: event.channelId,
  roleId: event.roleId,
  timezone: event.timezone,
});

/** Same rules as before the rebuild; returns the API body or an error message. */
export const toInput = (form: EventForm): EventInput | string => {
  if (!form.title.trim()) return "Event title is required.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) return "Pick a valid date.";
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(form.time)) return "Time must be in 24h format (HH:MM).";
  if (!form.channelId) return "Select a channel for the event.";
  const hours = Number.parseFloat(form.durationHours);
  if (!Number.isFinite(hours) || hours <= 0) return "Duration must be a positive number of hours.";
  const interval = Number.parseInt(form.intervalDays, 10);
  if (!Number.isFinite(interval) || interval < 0) return "Repeat interval must be zero or a positive number.";
  return {
    title: form.title.trim(),
    description: form.description,
    date: toPanelDate(form.date),
    time: form.time,
    intervalDays: interval,
    channelId: form.channelId,
    roleId: form.roleId,
    durationMinutes: Math.round(hours * 60),
    ...(form.timezone ? { timezone: form.timezone } : {}),
  };
};

export const repeatLabel = (days: number) =>
  days <= 0 ? "One-time" : days === 1 ? "Daily" : days === 7 ? "Weekly" : days === 14 ? "Every 2 weeks" : `Every ${days} days`;

export const durationLabel = (minutes: number) =>
  minutes % 60 === 0 ? `${minutes / 60} h` : minutes > 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`;

/** All IANA zones the browser knows (for the time zone picker). */
export const timeZones = (): string[] => {
  const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
  return intl.supportedValuesOf?.("timeZone") ?? ["UTC", "Europe/Warsaw", "Europe/London", "America/New_York", "America/Chicago"];
};
