import { APP_CONFIG } from "../../../core/config/appConfig";
import {
  apiErrorSchema,
  leaveRoomResultSchema,
  roomMutationResultSchema,
  roomSchema
} from "./roomSchemas";
import type { LeaveRoomResult, Room, RoomMutationResult } from "../types/room";

type CreateRoomRequest = {
  username: string;
};

type JoinRoomRequest = {
  roomCode: string;
  username: string;
};

type LeaveRoomRequest = {
  roomCode: string;
  memberId: string;
};

export class RoomApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string
  ) {
    super(message);
    this.name = "RoomApiError";
  }
}

export function isRoomNotFoundError(error: unknown): boolean {
  return error instanceof RoomApiError && error.statusCode === 404;
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  return response.json() as Promise<unknown>;
}

async function requestJson(endpoint: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${APP_CONFIG.apiBaseUrl}${endpoint}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers
    }
  });
  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    const errorResult = apiErrorSchema.safeParse(payload);
    throw new RoomApiError(
      errorResult.success ? errorResult.data.message : "Room request failed.",
      response.status,
      errorResult.success ? errorResult.data.error : "ROOM_REQUEST_FAILED"
    );
  }

  return payload;
}

export const roomsApi = {
  async createRoom(input: CreateRoomRequest): Promise<RoomMutationResult> {
    const payload = await requestJson("/api/rooms/create", {
      method: "POST",
      body: JSON.stringify(input)
    });

    return roomMutationResultSchema.parse(payload);
  },

  async joinRoom(input: JoinRoomRequest): Promise<RoomMutationResult> {
    const payload = await requestJson("/api/rooms/join", {
      method: "POST",
      body: JSON.stringify(input)
    });

    return roomMutationResultSchema.parse(payload);
  },

  async leaveRoom(input: LeaveRoomRequest): Promise<LeaveRoomResult> {
    const payload = await requestJson("/api/rooms/leave", {
      method: "POST",
      body: JSON.stringify(input)
    });

    return leaveRoomResultSchema.parse(payload);
  },

  async getRoom(roomCode: string): Promise<Room> {
    const payload = await requestJson(`/api/rooms/${roomCode}`);

    return roomSchema.parse(payload);
  }
};
