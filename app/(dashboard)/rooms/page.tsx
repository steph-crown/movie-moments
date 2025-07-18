/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { EmptyRoomsState } from "@/components/room/empty-rooms-state";
import { Room } from "@/components/room/room";
import { RoomListItem } from "@/components/room/room-list-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useDebounce } from "@/hooks/use-debounce";
import { useInfiniteRooms } from "@/hooks/use-infinite-rooms";
import { RoomFilter, RoomSort, SortDirection } from "@/lib/actions/rooms";
import clsx from "clsx";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Filter,
  LayoutGrid,
  LayoutList,
  Loader2,
  SearchIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export default function Rooms() {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<RoomFilter>("all");
  const [sort, setSort] = useState<RoomSort>("last_updated");
  const [direction, setDirection] = useState<SortDirection>("desc");
  const [searchInput, setSearchInput] = useState("");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Debounce search input
  const debouncedSearch = useDebounce(searchInput, 300);

  const { rooms, loading, loadingMore, hasMore, error, loadMore, refresh } =
    useInfiniteRooms({
      filter,
      sort,
      direction,
      search: debouncedSearch,
      limit: 12,
    });

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  const filterOptions = [
    { value: "all", label: "All rooms" },
    { value: "created", label: "My rooms (created by me)" },
    { value: "joined", label: "Joined rooms" },
    { value: "invited", label: "Invited rooms" },
  ];

  const sortOptions = [
    { value: "last_updated", label: "Last updated" },
    { value: "date_created", label: "Date created" },
    { value: "alphabetical", label: "Alphabetical" },
  ];

  const getFilterLabel = () =>
    filterOptions.find((f) => f.value === filter)?.label || "All rooms";
  const getSortLabel = () =>
    sortOptions.find((s) => s.value === sort)?.label || "Last updated";

  const sortOptionsMenu = useMemo(
    () => (
      <div className="space-y-2">
        {sortOptions.map((option) => (
          <div key={option.value} className="flex items-center justify-between">
            <button
              className={clsx(
                "text-left text-sm flex-1 px-2 py-1 rounded hover:bg-accent",
                sort === option.value && "bg-accent"
              )}
              onClick={() => setSort(option.value as RoomSort)}
            >
              {option.label}
            </button>
            {sort === option.value && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setDirection(direction === "asc" ? "desc" : "asc")
                }
                className="ml-2 h-6 w-8 p-0 flex items-center justify-center gap-0.5"
              >
                <ArrowUp
                  className={clsx(
                    "h-3 w-3 -mr-1",
                    direction === "asc"
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                />
                <ArrowDown
                  className={clsx(
                    "h-3 w-3",
                    direction === "desc"
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                />
              </Button>
            )}
          </div>
        ))}
      </div>
    ),
    [direction, sort]
  );

  const filterOptionsMenu = useMemo(
    () => (
      <div className="space-y-2">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            className={clsx(
              "w-full text-left px-2 py-1 text-sm rounded hover:bg-accent",
              filter === option.value && "bg-accent"
            )}
            onClick={() => setFilter(option.value as RoomFilter)}
          >
            {option.label}
          </button>
        ))}
      </div>
    ),
    [filter]
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={refresh} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="font-semibold">My Rooms</h1>

        <div className="flex justify-end items-center gap-6">
          <div className="hidden items-center gap-6 sm:flex">
            <Popover>
              <PopoverTrigger className="text-sm font-medium flex gap-0.5 items-center">
                {getFilterLabel()}
                <ChevronDown className="h-4" />
              </PopoverTrigger>
              <PopoverContent className="w-56">
                {filterOptionsMenu}
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger className="text-sm font-medium flex gap-0.5 items-center">
                {getSortLabel()}
                <ChevronDown className="h-4" />
              </PopoverTrigger>
              <PopoverContent className="w-48">
                {sortOptionsMenu}
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
            onClick={() => setIsMobileFilterOpen((prev) => !prev)}
          >
            <Filter className="h-2" />
            Filter
          </Button>

          <ToggleGroup
            variant="default"
            size={"sm"}
            type="single"
            value={viewMode}
            onValueChange={(value) =>
              value && setViewMode(value as "grid" | "list")
            }
          >
            <ToggleGroupItem value="grid" aria-label="Toggle grid">
              <LayoutGrid />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Toggle list">
              <LayoutList />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mt-4">
        <div className="relative max-w-md">
          <SearchIcon className="h-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search rooms..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="!text-sm !h-10 w-full !pl-10"
          />
        </div>
      </div>

      {isMobileFilterOpen && (
        <div className="flex justify-between items-center sm:hidden mt-4 gap-4">
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger className="text-sm font-medium flex gap-0.5 items-center">
                {getFilterLabel()}
                <ChevronDown className="h-4" />
              </PopoverTrigger>
              <PopoverContent className="w-56">
                {filterOptionsMenu}
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger className="text-sm font-medium flex gap-0.5 items-center">
                {getSortLabel()}
                <ChevronDown className="h-4" />
              </PopoverTrigger>
              <PopoverContent className="w-48">
                {sortOptionsMenu}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {/* Rooms List/Grid */}
      <div className="mt-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : rooms.length === 0 ? (
          <EmptyRoomsState />
        ) : (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(272px,1fr))] gap-8">
                {rooms.map((room) => (
                  <Room key={room.id} room={room} />
                ))}
              </div>
            ) : (
              <div className="space-y-0">
                {/* List Header */}
                <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-3 text-xs font-medium text-muted-foreground border-b bg-muted/30">
                  <div className="w-12"></div>
                  <div>Name</div>
                  <div className="text-center min-w-[100px]">Last modified</div>
                  <div className="text-center min-w-[80px]">Created</div>
                </div>

                {/* List Items */}
                <div className="border border-t-0 rounded-b-lg overflow-hidden">
                  {rooms.map((room, index) => (
                    <RoomListItem
                      key={room.id}
                      room={room}
                      isLast={index === rooms.length - 1}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Load More Trigger */}
            <div ref={loadMoreRef} className="flex justify-center mt-8">
              {loadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading more rooms...
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
