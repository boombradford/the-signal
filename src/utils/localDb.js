import Dexie from 'dexie';

export const localDb = new Dexie('KevinLocalDB');

// Version 1: Initial schema with highlights and readProgress
localDb.version(1).stores({
  highlights: '++id, articleId, createdAt',
  readProgress: 'articleId, lastPosition, completed',
});

// Version 2: Add feeds, articles, summaries, settings
localDb.version(2).stores({
  feeds: '++id, url, createdAt, category',
  articles: '++id, feedId, guid, pubDate, isRead, isSaved, primaryTag',
  summaries: '[articleId+style], articleId, style',
  highlights: '++id, articleId, createdAt',
  readProgress: 'articleId, lastPosition, completed',
  settings: 'key'
});

// Default categories (stored locally, not in database)
export const defaultCategories = [
  { id: 1, name: 'News', color: '#FF3B30', order: 0 },
  { id: 2, name: 'Tech', color: '#007AFF', order: 1 },
  { id: 3, name: 'Design', color: '#AF52DE', order: 2 },
  { id: 4, name: 'Business', color: '#34C759', order: 3 },
  { id: 5, name: 'Personal', color: '#FF9500', order: 4 },
];

// Initialize database
export async function initializeDB() {
  await localDb.open();
  return true;
}

// Feed operations
export const feedOperations = {
  async add(feed) {
    const id = await localDb.feeds.add({
      url: feed.url,
      title: feed.title,
      description: feed.description,
      link: feed.link,
      faviconUrl: feed.faviconUrl,
      category: feed.category,
      createdAt: new Date().toISOString(),
      lastUpdated: null
    });
    return id;
  },

  async update(id, updates) {
    const updateData = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.link !== undefined) updateData.link = updates.link;
    if (updates.faviconUrl !== undefined) updateData.faviconUrl = updates.faviconUrl;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.lastUpdated !== undefined) updateData.lastUpdated = updates.lastUpdated;

    await localDb.feeds.update(id, updateData);
    return true;
  },

  async delete(id) {
    // Delete articles associated with this feed
    await localDb.articles.where('feedId').equals(id).delete();
    await localDb.feeds.delete(id);
    return true;
  },

  async getAll() {
    const feeds = await localDb.feeds.orderBy('createdAt').reverse().toArray();
    return feeds.map(feed => ({
      id: feed.id,
      url: feed.url,
      title: feed.title,
      description: feed.description,
      link: feed.link,
      faviconUrl: feed.faviconUrl,
      category: feed.category,
      createdAt: feed.createdAt,
      lastUpdated: feed.lastUpdated
    }));
  },

  async getByCategory(categoryId) {
    const feeds = await localDb.feeds
      .where('category')
      .equals(categoryId)
      .reverse()
      .sortBy('createdAt');
    
    return feeds.map(feed => ({
      id: feed.id,
      url: feed.url,
      title: feed.title,
      description: feed.description,
      link: feed.link,
      faviconUrl: feed.faviconUrl,
      category: feed.category,
      createdAt: feed.createdAt,
      lastUpdated: feed.lastUpdated
    }));
  }
};

