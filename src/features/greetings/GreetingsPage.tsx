import { useState } from "react";
import { getGreeting, updateGreeting, type GreetingKind } from "../../api/endpoints/greetings";
import type { GreetingSettings } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { MessageComposer } from "../../components/discord/MessageComposer";
import { MessagePreview } from "../../components/discord/MessagePreview";
import { ChannelSelect, Field } from "../../components/form/fields";
import { ErrorState, Group, PageHeader, PageSkeleton, Tabs, Toggle } from "../../components/ui/basics";
import { useEditable, type Editable } from "../../hooks/useEditable";
import { useServerResource, useServerScope } from "../../hooks/useServerResource";

const labels: Record<GreetingKind, string> = { welcome: "Welcome message", farewell: "Farewell message" };

const validate = (kind: GreetingKind) => (value: GreetingSettings) => {
  if (!value.enabled) return null;
  const what = kind === "welcome" ? "welcome" : "farewell";
  if (value.type === "text" && !value.text.trim()) return `The ${what} text cannot be empty.`;
  if (value.type === "embed" && !value.embed.title.trim() && !value.embed.description.trim()) {
    return `Give the ${what} embed a title or a description.`;
  }
  if (!value.channelId) return `Pick a channel for the ${what} message.`;
  return null;
};

const useGreeting = (kind: GreetingKind) => {
  const { serverId } = useServerScope();
  const resource = useServerResource(kind, (id) => getGreeting(id, kind));
  const edit = useEditable(resource, {
    label: labels[kind],
    save: (value) => updateGreeting(serverId, kind, value),
    validate: validate(kind),
  });
  return { resource, edit };
};

const GreetingEditor = ({ kind, edit }: { kind: GreetingKind; edit: Editable<GreetingSettings> }) => {
  const { user } = useAuth();
  const { server } = useServerScope();
  const value = edit.value;
  if (!value) return null;
  return (
    <div className="split">
      <div>
        <Group
          title={kind === "welcome" ? "When someone joins" : "When someone leaves"}
          actions={<Toggle label="Enabled" hideLabel checked={value.enabled} onChange={(enabled) => edit.set({ ...value, enabled })} />}
        >
          <div className="stack stack--lg">
            <Field label="Channel">
              <ChannelSelect
                value={value.channelId}
                onChange={(channelId) => edit.set({ ...value, channelId })}
                invalid={value.enabled && !value.channelId}
              />
            </Field>
            <MessageComposer
              idPrefix={kind}
              allowAvatar
              value={value}
              onChange={(next) => edit.set({ ...value, type: next.type, text: next.text, embed: { ...value.embed, ...next.embed, showAvatar: Boolean(next.embed.showAvatar) } })}
            />
          </div>
        </Group>
      </div>
      <div className="sticky-col">
        <MessagePreview
          type={value.type}
          text={value.text}
          embed={value.embed}
          avatarUrl={user?.avatarUrl}
          vars={{ user: user?.username, server: server.name }}
          label={value.enabled ? "Preview" : "Preview (disabled)"}
        />
      </div>
    </div>
  );
};

export default function GreetingsPage() {
  const [tab, setTab] = useState<GreetingKind>("welcome");
  const welcome = useGreeting("welcome");
  const farewell = useGreeting("farewell");
  const current = tab === "welcome" ? welcome : farewell;

  return (
    <>
      <PageHeader
        icon="greetings"
        hue="var(--cb-hue-greetings)"
        title="Greetings"
        subtitle="Messages the bot posts when members join or leave. Use {user} and {server} as placeholders."
      />
      <Tabs
        label="Greeting type"
        value={tab}
        onChange={setTab}
        tabs={[
          { key: "welcome", label: "Welcome", icon: "plus" },
          { key: "farewell", label: "Farewell", icon: "logout" },
        ]}
      />
      <div style={{ marginTop: 24 }}>
        {current.resource.error ? (
          <ErrorState message={current.resource.error} onRetry={() => void current.resource.reload()} />
        ) : !current.edit.value ? (
          <PageSkeleton />
        ) : (
          <GreetingEditor kind={tab} edit={current.edit} />
        )}
      </div>
    </>
  );
}
