"use client";

import { BlockLoader } from "@/components/loaders/block-loader";
import { ChatInput } from "@/components/room/chat-input";
import { JoinRoomPrompt } from "@/components/room/join-room-prompt";
import { LoginPrompt } from "@/components/room/login-prompt";
import { MoviePosition } from "@/components/room/movie-position";
import { RoomHeader } from "@/components/room/room-header";
import { RoomSidebar } from "@/components/room/room-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { IRoom } from "@/interfaces/room.interface";
import { fetchRoomByCode } from "@/lib/actions/rooms";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.room_code as string;

  const [room, setRoom] = useState<IRoom | null>(null);
  const [userStatus, setUserStatus] = useState<
    "not_member" | "pending" | "joined" | "left"
  >("not_member");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoom = async () => {
    if (!roomCode) return;

    setLoading(true);
    setError(null);

    try {
      // First try to get room allowing unauthenticated access for public rooms
      const result = await fetchRoomByCode(roomCode, {
        requireParticipation: false,
        includeParticipantStatus: true,
        allowUnauthenticatedPublic: true,
      });

      if (result.requiresAuth) {
        // Private room or no room found - redirect to login
        toast.error("Please log in to access this room");
        router.push(`/auth/login?roomCode=${roomCode}`);
        return;
      }

      if (result.success && result.data) {
        setRoom(result.data.room);
        setUserStatus(result.data.userStatus || "not_member");
        setIsAuthenticated(result.data.isAuthenticated || false);

        // If private room and not authenticated, redirect immediately
        if (
          result.data.room.privacy_level === "private" &&
          !result.data.isAuthenticated
        ) {
          toast.error("Please log in to access this private room");
          router.push(`/auth/login?roomCode=${roomCode}`);
          return;
        }
      } else {
        setError(result.error || "Failed to load room");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoom();
  }, [roomCode]);

  const handleJoinSuccess = () => {
    setUserStatus("joined");
    loadRoom();
  };

  if (loading) {
    return <BlockLoader />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h1 className="text-2xl font-semibold mb-2">Room Not Found</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h1 className="text-2xl font-semibold mb-2">Room Not Found</h1>
        <p className="text-muted-foreground mb-4">
          The room you&apos;re looking for doesn&apos;t exist.
        </p>
      </div>
    );
  }

  const renderBottomComponent = () => {
    // If user is authenticated and joined, show chat input
    if (isAuthenticated && userStatus === "joined") {
      return <ChatInput className="absolute bottom-5" />;
    }

    // If user is not authenticated, show login prompt (only for public rooms)
    if (!isAuthenticated) {
      return (
        <div className="absolute bottom-0 left-0 right-0">
          <LoginPrompt room={room} roomCode={roomCode} />
        </div>
      );
    }

    // If user is authenticated but not joined/pending/left, show join prompt
    return (
      <div className="absolute bottom-0 left-0 right-0">
        <JoinRoomPrompt
          room={room}
          userStatus={userStatus}
          onJoinSuccess={handleJoinSuccess}
        />
      </div>
    );
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 18)",
        } as React.CSSProperties
      }
    >
      <RoomSidebar variant="inset" />

      <SidebarInset className="relative">
        <RoomHeader room={room} />
        <MoviePosition />
        {renderBottomComponent()}
      </SidebarInset>
    </SidebarProvider>
  );
}
