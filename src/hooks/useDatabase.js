import { useCallback, useEffect, useState } from 'react';
import {
  initializeDB,
  feedOperations,
  articleOperations,
  settingsOperations,
  defaultCategories
} from '../utils/db';

// Initialize database hook
export function useInitDatabase() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeDB()
      .then(() => setIsReady(true))
      .catch(setError);
  }, []);

  return { isReady, error };
}

// Feeds hook
export function useFeeds() {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const data = await feedOperations.getAll();
      setFeeds(data);
    } catch (err) {
      console.error('Failed to fetch feeds:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addFeed = useCallback(async (feed) => {
    const id = await feedOperations.add(feed);
    await refetch();
    return id;
  }, [refetch]);

  const updateFeed = useCallback(async (id, updates) => {
    await feedOperations.update(id, updates);
    await refetch();
  }, [refetch]);

  const deleteFeed = useCallback(async (id) => {
    await feedOperations.delete(id);
    await refetch();
  }, [refetch]);

  return {
    feeds,
    loading,
    addFeed,
    updateFeed,
    deleteFeed,
    refetch
  };
}

// Single feed hook
export function useFeed(feedId) {
  const [feed, setFeed] = useState(null);

  useEffect(() => {
    if (!feedId) {
      setFeed(null);
      return;
    }

    feedOperations.getAll().then(feeds => {
      const found = feeds.find(f => f.id === feedId);
      setFeed(found || null);
    });
  }, [feedId]);

  return feed;
}

// Articles hook
export function useArticles(options = {}) {
  const { feedId, filter = 'all', limit = 100 } = options;
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      let data;

      if (filter === 'saved') {
        data = await articleOperations.getSaved();
      } else if (filter === 'unread') {
        data = await articleOperations.getUnread(limit);
      } else if (feedId) {
        data = await articleOperations.getByFeed(feedId, limit);
      } else {
        data = await articleOperations.getAll(limit);
      }

      setArticles(data);
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    } finally {
      setLoading(false);
    }
  }, [feedId, filter, limit]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const markRead = useCallback(async (id) => {
    await articleOperations.markRead(id);
    await refetch();
  }, [refetch]);

  const markAllRead = useCallback(async (fId) => {
    await articleOperations.markAllRead(fId);
    await refetch();
  }, [refetch]);

  const toggleSaved = useCallback(async (id) => {
    await articleOperations.toggleSaved(id);
    await refetch();
  }, [refetch]);

  const addArticles = useCallback(async (newArticles, fId) => {
    const count = await articleOperations.addBulk(newArticles, fId);
    await refetch();
    return count;
  }, [refetch]);

  return {
    articles,
    loading,
    markRead,
    markAllRead,
    toggleSaved,
    addArticles,
    refetch
  };
}

// Single article hook
export function useArticle(articleId) {
  const [article, setArticle] = useState(null);

  useEffect(() => {
    if (!articleId) {
      setArticle(null);
      return;
    }

    articleOperations.getAll().then(articles => {
      const found = articles.find(a => a.id === articleId);
      setArticle(found || null);
    });
  }, [articleId]);

  return article;
}

// Categories hook (using local defaults)
export function useCategories() {
  const [categories] = useState(defaultCategories);

  const addCategory = useCallback(async () => {
    console.warn('Categories are static in Supabase version');
  }, []);

  const updateCategory = useCallback(async () => {
    console.warn('Categories are static in Supabase version');
  }, []);

  const deleteCategory = useCallback(async () => {
    console.warn('Categories are static in Supabase version');
  }, []);

  return {
    categories,
    addCategory,
    updateCategory,
    deleteCategory
  };
}

// Settings hook (using localStorage)
export function useSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const theme = await settingsOperations.get('theme') || 'system';
      setSettings({ theme });
      setLoading(false);
    };

    loadSettings();
  }, []);

  const updateSetting = useCallback(async (key, value) => {
    await settingsOperations.set(key, value);
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const getSetting = useCallback(async (key) => {
    return await settingsOperations.get(key);
  }, []);

  return {
    settings,
    loading,
    updateSetting,
    getSetting
  };
}

// Unread count hook - uses efficient count query
export function useUnreadCount(feedId) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        if (feedId) {
          const unreadCount = await articleOperations.getUnreadCountByFeed(feedId);
          setCount(unreadCount);
        } else {
          const counts = await articleOperations.getCounts();
          setCount(counts.unread);
        }
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    };

    fetchCount();
  }, [feedId]);

  return count;
}

// Total counts hook - uses efficient count queries
export function useCounts() {
  const [counts, setCounts] = useState({ total: 0, unread: 0, saved: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const result = await articleOperations.getCounts();
        setCounts(result);
      } catch (err) {
        console.error('Failed to fetch counts:', err);
      }
    };

    fetchCounts();
  }, []);

  return counts;
}

export default {
  useInitDatabase,
  useFeeds,
  useFeed,
  useArticles,
  useArticle,
  useCategories,
  useSettings,
  useUnreadCount,
  useCounts
};
