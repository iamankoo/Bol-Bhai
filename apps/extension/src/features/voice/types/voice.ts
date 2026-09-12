export type MicrophonePermissionState = "granted" | "denied" | "prompt" | "unsupported";

export type AudioDeviceKind = "microphone" | "speaker";

export type AudioDevice = {
  id: string;
  groupId: string;
  label: string;
  kind: AudioDeviceKind;
  isDefault: boolean;
};

export type AudioDeviceSnapshot = {
  microphones: AudioDevice[];
  speakers: AudioDevice[];
  defaultMicrophone: AudioDevice | null;
  defaultSpeaker: AudioDevice | null;
};

export type LocalMediaStatus = "idle" | "starting" | "active" | "muted" | "error";

export type LocalMediaSnapshot = {
  status: LocalMediaStatus;
  stream: MediaStream | null;
  isMuted: boolean;
  errorMessage: string | null;
};
