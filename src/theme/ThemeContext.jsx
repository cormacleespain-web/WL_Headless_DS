import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme } from '@radix-ui/themes';
import { getThemeTokenJson, mergeTokenSetWithDefault, DEFAULT_APPEARANCE_PER_THEME } from './tokens/themeTokens.js';
import { resolveThemeTokens, tokensToCssVariables, inferRadixFromTokens, getThemeAccentColor } from './tokenResolver.js';

/*
 * ThemeContext and ThemeProvider
 *
 * Centralises theme state using Wizeline design-token format (wizeline.tokens).
 * Built-in themes are token-driven; custom/AI themes can store full tokenSet JSON.
 * Resolved tokens are injected as CSS variables (--wz-*) and Radix <Theme> receives
 * inferred appearance/accent for component styling.
 */

const DEFAULT_THEMES = [
  { id: 'default', name: 'Wizeline' },
  { id: 'indigo', name: 'Indigo' },
  { id: 'sky', name: 'Sky' },
  { id: 'amber', name: 'Amber' },
  { id: 'crimson', name: 'Crimson' },
];

const STORAGE_KEY = 'radix-demo-theme';
const STORAGE_MY_THEMES = 'radix-demo-my-themes';
const STORAGE_APPEARANCE = 'radix-demo-appearance';

