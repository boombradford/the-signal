// AI Summary Utilities using serverless API

// Generate summary using serverless API
export async function generateSummary(content, options = {}) {
  const { style = 'concise', signal } = options;

  // Clean the content
  const cleanContent = cleanArticleContent(content);

  if (cleanContent.length < 100) {
    throw new Error('Article content is too short to summarize');
  }

  const response = await fetch('/api/summarize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: cleanContent,
      style
    }),
    signal // Pass abort signal to fetch
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    summary: data.summary,
    model: data.model,
    usage: data.usage
  };
}

// Clean article content for summarization
function cleanArticleContent(html) {
  if (!html) return '';

  // Create a temporary element to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Remove unwanted elements
  const removeSelectors = [
    'script', 'style', 'nav', 'header', 'footer',
    'aside', 'iframe', 'form', '.ad', '.advertisement',
    '.social-share', '.comments', '.related-posts'
  ];

  removeSelectors.forEach(selector => {
    temp.querySelectorAll(selector).forEach(el => el.remove());
  });

  // Get text content
  let text = temp.textContent || temp.innerText || '';

  // Clean up whitespace
  text = text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();

  return text;
}

// Extract article content from URL (for full article fetching)
export async function extractArticleContent(url, options = {}) {
  const { signal } = options;
  // Using a simple approach - in production you'd want a proper parser
  const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

  try {
    const response = await fetch(CORS_PROXY + encodeURIComponent(url), { signal });

    if (!response.ok) {
      throw new Error('Failed to fetch article');
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Try to find article content
    const contentSelectors = [
      'article',
      '[role="main"]',
      '.post-content',
      '.article-content',
      '.entry-content',
      '.content',
      'main'
    ];

    let content = null;

    for (const selector of contentSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        content = element;
        break;
      }
    }

    if (!content) {
      // Fall back to body
      content = doc.body;
    }

    // Get the title
    const title = doc.querySelector('h1')?.textContent ||
      doc.querySelector('title')?.textContent ||
      '';

    // Get the text content
    const text = cleanArticleContent(content.innerHTML);

    return {
      title: title.trim(),
      content: text,
      wordCount: text.split(/\s+/).length
    };
  } catch (error) {
    throw new Error(`Failed to extract article: ${error.message}`);
  }
}

// Estimate reading time
export function estimateReadingTime(text) {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);

  if (minutes < 1) return 'Less than 1 min';
  if (minutes === 1) return '1 min read';
  return `${minutes} min read`;
}

export default {
  generateSummary,
  extractArticleContent,
  estimateReadingTime
};
