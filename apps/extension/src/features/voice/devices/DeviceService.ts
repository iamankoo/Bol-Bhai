import type { AudioDevice, AudioDeviceSnapshot } from "../types";

type DeviceChangeListener = () => void;

function toAudioDevice(device: MediaDeviceInfo): AudioDevice {
  return {
    id: device.deviceId,
    groupId: device.groupId,
    label: device.label || (device.deviceId === "default" ? "Default device" : "Unnamed device"),
    kind: device.kind === "audioinput" ? "microphone" : "speaker",
    isDefault: device.deviceId === "default"
  };
}

function findDefaultDevice(devices: AudioDevice[]): AudioDevice | null {
  return devices.find((device) => device.isDefault) ?? devices[0] ?? null;
}

export class DeviceService {
  async enumerateAudioDevices(): Promise<AudioDeviceSnapshot> {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return {
        microphones: [],
        speakers: [],
        defaultMicrophone: null,
        defaultSpeaker: null
      };
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    const microphones = devices
      .filter((device) => device.kind === "audioinput")
      .map(toAudioDevice);
    const speakers = devices
      .filter((device) => device.kind === "audiooutput")
      .map(toAudioDevice);

    return {
      microphones,
      speakers,
      defaultMicrophone: findDefaultDevice(microphones),
      defaultSpeaker: findDefaultDevice(speakers)
    };
  }

  onDeviceChange(listener: DeviceChangeListener): () => void {
    if (!navigator.mediaDevices?.addEventListener) {
      return () => {};
    }

    navigator.mediaDevices.addEventListener("devicechange", listener);

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", listener);
    };
  }
}

export const deviceService = new DeviceService();
