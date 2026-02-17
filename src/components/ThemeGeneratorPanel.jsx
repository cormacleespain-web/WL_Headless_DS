import React, { useCallback, useState, useEffect } from 'react';
import { useTheme, ALLOWED_GOOGLE_FONTS, FONT_WEIGHT_OPTIONS, FONT_STYLE_OPTIONS } from '../theme/ThemeContext.jsx';
import {
  Box,
  Flex,
  Text,
  Button,
  IconButton,
  Select,
  Tabs,
  Tooltip,
  ScrollArea,
  Dialog,
  TextField,
} from '@radix-ui/themes';
import {
  Cross2Icon,
  CopyIcon,
  RotateCounterClockwiseIcon,
  TrackNextIcon,
  ResetIcon,
  SunIcon,
  MoonIcon,
  FileTextIcon,
  ShuffleIcon,
  MixerHorizontalIcon,
  HandIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  StarIcon,
  ImageIcon,
  UploadIcon,
  ChatBubbleIcon,
  SpeakerLoudIcon,
} from '@radix-ui/react-icons';

const ACCENT_OPTIONS = [
  'gray', 'gold', 'bronze', 'brown', 'yellow', 'amber', 'orange', 'tomato',
  'red', 'ruby', 'crimson', 'pink', 'plum', 'purple', 'violet', 'iris',
  'indigo', 'blue', 'cyan', 'teal', 'jade', 'green', 'grass', 'lime', 'mint', 'sky',
];
const GRAY_OPTIONS = ['auto', 'gray', 'mauve', 'slate', 'sage', 'olive', 'sand'];
const RADIUS_OPTIONS = ['none', 'small', 'medium', 'large', 'full'];
const SCALING_OPTIONS = ['90%', '95%', '100%', '105%', '110%'];
const PANEL_OPTIONS = ['solid', 'translucent'];
const MAX_HISTORY = 20;
const GOOGLE_FONTS = ALLOWED_GOOGLE_FONTS;

// AI backend: OpenAI via same-origin proxy (no key in browser; avoids CORS), then Ollama (local).
// Proxy: in dev Vite middleware handles /api/generate-theme; on Vercel use api/generate-theme.js. Set OPENAI_API_KEY in .env (server-side).
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const OPENAI_MODEL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENAI_MODEL) || 'gpt-4o-mini';
const OPENAI_PROXY_URL = '/api/generate-theme';

// Ollama: In dev we use the Vite proxy (/api/ollama -> localhost:11434). Set VITE_OLLAMA_URL to override.
const OLLAMA_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OLLAMA_URL) ||
  (isDev ? '/api/ollama' : 'http://localhost:11434');
const OLLAMA_MODEL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OLLAMA_MODEL) || 'llama3.1:latest';
const USE_OLLAMA = (typeof import.meta === 'undefined' || import.meta.env?.VITE_USE_OLLAMA !== 'false');

const EXAMPLE_THEME_JSON = {
  appearance: 'light',
  accentColor: 'red',
  grayColor: 'auto',
  radius: 'medium',
  scaling: '100%',
  panelBackground: 'translucent',
};

function validateThemeFile(data) {
  const errors = [];
  let obj = null;
  if (data == null || typeof data !== 'object') {
    errors.push('File must be a JSON object (e.g. { "appearance": "light", "accentColor": "red", ... }).');
    return { valid: false, config: null, errors };
  }
  obj = data;
  if (typeof obj.appearance !== 'string') {
    errors.push('Missing or invalid "appearance". Use "light" or "dark".');
  } else if (!['light', 'dark', 'inherit'].includes(obj.appearance)) {
    errors.push(`Invalid "appearance": "${obj.appearance}". Use "light", "dark", or "inherit".`);
  }
  if (typeof obj.accentColor !== 'string') {
    errors.push('Missing or invalid "accentColor". Use one of: ' + ACCENT_OPTIONS.slice(0, 5).join(', ') + ', ...');
  } else if (!ACCENT_OPTIONS.includes(obj.accentColor)) {
    errors.push(`Invalid "accentColor": "${obj.accentColor}". Must be one of the supported accent names.`);
  }
  if (obj.grayColor != null && !GRAY_OPTIONS.includes(obj.grayColor)) {
    errors.push(`Invalid "grayColor": "${obj.grayColor}". Use one of: ${GRAY_OPTIONS.join(', ')}.`);
  }
  if (obj.radius != null && !RADIUS_OPTIONS.includes(obj.radius)) {
    errors.push(`Invalid "radius": "${obj.radius}". Use one of: ${RADIUS_OPTIONS.join(', ')}.`);
  }
  if (obj.scaling != null && !SCALING_OPTIONS.includes(obj.scaling)) {
    errors.push(`Invalid "scaling": "${obj.scaling}". Use one of: ${SCALING_OPTIONS.join(', ')}.`);
  }
  if (obj.panelBackground != null && !PANEL_OPTIONS.includes(obj.panelBackground)) {
    errors.push(`Invalid "panelBackground": "${obj.panelBackground}". Use "solid" or "translucent".`);
  }
  if (obj.fontFamily != null && obj.fontFamily !== '' && !GOOGLE_FONTS.includes(obj.fontFamily)) {
    errors.push(`Invalid "fontFamily": "${obj.fontFamily}". Use one of: ${GOOGLE_FONTS.slice(0, 8).join(', ')}, ...`);
  }
  const validWeights = [300, 400, 500, 600, 700];
  if (obj.fontWeight != null && !validWeights.includes(Number(obj.fontWeight))) {
    errors.push(`Invalid "fontWeight": use one of ${validWeights.join(', ')}.`);
  }
  if (obj.fontStyle != null && !['normal', 'italic'].includes(obj.fontStyle)) {
    errors.push('Invalid "fontStyle": use "normal" or "italic".');
  }
  if (errors.length > 0) return { valid: false, config: null, errors };
  const config = {
    appearance: obj.appearance === 'dark' ? 'dark' : obj.appearance === 'inherit' ? 'inherit' : 'light',
    accentColor: obj.accentColor,
    grayColor: GRAY_OPTIONS.includes(obj.grayColor) ? obj.grayColor : 'auto',
    radius: RADIUS_OPTIONS.includes(obj.radius) ? obj.radius : 'medium',
    scaling: SCALING_OPTIONS.includes(obj.scaling) ? obj.scaling : '100%',
    panelBackground: PANEL_OPTIONS.includes(obj.panelBackground) ? obj.panelBackground : 'translucent',
    fontFamily: obj.fontFamily && GOOGLE_FONTS.includes(obj.fontFamily) ? obj.fontFamily : undefined,
    fontWeight: obj.fontWeight != null && validWeights.includes(Number(obj.fontWeight)) ? Number(obj.fontWeight) : 400,
    fontStyle: obj.fontStyle === 'italic' ? 'italic' : 'normal',
  };
  return { valid: true, config, errors: [] };
}

