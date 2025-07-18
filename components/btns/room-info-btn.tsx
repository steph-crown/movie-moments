/* eslint-disable react-hooks/exhaustive-deps */
import { IRoom, RoomParticipant } from "@/interfaces/room.interface";
import { getRoomParticipants } from "@/lib/actions/rooms";
import {
  Check,
  Copy,
  Crown,
  Eye,
  EyeOff,
  Globe,
  Info,
  Lock,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";

export function RoomInfo({ room }: { room: IRoom }) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);

  const roomLink = `${typeof window !== "undefined" ? window.location.hostname : "moviemoments.com"}/${room.room_code}`;

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
      case "show_with_warning":
        return "Show with warning";
      case "show_all":
        return "Show everything";
      default:
        return "Hide spoilers";
    }
  };

  const getSpoilerPolicyIcon = (policy: string) => {
    switch (policy) {
      case "hide_spoilers":
        return <EyeOff className="h-4 w-4" />;
      case "show_with_warning":
        return <Eye className="h-4 w-4" />;
      case "show_all":
        return <Eye className="h-4 w-4" />;
      default:
        return <EyeOff className="h-4 w-4" />;
    }
  };

  const formatPosition = (participant: RoomParticipant) => {
    if (room.content.content_type === "series") {
      if (participant.current_season && participant.current_episode) {
        const timestamp = Number(participant.playback_timestamp)
          ? `${Math.floor(Number(participant.playback_timestamp) / 60)}:${(Number(participant.playback_timestamp) % 60).toString().padStart(2, "0")}`
          : "0:00";
        return `S${participant.current_season}E${participant.current_episode} ${timestamp}`;
      }
      return "Not started";
    } else {
      // Movie
      if (Number(participant.playback_timestamp)) {
        const minutes = Math.floor(Number(participant.playback_timestamp) / 60);
        const seconds = Number(participant.playback_timestamp) % 60;
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
      }
      return "0:00";
    }
  };

  const getDisplayName = (participant: RoomParticipant) => {
    return (
      participant.profile?.display_name ||
      participant.profile?.username ||
      participant.username ||
      participant.email ||
      "Unknown User"
    );
  };

  const getUsername = (participant: RoomParticipant) => {
    return participant.profile?.username || participant.username;
  };

  const isOnline = (participant: RoomParticipant) => {
    if (!participant.last_seen) return false;
    const lastSeen = new Date(participant.last_seen);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
    return diffMinutes < 5; // Consider online if active within 5 minutes
  };

  // Separate participants by status and online state
  const joinedParticipants = participants.filter((p) => p.status === "joined");
  const pendingParticipants = participants.filter(
    (p) => p.status === "pending"
  );
  const onlineParticipants = joinedParticipants.filter(isOnline);
  const offlineParticipants = joinedParticipants.filter((p) => !isOnline(p));

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="font-semibold">
          <Info className="text-muted-foreground text-sm" />
          Info
        </Button>
      </SheetTrigger>

      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto p-6 flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-left flex items-center gap-1">
            {room.title}{" "}
            {room.privacy_level === "private" && (
              <Lock className="h-3.5 text-ring shrink-0" />
            )}
          </SheetTitle>

          {/* <SheetDescription className="text-left flex items-center gap-1 font-medium text-sm">
            <Film className="h-5 w-5" />

            {room.content.title}
          </SheetDescription> */}
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
                    {room.privacy_level === "private" ? (
                      <>
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Private room</span>
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Public room</span>
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
                    {getSpoilerPolicyIcon(room.spoiler_policy)}
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
                className="shrink-0"
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
                {/* Online Members */}
                {onlineParticipants.length > 0 && (
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Online ({onlineParticipants.length})
                      </Label>
                    </div>
                    <div className="grid gap-2">
                      {onlineParticipants.map((participant) => (
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

                {/* Offline Members */}
                {offlineParticipants.length > 0 && (
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Offline ({offlineParticipants.length})
                      </Label>
                    </div>
                    <div className="grid gap-2">
                      {offlineParticipants.map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center justify-between p-3 border rounded-lg opacity-60"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
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
  );
}
