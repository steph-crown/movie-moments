// components/room/position-setup-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SeasonData, decodeSeasonData } from "@/lib/utils/season.utils";
import { IRoom } from "@/interfaces/room.interface";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useUserPosition } from "@/contexts/user-position-context";
import { SeasonsAndEpisodeSelector } from "../season-episode-selector";

interface PositionSetupDialogProps {
  room: IRoom;
  open: boolean;
  onSuccess: () => void;
  onOpenChange?: (open: boolean) => void;
  // Allow closing for updates (but not for initial setup)
  allowClose?: boolean;
}

export function PositionSetupDialog({
  room,
  open,
  onSuccess,
  onOpenChange,
  allowClose = false,
}: PositionSetupDialogProps) {
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [selectedTimestamp, setSelectedTimestamp] = useState<string>("0:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use the shared position context
  const { position, updatePosition } = useUserPosition();

  // Initialize with current position when dialog opens
  useEffect(() => {
    if (open && position) {
      if (position.current_season) {
        setSelectedSeason(position.current_season);
      }
      if (position.current_episode) {
        setSelectedEpisode(position.current_episode);
      }
      if (position.playback_timestamp) {
        setSelectedTimestamp(position.playback_timestamp);
      }
    }
  }, [open, position]);

  const handleSeasonChange = (season: SeasonData) => {
    const encodedSeason = `${season.number}|${season.name}|${season.id}|${season.episodeCount}`;
    setSelectedSeason(encodedSeason);
  };

  const handleEpisodeChange = (episode: number) => {
    setSelectedEpisode(episode);
  };

  const handleTimestampChange = (timestamp: string) => {
    setSelectedTimestamp(timestamp);
  };

  const handleSubmit = async () => {
    if (!selectedSeason) {
      toast.error("Please select a season");
      return;
    }

    setIsSubmitting(true);

    try {
      // Use the context's updatePosition method instead of direct API call
      const success = await updatePosition({
        season: selectedSeason,
        episode: selectedEpisode,
        timestamp: selectedTimestamp,
      });

      if (success) {
        toast.success("Position updated successfully!");
        onSuccess();
      } else {
        toast.error("Failed to update position");
      }
    } catch (error) {
      console.error("Position update error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (allowClose && onOpenChange) {
      onOpenChange(false);
    }
  };

  // Only show for series with seasons
  if (room.content.content_type !== "series" || !room.content.seasons) {
    return null;
  }

  // Get default values for the selector
  let defaultSeasonNumber = 1;
  if (position?.current_season) {
    try {
      const decoded = decodeSeasonData(position.current_season);
      defaultSeasonNumber = decoded.number;
    } catch {
      defaultSeasonNumber = parseInt(position.current_season) || 1;
    }
  }

  return (
    <Dialog open={open} onOpenChange={allowClose ? onOpenChange : undefined}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {allowClose ? "Update Your Position" : "Set Your Viewing Position"}
          </DialogTitle>
          <DialogDescription>
            Tell us where you are in &apos;{room.content.title}&apos; so we can
            sync your experience with the room.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <SeasonsAndEpisodeSelector
            seasons={room.content.seasons}
            defaultSeason={defaultSeasonNumber}
            defaultEpisode={position?.current_episode || 1}
            defaultTimestamp={position?.playback_timestamp || "0:00"}
            onSeasonChange={handleSeasonChange}
            onEpisodeChange={handleEpisodeChange}
            onTimestampChange={handleTimestampChange}
            seasonLabel="Current Season"
            episodeLabel="Current Episode"
            timestampLabel="Current Time Position"
            showTimestamp={true}
          />
        </div>

        <DialogFooter className="gap-2">
          {allowClose && (
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!selectedSeason || isSubmitting}
            className={allowClose ? "" : "w-full"}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {allowClose ? "Updating..." : "Setting Position..."}
              </>
            ) : allowClose ? (
              "Update Position"
            ) : (
              "Set Position & Continue"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
