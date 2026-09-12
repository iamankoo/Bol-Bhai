import type {
  AnswerMessage,
  IceCandidateMessage,
  OfferMessage
} from "../../signaling/types";
import type { PeerId } from "./peerConnection";

export const NEGOTIATION_CONNECTION_STATES = {
  stable: "Stable",
  haveLocalOffer: "HaveLocalOffer",
  haveRemoteOffer: "HaveRemoteOffer",
  connecting: "Connecting",
  connected: "Connected",
  disconnected: "Disconnected",
  failed: "Failed",
  closed: "Closed"
} as const;

export type NegotiationConnectionState =
  (typeof NEGOTIATION_CONNECTION_STATES)[keyof typeof NEGOTIATION_CONNECTION_STATES];

export type NegotiationMessageContext = {
  roomCode: string;
  localMemberId: string;
  targetMemberId: string;
};

export type NegotiationContextProvider = {
  getMessageContext: (peerId: PeerId) => NegotiationMessageContext;
};

export type LocalIceCandidateListener = (message: IceCandidateMessage) => void | Promise<void>;

export type StartNegotiationResult = {
  state: NegotiationConnectionState;
  offer: OfferMessage;
};

export type RemoteOfferResult = {
  state: NegotiationConnectionState;
  answer: AnswerMessage;
};

export type RemoteAnswerResult = {
  state: NegotiationConnectionState;
};

export type RemoteIceResult = {
  state: NegotiationConnectionState;
};
