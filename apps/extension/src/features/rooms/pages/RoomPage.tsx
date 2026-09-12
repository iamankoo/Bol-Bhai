import { memo, useCallback, useState } from "react";
import { MicToggleButton, type PeerState, useVoiceSessionStore } from "../../voice";
import { APP_CONFIG } from "../../../core/config/appConfig";
import type { ConnectionStatus, Room } from "../types/room";

type RoomPageProps = {
  room: Room;
  currentMemberId: string | null;
  connectionStatus: ConnectionStatus;
  isLeavingRoom: boolean;
  onLeaveRoom: () => void;
  onClosePanel?: () => void;
};

function formatConnectionStatus(status: ConnectionStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatPeerState(state: PeerState | undefined): string {
  switch (state) {
    case "connected":
      return "Voice connected";
    case "connecting":
      return "Connecting…";
    case "failed":
      return "Connection failed";
    case "disconnected":
      return "Disconnected";
    case "closed":
      return "Closed";
    default:
      return "Waiting…";
  }
}

export const RoomPage = memo(function RoomPage({
  room,
  currentMemberId,
  connectionStatus,
  isLeavingRoom,
  onLeaveRoom,
  onClosePanel
}: RoomPageProps) {
  const [copyLabel, setCopyLabel] = useState("Copy");
  const peerStates = useVoiceSessionStore((state) => state.peerStates);

  const copyRoomCode = useCallback(() => {
    void navigator.clipboard.writeText(room.roomCode).then(() => {
      setCopyLabel("Copied");
      window.setTimeout(() => setCopyLabel("Copy"), 1200);
    });
  }, [room.roomCode]);

  const inviteUrl = `${APP_CONFIG.apiBaseUrl}/join/${room.roomCode}`;
  const inviteMessage = `Join my Bol Bhai voice room: ${inviteUrl}`;

  const shareInvite = useCallback(() => {
    if (navigator.share) {
      navigator
        .share({ title: "Bol Bhai voice room", text: inviteMessage, url: inviteUrl })
        .catch(() => {
          // User cancelled the native share sheet — nothing to do.
        });
      return;
    }

    window.open(
      `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }, [inviteMessage, inviteUrl]);

  return (
    <div className="bol-bhai-panel">
      <header className="bol-bhai-popup-header">
        <div className="bol-bhai-room-header-top">
          <h2 id="bol-bhai-popup-title">Room Code</h2>
          {onClosePanel ? (
            <button
              type="button"
              className="bol-bhai-room-panel-close"
              onClick={onClosePanel}
              aria-label="Close room panel"
              title="Close panel"
            >
              ×
            </button>
          ) : null}
        </div>
        <div className="bol-bhai-room-code-row">
          <strong>{room.roomCode}</strong>
          <button type="button" className="bol-bhai-close-button" onClick={copyRoomCode}>
            {copyLabel}
          </button>
        </div>
      </header>

      <button type="button" className="bol-bhai-popup-action" onClick={shareInvite}>
        Share Invite
      </button>

      <div className="bol-bhai-room-meta" aria-label="Room status">
        <span>Connection</span>
        <strong>{formatConnectionStatus(connectionStatus)}</strong>
        <span>Members</span>
        <strong>{room.members.length}</strong>
      </div>

      <section className="bol-bhai-members" aria-label="Room members">
        {room.members.map((member) => (
          <div key={member.id} className="bol-bhai-member-row">
            <span>
              {member.username}
              {member.id === currentMemberId ? " (You)" : ""}
            </span>
            {member.isHost ? <strong>Host</strong> : null}
            {member.id !== currentMemberId ? (
              <strong>{formatPeerState(peerStates[member.id])}</strong>
            ) : null}
          </div>
        ))}
      </section>

      <MicToggleButton />

      <button
        type="button"
        className="bol-bhai-popup-action bol-bhai-danger-action"
        disabled={isLeavingRoom}
        onClick={onLeaveRoom}
      >
        {isLeavingRoom ? "Leaving..." : "Leave Room"}
      </button>
    </div>
  );
});
