"use server";

import { createClient } from "@/lib/supabase/server";
import { searchTMDBMovies, searchTMDBTVShows } from "@/lib/tmdb";
import { SearchResult } from "@/interfaces/tmdb.interface";

export async function searchContent(
  query: string,
  contentType: "movie" | "series"
): Promise<{ success: boolean; data?: SearchResult[]; error?: string }> {
  try {
    if (!query.trim()) {
      return { success: true, data: [] };
    }

    const supabase = await createClient();
    const cacheKey = query.toLowerCase().trim();

    // Check cache first
    const { data: cached } = await supabase
      .from("search_cache")
      .select("results, cached_at")
      .eq("query", cacheKey)
      .eq("content_type", contentType)
      .single();

    // Check if cache is valid (24 hours)
    if (cached && isCacheValid(cached.cached_at)) {
      console.log("Cache hit for:", cacheKey);
      return { success: true, data: cached.results as SearchResult[] };
    }

    // Cache miss - fetch from TMDB
    console.log("Cache miss for:", cacheKey, "fetching from TMDB");
    let results: SearchResult[];

    if (contentType === "movie") {
      results = await searchTMDBMovies(query);
    } else {
      results = await searchTMDBTVShows(query);
    }

    // Cache the results
    await supabase.from("search_cache").upsert({
      query: cacheKey,
      content_type: contentType,
      results: results,
    });

    // Optionally pre-cache individual content items
    for (const item of results.slice(0, 5)) {
      // Cache top 5 results
      await cacheContentItem(item);
    }

    return { success: true, data: results };
  } catch (error) {
    console.error("Search error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Search failed",
    };
  }
}

async function cacheContentItem(item: SearchResult) {
  const supabase = await createClient();

  try {
    await supabase.from("content_cache").upsert({
      tmdb_id: item.tmdb_id,
      content_type: item.content_type,
      title: item.title,
      overview: item.overview,
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      release_date: item.release_date || null,
      first_air_date: item.first_air_date || null,
      genres: item.genre_ids.map((id) => ({ id })), // Simplified genre storage
      popularity: item.popularity,
      vote_average: item.vote_average,
      vote_count: item.vote_count,
    });
  } catch (error) {
    console.error("Failed to cache content item:", error);
    // Don't throw - this is optional optimization
  }
}

function isCacheValid(cachedAt: string): boolean {
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  return Date.now() - new Date(cachedAt).getTime() < maxAge;
}
