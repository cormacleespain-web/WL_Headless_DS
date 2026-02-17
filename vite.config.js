import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, handle POST /api/generate-theme so the client can call OpenAI without CORS (key stays server-side).
function openaiProxyPlugin(openaiKey) {
  return {
    name: 'openai-theme-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== '/api/generate-theme' || req.method !== 'POST') return next();
        let data = '';
        req.on('data', (chunk) => { data += chunk; });
        req.on('end', async () => {
          try {
            const body = JSON.parse(data || '{}');
            const { prompt, systemPrompt, model = 'gpt-4o-mini' } = body;
            if (!prompt || !systemPrompt) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing prompt or systemPrompt' }));
              return;
            }
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
                model,
                messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
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