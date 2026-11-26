// Live Discord-like preview: text or embed, {user}/{server} variables, role mentions, **bold**, *italic*.
import type { CSSProperties, ReactNode } from "react";
import logo from "../../assets/logo.png";
import { useServerMeta } from "../../hooks/useServerMeta";
import { EmojiView } from "../form/EmojiPicker";
import { Icon } from "../ui/Icon";
import { useT } from "../../i18n";

export type PreviewEmbed = { title: string; description: string; color: string; showAvatar?: boolean };

type Vars = { user?: string; server?: string };

const TOKEN = /(<@&\d+>|\{user\}|\{server\}|\{minutes\}|\{seconds\}|<a?:[\w~-]+:\d+>|\*\*[^*]+\*\*|\*[^*]+\*)/g;

const useRich = (vars: Vars) => {
  const { t } = useT();
  const { roleName } = useServerMeta();
  return (text: string): ReactNode[] =>
    text.split(TOKEN).map((part, index) => {
      if (!part) return null;
      if (part === "{user}") return <span key={index} className="dc__mention">@{vars.user ?? t("preview.newMember")}</span>;
      if (part === "{server}") return <strong key={index}>{vars.server ?? t("preview.server")}</strong>;
      if (part === "{minutes}") return <strong key={index}>10</strong>;
      if (part === "{seconds}") return <strong key={index}>600</strong>;
      const role = part.match(/^<@&(\d+)>$/);
      if (role) {
        const name = roleName.get(role[1]) ?? t("preview.unknownRole");
        return <span key={index} className="dc__mention">{name.startsWith("@") ? name : `@${name}`}</span>;
      }
      if (/^<a?:[\w~-]+:\d+>$/.test(part)) return <EmojiView key={index} token={part} size={20} />;
      if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={index}>{part.slice(2, -2)}</strong>;
      if (/^\*[^*]+\*$/.test(part)) return <em key={index}>{part.slice(1, -1)}</em>;
      return <span key={index}>{part}</span>;
    });
};

export const MessagePreview = ({
  type,
  text,
  embed,
  vars = {},
  avatarUrl,
  reactions,
  label,
  image,
}: {
  type: "text" | "embed";
  text: string;
  embed?: PreviewEmbed;
  vars?: Vars;
  avatarUrl?: string;
  reactions?: string[];
  label?: string;
  image?: string;
}) => {
  const { t, locale } = useT();
  const rich = useRich(vars);
  const time = new Date().toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  return (
    <div>
      <div className="dc__label">
        <Icon name="eye" size="sm" />
        {label ?? t("preview.label")}
      </div>
      <div className="dc" aria-label={t("preview.aria")}>
        <div className="dc__msg">
          <div className="dc__avatar">
            <img src={logo} alt="" />
          </div>
          <div className="dc__body">
            <div className="dc__head">
              <span className="dc__name">ConqBot</span>
              <span className="dc__tag">APP</span>
              <span className="dc__time">{t("preview.today", { time })}</span>
            </div>
            {type === "text" ? (
              <div className="dc__text">{text.trim() ? rich(text) : <span className="dc__time">{t("preview.empty")}</span>}</div>
            ) : (
              <div className="dc__embed" style={{ "--embed": embed?.color || "#5865f2" } as CSSProperties}>
                <div className="grow">
                  {embed?.title ? <div className="dc__embed-title">{rich(embed.title)}</div> : null}
                  <div className="dc__text">{rich(embed?.description ?? "")}</div>
                </div>
                {embed?.showAvatar ? (
                  <div className="dc__embed-thumb">{avatarUrl ? <img src={avatarUrl} alt="" /> : null}</div>
                ) : null}
              </div>
            )}
            {image ? <img className="dc__image" src={image} alt="" /> : null}
            {reactions?.length ? (
              <div className="dc__reactions">
                {reactions.map((token, index) => (
                  <span key={`${token}-${index}`} className="dc__reaction">
                    <EmojiView token={token} size={16} /> 1
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
