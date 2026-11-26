import { useRef, useState } from "react";
import { getEmojiTriggers, updateEmojiTriggers } from "../../api/endpoints/emoji";
import { uploadImage } from "../../api/endpoints/uploads";
import type { EmojiTriggerSettings } from "../../api/types";
import { EmojiPicker, EmojiView } from "../../components/form/EmojiPicker";
import { TextInput } from "../../components/form/fields";
import { Button, IconButton } from "../../components/ui/Button";
import { EmptyState, ErrorState, Group, PageHeader, PageSkeleton, Toggle } from "../../components/ui/basics";
import { Icon } from "../../components/ui/Icon";
import { errorText, useToast } from "../../components/ui/Toast";
import { useEditable } from "../../hooks/useEditable";
import { useServerResource, useServerScope } from "../../hooks/useServerResource";
import { useT } from "../../i18n";

const MAX_UPLOADS = 10;
const isUpload = (url: string) => url.includes("/api/uploads/") || url.includes("placehold.co/480x270");
const countUploads = (value: EmojiTriggerSettings) =>
  value.triggers.reduce((sum, t) => sum + t.imageUrls.filter(isUpload).length, 0);

export default function EmojiTriggersPage() {
  const { t: tr } = useT();
  const { serverId } = useServerScope();
  const toast = useToast();
  const resource = useServerResource("emoji-triggers", getEmojiTriggers);
  const [uploading, setUploading] = useState(0);
  const [selected, setSelected] = useState(0);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const uploadTarget = useRef<{ trigger: number; image: number } | null>(null);

  const edit = useEditable(resource, {
    label: tr("emojiTr.label"),
    save: (value) =>
      updateEmojiTriggers(serverId, {
        requireExact: value.requireExact,
        triggers: value.triggers.map((t) => ({ emoji: t.emoji, imageUrls: t.imageUrls.map((u) => u.trim()) })),
      }),
    validate: (value) => {
      if (uploading > 0) return tr("emojiTr.err.uploading");
      if (countUploads(value) > MAX_UPLOADS) return tr("emojiTr.err.limit", { max: MAX_UPLOADS });
      if (value.triggers.some((t) => !t.emoji.trim())) return tr("emojiTr.err.emoji");
      if (value.triggers.some((t) => t.imageUrls.length === 0)) return tr("emojiTr.err.image");
      if (value.triggers.some((t) => t.imageUrls.some((u) => !u.trim()))) return tr("emojiTr.err.emptyRow");
      if (value.triggers.some((t) => t.imageUrls.some((u) => !/^https?:\/\//.test(u.trim())))) {
        return tr("emojiTr.err.url");
      }
      return null;
    },
  });

  const value = edit.value;
  const index = value ? Math.min(selected, Math.max(value.triggers.length - 1, 0)) : 0;
  const trigger = value?.triggers[index];

  const updateTrigger = (i: number, next: { emoji: string; imageUrls: string[] }) =>
    edit.set((prev) => ({ ...prev, triggers: prev.triggers.map((t, k) => (k === i ? next : t)) }));

  const addTrigger = () => {
    if (!value) return;
    edit.set((prev) => ({ ...prev, triggers: [...prev.triggers, { emoji: "", imageUrls: [""] }] }));
    setSelected(value.triggers.length);
  };

  const removeTrigger = (i: number) => {
    edit.set((prev) => ({ ...prev, triggers: prev.triggers.filter((_, k) => k !== i) }));
    setSelected((s) => Math.max(0, s - (s >= i ? 1 : 0)));
  };

  const startUpload = (image: number) => {
    if (!value || !trigger) return;
    if (!isUpload(trigger.imageUrls[image] ?? "") && countUploads(value) >= MAX_UPLOADS) {
      toast.error(tr("emojiTr.limitReached", { max: MAX_UPLOADS }));
      return;
    }
    uploadTarget.current = { trigger: index, image };
    fileRef.current?.click();
  };

  const onFile = async (file: File | undefined) => {
    const target = uploadTarget.current;
    if (!file || !target) return;
    setUploading((n) => n + 1);
    try {
      const url = await uploadImage(file, serverId);
      edit.set((prev) => ({
        ...prev,
        triggers: prev.triggers.map((t, k) =>
          k === target.trigger ? { ...t, imageUrls: t.imageUrls.map((u, j) => (j === target.image ? url : u)) } : t
        ),
      }));
    } catch (err) {
      toast.error(errorText(err, tr("emojiTr.uploadFailed")));
    } finally {
      setUploading((n) => n - 1);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <PageHeader
        icon="emoji"
        hue="var(--cb-hue-emoji)"
        title={tr("section.emoji-triggers")}
        subtitle={tr("emojiTr.subtitle")}
        actions={
          value ? (
            <Toggle
              label={tr("emojiTr.exact")}
              checked={value.requireExact}
              onChange={(requireExact) => edit.set({ ...value, requireExact })}
            />
          ) : null
        }
      />
      {resource.error ? <ErrorState message={resource.error} onRetry={() => void resource.reload()} /> : null}
      {!value ? (
        resource.loading ? <PageSkeleton /> : null
      ) : (
        <div className="split split--list">
          <Group
            title={<>{tr("emojiTr.triggers")} <span className="muted num">{value.triggers.length}</span></>}
            actions={<Button size="sm" icon="plus" onClick={addTrigger}>{tr("action.add")}</Button>}
            description={<>{tr("emojiTr.uploads")} <span className="num">{countUploads(value)}/{MAX_UPLOADS}</span> · {tr("emojiTr.linksNoLimit")}</>}
          >
            {value.triggers.length === 0 ? (
              <EmptyState icon="emoji" title={tr("emojiTr.none")} action={<Button variant="primary" icon="plus" onClick={addTrigger}>{tr("emojiTr.addTrigger")}</Button>} />
            ) : (
              <div className="list">
                {value.triggers.map((t, i) => (
                  <div
                    key={i}
                    className={`list-row list-row--click${i === index ? " selected" : ""}`}
                    onClick={() => setSelected(i)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setSelected(i)}
                  >
                    <span className="emoji-token">{t.emoji ? <EmojiView token={t.emoji} size={24} /> : <Icon name="warning" />}</span>
                    <div className="list-row__main">
                      <span className="list-row__title">{!t.emoji ? tr("emojiTr.pickEmoji") : t.emoji.startsWith("<") ? t.emoji.replace(/<a?:([\w~-]+):\d+>/, ":$1:") : tr("emojiTr.standardEmoji")}</span>
                      <span className="list-row__meta">
                        <Icon name="image" size="sm" /> {t.imageUrls.filter(Boolean).length}
                      </span>
                    </div>
                    <div className="thumbs">
                      {t.imageUrls.filter(Boolean).slice(0, 3).map((url) => (
                        <img key={url} src={url} alt="" loading="lazy" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Group>

          {trigger ? (
            <Group
              title={tr("emojiTr.trigger")}
              actions={<IconButton icon="trash" variant="danger" label={tr("emojiTr.removeTrigger")} onClick={() => removeTrigger(index)} />}
            >
              <div className="stack stack--lg">
                <div className="row">
                  <EmojiPicker value={trigger.emoji} invalid={!trigger.emoji} label={tr("emojiTr.pickTrigger")} onPick={(emoji) => updateTrigger(index, { ...trigger, emoji })} />
                  <span className="muted small">{tr("emojiTr.triggerHint")}</span>
                </div>
                <div className="stack">
                  {trigger.imageUrls.map((url, i) => (
                    <div key={i} className="image-row">
                      <div className="image-row__thumb">{/^https?:\/\//.test(url) ? <img src={url} alt="" /> : <Icon name="image" />}</div>
                      <TextInput
                        aria-label={tr("emojiTr.imageUrl", { n: i + 1 })}
                        placeholder="https://…"
                        value={url}
                        aria-invalid={Boolean(url) && !/^https?:\/\//.test(url)}
                        onChange={(next) => updateTrigger(index, { ...trigger, imageUrls: trigger.imageUrls.map((u, j) => (j === i ? next : u)) })}
                      />
                      <IconButton icon="upload" label={tr("emojiTr.upload")} loading={uploading > 0 && uploadTarget.current?.image === i} onClick={() => startUpload(i)} />
                      <IconButton
                        icon="close"
                        label={tr("emojiTr.removeImage")}
                        onClick={() => {
                          const rest = trigger.imageUrls.filter((_, j) => j !== i);
                          updateTrigger(index, { ...trigger, imageUrls: rest.length ? rest : [""] });
                        }}
                      />
                    </div>
                  ))}
                  <div>
                    <Button size="sm" variant="ghost" icon="plus" onClick={() => updateTrigger(index, { ...trigger, imageUrls: [...trigger.imageUrls, ""] })}>
                      {tr("emojiTr.addImage")}
                    </Button>
                  </div>
                </div>
              </div>
            </Group>
          ) : null}
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
    </>
  );
}
