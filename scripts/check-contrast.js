#!/usr/bin/env node
/**
 * WCAG 2.1 relative luminance and contrast ratio.
 * AA: normal text 4.5:1, large text/UI 3:1.
 */
function hexToLuminance(hex) {
  const [r, g, b] = hex.replace('#', '').match(/.{2}/g).map((x) => parseInt(x, 16) / 255);
  const f = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a, b) {
  const L1 = Math.max(hexToLuminance(a), hexToLuminance(b));
  const L2 = Math.min(hexToLuminance(a), hexToLuminance(b));
  return (L1 + 0.05) / (L2 + 0.05);
}
const pairs = [
  ['#211E1E', '#FFFFFF'],
  ['#211E1E', '#f5f5f4'],
  ['#44403c', '#FFFFFF'],
  ['#f1f0ea', '#211E1E'],
  ['#57534e', '#211E1E'],
  ['#f0f9ff', '#0f172a'],
  ['#e0e7ff', '#1e1b4b'],
  ['#fffbeb', '#1c1917'],
  ['#fce7ed', '#1a0a0f'],
];
console.log('Sample contrast ratios (AA: 4.5 text, 3 UI):');
pairs.forEach(([fg, bg]) => console.log(`  ${fg} on ${bg}: ${contrast(fg, bg).toFixed(2)}:1`));
