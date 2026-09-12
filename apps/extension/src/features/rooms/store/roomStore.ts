import { create } from "zustand";
import type { ConnectionStatus, Room, RoomSession } from "../types/room";

type RoomState = {
  currentRoom: Room | null;
  currentMemberId: string | null;
  connectionStatus: ConnectionStatus;
  errorMessage: string | null;
  setCurrentRoom: (room: Room, memberId: string) => void;
  restoreCurrentRoom: (room: Room, session: RoomSession) => void;
  updateMembers: (members: Room["members"]) => void;
  updateHost: (hostId: string) => void;
  clearCurrentRoom: () => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setErrorMessage: (message: string | null) => void;
};

export const useRoomStore = create<RoomState>((set) => ({
  currentRoom: null,
  currentMemberId: null,
  connectionStatus: "disconnected",
  errorMessage: null,

  setCurrentRoom(room, memberId) {
    set({
      currentRoom: room,
      currentMemberId: memberId,
      errorMessage: null
    });
  },

  restoreCurrentRoom(room, session) {
    set({
      currentRoom: room,
      currentMemberId: session.memberId,
      errorMessage: null
    });
  },

  updateMembers(members) {
    set((state) => {
      if (!state.currentRoom) {
        return state;
      }

      const host = members.find((member) => member.isHost) ?? state.currentRoom.host;

      return {
        currentRoom: {
          ...state.currentRoom,
          host,
          members
        }
      };
    });
  },

  updateHost(hostId) {
    set((state) => {
      if (!state.currentRoom) {
        return state;
      }

      const members = state.currentRoom.members.map((member) => ({
        ...member,
        isHost: member.id === hostId
      }));
      const host = members.find((member) => member.id === hostId) ?? state.currentRoom.host;

      return {
        currentRoom: {
          ...state.currentRoom,
          host,
          members
        }
      };
    });
  },

  clearCurrentRoom() {
    set({
      currentRoom: null,
      currentMemberId: null,
      connectionStatus: "disconnected",
      errorMessage: null
    });
  },

  setConnectionStatus(connectionStatus) {
    set({ connectionStatus });
  },

  setErrorMessage(errorMessage) {
    set({ errorMessage });
  }
}));
