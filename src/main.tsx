import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { sendClientLog } from "./api/endpoints/auth";
import "../globals.css";

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
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
