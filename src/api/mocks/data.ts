// Mock state, shaped exactly like the bot's payloads (contract ch. 6).
import type {
  AdminLogEntry,
  AntiSpamSettings,
  ApiMetadata,
  ApiServer,
  AutoRoleSettings,
  BanDmSettings,
  EmojiOption,
  EmojiTriggerSettings,
  EventItem,
  GreetingSettings,
  RoleReactionSettings,
  SignupStatus,
  TimeoutDmSettings,
  VoicePresenceLog,
  VoicePresenceSettings,
  WarthogSettings,
} from "../types";

export const DEFAULT_TIMEZONE = "Europe/Warsaw";

export const mockUser = {
  id: "1122334455",
  username: "czarny",
  global_name: "Czarny",
  avatar: null,
  is_admin_panel: true,
};

export const servers: ApiServer[] = [
  { id: "9001", name: "Conq Warriors", icon_url: null, owner: true, permissions: "2147483647", bot_present: true, member_count: 148 },
  { id: "9002", name: "Regiment West", icon_url: null, owner: false, permissions: "8", bot_present: true, member_count: 72 },
  { id: "9003", name: "Frontline HQ", icon_url: null, owner: false, permissions: "40", bot_present: false, member_count: null },
];

const meta9001: ApiMetadata = {
  guild_id: "9001",
  channels: [
    { id: "111", name: "#welcome" },
    { id: "222", name: "#announcements" },
    { id: "333", name: "#events" },
    { id: "444", name: "#mod-log" },
  ],
  voice_channels: [
    { id: "888", name: "War Room" },
    { id: "889", name: "Strategy" },
    { id: "890", name: "Voice - Lobby" },
  ],
  roles: [
    { id: "555", name: "@Raid" },
    { id: "666", name: "@Guild" },
    { id: "667", name: "@Officer" },
    { id: "777", name: "@everyone" },
  ],
};

export const metadata: Record<string, ApiMetadata> = {
  "9001": meta9001,
  "9002": { ...meta9001, guild_id: "9002", channels: meta9001.channels.slice(0, 2) },
};

export const emojis: Record<string, EmojiOption[]> = {
  "9001": [
    { id: "<:flame:123456789>", name: "flame", url: "https://cdn.discordapp.com/emojis/123456789.png" },
    { id: "<:shield:987654321>", name: "shield", url: "https://cdn.discordapp.com/emojis/987654321.png" },
  ],
};

export const settings: Record<string, { timezone: string }> = {
  "9001": { timezone: "Europe/Warsaw" },
};

const greeting = (kind: "welcome" | "farewell", channelId: string): GreetingSettings =>
  kind === "welcome"
    ? {
        enabled: true,
        channelId,
        type: "embed",
        text: "Welcome {user} to {server}.",
        embed: { title: "Welcome aboard!", description: "Hey {user}, glad to have you in {server}.", color: "#2f7cff", showAvatar: true },
      }
    : {
        enabled: false,
        channelId,
        type: "embed",
        text: "Goodbye {user}. Thanks for being with {server}.",
        embed: { title: "Farewell!", description: "{user} just left {server}.", color: "#2f7cff", showAvatar: true },
      };

export const greetingDefaults = { welcome: greeting("welcome", ""), farewell: greeting("farewell", "") };
export const welcome: Record<string, GreetingSettings> = { "9001": greeting("welcome", "111") };
export const farewell: Record<string, GreetingSettings> = { "9001": greeting("farewell", "111") };

export const autorole: Record<string, AutoRoleSettings> = { "9001": { enabled: true, roleId: "555" } };

type MockSignup = { userId: string; name: string; status: SignupStatus };
export type MockEvent = EventItem & { signupList: MockSignup[]; guildId: string };

const today = new Date();
const fmt = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
const inDays = (n: number) => new Date(today.getTime() + n * 86400000);

const signupNames = ["Czarny", "Nim", "Valka", "Orsk", "Hedda", "Brann", "Ilse", "Tor", "Mira"];
const makeSignups = (yes: number, no: number, maybe: number): MockSignup[] => {
  const statuses: SignupStatus[] = [
    ...Array<SignupStatus>(yes).fill("Yes"),
    ...Array<SignupStatus>(no).fill("No"),
    ...Array<SignupStatus>(maybe).fill("Maybe"),
  ];
  return statuses.map((status, i) => ({ userId: String(200 + i), name: signupNames[i % signupNames.length], status }));
};

const event = (partial: Partial<MockEvent> & Pick<EventItem, "id" | "title">): MockEvent => {
  const signupList = partial.signupList ?? [];
  const e: MockEvent = {
    description: "",
    date: fmt(inDays(2)),
    time: "19:00",
    timezone: DEFAULT_TIMEZONE,
    intervalDays: 0,
    repeating: false,
    channelId: "333",
    roleId: "555",
    durationMinutes: 90,
    messageId: "1300000000000000001",
    active: true,
    nextEventId: null,
    signups: { yes: 0, no: 0, maybe: 0 },
    guildId: "9001",
    ...partial,
    signupList,
  };
  return withCounts(e);
};

export const withCounts = (e: MockEvent): MockEvent => ({
  ...e,
  repeating: e.intervalDays > 0,
  signups: {
    yes: e.signupList.filter((s) => s.status === "Yes").length,
    no: e.signupList.filter((s) => s.status === "No").length,
    maybe: e.signupList.filter((s) => s.status === "Maybe").length,
  },
});

