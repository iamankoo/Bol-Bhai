import { create } from "zustand";
import type { MicrophonePermissionState } from "../types";

type PermissionState = {
  microphonePermission: MicrophonePermissionState;
  isCheckingPermission: boolean;
  errorMessage: string | null;
  setMicrophonePermission: (permission: MicrophonePermissionState) => void;
  setIsCheckingPermission: (isCheckingPermission: boolean) => void;
  setErrorMessage: (errorMessage: string | null) => void;
};

export const usePermissionStore = create<PermissionState>((set) => ({
  microphonePermission: "prompt",
  isCheckingPermission: false,
  errorMessage: null,

  setMicrophonePermission(microphonePermission) {
    set({ microphonePermission, errorMessage: null });
  },

  setIsCheckingPermission(isCheckingPermission) {
    set({ isCheckingPermission });
  },

  setErrorMessage(errorMessage) {
    set({ errorMessage });
  }
}));
