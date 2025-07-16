export interface SeasonData {
  number: number;
  name: string;
  id: number;
  episodeCount: number;
}

export function encodeSeasonData(season: {
  season_number: number;
  name: string;
  id: number;
  episode_count: number;
}): string {
  return `${season.season_number}|${season.name}|${season.id}|${season.episode_count}`;
}

export function decodeSeasonData(encodedSeason: string): SeasonData {
  const [number, name, id, episodeCount] = encodedSeason.split("|");
  return {
    number: parseInt(number),
    name: name,
    id: parseInt(id),
    episodeCount: parseInt(episodeCount),
  };
}

export function formatSeasonLabel(season: {
  season_number: number;
  name: string;
}): string {
  return `S${season.season_number}: ${season.name}`;
}

export function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(":").map(Number);
  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  }
  return 0;
}
