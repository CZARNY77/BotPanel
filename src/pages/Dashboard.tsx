import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getInviteUrl, getServers } from "../api/client";
import type { Server } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";
import { LoadingScreen } from "../components/LoadingScreen";

export const Dashboard = () => {
  const { user } = useAuth();
  const [servers, setServers] = useState<Server[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadServers = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getServers();
        if (active) {
          setServers(data);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Nie udalo sie pobrac serwerow.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadServers();
    return () => {
      active = false;
    };
  }, []);

  const visibleServers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return servers;
    }
    return servers.filter((server) => server.name.toLowerCase().includes(term));
  }, [servers, search]);

  const handleInvite = async (serverId?: string) => {
    setInviteLoading(true);
    try {
      const url = await getInviteUrl(serverId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udalo sie pobrac linku zaproszenia.");
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen label="Pobieramy serwery..." />;
  }

  return (
    <div className="dashboard">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Witaj{user ? `, ${user.username}` : ""}.</h1>
          <p className="lead">
            Masz pelna kontrole nad ustawieniami ConqBot na serwerach, ktorymi zarzadzasz.
          </p>
        </div>
        <div className="header-actions">
          <Button onClick={() => handleInvite()} disabled={inviteLoading}>
            {inviteLoading ? "Tworzymy zaproszenie..." : "Dodaj bota na nowy serwer"}
          </Button>
        </div>
      </section>

      <section className="dashboard-toolbar">
        <div className="search">
          <input
            type="search"
            placeholder="Szukaj serwera..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="stats">
          <div>
            <strong>{servers.length}</strong>
            <span>serwerow</span>
          </div>
          <div>
            <strong>{servers.filter((server) => server.hasBot).length}</strong>
            <span>aktywnych</span>
          </div>
        </div>
      </section>

      {error ? <div className="alert error">{error}</div> : null}

      <section className="server-grid">
        {visibleServers.length === 0 ? (
          <div className="empty-state">
            <h3>Brak serwerow</h3>
            <p>Dodaj ConqBot na pierwszy serwer lub sprawdz uprawnienia.</p>
            <Button onClick={() => handleInvite()} disabled={inviteLoading}>
              Dodaj bota
            </Button>
          </div>
        ) : (
          visibleServers.map((server) => (
            <article key={server.id} className="card server-card reveal">
              <div className="server-info">
                <div className="server-icon">
                  {server.iconUrl ? (
                    <img src={server.iconUrl} alt={server.name} />
                  ) : (
                    <span>{server.name.slice(0, 1)}</span>
                  )}
                </div>
                <div>
                  <h3>{server.name}</h3>
                  <p>
                    {server.memberCount ? `${server.memberCount} czlonkow` : "Brak danych"}
                  </p>
                </div>
              </div>
              <div className="server-meta">
                <span className={`pill ${server.hasBot ? "success" : "warning"}`}>
                  {server.hasBot ? "Bot aktywny" : "Brak bota"}
                </span>
                {server.role ? <span className="pill ghost">{server.role}</span> : null}
              </div>
              <div className="server-actions">
                {server.hasBot ? (
                  <Link to={`/servers/${server.id}`} className="btn btn-outline">
                    Ustawienia
                  </Link>
                ) : (
                  <Button variant="outline" onClick={() => handleInvite(server.id)} disabled={inviteLoading}>
                    Zapros bota
                  </Button>
                )}
              </div>
            </article>
          ))
        )}
        <article className="card add-card reveal">
          <h3>Dodaj nowy serwer</h3>
          <p>Masz kolejny serwer? Dodaj ConqBot i zarzadzaj nim z tego samego panelu.</p>
          <Button onClick={() => handleInvite()} disabled={inviteLoading}>
            Zapros bota
          </Button>
        </article>
      </section>
    </div>
  );
};
