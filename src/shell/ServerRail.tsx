// Server rail on the far left, like Discord: logo, All servers (panel admin), servers with the bot,
// a server opened with admin access, servers without the bot (Add bot), policy links.
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import type { Server } from "../api/types";
import { Icon } from "../components/ui/Icon";
import { useT } from "../i18n";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

export const ServerAvatar = ({ server }: { server: { name: string; iconUrl: string | null } }) =>
  server.iconUrl ? <img src={server.iconUrl} alt="" /> : <span>{initials(server.name)}</span>;

export const ServerRail = ({
  servers,
  currentId,
  onSelect,
  onInvite,
  isAdmin = false,
  allOpen = false,
  onAllServers,
  recent = null,
}: {
  servers: Server[];
  currentId: string;
  onSelect: (server: Server) => void;
  onInvite: (serverId?: string) => void;
  isAdmin?: boolean;
  allOpen?: boolean;
  onAllServers?: () => void;
  /** Last server opened with admin access (outside the user's own list), max one. */
  recent?: Server | null;
}) => {
  const { t } = useT();
  const withBot = servers.filter((server) => server.botPresent);
  const withoutBot = servers.filter((server) => !server.botPresent);

  return (
    <nav className="rail" aria-label={t("rail.label")}>
      <Link to="/" className="rail__brand" title={t("rail.home")} aria-label={t("rail.home")}>
        <img src={logo} alt="" />
      </Link>
      <div className="rail__list">
        {isAdmin ? (
          <>
            <button
              type="button"
              className={`rail__server rail__all${allOpen ? " active" : ""}`}
              aria-expanded={allOpen}
              title={t("rail.allServers")}
              aria-label={t("rail.allServers")}
              onClick={onAllServers}
            >
              <Icon name="globe" />
            </button>
            <span className="rail__divider" role="separator" />
          </>
        ) : null}
        {withBot.map((server) => {
          const active = server.id === currentId;
          return (
            <button
              key={server.id}
              type="button"
              className={`rail__server${active ? " active" : ""}`}
              aria-current={active ? "page" : undefined}
              title={server.name}
              aria-label={server.name}
              onClick={() => onSelect(server)}
            >
              <ServerAvatar server={server} />
            </button>
          );
        })}
        {recent ? (
          <>
            <span className="rail__divider" role="separator" />
            <button
              type="button"
              className={`rail__server rail__server--admin${recent.id === currentId ? " active" : ""}`}
              aria-current={recent.id === currentId ? "page" : undefined}
              title={t("rail.recent", { name: recent.name })}
              aria-label={t("rail.recent", { name: recent.name })}
              onClick={() => onSelect(recent)}
            >
              <ServerAvatar server={recent} />
              <span className="rail__badge rail__badge--admin" aria-hidden="true">
                <Icon name="lock" size="sm" />
              </span>
            </button>
          </>
        ) : null}
        {withoutBot.length ? (
          <>
            <span className="rail__divider" role="separator" />
            <span className="rail__group" title={t("rail.noBot")}>
              <Icon name="bot" size="sm" />
              <span className="sr-only">{t("rail.noBot")}</span>
            </span>
            {withoutBot.map((server) => (
              <button
                key={server.id}
                type="button"
                className="rail__server rail__server--off"
                title={t("rail.addTo", { name: server.name })}
                aria-label={t("rail.addTo", { name: server.name })}
                onClick={() => onInvite(server.id)}
              >
                <ServerAvatar server={server} />
                <span className="rail__badge" aria-hidden="true">
                  <Icon name="plus" size="sm" />
                </span>
              </button>
            ))}
          </>
        ) : null}
        <button type="button" className="rail__server rail__add" title={t("rail.invite")} aria-label={t("rail.invite")} onClick={() => onInvite()}>
          <Icon name="plus" />
        </button>
      </div>
      <div className="rail__foot">
        <Link to="/privacy-policy" className="rail__link" title={t("legal.privacy")} aria-label={t("legal.privacy")}>
          <Icon name="moderation" size="sm" />
        </Link>
        <Link to="/terms-of-service" className="rail__link" title={t("legal.terms")} aria-label={t("legal.terms")}>
          <Icon name="terms" size="sm" />
        </Link>
      </div>
    </nav>
  );
};
