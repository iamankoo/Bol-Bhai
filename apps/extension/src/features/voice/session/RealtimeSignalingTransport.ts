import {
  realtimeService,
  type RealtimeConnectionStatus,
  type RealtimeSignalingPayload
} from "../../../core/realtime";
import {
  CONNECTION_STATES,
  type ConnectionState,
  type SignalingMessage,
  type SignalingTransport,
  type SignalingTransportMessageListener,
  type SignalingTransportStateListener
} from "../signaling";
import { logDev } from "../utils";

function toSignalingConnectionState(status: RealtimeConnectionStatus): ConnectionState {
  if (status === "connected") {
    return CONNECTION_STATES.connected;
  }

  if (status === "connecting") {
    return CONNECTION_STATES.connecting;
  }

  if (status === "reconnecting") {
    return CONNECTION_STATES.reconnecting;
  }

  return CONNECTION_STATES.disconnected;
}

export class RealtimeSignalingTransport implements SignalingTransport {
  private readonly stateListeners = new Set<SignalingTransportStateListener>();
  private unsubscribeRealtimeStatus: (() => void) | null = null;

  connect(): Promise<void> {
    const socket = realtimeService.connect();

    this.ensureStatusSubscription();

    if (socket.connected) {
      this.emitState(CONNECTION_STATES.connected);
      return Promise.resolve();
    }

    this.emitState(CONNECTION_STATES.connecting);

    return new Promise<void>((resolve) => {
      const onConnect = () => {
        socket.off("connect", onConnect);
        this.emitState(CONNECTION_STATES.connected);
        resolve();
      };

      socket.on("connect", onConnect);
    });
  }

  disconnect(): void {
    realtimeService.disconnect();
    this.emitState(CONNECTION_STATES.disconnected);
  }

  send(message: SignalingMessage): Promise<void> {
    logDev("[Signal Transport] Sending", message);
    realtimeService.sendSignalingMessage({
      roomCode: message.roomCode,
      message
    });

    return Promise.resolve();
  }

  onMessage(listener: SignalingTransportMessageListener): () => void {
    const handler = (payload: RealtimeSignalingPayload) => {
      logDev("[Signal Transport] Received", payload.message);
      listener(payload.message as SignalingMessage);
    };

    realtimeService.onSignalingMessage(handler);

    return () => {
      realtimeService.offSignalingMessage(handler);
    };
  }

  onStateChange(listener: SignalingTransportStateListener): () => void {
    this.stateListeners.add(listener);
    this.ensureStatusSubscription();

    const currentStatus = realtimeService.getStatus();
    listener(toSignalingConnectionState(currentStatus));

    return () => {
      this.stateListeners.delete(listener);
    };
  }

  private ensureStatusSubscription(): void {
    if (this.unsubscribeRealtimeStatus) {
      return;
    }

    this.unsubscribeRealtimeStatus = realtimeService.onStatusChange((status) => {
      const sigState = toSignalingConnectionState(status);
      this.emitState(sigState);
    });
  }

  private emitState(state: ConnectionState): void {
    for (const listener of this.stateListeners) {
      listener(state);
    }
  }
}
