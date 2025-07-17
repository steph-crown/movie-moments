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
import { Label } from "@/components/ui/label";
import { TimeInput } from "@/components/inputs/time-input";
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
  const [movieTimestamp, setMovieTimestamp] = useState<number>(0); // For movies - in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use the shared position context
  const { position, updatePosition } = useUserPosition();

  const isSeriesWithSeasons =
    room.content.content_type === "series" &&
    room.content.seasons &&
    room.content.seasons.length > 0;

  // Initialize with current position when dialog opens
  useEffect(() => {
    if (open && position) {
      if (isSeriesWithSeasons) {
        // Series logic
        if (position.current_season) {
          setSelectedSeason(position.current_season);
        }
        if (position.current_episode) {
          setSelectedEpisode(position.current_episode);
        }
        if (position.playback_timestamp) {
          setSelectedTimestamp(position.playback_timestamp);
        }
      } else {
        // Movie logic - just timestamp
        if (position.playback_timestamp) {
          setSelectedTimestamp(position.playback_timestamp);
          // Convert timestamp string to seconds for TimeInput
          const parts = position.playback_timestamp.split(":").map(Number);
          let seconds = 0;
          if (parts.length === 2) {
            seconds = parts[0] * 60 + parts[1]; // MM:SS
          } else if (parts.length === 3) {
            seconds = parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
          }
          setMovieTimestamp(seconds);
        }
      }
    }
  }, [open, position, isSeriesWithSeasons]);

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

  const handleMovieTimestampChange = (seconds: number) => {
    setMovieTimestamp(seconds);
    // Convert to string format for storage
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    let timeString: string;
    if (hours > 0) {
      timeString = `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    } else {
      timeString = `${minutes}:${secs.toString().padStart(2, "0")}`;
    }

    setSelectedTimestamp(timeString);
  };

  const handleSubmit = async () => {
    if (isSeriesWithSeasons && !selectedSeason) {
      toast.error("Please select a season");
      return;
    }

    setIsSubmitting(true);

    try {
      // Use the context's updatePosition method instead of direct API call
      const success = await updatePosition({
        season: isSeriesWithSeasons ? selectedSeason : null,
        episode: isSeriesWithSeasons ? selectedEpisode : null,
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

  // Get default values for the selector
  let defaultSeasonNumber = 1;
  if (isSeriesWithSeasons && position?.current_season) {
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
            Tell us where you are in &quot;{room.content.title}&quot; so we can
            sync your experience with the room.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isSeriesWithSeasons ? (
            // Series with seasons - show full selector
            <SeasonsAndEpisodeSelector
              seasons={room.content.seasons || []}
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
          ) : (
            // Movie or series without seasons - just show timestamp
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="movie-time-input">
                  {room.content.content_type === "movie"
                    ? "Current Time Position"
                    : "Current Time Position"}
                </Label>
                <div className="flex items-center gap-3">
                  <TimeInput
                    value={movieTimestamp}
                    onChange={handleMovieTimestampChange}
                    className="flex-shrink-0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Hours : Minutes : Seconds
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Set your current position in{" "}
                  {room.content.content_type === "movie"
                    ? "the movie"
                    : "the content"}
                </p>
              </div>
            </div>
          )}
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
            disabled={isSubmitting}
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
