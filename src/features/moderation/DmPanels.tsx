import type { BanDmSettings, TimeoutDmSettings } from "../../api/types";
import { MessagePreview } from "../../components/discord/MessagePreview";
import { Field, TextArea } from "../../components/form/fields";
import { Group, Toggle } from "../../components/ui/basics";
import { useServerScope } from "../../hooks/useServerResource";

const TIMEOUT_DEFAULT = "You have been timed out on {server} for {minutes} minutes.";

/** K11/K12 */
export const TimeoutDmPanel = ({ value, set }: { value: TimeoutDmSettings; set: (next: TimeoutDmSettings) => void }) => {
  const { server } = useServerScope();
  return (
    <Group
      title="Timeout DM"
      icon="timer"
      description="Private message to a member when a moderator times them out."
      actions={<Toggle label="Timeout DM enabled" hideLabel checked={value.enabled} onChange={(enabled) => set({ ...value, enabled })} />}
    >
      <fieldset className="stack plain" disabled={!value.enabled}>
        <Field
          label="Message"
          hint={
            <>
              <span className={value.message.length > 1500 ? "field__error" : ""}>{value.message.length}/1500</span> · empty = default text ·
              <span className="mono"> {"{minutes} {seconds} {server}"}</span>
            </>
          }
        >
          <TextArea rows={3} value={value.message} placeholder={TIMEOUT_DEFAULT} onChange={(message) => set({ ...value, message })} />
        </Field>
        <MessagePreview type="text" text={value.message || TIMEOUT_DEFAULT} vars={{ server: server.name }} label="Preview (DM)" />
      </fieldset>
    </Group>
  );
};

/** K15: separate text after unban (B-11). */
export const BanDmPanel = ({ value, set }: { value: BanDmSettings; set: (next: BanDmSettings) => void }) => {
  const { server } = useServerScope();
  return (
    <Group
      title="Ban and unban DM"
      icon="ban"
      description="Discord usually blocks DMs once a member no longer shares a server with the bot, so the ban message may not arrive."
      actions={<Toggle label="Ban DM enabled" hideLabel checked={value.enabled} onChange={(enabled) => set({ ...value, enabled })} />}
    >
      <fieldset className="stack stack--lg plain" disabled={!value.enabled}>
        <Field label="After a ban" hint="Supports **bold** and *italic*">
          <TextArea rows={3} value={value.message} onChange={(message) => set({ ...value, message })} />
        </Field>
        <Field label="After an unban" hint="Empty = no extra text">
          <TextArea rows={2} value={value.unbanMessage} placeholder="e.g. You can join again: discord.gg/…" onChange={(unbanMessage) => set({ ...value, unbanMessage })} />
        </Field>
        <MessagePreview type="text" text={value.message} vars={{ server: server.name }} label="Preview (ban DM)" />
      </fieldset>
    </Group>
  );
};
