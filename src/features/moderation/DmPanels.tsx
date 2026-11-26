import type { BanDmSettings, TimeoutDmSettings } from "../../api/types";
import { MessagePreview } from "../../components/discord/MessagePreview";
import { Field, TextArea } from "../../components/form/fields";
import { Group, Toggle } from "../../components/ui/basics";
import { useServerScope } from "../../hooks/useServerResource";
import { useT } from "../../i18n";

/** The bot sends this English text when the message is empty, so it is not translated. */
const TIMEOUT_DEFAULT = "You have been timed out on {server} for {minutes} minutes.";

/** K11/K12 */
export const TimeoutDmPanel = ({ value, set }: { value: TimeoutDmSettings; set: (next: TimeoutDmSettings) => void }) => {
  const { t } = useT();
  const { server } = useServerScope();
  return (
    <Group
      title={t("dm.timeoutTitle")}
      icon="timer"
      description={t("dm.timeoutDesc")}
      actions={<Toggle label={t("dm.timeoutEnabled")} hideLabel checked={value.enabled} onChange={(enabled) => set({ ...value, enabled })} />}
    >
      <fieldset className="stack plain" disabled={!value.enabled}>
        <Field
          label={t("composer.message")}
          hint={
            <>
              <span className={value.message.length > 1500 ? "field__error" : ""}>{value.message.length}/1500</span> · {t("dm.emptyDefault")} ·
              <span className="mono"> {"{minutes} {seconds} {server}"}</span>
            </>
          }
        >
          <TextArea rows={3} value={value.message} placeholder={TIMEOUT_DEFAULT} onChange={(message) => set({ ...value, message })} />
        </Field>
        <MessagePreview type="text" text={value.message || TIMEOUT_DEFAULT} vars={{ server: server.name }} label={t("dm.previewDm")} />
      </fieldset>
    </Group>
  );
};

/** K15: separate text after unban (B-11). */
export const BanDmPanel = ({ value, set }: { value: BanDmSettings; set: (next: BanDmSettings) => void }) => {
  const { t } = useT();
  const { server } = useServerScope();
  return (
    <Group
      title={t("dm.banTitle")}
      icon="ban"
      description={t("dm.banDesc")}
      actions={<Toggle label={t("dm.banEnabled")} hideLabel checked={value.enabled} onChange={(enabled) => set({ ...value, enabled })} />}
    >
      <fieldset className="stack stack--lg plain" disabled={!value.enabled}>
        <Field label={t("dm.afterBan")} hint={t("dm.afterBanHint")}>
          <TextArea rows={3} value={value.message} onChange={(message) => set({ ...value, message })} />
        </Field>
        <Field label={t("dm.afterUnban")} hint={t("dm.afterUnbanHint")}>
          <TextArea rows={2} value={value.unbanMessage} placeholder={t("dm.unbanPlaceholder")} onChange={(unbanMessage) => set({ ...value, unbanMessage })} />
        </Field>
        <MessagePreview type="text" text={value.message} vars={{ server: server.name }} label={t("dm.previewBan")} />
      </fieldset>
    </Group>
  );
};
