import type { CSSProperties } from "react";
import type { Tone } from "@wego/domain";

export function WAvatar({ name, tone = "coral", size = 40, alt, className = "" }: { name: string; tone?: Tone; size?: number; alt?: string; className?: string }) {
  const style: CSSProperties = { width: size, height: size, fontSize: size * 0.4 };
  return <div className={`w-avatar w-avatar--${tone} ${className}`.trim()} style={style} role="img" aria-label={alt ?? name}>{name.trim().charAt(0).toUpperCase()}</div>;
}
