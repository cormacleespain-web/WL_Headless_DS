/**
 * Theme token sets in Wizeline design-token format.
 * File naming: wizeline-light/dark, amber-light/dark, crimson-light/dark, indigo-light/dark, sky-light/dark.
 * Each theme has one entry in the dropdown; Mode (Light/Dark) selects which token file to load.
 */
import wizelineLight from './wizeline-light.json';
import wizelineDark from './wizeline-dark.json';
import amberLight from './amber-light.json';
import amberDark from './amber-dark.json';
import crimsonLight from './crimson-light.json';
import crimsonDark from './crimson-dark.json';
import indigoLight from './indigo-light.json';
import indigoDark from './indigo-dark.json';
import skyLight from './sky-light.json';
import skyDark from './sky-dark.json';

const THEME_MAP = {
  'default-light': wizelineLight,
  'default-dark': wizelineDark,
  'indigo-light': indigoLight,
  'indigo-dark': indigoDark,
  'sky-light': skyLight,
  'sky-dark': skyDark,
  'amber-light': amberLight,
  'amber-dark': amberDark,
  'crimson-light': crimsonLight,
  'crimson-dark': crimsonDark,
};

/** Default appearance per theme when no user preference is set. */
export const DEFAULT_APPEARANCE_PER_THEME = {
  default: 'light',
  indigo: 'light',
  sky: 'dark',
  amber: 'light',
  crimson: 'dark',
};

export function deepMerge(target, source) {
  const out = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && source[key].$value === undefined) {
      out[key] = deepMerge(out[key] || {}, source[key]);
    } else {
      out[key] = source[key];
    }
  }
  return out;
}

/** Merge a custom (e.g. AI-generated) token set with default so typography etc. are filled. */
export function mergeTokenSetWithDefault(custom) {
  const customTokens = custom?.wizeline?.tokens;
  if (!customTokens) return wizelineLight;
  return {
    wizeline: {
      tokens: deepMerge(JSON.parse(JSON.stringify(wizelineLight.wizeline.tokens)), customTokens),
    },
  };
}

/**
 * Return the full token JSON for a theme. themeId: default, indigo, sky, amber, crimson.
 * appearance: 'light' | 'dark'. Required when using built-in themes.
 */
export function getThemeTokenJson(themeId, appearance) {
  if (!themeId) return wizelineLight;
  const key = `${themeId}-${appearance === 'dark' ? 'dark' : 'light'}`;
  return THEME_MAP[key] ?? wizelineLight;
}

export { wizelineLight as defaultTokens };
