import { randomUUID } from "node:crypto";
import type { EventBus } from "../../../core/events/eventBus.js";
import { EVENT_NAMES } from "../../../core/events/eventTypes.js";
import type { RoomStore } from "../storage/roomMemoryStore.js";
import { RoomError } from "../types/errors.js";
import type {
  LeaveRoomResult,
  Room,
  RoomMember,
  RoomMutationResult,
  RoomSummary
} from "../types/room.js";
import type { RoomCodeService } from "./roomCodeService.js";

const MAX_ROOM_MEMBERS = 20;

export type CreateRoomInput = {
  username: string;
};

export type JoinRoomInput = {
  roomCode: string;
  username: string;
};

export type LeaveRoomInput = {
  roomCode: string;
  memberId: string;
};

export type RoomService = {
  createRoom(input: CreateRoomInput): RoomMutationResult;
  joinRoom(input: JoinRoomInput): RoomMutationResult;
  leaveRoom(input: LeaveRoomInput): LeaveRoomResult;
  getRoom(roomCode: string): RoomSummary;
  listRooms(): RoomSummary[];
};

type RoomServiceDependencies = {
  roomStore: RoomStore;
  roomCodeService: RoomCodeService;
  eventBus: EventBus;
};

function createMember(username: string, isHost: boolean): RoomMember {
  return {
    id: randomUUID(),
    username,
    joinedAt: new Date().toISOString(),
    isHost
  };
}

function toRoomSummary(room: Room): RoomSummary {
  const host = room.members.find((member) => member.id === room.hostId);

  if (!host) {
    throw new RoomError("Room host is missing.", "MEMBER_NOT_FOUND", 500);
  }

  return {
    roomCode: room.roomCode,
    host,
    members: room.members
  };
}

function reassignHost(room: Room): Room {
  const [oldestMember] = room.members;

  if (!oldestMember) {
    return room;
  }

  const members = room.members.map((member) => ({
    ...member,
    isHost: member.id === oldestMember.id
  }));

  return {
    ...room,
    hostId: oldestMember.id,
    members
  };
}

function hasUsername(room: Room, username: string): boolean {
  const normalizedUsername = username.trim().toLowerCase();

  return room.members.some((member) => member.username.trim().toLowerCase() === normalizedUsername);
}

export function createRoomService({
  roomStore,
  roomCodeService,
  eventBus
}: RoomServiceDependencies): RoomService {
  return {
    createRoom({ username }) {
      const roomCode = roomCodeService.generateUniqueCode((code) => roomStore.has(code));
      const host = createMember(username, true);
      const room: Room = {
        roomCode,
        hostId: host.id,
        createdAt: new Date().toISOString(),
        members: [host],
        maxMembers: MAX_ROOM_MEMBERS
      };

      roomStore.save(room);
      eventBus.emit(EVENT_NAMES.roomCreated, {
        room: toRoomSummary(room),
        host
      });

      return {
        ...toRoomSummary(room),
        memberId: host.id
      };
    },

    joinRoom({ roomCode, username }) {
      const room = roomStore.get(roomCode);

      if (!room) {
        throw new RoomError("Room does not exist.", "ROOM_NOT_FOUND", 404);
      }

      if (room.members.length >= room.maxMembers) {
        throw new RoomError("Room is full.", "ROOM_FULL", 409);
      }

      if (hasUsername(room, username)) {
        throw new RoomError("Username is already in this room.", "DUPLICATE_USERNAME", 409);
      }

      const member = createMember(username, false);
      const updatedRoom: Room = {
        ...room,
        members: [...room.members, member]
      };

      roomStore.save(updatedRoom);
      eventBus.emit(EVENT_NAMES.roomJoined, {
        room: toRoomSummary(updatedRoom),
        member
      });

      return {
        ...toRoomSummary(updatedRoom),
        memberId: member.id
      };
    },

    leaveRoom({ roomCode, memberId }) {
      const room = roomStore.get(roomCode);

      if (!room) {
        throw new RoomError("Room does not exist.", "ROOM_NOT_FOUND", 404);
      }

      const leavingMember = room.members.find((member) => member.id === memberId);

      if (!leavingMember) {
        throw new RoomError("Member does not exist in this room.", "MEMBER_NOT_FOUND", 404);
      }

      const remainingMembers = room.members.filter((member) => member.id !== memberId);
      eventBus.emit(EVENT_NAMES.roomLeft, {
        roomCode,
        member: leavingMember,
        remainingMembers
      });

      if (remainingMembers.length === 0) {
        roomStore.delete(roomCode);
        eventBus.emit(EVENT_NAMES.roomDeleted, {
          roomCode,
          deletedBy: leavingMember
        });

        return {
          deleted: true,
          roomCode,
          host: null,
          members: []
        };
      }

      const updatedRoom = reassignHost({
        ...room,
        members: remainingMembers
      });

      roomStore.save(updatedRoom);

      if (room.hostId !== updatedRoom.hostId) {
        const previousHost = room.members.find((member) => member.id === room.hostId);
        const newHost = updatedRoom.members.find((member) => member.id === updatedRoom.hostId);

        if (previousHost && newHost) {
          eventBus.emit(EVENT_NAMES.hostChanged, {
            roomCode,
            previousHost,
            newHost
          });
        }
      }

      return {
        deleted: false,
        room: toRoomSummary(updatedRoom)
      };
    },

    getRoom(roomCode) {
      const room = roomStore.get(roomCode);

      if (!room) {
        throw new RoomError("Room does not exist.", "ROOM_NOT_FOUND", 404);
      }

      return toRoomSummary(room);
    },

    listRooms() {
      return roomStore.getAll().map(toRoomSummary);
    }
  };
}
