import { create } from "zustand";
import type { LocalMediaStatus } from "../types";

type MediaState = {
  status: LocalMediaStatus;
  stream: MediaStream | null;
  isMuted: boolean;
  errorMessage: string | null;
  setStarting: () => void;
  setStream: (stream: MediaStream) => void;
  setStopped: () => void;
  setMuted: (isMuted: boolean) => void;
  setErrorMessage: (errorMessage: string | null) => void;
};

export const useMediaStore = create<MediaState>((set) => ({
  status: "idle",
  stream: null,
  isMuted: false,
  errorMessage: null,

  setStarting() {
    set({ status: "starting", errorMessage: null });
  },

  setStream(stream) {
    set({ status: "active", stream, isMuted: false, errorMessage: null });
  },

  setStopped() {
    set({ status: "idle", stream: null, isMuted: false, errorMessage: null });
  },

  setMuted(isMuted) {
    set({ isMuted, status: isMuted ? "muted" : "active" });
  },

  setErrorMessage(errorMessage) {
    set({ status: "error", errorMessage });
  }
}));
