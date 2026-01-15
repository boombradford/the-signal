import { useMemo } from 'react';

export function useSmartFeed(articles) {
  return useMemo(() => {
    if (!articles || articles.length === 0) return [];

    // 1. Build User Profile based on history
    const tagScores = {};
    let hasHistory = false;

    articles.forEach(article => {
      if (article.isRead || article.isSaved) {
        hasHistory = true;
        const weight = article.isSaved ? 5 : 1; // Higher weight for saved items
        
        if (article.primaryTag) {
          tagScores[article.primaryTag] = (tagScores[article.primaryTag] || 0) + weight;
        }
        
        // Secondary tags could be handled here if they existed
      }
    });

    // If no interaction history, we can't recommend much
    if (!hasHistory) return [];

    // 2. Score Unread Articles
    const unreadArticles = articles.filter(a => !a.isRead);

    const scoredArticles = unreadArticles.map(article => {
      let score = 0;
      if (article.primaryTag) {
        score += (tagScores[article.primaryTag] || 0);
      }
      return { ...article, score };
    });

    // 3. Filter and Sort
    // We only show articles that match at least one interest (score > 0)
    return scoredArticles
      .filter(a => a.score > 0)
      .sort((a, b) => {
        // Primary sort: Score (Desc)
        if (b.score !== a.score) return b.score - a.score;
        // Secondary sort: Date (Desc) - newer is better
        return new Date(b.pubDate) - new Date(a.pubDate);
      });

  }, [articles]);
}
