import { useState } from "react";
import { getRoleReactions, updateRoleReactions } from "../../api/endpoints/roleReactions";
import type { RoleReactionMessage, RoleReactionSettings } from "../../api/types";
import { MessageComposer } from "../../components/discord/MessageComposer";
import { MessagePreview } from "../../components/discord/MessagePreview";
import { EmojiPicker, EmojiView } from "../../components/form/EmojiPicker";
import { ChannelSelect, Field, RoleSelect } from "../../components/form/fields";
import { Button, IconButton } from "../../components/ui/Button";
import { EmptyState, ErrorState, Group, PageHeader, PageSkeleton, StatusPill, Toggle } from "../../components/ui/basics";
import { Icon } from "../../components/ui/Icon";
import { useEditable } from "../../hooks/useEditable";
import { useServerMeta } from "../../hooks/useServerMeta";
import { useServerResource, useServerScope } from "../../hooks/useServerResource";
import { translate, useT } from "../../i18n";

const newMessage = (): RoleReactionMessage => ({
  key: Math.random().toString(36).slice(2, 9),
  channelId: "",
  type: "text",
  message: translate("rr.defaultText"),
  embed: { title: translate("rr.defaultTitle"), description: translate("rr.defaultText"), color: "#f97316" },
  pairs: [],
  messageId: "",
});

const validate = (value: RoleReactionSettings) => {
  if (!value.enabled) return null;
  for (const message of value.messages) {
    if (!message.channelId) return translate("rr.err.channel");
    if (message.type === "text" && !message.message.trim()) return translate("rr.err.text");
    if (message.type === "embed" && !message.embed.description.trim()) return translate("rr.err.embed");
    if (message.pairs.length === 0) return translate("rr.err.pairs");
    if (message.pairs.some((pair) => !pair.emoji.trim() || !pair.roleId.trim())) return translate("rr.err.pair");
  }
  return null;
};

