import { useState } from "react";
import type { WarthogSettings } from "../../api/types";
import { Field, MultiSelectChips, TextArea, TextInput } from "../../components/form/fields";
import { Button } from "../../components/ui/Button";
import { Group, Toggle } from "../../components/ui/basics";
import { Icon } from "../../components/ui/Icon";
import { useServerMeta } from "../../hooks/useServerMeta";

export const WarthogPanel = ({ value, set }: { value: WarthogSettings; set: (next: WarthogSettings) => void }) => {
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
      description="The /warthog fun command. Protected users bounce it back."
      actions={<Toggle label="Warthog enabled" hideLabel checked={value.enabled} onChange={(enabled) => set({ ...value, enabled })} />}
    >
      <fieldset className="stack stack--lg plain" disabled={!value.enabled}>
        <Toggle label="Only selected roles can use it" checked={value.roleLock} onChange={(roleLock) => set({ ...value, roleLock })} />
        {value.roleLock ? (
          <Field label="Allowed roles">
            <MultiSelectChips
              ariaLabel="Add allowed role"
              placeholder="Add a role…"
              values={value.allowedRoles}
              onChange={(allowedRoles) => set({ ...value, allowedRoles })}
              options={roles.map((r) => ({ value: r.id, label: r.name }))}
            />
          </Field>
        ) : null}
        <Field label="Protected users" hint="Discord user IDs, separated by spaces or commas">
          <div className="row" style={{ flexWrap: "nowrap" }}>
            <TextInput value={ids} placeholder="123456789012345678" onChange={setIds} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIds())} />
            <Button icon="plus" onClick={addIds}>Add</Button>
          </div>
          {value.whitelist.length ? (
            <div className="chips">
              {value.whitelist.map((id) => (
                <span key={id} className="chip mono">
                  {id}
                  <button type="button" aria-label={`Remove ${id}`} onClick={() => set({ ...value, whitelist: value.whitelist.filter((x) => x !== id) })}>
                    <Icon name="close" size="sm" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </Field>
        <Field label="Bounce message">
          <TextArea rows={2} value={value.bounceMessage} onChange={(bounceMessage) => set({ ...value, bounceMessage })} />
        </Field>
        <Field label="Bounce GIF URL">
          <TextInput value={value.bounceGif} placeholder="https://…" onChange={(bounceGif) => set({ ...value, bounceGif })} />
        </Field>
      </fieldset>
    </Group>
  );
};
