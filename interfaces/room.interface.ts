/* eslint-disable @typescript-eslint/no-explicit-any */
// Base room interface
export interface RoomWithoutParticipants {
  id: string;
  room_code: string; // ABC123 format for sharing
  title: string;
  content_tmdb_id: number;
  content: ICachedContent;
  streaming_platform: StreamingPlatform; // Netflix, Disney+, Hulu, etc.
  privacy_level: PrivacyLevel;
  spoiler_policy: SpoilerPolicy;

  // REMOVED: Content information is now in participants table
  // season_number?: number; // null for movies
  // episode_number?: number; // null for movies
  total_seasons?: number; // null for movies

  // Room management
  creator_id: string;
  status: "active" | "archived" | "deleted";
  is_permanent: boolean; // Premium feature

  // Timestamps
  created_at: string; // ISO string
  last_activity: string; // ISO string
  archived_at?: string;
  deleted_at?: string;
}

// Room with participant information (for UI display)
export interface IRoom extends RoomWithoutParticipants {
  // Participant stats
  member_count: number;
  unread_count: number; // For current user

  // REMOVED: Current content position is now per-participant
  // current_movie?: string;
  // current_episode?: string; // S1E4 format
  // current_timestamp?: number; // seconds

  // For invitations
  invited_by?: string; // username
  invited_at?: string; // ISO string
  invitation_status?: "pending" | "accepted" | "declined";

  // Creator information
  creator: {
    id: string;
    username: string;
    display_name: string;
  };

  // Participant preview (for UI)
  participants?: ParticipantPreview[];
}

// Participant information for room display
export interface ParticipantPreview {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  status: ParticipantStatus;
  last_seen: string;
  current_season?: string; // Changed to string for encoded data
  current_episode?: number;
  current_timestamp?: string; // Changed to string for time format
}

export interface RoomParticipant {
  id: string;
  user_id: string | null;
  email: string | null;
  username: string | null;
  status: "pending" | "joined";
  role: "creator" | "member";
  join_method: "created" | "invited_email" | "invited_username" | "public_link";
  joined_at: string | null;
  last_seen: string | null;
  current_season: string | null; // Encoded season data
  current_episode: number | null;
  playback_timestamp: string | null; // Time format like "1:23:45"
  position_updated_at: string | null;
  // Profile data from join
  profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export interface CreateRoomData {
  title: string;
  content_tmdb_id: number;
  content_type: ContentType;
  streaming_platform: string;
  privacy_level: PrivacyLevel;
  spoiler_policy: SpoilerPolicy;
  // These are used only to set the creator's initial position in room_participants
  starting_season?: string; // Encoded season data
  starting_episode?: number;
  playback_timestamp?: string; // Time format
}

// Room update payload
export interface UpdateRoomPayload {
  title?: string;
  privacy_level?: PrivacyLevel;
  spoiler_policy?: SpoilerPolicy;
  is_permanent?: boolean; // Premium feature
}

// Room list response (for different tabs)
export interface RoomListResponse {
  created_rooms: IRoom[];
  joined_rooms: IRoom[];
  pending_invitations: IRoom[];
  total_counts: {
    created: number;
    joined: number;
    pending: number;
  };
}

// Room invitation payload
export interface InviteToRoomPayload {
  room_id: string;
  invitees: Array<{
    email?: string;
    username?: string;
  }>;
  personal_message?: string;
}

// For the rooms page state
export interface RoomsPageData {
  rooms: RoomListResponse;
  recent_activity: ActivityItem[];
  user_stats: {
    rooms_created: number;
    rooms_joined: number;
    total_messages: number;
    movies_watched: number;
  };
}

// Activity feed item
export interface ActivityItem {
  id: string;
  user: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  action: string; // "reacted 😱 in", "joined", "commented in", etc.
  room_title: string;
  timestamp: string;
}

export interface ICachedContent {
  id: string;
  tmdb_id: number;
  content_type: RoomContentType;
  title: string; // Could be movie title or series name
  release_date?: string;
  overview?: string;
  poster_path: string;
  backdrop_path: string;
  runtime?: number; // Only for movies
  number_of_seasons?: number; // Only for series
  number_of_episodes?: number; // Only for series
  seasons?: any[]; // Added: Include seasons for position selector
  genres: any[];
  first_air_date?: string;
  platforms?: string[];
  cached_at: string;
  last_accessed: string;
}

// Utility types for UI components
export type RoomCardVariant = "created" | "joined" | "invitation";
export type RoomPrivacy = IRoom["privacy_level"];
export type RoomContentType = "movie" | "series";
export type RoomStatus = IRoom["status"];

export type StreamingPlatform =
  | "Netflix"
  | "Disney+"
  | "Hulu"
  | "Prime Video"
  | "YouTube"
  | "Apple TV+"
  | "HBO Max"
  | "Paramount+"
  | "Peacock"
  | "Other";

export enum ContentTypeEnum {
  Movie = "movie",
  Series = "series",
}

export enum StreamingPlatformEnum {
  NETFLIX = "Netflix",
  DISNEY_PLUS = "Disney+",
  HULU = "Hulu",
  PRIME_VIDEO = "Prime Video",
  YOUTUBE = "YouTube",
  APPLE_TV = "Apple TV+",
  HBO_MAX = "HBO Max",
  PARAMOUNT_PLUS = "Paramount+",
  PEACOCK = "Peacock",
  OTHER = "Other",
}

export type PrivacyLevel = "public" | "private";
export type SpoilerPolicy = "hide_spoilers" | "show_all";
export type ContentType = "movie" | "series";
export type ParticipantStatus = "pending" | "joined" | "left";
