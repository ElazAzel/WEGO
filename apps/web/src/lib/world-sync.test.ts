import { describe, expect, it } from "vitest";
import { createWorldCommand } from "./world-sync";

describe("createWorldCommand", () => {
  it("keeps the command id and revision while removing spoofable actor fields", () => {
    const command = createWorldCommand({
      id: "local-lamp-1",
      type: "room_interact",
      actorId: "local-preview",
      objectId: "lamp",
      interaction: "toggle",
      at: "2026-08-31T10:00:00.000Z",
    }, 4);

    expect(command).toEqual({
      commandId: "local-lamp-1",
      expectedRevision: 4,
      action: { type: "room_interact", objectId: "lamp", interaction: "toggle", at: "2026-08-31T10:00:00.000Z" },
    });
  });
});
