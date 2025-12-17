import { NavLink } from "react-router-dom";
import { GuildServer } from "../api/types";
import { ReactNode } from "react";

type NavItem = {
  label: string;
  to: string;
  icon?: ReactNode;
};

type SidebarProps = {
  selectedServer: GuildServer | null;
  navItems: NavItem[];
  theme: "midnight" | "warlord";
  onThemeChange: (theme: "midnight" | "warlord") => void;
};

export default function Sidebar({
  selectedServer,
  navItems,
  theme,
  onThemeChange
}: SidebarProps) {
  return (
    <aside className="glass-panel flex h-full w-64 flex-col rounded-3xl border border-white/5 p-5 shadow-card">
      <div className="rounded-2xl border border-white/5 bg-white/5 p-4 shadow-inner">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25rem] text-slate-400">Server</p>
            <p className="text-lg font-bold text-white">
              {selectedServer?.name ?? "Wybierz serwer"}
            </p>
          </div>
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/15 text-xs font-semibold uppercase text-green-200">
            Bot
            <span className="absolute -right-1 h-2 w-2 animate-ping rounded-full bg-green-400" />
            <span className="absolute -right-1 h-2 w-2 rounded-full bg-green-400" />
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-400">Status: Bot Active • Secure link established</p>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all",
                isActive ? "bg-white/10 text-white shadow-inner" : "text-slate-300 hover:bg-white/5"
              ].join(" ")
            }
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-accent-300 transition-colors group-hover:bg-accent-500/10">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 space-y-3">
        <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Motyw</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => onThemeChange("midnight")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                theme === "midnight"
                  ? "bg-accent-500 text-white shadow-card"
                  : "bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
            >
              Midnight
            </button>
            <button
              onClick={() => onThemeChange("warlord")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                theme === "warlord"
                  ? "bg-gradient-to-r from-amber-500 to-orange-400 text-black shadow-card"
                  : "bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
            >
              Warlord
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Przełącz, aby dostosować atmosferę: Midnight = Tech-Ops, Warlord = Gritty.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/10 p-3">
          <div>
            <p className="text-sm font-semibold text-white">Dowódca</p>
            <p className="text-xs text-slate-400">Discord OAuth2 • short-lived token</p>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-500 text-white">
            YOU
          </div>
        </div>
      </div>
    </aside>
  );
}
