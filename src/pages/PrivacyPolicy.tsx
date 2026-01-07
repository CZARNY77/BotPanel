export const PrivacyPolicy = () => (
  <div className="policy-page">
    <header className="policy-hero">
      <p className="eyebrow">Privacy Policy</p>
      <h1>How ConqBot Panel handles data</h1>
      <p className="muted">Last updated: 2026-01-07</p>
    </header>

    <section className="card">
      <h3>Summary</h3>
      <p className="muted">
        ConqBot Panel only collects the data needed to run the dashboard and Discord bot
        features. We do not sell your data. You control which servers are connected and what
        settings are stored.
      </p>
    </section>

    <div className="policy-grid">
      <section className="card">
        <h3>Data we collect</h3>
        <ul className="policy-list">
          <li>Discord user ID, username, and avatar for login and display.</li>
          <li>Server IDs, names, and permissions to show the servers you can manage.</li>
          <li>Settings you configure in the panel (welcome, events, roles, triggers).</li>
          <li>Event signups and message IDs to update Discord embeds.</li>
          <li>Uploaded images and image links you provide for emoji triggers.</li>
          <li>Operational logs (errors and audit entries) for reliability and security.</li>
        </ul>
      </section>
      <section className="card">
        <h3>How we use it</h3>
        <ul className="policy-list">
          <li>Authenticate your Discord session and show the right servers.</li>
          <li>Store and apply your configuration changes to the bot.</li>
          <li>Deliver events, pings, and automated messages in Discord.</li>
          <li>Improve stability and debug issues using logs.</li>
        </ul>
      </section>
      <section className="card">
        <h3>Storage and retention</h3>
        <ul className="policy-list">
          <li>Data is stored in our databases while your server uses ConqBot.</li>
          <li>Logs are kept only as long as needed for diagnostics.</li>
          <li>Removing the bot from a server stops new data collection for that server.</li>
        </ul>
      </section>
      <section className="card">
        <h3>Sharing</h3>
        <ul className="policy-list">
          <li>We do not sell or rent data.</li>
          <li>We only share data when required to operate Discord integrations.</li>
        </ul>
      </section>
    </div>

    <section className="card">
      <h3>Your choices</h3>
      <ul className="policy-list">
        <li>Disconnect servers at any time to stop syncing settings.</li>
        <li>Request data removal through the support server.</li>
        <li>Review and change stored settings directly in the dashboard.</li>
      </ul>
    </section>

    <section className="card">
      <h3>Contact</h3>
      <p className="muted">
        Questions about privacy? Join our Discord support server:
        {" "}
        <a href="https://discord.com/invite/CCVJauxa2Y" target="_blank" rel="noreferrer">
          https://discord.com/invite/CCVJauxa2Y
        </a>
      </p>
    </section>
  </div>
);
