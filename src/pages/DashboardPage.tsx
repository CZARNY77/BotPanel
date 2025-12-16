import { useEffect, useState } from "react";
import { getEmojis, getServerVerification } from "../api/client";
import { EmojiItem } from "../api/types";
import { usePanelContext } from "../hooks/usePanelContext";
import StatCard from "../components/StatCard";
import TopBar from "../components/TopBar";

type VerificationState = {
  verified: boolean;
  message?: string;
};

export default function DashboardPage() {
  const { selectedServerId, selectedServer } = usePanelContext();
  const [verification, setVerification] = useState<VerificationState | null>(null);
  const [emojis, setEmojis] = useState<EmojiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!selectedServerId) return;
      setLoading(true);
      setError(null);
      try {
        const [ver, emojiList] = await Promise.all([
          getServerVerification(selectedServerId),
          getEmojis(selectedServerId)
        ]);
        setVerification(ver);
        setEmojis(emojiList);
      } catch (err) {
        setError((err as Error).message ?? "Nie udało się pobrać danych serwera.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedServerId]);

  return (
    <div className="space-y-6">
      <TopBar
        title="Dashboard"
        subtitle={selectedServer ? `Podsumowanie dla ${selectedServer.name}` : "Wybierz serwer"}
      />

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Weryfikacja bota"
          value={verification?.verified ? "Zweryfikowany" : "Oczekuje"}
          tone={verification?.verified ? "success" : "warning"}
          icon="✅"
        />
        <StatCard label="Ilość emoji" value={emojis.length} icon="😊" tone="info" />
        <StatCard label="Aktywne moduły" value={5} icon="🧩" tone="info" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="glass-panel lg:col-span-2 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Aktywność</p>
              <h2 className="text-xl font-semibold text-white">Najnowsze zmiany</h2>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {["Automatyczne powitania", "Nowy event Gildii", "Zaktualizowano moderację"].map(
              (item, idx) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl bg-white/5 p-4"
                >
                  <div className="mt-1 h-2 w-2 rounded-full bg-accent-400" />
                  <div>
                    <p className="font-medium text-white">{item}</p>
                    <p className="text-sm text-slate-400">
                      {loading ? "Synchronizuję..." : `Akcja #${idx + 1} na ${selectedServer?.name ?? "serwerze"}.`}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        <section className="glass-panel rounded-3xl p-6">
          <p className="text-xs uppercase tracking-wide text-slate-400">Emoji</p>
          <h2 className="text-xl font-semibold text-white">Ostatnio używane</h2>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {(loading ? [] : emojis.slice(0, 8)).map((emoji) => (
              <div
                key={emoji.id}
                className="flex aspect-square flex-col items-center justify-center rounded-2xl bg-white/5 text-center text-xs"
              >
                <img
                  src={emoji.url}
                  alt={emoji.name}
                  className="mb-2 h-10 w-10 rounded-xl object-cover"
                />
                <span className="truncate text-slate-300">{emoji.name}</span>
              </div>
            ))}
            {loading && <p className="col-span-4 text-sm text-slate-400">Ładowanie emoji...</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
