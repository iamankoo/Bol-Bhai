import type { QueryClient } from "@tanstack/react-query";
import { realtimeService } from "../../../core/realtime";
import { roomQueryKeys } from "../api/roomQueryKeys";
import { roomSessionStorage } from "./roomSessionStorage";

type ClearRoomLifecycleOptions = {
  queryClient: QueryClient;
  roomCode?: string;
  clearCurrentRoom: () => void;
  disconnectRealtime?: boolean;
};

export async function clearRoomLifecycle({
  queryClient,
  roomCode,
  clearCurrentRoom,
  disconnectRealtime = true
}: ClearRoomLifecycleOptions): Promise<void> {
  if (roomCode) {
    await queryClient.cancelQueries({ queryKey: roomQueryKeys.detail(roomCode) });
    queryClient.removeQueries({ queryKey: roomQueryKeys.detail(roomCode) });
  }

  await queryClient.cancelQueries({ queryKey: roomQueryKeys.session });
  queryClient.setQueryData(roomQueryKeys.session, null);

  if (disconnectRealtime) {
    realtimeService.disconnect();
  }

  clearCurrentRoom();
  await roomSessionStorage.clear();
}
