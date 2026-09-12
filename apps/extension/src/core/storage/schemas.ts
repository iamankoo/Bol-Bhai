import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Name must be at least 3 characters.")
  .max(20, "Name must be 20 characters or less.")
  .regex(/^[A-Za-z0-9 ]+$/, "Use only letters, numbers, and spaces.");

export const overlayPositionSchema = z.object({
  left: z.number().finite(),
  top: z.number().finite()
});

export const settingsSchema = z.object({
  theme: z.literal("dark")
});

export const futureRoomsSchema = z.object({
  recentRoomIds: z.array(z.string())
});
