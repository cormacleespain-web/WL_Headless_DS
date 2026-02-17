import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme } from '@radix-ui/themes';

/*
 * ThemeContext and ThemeProvider
 *
 * This context centralises theme state for the application. It holds both
 * predefined themes and user‑generated themes (via the AI theme generator).
 * The state persists through localStorage so that a visitor's selection
 * survives page reloads. All properties passed to the Radix <Theme> component
 * are strongly typed and validated before use, avoiding injection of
 * arbitrary values. See Radix documentation for available props: appearance,
 * accentColor, grayColor, panelBackground, radius and scaling【229135955971718†L52-L124】.
 */

const DEFAULT_THEMES = [
  {
    id: 'default',
    name: 'Default',
    config: {
      appearance: 'light',
      accentColor: 'red',
      grayColor: 'auto',
      radius: 'medium',
      scaling: '100%',
      panelBackground: 'translucent',
    },
  },
  {
    id: 'indigo-light',
    name: 'Indigo Light',
    config: {
      appearance: 'light',
      accentColor: 'indigo',
      grayColor: 'auto',
      radius: 'medium',
      scaling: '100%',
      panelBackground: 'translucent',
    },
  },
  {
    id: 'sky-dark',
    name: 'Sky Dark',
    config: {
      appearance: 'dark',
      accentColor: 'sky',
      grayColor: 'auto',
      radius: 'medium',
      scaling: '100%',
      panelBackground: 'translucent',
    },
  },
  {
    id: 'amber-light',
    name: 'Amber Light',
    config: {
      appearance: 'light',
      accentColor: 'amber',
      grayColor: 'auto',
      radius: 'medium',
      scaling: '100%',
      panelBackground: 'translucent',
    },
  },
  {
    id: 'crimson-dark',
    name: 'Crimson Dark',
    config: {
      appearance: 'dark',
      accentColor: 'crimson',
      grayColor: 'auto',
      radius: 'medium',
      scaling: '100%',
      panelBackground: 'translucent',
    },
  },
];

const STORAGE_KEY = 'radix-demo-theme';
const STORAGE_MY_THEMES = 'radix-demo-my-themes';

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

  // Load persisted theme and custom themes from localStorage on mount.
  useEffect(() => {
    try {
      const savedTheme = JSON.parse(localStorage.getItem(STORAGE_KEY));
      const savedMyThemes = JSON.parse(localStorage.getItem(STORAGE_MY_THEMES));
      if (savedTheme && isValidThemeConfig(savedTheme.config)) {
        setThemeState(savedTheme);
      }
      if (Array.isArray(savedMyThemes)) {
        setMyThemes(savedMyThemes.filter((t) => isValidThemeConfig(t.config)));
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

  const setTheme = (newTheme) => {
    if (isValidThemeConfig(newTheme.config)) {
      setThemeState(newTheme);
    }
  };

  const setThemeConfig = (partial) => {
    setThemeState((prev) => {
      const nextConfig = mergeWithDefaults({ ...prev.config, ...partial });
      if (!isValidThemeConfig(nextConfig)) return prev;
      return { ...prev, config: nextConfig };
    });
  };

  const addCustomTheme = (themeObj) => {
    if (isValidThemeConfig(themeObj.config)) {
      // Ensure ID uniqueness by prefixing a timestamp.
      const id = `${Date.now()}-${themeObj.name}`;
      const themeToAdd = { ...themeObj, id };
      setMyThemes((prev) => [...prev, themeToAdd]);
      setThemeState(themeToAdd);
    }
  };

  const merged = mergeWithDefaults(theme.config);
  const { fontFamily, fontWeight = 400, fontStyle = 'normal', ...radixConfig } = merged;

  // Load Google Font with weight/italic variants when theme requests it
  useEffect(() => {
    if (!fontFamily) return;
    const id = 'radix-demo-google-font';
    let link = document.getElementById(id);
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    // Request common variants so user can switch weight/style: normal 300,400,500,600,700 + italic 400,700
    const familyParam = encodeURIComponent(fontFamily).replace(/%20/g, '+');
    link.href = `https://fonts.googleapis.com/css2?family=${familyParam}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,700&display=swap`;
    return () => { link.href = ''; };
  }, [fontFamily]);

  // Inject overrides so they apply to .radix-themes (Radix sets typography vars on that class)
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
    const familyDecl = fontFamily
      ? `--default-font-family: '${fontFamily.replace(/'/g, "\\'")}', sans-serif; --heading-font-family: '${fontFamily.replace(/'/g, "\\'")}', sans-serif;`
      : '';
    styleEl.textContent = `.radix-themes { ${familyDecl} --default-font-weight: ${w}; --heading-font-weight: ${w}; --default-font-style: ${s}; --heading-font-style: ${s}; }`;
    return () => { styleEl.textContent = ''; };
  }, [fontFamily, fontWeight, fontStyle]);

  return (
    <ThemeContext.Provider
      value={{ theme, myThemes, setTheme, setThemeConfig, addCustomTheme, defaultThemes: DEFAULT_THEMES }}
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