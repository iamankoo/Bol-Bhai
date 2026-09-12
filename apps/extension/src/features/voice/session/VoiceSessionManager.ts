import type { Room, RoomMember } from "../../rooms";
import { mediaService, remoteAudioService } from "../media";
import type {
  AnswerMessage,
  IceCandidateMessage,
  OfferMessage,
  SignalingMessage
} from "../signaling";
import { SIGNALING_MESSAGE_TYPES, SignalingService } from "../signaling";
import { type PeerState, useMediaStore, useVoiceSessionStore } from "../store";
import { logDev } from "../utils";
import {
  AnswerService,
  IceCandidateService,
  NegotiationCoordinator,
  OfferService,
  PeerConnectionManager,
  NEGOTIATION_CONNECTION_STATES,
  type NegotiationContextProvider,
  type NegotiationMessageContext,
  type NegotiationConnectionState,
  type PeerId
} from "../webrtc";
import { RealtimeSignalingTransport } from "./RealtimeSignalingTransport";

type VoiceSessionState = {
  room: Room;
  localMemberId: string;
};

class VoiceSessionContextProvider implements NegotiationContextProvider {
  constructor(private readonly getState: () => VoiceSessionState | null) {}

  getMessageContext(peerId: PeerId): NegotiationMessageContext {
    const state = this.getState();

    if (!state) {
      throw new Error("Voice session is not active.");
    }

    return {
      roomCode: state.room.roomCode,
      localMemberId: state.localMemberId,
      targetMemberId: peerId
    };
  }
}

export class VoiceSessionManager {
  private sessionState: VoiceSessionState | null = null;
  private readonly peerConnectionManager = new PeerConnectionManager();
  private readonly contextProvider = new VoiceSessionContextProvider(() => this.sessionState);
  private readonly iceCandidateService = new IceCandidateService({
    peerConnectionManager: this.peerConnectionManager,
    contextProvider: this.contextProvider
  });
  private readonly negotiationCoordinator = new NegotiationCoordinator({
    offerService: new OfferService({
      peerConnectionManager: this.peerConnectionManager,
      contextProvider: this.contextProvider
    }),
    answerService: new AnswerService({
      peerConnectionManager: this.peerConnectionManager,
      contextProvider: this.contextProvider
    }),
    iceCandidateService: this.iceCandidateService
  });
  private readonly signalingService = new SignalingService({
    transport: new RealtimeSignalingTransport()
  });

  private readonly peerIds = new Set<PeerId>();
  private readonly negotiatedPeerIds = new Set<PeerId>();
  private readonly controlChannelPeerIds = new Set<PeerId>();
  private readonly renegotiatingPeerIds = new Set<PeerId>();
  private readonly pendingRenegotiationPeerIds = new Set<PeerId>();
  private readonly iceCandidateUnsubscribers = new Map<PeerId, () => void>();
  private unsubscribeSignalingMessages: (() => void) | null = null;
  private unsubscribeMediaStore: (() => void) | null = null;

  async start(room: Room, localMemberId: string): Promise<void> {
    logDev("VoiceSessionManager: Starting voice session for room", room.roomCode);
    this.sessionState = { room, localMemberId };

    const memberIds = room.members.map((m) => m.id);
    useVoiceSessionStore.getState().setParticipants(memberIds);

    this.subscribeToSignalingMessages();
    this.subscribeToMediaStore();

    await this.signalingService.connect();
  }

  async syncRoom(room: Room): Promise<void> {
    if (!this.sessionState) {
      return;
    }

    this.sessionState = {
      ...this.sessionState,
      room
    };

    const memberIds = room.members.map((m) => m.id);
    useVoiceSessionStore.getState().setParticipants(memberIds);

    const activePeerIds = new Set(
      room.members
        .filter((member) => member.id !== this.sessionState?.localMemberId)
        .map((member) => member.id)
    );

    for (const peerId of activePeerIds) {
      await this.ensurePeer(peerId);
    }

    for (const peerId of this.peerIds) {
      if (!activePeerIds.has(peerId)) {
        this.removePeer(peerId);
      }
    }
  }

