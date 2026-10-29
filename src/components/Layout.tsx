import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import logo from "../assets/logo.png";
import { Button } from "./ui/Button";

/** Frame for public pages (landing, policies, 404). The dashboard has its own shell. */
export const Layout = () => {
  const { user, login, signOut, loading } = useAuth();

  return (
    <div className="page-shell">
      <header className="top-nav">
        <Link to="/" className="brand">
          <img src={logo} alt="ConqBot logo" />
          <span>ConqBot Panel</span>
        </Link>
        <nav className="nav-actions">
          {loading ? (
            <span className="muted small">Checking session…</span>
          ) : user ? (
            <>
              <Link to="/dashboard" className="btn btn-primary">
                Dashboard
              </Link>
              <Button variant="ghost" icon="logout" onClick={() => void signOut()}>
                Log out
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={login}>
              Login with Discord
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
