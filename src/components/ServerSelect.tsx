import { GuildServer } from "../api/types";

type ServerSelectProps = {
  servers: GuildServer[];
  selectedServerId: string | null;
  onSelect: (id: string) => void;
};

export default function ServerSelect({ servers, selectedServerId, onSelect }: ServerSelectProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wide text-slate-400">Serwer</p>
      <div className="rounded-2xl border border-white/5 bg-surface-700/70 p-3 shadow-inner">
        {servers.length === 0 ? (
          <p className="text-sm text-slate-400">Brak serwerów dostępnych dla twojej sesji.</p>
        ) : (
          <select
            value={selectedServerId ?? ""}
            onChange={(e) => onSelect(e.target.value)}
            className="w-full rounded-xl border border-transparent bg-surface-800 px-3 py-2 text-sm text-white outline-none ring-2 ring-transparent transition focus:border-accent-500/40 focus:ring-accent-500/40"
          >
            {servers.map((server) => (
              <option key={server.id} value={server.id}>
                {server.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
