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
          "--header-height": "calc(var(--spacing) * 22)",
        } as React.CSSProperties
      }
    >
      <RoomSidebar variant="inset" />

      <SidebarInset className="relative">
        <RoomHeader room={room} />

        <MoviePosition />

        {/* <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div> */}

        <ChatInput className="absolute bottom-5" />
      </SidebarInset>
    </SidebarProvider>
  );
}
