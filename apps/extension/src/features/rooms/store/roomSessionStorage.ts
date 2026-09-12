import { storage } from "wxt/utils/storage";
import { z } from "zod";
import type { RoomSession } from "../types/room";

const ROOM_SESSION_KEY = "local:bol-bhai-current-room-session";

const roomSessionSchema = z.object({
  roomCode: z.string().regex(/^IN\d{6}$/),
  memberId: z.string().min(1)
});

export const roomSessionStorage = {
  async get(): Promise<RoomSession | null> {
    const value = await storage.getItem<unknown>(ROOM_SESSION_KEY);
    const result = roomSessionSchema.safeParse(value);

    return result.success ? result.data : null;
  },

  async set(session: RoomSession): Promise<void> {
    await storage.setItem(ROOM_SESSION_KEY, roomSessionSchema.parse(session));
  },

  async clear(): Promise<void> {
    await storage.removeItem(ROOM_SESSION_KEY);
  }
};
