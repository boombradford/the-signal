import { useState, useCallback } from 'react';
import { fetchFeed, getFaviconUrl } from '../utils/rss';
import { useFeeds, useArticles } from './useDatabase';
import { articleOperations } from '../utils/db';

// Tag a single article using the AI API
async function tagArticle(article) {
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

    if (!response.ok) return null;

    const tags = await response.json();
    await articleOperations.updateTags(article.id, tags);
    return tags;
  } catch (err) {
    console.error('Tagging error:', err);
    return null;
  }
}

// Tag new articles in the background (doesn't block sync)
async function tagNewArticlesBackground(feedId) {
  try {
    // Get untagged articles for this feed
    const articles = await articleOperations.getByFeed(feedId, 20);
    const untagged = articles.filter(a => !a.primaryTag);

    if (untagged.length === 0) return;

    // Tag in batches of 3 with small delays to avoid rate limits
    const batchSize = 3;
    for (let i = 0; i < untagged.length; i += batchSize) {
      const batch = untagged.slice(i, i + batchSize);
      await Promise.all(batch.map(a => tagArticle(a)));
      if (i + batchSize < untagged.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  } catch (err) {
    console.error('Background tagging error:', err);
  }
}

// Hook for syncing RSS feeds
export function useFeedSync() {
  const { feeds, addFeed, updateFeed } = useFeeds();
  const { addArticles } = useArticles();
  const [syncing, setSyncing] = useState(false);
  const [syncingFeedId, setSyncingFeedId] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState(null);

  // Sync a single feed (with force refresh to bypass caches)
  const syncFeed = useCallback(async (feedId) => {
    const feed = feeds.find(f => f.id === feedId);
    if (!feed) return;

    setSyncingFeedId(feedId);
    setError(null);

    try {
      // Force refresh to get latest content, bypassing proxy caches
      const result = await fetchFeed(feed.url, true);

      // Prepare articles for database
      const articles = result.items.map(item => ({
        guid: item.guid,
        title: item.title,
        link: item.link,
        description: item.description,
        content: item.content,
        pubDate: item.pubDate,
        author: item.author,
        thumbnail: item.thumbnail
      }));

      // Add new articles (feedId is passed to addArticles)
      const newCount = await addArticles(articles, feedId);

      // Tag new articles in the background (non-blocking)
      if (newCount > 0) {
        tagNewArticlesBackground(feedId);
      }

      // Update feed metadata
      await updateFeed(feed.id, {
        lastUpdated: new Date().toISOString(),
        title: result.feed.title || feed.title,
        link: result.feed.link || feed.link
      });

      return { success: true, newArticles: newCount };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setSyncingFeedId(null);
    }
  }, [feeds, addArticles, updateFeed]);

  // Sync all feeds in parallel with concurrency limit
  const syncAllFeeds = useCallback(async () => {
    setSyncing(true);
    setError(null);

    const CONCURRENCY_LIMIT = 5;
    const results = [];

    // Process feeds in batches
    for (let i = 0; i < feeds.length; i += CONCURRENCY_LIMIT) {
      const batch = feeds.slice(i, i + CONCURRENCY_LIMIT);
      const batchResults = await Promise.all(
        batch.map(async (feed) => {
          const result = await syncFeed(feed.id);
          return { feedId: feed.id, ...result };
        })
      );
      results.push(...batchResults);
    }

    setSyncing(false);
    setLastSync(new Date());

    return results;
  }, [feeds, syncFeed]);

  // Subscribe to a new feed
  const subscribeFeed = useCallback(async (url, categoryId = null) => {
    setError(null);

    try {
      // Fetch and validate the feed
      const result = await fetchFeed(url);

      // Check if already subscribed (use feeds from hook)
      const existing = feeds.find(f => f.url === url);
      if (existing) {
        throw new Error('Already subscribed to this feed');
      }

      // Add the feed
      const feedId = await addFeed({
        url,
        title: result.feed.title || 'Untitled Feed',
        description: result.feed.description,
        link: result.feed.link,
        faviconUrl: getFaviconUrl(result.feed.link || url),
        category: categoryId
      });

      // Add initial articles
      const articles = result.items.map(item => ({
        guid: item.guid,
        title: item.title,
        link: item.link,
        description: item.description,
        content: item.content,
        pubDate: item.pubDate,
        author: item.author,
        thumbnail: item.thumbnail
      }));

      await addArticles(articles, feedId);

      // Tag articles in the background (non-blocking)
      if (articles.length > 0) {
        tagNewArticlesBackground(feedId);
      }

      return {
        success: true,
        feed: { id: feedId, ...result.feed },
        articleCount: articles.length
      };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [feeds, addFeed, addArticles]);

  return {
    syncing,
    syncingFeedId,
    lastSync,
    error,
    syncFeed,
    syncAllFeeds,
    subscribeFeed
  };
}

export default useFeedSync;
