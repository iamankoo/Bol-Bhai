export type RoomErrorCode =
  | "ROOM_NOT_FOUND"
  | "ROOM_FULL"
  | "DUPLICATE_USERNAME"
  | "MEMBER_NOT_FOUND"
  | "VALIDATION_FAILED";

export class RoomError extends Error {
  constructor(
    message: string,
    readonly code: RoomErrorCode,
    readonly statusCode: number
  ) {
    super(message);
    this.name = "RoomError";
  }
}
