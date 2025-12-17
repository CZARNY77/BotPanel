import { FormEvent, useMemo, useState } from "react";
import TopBar from "../components/TopBar";
import { usePanelContext } from "../hooks/usePanelContext";

export default function WelcomePage() {
  const { selectedServerId, selectedServer } = usePanelContext();
  const [welcomeText, setWelcomeText] = useState(
    "👋 Witaj {user}! Miło cię widzieć w {server}. Zapoznaj się z regulaminem i baw się dobrze."
  );
  const [channel, setChannel] = useState("#welcome");
  const [messageType, setMessageType] = useState<"embed" | "plain">("embed");
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedServerId) return;

    setSaving(true);
    setFeedback(null);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setFeedback(
      "Konfiguracja zapisana lokalnie. Endpoint do powitań zostanie podłączony, gdy backend go udostępni."
    );
    setSaving(false);
  };

  const handleMagicGenerate = () => {
    const presets = [
      "🚀 {user}, meldunek przyjęty! Wbij na {server} i sprawdź #briefing.",
      "🎖️ {user} dołączył do {server}. Przydzielamy rolę rekruta i życzymy powodzenia!",
      "🛰️ {user}, kanał kontrolny #ops czeka na Twój pierwszy raport w {server}."
    ];
    setWelcomeText(presets[Math.floor(Math.random() * presets.length)]);
  };

  const previewAvatar = useMemo(
    () => `https://api.dicebear.com/7.x/identicon/svg?seed=${selectedServer?.id ?? "conq"}`,
    [selectedServer?.id]
  );

  return (
    <div className="space-y-6">
      <TopBar title="Welcome Messages" subtitle="Programuj powitania z widokiem Discord Preview" />

      <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 shadow-card">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Moduł</p>
                <h2 className="text-xl font-semibold text-white">Konfiguracja</h2>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-surface-800 text-accent-500"
                />
                Enable
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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
                <label className="text-sm text-slate-300">Typ wiadomości</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {["embed", "plain"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setMessageType(type as "embed" | "plain")}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                        messageType === type
                          ? "bg-accent-500 text-white shadow-card"
                          : "bg-white/5 text-slate-200 hover:bg-white/10"
                      }`}
                    >
                      {type === "embed" ? "Embed" : "Plain Text"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300">Treść wiadomości</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleMagicGenerate}
                    className="rounded-xl border border-accent-400/40 px-3 py-2 text-xs font-semibold text-accent-100 transition hover:bg-accent-500/10"
                  >
                    Magic Generate
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setWelcomeText(
                        "👋 Witaj {user}! Przydział na {server} aktywny. Kanał #ops ma briefing."
                      )
                    }
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/10"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <textarea
                value={welcomeText}
                onChange={(e) => setWelcomeText(e.target.value)}
                rows={6}
                className="mt-2 w-full rounded-xl border border-white/10 bg-surface-800 px-4 py-3 text-white outline-none ring-2 ring-transparent transition focus:ring-accent-400/30"
              />
              <p className="mt-2 text-xs text-slate-400">
                Dostępne zmienne: {"{user}"}, {"{server}"} — backend Discord OAuth2 zweryfikuje
                uprawnienia i wstrzyknie dane sesji.
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
            <p className="text-xs uppercase tracking-wide text-slate-400">Discord Preview</p>
            <div className="mt-3 space-y-3 rounded-2xl bg-gradient-to-br from-white/5 to-accent-500/5 p-4">
              <div className="flex items-center gap-3">
                <img src={previewAvatar} alt="" className="h-10 w-10 rounded-full bg-white/10" />
                <div>
                  <p className="font-semibold text-white">{selectedServer?.name ?? "Server Bot"}</p>
                  <p className="text-xs text-slate-400"># {channel.replace("#", "")}</p>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                {messageType === "embed" ? (
                  <div className="rounded-lg border border-accent-500/40 bg-black/40 p-3">
                    <p className="text-xs uppercase text-accent-300">Embed</p>
                    <p className="mt-2 text-sm text-slate-100">{welcomeText}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-100">{welcomeText}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
