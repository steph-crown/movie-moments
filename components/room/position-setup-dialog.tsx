// components/room/position-setup-dialog.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SeasonData } from "@/lib/utils/season.utils";
import { updateParticipantPosition } from "@/lib/actions/rooms";
import { IRoom } from "@/interfaces/room.interface";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { SeasonsAndEpisodeSelector } from "../season-episode-selector";

interface PositionSetupDialogProps {
  room: IRoom;
  open: boolean;
  onSuccess: () => void;
}

export function PositionSetupDialog({
  room,
  open,
  onSuccess,
}: PositionSetupDialogProps) {
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [selectedTimestamp, setSelectedTimestamp] = useState<string>("0:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const result = await updateParticipantPosition(room.id, {
        season: selectedSeason,
        episode: selectedEpisode,
        timestamp: selectedTimestamp,
      });

      if (result.success) {
        toast.success("Position updated successfully!");
        onSuccess();
      } else {
        toast.error(result.error || "Failed to update position");
      }
    } catch (error) {
      console.error("Position update error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only show for series with seasons
  if (room.content.content_type !== "series" || !room.content.seasons) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Your Viewing Position</DialogTitle>
          <DialogDescription>
            Tell us where you are in &apos;{room.content.title}&apos; so we can
            sync your experience with the room.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <SeasonsAndEpisodeSelector
            seasons={room.content.seasons}
            defaultSeason={1}
            defaultEpisode={1}
            defaultTimestamp="0:00"
            onSeasonChange={handleSeasonChange}
            onEpisodeChange={handleEpisodeChange}
            onTimestampChange={handleTimestampChange}
            seasonLabel="Current Season"
            episodeLabel="Current Episode"
            timestampLabel="Current Time Position"
            showTimestamp={true}
          />
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!selectedSeason || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting Position...
              </>
            ) : (
              "Set Position & Continue"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
