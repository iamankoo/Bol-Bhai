import { memo } from "react";
import { APP_CONFIG } from "../../core/config/appConfig";

type HomePanelProps = {
  isCreatingRoom: boolean;
  onCreateRoom: () => void;
  onOpenJoinRoom: () => void;
  onOpenSettings: () => void;
};

export const HomePanel = memo(function HomePanel({
  isCreatingRoom,
  onCreateRoom,
  onOpenJoinRoom,
  onOpenSettings
}: HomePanelProps) {
  return (
    <div className="bol-bhai-panel">
      <header className="bol-bhai-popup-header">
        <h2 id="bol-bhai-popup-title">{APP_CONFIG.name}</h2>
        <p>{APP_CONFIG.tagline}</p>
      </header>

      <div className="bol-bhai-popup-actions" aria-label="Bol Bhai actions">
        <button
          type="button"
          className="bol-bhai-popup-action"
          disabled={isCreatingRoom}
          onClick={onCreateRoom}
        >
          {isCreatingRoom ? "Creating..." : "Create Room"}
        </button>
        <button type="button" className="bol-bhai-popup-action" onClick={onOpenJoinRoom}>
          Join Room
        </button>
        <button type="button" className="bol-bhai-popup-action" onClick={onOpenSettings}>
          Settings
        </button>
      </div>
    </div>
  );
});
