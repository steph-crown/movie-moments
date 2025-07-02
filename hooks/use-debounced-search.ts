/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react";

// Generic debounce hook
export function useDebouncedSearch<T>(
  searchFunction: (query: string) => Promise<T>,
  delay: number = 700
) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store the latest searchFunction to avoid stale closures
  const searchFunctionRef = useRef(searchFunction);
  searchFunctionRef.current = searchFunction;

  const debouncedFunction = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await searchFunctionRef.current(searchQuery);
        setResults(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    }, delay),
    [delay]
  );

  useEffect(() => {
    debouncedFunction(query);
  }, [query, debouncedFunction]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    clearResults: () => setResults(null),
    clearError: () => setError(null),
  };
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
