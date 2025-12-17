import { FormEvent, useMemo, useState } from "react";
import TopBar from "../components/TopBar";
import { BotEvent } from "../api/types";
import { createEvent } from "../api/client";
import { usePanelContext } from "../hooks/usePanelContext";

export default function EventsPage() {
  const { selectedServerId } = usePanelContext();
  const [events, setEvents] = useState<(BotEvent & { recurrence?: string; rolePing?: string })[]>(
    []
  );
  const [name, setName] = useState("Nowy event");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [recurrence, setRecurrence] = useState("Brak");
  const [description, setDescription] = useState("Planowana aktywność community.");
  const [channel, setChannel] = useState("#general");
  const [rolePing, setRolePing] = useState("@everyone");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const recurrences = useMemo(
    () => ["Brak", "Co 7 dni", "Co 30 dni", "Custom cron"],
    []
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedServerId) return;
    setSaving(true);
    setStatus(null);
    try {
      const scheduledFor = date && time ? new Date(`${date}T${time}`).toISOString() : "";
      const payload: BotEvent & { serverId: string } = {
        id: crypto.randomUUID(),
        name,
        description: `${description}${recurrence !== "Brak" ? ` • ${recurrence}` : ""}`,
        scheduledFor,
        channel,
        createdBy: "You",
        serverId: selectedServerId
      };
      await createEvent(payload);
      setEvents((prev) => [
        { ...payload, recurrence: recurrence !== "Brak" ? recurrence : undefined, rolePing },
        ...prev
      ]);
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
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-slate-300">Tytuł</label>
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
                <label className="text-sm text-slate-300">Data</label>
                <input
                  type="date"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-surface-800 px-4 py-3 text-white outline-none ring-2 ring-transparent transition focus:ring-accent-400/30"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-slate-300">Godzina</label>
                <input
                  type="time"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-surface-800 px-4 py-3 text-white outline-none ring-2 ring-transparent transition focus:ring-accent-400/30"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-slate-300">Cykliczność</label>
                <select
                  className="mt-2 w-full rounded-xl border border-white/10 bg-surface-800 px-4 py-3 text-white outline-none ring-2 ring-transparent transition focus:ring-accent-400/30"
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value)}
                >
                  {recurrences.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300">Rola do oznaczenia</label>
                <input
                  className="mt-2 w-full rounded-xl border border-white/10 bg-surface-800 px-4 py-3 text-white outline-none ring-2 ring-transparent transition focus:ring-accent-400/30"
                  value={rolePing}
                  onChange={(e) => setRolePing(e.target.value)}
                  placeholder="@officers"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-300">Opis</label>
              <textarea
                className="mt-2 w-full rounded-xl border border-white/10 bg-surface-800 px-4 py-3 text-white outline-none ring-2 ring-transparent transition focus:ring-accent-400/30"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Checklist</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li>• Sprawdź, czy kanał istnieje w ConqBot API.</li>
              <li>• Wysyłaj short-lived token OAuth2 z każdym requestem.</li>
              <li>• Backend zweryfikuje role i uprawnienia per guild.</li>
              <li>• Recurrence/rolePing są tymczasowo mockowane frontem.</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || !selectedServerId}
            className="rounded-2xl bg-accent-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-accent-400 disabled:cursor-not-allowed disabled:bg-white/10"
          >
            {saving ? "Zapisywanie..." : "Utwórz event"}
          </button>
          {status && <p className="text-sm text-slate-300">{status}</p>}
        </div>
      </form>

      <section className="glass-panel rounded-3xl p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Zaplanowane</p>
            <h2 className="text-xl font-semibold text-white">Eventy</h2>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.length === 0 && (
            <p className="text-sm text-slate-400">Brak eventów — dodaj nowy, aby zobaczyć listę.</p>
          )}
          {events.map((event) => (
            <div key={event.id} className="rounded-2xl border border-white/5 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-white">{event.name}</p>
                  <p className="text-sm text-slate-400">{event.description}</p>
                  <p className="text-xs text-slate-500">
                    {event.scheduledFor || "Do ustalenia"} • {event.channel}
                  </p>
                  {event.recurrence && (
                    <p className="text-xs text-amber-200">Powtarzanie: {event.recurrence}</p>
                  )}
                  {event.rolePing && (
                    <p className="text-xs text-slate-400">Ping: {event.rolePing}</p>
                  )}
                </div>
                <span className="rounded-full bg-accent-500/20 px-3 py-1 text-xs text-accent-100">
                  {event.createdBy ?? "Bot"}
                </span>
              </div>
              <div className="mt-3 flex gap-2 text-xs">
                <button className="flex-1 rounded-xl border border-white/10 px-3 py-2 text-slate-200 transition hover:border-accent-400/50">
                  Edytuj
                </button>
                <button
                  onClick={() => setEvents((prev) => prev.filter((e) => e.id !== event.id))}
                  className="flex-1 rounded-xl border border-red-500/40 px-3 py-2 text-red-200 transition hover:bg-red-500/10"
                >
                  Usuń
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
