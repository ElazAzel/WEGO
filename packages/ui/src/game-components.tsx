import type { ReactNode } from "react";

export function SparkBalance({ balance }: { balance: number }) {
  return <div className="spark-balance" aria-label={`${balance} Искр`}><span aria-hidden="true">✦</span><strong>{balance}</strong><small>Искры</small></div>;
}

export function NeedMeter({ label, value }: { label: string; value: number }) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));
  return <div className="need-meter"><span aria-hidden="true">✦</span><div><small>{label}</small><div className="need-meter__track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeValue}><i style={{ width: `${safeValue}%` }} /></div></div></div>;
}

export function UnlockBadge({ unlocked, children }: { unlocked: boolean; children: ReactNode }) {
  return <span className="unlock-badge" data-state={unlocked ? "unlocked" : "locked"}>{children}</span>;
}

