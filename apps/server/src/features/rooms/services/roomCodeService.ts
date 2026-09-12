import { randomInt } from "node:crypto";
import type { RoomCode } from "../types/room.js";

const ROOM_CODE_PREFIX = "IN";
const ROOM_CODE_DIGITS = 6;
const ROOM_CODE_MAX_ATTEMPTS = 100;

export type RoomCodeService = {
  generateUniqueCode: (exists: (roomCode: RoomCode) => boolean) => RoomCode;
};

export function createRoomCodeService(): RoomCodeService {
  return {
    generateUniqueCode(exists) {
      for (let attempt = 0; attempt < ROOM_CODE_MAX_ATTEMPTS; attempt += 1) {
        const digits = randomInt(0, 1_000_000).toString().padStart(ROOM_CODE_DIGITS, "0");
        const roomCode = `${ROOM_CODE_PREFIX}${digits}`;

        if (!exists(roomCode)) {
          return roomCode;
        }
      }

      throw new Error("Unable to generate a unique room code.");
    }
  };
}
