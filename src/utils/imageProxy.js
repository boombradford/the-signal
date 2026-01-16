// Image proxy utility for handling CORS-restricted images

/**
 * Get a proxied URL for images that might be blocked by CORS
 * Uses wsrv.nl (formerly images.weserv.nl) - fast, reliable image proxy
 */
export function getProxiedImageUrl(url, options = {}) {
  if (!url) return null;

  // Skip if already proxied or is a data URL
  if (url.startsWith('data:') || url.includes('wsrv.nl') || url.includes('weserv.nl')) {
    return url;
  }

  // Skip Google favicons (they work fine)
  if (url.includes('google.com/s2/favicons')) {
    return url;
  }

  const { width, height, quality = 80 } = options;

  // Build proxy URL
  let proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(url)}`;

  // Add sizing if specified
  if (width) proxyUrl += `&w=${width}`;
  if (height) proxyUrl += `&h=${height}`;

  // Quality and format optimization
  proxyUrl += `&q=${quality}`;
  proxyUrl += '&output=webp'; // Modern format, smaller size
  proxyUrl += '&n=-1'; // No upscaling

  return proxyUrl;
}

/**
 * Get thumbnail URL optimized for card display
 * Uses 2x size for retina displays
 */
export function getThumbnailUrl(url) {
  return getProxiedImageUrl(url, { width: 352, height: 352, quality: 80 });
}

/**
 * Get full-size image URL for article view
 * Optimized for article hero images
 */
export function getArticleImageUrl(url) {
  return getProxiedImageUrl(url, { width: 1200, quality: 90 });
}

export default {
  getProxiedImageUrl,
  getThumbnailUrl,
  getArticleImageUrl
};
