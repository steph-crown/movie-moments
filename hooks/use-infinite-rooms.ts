"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchUserRooms, FetchRoomsParams } from "@/lib/actions/rooms";
import { IRoom } from "@/interfaces/room.interface";

export function useInfiniteRooms(params: Omit<FetchRoomsParams, "page">) {
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const loadRooms = useCallback(
    async (pageNum: number, reset: boolean = false) => {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      setError(null);

      try {
        const result = await fetchUserRooms({
          ...params,
          page: pageNum,
        });

        if (result.success && result.data) {
          if (reset || pageNum === 1) {
            setRooms(result.data.rooms);
          } else {
            setRooms((prev) => [...prev, ...(result.data?.rooms || [])]);
          }
          setHasMore(result.data.hasMore);
        } else {
          setError(result.error || "Failed to load rooms");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load rooms");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [params]
  );

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadRooms(nextPage);
    }
  }, [loadingMore, hasMore, page, loadRooms]);

  const refresh = useCallback(() => {
    setPage(1);
    loadRooms(1, true);
  }, [loadRooms]);

  // Load initial data
  useEffect(() => {
    setPage(1);
    loadRooms(1, true);
  }, [params.filter, params.sort, params.direction, params.search]);

  return {
    rooms,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
  };
}
