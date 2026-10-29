import type { CSSProperties, MouseEvent } from "react";
import { Link, NavLink } from "react-router-dom";
import logo from "../assets/logo.png";
import { Icon } from "../components/ui/Icon";
import { sectionPath, sections, type SectionDef } from "./sections";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export const Sidebar = ({
  serverId,
  isAdmin,
  collapsed,
  onToggleCollapsed,
  onSearch,
  onNavigate,
  guard,
}: {
  serverId: string;
  isAdmin: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onSearch: () => void;
  onNavigate: () => void;
  /** Returns true when navigation must be blocked (unsaved changes). */
  guard: () => boolean;
}) => {
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
      title={collapsed ? section.label : undefined}
      style={{ "--nav-hue": section.hue } as CSSProperties}
    >
      <Icon name={section.icon} />
      <span className="sidebar__text">{section.label}</span>
    </NavLink>
  );

  return (
    <aside className="sidebar" aria-label="Main navigation">
      <Link to={sectionPath(serverId, "overview")} className="sidebar__brand" onClick={onClick}>
        <img src={logo} alt="" />
        <span className="sidebar__text">ConqBot</span>
      </Link>
      <button type="button" className="sidebar__search" onClick={onSearch} title="Search (Ctrl+K)">
        <Icon name="search" size="sm" />
        <span className="sidebar__text">Search…</span>
        <kbd>{isMac ? "⌘K" : "Ctrl K"}</kbd>
      </button>
      <nav className="sidebar__nav">{sections.filter((s) => !s.adminOnly).map(item)}</nav>
      {isAdmin ? (
        <nav className="sidebar__nav" aria-label="Admin">
          <div className="sidebar__label">Admin</div>
          {sections.filter((s) => s.adminOnly).map(item)}
        </nav>
      ) : null}
      <div className="sidebar__foot">
        <button
          type="button"
          className="nav-item sidebar__collapse"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{ background: "none", border: 0, cursor: "pointer", width: "100%" }}
        >
          <Icon name="chevronLeft" />
          <span className="sidebar__text">Collapse</span>
        </button>
      </div>
    </aside>
  );
};
