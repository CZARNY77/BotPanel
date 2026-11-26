import type { CSSProperties, MouseEvent } from "react";
import { NavLink } from "react-router-dom";
import type { BotState, Server, User } from "../api/types";
import { BotStatus } from "../components/ui/BotStatus";
import { IconButton } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { useT } from "../i18n";
import { sectionPath, sections, type SectionDef } from "./sections";
import { UserPanel } from "./UserPanel";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export const Sidebar = ({
  server,
  serverId,
  botState,
  user,
  isAdmin,
  adminAccess = false,
  collapsed,
  onToggleCollapsed,
  onSearch,
  onNavigate,
  onSignOut,
  guard,
}: {
  server: Server | null;
  serverId: string;
  botState: BotState;
  user: User | null;
  isAdmin: boolean;
  /** The open server is outside the user's own list (panel admin access). */
  adminAccess?: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onSearch: () => void;
  onNavigate: () => void;
  onSignOut: () => void;
  /** Returns true when navigation must be blocked (unsaved changes). */
  guard: () => boolean;
}) => {
  const { t } = useT();
  const onClick = (event: MouseEvent) => {
    if (guard()) {
      event.preventDefault();
      return;
    }
    onNavigate();
  };

  const item = (section: SectionDef) => (
    <NavLink
      key={section.key}
      to={sectionPath(serverId, section.key)}
      className="nav-item"
      onClick={onClick}
      title={collapsed ? t(section.label) : undefined}
      style={{ "--nav-hue": section.hue } as CSSProperties}
    >
      <Icon name={section.icon} />
      <span className="sidebar__text">{t(section.label)}</span>
      <Icon name="chevronRight" size="sm" className="nav-item__arrow sidebar__text" />
    </NavLink>
  );

  const collapseLabel = t(collapsed ? "sidebar.expand" : "sidebar.collapse");

  return (
    <aside className="sidebar" aria-label={t("sidebar.label")}>
      <div className={`sidebar__head${adminAccess ? " sidebar__head--admin" : ""}`}>
        <div className="sidebar__server sidebar__text">
          <strong className="truncate" title={server?.name}>{server?.name ?? "ConqBot"}</strong>
          <span className="sidebar__status">
            <BotStatus state={botState} />
            {adminAccess ? (
              <span className="admin-access" title={t("admin.accessTitle")}>
                <Icon name="lock" size="sm" />
                {t("admin.access")}
              </span>
            ) : null}
          </span>
        </div>
        {adminAccess ? (
          <span className="admin-access admin-access--icon" title={t("admin.accessTitle")} aria-hidden="true">
            <Icon name="lock" size="sm" />
          </span>
        ) : null}
        <IconButton icon="chevronLeft" label={collapseLabel} className="sidebar__collapse" onClick={onToggleCollapsed} />
      </div>
      <button type="button" className="sidebar__search" onClick={onSearch} title={t("search.title")}>
        <Icon name="search" size="sm" />
        <span className="sidebar__text">{t("search.short")}</span>
        <kbd>{isMac ? "⌘K" : "Ctrl K"}</kbd>
      </button>
      <nav className="sidebar__nav">{sections.filter((s) => !s.adminOnly).map(item)}</nav>
      {isAdmin ? (
        <nav className="sidebar__nav" aria-label={t("sidebar.admin")}>
          <div className="sidebar__label">{t("sidebar.admin")}</div>
          {sections.filter((s) => s.adminOnly).map(item)}
        </nav>
      ) : null}
      <div className="sidebar__foot">
        <UserPanel user={user} onSignOut={onSignOut} guard={guard} />
      </div>
    </aside>
  );
};
