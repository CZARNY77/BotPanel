import * as db from "./data";
import { clone, expectType, fail, intParam, isRecord, isValidTimezone, ok, strictBody, type MockRoute } from "./core";
import { requireGuild } from "./routesServer";
import type { EventItem, VoicePresenceLog } from "../types";

const EVENT_FIELDS = ["title", "description", "date", "time", "intervalDays", "channelId", "roleId", "durationMinutes", "timezone"];

/** Mirrors sanitize_event_payload in the bot (same messages). */
const sanitizeEvent = (body: unknown, serverId: string) => {
  const input = strictBody(body, EVENT_FIELDS);
  const title = String(input.title ?? "").trim();
  const date = String(input.date ?? "").trim();
  const time = String(input.time ?? "").trim();
  if (!title) fail("Missing event title.");
  if (!date) fail("Missing event date.");
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(date)) fail("Event date must use dd.mm.yyyy format.");
  if (!time) fail("Missing event time.");
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) fail("Event time must use HH:MM format.");
  if (!input.channelId) fail("Missing channel id.");
  const intervalDays = Number(input.intervalDays ?? 0);
  if (!Number.isInteger(intervalDays) || intervalDays < 0) fail("Repeat interval must be zero or a positive number.");
  const durationMinutes = Number(input.durationMinutes ?? 0);
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) fail("Duration must be a positive number.");
  if (input.timezone !== undefined && (typeof input.timezone !== "string" || !isValidTimezone(input.timezone))) {
    fail("Unknown timezone.");
  }
  return {
    title,
    description: String(input.description ?? "").trim(),
    date,
    time,
    intervalDays,
    channelId: String(input.channelId),
    roleId: String(input.roleId ?? ""),
    durationMinutes: Math.round(durationMinutes),
    timezone: (input.timezone as string | undefined) ?? db.settings[serverId]?.timezone ?? db.DEFAULT_TIMEZONE,
  };
};

const publicEvent = (e: db.MockEvent): EventItem => {
  const { signupList: _signupList, guildId: _guildId, ...rest } = db.withCounts(e);
  return clone(rest);
};

const findEvent = (serverId: string, eventId: string) => {
  const found = db.events.find((e) => e.id === eventId);
  if (!found) fail("Event not found", 404);
  if (found!.guildId !== serverId) fail("Event does not belong to this server", 403);
  return found as db.MockEvent;
};

const settingsRoutes = <T extends object>(
  path: string,
  key: string,
  store: Record<string, T>,
  defaults: T,
  validate: (input: Record<string, unknown>) => void
): MockRoute[] => [
  {
    method: "GET",
    pattern: `/api/servers/:id/${path}`,
    handler: ({ params }) => {
      const id = requireGuild(params.id);
      return ok({ guild_id: id, [key]: clone(store[id] ?? defaults) });
    },
  },
  {
    method: "PATCH",
    pattern: `/api/servers/:id/${path}`,
    handler: ({ params, body }) => {
      const id = requireGuild(params.id);
      const input = strictBody(body, Object.keys(defaults));
      validate(input);
      store[id] = { ...(store[id] ?? defaults), ...input } as T;
      return ok({ guild_id: id, [key]: clone(store[id]) });
    },
  },
];

const stringArray = (input: Record<string, unknown>, key: string) => {
  expectType(input, key, "array");
  if (Array.isArray(input[key]) && (input[key] as unknown[]).some((v) => typeof v !== "string")) {
    fail(`Field ${key} must be a list of ids.`);
  }
};

