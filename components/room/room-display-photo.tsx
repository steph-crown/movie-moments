"use client";

import { IRoom } from "@/interfaces/room.interface";
import {
  getRoomBackgroundStyle,
  getRoomImageUrl,
} from "@/lib/utils/room.utils";
import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";

export function RoomDisplayPhoto({
  room,
  className,
  imageClassName,
  placeholderEmojiClassName,
  placeholderTextClassName,
}: {
  room: IRoom;
  className?: string;
  imageClassName?: string;
  placeholderEmojiClassName?: string;
  placeholderTextClassName?: string;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const hasImage = room.content?.backdrop_path || room.content?.poster_path;

  return (
    <div className={clsx("relative", className)}>
      {hasImage ? (
        <>
          {/* Background gradient that shows while image loads */}
          <div
            className={clsx(
              "absolute inset-0 rounded-t-xl flex items-center justify-center",
              imageClassName
            )}
            style={getRoomBackgroundStyle(room)}
          >
            <div className="text-white text-center flex flex-col items-center justify-center gap-2">
              <div className={clsx("text-4xl", placeholderEmojiClassName)}>
                {room.content.content_type === "series" ? "📺" : "🎬"}
              </div>
              <p
                className={clsx(
                  "font-semibold text-sm px-4 ",
                  placeholderTextClassName
                )}
              >
                {room.content?.title}
              </p>
            </div>
          </div>

          {/* Image that appears on top when loaded */}
          <Image
            src={getRoomImageUrl(room)!}
            fill={true}
            alt={room.title}
            className={clsx(
              `rounded-t-xl object-cover transition-opacity duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`,
              imageClassName
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(false)}
          />
        </>
      ) : (
        <div
          className="w-full h-full rounded-t-xl flex items-center justify-center"
          style={getRoomBackgroundStyle(room)}
        >
          <div className="text-white text-center flex flex-col items-center justify-center gap-2">
            <div className={clsx("text-4xl", placeholderEmojiClassName)}>
              {room.content.content_type === "series" ? "📺" : "🎬"}
            </div>
            <p
              className={clsx(
                "font-semibold text-sm px-4",
                placeholderTextClassName
              )}
            >
              {room.content?.title}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
