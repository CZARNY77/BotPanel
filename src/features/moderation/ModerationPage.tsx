import { antiSpamApi, banDmApi, timeoutDmApi, warthogApi } from "../../api/endpoints/moderation";
import { ErrorState, PageHeader, PageSkeleton } from "../../components/ui/basics";
import { useEditable, type Editable } from "../../hooks/useEditable";
import { useServerResource, useServerScope, type Resource } from "../../hooks/useServerResource";
import { AntiSpamPanel } from "./AntiSpamPanel";
import { BanDmPanel, TimeoutDmPanel } from "./DmPanels";
import { WarthogPanel } from "./WarthogPanel";

type ModuleApi<T> = { get: (id: string) => Promise<T>; update: (id: string, v: Partial<T>) => Promise<T> };

const useModule = <T,>(key: string, api: ModuleApi<T>, label: string, validate?: (v: T) => string | null) => {
  const { serverId } = useServerScope();
  const resource = useServerResource(key, api.get);
  const edit = useEditable(resource, { label, validate, save: (value) => api.update(serverId, value) });
  return { resource, edit };
};

function Slot<T>({ resource, edit, children }: { resource: Resource<T>; edit: Editable<T>; children: (value: T) => JSX.Element }) {
  if (resource.error) return <ErrorState message={resource.error} onRetry={() => void resource.reload()} />;
  if (edit.value === undefined) return <PageSkeleton rows={2} />;
  return children(edit.value);
}

export default function ModerationPage() {
  const antiSpam = useModule("anti-spam", antiSpamApi, "Anti-spam");
  const timeoutDm = useModule("timeout-dm", timeoutDmApi, "Timeout DM", (v) =>
    v.message.length > 1500 ? "The timeout message can have at most 1500 characters." : null
  );
  const banDm = useModule("ban-dm", banDmApi, "Ban DM");
  const warthog = useModule("warthog", warthogApi, "Warthog");

  return (
    <>
      <PageHeader
        icon="moderation"
        hue="var(--cb-hue-moderation)"
        title="Moderation"
        subtitle="Automatic protection and the private messages the bot sends to punished members."
      />
      <div className="mod-grid">
        <Slot {...antiSpam}>{(v) => <AntiSpamPanel value={v} set={antiSpam.edit.set} />}</Slot>
        <Slot {...timeoutDm}>{(v) => <TimeoutDmPanel value={v} set={timeoutDm.edit.set} />}</Slot>
        <Slot {...banDm}>{(v) => <BanDmPanel value={v} set={banDm.edit.set} />}</Slot>
        <Slot {...warthog}>{(v) => <WarthogPanel value={v} set={warthog.edit.set} />}</Slot>
      </div>
    </>
  );
}
