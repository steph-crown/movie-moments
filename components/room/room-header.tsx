import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { IRoom } from "@/interfaces/room.interface";
import { Film, Info, Lock, UsersRound } from "lucide-react";
import { Badge } from "../ui/badge";

import { IconShare3 } from "@tabler/icons-react";

export function RoomHeader({ room }: { room: IRoom }) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 max-[350px]:mx-1 data-[orientation=vertical]:h-8"
        />

        <div className="min-w-0 flex justify-between items-center flex-1">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* <RoomDisplayPhoto
              room={room}
              className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 block max-[350px]:hidden"
              imageClassName="!rounded-full"
              placeholderEmojiClassName="text-sm"
              placeholderTextClassName="hidden"
            /> */}
            {/* p-2 px-3 rounded-md  shadow-sm  */}

            {/* <div>{room.content.content_type === "series" ? "📺" : "🎬"}</div> */}

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

          <div className="hidden lg:flex items-center gap-2 ">
            <Button variant="outline" size="sm" className="font-semibold">
              <IconShare3 className="text-muted-foreground text-sm" />
              Share
            </Button>

            <Button variant="outline" size="sm" className="font-semibold">
              <Info className="text-muted-foreground text-sm" />
              Info
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
