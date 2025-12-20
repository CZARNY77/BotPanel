import React from "react";

type ButtonVariant = "primary" | "ghost" | "outline";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button: React.FC<ButtonProps> = ({ variant = "primary", className, ...props }) => (
  <button className={`btn btn-${variant} ${className ?? ""}`.trim()} {...props} />
);
