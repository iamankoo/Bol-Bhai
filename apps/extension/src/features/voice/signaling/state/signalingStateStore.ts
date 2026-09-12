import { create } from "zustand";
import { CONNECTION_STATES, type ConnectionState } from "./connectionState";

type SignalingState = {
  connectionState: ConnectionState;
  errorMessage: string | null;
  setConnectionState: (connectionState: ConnectionState) => void;
  setErrorMessage: (errorMessage: string | null) => void;
};

export const useSignalingStateStore = create<SignalingState>((set) => ({
  connectionState: CONNECTION_STATES.disconnected,
  errorMessage: null,

  setConnectionState(connectionState) {
    set({ connectionState });
  },

  setErrorMessage(errorMessage) {
    set({ errorMessage });
  }
}));
