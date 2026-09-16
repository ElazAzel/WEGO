import { createInitialWorld, normalizeWorld, reduceWorld } from "@wego/domain";
import type { WorldAction, WorldActionResult, WorldSnapshot } from "@wego/domain";

export interface VersionedWorld {
  world: WorldSnapshot;
  revision: number;
}

export type WorldMutationResult = {
  status: "applied" | "replayed" | "conflict";
  record: VersionedWorld;
  result: WorldActionResult | null;
};

interface WorldCommand {
  commandId: string;
  expectedRevision: number;
  action: WorldAction;
}

export class InMemoryWorldState {
  private readonly records = new Map<string, VersionedWorld>();
  private readonly outcomes = new Map<string, WorldActionResult>();
  private readonly transforms = new Set<string>();

  constructor(private readonly createWorld: () => WorldSnapshot = () => createInitialWorld()) {}

  read(key: string): VersionedWorld {
    const existing = this.records.get(key);
    if (existing) return existing;
    const created = { world: this.createWorld(), revision: 0 };
    this.records.set(key, created);
    return created;
  }

  execute(key: string, command: WorldCommand): WorldMutationResult {
    const outcomeKey = `${key}:${command.commandId}`;
    const replayed = this.outcomes.get(outcomeKey);
    if (replayed) return { status: "replayed", record: this.read(key), result: replayed };

    const current = this.read(key);
    if (command.expectedRevision !== current.revision) return { status: "conflict", record: current, result: null };

    const result = reduceWorld(current.world, { ...command.action, id: command.commandId });
    const record = { world: normalizeWorld(result.snapshot), revision: current.revision + 1 };
    this.records.set(key, record);
    this.outcomes.set(outcomeKey, result);
    return { status: "applied", record, result };
  }

  transform(key: string, command: { commandId: string; expectedRevision: number; update: (world: WorldSnapshot) => WorldSnapshot }): WorldMutationResult {
    const outcomeKey = `${key}:${command.commandId}`;
    if (this.transforms.has(outcomeKey)) return { status: "replayed", record: this.read(key), result: null };

    const current = this.read(key);
    if (command.expectedRevision !== current.revision) return { status: "conflict", record: current, result: null };

    const record = { world: normalizeWorld(command.update(current.world)), revision: current.revision + 1 };
    this.records.set(key, record);
    this.transforms.add(outcomeKey);
    return { status: "applied", record, result: null };
  }

  replace(key: string, world: WorldSnapshot): VersionedWorld {
    const current = this.read(key);
    const record = { world: normalizeWorld(world), revision: current.revision + 1 };
    this.records.set(key, record);
    return record;
  }
}
