/* eslint-disable react-hooks/exhaustive-deps */
// components/room/movie-position.tsx
"use client";

import { IRoom, RoomParticipant } from "@/interfaces/room.interface";
import {
  getCurrentUserPosition,
  getRoomParticipants,
} from "@/lib/actions/rooms";
import { decodeSeasonData } from "@/lib/utils/season.utils";
import { Clock2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { PositionSetupDialog } from "./position-setup-dialog";

interface MoviePositionProps {
  room?: IRoom;
}

interface PositionStats {
  inSync: number;
  behind: number;
  ahead: number;
}

export function MoviePosition({ room }: MoviePositionProps) {
  const [showPositionDialog, setShowPositionDialog] = useState(false);
  const [userPosition, setUserPosition] = useState<{
    current_season: string | null;
    current_episode: number | null;
    playback_timestamp: string | null;
  } | null>(null);
  const [positionStats, setPositionStats] = useState<PositionStats>({
    inSync: 0,
    behind: 0,
    ahead: 0,
  });
  const [loading, setLoading] = useState(true);

  // Load user position and calculate stats
  useEffect(() => {
    const loadPositionData = async () => {
      if (!room) return;

      setLoading(true);
      try {
        // Get user position
        const positionResult = await getCurrentUserPosition(room.id);
        if (positionResult.success && positionResult.data) {
          setUserPosition(positionResult.data);
        }

        // Get all participants to calculate stats
        const participantsResult = await getRoomParticipants(room.id);
        console.log({ participantsResult });
        if (participantsResult.success && participantsResult.data) {
          calculatePositionStats(positionResult.data!, participantsResult.data);
        }
      } catch (error) {
        console.error("Error loading position data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPositionData();
  }, [room]);

  const calculatePositionStats = (
    currentUserPosition: typeof userPosition,
    allParticipants: RoomParticipant[]
  ) => {
    if (!currentUserPosition || !room) return;

    let inSync = 0;
    let behind = 0;
    let ahead = 0;

    const userProgress = calculateProgress(currentUserPosition, room);

    allParticipants.forEach((participant) => {
      // Skip the current user
      if (!participant.current_season && !participant.current_episode) return;

      const participantProgress = calculateProgress(
        {
          current_season: participant.current_season,
          current_episode: participant.current_episode,
          playback_timestamp: participant.playback_timestamp,
        },
        room
      );

      const timeDiff = Math.abs(userProgress - participantProgress);

      if (timeDiff <= 300) {
        // Within 5 minutes = in sync
        inSync++;
      } else if (participantProgress < userProgress) {
        behind++;
      } else {
        ahead++;
      }
    });

    setPositionStats({ inSync: inSync - 1, behind, ahead }); // -1 to exclude self from inSync
  };

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

    // For series, calculate total progress
    let totalSeconds = 0;

    // Add complete seasons (assume 45min episodes, 10 episodes per season)
    if (position.current_season) {
      try {
        const seasonData = decodeSeasonData(position.current_season);
        totalSeconds += (seasonData.number - 1) * 10 * 45 * 60; // Previous seasons
      } catch {
        const seasonNum = parseInt(position.current_season) || 1;
        totalSeconds += (seasonNum - 1) * 10 * 45 * 60; // Previous seasons
      }
    }

    // Add complete episodes in current season
    if (position.current_episode) {
      totalSeconds += (position.current_episode - 1) * 45 * 60; // Previous episodes
    }

    // Add current episode timestamp
    totalSeconds += parseTimestamp(position.playback_timestamp || "0:00");

    return totalSeconds;
  };

  const parseTimestamp = (timestamp: string): number => {
    const parts = timestamp.split(":").map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1]; // MM:SS
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
    }
    return 0;
  };

  const formatPosition = () => {
    if (loading || !userPosition) {
      return "Loading...";
    }

    if (
      room?.content.content_type === "series" &&
      userPosition.current_season
    ) {
      try {
        const seasonData = decodeSeasonData(userPosition.current_season);
        const episode = userPosition.current_episode || 1;
        const timestamp = userPosition.playback_timestamp || "0:00";
        return `S${seasonData.number}E${episode} ${timestamp}`;
      } catch {
        // Fallback if decoding fails
        const season = userPosition.current_season;
        const episode = userPosition.current_episode || 1;
        const timestamp = userPosition.playback_timestamp || "0:00";
        return `S${season}E${episode} ${timestamp}`;
      }
    }

    return userPosition.playback_timestamp || "0:00";
  };

  const handlePositionDialogSuccess = async () => {
    setShowPositionDialog(false);
    // Reload position data
    if (room) {
      const result = await getCurrentUserPosition(room.id);
      if (result.success && result.data) {
        setUserPosition(result.data);
      }
    }
  };

  const handleUpdateClick = () => {
    setShowPositionDialog(true);
  };

  if (!room) return null;

  return (
    <>
      <div className="bg-secondary px-4 lg:px-6 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock2 className="h-4 text-muted-foreground" />

          <p className="text-[13px] text-muted-foreground font-medium">
            Your position:
          </p>

          <Badge className="bg-foreground rounded-sm font-medium">
            {formatPosition()}
          </Badge>

          <Button variant="outline" size="sm" onClick={handleUpdateClick}>
            Update
          </Button>
        </div>

        <div className="hidden lg:flex items-center gap-4">
          {positionStats.inSync > 0 && (
            <div className="flex items-center gap-1 text-[13px] text-muted-foreground font-medium">
              <div className="h-2 w-2 rounded-full bg-chart-2" />
              <p>{positionStats.inSync} in sync</p>
            </div>
          )}

          {positionStats.behind > 0 && (
            <div className="flex items-center gap-1 text-[13px] text-muted-foreground font-medium">
              <div className="h-2 w-2 rounded-full bg-chart-4" />
              <p>{positionStats.behind} behind</p>
            </div>
          )}

          {positionStats.ahead > 0 && (
            <div className="flex items-center gap-1 text-[13px] text-muted-foreground font-medium">
              <div className="h-2 w-2 rounded-full bg-chart-1" />
              <p>{positionStats.ahead} ahead</p>
            </div>
          )}
        </div>
      </div>

      {/* Position Update Dialog */}
      {room && (
        <PositionSetupDialog
          room={room}
          open={showPositionDialog}
          onSuccess={handlePositionDialogSuccess}
          onOpenChange={setShowPositionDialog}
          initialSeason={userPosition?.current_season}
          initialEpisode={userPosition?.current_episode}
          initialTimestamp={userPosition?.playback_timestamp}
          allowClose={true}
        />
      )}
    </>
  );
}
