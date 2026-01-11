import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

/**
 * Hook for searching articles with debouncing
 * Searches through title, description, feedTitle, and author fields
 * Debounces input to prevent lag on large article lists
 */
export function useSearch(articles) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceTimer = useRef(null);

  // Debounce the search query (300ms delay)
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const filteredArticles = useMemo(() => {
    if (!debouncedQuery.trim()) return articles;

    const searchTerms = debouncedQuery.toLowerCase().trim().split(/\s+/);

    return articles.filter(article => {
      const title = (article.title || '').toLowerCase();
      const description = (article.description || '').toLowerCase();
      const feedTitle = (article.feedTitle || '').toLowerCase();
      const author = (article.author || '').toLowerCase();

      // All search terms must match somewhere
      return searchTerms.every(term =>
        title.includes(term) ||
        description.includes(term) ||
        feedTitle.includes(term) ||
        author.includes(term)
      );
    });
  }, [articles, debouncedQuery]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
  }, []);

  return {
    query,
    setQuery,
    clearSearch,
    filteredArticles,
    hasResults: filteredArticles.length > 0,
    isSearching: query.trim().length > 0,
    isDebouncing: query !== debouncedQuery
  };
}

export default useSearch;
