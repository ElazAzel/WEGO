import { z } from "zod";
import type { CheckinInput } from "./types";

export const spaceNameSchema = z.string().trim().min(1, "Введите имя Wego").max(24, "Максимум 24 символа");
export const checkinSchema = z.object({
  mood: z.enum(["great", "good", "calm", "normal", "overloaded", "hard", "irritated"]),
  energy: z.enum(["high", "mid", "low"]),
  want: z.enum(["together", "talk", "rest", "alone", "fun", "walk", "support"]),
  note: z.string().trim().max(240, "Максимум 240 символов"),
  clientMutationId: z.string().min(1),
});

export function validateSpaceName(name: string) {
  return spaceNameSchema.safeParse(name);
}

export function validateCheckin(input: unknown): { success: true; data: CheckinInput } | { success: false; error: z.ZodError } {
  const result = checkinSchema.safeParse(input);
  if (!result.success) return result;
  return { success: true, data: result.data };
}
