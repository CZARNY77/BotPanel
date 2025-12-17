import { FormEvent, useState } from "react";
import TopBar from "../components/TopBar";
import { changeHouseName } from "../api/client";
import { usePanelContext } from "../hooks/usePanelContext";

export default function ModerationPage() {
  const { selectedServerId } = usePanelContext();
  const [houseName, setHouseName] = useState("Midnight Shield");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toggles, setToggles] = useState([
    { key: "profanity", label: "Profanity Filter", desc: "Blokada wulgaryzmów", enabled: true },
    { key: "antiLink", label: "Anti-Link", desc: "Usuwanie linków bez uprawnień", enabled: true },
    { key: "antiCaps", label: "Anti-Caps", desc: "Limit CAPS LOCK", enabled: false },
    { key: "raidMode", label: "Raid Mode", desc: "Tryb lockdown dla mass-join", enabled: false }
  ]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedServerId) return;
    setSaving(true);
    setStatus(null);
    try {
      await changeHouseName(selectedServerId, houseName);
      setStatus("Zmieniono nazwę domu moderacji poprzez /api/change_house_name.");
    } catch (err) {
      setStatus((err as Error).message ?? "Nie udało się zapisać.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <TopBar
        title="Moderation"
        subtitle="Zarządzaj automatycznymi narzędziami moderacji bota."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="glass-panel lg:col-span-2 rounded-3xl p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Funkcje</p>
              <h2 className="text-xl font-semibold text-white">Moduły bezpieczeństwa</h2>
            </div>
            <span className="rounded-full bg-accent-500/20 px-3 py-1 text-xs text-accent-100">
              Live config
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {toggles.map((action) => (
              <div
                key={action.key}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4"
              >
                <div>
                  <p className="font-semibold text-white">{action.label}</p>
                  <p className="text-sm text-slate-400">{action.desc}</p>
                  <p className="text-xs text-slate-500">
                    Status: {action.enabled ? "aktywny" : "wstrzymany"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setToggles((prev) =>
                      prev.map((t) =>
                        t.key === action.key ? { ...t, enabled: !t.enabled } : t
                      )
                    )
                  }
                  className={`relative h-6 w-12 rounded-full transition ${
                    action.enabled ? "bg-accent-500" : "bg-white/10"
                  }`}
                  aria-pressed={action.enabled}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                      action.enabled ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-3xl p-6 shadow-card">
          <p className="text-xs uppercase tracking-wide text-slate-400">House Name</p>
          <h2 className="text-xl font-semibold text-white">Branding moderacji</h2>
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <input
              value={houseName}
              onChange={(e) => setHouseName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-surface-800 px-4 py-3 text-white outline-none ring-2 ring-transparent transition focus:ring-accent-400/30"
            />
            <button
              type="submit"
              disabled={saving || !selectedServerId}
              className="w-full rounded-2xl bg-accent-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-accent-400 disabled:cursor-not-allowed disabled:bg-white/10"
            >
              {saving ? "Zapisywanie..." : "Zapisz"}
            </button>
            {status && <p className="text-sm text-slate-300">{status}</p>}
          </form>
          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
            • Przekazuj short-lived token OAuth2 w nagłówku autoryzacji. <br />
            • Backend weryfikuje role/admin per guild przez Discord, nie ufaj klientowi. <br />
            • Docelowe rozszerzenia (Raid metrics, AI heurystyki) opiszemy w specyfikacji backend.
          </div>
        </section>
      </div>
    </div>
  );
}
