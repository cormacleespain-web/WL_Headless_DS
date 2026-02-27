/**
 * Vercel serverless function: proxy OpenAI for AI Example Builder (page design from prompt).
 * Uses OPENAI_API_KEY. Returns { content } with a JSON UI tree or JSX string.
 */
function sendJson(res, status, data) {
  res.setHeader('Content-Type', 'application/json');
  res.status(status).end(JSON.stringify(data));
}

const PAGE_BUILDER_SYSTEM = `You are a UI code generator. You MUST respond with ONLY valid JSON, no markdown or other text.

Generate a UI tree that will be rendered with React and Radix UI Themes. Return a single JSON object with this exact shape:
{ "component": "Box", "props": { "p": "4" }, "children": [ ... ] }

Allowed component names (use exactly these): Box, Flex, Heading, Text, Button, Card, Badge, Separator, TextField, TextArea, Avatar, Progress, Spinner, Link, Code, Strong, Em, Callout, Blockquote, ScrollArea, Inset, Kbd, Skeleton, Switch, Slider.

Rules:
- "children" can be an array of more UI tree objects, or an array of strings (for text nodes), or a single string for components that accept one text child.
- Use "props" for Radix props: size ("1"|"2"|"3"), color ("gray"|"accent"|"red"|"green"|"blue"|"orange"), variant ("solid"|"soft"|"outline"|"ghost"|"surface"), weight ("bold"), p, pt, pb, m, gap, direction ("column"|"row"), align, justify, wrap, etc.
- For Heading use props like size ("1" through "9"), weight.
- For Text use size ("1"|"2"|"3"), color ("gray"), weight.
- Prefer theme tokens in style when needed: style: { color: "var(--wz-color-semantic-fg-default)", background: "var(--wz-color-semantic-bg-surface)" }.
- Keep the tree small enough to fit in one response (one or two cards with a few elements is fine).
- If the user asks for forms, use TextField, TextArea, Button. If they ask for stats/dashboard, use Card, Flex, Text, Badge.
- If the user provides an image, analyze the layout and components in the design and replicate it using only the allowed components and theme tokens.
- Never use components or props not in the allowed list.`;

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

  const body = req.body || {};
  const { prompt, imageBase64, imageMimeType } = body;
  const hasImage = imageBase64 && typeof imageBase64 === 'string';
  const hasPrompt = typeof prompt === 'string' && prompt.trim().length > 0;
  if (!hasPrompt && !hasImage) {
    sendJson(res, 400, { error: 'Missing prompt or image. Provide a text description and/or upload an image.' });
    return;
  }

  const userText = hasPrompt ? prompt.trim() : (hasImage ? 'Create a page design that matches this image. Use our Radix UI component library and theme.' : '');
  const userContent = hasImage
    ? [
        { type: 'text', text: userText },
        { type: 'image_url', image_url: { url: `data:${imageMimeType || 'image/jpeg'};base64,${imageBase64}` } },
      ]
    : userText;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: hasImage ? 'gpt-4o-mini' : 'gpt-4o-mini',
        messages: [
          { role: 'system', content: PAGE_BUILDER_SYSTEM },
          { role: 'user', content: userContent },
        ],
        temperature: 0.2,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      const err = data?.error?.message || `OpenAI ${response.status}`;
      sendJson(res, response.status, { error: err });
      return;
    }

    let content = (data.choices?.[0]?.message?.content ?? '').trim();
    // Strip markdown code block if present
    const codeMatch = content.match(/^```(?:json)?\s*([\s\S]*?)```$/m);
    if (codeMatch) content = codeMatch[1].trim();
    sendJson(res, 200, { content });
  } catch (e) {
    sendJson(res, 500, { error: e?.message || 'OpenAI request failed' });
  }
}
