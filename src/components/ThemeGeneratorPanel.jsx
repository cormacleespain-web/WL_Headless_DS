import React, { useCallback, useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useTheme, ALLOWED_GOOGLE_FONTS, FONT_WEIGHT_OPTIONS, FONT_STYLE_OPTIONS } from '../theme/ThemeContext.jsx';
import exampleThemeTokens from '../theme/tokens/wizeline-light.json';
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
  TextArea,
} from '@radix-ui/themes';
import Close from '@mui/icons-material/Close';
import ContentCopy from '@mui/icons-material/ContentCopy';
import Undo from '@mui/icons-material/Undo';
import Redo from '@mui/icons-material/Redo';
import RestartAlt from '@mui/icons-material/RestartAlt';
import LightMode from '@mui/icons-material/LightMode';
import DarkMode from '@mui/icons-material/DarkMode';
import Description from '@mui/icons-material/Description';
import Tune from '@mui/icons-material/Tune';
import Casino from '@mui/icons-material/Casino';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUp from '@mui/icons-material/KeyboardArrowUp';
import Image from '@mui/icons-material/Image';
import AttachFile from '@mui/icons-material/AttachFile';
import Send from '@mui/icons-material/Send';
import Mic from '@mui/icons-material/Mic';
import Save from '@mui/icons-material/Save';
import Check from '@mui/icons-material/Check';

// Alias for document/file icon (some code may reference FileTextIcon)
const FileTextIcon = Description;

// Sentence case for dropdown labels: first letter capital, rest unchanged
const toSentenceCase = (s) => (s && s.length) ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

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
const TRANSCRIBE_API_URL = '/api/transcribe';

// Ollama: In dev we use the Vite proxy (/api/ollama -> localhost:11434). Set VITE_OLLAMA_URL to override.
const OLLAMA_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OLLAMA_URL) ||
  (isDev ? '/api/ollama' : 'http://localhost:11434');
const OLLAMA_MODEL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OLLAMA_MODEL) || 'llama3.1:latest';
const USE_OLLAMA = (typeof import.meta === 'undefined' || import.meta.env?.VITE_USE_OLLAMA !== 'false');

const EXAMPLE_THEME_JSON = exampleThemeTokens;

function validateThemeFile(data) {
  const errors = [];
  if (data == null || typeof data !== 'object') {
    errors.push('File must be a JSON object (Wizeline token format or flat config).');
    return { valid: false, config: null, tokenSet: null, errors };
  }
  // Wizeline design-token format
  if (data.wizeline?.tokens) {
    const tokens = data.wizeline.tokens;
    if (!tokens.color?.palette && !tokens.color?.semantic) {
      errors.push('Wizeline format: missing "wizeline.tokens.color.palette" or "semantic".');
    }
    if (errors.length > 0) return { valid: false, config: null, tokenSet: null, errors };
    return { valid: true, config: null, tokenSet: data, errors: [] };
  }
  // Flat Radix config format
  const obj = data;
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
  if (errors.length > 0) return { valid: false, config: null, tokenSet: null, errors };
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
  return { valid: true, config, tokenSet: null, errors: [] };
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
  const accentList = ACCENT_OPTIONS.join(', ');
  const radiusList = RADIUS_OPTIONS.join(', ');
  return `You are a friendly theme assistant. Users describe what they want in plain language (e.g. "give me a yellow theme with square corners", "dark blue and rounded", "something warm and soft"). Interpret their intent and reply with ONLY a valid JSON object—no other text, no markdown.

OPTION A — Simple config (preferred when the request is about colors, light/dark, corners, font): output a flat object with these exact keys:
{
  "appearance": "light" or "dark",
  "accentColor": "one of: ${accentList}",
  "grayColor": "auto" or "gray" or "mauve" or "slate" or "sage" or "olive" or "sand",
  "radius": "one of: ${radiusList}",
  "scaling": "90%" | "95%" | "100%" | "105%" | "110%",
  "panelBackground": "solid" or "translucent",
  "fontFamily": "optional Google font name or omit",
  "fontWeight": 300 | 400 | 500 | 600 | 700,
  "fontStyle": "normal" or "italic"
}

Natural language mapping:
- "yellow / gold / amber / orange / blue / green / red / purple / pink" etc. → accentColor (use closest: yellow→yellow, gold→gold, amber→amber, blue→blue, navy→indigo).
- "square / sharp / no rounding / flat corners" → radius: "none". "rounded / pill / large corners" → radius: "large" or "full". "slightly rounded" → "medium".
- "dark / night / black theme" → appearance: "dark". "light / bright / white" → appearance: "light".
- "bold / heavy" → fontWeight: 700. "light / thin" → 300. "italic" → fontStyle: "italic".
- If the user attaches an image, describe the mood and dominant colors you see and map them to the config (e.g. warm image → warm accent like amber/orange; corporate blue image → blue/indigo accent, etc.).

OPTION B — Full Wizeline token JSON: only if the user explicitly asks for custom hex colors or a full design token set. Use the same structure as before with "wizeline.tokens.color.palette" etc., and use exact keys.

Rules:
- Prefer OPTION A (flat config) for normal requests like "yellow theme with square corners".
- For images: infer appearance (light/dark), accent color from dominant colors, and radius from the style (sharp UI → none, soft UI → large).
- Always return valid JSON only. No explanation outside the JSON.`;
}

