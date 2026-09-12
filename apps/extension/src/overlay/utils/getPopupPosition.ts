import { BUTTON_SIZE_PX, MIN_VIEWPORT_MARGIN_PX, type OverlayPosition } from "./position";

const POPUP_WIDTH_PX = 340;
const POPUP_HEIGHT_PX = 272;
const POPUP_GAP_PX = 12;

export type PopupPosition = {
  left: number;
  top: number;
  origin: string;
};

export function getPopupPosition(buttonPosition: OverlayPosition): PopupPosition {
  const hasSpaceOnLeft =
    buttonPosition.left - POPUP_GAP_PX - POPUP_WIDTH_PX >= MIN_VIEWPORT_MARGIN_PX;
  const preferredLeft = hasSpaceOnLeft
    ? buttonPosition.left - POPUP_GAP_PX - POPUP_WIDTH_PX
    : buttonPosition.left + BUTTON_SIZE_PX + POPUP_GAP_PX;

  const maxLeft = Math.max(MIN_VIEWPORT_MARGIN_PX, window.innerWidth - POPUP_WIDTH_PX - MIN_VIEWPORT_MARGIN_PX);
  const maxTop = Math.max(MIN_VIEWPORT_MARGIN_PX, window.innerHeight - POPUP_HEIGHT_PX - MIN_VIEWPORT_MARGIN_PX);

  return {
    left: Math.min(Math.max(preferredLeft, MIN_VIEWPORT_MARGIN_PX), maxLeft),
    top: Math.min(Math.max(buttonPosition.top, MIN_VIEWPORT_MARGIN_PX), maxTop),
    origin: hasSpaceOnLeft ? "top right" : "top left"
  };
}
