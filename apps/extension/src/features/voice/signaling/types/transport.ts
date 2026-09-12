import type { ConnectionState } from "../state";
import type { SignalingMessage } from "./messages";

export type SignalingTransportMessageListener = (message: unknown) => void;
export type SignalingTransportStateListener = (state: ConnectionState) => void;

export type SignalingTransport = {
  connect: () => Promise<void>;
  disconnect: () => void;
  send: (message: SignalingMessage) => Promise<void>;
  onMessage: (listener: SignalingTransportMessageListener) => () => void;
  onStateChange: (listener: SignalingTransportStateListener) => () => void;
};
