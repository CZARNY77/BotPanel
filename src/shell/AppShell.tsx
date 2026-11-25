import { useCallback, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import type { Server } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { IconButton } from "../components/ui/Button";
import { EmptyState, LoadingScreen } from "../components/ui/basics";
import { errorText, useToast } from "../components/ui/Toast";
import { UnsavedChangesProvider, useUnsavedChanges } from "../hooks/useEditable";
import { useHotkey } from "../hooks/useHotkey";
import { ServerScope } from "../hooks/useServerResource";
import { rememberServer, useServers } from "../hooks/useServers";
import { BotStatus } from "../components/ui/BotStatus";
import { useBotState } from "../hooks/useBotState";
import { CommandPalette, type PaletteItem } from "./CommandPalette";
import { NoBotPage } from "./NoBotPage";
import { SectionOutlet } from "./SectionOutlet";
import { sectionByKey, sectionPath, sections, type SectionKey } from "./sections";
import { Sidebar } from "./Sidebar";
import { openInvite } from "../api/endpoints/servers";
import { ServerSwitcher } from "./ServerSwitcher";
import { UnsavedBar } from "./UnsavedBar";

const COLLAPSED_KEY = "conqbot.sidebarCollapsed";

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
};

export const AppShell = () => (
  <UnsavedChangesProvider>
    <ShellInner />
  </UnsavedChangesProvider>
);

const ShellInner = () => {
  const { serverId = "", section = "overview" } = useParams();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { servers, loading, error, reload } = useServers();
  const unsaved = useUnsavedChanges();
  const toast = useToast();
  const botState = useBotState();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);

  const isAdmin = Boolean(user?.isAdminPanel);
  const server = servers.find((item) => item.id === serverId) ?? null;
  const sectionKey = section as SectionKey;
  const sectionDef = sectionByKey.get(sectionKey);

  useHotkey("k", () => setPalette((open) => !open));

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, value ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !value;
    });
  };

  const go = useCallback(
    (path: string) => {
      if (unsaved.block()) return;
      navigate(path);
      setDrawer(false);
    },
    [navigate, unsaved]
  );

  const selectServer = useCallback(
    (next: Server) => {
      if (next.id === serverId) return;
      if (unsaved.block()) return;
      rememberServer(next.id);
      navigate(sectionPath(next.id, sectionDef && !sectionDef.adminOnly ? sectionKey : "overview"));
    },
    [navigate, sectionDef, sectionKey, serverId, unsaved]
  );

  const invite = async (id?: string) => {
    try {
      await openInvite(id);
    } catch (err) {
      toast.error(errorText(err, "Failed to open invite link."));
    }
  };

  const paletteItems = useMemo<PaletteItem[]>(() => {
    const list: PaletteItem[] = sections
      .filter((s) => !s.adminOnly || isAdmin)
      .map((s) => ({ id: `s-${s.key}`, group: "Sections", label: s.label, icon: s.icon, keywords: s.keywords, run: () => go(sectionPath(serverId, s.key)) }));
    for (const s of servers) {
      list.push({
        id: `srv-${s.id}`,
        group: "Servers",
        label: s.name,
        hint: s.botPresent ? undefined : "Add bot",
        icon: s.botPresent ? "globe" : "plus",
        run: () => (s.botPresent ? selectServer(s) : void invite(s.id)),
      });
    }
    list.push(
      { id: "a-event", group: "Actions", label: "New event", icon: "plus", keywords: "create schedule", run: () => go(sectionPath(serverId, "events", "?new=1")) },
      { id: "a-snapshot", group: "Actions", label: "Run voice snapshot", icon: "play", keywords: "presence attendance now", run: () => go(sectionPath(serverId, "voice-snapshots", "?run=1")) },
      { id: "a-invite", group: "Actions", label: "Invite bot", icon: "external", keywords: "add bot server", run: () => void invite(serverId) },
      { id: "a-logout", group: "Actions", label: "Log out", icon: "logout", run: () => void signOut() }
    );
    return list;
  }, [servers, serverId, isAdmin, go, selectServer, signOut]);

  if (loading && !servers.length) return <LoadingScreen label="Loading your servers…" />;
  if (!loading && !error && servers.length && !server) return <Navigate to="/dashboard" replace />;
  if (!sectionDef || (sectionDef.adminOnly && !isAdmin)) return <Navigate to={sectionPath(serverId, "overview")} replace />;

  return (
    <div className={`shell${collapsed ? " shell--collapsed" : ""}${drawer ? " shell--drawer" : ""}`}>
      <Sidebar
        serverId={serverId}
        isAdmin={isAdmin}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        onSearch={() => setPalette(true)}
        onNavigate={() => setDrawer(false)}
        onInvite={() => void invite(serverId)}
        guard={unsaved.block}
      />
      <div className="drawer-backdrop" onClick={() => setDrawer(false)} aria-hidden="true" />
      <div className="main">
        <header className="topbar">
          <IconButton className="topbar__menu" icon="menu" label="Open menu" size="md" onClick={() => setDrawer(true)} />
          <ServerSwitcher servers={servers} current={server} onSelect={selectServer} />
          <span className="topbar__spacer" />
          <IconButton icon="search" label="Search (Ctrl+K)" className="topbar__search" onClick={() => setPalette(true)} />
          <BotStatus state={botState} />
          <div className="topbar__user">
            <span className="avatar" title={user?.username}>
              {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : user?.username?.[0]?.toUpperCase()}
            </span>
            <span className="topbar__name small">{user?.username}</span>
            <IconButton icon="logout" label="Log out" onClick={() => void signOut()} />
          </div>
        </header>
        <main className="content" id="main">
          {error ? (
            <EmptyState icon="warning" title="Could not load your servers." action={<button className="btn btn-secondary" onClick={() => void reload()}>Retry</button>}>
              {error}
            </EmptyState>
          ) : server && !server.botPresent ? (
            <NoBotPage server={server} onInvite={() => void invite(server.id)} />
          ) : server ? (
            <ServerScope key={server.id} server={server}>
              <SectionOutlet section={sectionKey} />
            </ServerScope>
          ) : null}
        </main>
      </div>
      <UnsavedBar />
      {palette ? <CommandPalette items={paletteItems} onClose={() => setPalette(false)} /> : null}
    </div>
  );
};
