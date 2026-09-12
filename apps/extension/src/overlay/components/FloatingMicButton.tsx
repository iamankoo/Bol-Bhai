import { forwardRef, memo, type MouseEventHandler, type PointerEventHandler } from "react";
import { MicrophoneIcon } from "./MicrophoneIcon";

type FloatingMicButtonProps = {
  isActive: boolean;
  onPointerDown: PointerEventHandler<HTMLButtonElement>;
  onClick: () => void;
  onDismiss: () => void;
};

export const FloatingMicButton = memo(
  forwardRef<HTMLButtonElement, FloatingMicButtonProps>(function FloatingMicButton(
    { isActive, onPointerDown, onClick, onDismiss },
    ref
  ) {
    const handleDismiss: MouseEventHandler<HTMLButtonElement> = (event) => {
      event.stopPropagation();
      onDismiss();
    };

    return (
      <div className="bol-bhai-mic-wrapper">
        <button
          ref={ref}
          type="button"
          className="bol-bhai-mic-button"
          aria-label="Open Bol Bhai overlay"
          aria-expanded={isActive}
          aria-haspopup="dialog"
          onPointerDown={onPointerDown}
          onClick={onClick}
        >
          <MicrophoneIcon />
        </button>
        <button
          type="button"
          className="bol-bhai-dismiss-button"
          aria-label="Hide Bol Bhai overlay"
          onClick={handleDismiss}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="1" y1="1" x2="11" y2="11" />
            <line x1="11" y1="1" x2="1" y2="11" />
          </svg>
        </button>
      </div>
    );
  })
);
