import { afterEach, describe, expect, it } from "vitest";
import { getJoinToken } from "./telegram";

describe("Telegram invite parameters", () => {
  afterEach(() => { delete window.Telegram; });

  it("extracts a real one-time join token", () => {
    window.Telegram = { WebApp: { initData: "", initDataUnsafe: { start_param: "join_invite-token" } } };
    expect(getJoinToken()).toBe("invite-token");
  });

  it("does not treat unrelated Telegram start parameters as invites", () => {
    window.Telegram = { WebApp: { initData: "", initDataUnsafe: { start_param: "campaign_spring" } } };
    expect(getJoinToken()).toBeNull();
  });
});
