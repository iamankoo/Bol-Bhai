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

type AnswerServiceDependencies = {
  peerConnectionManager: PeerConnectionManager;
  contextProvider: NegotiationContextProvider;
};

export class AnswerService {
  constructor(private readonly dependencies: AnswerServiceDependencies) {}

  async applyRemoteOffer(peerId: PeerId, message: OfferMessage): Promise<void> {
    const validatedMessage = offerMessageSchema.parse(message);
    const connection = this.dependencies.peerConnectionManager.create(peerId);

    await connection.setRemoteDescription(
      this.deserializeOffer(validatedMessage.payload.description)
    );
  }

  async createAnswer(peerId: PeerId, offer: OfferMessage): Promise<AnswerMessage> {
    await this.applyRemoteOffer(peerId, offer);

    const connection = this.dependencies.peerConnectionManager.create(peerId);
    const answer = await connection.createAnswer();

    await this.setLocalDescription(peerId, answer);
    logDev("Answer Created", { peerId });

    const context = this.dependencies.contextProvider.getMessageContext(peerId);
    const message: AnswerMessage = {
      id: crypto.randomUUID(),
      type: SIGNALING_MESSAGE_TYPES.answer,
      roomCode: context.roomCode,
      senderId: context.localMemberId,
      sentAt: new Date().toISOString(),
      payload: {
        targetMemberId: context.targetMemberId,
        description: this.serializeAnswer(answer)
      }
    };

    return answerMessageSchema.parse(message);
  }

  async setLocalDescription(
    peerId: PeerId,
    description: RTCSessionDescriptionInit
  ): Promise<void> {
    const connection = this.dependencies.peerConnectionManager.create(peerId);
    await connection.setLocalDescription(description);
  }

  serializeAnswer(description: RTCSessionDescriptionInit): string {
    return serializedSessionDescriptionSchema.parse(JSON.stringify(description));
  }

  private deserializeOffer(description: string): RTCSessionDescriptionInit {
    const parsedDescription = JSON.parse(serializedSessionDescriptionSchema.parse(description));

    return sessionDescriptionSchema.parse(parsedDescription);
  }
}
