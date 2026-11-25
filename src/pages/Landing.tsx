import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { getInviteUrl } from "../api/endpoints/servers";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/ui/Button";
import { Icon, type IconName } from "../components/ui/Icon";
import { sectionByKey, sections, type SectionKey } from "../shell/sections";

/** Bot features shown on the landing page, in the order of the sidebar. */
const features: { key: SectionKey; title: string; text: string }[] = [
  { key: "greetings", title: "Greetings", text: "Welcome new members and say goodbye, as plain text or an embed." },
  { key: "events", title: "Events with signups", text: "Members answer Yes / No / Maybe. Repeating events and role pings." },
  { key: "voice-snapshots", title: "Voice snapshots", text: "See who is in voice channels, right now or on a weekly schedule." },
  { key: "emoji-triggers", title: "Emoji triggers", text: "Someone sends an emoji, the bot answers with a random image." },
  { key: "role-reactions", title: "Role reactions", text: "Members pick their own roles by reacting to a message." },
  { key: "autorole", title: "Auto role", text: "Every new member gets a role as soon as they join." },
  { key: "moderation", title: "Moderation", text: "Anti-spam, ban, unban and timeout DMs, Warthog protection." },
];

const steps: { icon: IconName; title: string; text: string }[] = [
  { icon: "bot", title: "Add ConqBot", text: "Invite the bot to your Discord server." },
  { icon: "user", title: "Log in with Discord", text: "No account to create, no password here." },
  { icon: "globe", title: "Pick your server", text: "Every server you administer is listed." },
  { icon: "settings", title: "Switch on what you need", text: "Set up each feature and save." },
];

const faq: { q: string; a: string }[] = [
  {
    q: "Who can change the bot settings?",
    a: "The server owner and members with the Administrator permission on that Discord server.",
  },
  {
    q: "Do I need to add the bot first?",
    a: "Yes. Servers without ConqBot show up under “Bot not added”, with a button that opens the Discord invite.",
  },
  {
    q: "How do event signups work?",
    a: "The bot posts the event with Yes / No / Maybe buttons. You see who answered in the dashboard, and events can repeat and ping roles.",
  },
  {
    q: "What is a voice snapshot?",
    a: "A list of who is sitting in your voice channels at a given moment. Run one by hand or schedule it every week; past snapshots stay in History.",
  },
  {
    q: "Does the panel see my Discord password?",
    a: "No. You log in on Discord itself. The panel only gets your name, avatar and the list of servers you manage.",
  },
];

const botFeatureCount = features.length;
const dashboardSectionCount = sections.filter((section) => !section.adminOnly).length;

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

  const addBot = (
    <Button variant="primary" icon="plus" className="btn-lg" onClick={() => void handleInvite()} loading={inviteLoading}>
      Add ConqBot
    </Button>
  );

  const openDashboard = user ? (
    <Link to="/dashboard" className="btn btn-secondary btn-lg">
      <Icon name="overview" />
      Open dashboard
    </Link>
  ) : (
    <Button icon="overview" className="btn-lg" onClick={login}>
      Open dashboard
    </Button>
  );

  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-container landing-center">
          <h1>Your guild’s Discord, run by ConqBot</h1>
          <p className="landing-lead">Welcome messages, events with signups, voice attendance and role tools.</p>
          <p className="landing-sub">Built for Conqueror’s Blade Houses. Set everything up from one panel.</p>
          <div className="hero-actions">
            {addBot}
            {openDashboard}
          </div>
          {inviteError ? <p className="landing-error" role="alert">{inviteError}</p> : null}
          <div className="stat-row">
            <div className="stat-tile">
              <strong className="num">{botFeatureCount}</strong>
              <span>bot features</span>
            </div>
            <div className="stat-tile">
              <strong className="num">{dashboardSectionCount}</strong>
              <span>dashboard sections</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="features-title">
        <div className="landing-container">
          <header className="landing-head">
            <h2 id="features-title">Everything your server needs</h2>
            <p>One bot for the daily routine of a guild Discord.</p>
          </header>
          <div className="feature-grid">
            {features.map((feature) => {
              const section = sectionByKey.get(feature.key);
              return (
                <article key={feature.key} className="feature-card" style={{ "--hue": section?.hue } as CSSProperties}>
                  <span className="feature-card__icon">
                    <Icon name={section?.icon ?? "bot"} />
                  </span>
                  <div>
                    <h3>{feature.title}</h3>
                    <p>{feature.text}</p>
                  </div>
                </article>
              );
            })}
            <article className="feature-card">
              <span className="feature-card__icon">
                <Icon name="search" />
              </span>
              <div>
                <h3>One panel for all servers</h3>
                <p>Switch servers at the top, jump to any setting with Ctrl K.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="steps-title">
        <div className="landing-container">
          <header className="landing-head">
            <h2 id="steps-title">Get started in minutes</h2>
            <p>Four steps from invite to a working bot.</p>
          </header>
          <ol className="steps">
            {steps.map((step, index) => (
              <li key={step.title} className="step">
                <span className="step__num num">{index + 1}</span>
                <span className="step__icon">
                  <Icon name={step.icon} />
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="faq-title">
        <div className="landing-container landing-narrow">
          <header className="landing-head">
            <h2 id="faq-title">Frequently asked questions</h2>
          </header>
          <div className="faq">
            {faq.map((item) => (
              <details key={item.q} className="faq__item">
                <summary>
                  <span>{item.q}</span>
                  <Icon name="chevronDown" size="sm" />
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-cta">
        <div className="landing-container landing-center">
          <h2>Ready to set up your server?</h2>
          <div className="hero-actions">
            {addBot}
            {openDashboard}
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
