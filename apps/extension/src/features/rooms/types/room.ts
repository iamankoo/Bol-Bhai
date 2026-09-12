import type { RealtimeConnectionStatus } from "../../../core/realtime";

export type RoomMember = {
  id: string;
  username: string;
  joinedAt: string;
  isHost: boolean;
};

export type Room = {
  roomCode: string;
  host: RoomMember;
  members: RoomMember[];
};

export type RoomMutationResult = Room & {
  memberId: string;
};

export type LeaveRoomResult =
  | {
      deleted: false;
      room: Room;
    }
  | {
      deleted: true;
      roomCode: string;
      host: null;
      members: [];
    };

export type RoomSession = {
  roomCode: string;
  memberId: string;
};

export type ConnectionStatus = RealtimeConnectionStatus;
