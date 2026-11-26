import * as db from "./data";
import { adminServers } from "./adminData";
import {
  clone,
  expectType,
  fail,
  intParam,
  isRecord,
  isValidTimezone,
  ok,
  strictBody,
  type MockRoute,
} from "./core";
import type { GreetingSettings } from "../types";

const LOGGED_OUT_KEY = "conqbot.mock.loggedOut";

const isLoggedOut = () => {
  try {
    return sessionStorage.getItem(LOGGED_OUT_KEY) === "1";
  } catch {
    return false;
  }
};

export const mockLogin = () => {
  try {
    sessionStorage.removeItem(LOGGED_OUT_KEY);
  } catch {
    /* ignore */
  }
};

/** Same checks as the bot: session, admin of the guild, bot present. */
export const requireGuild = (id: string) => {
  if (isLoggedOut()) fail("Not authenticated", 401);
  const server = db.servers.find((item) => item.id === id);
  // Panel admins may open any server the bot is on, also outside their own list.
  if (!server && db.mockUser.is_admin_panel && adminServers.some((item) => item.id === id)) return id;
  if (!server) fail("Missing admin permissions for this guild", 403);
  if (!server?.bot_present) fail("ConqBot cannot find this discord", 404);
  return id;
};

const greetingRoutes = (kind: "welcome" | "farewell"): MockRoute[] => {
  const store = kind === "welcome" ? db.welcome : db.farewell;
  return [
    {
      method: "GET",
      pattern: `/api/servers/:id/${kind}`,
      handler: ({ params }) => {
        const id = requireGuild(params.id);
        return ok({ guild_id: id, [kind]: clone(store[id] ?? db.greetingDefaults[kind]) });
      },
    },
    {
      method: "PATCH",
      pattern: `/api/servers/:id/${kind}`,
      handler: ({ params, body }) => {
        const id = requireGuild(params.id);
        const input = strictBody(body, ["enabled", "channelId", "type", "text", "embed"]);
        expectType(input, "enabled", "boolean");
        expectType(input, "channelId", "string");
        expectType(input, "text", "string");
        expectType(input, "embed", "object");
        if ("type" in input && input.type !== "text" && input.type !== "embed") fail("Invalid message type.");
        if (isRecord(input.embed)) {
          strictBody(input.embed, ["title", "description", "color", "showAvatar"]);
        }
        const current = store[id] ?? db.greetingDefaults[kind];
        const merged = {
          ...current,
          ...input,
          embed: { ...current.embed, ...(isRecord(input.embed) ? input.embed : {}) },
        } as GreetingSettings;
        store[id] = merged;
        return ok({ guild_id: id, [kind]: clone(merged) });
      },
    },
  ];
};

