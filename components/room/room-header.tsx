import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { IRoom, ParticipantStatus } from "@/interfaces/room.interface";
import { Film, Lock, UsersRound } from "lucide-react";
import { RoomInfo } from "../btns/room-info-btn";
import { ShareBtn } from "../btns/share-btn";
import { Badge } from "../ui/badge";

export function RoomHeader({
  room,
  userStatus,
}: {
  room: IRoom;
  userStatus?: ParticipantStatus;
}) {
  const isMobile = useIsMobile();

  return (
    <>
      <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 max-[350px]:mx-1 data-[orientation=vertical]:h-8"
          />

          <div className="min-w-0 flex justify-between items-center flex-1">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="min-w-0 bg-background cursor-pointer">
                <div className="flex items-center gap-2 min-w-0">
                  <h1 className="text-[15px] sm:text-base font-semibold font-inter truncate max-[900px]:max-w-[300px]">
                    <span className="inline-block mr-1.5">
                      {room.content.content_type === "series" ? "📺" : "🎬"}
                    </span>
                    {room.title}
                  </h1>

                  {room.privacy_level === "private" && (
                    <Lock className="h-3.5 text-ring shrink-0" />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={"secondary"}>{room.streaming_platform}</Badge>

                  <p className="text-ring">•</p>

                  <div className="flex items-center gap-1 text-ring">
                    <Film className="h-3.5 w-3.5" />
                    <p className="text-xs font-medium">{room.content.title}</p>
                  </div>

                  <p className="text-ring hidden sm:block">•</p>

                  <div className="hidden sm:flex items-center gap-1 text-ring">
                    <UsersRound className="h-3.5 w-3.5 " />

                    <p className="text-[13px] font-medium ">
                      {room.member_count} members
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile Info Button */}
              {isMobile ? (
                <RoomInfo room={room} userStatus={userStatus} />
              ) : (
                /* Desktop Buttons */
                <div className="hidden lg:flex items-center gap-2">
                  {!!room && userStatus === "joined" && (
                    <ShareBtn room={room} />
                  )}
                  {!!room && <RoomInfo room={room} userStatus={userStatus} />}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
