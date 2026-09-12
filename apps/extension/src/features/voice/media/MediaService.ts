export class MediaService {
  private stream: MediaStream | null = null;

  async start(deviceId?: string): Promise<MediaStream> {
    if (this.stream) {
      return this.stream;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Local audio capture is not supported in this browser.");
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      video: false
    });

    return this.stream;
  }

  stop(): void {
    if (!this.stream) {
      return;
    }

    for (const track of this.stream.getTracks()) {
      track.stop();
    }

    this.stream = null;
  }

  async restart(deviceId?: string): Promise<MediaStream> {
    this.stop();
    return this.start(deviceId);
  }

  mute(): void {
    for (const track of this.getAudioTracks()) {
      track.enabled = false;
    }
  }

  unmute(): void {
    for (const track of this.getAudioTracks()) {
      track.enabled = true;
    }
  }

  destroy(): void {
    this.stop();
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  private getAudioTracks(): MediaStreamTrack[] {
    return this.stream?.getAudioTracks() ?? [];
  }
}

export const mediaService = new MediaService();
