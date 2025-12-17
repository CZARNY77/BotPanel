import { useEffect, useMemo, useState } from "react";
import TopBar from "../components/TopBar";
import { getEmojis } from "../api/client";
import { EmojiItem } from "../api/types";
import { usePanelContext } from "../hooks/usePanelContext";

export default function EmojiPage() {
  const { selectedServerId } = usePanelContext();
  const [emojis, setEmojis] = useState<EmojiItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triggerEmoji, setTriggerEmoji] = useState("");
  const [triggerUrl, setTriggerUrl] = useState("");
  const [triggers, setTriggers] = useState<
    { id: string; emoji: string; target: string; channel?: string }[]
  >([]);
  const [channel, setChannel] = useState("#general");

  useEffect(() => {
    async function load() {
      if (!selectedServerId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getEmojis(selectedServerId);
        setEmojis(data);
      } catch (err) {
        setError((err as Error).message ?? "Nie udało się pobrać emoji.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedServerId]);

  const filtered = useMemo(
    () => emojis.filter((emoji) => emoji.name.toLowerCase().includes(query.toLowerCase())),
    [emojis, query]
  );

  return (
    <div className="space-y-6">
      <TopBar
        title="Emoji Manager"
        subtitle="Mapuj emoji na reakcje obrazkowe i trzymaj listę w sync z ConqBot API."
        actions={
          <button className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-accent-400/50">
            Synchronizuj
          </button>
        }
      />

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <section className="glass-panel rounded-3xl p-6 shadow-card">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Trigger</p>
                <h2 className="text-xl font-semibold text-white">Nowe powiązanie</h2>
              </div>
              <span className="rounded-full bg-accent-500/20 px-3 py-1 text-xs text-accent-100">
                Mockowane do czasu endpointu
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="text-sm text-slate-300">Emoji</label>
                <input
                  value={triggerEmoji}
                  onChange={(e) => setTriggerEmoji(e.target.value)}
                  placeholder="np. :party:"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-surface-800 px-4 py-3 text-white outline-none ring-2 ring-transparent transition focus:ring-accent-400/30"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300">Kanał</label>
                <input
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-surface-800 px-4 py-3 text-white outline-none ring-2 ring-transparent transition focus:ring-accent-400/30"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300">URL obrazka/GIF</label>
                <input
                  value={triggerUrl}
                  onChange={(e) => setTriggerUrl(e.target.value)}
                  placeholder="https://cdn..."
                  className="mt-2 w-full rounded-xl border border-white/10 bg-surface-800 px-4 py-3 text-white outline-none ring-2 ring-transparent transition focus:ring-accent-400/30"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!triggerEmoji || !triggerUrl) return;
                  setTriggers((prev) => [
                    { id: crypto.randomUUID(), emoji: triggerEmoji, target: triggerUrl, channel },
                    ...prev
                  ]);
                  setTriggerEmoji("");
                  setTriggerUrl("");
                }}
                className="rounded-2xl bg-accent-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-accent-400"
              >
                Dodaj trigger
              </button>
              <p className="text-xs text-slate-400">
                Endpoint do zapisu triggerów zostanie dodany do specyfikacji backend (tymczasowy mock).
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Zasady</p>
            <ul className="mt-2 space-y-2 text-xs text-slate-300">
              <li>• Używaj emoji istniejących w ConqBot API dla wybranego serwera.</li>
              <li>• Linki powinny wskazywać na publiczne GIF/PNG/JPG.</li>
              <li>• Docelowy kanał będzie walidowany po stronie backend.</li>
              <li>• Short-lived token OAuth2 dołącz do każdego requestu.</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="glass-panel rounded-3xl p-6 shadow-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Emoji</p>
            <h2 className="text-xl font-semibold text-white">Biblioteka</h2>
          </div>
          <input
            placeholder="Szukaj emoji"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-surface-800 px-4 py-2 text-sm text-white outline-none ring-2 ring-transparent transition focus:ring-accent-400/30 md:w-64"
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {loading && <p className="text-sm text-slate-400">Ładowanie emoji...</p>}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-slate-400">Brak emoji spełniających kryteria.</p>
          )}
          {filtered.map((emoji) => (
            <div key={emoji.id} className="rounded-2xl border border-white/5 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <img
                  src={emoji.url}
                  alt={emoji.name}
                  className="h-12 w-12 rounded-xl border border-white/5 object-cover"
                />
                <div>
                  <p className="font-semibold text-white">{emoji.name}</p>
                  <p className="text-xs text-slate-400">{emoji.animated ? "Animowane" : "Statyczne"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="glass-panel rounded-3xl p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Triggers</p>
            <h2 className="text-xl font-semibold text-white">Aktywne powiązania</h2>
          </div>
          <span className="text-xs text-slate-400">
            Lokalny mock do czasu dedykowanego endpointu
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {triggers.length === 0 && (
            <p className="text-sm text-slate-400">Brak triggerów — dodaj nowy powyżej.</p>
          )}
          {triggers.map((trigger) => (
            <div
              key={trigger.id}
              className="flex items-start justify-between rounded-2xl border border-white/5 bg-white/5 p-4"
            >
              <div>
                <p className="font-semibold text-white">{trigger.emoji}</p>
                <p className="text-xs text-slate-400">Kanał: {trigger.channel}</p>
                <p className="text-xs text-slate-500 break-all">{trigger.target}</p>
              </div>
              <button
                onClick={() => setTriggers((prev) => prev.filter((t) => t.id !== trigger.id))}
                className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-200 transition hover:border-red-400/50 hover:text-red-200"
              >
                Usuń
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
