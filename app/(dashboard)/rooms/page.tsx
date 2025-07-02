"use client";

import { Room } from "@/components/room/room";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { sampleRooms } from "@/data/rooms";
import clsx from "clsx";
import {
  ChevronDown,
  Filter,
  LayoutGrid,
  LayoutList,
  SearchIcon,
} from "lucide-react";
import { useState } from "react";

export default function Rooms() {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="font-semibold">My Rooms</h1>

        <div className="flex justify-end items-center gap-6">
          <div className="hidden items-center gap-6 sm:flex">
            <Popover>
              <PopoverTrigger className="text-xs font-medium flex gap-0.5 items-center">
                All rooms
                <ChevronDown className="h-4" />
              </PopoverTrigger>

              <PopoverContent>
                Place content for the popover here.
                {/* options are "All rooms" "My rooms (created by me)", "Joined rooms (not created by me but i joined)", "Invited rooms (where i was invited but havent joined)". Default is All rooms */}
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger className="text-xs font-medium flex gap-0.5 items-center">
                Last updated
                <ChevronDown className="h-4" />
              </PopoverTrigger>

              <PopoverContent>
                Place content for the popover here.
                {/* options are Last updated, Date created, Alphabetical. it's a sort, so there should be something the user uses to choose if DESC or ASC. default is Last updated. DESC. */}
              </PopoverContent>
            </Popover>
          </div>

          <Button
            variant={"outline"}
            className={clsx(
              "flex sm:hidden text-xs !py-1",
              isMobileFilterOpen && "!text-primary"
            )}
            size={"default"}
            onClick={() => {
              setIsMobileFilterOpen((prev) => !prev);
            }}
          >
            <Filter className="h-2" />
            Filter
          </Button>

          <ToggleGroup variant="default" size={"sm"} type="single" value="grid">
            <ToggleGroupItem value="grid" aria-label="Toggle grid">
              <LayoutGrid />
            </ToggleGroupItem>

            <ToggleGroupItem value="list" aria-label="Toggle list">
              <LayoutList />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {isMobileFilterOpen && (
        <div className="flex justify-between items-center sm:hidden mt-4 gap-4">
          <div className="relative flex-1">
            <SearchIcon className="h-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />

            <Input
              placeholder="Search rooms"
              className="!text-xs !h-[2.25rem] w-full !pl-10"
            />
          </div>

          <div className="flex items-center gap-6 sm:hidden ">
            <Popover>
              <PopoverTrigger className="text-sm font-medium flex gap-0.5 items-center">
                All rooms
                <ChevronDown className="h-4" />
              </PopoverTrigger>

              <PopoverContent>
                Place content for the popover here.
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {/* <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"> */}
      <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(272px,1fr))] gap-8">
        {sampleRooms.map((room) => (
          <Room key={room.id} room={room} />
        ))}
      </div>
    </div>
  );
}
