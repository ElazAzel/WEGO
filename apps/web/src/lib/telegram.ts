export interface TelegramUser { id: number; first_name: string; last_name?: string; username?: string; language_code?: string; }

interface TelegramWebApp {
  initData: string;
  ready?: () => void;
  expand?: () => void;
  disableVerticalSwipes?: () => void;
  HapticFeedback?: { impactOccurred?: (style: "light" | "medium" | "heavy") => void; notificationOccurred?: (type: "error" | "success" | "warning") => void };
  openTelegramLink?: (url: string) => void;
  openInvoice?: (url: string, callback?: (status: "paid" | "cancelled" | "failed" | "pending") => void) => void;
  requestWriteAccess?: (callback: (granted: boolean) => void) => void;
  BackButton?: { show?: () => void; hide?: () => void; onClick?: (callback: () => void) => void; offClick?: (callback: () => void) => void };
  themeParams?: Record<string, string>;
  initDataUnsafe?: { user?: TelegramUser; start_param?: string };
}

declare global { interface Window { Telegram?: { WebApp?: TelegramWebApp } } }

export function getTelegramContext() {
  const webApp = window.Telegram?.WebApp;
  return { initData: webApp?.initData ?? "", user: webApp?.initDataUnsafe?.user ?? null, isTelegram: Boolean(webApp) };
}

export function isTelegram(): boolean { return Boolean(window.Telegram?.WebApp); }
export function getStartParam(): string { return window.Telegram?.WebApp?.initDataUnsafe?.start_param ?? ""; }

export function initializeTelegram(): void {
  const webApp = window.Telegram?.WebApp;
  webApp?.ready?.();
  webApp?.expand?.();
  webApp?.disableVerticalSwipes?.();
  for (const [key, value] of Object.entries(webApp?.themeParams ?? {})) document.documentElement.style.setProperty(`--tg-${key.replace(/_/g, "-")}`, value);
}

export function haptic(style: "light" | "medium" | "heavy" = "light"): void { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(style); }
export function hapticError(): void { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.("error"); }

export function openTelegramShare(url: string, text: string): void {
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  if (window.Telegram?.WebApp?.openTelegramLink) window.Telegram.WebApp.openTelegramLink(shareUrl);
  else window.open(shareUrl, "_blank", "noopener,noreferrer");
}

export function requestTelegramWriteAccess(): Promise<boolean> {
  const request = window.Telegram?.WebApp?.requestWriteAccess;
  if (!request) return Promise.resolve(false);
  return new Promise((resolve) => request(resolve));
}

export async function openTelegramInvoice(itemId: string, stars: number, recipientUserId?: string): Promise<boolean> {
  const webApp = window.Telegram?.WebApp;
  if (!webApp?.openInvoice) return false;
  const { apiFetch } = await import("./api-client");
  const invoice = await apiFetch<{ invoiceUrl: string }>("/billing/invoices", { method: "POST", body: JSON.stringify({ itemId, recipientUserId, stars }) });
  return new Promise((resolve) => webApp.openInvoice?.(invoice.invoiceUrl, (status) => resolve(status === "paid")));
}
