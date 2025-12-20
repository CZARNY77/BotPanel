import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";

const features = [
  {
    title: "Steruj serwerami z jednego miejsca",
    description:
      "Zarzadzaj konfiguracja bota, harmonogramami i rolami bez przeskakiwania po komendach.",
  },
  {
    title: "Przyjazny panel dla administratorow",
    description:
      "Czytelne ustawienia, szybkie zapisywanie zmian i historia ostatnich akcji.",
  },
  {
    title: "Dodaj bota jednym kliknieciem",
    description:
      "Zapraszaj ConqBot na nowe serwery bez przepinania kont czy dodatkowych formularzy.",
  },
];

const steps = [
  {
    title: "Zaloguj sie przez Discord",
    description: "Bezpieczne logowanie OAuth2 i autoryzacja konta.",
  },
  {
    title: "Wybierz serwer",
    description: "Panel pokazuje serwery, na ktorych masz uprawnienia administratora.",
  },
  {
    title: "Ustaw i zapisz",
    description: "Dopasuj zachowanie bota i zapisz zmiany od razu w czasie rzeczywistym.",
  },
];

export const Landing = () => {
  const { user, login } = useAuth();
  const heroCta = useMemo(() => {
    if (user) {
      return (
        <Link to="/dashboard" className="btn btn-primary">
          Przejdz do dashboardu
        </Link>
      );
    }

    return (
      <Button onClick={login}>
        Zaloguj przez Discord
      </Button>
    );
  }, [user, login]);

  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">Panel zarzadzania Discord</p>
          <h1>
            Stworz wlasne centrum dowodzenia dla ConqBot.
          </h1>
          <p className="hero-lead">
            Kontroluj ustawienia bota, zarzadzaj serwerami i wprowadzaj zmiany bezpiecznie,
            szybko i bezbolesnie. Wszystko w jednej, nowoczesnej przestrzeni.
          </p>
          <div className="hero-actions">
            {heroCta}
            <a className="btn btn-ghost" href="#features">
              Zobacz funkcje
            </a>
          </div>
          <div className="hero-meta">
            <div>
              <strong>1 klik</strong>
              <span>logowania</span>
            </div>
            <div>
              <strong>24/7</strong>
              <span>kontrola bota</span>
            </div>
            <div>
              <strong>Nowy</strong>
              <span>dashboard</span>
            </div>
          </div>
        </div>
        <div className="hero-card">
          <div className="hero-card-inner">
            <div className="panel-preview">
              <div className="panel-header">
                <span>ConqBot</span>
                <span className="pill">online</span>
              </div>
              <div className="panel-row">
                <div>
                  <h4>Serwery</h4>
                  <p>3 aktywne, 1 do zaproszenia</p>
                </div>
                <span className="metric">91%</span>
              </div>
              <div className="panel-row">
                <div>
                  <h4>Automatyzacje</h4>
                  <p>Eventy, role, powiadomienia</p>
                </div>
                <span className="metric">On</span>
              </div>
              <div className="panel-row">
                <div>
                  <h4>Ustawienia</h4>
                  <p>Zmiany zapisane 2 min temu</p>
                </div>
                <span className="metric">OK</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="feature-grid">
        {features.map((feature, index) => (
          <article
            key={feature.title}
            className="card reveal"
            style={{ animationDelay: `${index * 120}ms` }}
          >
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="steps">
        <div className="steps-header">
          <h2>Trzy kroki do pelnej kontroli</h2>
          <p>
            Panel prowadzi Cie za reke - logujesz sie, wybierasz serwer i od razu widzisz
            wszystkie ustawienia.
          </p>
        </div>
        <div className="steps-grid">
          {steps.map((step, index) => (
            <div key={step.title} className="step-card reveal" style={{ animationDelay: `${index * 140}ms` }}>
              <span className="step-index">0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-banner">
        <div>
          <h2>Gotowy na nowy panel?</h2>
          <p>Zaloguj sie i zobacz serwery, ktore mozesz skonfigurowac.</p>
        </div>
        {heroCta}
      </section>
    </div>
  );
};
