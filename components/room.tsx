import { IRoom } from "@/interfaces/room.interface";
import { Lock } from "lucide-react";
import Image from "next/image";

export function Room({ room }: { room: IRoom }) {
  return (
    <div className="rounded-xl">
      <div className="w-full h-[12.5rem] relative">
        <Image
          src={room.thumbnail_url}
          fill={true}
          alt={room.title}
          className="rounded-t-xl object-cover"
        />
      </div>

      <div className="border border-solid border-border rounded-b-xl px-4 py-3">
        <div className="flex items-center gap-0.5">
          <p className="text-sm font-medium">{room.title}</p>

          {room.privacy_level === "private" && (
            <Lock className="h-3.5 text-ring" />
          )}
        </div>
      </div>
    </div>
  );
}
