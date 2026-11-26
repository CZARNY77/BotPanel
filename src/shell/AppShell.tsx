import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import type { AdminServer, Server } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { IconButton } from "../components/ui/Button";
import { EmptyState, LoadingScreen } from "../components/ui/basics";
import { errorText, useToast } from "../components/ui/Toast";
import { UnsavedChangesProvider, useUnsavedChanges } from "../hooks/useEditable";
import { useHotkey } from "../hooks/useHotkey";
import { ServerScope } from "../hooks/useServerResource";
import { rememberServer, useServers } from "../hooks/useServers";
import { useBotState } from "../hooks/useBotState";
import { useAdminServers } from "../hooks/useAdminServers";
import { AllServersPanel } from "./AllServersPanel";
import { fold } from "./search";
import { useT } from "../i18n";
import { CommandPalette, type PaletteItem } from "./CommandPalette";
import { NoBotPage } from "./NoBotPage";
import { SectionOutlet } from "./SectionOutlet";
import { sectionByKey, sectionPath, sections, type SectionKey } from "./sections";
import { ServerRail } from "./ServerRail";
import { Sidebar } from "./Sidebar";
import { openInvite } from "../api/endpoints/servers";
import { UnsavedBar } from "./UnsavedBar";

/** A server outside the user's own list, opened by a panel admin (the bot is always on it). */
const asForeign = (server: AdminServer): Server => ({
  id: server.id,
  name: server.name,
  iconUrl: server.iconUrl,
  role: "panel",
  botPresent: true,
  memberCount: server.memberCount,
});

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

