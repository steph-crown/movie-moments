/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/lib/supabase/server";
import { generateRoomCode } from "@/lib/room-utils";
import { revalidatePath } from "next/cache";
import {
  CreateRoomData,
  IRoom,
  RoomParticipant,
} from "@/interfaces/room.interface";

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

    // Get room data
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

    console.log({ tellme: roomError, roomData });

    if (roomError || !roomData) {
      if (!user) {
        // ask to login to confirm that they have access to the private room
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
    let participantData: any = null; // Declare here so it's accessible in the room object

    // Only check participation if user is authenticated
    if (user) {
      const { data: fetchedParticipantData } = await supabase
        .from("room_participants")
        .select("id, status, role, joined_at")
        .eq("room_id", roomData.id)
        .eq("user_id", user.id)
        .single();

      participantData = fetchedParticipantData; // Assign to the outer variable

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

    // Transform room data
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
    const { data: userParticipation, error: participationError } =
      await supabase
        .from("room_participants")
        .select("status, role")
        .eq("room_id", roomId)
        .eq("user_id", currentUser.id)
        .single();

    if (participationError && participationError.code !== "PGRST116") {
      console.error("Error checking user participation:", participationError);
      return { success: false, error: "Failed to verify room access" };
    }

    // Also check if user is the room creator
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("creator_id")
      .eq("id", roomId)
      .single();

    if (roomError) {
      console.error("Error checking room creator:", roomError);
      return { success: false, error: "Failed to verify room access" };
    }

    const isCreator = room.creator_id === currentUser.id;
    const isParticipant =
      userParticipation && userParticipation.status === "joined";

    if (!isCreator && !isParticipant) {
      return {
        success: false,
        error: "You don't have access to view this room's participants",
      };
    }

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
