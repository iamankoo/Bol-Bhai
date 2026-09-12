import { memo, useCallback, useMemo, useState, type FormEvent } from "react";
import { roomCodeSchema } from "../api/roomSchemas";

type JoinRoomDialogProps = {
  isJoiningRoom: boolean;
  initialRoomCode?: string;
  onBack: () => void;
  onJoinRoom: (roomCode: string) => void;
};

export const JoinRoomDialog = memo(function JoinRoomDialog({
  isJoiningRoom,
  initialRoomCode,
  onBack,
  onJoinRoom
}: JoinRoomDialogProps) {
  const [roomCode, setRoomCode] = useState(initialRoomCode ?? "");
  const [error, setError] = useState<string | null>(null);

  const normalizedRoomCode = useMemo(() => roomCode.trim().toUpperCase(), [roomCode]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const result = roomCodeSchema.safeParse(normalizedRoomCode);

      if (!result.success) {
        setError(result.error.issues[0]?.message ?? "Enter a valid room code.");
        return;
      }

      setError(null);
      onJoinRoom(result.data);
    },
    [normalizedRoomCode, onJoinRoom]
  );

  return (
    <form className="bol-bhai-panel" onSubmit={handleSubmit}>
      <header className="bol-bhai-popup-header bol-bhai-settings-header">
        <div>
          <h2 id="bol-bhai-popup-title">Join Room</h2>
          <p>Enter a room code</p>
        </div>
        <button type="button" className="bol-bhai-close-button" onClick={onBack}>
          Back
        </button>
      </header>

      <label className="bol-bhai-field">
        <span>Room Code</span>
        <input
          autoFocus
          className="bol-bhai-input bol-bhai-code-input"
          type="text"
          value={roomCode}
          maxLength={8}
          placeholder="IN483921"
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? "bol-bhai-room-code-error" : undefined}
          onChange={(event) => {
            setRoomCode(event.currentTarget.value.toUpperCase());
            setError(null);
          }}
        />
      </label>

      {error ? (
        <p id="bol-bhai-room-code-error" className="bol-bhai-error" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="bol-bhai-popup-action bol-bhai-primary-action"
        disabled={isJoiningRoom}
      >
        {isJoiningRoom ? "Joining..." : "Join"}
      </button>
    </form>
  );
});
