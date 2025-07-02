"use client";

import { IRoom } from "@/interfaces/room.interface";
import { Film, Lock, UsersRound } from "lucide-react";
import { Badge } from "../ui/badge";

import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { RoomDisplayPhoto } from "./room-display-photo";

export function Room({ room }: { room: IRoom }) {
  const router = useRouter();

  const formatLastActivity = (timestamp: string) => {
    const now = new Date();
    const activity = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - activity.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="rounded-xl cursor-pointer"
          onClick={() => {
            router.push(`/${room.room_code}`);
          }}
        >
          <RoomDisplayPhoto room={room} className="w-full h-[12.5rem]" />

          <div className="border border-solid border-border rounded-b-xl px-4 py-3">
            <div className="flex items-center gap-0.5">
              <p className="text-sm font-medium">
                {room.title || room.content.title}
              </p>

              {room.privacy_level === "private" && (
                <Lock className="h-3.5 text-ring" />
              )}
            </div>

            <div className="flex items-center mt-2.5 gap-1">
              <div className=" flex items-center gap-0.5">
                <Film className="h-4 w-4 text-ring" />

                <p className="text-xs font-normal">{room.content.title}</p>
              </div>
            </div>

            <div className="flex  mt-4 items-center justify-between">
              <div className="flex gap-2">
                <Badge variant={"secondary"}>{room.streaming_platform}</Badge>

                <Badge variant={"secondary"} className="capitalize">
                  {room.content.content_type}
                </Badge>
              </div>

              <div className="flex items-center gap-0.5">
                <UsersRound className="h-4 w-4 text-ring" />

                <p className="text-xs font-medium text-ring">
                  {room.member_count} members
                </p>
              </div>
            </div>
          </div>
        </div>
      </TooltipTrigger>

      <TooltipContent>
        <div className="p-2">
          <p className="text-xs font-semibold mb-1">
            Created by @{room.creator.username}
          </p>
          <p className="text-xs opacity-75">
            Last activity: {formatLastActivity(room.last_activity)}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