export const serverRoutes: MockRoute[] = [
  {
    method: "GET",
    pattern: "/api/me",
    handler: () => {
      if (isLoggedOut()) fail("Not authenticated", 401);
      return ok({ user: clone(db.mockUser) });
    },
  },
  {
    method: "POST",
    pattern: "/auth/logout",
    handler: () => {
      try {
        sessionStorage.setItem(LOGGED_OUT_KEY, "1");
      } catch {
        /* ignore */
      }
      return ok({ loggedOut: true });
    },
  },
  {
    method: "GET",
    pattern: "/api/health",
    handler: () => ({ status: 200, headers: {}, json: { status: "ok", ready: true, initialized: true, guilds: 2 } }),
  },
  {
    method: "GET",
    pattern: "/api/servers",
    handler: () => {
      if (isLoggedOut()) fail("Not authenticated", 401);
      return ok({ servers: clone(db.servers) });
    },
  },
  {
    method: "GET",
    pattern: "/api/invite",
    handler: () => ok({ guild_id: null, invite_url: "https://discord.com/oauth2/authorize?client_id=123&scope=bot%20applications.commands" }),
  },
  {
    method: "GET",
    pattern: "/api/servers/:id/invite",
    handler: ({ params }) => {
      if (!db.servers.some((s) => s.id === params.id)) fail("Missing admin permissions for this guild", 403);
      return ok({
        guild_id: params.id,
        invite_url: `https://discord.com/oauth2/authorize?client_id=123&scope=bot%20applications.commands&guild_id=${params.id}`,
      });
    },
  },
  {
    method: "GET",
    pattern: "/api/servers/:id/metadata",
    handler: ({ params }) => {
      const id = requireGuild(params.id);
      return ok(clone(db.metadata[id] ?? { guild_id: id, channels: [], voice_channels: [], roles: [] }));
    },
  },
  {
    method: "GET",
    pattern: "/api/get_emojis",
    handler: ({ query }) => {
      const guildId = query.get("guild_id");
      if (!guildId) fail("Missing guild id");
      const id = requireGuild(guildId as string);
      return ok({ guild_id: id, emojis: clone(db.emojis[id] ?? []) });
    },
  },
  {
    method: "GET",
    pattern: "/api/servers/:id/settings",
    handler: ({ params }) => {
      const id = requireGuild(params.id);
      return ok({ guild_id: id, settings: { timezone: db.settings[id]?.timezone ?? db.DEFAULT_TIMEZONE } });
    },
  },
  {
    method: "PATCH",
    pattern: "/api/servers/:id/settings",
    handler: ({ params, body }) => {
      const id = requireGuild(params.id);
      const input = strictBody(body, ["timezone"]);
      if (typeof input.timezone !== "string" || !isValidTimezone(input.timezone)) fail("Unknown timezone.");
      db.settings[id] = { timezone: input.timezone as string };
      return ok({ guild_id: id, settings: { ...db.settings[id] } });
    },
  },
  {
    method: "GET",
    pattern: "/api/servers/:id/autorole",
    handler: ({ params }) => {
      const id = requireGuild(params.id);
      return ok({ guild_id: id, autorole: clone(db.autorole[id] ?? { enabled: false, roleId: "" }) });
    },
  },
  {
    method: "PATCH",
    pattern: "/api/servers/:id/autorole",
    handler: ({ params, body }) => {
      const id = requireGuild(params.id);
      const input = strictBody(body, ["enabled", "roleId"]);
      expectType(input, "enabled", "boolean");
      expectType(input, "roleId", "string");
      db.autorole[id] = { ...(db.autorole[id] ?? { enabled: false, roleId: "" }), ...input };
      return ok({ guild_id: id, autorole: clone(db.autorole[id]) });
    },
  },
  ...greetingRoutes("welcome"),
  ...greetingRoutes("farewell"),
  {
    method: "POST",
    pattern: "/api/logs",
    handler: ({ body }) => {
      const input = strictBody(body, ["level", "message", "context", "logger"]);
      if (typeof input.message !== "string" || !input.message.trim()) fail("Missing log message");
      return ok({ logged: true });
    },
  },
  {
    method: "POST",
    pattern: "/api/uploads",
    handler: ({ body }) => {
      if (!(body instanceof FormData)) fail("Expected multipart form data.");
      const form = body as FormData;
      const guildId = form.get("guild_id");
      if (typeof guildId !== "string" || !guildId) fail("Missing guild id");
      const id = requireGuild(guildId as string);
      if (!(form.get("file") instanceof File)) fail("Missing file");
      const used = db.uploadsCount[id] ?? 0;
      if (used >= 50) fail("Upload limit reached for this server.");
      db.uploadsCount[id] = used + 1;
      const uploadId = `up${Date.now()}`;
      return ok(
        { upload_id: uploadId, path: `/api/uploads/${uploadId}`, url: `https://placehold.co/480x270/1f1f1f/f97316?text=${uploadId}` },
        201
      );
    },
  },
  {
    method: "GET",
    pattern: "/api/admin/logs",
    handler: ({ query }) => {
      if (!db.mockUser.is_admin_panel) fail("Forbidden", 403);
      const limit = intParam(query, "limit", 50, 1, 200);
      const offset = intParam(query, "offset", 0, 0, Number.MAX_SAFE_INTEGER);
      const source = query.get("source");
      const level = query.get("level")?.toUpperCase();
      const list = db.adminLogs.filter(
        (log) => (!source || log.source === source) && (!level || log.level === level)
      );
      return ok({ logs: clone(list.slice(offset, offset + limit)), offset, limit });
    },
  },
  {
    method: "GET",
    pattern: "/api/admin/servers",
    handler: () => {
      if (isLoggedOut()) fail("Not authenticated", 401);
      if (!db.mockUser.is_admin_panel) fail("Forbidden", 403);
      return ok({ servers: clone(adminServers), total: adminServers.length });
    },
  },
  { method: "GET", pattern: "/api/admin/users", handler: () => ok({ users: [...db.adminUsers] }) },
  {
    method: "POST",
    pattern: "/api/admin/users",
    handler: ({ body }) => {
      const input = strictBody(body, ["userId"]);
      const userId = String(input.userId ?? "").trim();
      if (!/^\d{5,20}$/.test(userId)) fail("Missing user id");
      if (!db.adminUsers.includes(userId)) db.adminUsers.push(userId);
      return ok({ users: [...db.adminUsers].sort() });
    },
  },
  {
    method: "DELETE",
    pattern: "/api/admin/users/:userId",
    handler: ({ params }) => {
      if (params.userId === db.mockUser.id) fail("User is pinned via ADMIN_PANEL_USER_IDS");
      const index = db.adminUsers.indexOf(params.userId);
      if (index >= 0) db.adminUsers.splice(index, 1);
      return ok({ users: [...db.adminUsers].sort() });
    },
  },
];
