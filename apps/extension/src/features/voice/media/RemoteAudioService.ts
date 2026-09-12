import type { PeerId } from "../webrtc";
import { logDev } from "../utils";

export class RemoteAudioService {
  private readonly audioElements = new Map<PeerId, HTMLAudioElement>();

  attachRemoteStream(peerId: PeerId, stream: MediaStream): void {
    let audioElement = this.audioElements.get(peerId);

    if (!audioElement) {
      audioElement = document.createElement("audio");
      audioElement.autoplay = true;
      audioElement.id = `bol-bhai-audio-${peerId}`;
      audioElement.style.display = "none";
      document.body.appendChild(audioElement);
      this.audioElements.set(peerId, audioElement);
    }

    if (audioElement.srcObject !== stream) {
      audioElement.srcObject = stream;
      audioElement
        .play()
        .then(() => {
          logDev("Audio Playing", { peerId });
        })
        .catch((error: unknown) => {
          if (import.meta.env.DEV) {
            console.warn(`[Bol Bhai] Failed to play remote audio for peer ${peerId}:`, error);
          }
        });
    }
  }

  detachRemoteStream(peerId: PeerId): void {
    const audioElement = this.audioElements.get(peerId);

    if (!audioElement) {
      return;
    }

    audioElement.pause();
    audioElement.srcObject = null;
    audioElement.remove();
    this.audioElements.delete(peerId);
  }

  destroy(): void {
    for (const peerId of Array.from(this.audioElements.keys())) {
      this.detachRemoteStream(peerId);
    }

    this.audioElements.clear();
  }
}

export const remoteAudioService = new RemoteAudioService();