// Create the context with sensible defaults. Consumers will throw if used
// outside of ThemeProvider.
const ThemeContext = createContext({
  theme: DEFAULT_THEMES[0],
  myThemes: [],
  setTheme: () => {},
  setThemeConfig: () => {},
  addCustomTheme: () => {},
  defaultThemes: DEFAULT_THEMES,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(DEFAULT_THEMES[0]);
  const [myThemes, setMyThemes] = useState([]);
  const [userAppearance, setUserAppearanceState] = useState(null);

  // Load persisted theme, custom themes, and mode (Light/Dark) from localStorage on mount.
  useEffect(() => {
    try {
      const savedTheme = JSON.parse(localStorage.getItem(STORAGE_KEY));
      const savedMyThemes = JSON.parse(localStorage.getItem(STORAGE_MY_THEMES));
      const savedAppearance = localStorage.getItem(STORAGE_APPEARANCE);
      if (savedTheme && isValidTheme(savedTheme)) {
        setThemeState(normalizeTheme(savedTheme));
      }
      if (Array.isArray(savedMyThemes)) {
        setMyThemes(savedMyThemes.filter(isValidTheme).map(normalizeTheme));
      }
      if (savedAppearance === 'light' || savedAppearance === 'dark') {
        setUserAppearanceState(savedAppearance);
      }
    } catch (e) {
      console.warn('Failed to load theme from localStorage', e);
    }
  }, []);

  // Persist theme and custom themes whenever they change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    } catch (e) {
      console.warn('Failed to persist theme to localStorage', e);
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MY_THEMES, JSON.stringify(myThemes));
    } catch (e) {
      console.warn('Failed to persist custom themes to localStorage', e);
    }
  }, [myThemes]);

  useEffect(() => {
    if (userAppearance) {
      try {
        localStorage.setItem(STORAGE_APPEARANCE, userAppearance);
      } catch (e) {
        console.warn('Failed to persist appearance to localStorage', e);
      }
    }
  }, [userAppearance]);

  const setTheme = (newTheme) => {
    if (isValidTheme(newTheme)) {
      setThemeState(newTheme);
    }
  };

  const setThemeConfig = (partial) => {
    if (partial.appearance !== undefined) {
      setUserAppearanceState(partial.appearance);
    }
    setThemeState((prev) => {
      const nextConfig = mergeWithDefaults({ ...(prev.config || {}), ...partial });
      if (!isValidThemeConfig(nextConfig)) return prev;
      return { ...prev, config: nextConfig };
    });
  };

  const addCustomTheme = (themeObj) => {
    if (isValidTheme(themeObj)) {
      const id = themeObj.id || `${Date.now()}-${themeObj.name}`;
      const themeToAdd = { ...themeObj, id };
      setMyThemes((prev) => [...prev, themeToAdd]);
      setThemeState(themeToAdd);
    }
  };

  // Effective mode: user's Light/Dark choice (persisted) so switching theme keeps the same mode.
  const effectiveAppearance = userAppearance ?? theme?.config?.appearance ?? (theme?.id && DEFAULT_APPEARANCE_PER_THEME[theme.id]) ?? 'light';
  const tokenJson = theme?.tokenSet ? mergeTokenSetWithDefault(theme.tokenSet) : getThemeTokenJson(theme?.id, effectiveAppearance);
  const resolvedTokens = tokenJson?.wizeline ? resolveThemeTokens(tokenJson) : {};
  const radixFromTokens = Object.keys(resolvedTokens).length > 0 ? inferRadixFromTokens(resolvedTokens, theme?.id) : null;
  const merged = theme?.config ? mergeWithDefaults(theme.config) : mergeWithDefaults(radixFromTokens || {});
  const { fontFamily, fontWeight = 400, fontStyle = 'normal', ...baseRadixConfig } = merged;
  const radixConfig = { ...baseRadixConfig, appearance: effectiveAppearance };

  // Inject Wizeline token CSS variables — recompute from current theme + Mode (appearance)
  useEffect(() => {
    const tokenSet = theme?.tokenSet ? mergeTokenSetWithDefault(theme.tokenSet) : getThemeTokenJson(theme?.id, effectiveAppearance);
    const resolved = tokenSet?.wizeline ? resolveThemeTokens(tokenSet) : {};
    const vars = tokensToCssVariables(resolved);
    const id = 'radix-demo-wizeline-tokens';
    let styleEl = document.getElementById(id);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = id;
      document.head.appendChild(styleEl);
    }
    const decl = Object.entries(vars).map(([k, v]) => `${k}: ${v};`).join('\n');
    styleEl.textContent = decl ? `:root {\n  ${decl}\n}` : '';
    return () => { styleEl.textContent = ''; };
  }, [theme?.id, theme?.tokenSet, effectiveAppearance]);

  // Load Google Fonts from token set (Space Mono, Nunito Sans) or from config
  const bodyFont = resolvedTokens['wizeline.tokens.fontFamily.nunitoSans'] || fontFamily;
  const headingFont = resolvedTokens['wizeline.tokens.fontFamily.spaceMono'] || fontFamily;
  useEffect(() => {
    const families = [bodyFont, headingFont].filter(Boolean);
    if (families.length === 0) return;
    const id = 'radix-demo-google-font';
    let link = document.getElementById(id);
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    const query = [...new Set(families)].map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,700`).join('&');
    link.href = `https://fonts.googleapis.com/css2?${query}&display=swap`;
    return () => { link.href = ''; };
  }, [bodyFont, headingFont]);

  // Typography overrides for .radix-themes
  useEffect(() => {
    const id = 'radix-demo-typography-overrides';
    let styleEl = document.getElementById(id);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = id;
      document.head.appendChild(styleEl);
    }
    const w = Number(fontWeight) || 400;
    const s = fontStyle || 'normal';
    const family = bodyFont || fontFamily;
    const heading = headingFont || fontFamily;
    const familyDecl = family ? `--default-font-family: '${String(family).replace(/'/g, "\\'")}', sans-serif;` : '';
    const headingDecl = heading ? `--heading-font-family: '${String(heading).replace(/'/g, "\\'")}', sans-serif;` : '';
    styleEl.textContent = `.radix-themes { ${familyDecl} ${headingDecl} --default-font-weight: ${w}; --heading-font-weight: ${w}; --default-font-style: ${s}; --heading-font-style: ${s}; }`;
    return () => { styleEl.textContent = ''; };
  }, [bodyFont, headingFont, fontFamily, fontWeight, fontStyle]);

  // Use effectiveAppearance so Mode toggle matches the appearance we actually apply (fixes Sky showing light while toggle showed dark).
  const effectiveConfig = { ...(theme?.config ? mergeWithDefaults(theme.config) : mergeWithDefaults(radixFromTokens || {})), appearance: effectiveAppearance };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        myThemes,
        setTheme,
        setThemeConfig,
        addCustomTheme,
        defaultThemes: DEFAULT_THEMES,
        resolvedTokens,
        effectiveConfig,
        getThemeTokenJson,
        getThemeAccentColor,
      }}
    >
      <Theme {...radixConfig}>{children}</Theme>
    </ThemeContext.Provider>
  );
};

