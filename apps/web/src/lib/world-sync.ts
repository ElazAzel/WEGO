import type { WorldAction, WorldSnapshot } from "@wego/domain";

export interface WorldCommandPayload {
  commandId: string;
  expectedRevision: number;
  action: Omit<WorldAction, "id" | "actorId">;
}

export interface WorldCommandResponse {
  world: WorldSnapshot;
  revision: number;
  replayed: boolean;
}

export function createWorldCommand(action: WorldAction, expectedRevision: number): WorldCommandPayload {
  const { id: commandId, actorId: _actorId, ...safeAction } = action;
  return { commandId, expectedRevision, action: safeAction };
}
