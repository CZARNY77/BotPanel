import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createEvent, deleteEvent, getEvents, updateEvent } from "../../api/endpoints/events";
import { getServerSettings } from "../../api/endpoints/servers";
import { ApiError } from "../../api/http";
import type { EventItem, EventStatusFilter } from "../../api/types";
import { Button } from "../../components/ui/Button";
import { EmptyState, ErrorState, Group, PageHeader, PageSkeleton, Tabs } from "../../components/ui/basics";
import { ConfirmDialog } from "../../components/ui/Dialog";
import { errorText, useToast } from "../../components/ui/Toast";
import { useServerResource, useServerScope } from "../../hooks/useServerResource";
import { EventDetail } from "./EventDetail";
import { EventForm } from "./EventForm";
import { EventList } from "./EventList";
import { formFromEvent, toInput, type EventForm as Form } from "./model";

type Panel = { kind: "detail"; id: string } | { kind: "new" } | { kind: "edit"; id: string } | null;

export default function EventsPage() {
  const { serverId } = useServerScope();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<EventStatusFilter>("active");
  // K5: the default view asks only for active events; "All" adds finished ones.
  const events = useServerResource(`events-${filter}`, (id) => getEvents(id, filter));
  const settings = useServerResource("settings", getServerSettings);
  const [panel, setPanel] = useState<Panel>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<EventItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const all = events.data ?? [];
  const list = all;
  const serverTz = settings.data?.timezone ?? "Europe/Warsaw";

  useEffect(() => {
    if (params.get("new") === "1") {
      setPanel({ kind: "new" });
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  // Default: show the first event's details so the right column is never empty.
  const current = panel?.kind === "detail" || panel?.kind === "edit" ? all.find((e) => e.id === panel.id) : undefined;
  const shown: Panel = panel ?? (list[0] ? { kind: "detail", id: list[0].id } : null);
  const shownEvent = shown?.kind === "detail" ? all.find((e) => e.id === shown.id) : undefined;

  const submit = async (form: Form) => {
    const input = toInput(form);
    if (typeof input === "string") {
      toast.error(input);
      return;
    }
    setSaving(true);
    try {
      if (panel?.kind === "edit") {
        const updated = await updateEvent(serverId, panel.id, input);
        events.setData((prev) => (prev ?? []).map((e) => (e.id === updated.id ? updated : e)));
        setPanel({ kind: "detail", id: updated.id });
        toast.success("Event updated.");
      } else {
        const created = await createEvent(serverId, input);
        events.setData((prev) => [created, ...(prev ?? [])]);
        setPanel({ kind: "detail", id: created.id });
        toast.success("Event created. The signup message is on Discord.");
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error("This event has already finished, so it can no longer be edited.");
        void events.reload();
        setPanel(panel?.kind === "edit" ? { kind: "detail", id: panel.id } : null);
      } else {
        toast.error(errorText(err, "Failed to save the event."));
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      const id = await deleteEvent(serverId, confirm.id);
      events.setData((prev) => (prev ?? []).filter((e) => e.id !== id));
      setPanel(null);
      setConfirm(null);
      toast.success("Event deleted.");
    } catch (err) {
      toast.error(errorText(err, "Failed to delete the event."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        icon="events"
        hue="var(--cb-hue-events)"
        title="Events"
        subtitle="Members answer Going, Maybe or Not going under the bot's message. Repeating events start the next one when they end."
        actions={<Button variant="primary" icon="plus" onClick={() => setPanel({ kind: "new" })}>New event</Button>}
      />
      {events.error ? <ErrorState message={events.error} onRetry={() => void events.reload()} /> : null}
      {events.loading && !events.data ? (
        <PageSkeleton />
      ) : (
        <div className="split split--list">
          <Group
            title={
              <Tabs
                label="Event status"
                value={filter}
                onChange={setFilter}
                tabs={[
                  { key: "active", label: "Upcoming", count: filter === "active" ? all.length : undefined },
                  { key: "all", label: "All", count: filter === "all" ? all.length : undefined },
                ]}
              />
            }
          >
            {list.length === 0 ? (
              <EmptyState icon="events" title={filter === "active" ? "No upcoming events" : "No events yet"} action={<Button icon="plus" onClick={() => setPanel({ kind: "new" })}>New event</Button>} />
            ) : (
              <EventList events={list} selectedId={shown && shown.kind !== "new" ? shown.id : null} onSelect={(id) => setPanel({ kind: "detail", id })} />
            )}
          </Group>
          <div className="sticky-col">
            {shown?.kind === "new" ? (
              <EventForm key="new" serverTimezone={serverTz} editing={false} saving={saving} onSubmit={(f) => void submit(f)} onCancel={() => setPanel(null)} />
            ) : shown?.kind === "edit" && current ? (
              <EventForm key={current.id} initial={formFromEvent(current)} serverTimezone={serverTz} editing saving={saving} onSubmit={(f) => void submit(f)} onCancel={() => setPanel({ kind: "detail", id: current.id })} />
            ) : shownEvent ? (
              <EventDetail
                key={shownEvent.id}
                event={shownEvent}
                onEdit={() => setPanel({ kind: "edit", id: shownEvent.id })}
                onDelete={() => setConfirm(shownEvent)}
                onOpen={(id) => {
                  setFilter("all");
                  setPanel({ kind: "detail", id });
                }}
              />
            ) : null}
          </div>
        </div>
      )}
      {confirm ? (
        <ConfirmDialog
          title="Delete event?"
          message={`“${confirm.title}” and its signups will be removed. Repeats stop too.`}
          confirmLabel="Delete"
          danger
          busy={deleting}
          onConfirm={() => void remove()}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
    </>
  );
}
