import { storage } from "wxt/utils/storage";
import type { AppSettings, FutureRoomSnapshot } from "../types/app";
import { STORAGE_KEYS } from "../storage/storageKeys";
import {
  futureRoomsSchema,
  overlayPositionSchema,
  settingsSchema,
  usernameSchema
} from "../storage/schemas";
import type { OverlayPosition } from "../../overlay/utils/position";

const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark"
};

const DEFAULT_FUTURE_ROOMS: FutureRoomSnapshot = {
  recentRoomIds: []
};

export const storageService = {
  async getUsername(): Promise<string | null> {
    const value = await storage.getItem<unknown>(STORAGE_KEYS.username);
    const result = usernameSchema.safeParse(value);

    return result.success ? result.data : null;
  },

  async saveUsername(username: string): Promise<string> {
    const validatedUsername = usernameSchema.parse(username);
    await storage.setItem(STORAGE_KEYS.username, validatedUsername);

    return validatedUsername;
  },

  async getOverlayPosition(): Promise<OverlayPosition | null> {
    const value = await storage.getItem<unknown>(STORAGE_KEYS.overlayPosition);
    const result = overlayPositionSchema.safeParse(value);

    return result.success ? result.data : null;
  },

  async saveOverlayPosition(position: OverlayPosition): Promise<void> {
    const validatedPosition = overlayPositionSchema.parse(position);
    await storage.setItem(STORAGE_KEYS.overlayPosition, validatedPosition);
  },

  async resetOverlayPosition(): Promise<void> {
    await storage.removeItem(STORAGE_KEYS.overlayPosition);
  },

  async getSettings(): Promise<AppSettings> {
    const value = await storage.getItem<unknown>(STORAGE_KEYS.settings);
    const result = settingsSchema.safeParse(value);

    return result.success ? result.data : DEFAULT_SETTINGS;
  },

  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    const validatedSettings = settingsSchema.parse(settings);
    await storage.setItem(STORAGE_KEYS.settings, validatedSettings);

    return validatedSettings;
  },

  async getFutureRooms(): Promise<FutureRoomSnapshot> {
    const value = await storage.getItem<unknown>(STORAGE_KEYS.futureRooms);
    const result = futureRoomsSchema.safeParse(value);

    return result.success ? result.data : DEFAULT_FUTURE_ROOMS;
  }
};
