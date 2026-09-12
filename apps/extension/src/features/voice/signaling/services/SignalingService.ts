import { logDev } from "../../utils";
import { MessageQueue } from "../queue";
import { CONNECTION_STATES, type ConnectionState } from "../state";
import type { SignalingMessage, SignalingTransport } from "../types";
import { signalingMessageSchema } from "../validators";

type SignalingMessageListener = (message: SignalingMessage) => void | Promise<void>;

type SignalingServiceOptions = {
  transport: SignalingTransport;
  queue?: MessageQueue;
};

export class SignalingService {
  private connectionState: ConnectionState = CONNECTION_STATES.disconnected;
  private readonly messageListeners = new Set<SignalingMessageListener>();
  private readonly queue: MessageQueue;
  private unsubscribeMessage: (() => void) | null = null;
  private unsubscribeState: (() => void) | null = null;

  constructor(private readonly options: SignalingServiceOptions) {
    this.queue = options.queue ?? new MessageQueue();
  }

  async connect(): Promise<void> {
    if (
      this.connectionState === CONNECTION_STATES.connected ||
      this.connectionState === CONNECTION_STATES.connecting
    ) {
      return;
    }

    this.bindTransport();
    this.setConnectionState(CONNECTION_STATES.connecting);
    await this.options.transport.connect();
  }

  disconnect(): void {
    this.options.transport.disconnect();

    this.unsubscribeMessage?.();
    this.unsubscribeMessage = null;
    this.unsubscribeState?.();
    this.unsubscribeState = null;

    this.queue.clear();
    this.setConnectionState(CONNECTION_STATES.disconnected);
  }

  async send(message: SignalingMessage): Promise<void> {
    const validatedMessage = signalingMessageSchema.parse(message);

    if (this.connectionState !== CONNECTION_STATES.connected) {
      logDev("[2] SignalingService: Queueing message because connection state is " + this.connectionState, {
        type: validatedMessage.type,
        roomCode: validatedMessage.roomCode
      });
      this.queueUntilConnected(validatedMessage);
      return;
    }

    logDev("[2] SignalingService: Forwarding message to transport", {
      type: validatedMessage.type,
      roomCode: validatedMessage.roomCode
    });
    await this.options.transport.send(validatedMessage);
  }

  receive(message: unknown): void {
    const validatedMessage = signalingMessageSchema.parse(message);
    logDev("[9] SignalingService: Received message from transport", {
      type: validatedMessage.type,
      senderId: validatedMessage.senderId
    });

    for (const listener of this.messageListeners) {
      void listener(validatedMessage);
    }
  }

  queueUntilConnected(message: SignalingMessage): void {
    this.queue.enqueue(signalingMessageSchema.parse(message));
  }

  onMessage(listener: SignalingMessageListener): () => void {
    this.messageListeners.add(listener);

    return () => {
      this.messageListeners.delete(listener);
    };
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  getQueuedMessageCount(): number {
    return this.queue.size();
  }

  private bindTransport(): void {
    if (this.unsubscribeMessage || this.unsubscribeState) {
      return;
    }

    this.unsubscribeMessage = this.options.transport.onMessage((message) => {
      this.receive(message);
    });
    this.unsubscribeState = this.options.transport.onStateChange((state) => {
      this.setConnectionState(state);
    });
  }

  private setConnectionState(connectionState: ConnectionState): void {
    this.connectionState = connectionState;

    if (connectionState === CONNECTION_STATES.connected) {
      void this.flushQueue();
    }
  }

  private async flushQueue(): Promise<void> {
    const pendingMessages = this.queue.drain();
    if (pendingMessages.length > 0) {
      logDev("[2] SignalingService: Flushing " + pendingMessages.length + " queued messages", {
        count: pendingMessages.length
      });
    }

    for (const message of pendingMessages) {
      await this.options.transport.send(message);
    }
  }
}
