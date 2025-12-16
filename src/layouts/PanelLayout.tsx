import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import { useServers } from "../hooks/useServers";
import { GuildServer } from "../api/types";
import { AUTH_URL } from "../api/client";

export type PanelOutletContext = {
  servers: GuildServer[];
  selectedServerId: string | null;
  selectedServer: GuildServer | null;
  setSelectedServerId: (id: string) => void;
  refreshServers: () => void;
};

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: "📊" },
  { label: "Welcome Messages", to: "/welcome", icon: "👋" },
  { label: "Events Editor", to: "/events", icon: "📅" },
  { label: "Emoji Manager", to: "/emoji", icon: "😀" },
  { label: "Moderation", to: "/moderation", icon: "🛡️" }
];

export default function PanelLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { servers, loading, error, unauthorized, refresh } = useServers();
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedServerId && servers.length > 0) {
      setSelectedServerId(servers[0].id);
    }
  }, [servers, selectedServerId]);

  useEffect(() => {
    if (location.pathname === "/") {
      navigate("/dashboard", { replace: true });
    }
  }, [location.pathname, navigate]);

  const selectedServer = useMemo(
    () => servers.find((s) => s.id === selectedServerId) ?? null,
    [servers, selectedServerId]
  );

  if (unauthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-900 px-6">
        <div className="glass-panel w-full max-w-xl rounded-3xl p-10 text-center shadow-card">
          <p className="text-sm uppercase tracking-[0.25rem] text-accent-300">Sesja wymagana</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Zaloguj się, aby zarządzać botem</h1>
          <p className="mt-3 text-slate-400">
            Uwierzytelnienie odbywa się przez Discord OAuth. Po zalogowaniu backend ustawi bezpieczne
            ciasteczko HTTP-only.
          </p>
          <div className="mt-6 flex justify-center">
            <a
              href={AUTH_URL}
              className="rounded-2xl bg-accent-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-accent-400"
            >
              Przejdź do logowania Discord
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-900 px-6">
        <div className="h-24 w-24 animate-spin rounded-full border-4 border-white/10 border-t-accent-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-900 px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-7xl gap-6">
        <Sidebar
          servers={servers}
          selectedServerId={selectedServerId}
          onSelectServer={setSelectedServerId}
          navItems={navItems}
        />
        <main className="flex-1">
          {error && (
            <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}
          <Outlet
            context={
              {
                servers,
                selectedServerId,
                selectedServer,
                setSelectedServerId,
                refreshServers: refresh
              } satisfies PanelOutletContext
            }
          />
        </main>
      </div>
    </div>
  );
}
