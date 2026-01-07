export const TermsOfService = () => (
  <div className="policy-page">
    <header className="policy-hero">
      <p className="eyebrow">Terms of Service</p>
      <h1>Rules for using ConqBot Panel</h1>
      <p className="muted">Last updated: 2026-01-07</p>
    </header>

    <section className="card">
      <h3>Acceptance</h3>
      <p className="muted">
        By accessing ConqBot Panel you agree to these terms. If you do not agree, do not use
        the service.
      </p>
    </section>

    <div className="policy-grid">
      <section className="card">
        <h3>Eligibility</h3>
        <ul className="policy-list">
          <li>You must follow Discord Terms of Service and Community Guidelines.</li>
          <li>You are responsible for permissions granted to the bot in your servers.</li>
        </ul>
      </section>
      <section className="card">
        <h3>Acceptable use</h3>
        <ul className="policy-list">
          <li>Do not abuse the bot, spam, or attempt to disrupt services.</li>
          <li>Do not store illegal or infringing content through the panel.</li>
          <li>Do not attempt to bypass access controls or security measures.</li>
        </ul>
      </section>
      <section className="card">
        <h3>Service availability</h3>
        <ul className="policy-list">
          <li>We aim for stability but do not guarantee uninterrupted service.</li>
          <li>We may update or modify features without prior notice.</li>
        </ul>
      </section>
      <section className="card">
        <h3>Termination</h3>
        <ul className="policy-list">
          <li>We may suspend access for violations or abuse.</li>
          <li>You can remove the bot to stop using the service at any time.</li>
        </ul>
      </section>
    </div>

    <section className="card">
      <h3>Liability</h3>
      <p className="muted">
        ConqBot Panel is provided as-is without warranties. We are not liable for damages
        resulting from the use of the service.
      </p>
    </section>

    <section className="card">
      <h3>Contact</h3>
      <p className="muted">
        Questions about these terms? Join our Discord support server:
        {" "}
        <a href="https://discord.com/invite/CCVJauxa2Y" target="_blank" rel="noreferrer">
          https://discord.com/invite/CCVJauxa2Y
        </a>
      </p>
    </section>
  </div>
);
