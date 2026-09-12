import type { SignalingMessage } from "../types";

export class MessageQueue {
  private readonly messages: SignalingMessage[] = [];

  enqueue(message: SignalingMessage): void {
    this.messages.push(message);
  }

  drain(): SignalingMessage[] {
    return this.messages.splice(0, this.messages.length);
  }

  clear(): void {
    this.messages.splice(0, this.messages.length);
  }

  size(): number {
    return this.messages.length;
  }
}
