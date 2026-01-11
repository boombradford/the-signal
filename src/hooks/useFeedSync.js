import { useState, useCallback } from 'react';
import { fetchFeed, getFaviconUrl } from '../utils/rss';
import { useFeeds, useArticles } from './useDatabase';
import db from '../utils/db';

// Hook for syncing RSS feeds
export function useFeedSync() {
  const { feeds, addFeed, updateFeed } = useFeeds();
  const { addArticles } = useArticles();
  const [syncing, setSyncing] = useState(false);
  const [syncingFeedId, setSyncingFeedId] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState(null);

  // Sync a single feed
  const syncFeed = useCallback(async (feedId) => {
    const feed = feeds.find(f => f.id === feedId);
    if (!feed) return;

    setSyncingFeedId(feedId);
    setError(null);

    try {
      const result = await fetchFeed(feed.url);

      // Prepare articles for database
      const articles = result.items.map(item => ({
        feedId: feed.id,
        guid: item.guid,
        title: item.title,
        link: item.link,
        description: item.description,
        content: item.content,
        pubDate: item.pubDate,
        author: item.author,
        thumbnail: item.thumbnail,
        isRead: 0,
        isSaved: 0,
        summaryStatus: 'none'
      }));

      // Add new articles
      const newCount = await addArticles(articles);

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

      // Check if already subscribed
      const existing = await db.feeds.where('url').equals(url).first();
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
        category: categoryId,
        unreadCount: result.items.length
      });

      // Add initial articles
      const articles = result.items.map(item => ({
        feedId,
        guid: item.guid,
        title: item.title,
        link: item.link,
        description: item.description,
        content: item.content,
        pubDate: item.pubDate,
        author: item.author,
        thumbnail: item.thumbnail,
        isRead: 0,
        isSaved: 0,
        summaryStatus: 'none'
      }));

      await addArticles(articles);

      return {
        success: true,
        feed: { id: feedId, ...result.feed },
        articleCount: articles.length
      };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [addFeed, addArticles]);

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
