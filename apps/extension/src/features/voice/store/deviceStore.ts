import { create } from "zustand";
import type { AudioDevice, AudioDeviceSnapshot } from "../types";

type DeviceState = AudioDeviceSnapshot & {
  isLoadingDevices: boolean;
  selectedMicrophoneId: string | null;
  selectedSpeakerId: string | null;
  errorMessage: string | null;
  setDevices: (snapshot: AudioDeviceSnapshot) => void;
  setIsLoadingDevices: (isLoadingDevices: boolean) => void;
  setSelectedMicrophoneId: (deviceId: string | null) => void;
  setSelectedSpeakerId: (deviceId: string | null) => void;
  setErrorMessage: (errorMessage: string | null) => void;
};

const EMPTY_DEVICES: AudioDevice[] = [];

export const useDeviceStore = create<DeviceState>((set) => ({
  microphones: EMPTY_DEVICES,
  speakers: EMPTY_DEVICES,
  defaultMicrophone: null,
  defaultSpeaker: null,
  isLoadingDevices: false,
  selectedMicrophoneId: null,
  selectedSpeakerId: null,
  errorMessage: null,

  setDevices(snapshot) {
    set((state) => ({
      ...snapshot,
      selectedMicrophoneId: state.selectedMicrophoneId ?? snapshot.defaultMicrophone?.id ?? null,
      selectedSpeakerId: state.selectedSpeakerId ?? snapshot.defaultSpeaker?.id ?? null,
      errorMessage: null
    }));
  },

  setIsLoadingDevices(isLoadingDevices) {
    set({ isLoadingDevices });
  },

  setSelectedMicrophoneId(selectedMicrophoneId) {
    set({ selectedMicrophoneId });
  },

  setSelectedSpeakerId(selectedSpeakerId) {
    set({ selectedSpeakerId });
  },

  setErrorMessage(errorMessage) {
    set({ errorMessage });
  }
}));
