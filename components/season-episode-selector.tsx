// components/room/seasons-episode-selector.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { TimeInput } from "@/components/inputs/time-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  encodeSeasonData,
  decodeSeasonData,
  formatSeasonLabel,
  SeasonData,
} from "@/lib/utils/season.utils";

interface Season {
  season_number: number;
  name: string;
  id: number;
  episode_count: number;
}

interface SeasonsAndEpisodeSelectorProps {
  seasons: Season[];
  defaultSeason?: string | number; // Fixed: Allow both string and number
  defaultEpisode?: number;
  defaultTimestamp?: string | number; // Fixed: Allow both string and number
  onSeasonChange?: (season: SeasonData) => void;
  onEpisodeChange?: (episode: number) => void;
  onTimestampChange?: (timestamp: string) => void; // Fixed: Return string for storage
  seasonLabel?: string;
  episodeLabel?: string;
  timestampLabel?: string;
  showTimestamp?: boolean;
  className?: string;
}

export function SeasonsAndEpisodeSelector({
  seasons,
  defaultSeason = 1,
  defaultEpisode = 1,
  defaultTimestamp = "0:00",
  onSeasonChange,
  onEpisodeChange,
  onTimestampChange,
  seasonLabel = "Season",
  episodeLabel = "Episode",
  timestampLabel = "Current Time Position",
  showTimestamp = true,
  className = "",
}: SeasonsAndEpisodeSelectorProps) {
  const [selectedSeasonData, setSelectedSeasonData] =
    useState<SeasonData | null>(null);
  const [selectedEpisode, setSelectedEpisode] =
    useState<number>(defaultEpisode);
  const [timestamp, setTimestamp] = useState<number>(0);

  // Use ref to track if we've initialized to prevent infinite loops
  const isInitialized = useRef(false);

  // Initialize timestamp
  useEffect(() => {
    if (typeof defaultTimestamp === "string") {
      // Parse string timestamp like "1:23:45" or "5:30"
      const parts = defaultTimestamp.split(":").map(Number);
      if (parts.length === 3) {
        setTimestamp(parts[0] * 3600 + parts[1] * 60 + parts[2]);
      } else if (parts.length === 2) {
        setTimestamp(parts[0] * 60 + parts[1]);
      } else {
        setTimestamp(0);
      }
    } else {
      setTimestamp(defaultTimestamp);
    }
  }, [defaultTimestamp]);

  // Initialize with default season - Fixed to prevent infinite loops
  useEffect(() => {
    if (seasons.length > 0 && !isInitialized.current) {
      // Handle both string and number defaultSeason
      let seasonNumber: number;
      if (typeof defaultSeason === "string") {
        // If it's an encoded season, decode it
        if (defaultSeason.includes("|")) {
          const decoded = decodeSeasonData(defaultSeason);
          seasonNumber = decoded.number;
        } else {
          seasonNumber = parseInt(defaultSeason);
        }
      } else {
        seasonNumber = defaultSeason;
      }

      const defaultSeasonObj = seasons.find(
        (s) => s.season_number === seasonNumber
      );

      if (defaultSeasonObj) {
        const seasonData = {
          number: defaultSeasonObj.season_number,
          name: defaultSeasonObj.name,
          id: defaultSeasonObj.id,
          episodeCount: defaultSeasonObj.episode_count,
        };
        setSelectedSeasonData(seasonData);
        onSeasonChange?.(seasonData);
        isInitialized.current = true;
      }
    }
  }, [seasons, defaultSeason]);

  // Reset initialization when seasons change
  useEffect(() => {
    isInitialized.current = false;
  }, [seasons]);

  const handleSeasonChange = (encodedSeasonValue: string) => {
    const seasonData = decodeSeasonData(encodedSeasonValue);
    setSelectedSeasonData(seasonData);

    // Reset episode to 1 when season changes
    setSelectedEpisode(1);
    onEpisodeChange?.(1);
    onSeasonChange?.(seasonData);
  };

  const handleEpisodeChange = (episodeValue: string) => {
    const episode = parseInt(episodeValue);
    setSelectedEpisode(episode);
    onEpisodeChange?.(episode);
  };

  const handleTimestampChange = (seconds: number) => {
    setTimestamp(seconds);
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

    onTimestampChange?.(timeString);
  };

  // Generate episode options based on selected season
  const episodeOptions = selectedSeasonData
    ? Array.from({ length: selectedSeasonData.episodeCount }, (_, i) => i + 1)
    : [1];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Season and Episode in flex row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Season Selector */}
        <div className="space-y-2">
          <Label htmlFor="season-select">{seasonLabel}</Label>
          <Select
            value={
              selectedSeasonData
                ? encodeSeasonData({
                    season_number: selectedSeasonData.number,
                    name: selectedSeasonData.name,
                    id: selectedSeasonData.id,
                    episode_count: selectedSeasonData.episodeCount,
                  })
                : ""
            }
            onValueChange={handleSeasonChange}
          >
            <SelectTrigger id="season-select" className="w-full">
              <SelectValue placeholder="Select season" />
            </SelectTrigger>
            <SelectContent>
              {seasons.map((season) => (
                <SelectItem
                  key={season.id}
                  value={encodeSeasonData({
                    season_number: season.season_number,
                    name: season.name,
                    id: season.id,
                    episode_count: season.episode_count,
                  })}
                >
                  {formatSeasonLabel(season)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Episode Selector */}
        <div className="space-y-2">
          <Label htmlFor="episode-select">{episodeLabel}</Label>
          <Select
            value={selectedEpisode.toString()}
            onValueChange={handleEpisodeChange}
            disabled={!selectedSeasonData}
          >
            <SelectTrigger id="episode-select" className="w-full">
              <SelectValue placeholder="Select episode" />
            </SelectTrigger>
            <SelectContent>
              {episodeOptions.map((episode) => (
                <SelectItem key={episode} value={episode.toString()}>
                  Episode {episode}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Time Position Input */}
      {showTimestamp && (
        <div className="space-y-2">
          <Label htmlFor="time-input">{timestampLabel}</Label>
          <div className="flex items-center gap-3">
            <TimeInput
              value={timestamp}
              onChange={handleTimestampChange}
              className="flex-shrink-0"
            />
            <p className="text-xs text-muted-foreground">
              Hours : Minutes : Seconds
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
