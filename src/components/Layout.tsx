import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import logo from "../assets/logo.png";
import { Button } from "./ui/Button";
import { useT } from "../i18n";
import { LangSwitch } from "../shell/UserPanel";

/** Frame for public pages (landing, policies, 404). The dashboard has its own shell. */
export const Layout = () => {
  const { t } = useT();
  const { user, login, signOut, loading } = useAuth();

  return (
    <div className="page-shell">
      <header className="top-nav">
        <Link to="/" className="brand">
          <img src={logo} alt={t("brand.logo")} />
          <span>{t("brand.panel")}</span>
        </Link>
        <nav className="nav-actions">
          <LangSwitch guard={() => false} />
          {loading ? (
            <span className="muted small">{t("session.checking")}</span>
          ) : user ? (
            <>
              <Link to="/dashboard" className="btn btn-primary">
                {t("action.dashboard")}
              </Link>
              <Button variant="ghost" icon="logout" onClick={() => void signOut()}>
                {t("user.logout")}
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={login}>
              {t("action.login")}
            </Button>
          )}
        </nav>
      </header>
      <main className="page-main">
        <Outlet />
      </main>
    </div>
  );
};
