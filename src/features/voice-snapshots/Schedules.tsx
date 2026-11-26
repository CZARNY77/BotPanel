import { useState } from "react";
import type { VoicePresenceSchedule, VoicePresenceSettings } from "../../api/types";
import { dayLong, dayShort, DaySelect, Field, MultiSelectChips, TextInput } from "../../components/form/fields";
import { Button, IconButton } from "../../components/ui/Button";
import { EmptyState, Group, Toggle } from "../../components/ui/basics";
import type { Editable } from "../../hooks/useEditable";
import { useServerMeta } from "../../hooks/useServerMeta";
import { useT } from "../../i18n";

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
  const { t, tn, locale } = useT();
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
      title={t("schedules.title")}
      icon="clock"
      description={timezone ? <>{t("schedules.tz")} <strong>{timezone}</strong>.</> : undefined}
      actions={<Button size="sm" icon="plus" onClick={add}>{t("action.add")}</Button>}
    >
      {value.schedules.length === 0 ? (
        <EmptyState icon="clock" title={t("schedules.none")}>{t("schedules.noneHint")}</EmptyState>
      ) : (
        <div className="list">
          {value.schedules.map((s) => {
            const open = openId === s.id;
            return (
              <div key={s.id}>
                <div className="list-row">
                  <Toggle label={t("schedules.enabled", { name: s.name || t("schedules.schedule") })} hideLabel checked={s.enabled} onChange={(enabled) => update(s.id, { enabled })} />
                  <div className="when" title={`${dayLong(s.dayOfWeek)} ${s.time}`}>
                    <span className="when__day">{dayShort(s.dayOfWeek)}</span>
                    <span className="when__time num">{s.time}</span>
                  </div>
                  <div className="list-row__main">
                    <span className="list-row__title truncate">{s.name || t("schedules.untitled")}</span>
                    <span className="list-row__meta">
                      {s.channelIds.length ? tn("schedules.channels", s.channelIds.length) : t("voice.allChannels")}
                      {s.lastRun ? <span>· {t("schedules.last", { date: new Date(s.lastRun).toLocaleDateString(locale) })}</span> : null}
                    </span>
                  </div>
                  <IconButton icon={open ? "chevronDown" : "edit"} label={t(open ? "action.close" : "schedules.edit")} onClick={() => setOpenId(open ? null : s.id)} />
                  <IconButton
                    icon="trash"
                    variant="danger"
                    label={t("schedules.remove")}
                    onClick={() => edit.set((prev) => ({ ...prev, schedules: prev.schedules.filter((x) => x.id !== s.id) }))}
                  />
                </div>
                {open ? (
                  <div className="inline-editor form-grid">
                    <Field label={t("schedules.name")} className="span-all">
                      <TextInput value={s.name} placeholder={t("schedules.namePlaceholder")} onChange={(name) => update(s.id, { name })} />
                    </Field>
                    <Field label={t("schedules.day")} className="span-all">
                      <DaySelect value={s.dayOfWeek} onChange={(dayOfWeek) => update(s.id, { dayOfWeek })} />
                    </Field>
                    <Field label={t("schedules.time")}>
                      <input className="input num" type="time" value={s.time} onChange={(e) => update(s.id, { time: e.target.value })} aria-label={t("schedules.time")} />
                    </Field>
                    <Field label={t("voice.channels")} hint={t("voice.channelsHint")} className="span-all">
                      <MultiSelectChips
                        ariaLabel={t("voice.addChannel")}
                        placeholder={t("voice.addChannelPlaceholder")}
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
