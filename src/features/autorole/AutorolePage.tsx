import { getAutorole, updateAutorole } from "../../api/endpoints/servers";
import type { AutoRoleSettings } from "../../api/types";
import { Field, RoleSelect } from "../../components/form/fields";
import { ErrorState, Group, PageHeader, PageSkeleton, StatusPill, Toggle } from "../../components/ui/basics";
import { Icon } from "../../components/ui/Icon";
import { useEditable } from "../../hooks/useEditable";
import { useServerMeta } from "../../hooks/useServerMeta";
import { useServerResource, useServerScope } from "../../hooks/useServerResource";

const validate = (value: AutoRoleSettings) =>
  value.enabled && !value.roleId ? "Choose a role to assign." : null;

export default function AutorolePage() {
  const { serverId } = useServerScope();
  const resource = useServerResource("autorole", getAutorole);
  const edit = useEditable(resource, {
    label: "Auto role",
    save: (value) => updateAutorole(serverId, value),
    validate,
  });
  const { roleName } = useServerMeta();
  const value = edit.value;

  return (
    <>
      <PageHeader
        icon="autorole"
        hue="var(--cb-hue-autorole)"
        title="Auto role"
        subtitle="Give every new member a role the moment they join."
        actions={value ? <StatusPill on={value.enabled} /> : null}
      />
      {resource.error ? <ErrorState message={resource.error} onRetry={() => void resource.reload()} /> : null}
      {!value ? (
        resource.loading ? <PageSkeleton rows={2} /> : null
      ) : (
        <div className="split">
          <Group title="Role on join" actions={<Toggle label="Enabled" hideLabel checked={value.enabled} onChange={(enabled) => edit.set({ ...value, enabled })} />}>
            <Field label="Role" hint="The bot's own role must be above this role in Discord, or it cannot assign it.">
              <RoleSelect
                value={value.roleId}
                onChange={(roleId) => edit.set({ ...value, roleId })}
                invalid={value.enabled && !value.roleId}
              />
            </Field>
          </Group>
          <div className="flow" aria-label="How it works">
            <div className="flow__step">
              <Icon name="user" />
              <span>Member joins</span>
            </div>
            <Icon name="chevronRight" className="flow__arrow" />
            <div className={`flow__step${value.enabled && value.roleId ? " flow__step--on" : ""}`}>
              <Icon name="autorole" />
              <span>{value.roleId ? roleName.get(value.roleId) ?? "Unknown role" : "No role yet"}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
