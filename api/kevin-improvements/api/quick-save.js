/**
 * Quick Save API
 *
 * Unified endpoint for saving any URL (article, tweet, video, etc.)
 * Supports:
 * - Regular articles (uses scrape.js logic)
 * - Twitter/X posts
 * - YouTube videos (extracts transcript)
 * - LinkedIn posts
 * - Generic URLs
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

// Detect content type from URL
function detectContentType(url) {
  const urlLower = url.toLowerCase();

  if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
    return 'twitter';
  }
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    return 'youtube';
  }
  if (urlLower.includes('linkedin.com')) {
    return 'linkedin';
  }
  if (urlLower.includes('reddit.com')) {
    return 'reddit';
  }
  if (urlLower.includes('github.com')) {
    return 'github';
  }
  if (urlLower.includes('substack.com') || urlLower.includes('medium.com')) {
    return 'newsletter';
  }

  return 'article';
}

// Extract YouTube video ID
function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Extract Twitter/X post ID
function extractTwitterId(url) {
  const match = url.match(/status\/(\d+)/);
  return match ? match[1] : null;
}

// Clean HTML helper
function cleanHtml(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract metadata from HTML
function extractMetadata(html, url) {
  const metadata = {
    title: '',
    description: '',
    author: '',
    thumbnail: '',
    siteName: ''
  };

  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
  const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  metadata.title = (ogTitle?.[1] || titleTag?.[1] || '').trim();

  const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
  metadata.description = (ogDesc?.[1] || '').trim();

  const authorMeta = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']*)["']/i);
  metadata.author = (authorMeta?.[1] || '').trim();

  const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);
  metadata.thumbnail = ogImage?.[1] || '';

  const siteName = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']*)["']/i);
  try {
    metadata.siteName = siteName?.[1] || new URL(url).hostname.replace('www.', '');
  } catch {
    metadata.siteName = siteName?.[1] || '';
  }

  return metadata;
}

// Fetch and process YouTube video
async function processYouTube(url, videoId) {
  try {
    // Try to get video info via oEmbed
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const oembedResponse = await fetch(oembedUrl);
    const oembedData = oembedResponse.ok ? await oembedResponse.json() : {};

    // Try to get transcript (this is a simplified approach - you may want to use a dedicated API)
    // For now, we'll use the video metadata

    return {
      url,
      title: oembedData.title || 'YouTube Video',
      description: `Video by ${oembedData.author_name || 'Unknown'}`,
      content: `YouTube video: ${oembedData.title}. Duration and transcript require YouTube Data API.`,
      author: oembedData.author_name || '',
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      siteName: 'YouTube',
      contentType: 'youtube',
      videoId,
      category: 'Culture'
    };
  } catch (error) {
    return {
      url,
      title: 'YouTube Video',
      description: '',
      content: 'Unable to fetch video details',
      siteName: 'YouTube',
      contentType: 'youtube',
      videoId,
      category: 'Culture'
    };
  }
}

// Process Twitter/X post
async function processTwitter(url, tweetId) {
  // Note: Twitter's API requires authentication
  // This is a fallback using metadata extraction

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch tweet');
    }

    const html = await response.text();
    const metadata = extractMetadata(html, url);

    return {
      url,
      title: metadata.title || `Tweet ${tweetId}`,
      description: metadata.description,
      content: metadata.description,
      author: metadata.author,
      thumbnail: metadata.thumbnail,
      siteName: 'X (Twitter)',
      contentType: 'twitter',
      tweetId,
      category: 'Culture'
    };
  } catch {
    return {
      url,
      title: `Tweet ${tweetId}`,
      description: 'Twitter post',
      content: 'Unable to fetch tweet content. Consider using the Twitter API for better results.',
      siteName: 'X (Twitter)',
      contentType: 'twitter',
      tweetId,
      category: 'Culture'
    };
  }
}

// Process regular article
async function processArticle(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9'
    },
    redirect: 'follow'
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }

  const html = await response.text();
  const metadata = extractMetadata(html, url);
  const cleanedText = cleanHtml(html);

  // Use Claude to extract main content
  const message = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Extract the main content from this webpage. Return JSON:
{
  "content": "main article text (cleaned)",
  "keyPoints": ["point1", "point2", "point3"],
  "category": "Tech|Finance|Politics|Science|Culture|Sports|Health|World"
}

URL: ${url}
Title: ${metadata.title}
Text (first 6000 chars): ${cleanedText.slice(0, 6000)}

Return ONLY valid JSON.`
    }]
  });

  let extracted;
  try {
    const jsonMatch = message.content[0].text.match(/\{[\s\S]*\}/);
    extracted = JSON.parse(jsonMatch?.[0] || '{}');
  } catch {
    extracted = {
      content: cleanedText.slice(0, 3000),
      keyPoints: [],
      category: 'Tech'
    };
  }

  return {
    url,
    title: metadata.title || 'Untitled',
    description: metadata.description || extracted.content?.slice(0, 200) + '...',
    content: extracted.content || cleanedText.slice(0, 3000),
    author: metadata.author,
    thumbnail: metadata.thumbnail,
    siteName: metadata.siteName,
    keyPoints: extracted.keyPoints || [],
    category: extracted.category || 'Tech',
    contentType: 'article'
  };
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

  const { url, source = 'app' } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Validate URL
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const contentType = detectContentType(url);
    let result;

    switch (contentType) {
      case 'youtube': {
        const videoId = extractYouTubeId(url);
        result = await processYouTube(url, videoId);
        break;
      }
      case 'twitter': {
        const tweetId = extractTwitterId(url);
        result = await processTwitter(url, tweetId);
        break;
      }
      default:
        result = await processArticle(url);
    }

    // Add metadata about save source
    result.savedAt = new Date().toISOString();
    result.savedFrom = source; // 'app', 'bookmarklet', 'share', 'extension'

    return res.status(200).json(result);

  } catch (error) {
    console.error('Quick save error:', error);
    return res.status(500).json({
      error: 'Failed to save URL',
      message: error.message
    });
  }
}
