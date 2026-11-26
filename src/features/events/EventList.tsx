import type { EventItem } from "../../api/types";
import { Pill } from "../../components/ui/basics";
import { Icon } from "../../components/ui/Icon";
import { useServerMeta } from "../../hooks/useServerMeta";
import { dateParts, repeatLabel } from "./model";
import { useT } from "../../i18n";

export const EventList = ({
  events,
  selectedId,
  onSelect,
}: {
  events: EventItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) => {
  const { t } = useT();
  const { channelName } = useServerMeta();
  return (
    <div className="list">
      {events.map((event) => {
        const parts = dateParts(event.date);
        return (
          <div
            key={event.id}
            role="button"
            tabIndex={0}
            className={`list-row list-row--click${event.id === selectedId ? " selected" : ""}`}
            onClick={() => onSelect(event.id)}
            onKeyDown={(e) => e.key === "Enter" && onSelect(event.id)}
          >
            <div className={`date-tile${event.active ? "" : " date-tile--muted"}`}>
              <span className="date-tile__day">{parts.day}</span>
              <span className="date-tile__month">{parts.month}</span>
            </div>
            <div className="list-row__main">
              <span className="list-row__title truncate">{event.title}</span>
              <span className="list-row__meta">
                <span className="num">{event.time}</span>
                {event.intervalDays > 0 ? (
                  <span className="row" style={{ gap: 3 }} title={repeatLabel(event.intervalDays)}>
                    <Icon name="repeat" size="sm" />
                    {event.intervalDays === 7 ? t("repeat.weeklyShort") : `${event.intervalDays}d`}
                  </span>
                ) : null}
                <span className="truncate">{channelName.get(event.channelId) ?? ""}</span>
                {!event.active ? (
                  <Pill>
                    <Icon name="lock" size="sm" /> {t("events.finished")}
                  </Pill>
                ) : null}
              </span>
            </div>
            <div className="signup-mini" aria-label={t("signup.summary", { yes: event.signups.yes, maybe: event.signups.maybe, no: event.signups.no })}>
              <span className="signup-mini__yes" title={t("signup.going")}>{event.signups.yes}</span>
              <span className="signup-mini__maybe" title={t("signup.maybe")}>{event.signups.maybe}</span>
              <span className="signup-mini__no" title={t("signup.notGoing")}>{event.signups.no}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
