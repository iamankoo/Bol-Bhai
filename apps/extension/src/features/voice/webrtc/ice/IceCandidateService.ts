import { SIGNALING_MESSAGE_TYPES } from "../../signaling/messages";
import type { IceCandidateMessage } from "../../signaling/types";
import { iceCandidateMessageSchema } from "../../signaling/validators";
import type { PeerConnectionManager } from "../manager";
import type { LocalIceCandidateListener, NegotiationContextProvider, PeerId } from "../types";
import { iceCandidateInitSchema, serializedIceCandidateSchema } from "../validators";

type IceCandidateServiceDependencies = {
  peerConnectionManager: PeerConnectionManager;
  contextProvider: NegotiationContextProvider;
};

export class IceCandidateService {
  private readonly pendingRemoteCandidates = new Map<PeerId, IceCandidateMessage[]>();

  constructor(private readonly dependencies: IceCandidateServiceDependencies) {}

  listenForLocalIceCandidates(
    peerId: PeerId,
    listener: LocalIceCandidateListener
  ): () => void {
    const connection = this.dependencies.peerConnectionManager.create(peerId);

    connection.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }

      const context = this.dependencies.contextProvider.getMessageContext(peerId);
      const message: IceCandidateMessage = {
        id: crypto.randomUUID(),
        type: SIGNALING_MESSAGE_TYPES.candidate,
        roomCode: context.roomCode,
        senderId: context.localMemberId,
        sentAt: new Date().toISOString(),
        payload: {
          targetMemberId: context.targetMemberId,
          candidate: this.serializeIceCandidate(event.candidate)
        }
      };

      void listener(iceCandidateMessageSchema.parse(message));
    };

    return () => {
      if (connection.onicecandidate) {
        connection.onicecandidate = null;
      }
    };
  }

  async applyRemoteIceCandidate(peerId: PeerId, message: IceCandidateMessage): Promise<void> {
    const validatedMessage = iceCandidateMessageSchema.parse(message);
    const connection = this.dependencies.peerConnectionManager.get(peerId);

    if (!connection || !connection.remoteDescription) {
      this.queueRemoteIceCandidate(peerId, validatedMessage);
      return;
    }

    await connection.addIceCandidate(
      this.deserializeIceCandidate(validatedMessage.payload.candidate)
    );
  }

  async flushRemoteIceCandidateQueue(peerId: PeerId): Promise<void> {
    const connection = this.dependencies.peerConnectionManager.get(peerId);
    const pendingCandidates = this.pendingRemoteCandidates.get(peerId) ?? [];

    if (!connection || !connection.remoteDescription || pendingCandidates.length === 0) {
      return;
    }

    this.pendingRemoteCandidates.delete(peerId);

    for (const candidateMessage of pendingCandidates) {
      await connection.addIceCandidate(
        this.deserializeIceCandidate(candidateMessage.payload.candidate)
      );
    }
  }

  clearPendingIceCandidates(peerId: PeerId): void {
    this.pendingRemoteCandidates.delete(peerId);
  }

  serializeIceCandidate(candidate: RTCIceCandidate): string {
    return serializedIceCandidateSchema.parse(JSON.stringify(candidate.toJSON()));
  }

  private queueRemoteIceCandidate(peerId: PeerId, message: IceCandidateMessage): void {
    const pendingCandidates = this.pendingRemoteCandidates.get(peerId) ?? [];
    pendingCandidates.push(message);
    this.pendingRemoteCandidates.set(peerId, pendingCandidates);
  }

  private deserializeIceCandidate(candidate: string): RTCIceCandidateInit {
    const parsedCandidate = JSON.parse(serializedIceCandidateSchema.parse(candidate));

    return iceCandidateInitSchema.parse(parsedCandidate);
  }
}
