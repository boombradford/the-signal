// Vercel Serverless Function - Daily Briefing Generator
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

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { articles, style = 'briefing' } = req.body;

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ error: 'No articles provided' });
    }

    // Prepare article summaries for the briefing
    const articleSummaries = articles.slice(0, 15).map((article, i) => {
      const content = article.description || article.content || '';
      return `[${i + 1}] "${article.title}" (${article.feedTitle || 'Unknown source'})
${content.slice(0, 300)}...`;
    }).join('\n\n');

    const stylePrompts = {
      briefing: `Create a concise morning briefing that synthesizes these articles into a coherent 2-minute read:

1. **Top Story** - Lead with the most significant/impactful news
2. **Key Developments** - 3-4 bullet points covering other important stories
3. **Quick Hits** - Brief mentions of remaining noteworthy items
4. **The Takeaway** - One sentence on what to watch today

Use a conversational but professional tone. Reference specific articles by their key details, not by number.`,

      bullets: `Extract the most important insights across all articles:
• Create 6-8 bullet points covering the key news
• Each bullet should be self-contained and informative
• Group related stories together
• Prioritize actionable or significant developments`,

      topics: `Analyze these articles and provide:

**By Topic:**
Group the articles into 3-4 topic clusters, summarizing what's happening in each area.

**Connections:**
Note any themes, trends, or connections across different stories.

**What Matters:**
Highlight 2-3 things that are most worth paying attention to and why.`
    };

    const systemPrompt = `You are Kevin, a friendly and sharp AI news assistant. Your job is to help users quickly understand what's happening across their news feeds.

${stylePrompts[style] || stylePrompts.briefing}

CRITICAL RULES:
- ONLY use facts, names, numbers, and details that are EXPLICITLY stated in the provided articles
- NEVER invent or assume information not present in the source text
- If a detail is unclear, say "according to the article" or omit it
- Do NOT add speculation, predictions, or external knowledge
- Quote or closely paraphrase the original text when possible
- If the articles lack sufficient detail, keep the summary brief rather than filling gaps

Write in a warm but efficient style. Be specific - use only the names, numbers, and details from the articles. Avoid generic phrases. Make it scannable with clear formatting.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Here are my unread articles from today. Create my briefing:\n\n${articleSummaries}`
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return res.status(response.status).json({ error: 'Failed to generate briefing' });
    }

    const data = await response.json();
    const briefing = data.content?.[0]?.text || '';

    return res.status(200).json({
      briefing,
      articleCount: articles.length,
      model: 'claude-3-haiku-20240307',
      usage: data.usage,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Briefing error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
