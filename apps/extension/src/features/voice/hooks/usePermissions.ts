import { useCallback, useEffect } from "react";
import { permissionService } from "../permissions";
import { usePermissionStore } from "../store";

export function usePermissions() {
  const microphonePermission = usePermissionStore((state) => state.microphonePermission);
  const isCheckingPermission = usePermissionStore((state) => state.isCheckingPermission);
  const errorMessage = usePermissionStore((state) => state.errorMessage);
  const setMicrophonePermission = usePermissionStore((state) => state.setMicrophonePermission);
  const setIsCheckingPermission = usePermissionStore((state) => state.setIsCheckingPermission);
  const setErrorMessage = usePermissionStore((state) => state.setErrorMessage);

  const checkMicrophonePermission = useCallback(async () => {
    setIsCheckingPermission(true);
    setErrorMessage(null);

    try {
      const permission = await permissionService.checkMicrophonePermission();
      setMicrophonePermission(permission);
      return permission;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to check microphone permission.";
      setErrorMessage(message);
      throw error;
    } finally {
      setIsCheckingPermission(false);
    }
  }, [setErrorMessage, setIsCheckingPermission, setMicrophonePermission]);

  const requestMicrophonePermission = useCallback(async () => {
    setIsCheckingPermission(true);
    setErrorMessage(null);

    try {
      const permission = await permissionService.requestMicrophonePermission();
      setMicrophonePermission(permission);
      return permission;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to request microphone permission.";
      setErrorMessage(message);
      throw error;
    } finally {
      setIsCheckingPermission(false);
    }
  }, [setErrorMessage, setIsCheckingPermission, setMicrophonePermission]);

  useEffect(() => {
    return permissionService.watchMicrophonePermission(setMicrophonePermission);
  }, [setMicrophonePermission]);

  return {
    microphonePermission,
    isCheckingPermission,
    errorMessage,
    checkMicrophonePermission,
    requestMicrophonePermission
  };
}