export const events: MockEvent[] = [
  event({ id: "evt_1", title: "Weekly siege", description: "Gather at the north gate.", date: fmt(inDays(1)), time: "20:00", intervalDays: 7, signupList: makeSignups(6, 1, 2) }),
  event({ id: "evt_2", title: "Territory war briefing", description: "Officers only. Plan the Saturday push.", date: fmt(inDays(4)), time: "18:30", roleId: "667", durationMinutes: 45, signupList: makeSignups(3, 0, 1) }),
  event({ id: "evt_3", title: "Open training", date: fmt(inDays(9)), time: "21:00", roleId: "", timezone: "America/Chicago", intervalDays: 14, signupList: makeSignups(2, 2, 0) }),
  event({ id: "evt_0", title: "Weekly siege", description: "Gather at the north gate.", date: fmt(inDays(-6)), time: "20:00", intervalDays: 7, active: false, nextEventId: "evt_1", signupList: makeSignups(7, 2, 1) }),
];

export const emojiTriggers: Record<string, EmojiTriggerSettings> = {
  "9001": {
    requireExact: false,
    triggers: [
      { emoji: "🔥", imageUrls: ["https://placehold.co/320x180/1f1f1f/f97316?text=fire"] },
      { emoji: "<:shield:987654321>", imageUrls: ["https://placehold.co/320x180/1f1f1f/22c55e?text=shield", "https://placehold.co/320x180/1f1f1f/ffffff?text=wall"] },
    ],
  },
};

export const uploadsCount: Record<string, number> = {};

export const roleReactions: Record<string, RoleReactionSettings> = {
  "9001": {
    enabled: true,
    messages: [
      {
        key: "mock-1",
        channelId: "333",
        type: "embed",
        message: "React below to pick your unit type.",
        embed: { title: "Choose your role", description: "React below to pick your unit type.", color: "#f97316" },
        pairs: [
          { emoji: "<:flame:123456789>", roleId: "555" },
          { emoji: "<:shield:987654321>", roleId: "666" },
        ],
        messageId: "1300000000000000099",
      },
    ],
  },
};

export const presenceSettings: Record<string, VoicePresenceSettings> = {
  "9001": {
    manualChannelIds: ["888"],
    manualName: "War room check",
    schedules: [
      { id: "sched-1", name: "Wednesday raid", enabled: true, dayOfWeek: 2, time: "20:00", channelIds: ["888", "889"], lastRun: null },
      { id: "sched-2", name: "Saturday TW", enabled: false, dayOfWeek: 5, time: "19:45", channelIds: ["888"], lastRun: null },
    ],
  },
};

export const presenceLogs: Record<string, VoicePresenceLog[]> = {
  "9001": [
    {
      id: "log-2",
      createdAt: new Date(today.getTime() - 3600_000).toISOString(),
      source: "schedule",
      scheduleId: "sched-1",
      name: "Wednesday raid",
      channels: [{ id: "888", name: "War Room" }, { id: "889", name: "Strategy" }],
      members: [
        { id: "101", name: "Czarny", channelId: "888", channelName: "War Room" },
        { id: "102", name: "Nim", channelId: "889", channelName: "Strategy" },
        { id: "103", name: "Valka", channelId: "888", channelName: "War Room" },
      ],
      totalMembers: 3,
      totalChannels: 2,
    },
    {
      id: "log-1",
      createdAt: new Date(today.getTime() - 86400_000 * 2).toISOString(),
      source: "manual",
      scheduleId: null,
      name: "War room check",
      channels: [{ id: "888", name: "War Room" }],
      members: [{ id: "101", name: "Czarny", channelId: "888", channelName: "War Room" }],
      totalMembers: 1,
      totalChannels: 1,
    },
  ],
};

export const warthogDefaults: WarthogSettings = {
  enabled: false,
  roleLock: false,
  allowedRoles: [],
  whitelist: [],
  bounceMessage: "Warthog bounced off. This user is protected.",
  bounceGif: "",
};
export const warthog: Record<string, WarthogSettings> = { "9001": { ...warthogDefaults, enabled: true, allowedRoles: ["667"] } };

export const banDmDefaults: BanDmSettings = {
  enabled: false,
  message: "If you believe this was a mistake, please contact the **server moderators** and include any *relevant details*.",
  unbanMessage: "",
};
export const banDm: Record<string, BanDmSettings> = { "9001": { ...banDmDefaults, enabled: true } };

export const antiSpamDefaults: AntiSpamSettings = { enabled: false, action: "auto", exemptRoleIds: [], logChannelId: "" };
export const antiSpam: Record<string, AntiSpamSettings> = { "9001": { enabled: true, action: "auto", exemptRoleIds: ["667"], logChannelId: "444" } };

export const timeoutDmDefaults: TimeoutDmSettings = { enabled: true, message: "" };
export const timeoutDm: Record<string, TimeoutDmSettings> = {};

const levels = ["INFO", "INFO", "WARNING", "ERROR", "INFO", "DEBUG"];
const messages = [
  "Bot was added to a new server: Frontline HQ",
  "Player Valka joined house Iron Wolves",
  "Event Weekly siege rolled over to next instance",
  "Failed to send welcome message: Missing Access",
  "Attendance sampler finished for 3 events",
  "Presence snapshot stored",
];
export const adminLogs: AdminLogEntry[] = Array.from({ length: 45 }, (_, i) => ({
  id: `log${i}`,
  source: i % 3 === 0 ? "botpanel" : "conqbot",
  level: levels[i % levels.length],
  logger: i % 3 === 0 ? "botpanel" : ["guild_log_service", "recruitment", "event_service", "panel"][i % 4],
  message: messages[i % messages.length],
  timestamp: new Date(today.getTime() - i * 900_000).toISOString(),
  context: i % 5 === 0 ? { guild_id: "9001" } : {},
  userId: i % 3 === 0 ? "1122334455" : null,
}));

export const adminUsers: string[] = ["1122334455", "998877665544"];
