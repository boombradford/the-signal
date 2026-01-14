import { useState, useCallback } from 'react';
import { articleOperations } from '../utils/db';

// Available tags for filtering - no emoji, clean labels only
export const AVAILABLE_TAGS = [
  { id: 'Tech', label: 'Tech' },
  { id: 'Finance', label: 'Finance' },
  { id: 'Politics', label: 'Politics' },
  { id: 'Science', label: 'Science' },
  { id: 'Culture', label: 'Culture' },
  { id: 'Sports', label: 'Sports' },
  { id: 'Health', label: 'Health' },
  { id: 'World', label: 'World' },
];

// Hook for tagging articles
export function useArticleTagging() {
  const [tagging, setTagging] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState(null);

  const tagArticle = useCallback(async (article) => {
    try {
      const response = await fetch('/api/tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article.title,
          description: article.description,
          content: article.content
        })
      });

      if (!response.ok) {
        throw new Error('Failed to tag article');
      }

      const tags = await response.json();

      // Save tags to database
      await articleOperations.updateTags(article.id, tags);

      return tags;
    } catch (err) {
      console.error('Tagging error:', err);
      return null;
    }
  }, []);

  const tagMultipleArticles = useCallback(async (articles) => {
    setTagging(true);
    setProgress({ current: 0, total: articles.length });
    setError(null);

    const results = [];

    // Process in batches of 3 to avoid rate limits
    const batchSize = 3;
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(article => tagArticle(article))
      );

      results.push(...batchResults);
      setProgress({ current: Math.min(i + batchSize, articles.length), total: articles.length });

      // Small delay between batches
      if (i + batchSize < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setTagging(false);
    return results;
  }, [tagArticle]);

  return {
    tagArticle,
    tagMultipleArticles,
    tagging,
    progress,
    error
  };
}

// Hook for daily briefing
export function useDailyBriefing() {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateBriefing = useCallback(async (articles, style = 'briefing') => {
    if (!articles || articles.length === 0) {
      setError('No articles to summarize');
      return null;
    }

    setLoading(true);
    setError(null);
    setBriefing(null);

    try {
      const response = await fetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: articles.map(a => ({
            title: a.title,
            description: a.description,
            content: a.content?.slice(0, 500),
            feedTitle: a.feedTitle,
            pubDate: a.pubDate
          })),
          style
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate briefing');
      }

      const data = await response.json();
      setBriefing(data);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearBriefing = useCallback(() => {
    setBriefing(null);
    setError(null);
  }, []);

  return {
    briefing,
    loading,
    error,
    generateBriefing,
    clearBriefing
  };
}

export default {
  useArticleTagging,
  useDailyBriefing,
  AVAILABLE_TAGS
};
