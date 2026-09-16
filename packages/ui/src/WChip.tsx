import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Tone } from "@wego/domain";

export interface WChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  tone?: Tone | "default";
  children: ReactNode;
}

export function WChip({ active = false, tone = "paper", children, className = "", ...props }: WChipProps) {
  return (
    <button
      type="button"
      className={`w-chip w-chip--${tone} ${active ? "is-active" : ""} ${className}`.trim()}
      aria-pressed={active}
      {...props}
    >
      {children}
    </button>
  );
}
