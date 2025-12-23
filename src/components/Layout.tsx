import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button } from "./Button";

export const Layout = () => {
  const { user, login, signOut, loading } = useAuth();
  const location = useLocation();
  const onDashboard = location.pathname.startsWith("/dashboard");

  if (onDashboard) {
    return <Outlet />;
  }

  return (
    <div className="page-shell">
      <header className="top-nav">
        <Link to="/" className="brand">
          <span className="brand-mark">C</span>
          <span className="brand-text">ConqBot Panel</span>
        </Link>
        <nav className="nav-actions">
          {loading ? (
            <span className="nav-status">Checking session...</span>
          ) : user ? (
            <>
              <Link to="/dashboard" className="nav-link">
                Dashboard
              </Link>
              <Button variant="outline" onClick={signOut}>
                Log out
              </Button>
            </>
          ) : (
            <Button onClick={login}>Login with Discord</Button>
          )}
        </nav>
      </header>
      <main className="page-main">
        <Outlet />
      </main>
      <footer className="footer">
        <p>ConqBot Panel - MVP build - Built for fast, clean control.</p>
      </footer>
    </div>
  );
};
