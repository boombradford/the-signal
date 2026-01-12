// Vercel Serverless Function - Claude API Proxy
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
    const { content, style = 'concise' } = req.body;

    if (!content || content.length < 100) {
      return res.status(400).json({ error: 'Content too short to summarize' });
    }

    // Style-specific prompts with better formatting instructions
    const stylePrompts = {
      concise: `Write a 2-3 sentence summary that captures the essence of the article.
- Lead with the most important insight or news
- Use clear, punchy language
- End with the key takeaway or implication`,
      detailed: `Write a comprehensive 4-5 sentence summary:
- Open with the main topic and why it matters
- Include key facts, figures, or quotes
- Cover different perspectives if relevant
- Conclude with implications or next steps`,
      bullets: `Extract the 4-5 most important points as bullet points:
• Each point should be a complete, standalone insight
• Lead each bullet with the key fact or finding
• Include specific details, numbers, or names when relevant
• Order from most to least important`
    };

    const maxTokens = { concise: 250, detailed: 600, bullets: 450 };

    const systemPrompt = `You are a sharp, engaging news editor who writes summaries that are:
- Informative and substantive (not vague or generic)
- Well-structured with clear flow
- Written in active voice
- Free of filler phrases like "This article discusses..." or "The author explains..."

${stylePrompts[style] || stylePrompts.concise}

Start directly with the content. Never begin with "This article" or similar meta-references.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: maxTokens[style] || 250,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Summarize this article:\n\n${content.slice(0, 15000)}`
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return res.status(response.status).json({ error: 'Failed to generate summary' });
    }

    const data = await response.json();
    const summary = data.content?.[0]?.text || '';

    return res.status(200).json({
      summary,
      model: 'claude-3-haiku-20240307',
      usage: data.usage
    });

  } catch (error) {
    console.error('Summarize error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
