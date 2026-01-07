import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getInviteUrl } from "../api/client";
import { Button } from "../components/Button";
import logo from "../assets/logo.png";

const features = [
  {
    title: "Overview and server insights",
    description: "See server status, bot connectivity, and quick health details at a glance.",
  },
  {
    title: "Greetings & farewells",
    description: "Customize welcome and goodbye messages with text or embeds per server.",
  },
  {
    title: "Event creator",
    description: "Publish RSVP events with sign-ups, reminders, and role pings.",
  },
  {
    title: "Voice presence",
    description: "Capture voice attendance manually or schedule weekly snapshots.",
  },
  {
    title: "Emoji triggers",
    description: "Map emojis to multiple images and deliver a random response.",
  },
  {
    title: "Role reactions",
    description: "Let members self-assign roles using reaction messages.",
  },
  {
    title: "Auto role",
    description: "Assign a role automatically when someone joins your server.",
  },
  {
    title: "Admin console",
    description: "Review ConqBot and BotPanel logs in one secured view.",
  },
  {
    title: "Other tools",
    description: "Extra toggles like Warthog and other server utilities.",
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
    <div className="landing">
      <section className="hero">
        <div>
          <div className="hero-brand">
            <img src={logo} alt="ConqBot logo" />
            <span>ConqBot</span>
          </div>
          <p className="eyebrow">Discord control panel</p>
          <h1>Control every Discord server with a single, clean dashboard.</h1>
          <p className="muted">
            ConqBot Panel brings automation, welcome flows, and event planning into one modern
            workspace.
          </p>
          <div className="hero-actions">
            {heroCta}
            <Button
              variant="outline"
              onClick={handleInvite}
              disabled={inviteLoading}
            >
              {inviteLoading ? "Opening..." : "Add ConqBot to Discord"}
            </Button>
            <a className="btn btn-outline" href="#features">
              Explore features
            </a>
          </div>
          {inviteError ? <p className="muted">{inviteError}</p> : null}
        </div>
        <div className="hero-card">
          <div className="hero-preview">
            <div className="preview-bar">
              <span className="preview-brand">
                <img src={logo} alt="" />
                ConqBot
              </span>
              <span className="pill info">Online</span>
            </div>
            <div className="preview-row">
              <strong>3 servers online</strong>
              <span className="muted">All systems ready</span>
            </div>
            <div className="preview-row">
              <strong>Welcome flow</strong>
              <span className="muted">Embed preview active</span>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="feature-grid">
        {features.map((feature) => (
          <article key={feature.title} className="card">
            <h3>{feature.title}</h3>
            <p className="muted">{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="cta-banner">
        <div>
          <h2>Ready to tune your server?</h2>
          <p className="muted">Login and start customizing ConqBot in seconds.</p>
        </div>
        <div className="hero-actions">
          {heroCta}
          <Button
            variant="outline"
            onClick={handleInvite}
            disabled={inviteLoading}
          >
            {inviteLoading ? "Opening..." : "Add ConqBot"}
          </Button>
        </div>
      </section>
    </div>
  );
};
