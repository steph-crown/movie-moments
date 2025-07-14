import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Users, Film, Popcorn } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreateRoomBtn } from "../btns/create-room-btn";

export function EmptyRoomsState() {
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const router = useRouter();

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      router.push(`/${roomCode.trim()}`);
      setJoinDialogOpen(false);
      setRoomCode("");
    } else {
      toast.error("Please enter a room code");
    }
  };

  const handleCreateRoom = () => {
    router.push("/create");
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Beautiful Illustration */}
      <div className="relative mb-8">
        <div className="relative w-48 h-48 mx-auto">
          {/* Main screen/TV */}
          <div className="absolute inset-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border-4 border-slate-700 shadow-2xl">
            {/* Screen glow */}
            <div className="absolute inset-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded"></div>

            {/* Movie seats */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-8 flex gap-1">
              <div className="w-4 h-6 bg-red-500 rounded-t-lg opacity-60"></div>
              <div className="w-4 h-6 bg-red-500 rounded-t-lg opacity-80"></div>
              <div className="w-4 h-6 bg-red-500 rounded-t-lg opacity-60"></div>
            </div>
          </div>

          {/* Floating movie elements */}
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <Popcorn className="w-4 h-4 text-yellow-800" />
          </div>

          <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <Film className="w-4 h-4 text-white" />
          </div>

          {/* Floating chat bubbles */}
          <div className="absolute -top-4 left-8 w-6 h-6 bg-blue-400 rounded-full opacity-60 animate-ping"></div>
          <div
            className="absolute -right-4 top-12 w-4 h-4 bg-green-400 rounded-full opacity-60 animate-ping"
            style={{ animationDelay: "0.5s" }}
          ></div>
          <div
            className="absolute -left-4 bottom-16 w-5 h-5 bg-pink-400 rounded-full opacity-60 animate-ping"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>
      </div>

      {/* Text Content */}
      <div className="max-w-md mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-3">
          Start Your Movie Journey
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Create a room to watch movies with friends or join an existing room to
          jump into the conversation. Share reactions, discuss plot twists, and
          make movie nights social!
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <CreateRoomBtn btnClassName="sm:flex-1 h-11 font-medium" fullWidth />

        <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="sm:flex-1 h-11 font-medium"
              size="lg"
            >
              <Users className="w-4 h-4 mr-2" />
              Join Room
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Join a Room</DialogTitle>
              <DialogDescription>
                Enter the room code shared by your friend
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="roomCode">Room Code</Label>
                <Input
                  id="roomCode"
                  placeholder="e.g. ABC123"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                  className="uppercase tracking-wider text-center font-mono"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setJoinDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleJoinRoom}
                className="flex-1"
                disabled={!roomCode.trim()}
              >
                Join Room
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Additional hint */}
      <p className="text-xs text-muted-foreground mt-6 max-w-sm">
        💡 Tip: Room codes are usually 6 characters long and shared by the room
        creator
      </p>
    </div>
  );
}
