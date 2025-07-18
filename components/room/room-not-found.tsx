"use client";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { LogIn, Plus } from "lucide-react";
import { CreateRoomBtn } from "../btns/create-room-btn";

interface RoomNotFoundProps {
  roomCode?: string;
  message?: string;
}

export function RoomNotFound({
  roomCode,
  message = "The room you're looking for doesn't exist or you don't have access to it.",
}: RoomNotFoundProps) {
  return (
    <div className="min-h-screen w-full flex">
      {/* Logo positioned at top-left */}
      <div className="absolute top-6 left-6">
        <Logo />
      </div>

      {/* Center content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          {/* Main heading */}
          <h1 className="text-3xl font-bold mb-4">Room Not Found</h1>

          {/* Room code display if provided */}
          {roomCode && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Room Code:</p>
              <div className="inline-flex items-center px-3 py-1.5 bg-muted rounded-lg font-mono text-sm">
                {roomCode}
              </div>
            </div>
          )}

          {/* Error message */}
          <p className="text-muted-foreground mb-8 text-balance text-sm font-medium">
            {message}
          </p>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:justify-center">
            <CreateRoomBtn
              triggerNode={
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Room
                </Button>
              }
            />

            <Button variant="outline" className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Join Room
            </Button>
          </div>

          {/* Help text */}
          <p className="text-xs text-muted-foreground mt-6">
            💡 Need help? Make sure you have the correct room code or ask the
            room creator to invite you.
          </p>
        </div>
      </div>
    </div>
  );
}
