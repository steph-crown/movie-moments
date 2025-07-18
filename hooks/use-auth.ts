"use client";

import { getCurrentUserProfile, UserProfile } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const result = await getCurrentUserProfile();
      if (result.success && result.data) {
        setUserProfile(result.data);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  return {
    user,
    loading,
    userProfile,
    isLoadingProfile,
    loadUserProfile,
  };
}
