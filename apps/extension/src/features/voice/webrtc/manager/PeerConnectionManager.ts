import { DEFAULT_RTC_CONFIGURATION } from "../config";
import type { PeerConnectionMap, PeerId } from "../types";

export class PeerConnectionManager {
  private readonly connections: PeerConnectionMap = new Map();

  constructor(private readonly configuration: RTCConfiguration = DEFAULT_RTC_CONFIGURATION) {}

  create(id: PeerId): RTCPeerConnection {
    const existingConnection = this.connections.get(id);

    if (existingConnection) {
      return existingConnection;
    }

    const connection = new RTCPeerConnection(this.configuration);
    this.connections.set(id, connection);

    return connection;
  }

  get(id: PeerId): RTCPeerConnection | null {
    return this.connections.get(id) ?? null;
  }

  restart(id: PeerId): RTCPeerConnection {
    this.destroy(id);
    return this.create(id);
  }

  close(id: PeerId): void {
    this.connections.get(id)?.close();
  }

  destroy(id: PeerId): void {
    this.close(id);
    this.connections.delete(id);
  }

  destroyAll(): void {
    for (const connection of this.connections.values()) {
      connection.close();
    }

    this.connections.clear();
  }
}
