/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/lib/supabase/server";
import { generateRoomCode } from "@/lib/utils/room.utils";
import { revalidatePath } from "next/cache";
import {
  CreateRoomData,
  IRoom,
  RoomParticipant,
} from "@/interfaces/room.interface";
import { fetchDetailedContent } from "../tmdb";

export type RoomFilter = "all" | "created" | "joined" | "invited";
export type RoomSort = "last_updated" | "date_created" | "alphabetical";
export type SortDirection = "asc" | "desc";

export interface FetchRoomsParams {
  filter?: RoomFilter;
  sort?: RoomSort;
  direction?: SortDirection;
  search?: string;
  page?: number;
  limit?: number;
}

// Updated fetchUserRooms - remove starting_season/starting_episode from query

export async function fetchUserRooms({
  filter = "all",
  sort = "last_updated",
  direction = "desc",
  search = "",
  page = 1,
  limit = 12,
}: FetchRoomsParams): Promise<{
  success: boolean;
  data?: {
    rooms: IRoom[];
    totalCount: number;
    hasMore: boolean;
  };
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "You must be logged in to view rooms",
      };
    }

    let query = supabase
      .from("room_participants")
      .select(
        `
        room_id,
        status,
        role,
        join_method,
        joined_at,
        current_season,
        current_episode,
        playback_timestamp,
        rooms!inner (
          id,
          room_code,
          title,
          content_tmdb_id,
          content_type,
          streaming_platform,
          privacy_level,
          spoiler_policy,
          creator_id,
          status,
          is_permanent,
          member_count,
          created_at,
          last_activity,
          content_cache!rooms_content_cache_fkey (
            id,
            tmdb_id,
            content_type,
            title,
            overview,
            poster_path,
            backdrop_path,
            runtime,
            number_of_seasons,
            number_of_episodes,
            seasons,
            genres,
            release_date,
            first_air_date,
            cached_at,
            last_accessed
          )
        )
      `
      )
      .eq("user_id", user.id);

    // Build count query with same filters
    let countQuery = supabase
      .from("room_participants")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Apply filters to both queries
    switch (filter) {
      case "created":
        query = query.eq("role", "creator");
        countQuery = countQuery.eq("role", "creator");
        break;
      case "joined":
        query = query.eq("status", "joined").neq("role", "creator");
        countQuery = countQuery.eq("status", "joined").neq("role", "creator");
        break;
      case "invited":
        query = query.eq("status", "pending");
        countQuery = countQuery.eq("status", "pending");
        break;
    }

    // Apply search to both queries
    if (search.trim()) {
      query = query.ilike("rooms.title", `%${search}%`);
      countQuery = countQuery.ilike("rooms.title", `%${search}%`);
    }

    // Get total count with same filters
    const { count } = await countQuery;

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error("Fetch rooms error:", error);
      return { success: false, error: "Failed to fetch rooms" };
    }

    // Transform data - REMOVED season_number and episode_number from room
    const rooms: IRoom[] = data.map((item: any) => {
      const room = item.rooms;
      const cachedContent = room.content_cache;

      return {
        id: room.id,
        room_code: room.room_code,
        title: room.title,
        content_tmdb_id: room.content_tmdb_id,
        content: cachedContent
          ? {
              id: cachedContent.id,
              tmdb_id: cachedContent.tmdb_id,
              content_type: cachedContent.content_type,
              title: cachedContent.title,
              overview: cachedContent.overview,
              poster_path: cachedContent.poster_path,
              backdrop_path: cachedContent.backdrop_path,
              runtime: cachedContent.runtime,
              number_of_seasons: cachedContent.number_of_seasons,
              number_of_episodes: cachedContent.number_of_episodes,
              seasons: cachedContent.seasons || [], // Include seasons for position selector
              genres: cachedContent.genres || [],
              release_date: cachedContent.release_date,
              first_air_date: cachedContent.first_air_date,
              platforms: [],
              cached_at: cachedContent.cached_at,
              last_accessed: cachedContent.last_accessed,
            }
          : {
              id: `${room.content_tmdb_id}`,
              tmdb_id: room.content_tmdb_id,
              content_type: room.content_type,
              title: room.title,
              poster_path: "",
              backdrop_path: "",
              seasons: [],
              genres: [],
              cached_at: new Date().toISOString(),
              last_accessed: new Date().toISOString(),
            },
        streaming_platform: room.streaming_platform,
        privacy_level: room.privacy_level,
        spoiler_policy: room.spoiler_policy,
        // REMOVED: season_number and episode_number
        creator_id: room.creator_id,
        status: room.status,
        is_permanent: room.is_permanent,
        member_count: room.member_count,
        created_at: room.created_at,
        last_activity: room.last_activity,
        unread_count: 0,
        creator: {
          id: room.creator_id,
          username: "User",
          display_name: "User",
        },
        invitation_status:
          item.status === "pending"
            ? "pending"
            : item.status === "joined"
              ? "accepted"
              : undefined,
        invited_at: item.status === "pending" ? item.joined_at : undefined,
      };
    });

    // Apply sorting in JavaScript since Supabase foreign table sorting is unreliable
    const sortedRooms = rooms.sort((a, b) => {
      let comparison = 0;

      switch (sort) {
        case "date_created":
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "alphabetical":
          comparison = a.title.localeCompare(b.title);
          break;
        case "last_updated":
        default:
          comparison =
            new Date(a.last_activity).getTime() -
            new Date(b.last_activity).getTime();
          break;
      }

      return direction === "asc" ? comparison : -comparison;
    });

    const totalCount = count || 0;
    const hasMore = offset + limit < totalCount;

    return {
      success: true,
      data: {
        rooms: sortedRooms,
        totalCount,
        hasMore,
      },
    };
  } catch (error) {
    console.error("Fetch rooms error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch rooms",
    };
  }
}

