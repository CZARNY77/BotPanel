// Emoji picker: server emojis + standard ones, with search. Returns the Discord token.
import { useEffect, useRef, useState } from "react";
import defaultEmojisRaw from "../../data/default-emojis.json";
import type { EmojiOption } from "../../api/types";
import { useServerEmojis } from "../../hooks/useServerMeta";
import { Icon } from "../ui/Icon";

const defaultEmojis = defaultEmojisRaw as EmojiOption[];

const CUSTOM = /^<(a?):([\w~-]+):(\d+)>$/;

/** Token stored by the bot: unicode emoji or <:name:id>. */
export const emojiToken = (emoji: EmojiOption) => {
  if (emoji.id.startsWith("<")) return emoji.id;
  if (/^\d+$/.test(emoji.id)) {
    const animated = emoji.url?.toLowerCase().includes(".gif");
    return `<${animated ? "a" : ""}:${emoji.name || "emoji"}:${emoji.id}>`;
  }
  return emoji.id;
};

/** Renders a unicode emoji or a custom Discord emoji image. */
export const EmojiView = ({ token, size = 20 }: { token: string; size?: number }) => {
  const match = token.match(CUSTOM);
  if (!match) return <span style={{ fontSize: size * 0.9, lineHeight: 1 }}>{token || "?"}</span>;
  const [, animated, name, id] = match;
  return (
    <img
      src={`https://cdn.discordapp.com/emojis/${id}.${animated ? "gif" : "png"}`}
      alt={`:${name}:`}
      title={`:${name}:`}
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  );
};

export const EmojiPicker = ({
  onPick,
  label = "Insert emoji",
  value,
  invalid,
}: {
  onPick: (token: string) => void;
  label?: string;
  /** When set, the trigger shows the chosen emoji (select mode). */
  value?: string;
  invalid?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);
  const serverEmojis = useServerEmojis();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const filter = (list: EmojiOption[]) => list.filter((e) => !q || e.name.toLowerCase().includes(q));
  const server = filter(serverEmojis.data ?? []);
  const standard = filter(defaultEmojis);

  const pick = (emoji: EmojiOption) => {
    onPick(emojiToken(emoji));
    setOpen(false);
    setQuery("");
  };

  const selectMode = value !== undefined;

  return (
    <div className="combo" ref={ref} style={{ display: "inline-block" }}>
      {selectMode ? (
        <button
          type="button"
          className={`btn btn-secondary emoji-slot${invalid ? " emoji-slot--invalid" : ""}`}
          onClick={() => setOpen((v) => !v)}
          aria-label={value ? `Emoji ${value}. Change` : label}
          title={label}
        >
          {value ? <EmojiView token={value} /> : <Icon name="emoji" />}
        </button>
      ) : (
        <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpen((v) => !v)} aria-label={label} title={label}>
          <Icon name="emoji" size="sm" />
        </button>
      )}
      {open ? (
        <div className="popover popover--wide" role="dialog" aria-label={label}>
          <input
            autoFocus
            className="input"
            placeholder="Search emoji…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search emoji"
          />
          {server.length ? (
            <>
              <div className="palette__group">This server</div>
              <div className="emoji-grid">
                {server.map((emoji) => (
                  <button key={emoji.id} type="button" className="option" title={`:${emoji.name}:`} onClick={() => pick(emoji)}>
                    {emoji.url ? <img src={emoji.url} alt={emoji.name} /> : <EmojiView token={emojiToken(emoji)} />}
                  </button>
                ))}
              </div>
            </>
          ) : null}
          <div className="palette__group">Standard</div>
          <div className="emoji-grid">
            {standard.map((emoji) => (
              <button key={emoji.id} type="button" className="option" title={emoji.name} onClick={() => pick(emoji)}>
                {emoji.id}
              </button>
            ))}
          </div>
          {!server.length && !standard.length ? <div className="option-empty">No emoji found.</div> : null}
        </div>
      ) : null}
    </div>
  );
};
