import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { realtimeService } from "../../../core/realtime";
import { roomQueryKeys } from "../api/roomQueryKeys";
import { isRoomNotFoundError, roomsApi } from "../api/roomsApi";
import { roomCodeSchema } from "../api/roomSchemas";
import { clearRoomLifecycle } from "../store/roomLifecycle";
import { roomSessionStorage } from "../store/roomSessionStorage";
import { useRoomStore } from "../store/roomStore";

type UseRoomsControllerOptions = {
  username: string;
};

export function useRoomsController({ username }: UseRoomsControllerOptions) {
  const queryClient = useQueryClient();
  const currentRoom = useRoomStore((state) => state.currentRoom);
  const currentMemberId = useRoomStore((state) => state.currentMemberId);
  const errorMessage = useRoomStore((state) => state.errorMessage);
  const connectionStatus = useRoomStore((state) => state.connectionStatus);
  const setCurrentRoom = useRoomStore((state) => state.setCurrentRoom);
  const restoreCurrentRoom = useRoomStore((state) => state.restoreCurrentRoom);
  const clearCurrentRoom = useRoomStore((state) => state.clearCurrentRoom);
  const setErrorMessage = useRoomStore((state) => state.setErrorMessage);

  const savedSessionQuery = useQuery({
    queryKey: roomQueryKeys.session,
    queryFn: roomSessionStorage.get,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Infinity
  });

  const clearActiveRoom = useCallback(
    async (roomCode?: string) => {
      await clearRoomLifecycle({
        queryClient,
        roomCode,
        clearCurrentRoom
      });
    },
    [clearCurrentRoom, queryClient]
  );

  useEffect(() => {
    const session = savedSessionQuery.data;
    let isActive = true;

    if (!session || currentRoom) {
      return undefined;
    }

    void roomsApi
      .getRoom(session.roomCode)
      .then((room) => {
        if (!isActive) {
          return;
        }

        restoreCurrentRoom(room, session);
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        if (isRoomNotFoundError(error)) {
          void clearActiveRoom(session.roomCode);
          return;
        }

        void clearActiveRoom(session.roomCode);
      });

    return () => {
      isActive = false;
    };
  }, [clearActiveRoom, currentRoom, restoreCurrentRoom, savedSessionQuery.data]);

  const createRoomMutation = useMutation({
    mutationFn: () => roomsApi.createRoom({ username }),
    onSuccess(result) {
      setCurrentRoom(result, result.memberId);
      void roomSessionStorage.set({
        roomCode: result.roomCode,
        memberId: result.memberId
      });
    },
    onError(error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create room.");
    }
  });

  const joinRoomMutation = useMutation({
    mutationFn: (roomCode: string) =>
      roomsApi.joinRoom({
        roomCode: roomCodeSchema.parse(roomCode),
        username
      }),
    onSuccess(result) {
      setCurrentRoom(result, result.memberId);
      void roomSessionStorage.set({
        roomCode: result.roomCode,
        memberId: result.memberId
      });
    },
    onError(error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to join room.");
    }
  });

  const leaveRoomMutation = useMutation({
    mutationFn: () => {
      if (!currentRoom || !currentMemberId) {
        throw new Error("No active room.");
      }

      return roomsApi.leaveRoom({
        roomCode: currentRoom.roomCode,
        memberId: currentMemberId
      });
    },
    onSuccess() {
      const roomCode = currentRoom?.roomCode;

      if (currentRoom) {
        realtimeService.leaveRoom(currentRoom.roomCode);
      }

      void clearActiveRoom(roomCode);
    },
    onError(error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to leave room.");
    }
  });

  const createRoom = useCallback(() => {
    setErrorMessage(null);
    createRoomMutation.mutate();
  }, [createRoomMutation, setErrorMessage]);

  const joinRoom = useCallback(
    (roomCode: string) => {
      setErrorMessage(null);
      joinRoomMutation.mutate(roomCode);
    },
    [joinRoomMutation, setErrorMessage]
  );

  const leaveRoom = useCallback(() => {
    setErrorMessage(null);
    leaveRoomMutation.mutate();
  }, [leaveRoomMutation, setErrorMessage]);

  return {
    currentRoom,
    currentMemberId,
    errorMessage,
    connectionStatus,
    createRoom,
    joinRoom,
    leaveRoom,
    isCreatingRoom: createRoomMutation.isPending,
    isJoiningRoom: joinRoomMutation.isPending,
    isLeavingRoom: leaveRoomMutation.isPending
  };
}
