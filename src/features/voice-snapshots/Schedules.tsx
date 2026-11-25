import { useState } from "react";
import type { VoicePresenceSchedule, VoicePresenceSettings } from "../../api/types";
import { DAYS, DAYS_SHORT, DaySelect, Field, MultiSelectChips, TextInput } from "../../components/form/fields";
import { Button, IconButton } from "../../components/ui/Button";
import { EmptyState, Group, Toggle } from "../../components/ui/basics";
import type { Editable } from "../../hooks/useEditable";
import { useServerMeta } from "../../hooks/useServerMeta";

const newSchedule = (): VoicePresenceSchedule => ({
  id: Math.random().toString(36).slice(2, 9),
  name: "",
  enabled: true,
  dayOfWeek: 0,
  time: "20:00",
  channelIds: [],
  lastRun: null,
});

export const Schedules = ({ edit, timezone }: { edit: Editable<VoicePresenceSettings>; timezone?: string }) => {
  const { voiceChannels } = useServerMeta();
  const [openId, setOpenId] = useState<string | null>(null);
  const value = edit.value;
  if (!value) return null;

  const update = (id: string, next: Partial<VoicePresenceSchedule>) =>
    edit.set((prev) => ({ ...prev, schedules: prev.schedules.map((s) => (s.id === id ? { ...s, ...next } : s)) }));

  const add = () => {
    const schedule = newSchedule();
    edit.set((prev) => ({ ...prev, schedules: [...prev.schedules, schedule] }));
    setOpenId(schedule.id);
  };

  return (
    <Group
      title="Schedules"
      icon="clock"
      description={timezone ? <>Times are in the server time zone: <strong>{timezone}</strong>.</> : undefined}
      actions={<Button size="sm" icon="plus" onClick={add}>Add</Button>}
    >
      {value.schedules.length === 0 ? (
        <EmptyState icon="clock" title="No schedules">A schedule takes a snapshot every week on the chosen day and time.</EmptyState>
      ) : (
        <div className="list">
          {value.schedules.map((s) => {
            const open = openId === s.id;
            return (
              <div key={s.id}>
                <div className="list-row">
                  <Toggle label={`${s.name || "Schedule"} enabled`} hideLabel checked={s.enabled} onChange={(enabled) => update(s.id, { enabled })} />
                  <div className="when" title={`${DAYS[s.dayOfWeek]} ${s.time}`}>
                    <span className="when__day">{DAYS_SHORT[s.dayOfWeek]}</span>
                    <span className="when__time num">{s.time}</span>
                  </div>
                  <div className="list-row__main">
                    <span className="list-row__title truncate">{s.name || "Untitled schedule"}</span>
                    <span className="list-row__meta">
                      {s.channelIds.length ? `${s.channelIds.length} channel${s.channelIds.length === 1 ? "" : "s"}` : "All voice channels"}
                      {s.lastRun ? <span>· last {new Date(s.lastRun).toLocaleDateString("en-GB")}</span> : null}
                    </span>
                  </div>
                  <IconButton icon={open ? "chevronDown" : "edit"} label={open ? "Close" : "Edit schedule"} onClick={() => setOpenId(open ? null : s.id)} />
                  <IconButton
                    icon="trash"
                    variant="danger"
                    label="Remove schedule"
                    onClick={() => edit.set((prev) => ({ ...prev, schedules: prev.schedules.filter((x) => x.id !== s.id) }))}
                  />
                </div>
                {open ? (
                  <div className="inline-editor form-grid">
                    <Field label="Name" className="span-all">
                      <TextInput value={s.name} placeholder="e.g. Wednesday raid" onChange={(name) => update(s.id, { name })} />
                    </Field>
                    <Field label="Day" className="span-all">
                      <DaySelect value={s.dayOfWeek} onChange={(dayOfWeek) => update(s.id, { dayOfWeek })} />
                    </Field>
                    <Field label="Time">
                      <input className="input num" type="time" value={s.time} onChange={(e) => update(s.id, { time: e.target.value })} aria-label="Time" />
                    </Field>
                    <Field label="Channels" hint="Empty = all voice channels" className="span-all">
                      <MultiSelectChips
                        ariaLabel="Add voice channel"
                        placeholder="Add a voice channel…"
                        values={s.channelIds}
                        onChange={(channelIds) => update(s.id, { channelIds })}
                        options={voiceChannels.map((c) => ({ value: c.id, label: c.name }))}
                      />
                    </Field>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </Group>
  );
};
