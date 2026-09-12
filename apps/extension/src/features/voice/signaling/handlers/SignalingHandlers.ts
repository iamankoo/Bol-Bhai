import type {
  AnswerMessage,
  HeartbeatMessage,
  IceCandidateMessage,
  OfferMessage
} from "../types";

export type OfferHandler = {
  handleOffer: (message: OfferMessage) => void | Promise<void>;
};

export type AnswerHandler = {
  handleAnswer: (message: AnswerMessage) => void | Promise<void>;
};

export type IceHandler = {
  handleIceCandidate: (message: IceCandidateMessage) => void | Promise<void>;
};

export type HeartbeatHandler = {
  handleHeartbeat: (message: HeartbeatMessage) => void | Promise<void>;
};