function configEquals(a, b) {
  if (!a || !b) return false;
  return (
    a.appearance === b.appearance &&
    a.accentColor === b.accentColor &&
    (a.grayColor ?? 'auto') === (b.grayColor ?? 'auto') &&
    (a.radius ?? 'medium') === (b.radius ?? 'medium') &&
    (a.scaling ?? '100%') === (b.scaling ?? '100%') &&
    (a.panelBackground ?? 'translucent') === (b.panelBackground ?? 'translucent') &&
    (a.fontFamily ?? '') === (b.fontFamily ?? '') &&
    (a.fontWeight ?? 400) === (b.fontWeight ?? 400) &&
    (a.fontStyle ?? 'normal') === (b.fontStyle ?? 'normal')
  );
}

function findMatchingTheme(themeList, config) {
  return themeList.find((t) => configEquals(t.config, config));
}

/** Extract JSON from model output (handles ```json ... ``` or raw JSON). */
function extractThemeJson(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = codeBlock ? codeBlock[1].trim() : trimmed;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getThemeGeneratorSystemPrompt() {
  return `You are a theme generator. Reply with ONLY a JSON object (no other text) with these exact keys and allowed values:
- "appearance": "light" or "dark"
- "accentColor": one of: ${ACCENT_OPTIONS.join(', ')}
- "grayColor": one of: ${GRAY_OPTIONS.join(', ')}
- "radius": one of: ${RADIUS_OPTIONS.join(', ')}
- "scaling": one of: ${SCALING_OPTIONS.join(', ')}
- "panelBackground": "solid" or "translucent"
- "fontFamily": exactly one of these Google Fonts (pick one that fits the user's mood/style): ${GOOGLE_FONTS.join(', ')}
- "fontWeight": one of 300, 400, 500, 600, 700 (300=Light, 400=Regular, 500=Medium, 600=Semi Bold, 700=Bold)
- "fontStyle": "normal" or "italic"
Interpret the user's description and choose a font and variant that matches. Return valid JSON only.`;
}

/** Call same-origin proxy to OpenAI (avoids CORS; key stays server-side). Returns { config } or { error: string }. */
async function fetchThemeViaOpenAIProxy(promptText) {
  if (!promptText || promptText === '(Image or file)') return { error: 'disabled' };
  const systemPrompt = getThemeGeneratorSystemPrompt();
  try {
    const res = await fetch(OPENAI_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptText, systemPrompt, model: OPENAI_MODEL }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = data?.error || `OpenAI proxy ${res.status}`;
      console.error('[AI theme]', err);
      return { error: err };
    }
    const content = data.content;
    const obj = extractThemeJson(content);
    if (!obj) {
      console.error('[AI theme] OpenAI response had no valid theme JSON. Raw:', content?.slice(0, 200));
      return { error: 'Model did not return valid theme JSON' };
    }
    const { valid, config } = validateThemeFile(obj);
    if (!valid) {
      console.error('[AI theme] Theme validation failed:', config, obj);
      return { error: 'Theme validation failed' };
    }
    return { config };
  } catch (e) {
    const err = e?.message || String(e) || 'Network error';
    console.error('[AI theme]', err, e);
    return { error: err };
  }
}

/** Call local Ollama to generate a theme config. Returns { config } or { error: string }. */
async function fetchThemeFromOllama(promptText) {
  if (!USE_OLLAMA || !promptText || promptText === '(Image or file)') return { error: 'disabled' };
  const systemPrompt = getThemeGeneratorSystemPrompt();
  const url = `${OLLAMA_URL.replace(/\/$/, '')}/api/chat`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: promptText },
        ],
        stream: false,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      const err = `Ollama ${res.status}${errText ? `: ${errText.slice(0, 80)}` : ''}`;
      console.error('[AI theme]', err);
      return { error: err };
    }
    const data = await res.json();
    const content = data.message?.content;
    const obj = extractThemeJson(content);
    if (!obj) {
      console.error('[AI theme] Ollama response had no valid theme JSON. Raw:', content?.slice(0, 200));
      return { error: 'Model did not return valid theme JSON' };
    }
    const { valid, config } = validateThemeFile(obj);
    if (!valid) {
      console.error('[AI theme] Theme validation failed:', config, obj);
      return { error: 'Theme validation failed' };
    }
    return { config };
  } catch (e) {
    const err = e?.message || String(e) || 'Network error';
    console.error('[AI theme]', err, e);
    return { error: err };
  }
}

