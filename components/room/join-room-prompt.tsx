"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, Lock, Globe } from "lucide-react";
import { IRoom, ParticipantStatus } from "@/interfaces/room.interface";
import { joinRoom } from "@/lib/actions/rooms";
import { toast } from "sonner";

interface JoinRoomPromptProps {
  room: IRoom;
  userStatus: "not_member" | ParticipantStatus;
  onJoinSuccess: () => void;
}

export function JoinRoomPrompt({
  room,
  userStatus,
  onJoinSuccess,
}: JoinRoomPromptProps) {
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    setIsJoining(true);

    try {
      const result = await joinRoom(room.id);

      if (result.success) {
        toast.success(result.message || "Successfully joined the room!");
        onJoinSuccess();
      } else {
        toast.error(result.error || "Failed to join room");
      }
    } catch (error) {
      console.error("Error joining room:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsJoining(false);
    }
  };

  const getPromptText = () => {
    switch (userStatus) {
      case "pending":
        return "You have a pending invitation to this room.";
      case "left":
        return "You previously left this room.";
      default:
        return "You're not a member of this room yet.";
    }
  };

  const getButtonText = () => {
    switch (userStatus) {
      case "pending":
        return "Accept Invitation";
      case "left":
        return "Rejoin Room";
      default:
        return "Join Room";
    }
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium">{room.title}</h3>
              {room.privacy_level === "private" ? (
                <Lock className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Globe className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{getPromptText()}</p>
          </div>
        </div>
        <Button onClick={handleJoin} disabled={isJoining} className="shrink-0">
          {isJoining ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-foreground"></div>
              Joining...
            </div>
          ) : (
            getButtonText()
          )}
        </Button>
      </div>
    </div>
  );
}