  async destroy(): Promise<void> {
    logDev("VoiceSessionManager: Destroying voice session");

    this.unsubscribeSignalingMessages?.();
    this.unsubscribeSignalingMessages = null;

    this.unsubscribeMediaStore?.();
    this.unsubscribeMediaStore = null;

    for (const unsubscribe of this.iceCandidateUnsubscribers.values()) {
      unsubscribe();
    }

    this.iceCandidateUnsubscribers.clear();
    this.peerIds.clear();
    this.negotiatedPeerIds.clear();
    this.controlChannelPeerIds.clear();
    this.renegotiatingPeerIds.clear();
    this.pendingRenegotiationPeerIds.clear();

    remoteAudioService.destroy();
    this.peerConnectionManager.destroyAll();
    this.signalingService.disconnect();

    useVoiceSessionStore.getState().resetSession();
    this.sessionState = null;
  }

  private async ensurePeer(peerId: PeerId, shouldStartOffer = true): Promise<void> {
    const state = this.sessionState;

    if (!state || this.peerIds.has(peerId)) {
      return;
    }

    logDev("Peer Created", { peerId, shouldStartOffer });
    const connection = this.peerConnectionManager.create(peerId);
    this.peerIds.add(peerId);

    useVoiceSessionStore.getState().setPeerState(peerId, "new");
    this.bindPeerConnectionState(peerId, connection);
    this.bindRemoteTracks(peerId, connection);
    this.bindRenegotiation(peerId, connection);
    this.attachLocalTracksToPeer(connection);
    this.listenForLocalIce(peerId);

    if (shouldStartOffer && this.shouldInitiateNegotiation(state.localMemberId, peerId)) {
      this.ensureControlChannel(peerId, connection);
      await this.startNegotiation(peerId);
    }
  }

  private removePeer(peerId: PeerId): void {
    logDev("Peer Removed", { peerId });

    this.iceCandidateUnsubscribers.get(peerId)?.();
    this.iceCandidateUnsubscribers.delete(peerId);
    this.peerIds.delete(peerId);
    this.negotiatedPeerIds.delete(peerId);
    this.controlChannelPeerIds.delete(peerId);
    this.renegotiatingPeerIds.delete(peerId);
    this.pendingRenegotiationPeerIds.delete(peerId);
    this.iceCandidateService.clearPendingIceCandidates(peerId);

    remoteAudioService.detachRemoteStream(peerId);
    this.peerConnectionManager.destroy(peerId);
    useVoiceSessionStore.getState().removePeerState(peerId);
  }

  private bindPeerConnectionState(peerId: PeerId, connection: RTCPeerConnection): void {
    const updateState = () => {
      const pState = this.calculatePeerState(connection);
      useVoiceSessionStore.getState().setPeerState(peerId, pState);

      this.negotiationCoordinator.setState(
        peerId,
        this.toNegotiationConnectionState(connection.connectionState)
      );

      if (connection.connectionState === "connected") {
        logDev("Connection Connected", { peerId });
      }
      if (
        connection.iceConnectionState === "connected" ||
        connection.iceConnectionState === "completed"
      ) {
        logDev("ICE Connected", { peerId, iceState: connection.iceConnectionState });
      }

      // A local track added while this peer was still connecting can get its
      // negotiationneeded event dropped (see handleRenegotiationNeeded) since
      // the browser only re-fires that event based on signalingState, not our
      // app-level "connected" gate. Retry it now that the gate is open.
      if (pState === "connected" && this.pendingRenegotiationPeerIds.has(peerId)) {
        this.pendingRenegotiationPeerIds.delete(peerId);
        void this.handleRenegotiationNeeded(peerId);
      }
    };

    connection.onconnectionstatechange = updateState;
    connection.oniceconnectionstatechange = updateState;
  }

  private calculatePeerState(connection: RTCPeerConnection): PeerState {
    const connState = connection.connectionState;
    const iceState = connection.iceConnectionState;

    if (connState === "failed" || iceState === "failed") {
      return "failed";
    }
    if (connState === "closed" || iceState === "closed") {
      return "closed";
    }
    if (connState === "connected" || iceState === "connected" || iceState === "completed") {
      return "connected";
    }
    if (connState === "connecting" || iceState === "checking") {
      return "connecting";
    }
    if (connState === "disconnected" || iceState === "disconnected") {
      return "disconnected";
    }

    return "new";
  }

  private bindRemoteTracks(peerId: PeerId, connection: RTCPeerConnection): void {
    connection.ontrack = (event) => {
      logDev("Remote Track Received", { peerId, trackKind: event.track.kind });

      // Chrome-only hint (not in the standard RTCRtpReceiver typings) telling
      // the jitter buffer to minimize how much it buffers before playout,
      // trading a little robustness against network jitter for lower latency
      // — this is what "no buffering" actually means for a live audio track.
      const receiver = event.receiver as RTCRtpReceiver & { playoutDelayHint?: number };
      if ("playoutDelayHint" in receiver) {
        receiver.playoutDelayHint = 0;
      }

      if (event.streams[0]) {
        remoteAudioService.attachRemoteStream(peerId, event.streams[0]);
      }
    };
  }

