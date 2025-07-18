/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/actions/auth.ts - Authentication and profile actions
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileData {
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

// Logout user
export async function logoutUser(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return { success: false, error: error.message };
    }

    // Revalidate and redirect
    revalidatePath("/", "layout");
    redirect("/auth/login");
  } catch (error) {
    console.error("Logout error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to logout",
    };
  }
}

// Get current user profile
export async function getCurrentUserProfile(): Promise<{
  success: boolean;
  data?: UserProfile;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return { success: false, error: "Failed to fetch profile" };
    }

    return {
      success: true,
      data: {
        id: profile.id,
        email: user.email || "",
        username: profile.username || "",
        display_name: profile.display_name || "",
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      },
    };
  } catch (error) {
    console.error("Get profile error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get profile",
    };
  }
}

// Update user profile
export async function updateUserProfile(data: UpdateProfileData): Promise<{
  success: boolean;
  error?: string;
  message?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if username is taken (if username is being updated)
    if (data.username) {
      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", data.username)
        .neq("id", user.id)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Username check error:", checkError);
        return { success: false, error: "Failed to validate username" };
      }

      if (existingUser) {
        return { success: false, error: "Username is already taken" };
      }
    }

    // Update profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return { success: false, error: "Failed to update profile" };
    }

    // Revalidate relevant paths
    revalidatePath("/", "layout");

    return {
      success: true,
      message: "Profile updated successfully",
    };
  } catch (error) {
    console.error("Update profile error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update profile",
    };
  }
}

// Change user email
export async function updateUserEmail(newEmail: string): Promise<{
  success: boolean;
  error?: string;
  message?: string;
}> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    });

    if (error) {
      console.error("Email update error:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: "Check your email to confirm the address change",
    };
  } catch (error) {
    console.error("Update email error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update email",
    };
  }
}

// Change user password
export async function updateUserPassword(newPassword: string): Promise<{
  success: boolean;
  error?: string;
  message?: string;
}> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error("Password update error:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: "Password updated successfully",
    };
  } catch (error) {
    console.error("Update password error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update password",
    };
  }
}
