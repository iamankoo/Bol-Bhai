import { useCallback, useEffect } from "react";
import { mediaService } from "../media";
import { useMediaStore } from "../store";

export function useMedia() {
  const status = useMediaStore((state) => state.status);
  const stream = useMediaStore((state) => state.stream);
  const isMuted = useMediaStore((state) => state.isMuted);
  const errorMessage = useMediaStore((state) => state.errorMessage);
  const setStarting = useMediaStore((state) => state.setStarting);
  const setStream = useMediaStore((state) => state.setStream);
  const setStopped = useMediaStore((state) => state.setStopped);
  const setMuted = useMediaStore((state) => state.setMuted);
  const setErrorMessage = useMediaStore((state) => state.setErrorMessage);

  const start = useCallback(
    async (deviceId?: string) => {
      setStarting();

      try {
        const nextStream = await mediaService.start(deviceId);
        setStream(nextStream);
        return nextStream;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to start local media.";
        setErrorMessage(message);
        throw error;
      }
    },
    [setErrorMessage, setStarting, setStream]
  );

  const stop = useCallback(() => {
    mediaService.stop();
    setStopped();
  }, [setStopped]);

  const restart = useCallback(
    async (deviceId?: string) => {
      setStarting();

      try {
        const nextStream = await mediaService.restart(deviceId);
        setStream(nextStream);
        return nextStream;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to restart local media.";
        setErrorMessage(message);
        throw error;
      }
    },
    [setErrorMessage, setStarting, setStream]
  );

  const mute = useCallback(() => {
    mediaService.mute();
    setMuted(true);
  }, [setMuted]);

  const unmute = useCallback(() => {
    mediaService.unmute();
    setMuted(false);
  }, [setMuted]);

  const destroy = useCallback(() => {
    mediaService.destroy();
    setStopped();
  }, [setStopped]);

  useEffect(() => destroy, [destroy]);

  return {
    status,
    stream,
    isMuted,
    errorMessage,
    start,
    stop,
    restart,
    mute,
    unmute,
    destroy
  };
}
