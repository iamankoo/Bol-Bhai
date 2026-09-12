import { memo, useCallback, useEffect, useRef, useState } from "react";
import { FloatingMicButton } from "./FloatingMicButton";
import { OverlayPopup } from "./OverlayPopup";
import { useFloatingOverlay } from "../hooks/useFloatingOverlay";
import { getPopupPosition } from "../utils/getPopupPosition";
import { getInvitedRoomCode } from "../utils/getInvitedRoomCode";
import { OVERLAY_MESSAGE_TYPES, showOverlayMessageSchema } from "../../core/messaging";

const AUTO_HIDE_DELAY_MS = 5000;

export const OverlayRoot = memo(function OverlayRoot() {
  const invitedRoomCodeRef = useRef(getInvitedRoomCode());
  const [isPopupOpen, setIsPopupOpen] = useState(() => invitedRoomCodeRef.current !== null);
  const [isVisible, setIsVisible] = useState(true);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoHideTimer = useCallback(() => {
    if (autoHideTimerRef.current !== null) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  }, []);

  const armAutoHideTimer = useCallback(() => {
    clearAutoHideTimer();
    autoHideTimerRef.current = setTimeout(() => {
      autoHideTimerRef.current = null;
      setIsVisible(false);
    }, AUTO_HIDE_DELAY_MS);
  }, [clearAutoHideTimer]);

  // The overlay briefly announces itself on every appearance (fresh page load or a
  // manual reopen) and fades on its own if the user never interacts with it. Opening
  // the popup counts as interaction and cancels the timer for the rest of this mount.
  useEffect(() => {
    if (!isVisible || isPopupOpen) {
      clearAutoHideTimer();
      return;
    }

    armAutoHideTimer();

    return clearAutoHideTimer;
  }, [armAutoHideTimer, clearAutoHideTimer, isPopupOpen, isVisible]);

  // A click on the extension's toolbar icon is the only way to bring the overlay
  // back after it auto-hid or was minimized, since there is no other visible affordance.
  useEffect(() => {
    const handleMessage = (message: unknown) => {
      const result = showOverlayMessageSchema.safeParse(message);

      if (result.success && result.data.type === OVERLAY_MESSAGE_TYPES.showOverlay) {
        setIsVisible(true);
      }
    };

    browser.runtime.onMessage.addListener(handleMessage);

    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const { position, containerRef, buttonHandlers, resetPosition } = useFloatingOverlay({
    onClick: () => setIsPopupOpen((current) => !current)
  });

  const closePopup = useCallback(() => {
    setIsPopupOpen(false);
  }, []);

  useEffect(() => {
    if (!isPopupOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.composedPath()[0];

      if (!(target instanceof Node)) {
        return;
      }

      if (buttonRef.current?.contains(target) || popupRef.current?.contains(target)) {
        return;
      }

      closePopup();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePopup();
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [closePopup, isPopupOpen]);

  const popupPosition = getPopupPosition(position);

  return (
    // Hidden (not unmounted) so minimizing/auto-hiding never tears down the room
    // connection or an active voice session owned further down this tree.
    <div className="bol-bhai-overlay-host" hidden={!isVisible}>
      <div
        ref={containerRef}
        className="bol-bhai-floating-shell"
        style={{ left: position.left, top: position.top }}
      >
        <FloatingMicButton
          ref={buttonRef}
          isActive={isPopupOpen}
          onDismiss={() => {
            setIsPopupOpen(false);
            setIsVisible(false);
          }}
          {...buttonHandlers}
        />
      </div>

      <OverlayPopup
        ref={popupRef}
        isOpen={isPopupOpen}
        position={popupPosition}
        onClosePanel={closePopup}
        onResetOverlayPosition={resetPosition}
        initialInviteRoomCode={invitedRoomCodeRef.current}
      />
    </div>
  );
});
