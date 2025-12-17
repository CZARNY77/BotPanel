import { GuildServer } from "../api/types";

type ServerRailProps = {
  servers: GuildServer[];
  selectedServerId: string | null;
  onSelect: (id: string) => void;
  onCreateServer?: () => void;
};

function initials(name: string) {
  const [first = "", second = ""] = name.split(" ");
  return (first[0] ?? second[0] ?? "?").toUpperCase();
}

export default function ServerRail({
  servers,
  selectedServerId,
  onSelect,
  onCreateServer
}: ServerRailProps) {
  return (
    <div className="flex h-full w-20 flex-col items-center justify-between rounded-3xl bg-black/50 p-3 ring-1 ring-white/5">
      <div className="flex flex-1 flex-col items-center gap-3">
        {servers.map((server) => {
          const active = server.id === selectedServerId;
          return (
            <button
              key={server.id}
              onClick={() => onSelect(server.id)}
              className="relative grid h-12 w-12 place-items-center rounded-2xl bg-surface-800 text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:ring-2 hover:ring-accent-400/70 focus:outline-none"
            >
              {server.icon ? (
                <img
                  src={server.icon}
                  alt={server.name}
                  className="h-full w-full rounded-2xl object-cover"
                />
              ) : (
                initials(server.name)
              )}
              {active && (
                <span className="absolute -left-3 h-8 w-1 rounded-full bg-white shadow-lg" aria-hidden />
              )}
              <span className="sr-only">Przełącz na {server.name}</span>
            </button>
          );
        })}
      </div>
      <button
        onClick={onCreateServer}
        className="grid h-12 w-12 place-items-center rounded-2xl bg-green-500 text-xl font-bold text-black shadow-card transition hover:brightness-110 focus:outline-none"
        aria-label="Dodaj serwer"
      >
        +
      </button>
    </div>
  );
}
