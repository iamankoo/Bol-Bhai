export const BUTTON_SIZE_PX = 56;
export const DEFAULT_OFFSET_PX = 20;
export const MIN_VIEWPORT_MARGIN_PX = 10;

export type OverlayPosition = {
  left: number;
  top: number;
};

export function getDefaultPosition(): OverlayPosition {
  return {
    left: window.innerWidth - BUTTON_SIZE_PX - DEFAULT_OFFSET_PX,
    top: DEFAULT_OFFSET_PX
  };
}
