"use client";

import { BlockLoader } from "@/components/loaders/block-loader";
import { ChatInput } from "@/components/room/chat-input";
import { MoviePosition } from "@/components/room/movie-position";
import { RoomHeader } from "@/components/room/room-header";
import { RoomSidebar } from "@/components/room/room-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { IRoom } from "@/interfaces/room.interface";
import { fetchRoomByCode } from "@/lib/actions/rooms";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  const params = useParams();
  const roomCode = params.room_code as string;

  const [room, setRoom] = useState<IRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRoom() {
      if (!roomCode) return;

      setLoading(true);
      setError(null);

      try {
        const result = await fetchRoomByCode(roomCode);

        if (result.success && result.data) {
          setRoom(result.data);
        } else {
          setError(result.error || "Failed to load room");
        }
      } catch {
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }

    loadRoom();
  }, [roomCode]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h1 className="text-2xl font-semibold mb-2">Room Not Found</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 18)",
        } as React.CSSProperties
      }
    >
      {loading && <BlockLoader />}

      {!!room && (
        <>
          <RoomSidebar variant="inset" />

          <SidebarInset className="relative">
            <RoomHeader room={room!} />

            <MoviePosition />

            <ChatInput className="absolute bottom-5" />
          </SidebarInset>
        </>
      )}
    </SidebarProvider>
  );
}