export const featureRoutes: MockRoute[] = [
  // ---- events (K5–K8)
  {
    method: "GET",
    pattern: "/api/servers/:id/events",
    handler: ({ params, query }) => {
      const id = requireGuild(params.id);
      const status = query.get("status") ?? "all";
      if (status !== "all" && status !== "active") fail("Invalid status filter.");
      const list = db.events.filter((e) => e.guildId === id && (status === "all" || e.active));
      return ok({ guild_id: id, events: list.map(publicEvent) });
    },
  },
  {
    method: "POST",
    pattern: "/api/servers/:id/events",
    handler: ({ params, body }) => {
      const id = requireGuild(params.id);
      const clean = sanitizeEvent(body, id);
      const created: db.MockEvent = db.withCounts({
        ...clean,
        id: `evt_${Date.now()}`,
        repeating: clean.intervalDays > 0,
        messageId: String(1300000000000000000 + db.events.length),
        active: true,
        nextEventId: null,
        signups: { yes: 0, no: 0, maybe: 0 },
        signupList: [],
        guildId: id,
      });
      db.events.unshift(created);
      return ok({ guild_id: id, event: publicEvent(created) }, 201);
    },
  },
  {
    method: "PATCH",
    pattern: "/api/servers/:id/events/:eventId",
    handler: ({ params, body }) => {
      const id = requireGuild(params.id);
      const current = findEvent(id, params.eventId);
      if (!current.active) fail("Event already finished", 409);
      const clean = sanitizeEvent(body, id);
      Object.assign(current, clean);
      return ok({ guild_id: id, event: publicEvent(current) });
    },
  },
  {
    method: "DELETE",
    pattern: "/api/servers/:id/events/:eventId",
    handler: ({ params }) => {
      const id = requireGuild(params.id);
      const current = findEvent(id, params.eventId);
      db.events.splice(db.events.indexOf(current), 1);
      return ok({ guild_id: id, event_id: current.id });
    },
  },
  {
    method: "POST",
    pattern: "/api/servers/:id/events/:eventId/ping",
    handler: ({ params, body }) => {
      const id = requireGuild(params.id);
      const current = findEvent(id, params.eventId);
      const input = strictBody(body, ["mode"]);
      const mode = input.mode;
      if (mode !== "unchecked" && mode !== "tentative" && mode !== "declined") fail("Missing ping mode");
      if (mode === "unchecked" && !current.roleId) fail("Event has no role to ping.");
      const counts = db.withCounts(current).signups;
      const pinged = mode === "unchecked" ? 5 : mode === "tentative" ? counts.maybe : counts.no;
      return ok({ guild_id: id, event_id: current.id, mode, pinged });
    },
  },
  {
    method: "GET",
    pattern: "/api/servers/:id/events/:eventId/signups",
    handler: ({ params }) => {
      const id = requireGuild(params.id);
      const current = findEvent(id, params.eventId);
      return ok({ eventId: current.id, signups: clone(current.signupList), unchecked: current.roleId ? 5 : null });
    },
  },
  // ---- voice presence (K9, K10)
  {
    method: "GET",
    pattern: "/api/servers/:id/voice-presence/settings",
    handler: ({ params }) => {
      const id = requireGuild(params.id);
      return ok({ guild_id: id, settings: clone(db.presenceSettings[id] ?? { manualChannelIds: [], manualName: "", schedules: [] }) });
    },
  },
  {
    method: "PATCH",
    pattern: "/api/servers/:id/voice-presence/settings",
    handler: ({ params, body }) => {
      const id = requireGuild(params.id);
      const input = strictBody(body, ["manualChannelIds", "manualName", "schedules"]);
      stringArray(input, "manualChannelIds");
      expectType(input, "manualName", "string");
      expectType(input, "schedules", "array");
      for (const s of (input.schedules as unknown[]) ?? []) {
        const sched = strictBody(s, ["id", "name", "enabled", "dayOfWeek", "time", "channelIds", "lastRun"]);
        if (!Number.isInteger(sched.dayOfWeek) || (sched.dayOfWeek as number) < 0 || (sched.dayOfWeek as number) > 6) fail("Invalid day of week.");
        if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(sched.time))) fail("Schedule time must use HH:MM format.");
      }
      const current = db.presenceSettings[id] ?? { manualChannelIds: [], manualName: "", schedules: [] };
      db.presenceSettings[id] = { ...current, ...(input as object) };
      return ok({ guild_id: id, settings: clone(db.presenceSettings[id]) });
    },
  },
  {
    method: "POST",
    pattern: "/api/servers/:id/voice-presence/run",
    handler: ({ params, body }) => {
      const id = requireGuild(params.id);
      const input = strictBody(body, ["channelIds", "name"]);
      stringArray(input, "channelIds");
      const all = db.metadata[id]?.voice_channels ?? [];
      const ids = (input.channelIds as string[] | undefined) ?? [];
      const channels = ids.length ? all.filter((c) => ids.includes(c.id)) : all;
      if (!channels.length) fail(ids.length ? "No matching voice channels found." : "No voice channels found.");
      const members = channels.length ? [{ id: "101", name: "Czarny", channelId: channels[0].id, channelName: channels[0].name }] : [];
      const snapshot: VoicePresenceLog = {
        id: `log-${Date.now()}`,
        createdAt: new Date().toISOString(),
        source: "manual",
        scheduleId: null,
        name: String(input.name ?? "") || null,
        channels: clone(channels),
        members,
        totalMembers: members.length,
        totalChannels: channels.length,
      };
      db.presenceLogs[id] = [snapshot, ...(db.presenceLogs[id] ?? [])];
      return ok({ guild_id: id, snapshot: { ...clone(snapshot), guild_id: id } });
    },
  },
  {
    method: "GET",
    pattern: "/api/servers/:id/voice-presence/logs",
    handler: ({ params, query }) => {
      const id = requireGuild(params.id);
      const limit = intParam(query, "limit", 20, 1, 100);
      const offset = intParam(query, "offset", 0, 0, Number.MAX_SAFE_INTEGER);
      return ok({ guild_id: id, logs: clone((db.presenceLogs[id] ?? []).slice(offset, offset + limit)) });
    },
  },
  {
    method: "DELETE",
    pattern: "/api/servers/:id/voice-presence/logs/:logId",
    handler: ({ params }) => {
      const id = requireGuild(params.id);
      const logs = db.presenceLogs[id] ?? [];
      if (!logs.some((l) => l.id === params.logId)) fail("Log not found", 404);
      db.presenceLogs[id] = logs.filter((l) => l.id !== params.logId);
      return ok({ guild_id: id, log_id: params.logId });
    },
  },
  // ---- emoji triggers
  {
    method: "GET",
    pattern: "/api/servers/:id/emoji-triggers",
    handler: ({ params }) => {
      const id = requireGuild(params.id);
      const value = db.emojiTriggers[id] ?? { triggers: [], requireExact: false };
      return ok({ guild_id: id, ...clone(value) });
    },
  },
  {
    method: "PATCH",
    pattern: "/api/servers/:id/emoji-triggers",
    handler: ({ params, body }) => {
      const id = requireGuild(params.id);
      const input = strictBody(body, ["triggers", "requireExact"]);
      expectType(input, "requireExact", "boolean");
      if (!Array.isArray(input.triggers)) fail("Triggers must be a list.");
      for (const t of input.triggers as unknown[]) {
        const trig = strictBody(t, ["emoji", "imageUrls"]);
        if (!String(trig.emoji ?? "").trim()) fail("Every trigger needs an emoji.");
        stringArray(trig, "imageUrls");
        if (!(trig.imageUrls as string[]).every((u) => /^https?:\/\//.test(u))) fail("Image URLs must start with http(s)://");
      }
      db.emojiTriggers[id] = { triggers: clone(input.triggers) as never, requireExact: Boolean(input.requireExact) };
      return ok({ guild_id: id, ...clone(db.emojiTriggers[id]) });
    },
  },
  // ---- role reactions
  {
    method: "GET",
    pattern: "/api/servers/:id/role-reactions",
    handler: ({ params }) => {
      const id = requireGuild(params.id);
      return ok({ guild_id: id, role_reactions: clone(db.roleReactions[id] ?? { enabled: false, messages: [] }) });
    },
  },
  {
    method: "PATCH",
    pattern: "/api/servers/:id/role-reactions",
    handler: ({ params, body }) => {
      const id = requireGuild(params.id);
      const input = strictBody(body, ["enabled", "messages"]);
      expectType(input, "enabled", "boolean");
      if (!Array.isArray(input.messages)) fail("Messages must be a list.");
      const messages = (input.messages as unknown[]).map((m, index) => {
        const msg = strictBody(m, ["key", "channelId", "type", "message", "embed", "pairs", "messageId"]);
        if (isRecord(msg.embed)) strictBody(msg.embed, ["title", "description", "color"]);
        if (!Array.isArray(msg.pairs)) fail("Pairs must be a list.");
        (msg.pairs as unknown[]).forEach((p) => strictBody(p, ["emoji", "roleId"]));
        return { ...clone(msg), messageId: msg.messageId || String(1300000000000000500 + index) };
      });
      db.roleReactions[id] = { enabled: Boolean(input.enabled), messages: messages as never };
      return ok({ guild_id: id, role_reactions: clone(db.roleReactions[id]) });
    },
  },
  // ---- moderation (K11–K15)
  ...settingsRoutes("warthog", "warthog", db.warthog, db.warthogDefaults, (input) => {
    expectType(input, "enabled", "boolean");
    expectType(input, "roleLock", "boolean");
    stringArray(input, "allowedRoles");
    stringArray(input, "whitelist");
    expectType(input, "bounceMessage", "string");
    expectType(input, "bounceGif", "string");
  }),
  ...settingsRoutes("ban-dm", "ban_dm", db.banDm, db.banDmDefaults, (input) => {
    expectType(input, "enabled", "boolean");
    expectType(input, "message", "string");
    expectType(input, "unbanMessage", "string");
  }),
  ...settingsRoutes("anti-spam", "anti_spam", db.antiSpam, db.antiSpamDefaults, (input) => {
    expectType(input, "enabled", "boolean");
    if ("action" in input && !["auto", "timeout", "delete"].includes(String(input.action))) fail("Invalid action.");
    stringArray(input, "exemptRoleIds");
    expectType(input, "logChannelId", "string");
  }),
  ...settingsRoutes("timeout-dm", "timeout_dm", db.timeoutDm, db.timeoutDmDefaults, (input) => {
    expectType(input, "enabled", "boolean");
    expectType(input, "message", "string");
    if (typeof input.message === "string" && input.message.length > 1500) fail("Message is too long (max 1500 characters).");
  }),
];