// Article operations
export const articleOperations = {
  async addBulk(articles, feedId) {
    // Get existing GUIDs for this feed
    const existing = await localDb.articles.where('feedId').equals(feedId).toArray();
    const existingGuids = new Set(existing.map(a => a.guid));
    const newArticles = articles.filter(a => !existingGuids.has(a.guid));

    if (newArticles.length === 0) return 0;

    await localDb.articles.bulkAdd(
      newArticles.map(article => ({
        feedId: feedId,
        guid: article.guid,
        title: article.title,
        link: article.link,
        description: article.description,
        content: article.content,
        pubDate: article.pubDate,
        author: article.author,
        thumbnail: article.thumbnail,
        isRead: false,
        isSaved: false,
        createdAt: new Date().toISOString()
      }))
    );

    return newArticles.length;
  },

  async getByFeed(feedId, limit = 50) {
    const articles = await localDb.articles
      .where('feedId')
      .equals(feedId)
      .reverse()
      .sortBy('pubDate');
    
    return articles.slice(0, limit).map(mapArticle);
  },

  async getAll(limit = 100) {
    const articles = await localDb.articles
      .orderBy('pubDate')
      .reverse()
      .limit(limit)
      .toArray();
    
    return articles.map(mapArticle);
  },

  async getUnread(limit = 100) {
    const articles = await localDb.articles
      .where('isRead')
      .equals(false)
      .reverse()
      .sortBy('pubDate');
    
    return articles.slice(0, limit).map(mapArticle);
  },

  async getSaved() {
    const articles = await localDb.articles
      .where('isSaved')
      .equals(true)
      .reverse()
      .sortBy('pubDate');
    
    return articles.map(mapArticle);
  },

  async markRead(id) {
    await localDb.articles.update(id, { isRead: true });
    return true;
  },

  async markAllRead(feedId) {
    // Use bulk modify for better performance
    await localDb.articles.where('feedId').equals(feedId).modify({ isRead: true });
    return true;
  },

  async toggleSaved(id) {
    const article = await localDb.articles.get(id);
    if (article) {
      await localDb.articles.update(id, { isSaved: !article.isSaved });
    }
    return true;
  },

  async updateTags(id, tags) {
    await localDb.articles.update(id, {
      primaryTag: tags.primaryTag,
      secondaryTags: tags.secondaryTags,
      sentiment: tags.sentiment,
      keyTopics: tags.keyTopics
    });
    return true;
  },

  async getByTag(tag, limit = 100) {
    const articles = await localDb.articles
      .where('primaryTag')
      .equals(tag)
      .reverse()
      .sortBy('pubDate');
    
    return articles.slice(0, limit).map(mapArticle);
  },

  async getUntagged(limit = 50) {
    const articles = await localDb.articles
      .filter(a => !a.primaryTag)
      .reverse()
      .sortBy('pubDate');
    
    return articles.slice(0, limit).map(mapArticle);
  },

  async saveClip(article) {
    const guid = `clip_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const id = await localDb.articles.add({
      feedId: null,
      guid,
      title: article.title || 'Untitled',
      link: article.url,
      description: article.description?.slice(0, 500) || '',
      content: article.content?.slice(0, 50000) || '',
      pubDate: article.publishedDate || new Date().toISOString(),
      author: article.author || article.siteName || '',
      thumbnail: article.thumbnail || null,
      isRead: false,
      isSaved: true,
      createdAt: new Date().toISOString(),
      primaryTag: article.category || null
    });

    const savedArticle = await localDb.articles.get(id);
    return {
      ...mapArticle(savedArticle),
      siteName: article.siteName,
      keyPoints: article.keyPoints || [],
      isClip: true
    };
  },

  async getClips() {
    const articles = await localDb.articles
      .filter(a => a.feedId === null)
      .reverse()
      .sortBy('createdAt');
    
    return articles.map(mapArticle);
  }
};

// Map database article to app format
function mapArticle(article) {
  return {
    id: article.id,
    feedId: article.feedId,
    guid: article.guid,
    title: article.title,
    link: article.link,
    description: article.description,
    content: article.content,
    pubDate: article.pubDate,
    author: article.author,
    thumbnail: article.thumbnail,
    isRead: article.isRead,
    isSaved: article.isSaved,
    createdAt: article.createdAt,
    primaryTag: article.primaryTag || null,
    secondaryTags: article.secondaryTags || [],
    sentiment: article.sentiment || null,
    keyTopics: article.keyTopics || []
  };
}

// Summary operations
export const summaryOperations = {
  async save(articleId, content, style = 'concise', model = 'claude-3-haiku') {
    await localDb.summaries.put({
      articleId,
      style,
      content,
      model,
      createdAt: new Date().toISOString()
    });
    return true;
  },

  async get(articleId, style = 'concise') {
    // Use compound key to retrieve by both articleId and style
    const summary = await localDb.summaries.get([articleId, style]);
    return summary || null;
  }
};

// Settings operations
export const settingsOperations = {
  async get(key, defaultValue = null) {
    const setting = await localDb.settings.get(key);
    return setting ? setting.value : defaultValue;
  },

  async set(key, value) {
    await localDb.settings.put({ key, value });
    return true;
  },

  async getAll() {
    const settings = await localDb.settings.toArray();
    const result = {};
    settings.forEach(setting => {
      result[setting.key] = setting.value;
    });
    
    // Return defaults if no settings exist
    return {
      viewDensity: result.viewDensity || 'comfortable',
      theme: result.theme || 'dark',
      ...result
    };
  }
};

export const highlightOperations = {
  async add(articleId, text, note = '') {
    return await localDb.highlights.add({
      articleId,
      text,
      note,
      createdAt: new Date().toISOString()
    });
  },

  async getByArticle(articleId) {
    return await localDb.highlights
      .where('articleId')
      .equals(articleId)
      .reverse()
      .sortBy('createdAt');
  },

  async delete(id) {
    return await localDb.highlights.delete(id);
  }
};