  private bindRenegotiation(peerId: PeerId, connection: RTCPeerConnection): void {
    connection.onnegotiationneeded = () => {
      void this.handleRenegotiationNeeded(peerId);
    };
  }

  private async handleRenegotiationNeeded(peerId: PeerId): Promise<void> {
    const connection = this.peerConnectionManager.get(peerId);

    if (!connection || !this.sessionState) {
      return;
    }

    if (connection.signalingState !== "stable") {
      // Another SDP exchange is in flight; the browser re-fires
      // negotiationneeded on its own once signalingState returns to
      // "stable", so there is nothing to track here.
      return;
    }

    // Only renegotiate once the initial offer/answer/ICE handshake has fully
    // completed; firing here mid-handshake would race the first offer. Unlike
    // signalingState, "connected" is an app-level gate the browser doesn't
    // know about, so it will NOT re-fire negotiationneeded once this later
    // becomes true (e.g. a user enabling their mic while ICE is still
    // connecting would otherwise have that track silently never sent — see
    // bindPeerConnectionState, which flushes this once the peer connects).
    const peerState = useVoiceSessionStore.getState().peerStates[peerId];
    if (peerState !== "connected") {
      this.pendingRenegotiationPeerIds.add(peerId);
      return;
    }

    if (this.renegotiatingPeerIds.has(peerId)) {
      return;
    }

    this.renegotiatingPeerIds.add(peerId);

    try {
      logDev("Renegotiation Started", { peerId });
      const result = await this.negotiationCoordinator.startNegotiation(peerId);
      await this.signalingService.send(result.offer);
    } catch (error) {
      logDev("Renegotiation Failed", { peerId, error });
    } finally {
      this.renegotiatingPeerIds.delete(peerId);
    }
  }

  private attachLocalTracksToPeer(connection: RTCPeerConnection): void {
    const localStream = mediaService.getStream();

    if (!localStream) {
      return;
    }

    const currentSenders = connection.getSenders();

    for (const track of localStream.getAudioTracks()) {
      const hasSender = currentSenders.some((sender) => sender.track?.id === track.id);
      if (!hasSender) {
        connection.addTrack(track, localStream);
      }
    }
  }

  private attachLocalTracksToAllPeers(stream: MediaStream): void {
    const audioTrack = stream.getAudioTracks()[0];

    if (!audioTrack) {
      return;
    }

    for (const peerId of this.peerIds) {
      const connection = this.peerConnectionManager.get(peerId);
      if (!connection) {
        continue;
      }

      const senders = connection.getSenders();
      const audioSender = senders.find((s) => s.track?.kind === "audio");

      if (audioSender) {
        void audioSender.replaceTrack(audioTrack);
      } else {
        connection.addTrack(audioTrack, stream);
      }
    }
  }

  private detachLocalTracksFromAllPeers(): void {
    for (const peerId of this.peerIds) {
      const connection = this.peerConnectionManager.get(peerId);
      if (!connection) {
        continue;
      }

      for (const sender of connection.getSenders()) {
        if (sender.track?.kind === "audio") {
          void sender.replaceTrack(null);
        }
      }
    }
  }

  private subscribeToMediaStore(): void {
    if (this.unsubscribeMediaStore) {
      return;
    }

    let previousStream = useMediaStore.getState().stream;

    this.unsubscribeMediaStore = useMediaStore.subscribe((state) => {
      useVoiceSessionStore.getState().setMuted(state.isMuted);

      if (state.stream !== previousStream) {
        previousStream = state.stream;
        if (state.stream) {
          this.attachLocalTracksToAllPeers(state.stream);
        } else {
          this.detachLocalTracksFromAllPeers();
        }
      }
    });
  }

  private listenForLocalIce(peerId: PeerId): void {
    if (this.iceCandidateUnsubscribers.has(peerId)) {
      return;
    }

    const unsubscribe = this.iceCandidateService.listenForLocalIceCandidates(
      peerId,
      async (message) => {
        logDev("ICE Candidate Sent", { peerId, messageId: message.id });
        await this.signalingService.send(message);
      }
    );

    this.iceCandidateUnsubscribers.set(peerId, unsubscribe);
  }

