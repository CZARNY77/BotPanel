import { useMemo, useState } from "react";
import { ChannelSelect, Field, RoleSelect, TextArea, TextInput } from "../../components/form/fields";
import { Select } from "../../components/form/Select";
import { Button } from "../../components/ui/Button";
import { Group } from "../../components/ui/basics";
import { useT } from "../../i18n";
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
  const { t } = useT();
  const [form, setForm] = useState<Form>(initial ?? emptyForm(serverTimezone));
  const zones = useMemo(() => timeZones().map((z) => ({ value: z, label: z.replace(/_/g, " ") })), []);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const interval = Number(form.intervalDays) || 0;
  const custom = !REPEATS.includes(interval);

  return (
    <Group title={t(editing ? "events.edit" : "events.new")} icon={editing ? "edit" : "plus"}>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <Field label={t("events.title")} className="span-all" htmlFor="ev-title">
          <TextInput id="ev-title" value={form.title} maxLength={120} onChange={(v) => set("title", v)} placeholder={t("events.titlePlaceholder")} />
        </Field>
        <Field label={t("events.description")} className="span-all" htmlFor="ev-desc">
          <TextArea id="ev-desc" rows={3} value={form.description} onChange={(v) => set("description", v)} />
        </Field>
        <Field label={t("events.date")} htmlFor="ev-date">
          <input id="ev-date" className="input num" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
        </Field>
        <Field label={t("events.start")} htmlFor="ev-time">
          <input id="ev-time" className="input num" type="time" value={form.time} onChange={(e) => set("time", e.target.value)} />
        </Field>
        <Field label={t("events.timezone")} hint={form.timezone === serverTimezone ? t("events.serverDefault") : undefined} className="span-all">
          <Select value={form.timezone} onChange={(v) => set("timezone", v || serverTimezone)} options={zones} ariaLabel={t("events.timezone")} />
        </Field>
        <Field label={t("events.duration")} htmlFor="ev-dur">
          <input id="ev-dur" className="input num" type="number" min={0.5} step={0.5} value={form.durationHours} onChange={(e) => set("durationHours", e.target.value)} />
        </Field>
        <Field label={t("events.repeat")}>
          <div className="segmented" role="group" aria-label={t("events.repeat")}>
            {REPEATS.map((days) => (
              <button key={days} type="button" aria-pressed={interval === days && !custom} onClick={() => set("intervalDays", String(days))}>
                {repeatLabel(days, true)}
              </button>
            ))}
            <button type="button" aria-pressed={custom} onClick={() => set("intervalDays", custom ? form.intervalDays : "3")}>
              {t("events.custom")}
            </button>
          </div>
        </Field>
        {custom ? (
          <Field label={t("events.repeatEvery")} htmlFor="ev-int">
            <input id="ev-int" className="input num" type="number" min={0} value={form.intervalDays} onChange={(e) => set("intervalDays", e.target.value)} />
          </Field>
        ) : null}
        <Field label={t("field.channel")} hint={t("events.channelHint")}>
          <ChannelSelect value={form.channelId} onChange={(v) => set("channelId", v)} />
        </Field>
        <Field label={t("field.role")} hint={t("events.roleHint")}>
          <RoleSelect value={form.roleId} onChange={(v) => set("roleId", v)} emptyLabel={t("events.noRole")} />
        </Field>
        <div className="span-all row" style={{ justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={onCancel}>
            {t("action.cancel")}
          </Button>
          <Button type="submit" variant="primary" icon="check" loading={saving}>
            {t(editing ? "events.saveEvent" : "events.create")}
          </Button>
        </div>
      </form>
    </Group>
  );
};
