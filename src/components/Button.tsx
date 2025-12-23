import React from "react";

type ButtonVariant = "primary" | "ghost" | "outline";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  className,
  type = "button",
  ...props
}) => <button className={`btn btn-${variant} ${className ?? ""}`.trim()} type={type} {...props} />;
