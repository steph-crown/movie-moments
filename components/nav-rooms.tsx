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
import { UsersRound, Loader2, Lock, Play } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import clsx from "clsx";

export function NavRooms() {
  const { isMobile } = useSidebar();
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const params = useParams();
  const roomCode = params.room_code as string;

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
            rooms.map((room) => {
              const isActive = roomCode === room.room_code;

              return (
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
                      className={clsx(
                        "!block border border-solid rounded-md px-3 py-3 w-full transition-all duration-200",
                        isActive
                          ? "border-primary bg-primary/5 shadow-sm border-l-4"
                          : "border-border hover:border-border/80"
                      )}
                    >
                      <div className="min-w-0 flex items-center ">
                        <div className="min-w-0 flex items-center gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            {isActive && (
                              <Play className="h-3.5 w-3.5 text-primary shrink-0 fill-current" />
                            )}
                            <span
                              className={clsx(
                                "font-medium min-w-0 block truncate",
                                isActive ? "text-primary" : ""
                              )}
                            >
                              {room.title || room.content.title}
                            </span>
                          </div>
                        </div>

                        {room.privacy_level === "private" && (
                          <Lock
                            className={clsx(
                              "h-3.5 shrink-0",
                              isActive ? "text-primary" : "text-ring"
                            )}
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <p
                          className={clsx(
                            "text-xs font-medium",
                            isActive
                              ? "text-primary/80"
                              : "text-muted-foreground"
                          )}
                        >
                          {room.streaming_platform}
                        </p>

                        <p
                          className={clsx(
                            "text-xs font-medium",
                            isActive
                              ? "text-primary/60"
                              : "text-muted-foreground"
                          )}
                        >
                          •
                        </p>

                        <p
                          className={clsx(
                            "text-xs font-medium truncate",
                            isActive
                              ? "text-primary/80"
                              : "text-muted-foreground"
                          )}
                        >
                          {room.content.title}
                        </p>
                      </div>

                      <div className="flex items-center gap-0.5 mt-2">
                        <UsersRound
                          className={clsx(
                            "h-4 w-4",
                            isActive ? "text-primary" : "text-ring"
                          )}
                        />

                        <p
                          className={clsx(
                            "text-xs font-medium",
                            isActive
                              ? "text-primary/80"
                              : "text-muted-foreground"
                          )}
                        >
                          {room.member_count} members
                        </p>
                      </div>

                      {/* {isActive && (
                        <div className="absolute inset-0 rounded-md pointer-events-none">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-lg" />
                        </div>
                      )} */}
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
              );
            })
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
