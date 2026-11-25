import { useEffect, useState } from "react";
import { getEventSignups, pingEvent } from "../../api/endpoints/events";
import type { EventItem, EventPingMode, EventSignups, SignupStatus } from "../../api/types";
import { Button, IconButton } from "../../components/ui/Button";
import { ErrorState, Group, Pill, Skeleton } from "../../components/ui/basics";
import { Icon, type IconName } from "../../components/ui/Icon";
import { errorText, useToast } from "../../components/ui/Toast";
import { useServerMeta } from "../../hooks/useServerMeta";
import { useServerScope } from "../../hooks/useServerResource";
import { dateParts, durationLabel, repeatLabel } from "./model";

const STATUS: { key: SignupStatus; label: string; icon: IconName; tone: string }[] = [
  { key: "Yes", label: "Going", icon: "yes", tone: "var(--bd-ok)" },
  { key: "Maybe", label: "Maybe", icon: "maybe", tone: "var(--bd-warn)" },
  { key: "No", label: "Not going", icon: "no", tone: "var(--bd-err)" },
];

const PINGS: { mode: EventPingMode; label: string; title: string }[] = [
  { mode: "unchecked", label: "No answer", title: "Ping role members who have not answered" },
  { mode: "tentative", label: "Maybe", title: "Ping everyone who answered Maybe" },
  { mode: "declined", label: "Not going", title: "Ping everyone who answered No" },
];

export const EventDetail = ({
  event,
  onEdit,
  onDelete,
  onOpen,
}: {
  event: EventItem;
  onEdit: () => void;
  onDelete: () => void;
  onOpen: (eventId: string) => void;
}) => {
  const { serverId } = useServerScope();
  const { channelName, roleName } = useServerMeta();
  const toast = useToast();
  const [signups, setSignups] = useState<EventSignups | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pinging, setPinging] = useState<EventPingMode | null>(null);

  const load = () => {
    setSignups(null);
    setError(null);
    getEventSignups(serverId, event.id)
      .then(setSignups)
      .catch((err) => setError(errorText(err, "Failed to load signups.")));
  };

  useEffect(() => load(), [serverId, event.id]);

  const ping = async (mode: EventPingMode) => {
    setPinging(mode);
    try {
      const count = await pingEvent(serverId, event.id, mode);
      toast.success(`Ping sent to ${count} member${count === 1 ? "" : "s"}.`);
    } catch (err) {
      toast.error(errorText(err, "Failed to ping."));
    } finally {
      setPinging(null);
    }
  };

  const parts = dateParts(event.date);
  return (
    <Group
      title={event.title}
      actions={
        <>
          <IconButton icon="edit" label={event.active ? "Edit event" : "Finished events cannot be edited"} disabled={!event.active} onClick={onEdit} />
          <IconButton icon="trash" variant="danger" label="Delete event" onClick={onDelete} />
        </>
      }
    >
      <div className="stack stack--lg">
        <div className="event-facts">
          <div className={`date-tile${event.active ? "" : " date-tile--muted"}`}>
            <span className="date-tile__day">{parts.day}</span>
            <span className="date-tile__month">{parts.month}</span>
          </div>
          <div className="stack" style={{ gap: 4 }}>
            <strong className="num">
              {parts.weekday} {event.time} <span className="muted small">{event.timezone}</span>
            </strong>
            <span className="muted small row">
              <Icon name="clock" size="sm" /> {durationLabel(event.durationMinutes)}
              <Icon name="repeat" size="sm" /> {repeatLabel(event.intervalDays)}
            </span>
            <span className="muted small row">
              <Icon name="hash" size="sm" /> {channelName.get(event.channelId) ?? event.channelId}
              {event.roleId ? <><Icon name="at" size="sm" /> {roleName.get(event.roleId) ?? event.roleId}</> : null}
            </span>
          </div>
        </div>

        {!event.active ? (
          <div className="notice notice--info">
            <Icon name="lock" />
            <div className="grow">
              <strong>Finished.</strong> Editing is locked so the series is not restarted by accident.
              {event.nextEventId ? (
                <div>
                  <button type="button" className="link-button" onClick={() => onOpen(event.nextEventId!)}>
                    Open the next instance
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {event.description ? <p className="prose">{event.description}</p> : null}

        <div className="signup-totals">
          {STATUS.map((s) => (
            <div key={s.key} className="signup-total" style={{ color: s.tone }} title={s.label}>
              <Icon name={s.icon} />
              <span className="stat__value">{event.signups[s.key.toLowerCase() as "yes" | "no" | "maybe"]}</span>
              <span className="stat__label">{s.label}</span>
            </div>
          ))}
          {signups?.unchecked != null ? (
            <div className="signup-total" title="Role members without an answer">
              <Icon name="bell" />
              <span className="stat__value">{signups.unchecked}</span>
              <span className="stat__label">No answer</span>
            </div>
          ) : null}
        </div>

        {event.active ? (
          <div className="row">
            <span className="muted small row"><Icon name="bell" size="sm" /> Ping</span>
            {PINGS.map((p) => (
              <Button
                key={p.mode}
                size="sm"
                loading={pinging === p.mode}
                disabled={Boolean(pinging) || (p.mode === "unchecked" && !event.roleId)}
                title={p.mode === "unchecked" && !event.roleId ? "Set a role to use this ping" : p.title}
                onClick={() => void ping(p.mode)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        ) : null}

        <div>
          <h3 style={{ marginBottom: 8 }}>Signups</h3>
          {error ? <ErrorState message={error} onRetry={load} /> : null}
          {!signups && !error ? <Skeleton height={60} /> : null}
          {signups ? (
            signups.signups.length === 0 ? (
              <p className="muted small">Nobody has answered yet.</p>
            ) : (
              <div className="signup-groups">
                {STATUS.map((s) => {
                  const people = signups.signups.filter((x) => x.status === s.key);
                  if (!people.length) return null;
                  return (
                    <div key={s.key} className="row" style={{ alignItems: "flex-start" }}>
                      <span style={{ color: s.tone }} title={s.label}><Icon name={s.icon} /></span>
                      <div className="chips grow">{people.map((p) => <Pill key={p.userId}>{p.name}</Pill>)}</div>
                    </div>
                  );
                })}
              </div>
            )
          ) : null}
        </div>
      </div>
    </Group>
  );
};
