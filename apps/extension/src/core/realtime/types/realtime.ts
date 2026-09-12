export type RoomCode = string;

export type RealtimeConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting";

export type RealtimeMember = {
  id: string;
  username: string;
  joinedAt: string;
  isHost: boolean;
};

export type RealtimeJoinRoomPayload = {
  roomCode: RoomCode;
};

export type RealtimeLeaveRoomPayload = {
  roomCode: RoomCode;
};

export type RealtimeMemberJoinedPayload = {
  roomCode: RoomCode;
  member: RealtimeMember;
  members: RealtimeMember[];
};

export type RealtimeMemberLeftPayload = {
  roomCode: RoomCode;
  member: RealtimeMember;
  members: RealtimeMember[];
};

export type RealtimeHostChangedPayload = {
  roomCode: RoomCode;
  previousHost: RealtimeMember;
  newHost: RealtimeMember;
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
  message: unknown;
};

export type ServerToClientEvents = {
  "connection:ready": (payload: { socketId: string }) => void;
  "room:member-joined": (payload: RealtimeMemberJoinedPayload) => void;
  "room:member-left": (payload: RealtimeMemberLeftPayload) => void;
  "room:host-changed": (payload: RealtimeHostChangedPayload) => void;
  "room:deleted": (payload: RealtimeRoomDeletedPayload) => void;
  "voice:peer-ready": (payload: RealtimePeerReadyPayload) => void;
  "voice:signal": (payload: RealtimeSignalingPayload) => void;
};

export type ClientToServerEvents = {
  "room:join": (payload: RealtimeJoinRoomPayload) => void;
  "room:leave": (payload: RealtimeLeaveRoomPayload) => void;
  "voice:signal": (payload: RealtimeSignalingPayload) => void;
};
