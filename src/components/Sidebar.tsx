import { NavLink } from "react-router-dom";
import ServerSelect from "./ServerSelect";
import { GuildServer } from "../api/types";
import { ReactNode } from "react";

type NavItem = {
  label: string;
  to: string;
  icon?: ReactNode;
};

type SidebarProps = {
  servers: GuildServer[];
  selectedServerId: string | null;
  onSelectServer: (id: string) => void;
  navItems: NavItem[];
};

export default function Sidebar({
  servers,
  selectedServerId,
  onSelectServer,
  navItems
}: SidebarProps) {
  return (
    <aside className="glass-panel flex h-full w-72 flex-col rounded-3xl border border-white/5 p-5 shadow-card">
      <div className="flex items-center gap-3 pb-6">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-accent-500 to-success-500 text-lg font-bold text-white shadow-lg">
          CB
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.25rem] text-slate-400">Control</p>
          <p className="text-lg font-bold text-white">ConqBot Panel</p>
        </div>
      </div>

      <ServerSelect
        servers={servers}
        selectedServerId={selectedServerId}
        onSelect={onSelectServer}
      />

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

      <div className="mt-4 rounded-2xl bg-gradient-to-br from-accent-500/20 to-success-500/20 p-4 text-sm text-slate-200">
        <p className="font-semibold text-white">Sesja aktywna</p>
        <p className="text-slate-300">Połączono z backendem ConqBot poprzez secure cookies.</p>
      </div>
    </aside>
  );
}
