import type { SIGNALING_MESSAGE_TYPES } from "../messages";

type BaseSignalingMessage<Type extends string, Payload> = {
  id: string;
  type: Type;
  roomCode: string;
  senderId: string;
  sentAt: string;
  payload: Payload;
};

export type OfferMessage = BaseSignalingMessage<
  typeof SIGNALING_MESSAGE_TYPES.offer,
  {
    targetMemberId: string;
    description: string;
  }
>;

export type AnswerMessage = BaseSignalingMessage<
  typeof SIGNALING_MESSAGE_TYPES.answer,
  {
    targetMemberId: string;
    description: string;
  }
>;

export type IceCandidateMessage = BaseSignalingMessage<
  typeof SIGNALING_MESSAGE_TYPES.candidate,
  {
    targetMemberId: string;
    candidate: string;
  }
>;

export type JoinVoiceRoomMessage = BaseSignalingMessage<
  typeof SIGNALING_MESSAGE_TYPES.joinVoiceRoom,
  {
    memberId: string;
  }
>;

export type LeaveVoiceRoomMessage = BaseSignalingMessage<
  typeof SIGNALING_MESSAGE_TYPES.leaveVoiceRoom,
  {
    memberId: string;
  }
>;

export type ErrorMessage = BaseSignalingMessage<
  typeof SIGNALING_MESSAGE_TYPES.error,
  {
    code: string;
    message: string;
  }
>;

export type HeartbeatMessage = BaseSignalingMessage<
  typeof SIGNALING_MESSAGE_TYPES.heartbeat,
  {
    sequence: number;
  }
>;

export type SignalingMessage =
  | OfferMessage
  | AnswerMessage
  | IceCandidateMessage
  | JoinVoiceRoomMessage
  | LeaveVoiceRoomMessage
  | ErrorMessage
  | HeartbeatMessage;
