import { useEffect, useMemo, useState } from "react";
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

  const mockRoles = useMemo(
    () => [
      { id: "742910", name: "Command", members: 12 },
      { id: "742911", name: "Officers", members: 38 },
      { id: "742912", name: "Raid Team", members: 86 },
      { id: "742913", name: "Recruits", members: 142 },
      { id: "742914", name: "Guests", members: 54 }
    ],
    []
  );

  const activityFeed = useMemo(
    () => [
      { label: "Nowi użytkownicy", value: "+42 / 24h", detail: "Rekrutacje stabilne" },
      { label: "Wiadomości", value: "3.4k / dobę", detail: "Aktywność na #ops" },
      { label: "Kanały tekstowe", value: "28 aktywnych", detail: "Low chatter: 4" },
      { label: "Role aktualizowane", value: "9 zmian", detail: "Promocje i degradacje" }
    ],
    []
  );

  return (
    <div className="space-y-6">
      <TopBar
        title="Overview"
        subtitle={selectedServer ? `Podsumowanie dla ${selectedServer.name}` : "Wybierz serwer"}
      />

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Weryfikacja bota"
          value={verification?.verified ? "Zweryfikowany" : "Oczekuje"}
          tone={verification?.verified ? "success" : "warning"}
          icon="✅"
        />
        <StatCard label="Role" value={mockRoles.length} icon="🎖️" tone="info" />
        <StatCard label="Emoji" value={emojis.length} icon="😀" tone="info" />
        <StatCard label="Aktywne moduły" value={5} icon="🧩" tone="info" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="glass-panel lg:col-span-2 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Sygnał operacyjny</p>
              <h2 className="text-xl font-semibold text-white">Aktywność żywa</h2>
            </div>
            <span className="rounded-full bg-accent-500/20 px-3 py-1 text-xs text-accent-100">
              Real-time uplink
            </span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {activityFeed.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/5 bg-white/5 p-4 shadow-inner"
              >
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className="text-xl font-semibold text-white">{item.value}</p>
                <p className="text-xs text-slate-500">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-3xl p-6">
          <p className="text-xs uppercase tracking-wide text-slate-400">Role</p>
          <h2 className="text-xl font-semibold text-white">Manifest</h2>
          <div className="mt-4 space-y-3">
            {mockRoles.map((role) => (
              <div
                key={role.id}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-3"
              >
                <div>
                  <p className="font-semibold text-white">{role.name}</p>
                  <p className="text-xs text-slate-400">ID: {role.id}</p>
                </div>
                <span className="rounded-full bg-accent-500/20 px-3 py-1 text-xs text-accent-100">
                  {role.members} czł.
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="glass-panel rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Emoji</p>
            <h2 className="text-xl font-semibold text-white">Ostatnio używane</h2>
          </div>
          <span className="text-xs text-slate-400">Źródło: ConqBot API</span>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
          {(loading ? [] : emojis.slice(0, 12)).map((emoji) => (
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
  );
}