// Updated createRoom function - remove starting_season and starting_episode from room creation

export async function createRoom(
  data: CreateRoomData,
  contentData?: {
    tmdb_id: number;
    content_type: string;
    title: string;
    overview?: string;
    poster_path?: string | null;
    backdrop_path?: string | null;
    release_date?: string;
    first_air_date?: string;
    runtime?: number;
    seasons?: any[];
    number_of_seasons?: number;
    number_of_episodes?: number;
    genres?: any[];
  }
): Promise<{
  success: boolean;
  data?: {
    id: string;
    room_code: string;
    title: string;
  };
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: "You must be logged in to create a room",
      };
    }

    // Check if content exists in cache, if not create it
    const { data: existingContent } = await supabase
      .from("content_cache")
      .select("id")
      .eq("tmdb_id", data.content_tmdb_id)
      .eq("content_type", data.content_type)
      .single();

    if (!existingContent && contentData) {
      // Content doesn't exist, create it
      const { error: contentError } = await supabase
        .from("content_cache")
        .insert({
          tmdb_id: contentData.tmdb_id,
          content_type: contentData.content_type,
          title: contentData.title,
          overview: contentData.overview || "",
          poster_path: contentData.poster_path || "",
          backdrop_path: contentData.backdrop_path || "",
          release_date: contentData.release_date || null,
          first_air_date: contentData.first_air_date || null,
          runtime: contentData.runtime || null,
          number_of_seasons: contentData.number_of_seasons || null,
          number_of_episodes: contentData.number_of_episodes || null,
          seasons: contentData.seasons || [],
          genres: contentData.genres || [],
        });

      if (contentError) {
        console.error("Content cache creation error:", contentError);
        return { success: false, error: "Failed to cache content information" };
      }
    } else if (!existingContent && !contentData) {
      return {
        success: false,
        error: "Content not found in cache and no content data provided",
      };
    }

    // Generate unique room code
    let roomCode = generateRoomCode();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const { data: existingRoom } = await supabase
        .from("rooms")
        .select("room_code")
        .eq("room_code", roomCode)
        .single();

      if (!existingRoom) {
        break; // Code is unique
      }

      roomCode = generateRoomCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return { success: false, error: "Failed to generate unique room code" };
    }

    // Create the room - REMOVED starting_season and starting_episode
    const { data: room, error: createError } = await supabase
      .from("rooms")
      .insert({
        room_code: roomCode,
        title: data.title,
        content_tmdb_id: data.content_tmdb_id,
        content_type: data.content_type,
        streaming_platform: data.streaming_platform,
        privacy_level: data.privacy_level,
        spoiler_policy: data.spoiler_policy,
        creator_id: user.id,
      })
      .select("id, room_code, title")
      .single();

    if (createError) {
      console.error("Room creation error:", createError);
      return { success: false, error: "Failed to create room" };
    }

    // Create room participant entry for creator with initial position
    const { error: participantError } = await supabase
      .from("room_participants")
      .insert({
        room_id: room.id,
        user_id: user.id,
        status: "joined",
        role: "creator",
        join_method: "created",
        invited_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        current_season: data.starting_season || null, // Store encoded season from form
        current_episode: data.starting_episode || null,
        playback_timestamp: data.playback_timestamp || "0:00",
        position_updated_at: new Date().toISOString(),
      });

    if (participantError) {
      console.error("Participant creation error:", participantError);
      // Don't fail room creation for this
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/rooms");

    return {
      success: true,
      data: {
        id: room.id,
        room_code: room.room_code,
        title: room.title,
      },
    };
  } catch (error) {
    console.error("Create room error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create room",
    };
  }
}

