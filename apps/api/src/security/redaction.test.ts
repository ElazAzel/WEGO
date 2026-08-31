import { describe, expect, it } from "vitest";
import { redactSensitive } from "./redaction";

describe("log redaction", () => {
  it("removes initData, invite tokens and notes", () => {
    expect(redactSensitive({ initData: "secret", note: "private", inviteToken: "token", ok: true })).toEqual({ initData: "[REDACTED]", note: "[REDACTED]", inviteToken: "[REDACTED]", ok: true });
  });
});
