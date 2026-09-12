import { z } from "zod";

// Canonical WebRTC signaling message contract shared between the extension
// (producer/consumer over Socket.IO) and the server (validates and relays
// messages between room members without inspecting SDP/ICE contents).

export const SIGNALING_MESSAGE_TYPES = {
  offer: "offer",
  answer: "answer",
  candidate: "candidate",
  joinVoiceRoom: "join-voice-room",
  leaveVoiceRoom: "leave-voice-room",
  error: "error",
  heartbeat: "heartbeat"
} as const;

export type SignalingMessageType =
  (typeof SIGNALING_MESSAGE_TYPES)[keyof typeof SIGNALING_MESSAGE_TYPES];

const roomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^IN\d{6}$/);

const baseMessageSchema = z.object({
  id: z.string().min(1),
  roomCode: roomCodeSchema,
  senderId: z.string().min(1),
  sentAt: z.string().datetime()
});

export const offerMessageSchema = baseMessageSchema.extend({
  type: z.literal(SIGNALING_MESSAGE_TYPES.offer),
  payload: z.object({
    targetMemberId: z.string().min(1),
    description: z.string().min(1)
  })
});

export const answerMessageSchema = baseMessageSchema.extend({
  type: z.literal(SIGNALING_MESSAGE_TYPES.answer),
  payload: z.object({
    targetMemberId: z.string().min(1),
    description: z.string().min(1)
  })
});

export const iceCandidateMessageSchema = baseMessageSchema.extend({
  type: z.literal(SIGNALING_MESSAGE_TYPES.candidate),
  payload: z.object({
    targetMemberId: z.string().min(1),
    candidate: z.string().min(1)
  })
});

export const joinVoiceRoomMessageSchema = baseMessageSchema.extend({
  type: z.literal(SIGNALING_MESSAGE_TYPES.joinVoiceRoom),
  payload: z.object({
    memberId: z.string().min(1)
  })
});

export const leaveVoiceRoomMessageSchema = baseMessageSchema.extend({
  type: z.literal(SIGNALING_MESSAGE_TYPES.leaveVoiceRoom),
  payload: z.object({
    memberId: z.string().min(1)
  })
});

export const errorMessageSchema = baseMessageSchema.extend({
  type: z.literal(SIGNALING_MESSAGE_TYPES.error),
  payload: z.object({
    code: z.string().min(1),
    message: z.string().min(1)
  })
});

export const heartbeatMessageSchema = baseMessageSchema.extend({
  type: z.literal(SIGNALING_MESSAGE_TYPES.heartbeat),
  payload: z.object({
    sequence: z.number().int().nonnegative()
  })
});

export const signalingMessageSchema = z.discriminatedUnion("type", [
  offerMessageSchema,
  answerMessageSchema,
  iceCandidateMessageSchema,
  joinVoiceRoomMessageSchema,
  leaveVoiceRoomMessageSchema,
  errorMessageSchema,
  heartbeatMessageSchema
]);

export type SignalingMessage = z.infer<typeof signalingMessageSchema>;
export type OfferMessage = z.infer<typeof offerMessageSchema>;
export type AnswerMessage = z.infer<typeof answerMessageSchema>;
export type IceCandidateMessage = z.infer<typeof iceCandidateMessageSchema>;

// Envelope a signaling message travels in over the `voice:signal` Socket.IO event.
export const voiceSignalEnvelopeSchema = z.object({
  roomCode: roomCodeSchema,
  message: signalingMessageSchema
});

export type VoiceSignalEnvelope = z.infer<typeof voiceSignalEnvelopeSchema>;

// `room:join` / `room:leave` payloads.
export const realtimeRoomPayloadSchema = z.object({
  roomCode: roomCodeSchema
});

export type RealtimeRoomPayload = z.infer<typeof realtimeRoomPayloadSchema>;
