import type { RoomCode, RoomMember, RoomSummary } from "../../features/rooms/types/room.js";

export const EVENT_NAMES = {
  roomCreated: "ROOM_CREATED",
  roomJoined: "ROOM_JOINED",
  roomLeft: "ROOM_LEFT",
  roomDeleted: "ROOM_DELETED",
  hostChanged: "HOST_CHANGED"
} as const;

export type EventName = (typeof EVENT_NAMES)[keyof typeof EVENT_NAMES];

export type AppEventPayloads = {
  ROOM_CREATED: {
    room: RoomSummary;
    host: RoomMember;
  };
  ROOM_JOINED: {
    room: RoomSummary;
    member: RoomMember;
  };
  ROOM_LEFT: {
    roomCode: RoomCode;
    member: RoomMember;
    remainingMembers: RoomMember[];
  };
  ROOM_DELETED: {
    roomCode: RoomCode;
    deletedBy: RoomMember;
  };
  HOST_CHANGED: {
    roomCode: RoomCode;
    previousHost: RoomMember;
    newHost: RoomMember;
  };
};

export type AppEvent<Event extends EventName = EventName> = {
  [Name in EventName]: {
    name: Name;
    payload: AppEventPayloads[Name];
    occurredAt: string;
  };
}[Event];

export type EventHandler<Event extends EventName> = (event: AppEvent<Event>) => void | Promise<void>;
