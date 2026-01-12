// Vercel Serverless Function - ElevenLabs TTS Proxy
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

  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'ElevenLabs API key not configured' });
  }

  try {
    const { text } = req.body;

    if (!text || text.length < 10) {
      return res.status(400).json({ error: 'Text too short' });
    }

    // Clean text for speech
    const cleanText = text
      .replace(/[•\-*]/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/\n+/g, '. ')
      .trim();

    // Using "Aria" voice - natural, warm female voice
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/9BWtsMINqrJLrRacOk9x', {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: cleanText.slice(0, 5000), // ElevenLabs limit
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.3,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs API error:', error);
      return res.status(response.status).json({ error: 'Failed to generate audio' });
    }

    // Stream the audio response
    const audioBuffer = await response.arrayBuffer();

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength);

    return res.status(200).send(Buffer.from(audioBuffer));

  } catch (error) {
    console.error('TTS error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
