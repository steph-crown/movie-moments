"use client";

import { ChatInput } from "@/components/room/chat-input";
import { MoviePosition } from "@/components/room/movie-position";
import { RoomHeader } from "@/components/room/room-header";
import { RoomSidebar } from "@/components/room/room-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { sampleRooms } from "@/data/rooms";

export default function Page() {
  const room = sampleRooms[0];

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

        <ChatInput className="absolute bottom-5" />
      </SidebarInset>
    </SidebarProvider>
  );
}
