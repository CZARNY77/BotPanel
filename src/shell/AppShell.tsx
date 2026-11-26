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
import { useBotState } from "../hooks/useBotState";
import { useT } from "../i18n";
import { CommandPalette, type PaletteItem } from "./CommandPalette";
import { NoBotPage } from "./NoBotPage";
import { SectionOutlet } from "./SectionOutlet";
import { sectionByKey, sectionPath, sections, type SectionKey } from "./sections";
import { ServerRail } from "./ServerRail";
import { Sidebar } from "./Sidebar";
import { openInvite } from "../api/endpoints/servers";
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
      setDrawer(false);
      navigate(sectionPath(next.id, sectionDef && !sectionDef.adminOnly ? sectionKey : "overview"));
    },
    [navigate, sectionDef, sectionKey, serverId, unsaved]
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
    list.push(
      { id: "a-event", group: "actions", label: t("palette.newEvent"), icon: "plus", keywords: "create schedule nowe", run: () => go(sectionPath(serverId, "events", "?new=1")) },
      { id: "a-snapshot", group: "actions", label: t("palette.runSnapshot"), icon: "play", keywords: "presence attendance now obecność", run: () => go(sectionPath(serverId, "voice-snapshots", "?run=1")) },
      { id: "a-invite", group: "actions", label: t("palette.invite"), icon: "external", keywords: "add bot server zaproś", run: () => void invite(serverId) },
      { id: "a-logout", group: "actions", label: t("user.logout"), icon: "logout", run: () => void signOut() }
    );
    return list;
  }, [servers, serverId, isAdmin, go, selectServer, signOut, invite, t]);

  if (loading && !servers.length) return <LoadingScreen label={t("servers.loading")} />;
  if (!loading && !error && servers.length && !server) return <Navigate to="/dashboard" replace />;
  if (!sectionDef || (sectionDef.adminOnly && !isAdmin)) return <Navigate to={sectionPath(serverId, "overview")} replace />;

  return (
    <div className={`shell${collapsed ? " shell--collapsed" : ""}${drawer ? " shell--drawer" : ""}`}>
      <div className="shell__nav">
        <ServerRail servers={servers} currentId={serverId} onSelect={selectServer} onInvite={(id) => void invite(id)} />
        <Sidebar
          server={server}
          serverId={serverId}
          botState={botState}
          user={user}
          isAdmin={isAdmin}
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
      {palette ? <CommandPalette items={paletteItems} onClose={() => setPalette(false)} /> : null}
    </div>
  );
};
