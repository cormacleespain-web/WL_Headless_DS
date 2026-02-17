# WL Headless DS

Radix UI demo with theme generator and AI-powered theme suggestions (OpenAI or Ollama).

## Run locally

```bash
npm install
npm run dev
```

Set `OPENAI_API_KEY` or `VITE_OPENAI_API_KEY` in `.env` for AI theme generation. See `.env.example`.

## Deploy (Vercel)

1. Connect this repo to Vercel.
2. Add **Environment Variable**: `OPENAI_API_KEY` = your OpenAI API key (Production + Preview).
3. Deploy. The `api/` serverless function and `vercel.json` rewrites are configured for the SPA.

## Build

```bash
npm run build
```

Output: `dist/`
