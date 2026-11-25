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
import { History, PAGE } from "./History";
import { Schedules } from "./Schedules";

const validate = (value: VoicePresenceSettings) =>
  value.schedules.some((s) => !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(s.time) || s.dayOfWeek < 0 || s.dayOfWeek > 6)
    ? "Every schedule needs a valid weekday and time (HH:MM)."
    : null;

export default function VoiceSnapshotsPage() {
  const { serverId } = useServerScope();
  const toast = useToast();
  const meta = useServerMeta();
  const [params, setParams] = useSearchParams();
  const settings = useServerResource("voice-settings", getPresenceSettings);
  const logs = useServerResource("voice-logs", (id) => getPresenceLogs(id, PAGE, 0));
  const serverSettings = useServerResource("settings", getServerSettings);
  const edit = useEditable(settings, {
    label: "Voice snapshot settings",
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
      toast.success(`Snapshot stored: ${log.totalMembers} members in ${log.totalChannels} channels.`);
    } catch (err) {
      toast.error(errorText(err, "Failed to take a snapshot."));
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
        title="Voice snapshots"
        subtitle="Record who is sitting in voice channels, on demand or every week."
        actions={
          <Button variant="primary" icon="play" loading={running} disabled={!value} onClick={() => void run()}>
            Run now
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
              <Group title="Run now" icon="play" description="Used by the Run now button.">
                <div className="form-grid">
                  <Field label="Label" hint="Shown in history">
                    <TextInput value={value.manualName} placeholder="e.g. Weekly voice check" onChange={(manualName) => edit.set({ ...value, manualName })} />
                  </Field>
                  <Field label="Channels" hint="Empty = all voice channels">
                    <MultiSelectChips
                      ariaLabel="Add voice channel"
                      placeholder={meta.voiceChannels.length ? "Add a voice channel…" : "No voice channels"}
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
