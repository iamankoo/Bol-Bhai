import { BUTTON_SIZE_PX, MIN_VIEWPORT_MARGIN_PX, type OverlayPosition } from "./position";

export function clampPosition(position: OverlayPosition): OverlayPosition {
  const maxLeft = Math.max(MIN_VIEWPORT_MARGIN_PX, window.innerWidth - BUTTON_SIZE_PX - MIN_VIEWPORT_MARGIN_PX);
  const maxTop = Math.max(MIN_VIEWPORT_MARGIN_PX, window.innerHeight - BUTTON_SIZE_PX - MIN_VIEWPORT_MARGIN_PX);

  return {
    left: Math.min(Math.max(position.left, MIN_VIEWPORT_MARGIN_PX), maxLeft),
    top: Math.min(Math.max(position.top, MIN_VIEWPORT_MARGIN_PX), maxTop)
  };
}
