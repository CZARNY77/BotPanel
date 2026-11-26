import { useEffect, useState } from "react";
import { getEventSignups, pingEvent } from "../../api/endpoints/events";
import type { EventItem, EventPingMode, EventSignups, SignupStatus } from "../../api/types";
import { Button, IconButton } from "../../components/ui/Button";
import { ErrorState, Group, Pill, Skeleton } from "../../components/ui/basics";
import { Icon, type IconName } from "../../components/ui/Icon";
import { useT, type MessageKey } from "../../i18n";
import { errorText, useToast } from "../../components/ui/Toast";
import { useServerMeta } from "../../hooks/useServerMeta";
import { useServerScope } from "../../hooks/useServerResource";
import { dateParts, durationLabel, repeatLabel } from "./model";

const STATUS: { key: SignupStatus; label: MessageKey; icon: IconName; tone: string }[] = [
  { key: "Yes", label: "signup.going", icon: "yes", tone: "var(--cb-ok)" },
  { key: "Maybe", label: "signup.maybe", icon: "maybe", tone: "var(--cb-warn)" },
  { key: "No", label: "signup.notGoing", icon: "no", tone: "var(--cb-err)" },
];

const PINGS: { mode: EventPingMode; label: MessageKey; title: MessageKey }[] = [
  { mode: "unchecked", label: "signup.noAnswer", title: "ping.noAnswerTitle" },
  { mode: "tentative", label: "signup.maybe", title: "ping.maybeTitle" },
  { mode: "declined", label: "signup.notGoing", title: "ping.notGoingTitle" },
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
  const { t, tn } = useT();
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
      .catch((err) => setError(errorText(err, t("signups.loadFailed"))));
  };

  useEffect(() => load(), [serverId, event.id]);

  const ping = async (mode: EventPingMode) => {
    setPinging(mode);
    try {
      const count = await pingEvent(serverId, event.id, mode);
      toast.success(tn("ping.sent", count));
    } catch (err) {
      toast.error(errorText(err, t("ping.failed")));
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
          <IconButton icon="edit" label={t(event.active ? "events.edit" : "events.lockedEdit")} disabled={!event.active} onClick={onEdit} />
          <IconButton icon="trash" variant="danger" label={t("events.delete")} onClick={onDelete} />
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
              <strong>{t("events.finishedStrong")}</strong> {t("events.finishedNote")}
              {event.nextEventId ? (
                <div>
                  <button type="button" className="link-button" onClick={() => onOpen(event.nextEventId!)}>
                    {t("events.openNext")}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {event.description ? <p className="prose">{event.description}</p> : null}

        <div className="signup-totals">
          {STATUS.map((s) => (
            <div key={s.key} className="signup-total" style={{ color: s.tone }} title={t(s.label)}>
              <Icon name={s.icon} />
              <span className="stat__value">{event.signups[s.key.toLowerCase() as "yes" | "no" | "maybe"]}</span>
              <span className="stat__label">{t(s.label)}</span>
            </div>
          ))}
          {signups?.unchecked != null ? (
            <div className="signup-total" title={t("signups.noAnswerTitle")}>
              <Icon name="bell" />
              <span className="stat__value">{signups.unchecked}</span>
              <span className="stat__label">{t("signup.noAnswer")}</span>
            </div>
          ) : null}
        </div>

        {event.active ? (
          <div className="row">
            <span className="muted small row"><Icon name="bell" size="sm" /> {t("ping.label")}</span>
            {PINGS.map((p) => (
              <Button
                key={p.mode}
                size="sm"
                loading={pinging === p.mode}
                disabled={Boolean(pinging) || (p.mode === "unchecked" && !event.roleId)}
                title={t(p.mode === "unchecked" && !event.roleId ? "ping.needRole" : p.title)}
                onClick={() => void ping(p.mode)}
              >
                {t(p.label)}
              </Button>
            ))}
          </div>
        ) : null}

        <div>
          <h3 style={{ marginBottom: 8 }}>{t("signups.title")}</h3>
          {error ? <ErrorState message={error} onRetry={load} /> : null}
          {!signups && !error ? <Skeleton height={60} /> : null}
          {signups ? (
            signups.signups.length === 0 ? (
              <p className="muted small">{t("signups.none")}</p>
            ) : (
              <div className="signup-groups">
                {STATUS.map((s) => {
                  const people = signups.signups.filter((x) => x.status === s.key);
                  if (!people.length) return null;
                  return (
                    <div key={s.key} className="row" style={{ alignItems: "flex-start" }}>
                      <span style={{ color: s.tone }} title={t(s.label)}><Icon name={s.icon} /></span>
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
