import type { CSSProperties } from "react";

interface SceneHotspotProps {
  label: string;
  onClick: () => void;
  active?: boolean;
  locked?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function SceneHotspot({ label, onClick, active = false, locked = false, className = "", style }: SceneHotspotProps) {
  return <button
    type="button"
    className={`scene-hotspot ${active ? "is-active" : ""} ${locked ? "is-locked" : ""} ${className}`}
    aria-label={label}
    aria-disabled={locked || undefined}
    style={style}
    onClick={() => { if (!locked) onClick(); }}
  ><span aria-hidden="true">✦</span></button>;
}
