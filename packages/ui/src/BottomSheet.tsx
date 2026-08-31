import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./Icon";

export function BottomSheet({ open, onClose, title, height = "92%", children }: { open: boolean; onClose: () => void; title: string; height?: string; children: ReactNode }) {
  const triggerRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement as HTMLElement;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); triggerRef.current?.focus(); };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="w-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section className="w-sheet" style={{ height }} role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div className="w-sheet__handle" aria-hidden="true" />
        <div className="w-sheet__header">
          <h2 id="sheet-title" className="w-serif">{title}</h2>
          <button ref={closeButtonRef} className="w-icon-button" type="button" onClick={onClose} aria-label="Закрыть"><Icon name="close" /></button>
        </div>
        <div className="w-sheet__body">{children}</div>
      </section>
    </div>
  );
}
