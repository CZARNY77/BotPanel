import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getServerSettings, getServers, updateServerSettings } from "../api/client";
import type { Server, ServerSettings } from "../api/types";
import { Button } from "../components/Button";
import { LoadingScreen } from "../components/LoadingScreen";

const emptySettings: ServerSettings = {
  prefix: "!",
  language: "pl-PL",
  timezone: "Europe/Warsaw",
  welcomeMessage: "",
  logChannelId: "",
  autoRoleId: "",
  features: {
    autoModeration: false,
    eventReminders: false,
    voicePresence: false,
  },
};

export const ServerSettings = () => {
  const { id } = useParams();
  const [server, setServer] = useState<Server | null>(null);
  const [settings, setSettings] = useState<ServerSettings>(emptySettings);
  const [initialSettings, setInitialSettings] = useState<ServerSettings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      if (!id) {
        setError("Nie znaleziono serwera.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const [serversData, settingsData] = await Promise.all([
          getServers(),
          getServerSettings(id),
        ]);
        if (!active) {
          return;
        }
        setServer(serversData.find((item) => item.id === id) ?? null);
        setSettings(settingsData);
        setInitialSettings(settingsData);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Nie udalo sie pobrac ustawien.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      active = false;
    };
  }, [id]);

  const isDirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(initialSettings),
    [settings, initialSettings]
  );

  const handleChange = <K extends keyof ServerSettings>(
    key: K,
    value: ServerSettings[K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleFeatureToggle = (key: keyof ServerSettings["features"]) => {
    setSettings((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: !prev.features[key],
      },
    }));
  };

  const handleSubmit = async () => {
    if (!id) {
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateServerSettings(id, settings);
      setSettings(updated);
      setInitialSettings(updated);
      setSuccess("Zapisano zmiany.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udalo sie zapisac zmian.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingScreen label="Ladujemy ustawienia..." />;
  }

  if (!id) {
    return (
      <div className="page">
        <p className="alert error">Nie znaleziono serwera.</p>
        <Link to="/dashboard" className="btn btn-ghost">
          Wroc do dashboardu
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Ustawienia serwera</p>
          <h1>{server?.name ?? "Serwer"}</h1>
          <p className="lead">
            Zmieniaj konfiguracje ConqBot dla tego serwera. Wszystkie zmiany zapisuja sie po kliknieciu.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/dashboard" className="btn btn-ghost">
            Wroc
          </Link>
          <Button onClick={handleSubmit} disabled={!isDirty || saving}>
            {saving ? "Zapisujemy..." : "Zapisz zmiany"}
          </Button>
        </div>
      </div>

      {error ? <div className="alert error">{error}</div> : null}
      {success ? <div className="alert success">{success}</div> : null}

      <div className="settings-grid">
        <section className="card">
          <h3>Podstawowe</h3>
          <div className="form-grid">
            <label>
              Prefix komend
              <input
                value={settings.prefix}
                onChange={(event) => handleChange("prefix", event.target.value)}
              />
            </label>
            <label>
              Jezyk panelu
              <select
                value={settings.language}
                onChange={(event) => handleChange("language", event.target.value)}
              >
                <option value="pl-PL">Polski</option>
                <option value="en-US">English</option>
              </select>
            </label>
            <label>
              Strefa czasowa
              <input
                value={settings.timezone}
                onChange={(event) => handleChange("timezone", event.target.value)}
              />
            </label>
            <label>
              Kanal logow (ID)
              <input
                value={settings.logChannelId}
                onChange={(event) => handleChange("logChannelId", event.target.value)}
                placeholder="#logi"
              />
            </label>
          </div>
        </section>

        <section className="card">
          <h3>Powitania i role</h3>
          <div className="form-grid">
            <label className="full">
              Wiadomosc powitalna
              <textarea
                rows={4}
                value={settings.welcomeMessage}
                onChange={(event) => handleChange("welcomeMessage", event.target.value)}
              />
            </label>
            <label>
              Automatyczna rola (ID)
              <input
                value={settings.autoRoleId}
                onChange={(event) => handleChange("autoRoleId", event.target.value)}
                placeholder="@Newbie"
              />
            </label>
          </div>
        </section>

        <section className="card">
          <h3>Automatyzacje</h3>
          <div className="toggle-list">
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.features.autoModeration}
                onChange={() => handleFeatureToggle("autoModeration")}
              />
              <span>Automoderacja wiadomosci</span>
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.features.eventReminders}
                onChange={() => handleFeatureToggle("eventReminders")}
              />
              <span>Powiadomienia o wydarzeniach</span>
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.features.voicePresence}
                onChange={() => handleFeatureToggle("voicePresence")}
              />
              <span>Monitorowanie aktywnosci voice</span>
            </label>
          </div>
        </section>
      </div>
    </div>
  );
};
