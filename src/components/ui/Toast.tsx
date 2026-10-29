import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import { IconButton } from "./Button";

type ToastItem = { id: number; tone: "ok" | "err"; message: string };
type ToastApi = { success: (message: string) => void; error: (message: string) => void };

const ToastContext = createContext<ToastApi | null>(null);

let nextId = 1;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => setItems((prev) => prev.filter((item) => item.id !== id)), []);

  const push = useCallback(
    (tone: ToastItem["tone"], message: string) => {
      const id = nextId++;
      setItems((prev) => [...prev.slice(-3), { id, tone, message }]);
      window.setTimeout(() => dismiss(id), tone === "err" ? 7000 : 3500);
    },
    [dismiss]
  );

  const api = useMemo<ToastApi>(
    () => ({ success: (m) => push("ok", m), error: (m) => push("err", m) }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((item) => (
          <div key={item.id} className={`toast${item.tone === "err" ? " toast--err" : ""}`} role={item.tone === "err" ? "alert" : "status"}>
            <Icon name={item.tone === "err" ? "warning" : "check"} />
            <span className="grow">{item.message}</span>
            <IconButton icon="close" label="Dismiss" onClick={() => dismiss(item.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastApi => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

export const errorText = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;
