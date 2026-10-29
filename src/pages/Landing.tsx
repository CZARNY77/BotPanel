import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getInviteUrl } from "../api/endpoints/servers";
import { Button } from "../components/Button";
import logo from "../assets/logo.png";

const features = [
  {
    title: "Greetings & Farewells",
    description: "Welcome or send-off messages with text or embeds.",
  },
  {
    title: "Event creator",
    description: "Discord-style RSVP events with reminders and pings.",
  },
  {
    title: "Voice presence",
    description: "Manual or scheduled attendance snapshots for voice channels.",
  },
  {
    title: "Emoji triggers",
    description: "Respond to emojis with a random image.",
  },
  {
    title: "Role reactions",
    description: "Self-assign roles from reaction messages.",
  },
  {
    title: "Auto roles + tools",
    description: "Assign roles on join and manage extra toggles.",
  },
];

export const Landing = () => {
  const { user, login } = useAuth();
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const handleInvite = async () => {
    setInviteLoading(true);
    setInviteError(null);
    try {
      const url = await getInviteUrl();
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        setInviteError("Invite link unavailable. Try again in a moment.");
      }
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to open invite link.");
    } finally {
      setInviteLoading(false);
    }
  };
  const heroCta = useMemo(() => {
    if (user) {
      return (
        <Link to="/dashboard" className="btn btn-primary">
          Open dashboard
        </Link>
      );
    }

    return (
      <Button onClick={login}>
        Login with Discord
      </Button>
    );
  }, [user, login]);

  return (
    <div className="landing landing--simple">
      <section className="landing-hero">
        <div className="landing-container">
          <div className="landing-card">
            <div className="hero-brand">
              <img src={logo} alt="ConqBot logo" />
              <span>ConqBot Panel</span>
            </div>
            <h1>One panel to run your Discord servers.</h1>
            <p className="muted">
              Configure welcomes, events, voice presence, and role tools from a clean dashboard.
            </p>
            <div className="hero-actions">
              {heroCta}
              <Button variant="outline" onClick={handleInvite} disabled={inviteLoading}>
                {inviteLoading ? "Opening..." : "Add ConqBot"}
              </Button>
            </div>
            {inviteError ? <p className="muted">{inviteError}</p> : null}
          </div>
        </div>
      </section>

      <section id="features" className="landing-section">
        <div className="landing-container">
          <h2>What you can do</h2>
          <div className="feature-list">
            {features.map((feature) => (
              <article key={feature.title} className="feature-item">
                <h3>{feature.title}</h3>
                <p className="muted">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <span className="muted">ConqBot Panel</span>
          <div className="footer-links">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms-of-service">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
