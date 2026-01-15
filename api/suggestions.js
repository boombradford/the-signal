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
  politics: [
    { url: 'https://feeds.npr.org/1014/rss.xml', name: 'NPR Politics', description: 'US political coverage' },
    { url: 'https://www.politico.com/rss/politics08.xml', name: 'Politico', description: 'Political news and analysis' },
    { url: 'https://thehill.com/feed/', name: 'The Hill', description: 'Congressional and policy news' },
    { url: 'https://fivethirtyeight.com/politics/feed/', name: 'FiveThirtyEight', description: 'Data-driven political analysis' },
  ],
  culture: [
    { url: 'https://www.newyorker.com/feed/culture', name: 'The New Yorker', description: 'Arts, culture, and criticism' },
    { url: 'https://pitchfork.com/feed/feed-news/rss', name: 'Pitchfork', description: 'Music news and reviews' },
    { url: 'https://www.polygon.com/rss/index.xml', name: 'Polygon', description: 'Gaming and entertainment' },
    { url: 'https://www.vulture.com/rss/index.xml', name: 'Vulture', description: 'Entertainment and pop culture' },
  ],
  health: [
    { url: 'https://www.statnews.com/feed/', name: 'STAT News', description: 'Health and medicine reporting' },
    { url: 'https://www.medicalnewstoday.com/newsfeeds/rss', name: 'Medical News Today', description: 'Health news and information' },
    { url: 'https://www.health.harvard.edu/blog/feed', name: 'Harvard Health', description: 'Evidence-based health advice' },
  ],
  sports: [
    { url: 'https://www.espn.com/espn/rss/news', name: 'ESPN', description: 'Sports news and scores' },
    { url: 'https://theathletic.com/feeds/rss/news/', name: 'The Athletic', description: 'In-depth sports journalism' },
    { url: 'https://www.si.com/rss/si_topstories.rss', name: 'Sports Illustrated', description: 'Sports coverage and analysis' },
  ],
  newsletters: [
    { url: 'https://www.platformer.news/rss/', name: 'Platformer', description: 'Technology and democracy' },
    { url: 'https://stratechery.com/feed/', name: 'Stratechery', description: 'Technology strategy analysis' },
    { url: 'https://www.ben-evans.com/benedictevans/rss.xml', name: 'Benedict Evans', description: 'Technology industry analysis' },
    { url: 'https://danco.substack.com/feed', name: 'Dancoland', description: 'Technology and culture' },
    { url: 'https://www.notboring.co/feed', name: 'Not Boring', description: 'Startups and strategy' },
  ]
};

// Map user tags (from AI tagging) to feed categories
const TAG_TO_CATEGORY_MAP = {
  // Direct mappings
  'tech': ['technology', 'artificial_intelligence'],
  'technology': ['technology', 'artificial_intelligence'],
  'finance': ['finance'],
  'politics': ['politics', 'world'],
  'science': ['science'],
  'culture': ['culture'],
  'sports': ['sports'],
  'health': ['health', 'science'],
  'world': ['world', 'politics'],
  // AI-specific
  'ai': ['artificial_intelligence', 'technology'],
  'artificial intelligence': ['artificial_intelligence', 'technology'],
  // Variations
  'business': ['finance'],
  'money': ['finance'],
  'markets': ['finance'],
  'crypto': ['finance'],
  'gaming': ['culture'],
  'entertainment': ['culture'],
  'music': ['culture'],
  'movies': ['culture'],
  'news': ['world', 'politics'],
  'medicine': ['health', 'science'],
  'space': ['science'],
  'environment': ['science'],
};

// Analyze reading patterns from article history
function analyzeReadingPatterns(articles) {
  const patterns = {
    categories: {},
    sources: {},
    topics: [],
    engagementRate: 0,
    feedTitles: {}
  };

  articles.forEach(article => {
    // Track primary tag (normalized to lowercase)
    const tag = (article.primaryTag || '').toLowerCase();
    if (tag) {
      patterns.categories[tag] = (patterns.categories[tag] || 0) + 1;
    }

    // Track feed sources
    const source = article.feedTitle || article.siteName || 'Unknown';
    patterns.sources[source] = (patterns.sources[source] || 0) + 1;
    patterns.feedTitles[source] = true;

    // Track key topics
    if (article.keyTopics && Array.isArray(article.keyTopics)) {
      patterns.topics.push(...article.keyTopics);
    }

    // Track engagement
    if (article.isSaved || article.summary) {
      patterns.engagementRate++;
    }
  });

  patterns.engagementRate = articles.length > 0
    ? Math.round((patterns.engagementRate / articles.length) * 100)
    : 0;

  return patterns;
}

