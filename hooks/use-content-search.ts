import { SearchResult } from "@/interfaces/tmdb.interface";
import { searchContent } from "@/lib/actions/search";
import { useDebouncedSearch } from "./use-debounced-search";
import { useCallback } from "react";

export function useContentSearch(contentType: "movie" | "series") {
  // Create a memoized search function that captures contentType
  const searchWrapper = useCallback(
    async (query: string): Promise<SearchResult[]> => {
      const response = await searchContent(query, contentType);

      if (response.success) {
        return response.data || [];
      } else {
        throw new Error(response.error || "Search failed");
      }
    },
    [contentType]
  );

  const {
    query,
    setQuery,
    results,
    isLoading,
    error,
    clearResults,
    clearError,
  } = useDebouncedSearch(searchWrapper, 300);

  return {
    query,
    setQuery,
    results: results || [], // Always return array
    isLoading,
    error,
    clearResults,
    clearError,
  };
}
