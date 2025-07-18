"use client";

import { IconLogout, IconSettings, IconUserCircle } from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import {
  getCurrentUserProfile,
  logoutUser,
  updateUserPassword,
  updateUserProfile,
  type UpdateProfileData,
  type UserProfile,
} from "@/lib/actions/auth";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface ProfileFormData {
  username: string;
  display_name: string;
  email: string;
}

interface PasswordFormData {
  new_password: string;
  confirm_password: string;
}

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user, loading } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    defaultValues: {
      username: "",
      display_name: "",
      email: "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  });

  // Load user profile when modals open
  useEffect(() => {
    if ((showProfileModal || showSettingsModal) && user && !userProfile) {
      loadUserProfile();
    }
  }, [showProfileModal, showSettingsModal, user]);

  // Update form when profile loads
  useEffect(() => {
    if (userProfile) {
      profileForm.reset({
        username: userProfile.username,
        display_name: userProfile.display_name,
        email: userProfile.email,
      });
    }
  }, [userProfile, profileForm]);

  const loadUserProfile = async () => {
    setIsLoadingProfile(true);
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
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const result = await logoutUser();
      if (!result.success) {
        toast.error(result.error || "Failed to logout");
      }
      // If successful, the action will redirect
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleProfileUpdate = async (data: ProfileFormData) => {
    setIsUpdatingProfile(true);
    try {
      const updateData: UpdateProfileData = {
        username: data.username,
        display_name: data.display_name,
      };

      const result = await updateUserProfile(updateData);

      if (result.success) {
        toast.success("Profile updated successfully!");
        setShowProfileModal(false);
        // Reload profile data
        await loadUserProfile();
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordUpdate = async (data: PasswordFormData) => {
    if (data.new_password !== data.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }

    if (data.new_password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const result = await updateUserPassword(data.new_password);

      if (result.success) {
        toast.success("Password updated successfully!");
        passwordForm.reset();
      } else {
        toast.error(result.error || "Failed to update password");
      }
    } catch (error) {
      console.error("Password update error:", error);
      toast.error("Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
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

  const displayName =
    user.user_metadata?.display_name || user.user_metadata?.username || "User";
  const email = user.email || "";
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
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
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
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
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setShowProfileModal(true)}>
                  <IconUserCircle />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowSettingsModal(true)}>
                  <IconSettings />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-destructive focus:text-destructive"
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <IconLogout />
                )}
                {isLoggingOut ? "Logging out..." : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Profile Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information. This will be visible to other
              users in rooms.
            </DialogDescription>
          </DialogHeader>

          {isLoadingProfile ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Form {...profileForm}>
              <form
                onSubmit={profileForm.handleSubmit(handleProfileUpdate)}
                className="space-y-4"
              >
                <FormField
                  control={profileForm.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your display name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Your username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="bg-muted" />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Email changes are handled in settings
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowProfileModal(false)}
                    disabled={isUpdatingProfile}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUpdatingProfile}>
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Profile"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Account Settings</DialogTitle>
            <DialogDescription>
              Manage your account security and preferences.
            </DialogDescription>
          </DialogHeader>

          {isLoadingProfile ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Account Info */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Account Information
                </Label>
                <div className="rounded-lg border p-3 bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={avatarUrl} alt={displayName} />
                      <AvatarFallback>
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {userProfile?.display_name || displayName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {userProfile?.email || email}
                      </p>
                      {userProfile?.username && (
                        <p className="text-xs text-muted-foreground">
                          @{userProfile.username}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Change Password */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Change Password</Label>
                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)}
                    className="space-y-4"
                  >
                    <FormField
                      control={passwordForm.control}
                      name="new_password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter new password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirm_password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Confirm new password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isUpdatingPassword}
                    >
                      {isUpdatingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating Password...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSettingsModal(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
