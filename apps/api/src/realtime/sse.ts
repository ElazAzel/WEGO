export interface SpaceEvent {
  type: "partner_joined" | "checkin_submitted" | "guess_saved" | "story_saved" | "day_changed";
  spaceId: string;
  date?: string;
  version: number;
}

interface SseSink {
  write(chunk: string): void;
}

export class SpaceEventHub {
  private readonly clients = new Map<string, Set<SseSink>>();

  subscribe(spaceId: string, sink: SseSink): () => void {
    const clients = this.clients.get(spaceId) ?? new Set<SseSink>();
    clients.add(sink);
    this.clients.set(spaceId, clients);
    return () => {
      clients.delete(sink);
      if (clients.size === 0) this.clients.delete(spaceId);
    };
  }

  publish(event: SpaceEvent): void {
    const clients = this.clients.get(event.spaceId);
    if (!clients) return;
    const payload = `data: ${JSON.stringify(event)}\n\n`;
    for (const sink of clients) {
      try {
        sink.write(payload);
      } catch {
        clients.delete(sink);
      }
    }
    if (clients.size === 0) this.clients.delete(event.spaceId);
  }
}
