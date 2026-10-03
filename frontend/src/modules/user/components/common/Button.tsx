import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "./Icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "outline" | "soft" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  icon?: string;
  loading?: boolean;
  children: ReactNode;
}

const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-primary hover:bg-primary-container text-on-primary",
  accent: "bg-secondary hover:bg-on-secondary-container text-on-secondary",
  outline: "border border-primary text-primary hover:bg-surface-container bg-transparent",
  soft: "border border-outline-variant text-on-surface-variant hover:bg-surface-container bg-transparent",
  danger: "border border-error/50 text-error hover:bg-red-50 bg-transparent",
  success: "bg-green-700 hover:bg-green-800 text-white"
};

const SIZES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-label-sm",
  md: "px-4 py-2 text-label-md",
  lg: "px-6 py-3 text-label-md"
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonProps): JSX.Element {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded font-bold transition-all active:scale-95 ${VARIANTS[variant]} ${SIZES[size]} ${
        disabled || loading ? "opacity-60 cursor-not-allowed pointer-events-none" : ""
      } ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Icon name="hourglass_top" className="text-[18px]" /> : icon ? <Icon name={icon} className="text-[18px]" /> : null}
      <span>{children}</span>
    </button>
  );
}
