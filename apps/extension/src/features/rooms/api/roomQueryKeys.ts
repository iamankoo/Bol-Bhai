export const roomQueryKeys = {
  session: ["rooms", "session"] as const,
  detail(roomCode: string) {
    return ["rooms", "detail", roomCode] as const;
  }
};
