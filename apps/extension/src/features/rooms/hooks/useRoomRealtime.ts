import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { realtimeService, type ServerToClientEvents } from "../../../core/realtime";
import { voiceSessionManager } from "../../voice";
import { clearRoomLifecycle } from "../store/roomLifecycle";
import { useRoomStore } from "../store/roomStore";

export function useRoomRealtime(): void {
  const queryClient = useQueryClient();
  const activeVoiceSessionRoomCodeRef = useRef<string | null>(null);
  const currentRoom = useRoomStore((state) => state.currentRoom);
  const roomCode = currentRoom?.roomCode;
  const currentMemberId = useRoomStore((state) => state.currentMemberId);
  const updateMembers = useRoomStore((state) => state.updateMembers);
  const updateHost = useRoomStore((state) => state.updateHost);
  const clearCurrentRoom = useRoomStore((state) => state.clearCurrentRoom);
  const setConnectionStatus = useRoomStore((state) => state.setConnectionStatus);

  useEffect(() => {
    if (!roomCode) {
      return;
    }

    const handleMemberJoined: ServerToClientEvents["room:member-joined"] = (payload) => {
      updateMembers(payload.members);
    };
    const handleMemberLeft: ServerToClientEvents["room:member-left"] = (payload) => {
      updateMembers(payload.members);

      // Prune the departed member's peer connection/audio element for everyone
      // still in the room; voice:peer-ready only fires for newly joining peers,
      // so a leave needs its own explicit re-sync or the connection would leak.
      const room = useRoomStore.getState().currentRoom;
      if (room) {
        void voiceSessionManager.syncRoom(room);
      }
    };
    const handleHostChanged: ServerToClientEvents["room:host-changed"] = (payload) => {
      updateHost(payload.newHost.id);
    };
    const handleRoomDeleted: ServerToClientEvents["room:deleted"] = () => {
      void clearRoomLifecycle({
        queryClient,
        roomCode,
        clearCurrentRoom
      });
    };
    const handlePeerReady: ServerToClientEvents["voice:peer-ready"] = (payload) => {
      console.log("voice:peer-ready received", payload);
      const room = useRoomStore.getState().currentRoom;
      if (room) {
        void voiceSessionManager.syncRoom(room);
      }
    };
    const unsubscribeStatus = realtimeService.onStatusChange(setConnectionStatus);

    realtimeService.onMemberJoined(handleMemberJoined);
    realtimeService.onMemberLeft(handleMemberLeft);
    realtimeService.onHostChanged(handleHostChanged);
    realtimeService.onRoomDeleted(handleRoomDeleted);
    realtimeService.onPeerReady(handlePeerReady);

    return () => {
      unsubscribeStatus();
      realtimeService.offMemberJoined(handleMemberJoined);
      realtimeService.offMemberLeft(handleMemberLeft);
      realtimeService.offHostChanged(handleHostChanged);
      realtimeService.offRoomDeleted(handleRoomDeleted);
      realtimeService.offPeerReady(handlePeerReady);
    };
  }, [clearCurrentRoom, queryClient, roomCode, setConnectionStatus, updateHost, updateMembers]);

  useEffect(() => {
    if (!roomCode) {
      return;
    }

    realtimeService.connect();
    realtimeService.joinRoom(roomCode);

    return () => {
      realtimeService.leaveRoom(roomCode);
    };
  }, [roomCode]);

  useEffect(() => {
    if (!currentRoom || !currentMemberId) {
      activeVoiceSessionRoomCodeRef.current = null;
      void voiceSessionManager.destroy();
      return;
    }

    if (activeVoiceSessionRoomCodeRef.current === currentRoom.roomCode) {
      return;
    }

    activeVoiceSessionRoomCodeRef.current = currentRoom.roomCode;
    void voiceSessionManager.start(currentRoom, currentMemberId);

    return () => {
      activeVoiceSessionRoomCodeRef.current = null;
      void voiceSessionManager.destroy();
    };
  }, [currentMemberId, currentRoom?.roomCode]);
}
