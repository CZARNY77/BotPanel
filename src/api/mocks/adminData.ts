// Mock data for the panel admin: every server the bot is on, and a switch to test as a regular user.
// `?mockUser=member` (or `admin`) in the URL is kept in sessionStorage for the tab.
import type { ApiAdminServer } from "../types";
import { mockUser, servers } from "./data";

const MEMBER_KEY = "conqbot.mock.member";

const readMemberFlag = () => {
  try {
    const wanted = new URLSearchParams(window.location.search).get("mockUser");
    if (wanted === "member") sessionStorage.setItem(MEMBER_KEY, "1");
    if (wanted === "admin") sessionStorage.removeItem(MEMBER_KEY);
    return sessionStorage.getItem(MEMBER_KEY) === "1";
  } catch {
    return false;
  }
};

mockUser.is_admin_panel = !readMemberFlag();

const names = [
  "Żelazne Wilki", "Gildia Łuczników", "Smocza Straż", "Rycerze Śląska", "Husaria Polska", "Zakon Białego Orła",
  "Wojownicy Północy", "Księstwo Mazowsza", "Czarna Kompania", "Legion Ślężański", "Bractwo Miecza", "Straż Grodu",
  "Iron Legion", "Silver Lances", "House Valka", "Crimson Banner", "The Old Guard", "Northern Watch",
  "Shieldwall", "Ashen Order", "Golden Horde", "Blue Dragons", "Red Ravens", "Storm Riders",
  "Winter Wolves", "Kings Landing", "Siege Masters", "Dawn Brigade", "Free Companies", "Sable Knights",
  "Lancers of Aurum", "Black Lotus", "Phoenix Rising", "Ironclad", "Grey Wardens", "Sunforged",
  "Wolfpack EU", "Hussars United", "Eastern Front", "Pike & Shot", "Cavalry Corps", "Steel Hearts",
  "Conq PL Community", "Średniowieczni", "Łowcy Głów", "Dzikie Pola", "Tarcza i Miecz", "Gród Kraków",
];

const owned = servers.filter((server) => server.bot_present);

export const adminServers: ApiAdminServer[] = [
  ...owned.map((server) => ({
    id: server.id,
    name: server.name,
    icon_url: server.icon_url,
    member_count: server.member_count,
    owner_id: mockUser.id,
    bot_present: true as const,
  })),
  ...names.map((name, i) => ({
    id: String(1048576000000000000n + BigInt(i * 7919 + 1301) * 1000003n),
    name,
    icon_url: null,
    member_count: 12 + ((i * 37) % 480),
    owner_id: String(300000000000000000n + BigInt(i) * 101n),
    bot_present: true as const,
  })),
];
