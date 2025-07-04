/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/lib/supabase/server";
import { generateRoomCode } from "@/lib/room-utils";
import { revalidatePath } from "next/cache";
import { CreateRoomData, IRoom } from "@/interfaces/room.interface";

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
          starting_season,
          starting_episode,
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

    // Transform data first
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
              genres: [],
              cached_at: new Date().toISOString(),
              last_accessed: new Date().toISOString(),
            },
        streaming_platform: room.streaming_platform,
        privacy_level: room.privacy_level,
        spoiler_policy: room.spoiler_policy,
        season_number: room.starting_season,
        episode_number: room.starting_episode,
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

    // Create the room
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
        starting_season: data.starting_season || null,
        starting_episode: data.starting_episode || null,
        creator_id: user.id,
      })
      .select("id, room_code, title")
      .single();

    if (createError) {
      console.error("Room creation error:", createError);
      return { success: false, error: "Failed to create room" };
    }

    // Create room participant entry for creator
    const { error: participantError } = await supabase
      .from("room_participants")
      .insert({
        room_id: room.id,
        user_id: user.id,
        status: "joined",
        role: "creator",
        join_method: "created",
        joined_at: new Date().toISOString(),
        current_season: data.starting_season || null,
        current_episode: data.starting_episode || null,
        playback_timestamp: 0,
      });

    if (participantError) {
      console.error("Participant creation error:", participantError);
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

export async function fetchRoomByCode(roomCode: string): Promise<{
  success: boolean;
  data?: IRoom;
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
        error: "You must be logged in to view rooms",
      };
    }

    // First get the room basic info
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
        starting_season,
        starting_episode,
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
      return {
        success: false,
        error: "Room not found",
      };
    }

    // Check if user is a participant in this room
    const { data: participantData, error: participantError } = await supabase
      .from("room_participants")
      .select("status, role, joined_at")
      .eq("room_id", roomData.id)
      .eq("user_id", user.id)
      .single();

    console.log({ participantError, participantData });

    if (participantError || !participantData) {
      return {
        success: false,
        error: "You are not a member of this room",
      };
    }

    const cachedContent = roomData.content_cache as any;

    // Transform to IRoom format
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
            genres: [],
            cached_at: new Date().toISOString(),
            last_accessed: new Date().toISOString(),
          },
      streaming_platform: roomData.streaming_platform,
      privacy_level: roomData.privacy_level,
      spoiler_policy: roomData.spoiler_policy,
      season_number: roomData.starting_season,
      episode_number: roomData.starting_episode,
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
        participantData.status === "pending"
          ? "pending"
          : participantData.status === "joined"
          ? "accepted"
          : undefined,
      invited_at:
        participantData.status === "pending"
          ? participantData.joined_at
          : undefined,
    };

    return {
      success: true,
      data: room,
    };
  } catch (error) {
    console.error("Fetch room error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch room",
    };
  }
}
