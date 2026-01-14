/**
 * URL Scraper API
 *
 * Extracts article content from any URL using AI-powered parsing.
 * Returns structured article data ready for saving.
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

// Clean HTML - remove scripts, styles, etc.
function cleanHtml(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
    .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
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
    publishedDate: '',
    thumbnail: '',
    siteName: ''
  };

  // Title - try multiple sources
  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
  const twitterTitle = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']*)["']/i);
  const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  metadata.title = (ogTitle?.[1] || twitterTitle?.[1] || titleTag?.[1] || '').trim();

  // Description
  const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
  const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  metadata.description = (ogDesc?.[1] || metaDesc?.[1] || '').trim();

  // Author
  const authorMeta = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']*)["']/i);
  const authorLd = html.match(/"author"[^}]*"name"\s*:\s*"([^"]*)"/i);
  metadata.author = (authorMeta?.[1] || authorLd?.[1] || '').trim();

  // Published date
  const pubDate = html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']*)["']/i);
  const dateLd = html.match(/"datePublished"\s*:\s*"([^"]*)"/i);
  metadata.publishedDate = pubDate?.[1] || dateLd?.[1] || '';

  // Thumbnail
  const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);
  const twitterImage = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']*)["']/i);
  let thumbnail = ogImage?.[1] || twitterImage?.[1] || '';

  // Make relative URLs absolute
  if (thumbnail && !thumbnail.startsWith('http')) {
    try {
      const urlObj = new URL(url);
      thumbnail = new URL(thumbnail, urlObj.origin).href;
    } catch {
      thumbnail = '';
    }
  }
  metadata.thumbnail = thumbnail;

  // Site name
  const siteName = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']*)["']/i);
  try {
    const urlObj = new URL(url);
    metadata.siteName = siteName?.[1] || urlObj.hostname.replace('www.', '');
  } catch {
    metadata.siteName = siteName?.[1] || '';
  }

  return metadata;
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

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();

    // Extract metadata first
    const metadata = extractMetadata(html, url);

    // Clean HTML for content extraction
    const cleanedText = cleanHtml(html);

    // Use Claude to extract the main article content
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Extract the main article content from this webpage text. Return ONLY a JSON object with these fields:
- "content": The main article text (cleaned, readable format, preserve paragraphs)
- "keyPoints": Array of 3-5 key points from the article
- "category": One of: Tech, Finance, Politics, Science, Culture, Sports, Health, World

URL: ${url}
Title: ${metadata.title}

Page text (first 8000 chars):
${cleanedText.slice(0, 8000)}

Return ONLY valid JSON, no explanation.`
        }
      ]
    });

    const aiResponse = message.content[0].text;
    let extracted;

    try {
      // Try to parse the JSON response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      extracted = JSON.parse(jsonMatch?.[0] || aiResponse);
    } catch {
      // If parsing fails, use the response as content
      extracted = {
        content: cleanedText.slice(0, 5000),
        keyPoints: [],
        category: 'Tech'
      };
    }

    // Combine metadata with extracted content
    const article = {
      url,
      title: metadata.title || 'Untitled Article',
      description: metadata.description || extracted.content?.slice(0, 200) + '...' || '',
      content: extracted.content || cleanedText.slice(0, 5000),
      author: metadata.author,
      publishedDate: metadata.publishedDate || new Date().toISOString(),
      thumbnail: metadata.thumbnail,
      siteName: metadata.siteName,
      keyPoints: extracted.keyPoints || [],
      category: extracted.category || 'Tech'
    };

    return res.status(200).json(article);

  } catch (error) {
    console.error('Scrape error:', error);
    return res.status(500).json({
      error: 'Failed to scrape URL',
      message: error.message
    });
  }
}
