// contexts/user-position-context.tsx - With staleness detection
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
  getRoomParticipants,
} from "@/lib/actions/rooms";
import { createClient } from "@/lib/supabase/client";
import { IRoom, RoomParticipant } from "@/interfaces/room.interface";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/use-auth";
import { decodeSeasonData, parseTimestamp } from "@/lib/utils/season.utils";

interface UserPosition {
  current_season: string | null;
  current_episode: number | null;
  playback_timestamp: string | null;
}

interface PositionStats {
  inSync: number;
  behind: number;
  ahead: number;
}

interface UserPositionContextType {
  position: UserPosition | null;
  participants: RoomParticipant[];
  positionStats: PositionStats;
  loading: boolean;
  error: string | null;
  lastPositionUpdate: Date | null;
  showStalenessModal: boolean;
  updatePosition: (data: {
    season: string | null;
    episode: number | null;
    timestamp: string;
  }) => Promise<boolean>;
  refreshPosition: () => Promise<void>;
  refreshParticipants: () => Promise<void>;
  dismissStalenessModal: () => void;
  openPositionDialog: () => void;
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
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [positionStats, setPositionStats] = useState<PositionStats>({
    inSync: 0,
    behind: 0,
    ahead: 0,
  });
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [lastPositionUpdate, setLastPositionUpdate] = useState<Date | null>(
    null
  );
  const [showStalenessModal, setShowStalenessModal] = useState(true);
  const [positionDialogCallback, setPositionDialogCallback] = useState<
    (() => void) | null
  >(null);

  const supabase = createClient();

  // Constants for staleness detection
  const STALENESS_THRESHOLD = 15 * 60 * 1000; // 15 minutes
  const CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

  // Calculate position statistics
  const calculatePositionStats = useCallback(
    (
      currentUserPosition: UserPosition | null,
      allParticipants: RoomParticipant[]
    ) => {
      if (!currentUserPosition || !room) {
        setPositionStats({ inSync: 0, behind: 0, ahead: 0 });
        return;
      }

      let inSync = 0;
      let behind = 0;
      let ahead = 0;

      const userProgress = calculateProgress(currentUserPosition, room);

      allParticipants.forEach((participant) => {
        // Skip participants without position data
        if (
          !participant.current_season &&
          !participant.current_episode &&
          !participant.playback_timestamp
        )
          return;

        const participantProgress = calculateProgress(
          {
            current_season: participant.current_season,
            current_episode: participant.current_episode,
            playback_timestamp: participant.playback_timestamp,
          },
          room
        );

        if (room.content.content_type === "series") {
          // For series, use exact season/episode comparison
          if (Math.abs(userProgress - participantProgress) < 1) {
            // Same season/episode, check timestamp difference (within 5 minutes)
            const userTimestamp = parseTimestamp(
              currentUserPosition.playback_timestamp || "0:00"
            );
            const participantTimestamp = parseTimestamp(
              participant.playback_timestamp || "0:00"
            );
            const timeDiff = Math.abs(userTimestamp - participantTimestamp);

            if (timeDiff <= 300) {
              // Within 5 minutes = in sync
              inSync++;
            } else if (participantTimestamp < userTimestamp) {
              behind++;
            } else {
              ahead++;
            }
          } else if (participantProgress < userProgress) {
            behind++;
          } else {
            ahead++;
          }
        } else {
          // For movies, use timestamp difference
          const timeDiff = Math.abs(userProgress - participantProgress);
          if (timeDiff <= 300) {
            // Within 5 minutes = in sync
            inSync++;
          } else if (participantProgress < userProgress) {
            behind++;
          } else {
            ahead++;
          }
        }
      });

      // Subtract 1 from inSync to exclude the current user
      setPositionStats({ inSync: Math.max(0, inSync - 1), behind, ahead });
    },
    [room]
  );

  const calculateProgress = (
    position: {
      current_season: string | null;
      current_episode: number | null;
      playback_timestamp: string | null;
    },
    room: IRoom
  ): number => {
    // For movies, just use timestamp
    if (room.content.content_type === "movie") {
      return parseTimestamp(position.playback_timestamp || "0:00");
    }

    // For series, create a comprehensive progress score
    let seasonNumber = 1;
    const episodeNumber = position.current_episode || 1;

    // Extract season number from encoded or raw season data
    if (position.current_season) {
      try {
        // Try to decode season data first
        const parts = position.current_season.split("|");
        if (parts.length === 4) {
          seasonNumber = parseInt(parts[0]);
        } else {
          seasonNumber = parseInt(position.current_season) || 1;
        }
      } catch {
        seasonNumber = parseInt(position.current_season) || 1;
      }
    }

    // Create a large number for season/episode comparison
    // Format: SSSSEEEE (season padded to 4 digits + episode padded to 4 digits)
    // Then add timestamp as decimal portion
    const seasonEpisodeScore = seasonNumber * 10000 + episodeNumber;
    const timestampSeconds = parseTimestamp(
      position.playback_timestamp || "0:00"
    );

    // Convert timestamp to a decimal fraction (max ~1 for a typical episode)
    // Divide by 3600 (1 hour) to normalize timestamp as fraction
    const timestampFraction = timestampSeconds / 3600;

    return seasonEpisodeScore + timestampFraction;
  };

