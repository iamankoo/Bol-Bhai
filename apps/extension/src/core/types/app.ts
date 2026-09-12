import type { OverlayPosition } from "../../overlay/utils/position";

export type ThemeMode = "dark";

export type UserProfile = {
  username: string;
};

export type AppSettings = {
  theme: ThemeMode;
};

export type FutureRoomSnapshot = {
  recentRoomIds: string[];
};

export type AppStorageSnapshot = {
  username: string | null;
  overlayPosition: OverlayPosition | null;
  settings: AppSettings;
  futureRooms: FutureRoomSnapshot;
};
