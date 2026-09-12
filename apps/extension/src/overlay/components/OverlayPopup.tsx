import { forwardRef, memo, useCallback, useEffect, useRef, useState } from "react";
import { useAppCore } from "../../core/providers/AppProvider";
import {
  JoinRoomDialog,
  RoomPage,
  useRoomRealtime,
  useRoomsController
} from "../../features/rooms";
import type { PopupPosition } from "../utils/getPopupPosition";
import { HomePanel } from "./HomePanel";
import { OnboardingScreen } from "./OnboardingScreen";
import { SettingsPanel } from "./SettingsPanel";

type OverlayPopupProps = {
  isOpen: boolean;
  position: PopupPosition;
  onClosePanel?: () => void;
  onResetOverlayPosition: () => Promise<void>;
  initialInviteRoomCode?: string | null;
};

type PopupView = "home" | "join" | "settings";

export const OverlayPopup = memo(
  forwardRef<HTMLDivElement, OverlayPopupProps>(function OverlayPopup(
    { isOpen, position, onClosePanel, onResetOverlayPosition, initialInviteRoomCode },
    ref
  ) {
    const [view, setView] = useState<PopupView>(() => (initialInviteRoomCode ? "join" : "home"));
    const { isInitialized, isFirstLaunch, user, saveUsername } = useAppCore();
    const rooms = useRoomsController({ username: user?.username ?? "" });
    const hadRoomRef = useRef(false);
    useRoomRealtime();

    const openSettings = useCallback(() => {
      setView("settings");
    }, []);

    const openJoinRoom = useCallback(() => {
      setView("join");
    }, []);

    const backHome = useCallback(() => {
      setView("home");
    }, []);

    const closeSettings = useCallback(() => {
      setView("home");
    }, []);

    const leaveRoom = useCallback(() => {
      setView("home");
      rooms.leaveRoom();
    }, [rooms]);

    useEffect(() => {
      if (rooms.currentRoom) {
        hadRoomRef.current = true;
        return;
      }

      if (hadRoomRef.current) {
        hadRoomRef.current = false;
        setView("home");
      }
    }, [rooms.currentRoom]);

    const renderContent = () => {
      if (!isInitialized) {
        return <div className="bol-bhai-loading" role="status" aria-live="polite" />;
      }

      if (isFirstLaunch || !user) {
        return <OnboardingScreen onComplete={saveUsername} />;
      }

      if (rooms.currentRoom) {
        return (
          <RoomPage
            room={rooms.currentRoom}
            currentMemberId={rooms.currentMemberId}
            connectionStatus={rooms.connectionStatus}
            isLeavingRoom={rooms.isLeavingRoom}
            onLeaveRoom={leaveRoom}
            onClosePanel={onClosePanel}
          />
        );
      }

      if (view === "settings") {
        return (
          <SettingsPanel
            username={user.username}
            onClose={closeSettings}
            onSaveUsername={saveUsername}
            onResetOverlayPosition={onResetOverlayPosition}
          />
        );
      }

      if (view === "join") {
        return (
          <JoinRoomDialog
            isJoiningRoom={rooms.isJoiningRoom}
            initialRoomCode={initialInviteRoomCode ?? undefined}
            onBack={backHome}
            onJoinRoom={rooms.joinRoom}
          />
        );
      }

      return (
        <HomePanel
          isCreatingRoom={rooms.isCreatingRoom}
          onCreateRoom={rooms.createRoom}
          onOpenJoinRoom={openJoinRoom}
          onOpenSettings={openSettings}
        />
      );
    };

    return (
      <section
        ref={ref}
        className={`bol-bhai-popup${isOpen ? " bol-bhai-popup-open" : ""}`}
        style={{ left: position.left, top: position.top, transformOrigin: position.origin }}
        role="dialog"
        aria-modal="false"
        aria-labelledby="bol-bhai-popup-title"
        aria-hidden={!isOpen}
      >
        {rooms.errorMessage ? (
          <p className="bol-bhai-global-error" role="alert">
            {rooms.errorMessage}
          </p>
        ) : null}
        {renderContent()}
      </section>
    );
  })
);
