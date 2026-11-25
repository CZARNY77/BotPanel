import { useMemo, useState } from "react";
import { ChannelSelect, Field, RoleSelect, TextArea, TextInput } from "../../components/form/fields";
import { Select } from "../../components/form/Select";
import { Button } from "../../components/ui/Button";
import { Group } from "../../components/ui/basics";
import { emptyForm, repeatLabel, timeZones, type EventForm as Form } from "./model";

const REPEATS = [0, 1, 7, 14];

export const EventForm = ({
  initial,
  serverTimezone,
  editing,
  saving,
  onSubmit,
  onCancel,
}: {
  initial?: Form;
  serverTimezone: string;
  editing: boolean;
  saving: boolean;
  onSubmit: (form: Form) => void;
  onCancel: () => void;
}) => {
  const [form, setForm] = useState<Form>(initial ?? emptyForm(serverTimezone));
  const zones = useMemo(() => timeZones().map((z) => ({ value: z, label: z.replace(/_/g, " ") })), []);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const interval = Number(form.intervalDays) || 0;
  const custom = !REPEATS.includes(interval);

  return (
    <Group title={editing ? "Edit event" : "New event"} icon={editing ? "edit" : "plus"}>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <Field label="Title" className="span-all" htmlFor="ev-title">
          <TextInput id="ev-title" value={form.title} maxLength={120} onChange={(v) => set("title", v)} placeholder="e.g. Weekly siege" />
        </Field>
        <Field label="Description" className="span-all" htmlFor="ev-desc">
          <TextArea id="ev-desc" rows={3} value={form.description} onChange={(v) => set("description", v)} />
        </Field>
        <Field label="Date" htmlFor="ev-date">
          <input id="ev-date" className="input num" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
        </Field>
        <Field label="Start" htmlFor="ev-time">
          <input id="ev-time" className="input num" type="time" value={form.time} onChange={(e) => set("time", e.target.value)} />
        </Field>
        <Field label="Time zone" hint={form.timezone === serverTimezone ? "Server default" : undefined} className="span-all">
          <Select value={form.timezone} onChange={(v) => set("timezone", v || serverTimezone)} options={zones} ariaLabel="Time zone" />
        </Field>
        <Field label="Duration (hours)" htmlFor="ev-dur">
          <input id="ev-dur" className="input num" type="number" min={0.5} step={0.5} value={form.durationHours} onChange={(e) => set("durationHours", e.target.value)} />
        </Field>
        <Field label="Repeat">
          <div className="segmented" role="group" aria-label="Repeat">
            {REPEATS.map((days) => (
              <button key={days} type="button" aria-pressed={interval === days && !custom} onClick={() => set("intervalDays", String(days))}>
                {repeatLabel(days).replace("Every 2 weeks", "2 wk")}
              </button>
            ))}
            <button type="button" aria-pressed={custom} onClick={() => set("intervalDays", custom ? form.intervalDays : "3")}>
              Custom
            </button>
          </div>
        </Field>
        {custom ? (
          <Field label="Repeat every (days)" htmlFor="ev-int">
            <input id="ev-int" className="input num" type="number" min={0} value={form.intervalDays} onChange={(e) => set("intervalDays", e.target.value)} />
          </Field>
        ) : null}
        <Field label="Channel" hint="The signup message is posted here">
          <ChannelSelect value={form.channelId} onChange={(v) => set("channelId", v)} />
        </Field>
        <Field label="Role" hint="Needed to ping people who have not answered">
          <RoleSelect value={form.roleId} onChange={(v) => set("roleId", v)} emptyLabel="No role" />
        </Field>
        <div className="span-all row" style={{ justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon="check" loading={saving}>
            {editing ? "Save event" : "Create event"}
          </Button>
        </div>
      </form>
    </Group>
  );
};