/** Call same-origin proxy to OpenAI (avoids CORS; key stays server-side). Supports text and optional image (base64). Returns { config } or { tokenSet } or { error: string }. */
async function fetchThemeViaOpenAIProxy(promptText, imageBase64, imageMimeType) {
  const hasImage = imageBase64 && typeof imageBase64 === 'string';
  const hasText = promptText && promptText.trim() && promptText !== '(Image or file)';
  if (!hasText && !hasImage) return { error: 'disabled' };
  const systemPrompt = getThemeGeneratorSystemPrompt();
  const prompt = (hasText ? promptText.trim() : '') || (hasImage ? 'Create a theme inspired by this image.' : '');
  try {
    const body = { prompt, systemPrompt, model: OPENAI_MODEL };
    if (hasImage) {
      body.imageBase64 = imageBase64;
      body.imageMimeType = imageMimeType || 'image/jpeg';
    }
    const res = await fetch(OPENAI_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
    const result = validateThemeFile(obj);
    if (!result.valid) {
      console.error('[AI theme] Theme validation failed:', result.errors, obj);
      return { error: 'Theme validation failed' };
    }
    if (result.tokenSet) return { tokenSet: result.tokenSet };
    return { config: result.config };
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
    const result = validateThemeFile(obj);
    if (!result.valid) {
      console.error('[AI theme] Theme validation failed:', result.errors, obj);
      return { error: 'Theme validation failed' };
    }
    if (result.tokenSet) return { tokenSet: result.tokenSet };
    return { config: result.config };
  } catch (e) {
    const err = e?.message || String(e) || 'Network error';
    console.error('[AI theme]', err, e);
    return { error: err };
  }
}

export default function ThemeGeneratorPanel({ onClose, open }) {
  const { theme, setTheme, setThemeConfig, addCustomTheme, defaultThemes, myThemes, effectiveConfig, getThemeTokenJson, getThemeAccentColor } = useTheme();
  const config = effectiveConfig || {};
  const defaults = Array.isArray(defaultThemes) ? defaultThemes : [];
  const mine = Array.isArray(myThemes) ? myThemes : [];
  const allThemes = [...defaults, ...mine];
  const currentMatch =
    findMatchingTheme(allThemes, config) ??
    (theme?.id ? (() => {
      const t = allThemes.find((x) => x.id === theme.id);
      return t && configEquals(t.config || {}, config) ? t : null;
    })() : null);
  const currentThemeLabel = currentMatch ? currentMatch.name : 'Custom';
  const selectValue = currentMatch ? currentMatch.id : '__custom__';
  const triggerAccentColor = currentMatch
    ? (getThemeAccentColor ? getThemeAccentColor(currentMatch, config?.appearance || 'light') : `var(--${currentMatch.config?.accentColor ?? 'red'}-9)`)
    : `var(--${config?.accentColor ?? 'red'}-9)`;

  const [activeTab, setActiveTab] = useState('colors');
  const [copyStatus, setCopyStatus] = useState('idle');
  const [toastMessage, setToastMessage] = useState(null);
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
  const [voiceElapsedSeconds, setVoiceElapsedSeconds] = useState(0);
  const [voiceLevels, setVoiceLevels] = useState(() => Array(12).fill(0));
  const [voiceHasReceivedResult, setVoiceHasReceivedResult] = useState(false);
  const [voiceTranscribing, setVoiceTranscribing] = useState(false);
  const [aiAttachment, setAiAttachment] = useState(null); // { file: File, preview: string | null, name: string }
  const aiFileInputRef = React.useRef(null);
  const speechRecognitionRef = React.useRef(null);
  const aiPromptTextareaRef = React.useRef(null);
  const mediaStreamRef = React.useRef(null);
  const mediaRecorderRef = React.useRef(null);
  const recordedChunksRef = React.useRef([]);
  const voiceDoneClickedRef = React.useRef(false);
  const audioContextRef = React.useRef(null);
  const analyserRef = React.useRef(null);
  const voiceLevelAnimationRef = React.useRef(null);
  const voiceTimerRef = React.useRef(null);
  const transcriptAccumulatorRef = React.useRef('');
  const promptAtRecordingStartRef = React.useRef('');
  const isStoppingVoiceRef = React.useRef(false);

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
    const tokenJson = theme?.tokenSet || (theme?.id && getThemeTokenJson?.(theme.id));
    const str = tokenJson
      ? JSON.stringify(tokenJson, null, 2)
      : JSON.stringify({
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
  }, [config, theme, getThemeTokenJson]);

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
          setImportThemeAccent(result.config?.accentColor ?? config.accentColor ?? 'red');
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
    if (!importResult?.valid) return;
    const name = importThemeName.trim() || `Imported ${new Date().toLocaleDateString()}`;
    if (importResult.tokenSet) {
      addCustomTheme({
        id: `imported-${Date.now()}`,
        name,
        tokenSet: importResult.tokenSet,
      });
    } else if (importResult.config) {
      addCustomTheme({
        id: `imported-${Date.now()}`,
        name,
        config: { ...importResult.config, accentColor: importThemeAccent },
      });
    }
    setImportDialogOpen(false);
    setImportResult(null);
  }, [importResult, importThemeName, importThemeAccent, addCustomTheme]);

  const handleImportDialogOpenChange = useCallback((open) => {
    setImportDialogOpen(open);
    if (!open) setImportResult(null);
  }, []);

  const runAccessibilityCheck = useCallback(() => {
    const getHex = (cssColor) => {
      if (!cssColor || cssColor === 'rgba(0, 0, 0, 0)' || cssColor === 'transparent') return null;
      const m = cssColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
      if (m) {
        const r = Number(m[1]).toString(16).padStart(2, '0');
        const g = Number(m[2]).toString(16).padStart(2, '0');
        const b = Number(m[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
      }
      if (cssColor.startsWith('#')) return cssColor.slice(0, 7);
      return null;
    };
    const luminance = (hex) => {
      if (!hex) return 0;
      const [r, g, b] = (hex.replace('#', '').match(/.{2}/g) || []).map((x) => parseInt(x, 16) / 255);
      const f = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const ratio = (a, b) => {
      const L1 = Math.max(luminance(a), luminance(b));
      const L2 = Math.min(luminance(a), luminance(b));
      return (L1 + 0.05) / (L2 + 0.05);
    };
    const bodyStyle = getComputedStyle(document.body);
    const bodyBg = getHex(bodyStyle.backgroundColor);
    const bodyFg = getHex(bodyStyle.color);
    const r = bodyFg && bodyBg ? ratio(bodyFg, bodyBg) : 0;
    const aaPass = r >= 4.5;
    const scaling = config?.scaling || '100%';
    const scalingNum = parseInt(scaling, 10) || 100;
    const scalingOk = scalingNum >= 100;
    const lines = [];
    if (aaPass) lines.push('Contrast: passes WCAG AA (4.5:1) for text.');
    else lines.push(`Contrast: ${r.toFixed(1)}:1 — below 4.5:1 for normal text.`);
    if (scalingOk) lines.push('Scaling: OK.');
    else lines.push('Scaling: consider 100% or higher for readability.');
    setToastMessage(lines.join(' '));
    setTimeout(() => setToastMessage(null), 5000);
  }, [config?.scaling]);

  const handleContrast = useCallback(() => {
    runAccessibilityCheck();
  }, [runAccessibilityCheck]);

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

  const clearAiAttachment = useCallback(() => {
    setAiAttachment((prev) => {
      if (prev?.preview) URL.revokeObjectURL(prev.preview);
      return null;
    });
  }, []);

  const handleAiFileSelect = useCallback((e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    e.target.value = '';
    const isImage = file.type.startsWith('image/');
    const isJson = file.name.toLowerCase().endsWith('.json') || file.type === 'application/json';
    if (!isImage && !isJson) {
      window.alert('Please attach an image (for theme inspiration) or a JSON theme file.');
      return;
    }
    setAiAttachment((prev) => {
      if (prev?.preview) URL.revokeObjectURL(prev.preview);
      const preview = isImage ? URL.createObjectURL(file) : null;
      return { file, preview, name: file.name };
    });
  }, []);

  const handleAiSend = useCallback(async (overridePrompt) => {
    const attachment = aiAttachment;
    const rawText = (overridePrompt ?? aiPrompt ?? '').trim();
    const isImage = attachment?.file?.type?.startsWith('image/');
    const isJson = attachment?.file?.name?.toLowerCase().endsWith('.json') || attachment?.file?.type === 'application/json';
    let userMessageText = rawText;
    if (!rawText && attachment) {
      userMessageText = isImage ? 'Create a theme from this image.' : isJson ? 'Use this theme JSON as a base and suggest improvements or variations.' : 'Create a theme from this.';
    } else if (!rawText && !attachment) {
      setAiLoading(false);
      return;
    }
    setAiMessages((m) => [...m, { role: 'user', content: userMessageText + (attachment ? ` [Attached: ${attachment.name}]` : '') }]);
    if (!overridePrompt) setAiPrompt('');
    setAiLoading(true);

    let promptForApi = userMessageText;
    let imageBase64 = null;
    let imageMimeType = null;

    if (attachment?.file) {
      if (isImage) {
        try {
          imageBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result;
              const base64 = dataUrl?.split(',')[1];
              resolve(base64 || null);
            };
            reader.onerror = reject;
            reader.readAsDataURL(attachment.file);
          });
          imageMimeType = attachment.file.type || 'image/jpeg';
        } catch (e) {
          console.error('[AI theme] Failed to read image', e);
          setAiMessages((m) => [...m, { role: 'assistant', content: 'Could not read the attached image. Try again.' }]);
          setAiLoading(false);
          return;
        }
      } else if (isJson) {
        try {
          const jsonText = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(attachment.file);
          });
          promptForApi = `${userMessageText}\n\nAttached theme JSON:\n${jsonText}`;
        } catch (e) {
          console.error('[AI theme] Failed to read JSON file', e);
          setAiMessages((m) => [...m, { role: 'assistant', content: 'Could not read the attached file.' }]);
          setAiLoading(false);
          return;
        }
      }
      clearAiAttachment();
    }

    let nextConfig = null;
    let nextTokenSet = null;
    let source = 'refine';
    let ollamaError = null;
    const hasNewPrompt = promptForApi.length > 0 || imageBase64;

    if (hasNewPrompt) {
      const openaiResult = await fetchThemeViaOpenAIProxy(promptForApi, imageBase64, imageMimeType);
      if (openaiResult.tokenSet) {
        nextTokenSet = openaiResult.tokenSet;
        source = 'openai';
      } else if (openaiResult.config) {
        nextConfig = openaiResult.config;
        source = 'openai';
      } else if (openaiResult.error && openaiResult.error !== 'disabled') {
        ollamaError = openaiResult.error;
      }
      if (!nextTokenSet && !nextConfig && USE_OLLAMA && !imageBase64) {
        const result = await fetchThemeFromOllama(promptForApi);
        if (result.tokenSet) {
          nextTokenSet = result.tokenSet;
          source = 'ollama';
        } else if (result.config) {
          nextConfig = result.config;
          source = 'ollama';
        } else if (result.error && result.error !== 'disabled') {
          ollamaError = result.error;
        }
      }
      if (!nextTokenSet && !nextConfig) {
        nextConfig = generateThemeFromPrompt(promptForApi);
        source = 'fallback';
      }
    }
    if (nextTokenSet) {
      setTheme({ id: 'ai-preview', name: 'AI preview', tokenSet: nextTokenSet });
      setAiGeneratedConfig(null);
      setAiRefineConfig(null);
      const assistantContent =
        source === 'openai'
          ? 'Generated a token theme with OpenAI. It’s applied now. Save to add it to your theme list.'
          : 'Generated a token theme with Ollama. It’s applied now. Save to add it to your theme list.';
      setAiMessages((m) => [...m, { role: 'assistant', content: assistantContent }]);
      setAiRefineExpanded(false);
      setAiLoading(false);
      return;
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
  }, [aiPrompt, aiAttachment, aiRefineConfig, clearAiAttachment, generateThemeFromPrompt, setTheme]);

  const handleAiReset = useCallback(() => {
    setAiMessages([]);
    setAiPrompt('');
    setAiRefineConfig(null);
    setAiGeneratedConfig(null);
    setAiRefineExpanded(false);
    clearAiAttachment();
  }, [clearAiAttachment]);

  const handleAiRefineUpdate = useCallback((partial) => {
    setAiRefineConfig((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  const SILENCE_THRESHOLD = 0.015;
  const NUM_VOICE_BARS = 12;

  const setAiPromptAndSyncToTextarea = useCallback((text, options = {}) => {
    const s = String(text ?? '');
    flushSync(() => setAiPrompt(s));
    const textarea = aiPromptTextareaRef.current;
    if (textarea && textarea.value !== s) textarea.value = s;
    if (options.scrollIntoView && textarea) textarea.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, []);

  const doVoiceCleanup = useCallback(() => {
    if (isStoppingVoiceRef.current) return;
    isStoppingVoiceRef.current = true;
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    if (voiceLevelAnimationRef.current != null) {
      cancelAnimationFrame(voiceLevelAnimationRef.current);
      voiceLevelAnimationRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (_) {}
      speechRecognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAiVoiceListening(false);
    setVoiceElapsedSeconds(0);
    setVoiceLevels(Array(NUM_VOICE_BARS).fill(0));
    setVoiceHasReceivedResult(false);
    transcriptAccumulatorRef.current = '';
    voiceDoneClickedRef.current = false;
    isStoppingVoiceRef.current = false;
  }, []);

  const stopVoiceRecording = useCallback((commitTranscript) => {
    const transcript = transcriptAccumulatorRef.current.trim();
    const base = promptAtRecordingStartRef.current ?? '';
    doVoiceCleanup();
    if (commitTranscript) {
      const text = transcript ? (base ? `${base} ${transcript}` : transcript) : base;
      setAiPromptAndSyncToTextarea(text, { scrollIntoView: true });
    } else {
      setAiPromptAndSyncToTextarea(base);
    }
  }, [doVoiceCleanup, setAiPromptAndSyncToTextarea]);

  // Voice: optional live transcription via Web Speech API (Chrome/Edge). Fallback: record and send to
  // /api/transcribe (OpenAI Whisper) when user clicks Done — works in all browsers.
  const handleAiVoiceClick = useCallback(async () => {
    const SpeechRecognitionAPI = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (aiVoiceListening) {
      stopVoiceRecording(false);
      return;
    }
    transcriptAccumulatorRef.current = '';
    promptAtRecordingStartRef.current = aiPrompt;
    voiceDoneClickedRef.current = false;
    recordedChunksRef.current = [];
    setVoiceElapsedSeconds(0);
    setVoiceLevels(Array(NUM_VOICE_BARS).fill(0));
    setVoiceHasReceivedResult(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const AudioContextAPI = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextAPI();
      audioContextRef.current = ctx;
      if (ctx.state === 'suspended') await ctx.resume();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.6;
      analyserRef.current = analyser;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const handleRecordingStop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const transcript = transcriptAccumulatorRef.current.trim();
        const base = promptAtRecordingStartRef.current ?? '';
        if (voiceDoneClickedRef.current) {
          if (transcript) {
            setAiPromptAndSyncToTextarea(base ? `${base} ${transcript}` : transcript, { scrollIntoView: true });
          } else if (blob.size > 0) {
            setVoiceTranscribing(true);
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = (reader.result || '').split(',')[1];
              if (!base64) {
                setVoiceTranscribing(false);
                doVoiceCleanup();
                return;
              }
              fetch(TRANSCRIBE_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioBase64: base64, mimeType: 'audio/webm' }),
              })
                .then((r) => r.json())
                .then((data) => {
                  const text = data?.text?.trim();
                  if (text) setAiPromptAndSyncToTextarea(base ? `${base} ${text}` : text, { scrollIntoView: true });
                })
                .catch(() => {})
                .finally(() => {
                  setVoiceTranscribing(false);
                  doVoiceCleanup();
                });
            };
            reader.readAsDataURL(blob);
            return;
          } else {
            setAiPromptAndSyncToTextarea(base);
          }
        }
        doVoiceCleanup();
      };

      if (typeof MediaRecorder !== 'undefined') {
        const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => {
          if (e.data.size) recordedChunksRef.current.push(e.data);
        };
        recorder.onstop = handleRecordingStop;
        recorder.start(1000);
      }

      if (SpeechRecognitionAPI) {
      const createRecognition = () => {
        const rec = new SpeechRecognitionAPI();
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        rec.lang = 'en-US';
        rec.onresult = (event) => {
          if (!event.results || !event.results.length) return;
          let finalSegment = '';
          let interimSegment = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            let text = '';
            const len = result.length != null ? result.length : (result.item ? 1 : 1);
            for (let a = 0; a < len; a++) {
              const alt = result[a] ?? (typeof result.item === 'function' ? result.item(a) : null);
              const t = (alt && (typeof alt.transcript === 'string' ? alt.transcript : alt.transcript != null ? String(alt.transcript) : ''));
              if (t.trim()) {
                text = t.trim();
                break;
              }
            }
            if (result.isFinal) {
              finalSegment += (finalSegment ? ' ' : '') + text;
            } else {
              interimSegment += (interimSegment ? ' ' : '') + text;
            }
          }
          if (finalSegment) {
            transcriptAccumulatorRef.current += (transcriptAccumulatorRef.current ? ' ' : '') + finalSegment;
          }
          const base = promptAtRecordingStartRef.current ?? '';
          const finalSoFar = transcriptAccumulatorRef.current.trim();
          const interim = interimSegment.trim();
          const combined = [finalSoFar, interim].filter(Boolean).join(' ');
          const display = base ? (combined ? `${base} ${combined}` : base) : combined;
          setVoiceHasReceivedResult(true);
          setAiPromptAndSyncToTextarea(display);
        };
        rec.onend = () => {
          if (isStoppingVoiceRef.current) return;
          if (!mediaStreamRef.current) return;
          setTimeout(() => {
            if (isStoppingVoiceRef.current || !mediaStreamRef.current) return;
            try {
              const next = createRecognition();
              speechRecognitionRef.current = next;
              next.start();
            } catch (err) {
              stopVoiceRecording(false);
            }
          }, 200);
        };
        rec.onerror = (event) => {
          if (event.error === 'aborted') return;
          if (event.error === 'no-speech') return;
          if (event.error === 'network') return;
          const msg = event.error === 'not-allowed' ? 'Microphone access denied. Allow mic for this site and try again.' : event.error === 'audio-capture' ? 'No microphone found.' : `Speech recognition stopped (${event.error}). Try Chrome or Edge.`;
          window.alert(msg);
          stopVoiceRecording(false);
        };
        return rec;
      };
      const recognition = createRecognition();
      speechRecognitionRef.current = recognition;
      recognition.start();
      }

      setAiVoiceListening(true);

      let startTime = Date.now();
      voiceTimerRef.current = setInterval(() => {
        setVoiceElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      const updateLevels = () => {
        if (!analyserRef.current || !mediaStreamRef.current) return;
        const analyserNode = analyserRef.current;
        analyserNode.getByteFrequencyData(dataArray);
        const step = Math.floor(dataArray.length / NUM_VOICE_BARS);
        const next = [];
        for (let i = 0; i < NUM_VOICE_BARS; i++) {
          let v = 0;
          for (let j = 0; j < step; j++) v += dataArray[i * step + j] || 0;
          v = (v / step) / 255;
          next.push(v);
        }
        setVoiceLevels(next);
        voiceLevelAnimationRef.current = requestAnimationFrame(updateLevels);
      };
      voiceLevelAnimationRef.current = requestAnimationFrame(updateLevels);
    } catch (err) {
      setAiVoiceListening(false);
      window.alert('Could not start voice input. Check microphone permission.');
    }
  }, [aiVoiceListening, doVoiceCleanup, setAiPromptAndSyncToTextarea, stopVoiceRecording]);

  useEffect(() => {
    if (aiMode && aiRefineConfig) setThemeConfig(aiRefineConfig);
  }, [aiMode, aiRefineConfig, setThemeConfig]);

  // Auto-resize AI prompt textarea as content wraps
  useEffect(() => {
    const textarea = aiPromptTextareaRef.current;
    if (textarea && textarea.scrollHeight > 0) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 56), 200)}px`;
    }
  }, [aiPrompt]);

  const handleAiSaveTheme = useCallback(() => {
    const name = aiSaveName.trim() || `AI theme ${new Date().toLocaleDateString()}`;
    if (theme?.tokenSet) {
      addCustomTheme({ id: `ai-${Date.now()}`, name, tokenSet: theme.tokenSet });
    } else if (aiRefineConfig) {
      addCustomTheme({ id: `ai-${Date.now()}`, name, config: aiRefineConfig });
    } else return;
    setAiSaveSuccess(true);
    setAiSaveName(name);
  }, [aiRefineConfig, aiSaveName, addCustomTheme, theme?.tokenSet]);

  const canUndo = history.length > 0 && historyIndex >= 0;
  const canRedo = history.length > 0 && historyIndex < history.length - 1;

  if (!open) return null;

  const toggleSection = (key) => {
    setExpandedSections((s) => ({ ...s, [key]: !s[key] }));
  };

  return (
    <>
    <Box
      className={aiMode ? 'theme-panel theme-panel-ai-mode' : 'theme-panel'}
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        bottom: 20,
        zIndex: 10,
        width: 340,
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
      {/* Header: Title + Close */}
      <Flex justify="between" align="center" mb="3" gap="2">
        <Flex align="center" gap="2" style={{ minWidth: 0, flex: 1 }}>
          <Text size="3" weight="bold" style={{ flexShrink: 0 }}>Theme Generator</Text>
        </Flex>
        {onClose && (
          <IconButton variant="ghost" size="1" aria-label="Close" onClick={onClose}>
            <Close sx={{ fontSize: 14 }} />
          </IconButton>
        )}
      </Flex>

      {/* Top-level tabs: Manual | AI Mode */}
      <Tabs.Root value={aiMode ? 'ai' : 'manual'} onValueChange={(v) => setAiMode(v === 'ai')} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Tabs.List size="2" style={{ flexShrink: 0, marginBottom: 12 }}>
          <Tabs.Trigger value="manual" style={{ flex: 1 }}>Manual</Tabs.Trigger>
          <Tabs.Trigger value="ai" style={{ flex: 1 }}>AI Mode</Tabs.Trigger>
        </Tabs.List>

      {!aiMode && (
      <Tabs.Content value="manual" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', paddingTop: 0 }}>
        <Flex direction="column" gap="0" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Themes */}
      <Flex direction="column" gap="2" mb="3" style={{ marginTop: 0, flexShrink: 0 }}>
        <Text size="1" color="gray">Themes</Text>
        <Select.Root value={selectValue} onValueChange={(value) => { if (value === '__custom__') return; const t = allThemes.find((x) => x.id === value); if (t) { pushHistory(); setTheme(t); } }}>
          <Select.Trigger style={{ width: '100%' }}>
            <Flex align="center" gap="2">
              <Box style={{ width: 12, height: 12, borderRadius: 4, background: triggerAccentColor, flexShrink: 0 }} />
              <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentThemeLabel}</span>
            </Flex>
          </Select.Trigger>
          <Select.Content>
            {allThemes.map((t) => (
              <Select.Item key={t.id} value={t.id}>
                <Flex align="center" gap="2">
                  <Box style={{ width: 12, height: 12, borderRadius: 4, background: getThemeAccentColor ? getThemeAccentColor(t, config?.appearance || 'light') : `var(--${t.config?.accentColor ?? 'red'}-9)` }} />
                  {t.name}
                </Flex>
              </Select.Item>
            ))}
            <Select.Item value="__custom__">Custom</Select.Item>
          </Select.Content>
        </Select.Root>
      </Flex>

      {/* Light / Dark */}
      <Flex direction="column" gap="2" mb="3" style={{ flexShrink: 0 }}>
        <Flex gap="1">
          <Button variant={config.appearance === 'light' ? 'solid' : 'soft'} size="1" style={{ flex: 1 }} onClick={() => update({ appearance: 'light' })}>
            <LightMode sx={{ fontSize: 14 }} style={{ marginRight: 4 }} /> Light
          </Button>
          <Button variant={config.appearance === 'dark' ? 'solid' : 'soft'} size="1" style={{ flex: 1 }} onClick={() => update({ appearance: 'dark' })}>
            <DarkMode sx={{ fontSize: 14 }} style={{ marginRight: 4 }} /> Dark
          </Button>
        </Flex>
      </Flex>

      {/* Colors, Typography, Other */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Tabs.List style={{ flexShrink: 0 }}>
          <Tabs.Trigger value="colors" style={{ flex: 1 }}>Colors</Tabs.Trigger>
          <Tabs.Trigger value="typography" style={{ flex: 1 }}>Typography</Tabs.Trigger>
          <Tabs.Trigger value="other" style={{ flex: 1 }}>Other</Tabs.Trigger>
        </Tabs.List>
        <Box pt="2" style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 8 }} className="theme-panel-scroll">
            <Tabs.Content value="colors" style={{ margin: 0 }}>
              <Box mb="2">
                <button type="button" onClick={() => toggleSection('themeColors')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', border: 'none', background: 'none', cursor: 'pointer', font: 'inherit', color: 'inherit' }}>
                  <Text size="2" weight="medium">Theme colors</Text>
                  {expandedSections.themeColors ? <KeyboardArrowUp sx={{ fontSize: 16 }} /> : <KeyboardArrowDown sx={{ fontSize: 16 }} />}
                </button>
                {expandedSections.themeColors && (
                  <Flex direction="column" gap="2" pl="1">
                    <Flex direction="column" gap="1">
                      <Text size="1" color="gray">Accent</Text>
                      <Select.Root value={config.accentColor || 'red'} onValueChange={(v) => update({ accentColor: v })}>
                        <Select.Trigger style={{ width: '100%' }} />
                        <Select.Content>{ACCENT_OPTIONS.map((c) => (<Select.Item key={c} value={c}>{toSentenceCase(c)}</Select.Item>))}</Select.Content>
                      </Select.Root>
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text size="1" color="gray">Gray</Text>
                      <Select.Root value={config.grayColor || 'auto'} onValueChange={(v) => update({ grayColor: v })}>
                        <Select.Trigger style={{ width: '100%' }} />
                        <Select.Content>{GRAY_OPTIONS.map((c) => (<Select.Item key={c} value={c}>{toSentenceCase(c)}</Select.Item>))}</Select.Content>
                      </Select.Root>
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text size="1" color="gray">Panel background</Text>
                      <Select.Root value={config.panelBackground || 'translucent'} onValueChange={(v) => update({ panelBackground: v })}>
                        <Select.Trigger style={{ width: '100%' }} />
                        <Select.Content>{PANEL_OPTIONS.map((p) => (<Select.Item key={p} value={p}>{toSentenceCase(p)}</Select.Item>))}</Select.Content>
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
                    {GOOGLE_FONTS.map((f) => (<Select.Item key={f} value={f}>{f}</Select.Item>))}
                  </Select.Content>
                </Select.Root>
                <Text size="1" color="gray">Weight</Text>
                <Select.Root value={String(config.fontWeight ?? 400)} onValueChange={(v) => update({ fontWeight: Number(v) })}>
                  <Select.Trigger style={{ width: '100%' }} />
                  <Select.Content>{FONT_WEIGHT_OPTIONS.map((o) => (<Select.Item key={o.value} value={String(o.value)}>{o.label}</Select.Item>))}</Select.Content>
                </Select.Root>
                <Text size="1" color="gray">Style</Text>
                <Select.Root value={config.fontStyle || 'normal'} onValueChange={(v) => update({ fontStyle: v })}>
                  <Select.Trigger style={{ width: '100%' }} />
                  <Select.Content>{FONT_STYLE_OPTIONS.map((o) => (<Select.Item key={o.value} value={o.value}>{o.label}</Select.Item>))}</Select.Content>
                </Select.Root>
                <Text size="1" color="gray">Scaling</Text>
                <Select.Root value={config.scaling || '100%'} onValueChange={(v) => update({ scaling: v })}>
                  <Select.Trigger style={{ width: '100%' }} />
                  <Select.Content>{SCALING_OPTIONS.map((s) => (<Select.Item key={s} value={s}>{toSentenceCase(s)}</Select.Item>))}</Select.Content>
                </Select.Root>
              </Flex>
            </Tabs.Content>
            <Tabs.Content value="other" style={{ margin: 0 }}>
              <Box mb="2">
                <button type="button" onClick={() => toggleSection('other')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', border: 'none', background: 'none', cursor: 'pointer', font: 'inherit', color: 'inherit' }}>
                  <Text size="2" weight="medium">Layout & shape</Text>
                  {expandedSections.other ? <KeyboardArrowUp sx={{ fontSize: 16 }} /> : <KeyboardArrowDown sx={{ fontSize: 16 }} />}
                </button>
                {expandedSections.other && (
                  <Flex direction="column" gap="2" pl="1">
                    <Flex direction="column" gap="1">
                      <Text size="1" color="gray">Radius</Text>
                      <Select.Root value={config.radius || 'medium'} onValueChange={(v) => update({ radius: v })}>
                        <Select.Trigger style={{ width: '100%' }} />
                        <Select.Content>{RADIUS_OPTIONS.map((r) => (<Select.Item key={r} value={r}>{toSentenceCase(r)}</Select.Item>))}</Select.Content>
                      </Select.Root>
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text size="1" color="gray">Scaling</Text>
                      <Select.Root value={config.scaling || '100%'} onValueChange={(v) => update({ scaling: v })}>
                        <Select.Trigger style={{ width: '100%' }} />
                        <Select.Content>{SCALING_OPTIONS.map((s) => (<Select.Item key={s} value={s}>{toSentenceCase(s)}</Select.Item>))}</Select.Content>
                      </Select.Root>
                    </Flex>
                  </Flex>
                )}
              </Box>
            </Tabs.Content>
        </Box>
        <Flex direction="column" gap="2" pt="2" style={{ width: '100%', flexShrink: 0 }}>
          <Button variant="outline" size="2" style={{ width: '100%' }} onClick={handleContrast}>
            <Tune sx={{ fontSize: 16 }} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Check accessibility
          </Button>
          <Button variant="outline" size="2" style={{ width: '100%' }} onClick={handleRandom}>
            <Casino sx={{ fontSize: 16 }} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Random theme
          </Button>
        </Flex>
      </Tabs.Root>
        </Flex>
      </Tabs.Content>
      )}

      {aiMode && (
      <Tabs.Content value="ai" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {/* AI Mode: intro at top (no extra space above), then chat, prompt at bottom */}
        <Flex direction="column" gap="3" style={{ flex: 1, minHeight: 0 }} className="theme-panel-ai-content">
          <Text size="2" color="gray" style={{ flexShrink: 0, marginTop: 0, marginBottom: 4 }}>
            Describe your theme in plain language (e.g. &quot;yellow theme with square corners&quot;), attach an image or JSON file, or use voice. I&apos;ll suggest colors, typography and shape to match.
          </Text>
          <ScrollArea style={{ flex: 1, minHeight: 120 }} className="theme-panel-scroll">
            <Flex direction="column" gap="2" style={{ paddingRight: 8 }}>
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

          {/* Generated theme: token theme applied, or config refine panel */}
          {(aiRefineConfig || theme?.tokenSet) && (
            <Box style={{ border: '1px solid var(--gray-a5)', borderRadius: 8, padding: 8, background: 'var(--gray-a2)' }}>
              {theme?.tokenSet && !aiRefineConfig ? (
                <Flex direction="column" gap="2">
                  <Text size="2">Token theme applied. Save to add it to your theme list.</Text>
                  <Button size="1" variant="solid" onClick={() => { setAiSaveDialogOpen(true); setAiSaveSuccess(false); setAiSaveName(''); }}>
                    Save theme
                  </Button>
                </Flex>
              ) : !aiRefineExpanded ? (
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
                              <Select.Item key={c} value={c}>{toSentenceCase(c)}</Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Root>
                        <Select.Root value={aiRefineConfig.grayColor ?? 'auto'} onValueChange={(v) => handleAiRefineUpdate({ grayColor: v })}>
                          <Select.Trigger size="1" style={{ minWidth: 72 }} />
                          <Select.Content>
                            {GRAY_OPTIONS.map((g) => (
                              <Select.Item key={g} value={g}>{toSentenceCase(g)}</Select.Item>
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
                              <Select.Item key={s} value={s}>{toSentenceCase(s)}</Select.Item>
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
                              <Select.Item key={r} value={r}>{toSentenceCase(r)}</Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Root>
                        <Select.Root value={aiRefineConfig.panelBackground ?? 'translucent'} onValueChange={(v) => handleAiRefineUpdate({ panelBackground: v })}>
                          <Select.Trigger size="1" style={{ minWidth: 88 }} />
                          <Select.Content>
                            {PANEL_OPTIONS.map((p) => (
                              <Select.Item key={p} value={p}>{toSentenceCase(p)}</Select.Item>
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

          {/* Voice recording overlay: waveform, timer, Cancel/Done (inspired by reference) */}
          {(aiVoiceListening || voiceTranscribing) && (
            <Box
              className="theme-panel-voice-overlay"
              style={{
                padding: '14px 16px',
                borderRadius: 16,
                background: 'var(--gray-a4)',
                border: '1px solid var(--gray-a6)',
                flexShrink: 0,
              }}
            >
              <Flex direction="column" gap="3">
                {voiceTranscribing ? (
                  <>
                    <Flex align="center" gap="2" style={{ flexShrink: 0 }}>
                      <Mic sx={{ fontSize: 20, color: 'var(--gray-12)' }} />
                      <Text size="2" weight="medium" style={{ color: 'var(--gray-12)' }}>Transcribing your recording…</Text>
                    </Flex>
                    <Text size="1" style={{ color: 'var(--gray-11)' }}>Sending to server. Text will appear in the box below.</Text>
                  </>
                ) : (
                  <>
                <Flex align="center" gap="2" style={{ flexShrink: 0 }}>
                  <Mic sx={{ fontSize: 20, color: 'var(--gray-12)' }} />
                  <Text size="2" weight="medium" style={{ color: 'var(--gray-12)' }}>Recording an audio clip…</Text>
                </Flex>
                <Text size="1" style={{ color: 'var(--gray-11)', marginTop: -4 }}>
                  {voiceHasReceivedResult
                    ? '✓ Speech received — words appear in the box below.'
                    : 'Speak clearly. Words may appear live (Chrome/Edge) or when you click Done we transcribe the recording.'}
                </Text>
                <Flex align="center" gap="2" style={{ alignItems: 'center', minHeight: 32 }}>
                  <Flex align="end" gap="1" style={{ flex: 1, height: 24, alignItems: 'flex-end', justifyContent: 'center' }}>
                    {voiceLevels.map((level, i) => (
                      <Box
                        key={i}
                        style={{
                          width: 4,
                          height: Math.max(4, 4 + level * 20),
                          borderRadius: 2,
                          background: level > SILENCE_THRESHOLD ? 'var(--accent-9)' : 'var(--gray-8)',
                          transition: 'height 0.05s ease-out',
                        }}
                      />
                    ))}
                  </Flex>
                  <Text size="2" style={{ color: 'var(--gray-11)', fontVariantNumeric: 'tabular-nums', minWidth: 32 }}>
                    {Math.floor(voiceElapsedSeconds / 60)}:{(voiceElapsedSeconds % 60).toString().padStart(2, '0')}
                  </Text>
                </Flex>
                <Flex justify="between" align="center" gap="2">
                  <Tooltip content="Cancel">
                    <IconButton size="2" variant="soft" color="gray" aria-label="Cancel recording" onClick={() => stopVoiceRecording(false)} style={{ borderRadius: '50%' }} disabled={voiceTranscribing}>
                      <Close sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip content="Done — transcribe into message">
                    <IconButton
                      size="2"
                      variant="solid"
                      aria-label="Done recording"
                      onClick={() => {
                        if (mediaRecorderRef.current?.state === 'recording') {
                          voiceDoneClickedRef.current = true;
                          mediaRecorderRef.current.stop();
                        } else {
                          stopVoiceRecording(!!transcriptAccumulatorRef.current.trim());
                        }
                      }}
                      className="theme-panel-ai-send-button"
                      style={{ borderRadius: '50%' }}
                      disabled={voiceTranscribing}
                    >
                      <Check sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Flex>
                  </>
                )}
              </Flex>
            </Box>
          )}

          {/* Prompt send bar: Cursor-style — textarea full width, bottom bar with 3 subtle icons left + prominent Send right */}
          <Flex direction="column" gap="1" style={{ flexShrink: 0 }}>
            <Box
              onDragOver={(e) => { e.preventDefault(); setAiFileDropOver(true); }}
              onDragLeave={() => setAiFileDropOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setAiFileDropOver(false);
                const f = e.dataTransfer?.files?.[0];
                if (f) {
                  const isImage = f.type.startsWith('image/');
                  const isJson = f.name.toLowerCase().endsWith('.json') || f.type === 'application/json';
                  if (isImage || isJson) {
                    setAiAttachment((prev) => {
                      if (prev?.preview) URL.revokeObjectURL(prev.preview);
                      return { file: f, preview: isImage ? URL.createObjectURL(f) : null, name: f.name };
                    });
                  }
                }
              }}
              style={{
                border: aiFileDropOver ? '2px solid var(--accent-8)' : 'none',
                borderRadius: 16,
                padding: '10px 14px',
                background: aiFileDropOver ? 'var(--accent-a2)' : 'var(--gray-a2)',
              }}
              className="theme-panel-ai-chat-entry"
            >
              <Flex direction="column" gap="2">
                {aiAttachment && (
                  <Flex align="center" gap="2" style={{ padding: '8px 10px', background: 'var(--gray-a3)', borderRadius: 10, border: '1px solid var(--gray-a5)' }}>
                    {aiAttachment.preview ? (
                      <Box style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--gray-a5)' }}>
                        <img src={aiAttachment.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>
                    ) : (
                      <Box style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--gray-a5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title={aiAttachment.name}>
                        <Description sx={{ fontSize: 20, color: 'var(--gray-11)' }} aria-hidden />
                      </Box>
                    )}
                    <Text size="2" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{aiAttachment.name}</Text>
                    <Tooltip content="Remove attachment">
                      <IconButton size="1" variant="ghost" color="gray" aria-label="Remove attachment" onClick={clearAiAttachment} style={{ flexShrink: 0 }}>
                        <Close sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  </Flex>
                )}
                <Box style={{ minWidth: 0, flexShrink: 0 }}>
                  <TextArea
                    ref={aiPromptTextareaRef}
                    placeholder="Describe your theme, or attach an image or JSON file…"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !aiLoading) { e.preventDefault(); handleAiSend(); } }}
                    rows={2}
                    style={{
                      width: '100%',
                      minWidth: 0,
                      minHeight: 56,
                      resize: 'none',
                    }}
                    className="theme-panel-ai-textarea"
                  />
                </Box>
                <Flex align="center" justify="between" gap="2" wrap="nowrap">
                  <Flex align="center" gap="3" style={{ flexShrink: 0 }}>
                    <Tooltip content="Upload image (theme inspiration)">
                      <IconButton size="1" variant="ghost" color="gray" aria-label="Upload image" onClick={() => aiFileInputRef.current?.click()} style={{ borderRadius: '50%' }}>
                        <Image sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip content="Upload or drop file">
                      <IconButton size="1" variant="ghost" color="gray" aria-label="Upload file" onClick={() => aiFileInputRef.current?.click()} style={{ borderRadius: '50%' }}>
                        <AttachFile sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Flex>
                  <Flex align="center" gap="3" style={{ flexShrink: 0 }}>
                    <Tooltip content={aiVoiceListening ? 'Stop listening' : 'Voice input'}>
                      <IconButton
                        size="1"
                        variant={aiVoiceListening ? 'soft' : 'ghost'}
                        color="gray"
                        aria-label={aiVoiceListening ? 'Stop voice input' : 'Voice input'}
                        onClick={handleAiVoiceClick}
                        style={{ borderRadius: '50%', ...(aiVoiceListening ? { animation: 'theme-panel-voice-pulse 1.2s ease-in-out infinite' } : {}) }}
                      >
                        <Mic sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip content={aiLoading ? 'Generating…' : 'Send'}>
                      <IconButton
                        size="2"
                        variant="solid"
                        aria-label="Send"
                        onClick={() => handleAiSend()}
                        disabled={aiLoading}
                        className="theme-panel-ai-send-button"
                      >
                        <Send sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Flex>
                </Flex>
              </Flex>
              <input ref={aiFileInputRef} type="file" accept="image/*,.json,application/json" style={{ display: 'none' }} onChange={handleAiFileSelect} />
            </Box>
          </Flex>
        </Flex>
      </Tabs.Content>
      )}
      </Tabs.Root>

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
              <Description sx={{ fontSize: 16 }} style={{ marginRight: 6 }} />
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
            <Description sx={{ fontSize: 32, margin: '0 auto 8px', display: 'block', color: 'var(--gray-11)' }} />
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
                {importErrorAccordionOpen ? <KeyboardArrowUp sx={{ fontSize: 16 }} /> : <KeyboardArrowDown sx={{ fontSize: 16 }} />}
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
                          {toSentenceCase(c)}
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

      {/* Floating action bubbles at bottom of panel (shared for Manual and AI) */}
      <Flex
        gap="2"
        justify="center"
        align="center"
        className="theme-panel-bubbles"
        style={{
          flexShrink: 0,
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid var(--gray-a5)',
        }}
      >
        <Tooltip content="Import theme from JSON file">
          <IconButton
            variant="soft"
            size="2"
            className="theme-panel-bubble"
            onClick={handleImportClick}
            aria-label="Import theme"
          >
            <Description sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip content={copyStatus === 'copied' ? 'Copied!' : 'Copy theme JSON'}>
          <IconButton
            variant="soft"
            size="2"
            className="theme-panel-bubble"
            onClick={handleCopy}
            disabled={copyStatus === 'copying'}
            aria-label="Copy theme"
          >
            <ContentCopy sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip content="Undo">
          <IconButton
            variant="soft"
            size="2"
            className="theme-panel-bubble"
            onClick={handleUndo}
            disabled={!canUndo}
            aria-label="Undo"
          >
            <Undo sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip content="Redo">
          <IconButton
            variant="soft"
            size="2"
            className="theme-panel-bubble"
            onClick={handleRedo}
            disabled={!canRedo}
            aria-label="Redo"
          >
            <Redo sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip content="Reset to default theme and clear chat">
          <IconButton
            variant="soft"
            size="2"
            className="theme-panel-bubble"
            onClick={() => {
              handleAiReset();
              handleReset();
            }}
            aria-label="Reset theme"
          >
            <RestartAlt sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip content="Save current theme">
          <IconButton
            variant="soft"
            size="2"
            className="theme-panel-bubble"
            onClick={handleSaveThemeDoubleClick}
            aria-label="Save theme"
          >
            <Save sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Flex>
    </Box>
    {toastMessage && (
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10000,
          maxWidth: 'min(90vw, 360px)',
          padding: '12px 16px',
          background: 'var(--color-panel-solid)',
          border: '1px solid var(--gray-a6)',
          borderRadius: 12,
          boxShadow: '0 4px 20px var(--gray-a6)',
          fontSize: 14,
          color: 'var(--color-foreground)',
        }}
        onClick={() => setToastMessage(null)}
      >
        {toastMessage}
      </div>
    )}
    </>
  );
}
