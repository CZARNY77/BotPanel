import type { EventItem } from "../../api/types";
import { Pill } from "../../components/ui/basics";
import { Icon } from "../../components/ui/Icon";
import { useServerMeta } from "../../hooks/useServerMeta";
import { dateParts, repeatLabel } from "./model";

export const EventList = ({
  events,
  selectedId,
  onSelect,
}: {
  events: EventItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) => {
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
                    {event.intervalDays === 7 ? "weekly" : `${event.intervalDays}d`}
                  </span>
                ) : null}
                <span className="truncate">{channelName.get(event.channelId) ?? ""}</span>
                {!event.active ? (
                  <Pill>
                    <Icon name="lock" size="sm" /> Finished
                  </Pill>
                ) : null}
              </span>
            </div>
            <div className="signup-mini" aria-label={`${event.signups.yes} going, ${event.signups.maybe} maybe, ${event.signups.no} not going`}>
              <span className="signup-mini__yes" title="Going">{event.signups.yes}</span>
              <span className="signup-mini__maybe" title="Maybe">{event.signups.maybe}</span>
              <span className="signup-mini__no" title="Not going">{event.signups.no}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
