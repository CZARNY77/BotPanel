import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";
import logo from "../assets/logo.png";

const features = [
  {
    title: "Command center for every server",
    description: "Manage bot settings, automations, and welcome flows without typing commands.",
  },
  {
    title: "Discord-native experience",
    description: "A layout inspired by Discord so admins feel instantly at home.",
  },
  {
    title: "Fast setup, no clutter",
    description: "Add ConqBot to new servers and configure it in minutes.",
  },
];

export const Landing = () => {
  const { user, login } = useAuth();
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
            <a className="btn btn-outline" href="#features">
              Explore features
            </a>
          </div>
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
        {heroCta}
      </section>
    </div>
  );
};
