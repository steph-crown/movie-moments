"use client";

import { ICachedContent, IRoom } from "@/interfaces/room.interface";
import { Film, Lock, UsersRound } from "lucide-react";
import Image from "next/image";
import { Badge } from "./ui/badge";

import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useRouter } from "next/navigation";

export function Room({ room }: { room: IRoom }) {
  const router = useRouter();
  const [imageLoaded, setImageLoaded] = useState(false);
  const hasImage = room.content?.backdrop_path || room.content?.poster_path;

  const getImageUrl = () => {
    const content = room.content;

    if (content?.backdrop_path) {
      return `https://image.tmdb.org/t/p/w1280${content.backdrop_path}`;
    }
    if (content?.poster_path) {
      return `https://image.tmdb.org/t/p/w1280${content.poster_path}`;
    }

    return null; // No image available
  };

  const getBackgroundStyle = (content: ICachedContent) => {
    const gradients: Record<string, string> = {
      movie: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      series: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      horror: "linear-gradient(135deg, #434343 0%, #000000 100%)",
      comedy: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    };

    return {
      background: gradients[content?.content_type] || gradients.movie,
    };
  };

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
            router.push(`/rooms/${room.room_code}`);
          }}
        >
          <div className="w-full h-[12.5rem] relative">
            {hasImage ? (
              <>
                {/* Background gradient that shows while image loads */}
                <div
                  className="absolute inset-0 rounded-t-xl flex items-center justify-center"
                  style={getBackgroundStyle(room.content)}
                >
                  <div className="text-white text-center">
                    <div className="text-4xl mb-2">
                      {room.content.content_type === "series" ? "📺" : "🎬"}
                    </div>
                    <p className="font-semibold text-sm px-4">
                      {room.content?.title}
                    </p>
                  </div>
                </div>

                {/* Image that appears on top when loaded */}
                <Image
                  src={getImageUrl()!}
                  fill={true}
                  alt={room.title}
                  className={`rounded-t-xl object-cover transition-opacity duration-300 ${
                    imageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageLoaded(false)}
                />
              </>
            ) : (
              <div
                className="w-full h-full rounded-t-xl flex items-center justify-center"
                style={getBackgroundStyle(room.content)}
              >
                <div className="text-white text-center">
                  <div className="text-4xl mb-2">
                    {room.content.content_type === "series" ? "📺" : "🎬"}
                  </div>
                  <p className="font-semibold text-sm px-4">
                    {room.content?.title}
                  </p>
                </div>
              </div>
            )}
          </div>

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
                <Film className="h-4 text-ring" />

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
                <UsersRound className="h-4 text-ring" />

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
