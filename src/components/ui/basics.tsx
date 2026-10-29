// Small presentational pieces used on every page.
import type { CSSProperties, ReactNode } from "react";
import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";

export const Toggle = ({
  checked,
  onChange,
  label,
  hideLabel = false,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hideLabel?: boolean;
  disabled?: boolean;
}) => (
  <label className="toggle" title={hideLabel ? label : undefined}>
    <input
      type="checkbox"
      role="switch"
      checked={checked}
      disabled={disabled}
      aria-label={label}
      onChange={(event) => onChange(event.target.checked)}
    />
    <span className="toggle__track" aria-hidden="true" />
    {hideLabel ? null : <span>{label}</span>}
  </label>
);

export type Tone = "ok" | "warn" | "err" | "primary" | "neutral";

export const Pill = ({ tone = "neutral", children, title }: { tone?: Tone; children: ReactNode; title?: string }) => (
  <span className={`pill${tone === "neutral" ? "" : ` pill--${tone}`}`} title={title}>
    {children}
  </span>
);

/** Status as a dot + short word (word kept for screen readers and clarity). */
export const StatusPill = ({ on, onLabel = "On", offLabel = "Off" }: { on: boolean; onLabel?: string; offLabel?: string }) => (
  <Pill tone={on ? "ok" : "neutral"}>
    <span className="dot" aria-hidden="true" />
    {on ? onLabel : offLabel}
  </Pill>
);

export const PageHeader = ({
  icon,
  hue,
  title,
  subtitle,
  actions,
}: {
  icon: IconName;
  hue: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) => (
  <header className="page-head" style={{ "--hue": hue } as CSSProperties}>
    <div className="page-head__tile">
      <Icon name={icon} size="lg" />
    </div>
    <div className="page-head__text">
      <h1>{title}</h1>
      {subtitle ? <p className="page-head__sub">{subtitle}</p> : null}
    </div>
    {actions ? <div className="page-head__actions">{actions}</div> : null}
  </header>
);

export const Group = ({
  title,
  icon,
  description,
  actions,
  children,
  id,
}: {
  title: ReactNode;
  icon?: IconName;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  id?: string;
}) => (
  <section className="group" id={id}>
    <div className="group__head">
      <h2 className="group__title">
        {icon ? <Icon name={icon} /> : null}
        {title}
      </h2>
      {actions ? <div className="group__actions">{actions}</div> : null}
      {description ? <p className="group__desc">{description}</p> : null}
    </div>
    {children}
  </section>
);

export const Tabs = <T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: { key: T; label: string; icon?: IconName; count?: number }[];
  value: T;
  onChange: (key: T) => void;
  label: string;
}) => (
  <div className="tabs" role="tablist" aria-label={label}>
    {tabs.map((tab) => (
      <button
        key={tab.key}
        type="button"
        role="tab"
        className="tab"
        aria-selected={tab.key === value}
        onClick={() => onChange(tab.key)}
      >
        {tab.icon ? <Icon name={tab.icon} size="sm" /> : null}
        {tab.label}
        {tab.count !== undefined ? <span className="tab__count num">{tab.count}</span> : null}
      </button>
    ))}
  </div>
);

export const EmptyState = ({
  icon = "info",
  title,
  children,
  action,
  center = false,
}: {
  icon?: IconName;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  center?: boolean;
}) => (
  <div className={`empty${center ? " empty--center" : ""}`}>
    <span className="empty__icon">
      <Icon name={icon} size="lg" />
    </span>
    <strong>{title}</strong>
    {children ? <p className="muted prose">{children}</p> : null}
    {action}
  </div>
);

export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="notice notice--err" role="alert">
    <Icon name="warning" />
    <div className="grow">
      <strong>Could not load this section.</strong>
      <p>{message}</p>
    </div>
    {onRetry ? (
      <Button size="sm" icon="refresh" onClick={onRetry}>
        Retry
      </Button>
    ) : null}
  </div>
);

export const Skeleton = ({ height = 16, width = "100%" }: { height?: number; width?: number | string }) => (
  <div className="skeleton" style={{ height, width }} aria-hidden="true" />
);

/** Page-shaped loading placeholder (no half-screen spinner). */
export const PageSkeleton = ({ rows = 4 }: { rows?: number }) => (
  <div className="stack stack--lg" aria-busy="true" aria-label="Loading">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="stack">
        <Skeleton height={18} width="30%" />
        <Skeleton height={38} />
      </div>
    ))}
  </div>
);

export const LoadingScreen = ({ label = "Loading…" }: { label?: string }) => (
  <div className="loading-screen">
    <div className="stack" style={{ alignItems: "center" }}>
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  </div>
);
