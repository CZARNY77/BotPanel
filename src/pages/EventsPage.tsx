import { FormEvent, useState } from "react";
import TopBar from "../components/TopBar";
import { BotEvent } from "../api/types";
import { createEvent } from "../api/client";
import { usePanelContext } from "../hooks/usePanelContext";

export default function EventsPage() {
  const { selectedServerId } = usePanelContext();
  const [events, setEvents] = useState<BotEvent[]>([]);
  const [name, setName] = useState("Nowy event");
  const [scheduledFor, setScheduledFor] = useState("");
  const [description, setDescription] = useState("Planowana aktywność community.");
  const [channel, setChannel] = useState("#general");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedServerId) return;
    setSaving(true);
    setStatus(null);
    try {
      const payload: BotEvent & { serverId: string } = {
        id: crypto.randomUUID(),
        name,
        description,
        scheduledFor,
        channel,
        createdBy: "You",
        serverId: selectedServerId
      };
      await createEvent(payload);
      setEvents((prev) => [payload, ...prev]);
      setStatus("Event utworzony przez API /api/create_event.");
    } catch (err) {
      setStatus((err as Error).message ?? "Nie udało się utworzyć eventu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <TopBar
        title="Events Editor"
        subtitle="Twórz i planuj eventy przy pomocy backendowego API ConqBot."
      />

      <form onSubmit={onSubmit} className="glass-panel rounded-3xl p-6 shadow-card space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-slate-300">Nazwa</label>
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-surface-800 px-4 py-3 text-white outline-none ring-2 ring-transparent transition focus:ring-accent-400/30"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-slate-300">Kanał</label>
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-surface-800 px-4 py-3 text-white outline-none ring-2 ring-transparent transition focus:ring-accent-400/30"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-slate-300">Data (ISO)</label>
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-surface-800 px-4 py-3 text-white outline-none ring-2 ring-transparent transition focus:ring-accent-400/30"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              placeholder="2025-02-10T18:00:00Z"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300">Opis</label>
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-surface-800 px-4 py-3 text-white outline-none ring-2 ring-transparent transition focus:ring-accent-400/30"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving || !selectedServerId}
          className="rounded-2xl bg-accent-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-accent-400 disabled:cursor-not-allowed disabled:bg-white/10"
        >
          {saving ? "Zapisywanie..." : "Utwórz event"}
        </button>
        {status && <p className="text-sm text-slate-300">{status}</p>}
      </form>

      <section className="glass-panel rounded-3xl p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Zaplanowane</p>
            <h2 className="text-xl font-semibold text-white">Eventy</h2>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {events.length === 0 && (
            <p className="text-sm text-slate-400">Brak eventów — dodaj nowy, aby zobaczyć listę.</p>
          )}
          {events.map((event) => (
            <div key={event.id} className="flex items-start justify-between rounded-2xl bg-white/5 p-4">
              <div>
                <p className="text-lg font-semibold text-white">{event.name}</p>
                <p className="text-sm text-slate-400">{event.description}</p>
                <p className="text-xs text-slate-500">
                  {event.scheduledFor || "Do ustalenia"} • {event.channel}
                </p>
              </div>
              <span className="rounded-full bg-accent-500/20 px-3 py-1 text-xs text-accent-100">
                {event.createdBy ?? "Bot"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
