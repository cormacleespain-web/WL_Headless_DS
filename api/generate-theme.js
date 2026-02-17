/**
 * Vercel serverless function: proxy OpenAI for theme generation.
 * Keeps the API key server-side and avoids CORS. Set OPENAI_API_KEY in Vercel env.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
    return;
  }

  const body = req.body || {};
  const { prompt, systemPrompt, model = 'gpt-4o-mini' } = body;
  if (!prompt || !systemPrompt) {
    res.status(400).json({ error: 'Missing prompt or systemPrompt' });
    return;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      const err = data?.error?.message || `OpenAI ${response.status}`;
      res.status(response.status).json({ error: err });
      return;
    }

    const content = data.choices?.[0]?.message?.content ?? '';
    res.status(200).json({ content });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'OpenAI request failed' });
  }
}
