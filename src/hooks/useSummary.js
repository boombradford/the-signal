import { useState, useCallback, useEffect } from 'react';
import { generateSummary, extractArticleContent } from '../utils/ai';
import { summaryOperations } from '../utils/db';

// Hook for AI summaries
export function useSummary(articleId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cachedSummary, setCachedSummary] = useState(null);

  // Load cached summary
  useEffect(() => {
    if (!articleId) {
      setCachedSummary(null);
      return;
    }

    summaryOperations.get(articleId).then(setCachedSummary).catch(() => setCachedSummary(null));
  }, [articleId]);

  // Generate summary
  const summarize = useCallback(async (content, options = {}) => {
    if (!articleId) return null;

    setLoading(true);
    setError(null);

    try {
      // Generate summary with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Summary generation timed out. Please try again.')), 30000)
      );

      const result = await Promise.race([
        generateSummary(content, options),
        timeoutPromise
      ]);

      // Cache the summary
      await summaryOperations.save(articleId, result.summary, options.style || 'concise', result.model);

      // Update local state
      setCachedSummary({ content: result.summary, model: result.model });

      setLoading(false);
      return result.summary;
    } catch (err) {
      const errorMessage = err.message || 'Failed to generate summary';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, [articleId]);

  // Summarize from URL (fetches full article content first)
  const summarizeFromUrl = useCallback(async (url, options = {}) => {
    if (!articleId) return null;

    setLoading(true);
    setError(null);

    try {
      // Extract article content with timeout
      const extractPromise = extractArticleContent(url);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Failed to fetch article content. Please try again.')), 15000)
      );

      const extracted = await Promise.race([extractPromise, timeoutPromise]);

      if (!extracted.content || extracted.content.length < 100) {
        throw new Error('Could not extract enough content from article');
      }

      // Generate summary
      return await summarize(extracted.content, options);
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch article';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, [articleId, summarize]);

  // Clear cached summary
  const clearSummary = useCallback(async () => {
    if (!articleId) return;
    setCachedSummary(null);
  }, [articleId]);

  return {
    summary: cachedSummary?.content || null,
    loading,
    error,
    summarize,
    summarizeFromUrl,
    clearSummary,
    hasSummary: !!cachedSummary
  };
}

// Hook for batch summarization
export function useBatchSummary() {
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [loading, setLoading] = useState(false);

  const summarizeArticles = useCallback(async (articles) => {
    setLoading(true);
    setProgress({ current: 0, total: articles.length });

    const results = [];

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];

      try {
        // Check if already has summary
        const existing = await summaryOperations.get(article.id);
        if (existing) {
          results.push({ articleId: article.id, success: true, cached: true });
          continue;
        }

        // Try to use content, fall back to extracting from URL
        let content = article.content || article.description;

        if (!content || content.length < 100) {
          const extracted = await extractArticleContent(article.link);
          content = extracted.content;
        }

        // Generate summary
        const result = await generateSummary(content);

        // Save
        await summaryOperations.save(article.id, result.summary, 'concise', result.model);

        results.push({ articleId: article.id, success: true });
      } catch (err) {
        results.push({ articleId: article.id, success: false, error: err.message });
      }

      setProgress({ current: i + 1, total: articles.length });

      // Rate limiting - wait between requests
      if (i < articles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setLoading(false);
    return results;
  }, []);

  return {
    loading,
    progress,
    summarizeArticles
  };
}

export default useSummary;
