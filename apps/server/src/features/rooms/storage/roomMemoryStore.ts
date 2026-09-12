import type { Room, RoomCode } from "../types/room.js";

export type RoomStore = {
  get(roomCode: RoomCode): Room | null;
  getAll(): Room[];
  has(roomCode: RoomCode): boolean;
  save(room: Room): void;
  delete(roomCode: RoomCode): void;
};

function cloneRoom(room: Room): Room {
  return {
    ...room,
    members: room.members.map((member) => ({ ...member }))
  };
}

export class RoomMemoryStore implements RoomStore {
  private readonly rooms = new Map<RoomCode, Room>();

  get(roomCode: RoomCode): Room | null {
    const room = this.rooms.get(roomCode);

    return room ? cloneRoom(room) : null;
  }

  getAll(): Room[] {
    return Array.from(this.rooms.values(), cloneRoom);
  }

  has(roomCode: RoomCode): boolean {
    return this.rooms.has(roomCode);
  }

  save(room: Room): void {
    this.rooms.set(room.roomCode, cloneRoom(room));
  }

  delete(roomCode: RoomCode): void {
    this.rooms.delete(roomCode);
  }
}
