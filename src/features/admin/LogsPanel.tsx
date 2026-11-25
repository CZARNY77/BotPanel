import { useCallback, useEffect, useState } from "react";
import { getAdminLogs } from "../../api/endpoints/admin";
import type { AdminLogEntry, LogSource } from "../../api/types";
import { Button, IconButton } from "../../components/ui/Button";
import { EmptyState, ErrorState, Group, Skeleton, Tabs } from "../../components/ui/basics";
import { Icon, type IconName } from "../../components/ui/Icon";
import { categories, filterLogs, type LogCategory } from "./logCategories";

const LIMIT = 30;
const LEVELS = ["all", "DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"];

const levelStyle = (level: string): { icon: IconName; color: string } => {
  const l = level.toUpperCase();
  if (l === "ERROR" || l === "CRITICAL") return { icon: "warning", color: "var(--cb-err)" };
  if (l === "WARNING") return { icon: "warning", color: "var(--cb-warn)" };
  if (l === "DEBUG") return { icon: "console", color: "var(--cb-text-muted)" };
  return { icon: "info", color: "var(--cb-text-2)" };
};

const when = (iso?: string) => {
  if (!iso) return "–";
  const d = new Date(iso);
  const today = new Date().toDateString() === d.toDateString();
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return today ? time : `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" })} ${time}`;
};

export const LogsPanel = () => {
  const [source, setSource] = useState<LogSource>("conqbot");
  const [level, setLevel] = useState("all");
  const [category, setCategory] = useState<LogCategory>("all");
  const [logs, setLogs] = useState<AdminLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(
    async (reset: boolean, offset: number) => {
      setLoading(true);
      setError(null);
      try {
        const next = await getAdminLogs({ source, level: level === "all" ? undefined : level, limit: LIMIT, offset });
        setLogs((prev) => (reset ? next : [...prev, ...next]));
        setDone(next.length < LIMIT);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load logs.");
      } finally {
        setLoading(false);
      }
    },
    [source, level]
  );

  useEffect(() => {
    setLogs([]);
    void load(true, 0);
  }, [load]);

  const shown = source === "conqbot" ? filterLogs(logs, category) : logs;

  return (
    <Group
      title={
        <Tabs
          label="Log source"
          value={source}
          onChange={setSource}
          tabs={[
            { key: "conqbot", label: "Bot", icon: "bot" },
            { key: "botpanel", label: "Panel", icon: "overview" },
          ]}
        />
      }
      actions={
        <>
          <select className="select" style={{ width: 130 }} value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Level">
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l === "all" ? "All levels" : l}</option>
            ))}
          </select>
          <IconButton icon="refresh" label="Refresh" loading={loading} onClick={() => void load(true, 0)} />
        </>
      }
    >
      {source === "conqbot" ? (
        <div className="segmented" role="group" aria-label="Category" style={{ marginBottom: 12, flexWrap: "wrap" }}>
          {categories.map((c) => (
            <button key={c.key} type="button" aria-pressed={category === c.key} onClick={() => setCategory(c.key)}>
              <Icon name={c.icon} size="sm" /> {c.label}
            </button>
          ))}
        </div>
      ) : null}
      {error ? <ErrorState message={error} onRetry={() => void load(true, 0)} /> : null}
      {loading && !logs.length ? (
        <div className="stack">
          <Skeleton height={40} />
          <Skeleton height={40} />
          <Skeleton height={40} />
        </div>
      ) : shown.length === 0 && !error ? (
        <EmptyState icon="console" title="No logs match these filters." />
      ) : (
        <div className="list logs">
          {shown.map((log, index) => {
            const style = levelStyle(log.level);
            const id = log.id ?? String(index);
            const hasContext = Object.keys(log.context ?? {}).length > 0;
            return (
              <div key={id}>
                <div className={`list-row log-row${hasContext ? " list-row--click" : ""}`} onClick={() => hasContext && setOpen(open === id ? null : id)}>
                  <span style={{ color: style.color }} title={log.level}>
                    <Icon name={style.icon} size="sm" />
                  </span>
                  <span className="log-row__time num muted">{when(log.timestamp)}</span>
                  <div className="list-row__main">
                    <span className="log-row__msg">{log.message}</span>
                    {log.logger ? <span className="list-row__meta mono">{log.logger}</span> : null}
                  </div>
                  {hasContext ? <Icon name={open === id ? "chevronDown" : "chevronRight"} size="sm" /> : null}
                </div>
                {open === id ? <pre className="log-context">{JSON.stringify(log.context, null, 2)}</pre> : null}
              </div>
            );
          })}
        </div>
      )}
      {!done && logs.length ? (
        <div style={{ paddingTop: 12 }}>
          <Button size="sm" variant="ghost" loading={loading} onClick={() => void load(false, logs.length)}>
            Load more
          </Button>
        </div>
      ) : null}
    </Group>
  );
};
