"use client";

import { IRoom } from "@/interfaces/room.interface";
import { Lock, UsersRound } from "lucide-react";
import { Badge } from "../ui/badge";
import { useRouter } from "next/navigation";
import { RoomDisplayPhoto } from "./room-display-photo";

interface RoomListItemProps {
  room: IRoom;
  isLast?: boolean;
}

export function RoomListItem({ room, isLast }: RoomListItemProps) {
  const router = useRouter();

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - past.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 43200)
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    if (diffInMinutes < 525600)
      return `${Math.floor(diffInMinutes / 43200)}mo ago`;
    return `${Math.floor(diffInMinutes / 525600)}y ago`;
  };

  return (
    <div
      className={`grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors ${
        !isLast ? "border-b" : ""
      }`}
      onClick={() => router.push(`/${room.room_code}`)}
    >
      {/* Thumbnail */}
      <div className="w-12 h-8 rounded overflow-hidden bg-muted flex-shrink-0">
        <RoomDisplayPhoto room={room} className="w-full h-full object-cover" />
      </div>

      {/* Name and Details */}
      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium truncate">
            {room.title || room.content.title}
          </p>
          {room.privacy_level === "private" && (
            <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{room.content.title}</span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-auto">
              {room.streaming_platform}
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs px-1.5 py-0.5 h-auto capitalize"
            >
              {room.content.content_type}
            </Badge>
          </div>
        </div>
      </div>

      {/* Last Modified */}
      <div className="flex flex-col justify-center text-right min-w-[100px]">
        <p className="text-sm text-muted-foreground">
          {formatTimeAgo(room.last_activity)}
        </p>
      </div>

      {/* Created */}
      <div className="flex flex-col justify-center text-right min-w-[80px]">
        <p className="text-sm text-muted-foreground">
          {formatTimeAgo(room.created_at)}
        </p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <UsersRound className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {room.member_count}
          </span>
        </div>
      </div>
    </div>
  );
}
