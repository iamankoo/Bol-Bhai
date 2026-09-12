import type { SignalingMessage } from "@bol-bhai/shared";
import type { RoomCode, RoomMember } from "../../rooms/types/room.js";
import type { REALTIME_CLIENT_EVENTS, REALTIME_SERVER_EVENTS } from "../events/realtimeEvents.js";

export type RealtimeJoinRoomPayload = {
  roomCode: RoomCode;
};

export type RealtimeLeaveRoomPayload = {
  roomCode: RoomCode;
};

export type RealtimeMemberJoinedPayload = {
  roomCode: RoomCode;
  member: RoomMember;
  members: RoomMember[];
};

export type RealtimeMemberLeftPayload = {
  roomCode: RoomCode;
  member: RoomMember;
  members: RoomMember[];
};

export type RealtimeHostChangedPayload = {
  roomCode: RoomCode;
  previousHost: RoomMember;
  newHost: RoomMember;
};

export type RealtimeRoomDeletedPayload = {
  roomCode: RoomCode;
};

export type RealtimePeerReadyPayload = {
  roomCode: RoomCode;
  socketId: string;
};

export type RealtimeSignalingPayload = {
  roomCode: RoomCode;
  message: SignalingMessage;
};

export type ServerToClientEvents = {
  [REALTIME_SERVER_EVENTS.connected]: (payload: { socketId: string }) => void;
  [REALTIME_SERVER_EVENTS.memberJoined]: (payload: RealtimeMemberJoinedPayload) => void;
  [REALTIME_SERVER_EVENTS.memberLeft]: (payload: RealtimeMemberLeftPayload) => void;
  [REALTIME_SERVER_EVENTS.hostChanged]: (payload: RealtimeHostChangedPayload) => void;
  [REALTIME_SERVER_EVENTS.roomDeleted]: (payload: RealtimeRoomDeletedPayload) => void;
  [REALTIME_SERVER_EVENTS.peerReady]: (payload: RealtimePeerReadyPayload) => void;
  [REALTIME_SERVER_EVENTS.signalingMessage]: (payload: RealtimeSignalingPayload) => void;
};

export type ClientToServerEvents = {
  [REALTIME_CLIENT_EVENTS.joinRoom]: (payload: RealtimeJoinRoomPayload) => void;
  [REALTIME_CLIENT_EVENTS.leaveRoom]: (payload: RealtimeLeaveRoomPayload) => void;
  [REALTIME_CLIENT_EVENTS.signalingMessage]: (payload: RealtimeSignalingPayload) => void;
};

export type InterServerEvents = Record<string, never>;
export type SocketData = Record<string, never>;
