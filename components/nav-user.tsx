/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { getCurrentUserProfile, type UserProfile } from "@/lib/actions/auth";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProfileMenu } from "./profile-menu";

export interface ProfileFormData {
  username: string;
  display_name: string;
  email: string;
}

export interface PasswordFormData {
  new_password: string;
  confirm_password: string;
}

export function NavUser() {
  const { user, loading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Load user profile when modals open
  useEffect(() => {
    if (user && !userProfile) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const result = await getCurrentUserProfile();
      if (result.success && result.data) {
        setUserProfile(result.data);
      } else {
        toast.error(result.error || "Failed to load profile");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    }
  };

  // Don't render if loading or no user
  if (loading || !user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
              <div className="flex flex-col gap-1">
                <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                <div className="h-2 w-16 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // FIXED: Use userProfile data if available, fallback to user metadata
  const displayName =
    userProfile?.display_name ||
    user.user_metadata?.display_name ||
    user.user_metadata?.username ||
    "User";
  const email = user.email || "";
  const avatarUrl = userProfile?.avatar_url || user.user_metadata?.avatar_url;

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <ProfileMenu
            menuTrigger={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="rounded-lg">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {email}
                  </span>
                </div>
              </SidebarMenuButton>
            }
          />
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
}
