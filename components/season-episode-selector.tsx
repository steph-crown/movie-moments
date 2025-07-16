// Updated components/room/seasons-episode-selector.tsx
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
  defaultSeason?: number;
  defaultEpisode?: number;
  defaultTimestamp?: number; // in seconds
  onSeasonChange?: (season: SeasonData) => void;
  onEpisodeChange?: (episode: number) => void;
  onTimestampChange?: (timestamp: number) => void; // in seconds
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
  defaultTimestamp = 0,
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
  const [timestamp, setTimestamp] = useState<number>(defaultTimestamp);

  // Use ref to track if we've initialized to prevent infinite loops
  const isInitialized = useRef(false);

  // Initialize with default season - Fixed to prevent infinite loops
  useEffect(() => {
    if (seasons.length > 0 && !isInitialized.current) {
      const defaultSeasonObj = seasons.find(
        (s) => s.season_number === defaultSeason
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
    onTimestampChange?.(seconds);
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
