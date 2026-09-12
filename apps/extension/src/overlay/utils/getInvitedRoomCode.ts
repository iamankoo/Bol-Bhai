import { roomCodeSchema } from "../../features/rooms/api/roomSchemas";

/**
 * Reads the room code a Bol Bhai join-invite page (see apps/server join route)
 * embeds in a <meta name="bol-bhai-room-code"> tag, so the overlay can prefill
 * the join form instead of the user retyping a code from WhatsApp.
 */
export function getInvitedRoomCode(): string | null {
  const meta = document.querySelector('meta[name="bol-bhai-room-code"]');
  const content = meta?.getAttribute("content");

  if (!content) {
    return null;
  }

  const result = roomCodeSchema.safeParse(content);
  return result.success ? result.data : null;
}
