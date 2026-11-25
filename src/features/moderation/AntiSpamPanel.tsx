import type { AntiSpamAction, AntiSpamSettings } from "../../api/types";
import { ChannelSelect, Field, MultiSelectChips } from "../../components/form/fields";
import { Group, Toggle } from "../../components/ui/basics";
import { Icon, type IconName } from "../../components/ui/Icon";
import { useServerMeta } from "../../hooks/useServerMeta";

const ACTIONS: { key: AntiSpamAction; label: string; icon: IconName; detail: string }[] = [
  { key: "auto", label: "Smart", icon: "moderation", detail: "New members get banned, everyone else a 24 h timeout." },
  { key: "timeout", label: "Timeout", icon: "timer", detail: "Everyone gets a 24 h timeout." },
  { key: "delete", label: "Delete only", icon: "trash", detail: "Only the message is removed." },
];

export const AntiSpamPanel = ({
  value,
  set,
}: {
  value: AntiSpamSettings;
  set: (next: AntiSpamSettings) => void;
}) => {
  const { roles } = useServerMeta();
  const action = ACTIONS.find((a) => a.key === value.action) ?? ACTIONS[0];
  return (
    <Group
      title="Anti-spam"
      icon="spam"
      description="Deletes messages with suspicious links. Server admins are never affected."
      actions={<Toggle label="Anti-spam enabled" hideLabel checked={value.enabled} onChange={(enabled) => set({ ...value, enabled })} />}
    >
      <fieldset className="stack stack--lg plain" disabled={!value.enabled}>
        <Field label="What happens to the author">
          <div className="segmented" role="group" aria-label="Action">
            {ACTIONS.map((a) => (
              <button key={a.key} type="button" aria-pressed={value.action === a.key} onClick={() => set({ ...value, action: a.key })} title={a.detail}>
                <Icon name={a.icon} size="sm" />
                {a.label}
              </button>
            ))}
          </div>
          <span className="field__hint">{action.detail}</span>
        </Field>
        <Field label="Roles that are never punished">
          <MultiSelectChips
            ariaLabel="Add exempt role"
            placeholder="Add a role…"
            values={value.exemptRoleIds}
            onChange={(exemptRoleIds) => set({ ...value, exemptRoleIds })}
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
          />
        </Field>
        <Field label="Report channel" hint="The bot posts who was punished and why">
          <ChannelSelect value={value.logChannelId} onChange={(logChannelId) => set({ ...value, logChannelId })} emptyLabel="No reports" />
        </Field>
      </fieldset>
    </Group>
  );
};
