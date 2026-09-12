import type { AnswerMessage, IceCandidateMessage, OfferMessage } from "../../signaling/types";
import {
  answerMessageSchema,
  iceCandidateMessageSchema,
  offerMessageSchema
} from "../../signaling/validators";
import type { AnswerService } from "../answer";
import type { IceCandidateService } from "../ice";
import type { OfferService } from "../offer";
import {
  NEGOTIATION_CONNECTION_STATES,
  type NegotiationConnectionState,
  type PeerId,
  type RemoteAnswerResult,
  type RemoteIceResult,
  type RemoteOfferResult,
  type StartNegotiationResult
} from "../types";

type NegotiationCoordinatorDependencies = {
  offerService: OfferService;
  answerService: AnswerService;
  iceCandidateService: IceCandidateService;
};

export class NegotiationCoordinator {
  private readonly states = new Map<PeerId, NegotiationConnectionState>();

  constructor(private readonly dependencies: NegotiationCoordinatorDependencies) {}

  async startNegotiation(peerId: PeerId): Promise<StartNegotiationResult> {
    this.setState(peerId, NEGOTIATION_CONNECTION_STATES.connecting);

    const offer = await this.dependencies.offerService.createOffer(peerId);
    await this.dependencies.iceCandidateService.flushRemoteIceCandidateQueue(peerId);
    this.setState(peerId, NEGOTIATION_CONNECTION_STATES.haveLocalOffer);

    return {
      state: this.getState(peerId),
      offer
    };
  }

  async handleRemoteOffer(peerId: PeerId, message: OfferMessage): Promise<RemoteOfferResult> {
    const offer = offerMessageSchema.parse(message);

    this.setState(peerId, NEGOTIATION_CONNECTION_STATES.haveRemoteOffer);
    const answer = await this.dependencies.answerService.createAnswer(peerId, offer);
    await this.dependencies.iceCandidateService.flushRemoteIceCandidateQueue(peerId);
    this.setState(peerId, NEGOTIATION_CONNECTION_STATES.connecting);

    return {
      state: this.getState(peerId),
      answer
    };
  }

  async handleRemoteAnswer(peerId: PeerId, message: AnswerMessage): Promise<RemoteAnswerResult> {
    const answer = answerMessageSchema.parse(message);

    await this.dependencies.offerService.applyRemoteAnswer(peerId, answer);
    await this.dependencies.iceCandidateService.flushRemoteIceCandidateQueue(peerId);
    this.setState(peerId, NEGOTIATION_CONNECTION_STATES.connecting);

    return {
      state: this.getState(peerId)
    };
  }

  async handleRemoteIce(peerId: PeerId, message: IceCandidateMessage): Promise<RemoteIceResult> {
    const candidate = iceCandidateMessageSchema.parse(message);

    await this.dependencies.iceCandidateService.applyRemoteIceCandidate(peerId, candidate);

    return {
      state: this.getState(peerId)
    };
  }

  getState(peerId: PeerId): NegotiationConnectionState {
    return this.states.get(peerId) ?? NEGOTIATION_CONNECTION_STATES.stable;
  }

  setState(peerId: PeerId, state: NegotiationConnectionState): void {
    this.states.set(peerId, state);
  }
}
