// contexts/user-position-context.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  getCurrentUserPosition,
  updateParticipantPosition,
} from "@/lib/actions/rooms";
import { IRoom } from "@/interfaces/room.interface";

interface UserPosition {
  current_season: string | null;
  current_episode: number | null;
  playback_timestamp: string | null;
}

interface UserPositionContextType {
  position: UserPosition | null;
  loading: boolean;
  error: string | null;
  updatePosition: (data: {
    season: string;
    episode: number;
    timestamp: string;
  }) => Promise<boolean>;
  refreshPosition: () => Promise<void>;
}

const UserPositionContext = createContext<UserPositionContextType | undefined>(
  undefined
);

interface UserPositionProviderProps {
  children: ReactNode;
  room: IRoom;
}

export function UserPositionProvider({
  children,
  room,
}: UserPositionProviderProps) {
  const [position, setPosition] = useState<UserPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPosition = useCallback(async () => {
    if (!room?.id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getCurrentUserPosition(room.id);
      if (result.success && result.data) {
        setPosition(result.data);
      } else {
        setError(result.error || "Failed to fetch position");
      }
    } catch (err) {
      console.error("Error loading user position:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [room?.id]);

  const updatePosition = useCallback(
    async (data: {
      season: string;
      episode: number;
      timestamp: string;
    }): Promise<boolean> => {
      if (!room?.id) return false;

      try {
        const result = await updateParticipantPosition(room.id, data);
        if (result.success) {
          // Optimistically update local state
          setPosition({
            current_season: data.season,
            current_episode: data.episode,
            playback_timestamp: data.timestamp,
          });
          return true;
        } else {
          setError(result.error || "Failed to update position");
          return false;
        }
      } catch (err) {
        console.error("Error updating position:", err);
        setError("Failed to update position");
        return false;
      }
    },
    [room?.id]
  );

  // Load initial position
  useEffect(() => {
    refreshPosition();
  }, [refreshPosition]);

  const value: UserPositionContextType = {
    position,
    loading,
    error,
    updatePosition,
    refreshPosition,
  };

  return (
    <UserPositionContext.Provider value={value}>
      {children}
    </UserPositionContext.Provider>
  );
}

export function useUserPosition() {
  const context = useContext(UserPositionContext);
  if (context === undefined) {
    throw new Error(
      "useUserPosition must be used within a UserPositionProvider"
    );
  }
  return context;
}
