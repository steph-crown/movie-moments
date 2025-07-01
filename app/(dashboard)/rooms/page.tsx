import { Room } from "@/components/room";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { sampleRooms } from "@/data/rooms";
import { ChevronDown, LayoutGrid, LayoutList } from "lucide-react";

export default function Rooms() {
  return (
    <div>
      <div className="flex justify-end gap-6">
        <Popover>
          <PopoverTrigger className="text-xs font-medium flex gap-0.5 items-center">
            All rooms
            <ChevronDown className="h-4" />
          </PopoverTrigger>

          <PopoverContent>Place content for the popover here.</PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger className="text-xs font-medium flex gap-0.5 items-center">
            Last created
            <ChevronDown className="h-4" />
          </PopoverTrigger>

          <PopoverContent>Place content for the popover here.</PopoverContent>
        </Popover>

        <ToggleGroup variant="default" size={"sm"} type="single" value="grid">
          <ToggleGroupItem value="grid" aria-label="Toggle grid">
            <LayoutGrid />
          </ToggleGroupItem>

          <ToggleGroupItem value="list" aria-label="Toggle list">
            <LayoutList />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"> */}
      <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(272px,1fr))] gap-8">
        {sampleRooms.map((room) => (
          <Room key={room.id} room={room} />
        ))}
      </div>
    </div>
  );
}
