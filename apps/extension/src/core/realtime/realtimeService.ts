import { io, type Socket } from "socket.io-client";

import { APP_CONFIG } from "../config/appConfig";

function devLog(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
}
import { REALTIME_CLIENT_EVENTS, REALTIME_SERVER_EVENTS } from "./realtimeEvents";
import type {
  ClientToServerEvents,
  RealtimeConnectionStatus,
  RealtimeSignalingPayload,
  ServerToClientEvents,
} from "./types/realtime";

type RealtimeServiceOptions = {
  url: string;
};

type StatusListener = (status: RealtimeConnectionStatus) => void;
type ConnectionReadyHandler = ServerToClientEvents["connection:ready"];
type MemberJoinedHandler = ServerToClientEvents["room:member-joined"];
type MemberLeftHandler = ServerToClientEvents["room:member-left"];
type HostChangedHandler = ServerToClientEvents["room:host-changed"];
type RoomDeletedHandler = ServerToClientEvents["room:deleted"];
type SignalingMessageHandler = ServerToClientEvents["voice:signal"];

export class RealtimeService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null =
    null;

  private readonly statusListeners = new Set<StatusListener>();

  constructor(private readonly options: RealtimeServiceOptions) {}

  connect(): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (this.socket) {
      if (!this.socket.connected) {
        this.emitStatus("connecting");
        this.socket.connect();
      }

      return this.socket;
    }

    this.socket = io(this.options.url, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      transports: ["websocket", "polling"],
    }) as Socket<ServerToClientEvents, ClientToServerEvents>;

    this.bindStatusEvents(this.socket);
    this.emitStatus("connecting");

    return this.socket;
  }

  disconnect(): void {
    if (!this.socket) return;

    this.socket.disconnect();
    this.socket = null;

    this.emitStatus("disconnected");
  }

  joinRoom(roomCode: string): void {
    const payload = { roomCode };
    devLog("[Socket] Emit", REALTIME_CLIENT_EVENTS.joinRoom, payload);
    this.connect().emit(REALTIME_CLIENT_EVENTS.joinRoom, payload);
  }

  leaveRoom(roomCode: string): void {
    if (!this.socket) return;

    const payload = { roomCode };
    devLog("[Socket] Emit", REALTIME_CLIENT_EVENTS.leaveRoom, payload);
    this.socket.emit(REALTIME_CLIENT_EVENTS.leaveRoom, payload);
  }

  sendSignalingMessage(payload: RealtimeSignalingPayload): void {
    devLog("[Socket] Emit", REALTIME_CLIENT_EVENTS.signalingMessage, payload);
    this.connect().emit(REALTIME_CLIENT_EVENTS.signalingMessage, payload);
  }

  onConnectionReady(handler: ConnectionReadyHandler): void {
    this.connect().on(REALTIME_SERVER_EVENTS.connected, handler);
  }

  offConnectionReady(handler: ConnectionReadyHandler): void {
    this.socket?.off(REALTIME_SERVER_EVENTS.connected, handler);
  }

  onMemberJoined(handler: MemberJoinedHandler): void {
    this.connect().on(REALTIME_SERVER_EVENTS.memberJoined, handler);
  }

  offMemberJoined(handler: MemberJoinedHandler): void {
    this.socket?.off(REALTIME_SERVER_EVENTS.memberJoined, handler);
  }

  onMemberLeft(handler: MemberLeftHandler): void {
    this.connect().on(REALTIME_SERVER_EVENTS.memberLeft, handler);
  }

  offMemberLeft(handler: MemberLeftHandler): void {
    this.socket?.off(REALTIME_SERVER_EVENTS.memberLeft, handler);
  }

  onHostChanged(handler: HostChangedHandler): void {
    this.connect().on(REALTIME_SERVER_EVENTS.hostChanged, handler);
  }

  offHostChanged(handler: HostChangedHandler): void {
    this.socket?.off(REALTIME_SERVER_EVENTS.hostChanged, handler);
  }

  onRoomDeleted(handler: RoomDeletedHandler): void {
    this.connect().on(REALTIME_SERVER_EVENTS.roomDeleted, handler);
  }

  offRoomDeleted(handler: RoomDeletedHandler): void {
    this.socket?.off(REALTIME_SERVER_EVENTS.roomDeleted, handler);
  }

  onPeerReady(handler: (payload: { roomCode: string; socketId: string }) => void): void {
    this.connect().on(REALTIME_SERVER_EVENTS.peerReady, handler);
  }

  offPeerReady(handler: (payload: { roomCode: string; socketId: string }) => void): void {
    this.socket?.off(REALTIME_SERVER_EVENTS.peerReady, handler);
  }

  onSignalingMessage(handler: SignalingMessageHandler): void {
    this.connect().on(REALTIME_SERVER_EVENTS.signalingMessage, handler);
  }

  offSignalingMessage(handler: SignalingMessageHandler): void {
    this.socket?.off(REALTIME_SERVER_EVENTS.signalingMessage, handler);
  }

  private currentStatus: RealtimeConnectionStatus = "disconnected";

  getStatus(): RealtimeConnectionStatus {
    if (this.socket?.connected) {
      return "connected";
    }
    return this.currentStatus;
  }

  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.getStatus());

    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private bindStatusEvents(
    socket: Socket<ServerToClientEvents, ClientToServerEvents>
  ): void {
    socket.on("connect", () => {
      devLog("[Socket] Connected", socket.id);
      this.emitStatus("connected");
    });

    socket.on("disconnect", (reason) => {
      devLog("[Socket] Disconnected", reason);
      this.emitStatus("disconnected");
    });

    socket.onAny((event, ...args) => {
      devLog("[Socket] Received", event, args);
    });

    socket.io.on("reconnect_attempt", () => {
      this.emitStatus("reconnecting");
    });

    socket.io.on("reconnect", () => {
      this.emitStatus("connected");
    });

    socket.io.on("error", () => {
      this.emitStatus("disconnected");
    });
  }

  private emitStatus(status: RealtimeConnectionStatus): void {
    this.currentStatus = status;
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }
}

export const realtimeService = new RealtimeService({
  url: APP_CONFIG.apiBaseUrl,
});
