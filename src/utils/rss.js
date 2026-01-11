// RSS Feed Parser Utilities

// CORS proxy for fetching RSS feeds
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
];

// Parse RSS/Atom feed from XML
export function parseFeed(xmlString, feedUrl) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');

  // Check for parsing errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Failed to parse feed XML');
  }

  // Detect feed type
  const rssChannel = doc.querySelector('channel');
  const atomFeed = doc.querySelector('feed');

  if (rssChannel) {
    return parseRSS(rssChannel, feedUrl);
  } else if (atomFeed) {
    return parseAtom(atomFeed, feedUrl);
  } else {
    throw new Error('Unknown feed format');
  }
}

// Parse RSS 2.0 format
function parseRSS(channel, feedUrl) {
  const title = getTextContent(channel, 'title');
  const description = getTextContent(channel, 'description');
  const link = getTextContent(channel, 'link');
  const imageUrl = getTextContent(channel, 'image > url') ||
    channel.querySelector('image')?.querySelector('url')?.textContent;

  const items = Array.from(channel.querySelectorAll('item')).map(item => ({
    guid: getTextContent(item, 'guid') || getTextContent(item, 'link') || Math.random().toString(),
    title: getTextContent(item, 'title') || 'Untitled',
    link: getTextContent(item, 'link'),
    description: cleanHtml(getTextContent(item, 'description') || getTextContent(item, 'content\\:encoded')),
    content: getTextContent(item, 'content\\:encoded') || getTextContent(item, 'description'),
    pubDate: parseDate(getTextContent(item, 'pubDate')),
    author: getTextContent(item, 'author') || getTextContent(item, 'dc\\:creator'),
    thumbnail: extractThumbnail(item),
  }));

  return {
    feed: {
      title: title || 'Untitled Feed',
      description,
      link: link || feedUrl,
      imageUrl,
      url: feedUrl,
    },
    items
  };
}

// Parse Atom format
function parseAtom(feed, feedUrl) {
  const title = getTextContent(feed, 'title');
  const subtitle = getTextContent(feed, 'subtitle');
  const link = feed.querySelector('link[rel="alternate"]')?.getAttribute('href') ||
    feed.querySelector('link')?.getAttribute('href');
  const icon = getTextContent(feed, 'icon') || getTextContent(feed, 'logo');

  const items = Array.from(feed.querySelectorAll('entry')).map(entry => {
    const entryLink = entry.querySelector('link[rel="alternate"]')?.getAttribute('href') ||
      entry.querySelector('link')?.getAttribute('href');

    return {
      guid: getTextContent(entry, 'id') || entryLink || Math.random().toString(),
      title: getTextContent(entry, 'title') || 'Untitled',
      link: entryLink,
      description: cleanHtml(getTextContent(entry, 'summary') || getTextContent(entry, 'content')),
      content: getTextContent(entry, 'content') || getTextContent(entry, 'summary'),
      pubDate: parseDate(getTextContent(entry, 'published') || getTextContent(entry, 'updated')),
      author: getTextContent(entry, 'author > name'),
      thumbnail: extractThumbnailAtom(entry),
    };
  });

  return {
    feed: {
      title: title || 'Untitled Feed',
      description: subtitle,
      link: link || feedUrl,
      imageUrl: icon,
      url: feedUrl,
    },
    items
  };
}

// Helper to get text content
function getTextContent(parent, selector) {
  const element = parent.querySelector(selector);
  return element?.textContent?.trim() || '';
}

// Parse various date formats
function parseDate(dateString) {
  if (!dateString) return new Date().toISOString();

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return new Date().toISOString();
    }
    return date.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// Extract thumbnail from RSS item
function extractThumbnail(item) {
  // Check media:thumbnail
  const mediaThumbnail = item.querySelector('media\\:thumbnail, thumbnail');
  if (mediaThumbnail) {
    return mediaThumbnail.getAttribute('url');
  }

  // Check media:content
  const mediaContent = item.querySelector('media\\:content, content');
  if (mediaContent?.getAttribute('medium') === 'image') {
    return mediaContent.getAttribute('url');
  }

  // Check enclosure
  const enclosure = item.querySelector('enclosure');
  if (enclosure?.getAttribute('type')?.startsWith('image/')) {
    return enclosure.getAttribute('url');
  }

  // Extract from content/description
  const content = getTextContent(item, 'content\\:encoded') || getTextContent(item, 'description');
  return extractImageFromHtml(content);
}

// Extract thumbnail from Atom entry
function extractThumbnailAtom(entry) {
  // Check media elements
  const mediaThumbnail = entry.querySelector('media\\:thumbnail, thumbnail');
  if (mediaThumbnail) {
    return mediaThumbnail.getAttribute('url');
  }

  // Check links
  const imageLink = entry.querySelector('link[rel="enclosure"][type^="image"]');
  if (imageLink) {
    return imageLink.getAttribute('href');
  }

  // Extract from content
  const content = getTextContent(entry, 'content') || getTextContent(entry, 'summary');
  return extractImageFromHtml(content);
}

// Extract first image from HTML content
function extractImageFromHtml(html) {
  if (!html) return null;

  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return imgMatch?.[1] || null;
}

// Clean HTML for preview
function cleanHtml(html) {
  if (!html) return '';

  // Remove HTML tags
  const text = html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  // Limit length
  return text.length > 300 ? text.substring(0, 300) + '...' : text;
}

// Fetch feed with CORS handling
export async function fetchFeed(url) {
  let lastError;

  // Try direct fetch first (works if CORS is enabled on the feed)
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml'
      }
    });

    if (response.ok) {
      const text = await response.text();
      return parseFeed(text, url);
    }
  } catch (e) {
    lastError = e;
  }

  // Try CORS proxies
  for (const proxy of CORS_PROXIES) {
    try {
      const response = await fetch(proxy + encodeURIComponent(url));

      if (response.ok) {
        const text = await response.text();
        return parseFeed(text, url);
      }
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError || new Error('Failed to fetch feed');
}

// Get favicon for a URL
export function getFaviconUrl(url) {
  try {
    const urlObj = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
  } catch {
    return null;
  }
}

// Validate feed URL
export async function validateFeedUrl(url) {
  try {
    const result = await fetchFeed(url);
    return {
      valid: true,
      feed: result.feed,
      itemCount: result.items.length
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

// Format relative time
export function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
}

export default {
  fetchFeed,
  parseFeed,
  getFaviconUrl,
  validateFeedUrl,
  formatRelativeTime
};
