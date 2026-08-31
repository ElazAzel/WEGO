import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <header className="page-header"><div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}><div><div className="w-mono-caps">{eyebrow}</div><h1 className="w-serif">{title}</h1>{description && <p>{description}</p>}</div>{action}</div></header>;
}
