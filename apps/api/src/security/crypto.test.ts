import { describe, expect, it } from "vitest";
import { decryptNote, encryptNote } from "./crypto";

describe("private note encryption", () => {
  it("round-trips with a random IV and hides the plaintext", () => {
    const key = Buffer.alloc(32, 7).toString("base64");
    const encrypted = encryptNote("Сегодня просто рядом", key);
    expect(encrypted.ciphertext).not.toContain("рядом");
    expect(encrypted.iv).not.toBe(encryptNote("Сегодня просто рядом", key).iv);
    expect(decryptNote(encrypted, key)).toBe("Сегодня просто рядом");
  });

  it("rejects keys that are not 32 bytes", () => {
    expect(() => encryptNote("note", Buffer.alloc(8).toString("base64"))).toThrow("NOTE_KEY_INVALID");
  });
});
