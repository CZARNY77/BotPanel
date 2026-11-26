import { useState } from "react";
import type { WarthogSettings } from "../../api/types";
import { Field, MultiSelectChips, TextArea, TextInput } from "../../components/form/fields";
import { Button } from "../../components/ui/Button";
import { Group, Toggle } from "../../components/ui/basics";
import { Icon } from "../../components/ui/Icon";
import { useServerMeta } from "../../hooks/useServerMeta";
import { useT } from "../../i18n";

export const WarthogPanel = ({ value, set }: { value: WarthogSettings; set: (next: WarthogSettings) => void }) => {
  const { t } = useT();
  const { roles } = useServerMeta();
  const [ids, setIds] = useState("");

  const addIds = () => {
    const entries = ids.split(/[\s,]+/).map((v) => v.trim()).filter(Boolean);
    if (!entries.length) return;
    set({ ...value, whitelist: Array.from(new Set([...value.whitelist, ...entries])) });
    setIds("");
  };

  return (
    <Group
      title="Warthog"
      icon="pig"
      description={t("wh.desc")}
      actions={<Toggle label={t("wh.enabled")} hideLabel checked={value.enabled} onChange={(enabled) => set({ ...value, enabled })} />}
    >
      <fieldset className="stack stack--lg plain" disabled={!value.enabled}>
        <Toggle label={t("wh.roleLock")} checked={value.roleLock} onChange={(roleLock) => set({ ...value, roleLock })} />
        {value.roleLock ? (
          <Field label={t("wh.allowed")}>
            <MultiSelectChips
              ariaLabel={t("wh.addAllowed")}
              placeholder={t("field.addRole")}
              values={value.allowedRoles}
              onChange={(allowedRoles) => set({ ...value, allowedRoles })}
              options={roles.map((r) => ({ value: r.id, label: r.name }))}
            />
          </Field>
        ) : null}
        <Field label={t("wh.protected")} hint={t("wh.protectedHint")}>
          <div className="row" style={{ flexWrap: "nowrap" }}>
            <TextInput value={ids} placeholder="123456789012345678" onChange={setIds} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIds())} />
            <Button icon="plus" onClick={addIds}>{t("action.add")}</Button>
          </div>
          {value.whitelist.length ? (
            <div className="chips">
              {value.whitelist.map((id) => (
                <span key={id} className="chip mono">
                  {id}
                  <button type="button" aria-label={t("field.remove", { name: id })} onClick={() => set({ ...value, whitelist: value.whitelist.filter((x) => x !== id) })}>
                    <Icon name="close" size="sm" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </Field>
        <Field label={t("wh.bounce")}>
          <TextArea rows={2} value={value.bounceMessage} onChange={(bounceMessage) => set({ ...value, bounceMessage })} />
        </Field>
        <Field label={t("wh.bounceGif")}>
          <TextInput value={value.bounceGif} placeholder="https://…" onChange={(bounceGif) => set({ ...value, bounceGif })} />
        </Field>
      </fieldset>
    </Group>
  );
};
