import { memo, useCallback } from "react";
import { useMedia } from "../hooks/useMedia";
import { usePermissions } from "../hooks/usePermissions";

function getButtonLabel(status: string, isMuted: boolean, isCheckingPermission: boolean): string {
  if (isCheckingPermission || status === "starting") {
    return "Starting…";
  }

  if (status === "active") {
    return isMuted ? "Unmute Microphone" : "Mute Microphone";
  }

  if (status === "error") {
    return "Retry Microphone";
  }

  return "Enable Microphone";
}

export const MicToggleButton = memo(function MicToggleButton() {
  const { status, isMuted, errorMessage, start, mute, unmute } = useMedia();
  const {
    microphonePermission,
    errorMessage: permissionErrorMessage,
    requestMicrophonePermission
  } = usePermissions();

  const isActive = status === "active";
  const isBusy = status === "starting";

  const handleClick = useCallback(() => {
    if (isBusy) {
      return;
    }

    if (isActive) {
      if (isMuted) {
        unmute();
      } else {
        mute();
      }
      return;
    }

    void (async () => {
      const permission = await requestMicrophonePermission();
      if (permission !== "granted") {
        return;
      }

      try {
        await start();
      } catch {
        // Surfaced via useMedia's errorMessage state.
      }
    })();
  }, [isActive, isBusy, isMuted, mute, requestMicrophonePermission, start, unmute]);

  const label = getButtonLabel(status, isMuted, isBusy);
  const isDenied = microphonePermission === "denied";
  const combinedError = errorMessage ?? permissionErrorMessage;

  return (
    <div className="bol-bhai-mic-control">
      <button
        type="button"
        className={`bol-bhai-popup-action${isActive && !isMuted ? " bol-bhai-primary-action" : ""}`}
        onClick={handleClick}
        disabled={isBusy || isDenied}
        aria-pressed={isActive && !isMuted}
      >
        {label}
      </button>
      {isDenied ? (
        <p className="bol-bhai-error" role="alert">
          Microphone access is blocked. Allow it in your browser's site settings to talk.
        </p>
      ) : combinedError ? (
        <p className="bol-bhai-error" role="alert">
          {combinedError}
        </p>
      ) : null}
    </div>
  );
});
