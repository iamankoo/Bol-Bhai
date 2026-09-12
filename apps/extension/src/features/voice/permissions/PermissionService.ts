import type { MicrophonePermissionState } from "../types";

const MICROPHONE_PERMISSION = "microphone" as PermissionName;

function normalizePermissionState(state: PermissionState): MicrophonePermissionState {
  if (state === "granted" || state === "denied" || state === "prompt") {
    return state;
  }

  return "unsupported";
}

export class PermissionService {
  async checkMicrophonePermission(): Promise<MicrophonePermissionState> {
    if (!navigator.permissions?.query) {
      return "unsupported";
    }

    try {
      const permission = await navigator.permissions.query({
        name: MICROPHONE_PERMISSION
      });

      return normalizePermissionState(permission.state);
    } catch {
      return "unsupported";
    }
  }

  async requestMicrophonePermission(): Promise<MicrophonePermissionState> {
    if (!navigator.mediaDevices?.getUserMedia) {
      return "unsupported";
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.stopStream(stream);

      return "granted";
    } catch {
      return "denied";
    }
  }

  async isMicrophoneGranted(): Promise<boolean> {
    return (await this.checkMicrophonePermission()) === "granted";
  }

  async isMicrophoneDenied(): Promise<boolean> {
    return (await this.checkMicrophonePermission()) === "denied";
  }

  async isMicrophonePrompt(): Promise<boolean> {
    return (await this.checkMicrophonePermission()) === "prompt";
  }

  watchMicrophonePermission(onChange: (state: MicrophonePermissionState) => void): () => void {
    if (!navigator.permissions?.query) {
      onChange("unsupported");
      return () => {};
    }

    let permissionStatus: PermissionStatus | null = null;
    let isDisposed = false;

    void navigator.permissions
      .query({ name: MICROPHONE_PERMISSION })
      .then((status) => {
        if (isDisposed) {
          return;
        }

        permissionStatus = status;
        onChange(normalizePermissionState(status.state));
        status.onchange = () => onChange(normalizePermissionState(status.state));
      })
      .catch(() => onChange("unsupported"));

    return () => {
      isDisposed = true;

      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }

  private stopStream(stream: MediaStream): void {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  }
}

export const permissionService = new PermissionService();
