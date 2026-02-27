/**
 * Vercel serverless: transcribe audio via OpenAI Whisper.
 * POST body: JSON { audioBase64: string, mimeType?: string }.
 * Returns { text: string } or { error: string }.
 * Set OPENAI_API_KEY in env.
 */
function sendJson(res, status, data) {
  res.setHeader('Content-Type', 'application/json');
  res.status(status).end(JSON.stringify(data));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    sendJson(res, 500, { error: 'OPENAI_API_KEY not configured' });
    return;
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body' });
    return;
  }

  const { audioBase64, mimeType = 'audio/webm' } = body;
  if (!audioBase64 || typeof audioBase64 !== 'string') {
    sendJson(res, 400, { error: 'Missing audioBase64' });
    return;
  }

  try {
    const buffer = Buffer.from(audioBase64, 'base64');
    if (buffer.length === 0) {
      sendJson(res, 400, { error: 'Empty audio' });
      return;
    }

    const formData = new FormData();
    const blob = new Blob([buffer], { type: mimeType });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = data?.error?.message || data?.error || `Whisper ${response.status}`;
      sendJson(res, response.status >= 400 ? response.status : 500, { error: err });
      return;
    }

    const text = typeof data?.text === 'string' ? data.text.trim() : '';
    sendJson(res, 200, { text });
  } catch (e) {
    sendJson(res, 500, { error: e?.message || 'Transcription failed' });
  }
}
