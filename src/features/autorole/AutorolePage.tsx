import { getAutorole, updateAutorole } from "../../api/endpoints/servers";
import type { AutoRoleSettings } from "../../api/types";
import { Field, RoleSelect } from "../../components/form/fields";
import { ErrorState, Group, PageHeader, PageSkeleton, StatusPill, Toggle } from "../../components/ui/basics";
import { Icon } from "../../components/ui/Icon";
import { useEditable } from "../../hooks/useEditable";
import { useServerMeta } from "../../hooks/useServerMeta";
import { useServerResource, useServerScope } from "../../hooks/useServerResource";
import { translate, useT } from "../../i18n";

const validate = (value: AutoRoleSettings) =>
  value.enabled && !value.roleId ? translate("autorole.err") : null;

export default function AutorolePage() {
  const { t } = useT();
  const { serverId } = useServerScope();
  const resource = useServerResource("autorole", getAutorole);
  const edit = useEditable(resource, {
    label: t("section.autorole"),
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
        title={t("section.autorole")}
        subtitle={t("autorole.subtitle")}
        actions={value ? <StatusPill on={value.enabled} /> : null}
      />
      {resource.error ? <ErrorState message={resource.error} onRetry={() => void resource.reload()} /> : null}
      {!value ? (
        resource.loading ? <PageSkeleton rows={2} /> : null
      ) : (
        <div className="split">
          <Group title={t("autorole.onJoin")} actions={<Toggle label={t("state.enabled")} hideLabel checked={value.enabled} onChange={(enabled) => edit.set({ ...value, enabled })} />}>
            <Field label={t("field.role")} hint={t("autorole.hint")}>
              <RoleSelect
                value={value.roleId}
                onChange={(roleId) => edit.set({ ...value, roleId })}
                invalid={value.enabled && !value.roleId}
              />
            </Field>
          </Group>
          <div className="flow" aria-label={t("autorole.how")}>
            <div className="flow__step">
              <Icon name="user" />
              <span>{t("autorole.joins")}</span>
            </div>
            <Icon name="chevronRight" className="flow__arrow" />
            <div className={`flow__step${value.enabled && value.roleId ? " flow__step--on" : ""}`}>
              <Icon name="autorole" />
              <span>{value.roleId ? roleName.get(value.roleId) ?? t("autorole.unknownRole") : t("autorole.noRole")}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
