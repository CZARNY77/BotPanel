import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { getInviteUrl } from "../api/endpoints/servers";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { sections } from "../shell/sections";

const blurbs: Partial<Record<string, string>> = {
  greetings: "Welcome and farewell messages as text or embeds.",
  events: "Events with Yes / No / Maybe signups, repeats and pings.",
  "voice-snapshots": "Who is in voice, now or on a weekly schedule.",
  "emoji-triggers": "Post a random image when someone sends an emoji.",
  "role-reactions": "Members pick their own roles with reactions.",
  moderation: "Anti-spam, ban and timeout DMs, Warthog protection.",
};

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

  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-container">
          <h1>Run your Discord server from one panel.</h1>
          <p className="muted">
            Greetings, events with signups, voice snapshots, role tools and moderation for ConqBot.
          </p>
          <div className="hero-actions">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary">
                Open dashboard
              </Link>
            ) : (
              <Button variant="primary" onClick={login}>
                Login with Discord
              </Button>
            )}
            <Button icon="plus" onClick={() => void handleInvite()} loading={inviteLoading}>
              Add ConqBot
            </Button>
          </div>
          {inviteError ? <p className="muted">{inviteError}</p> : null}
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-container">
          <h2>What you can do</h2>
          <div className="feature-list">
            {sections
              .filter((section) => blurbs[section.key])
              .map((section) => (
                <article key={section.key} className="feature-item" style={{ "--hue": section.hue } as CSSProperties}>
                  <span className="page-head__tile">
                    <Icon name={section.icon} />
                  </span>
                  <div>
                    <h3>{section.label}</h3>
                    <p className="muted">{blurbs[section.key]}</p>
                  </div>
                </article>
              ))}
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <span>ConqBot Panel</span>
          <div className="footer-links">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms-of-service">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
