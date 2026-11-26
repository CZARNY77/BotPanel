// Signed-in user at the bottom of the sidebar (like Discord's user panel): avatar, name, language, log out.
import type { User } from "../api/types";
import { IconButton } from "../components/ui/Button";
import { useT, type Lang } from "../i18n";

const LANGS: Lang[] = ["en", "pl"];

export const LangSwitch = ({ guard }: { guard: () => boolean }) => {
  const { lang, setLang, t } = useT();
  return (
    <div className="lang-switch" role="group" aria-label={t("lang.label")}>
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          className={`lang-switch__btn${code === lang ? " active" : ""}`}
          aria-pressed={code === lang}
          title={t(code === "en" ? "lang.en" : "lang.pl")}
          onClick={() => code !== lang && !guard() && setLang(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export const UserPanel = ({ user, onSignOut, guard }: { user: User | null; onSignOut: () => void; guard: () => boolean }) => {
  const { t } = useT();
  return (
    <div className="user-panel">
      <span className="avatar user-panel__avatar" title={user?.username}>
        {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : user?.username?.[0]?.toUpperCase()}
      </span>
      <div className="user-panel__who sidebar__text">
        <strong className="truncate">{user?.username ?? t("user.fallback")}</strong>
        {user?.id ? <span className="user-panel__id num truncate">{user.id}</span> : null}
      </div>
      <LangSwitch guard={guard} />
      <IconButton icon="logout" label={t("user.logout")} onClick={onSignOut} />
    </div>
  );
};
