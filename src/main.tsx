import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { sendClientLog } from "./api/endpoints/auth";
import { ToastProvider } from "./components/ui/Toast";
import { LangProvider } from "./i18n";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/forms.css";
import "./styles/layout.css";
import "./styles/overlays.css";
import "./styles/rail.css";
import "./styles/shell.css";
import "./styles/admin.css";
import "./styles/features.css";
import "./styles/sections.css";
import "./styles/public.css";
import "./styles/landing.css";

const reportClientError = (message: string, context?: Record<string, unknown>) => {
  sendClientLog("ERROR", message, context).catch(() => undefined);
};

window.addEventListener("error", (event) => {
  reportClientError(event.message, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
  });
});

window.addEventListener("unhandledrejection", (event) => {
  const reason =
    typeof event.reason === "string"
      ? event.reason
      : event.reason instanceof Error
      ? event.reason.message
      : "Unhandled promise rejection";
  reportClientError(reason, {
    stack: event.reason instanceof Error ? event.reason.stack : undefined,
  });
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LangProvider>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </LangProvider>
  </React.StrictMode>
);
