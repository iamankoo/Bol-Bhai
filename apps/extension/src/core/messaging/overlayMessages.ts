import { z } from "zod";

export const OVERLAY_MESSAGE_TYPES = {
  showOverlay: "bol-bhai:show-overlay"
} as const;

export const showOverlayMessageSchema = z.object({
  type: z.literal(OVERLAY_MESSAGE_TYPES.showOverlay)
});

export type ShowOverlayMessage = z.infer<typeof showOverlayMessageSchema>;