  const refreshPosition = useCallback(async () => {
    if (!room?.id) return;

    console.log("🔄 Refreshing user position for room:", room.id);

    try {
      const result = await getCurrentUserPosition(room.id);
      console.log("📍 Position fetch result:", result);

      if (result?.success && result?.data) {
        console.log("✅ Setting new position:", result.data);
        setPosition(result.data);
        // Update last position update time when we refresh from server
        setLastPositionUpdate(new Date());
      } else {
        console.error("❌ Failed to fetch position:", result.error);
        setError(result.error || "Failed to fetch position");
      }
    } catch (err) {
      console.error("💥 Error loading user position:", err);
      setError("An unexpected error occurred");
    }
  }, [room?.id]);

  const refreshParticipants = useCallback(async () => {
    if (!room?.id) return;

    console.log("👥 Refreshing participants for room:", room.id);

    try {
      const result = await getRoomParticipants(room.id, { joinedOnly: true });
      console.log("👥 Participants fetch result:", result);

      if (result?.success && result?.data) {
        console.log("✅ Setting new participants:", result.data);
        setParticipants(result.data);
      } else {
        console.error("❌ Failed to fetch participants:", result.error);
      }
    } catch (err) {
      console.error("💥 Error loading participants:", err);
    }
  }, [room?.id]);

  const updatePosition = useCallback(
    async (data: {
      season: string | null;
      episode: number | null;
      timestamp: string;
    }): Promise<boolean> => {
      if (!room?.id) return false;

      console.log("🚀 Updating position:", data);

      try {
        const result = await updateParticipantPosition(room.id, data);
        console.log("📡 Update result:", result);

        if (result?.success) {
          // Force refresh from server to ensure accuracy
          console.log("✅ Update successful, refreshing from server");
          await refreshPosition();
          // Update last position update time
          setLastPositionUpdate(new Date());
          // Note: participants will be updated via real-time subscription
          return true;
        } else {
          console.error("❌ Update failed:", result.error);
          setError(result.error || "Failed to update position");
          return false;
        }
      } catch (err) {
        console.error("💥 Error updating position:", err);
        setError("Failed to update position");
        return false;
      }
    },
    [room?.id, refreshPosition]
  );

  const dismissStalenessModal = useCallback(() => {
    setShowStalenessModal(false);
    setLastPositionUpdate(new Date()); // Reset staleness timer
  }, []);

  const openPositionDialog = useCallback(() => {
    setShowStalenessModal(false);
    // Trigger position dialog through callback
    if (positionDialogCallback) {
      positionDialogCallback();
    }
  }, [positionDialogCallback]);

  // Format position for display
  const formatPosition = useCallback(() => {
    if (!position) return "Unknown position";

    if (room.content.content_type === "series" && position.current_season) {
      try {
        const seasonData = decodeSeasonData(position.current_season);
        const episode = position.current_episode || 1;
        const timestamp = position.playback_timestamp || "0:00";
        return `S${seasonData.number}E${episode} ${timestamp}`;
      } catch {
        const season = position.current_season;
        const episode = position.current_episode || 1;
        const timestamp = position.playback_timestamp || "0:00";
        return `S${season}E${episode} ${timestamp}`;
      }
    }

    return position.playback_timestamp || "0:00";
  }, [position, room.content.content_type]);

  // Check for position staleness
  useEffect(() => {
    if (!lastPositionUpdate || !position) return;

    const checkStaleness = () => {
      const now = new Date();
      const timeDiff = now.getTime() - lastPositionUpdate.getTime();

      if (timeDiff >= STALENESS_THRESHOLD && !showStalenessModal) {
        console.log("⏰ Position is stale, showing modal");
        setShowStalenessModal(true);
      }
    };

    const interval = setInterval(checkStaleness, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [lastPositionUpdate, position, showStalenessModal]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      console.log("🏁 Loading initial data for room:", room?.id);
      setLoading(true);
      setError(null);

      try {
        // Load both position and participants
        await Promise.all([refreshPosition(), refreshParticipants()]);
      } catch (err) {
        console.error("💥 Error loading initial data:", err);
        setError("Failed to load initial data");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [refreshPosition, refreshParticipants]);

  // Calculate stats whenever position or participants change
  useEffect(() => {
    console.log("📊 Recalculating position stats");
    calculatePositionStats(position, participants);
  }, [position, participants, calculatePositionStats]);

  // Set up real-time subscription for room_participants table
  useEffect(() => {
    if (!room?.id) return;

    console.log("🔴 Setting up real-time subscription for room:", room.id);

    const realtimeChannel = supabase
      .channel(`room_participants:${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "room_participants",
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          console.log("🔄 Real-time participant update:", payload);

          // Refresh participants data when any participant position changes
          refreshParticipants();

          // If it's the current user's position that changed, also refresh our position
          // (This handles cases where position might be updated from another device/tab)
          if (
            payload.new &&
            user?.id === (payload.new as { user_id: string }).user_id
          ) {
            console.log("🔄 Current user position changed from another source");
            refreshPosition();
          }
        }
      )
      .subscribe((status) => {
        console.log("📡 Real-time subscription status:", status);
      });

    setChannel(realtimeChannel);

    // Cleanup
    return () => {
      console.log("🔴 Cleaning up real-time subscription");
      realtimeChannel.unsubscribe();
      setChannel(null);
    };
  }, [room?.id, supabase, refreshParticipants, refreshPosition, user?.id]);

  const value: UserPositionContextType = {
    position,
    participants,
    positionStats,
    loading,
    error,
    lastPositionUpdate,
    showStalenessModal,
    updatePosition,
    refreshPosition,
    refreshParticipants,
    dismissStalenessModal,
    openPositionDialog,
  };

  // Render staleness modal and set callback for position dialog
  useEffect(() => {
    const callback = () => {
      // This would trigger the position dialog in the parent component
      // We'll need to pass this up through context or props
    };
    setPositionDialogCallback(() => callback);
  }, []);

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
