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

    // Style-specific prompts
    const stylePrompts = {
      concise: 'Summarize in 2-3 clear sentences. Focus on the main point.',
      detailed: 'Provide a comprehensive summary in 4-5 sentences covering key details.',
      bullets: 'List 3-5 key points as bullet points. Start each with •'
    };

    const maxTokens = { concise: 200, detailed: 500, bullets: 350 };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: maxTokens[style] || 200,
        system: `You are a skilled editor who creates clear, accurate summaries. ${stylePrompts[style] || stylePrompts.concise} Never add information not in the original. Be direct and informative.`,
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
