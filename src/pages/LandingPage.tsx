import { AUTH_URL } from "../api/client";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-900 via-black to-surface-800 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-white/5 p-8 shadow-card lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35rem] text-accent-300">ConqBot</p>
            <h1 className="text-4xl font-bold text-white">Cyber Command for Discord Servers</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              ConqBot to panel dowodzenia w estetyce Cyber-Military. Automatyzuje powitania, eventy,
              emoji-triggery i moderację, zasilany przez backend ConqBot i Discord OAuth2.
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href={AUTH_URL}
              className="rounded-2xl bg-accent-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-accent-400"
            >
              Zaloguj przez Discord
            </a>
            <a
              href="/panel/dashboard"
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-accent-400/50"
            >
              Przejdź do panelu
            </a>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Welcome Messages",
              desc: "Edytor powitań z podglądem Discord i AI presetami.",
              pill: "Live preview"
            },
            {
              title: "Event Creator",
              desc: "Planowanie wydarzeń z cyklicznością, kanałami i pingami ról.",
              pill: "API-backed"
            },
            {
              title: "Emoji Triggers",
              desc: "Mapowanie emoji na GIF/IMG z szybką moderacją triggerów.",
              pill: "Mock until endpoint"
            },
            {
              title: "Moderation",
              desc: "Toggle dla Anti-Link, Anti-Caps, Profanity i Raid Mode.",
              pill: "Discord roles"
            },
            {
              title: "Overview",
              desc: "Statystyki ról, emoji i aktywności pobierane z ConqBot API.",
              pill: "Live + mocks"
            },
            {
              title: "Theming",
              desc: "Midnight (Tech-Ops) i Warlord (Gritty) – glassmorphism ready.",
              pill: "Theme switch"
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
            Logowanie odbywa się przez Discord. Backend wystawi krótko-żyjący token oraz secure cookie,
            a frontend dołącza Bearer token do każdego zapytania pod {""}
            <code className="rounded bg-black/40 px-2 py-1 text-xs">https://conqbot.blcdev.com/api</code>.
            Uprawnienia do guild są weryfikowane w backendzie – klient nie przechowuje ról ani sekretów.
          </p>
          <div className="mt-4 flex gap-3">
            <a
              href={AUTH_URL}
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
