import { FormEvent, useState } from "react";
import TopBar from "../components/TopBar";
import { changeHouseName } from "../api/client";
import { usePanelContext } from "../hooks/usePanelContext";

const actions = [
  { label: "Auto-moderacja", desc: "Filtr wulgaryzmów i flood.", enabled: true },
  { label: "Anty-raid", desc: "Ochrona przed masowym joinem.", enabled: true },
  { label: "Logi moderacji", desc: "Zapis akcji w dedykowanym kanale.", enabled: false }
];

export default function ModerationPage() {
  const { selectedServerId } = usePanelContext();
  const [houseName, setHouseName] = useState("Główna siedziba");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Funkcje</p>
            <h2 className="text-xl font-semibold text-white">Moduły</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {actions.map((action) => (
              <div
                key={action.label}
                className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/5 p-4"
              >
                <div className="mt-1 h-3 w-3 rounded-full bg-accent-400" />
                <div>
                  <p className="font-semibold text-white">{action.label}</p>
                  <p className="text-sm text-slate-400">{action.desc}</p>
                  <p className="text-xs text-slate-500">
                    Status: {action.enabled ? "aktywny" : "wstrzymany"}
                  </p>
                </div>
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
        </section>
      </div>
    </div>
  );
}
