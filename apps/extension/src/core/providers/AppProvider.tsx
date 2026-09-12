import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import { storageService } from "../services/storageService";
import type { AppSettings, FutureRoomSnapshot, UserProfile } from "../types/app";

type AppCoreContextValue = {
  isInitialized: boolean;
  isFirstLaunch: boolean;
  user: UserProfile | null;
  settings: AppSettings;
  futureRooms: FutureRoomSnapshot;
  saveUsername: (username: string) => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<void>;
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark"
};

const DEFAULT_FUTURE_ROOMS: FutureRoomSnapshot = {
  recentRoomIds: []
};

const AppCoreContext = createContext<AppCoreContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [futureRooms, setFutureRooms] = useState<FutureRoomSnapshot>(DEFAULT_FUTURE_ROOMS);

  useEffect(() => {
    let isMounted = true;

    async function initializeApp() {
      const [storedUsername, storedSettings, storedFutureRooms] = await Promise.all([
        storageService.getUsername(),
        storageService.getSettings(),
        storageService.getFutureRooms()
      ]);

      if (!isMounted) {
        return;
      }

      setUser(storedUsername ? { username: storedUsername } : null);
      setSettings(storedSettings);
      setFutureRooms(storedFutureRooms);
      setIsInitialized(true);
    }

    void initializeApp();

    return () => {
      isMounted = false;
    };
  }, []);

  const saveUsername = useCallback(async (username: string) => {
    const savedUsername = await storageService.saveUsername(username);
    setUser({ username: savedUsername });
  }, []);

  const saveSettings = useCallback(async (nextSettings: AppSettings) => {
    const savedSettings = await storageService.saveSettings(nextSettings);
    setSettings(savedSettings);
  }, []);

  const value = useMemo<AppCoreContextValue>(
    () => ({
      isInitialized,
      isFirstLaunch: isInitialized && user === null,
      user,
      settings,
      futureRooms,
      saveUsername,
      saveSettings
    }),
    [futureRooms, isInitialized, saveSettings, saveUsername, settings, user]
  );

  return <AppCoreContext.Provider value={value}>{children}</AppCoreContext.Provider>;
}

export function useAppCore(): AppCoreContextValue {
  const context = useContext(AppCoreContext);

  if (!context) {
    throw new Error("useAppCore must be used inside AppProvider.");
  }

  return context;
}
