import { WButton, WCard } from "@wego/ui";
import { wegoAsset } from "../../lib/asset";

export function LoadingState() { return <div className="stack screen-padding" aria-live="polite"><div className="skeleton skeleton--hero" /><div className="skeleton skeleton--line" /><div className="skeleton skeleton--line" /></div>; }
export function ErrorState({ onRetry }: { onRetry: () => void }) { return <div className="screen-padding"><WCard tone="peach"><div className="w-serif" style={{ fontSize: 24 }}>Не получилось загрузить</div><p style={{ color: "var(--muted)" }}>Попробуйте ещё раз — Wego подождёт.</p><WButton size="md" onClick={onRetry}>Повторить</WButton></WCard></div>; }
export function EmptyStoryState({ onCheckIn }: { onCheckIn: () => void }) { return <div className="screen-padding"><WCard tone="paper" style={{ textAlign: "center", padding: 28 }}><img src={wegoAsset("a", "egg")} alt="" style={{ width: 120 }} /><div className="w-serif" style={{ fontSize: 26, marginTop: 12 }}>Пока пусто</div><p style={{ color: "var(--muted)", lineHeight: 1.45 }}>Первый Reveal сохранится сюда.</p><WButton onClick={onCheckIn}>Отметиться</WButton></WCard></div>; }

export function SyncNotice({ loading, error, onRetry }: { loading?: boolean; error?: string | null; onRetry?: () => void }) {
  if (!loading && !error) return null;
  return <div className={`sync-notice ${error ? "is-error" : ""}`} role={error ? "alert" : "status"}><span className="sync-notice__dot" aria-hidden="true" />{error ? <><span>{error}</span>{onRetry && <button type="button" onClick={onRetry}>Повторить</button>}</> : <span>Синхронизируем общую комнату…</span>}</div>;
}
