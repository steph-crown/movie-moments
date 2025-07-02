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
import { fetchUserRooms } from "@/lib/actions/rooms";
import { UsersRound, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function NavRooms() {
  const { isMobile } = useSidebar();
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  const loadRooms = async (pageNum: number = 1, reset: boolean = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const result = await fetchUserRooms({
        filter: "all",
        sort: "last_updated",
        direction: "desc",
        search: "",
        page: pageNum,
        limit: 6, // Show fewer in sidebar
      });

      if (result.success && result.data) {
        if (reset || pageNum === 1) {
          setRooms(result.data.rooms);
        } else {
          setRooms((prev) => [...prev, ...(result.data?.rooms || [])]);
        }
        setHasMore(result.data.hasMore);
      }
    } catch (error) {
      console.error("Failed to load rooms:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadRooms(nextPage);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Rooms</SidebarGroupLabel>
      <SidebarMenu className="w-full">
        <div className="max-h-[calc(100vh_-_17rem)] overflow-y-auto flex flex-col gap-2.5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : rooms.length === 0 ? (
            <p className="text-sm font-medium text-muted-foreground mx-2 my-5">
              You have not joined any room yet
            </p>
          ) : (
            rooms.map((room) => (
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
                    href={`/${room.room_code}`}
                    className="!block border border-solid border-border rounded-md px-3 py-3 w-full"
                  >
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

                      <p className="text-xs font-medium text-muted-foreground truncate">
                        {room.content.title}
                      </p>
                    </div>

                    <div className="flex items-center gap-0.5 mt-2">
                      <UsersRound className="h-4 w-4 text-ring" />

                      <p className="text-xs font-medium text-muted-foreground">
                        {room.member_count} members
                      </p>
                    </div>
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
            ))
          )}
        </div>

        {!loading && hasMore && (
          <SidebarMenuItem>
            <SidebarMenuButton
              className="text-sidebar-foreground/70"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-sidebar-foreground/70" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <IconDots className="text-sidebar-foreground/70" />
                  <span>More</span>
                </>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
