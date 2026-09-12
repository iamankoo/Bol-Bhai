import { z } from "zod";

export const roomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^IN\d{6}$/, "Enter a valid room code.");

export const roomMemberSchema = z.object({
  id: z.string(),
  username: z.string(),
  joinedAt: z.string(),
  isHost: z.boolean()
});

export const roomSchema = z.object({
  roomCode: roomCodeSchema,
  host: roomMemberSchema,
  members: z.array(roomMemberSchema)
});

export const roomMutationResultSchema = roomSchema.extend({
  memberId: z.string()
});

export const leaveRoomResultSchema = z.union([
  z.object({
    deleted: z.literal(false),
    room: roomSchema
  }),
  z.object({
    deleted: z.literal(true),
    roomCode: roomCodeSchema,
    host: z.null(),
    members: z.tuple([])
  })
]);

export const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string()
});
