import { useEffect, useRef, useState } from "react";
import { openInvite } from "../api/endpoints/servers";
import type { Server } from "../api/types";
import { Icon } from "../components/ui/Icon";
import { errorText, useToast } from "../components/ui/Toast";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

export const ServerIcon = ({ server }: { server: Server }) => (
  <span className={`server-icon${server.botPresent ? "" : " server-icon--off"}`} aria-hidden="true">
    {server.iconUrl ? <img src={server.iconUrl} alt="" /> : initials(server.name)}
  </span>
);

export const ServerSwitcher = ({
  servers,
  current,
  onSelect,
}: {
  servers: Server[];
  current: Server | null;
  onSelect: (server: Server) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const withBot = servers.filter((server) => server.botPresent);
  const withoutBot = servers.filter((server) => !server.botPresent);

  const invite = async (server: Server) => {
    try {
      await openInvite(server.id);
    } catch (err) {
      toast.error(errorText(err, "Failed to open invite link."));
    }
  };

  return (
    <div className="switcher" ref={ref}>
      <button
        type="button"
        className="switcher__button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {current ? <ServerIcon server={current} /> : null}
        <span className="truncate">{current?.name ?? "Choose a server"}</span>
        <Icon name="chevronDown" size="sm" />
      </button>
      {open ? (
        <div className="switcher__menu" role="listbox" aria-label="Servers">
          {withBot.map((server) => (
            <button
              key={server.id}
              type="button"
              role="option"
              aria-selected={server.id === current?.id}
              className={`switcher__item${server.id === current?.id ? " active" : ""}`}
              onClick={() => {
                setOpen(false);
                onSelect(server);
              }}
            >
              <ServerIcon server={server} />
              <span className="grow truncate">{server.name}</span>
              {server.memberCount !== null ? (
                <span className="muted xs num" title="Members">
                  {server.memberCount}
                </span>
              ) : null}
            </button>
          ))}
          {withoutBot.length ? (
            <>
              <div className="switcher__group">Bot not added</div>
              {withoutBot.map((server) => (
                <button key={server.id} type="button" className="switcher__item" onClick={() => void invite(server)}>
                  <ServerIcon server={server} />
                  <span className="grow truncate muted">{server.name}</span>
                  <span className="pill pill--primary">
                    <Icon name="plus" size="sm" />
                    Add bot
                  </span>
                </button>
              ))}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
