import { useEffect, useRef } from "react";

/** Ctrl/Cmd + key. Fires even inside inputs (used for Ctrl+K). */
export const useHotkey = (key: string, handler: () => void) => {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === key.toLowerCase()) {
        event.preventDefault();
        ref.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [key]);
};
