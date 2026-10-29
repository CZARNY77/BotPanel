import { useEffect, useRef, type ReactNode } from "react";
import { Button, IconButton } from "./Button";

export const Dialog = ({
  title,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={ref}
        className={`dialog${wide ? " dialog--wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="row row--between">
          <h2>{title}</h2>
          <IconButton icon="close" label="Close" onClick={onClose} />
        </div>
        {children}
        {footer ? <div className="dialog__foot">{footer}</div> : null}
      </div>
    </div>
  );
};

export const ConfirmDialog = ({
  title,
  message,
  confirmLabel,
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <Dialog
    title={title}
    onClose={onCancel}
    footer={
      <>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant={danger ? "danger" : "primary"} loading={busy} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </>
    }
  >
    <div className="muted">{message}</div>
  </Dialog>
);