export default function ThemeGeneratorPanel({ onClose, open }) {
  const { theme, setTheme, setThemeConfig, addCustomTheme, defaultThemes, myThemes } = useTheme();
  const config = theme?.config || {};
  const defaults = Array.isArray(defaultThemes) ? defaultThemes : [];
  const mine = Array.isArray(myThemes) ? myThemes : [];
  const allThemes = [...defaults, ...mine];
  const currentMatch = findMatchingTheme(allThemes, config);
  const currentThemeLabel = currentMatch ? currentMatch.name : 'Custom';
  const selectValue = currentMatch ? currentMatch.id : '__custom__';

  const [activeTab, setActiveTab] = useState('colors');
  const [copyStatus, setCopyStatus] = useState('idle');
  const [contrastCount] = useState(0);
  const [expandedSections, setExpandedSections] = useState({ themeColors: true, other: false });
  const [historyState, setHistoryState] = useState({ history: [], index: -1 });
  const { history, index: historyIndex } = historyState;
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveThemeName, setSaveThemeName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importDragOver, setImportDragOver] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importThemeName, setImportThemeName] = useState('');
  const [importThemeAccent, setImportThemeAccent] = useState(config.accentColor);
  const [importErrorAccordionOpen, setImportErrorAccordionOpen] = useState(false);
  const importFileInputRef = React.useRef(null);

  const [aiMode, setAiMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessages, setAiMessages] = useState([]);
  const [aiGeneratedConfig, setAiGeneratedConfig] = useState(null);
  const [aiRefineConfig, setAiRefineConfig] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSaveDialogOpen, setAiSaveDialogOpen] = useState(false);
  const [aiSaveName, setAiSaveName] = useState('');
  const [aiSaveSuccess, setAiSaveSuccess] = useState(false);
  const [aiRefineExpanded, setAiRefineExpanded] = useState(false);
  const [aiFileDropOver, setAiFileDropOver] = useState(false);
  const [aiVoiceListening, setAiVoiceListening] = useState(false);
  const aiFileInputRef = React.useRef(null);
  const speechRecognitionRef = React.useRef(null);

  const pushHistory = useCallback(() => {
    setHistoryState(({ history: h, index: i }) => {
      const snapshot = { ...config };
      const next = h.slice(0, i + 1);
      next.push(snapshot);
      const out = next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
      return { history: out, index: out.length - 1 };
    });
  }, [config]);

  const applyConfig = useCallback((nextConfig) => {
    setThemeConfig(nextConfig);
  }, [setThemeConfig]);

  const handleUndo = useCallback(() => {
    if (historyIndex < 0) return;
    applyConfig(history[historyIndex]);
    setHistoryState((s) => ({ ...s, index: historyIndex - 1 }));
  }, [applyConfig, history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    applyConfig(next);
    setHistoryState((s) => ({ ...s, index: historyIndex + 1 }));
  }, [applyConfig, history, historyIndex]);

  const update = useCallback((partial) => {
    const fullNext = { ...config, ...partial };
    if (configEquals(config, fullNext)) return;
    pushHistory();
    setThemeConfig(partial);
  }, [config, pushHistory, setThemeConfig]);

  const handleCopy = useCallback(async () => {
    const str = JSON.stringify({
      appearance: config.appearance,
      accentColor: config.accentColor,
      grayColor: config.grayColor ?? 'auto',
      radius: config.radius ?? 'medium',
      scaling: config.scaling ?? '100%',
      panelBackground: config.panelBackground ?? 'translucent',
    }, null, 2);
    await navigator.clipboard.writeText(str);
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  }, [config]);

  const handleReset = useCallback(() => {
    pushHistory();
    setTheme(defaultThemes[0]);
  }, [config, defaultThemes, setTheme, pushHistory]);

  const handleRandom = useCallback(() => {
    pushHistory();
    const appearance = Math.random() > 0.5 ? 'dark' : 'light';
    const accentColor = ACCENT_OPTIONS[Math.floor(Math.random() * ACCENT_OPTIONS.length)];
    const grayColor = GRAY_OPTIONS[Math.floor(Math.random() * GRAY_OPTIONS.length)];
    const radius = RADIUS_OPTIONS[Math.floor(Math.random() * RADIUS_OPTIONS.length)];
    const scaling = SCALING_OPTIONS[Math.floor(Math.random() * SCALING_OPTIONS.length)];
    const panelBackground = PANEL_OPTIONS[Math.floor(Math.random() * PANEL_OPTIONS.length)];
    applyConfig({ appearance, accentColor, grayColor, radius, scaling, panelBackground });
  }, [config, pushHistory, applyConfig]);

  const handleImportClick = useCallback(() => {
    setImportDialogOpen(true);
    setImportResult(null);
    setImportThemeName('');
    setImportThemeAccent(config.accentColor);
    setImportErrorAccordionOpen(false);
  }, [config.accentColor]);

  const downloadExampleTheme = useCallback(() => {
    const blob = new Blob([JSON.stringify(EXAMPLE_THEME_JSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'theme-example.json';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const processImportFile = useCallback((file) => {
    if (!file || !file.name.toLowerCase().endsWith('.json')) {
      setImportResult({ valid: false, config: null, errors: ['Please upload a .json file.'] });
      setImportErrorAccordionOpen(true);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const result = validateThemeFile(parsed);
        setImportResult(result);
        if (result.valid) {
          setImportThemeName('');
          setImportThemeAccent(result.config.accentColor);
          setImportErrorAccordionOpen(false);
        } else {
          setImportErrorAccordionOpen(true);
        }
      } catch (e) {
        setImportResult({ valid: false, config: null, errors: ['Invalid JSON: ' + (e.message || 'Could not parse file.')] });
        setImportErrorAccordionOpen(true);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleImportDrop = useCallback((e) => {
    e.preventDefault();
    setImportDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) processImportFile(file);
  }, [processImportFile]);

  const handleImportFileSelect = useCallback((e) => {
    const file = e.target?.files?.[0];
    if (file) processImportFile(file);
    e.target.value = '';
  }, [processImportFile]);

  const handleImportSaveTheme = useCallback(() => {
    if (!importResult?.valid || !importResult.config) return;
    const name = importThemeName.trim() || `Imported ${new Date().toLocaleDateString()}`;
    addCustomTheme({
      id: `imported-${Date.now()}`,
      name,
      config: { ...importResult.config, accentColor: importThemeAccent },
    });
    setImportDialogOpen(false);
    setImportResult(null);
  }, [importResult, importThemeName, importThemeAccent, addCustomTheme]);

  const handleImportDialogOpenChange = useCallback((open) => {
    setImportDialogOpen(open);
    if (!open) setImportResult(null);
  }, []);

  const handleContrast = useCallback(() => {
    // Placeholder: in future could run contrast checks and show count
    window.alert('Contrast check: Not implemented yet. Will highlight low-contrast pairs.');
  }, []);

  const handleSaveThemeDoubleClick = useCallback(() => {
    setSaveThemeName(`My theme ${new Date().toLocaleDateString()}`);
    setSaveSuccess(false);
    setSaveDialogOpen(true);
  }, []);

  const handleSaveThemeSubmit = useCallback(() => {
    const name = saveThemeName.trim() || `My theme ${new Date().toLocaleTimeString()}`;
    addCustomTheme({ id: `saved-${Date.now()}`, name, config: { ...config } });
    setSaveSuccess(true);
    setSaveThemeName(name);
  }, [config, addCustomTheme, saveThemeName]);

  const handleSaveDialogOpenChange = useCallback((open) => {
    setSaveDialogOpen(open);
    if (!open) {
      setSaveSuccess(false);
    }
  }, []);

  // AI Mode: fallback theme generation from prompt keywords (used when Ollama is off or fails)
  const generateThemeFromPrompt = useCallback((promptText) => {
    const lower = (promptText || '').toLowerCase();
    const appearance = /\b(dark|night|black)\b/.test(lower) ? 'dark' : /\b(light|bright|white)\b/.test(lower) ? 'light' : (Math.random() > 0.5 ? 'dark' : 'light');
    const accentMatch = ACCENT_OPTIONS.find((c) => lower.includes(c));
    const accentColor = accentMatch || ACCENT_OPTIONS[Math.floor(Math.random() * ACCENT_OPTIONS.length)];
    const radius = /\b(sharp|square|none)\b/.test(lower) ? 'none' : /\b(round|rounded|large|full)\b/.test(lower) ? 'large' : 'medium';
    const scaling = /\b(big|large|110)\b/.test(lower) ? '110%' : /\b(small|90)\b/.test(lower) ? '90%' : '100%';
    const fontByMood = [
      { keywords: /\b(elegant|classic|serif|editorial)\b/, font: 'Playfair Display' },
      { keywords: /\b(modern|clean|minimal|tech)\b/, font: 'Inter' },
      { keywords: /\b(friendly|soft|rounded|warm)\b/, font: 'Nunito' },
      { keywords: /\b(professional|corporate|neutral)\b/, font: 'Source Sans 3' },
      { keywords: /\b(bold|strong|impact)\b/, font: 'Oswald' },
      { keywords: /\b(playful|fun|quirky)\b/, font: 'Quicksand' },
    ];
    const fontMatch = fontByMood.find((f) => f.keywords.test(lower));
    const fontFamily = fontMatch ? fontMatch.font : GOOGLE_FONTS[Math.floor(Math.random() * Math.min(12, GOOGLE_FONTS.length))];
    const fontWeight = /\b(bold|heavy|strong)\b/.test(lower) ? 700 : /\b(light|thin)\b/.test(lower) ? 300 : 400;
    const fontStyle = /\b(italic|slant)\b/.test(lower) ? 'italic' : 'normal';
    return {
      appearance,
      accentColor,
      grayColor: config.grayColor ?? 'auto',
      radius,
      scaling,
      panelBackground: config.panelBackground ?? 'translucent',
      fontFamily,
      fontWeight,
      fontStyle,
    };
  }, [config.grayColor, config.panelBackground]);

  const handleAiSend = useCallback(async (overridePrompt) => {
    const text = (overridePrompt ?? (aiPrompt || '')).trim() || '(Image or file)';
    setAiMessages((m) => [...m, { role: 'user', content: text }]);
    if (!overridePrompt) setAiPrompt('');
    setAiLoading(true);
    const hasNewPrompt = text !== '(Image or file)' && text.length > 0;
    let nextConfig = null;
    let source = 'refine'; // 'openai' | 'ollama' | 'fallback' | 'refine'
    let ollamaError = null;
    if (hasNewPrompt) {
      // Try OpenAI via proxy first (same-origin; no CORS; key on server)
      const openaiResult = await fetchThemeViaOpenAIProxy(text);
      if (openaiResult.config) {
        nextConfig = openaiResult.config;
        source = 'openai';
      } else if (openaiResult.error && openaiResult.error !== 'disabled') {
        ollamaError = openaiResult.error;
      }
      if (!nextConfig && USE_OLLAMA) {
        const result = await fetchThemeFromOllama(text);
        if (result.config) {
          nextConfig = result.config;
          source = 'ollama';
        } else if (result.error && result.error !== 'disabled') {
          ollamaError = result.error;
        }
      }
      if (!nextConfig) {
        nextConfig = generateThemeFromPrompt(text);
        source = 'fallback';
      }
    }
    if (!nextConfig) {
      nextConfig = aiRefineConfig ? { ...aiRefineConfig } : generateThemeFromPrompt('custom');
      if (!aiRefineConfig) source = 'fallback';
    }
    setAiGeneratedConfig(nextConfig);
    setAiRefineConfig(nextConfig);
    const summary = `${nextConfig.appearance}, accent ${nextConfig.accentColor}, radius ${nextConfig.radius}`;
    const fallbackReason = ollamaError ? ` (${ollamaError})` : '';
    const weightLabel = FONT_WEIGHT_OPTIONS.find((o) => o.value === (nextConfig.fontWeight ?? 400))?.label || 'Regular';
    const fontNote = nextConfig.fontFamily
      ? `, ${nextConfig.fontFamily} ${weightLabel}${(nextConfig.fontStyle ?? 'normal') === 'italic' ? ' italic' : ''} for type`
      : '';
    const conversationalReply = `I went with a ${nextConfig.appearance} theme, ${nextConfig.accentColor} accent, and ${nextConfig.radius} radius${fontNote}. Want to tweak anything, or save it as is?`;
    const assistantContent =
      source === 'openai'
        ? `Generated with OpenAI. ${conversationalReply}`
        : source === 'ollama'
          ? `Generated with Ollama. ${conversationalReply}`
          : source === 'fallback'
            ? `Generated (local suggestion): ${summary}. Refine below and save when ready.${fallbackReason}`
            : `Using your theme. Refine below and save when ready.`;
    setAiMessages((m) => [...m, { role: 'assistant', content: assistantContent }]);
    setAiRefineExpanded(false);
    setAiLoading(false);
  }, [aiPrompt, aiRefineConfig, generateThemeFromPrompt]);

  const handleAiReset = useCallback(() => {
    setAiMessages([]);
    setAiPrompt('');
    setAiRefineConfig(null);
    setAiGeneratedConfig(null);
    setAiRefineExpanded(false);
  }, []);

  const handleAiRefineUpdate = useCallback((partial) => {
    setAiRefineConfig((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  const handleAiVoiceClick = useCallback(() => {
    const SpeechRecognitionAPI = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognitionAPI) {
      window.alert('Voice input is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    if (aiVoiceListening) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setAiVoiceListening(false);
      return;
    }
    try {
      if (!speechRecognitionRef.current) {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onresult = (event) => {
          let segment = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) segment += result[0].transcript;
          }
          if (segment.trim()) {
            setAiPrompt((prev) => (prev ? `${prev} ${segment.trim()}` : segment.trim()));
          }
        };
        recognition.onend = () => setAiVoiceListening(false);
        recognition.onerror = (event) => {
          if (event.error !== 'aborted') setAiVoiceListening(false);
        };
        speechRecognitionRef.current = recognition;
      }
      speechRecognitionRef.current.start();
      setAiVoiceListening(true);
    } catch (err) {
      setAiVoiceListening(false);
      window.alert('Could not start voice input. Check microphone permission.');
    }
  }, [aiVoiceListening]);

  useEffect(() => {
    if (aiMode && aiRefineConfig) setThemeConfig(aiRefineConfig);
  }, [aiMode, aiRefineConfig, setThemeConfig]);

  const handleAiSaveTheme = useCallback(() => {
    const name = aiSaveName.trim() || `AI theme ${new Date().toLocaleDateString()}`;
    if (!aiRefineConfig) return;
    addCustomTheme({ id: `ai-${Date.now()}`, name, config: aiRefineConfig });
    setAiSaveSuccess(true);
    setAiSaveName(name);
  }, [aiRefineConfig, aiSaveName, addCustomTheme]);

  const canUndo = history.length > 0 && historyIndex >= 0;
  const canRedo = history.length > 0 && historyIndex < history.length - 1;

  if (!open) return null;

  const toggleSection = (key) => {
    setExpandedSections((s) => ({ ...s, [key]: !s[key] }));
  };

  return (
    <Box
      className={aiMode ? 'theme-panel theme-panel-ai-mode' : 'theme-panel'}
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        bottom: 20,
        zIndex: 10,
        width: 280,
        background: 'var(--color-panel-solid)',
        border: '1px solid var(--gray-a5)',
        borderRadius: 16,
        padding: '16px 12px',
        boxShadow: '0 4px 24px var(--gray-a5)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      {/* Header: Back (in AI mode) + Title + Close */}
      <Flex justify="between" align="center" mb="3" gap="2">
        <Flex align="center" gap="2" style={{ minWidth: 0, flex: 1 }}>
          {aiMode && (
            <Tooltip content="Back to Theme Generator">
              <IconButton variant="ghost" size="1" aria-label="Back" onClick={() => setAiMode(false)}>
                <ChevronLeftIcon width={14} height={14} />
              </IconButton>
            </Tooltip>
          )}
          <Text size="3" weight="bold" style={{ flexShrink: 0 }}>Theme Generator</Text>
        </Flex>
        {onClose && (
          <IconButton variant="ghost" size="1" aria-label="Close" onClick={onClose}>
            <Cross2Icon width={14} height={14} />
          </IconButton>
        )}
      </Flex>

      {aiMode ? (
        /* AI Mode: chat, prompt (text / image / voice / file), generated tokens, refine, save */
        <Flex direction="column" gap="3" style={{ flex: 1, minHeight: 0 }} className="theme-panel-ai-content">
          <ScrollArea style={{ flex: 1, minHeight: 120 }} className="theme-panel-scroll">
            <Flex direction="column" gap="2" style={{ paddingRight: 8 }}>
              {aiMessages.length === 0 && (
                <Text size="2" color="gray">Describe your theme (e.g. &quot;dark blue, rounded&quot;) or attach an image or file. I&apos;ll suggest Colors, Typography and Other tokens.</Text>
              )}
              {aiMessages.map((msg, i) => (
                <Box
                  key={i}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: msg.role === 'user' ? 'var(--accent-a3)' : 'var(--gray-a3)',
                    border: '1px solid var(--gray-a5)',
                  }}
                >
                  <Text size="2">{msg.content}</Text>
                </Box>
              ))}
              {aiLoading && (
                <Box
                  className="theme-panel-ai-skeleton"
                  style={{
                    alignSelf: 'flex-start',
                    maxWidth: '100%',
                    padding: '12px 14px',
                    border: '1px solid var(--gray-a5)',
                    minHeight: 56,
                  }}
                  aria-busy="true"
                  aria-label="Generating theme"
                >
                  <Box style={{ height: 8, borderRadius: 4, marginBottom: 8, width: '100%', background: 'var(--gray-a5)', opacity: 0.7 }} />
                  <Box style={{ height: 8, borderRadius: 4, width: '75%', background: 'var(--gray-a5)', opacity: 0.5 }} />
                </Box>
              )}
            </Flex>
          </ScrollArea>

          {/* Generated theme: two CTAs, or expanded refine panel */}
          {aiRefineConfig && (
            <Box style={{ border: '1px solid var(--gray-a5)', borderRadius: 8, padding: 8, background: 'var(--gray-a2)' }}>
              {!aiRefineExpanded ? (
                <Flex gap="2" wrap="wrap">
                  <Button size="1" variant="soft" onClick={() => setAiRefineExpanded(true)}>
                    Refine
                  </Button>
                  <Button size="1" variant="solid" onClick={() => { setAiSaveDialogOpen(true); setAiSaveSuccess(false); setAiSaveName(''); }}>
                    Save theme
                  </Button>
                </Flex>
              ) : (
                <>
                  <Text size="1" weight="bold" color="gray" style={{ marginBottom: 6, display: 'block' }}>Generated theme — refine if needed</Text>
                  <Flex direction="column" gap="2">
                    <Flex direction="column" gap="1">
                      <Text size="1" color="gray">Colors</Text>
                      <Flex gap="1" wrap="wrap">
                        <Select.Root value={aiRefineConfig.accentColor} onValueChange={(v) => handleAiRefineUpdate({ accentColor: v })}>
                          <Select.Trigger size="1" style={{ minWidth: 80 }} />
                          <Select.Content>
                            {ACCENT_OPTIONS.map((c) => (
                              <Select.Item key={c} value={c}>{c}</Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Root>
                        <Select.Root value={aiRefineConfig.grayColor ?? 'auto'} onValueChange={(v) => handleAiRefineUpdate({ grayColor: v })}>
                          <Select.Trigger size="1" style={{ minWidth: 72 }} />
                          <Select.Content>
                            {GRAY_OPTIONS.map((g) => (
                              <Select.Item key={g} value={g}>{g}</Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Root>
                      </Flex>
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text size="1" color="gray">Typography</Text>
                      <Flex gap="1" wrap="wrap">
                        <Select.Root value={aiRefineConfig.fontFamily || '__system__'} onValueChange={(v) => handleAiRefineUpdate({ fontFamily: v === '__system__' ? undefined : v })}>
                          <Select.Trigger size="1" style={{ minWidth: 100 }} />
                          <Select.Content>
                            <Select.Item value="__system__">System font</Select.Item>
                            {GOOGLE_FONTS.map((f) => (
                              <Select.Item key={f} value={f}>{f}</Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Root>
                        <Select.Root value={String(aiRefineConfig.fontWeight ?? 400)} onValueChange={(v) => handleAiRefineUpdate({ fontWeight: Number(v) })}>
                          <Select.Trigger size="1" style={{ minWidth: 88 }} />
                          <Select.Content>
                            {FONT_WEIGHT_OPTIONS.map((o) => (
                              <Select.Item key={o.value} value={String(o.value)}>{o.label}</Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Root>
                        <Select.Root value={aiRefineConfig.fontStyle ?? 'normal'} onValueChange={(v) => handleAiRefineUpdate({ fontStyle: v })}>
                          <Select.Trigger size="1" style={{ minWidth: 72 }} />
                          <Select.Content>
                            {FONT_STYLE_OPTIONS.map((o) => (
                              <Select.Item key={o.value} value={o.value}>{o.label}</Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Root>
                        <Select.Root value={aiRefineConfig.scaling ?? '100%'} onValueChange={(v) => handleAiRefineUpdate({ scaling: v })}>
                          <Select.Trigger size="1" style={{ minWidth: 72 }} />
                          <Select.Content>
                            {SCALING_OPTIONS.map((s) => (
                              <Select.Item key={s} value={s}>{s}</Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Root>
                      </Flex>
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text size="1" color="gray">Other</Text>
                      <Flex gap="1" wrap="wrap">
                        <Select.Root value={aiRefineConfig.radius ?? 'medium'} onValueChange={(v) => handleAiRefineUpdate({ radius: v })}>
                          <Select.Trigger size="1" style={{ minWidth: 80 }} />
                          <Select.Content>
                            {RADIUS_OPTIONS.map((r) => (
                              <Select.Item key={r} value={r}>{r}</Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Root>
                        <Select.Root value={aiRefineConfig.panelBackground ?? 'translucent'} onValueChange={(v) => handleAiRefineUpdate({ panelBackground: v })}>
                          <Select.Trigger size="1" style={{ minWidth: 88 }} />
                          <Select.Content>
                            {PANEL_OPTIONS.map((p) => (
                              <Select.Item key={p} value={p}>{p}</Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Root>
                      </Flex>
                    </Flex>
                  </Flex>
                  <Button size="1" mt="2" style={{ width: '100%' }} onClick={() => { setAiSaveDialogOpen(true); setAiSaveSuccess(false); setAiSaveName(''); }}>Save theme</Button>
                </>
              )}
            </Box>
          )}

          {/* Prompt input + attach options */}
          <Flex direction="column" gap="2" style={{ flexShrink: 0 }}>
            <Box
              onDragOver={(e) => { e.preventDefault(); setAiFileDropOver(true); }}
              onDragLeave={() => setAiFileDropOver(false)}
              onDrop={(e) => { e.preventDefault(); setAiFileDropOver(false); const f = e.dataTransfer?.files?.[0]; if (f) handleAiSend(); }}
              style={{
                border: `2px dashed ${aiFileDropOver ? 'var(--accent-8)' : 'var(--gray-a6)'}`,
                borderRadius: 8,
                padding: 6,
                background: aiFileDropOver ? 'var(--accent-a2)' : 'var(--gray-a2)',
              }}
            >
              <TextField.Root
                placeholder="Describe your theme or drop a file…"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !aiLoading) { e.preventDefault(); handleAiSend(); } }}
                style={{ marginBottom: 6 }}
              />
              <Flex gap="1" wrap="wrap">
                <Button size="1" variant="soft" onClick={() => handleAiSend()} disabled={aiLoading}>
                  <ChatBubbleIcon width={14} height={14} style={{ marginRight: 4 }} />
                  {aiLoading ? 'Generating…' : 'Send'}
                </Button>
                <Tooltip content="Reset chat (theme stays until you send another query)">
                  <IconButton size="1" variant="soft" aria-label="Reset chat" onClick={handleAiReset}>
                    <ResetIcon width={14} height={14} />
                  </IconButton>
                </Tooltip>
                <Tooltip content="Upload image (theme inspiration)">
                  <IconButton size="1" variant="soft" onClick={() => aiFileInputRef.current?.click()}>
                    <ImageIcon width={14} height={14} />
                  </IconButton>
                </Tooltip>
                <Tooltip content="Upload or drop file">
                  <IconButton size="1" variant="soft" onClick={() => aiFileInputRef.current?.click()}>
                    <UploadIcon width={14} height={14} />
                  </IconButton>
                </Tooltip>
                <Tooltip content={aiVoiceListening ? 'Stop listening' : 'Start voice input'}>
                  <IconButton
                    size="1"
                    variant={aiVoiceListening ? 'solid' : 'soft'}
                    aria-label={aiVoiceListening ? 'Stop voice input' : 'Voice input'}
                    onClick={handleAiVoiceClick}
                    style={aiVoiceListening ? { animation: 'theme-panel-voice-pulse 1.2s ease-in-out infinite' } : undefined}
                  >
                    <SpeakerLoudIcon width={14} height={14} />
                  </IconButton>
                </Tooltip>
                <input ref={aiFileInputRef} type="file" accept="image/*,.json" style={{ display: 'none' }} onChange={() => handleAiSend('(File attached)')} />
              </Flex>
            </Box>
          </Flex>
        </Flex>
      ) : (
        <>
      {/* Actions: Copy, Undo, Redo, Reset */}
      <Flex gap="1" mb="3" wrap="wrap">
        <Tooltip content={copyStatus === 'copied' ? 'Copied!' : 'Copy theme JSON'}>
          <IconButton variant="soft" size="1" onClick={handleCopy} disabled={copyStatus === 'copying'}>
            <CopyIcon width={14} height={14} />
          </IconButton>
        </Tooltip>
        <Tooltip content="Undo">
          <IconButton variant="soft" size="1" onClick={handleUndo} disabled={!canUndo}>
            <RotateCounterClockwiseIcon width={14} height={14} />
          </IconButton>
        </Tooltip>
        <Tooltip content="Redo">
          <IconButton variant="soft" size="1" onClick={handleRedo} disabled={!canRedo}>
            <TrackNextIcon width={14} height={14} />
          </IconButton>
        </Tooltip>
        <Tooltip content="Reset to default theme">
          <IconButton variant="soft" size="1" onClick={handleReset}>
            <ResetIcon width={14} height={14} />
          </IconButton>
        </Tooltip>
      </Flex>

      {/* Mode: Light / Dark */}
      <Flex direction="column" gap="2" mb="3">
        <Text size="1" color="gray">Mode</Text>
        <Flex gap="1">
          <Button
            variant={config.appearance === 'light' ? 'solid' : 'soft'}
            size="1"
            style={{ flex: 1 }}
            onClick={() => update({ appearance: 'light' })}
          >
            <SunIcon width={14} height={14} style={{ marginRight: 4 }} />
            Light
          </Button>
          <Button
            variant={config.appearance === 'dark' ? 'solid' : 'soft'}
            size="1"
            style={{ flex: 1 }}
            onClick={() => update({ appearance: 'dark' })}
          >
            <MoonIcon width={14} height={14} style={{ marginRight: 4 }} />
            Dark
          </Button>
        </Flex>
      </Flex>

      {/* Themes: Import, Random, Contrast, Dropdown, Hold to save */}
      <Flex direction="column" gap="2" mb="3">
        <Text size="1" color="gray">Themes</Text>
        <Flex gap="1" wrap="wrap">
          <Tooltip content="Import theme from JSON file">
            <IconButton variant="soft" size="1" onClick={handleImportClick}>
              <FileTextIcon width={14} height={14} />
            </IconButton>
          </Tooltip>
          <Tooltip content="Random theme">
            <IconButton variant="soft" size="1" onClick={handleRandom}>
              <ShuffleIcon width={14} height={14} />
            </IconButton>
          </Tooltip>
          <Tooltip content="Check contrast">
            <IconButton variant="soft" size="1" onClick={handleContrast} style={{ position: 'relative' }}>
              <MixerHorizontalIcon width={14} height={14} />
              {contrastCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    minWidth: 14,
                    height: 14,
                    borderRadius: 7,
                    background: 'var(--red-9)',
                    color: 'white',
                    fontSize: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {contrastCount}
                </span>
              )}
            </IconButton>
          </Tooltip>
        </Flex>
        <Select.Root
          value={selectValue}
          onValueChange={(value) => {
            if (value === '__custom__') return;
            const t = allThemes.find((x) => x.id === value);
            if (t) {
              pushHistory();
              setTheme(t);
            }
          }}
        >
          <Select.Trigger style={{ width: '100%' }} />
          <Select.Content>
            {allThemes.map((t) => (
              <Select.Item key={t.id} value={t.id}>
                <Flex align="center" gap="2">
                  <Box
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 4,
                      background: `var(--${t.config.accentColor}-9)`,
                    }}
                  />
                  {t.name}
                </Flex>
              </Select.Item>
            ))}
            <Select.Item value="__custom__">Custom</Select.Item>
          </Select.Content>
        </Select.Root>
        <Tooltip content="Double-click to save current theme">
          <Button
            variant="soft"
            size="1"
            style={{ width: '100%' }}
            onDoubleClick={handleSaveThemeDoubleClick}
          >
            <HandIcon width={14} height={14} style={{ marginRight: 4 }} />
            Double-click to save theme
          </Button>
        </Tooltip>
      </Flex>

      <Dialog.Root open={saveDialogOpen} onOpenChange={handleSaveDialogOpenChange}>
        <Dialog.Content style={{ maxWidth: 340 }}>
          <Dialog.Title>Save theme</Dialog.Title>
          <Dialog.Description size="2" color="gray">
            {saveSuccess
              ? `Saved as "${saveThemeName}". You can find it in the theme dropdown above.`
              : 'Give this theme a name. It will appear in the theme dropdown above.'}
          </Dialog.Description>
          {!saveSuccess ? (
            <Flex direction="column" gap="3" mt="3">
              <TextField.Root
                placeholder="Theme name"
                value={saveThemeName}
                onChange={(e) => setSaveThemeName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveThemeSubmit();
                }}
              />
              <Flex gap="2" justify="end">
                <Dialog.Close>
                  <Button variant="soft" color="gray">Cancel</Button>
                </Dialog.Close>
                <Button onClick={handleSaveThemeSubmit}>Save</Button>
              </Flex>
            </Flex>
          ) : (
            <Flex justify="end" mt="3">
              <Dialog.Close>
                <Button>Done</Button>
              </Dialog.Close>
            </Flex>
          )}
        </Dialog.Content>
      </Dialog.Root>

      <Dialog.Root open={importDialogOpen} onOpenChange={handleImportDialogOpenChange}>
        <Dialog.Content style={{ maxWidth: 400 }}>
          <Dialog.Title>Import theme</Dialog.Title>
          <Dialog.Description size="2" color="gray">
            Upload a JSON theme file. Use the example below to see the correct format.
          </Dialog.Description>

          <Flex gap="2" mt="3">
            <Button variant="soft" size="2" onClick={downloadExampleTheme} style={{ flex: 1 }}>
              <FileTextIcon width={16} height={16} style={{ marginRight: 6 }} />
              Download example file
            </Button>
          </Flex>

          <Box
            mt="3"
            onDragOver={(e) => { e.preventDefault(); setImportDragOver(true); }}
            onDragLeave={() => setImportDragOver(false)}
            onDrop={handleImportDrop}
            style={{
              border: '2px dashed var(--gray-a6)',
              borderRadius: 12,
              padding: 24,
              textAlign: 'center',
              background: importDragOver ? 'var(--accent-a2)' : 'var(--gray-a2)',
              cursor: 'pointer',
            }}
            onClick={() => importFileInputRef.current?.click()}
          >
            <input
              ref={importFileInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleImportFileSelect}
            />
            <FileTextIcon width={32} height={32} style={{ margin: '0 auto 8px', display: 'block', color: 'var(--gray-11)' }} />
            <Text size="2" color="gray">Drop a JSON file here or click to browse</Text>
          </Box>

          {importResult && !importResult.valid && (
            <Box mt="3">
              <button
                type="button"
                onClick={() => setImportErrorAccordionOpen((o) => !o)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  border: '1px solid var(--red-a5)',
                  borderRadius: 8,
                  background: 'var(--red-a2)',
                  cursor: 'pointer',
                  font: 'inherit',
                  color: 'var(--red-11)',
                }}
              >
                <Text size="2" weight="medium">Where&apos;s the issue?</Text>
                {importErrorAccordionOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
              </button>
              {importErrorAccordionOpen && (
                <Box pt="2" pl="2" style={{ borderLeft: '3px solid var(--red-8)', marginLeft: 4 }}>
                  <Flex direction="column" gap="1">
                    {importResult.errors.map((err, i) => (
                      <Text key={i} size="2" color="red">{err}</Text>
                    ))}
                  </Flex>
                </Box>
              )}
            </Box>
          )}

          {importResult?.valid && importResult.config && (
            <Flex direction="column" gap="3" mt="4" pt="3" style={{ borderTop: '1px solid var(--gray-a5)' }}>
              <Text size="2" weight="medium">Theme is valid. Add a name and it will appear in the theme dropdown.</Text>
              <Flex direction="column" gap="1">
                <Text size="1" color="gray">Theme name</Text>
                <TextField.Root
                  placeholder="e.g. My brand theme"
                  value={importThemeName}
                  onChange={(e) => setImportThemeName(e.target.value)}
                />
              </Flex>
              <Flex direction="column" gap="1">
                <Text size="1" color="gray">Accent (swatch in dropdown)</Text>
                <Select.Root value={importThemeAccent} onValueChange={setImportThemeAccent}>
                  <Select.Trigger style={{ width: '100%' }} />
                  <Select.Content>
                    {ACCENT_OPTIONS.map((c) => (
                      <Select.Item key={c} value={c}>
                        <Flex align="center" gap="2">
                          <Box style={{ width: 12, height: 12, borderRadius: 4, background: `var(--${c}-9)` }} />
                          {c}
                        </Flex>
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Flex>
              <Flex gap="2" justify="end">
                <Dialog.Close>
                  <Button variant="soft" color="gray">Cancel</Button>
                </Dialog.Close>
                <Button onClick={handleImportSaveTheme}>Add to theme dropdown</Button>
              </Flex>
            </Flex>
          )}
        </Dialog.Content>
      </Dialog.Root>

      <Dialog.Root open={aiSaveDialogOpen} onOpenChange={(open) => { setAiSaveDialogOpen(open); if (!open) setAiSaveSuccess(false); }}>
        <Dialog.Content style={{ maxWidth: 340 }}>
          <Dialog.Title>Save AI theme</Dialog.Title>
          <Dialog.Description size="2" color="gray">
            {aiSaveSuccess
              ? `Saved as "${aiSaveName}". It has been added to the theme dropdown — you can select it there.`
              : 'Give this theme a name. It will be added to the theme dropdown.'}
          </Dialog.Description>
          {!aiSaveSuccess ? (
            <Flex direction="column" gap="3" mt="3">
              <TextField.Root
                placeholder="Theme name"
                value={aiSaveName}
                onChange={(e) => setAiSaveName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAiSaveTheme(); }}
              />
              <Flex gap="2" justify="end">
                <Dialog.Close>
                  <Button variant="soft" color="gray">Cancel</Button>
                </Dialog.Close>
                <Button onClick={handleAiSaveTheme}>Add to theme dropdown</Button>
              </Flex>
            </Flex>
          ) : (
            <Flex justify="end" mt="3">
              <Dialog.Close>
                <Button>Done</Button>
              </Dialog.Close>
            </Flex>
          )}
        </Dialog.Content>
      </Dialog.Root>

      {/* Tabs: Colors, Typography, Other, AI (placeholder) */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Tabs.List style={{ flexShrink: 0 }}>
          <Tabs.Trigger value="colors" style={{ flex: 1 }}>Colors</Tabs.Trigger>
          <Tabs.Trigger value="typography" style={{ flex: 1 }}>Typography</Tabs.Trigger>
          <Tabs.Trigger value="other" style={{ flex: 1 }}>Other</Tabs.Trigger>
          <Tabs.Trigger value="ai" style={{ flex: 1 }}>AI</Tabs.Trigger>
        </Tabs.List>
        <ScrollArea style={{ flex: 1, minHeight: 0 }} className="theme-panel-scroll">
          <Box pt="2" style={{ paddingBottom: 8 }}>
            <Tabs.Content value="colors" style={{ margin: 0 }}>
              {/* Theme colors (collapsible) */}
              <Box mb="2">
                <button
                  type="button"
                  onClick={() => toggleSection('themeColors')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    font: 'inherit',
                    color: 'inherit',
                  }}
                >
                  <Text size="2" weight="medium">Theme colors</Text>
                  {expandedSections.themeColors ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </button>
                {expandedSections.themeColors && (
                  <Flex direction="column" gap="2" pl="1">
                    <Flex direction="column" gap="1">
                      <Text size="1" color="gray">Accent</Text>
                      <Select.Root value={config.accentColor || 'red'} onValueChange={(v) => update({ accentColor: v })}>
                        <Select.Trigger style={{ width: '100%' }} />
                        <Select.Content>
                          {ACCENT_OPTIONS.map((c) => (
                            <Select.Item key={c} value={c}>{c}</Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text size="1" color="gray">Gray</Text>
                      <Select.Root value={config.grayColor || 'auto'} onValueChange={(v) => update({ grayColor: v })}>
                        <Select.Trigger style={{ width: '100%' }} />
                        <Select.Content>
                          {GRAY_OPTIONS.map((c) => (
                            <Select.Item key={c} value={c}>{c}</Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text size="1" color="gray">Panel background</Text>
                      <Select.Root value={config.panelBackground || 'translucent'} onValueChange={(v) => update({ panelBackground: v })}>
                        <Select.Trigger style={{ width: '100%' }} />
                        <Select.Content>
                          {PANEL_OPTIONS.map((p) => (
                            <Select.Item key={p} value={p}>{p}</Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    </Flex>
                  </Flex>
                )}
              </Box>
            </Tabs.Content>
            <Tabs.Content value="typography" style={{ margin: 0 }}>
              <Flex direction="column" gap="2">
                <Text size="1" color="gray">Font</Text>
                <Select.Root value={config.fontFamily || '__system__'} onValueChange={(v) => update({ fontFamily: v === '__system__' ? undefined : v })}>
                  <Select.Trigger style={{ width: '100%' }} />
                  <Select.Content>
                    <Select.Item value="__system__">System font</Select.Item>
                    {GOOGLE_FONTS.map((f) => (
                      <Select.Item key={f} value={f}>{f}</Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
                <Text size="1" color="gray">Weight</Text>
                <Select.Root value={String(config.fontWeight ?? 400)} onValueChange={(v) => update({ fontWeight: Number(v) })}>
                  <Select.Trigger style={{ width: '100%' }} />
                  <Select.Content>
                    {FONT_WEIGHT_OPTIONS.map((o) => (
                      <Select.Item key={o.value} value={String(o.value)}>{o.label}</Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
                <Text size="1" color="gray">Style</Text>
                <Select.Root value={config.fontStyle || 'normal'} onValueChange={(v) => update({ fontStyle: v })}>
                  <Select.Trigger style={{ width: '100%' }} />
                  <Select.Content>
                    {FONT_STYLE_OPTIONS.map((o) => (
                      <Select.Item key={o.value} value={o.value}>{o.label}</Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
                <Text size="1" color="gray">Scaling</Text>
                <Select.Root value={config.scaling || '100%'} onValueChange={(v) => update({ scaling: v })}>
                  <Select.Trigger style={{ width: '100%' }} />
                  <Select.Content>
                    {SCALING_OPTIONS.map((s) => (
                      <Select.Item key={s} value={s}>{s}</Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Flex>
            </Tabs.Content>
            <Tabs.Content value="other" style={{ margin: 0 }}>
              <Box mb="2">
                <button
                  type="button"
                  onClick={() => toggleSection('other')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    font: 'inherit',
                    color: 'inherit',
                  }}
                >
                  <Text size="2" weight="medium">Layout & shape</Text>
                  {expandedSections.other ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </button>
                {expandedSections.other && (
                  <Flex direction="column" gap="2" pl="1">
                    <Flex direction="column" gap="1">
                      <Text size="1" color="gray">Radius</Text>
                      <Select.Root value={config.radius || 'medium'} onValueChange={(v) => update({ radius: v })}>
                        <Select.Trigger style={{ width: '100%' }} />
                        <Select.Content>
                          {RADIUS_OPTIONS.map((r) => (
                            <Select.Item key={r} value={r}>{r}</Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text size="1" color="gray">Scaling</Text>
                      <Select.Root value={config.scaling || '100%'} onValueChange={(v) => update({ scaling: v })}>
                        <Select.Trigger style={{ width: '100%' }} />
                        <Select.Content>
                          {SCALING_OPTIONS.map((s) => (
                            <Select.Item key={s} value={s}>{s}</Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    </Flex>
                  </Flex>
                )}
              </Box>
            </Tabs.Content>
            <Tabs.Content value="ai" style={{ margin: 0 }}>
              <Box py="4">
                <Text size="2" color="gray">AI mode coming soon. You’ll be able to prompt by text, voice, image, and file upload.</Text>
              </Box>
            </Tabs.Content>
          </Box>
        </ScrollArea>
      </Tabs.Root>

      {/* AI Mode CTA at bottom of panel - filled, theme gradient, hover animation */}
      <Button
        size="2"
        className="theme-panel-ai-cta"
        style={{ width: '100%', flexShrink: 0, marginTop: 12 }}
        onClick={() => setAiMode(true)}
      >
        <StarIcon width={18} height={18} style={{ marginRight: 8 }} />
        AI Mode
      </Button>
        </>
      )}
    </Box>
  );
}
