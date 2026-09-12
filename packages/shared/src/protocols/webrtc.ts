export const WEBRTC_EVENTS = {
  peerConnecting: "webrtc:peer-connecting",
  peerConnected: "webrtc:peer-connected",
  peerDisconnected: "webrtc:peer-disconnected",
  trackAdded: "webrtc:track-added",
  trackRemoved: "webrtc:track-removed"
} as const;

export type WebRtcEventName = (typeof WEBRTC_EVENTS)[keyof typeof WEBRTC_EVENTS];
