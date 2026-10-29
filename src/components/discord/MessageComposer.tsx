// One message editor for greetings and role reactions: text or embed, insert {user}/{server}/role/emoji.
import { useRef, useState } from "react";
import { ColorInput, Field, RoleSelect, TextArea, TextInput } from "../form/fields";
import { EmojiPicker } from "../form/EmojiPicker";
import { Tabs, Toggle } from "../ui/basics";
import { Icon } from "../ui/Icon";

export type ComposerValue = {
  type: "text" | "embed";
  text: string;
  embed: { title: string; description: string; color: string; showAvatar?: boolean };
};

type Variable = "{user}" | "{server}";

export const MessageComposer = ({
  value,
  onChange,
  variables = ["{user}", "{server}"],
  allowAvatar = false,
  idPrefix,
}: {
  value: ComposerValue;
  onChange: (next: ComposerValue) => void;
  variables?: Variable[];
  allowAvatar?: boolean;
  idPrefix: string;
}) => {
  const [rolePicker, setRolePicker] = useState(false);
  const textRef = useRef<HTMLTextAreaElement | null>(null);

  // Insert at the cursor of the active text area (falls back to the end).
  const insert = (token: string) => {
    const field = value.type === "text" ? value.text : value.embed.description;
    const el = textRef.current;
    const start = el && document.activeElement === el ? el.selectionStart : field.length;
    const end = el && document.activeElement === el ? el.selectionEnd : field.length;
    const next = `${field.slice(0, start)}${token}${field.slice(end)}`;
    if (value.type === "text") onChange({ ...value, text: next });
    else onChange({ ...value, embed: { ...value.embed, description: next } });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const toolbar = (
    <div className="composer-tools" role="toolbar" aria-label="Insert">
      {variables.map((variable) => (
        <button
          key={variable}
          type="button"
          className="btn btn-ghost btn-sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => insert(variable)}
          title={variable === "{user}" ? "Insert the member mention" : "Insert the server name"}
        >
          <Icon name={variable === "{user}" ? "user" : "globe"} size="sm" />
          <span className="mono">{variable}</span>
        </button>
      ))}
      <button type="button" className="btn btn-ghost btn-icon btn-sm" onMouseDown={(e) => e.preventDefault()} onClick={() => setRolePicker((v) => !v)} title="Mention a role" aria-label="Mention a role" aria-expanded={rolePicker}>
        <Icon name="at" size="sm" />
      </button>
      <EmojiPicker onPick={insert} />
    </div>
  );

  return (
    <div className="stack">
      <Tabs
        label="Message format"
        value={value.type}
        onChange={(type) => onChange({ ...value, type })}
        tabs={[
          { key: "text", label: "Text", icon: "greetings" },
          { key: "embed", label: "Embed", icon: "image" },
        ]}
      />
      {value.type === "embed" ? (
        <div className="form-grid">
          <Field label="Title" htmlFor={`${idPrefix}-title`}>
            <TextInput id={`${idPrefix}-title`} value={value.embed.title} maxLength={256} onChange={(title) => onChange({ ...value, embed: { ...value.embed, title } })} />
          </Field>
          <Field label="Colour">
            <ColorInput label="Embed colour" value={value.embed.color} onChange={(color) => onChange({ ...value, embed: { ...value.embed, color } })} />
          </Field>
        </div>
      ) : null}
      <Field label={value.type === "text" ? "Message" : "Description"} htmlFor={`${idPrefix}-body`}>
        <div className="row row--between">{toolbar}</div>
        {rolePicker ? (
          <RoleSelect
            value=""
            ariaLabel="Role to mention"
            onChange={(roleId) => {
              if (roleId) insert(`<@&${roleId}>`);
              setRolePicker(false);
            }}
          />
        ) : null}
        <TextArea
          id={`${idPrefix}-body`}
          ref={textRef}
          rows={5}
          maxLength={value.type === "text" ? 2000 : 4000}
          value={value.type === "text" ? value.text : value.embed.description}
          onChange={(next) =>
            value.type === "text" ? onChange({ ...value, text: next }) : onChange({ ...value, embed: { ...value.embed, description: next } })
          }
        />
      </Field>
      {value.type === "embed" && allowAvatar ? (
        <Toggle label="Show the member's avatar" checked={Boolean(value.embed.showAvatar)} onChange={(showAvatar) => onChange({ ...value, embed: { ...value.embed, showAvatar } })} />
      ) : null}
    </div>
  );
};
