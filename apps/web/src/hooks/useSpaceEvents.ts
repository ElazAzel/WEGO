import { useEffect } from "react";
export function useSpaceEvents(spaceId: string | null, onPartnerUpdate?: () => void): void {
  useEffect(() => {
    if (!spaceId || typeof EventSource === "undefined") return;
    let source: EventSource | null = null; let timer: number | undefined; let attempts = 0;
    const connect = () => { source = new EventSource(`/v1/spaces/${spaceId}/events`, { withCredentials: true }); source.onopen = () => { attempts = 0; }; source.onmessage = (event) => { const message = JSON.parse(event.data) as { type?: string }; if (["partner_joined", "checkin_submitted", "guess_saved", "day_changed"].includes(message.type ?? "")) onPartnerUpdate?.(); }; source.onerror = () => { source?.close(); timer = window.setTimeout(connect, Math.min(1000 * (2 ** attempts++), 30000)); }; };
    connect();
    return () => { if (timer) window.clearTimeout(timer); source?.close(); };
  }, [spaceId, onPartnerUpdate]);
}
