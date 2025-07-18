/* eslint-disable react-hooks/exhaustive-deps */
// components/room/room-info.tsx - Enhanced with new features
"use client";

import { Badge } from "@/components/ui/badge";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { IRoom, RoomParticipant } from "@/interfaces/room.interface";
import {
  getRoomParticipants,
  leaveRoom,
  updateRoomSettings,
} from "@/lib/actions/rooms";
import { decodeSeasonData } from "@/lib/utils/season.utils";
import {
  AlertTriangle,
  Check,
  Copy,
  Crown,
  ExternalLink,
  Globe,
  Info,
  Loader2,
  Lock,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ShareBtn } from "../btns/share-btn";
import { IconShare3 } from "@tabler/icons-react";

interface RoomSettingsForm {
  title: string;
  privacy_level: "public" | "private";
  spoiler_policy: "hide_spoilers" | "show_all";
}

export function RoomInfo({ room }: { room: IRoom }) {
  const { user } = useAuth();
  const router = useRouter();
  const [linkCopied, setLinkCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const roomLink = `${typeof window !== "undefined" ? window.location.origin : ""}/${room.room_code}`;
  const isCreator = user?.id === room.creator_id;

  // Settings form
  const settingsForm = useForm<RoomSettingsForm>({
    defaultValues: {
      title: room.title,
      privacy_level: room.privacy_level,
      spoiler_policy: room.spoiler_policy,
    },
  });

  // Fetch participants when sheet opens
  useEffect(() => {
    if (isOpen && participants.length === 0) {
      fetchParticipants();
    }
  }, [isOpen]);

  const fetchParticipants = async () => {
    setIsLoadingParticipants(true);
    try {
      const result = await getRoomParticipants(room.id);
      if (result.success && result.data) {
        setParticipants(result.data);
      } else {
        console.error("Failed to fetch participants:", result.error);
      }
    } catch (error) {
      console.error("Error fetching participants:", error);
    } finally {
      setIsLoadingParticipants(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      console.error("Failed to copy link");
    }
  };

  const getSpoilerPolicyText = (policy: string) => {
    switch (policy) {
      case "hide_spoilers":
        return "Hide spoilers";
      case "show_all":
        return "Show everything";
      default:
        return "Hide spoilers";
    }
  };

  // Enhanced position formatting using season utils
  const formatPosition = (participant: RoomParticipant) => {
    if (room.content.content_type === "series") {
      if (participant.current_season && participant.current_episode) {
        try {
          // Try to decode the season data
          const seasonData = decodeSeasonData(participant.current_season);
          const timestamp = participant.playback_timestamp || "0:00";
          return `S${seasonData.number}E${participant.current_episode} ${timestamp}`;
        } catch {
          // Fallback for non-encoded season data
          const seasonNumber = participant.current_season;
          const timestamp = participant.playback_timestamp || "0:00";
          return `S${seasonNumber}E${participant.current_episode} ${timestamp}`;
        }
      }
      return "Not started";
    } else {
      // Movie
      return participant.playback_timestamp || "0:00";
    }
  };

  const getDisplayName = (participant: RoomParticipant) => {
    // Show "You" for current user
    if (participant.user_id === user?.id) {
      return "You";
    }
    return (
      participant.profile?.display_name ||
      participant.profile?.username ||
      participant.username ||
      participant.email ||
      "Unknown User"
    );
  };

  const getUsername = (participant: RoomParticipant) => {
    if (participant.user_id === user?.id) {
      return null; // Don't show username for "You"
    }
    return participant.profile?.username || participant.username;
  };

  // const isOnline = (participant: RoomParticipant) => {
  //   if (!participant.last_seen) return false;
  //   const lastSeen = new Date(participant.last_seen);
  //   const now = new Date();
  //   const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
  //   return diffMinutes < 5; // Consider online if active within 5 minutes
  // };

  // Filter participants - only show joined, separate pending
  const joinedParticipants = participants.filter((p) => p.status === "joined");
  const pendingParticipants = participants.filter(
    (p) => p.status === "pending"
  );

  // Handle room settings update
  const handleSettingsSubmit = async (data: RoomSettingsForm) => {
    setIsUpdatingSettings(true);
    try {
      const result = await updateRoomSettings(room.id, data);
      if (result.success) {
        toast.success("Room settings updated successfully!");
        setShowSettingsModal(false);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  // Handle leave room
  const handleLeaveRoom = async () => {
    setIsLeaving(true);
    try {
      const result = await leaveRoom(room.id);
      if (result.success) {
        toast.success(result.message || "Left room successfully");
        setShowLeaveModal(false);
        router.push("/rooms");
      } else {
        toast.error(result.error || "Failed to leave room");
      }
    } catch (error) {
      console.error("Error leaving room:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLeaving(false);
    }
  };

  // Handle view on platform
  const handleViewOnPlatform = () => {
    if (room.content.homepage) {
      window.open(room.content.homepage, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="font-semibold">
            <Info className="text-muted-foreground text-sm" />
            Info
          </Button>
        </SheetTrigger>

        <SheetContent className="w-[400px] max-w-screen sm:w-[540px] overflow-y-auto p-6 flex flex-col">
          <SheetHeader>
            <SheetTitle className="text-left flex items-center gap-1">
              {room.title}
              {room.privacy_level === "private" && (
                <Lock className="h-3.5 text-ring shrink-0" />
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col flex-1 gap-6 mt-6">
            {/* Room Details */}
            <div className="grid gap-4">
              <div className="grid gap-5">
                {/* Content Type & Title */}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Content
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="capitalize">
                      {room.content.content_type === "movie" ? "🎬" : "📺"}{" "}
                      {room.content.content_type}
                    </Badge>
                    <span className="text-sm font-medium">
                      {room.content.title}
                    </span>
                  </div>
                </div>

                <div className="flex">
                  {/* Platform */}
                  <div className="w-[50%] pr-4">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Platform
                    </Label>
                    <div className="mt-1">
                      <Badge variant="outline">{room.streaming_platform}</Badge>
                    </div>
                  </div>

                  {/* Privacy Level */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Privacy
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      {room.privacy_level === "private" && (
                        <>
                          <Lock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Private room</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex">
                  {/* Spoiler Policy */}
                  <div className="w-1/2 pr-4">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Spoiler Policy
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm">
                        {getSpoilerPolicyText(room.spoiler_policy)}
                      </span>
                    </div>
                  </div>

                  {/* Room Code */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Room Code
                    </Label>
                    <div className="mt-1">
                      <Badge variant="outline" className="font-mono">
                        {room.room_code}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* View on Platform Button */}
            {room.content.homepage && (
              <div className="grid gap-3">
                <Button
                  onClick={handleViewOnPlatform}
                  className="w-full"
                  variant="default"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View{" "}
                  {room.content.content_type === "movie" ? "Movie" : "Series"}
                </Button>
              </div>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="grid gap-3">
              <div className="flex gap-2">
                {/* Share Button */}
                <ShareBtn
                  room={room}
                  triggerNode={
                    <Button variant="outline" className="flex-1">
                      <IconShare3 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  }
                />

                {/* Settings Button (Creator Only) */}
                {isCreator && (
                  <Button
                    variant="outline"
                    onClick={() => setShowSettingsModal(true)}
                    className="flex-1"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                )}
              </div>

              {/* Leave Room Button (Non-creators only) */}
              {!isCreator && (
                <Button
                  variant="destructive"
                  onClick={() => setShowLeaveModal(true)}
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave Room
                </Button>
              )}
            </div>

            <Separator />

            {/* Share Link */}
            <div className="grid gap-3">
              <Label className="text-sm font-medium">Share this room</Label>
              <div className="flex gap-2">
                <Input value={roomLink} readOnly className="bg-muted text-sm" />
                <Button
                  onClick={copyLink}
                  variant="outline"
                  size="sm"
                  className="shrink-0 !h-full"
                >
                  {linkCopied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Members List */}
            <div className="grid gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">
                  Members ({participants.length})
                </h3>
                {isLoadingParticipants && (
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                )}
              </div>

              {isLoadingParticipants ? (
                <div className="text-center py-4 text-muted-foreground">
                  Loading members...
                </div>
              ) : (
                <>
                  {/* Joined Members */}
                  {joinedParticipants.length > 0 && (
                    <div className="grid gap-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Members ({joinedParticipants.length})
                        </Label>
                      </div>
                      <div className="grid gap-2">
                        {joinedParticipants.map((participant) => (
                          <div
                            key={participant.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium">
                                    {getDisplayName(participant)
                                      .charAt(0)
                                      .toUpperCase()}
                                  </span>
                                </div>
                                {participant.role === "creator" && (
                                  <Crown className="h-4 w-4 text-yellow-500" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    {getDisplayName(participant)}
                                  </span>
                                  {participant.role === "creator" && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Creator
                                    </Badge>
                                  )}
                                </div>
                                {getUsername(participant) && (
                                  <span className="text-xs text-muted-foreground">
                                    @{getUsername(participant)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-mono text-muted-foreground">
                                {formatPosition(participant)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pending Members */}
                  {pendingParticipants.length > 0 && (
                    <div className="grid gap-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Pending ({pendingParticipants.length})
                        </Label>
                      </div>
                      <div className="grid gap-2">
                        {pendingParticipants.map((participant) => (
                          <div
                            key={participant.id}
                            className="flex items-center justify-between p-3 border border-dashed rounded-lg opacity-75"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-yellow-600">
                                  {getDisplayName(participant)
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <span className="text-sm font-medium">
                                  {getDisplayName(participant)}
                                </span>
                                {getUsername(participant) && (
                                  <div className="text-xs text-muted-foreground">
                                    @{getUsername(participant)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Invited
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {participants.length === 0 && !isLoadingParticipants && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No members found</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Settings Modal (Creator Only) */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Room Settings</DialogTitle>
            <DialogDescription>
              Update your room settings. These changes will apply to all
              members.
            </DialogDescription>
          </DialogHeader>

          <Form {...settingsForm}>
            <form
              onSubmit={settingsForm.handleSubmit(handleSettingsSubmit)}
              className="space-y-4"
            >
              <FormField
                control={settingsForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter room title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={settingsForm.control}
                name="privacy_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Privacy Level</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select privacy level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="public">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <span>Public - Anyone can join</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            <span>Private - Invite only</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={settingsForm.control}
                name="spoiler_policy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spoiler Policy</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select spoiler policy" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="hide_spoilers">
                          Hide spoilers
                        </SelectItem>
                        <SelectItem value="show_all">
                          Show everything
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSettingsModal(false)}
                  disabled={isUpdatingSettings}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdatingSettings}>
                  {isUpdatingSettings ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Settings"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Leave Room Confirmation Modal */}
      <Dialog open={showLeaveModal} onOpenChange={setShowLeaveModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Leave Room
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to leave &quot;{room.title}&quot;?
              {room.privacy_level === "private" &&
                "You'll need to be invited again to rejoin this room."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLeaveModal(false)}
              disabled={isLeaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeaveRoom}
              disabled={isLeaving}
            >
              {isLeaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Leaving...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Leave Room
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
