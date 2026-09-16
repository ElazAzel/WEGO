import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "lilac" | "mint";
type ButtonSize = "sm" | "md" | "lg" | "xl";

export interface WButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

export function WButton({ variant = "primary", size = "md", loading = false, disabled, children, className = "", type = "button", ...props }: WButtonProps) {
  return (
    <button
      type={type}
      className={`w-button w-button--${variant} w-button--${size} ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      {...props}
    >
      {loading ? "Загрузка…" : children}
    </button>
  );
}
