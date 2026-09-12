import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(1, "Username is required.")
  .min(3, "Username must be at least 3 characters.")
  .max(20, "Username must be 20 characters or less.")
  .regex(/^[A-Za-z0-9 ]+$/, "Username can contain only letters, numbers, and spaces.");

export const roomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^IN\d{6}$/, "Room code must match IN followed by 6 digits.");

export const createRoomBodySchema = z.object({
  username: usernameSchema
});

export const joinRoomBodySchema = z.object({
  roomCode: roomCodeSchema,
  username: usernameSchema
});

export const leaveRoomBodySchema = z.object({
  roomCode: roomCodeSchema,
  memberId: z.string().uuid("Member id is required.")
});

export const getRoomParamsSchema = z.object({
  code: roomCodeSchema
});
