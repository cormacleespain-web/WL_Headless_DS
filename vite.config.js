import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, handle POST /api/generate-theme and POST /api/transcribe so the client can call OpenAI without CORS.
function openaiProxyPlugin(openaiKey) {
  return {
    name: 'openai-theme-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'POST') return next();
        const isTranscribe = req.url === '/api/transcribe';
        const isGeneratePage = req.url === '/api/generate-page';
        if (req.url !== '/api/generate-theme' && !isTranscribe && !isGeneratePage) return next();
        let data = '';
        req.on('data', (chunk) => { data += chunk; });
        req.on('end', async () => {
          if (isTranscribe) {
            try {
              const body = JSON.parse(data || '{}');
              const { audioBase64, mimeType = 'audio/webm' } = body;
              if (!audioBase64 || typeof audioBase64 !== 'string') {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Missing audioBase64' }));
                return;
              }
              if (!openaiKey) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'OPENAI_API_KEY not set in .env' }));
                return;
              }
              const buffer = Buffer.from(audioBase64, 'base64');
              const formData = new FormData();
              const blob = new Blob([buffer], { type: mimeType });
              formData.append('file', blob, 'audio.webm');
              formData.append('model', 'whisper-1');
              const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: { Authorization: `Bearer ${openaiKey}` },
                body: formData,
              });
              const result = await response.json().catch(() => ({}));
              res.setHeader('Content-Type', 'application/json');
              if (!response.ok) {
                res.statusCode = response.status >= 400 ? response.status : 500;
                res.end(JSON.stringify({ error: result?.error?.message || result?.error || `Whisper ${response.status}` }));
                return;
              }
              const text = typeof result?.text === 'string' ? result.text.trim() : '';
              res.statusCode = 200;
              res.end(JSON.stringify({ text }));
            } catch (e) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: e?.message || 'Transcription failed' }));
            }
            return;
          }
          if (isGeneratePage) {
            try {
              const body = JSON.parse(data || '{}');
              const { prompt, imageBase64, imageMimeType } = body;
              const hasImage = imageBase64 && typeof imageBase64 === 'string';
              const hasPrompt = typeof prompt === 'string' && prompt.trim().length > 0;
              if (!hasPrompt && !hasImage) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Missing prompt or image. Provide a text description and/or upload an image.' }));
                return;
              }
              const userText = hasPrompt ? prompt.trim() : (hasImage ? 'Create a page design that matches this image. Use our Radix UI component library and theme.' : '');
              const userContent = hasImage
                ? [
                    { type: 'text', text: userText },
                    { type: 'image_url', image_url: { url: `data:${imageMimeType || 'image/jpeg'};base64,${imageBase64}` } },
                  ]
                : userText;
              if (!openaiKey) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'OPENAI_API_KEY not set in .env' }));
                return;
              }
              const PAGE_BUILDER_SYSTEM = `You are a UI code generator. Respond with ONLY valid JSON, no markdown.
Generate a UI tree for React and Radix UI Themes. Return one JSON object: { "component": "Box", "props": { "p": "4" }, "children": [ ... ] }
Allowed components: Box, Flex, Heading, Text, Button, Card, Badge, Separator, TextField, TextArea, Avatar, Progress, Spinner, Link, Code, Strong, Em, Callout, Blockquote, ScrollArea, Inset, Kbd, Skeleton, Switch, Slider.
children: array of UI tree objects or strings. props: Radix props (size, color, variant, p, gap, direction, align, justify, etc). Use theme tokens in style when needed: var(--wz-color-semantic-fg-default). Keep tree small. If the user provides an image, describe the layout and components you see and replicate it with the allowed components.`;
              const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
                body: JSON.stringify({
                  model: 'gpt-4o-mini',
                  messages: [{ role: 'system', content: PAGE_BUILDER_SYSTEM }, { role: 'user', content: userContent }],
                  temperature: 0.2,
                }),
              });
              const result = await response.json();
              res.setHeader('Content-Type', 'application/json');
              if (!response.ok) {
                res.statusCode = response.status;
                res.end(JSON.stringify({ error: result?.error?.message || `OpenAI ${response.status}` }));
                return;
              }
              let content = (result.choices?.[0]?.message?.content ?? '').trim();
              const codeMatch = content.match(/^```(?:json)?\s*([\s\S]*?)```$/m);
              if (codeMatch) content = codeMatch[1].trim();
              res.statusCode = 200;
              res.end(JSON.stringify({ content }));
            } catch (e) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: e?.message || 'OpenAI request failed' }));
            }
            return;
          }
          try {
            const body = JSON.parse(data || '{}');
            const { prompt, systemPrompt, model = 'gpt-4o-mini', imageBase64, imageMimeType } = body;
            if (!systemPrompt) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing systemPrompt' }));
              return;
            }
            const hasImage = imageBase64 && typeof imageBase64 === 'string';
            const userText = (typeof prompt === 'string' ? prompt : '') || (hasImage ? 'Create a theme inspired by this image.' : '');
            if (!userText && !hasImage) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing prompt or image' }));
              return;
            }
            const userContent = hasImage
              ? [
                  { type: 'text', text: userText },
                  { type: 'image_url', image_url: { url: `data:${imageMimeType || 'image/jpeg'};base64,${imageBase64}` } },
                ]
              : userText;
            if (!openaiKey) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'OPENAI_API_KEY not set in .env' }));
              return;
            }
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
              body: JSON.stringify({
                model: hasImage ? (model.includes('vision') ? model : 'gpt-4o-mini') : model,
                messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
                temperature: 0.3,
              }),
            });
            const result = await response.json();
            res.setHeader('Content-Type', 'application/json');
            if (!response.ok) {
              res.statusCode = response.status;
              res.end(JSON.stringify({ error: result?.error?.message || `OpenAI ${response.status}` }));
              return;
            }
            res.statusCode = 200;
            res.end(JSON.stringify({ content: result.choices?.[0]?.message?.content ?? '' }));
          } catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e?.message || 'OpenAI request failed' }));
          }
        });
      });
    },
  };
}

// Vite configuration for the Radix UI demo app.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const openaiKey = (env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY || '').trim();
  return {
    plugins: [react(), openaiProxyPlugin(openaiKey)],
    server: {
      port: 5173,
      open: true,
      proxy: {
        '/api/ollama': {
          target: 'http://localhost:11434',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/ollama/, ''),
        },
      },
    },
  };
});