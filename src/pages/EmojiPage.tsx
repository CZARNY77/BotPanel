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
        subtitle="Przeglądaj emoji i zsynchronizuj je z ConqBot API."
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
    </div>
  );
}
