import { SIGNALING_MESSAGE_TYPES } from "../../signaling/messages";
import type { AnswerMessage, OfferMessage } from "../../signaling/types";
import { answerMessageSchema, offerMessageSchema } from "../../signaling/validators";
import { logDev } from "../../utils";
import type { PeerConnectionManager } from "../manager";
import type { NegotiationContextProvider, PeerId } from "../types";
import {
  serializedSessionDescriptionSchema,
  sessionDescriptionSchema
} from "../validators";

type OfferServiceDependencies = {
  peerConnectionManager: PeerConnectionManager;
  contextProvider: NegotiationContextProvider;
};

export class OfferService {
  constructor(private readonly dependencies: OfferServiceDependencies) {}

  async createOffer(peerId: PeerId): Promise<OfferMessage> {
    const connection = this.dependencies.peerConnectionManager.create(peerId);
    const offer = await connection.createOffer();

    await this.setLocalDescription(peerId, offer);
    logDev("Offer Created", { peerId });

    const context = this.dependencies.contextProvider.getMessageContext(peerId);
    const message: OfferMessage = {
      id: crypto.randomUUID(),
      type: SIGNALING_MESSAGE_TYPES.offer,
      roomCode: context.roomCode,
      senderId: context.localMemberId,
      sentAt: new Date().toISOString(),
      payload: {
        targetMemberId: context.targetMemberId,
        description: this.serializeOffer(offer)
      }
    };

    return offerMessageSchema.parse(message);
  }

  async setLocalDescription(
    peerId: PeerId,
    description: RTCSessionDescriptionInit
  ): Promise<void> {
    const connection = this.dependencies.peerConnectionManager.create(peerId);
    await connection.setLocalDescription(description);
  }

  async applyRemoteAnswer(peerId: PeerId, message: AnswerMessage): Promise<void> {
    const validatedMessage = answerMessageSchema.parse(message);
    const connection = this.dependencies.peerConnectionManager.get(peerId);

    if (!connection) {
      throw new Error("PeerConnection does not exist for this peer.");
    }

    await connection.setRemoteDescription(
      this.deserializeAnswer(validatedMessage.payload.description)
    );
  }

  serializeOffer(description: RTCSessionDescriptionInit): string {
    return serializedSessionDescriptionSchema.parse(JSON.stringify(description));
  }

  private deserializeAnswer(description: string): RTCSessionDescriptionInit {
    const parsedDescription = JSON.parse(serializedSessionDescriptionSchema.parse(description));

    return sessionDescriptionSchema.parse(parsedDescription);
  }
}
