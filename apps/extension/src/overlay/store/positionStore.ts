import { storageService } from "../../core/services/storageService";
import type { OverlayPosition } from "../utils/position";

export async function loadOverlayPosition(): Promise<OverlayPosition | null> {
  return storageService.getOverlayPosition();
}

export async function saveOverlayPosition(position: OverlayPosition): Promise<void> {
  await storageService.saveOverlayPosition(position);
}

export async function resetOverlayPosition(): Promise<void> {
  await storageService.resetOverlayPosition();
}
