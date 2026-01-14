/**
 * Feed Suggestions API
 * 
 * Intelligent feed recommendations based on reading patterns.
 * Uses Claude for personalized suggestions.
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

// Curated feed database organized by category
const FEED_DATABASE = {
  technology: [
    { url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', name: 'Ars Technica', description: 'Deep technology analysis and reviews' },
    { url: 'https://www.wired.com/feed/rss', name: 'Wired', description: 'Technology, science, and culture' },
    { url: 'https://feeds.feedburner.com/TechCrunch/', name: 'TechCrunch', description: 'Startup and venture capital news' },
    { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge', description: 'Technology and consumer electronics' },
    { url: 'https://hnrss.org/frontpage', name: 'Hacker News', description: 'Community-curated technology discussion' },
    { url: 'https://www.techmeme.com/feed.xml', name: 'Techmeme', description: 'Curated technology headlines' },
    { url: 'https://blog.google/rss/', name: 'Google Blog', description: 'Official announcements from Google' },
    { url: 'https://engineering.fb.com/feed/', name: 'Meta Engineering', description: 'Technical insights from Meta' },
    { url: 'https://netflixtechblog.com/feed', name: 'Netflix Tech Blog', description: 'Engineering at scale' },
  ],
  artificial_intelligence: [
    { url: 'https://www.anthropic.com/rss.xml', name: 'Anthropic', description: 'AI safety research and insights' },
    { url: 'https://openai.com/blog/rss/', name: 'OpenAI', description: 'AI research and applications' },
    { url: 'https://deepmind.google/blog/rss.xml', name: 'DeepMind', description: 'Cutting-edge AI research' },
    { url: 'https://www.marktechpost.com/feed/', name: 'MarkTechPost', description: 'AI and machine learning news' },
    { url: 'https://jack-clark.net/feed/', name: 'Import AI', description: 'Weekly AI analysis by Jack Clark' },
    { url: 'https://thegradient.pub/rss/', name: 'The Gradient', description: 'Perspectives on AI research' },
    { url: 'https://huggingface.co/blog/feed.xml', name: 'Hugging Face', description: 'Open-source ML community' },
  ],
  finance: [
    { url: 'https://feeds.bloomberg.com/markets/news.rss', name: 'Bloomberg Markets', description: 'Global financial markets' },
    { url: 'https://www.ft.com/rss/home', name: 'Financial Times', description: 'International business news' },
    { url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories', name: 'MarketWatch', description: 'Market analysis and data' },
    { url: 'https://seekingalpha.com/feed.xml', name: 'Seeking Alpha', description: 'Investment research and analysis' },
    { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', name: 'CoinDesk', description: 'Digital asset news' },
  ],
  science: [
    { url: 'https://www.nature.com/nature.rss', name: 'Nature', description: 'Premier scientific research' },
    { url: 'https://www.sciencedaily.com/rss/all.xml', name: 'Science Daily', description: 'Breaking science news' },
    { url: 'https://www.quantamagazine.org/feed/', name: 'Quanta Magazine', description: 'Mathematics, physics, and biology' },
    { url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss', name: 'NASA', description: 'Space exploration and research' },
    { url: 'https://phys.org/rss-feed/', name: 'Phys.org', description: 'Physics and technology news' },
  ],
  world: [
    { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC World', description: 'International news coverage' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', name: 'New York Times World', description: 'Global perspectives' },
    { url: 'https://www.theguardian.com/world/rss', name: 'The Guardian World', description: 'International journalism' },
    { url: 'https://feeds.reuters.com/Reuters/worldNews', name: 'Reuters', description: 'Breaking world news' },
  ],
  culture: [
    { url: 'https://www.newyorker.com/feed/culture', name: 'The New Yorker', description: 'Arts, culture, and criticism' },
    { url: 'https://pitchfork.com/feed/feed-news/rss', name: 'Pitchfork', description: 'Music news and reviews' },
    { url: 'https://www.polygon.com/rss/index.xml', name: 'Polygon', description: 'Gaming and entertainment' },
    { url: 'https://www.vulture.com/rss/index.xml', name: 'Vulture', description: 'Entertainment and pop culture' },
  ],
  newsletters: [
    { url: 'https://www.platformer.news/rss/', name: 'Platformer', description: 'Technology and democracy' },
    { url: 'https://stratechery.com/feed/', name: 'Stratechery', description: 'Technology strategy analysis' },
    { url: 'https://www.ben-evans.com/benedictevans/rss.xml', name: 'Benedict Evans', description: 'Technology industry analysis' },
    { url: 'https://danco.substack.com/feed', name: 'Dancoland', description: 'Technology and culture' },
    { url: 'https://www.notboring.co/feed', name: 'Not Boring', description: 'Startups and strategy' },
  ]
};

// Analyze reading patterns from article history
function analyzeReadingPatterns(articles) {
  const patterns = {
    categories: {},
    sources: {},
    topics: [],
    engagementRate: 0
  };

  articles.forEach(article => {
    const category = article.primaryTag || article.category || 'technology';
    patterns.categories[category] = (patterns.categories[category] || 0) + 1;

    const source = article.feedTitle || article.siteName || 'Unknown';
    patterns.sources[source] = (patterns.sources[source] || 0) + 1;

    if (article.keyTopics) {
      patterns.topics.push(...article.keyTopics);
    }

    if (article.isSaved || article.summary) {
      patterns.engagementRate++;
    }
  });

  patterns.engagementRate = articles.length > 0
    ? Math.round((patterns.engagementRate / articles.length) * 100)
    : 0;

  return patterns;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      currentFeeds = [],
      readHistory = [],
      savedArticles = [],
      mode = 'both'
    } = req.body;

    const currentFeedUrls = currentFeeds.map(f => f.url?.toLowerCase() || '');
    const suggestions = [];

    const allArticles = [...readHistory, ...savedArticles];
    const patterns = analyzeReadingPatterns(allArticles);

    const topCategories = Object.entries(patterns.categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat.toLowerCase().replace(/\s+/g, '_'));

    // Personalized suggestions based on reading patterns
    if (mode === 'personalized' || mode === 'both') {
      for (const category of topCategories) {
        const categoryFeeds = FEED_DATABASE[category] || FEED_DATABASE.technology || [];
        const newFeeds = categoryFeeds.filter(
          feed => !currentFeedUrls.includes(feed.url.toLowerCase())
        );

        newFeeds.slice(0, 2).forEach(feed => {
          suggestions.push({
            ...feed,
            category,
            reason: `Based on your interest in ${category.replace(/_/g, ' ')}`,
            type: 'personalized',
            score: patterns.categories[category] || 1
          });
        });
      }

      // AI-powered suggestions for users with reading history
      if (allArticles.length >= 5) {
        const recentTitles = allArticles
          .slice(-20)
          .map(a => a.title)
          .join('\n');

        try {
          const aiResponse = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 500,
            messages: [{
              role: 'user',
              content: `Based on these article titles, suggest 2 RSS feed categories they might enjoy. Be specific about why.

Recent reads:
${recentTitles}

Return JSON array: [{"category": "string", "reason": "string"}]`
            }]
          });

          const aiSuggestions = JSON.parse(
            aiResponse.content[0].text.match(/\[[\s\S]*\]/)?.[0] || '[]'
          );

          aiSuggestions.forEach(suggestion => {
            const categoryKey = suggestion.category.toLowerCase().replace(/\s+/g, '_');
            const matchingFeeds = FEED_DATABASE[categoryKey] || FEED_DATABASE.technology;
            const newFeed = matchingFeeds?.find(
              f => !currentFeedUrls.includes(f.url.toLowerCase())
            );

            if (newFeed) {
              suggestions.push({
                ...newFeed,
                category: suggestion.category,
                reason: suggestion.reason,
                type: 'recommended',
                score: 10
              });
            }
          });
        } catch (e) {
          console.error('AI suggestion error:', e);
        }
      }
    }

    // Discovery suggestions for exploring new categories
    if (mode === 'discovery' || mode === 'both') {
      const allFeeds = Object.values(FEED_DATABASE).flat();
      const popularFeeds = allFeeds
        .filter(feed => !currentFeedUrls.includes(feed.url.toLowerCase()))
        .slice(0, 5);

      popularFeeds.forEach(feed => {
        const category = Object.entries(FEED_DATABASE)
          .find(([, feeds]) => feeds.includes(feed))?.[0] || 'technology';

        suggestions.push({
          ...feed,
          category,
          reason: 'Popular source',
          type: 'discovery',
          score: 5
        });
      });

      // Suggest unexplored categories
      const userCategories = Object.keys(patterns.categories).map(c => c.toLowerCase().replace(/\s+/g, '_'));
      const unexploredCategories = Object.keys(FEED_DATABASE)
        .filter(cat => !userCategories.includes(cat));

      unexploredCategories.slice(0, 2).forEach(category => {
        const feeds = FEED_DATABASE[category];
        const topFeed = feeds?.find(
          f => !currentFeedUrls.includes(f.url.toLowerCase())
        );

        if (topFeed) {
          suggestions.push({
            ...topFeed,
            category,
            reason: `Explore ${category.replace(/_/g, ' ')}`,
            type: 'explore',
            score: 3
          });
        }
      });
    }

    // Deduplicate and sort by score
    const uniqueSuggestions = suggestions
      .filter((s, i, arr) => arr.findIndex(x => x.url === s.url) === i)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);

    return res.status(200).json({
      suggestions: uniqueSuggestions,
      patterns: {
        topCategories,
        articleCount: allArticles.length,
        engagementRate: patterns.engagementRate
      }
    });

  } catch (error) {
    console.error('Suggestions error:', error);
    return res.status(500).json({ error: 'Failed to generate suggestions' });
  }
}
