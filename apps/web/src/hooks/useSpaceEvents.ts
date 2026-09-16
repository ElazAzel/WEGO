import { useEffect } from "react";
import { apiUrl, isApiEnabled } from "../lib/api-client";

const refreshEvents = new Set(["partner_joined", "checkin_submitted", "guess_saved", "story_saved", "day_changed", "world_changed"]);

export function spaceEventNeedsRefresh(type: string | undefined): boolean {
  return typeof type === "string" && refreshEvents.has(type);
}

export function useSpaceEvents(spaceId: string | null, onSpaceUpdate?: () => void): void {
  useEffect(() => {
    if (!spaceId || !isApiEnabled() || typeof EventSource === "undefined") return;
    let source: EventSource | null = null;
    let timer: number | undefined;
    let attempts = 0;
    let lastCursor = "0";

    const connect = () => {
      source = new EventSource(apiUrl(`/spaces/${spaceId}/events?cursor=${encodeURIComponent(lastCursor)}`), { withCredentials: true });
      source.onopen = () => { attempts = 0; };
      source.onmessage = (event) => {
        try {
          if (event.lastEventId) lastCursor = event.lastEventId;
          const message = JSON.parse(event.data) as { type?: string };
          if (spaceEventNeedsRefresh(message.type)) onSpaceUpdate?.();
        } catch {
          // Ignore malformed or proxy heartbeat events.
        }
      };
      source.onerror = () => {
        source?.close();
        timer = window.setTimeout(connect, Math.min(1000 * (2 ** attempts++), 30000));
      };
    };

    connect();
    return () => {
      if (timer) window.clearTimeout(timer);
      source?.close();
    };
  }, [spaceId, onSpaceUpdate]);
}
