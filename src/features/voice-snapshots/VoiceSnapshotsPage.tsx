import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getPresenceLogs, getPresenceSettings, runPresence, updatePresenceSettings } from "../../api/endpoints/presence";
import { getServerSettings } from "../../api/endpoints/servers";
import type { VoicePresenceSettings } from "../../api/types";
import { Field, MultiSelectChips, TextInput } from "../../components/form/fields";
import { Button } from "../../components/ui/Button";
import { ErrorState, Group, PageHeader, PageSkeleton } from "../../components/ui/basics";
import { errorText, useToast } from "../../components/ui/Toast";
import { useEditable } from "../../hooks/useEditable";
import { useServerMeta } from "../../hooks/useServerMeta";
import { useServerResource, useServerScope } from "../../hooks/useServerResource";
import { translate, useT } from "../../i18n";
import { History, PAGE } from "./History";
import { Schedules } from "./Schedules";

const validate = (value: VoicePresenceSettings) =>
  value.schedules.some((s) => !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(s.time) || s.dayOfWeek < 0 || s.dayOfWeek > 6)
    ? translate("voice.err.schedule")
    : null;

export default function VoiceSnapshotsPage() {
  const { t } = useT();
  const { serverId } = useServerScope();
  const toast = useToast();
  const meta = useServerMeta();
  const [params, setParams] = useSearchParams();
  const settings = useServerResource("voice-settings", getPresenceSettings);
  const logs = useServerResource("voice-logs", (id) => getPresenceLogs(id, PAGE, 0));
  const serverSettings = useServerResource("settings", getServerSettings);
  const edit = useEditable(settings, {
    label: t("voice.settingsLabel"),
    validate,
    save: (value) => updatePresenceSettings(serverId, value),
  });
  const [running, setRunning] = useState(false);
  const autoRun = useRef(false);
  const value = edit.value;

  const run = async () => {
    if (!value) return;
    setRunning(true);
    try {
      const log = await runPresence(serverId, value.manualChannelIds, value.manualName);
      logs.setData((prev) => [log, ...(prev ?? [])]);
      toast.success(t("voice.stored", { members: log.totalMembers, channels: log.totalChannels }));
    } catch (err) {
      toast.error(errorText(err, t("voice.runFailed")));
    } finally {
      setRunning(false);
    }
  };

  // Ctrl+K "Run voice snapshot" lands here with ?run=1.
  useEffect(() => {
    if (params.get("run") === "1" && value && !autoRun.current) {
      autoRun.current = true;
      setParams({}, { replace: true });
      void run();
    }
  }); // runs after each render until the settings are loaded

  return (
    <>
      <PageHeader
        icon="voice"
        hue="var(--cb-hue-voice)"
        title={t("section.voice-snapshots")}
        subtitle={t("voice.subtitle")}
        actions={
          <Button variant="primary" icon="play" loading={running} disabled={!value} onClick={() => void run()}>
            {t("voice.runNow")}
          </Button>
        }
      />
      {settings.error ? <ErrorState message={settings.error} onRetry={() => void settings.reload()} /> : null}
      <div className="split">
        <div>
          {!value ? (
            settings.loading ? <PageSkeleton rows={3} /> : null
          ) : (
            <>
              <Group title={t("voice.manualTitle")} icon="play" description={t("voice.manualDesc")}>
                <div className="form-grid">
                  <Field label={t("voice.label")} hint={t("voice.labelHint")}>
                    <TextInput value={value.manualName} placeholder={t("voice.labelPlaceholder")} onChange={(manualName) => edit.set({ ...value, manualName })} />
                  </Field>
                  <Field label={t("voice.channels")} hint={t("voice.channelsHint")}>
                    <MultiSelectChips
                      ariaLabel={t("voice.addChannel")}
                      placeholder={t(meta.voiceChannels.length ? "voice.addChannelPlaceholder" : "voice.noVoiceChannels")}
                      values={value.manualChannelIds}
                      onChange={(manualChannelIds) => edit.set({ ...value, manualChannelIds })}
                      options={meta.voiceChannels.map((c) => ({ value: c.id, label: c.name }))}
                    />
                  </Field>
                </div>
              </Group>
              <Schedules edit={edit} timezone={serverSettings.data?.timezone} />
            </>
          )}
        </div>
        <History resource={logs} />
      </div>
    </>
  );
}
