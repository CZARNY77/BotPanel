import { useState } from "react";
import { deletePresenceLog, getPresenceLogs } from "../../api/endpoints/presence";
import type { VoicePresenceLog } from "../../api/types";
import { Button, IconButton } from "../../components/ui/Button";
import { EmptyState, ErrorState, Group, Pill, Skeleton } from "../../components/ui/basics";
import { ConfirmDialog } from "../../components/ui/Dialog";
import { Icon } from "../../components/ui/Icon";
import { errorText, useToast } from "../../components/ui/Toast";
import type { Resource } from "../../hooks/useServerResource";
import { useServerScope } from "../../hooks/useServerResource";

export const PAGE = 20;

const short = (iso: string | null) => {
  if (!iso) return { day: "–", month: "", time: "" };
  const d = new Date(iso);
  return {
    day: String(d.getDate()),
    month: d.toLocaleString("en-GB", { month: "short" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
};

const byChannel = (log: VoicePresenceLog) =>
  log.channels.map((channel) => ({
    channel,
    members: log.members.filter((m) => m.channelId === channel.id),
  }));

export const History = ({ resource }: { resource: Resource<VoicePresenceLog[]> }) => {
  const { serverId } = useServerScope();
  const toast = useToast();
  const [open, setOpen] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<VoicePresenceLog | null>(null);
  const [busy, setBusy] = useState(false);
  const [more, setMore] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const logs = resource.data ?? [];

  const loadMore = async () => {
    setMore(true);
    try {
      const next = await getPresenceLogs(serverId, PAGE, logs.length);
      resource.setData((prev) => [...(prev ?? []), ...next]);
      if (next.length < PAGE) setExhausted(true);
    } catch (err) {
      toast.error(errorText(err, "Failed to load more snapshots."));
    } finally {
      setMore(false);
    }
  };

  const remove = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await deletePresenceLog(serverId, confirm.id);
      resource.setData((prev) => (prev ?? []).filter((log) => log.id !== confirm.id));
      toast.success("Snapshot deleted.");
      setConfirm(null);
    } catch (err) {
      toast.error(errorText(err, "Failed to delete snapshot."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Group
      title={<>History <span className="muted num">{logs.length}</span></>}
      icon="history"
      actions={<IconButton icon="refresh" label="Refresh" loading={resource.loading && logs.length > 0} onClick={() => void resource.reload()} />}
    >
      {resource.error ? <ErrorState message={resource.error} onRetry={() => void resource.reload()} /> : null}
      {resource.loading && !logs.length ? (
        <div className="stack">
          <Skeleton height={52} />
          <Skeleton height={52} />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState icon="voice" title="No snapshots yet">Run one now or add a schedule.</EmptyState>
      ) : (
        <div className="list">
          {logs.map((log) => {
            const date = short(log.createdAt);
            const expanded = open === log.id;
            return (
              <div key={log.id}>
                <div className={`list-row list-row--click${expanded ? " selected" : ""}`} role="button" tabIndex={0} aria-expanded={expanded} onClick={() => setOpen(expanded ? null : log.id)} onKeyDown={(e) => e.key === "Enter" && setOpen(expanded ? null : log.id)}>
                  <div className="date-tile">
                    <span className="date-tile__day">{date.day}</span>
                    <span className="date-tile__month">{date.month}</span>
                  </div>
                  <div className="list-row__main">
                    <span className="list-row__title truncate">{log.name || "Snapshot"}</span>
                    <span className="list-row__meta">
                      <span className="num">{date.time}</span>
                      <Icon name={log.source === "schedule" ? "clock" : "play"} size="sm" title={log.source === "schedule" ? "Scheduled" : "Manual"} />
                    </span>
                  </div>
                  <div className="stat-inline" title="Members">
                    <span className="stat-inline__value num">{log.totalMembers}</span>
                    <Icon name="users" size="sm" />
                  </div>
                  <div className="stat-inline muted" title="Channels">
                    <span className="num">{log.totalChannels}</span>
                    <Icon name="voice" size="sm" />
                  </div>
                  <IconButton icon="trash" variant="danger" label="Delete snapshot" onClick={(e) => { e.stopPropagation(); setConfirm(log); }} />
                </div>
                {expanded ? (
                  <div className="log-detail">
                    {byChannel(log).map(({ channel, members }) => (
                      <div key={channel.id} className="log-detail__channel">
                        <div className="row">
                          <Icon name="voice" size="sm" />
                          <strong>{channel.name}</strong>
                          <span className="muted num">{members.length}</span>
                        </div>
                        <div className="chips">
                          {members.length ? members.map((m) => <Pill key={m.id}>{m.name}</Pill>) : <span className="muted small">Empty</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
          {!exhausted && logs.length >= PAGE ? (
            <div style={{ paddingTop: 12 }}>
              <Button size="sm" variant="ghost" loading={more} onClick={() => void loadMore()}>Load more</Button>
            </div>
          ) : null}
        </div>
      )}
      {confirm ? (
        <ConfirmDialog
          title="Delete snapshot?"
          message={`“${confirm.name || "Snapshot"}” with ${confirm.totalMembers} members will be removed for good.`}
          confirmLabel="Delete"
          danger
          busy={busy}
          onConfirm={() => void remove()}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
    </Group>
  );
};
