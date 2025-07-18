"use client";

import {
  IconDots,
  IconShare3,
  IconLogout,
  IconExternalLink,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IRoom } from "@/interfaces/room.interface";
import { fetchUserRooms, leaveRoom } from "@/lib/actions/rooms";
import { UsersRound, Loader2, Lock, Play, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import clsx from "clsx";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ShareBtn } from "@/components/btns/share-btn";
import { useAuth } from "@/hooks/use-auth";

export function NavRooms() {
  const { isMobile } = useSidebar();
  const { user } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<IRoom | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
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

  const handleOpenRoom = (room: IRoom) => {
    router.push(`/${room.room_code}`);
  };

  const handleShareRoom = (room: IRoom, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRoom(room);
    setShowShareModal(true);
  };

  const handleLeaveRoom = async (room: IRoom, e: React.MouseEvent) => {
    e.stopPropagation();

    // Don't allow creators to leave their own rooms
    if (room.creator_id === user?.id) {
      toast.error("Room creators cannot leave their rooms");
      return;
    }

    setSelectedRoom(room);
    setShowLeaveModal(true);
  };

  const confirmLeaveRoom = async () => {
    if (!selectedRoom) return;

    setIsLeaving(true);
    try {
      const result = await leaveRoom(selectedRoom.id);
      if (result.success) {
        toast.success(result.message || "Left room successfully");
        setShowLeaveModal(false);
        setSelectedRoom(null);
        // Reload rooms to reflect the change
        loadRooms(1, true);
        // If we're currently in this room, redirect to rooms page
        if (roomCode === selectedRoom.room_code) {
          router.push("/rooms");
        }
      } else {
        toast.error(result.error || "Failed to leave room");
      }
    } catch (error) {
      console.error("Error leaving room:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <>
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
                const isCreator = room.creator_id === user?.id;

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
                        className="w-32 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align={isMobile ? "end" : "start"}
                      >
                        <DropdownMenuItem onClick={() => handleOpenRoom(room)}>
                          <IconExternalLink />
                          <span>Open</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => handleShareRoom(room, e)}
                        >
                          <IconShare3 />
                          <span>Share</span>
                        </DropdownMenuItem>
                        {!isCreator && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={(e) => handleLeaveRoom(room, e)}
                            >
                              <IconLogout />
                              <span>Leave</span>
                            </DropdownMenuItem>
                          </>
                        )}
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

      {/* Share Modal */}
      {selectedRoom && showShareModal && <ShareBtn room={selectedRoom} />}

      {/* Leave Room Confirmation Modal */}
      <Dialog open={showLeaveModal} onOpenChange={setShowLeaveModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Leave Room
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to leave &quot;{selectedRoom?.title}&quot;?
              You&apos;ll need to be invited again to rejoin this room.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowLeaveModal(false);
                setSelectedRoom(null);
              }}
              disabled={isLeaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmLeaveRoom}
              disabled={isLeaving}
            >
              {isLeaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Leaving...
                </>
              ) : (
                <>
                  <IconLogout className="mr-2 h-4 w-4" />
                  Leave Room
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
