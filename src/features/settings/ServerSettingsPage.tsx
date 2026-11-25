import { useEffect, useMemo, useState } from "react";
import { getServerSettings, updateServerSettings } from "../../api/endpoints/servers";
import { Field } from "../../components/form/fields";
import { Select } from "../../components/form/Select";
import { ErrorState, Group, PageHeader, PageSkeleton } from "../../components/ui/basics";
import { Icon } from "../../components/ui/Icon";
import { useEditable } from "../../hooks/useEditable";
import { useServerResource, useServerScope } from "../../hooks/useServerResource";

const zones = (): string[] => {
  const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
  return intl.supportedValuesOf?.("timeZone") ?? ["UTC", "Europe/Warsaw", "Europe/London", "America/New_York", "America/Chicago"];
};

const nowIn = (timeZone: string) => {
  try {
    return new Date().toLocaleString("en-GB", { timeZone, weekday: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "–";
  }
};

/** K3/K4: server time zone, used by new events and voice snapshot schedules. */
export default function ServerSettingsPage() {
  const { serverId } = useServerScope();
  const resource = useServerResource("settings", getServerSettings);
  const edit = useEditable(resource, {
    label: "Time zone",
    save: (value) => updateServerSettings(serverId, value),
    validate: (value) => (value.timezone ? null : "Pick a time zone."),
  });
  const options = useMemo(() => zones().map((z) => ({ value: z, label: z.replace(/_/g, " ") })), []);
  const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [, tick] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => tick((n) => n + 1), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const value = edit.value;

  return (
    <>
      <PageHeader icon="settings" hue="var(--cb-hue-settings)" title="Settings" subtitle="Server-wide options for ConqBot." />
      {resource.error ? <ErrorState message={resource.error} onRetry={() => void resource.reload()} /> : null}
      {!value ? (
        resource.loading ? <PageSkeleton rows={1} /> : null
      ) : (
        <div className="split">
          <Group title="Time zone" icon="globe" description="New events and weekly voice snapshots use this zone. Existing events keep their own.">
            <div className="stack">
              <Field label="Server time zone">
                <Select value={value.timezone} onChange={(timezone) => timezone && edit.set({ timezone })} options={options} ariaLabel="Server time zone" />
              </Field>
              {browserZone && browserZone !== value.timezone ? (
                <div>
                  <button type="button" className="link-button" onClick={() => edit.set({ timezone: browserZone })}>
                    Use my time zone ({browserZone})
                  </button>
                </div>
              ) : null}
            </div>
          </Group>
          <div className="clock" aria-live="polite">
            <Icon name="clock" size="lg" />
            <div>
              <div className="stat__value num">{nowIn(value.timezone)}</div>
              <div className="stat__label">Now in {value.timezone}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
