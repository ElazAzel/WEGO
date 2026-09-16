import { useRef, useState } from "react";
import { WButton, Icon } from "@wego/ui";
import { wegoAsset } from "../../lib/asset";
import { hapticError } from "../../lib/telegram";
import { useAppStore } from "../../store/use-app-store";
import { useUiStore } from "../../store/use-ui-store";
import { exportShareCard, shareBlob } from "./export-share-card";

export function ShareCardDialog({ storyId }: { storyId: string }) {
  const close = useUiStore((state) => state.closeShare);
  const entry = useAppStore((state) => state.story.find((item) => item.id === storyId));
  const space = useAppStore((state) => state.space);
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  if (!entry || !space) return null;
  const safeEntry = entry;
  async function exportCard() { if (!ref.current) return; setBusy(true); setMessage(""); try { const blob = await exportShareCard(ref.current); const result = await shareBlob(blob, `wego-${safeEntry.date}.png`); setMessage(result === "shared" ? "Карточка отправлена" : "Карточка скачана"); } catch { hapticError(); setMessage("Не удалось экспортировать карточку"); } finally { setBusy(false); } }
  const art = wegoAsset(space.style, space.stage);
  return <div className="share-backdrop" role="dialog" aria-modal="true" aria-label="Поделиться моментом"><div className="share-dialog"><div className="share-dialog__header"><div className="w-serif" style={{ fontSize: 26 }}>Поделиться</div><button type="button" className="w-icon-button" onClick={close} aria-label="Закрыть"><Icon name="close" /></button></div><div className="share-preview" ref={ref}><div className="share-preview__brand">WEGO</div><div className="share-preview__content"><img src={art} alt="" /><div className="w-serif">{safeEntry.title}</div><p>{safeEntry.body}</p></div><div className="share-preview__watermark">wego</div></div>{message && <p role="status" className="share-message">{message}</p>}<WButton size="xl" loading={busy} onClick={exportCard}>Скачать карточку</WButton></div></div>;
}
