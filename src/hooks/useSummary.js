import { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { generateSummary, extractArticleContent } from '../utils/ai';
import db, { summaryOperations } from '../utils/db';

// Hook for AI summaries
export function useSummary(articleId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get cached summary
  const cachedSummary = useLiveQuery(
    () => articleId ? summaryOperations.get(articleId) : null,
    [articleId]
  );

  // Generate summary
  const summarize = useCallback(async (content, options = {}) => {
    if (!articleId) return null;

    setLoading(true);
    setError(null);

    try {
      // Get API key from settings
      const apiKeySetting = await db.settings.get('claudeApiKey');
      const apiKey = apiKeySetting?.value;

      if (!apiKey) {
        throw new Error('Please add your API key in Settings');
      }

      // Update status to loading
      await db.articles.update(articleId, {
        summaryStatus: 'loading'
      });

      // Generate summary with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Summary generation timed out. Please try again.')), 30000)
      );

      const result = await Promise.race([
        generateSummary(content, apiKey, options),
        timeoutPromise
      ]);

      // Cache the summary (will replace existing)
      await summaryOperations.save(articleId, result.summary, result.model);

      // Update article summary status
      await db.articles.update(articleId, {
        summaryStatus: 'completed'
      });

      setLoading(false);
      return result.summary;
    } catch (err) {
      const errorMessage = err.message || 'Failed to generate summary';
      setError(errorMessage);
      setLoading(false);

      // Update article summary status
      try {
        await db.articles.update(articleId, {
          summaryStatus: 'error'
        });
      } catch {
        // Ignore DB errors during error handling
      }

      throw err;
    }
  }, [articleId]);

  // Summarize from URL (fetches full article content first)
  const summarizeFromUrl = useCallback(async (url, options = {}) => {
    if (!articleId) return null;

    setLoading(true);
    setError(null);

    try {
      // Update status to loading
      await db.articles.update(articleId, {
        summaryStatus: 'loading'
      });

      // Extract article content with timeout
      const extractPromise = extractArticleContent(url);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Failed to fetch article content. Please try again.')), 15000)
      );

      const extracted = await Promise.race([extractPromise, timeoutPromise]);

      if (!extracted.content || extracted.content.length < 100) {
        throw new Error('Could not extract enough content from article');
      }

      // Generate summary (summarize handles its own loading state)
      return await summarize(extracted.content, options);
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch article';
      setError(errorMessage);
      setLoading(false);

      try {
        await db.articles.update(articleId, {
          summaryStatus: 'error'
        });
      } catch {
        // Ignore DB errors during error handling
      }

      throw err;
    }
  }, [articleId, summarize]);

  // Clear cached summary
  const clearSummary = useCallback(async () => {
    if (!articleId) return;

    await db.summaries.delete(articleId);
    await db.articles.update(articleId, {
      summaryStatus: 'none'
    });
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

  const summarizeArticles = useCallback(async (articleIds) => {
    setLoading(true);
    setProgress({ current: 0, total: articleIds.length });

    const results = [];

    for (let i = 0; i < articleIds.length; i++) {
      const articleId = articleIds[i];

      try {
        const article = await db.articles.get(articleId);

        if (!article) continue;

        // Check if already has summary
        const existing = await summaryOperations.get(articleId);
        if (existing) {
          results.push({ articleId, success: true, cached: true });
          continue;
        }

        // Get API key
        const apiKeySetting = await db.settings.get('claudeApiKey');
        const apiKey = apiKeySetting?.value;

        if (!apiKey) {
          throw new Error('API key not configured');
        }

        // Try to use content, fall back to extracting from URL
        let content = article.content || article.description;

        if (!content || content.length < 100) {
          const extracted = await extractArticleContent(article.link);
          content = extracted.content;
        }

        // Generate summary
        const result = await generateSummary(content, apiKey);

        // Save
        await summaryOperations.save(articleId, result.summary, result.model);
        await db.articles.update(articleId, { summaryStatus: 'completed' });

        results.push({ articleId, success: true });
      } catch (err) {
        results.push({ articleId, success: false, error: err.message });
        await db.articles.update(articleId, { summaryStatus: 'error' });
      }

      setProgress({ current: i + 1, total: articleIds.length });

      // Rate limiting - wait between requests
      if (i < articleIds.length - 1) {
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
