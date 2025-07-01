/* eslint-disable @typescript-eslint/no-explicit-any */
export interface TMDBSearchResponse {
  page: number;
  results: TMDBMovie[] | TMDBTVShow[];
  total_pages: number;
  total_results: number;
}

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  genre_ids: number[];
  runtime?: number;
  popularity: number;
  vote_average: number;
  vote_count: number;
}

export interface TMDBTVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  genre_ids: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  popularity: number;
  vote_average: number;
  vote_count: number;
}

export interface SearchResult {
  tmdb_id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  content_type: "movie" | "series";
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
}

// Add these new interfaces to your existing tmdb.interface.ts

export interface TMDBMovieDetails extends TMDBMovie {
  belongs_to_collection: any;
  budget: number;
  genres: Genre[];
  homepage: string;
  imdb_id: string;
  origin_country: string[];
  original_language: string;
  production_companies: ProductionCompany[];
  production_countries: ProductionCountry[];
  revenue: number;
  runtime: number;
  spoken_languages: SpokenLanguage[];
  status: string;
  tagline: string;
}

export interface TMDBTVShowDetails extends Omit<TMDBTVShow, "name"> {
  name: string;
  created_by: CreatedBy[];
  episode_run_time: number[];
  genres: Genre[];
  homepage: string;
  in_production: boolean;
  languages: string[];
  last_air_date: string;
  last_episode_to_air: Episode | null;
  networks: Network[];
  next_episode_to_air: Episode | null;
  number_of_episodes: number;
  number_of_seasons: number;
  origin_country: string[];
  original_language: string;
  original_name: string;
  production_companies: ProductionCompany[];
  production_countries: ProductionCountry[];
  seasons: Season[];
  spoken_languages: SpokenLanguage[];
  status: string;
  tagline: string;
  type: string;
}

export interface DetailedContent {
  tmdb_id: number;
  content_type: "movie" | "series";
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  popularity: number;
  vote_average: number;
  vote_count: number;

  // Movie-specific fields (null for series)
  runtime: number | null;
  release_date: string | null;
  budget: number | null;
  revenue: number | null;
  imdb_id: string | null;

  // Series-specific fields (null for movies)
  first_air_date: string | null;
  last_air_date: string | null;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  networks: Network[] | null;
  seasons: Season[] | null;
  created_by: CreatedBy[] | null;
  episode_run_time: number[] | null;
  in_production: boolean | null;
  last_episode_to_air: Episode | null;
  next_episode_to_air: Episode | null;
  type: string | null;

  // Common fields
  genres: Genre[];
  production_companies: ProductionCompany[];
  production_countries: ProductionCountry[];
  spoken_languages: SpokenLanguage[];
  status: string;
  tagline: string;
  homepage: string;
  origin_country: string[];
  original_language: string;
}

// Supporting interfaces
export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

export interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface SpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface Network {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

export interface Season {
  air_date: string | null;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  vote_average: number;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  vote_average: number;
  vote_count: number;
  air_date: string;
  episode_number: number;
  episode_type: string;
  production_code: string;
  runtime: number;
  season_number: number;
  show_id: number;
  still_path: string | null;
}

export interface CreatedBy {
  id: number;
  credit_id: string;
  name: string;
  original_name: string;
  gender: number;
  profile_path: string | null;
}

// Update existing SearchResult interface
export interface SearchResult {
  tmdb_id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  content_type: "movie" | "series";
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
  popularity: number;
  vote_average: number;
  vote_count: number;
}