// Map user tags to feed database categories
function mapTagsToCategories(tags) {
  const categories = new Set();

  tags.forEach(tag => {
    const normalizedTag = tag.toLowerCase().trim();
    const mappedCategories = TAG_TO_CATEGORY_MAP[normalizedTag];

    if (mappedCategories) {
      mappedCategories.forEach(cat => categories.add(cat));
    } else {
      // Try partial matching
      for (const [key, cats] of Object.entries(TAG_TO_CATEGORY_MAP)) {
        if (normalizedTag.includes(key) || key.includes(normalizedTag)) {
          cats.forEach(cat => categories.add(cat));
          break;
        }
      }
    }
  });

  return Array.from(categories);
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

    // Combine all articles for analysis
    const allArticles = [...readHistory, ...savedArticles];
    const patterns = analyzeReadingPatterns(allArticles);

    // Get top categories from reading patterns
    const topUserTags = Object.entries(patterns.categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    // Map user tags to feed categories
    const topCategories = mapTagsToCategories(topUserTags);

    // If no categories found from tags, use defaults based on any available data
    if (topCategories.length === 0 && allArticles.length > 0) {
      // Analyze article titles/content for interests
      topCategories.push('technology', 'world');
    }

    // Personalized suggestions based on reading patterns
    if (mode === 'personalized' || mode === 'both') {
      // Add feeds from matched categories
      for (const category of topCategories) {
        const categoryFeeds = FEED_DATABASE[category] || [];
        const newFeeds = categoryFeeds.filter(
          feed => !currentFeedUrls.includes(feed.url.toLowerCase())
        );

        const matchedTag = topUserTags.find(tag =>
          TAG_TO_CATEGORY_MAP[tag]?.includes(category)
        );

        newFeeds.slice(0, 2).forEach(feed => {
          suggestions.push({
            ...feed,
            category,
            reason: matchedTag
              ? `Based on your interest in ${matchedTag}`
              : `Matches your reading patterns`,
            type: 'personalized',
            score: patterns.categories[matchedTag] || 5
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

Categories available: technology, artificial_intelligence, finance, science, world, politics, culture, health, sports, newsletters

Return JSON array: [{"category": "string", "reason": "string"}]`
            }]
          });

          const aiSuggestions = JSON.parse(
            aiResponse.content[0].text.match(/\[[\s\S]*\]/)?.[0] || '[]'
          );

          aiSuggestions.forEach(suggestion => {
            const categoryKey = suggestion.category.toLowerCase().replace(/\s+/g, '_');
            const matchingFeeds = FEED_DATABASE[categoryKey];
            const newFeed = matchingFeeds?.find(
              f => !currentFeedUrls.includes(f.url.toLowerCase()) &&
                   !suggestions.find(s => s.url === f.url)
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
      // Suggest feeds from categories the user hasn't explored
      const exploredCategories = new Set(topCategories);
      const unexploredCategories = Object.keys(FEED_DATABASE)
        .filter(cat => !exploredCategories.has(cat));

      unexploredCategories.slice(0, 3).forEach(category => {
        const feeds = FEED_DATABASE[category];
        const topFeed = feeds?.find(
          f => !currentFeedUrls.includes(f.url.toLowerCase()) &&
               !suggestions.find(s => s.url === f.url)
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

      // Add some popular feeds as discovery
      const popularCategories = ['technology', 'world', 'newsletters'];
      popularCategories.forEach(category => {
        if (!exploredCategories.has(category)) {
          const feeds = FEED_DATABASE[category];
          const topFeed = feeds?.find(
            f => !currentFeedUrls.includes(f.url.toLowerCase()) &&
                 !suggestions.find(s => s.url === f.url)
          );

          if (topFeed) {
            suggestions.push({
              ...topFeed,
              category,
              reason: 'Popular source',
              type: 'discovery',
              score: 5
            });
          }
        }
      });
    }

    // Deduplicate and sort by score
    const uniqueSuggestions = suggestions
      .filter((s, i, arr) => arr.findIndex(x => x.url === s.url) === i)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);

    // Format top categories for display (use original user tags)
    const displayCategories = topUserTags.length > 0
      ? topUserTags.slice(0, 5)
      : (topCategories.length > 0 ? topCategories.slice(0, 5) : []);

    return res.status(200).json({
      suggestions: uniqueSuggestions,
      patterns: {
        topCategories: displayCategories,
        articleCount: allArticles.length,
        engagementRate: patterns.engagementRate,
        feedCount: Object.keys(patterns.feedTitles).length
      }
    });

  } catch (error) {
    console.error('Suggestions error:', error);
    return res.status(500).json({ error: 'Failed to generate suggestions' });
  }
}
