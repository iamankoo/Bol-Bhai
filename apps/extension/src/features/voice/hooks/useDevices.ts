import { useCallback, useEffect } from "react";
import { deviceService } from "../devices";
import { useDeviceStore } from "../store";

export function useDevices() {
  const microphones = useDeviceStore((state) => state.microphones);
  const speakers = useDeviceStore((state) => state.speakers);
  const defaultMicrophone = useDeviceStore((state) => state.defaultMicrophone);
  const defaultSpeaker = useDeviceStore((state) => state.defaultSpeaker);
  const selectedMicrophoneId = useDeviceStore((state) => state.selectedMicrophoneId);
  const selectedSpeakerId = useDeviceStore((state) => state.selectedSpeakerId);
  const isLoadingDevices = useDeviceStore((state) => state.isLoadingDevices);
  const errorMessage = useDeviceStore((state) => state.errorMessage);
  const setDevices = useDeviceStore((state) => state.setDevices);
  const setIsLoadingDevices = useDeviceStore((state) => state.setIsLoadingDevices);
  const setSelectedMicrophoneId = useDeviceStore((state) => state.setSelectedMicrophoneId);
  const setSelectedSpeakerId = useDeviceStore((state) => state.setSelectedSpeakerId);
  const setErrorMessage = useDeviceStore((state) => state.setErrorMessage);

  const refreshDevices = useCallback(async () => {
    setIsLoadingDevices(true);
    setErrorMessage(null);

    try {
      const snapshot = await deviceService.enumerateAudioDevices();
      setDevices(snapshot);
      return snapshot;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to enumerate audio devices.";
      setErrorMessage(message);
      throw error;
    } finally {
      setIsLoadingDevices(false);
    }
  }, [setDevices, setErrorMessage, setIsLoadingDevices]);

  useEffect(() => {
    void refreshDevices();

    return deviceService.onDeviceChange(() => {
      void refreshDevices();
    });
  }, [refreshDevices]);

  return {
    microphones,
    speakers,
    defaultMicrophone,
    defaultSpeaker,
    selectedMicrophoneId,
    selectedSpeakerId,
    isLoadingDevices,
    errorMessage,
    refreshDevices,
    setSelectedMicrophoneId,
    setSelectedSpeakerId
  };
}
