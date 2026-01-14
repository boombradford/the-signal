/**
 * News Source Suggestions API
 *
 * Provides personalized feed recommendations based on:
 * 1. User's reading habits (what they read/save)
 * 2. Trending/popular sources they don't have
 * 3. Category-based discovery
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

// Curated feed database - expand as needed
const FEED_DATABASE = {
  tech: [
    { url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', name: 'Ars Technica', description: 'Deep tech analysis and reviews' },
    { url: 'https://www.wired.com/feed/rss', name: 'Wired', description: 'Tech, science, and culture' },
    { url: 'https://feeds.feedburner.com/TechCrunch/', name: 'TechCrunch', description: 'Startup and tech news' },
    { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge', description: 'Tech, science, art, and culture' },
    { url: 'https://hnrss.org/frontpage', name: 'Hacker News', description: 'Tech community discussions' },
    { url: 'https://www.techmeme.com/feed.xml', name: 'Techmeme', description: 'Curated tech news headlines' },
    { url: 'https://blog.google/rss/', name: 'Google Blog', description: 'Official Google announcements' },
    { url: 'https://engineering.fb.com/feed/', name: 'Meta Engineering', description: 'Meta technical blog' },
    { url: 'https://netflixtechblog.com/feed', name: 'Netflix Tech Blog', description: 'Netflix engineering insights' },
    { url: 'https://aws.amazon.com/blogs/aws/feed/', name: 'AWS Blog', description: 'Amazon Web Services updates' },
  ],
  ai: [
    { url: 'https://www.anthropic.com/rss.xml', name: 'Anthropic', description: 'AI safety and research' },
    { url: 'https://openai.com/blog/rss/', name: 'OpenAI Blog', description: 'OpenAI research and updates' },
    { url: 'https://deepmind.google/blog/rss.xml', name: 'DeepMind', description: 'AI research from Google DeepMind' },
    { url: 'https://www.marktechpost.com/feed/', name: 'MarkTechPost', description: 'AI/ML news and papers' },
    { url: 'https://jack-clark.net/feed/', name: 'Import AI', description: 'Weekly AI newsletter by Jack Clark' },
    { url: 'https://www.aiweirdness.com/rss/', name: 'AI Weirdness', description: 'Fun AI experiments and observations' },
    { url: 'https://thegradient.pub/rss/', name: 'The Gradient', description: 'AI research perspectives' },
    { url: 'https://huggingface.co/blog/feed.xml', name: 'Hugging Face', description: 'ML community and tools' },
  ],
  finance: [
    { url: 'https://feeds.bloomberg.com/markets/news.rss', name: 'Bloomberg Markets', description: 'Financial market news' },
    { url: 'https://www.ft.com/rss/home', name: 'Financial Times', description: 'Global business and finance' },
    { url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories', name: 'MarketWatch', description: 'Market news and analysis' },
    { url: 'https://seekingalpha.com/feed.xml', name: 'Seeking Alpha', description: 'Investment research' },
    { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', name: 'CoinDesk', description: 'Cryptocurrency news' },
    { url: 'https://www.investopedia.com/feedbuilder/feed/getfeed?feedName=rss_articles', name: 'Investopedia', description: 'Financial education' },
  ],
  science: [
    { url: 'https://www.nature.com/nature.rss', name: 'Nature', description: 'Scientific research journal' },
    { url: 'https://www.sciencedaily.com/rss/all.xml', name: 'Science Daily', description: 'Latest science news' },
    { url: 'https://www.quantamagazine.org/feed/', name: 'Quanta Magazine', description: 'Math, physics, biology' },
    { url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss', name: 'NASA', description: 'Space and science news' },
    { url: 'https://phys.org/rss-feed/', name: 'Phys.org', description: 'Physics, tech, and science' },
    { url: 'https://www.newscientist.com/feed/home/', name: 'New Scientist', description: 'Science and technology' },
  ],
  world: [
    { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC World', description: 'Global news coverage' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', name: 'NYT World', description: 'International news' },
    { url: 'https://www.theguardian.com/world/rss', name: 'The Guardian World', description: 'Global perspectives' },
    { url: 'https://feeds.reuters.com/Reuters/worldNews', name: 'Reuters', description: 'Breaking world news' },
    { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera', description: 'Middle East and global' },
  ],
  culture: [
    { url: 'https://www.newyorker.com/feed/culture', name: 'New Yorker Culture', description: 'Arts and culture' },
    { url: 'https://pitchfork.com/feed/feed-news/rss', name: 'Pitchfork', description: 'Music news and reviews' },
    { url: 'https://www.polygon.com/rss/index.xml', name: 'Polygon', description: 'Gaming and entertainment' },
    { url: 'https://kotaku.com/rss', name: 'Kotaku', description: 'Gaming culture' },
    { url: 'https://www.vulture.com/rss/index.xml', name: 'Vulture', description: 'Entertainment and culture' },
  ],
  newsletters: [
    { url: 'https://www.platformer.news/rss/', name: 'Platformer', description: 'Tech and democracy' },
    { url: 'https://stratechery.com/feed/', name: 'Stratechery', description: 'Tech strategy analysis' },
    { url: 'https://www.ben-evans.com/benedictevans/rss.xml', name: 'Benedict Evans', description: 'Tech industry analysis' },
    { url: 'https://world.hey.com/dhh/feed.atom', name: 'DHH', description: 'David Heinemeier Hansson' },
    { url: 'https://danco.substack.com/feed', name: 'Dancoland', description: 'Alex Danco on tech' },
    { url: 'https://www.notboring.co/feed', name: 'Not Boring', description: 'Packy McCormick on startups' },
  ]
};

// Calculate reading patterns from user's article history
function analyzeReadingPatterns(articles) {
  const patterns = {
    categories: {},
    sources: {},
    topics: [],
    readTimes: [],
    avgEngagement: 0
  };

  articles.forEach(article => {
    // Count categories
    const category = article.primaryTag || article.category || 'Tech';
    patterns.categories[category] = (patterns.categories[category] || 0) + 1;

    // Count sources
    const source = article.feedTitle || article.siteName || 'Unknown';
    patterns.sources[source] = (patterns.sources[source] || 0) + 1;

    // Collect topics
    if (article.keyTopics) {
      patterns.topics.push(...article.keyTopics);
    }

    // Track read times
    if (article.readAt) {
      const hour = new Date(article.readAt).getHours();
      patterns.readTimes.push(hour);
    }

    // Track engagement (saved/summarized)
    if (article.isSaved || article.summary) {
      patterns.avgEngagement++;
    }
  });

  patterns.avgEngagement = articles.length > 0
    ? patterns.avgEngagement / articles.length
    : 0;

  return patterns;
}

export default async function handler(req, res) {
  // CORS headers
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
      mode = 'both' // 'personalized', 'discovery', 'both'
    } = req.body;

    const currentFeedUrls = currentFeeds.map(f => f.url?.toLowerCase() || '');
    const suggestions = [];

    // Analyze user's reading patterns
    const allArticles = [...readHistory, ...savedArticles];
    const patterns = analyzeReadingPatterns(allArticles);

    // Sort categories by engagement
    const topCategories = Object.entries(patterns.categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat.toLowerCase());

    // PERSONALIZED SUGGESTIONS
    if (mode === 'personalized' || mode === 'both') {
      // Find feeds matching user's top categories
      for (const category of topCategories) {
        const categoryFeeds = FEED_DATABASE[category] || [];
        const newFeeds = categoryFeeds.filter(
          feed => !currentFeedUrls.includes(feed.url.toLowerCase())
        );

        newFeeds.slice(0, 2).forEach(feed => {
          suggestions.push({
            ...feed,
            category,
            reason: `Based on your interest in ${category} content`,
            type: 'personalized',
            score: patterns.categories[category] || 1
          });
        });
      }

      // AI-powered suggestions based on reading history
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
              content: `Based on these article titles the user has read recently, suggest 2-3 RSS feed categories or specific publication types they might enjoy. Be specific about WHY each would appeal to them.

Recent reads:
${recentTitles}

Return JSON array: [{"category": "string", "reason": "string", "specificSuggestion": "string"}]`
            }]
          });

          const aiSuggestions = JSON.parse(
            aiResponse.content[0].text.match(/\[[\s\S]*\]/)?.[0] || '[]'
          );

          aiSuggestions.forEach(suggestion => {
            const categoryKey = suggestion.category.toLowerCase();
            const matchingFeeds = FEED_DATABASE[categoryKey] || FEED_DATABASE.tech;
            const newFeed = matchingFeeds.find(
              f => !currentFeedUrls.includes(f.url.toLowerCase())
            );

            if (newFeed) {
              suggestions.push({
                ...newFeed,
                category: suggestion.category,
                reason: suggestion.reason,
                type: 'ai-personalized',
                score: 10
              });
            }
          });
        } catch (e) {
          console.error('AI suggestion error:', e);
        }
      }
    }

    // DISCOVERY SUGGESTIONS
    if (mode === 'discovery' || mode === 'both') {
      // Add trending/popular feeds the user doesn't have
      const allFeeds = Object.values(FEED_DATABASE).flat();
      const popularFeeds = allFeeds
        .filter(feed => !currentFeedUrls.includes(feed.url.toLowerCase()))
        .slice(0, 5);

      popularFeeds.forEach(feed => {
        const category = Object.entries(FEED_DATABASE)
          .find(([, feeds]) => feeds.includes(feed))?.[0] || 'tech';

        suggestions.push({
          ...feed,
          category,
          reason: 'Popular source you might like',
          type: 'discovery',
          score: 5
        });
      });

      // Suggest categories user hasn't explored
      const userCategories = Object.keys(patterns.categories).map(c => c.toLowerCase());
      const unexploredCategories = Object.keys(FEED_DATABASE)
        .filter(cat => !userCategories.includes(cat));

      unexploredCategories.slice(0, 2).forEach(category => {
        const feeds = FEED_DATABASE[category];
        const topFeed = feeds.find(
          f => !currentFeedUrls.includes(f.url.toLowerCase())
        );

        if (topFeed) {
          suggestions.push({
            ...topFeed,
            category,
            reason: `Explore ${category} - you haven't read much from this category`,
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
      .slice(0, 10);

    return res.status(200).json({
      suggestions: uniqueSuggestions,
      patterns: {
        topCategories,
        articleCount: allArticles.length,
        engagementRate: Math.round(patterns.avgEngagement * 100)
      }
    });

  } catch (error) {
    console.error('Suggestions error:', error);
    return res.status(500).json({ error: 'Failed to generate suggestions' });
  }
}
