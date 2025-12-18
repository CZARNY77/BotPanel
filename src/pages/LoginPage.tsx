import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { buildAuthUrl, loginWithCode } from "../api/client";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectUri = useMemo(() => {
    if (typeof window === "undefined") return "/login";
    return `${window.location.origin}/login`;
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    if (!code) return;
    setLoading(true);
    setStatus("Logowanie przez Discord...");
    loginWithCode(code, redirectUri)
      .then((res) => {
        localStorage.setItem("conqbot_token", res.token.access_token);
        navigate("/panel/dashboard", { replace: true });
      })
      .catch((err) => {
        const message = (err as { status?: number; message?: string }).message;
        setStatus(message || "Nie udało się zalogować.");
      })
      .finally(() => setLoading(false));
  }, [location.search, navigate, redirectUri]);

  const authUrl = buildAuthUrl();

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-900 px-6">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-10 text-center shadow-card">
        <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-accent-500 to-success-500" />
        <h1 className="text-3xl font-bold text-white">ConqBot Control Panel</h1>
        <p className="mt-2 text-slate-400">
          Zaloguj się przez Discord. Backend wystawi short-lived token (conqbot_token) + secure cookie; każda
          kolejna prośba do API będzie autoryzowana Bearer tokenem.
        </p>
        {status && (
          <p className="mt-3 text-sm text-slate-300">
            {status}
          </p>
        )}
        <div className="mt-6 flex justify-center">
          <a
            href={authUrl}
            className="rounded-2xl bg-accent-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-accent-400"
            aria-disabled={loading}
          >
            {loading ? "Przetwarzanie..." : "Zaloguj przez Discord"}
          </a>
        </div>
      </div>
    </div>
  );
}
