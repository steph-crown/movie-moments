"use client";

import {
  IconDots,
  IconFolder,
  IconShare3,
  IconTrash,
} from "@tabler/icons-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { IRoom } from "@/interfaces/room.interface";
import { UsersRound } from "lucide-react";
import Link from "next/link";

export function NavRooms({ rooms }: { rooms: IRoom[] }) {
  const { isMobile } = useSidebar();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Rooms</SidebarGroupLabel>
      <SidebarMenu className="w-full">
        <div className="max-h-[calc(100vh_-_17rem)] overflow-y-auto flex flex-col gap-2.5">
          {rooms.map((room) => (
            <SidebarMenuItem
              key={`${room.id}-${room.title || room.content.title}`}
              className="w-full"
            >
              <SidebarMenuButton
                asChild
                className="w-full"
                style={{
                  height: "unset !important",
                  display: "block !important",
                }}
              >
                <Link
                  href={`/r/${room.room_code}`}
                  className="!block border border-solid border-border rounded-md px-3 py-3 w-full"
                >
                  {/* <div className="min-w-0"> */}
                  <span className="font-medium w-full block truncate">
                    {room.title || room.content.title}
                  </span>

                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {room.streaming_platform}
                    </p>

                    <p className="text-xs font-medium text-muted-foreground">
                      •
                    </p>

                    <p className="text-xs font-medium text-muted-foreground">
                      {room.content.title}
                    </p>
                  </div>

                  <div className="flex items-center gap-0.5 mt-2">
                    <UsersRound className="h-4 w-4 text-ring" />

                    <p className="text-xs font-medium text-muted-foreground">
                      {room.member_count} members
                    </p>
                  </div>

                  {/* </div> */}
                </Link>
              </SidebarMenuButton>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction
                    showOnHover
                    className="data-[state=open]:bg-accent rounded-sm"
                  >
                    <IconDots />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-24 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem>
                    <IconFolder />
                    <span>Open</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconShare3 />
                    <span>Share</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive">
                    <IconTrash />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))}

          <p className="text-sm font-medium text-muted-foreground mx-2 my-5">
            You have not joined any room yet
          </p>
        </div>

        <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70">
            <IconDots className="text-sidebar-foreground/70" />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
