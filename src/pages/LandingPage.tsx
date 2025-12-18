import { buildAuthUrl } from "../api/client";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-900 via-black to-surface-800 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-white/5 p-8 shadow-card lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35rem] text-accent-300">ConqBot</p>
            <h1 className="text-4xl font-bold text-white">Panel dowodzenia botem</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              Steruj automatyzacjami ConqBot: powitania, eventy, emoji-triggery, moderacja i monitoring
              aktywności. Wszystko spięte z backendem i Discord OAuth2, bez kopiowania tokenów.
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href={buildAuthUrl()}
              className="rounded-2xl bg-accent-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-accent-400"
            >
              Zaloguj przez Discord
            </a>
            <a
              href="/panel/dashboard"
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-accent-400/50"
            >
              Otwórz panel
            </a>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Powitania",
              desc: "Ustaw kanał, rolę i layout powitań dla nowych członków.",
              pill: "GET/POST /welcome"
            },
            {
              title: "Eventy / TW",
              desc: "Twórz i loguj eventy – zapis trafia do /activity/summary.",
              pill: "POST /events"
            },
            {
              title: "Emoji",
              desc: "Pobierz emoji z gildii i przypisz reakcyjne GIF-y.",
              pill: "GET /emojis"
            },
            {
              title: "Moderacja",
              desc: "Włącz/wyłącz moduły Anti-Link, Anti-Caps, Raid Mode.",
              pill: "GET/POST /moderation"
            },
            {
              title: "Lista serwerów",
              desc: "Panel pokazuje tylko gildie, w których masz admina i gdzie jest bot.",
              pill: "GET /guilds"
            },
            {
              title: "Bezpieczeństwo",
              desc: "Bearer + HTTP-only cookie, weryfikacja ról po stronie backendu.",
              pill: "Token + CORS"
            }
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-white/5 bg-white/5 p-4 shadow-inner"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-slate-400">{card.title}</p>
                <span className="rounded-full bg-accent-500/20 px-3 py-1 text-[11px] text-accent-100">
                  {card.pill}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-200">{card.desc}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/5 bg-white/5 p-8 shadow-card">
          <p className="text-xs uppercase tracking-[0.3rem] text-slate-400">Autoryzacja</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Discord OAuth2 + ConqBot</h2>
          <p className="mt-2 max-w-3xl text-slate-300">
            Logowanie odbywa się przez Discord. Backend wystawia krótko-żyjący token oraz secure cookie,
            a frontend dołącza Bearer do zapytań pod {""}
            <code className="rounded bg-black/40 px-2 py-1 text-xs">https://conqbot.blcdev.com/api/panel</code>.
            Uprawnienia do guild są sprawdzane na backendzie – klient nie przechowuje ról ani sekretów.
          </p>
          <div className="mt-4 flex gap-3">
            <a
              href={buildAuthUrl()}
              className="rounded-2xl bg-accent-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-accent-400"
            >
              Zaloguj i nadaj uprawnienia
            </a>
            <div className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200">
              Spec backend: zobacz `docs/backend-temp-spec.md` w repo.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
