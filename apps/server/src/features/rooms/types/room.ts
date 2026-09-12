export type RoomCode = string;

export type RoomMember = {
  id: string;
  username: string;
  joinedAt: string;
  isHost: boolean;
};

export type Room = {
  roomCode: RoomCode;
  hostId: string;
  createdAt: string;
  members: RoomMember[];
  maxMembers: number;
};

export type RoomSummary = {
  roomCode: RoomCode;
  host: RoomMember;
  members: RoomMember[];
};

export type RoomMutationResult = RoomSummary & {
  memberId: string;
};

export type LeaveRoomResult =
  | {
      deleted: false;
      room: RoomSummary;
    }
  | {
      deleted: true;
      roomCode: RoomCode;
      host: null;
      members: [];
    };
