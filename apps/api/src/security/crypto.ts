import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export interface EncryptedNote { ciphertext: string; iv: string; authTag: string; keyVersion: number; }
function keyFromBase64(key: string): Buffer { const value = Buffer.from(key, "base64"); if (value.length !== 32) throw new Error("NOTE_KEY_INVALID"); return value; }

export function encryptNote(plaintext: string, key: string, keyVersion = 1): EncryptedNote { const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", keyFromBase64(key), iv); const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]); return { ciphertext: ciphertext.toString("base64"), iv: iv.toString("base64"), authTag: cipher.getAuthTag().toString("base64"), keyVersion }; }

export function decryptNote(note: EncryptedNote, key: string): string { const decipher = createDecipheriv("aes-256-gcm", keyFromBase64(key), Buffer.from(note.iv, "base64")); decipher.setAuthTag(Buffer.from(note.authTag, "base64")); return Buffer.concat([decipher.update(Buffer.from(note.ciphertext, "base64")), decipher.final()]).toString("utf8"); }