export default function RoleReactionsPage() {
  const { t } = useT();
  const { serverId, server } = useServerScope();
  const { channelName, roleName } = useServerMeta();
  const resource = useServerResource("role-reactions", getRoleReactions);
  const [selected, setSelected] = useState(0);
  const edit = useEditable(resource, {
    label: t("section.role-reactions"),
    validate,
    save: (value) =>
      updateRoleReactions(serverId, { ...value, enabled: value.enabled && value.messages.length > 0 }),
  });
  const value = edit.value;
  const index = value ? Math.min(selected, Math.max(value.messages.length - 1, 0)) : 0;
  const message = value?.messages[index];

  const setMessage = (next: RoleReactionMessage) =>
    edit.set((prev) => ({ ...prev, messages: prev.messages.map((m, i) => (i === index ? next : m)) }));

  const add = () => {
    if (!value) return;
    edit.set((prev) => ({ enabled: true, messages: [...prev.messages, newMessage()] }));
    setSelected(value.messages.length);
  };

  const remove = () => {
    edit.set((prev) => ({ ...prev, messages: prev.messages.filter((_, i) => i !== index) }));
    setSelected((s) => Math.max(0, s - 1));
  };

  return (
    <>
      <PageHeader
        icon="reactions"
        hue="var(--cb-hue-reactions)"
        title={t("section.role-reactions")}
        subtitle={t("rr.subtitle")}
        actions={value ? <Toggle label={t("state.enabled")} checked={value.enabled} onChange={(enabled) => edit.set({ ...value, enabled })} /> : null}
      />
      {resource.error ? <ErrorState message={resource.error} onRetry={() => void resource.reload()} /> : null}
      {!value ? (
        resource.loading ? <PageSkeleton /> : null
      ) : value.messages.length === 0 ? (
        <EmptyState icon="reactions" title={t("rr.none")} action={<Button variant="primary" icon="plus" onClick={add}>{t("rr.addMessage")}</Button>}>
          {t("rr.noneHint")}
        </EmptyState>
      ) : (
        <div className="cols-rr">
          <Group title={<>{t("rr.messages")} <span className="muted num">{value.messages.length}</span></>} actions={<IconButton icon="plus" label={t("rr.addMessage")} variant="secondary" onClick={add} />}>
            <div className="list">
              {value.messages.map((m, i) => (
                <div key={m.key || i} role="button" tabIndex={0} className={`list-row list-row--click${i === index ? " selected" : ""}`} onClick={() => setSelected(i)} onKeyDown={(e) => e.key === "Enter" && setSelected(i)}>
                  <Icon name={m.type === "embed" ? "image" : "greetings"} />
                  <div className="list-row__main">
                    <span className="list-row__title truncate">{m.channelId ? channelName.get(m.channelId) ?? t("rr.unknownChannel") : t("rr.noChannel")}</span>
                    <span className="list-row__meta">
                      {m.pairs.slice(0, 5).map((p, k) => <EmojiView key={k} token={p.emoji} size={16} />)}
                      {m.messageId ? <Icon name="check" size="sm" title={t("rr.posted")} /> : <span title={t("rr.postedAfter")}>{t("rr.new")}</span>}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Group>

          {message ? (
            <Group title={t("rr.message")} actions={<IconButton icon="trash" variant="danger" label={t("rr.removeMessage")} onClick={remove} />}>
              <div className="stack stack--lg">
                <Field label={t("field.channel")}>
                  <ChannelSelect value={message.channelId} invalid={!message.channelId} onChange={(channelId) => setMessage({ ...message, channelId })} />
                </Field>
                <MessageComposer
                  idPrefix={`rr-${index}`}
                  variables={[]}
                  value={{ type: message.type, text: message.message, embed: message.embed }}
                  onChange={(next) =>
                    setMessage({
                      ...message,
                      type: next.type,
                      message: next.type === "embed" ? next.embed.description : next.text,
                      embed: { title: next.embed.title, description: next.embed.description, color: next.embed.color },
                    })
                  }
                />
                <Field label={t("rr.pairs")}>
                  <div className="stack" style={{ gap: 8 }}>
                    {message.pairs.map((pair, k) => (
                      <div key={k} className="pair-row">
                        <EmojiPicker
                          value={pair.emoji}
                          invalid={!pair.emoji}
                          label={t("rr.pickEmoji")}
                          onPick={(emoji) => setMessage({ ...message, pairs: message.pairs.map((p, j) => (j === k ? { ...p, emoji } : p)) })}
                        />
                        <Icon name="chevronRight" className="flow__arrow" />
                        <div className="grow">
                          <RoleSelect value={pair.roleId} invalid={!pair.roleId} onChange={(roleId) => setMessage({ ...message, pairs: message.pairs.map((p, j) => (j === k ? { ...p, roleId } : p)) })} />
                        </div>
                        <IconButton icon="close" label={t("rr.removePair")} onClick={() => setMessage({ ...message, pairs: message.pairs.filter((_, j) => j !== k) })} />
                      </div>
                    ))}
                    <div>
                      <Button size="sm" variant="ghost" icon="plus" onClick={() => setMessage({ ...message, pairs: [...message.pairs, { emoji: "", roleId: "" }] })}>
                        {t("rr.addPair")}
                      </Button>
                    </div>
                  </div>
                </Field>
              </div>
            </Group>
          ) : null}

          {message ? (
            <div className="sticky-col stack">
              <MessagePreview
                type={message.type}
                text={message.message}
                embed={message.embed}
                vars={{ server: server.name }}
                reactions={message.pairs.map((p) => p.emoji).filter(Boolean)}
              />
              <ul className="legend">
                {message.pairs.filter((p) => p.emoji).map((p, k) => (
                  <li key={k}>
                    <EmojiView token={p.emoji} size={18} /> <Icon name="chevronRight" size="sm" /> {roleName.get(p.roleId) ?? t("field.pickRole")}
                  </li>
                ))}
              </ul>
              {value.enabled ? null : <StatusPill on={false} offLabel={t("rr.disabled")} />}
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}
