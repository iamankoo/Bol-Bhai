export const REALTIME_CLIENT_EVENTS = {
  joinRoom: "room:join",
  leaveRoom: "room:leave",
  signalingMessage: "voice:signal"
} as const;

export const REALTIME_SERVER_EVENTS = {
  connected: "connection:ready",
  memberJoined: "room:member-joined",
  memberLeft: "room:member-left",
  hostChanged: "room:host-changed",
  roomDeleted: "room:deleted",
  peerReady: "voice:peer-ready",
  signalingMessage: "voice:signal"
} as const;
