"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineLoader } from "@/components/loaders/inline-loader";
import { joinRoomByCode } from "@/lib/actions/rooms";
import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function JoinRoomBtn({
  btnClassName,
  triggerNode,
}: {
  btnClassName?: string;
  triggerNode?: React.ReactNode;
}) {
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleJoinRoom = async () => {
    if (!roomCodeInput.trim()) {
      toast.error("Please enter a room code or link");
      return;
    }

    setIsLoading(true);

    try {
      const result = await joinRoomByCode(roomCodeInput.trim());

      if (result.success && result.data) {
        toast.success(result.data.message);
        setJoinDialogOpen(false);
        setRoomCodeInput("");

        // Redirect to the room page
        router.push(`/${result.data.roomCode}`);
      } else {
        toast.error(result.error || "Failed to join room");
      }
    } catch (error) {
      console.error("Join room error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!isLoading) {
      setJoinDialogOpen(open);
      if (!open) {
        setRoomCodeInput("");
      }
    }
  };

  const formatRoomCodeInput = (value: string) => {
    // Don't format if it looks like a URL (contains :// or starts with http)
    if (
      value.includes("://") ||
      value.startsWith("http") ||
      value.includes(".")
    ) {
      return value;
    }

    // For room codes, allow alphanumeric characters, hyphens, and colons
    const cleaned = value.replace(/[^a-zA-Z0-9-:]/g, "");

    // Convert to lowercase for consistent formatting
    return cleaned.toLowerCase();
  };

  return (
    <Dialog open={joinDialogOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        {triggerNode ? (
          triggerNode
        ) : (
          <Button variant="outline" className={btnClassName} size="lg">
            <Users className="w-4 h-4" />
            Join Room
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join a Room</DialogTitle>
          <DialogDescription>
            Enter a room code (e.g. abc-defg-hij) or paste a room link
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="roomCode">Room Code or Link</Label>
            <Input
              id="roomCode"
              placeholder="abc-defg-hij or https://moviemoments.com/abc-defg-hij"
              value={roomCodeInput}
              onChange={(e) =>
                setRoomCodeInput(formatRoomCodeInput(e.target.value))
              }
              onKeyDown={(e) =>
                e.key === "Enter" && !isLoading && handleJoinRoom()
              }
              disabled={isLoading}
              autoFocus
              className={
                roomCodeInput.includes("/") ? "" : "font-mono tracking-wide"
              }
              type="text"
            />
            <p className="text-xs text-muted-foreground">
              💡 You can paste a room link or enter just the code
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => handleDialogClose(false)}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleJoinRoom}
            className="flex-1"
            disabled={!roomCodeInput.trim() || isLoading}
          >
            {isLoading && <InlineLoader />}
            {isLoading ? "Joining..." : "Join Room"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
