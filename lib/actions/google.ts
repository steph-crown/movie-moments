"use server";

import { createClient } from "../supabase/server";

export async function googleLogin() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
    },
  });

  if (error) {
    console.error("Google login error:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}
