"use server";

import { createClient } from "@/lib/supabase/server";

export interface UserSearchResult {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
}

export async function searchUsersByUsername(query: string): Promise<{
  success: boolean;
  data?: UserSearchResult[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Remove @ prefix if present and limit query length
    const searchQuery = query.replace("@", "").toLowerCase().trim();

    if (searchQuery.length < 1) {
      return { success: true, data: [] };
    }

    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
      .eq("allow_username_invites", true)
      .not("username", "is", null) // Only users with usernames
      .limit(10);

    if (error) {
      console.error("Error searching users:", error);
      return { success: false, error: "Failed to search users" };
    }

    return { success: true, data: users || [] };
  } catch (error) {
    console.error("Error in searchUsersByUsername:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getUserByUsername(username: string): Promise<{
  success: boolean;
  data?: UserSearchResult;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Remove @ prefix if present
    const cleanUsername = username.replace("@", "");

    const { data: user, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .eq("username", cleanUsername)
      .eq("allow_username_invites", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: false, error: "User not found" };
      }
      console.error("Error getting user by username:", error);
      return { success: false, error: "Failed to get user" };
    }

    return { success: true, data: user };
  } catch (error) {
    console.error("Error in getUserByUsername:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getUserByEmail(email: string): Promise<{
  success: boolean;
  data?: UserSearchResult;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: user, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .eq("email", email.toLowerCase())
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: false, error: "User not found" };
      }
      console.error("Error getting user by email:", error);
      return { success: false, error: "Failed to get user" };
    }

    return { success: true, data: user };
  } catch (error) {
    console.error("Error in getUserByEmail:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
