import type { AntiSpamAction, AntiSpamSettings } from "../../api/types";
import { ChannelSelect, Field, MultiSelectChips } from "../../components/form/fields";
import { Group, Toggle } from "../../components/ui/basics";
import { Icon, type IconName } from "../../components/ui/Icon";
import { useServerMeta } from "../../hooks/useServerMeta";
import { useT, type MessageKey } from "../../i18n";

const ACTIONS: { key: AntiSpamAction; label: MessageKey; icon: IconName; detail: MessageKey }[] = [
  { key: "auto", label: "spam.smart", icon: "moderation", detail: "spam.smartDetail" },
  { key: "timeout", label: "spam.timeout", icon: "timer", detail: "spam.timeoutDetail" },
  { key: "delete", label: "spam.delete", icon: "trash", detail: "spam.deleteDetail" },
];

export const AntiSpamPanel = ({
  value,
  set,
}: {
  value: AntiSpamSettings;
  set: (next: AntiSpamSettings) => void;
}) => {
  const { t } = useT();
  const { roles } = useServerMeta();
  const action = ACTIONS.find((a) => a.key === value.action) ?? ACTIONS[0];
  return (
    <Group
      title={t("spam.title")}
      icon="spam"
      description={t("spam.desc")}
      actions={<Toggle label={t("spam.enabled")} hideLabel checked={value.enabled} onChange={(enabled) => set({ ...value, enabled })} />}
    >
      <fieldset className="stack stack--lg plain" disabled={!value.enabled}>
        <Field label={t("spam.action")}>
          <div className="segmented" role="group" aria-label={t("spam.actionLabel")}>
            {ACTIONS.map((a) => (
              <button key={a.key} type="button" aria-pressed={value.action === a.key} onClick={() => set({ ...value, action: a.key })} title={t(a.detail)}>
                <Icon name={a.icon} size="sm" />
                {t(a.label)}
              </button>
            ))}
          </div>
          <span className="field__hint">{t(action.detail)}</span>
        </Field>
        <Field label={t("spam.exempt")}>
          <MultiSelectChips
            ariaLabel={t("spam.addExempt")}
            placeholder={t("field.addRole")}
            values={value.exemptRoleIds}
            onChange={(exemptRoleIds) => set({ ...value, exemptRoleIds })}
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
          />
        </Field>
        <Field label={t("spam.report")} hint={t("spam.reportHint")}>
          <ChannelSelect value={value.logChannelId} onChange={(logChannelId) => set({ ...value, logChannelId })} emptyLabel={t("spam.noReports")} />
        </Field>
      </fieldset>
    </Group>
  );
};
