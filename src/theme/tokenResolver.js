/**
 * Resolves Wizeline-style design tokens: extracts $value and resolves {path} references.
 * Supports color (string), fontFamily (string), typography (object), and string tokens.
 */
import { getThemeTokenJson, mergeTokenSetWithDefault } from './tokens/themeTokens.js';

const REF_REGEX = /\{([^}]+)\}/g;

/**
 * Get value from nested object by path (e.g. "wizeline.tokens.color.palette.red.base").
 */
function getByPath(obj, path) {
  const parts = path.trim().split('.');
  let current = obj;
  for (const p of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[p];
  }
  return current;
}

/**
 * Recursively collect all $value leaves and path-to-value map (paths without $value).
 */
function collectValues(node, prefix = '', out = {}) {
  if (node == null) return out;
  if (typeof node.$value !== 'undefined') {
    out[prefix] = node.$value;
    return out;
  }
  if (Array.isArray(node)) {
    node.forEach((item, i) => collectValues(item, `${prefix}[${i}]`, out));
    return out;
  }
  if (typeof node === 'object') {
    for (const key of Object.keys(node)) {
      if (key.startsWith('$')) continue;
      collectValues(node[key], prefix ? `${prefix}.${key}` : key, out);
    }
  }
  return out;
}

/**
 * Resolve a single value: if string, replace {path} with resolved path value (string only for colors).
 */
function resolveValue(val, resolved, path) {
  if (val == null) return val;
  if (typeof val === 'number' || typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    return val.replace(REF_REGEX, (_, refPath) => {
      const r = resolved[refPath.trim()];
      if (r !== undefined && typeof r === 'string') return r;
      return getByPath(resolved, refPath.trim());
    });
  }
  if (Array.isArray(val)) {
    return val.map((item, i) => resolveValue(item, resolved, `${path}[${i}]`));
  }
  if (typeof val === 'object') {
    const out = {};
    for (const k of Object.keys(val)) {
      out[k] = resolveValue(val[k], resolved, `${path}.${k}`);
    }
    return out;
  }
  return val;
}

/**
 * Resolve references in token values. First pass: collect all primitive $values.
 * Second pass: resolve {ref} in strings; typography objects get fontFamily resolved.
 */
function resolveStringRefs(str, resolved) {
  return str.replace(REF_REGEX, (_, refPath) => {
    const key = refPath.trim();
    const r = resolved[key];
    if (r !== undefined && typeof r === 'string') return r;
    return str;
  });
}

function resolveReferences(rawByPath) {
  const resolved = JSON.parse(JSON.stringify(rawByPath));
  const maxPasses = 15;
  for (let pass = 0; pass < maxPasses; pass++) {
    let changed = false;
    for (const path of Object.keys(resolved)) {
      const val = resolved[path];
      if (typeof val === 'string' && REF_REGEX.test(val)) {
        const newVal = resolveStringRefs(val, resolved);
        if (newVal !== val) {
          resolved[path] = newVal;
          changed = true;
        }
      }
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        const next = {};
        for (const k of Object.keys(val)) {
          const v = val[k];
          if (typeof v === 'string' && REF_REGEX.test(v)) {
            next[k] = resolveStringRefs(v, resolved);
            if (next[k] !== v) changed = true;
          } else {
            next[k] = v;
          }
        }
        resolved[path] = next;
      }
    }
    if (!changed) break;
  }
  return resolved;
}

/**
 * Extract tokens from full theme JSON (with wizeline.tokens).
 * Returns flat map: path -> resolved value (e.g. "wizeline.tokens.color.semantic.fg.default" -> "#211E1E").
 */
export function resolveThemeTokens(themeJson) {
  const wizeline = themeJson?.wizeline;
  if (!wizeline) return {};
  const rawByPath = collectValues(wizeline, 'wizeline');
  return resolveReferences(rawByPath);
}

/**
 * Generate CSS custom properties from resolved tokens for :root.
 * - color.palette.* and color.semantic.* -> --wz-* (e.g. --wz-color-semantic-fg-default)
 * - fontFamily -> --wz-font-*
 * - typography.* -> --wz-typography-* (fontFamily, fontSize, lineHeight, letterSpacing, fontWeight)
 */
