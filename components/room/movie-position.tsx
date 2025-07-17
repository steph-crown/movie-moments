/* eslint-disable react-hooks/exhaustive-deps */
// components/room/movie-position.tsx
"use client";

import { Clock2, UsersRound } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useMemo, useState } from "react";
import { PositionSetupDialog } from "./position-setup-dialog";
import { IRoom } from "@/interfaces/room.interface";
import { decodeSeasonData } from "@/lib/utils/season.utils";
import { useUserPosition } from "@/contexts/user-position-context";
import { useIsMobile } from "@/hooks/use-mobile";

interface MoviePositionProps {
  room: IRoom;
}

export function MoviePosition({ room }: MoviePositionProps) {
  const [showPositionDialog, setShowPositionDialog] = useState(false);
  const isMobile = useIsMobile();

  // Use the shared position context with real-time stats
  const { position: userPosition, positionStats, loading } = useUserPosition();

  const formatPosition = () => {
    if (loading || !userPosition) {
      return "Loading...";
    }

    if (room.content.content_type === "series" && userPosition.current_season) {
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
    // Position context handles all updates automatically via real-time
  };

  const handleUpdateClick = () => {
    setShowPositionDialog(true);
  };

  const hasPositionMarkers = useMemo(
    () => positionStats.inSync || positionStats.ahead || positionStats.behind,
    [positionStats]
  );

  return (
    <>
      {isMobile && !hasPositionMarkers ? null : (
        <div className="bg-secondary px-4 lg:px-6 py-1.5 flex items-center justify-between">
          {!isMobile && (
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
          )}

          {/* Real-time position stats - No "No other viewers" text */}
          {hasPositionMarkers ? (
            <div className="flex items-center gap-4">
              <UsersRound className="h-4 w-4 text-ring" />

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
          ) : null}
        </div>
      )}

      {/* Position Update Dialog */}
      <PositionSetupDialog
        room={room}
        open={showPositionDialog}
        onSuccess={handlePositionDialogSuccess}
        onOpenChange={setShowPositionDialog}
        allowClose={true}
      />
    </>
  );
}
