import type { PeerId } from "../webrtc";
import { logDev } from "../utils";

// Plain playback tops out at 100% volume (HTMLMediaElement.volume clamps to
// 1). Boosting past that requires routing through Web Audio: a GainNode does
// the boost, and a DynamicsCompressorNode limits the result so a loud boost
// doesn't just clip into distortion — the goal is louder AND clear, not louder.
const REMOTE_AUDIO_GAIN = 3; // 300%

type RemoteAudioGraph = {
  source: MediaElementAudioSourceNode;
  gain: GainNode;
  compressor: DynamicsCompressorNode;
};

export class RemoteAudioService {
  private readonly audioElements = new Map<PeerId, HTMLAudioElement>();
  private readonly audioGraphs = new Map<PeerId, RemoteAudioGraph>();
  private audioContext: AudioContext | null = null;

  private getAudioContext(): AudioContext {
    this.audioContext ??= new AudioContext();

    if (this.audioContext.state === "suspended") {
      void this.audioContext.resume().catch(() => {
        // Autoplay policy may still block this until the next user gesture;
        // attachRemoteStream's own audioElement.play() retry/log covers that.
      });
    }

    return this.audioContext;
  }

  private buildAudioGraph(audioElement: HTMLAudioElement): RemoteAudioGraph {
    const context = this.getAudioContext();
    const source = context.createMediaElementSource(audioElement);
    const gain = context.createGain();
    const compressor = context.createDynamicsCompressor();

    gain.gain.value = REMOTE_AUDIO_GAIN;

    // createMediaElementSource silently takes over the element's output, so
    // from here on the element is only audible through this graph.
    source.connect(gain);
    gain.connect(compressor);
    compressor.connect(context.destination);

    return { source, gain, compressor };
  }

  attachRemoteStream(peerId: PeerId, stream: MediaStream): void {
    let audioElement = this.audioElements.get(peerId);

    if (!audioElement) {
      audioElement = document.createElement("audio");
      audioElement.autoplay = true;
      audioElement.id = `bol-bhai-audio-${peerId}`;
      audioElement.style.display = "none";
      document.body.appendChild(audioElement);
      this.audioElements.set(peerId, audioElement);
      this.audioGraphs.set(peerId, this.buildAudioGraph(audioElement));
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

    const graph = this.audioGraphs.get(peerId);
    graph?.source.disconnect();
    graph?.gain.disconnect();
    graph?.compressor.disconnect();
    this.audioGraphs.delete(peerId);

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
    this.audioGraphs.clear();

    if (this.audioContext) {
      void this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }
}

export const remoteAudioService = new RemoteAudioService();