export function tokensToCssVariables(resolved) {
  const vars = {};
  const prefix = '--wz-';
  for (const path of Object.keys(resolved)) {
    const val = resolved[path];
    if (path.includes('.color.') && typeof val === 'string' && val.startsWith('#')) {
      const name = path.replace(/^wizeline\.tokens\./, '').replace(/\./g, '-');
      vars[prefix + name] = val;
    }
    if (path.includes('fontFamily.') && typeof val === 'string') {
      const name = path.replace(/^wizeline\.tokens\.fontFamily\./, 'font-').replace(/\./g, '-');
      vars[prefix + name] = `"${val.replace(/"/g, '\\"')}", sans-serif`;
    }
    if (path.includes('typography.') && val && typeof val === 'object' && (val.fontSize || val.fontFamily)) {
      const base = path.replace(/^wizeline\.tokens\.typography\./, '').replace(/\./g, '-');
      if (val.fontFamily) vars[prefix + 'typography-' + base + '-font-family'] = `"${String(val.fontFamily).replace(/"/g, '\\"')}", sans-serif`;
      if (val.fontSize) vars[prefix + 'typography-' + base + '-font-size'] = val.fontSize;
      if (val.lineHeight) vars[prefix + 'typography-' + base + '-line-height'] = val.lineHeight;
      if (val.letterSpacing) vars[prefix + 'typography-' + base + '-letter-spacing'] = val.letterSpacing;
      if (val.fontWeight) vars[prefix + 'typography-' + base + '-font-weight'] = String(val.fontWeight).toLowerCase() === 'bold' ? '700' : String(val.fontWeight).toLowerCase() === 'italic' ? 'italic' : val.fontWeight;
    }
  }
  return vars;
}

const THEME_ID_TO_RADIX = {
  default: { appearance: 'light', accentColor: 'red' },
  indigo: { appearance: 'light', accentColor: 'indigo' },
  sky: { appearance: 'dark', accentColor: 'sky' },
  amber: { appearance: 'light', accentColor: 'amber' },
  crimson: { appearance: 'dark', accentColor: 'crimson' },
  'indigo-light': { appearance: 'light', accentColor: 'indigo' },
  'sky-dark': { appearance: 'dark', accentColor: 'sky' },
  'amber-light': { appearance: 'light', accentColor: 'amber' },
  'crimson-dark': { appearance: 'dark', accentColor: 'crimson' },
};

/**
 * Map theme id and/or resolved tokens to Radix Theme props for <Theme>.
 */
export function inferRadixFromTokens(resolved, themeId) {
  const baseId = themeId && themeId.length > 0 ? (themeId.includes('-') ? themeId.split('-')[0] : themeId) : null;
  const fromId = baseId ? THEME_ID_TO_RADIX[baseId] ?? THEME_ID_TO_RADIX[themeId] : null;
  const appearance = fromId?.appearance ?? (resolved['wizeline.tokens.color.semantic.bg.canvas'] === resolved['wizeline.tokens.color.palette.contrast.white'] ? 'light' : 'dark');
  const accentColor = fromId?.accentColor ?? 'red';
  return {
    appearance,
    accentColor,
    grayColor: 'auto',
    radius: 'medium',
    scaling: '100%',
    panelBackground: 'translucent',
  };
}

/**
 * Return the theme's brand primary color (hex) for swatches. Uses resolved tokens so the dropdown shows the correct color per theme.
 */
export function getThemeAccentColor(theme, appearance = 'light') {
  let tokenJson;
  if (theme?.tokenSet) {
    tokenJson = mergeTokenSetWithDefault(theme.tokenSet);
  } else {
    const id = theme?.id ?? theme;
    tokenJson = getThemeTokenJson(id, appearance);
  }
  if (!tokenJson?.wizeline) return '#E93D44';
  const resolved = resolveThemeTokens(tokenJson);
  return resolved['wizeline.tokens.color.semantic.brand.primary'] || resolved['wizeline.tokens.color.palette.red.base'] || '#E93D44';
}
