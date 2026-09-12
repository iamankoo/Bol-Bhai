export const VOICE_EVENTS = {
  stateChanged: "voice:state-changed",
  participantMuted: "voice:participant-muted",
  participantUnmuted: "voice:participant-unmuted",
  speakingStarted: "voice:speaking-started",
  speakingStopped: "voice:speaking-stopped"
} as const;

export type VoiceEventName = (typeof VOICE_EVENTS)[keyof typeof VOICE_EVENTS];
