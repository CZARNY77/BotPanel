import { useEffect, useMemo, useState } from "react";
import { getServerSettings, updateServerSettings } from "../../api/endpoints/servers";
import { Field } from "../../components/form/fields";
import { Select } from "../../components/form/Select";
import { ErrorState, Group, PageHeader, PageSkeleton } from "../../components/ui/basics";
import { Icon } from "../../components/ui/Icon";
import { useEditable } from "../../hooks/useEditable";
import { useServerResource, useServerScope } from "../../hooks/useServerResource";
import { useT } from "../../i18n";

const zones = (): string[] => {
  const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
  return intl.supportedValuesOf?.("timeZone") ?? ["UTC", "Europe/Warsaw", "Europe/London", "America/New_York", "America/Chicago"];
};

const nowIn = (timeZone: string, locale: string) => {
  try {
    return new Date().toLocaleString(locale, { timeZone, weekday: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "–";
  }
};

/** K3/K4: server time zone, used by new events and voice snapshot schedules. */
export default function ServerSettingsPage() {
  const { t, locale } = useT();
  const { serverId } = useServerScope();
  const resource = useServerResource("settings", getServerSettings);
  const edit = useEditable(resource, {
    label: t("settings.tz"),
    save: (value) => updateServerSettings(serverId, value),
    validate: (value) => (value.timezone ? null : t("settings.err")),
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
      <PageHeader icon="settings" hue="var(--cb-hue-settings)" title={t("section.settings")} subtitle={t("settings.subtitle")} />
      {resource.error ? <ErrorState message={resource.error} onRetry={() => void resource.reload()} /> : null}
      {!value ? (
        resource.loading ? <PageSkeleton rows={1} /> : null
      ) : (
        <div className="split">
          <Group title={t("settings.tz")} icon="globe" description={t("settings.tzDesc")}>
            <div className="stack">
              <Field label={t("settings.serverTz")}>
                <Select value={value.timezone} onChange={(timezone) => timezone && edit.set({ timezone })} options={options} ariaLabel={t("settings.serverTz")} />
              </Field>
              {browserZone && browserZone !== value.timezone ? (
                <div>
                  <button type="button" className="link-button" onClick={() => edit.set({ timezone: browserZone })}>
                    {t("settings.useMine", { zone: browserZone })}
                  </button>
                </div>
              ) : null}
            </div>
          </Group>
          <div className="clock" aria-live="polite">
            <Icon name="clock" size="lg" />
            <div>
              <div className="stat__value num">{nowIn(value.timezone, locale)}</div>
              <div className="stat__label">{t("settings.nowIn", { zone: value.timezone })}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
