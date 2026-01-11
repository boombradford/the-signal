import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useEffect, useState } from 'react';
import db, {
  initializeDB,
  feedOperations,
  articleOperations,
  settingsOperations
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
  const feeds = useLiveQuery(() => db.feeds.toArray()) || [];

  const addFeed = useCallback(async (feed) => {
    return await feedOperations.add(feed);
  }, []);

  const updateFeed = useCallback(async (id, updates) => {
    return await feedOperations.update(id, updates);
  }, []);

  const deleteFeed = useCallback(async (id) => {
    return await feedOperations.delete(id);
  }, []);

  return {
    feeds,
    addFeed,
    updateFeed,
    deleteFeed
  };
}

// Single feed hook
export function useFeed(feedId) {
  const feed = useLiveQuery(
    () => feedId ? db.feeds.get(feedId) : null,
    [feedId]
  );

  return feed;
}

// Articles hook
export function useArticles(options = {}) {
  const { feedId, filter = 'all', limit = 100 } = options;

  const articles = useLiveQuery(() => {
    if (filter === 'saved') {
      return articleOperations.getSaved();
    }

    if (filter === 'unread') {
      return articleOperations.getUnread(limit);
    }

    if (feedId) {
      return articleOperations.getByFeed(feedId, limit);
    }

    return articleOperations.getAll(limit);
  }, [feedId, filter, limit]) || [];

  const markRead = useCallback(async (id) => {
    return await articleOperations.markRead(id);
  }, []);

  const markAllRead = useCallback(async (fId) => {
    return await articleOperations.markAllRead(fId);
  }, []);

  const toggleSaved = useCallback(async (id) => {
    return await articleOperations.toggleSaved(id);
  }, []);

  const addArticles = useCallback(async (newArticles) => {
    return await articleOperations.addBulk(newArticles);
  }, []);

  return {
    articles,
    markRead,
    markAllRead,
    toggleSaved,
    addArticles
  };
}

// Single article hook
export function useArticle(articleId) {
  const article = useLiveQuery(
    () => articleId ? db.articles.get(articleId) : null,
    [articleId]
  );

  return article;
}

// Categories hook
export function useCategories() {
  const categories = useLiveQuery(
    () => db.categories.orderBy('order').toArray()
  ) || [];

  const addCategory = useCallback(async (category) => {
    const maxOrder = categories.length > 0
      ? Math.max(...categories.map(c => c.order))
      : -1;

    return await db.categories.add({
      ...category,
      order: maxOrder + 1
    });
  }, [categories]);

  const updateCategory = useCallback(async (id, updates) => {
    return await db.categories.update(id, updates);
  }, []);

  const deleteCategory = useCallback(async (id) => {
    // Move feeds in this category to uncategorized
    await db.feeds.where('category').equals(id).modify({ category: null });
    return await db.categories.delete(id);
  }, []);

  return {
    categories,
    addCategory,
    updateCategory,
    deleteCategory
  };
}

// Settings hook
export function useSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const allSettings = await db.settings.toArray();
      const settingsObj = {};
      allSettings.forEach(s => {
        settingsObj[s.key] = s.value;
      });
      setSettings(settingsObj);
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

// Unread count hook
export function useUnreadCount(feedId) {
  const count = useLiveQuery(async () => {
    if (feedId) {
      return await db.articles
        .where('feedId')
        .equals(feedId)
        .and(article => article.isRead === 0 || article.isRead === false)
        .count();
    }

    return await db.articles
      .filter(article => article.isRead === 0 || article.isRead === false)
      .count();
  }, [feedId]);

  return count || 0;
}

// Total counts hook
export function useCounts() {
  const total = useLiveQuery(() => db.articles.count()) || 0;
  const unread = useLiveQuery(() =>
    db.articles.filter(a => !a.isRead).count()
  ) || 0;
  const saved = useLiveQuery(() =>
    db.articles.filter(a => a.isSaved).count()
  ) || 0;

  return { total, unread, saved };
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
