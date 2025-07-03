import {
  Info,
  Users,
  Lock,
  Globe,
  Eye,
  EyeOff,
  Copy,
  Check,
  Crown,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { IRoom } from "@/interfaces/room.interface";

// Mock member data - replace with actual data
const mockMembers = [
  {
    id: "1",
    name: "Sarah Johnson",
    username: "sarah_movie_fan",
    isCreator: true,
    position: "S1E1 24:30",
    isOnline: true,
  },
  {
    id: "2",
    name: "Mike Films",
    username: "mike_films",
    isCreator: false,
    position: "S1E1 24:25",
    isOnline: true,
  },
  {
    id: "3",
    name: "Jenny Cinema",
    username: "jenny_cinema",
    isCreator: false,
    position: "S1E1 22:15",
    isOnline: false,
  },
  {
    id: "4",
    name: "Alex Reviews",
    username: "alex_reviews",
    isCreator: false,
    position: "S1E1 26:45",
    isOnline: true,
  },
];

export function RoomInfo({ room }: { room: IRoom }) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const roomLink = `${
    typeof window !== "undefined"
      ? window.location.hostname
      : "moviemoments.com"
  }/${room.room_code}`;

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

  const onlineMembers = mockMembers.filter((member) => member.isOnline);
  const offlineMembers = mockMembers.filter((member) => !member.isOnline);

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
          <SheetTitle className="text-left">{room.title}</SheetTitle>
          <SheetDescription className="text-left">
            {room.content.title}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col flex-1 gap-6 mt-6">
          {/* Room Details */}
          <div className="grid gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Room Details</h3>
            </div>

            <div className="grid gap-3">
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

              {/* Platform */}
              <div>
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

              {/* Spoiler Policy */}
              <div>
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
          <div className="grid gap-4 flex-1">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">
                Members ({mockMembers.length})
              </h3>
            </div>

            {/* Online Members */}
            {onlineMembers.length > 0 && (
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Online ({onlineMembers.length})
                  </Label>
                </div>
                <div className="grid gap-2">
                  {onlineMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {member.name.charAt(0)}
                            </span>
                          </div>
                          {member.isCreator && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {member.name}
                            </span>
                            {member.isCreator && (
                              <Badge variant="secondary" className="text-xs">
                                Creator
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            @{member.username}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono text-muted-foreground">
                          {member.position}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Offline Members */}
            {offlineMembers.length > 0 && (
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Offline ({offlineMembers.length})
                  </Label>
                </div>
                <div className="grid gap-2">
                  {offlineMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {member.name.charAt(0)}
                            </span>
                          </div>
                          {member.isCreator && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {member.name}
                            </span>
                            {member.isCreator && (
                              <Badge variant="secondary" className="text-xs">
                                Creator
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            @{member.username}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono text-muted-foreground">
                          {member.position}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
