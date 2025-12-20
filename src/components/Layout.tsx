import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button } from "./Button";

export const Layout = () => {
  const { user, login, signOut, loading } = useAuth();
  const location = useLocation();
  const onDashboard =
    location.pathname.startsWith("/dashboard") || location.pathname.startsWith("/servers");

  return (
    <div className="app-shell">
      <div className="ambient" aria-hidden="true" />
      <header className="top-nav">
        <Link to="/" className="brand">
          <span className="brand-mark">C</span>
          <span className="brand-text">ConqBot Panel</span>
        </Link>
        <nav className="nav-actions">
          {loading ? (
            <span className="nav-status">Sprawdzamy sesje...</span>
          ) : user ? (
            <>
              <Link to="/dashboard" className={`nav-link ${onDashboard ? "active" : ""}`}>
                Dashboard
              </Link>
              <Button variant="outline" onClick={signOut}>
                Wyloguj
              </Button>
            </>
          ) : (
            <Button onClick={login}>Zaloguj przez Discord</Button>
          )}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="footer">
        <p>ConqBot Panel · Wersja MVP · Zbudowane z mysla o prostocie.</p>
      </footer>
    </div>
  );
};