  private ensureControlChannel(peerId: PeerId, connection: RTCPeerConnection): void {
    if (this.controlChannelPeerIds.has(peerId)) {
      return;
    }

    connection.createDataChannel("bol-bhai-control");
    this.controlChannelPeerIds.add(peerId);
  }

  private async startNegotiation(peerId: PeerId): Promise<void> {
    const peerState = useVoiceSessionStore.getState().peerStates[peerId];
    if (
      this.negotiatedPeerIds.has(peerId) &&
      (peerState === "connected" || peerState === "connecting")
    ) {
      return;
    }

    this.negotiatedPeerIds.add(peerId);
    logDev("[1] VoiceSessionManager: Offer Sent", { peerId });
    const result = await this.negotiationCoordinator.startNegotiation(peerId);
    await this.signalingService.send(result.offer);
  }

  private subscribeToSignalingMessages(): void {
    if (this.unsubscribeSignalingMessages) {
      return;
    }

    this.unsubscribeSignalingMessages = this.signalingService.onMessage((message) => {
      void this.handleSignalingMessage(message);
    });
  }

  private async handleSignalingMessage(message: SignalingMessage): Promise<void> {
    const state = this.sessionState;

    if (!state || message.senderId === state.localMemberId) {
      return;
    }

    if (!this.isMessageForLocalMember(message, state.localMemberId)) {
      return;
    }

    const peerId = message.senderId;
    logDev("[10] VoiceSessionManager: handleSignalingMessage invoked", {
      type: message.type,
      senderId: peerId
    });

    await this.ensurePeer(peerId, false);

    if (message.type === SIGNALING_MESSAGE_TYPES.offer) {
      logDev("Offer Received", { peerId, messageId: message.id });
      await this.handleOffer(peerId, message);
      return;
    }

    if (message.type === SIGNALING_MESSAGE_TYPES.answer) {
      logDev("Answer Received", { peerId, messageId: message.id });
      await this.handleAnswer(peerId, message);
      return;
    }

    if (message.type === SIGNALING_MESSAGE_TYPES.candidate) {
      logDev("ICE Candidate Received", { peerId, messageId: message.id });
      await this.handleIce(peerId, message);
    }
  }

  private async handleOffer(peerId: PeerId, message: OfferMessage): Promise<void> {
    const result = await this.negotiationCoordinator.handleRemoteOffer(peerId, message);
    logDev("[1] VoiceSessionManager: Answer Sent", { peerId });
    await this.signalingService.send(result.answer);
  }

  private async handleAnswer(peerId: PeerId, message: AnswerMessage): Promise<void> {
    await this.negotiationCoordinator.handleRemoteAnswer(peerId, message);
  }

  private async handleIce(peerId: PeerId, message: IceCandidateMessage): Promise<void> {
    await this.negotiationCoordinator.handleRemoteIce(peerId, message);
  }

  private isMessageForLocalMember(message: SignalingMessage, localMemberId: string): boolean {
    if (
      message.type === SIGNALING_MESSAGE_TYPES.offer ||
      message.type === SIGNALING_MESSAGE_TYPES.answer ||
      message.type === SIGNALING_MESSAGE_TYPES.candidate
    ) {
      return message.payload.targetMemberId === localMemberId;
    }

    return false;
  }

  private findRoomMember(memberId: string): RoomMember | null {
    return this.sessionState?.room.members.find((member) => member.id === memberId) ?? null;
  }

  private shouldInitiateNegotiation(localMemberId: string, peerId: PeerId): boolean {
    return localMemberId.localeCompare(peerId) < 0;
  }

  private toNegotiationConnectionState(state: RTCPeerConnectionState): NegotiationConnectionState {
    if (state === "connected") {
      return NEGOTIATION_CONNECTION_STATES.connected;
    }

    if (state === "connecting") {
      return NEGOTIATION_CONNECTION_STATES.connecting;
    }

    if (state === "disconnected") {
      return NEGOTIATION_CONNECTION_STATES.disconnected;
    }

    if (state === "failed") {
      return NEGOTIATION_CONNECTION_STATES.failed;
    }

    if (state === "closed") {
      return NEGOTIATION_CONNECTION_STATES.closed;
    }

    return NEGOTIATION_CONNECTION_STATES.stable;
  }
}

export const voiceSessionManager = new VoiceSessionManager();
