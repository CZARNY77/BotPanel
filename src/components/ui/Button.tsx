import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md";
  icon?: IconName;
  loading?: boolean;
};

export const Button = ({
  variant = "secondary",
  size = "md",
  icon,
  loading = false,
  className,
  type = "button",
  children,
  disabled,
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={`btn btn-${variant}${size === "sm" ? " btn-sm" : ""}${className ? ` ${className}` : ""}`}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    {...props}
  >
    {loading ? <span className="spinner" aria-hidden="true" /> : icon ? <Icon name={icon} size={size === "sm" ? "sm" : "md"} /> : null}
    {children}
  </button>
);

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  icon: IconName;
  label: string;
  variant?: Variant;
  size?: "sm" | "md";
  loading?: boolean;
};

/** Icon-only button; the word goes to title + aria-label. */
export const IconButton = ({
  icon,
  label,
  variant = "ghost",
  size = "sm",
  loading = false,
  className,
  type = "button",
  disabled,
  ...props
}: IconButtonProps) => (
  <button
    type={type}
    className={`btn btn-${variant} btn-icon${size === "sm" ? " btn-sm" : ""}${className ? ` ${className}` : ""}`}
    title={label}
    aria-label={label}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? <span className="spinner" aria-hidden="true" /> : <Icon name={icon} size={size === "sm" ? "sm" : "md"} />}
  </button>
);
