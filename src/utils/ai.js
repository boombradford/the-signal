// AI Summary Utilities using Claude API

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

// Generate summary using Claude API
export async function generateSummary(content, apiKey, options = {}) {
  const {
    model = 'claude-3-haiku-20240307',
    style = 'concise' // 'concise', 'detailed', 'bullets'
  } = options;

  // Adjust token limits based on style
  const tokenLimits = {
    concise: 200,
    detailed: 500,
    bullets: 350
  };
  const maxTokens = tokenLimits[style] || 300;

  if (!apiKey) {
    throw new Error('Claude API key is required');
  }

  // Clean the content
  const cleanContent = cleanArticleContent(content);

  if (cleanContent.length < 100) {
    throw new Error('Article content is too short to summarize');
  }

  // Truncate very long content
  const truncatedContent = cleanContent.length > 15000
    ? cleanContent.substring(0, 15000) + '...'
    : cleanContent;

  const stylePrompts = {
    concise: 'Write exactly 2-3 complete, grammatically correct sentences that capture the essential points. Each sentence should flow naturally and be properly punctuated.',
    detailed: 'Write a comprehensive summary of 4-5 complete sentences. Cover the main topic, key arguments, important details, and conclusions. Use proper paragraph structure with natural sentence flow.',
    bullets: 'Provide 3-5 key takeaways as bullet points. Start each bullet with "• " followed by one clear, complete sentence. Each point should stand alone and convey a distinct insight.'
  };

  const systemPrompt = `You are a professional summarizer for a news reader app. Your summaries must be clear, accurate, and well-formatted.

${stylePrompts[style]}

Rules:
- Write in complete, grammatically correct sentences
- Do not include meta-commentary like "This article discusses..." or "The author argues..."
- Get straight to the substance and key facts
- Be objective and factual
- Never truncate mid-sentence`;

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Please summarize this article:\n\n${truncatedContent}`
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.content?.[0]?.text) {
    throw new Error('Invalid response from Claude API');
  }

  return {
    summary: data.content[0].text,
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
export async function extractArticleContent(url) {
  // Using a simple approach - in production you'd want a proper parser
  const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

  try {
    const response = await fetch(CORS_PROXY + encodeURIComponent(url));

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

// Validate API key
export async function validateApiKey(apiKey) {
  if (!apiKey) return { valid: false, error: 'API key is required' };

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }]
      })
    });

    if (response.ok) {
      return { valid: true };
    }

    const error = await response.json().catch(() => ({}));

    if (response.status === 401) {
      return { valid: false, error: 'Invalid API key' };
    }

    return { valid: false, error: error.error?.message || 'API validation failed' };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

export default {
  generateSummary,
  extractArticleContent,
  estimateReadingTime,
  validateApiKey
};
