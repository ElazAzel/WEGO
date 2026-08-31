import type { HTMLAttributes, ReactNode } from "react";
import type { Tone } from "@wego/domain";

type CardTone = Tone | "cream";

export function WCard({ tone = "paper", children, className = "", ...props }: HTMLAttributes<HTMLDivElement> & { tone?: CardTone; children: ReactNode }) {
  return <div className={`w-card w-card--${tone} ${className}`.trim()} {...props}>{children}</div>;
}