// Validate theme configuration according to Radix API. Only allow strings from
// enumerations described in Radix documentation【229135955971718†L56-L123】. This
// prevents malicious values from being applied via user input.
const VALID_APPEARANCE = ['light', 'dark', 'inherit'];
const VALID_ACCENT = [
  'gray', 'gold', 'bronze', 'brown', 'yellow', 'amber', 'orange', 'tomato',
  'red', 'ruby', 'crimson', 'pink', 'plum', 'purple', 'violet', 'iris',
  'indigo', 'blue', 'cyan', 'teal', 'jade', 'green', 'grass', 'lime', 'mint', 'sky',
];
const VALID_GRAY = ['auto', 'gray', 'mauve', 'slate', 'sage', 'olive', 'sand'];
const VALID_RADIUS = ['none', 'small', 'medium', 'large', 'full'];
const VALID_SCALING = ['90%', '95%', '100%', '105%', '110%'];
const VALID_PANEL_BACKGROUND = ['solid', 'translucent'];
const VALID_FONT_WEIGHTS = [300, 400, 500, 600, 700];
const VALID_FONT_STYLES = ['normal', 'italic'];

// Google Fonts the AI can suggest (must exist on fonts.google.com). Used for theme.config.fontFamily.
export const ALLOWED_GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Source Sans 3', 'Montserrat', 'Nunito',
  'Playfair Display', 'Merriweather', 'PT Serif', 'Lora', 'Libre Baskerville', 'Crimson Text',
  'Space Grotesk', 'DM Sans', 'Work Sans', 'Manrope', 'Plus Jakarta Sans', 'Outfit',
  'Fira Sans', 'Oswald', 'Raleway', 'Ubuntu', 'Quicksand', 'Karla', 'Rubik', 'Barlow',
];

export const FONT_WEIGHT_OPTIONS = [
  { value: 300, label: 'Light' },
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semi Bold' },
  { value: 700, label: 'Bold' },
];

export const FONT_STYLE_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'italic', label: 'Italic' },
];

const DEFAULT_CONFIG = {
  appearance: 'light',
  accentColor: 'red',
  grayColor: 'auto',
  radius: 'medium',
  scaling: '100%',
  panelBackground: 'translucent',
  fontFamily: undefined,
  fontWeight: 400,
  fontStyle: 'normal',
};

const BUILT_IN_IDS = ['default', 'indigo', 'sky', 'amber', 'crimson'];
const LEGACY_THEME_IDS = ['indigo-light', 'sky-dark', 'amber-light', 'crimson-dark'];
const LEGACY_TO_BASE = { 'indigo-light': 'indigo', 'sky-dark': 'sky', 'amber-light': 'amber', 'crimson-dark': 'crimson' };

function normalizeTheme(theme) {
  if (!theme?.id) return theme;
  const baseId = LEGACY_TO_BASE[theme.id] ?? theme.id;
  const defaultTheme = DEFAULT_THEMES.find((t) => t.id === baseId);
  return { ...theme, id: baseId, name: theme.name || defaultTheme?.name || theme.id };
}

function isValidTheme(theme) {
  if (!theme || !theme.id || !theme.name) return false;
  if (BUILT_IN_IDS.includes(theme.id) || LEGACY_THEME_IDS.includes(theme.id)) return true;
  if (theme.tokenSet?.wizeline?.tokens) return true;
  if (theme.config) return isValidThemeConfig(theme.config);
  return false;
}

function isValidThemeConfig(config) {
  if (!config || !VALID_APPEARANCE.includes(config.appearance) || !VALID_ACCENT.includes(config.accentColor)) {
    return false;
  }
  if (config.grayColor != null && !VALID_GRAY.includes(config.grayColor)) return false;
  if (config.radius != null && !VALID_RADIUS.includes(config.radius)) return false;
  if (config.scaling != null && !VALID_SCALING.includes(config.scaling)) return false;
  if (config.panelBackground != null && !VALID_PANEL_BACKGROUND.includes(config.panelBackground)) return false;
  if (config.fontFamily != null && config.fontFamily !== '' && !ALLOWED_GOOGLE_FONTS.includes(config.fontFamily)) return false;
  if (config.fontWeight != null && !VALID_FONT_WEIGHTS.includes(Number(config.fontWeight))) return false;
  if (config.fontStyle != null && !VALID_FONT_STYLES.includes(config.fontStyle)) return false;
  return true;
}

function mergeWithDefaults(config) {
  return { ...DEFAULT_CONFIG, ...config };
}