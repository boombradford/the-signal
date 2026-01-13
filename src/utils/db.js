import { supabase, getUserId, initAuth } from './supabase';

// Default categories (stored locally, not in Supabase)
export const defaultCategories = [
  { id: 1, name: 'News', color: '#FF3B30', order: 0 },
  { id: 2, name: 'Tech', color: '#007AFF', order: 1 },
  { id: 3, name: 'Design', color: '#AF52DE', order: 2 },
  { id: 4, name: 'Business', color: '#34C759', order: 3 },
  { id: 5, name: 'Personal', color: '#FF9500', order: 4 },
];

// Initialize database (auth session)
export async function initializeDB() {
  return await initAuth();
}

// Feed operations
export const feedOperations = {
  async add(feed) {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('feeds')
      .insert({
        user_id: userId,
        url: feed.url,
        title: feed.title,
        description: feed.description,
        link: feed.link,
        favicon_url: feed.faviconUrl,
        category: feed.category,
        created_at: new Date().toISOString(),
        last_updated: null
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  },

  async update(id, updates) {
    const updateData = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.link !== undefined) updateData.link = updates.link;
    if (updates.faviconUrl !== undefined) updateData.favicon_url = updates.faviconUrl;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.lastUpdated !== undefined) updateData.last_updated = updates.lastUpdated;

    const { error } = await supabase
      .from('feeds')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async delete(id) {
    // Articles are deleted automatically via CASCADE
    const { error } = await supabase
      .from('feeds')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async getAll() {
    const userId = await getUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('feeds')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map to expected format
    return (data || []).map(feed => ({
      id: feed.id,
      url: feed.url,
      title: feed.title,
      description: feed.description,
      link: feed.link,
      faviconUrl: feed.favicon_url,
      category: feed.category,
      createdAt: feed.created_at,
      lastUpdated: feed.last_updated
    }));
  },

  async getByCategory(categoryId) {
    const userId = await getUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('feeds')
      .select('*')
      .eq('user_id', userId)
      .eq('category', categoryId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(feed => ({
      id: feed.id,
      url: feed.url,
      title: feed.title,
      description: feed.description,
      link: feed.link,
      faviconUrl: feed.favicon_url,
      category: feed.category,
      createdAt: feed.created_at,
      lastUpdated: feed.last_updated
    }));
  }
};

// Article operations
export const articleOperations = {
  async addBulk(articles, feedId) {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');

    // Get existing GUIDs for this feed
    const { data: existing } = await supabase
      .from('articles')
      .select('guid')
      .eq('feed_id', feedId);

    const existingGuids = new Set((existing || []).map(a => a.guid));
    const newArticles = articles.filter(a => !existingGuids.has(a.guid));

    if (newArticles.length === 0) return 0;

    const insertData = newArticles.map(article => ({
      feed_id: feedId,
      user_id: userId,
      guid: article.guid,
      title: article.title,
      link: article.link,
      description: article.description,
      content: article.content,
      pub_date: article.pubDate,
      author: article.author,
      thumbnail: article.thumbnail,
      is_read: false,
      is_saved: false,
      created_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('articles')
      .insert(insertData);

    if (error) throw error;
    return newArticles.length;
  },

  async getByFeed(feedId, limit = 50) {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('feed_id', feedId)
      .order('pub_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(mapArticle);
  },

  async getAll(limit = 100) {
    const userId = await getUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('user_id', userId)
      .order('pub_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(mapArticle);
  },

  async getUnread(limit = 100) {
    const userId = await getUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('pub_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(mapArticle);
  },

  async getSaved() {
    const userId = await getUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_saved', true)
      .order('pub_date', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapArticle);
  },

  async markRead(id) {
    const { error } = await supabase
      .from('articles')
      .update({ is_read: true })
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async markAllRead(feedId) {
    const { error } = await supabase
      .from('articles')
      .update({ is_read: true })
      .eq('feed_id', feedId);

    if (error) throw error;
    return true;
  },

  async toggleSaved(id) {
    // Get current state
    const { data: article } = await supabase
      .from('articles')
      .select('is_saved')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('articles')
      .update({ is_saved: !article?.is_saved })
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Efficient count queries using Supabase count feature
  async getCounts() {
    const userId = await getUserId();
    if (!userId) return { total: 0, unread: 0, saved: 0 };

    // Run count queries in parallel
    const [totalResult, unreadResult, savedResult] = await Promise.all([
      supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false),
      supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_saved', true)
    ]);

    return {
      total: totalResult.count || 0,
      unread: unreadResult.count || 0,
      saved: savedResult.count || 0
    };
  },

  async getUnreadCountByFeed(feedId) {
    const { count, error } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('feed_id', feedId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  }
};

// Map database article to app format
function mapArticle(article) {
  return {
    id: article.id,
    feedId: article.feed_id,
    guid: article.guid,
    title: article.title,
    link: article.link,
    description: article.description,
    content: article.content,
    pubDate: article.pub_date,
    author: article.author,
    thumbnail: article.thumbnail,
    isRead: article.is_read,
    isSaved: article.is_saved,
    createdAt: article.created_at
  };
}

// Summary operations
export const summaryOperations = {
  async save(articleId, content, style = 'concise', model = 'claude-3-haiku') {
    const { error } = await supabase
      .from('summaries')
      .upsert({
        article_id: articleId,
        content,
        style,
        model,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'article_id,style'
      });

    if (error) throw error;
    return true;
  },

  async get(articleId, style = 'concise') {
    const { data, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('article_id', articleId)
      .eq('style', style)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data ? { content: data.content, model: data.model } : null;
  }
};

// Settings operations (using localStorage for now, can migrate to Supabase later)
export const settingsOperations = {
  async get(key) {
    return localStorage.getItem(`vessl_${key}`);
  },

  async set(key, value) {
    localStorage.setItem(`vessl_${key}`, value);
    return true;
  }
};

// Compatibility export
export const db = {
  feeds: feedOperations,
  articles: articleOperations,
  summaries: summaryOperations,
  settings: settingsOperations
};

export default db;
