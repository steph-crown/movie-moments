import {
  TMDBSearchResponse,
  TMDBMovie,
  TMDBTVShow,
  SearchResult,
  TMDBMovieDetails,
  TMDBTVShowDetails,
  DetailedContent,
} from "@/interfaces/tmdb.interface";

const TMDB_BASE_URL = process.env.TMDB_BASE_URL!;
const TMDB_API_KEY = process.env.TMDB_API_KEY!;

// Common headers for TMDB requests
const tmdbHeaders = {
  Authorization: `Bearer ${TMDB_API_KEY}`,
  "Content-Type": "application/json",
};

export async function searchTMDBMovies(query: string): Promise<SearchResult[]> {
  const url = `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(
    query
  )}&include_adult=true&language=en-US&page=1`;

  const response = await fetch(url, {
    headers: tmdbHeaders,
  });

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }

  const data: TMDBSearchResponse = await response.json();

  return (data.results as TMDBMovie[]).map((movie) => ({
    tmdb_id: movie.id,
    title: movie.title,
    overview: movie.overview,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    content_type: "movie" as const,
    release_date: movie.release_date,
    genre_ids: movie.genre_ids,
    popularity: movie.popularity,
    vote_average: movie.vote_average,
    vote_count: movie.vote_count,
    seasons: [],
  }));
}

export async function searchTMDBTVShows(
  query: string
): Promise<SearchResult[]> {
  const url = `${TMDB_BASE_URL}/search/tv?query=${encodeURIComponent(
    query
  )}&include_adult=true&language=en-US&page=1`;

  const response = await fetch(url, {
    headers: tmdbHeaders,
  });

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }

  const data: TMDBSearchResponse = await response.json();

  // console.log({ outofmyhead: data.results?.[1] });

  // console.log("result from search shows", data);

  return (data.results as TMDBTVShow[]).map((show) => ({
    tmdb_id: show.id,
    title: show.name,
    overview: show.overview,
    poster_path: show.poster_path,
    backdrop_path: show.backdrop_path,
    content_type: "series" as const,
    first_air_date: show.first_air_date,
    genre_ids: show.genre_ids,
    popularity: show.popularity,
    vote_average: show.vote_average,
    vote_count: show.vote_count,
    seasons: show.seasons,
  }));
}

export async function fetchMovieDetails(
  tmdbId: number
): Promise<DetailedContent> {
  const url = `${TMDB_BASE_URL}/movie/${tmdbId}`;

  const response = await fetch(url, {
    headers: tmdbHeaders,
  });

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }

  const movie: TMDBMovieDetails = await response.json();

  console.log({ flowniggaa: movie });

  return {
    tmdb_id: movie.id,
    content_type: "movie",
    title: movie.title,
    overview: movie.overview,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    popularity: movie.popularity,
    vote_average: movie.vote_average,
    vote_count: movie.vote_count,

    // Movie-specific fields
    runtime: movie.runtime,
    release_date: movie.release_date,
    budget: movie.budget,
    revenue: movie.revenue,
    imdb_id: movie.imdb_id,

    // Common fields
    genres: movie.genres,
    production_companies: movie.production_companies,
    production_countries: movie.production_countries,
    spoken_languages: movie.spoken_languages,
    status: movie.status,
    tagline: movie.tagline,
    homepage: movie.homepage,

    // Series-specific fields (null for movies)
    first_air_date: null,
    last_air_date: null,
    number_of_seasons: null,
    number_of_episodes: null,
    networks: null,
    seasons: null,
    created_by: null,
    episode_run_time: null,
    in_production: null,
    last_episode_to_air: null,
    next_episode_to_air: null,
    origin_country: movie.origin_country,
    original_language: movie.original_language,
    type: null,
  };
}

export async function fetchTVShowDetails(
  tmdbId: number
): Promise<DetailedContent> {
  const url = `${TMDB_BASE_URL}/tv/${tmdbId}`;

  const response = await fetch(url, {
    headers: tmdbHeaders,
  });

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }

  const show: TMDBTVShowDetails = await response.json();

  return {
    tmdb_id: show.id,
    content_type: "series",
    title: show.name,
    overview: show.overview,
    poster_path: show.poster_path,
    backdrop_path: show.backdrop_path,
    popularity: show.popularity,
    vote_average: show.vote_average,
    vote_count: show.vote_count,

    // Series-specific fields
    first_air_date: show.first_air_date,
    last_air_date: show.last_air_date,
    number_of_seasons: show.number_of_seasons,
    number_of_episodes: show.number_of_episodes,
    networks: show.networks,
    seasons: show.seasons,
    created_by: show.created_by,
    episode_run_time: show.episode_run_time,
    in_production: show.in_production,
    last_episode_to_air: show.last_episode_to_air,
    next_episode_to_air: show.next_episode_to_air,
    origin_country: show.origin_country,
    original_language: show.original_language,
    type: show.type,

    // Common fields
    genres: show.genres,
    production_companies: show.production_companies,
    production_countries: show.production_countries,
    spoken_languages: show.spoken_languages,
    status: show.status,
    tagline: show.tagline,
    homepage: show.homepage,

    // Movie-specific fields (null for series)
    runtime: null,
    release_date: null,
    budget: null,
    revenue: null,
    imdb_id: null,
  };
}

export async function fetchDetailedContent(
  tmdbId: number,
  contentType: "movie" | "series"
): Promise<DetailedContent> {
  if (contentType === "movie") {
    return fetchMovieDetails(tmdbId);
  } else {
    return fetchTVShowDetails(tmdbId);
  }
}

export async function fetchMultipleDetailedContent(
  items: Array<{ tmdb_id: number; content_type: "movie" | "series" }>
): Promise<DetailedContent[]> {
  const promises = items.map((item) =>
    fetchDetailedContent(item.tmdb_id, item.content_type).catch((error) => {
      console.error(
        `Failed to fetch details for ${item.content_type} ${item.tmdb_id}:`,
        error
      );
      return null;
    })
  );

  const results = await Promise.all(promises);
  return results.filter((result): result is DetailedContent => result !== null);
}
