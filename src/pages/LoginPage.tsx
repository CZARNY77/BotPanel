import { AUTH_URL } from "../api/client";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-900 px-6">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-10 text-center shadow-card">
        <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-accent-500 to-success-500" />
        <h1 className="text-3xl font-bold text-white">ConqBot Control Panel</h1>
        <p className="mt-2 text-slate-400">
          Zaloguj się przez Discord. Backend wystawi short-lived token (conqbot_token) + secure cookie; każda
          kolejna prośba do API będzie autoryzowana Bearer tokenem.
        </p>
        <div className="mt-6 flex justify-center">
          <a
            href={AUTH_URL}
            className="rounded-2xl bg-accent-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-accent-400"
          >
            Zaloguj przez Discord
          </a>
        </div>
      </div>
    </div>
  );
}
