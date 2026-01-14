// Vercel Serverless Function - AI Article Tagging
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
    const { title, description, content } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Combine available text for analysis
    const articleText = [
      title,
      description?.slice(0, 500),
      content?.slice(0, 1000)
    ].filter(Boolean).join('\n\n');

    const systemPrompt = `You are a news categorization expert. Analyze the article and return a JSON object with:
1. "primaryTag": The single most relevant category from this list:
   - Tech (technology, AI, software, gadgets, startups)
   - Finance (markets, economy, business, crypto, investing)
   - Politics (government, policy, elections, international relations)
   - Science (research, medicine, space, environment, climate)
   - Culture (entertainment, arts, music, movies, gaming)
   - Sports (athletics, teams, competitions)
   - Health (wellness, fitness, mental health, nutrition)
   - World (international news, global events)

2. "secondaryTags": Array of 0-2 additional relevant tags from the same list (if applicable)

3. "sentiment": One of "positive", "negative", "neutral", or "mixed"

4. "keyTopics": Array of 2-3 specific topics/entities mentioned (e.g., "OpenAI", "Federal Reserve", "Climate Change")

Return ONLY valid JSON, no other text.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 200,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Categorize this article:\n\n${articleText}`
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return res.status(response.status).json({ error: 'Failed to tag article' });
    }

    const data = await response.json();
    const resultText = data.content?.[0]?.text || '{}';

    // Parse the JSON response
    let tags;
    try {
      tags = JSON.parse(resultText);
    } catch (e) {
      // Try to extract JSON from the response
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        tags = JSON.parse(jsonMatch[0]);
      } else {
        tags = { primaryTag: 'World', secondaryTags: [], sentiment: 'neutral', keyTopics: [] };
      }
    }

    return res.status(200).json({
      primaryTag: tags.primaryTag || 'World',
      secondaryTags: tags.secondaryTags || [],
      sentiment: tags.sentiment || 'neutral',
      keyTopics: tags.keyTopics || [],
      model: 'claude-3-haiku-20240307'
    });

  } catch (error) {
    console.error('Tag error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
