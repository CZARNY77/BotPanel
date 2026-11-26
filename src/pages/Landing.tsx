import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { getInviteUrl } from "../api/endpoints/servers";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/ui/Button";
import { Icon, type IconName } from "../components/ui/Icon";
import { sectionByKey, sections, type SectionKey } from "../shell/sections";
import { useT, type MessageKey } from "../i18n";

/** Bot features shown on the landing page, in the order of the sidebar. */
const features: SectionKey[] = ["greetings", "events", "voice-snapshots", "emoji-triggers", "role-reactions", "autorole", "moderation"];

/** Steps of "Get started"; texts are `landing.s.<icon>.title/text`. */
const steps: IconName[] = ["bot", "user", "globe", "settings"];

const faq = [1, 2, 3, 4, 5] as const;

const botFeatureCount = features.length;
const dashboardSectionCount = sections.filter((section) => !section.adminOnly).length;

export const Landing = () => {
  const { t } = useT();
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
        setInviteError(t("landing.inviteUnavailable"));
      }
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : t("error.invite"));
    } finally {
      setInviteLoading(false);
    }
  };

  const addBot = (
    <Button variant="primary" icon="plus" className="btn-lg" onClick={() => void handleInvite()} loading={inviteLoading}>
      {t("landing.addBot")}
    </Button>
  );

  const openDashboard = user ? (
    <Link to="/dashboard" className="btn btn-secondary btn-lg">
      <Icon name="overview" />
      {t("landing.openDashboard")}
    </Link>
  ) : (
    <Button icon="overview" className="btn-lg" onClick={login}>
      {t("landing.openDashboard")}
    </Button>
  );

  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-container landing-center">
          <h1>{t("landing.h1")}</h1>
          <p className="landing-lead">{t("landing.lead")}</p>
          <p className="landing-sub">{t("landing.sub")}</p>
          <div className="hero-actions">
            {addBot}
            {openDashboard}
          </div>
          {inviteError ? <p className="landing-error" role="alert">{inviteError}</p> : null}
          <div className="stat-row">
            <div className="stat-tile">
              <strong className="num">{botFeatureCount}</strong>
              <span>{t("landing.statFeatures")}</span>
            </div>
            <div className="stat-tile">
              <strong className="num">{dashboardSectionCount}</strong>
              <span>{t("landing.statSections")}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="features-title">
        <div className="landing-container">
          <header className="landing-head">
            <h2 id="features-title">{t("landing.featuresTitle")}</h2>
            <p>{t("landing.featuresLead")}</p>
          </header>
          <div className="feature-grid">
            {features.map((key) => {
              const section = sectionByKey.get(key);
              return (
                <article key={key} className="feature-card" style={{ "--hue": section?.hue } as CSSProperties}>
                  <span className="feature-card__icon">
                    <Icon name={section?.icon ?? "bot"} />
                  </span>
                  <div>
                    <h3>{t(`landing.f.${key}.title` as MessageKey)}</h3>
                    <p>{t(`landing.f.${key}.text` as MessageKey)}</p>
                  </div>
                </article>
              );
            })}
            <article className="feature-card">
              <span className="feature-card__icon">
                <Icon name="search" />
              </span>
              <div>
                <h3>{t("landing.allServers")}</h3>
                <p>{t("landing.allServersText")}</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="steps-title">
        <div className="landing-container">
          <header className="landing-head">
            <h2 id="steps-title">{t("landing.stepsTitle")}</h2>
            <p>{t("landing.stepsLead")}</p>
          </header>
          <ol className="steps">
            {steps.map((step, index) => (
              <li key={step} className="step">
                <span className="step__num num">{index + 1}</span>
                <span className="step__icon">
                  <Icon name={step} />
                </span>
                <h3>{t(`landing.s.${step}.title` as MessageKey)}</h3>
                <p>{t(`landing.s.${step}.text` as MessageKey)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="faq-title">
        <div className="landing-container landing-narrow">
          <header className="landing-head">
            <h2 id="faq-title">{t("landing.faqTitle")}</h2>
          </header>
          <div className="faq">
            {faq.map((n) => (
              <details key={n} className="faq__item">
                <summary>
                  <span>{t(`landing.q${n}`)}</span>
                  <Icon name="chevronDown" size="sm" />
                </summary>
                <p>{t(`landing.a${n}`)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-cta">
        <div className="landing-container landing-center">
          <h2>{t("landing.ctaTitle")}</h2>
          <div className="hero-actions">
            {addBot}
            {openDashboard}
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <span>{t("brand.panel")}</span>
          <div className="footer-links">
            <Link to="/privacy-policy">{t("legal.privacy")}</Link>
            <Link to="/terms-of-service">{t("legal.terms")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
