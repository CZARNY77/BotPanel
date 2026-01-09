import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getInviteUrl } from "../api/client";
import { Button } from "../components/Button";
import logo from "../assets/logo.png";

const highlights = [
  {
    title: "Welcome & Farewell flows",
    description: "Build friendly first impressions with optional embeds and smart toggles.",
  },
  {
    title: "Event creator",
    description: "Schedule Discord-style RSVPs with reminders, roles, and repeat cadence.",
  },
  {
    title: "Voice presence snapshots",
    description: "Capture voice attendance manually or automate weekly check-ins.",
  },
  {
    title: "Emoji triggers",
    description: "Map emojis to multiple images and send a random reply.",
  },
  {
    title: "Role reactions",
    description: "Let members self-assign roles using reaction messages.",
  },
  {
    title: "Auto role + utilities",
    description: "Instantly assign roles and manage extra bot toggles in one place.",
  },
];

const capabilityGroups = [
  {
    title: "Engage members",
    items: ["Greetings & farewells", "Emoji triggers", "Role reactions"],
  },
  {
    title: "Organize events",
    items: ["RSVP events", "Role pings", "Repeat schedules"],
  },
  {
    title: "Automate routines",
    items: ["Auto roles", "Voice presence", "Warthog controls"],
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
        <div className="hero-copy">
          <div className="hero-brand">
            <img src={logo} alt="ConqBot logo" />
            <span>ConqBot</span>
          </div>
          <p className="eyebrow">Discord control panel</p>
          <h1>Run your Discord servers with one focused command deck.</h1>
          <p className="muted">
            Automations, event planning, and member engagement tools, all in one consistent panel.
          </p>
          <div className="hero-actions">
            {heroCta}
            <Button variant="outline" onClick={handleInvite} disabled={inviteLoading}>
              {inviteLoading ? "Opening..." : "Add ConqBot to Discord"}
            </Button>
            <a className="btn btn-outline" href="#features">
              View features
            </a>
          </div>
          {inviteError ? <p className="muted">{inviteError}</p> : null}
        </div>
        <div className="hero-showcase">
          <div className="hero-card hero-card--panel">
            <div className="hero-card-header">
              <span className="pill info">Live panel</span>
              <span className="muted">Last sync 2m ago</span>
            </div>
            <div className="hero-module-list">
              {capabilityGroups.map((group) => (
                <div key={group.title} className="hero-module">
                  <strong>{group.title}</strong>
                  <span className="muted">{group.items.join(" · ")}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-card hero-card--stats">
            <h3>Quick glance</h3>
            <div className="hero-stat-grid">
              <div>
                <span className="muted">Servers</span>
                <strong>All connected</strong>
              </div>
              <div>
                <span className="muted">Event planner</span>
                <strong>Ready to publish</strong>
              </div>
              <div>
                <span className="muted">Automation</span>
                <strong>Auto role active</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="feature-grid">
        {highlights.map((feature) => (
          <article key={feature.title} className="feature-card">
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
