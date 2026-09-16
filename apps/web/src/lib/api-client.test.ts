import { describe, expect, it } from "vitest";
import { isHostedBuildMisconfigured } from "./api-client";

describe("hosted API configuration", () => {
  it("blocks a production demo when the API is not configured", () => {
    expect(isHostedBuildMisconfigured({ PROD: true, VITE_API_ENABLED: "false", VITE_API_URL: "" })).toBe(true);
  });

  it("allows a production build with an enabled API URL", () => {
    expect(isHostedBuildMisconfigured({ PROD: true, VITE_API_ENABLED: "true", VITE_API_URL: "https://api.example.com/v1" })).toBe(false);
  });

  it("keeps local development available without a backend", () => {
    expect(isHostedBuildMisconfigured({ PROD: false, VITE_API_ENABLED: "false", VITE_API_URL: "" })).toBe(false);
  });
});
