import Dexie from 'dexie';

// Create the database
export const db = new Dexie('DigestDB');

// Define schema
db.version(1).stores({
  // Feeds table - RSS feed subscriptions
  feeds: '++id, url, title, category, &link, lastUpdated, faviconUrl, unreadCount',

  // Articles table - cached articles from feeds
  articles: '++id, feedId, guid, title, link, pubDate, isRead, isSaved, summary, summaryStatus',

  // Categories table - user-defined feed categories
  categories: '++id, name, color, order',

  // Settings table - user preferences
  settings: 'key, value',

  // Summaries cache - AI-generated summaries
  summaries: 'articleId, content, model, createdAt'
});

// Default categories
export const defaultCategories = [
  { name: 'News', color: '#FF3B30', order: 0 },
  { name: 'Tech', color: '#007AFF', order: 1 },
  { name: 'Design', color: '#AF52DE', order: 2 },
  { name: 'Business', color: '#34C759', order: 3 },
  { name: 'Personal', color: '#FF9500', order: 4 },
];

// Initialize default data
export async function initializeDB() {
  const categoryCount = await db.categories.count();

  if (categoryCount === 0) {
    await db.categories.bulkAdd(defaultCategories);
  }

  // Set default settings
  const apiKey = await db.settings.get('claudeApiKey');
  if (!apiKey) {
    await db.settings.put({ key: 'claudeApiKey', value: '' });
  }

  const theme = await db.settings.get('theme');
  if (!theme) {
    await db.settings.put({ key: 'theme', value: 'system' });
  }
}

// Feed operations
export const feedOperations = {
  async add(feed) {
    return await db.feeds.add({
      ...feed,
      createdAt: new Date().toISOString(),
      lastUpdated: null,
      unreadCount: 0
    });
  },

  async update(id, updates) {
    return await db.feeds.update(id, updates);
  },

  async delete(id) {
    // Delete feed and its articles
    await db.articles.where('feedId').equals(id).delete();
    return await db.feeds.delete(id);
  },

  async getAll() {
    return await db.feeds.toArray();
  },

  async getByCategory(categoryId) {
    return await db.feeds.where('category').equals(categoryId).toArray();
  }
};

// Article operations
export const articleOperations = {
  async addBulk(articles) {
    // Use bulkPut to handle duplicates (by guid)
    const guids = articles.map(a => a.guid);
    const existing = await db.articles.where('guid').anyOf(guids).toArray();
    const existingGuids = new Set(existing.map(a => a.guid));
    const newArticles = articles.filter(a => !existingGuids.has(a.guid));

    if (newArticles.length > 0) {
      await db.articles.bulkAdd(newArticles);
    }

    return newArticles.length;
  },

  async getByFeed(feedId, limit = 50) {
    const articles = await db.articles
      .where('feedId')
      .equals(feedId)
      .toArray();

    // Sort by pubDate descending and limit
    return articles
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
      .slice(0, limit);
  },

  async getAll(limit = 100) {
    const articles = await db.articles.toArray();

    // Sort by pubDate descending and limit
    return articles
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
      .slice(0, limit);
  },

  async getUnread(limit = 100) {
    const articles = await db.articles
      .filter(article => article.isRead === 0 || article.isRead === false || !article.isRead)
      .toArray();

    // Sort by pubDate descending and limit
    return articles
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
      .slice(0, limit);
  },

  async getSaved() {
    const articles = await db.articles
      .filter(article => article.isSaved === 1 || article.isSaved === true)
      .toArray();

    return articles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  },

  async markRead(id) {
    return await db.articles.update(id, { isRead: 1 });
  },

  async markAllRead(feedId) {
    return await db.articles
      .where('feedId')
      .equals(feedId)
      .modify({ isRead: 1 });
  },

  async toggleSaved(id) {
    const article = await db.articles.get(id);
    return await db.articles.update(id, { isSaved: article.isSaved ? 0 : 1 });
  }
};

// Summary operations
export const summaryOperations = {
  async save(articleId, content, model = 'claude-3-haiku') {
    return await db.summaries.put({
      articleId,
      content,
      model,
      createdAt: new Date().toISOString()
    });
  },

  async get(articleId) {
    return await db.summaries.get(articleId);
  }
};

// Settings operations
export const settingsOperations = {
  async get(key) {
    const setting = await db.settings.get(key);
    return setting?.value;
  },

  async set(key, value) {
    return await db.settings.put({ key, value });
  }
};

export default db;
