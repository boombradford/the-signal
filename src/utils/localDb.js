import Dexie from 'dexie';

export const localDb = new Dexie('KevinLocalDB');

localDb.version(1).stores({
  highlights: '++id, articleId, createdAt',
  // Potential future local stores
  readProgress: 'articleId, lastPosition, completed',
});

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
