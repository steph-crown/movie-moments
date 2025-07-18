"use client";

import { Button } from "@/components/ui/button";
import { IRoom } from "@/interfaces/room.interface";
import { Lock, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

interface LoginPromptProps {
  room: IRoom;
  roomCode: string;
}

export function LoginPrompt({ room, roomCode }: LoginPromptProps) {
  const router = useRouter();

  const handleLogin = () => {
    router.push(`/auth/login?roomCode=${roomCode}`);
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
            <LogIn className="h-5 w-5 text-primary" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium">{room.title}</h3>
              {room.privacy_level === "private" && (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Log in to join this room and chat with your friends
            </p>
          </div>
        </div>
        <Button onClick={handleLogin} className="shrink-0">
          Log In to Join
        </Button>
      </div>
    </div>
  );
}
