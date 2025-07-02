"use server";

import { createClient } from "@/lib/supabase/server";
import { generateRoomCode } from "@/lib/room-utils";
import { revalidatePath } from "next/cache";
import { CreateRoomData } from "@/interfaces/room.interface";

export async function createRoom(data: CreateRoomData): Promise<{
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

    console.log({ therroomdata: room });

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
        current_timestamp: 0,
      });

    if (participantError) {
      console.error("Participant creation error:", participantError);
      // Don't fail room creation if participant creation fails
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