// Updated fetchRoomByCode - remove starting_season/starting_episode from room data

export async function fetchRoomByCode(
  roomCode: string,
  options: {
    requireParticipation?: boolean;
    includeParticipantStatus?: boolean;
    allowUnauthenticatedPublic?: boolean;
  } = {}
): Promise<{
  success: boolean;
  data?: {
    room: IRoom;
    userStatus?: "not_member" | "pending" | "joined" | "left";
    participantId?: string;
    isAuthenticated?: boolean;
  };
  error?: string;
  requiresAuth?: boolean;
}> {
  try {
    const supabase = await createClient();
    const {
      requireParticipation = true,
      includeParticipantStatus = false,
      allowUnauthenticatedPublic = false,
    } = options;

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If no user and we don't allow unauthenticated access, return auth required
    if (!user && !allowUnauthenticatedPublic) {
      return {
        success: false,
        error: "Authentication required",
        requiresAuth: true,
      };
    }

    // Get room data - REMOVED starting_season and starting_episode
    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .select(
        `
        id,
        room_code,
        title,
        content_tmdb_id,
        content_type,
        streaming_platform,
        privacy_level,
        spoiler_policy,
        creator_id,
        status,
        is_permanent,
        member_count,
        created_at,
        last_activity,
        content_cache!rooms_content_cache_fkey (
          id,
          tmdb_id,
          content_type,
          title,
          overview,
          poster_path,
          backdrop_path,
          runtime,
          number_of_seasons,
          number_of_episodes,
          seasons,
          genres,
          release_date,
          first_air_date,
          cached_at,
          last_accessed
        )
      `
      )
      .eq("room_code", roomCode)
      .single();

    if (roomError || !roomData) {
      if (!user) {
        return {
          success: false,
          error: "Authentication required",
          requiresAuth: true,
        };
      }

      return {
        success: false,
        error: "Room not found",
      };
    }

    // If no user but room is private, require auth
    if (!user && roomData.privacy_level === "private") {
      return {
        success: false,
        error: "Authentication required",
        requiresAuth: true,
      };
    }

    let userStatus: "not_member" | "pending" | "joined" | "left" = "not_member";
    let participantId: string | undefined;
    let participantData: any = null;

    // Only check participation if user is authenticated
    if (user) {
      const { data: fetchedParticipantData } = await supabase
        .from("room_participants")
        .select("id, status, role, joined_at")
        .eq("room_id", roomData.id)
        .eq("user_id", user.id)
        .single();

      participantData = fetchedParticipantData;

      if (participantData) {
        userStatus = participantData.status as "pending" | "joined" | "left";
        participantId = participantData.id;
      }

      // Check access requirements
      if (requireParticipation) {
        const isCreator = roomData.creator_id === user.id;
        const isJoinedParticipant =
          participantData && participantData.status === "joined";

        if (!isCreator && !isJoinedParticipant) {
          if (includeParticipantStatus) {
            // Don't return error, just include status for access control logic
          } else {
            return {
              success: false,
              error: "You are not a member of this room",
            };
          }
        }
      }
    }

    // Transform room data - REMOVED season_number and episode_number from room
    const cachedContent = roomData.content_cache as any;
    const room: IRoom = {
      id: roomData.id,
      room_code: roomData.room_code,
      title: roomData.title,
      content_tmdb_id: roomData.content_tmdb_id,
      content: cachedContent
        ? {
            id: cachedContent.id,
            tmdb_id: cachedContent.tmdb_id,
            content_type: cachedContent.content_type,
            title: cachedContent.title,
            overview: cachedContent.overview,
            poster_path: cachedContent.poster_path,
            backdrop_path: cachedContent.backdrop_path,
            runtime: cachedContent.runtime,
            number_of_seasons: cachedContent.number_of_seasons,
            number_of_episodes: cachedContent.number_of_episodes,
            seasons: cachedContent.seasons || [], // Include seasons for position selector
            genres: cachedContent.genres || [],
            release_date: cachedContent.release_date,
            first_air_date: cachedContent.first_air_date,
            platforms: [],
            cached_at: cachedContent.cached_at,
            last_accessed: cachedContent.last_accessed,
          }
        : {
            id: `${roomData.content_tmdb_id}`,
            tmdb_id: roomData.content_tmdb_id,
            content_type: roomData.content_type,
            title: roomData.title,
            poster_path: "",
            backdrop_path: "",
            seasons: [],
            genres: [],
            cached_at: new Date().toISOString(),
            last_accessed: new Date().toISOString(),
          },
      streaming_platform: roomData.streaming_platform,
      privacy_level: roomData.privacy_level,
      spoiler_policy: roomData.spoiler_policy,
      // REMOVED: season_number and episode_number are no longer on room
      creator_id: roomData.creator_id,
      status: roomData.status,
      is_permanent: roomData.is_permanent,
      member_count: roomData.member_count,
      created_at: roomData.created_at,
      last_activity: roomData.last_activity,
      unread_count: 0,
      creator: {
        id: roomData.creator_id,
        username: "User",
        display_name: "User",
      },
      invitation_status:
        user && participantData?.status === "pending"
          ? "pending"
          : user && participantData?.status === "joined"
            ? "accepted"
            : undefined,
      invited_at:
        user && participantData?.status === "pending"
          ? participantData.joined_at
          : undefined,
    };

    const result: {
      room: IRoom;
      userStatus?: "not_member" | "pending" | "joined" | "left";
      participantId?: string;
      isAuthenticated?: boolean;
    } = {
      room,
      isAuthenticated: !!user,
    };

    if (includeParticipantStatus) {
      result.userStatus = userStatus;
      result.participantId = participantId;
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error in fetchRoomByCode:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch room",
    };
  }
}

