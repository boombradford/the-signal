import { useState, useMemo, useCallback } from 'react';

/**
 * Hook for searching articles in real-time
 * Searches through title and description fields
 */
export function useSearch(articles) {
  const [query, setQuery] = useState('');

  const filteredArticles = useMemo(() => {
    if (!query.trim()) return articles;

    const searchTerms = query.toLowerCase().trim().split(/\s+/);

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
  }, [articles, query]);

  const clearSearch = useCallback(() => {
    setQuery('');
  }, []);

  return {
    query,
    setQuery,
    clearSearch,
    filteredArticles,
    hasResults: filteredArticles.length > 0,
    isSearching: query.trim().length > 0
  };
}

export default useSearch;
