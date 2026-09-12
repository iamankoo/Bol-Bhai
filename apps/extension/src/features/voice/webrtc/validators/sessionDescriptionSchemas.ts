import { z } from "zod";

export const serializedSessionDescriptionSchema = z.string().min(1);

export const serializedIceCandidateSchema = z.string().min(1);

export const sessionDescriptionSchema = z.object({
  type: z.enum(["answer", "offer", "pranswer", "rollback"]),
  sdp: z.string().optional()
});

export const iceCandidateInitSchema = z.object({
  candidate: z.string().optional(),
  sdpMLineIndex: z.number().nullable().optional(),
  sdpMid: z.string().nullable().optional(),
  usernameFragment: z.string().nullable().optional()
});
