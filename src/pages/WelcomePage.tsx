import { FormEvent, useState } from "react";
import TopBar from "../components/TopBar";
import { createEvent } from "../api/client";
import { usePanelContext } from "../hooks/usePanelContext";

export default function WelcomePage() {
  const { selectedServerId, selectedServer } = usePanelContext();
  const [welcomeText, setWelcomeText] = useState(
    "👋 Witaj {user}! Miło cię widzieć w {server}. Zapoznaj się z regulaminem i baw się dobrze."
  );
  const [channel, setChannel] = useState("#welcome");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedServerId) return;

    setSaving(true);
    setFeedback(null);
    try {
      await createEvent({
        id: crypto.randomUUID(),
        name: "Welcome Message",
        description: welcomeText,
        channel,
        serverId: selectedServerId
      });
      setFeedback("Zapisano ustawienia powitań w backendzie.");
    } catch (err) {
      setFeedback((err as Error).message ?? "Nie udało się zapisać.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <TopBar
        title="Welcome Messages"
        subtitle="Personalizuj powitania użytkowników bezpośrednio przez API"
      />

      <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 shadow-card">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="text-sm text-slate-300">Kanał docelowy</label>
              <input
                type="text"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-surface-800 px-4 py-3 text-white outline-none ring-2 ring-transparent transition focus:ring-accent-400/30"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">Treść wiadomości</label>
              <textarea
                value={welcomeText}
                onChange={(e) => setWelcomeText(e.target.value)}
                rows={6}
                className="mt-2 w-full rounded-xl border border-white/10 bg-surface-800 px-4 py-3 text-white outline-none ring-2 ring-transparent transition focus:ring-accent-400/30"
              />
              <p className="mt-2 text-xs text-slate-400">
                Dostępne zmienne: {"{user}"}, {"{server}"}. Backend obsłuży renderowanie i wysyłkę.
              </p>
            </div>
            <button
              type="submit"
              disabled={saving || !selectedServerId}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-accent-400 disabled:cursor-not-allowed disabled:bg-white/10"
            >
              {saving ? "Zapisywanie..." : "Zapisz ustawienia"}
            </button>
            {feedback && <p className="text-sm text-slate-300">{feedback}</p>}
          </div>
          <div className="rounded-2xl border border-white/5 bg-surface-800/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Podgląd</p>
            <div className="mt-3 rounded-2xl bg-gradient-to-br from-white/5 to-accent-500/5 p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent-500/30" />
                <div>
                  <p className="font-semibold text-white">{selectedServer?.name ?? "Serwer"}</p>
                  <p className="text-xs text-slate-400"># {channel.replace("#", "")}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-100">{welcomeText}</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
