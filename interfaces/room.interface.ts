// Base room interface
export interface RoomWithoutParticipants {
  id: string;
  room_code: string; // ABC123 format for sharing
  title: string;
  content_type: "movie" | "series";
  streaming_platform: string; // Netflix, Disney+, Hulu, etc.
  privacy_level: "public" | "private";
  spoiler_policy: "hide_spoilers" | "show_all";
  thumbnail_url: string;

  // Content information
  season_number?: number; // null for movies
  episode_number?: number; // null for movies
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

  // Current content position (most common among participants)
  current_movie?: string;
  current_episode?: string; // S1E4 format
  current_timestamp?: number; // seconds

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
  status: "active" | "pending";
  last_seen: string;
  current_season?: number;
  current_episode?: number;
  current_timestamp?: number;
}

// Room creation payload
export interface CreateRoomPayload {
  title: string;
  content_type: "movie" | "series";
  streaming_platform: string;
  privacy_level: "public" | "private";
  spoiler_policy?: "hide_spoilers" | "show_all";

  // For series
  season_number?: number;
  episode_number?: number;
  total_seasons?: number;

  // Initial position
  initial_timestamp?: number;
}

// Room update payload
export interface UpdateRoomPayload {
  title?: string;
  privacy_level?: "public" | "private";
  spoiler_policy?: "hide_spoilers" | "show_all";
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

// Utility types for UI components
export type RoomCardVariant = "created" | "joined" | "invitation";
export type RoomPrivacy = IRoom["privacy_level"];
export type RoomContentType = IRoom["content_type"];
export type RoomStatus = IRoom["status"];