export async function checkUserRoomAccess(roomCode: string): Promise<{
  success: boolean;
  data?: {
    room: IRoom;
    userStatus: "not_member" | "pending" | "joined" | "left";
    participantId?: string;
  };
  error?: string;
  requiresAuth?: boolean;
}> {
  try {
    const result = await fetchRoomByCode(roomCode, {
      requireParticipation: false, // Don't require participation
      includeParticipantStatus: true, // Include status for access control
    });

    console.log({ truth: result });

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        requiresAuth: result.requiresAuth,
      };
    }

    if (!result.data?.userStatus) {
      return {
        success: false,
        error: "Failed to determine user status",
      };
    }

    return {
      success: true,
      data: {
        room: result.data.room,
        userStatus: result.data.userStatus,
        participantId: result.data.participantId,
      },
    };
  } catch (error) {
    console.error("Error in checkUserRoomAccess:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getRoomParticipants(roomId: string): Promise<{
  success: boolean;
  data?: RoomParticipant[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user to check permissions
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return {
        success: false,
        error: "You must be logged in to view participants",
      };
    }

    // Check if user has access to this room (is a participant or creator)
    // const { data: userParticipation, error: participationError } =
    //   await supabase
    //     .from("room_participants")
    //     .select("status, role")
    //     .eq("room_id", roomId)
    //     .eq("user_id", currentUser.id)
    //     .single();

    // if (participationError && participationError.code !== "PGRST116") {
    //   console.error("Error checking user participation:", participationError);
    //   return { success: false, error: "Failed to verify room access" };
    // }

    // Also check if user is the room creator
    // const { data: room, error: roomError } = await supabase
    //   .from("rooms")
    //   .select("creator_id")
    //   .eq("id", roomId)
    //   .single();

    // if (roomError) {
    //   console.error("Error checking room creator:", roomError);
    //   return { success: false, error: "Failed to verify room access" };
    // }

    // const isCreator = room.creator_id === currentUser.id;
    // const isParticipant =
    //   userParticipation && userParticipation.status === "joined";

    // if (!isCreator && !isParticipant) {
    //   return {
    //     success: false,
    //     error: "You don't have access to view this room's participants",
    //   };
    // }

    // Get all participants first
    const { data: participants, error: participantsError } = await supabase
      .from("room_participants")
      .select(
        `
        id,
        user_id,
        email,
        username,
        status,
        role,
        join_method,
        joined_at,
        last_seen,
        current_season,
        current_episode,
        playback_timestamp,
        position_updated_at
      `
      )
      .eq("room_id", roomId)
      .order("role", { ascending: false }) // Creators first
      .order("joined_at", { ascending: true }); // Then by join time

    if (participantsError) {
      console.error("Error fetching room participants:", participantsError);
      return { success: false, error: "Failed to fetch participants" };
    }

    // Get profile data for participants who have user_id
    const userIds = participants.filter((p) => p.user_id).map((p) => p.user_id);

    let profiles: any[] = [];
    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        // Continue without profiles rather than failing completely
      } else {
        profiles = profilesData || [];
      }
    }

    // Transform the data to match our interface
    const transformedParticipants: RoomParticipant[] = participants.map(
      (participant: any) => {
        const profile = participant.user_id
          ? profiles.find((p) => p.id === participant.user_id)
          : null;

        return {
          id: participant.id,
          user_id: participant.user_id,
          email: participant.email,
          username: participant.username,
          status: participant.status,
          role: participant.role,
          join_method: participant.join_method,
          joined_at: participant.joined_at,
          last_seen: participant.last_seen,
          current_season: participant.current_season,
          current_episode: participant.current_episode,
          playback_timestamp: participant.playback_timestamp,
          position_updated_at: participant.position_updated_at,
          profile: profile
            ? {
                display_name: profile.display_name,
                username: profile.username,
                avatar_url: profile.avatar_url,
              }
            : null,
        };
      }
    );

    return { success: true, data: transformedParticipants };
  } catch (error) {
    console.error("Error in getRoomParticipants:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function joinRoom(roomId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "You must be logged in to join a room" };
    }

    // Check if room exists and get basic info
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id, title, privacy_level, creator_id")
      .eq("id", roomId)
      .single();

    if (roomError || !room) {
      return { success: false, error: "Room not found" };
    }

    // Check if user is already a participant
    const { data: existingParticipant, error: participantError } =
      await supabase
        .from("room_participants")
        .select("id, status, role")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .single();

    if (participantError && participantError.code !== "PGRST116") {
      console.error("Error checking existing participant:", participantError);
      return { success: false, error: "Failed to check participation status" };
    }

    if (existingParticipant) {
      // User already exists, update their status to joined
      const { error: updateError } = await supabase
        .from("room_participants")
        .update({
          status: "joined",
          joined_at: new Date().toISOString(),
          last_seen: new Date().toISOString(),
        })
        .eq("id", existingParticipant.id);

      if (updateError) {
        console.error("Error updating participant status:", updateError);
        return { success: false, error: "Failed to join room" };
      }

      return {
        success: true,
        message:
          existingParticipant.status === "pending"
            ? "Successfully joined the room!"
            : "Welcome back to the room!",
      };
    } else {
      // User doesn't exist as participant, create new entry
      const { error: insertError } = await supabase
        .from("room_participants")
        .insert({
          room_id: roomId,
          user_id: user.id,
          status: "joined",
          role: "member",
          join_method: "public_link",
          joined_at: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          current_season: null,
          current_episode: null,
          playback_timestamp: 0,
        });

      if (insertError) {
        console.error("Error creating participant:", insertError);
        return { success: false, error: "Failed to join room" };
      }

      return { success: true, message: "Successfully joined the room!" };
    }
  } catch (error) {
    console.error("Error in joinRoom:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Add this function to your room actions file

export async function joinRoomByCode(roomCodeOrLink: string): Promise<{
  success: boolean;
  data?: {
    roomCode: string;
    roomId: string;
    message: string;
  };
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "You must be logged in to join a room" };
    }

    // Extract room code from link or use as-is
    let roomCode = roomCodeOrLink.trim();

    // Check if it's a URL and extract room code
    if (roomCode.includes("/")) {
      const segments = roomCode.split("/");
      roomCode = segments[segments.length - 1];
    }

    // Clean up room code (remove query params if any)
    if (roomCode.includes("?")) {
      roomCode = roomCode.split("?")[0];
    }

    // Validate room code format
    if (!roomCode || roomCode.length < 3) {
      return { success: false, error: "Invalid room code format" };
    }

    console.log({ roomCode });

    // Find room by code
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id, title, privacy_level, creator_id, room_code, member_count")
      .eq("room_code", roomCode)
      .eq("status", "active") // Only active rooms
      .single();

    console.log({ roomError });

    if (roomError || !room) {
      return {
        success: false,
        error: "Room not found or is private. Please check the room code/link.",
      };
    }

    // Check if user is already a participant
    const { data: existingParticipant, error: participantError } =
      await supabase
        .from("room_participants")
        .select("id, status, role")
        .eq("room_id", room.id)
        .eq("user_id", user.id)
        .single();

    if (participantError && participantError.code !== "PGRST116") {
      console.error("Error checking existing participant:", participantError);
      return { success: false, error: "Failed to check participation status" };
    }

    if (existingParticipant) {
      // User already exists as participant
      if (existingParticipant.status === "joined") {
        return {
          success: true,
          data: {
            roomCode: room.room_code,
            roomId: room.id,
            message: "You're already a member of this room!",
          },
        };
      }

      // User exists but not joined (pending or left) - update to joined
      const { error: updateError } = await supabase
        .from("room_participants")
        .update({
          status: "joined",
          joined_at: new Date().toISOString(),
          last_seen: new Date().toISOString(),
        })
        .eq("id", existingParticipant.id);

      if (updateError) {
        console.error("Error updating participant status:", updateError);
        return { success: false, error: "Failed to join room" };
      }

      // Update room last activity
      await supabase
        .from("rooms")
        .update({ last_activity: new Date().toISOString() })
        .eq("id", room.id);

      const message =
        existingParticipant.status === "pending"
          ? "Successfully joined the room!"
          : "Welcome back to the room!";

      return {
        success: true,
        data: {
          roomCode: room.room_code,
          roomId: room.id,
          message,
        },
      };
    }

    // User doesn't exist as participant
    if (room.privacy_level === "private") {
      // For private rooms, user must be invited first
      return {
        success: false,
        error: "This is a private room. You need an invitation to join.",
      };
    }

    // Public room - create new participant entry
    const { error: insertError } = await supabase
      .from("room_participants")
      .insert({
        room_id: room.id,
        user_id: user.id,
        status: "joined",
        role: "member",
        join_method: "public_link",
        invited_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        current_season: null,
        current_episode: null,
        playback_timestamp: 0,
        position_updated_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Error creating participant:", insertError);
      return { success: false, error: "Failed to join room" };
    }

    // Update room member count and last activity
    const { error: countUpdateError } = await supabase
      .from("rooms")
      .update({
        member_count: (room.member_count || 0) + 1,
        last_activity: new Date().toISOString(),
      })
      .eq("id", room.id);

    if (countUpdateError) {
      console.error("Error updating room:", countUpdateError);
      // Don't fail the join for this
    }

    return {
      success: true,
      data: {
        roomCode: room.room_code,
        roomId: room.id,
        message: "Successfully joined the room!",
      },
    };
  } catch (error) {
    console.error("Error in joinRoomByCode:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateContentCacheWithDetailsIfNeeded(
  tmdbId: number,
  contentType: "movie" | "series"
): Promise<{
  success: boolean;
  error?: string;
  wasUpdated?: boolean;
  detailedContent?: any;
}> {
  try {
    const supabase = await createClient();

    // Check if we already have detailed data
    const { data: existingContent } = await supabase
      .from("content_cache")
      .select("seasons, detailed_fetched_at")
      .eq("tmdb_id", tmdbId)
      .eq("content_type", contentType)
      .single();

    // Skip if we already have detailed data
    const hasDetailedData =
      contentType === "series"
        ? existingContent?.seasons && existingContent.seasons.length > 0
        : existingContent?.detailed_fetched_at;

    if (hasDetailedData) {
      return {
        success: true,
        wasUpdated: false,
        detailedContent: { seasons: existingContent?.seasons },
      };
    }

    // Fetch detailed content from TMDB
    const detailedContent = await fetchDetailedContent(tmdbId, contentType);

    console.log({ heatyyyyyy: detailedContent.seasons });

    // Update the content_cache record
    const { error: updateError } = await supabase
      .from("content_cache")
      .update({
        seasons: detailedContent.seasons || [],
        number_of_seasons: detailedContent.number_of_seasons,
        number_of_episodes: detailedContent.number_of_episodes,
        detailed_fetched_at: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
      })
      .eq("tmdb_id", tmdbId)
      .eq("content_type", contentType);

    if (updateError) {
      console.error("Error updating content cache:", updateError);
      return { success: false, error: "Failed to update content cache" };
    }

    return { success: true, wasUpdated: true, detailedContent };
  } catch (error) {
    console.error("Error in updateContentCacheWithDetailsIfNeeded:", error);
    return { success: false, error: "Failed to fetch detailed content" };
  }
}

// Add this to your room actions file

export async function updateParticipantPosition(
  roomId: string,
  seasonData?: {
    season: string; // encoded season data
    episode: number;
    timestamp: string;
  }
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "You must be logged in" };
    }

    // Update the participant's current position
    const { error: updateError } = await supabase
      .from("room_participants")
      .update({
        current_season: seasonData?.season || null,
        current_episode: seasonData?.episode || null,
        playback_timestamp: seasonData?.timestamp || "0:00",
        position_updated_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
      })
      .eq("room_id", roomId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating participant position:", updateError);
      return { success: false, error: "Failed to update position" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in updateParticipantPosition:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Get current user's position in room
export async function getCurrentUserPosition(roomId: string): Promise<{
  success: boolean;
  data?: {
    current_season: string | null;
    current_episode: number | null;
    playback_timestamp: string | null;
  };
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "You must be logged in" };
    }

    // Get participant's current position
    const { data: participant, error } = await supabase
      .from("room_participants")
      .select("current_season, current_episode, playback_timestamp")
      .eq("room_id", roomId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching participant position:", error);
      return { success: false, error: "Failed to fetch position" };
    }

    return {
      success: true,
      data: {
        current_season: participant.current_season,
        current_episode: participant.current_episode,
        playback_timestamp: participant.playback_timestamp,
      },
    };
  } catch (error) {
    console.error("Error in getCurrentUserPosition:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
