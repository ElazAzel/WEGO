import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

export function PageHeader({ eyebrow, title, description, action, backTo, backLabel = "Назад" }: { eyebrow: string; title: string; description?: string; action?: ReactNode; backTo?: string; backLabel?: string }) {
  const navigate = useNavigate();
  return <header className="page-header"><div className="page-header__top">{backTo ? <button type="button" className="page-header__back" onClick={() => navigate(backTo)}><span aria-hidden="true">←</span>{backLabel}</button> : <span className="page-header__section w-mono-caps">{eyebrow}</span>}{action && <div className="page-header__action">{action}</div>}</div><div className="page-header__copy">{backTo && <div className="page-header__eyebrow w-mono-caps">{eyebrow}</div>}<h1 className="w-serif">{title}</h1>{description && <p>{description}</p>}</div></header>;
}
