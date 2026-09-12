import { create } from "zustand";

export type PeerState =
  | "new"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed"
  | "closed";

type VoiceSessionStoreState = {
  participants: string[];
  peerStates: Record<string, PeerState>;
  activePeerCount: number;
  isMuted: boolean;
  isConnected: boolean;
  connectionErrors: Record<string, string>;
  speakingState: Record<string, boolean>;

  setParticipants: (participants: string[]) => void;
  setPeerState: (peerId: string, state: PeerState) => void;
  removePeerState: (peerId: string) => void;
  setMuted: (isMuted: boolean) => void;
  setIsConnected: (isConnected: boolean) => void;
  setConnectionError: (peerId: string, error: string | null) => void;
  resetSession: () => void;
};

export const useVoiceSessionStore = create<VoiceSessionStoreState>((set) => ({
  participants: [],
  peerStates: {},
  activePeerCount: 0,
  isMuted: false,
  isConnected: false,
  connectionErrors: {},
  speakingState: {},

  setParticipants: (participants) =>
    set({
      participants,
      activePeerCount: participants.length
    }),

  setPeerState: (peerId, state) =>
    set((store) => {
      const nextPeerStates = { ...store.peerStates, [peerId]: state };
      const hasConnectedPeers = Object.values(nextPeerStates).some(
        (s) => s === "connected"
      );
      return {
        peerStates: nextPeerStates,
        isConnected: hasConnectedPeers
      };
    }),

  removePeerState: (peerId) =>
    set((store) => {
      const nextPeerStates = { ...store.peerStates };
      delete nextPeerStates[peerId];
      const nextErrors = { ...store.connectionErrors };
      delete nextErrors[peerId];
      const nextSpeaking = { ...store.speakingState };
      delete nextSpeaking[peerId];
      const hasConnectedPeers = Object.values(nextPeerStates).some(
        (s) => s === "connected"
      );
      return {
        peerStates: nextPeerStates,
        connectionErrors: nextErrors,
        speakingState: nextSpeaking,
        isConnected: hasConnectedPeers
      };
    }),

  setMuted: (isMuted) => set({ isMuted }),

  setIsConnected: (isConnected) => set({ isConnected }),

  setConnectionError: (peerId, error) =>
    set((store) => {
      const nextErrors = { ...store.connectionErrors };
      if (error === null) {
        delete nextErrors[peerId];
      } else {
        nextErrors[peerId] = error;
      }
      return { connectionErrors: nextErrors };
    }),

  resetSession: () =>
    set({
      participants: [],
      peerStates: {},
      activePeerCount: 0,
      isMuted: false,
      isConnected: false,
      connectionErrors: {},
      speakingState: {}
    })
}));
