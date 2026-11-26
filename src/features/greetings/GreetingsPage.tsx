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
import { translate, useT, type MessageKey } from "../../i18n";

const labels: Record<GreetingKind, MessageKey> = { welcome: "greet.welcomeMsg", farewell: "greet.farewellMsg" };

const validate = (kind: GreetingKind) => (value: GreetingSettings) => {
  if (!value.enabled) return null;
  const w = kind === "welcome";
  if (value.type === "text" && !value.text.trim()) return translate(w ? "greet.err.textWelcome" : "greet.err.textFarewell");
  if (value.type === "embed" && !value.embed.title.trim() && !value.embed.description.trim()) {
    return translate(w ? "greet.err.embedWelcome" : "greet.err.embedFarewell");
  }
  if (!value.channelId) return translate(w ? "greet.err.channelWelcome" : "greet.err.channelFarewell");
  return null;
};

const useGreeting = (kind: GreetingKind) => {
  const { t } = useT();
  const { serverId } = useServerScope();
  const resource = useServerResource(kind, (id) => getGreeting(id, kind));
  const edit = useEditable(resource, {
    label: t(labels[kind]),
    save: (value) => updateGreeting(serverId, kind, value),
    validate: validate(kind),
  });
  return { resource, edit };
};

const GreetingEditor = ({ kind, edit }: { kind: GreetingKind; edit: Editable<GreetingSettings> }) => {
  const { t } = useT();
  const { user } = useAuth();
  const { server } = useServerScope();
  const value = edit.value;
  if (!value) return null;
  return (
    <div className="split">
      <div>
        <Group
          title={t(kind === "welcome" ? "greet.joins" : "greet.leaves")}
          actions={<Toggle label={t("state.enabled")} hideLabel checked={value.enabled} onChange={(enabled) => edit.set({ ...value, enabled })} />}
        >
          <div className="stack stack--lg">
            <Field label={t("field.channel")}>
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
          label={t(value.enabled ? "preview.label" : "greet.previewOff")}
        />
      </div>
    </div>
  );
};

export default function GreetingsPage() {
  const { t } = useT();
  const [tab, setTab] = useState<GreetingKind>("welcome");
  const welcome = useGreeting("welcome");
  const farewell = useGreeting("farewell");
  const current = tab === "welcome" ? welcome : farewell;

  return (
    <>
      <PageHeader
        icon="greetings"
        hue="var(--cb-hue-greetings)"
        title={t("section.greetings")}
        subtitle={t("greet.subtitle")}
      />
      <Tabs
        label={t("greet.type")}
        value={tab}
        onChange={setTab}
        tabs={[
          { key: "welcome", label: t("greet.welcome"), icon: "plus" },
          { key: "farewell", label: t("greet.farewell"), icon: "logout" },
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