/** Layout: server rail | sidebar (server, sections, user panel) | content. No top bar. */
const ShellInner = () => {
  const { serverId = "", section = "overview" } = useParams();
  const navigate = useNavigate();
  const { t } = useT();
  const { user, signOut } = useAuth();
  const { servers, loading, error, reload } = useServers();
  const unsaved = useUnsavedChanges();
  const toast = useToast();
  const botState = useBotState();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);
  const [allOpen, setAllOpen] = useState(false);
  const [recent, setRecent] = useState<Server | null>(null);

  const isAdmin = Boolean(user?.isAdminPanel);
  const ownServer = servers.find((item) => item.id === serverId) ?? null;
  const admin = useAdminServers(isAdmin && (allOpen || palette || (!loading && !ownServer && Boolean(serverId))));
  const foreignServer = useMemo(() => {
    if (ownServer || !isAdmin) return null;
    const found = admin.servers.find((item) => item.id === serverId);
    return found ? asForeign(found) : null;
  }, [ownServer, isAdmin, admin.servers, serverId]);
  const server = ownServer ?? foreignServer;
  const ownIds = useMemo(() => new Set(servers.map((item) => item.id)), [servers]);

  // The last server opened with admin access stays in the rail (max one) until another replaces it.
  useEffect(() => {
    if (foreignServer) setRecent(foreignServer);
  }, [foreignServer]);
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
      if (next.id === serverId) {
        setAllOpen(false);
        return;
      }
      if (unsaved.block()) return;
      // Servers opened with admin access are not remembered: /dashboard returns to the admin's own list.
      if (ownIds.has(next.id)) rememberServer(next.id);
      setDrawer(false);
      setAllOpen(false);
      navigate(sectionPath(next.id, sectionDef && !sectionDef.adminOnly ? sectionKey : "overview"));
    },
    [navigate, sectionDef, sectionKey, serverId, unsaved, ownIds]
  );

  /** From All servers / Ctrl+K: always the server's overview. */
  const openAdminServer = useCallback(
    (next: AdminServer) => {
      if (next.id !== serverId && unsaved.block()) return;
      if (ownIds.has(next.id)) rememberServer(next.id);
      setDrawer(false);
      setAllOpen(false);
      navigate(sectionPath(next.id, "overview"));
    },
    [navigate, serverId, unsaved, ownIds]
  );

  const invite = useCallback(
    async (id?: string) => {
      try {
        await openInvite(id);
      } catch (err) {
        toast.error(errorText(err, t("error.invite")));
      }
    },
    [toast, t]
  );

  const paletteItems = useMemo<PaletteItem[]>(() => {
    const list: PaletteItem[] = sections
      .filter((s) => !s.adminOnly || isAdmin)
      .map((s) => ({ id: `s-${s.key}`, group: "sections", label: t(s.label), icon: s.icon, keywords: s.keywords, run: () => go(sectionPath(serverId, s.key)) }));
    for (const s of servers) {
      list.push({
        id: `srv-${s.id}`,
        group: "servers",
        label: s.name,
        hint: s.botPresent ? undefined : t("action.addBot"),
        icon: s.botPresent ? "globe" : "plus",
        run: () => (s.botPresent ? selectServer(s) : void invite(s.id)),
      });
    }
    if (isAdmin) {
      for (const s of admin.servers) {
        if (ownIds.has(s.id)) continue;
        list.push({
          id: `adm-${s.id}`,
          group: "servers",
          label: s.name,
          hint: t("palette.adminHint"),
          icon: "lock",
          keywords: `${fold(s.name)} ${s.id}`,
          searchOnly: true,
          run: () => openAdminServer(s),
        });
      }
      list.push({ id: "a-all", group: "actions", label: t("palette.allServers"), icon: "globe", keywords: "admin servers guilds serwery", run: () => setAllOpen(true) });
    }
    list.push(
      { id: "a-event", group: "actions", label: t("palette.newEvent"), icon: "plus", keywords: "create schedule nowe", run: () => go(sectionPath(serverId, "events", "?new=1")) },
      { id: "a-snapshot", group: "actions", label: t("palette.runSnapshot"), icon: "play", keywords: "presence attendance now obecność", run: () => go(sectionPath(serverId, "voice-snapshots", "?run=1")) },
      { id: "a-invite", group: "actions", label: t("palette.invite"), icon: "external", keywords: "add bot server zaproś", run: () => void invite(serverId) },
      { id: "a-logout", group: "actions", label: t("user.logout"), icon: "logout", run: () => void signOut() }
    );
    return list;
  }, [servers, serverId, isAdmin, admin.servers, ownIds, go, selectServer, openAdminServer, signOut, invite, t]);

  if (loading && !servers.length) return <LoadingScreen label={t("servers.loading")} />;
  if (!loading && !error && !server) {
    // A panel admin may open any server of the bot: wait for that list before giving up on the ID.
    if (isAdmin && serverId && (!admin.loaded || admin.loading)) return <LoadingScreen label={t("servers.loading")} />;
    if (servers.length || isAdmin) return <Navigate to="/dashboard" replace />;
  }
  if (!sectionDef || (sectionDef.adminOnly && !isAdmin)) return <Navigate to={sectionPath(serverId, "overview")} replace />;

  return (
    <div className={`shell${collapsed ? " shell--collapsed" : ""}${drawer ? " shell--drawer" : ""}`}>
      <div className="shell__nav">
        <ServerRail
          servers={servers}
          currentId={serverId}
          onSelect={selectServer}
          onInvite={(id) => void invite(id)}
          isAdmin={isAdmin}
          allOpen={allOpen}
          onAllServers={() => setAllOpen((open) => !open)}
          recent={recent && !ownIds.has(recent.id) ? recent : null}
        />
        <Sidebar
          server={server}
          serverId={serverId}
          botState={botState}
          user={user}
          isAdmin={isAdmin}
          adminAccess={Boolean(foreignServer)}
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          onSearch={() => setPalette(true)}
          onNavigate={() => setDrawer(false)}
          onSignOut={() => void signOut()}
          guard={unsaved.block}
        />
      </div>
      <div className="drawer-backdrop" onClick={() => setDrawer(false)} aria-hidden="true" />
      <div className="main">
        <IconButton className="shell__menu" icon="menu" label={t("shell.openMenu")} size="md" variant="secondary" onClick={() => setDrawer(true)} />
        <main className="content" id="main">
          {error ? (
            <EmptyState icon="warning" title={t("servers.error")} action={<button className="btn btn-secondary" onClick={() => void reload()}>{t("action.retry")}</button>}>
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
      {allOpen ? (
        <AllServersPanel
          servers={admin.servers}
          total={admin.total}
          loading={admin.loading}
          error={admin.error}
          ownIds={ownIds}
          currentId={serverId}
          onReload={() => void admin.reload()}
          onOpen={openAdminServer}
          onClose={() => setAllOpen(false)}
        />
      ) : null}
      {palette ? <CommandPalette items={paletteItems} onClose={() => setPalette(false)} /> : null}
    </div>
  );
};
